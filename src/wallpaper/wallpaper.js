import { createFrameStore } from './frames.js';
import { createInput } from './input.js';

const STYLE = `
  :host { display:block; position:absolute; inset:0; overflow:hidden; pointer-events:none; }
  canvas { display:block; width:100%; height:100%; }
`;

/**
 * <reactive-wallpaper src="/wallpaper/manifest.json"
 *                     ease="0.1" parallax="24" drift="true" idle-delay="3"
 *                     focus-x="0.5" focus-y="0.5" tilt="auto" tilt-range="20">
 *
 * focus-x/y: where the cover-fit crop anchors (0..1) when the frame's aspect
 *            doesn't match the element's, e.g. a 16:9 frame on a phone.
 * safe-top:  CSS px of chrome overlapping the top (a menu bar). The frame is
 *            fitted to the area below it with its top edge pinned there, so
 *            nothing at the top of the frame is hidden; the strip behind the
 *            chrome is filled by stretching the frame's top row, and the
 *            vertical pointer shift is disabled (focus-y is ignored).
 * tilt:      "auto" (default) arms device-orientation input on touch devices
 *            at the first tap; "off" leaves it to touch/mouse only.
 *
 * Events: ready (first frame drawn), loaded (all frames fetched), error.
 * Sets --wp-x / --wp-y (smoothed, -1..1) on itself and on its parent element,
 * so sibling layers can parallax the other way.
 */
export class ReactiveWallpaper extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'ease', 'parallax', 'drift', 'idle-delay', 'focus-x', 'focus-y', 'safe-top', 'tilt', 'tilt-range'];
  }

  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = STYLE;
    this._canvas = document.createElement('canvas');
    root.append(style, this._canvas);
    this._ctx = this._canvas.getContext('2d', { alpha: false });
    this._store = null;
    this._input = null;
    this._raf = 0;
    this._lastTime = 0;
    this._lastFrame = null;
    this._lastDraw = { p: NaN, y: NaN };
    this._dirty = true;
    this._ready = false;
    this._loadedFired = false;
    this._parallax = 24;
    this._focus = { x: 0.5, y: 0.5 };
    this._safeTop = 0;
    this._dpr = 1;
    this._onVisibility = () => (document.hidden ? this._stopLoop() : this._startLoop());
    this._ro = null;
    // Device tilt needs a user gesture on iOS, so it is requested on the
    // first tap/click after connect (coarse-pointer devices only).
    this._onFirstGesture = () => { this._disarmTilt(); this.requestTilt(); };
    this._tiltArmed = false;
  }

  // ---- lifecycle -----------------------------------------------------------
  connectedCallback() {
    this._input = createInput({
      ease: this._num('ease', 0.1),
      drift: this._bool('drift', true),
      idleDelay: this._num('idle-delay', 3),
    });
    this._parallax = this._num('parallax', 24);
    this._focus = { x: this._num('focus-x', 0.5), y: this._num('focus-y', 0.5) };
    this._safeTop = Math.max(0, this._num('safe-top', 0));
    this._input.setOptions({ tiltRange: this._num('tilt-range', 20) });
    this._armTilt();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this);
    this._resize();
    document.addEventListener('visibilitychange', this._onVisibility);
    if (this.hasAttribute('src')) this._load(this.getAttribute('src'));
    this._startLoop();
  }

  disconnectedCallback() {
    this._disarmTilt();
    this._stopLoop();
    document.removeEventListener('visibilitychange', this._onVisibility);
    this._ro?.disconnect(); this._ro = null;
    this._input?.destroy(); this._input = null;
    this._store?.destroy(); this._store = null;
  }

  attributeChangedCallback(name, _old, value) {
    if (!this.isConnected) return;
    switch (name) {
      case 'src': this._load(value); break;
      case 'ease': this._input?.setOptions({ ease: this._num('ease', 0.1) }); break;
      case 'drift': this._input?.setOptions({ drift: this._bool('drift', true) }); break;
      case 'idle-delay': this._input?.setOptions({ idleDelay: this._num('idle-delay', 3) }); break;
      case 'parallax': this._parallax = this._num('parallax', 24); this._dirty = true; break;
      case 'focus-x': this._focus.x = this._num('focus-x', 0.5); this._dirty = true; break;
      case 'focus-y': this._focus.y = this._num('focus-y', 0.5); this._dirty = true; break;
      case 'safe-top': this._safeTop = Math.max(0, this._num('safe-top', 0)); this._dirty = true; break;
      case 'tilt-range': this._input?.setOptions({ tiltRange: this._num('tilt-range', 20) }); break;
      case 'tilt': this._disarmTilt(); this._armTilt(); break;
    }
  }

  /**
   * Ask for device-orientation access and start tilting the wallpaper with
   * the phone. Call from a tap handler on iOS. Resolves true when active.
   */
  requestTilt() { return this._input ? this._input.requestTilt() : Promise.resolve(false); }

  /** Treat the phone's current attitude as the neutral (centre) position. */
  recenterTilt() { this._input?.recenter(); }

  // ---- public read-only state ---------------------------------------------
  get frameCount() { return this._store?.count ?? 0; }
  get loadedCount() { return this._store?.loadedCount ?? 0; }
  get currentFrame() { return this._store ? this._store.frameIndex(this._lastDraw.p) : -1; }
  get position() { return { x: this._lastDraw.p * 2 - 1, y: this._lastDraw.y }; }
  get memoryMode() { return this._store?.mode ?? null; }
  /** True while device-orientation readings are driving the wallpaper. */
  get tilting() { return this._input?.tilting ?? false; }

  // ---- internals -----------------------------------------------------------
  _num(attr, dflt) {
    const v = parseFloat(this.getAttribute(attr));
    return Number.isFinite(v) ? v : dflt;
  }
  _bool(attr, dflt) {
    const v = this.getAttribute(attr);
    if (v === null) return dflt;
    return !(v === 'false' || v === '0' || v === 'off');
  }

  _armTilt() {
    if (this._tiltArmed || this.getAttribute('tilt') === 'off') return;
    const coarse = globalThis.matchMedia?.('(pointer: coarse)')?.matches;
    if (!coarse || !globalThis.DeviceOrientationEvent) return;
    this._tiltArmed = true;
    window.addEventListener('touchend', this._onFirstGesture, { once: true, passive: true });
    window.addEventListener('click', this._onFirstGesture, { once: true });
  }
  _disarmTilt() {
    if (!this._tiltArmed) return;
    this._tiltArmed = false;
    window.removeEventListener('touchend', this._onFirstGesture);
    window.removeEventListener('click', this._onFirstGesture);
  }

  _load(src) {
    this._store?.destroy();
    this._ready = false; this._loadedFired = false; this._lastFrame = null;
    if (!src) { this._store = null; return; }
    const store = createFrameStore(src);
    this._store = store;
    store.on('frame', () => { this._dirty = true; });
    store.on('complete', (n) => {
      if (this._store === store && !this._loadedFired) {
        this._loadedFired = true;
        this.dispatchEvent(new CustomEvent('loaded', { bubbles: true, detail: { loaded: n, total: store.count } }));
      }
    });
    store.load().catch((err) => {
      if (this._store !== store) return;
      this.dispatchEvent(new CustomEvent('error', { bubbles: true, detail: { message: String(err?.message || err) } }));
    });
  }

  _resize() {
    const rect = this.getBoundingClientRect();
    this._dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(rect.width * this._dpr));
    const h = Math.max(1, Math.round(rect.height * this._dpr));
    if (this._canvas.width !== w || this._canvas.height !== h) {
      this._canvas.width = w; this._canvas.height = h;
    }
    this._dirty = true;
  }

  _startLoop() {
    if (this._raf || !this.isConnected) return;
    this._lastTime = performance.now();
    const step = (t) => {
      this._raf = requestAnimationFrame(step);
      this._tick(t);
    };
    this._raf = requestAnimationFrame(step);
  }
  _stopLoop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  _tick(t) {
    const dt = t - this._lastTime; this._lastTime = t;
    const { p, y, changed } = this._input.tick(dt);
    const frame = this._store?.nearest(p) ?? null;
    if (!changed && !this._dirty && frame === this._lastFrame) return;
    this._dirty = false;
    this._lastDraw = { p, y };
    this._setVars(p * 2 - 1, y);
    if (!frame) return;
    this._draw(frame, p * 2 - 1, y);
    this._lastFrame = frame;
    if (!this._ready) {
      this._ready = true;
      this.dispatchEvent(new CustomEvent('ready', { bubbles: true }));
    }
  }

  _setVars(x, y) {
    const xs = x.toFixed(4), ys = y.toFixed(4);
    this.style.setProperty('--wp-x', xs); this.style.setProperty('--wp-y', ys);
    const parent = this.parentElement;
    if (parent) { parent.style.setProperty('--wp-x', xs); parent.style.setProperty('--wp-y', ys); }
  }

  _draw(frame, x, y) {
    const ctx = this._ctx, cw = this._canvas.width, ch = this._canvas.height;
    const fw = frame.width, fh = frame.height;
    if (!fw || !fh) return;
    // cover-fit the area below any top chrome (safe-top)
    const st = Math.min(ch - 1, this._safeTop * this._dpr);
    const ah = ch - st;
    const cover = Math.max(cw / fw, ah / fh);
    // oversize so the parallax shift never exposes an edge
    const par = this._parallax * this._dpr;
    const over = 1 + (2 * par) / Math.min(cw, ah);
    const s = cover * over;
    const dw = fw * s, dh = fh * s;
    // Anchor the crop at the focus point; the `par` margin on each side is
    // what the pointer shift moves through, so no edge is ever exposed.
    const dx = (cw - dw + 2 * par) * this._focus.x - par - x * par;
    // With safe-top the frame's top edge is pinned just below the chrome and
    // does not shift vertically, so the top of the picture is never hidden.
    const dy = st > 0 ? st : (ch - dh + 2 * par) * this._focus.y - par - y * par;
    ctx.drawImage(frame, dx, dy, dw, dh);
    // Fill the strip behind the chrome by stretching the frame's top row.
    if (dy > 0) ctx.drawImage(frame, 0, 1, fw, 1, dx, 0, dw, dy + 1);
  }
}

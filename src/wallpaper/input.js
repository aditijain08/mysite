/**
 * Pointer / touch / device-tilt input with easing and idle drift.
 *
 * tick(dtMs) advances the eased state and returns { p, y, changed }:
 *   p in [0, 1]  horizontal position (0.5 = centre)
 *   y in [-1, 1] vertical tilt
 *
 * Sources, in priority order:
 *   1. device orientation (after requestTilt() succeeds) — while readings are
 *      arriving, touch input is ignored so the two never fight;
 *   2. touch drag;
 *   3. mouse movement.
 */

const DRIFT_P_AMP = 0.35, DRIFT_P_PERIOD = 24000;
const DRIFT_Y_AMP = 0.15, DRIFT_Y_PERIOD = 17000;
const EPS = 1e-4;
const TILT_DEAD_DEG = 0.4;      // smaller changes don't count as "movement"
const TILT_STALE_MS = 1000;     // no reading for this long -> touch takes over

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const clamp11 = (v) => Math.min(1, Math.max(-1, v));

export function createInput(options = {}) {
  const {
    target = globalThis.window,
    now = () => globalThis.performance.now(),
    viewport = () => ({ w: globalThis.innerWidth, h: globalThis.innerHeight }),
    screenAngle = () => globalThis.screen?.orientation?.angle ?? 0,
  } = options;

  let ease = options.ease ?? 0.1;
  let drift = options.drift ?? true;
  let idleDelay = options.idleDelay ?? 3;
  let tiltRange = options.tiltRange ?? 20;   // degrees of roll for full travel
  let tiltRangeY = options.tiltRangeY ?? 15; // degrees of pitch for full travel

  let pTarget = 0.5, yTarget = 0;
  let p = 0.5, y = 0;
  let lastMove = now();
  let drifting = false, driftT0 = 0, phaseP = 0, phaseY = 0;
  let lastTick = now();

  // tilt state
  let tiltEnabled = false;
  let tiltBase = null;          // { roll, pitch } captured on the first reading
  let tiltLast = null;          // last { roll, pitch }
  let tiltAt = -Infinity;       // timestamp of the last reading

  const tiltActive = () => tiltEnabled && now() - tiltAt < TILT_STALE_MS;

  function setTarget(np, ny) {
    pTarget = clamp01(np); yTarget = clamp11(ny);
    lastMove = now();
    drifting = false;
  }

  function setPointer(clientX, clientY) {
    const { w, h } = viewport();
    setTarget(w > 0 ? clientX / w : 0.5, h > 0 ? clamp01(clientY / h) * 2 - 1 : 0);
  }

  const onMouse = (e) => { if (!tiltActive()) setPointer(e.clientX, e.clientY); };
  const onTouch = (e) => {
    if (tiltActive()) return;
    const t = e.touches && e.touches[0];
    if (t) setPointer(t.clientX, t.clientY);
  };

  /** Map a DeviceOrientationEvent to { roll, pitch } in the screen's frame. */
  function readOrientation(e) {
    if (e.gamma == null || e.beta == null) return null;
    const angle = screenAngle();
    // gamma: left/right roll in portrait; beta: front/back pitch.
    if (angle === 90) return { roll: e.beta, pitch: -e.gamma };
    if (angle === -90 || angle === 270) return { roll: -e.beta, pitch: e.gamma };
    return { roll: e.gamma, pitch: e.beta };
  }

  const onOrientation = (e) => {
    const o = readOrientation(e);
    if (!o) return;
    tiltAt = now();
    if (!tiltBase) tiltBase = { ...o };
    const moved = !tiltLast ||
      Math.abs(o.roll - tiltLast.roll) > TILT_DEAD_DEG ||
      Math.abs(o.pitch - tiltLast.pitch) > TILT_DEAD_DEG;
    tiltLast = o;
    const np = 0.5 + (o.roll - tiltBase.roll) / (2 * tiltRange);
    const ny = (o.pitch - tiltBase.pitch) / tiltRangeY;
    if (moved) setTarget(np, ny);
    else { pTarget = clamp01(np); yTarget = clamp11(ny); }
  };

  target?.addEventListener?.('mousemove', onMouse, { passive: true });
  target?.addEventListener?.('touchstart', onTouch, { passive: true });
  target?.addEventListener?.('touchmove', onTouch, { passive: true });

  function enableTilt() {
    if (tiltEnabled) return;
    tiltEnabled = true;
    target?.addEventListener?.('deviceorientation', onOrientation, { passive: true });
  }

  /**
   * Ask for device-orientation access. On iOS this must be called from a user
   * gesture; elsewhere it resolves immediately. Resolves true when listening.
   */
  async function requestTilt() {
    const DOE = globalThis.DeviceOrientationEvent;
    if (!DOE) return false;
    if (typeof DOE.requestPermission === 'function') {
      try {
        if ((await DOE.requestPermission()) !== 'granted') return false;
      } catch { return false; }
    }
    enableTilt();
    return true;
  }

  /** Treat the current device attitude as neutral. */
  function recenter() { tiltBase = tiltLast ? { ...tiltLast } : null; }

  function startDrift(t) {
    drifting = true;
    driftT0 = t;
    // Start the sine where the target currently is, so there is no jump.
    phaseP = Math.asin(Math.max(-1, Math.min(1, (pTarget - 0.5) / DRIFT_P_AMP)));
    phaseY = Math.asin(Math.max(-1, Math.min(1, yTarget / DRIFT_Y_AMP)));
  }

  function tick(dtMs) {
    const t = now();
    const dt = dtMs ?? (t - lastTick);
    lastTick = t;

    if (drift && !drifting && t - lastMove >= idleDelay * 1000) startDrift(t);
    if (drifting) {
      const e = t - driftT0;
      pTarget = 0.5 + DRIFT_P_AMP * Math.sin(phaseP + (e * 2 * Math.PI) / DRIFT_P_PERIOD);
      yTarget = DRIFT_Y_AMP * Math.sin(phaseY + (e * 2 * Math.PI) / DRIFT_Y_PERIOD);
    }

    // Frame-rate compensated exponential lerp (ease is "per 60 fps frame").
    const k = 1 - Math.pow(1 - ease, Math.max(0, dt) / (1000 / 60));
    const dp = (pTarget - p) * k, dy = (yTarget - y) * k;
    const changed = Math.abs(pTarget - p) > EPS || Math.abs(yTarget - y) > EPS;
    if (changed) {
      p += dp; y += dy;
      if (Math.abs(pTarget - p) <= EPS) p = pTarget;
      if (Math.abs(yTarget - y) <= EPS) y = yTarget;
    }
    return { p, y, changed };
  }

  function setOptions(o = {}) {
    if (o.ease !== undefined) ease = Math.min(1, Math.max(0.001, Number(o.ease)));
    if (o.drift !== undefined) { drift = !!o.drift; if (!drift) drifting = false; }
    if (o.idleDelay !== undefined) idleDelay = Math.max(0, Number(o.idleDelay));
    if (o.tiltRange !== undefined) tiltRange = Math.max(1, Number(o.tiltRange));
    if (o.tiltRangeY !== undefined) tiltRangeY = Math.max(1, Number(o.tiltRangeY));
  }

  function destroy() {
    target?.removeEventListener?.('mousemove', onMouse);
    target?.removeEventListener?.('touchstart', onTouch);
    target?.removeEventListener?.('touchmove', onTouch);
    target?.removeEventListener?.('deviceorientation', onOrientation);
    tiltEnabled = false;
  }

  return {
    tick, setPointer, setOptions, destroy, requestTilt, enableTilt, recenter,
    get drifting() { return drifting; },
    get tilting() { return tiltActive(); },
    get target() { return { p: pTarget, y: yTarget }; },
  };
}

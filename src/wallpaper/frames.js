/**
 * Frame store: loads a manifest + frame sequence progressively and answers
 * "nearest loaded frame for position p".
 *
 * Load order is middle-first, then a spread (quarter points, eighths, ...),
 * so coarse scrubbing works across the whole range early.
 *
 * Two memory modes:
 *  - full: every frame is decoded once with createImageBitmap and kept.
 *  - lru:  WebP blobs are kept; an LRU of decoded bitmaps is maintained
 *          around the current position (for devices with <= 4 GB memory).
 */

/** Middle first, then bisection levels, deduped. Always covers 0..count-1. */
export function loadOrder(count) {
  if (count <= 0) return [];
  const seen = new Set();
  const out = [];
  const push = (i) => {
    if (!seen.has(i)) { seen.add(i); out.push(i); }
  };
  const last = count - 1;
  push(Math.floor(last / 2));
  for (let div = 2; out.length < count && div <= count * 2; div *= 2) {
    for (let k = 0; k <= div; k++) push(Math.round((k * last) / div));
  }
  for (let i = 0; i < count; i++) push(i);
  return out;
}

/** Insert into a sorted number array, keeping it sorted. */
function sortedInsert(arr, v) {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < v) lo = mid + 1; else hi = mid;
  }
  arr.splice(lo, 0, v);
}

/** Nearest value in a sorted array to target, or -1 if empty. */
export function nearestIn(sorted, target) {
  const n = sorted.length;
  if (n === 0) return -1;
  let lo = 0, hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (sorted[mid] < target) lo = mid + 1; else hi = mid;
  }
  const a = sorted[lo];
  const b = lo > 0 ? sorted[lo - 1] : a;
  return Math.abs(b - target) <= Math.abs(a - target) ? b : a;
}

function frameUrl(manifestUrl, manifest, i) {
  const base = manifestUrl.slice(0, manifestUrl.lastIndexOf('/') + 1);
  const name = manifest.pattern.replace(/\{i:(\d+)\}/, (_, w) =>
    String(i).padStart(Number(w), '0'));
  const v = manifest.version ? `?v=${encodeURIComponent(manifest.version)}` : '';
  return `${base}${name}${v}`;
}

export function createFrameStore(manifestUrl, opts = {}) {
  const {
    fetchFn = (...a) => globalThis.fetch(...a),
    decode = (blob) => globalThis.createImageBitmap(blob),
    deviceMemory = globalThis.navigator?.deviceMemory,
    concurrency = 6,
    lruSize = 30,
    lruRadius = 3,
  } = opts;
  const mode = opts.mode ?? ((deviceMemory !== undefined && deviceMemory <= 4) ? 'lru' : 'full');

  let manifest = null;
  let destroyed = false;
  let settled = 0;            // loaded + given up
  const bitmaps = new Map();  // index -> ImageBitmap (full mode: all; lru: cache)
  const blobs = new Map();    // index -> Blob (lru mode only)
  const loadedIdx = [];       // sorted indices with a blob/bitmap available
  const decodedIdx = [];      // sorted indices with a bitmap (lru mode)
  const decoding = new Set();
  const listeners = { frame: [], complete: [], error: [] };

  const emit = (type, payload) => listeners[type].forEach((fn) => fn(payload));
  const on = (type, fn) => { listeners[type].push(fn); return () => {
    listeners[type] = listeners[type].filter((f) => f !== fn);
  }; };

  async function fetchBlob(i, priority) {
    const url = frameUrl(manifestUrl, manifest, i);
    let lastErr;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetchFn(url, { priority });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return await res.blob();
      } catch (e) { lastErr = e; }
    }
    throw lastErr;
  }

  async function loadFrame(i, priority = 'low') {
    try {
      const blob = await fetchBlob(i, priority);
      if (destroyed) return;
      if (mode === 'full') {
        const bmp = await decode(blob);
        if (destroyed) { bmp.close?.(); return; }
        bitmaps.set(i, bmp);
      } else {
        blobs.set(i, blob);
      }
      sortedInsert(loadedIdx, i);
      emit('frame', i);
    } catch (e) {
      emit('error', { index: i, error: e });
    } finally {
      settled++;
      if (settled === manifest.count) emit('complete', loadedIdx.length);
    }
  }

  async function runQueue() {
    const queue = loadOrder(manifest.count);
    // The middle frame goes alone and at high priority so the first paint
    // never competes with the rest of the sequence for bandwidth.
    if (queue.length) await loadFrame(queue.shift(), 'high');
    if (destroyed) return;
    const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
      while (queue.length && !destroyed) await loadFrame(queue.shift());
    });
    await Promise.all(workers);
  }

  async function load() {
    const res = await fetchFn(manifestUrl);
    if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
    manifest = await res.json();
    if (!manifest || !Number.isInteger(manifest.count) || !manifest.pattern) {
      throw new Error('invalid manifest');
    }
    runQueue();
    return manifest;
  }

  // --- LRU (lru mode only) --------------------------------------------------
  function touch(i) {
    const bmp = bitmaps.get(i);
    bitmaps.delete(i); bitmaps.set(i, bmp); // Map order = recency
  }
  function evict() {
    while (bitmaps.size > lruSize) {
      const [oldest, bmp] = bitmaps.entries().next().value;
      bitmaps.delete(oldest);
      decodedIdx.splice(decodedIdx.indexOf(oldest), 1);
      bmp.close?.();
    }
  }
  function ensureDecoded(i) {
    if (bitmaps.has(i)) { touch(i); return; }
    if (decoding.has(i) || !blobs.has(i)) return;
    decoding.add(i);
    Promise.resolve(decode(blobs.get(i))).then((bmp) => {
      decoding.delete(i);
      if (destroyed || bitmaps.has(i)) { bmp.close?.(); return; }
      bitmaps.set(i, bmp);
      sortedInsert(decodedIdx, i);
      evict();
      emit('frame', i);
    }, () => decoding.delete(i));
  }

  /** Nearest available bitmap for p in [0,1], or null. */
  function nearest(p) {
    if (!manifest || loadedIdx.length === 0) return null;
    const target = Math.round(Math.min(1, Math.max(0, p)) * (manifest.count - 1));
    const idx = nearestIn(loadedIdx, target);
    if (mode === 'full') return bitmaps.get(idx);
    // lru: request decode of idx and neighbours, draw nearest decoded meanwhile
    ensureDecoded(idx);
    for (let d = 1; d <= lruRadius; d++) {
      const lo = nearestIn(loadedIdx, idx - d), hi = nearestIn(loadedIdx, idx + d);
      ensureDecoded(lo); ensureDecoded(hi);
    }
    if (decodedIdx.length === 0) return null;
    const di = nearestIn(decodedIdx, target);
    touch(di);
    return bitmaps.get(di);
  }

  function frameIndex(p) {
    if (!manifest) return -1;
    return Math.round(Math.min(1, Math.max(0, p)) * (manifest.count - 1));
  }

  function destroy() {
    destroyed = true;
    for (const b of bitmaps.values()) b.close?.();
    bitmaps.clear(); blobs.clear();
  }

  return {
    load, nearest, frameIndex, on, destroy, mode,
    get manifest() { return manifest; },
    get count() { return manifest?.count ?? 0; },
    get width() { return manifest?.width ?? 0; },
    get height() { return manifest?.height ?? 0; },
    get loadedCount() { return loadedIdx.length; },
    get decodedCount() { return mode === 'full' ? loadedIdx.length : decodedIdx.length; },
    get done() { return !!manifest && settled === manifest.count; },
  };
}

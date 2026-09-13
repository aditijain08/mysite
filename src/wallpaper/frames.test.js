import { describe, it, expect, vi } from 'vitest';
import { loadOrder, nearestIn, createFrameStore } from './frames.js';

describe('loadOrder', () => {
  it('starts with the middle frame then spreads out', () => {
    expect(loadOrder(9)).toEqual([4, 0, 8, 2, 6, 1, 3, 5, 7]);
  });
  it('covers every index exactly once', () => {
    for (const n of [1, 2, 3, 10, 90, 91]) {
      const o = loadOrder(n);
      expect(o.length).toBe(n);
      expect([...o].sort((a, b) => a - b)).toEqual([...Array(n).keys()]);
    }
  });
  it('handles zero', () => { expect(loadOrder(0)).toEqual([]); });
});

describe('nearestIn', () => {
  it('finds the closest value with gaps', () => {
    const s = [0, 10, 20, 45];
    expect(nearestIn(s, 4)).toBe(0);
    expect(nearestIn(s, 6)).toBe(10);
    expect(nearestIn(s, 30)).toBe(20);
    expect(nearestIn(s, 44)).toBe(45);
    expect(nearestIn(s, 100)).toBe(45);
    expect(nearestIn(s, -3)).toBe(0);
  });
  it('returns -1 on empty', () => { expect(nearestIn([], 1)).toBe(-1); });
});

/** Build a fake fetch that serves a manifest and frames, optionally failing some. */
function fakeNet({ count = 9, failIdx = [], failTimes = 1 } = {}) {
  const fails = new Map(failIdx.map((i) => [i, failTimes]));
  const requested = [];
  const fetchFn = vi.fn(async (url) => {
    if (url.endsWith('manifest.json')) {
      return { ok: true, json: async () => ({ version: 'v1', width: 16, height: 9, count, pattern: 'f_{i:02}.webp' }) };
    }
    const i = Number(url.match(/f_(\d+)\.webp/)[1]);
    requested.push(i);
    if ((fails.get(i) ?? 0) > 0) { fails.set(i, fails.get(i) - 1); return { ok: false, status: 500 }; }
    return { ok: true, blob: async () => ({ idx: i }) };
  });
  const decode = vi.fn(async (blob) => ({ width: 16, height: 9, idx: blob.idx, close: vi.fn() }));
  return { fetchFn, decode, requested };
}

const settle = () => new Promise((r) => setTimeout(r, 0));
async function untilDone(store) { while (!store.done) await settle(); }

describe('createFrameStore (full mode)', () => {
  it('fetches frames in spread order, with concurrency', async () => {
    const net = fakeNet({ count: 9 });
    const store = createFrameStore('/wp/manifest.json', { ...net, mode: 'full', concurrency: 1 });
    await store.load();
    await untilDone(store);
    expect(net.requested).toEqual(loadOrder(9));
    expect(net.fetchFn.mock.calls[1][0]).toBe('/wp/f_04.webp?v=v1');
    expect(store.loadedCount).toBe(9);
  });

  it('nearest() picks the closest loaded frame while loading', async () => {
    const net = fakeNet({ count: 9 });
    // Release exactly the first three frame requests; hold every later one.
    let release; const gate = new Promise((r) => (release = r));
    let n = 0; const hold = new Promise(() => {});
    const slowFetch = async (url, o) => {
      if (!url.endsWith('manifest.json')) await (n++ < 3 ? gate : hold);
      return net.fetchFn(url, o);
    };
    const store = createFrameStore('/wp/manifest.json', { fetchFn: slowFetch, decode: net.decode, mode: 'full', concurrency: 3 });
    await store.load();
    expect(store.nearest(0.5)).toBeNull();
    release(); await settle(); await settle();
    // first three (4, 0, 8) are in
    expect(store.nearest(0.5).idx).toBe(4);
    expect(store.nearest(0.1).idx).toBe(0);
    expect(store.nearest(0.7).idx).toBe(4);   // target 6: tie between 4 and 8 goes low
    expect(store.nearest(0.95).idx).toBe(8);
    expect(store.loadedCount).toBe(3);
  });

  it('retries a failed frame once and then gives up', async () => {
    const net = fakeNet({ count: 5, failIdx: [1], failTimes: 1 });
    const net2 = fakeNet({ count: 5, failIdx: [3], failTimes: 2 });
    const errors = [];
    const s1 = createFrameStore('/wp/manifest.json', { ...net, mode: 'full' });
    await s1.load(); await untilDone(s1);
    expect(s1.loadedCount).toBe(5);                                 // retry succeeded
    expect(net.requested.filter((i) => i === 1).length).toBe(2);
    const s2 = createFrameStore('/wp/manifest.json', { ...net2, mode: 'full' });
    s2.on('error', (e) => errors.push(e.index));
    const complete = vi.fn(); s2.on('complete', complete);
    await s2.load(); await untilDone(s2);
    expect(s2.loadedCount).toBe(4);                                 // gave up on 3
    expect(errors).toEqual([3]);
    expect(net2.requested.filter((i) => i === 3).length).toBe(2);
    expect(complete).toHaveBeenCalledWith(4);
    expect(s2.nearest(0.75).idx).toBe(2);                           // gap at 3 covered (tie 2/4 goes low)
    expect(s2.nearest(0.9).idx).toBe(4);
  });

  it('rejects on manifest failure', async () => {
    const store = createFrameStore('/wp/manifest.json', { fetchFn: async () => ({ ok: false, status: 404 }) });
    await expect(store.load()).rejects.toThrow('404');
  });

  it('chooses lru mode on low-memory devices', () => {
    expect(createFrameStore('/m.json', { deviceMemory: 4 }).mode).toBe('lru');
    expect(createFrameStore('/m.json', { deviceMemory: 8 }).mode).toBe('full');
    expect(createFrameStore('/m.json', { deviceMemory: undefined }).mode).toBe('full');
  });
});

describe('createFrameStore (lru mode)', () => {
  it('decodes around the current position and evicts far frames', async () => {
    const net = fakeNet({ count: 40 });
    const store = createFrameStore('/wp/manifest.json', { ...net, mode: 'lru', lruSize: 8, lruRadius: 2 });
    await store.load(); await untilDone(store);
    expect(store.loadedCount).toBe(40);
    expect(store.decodedCount).toBe(0);
    expect(store.nearest(0)).toBeNull();          // nothing decoded yet
    await settle();
    expect(store.nearest(0).idx).toBe(0);
    expect(store.decodedCount).toBe(3);           // 0,1,2
    store.nearest(1); await settle();
    expect(store.nearest(1).idx).toBe(39);
    expect(store.decodedCount).toBe(6);           // + 37,38,39
    store.nearest(0.5); await settle();           // + 18,19,20,21 -> 10, evict oldest 2
    expect(store.decodedCount).toBe(8);
    const decodedIdx = [...Array(40).keys()].filter((i) => store.nearest(i / 39)?.idx === i);
    expect(decodedIdx).not.toContain(0);          // evicted
    expect(decodedIdx).toContain(20);
  });
});

import { describe, it, expect } from 'vitest';
import { createInput } from './input.js';

class FakeTarget {
  constructor() { this.h = {}; }
  addEventListener(t, fn) { (this.h[t] ||= []).push(fn); }
  removeEventListener(t, fn) { this.h[t] = (this.h[t] || []).filter((f) => f !== fn); }
  emit(t, e) { (this.h[t] || []).forEach((f) => f(e)); }
}

function make(opts = {}) {
  let t = 0;
  const target = new FakeTarget();
  const input = createInput({
    target, now: () => t, viewport: () => ({ w: 1000, h: 500 }), ...opts,
  });
  const advance = (ms, step = 16.667) => {
    let out;
    for (let e = 0; e < ms; e += step) { t += step; out = input.tick(step); }
    return out;
  };
  return { input, target, advance, time: () => t };
}

describe('createInput', () => {
  it('maps mouse coordinates to p and y', () => {
    const { input, target } = make();
    target.emit('mousemove', { clientX: 250, clientY: 500 });
    expect(input.target).toEqual({ p: 0.25, y: 1 });
    target.emit('mousemove', { clientX: -50, clientY: 0 });
    expect(input.target).toEqual({ p: 0, y: -1 });
  });

  it('touch drag maps like the mouse', () => {
    const { input, target } = make();
    target.emit('touchmove', { touches: [{ clientX: 750, clientY: 250 }] });
    expect(input.target).toEqual({ p: 0.75, y: 0 });
  });

  it('eases monotonically toward the target and settles', () => {
    const { input, target, advance } = make({ drift: false });
    target.emit('mousemove', { clientX: 1000, clientY: 250 });
    let prev = 0.5;
    for (let i = 0; i < 60; i++) {
      const { p, changed } = advance(16.667);
      expect(p).toBeGreaterThanOrEqual(prev);
      expect(p).toBeLessThanOrEqual(1);
      prev = p;
      if (!changed) break;
    }
    expect(prev).toBeGreaterThan(0.99);
    const r = advance(5000);
    expect(r.p).toBe(1);
    expect(r.changed).toBe(false);
  });

  it('is frame-rate compensated', () => {
    const a = make({ drift: false }), b = make({ drift: false });
    a.target.emit('mousemove', { clientX: 1000, clientY: 250 });
    b.target.emit('mousemove', { clientX: 1000, clientY: 250 });
    const pa = a.advance(500, 16.667).p;    // 60 fps
    const pb = b.advance(500, 8.333).p;     // 120 fps
    expect(Math.abs(pa - pb)).toBeLessThan(0.02);
  });

  it('starts drifting after idleDelay and stops on the first move', () => {
    const { input, target, advance } = make({ idleDelay: 3 });
    advance(2900);
    expect(input.drifting).toBe(false);
    advance(200);
    expect(input.drifting).toBe(true);
    const before = input.target.p;
    advance(3000);
    expect(input.target.p).not.toBe(before);
    target.emit('mousemove', { clientX: 100, clientY: 100 });
    expect(input.drifting).toBe(false);
    expect(input.target.p).toBe(0.1);
  });

  it('drift starts continuously from the current target (no jump)', () => {
    const { input, target, advance } = make({ idleDelay: 1 });
    target.emit('mousemove', { clientX: 800, clientY: 250 }); // p = 0.8
    advance(1100);
    expect(input.drifting).toBe(true);
    expect(Math.abs(input.target.p - 0.8)).toBeLessThan(0.02);
  });

  it('setOptions can turn drift off and destroy removes listeners', () => {
    const { input, target, advance } = make({ idleDelay: 1 });
    advance(2000);
    expect(input.drifting).toBe(true);
    input.setOptions({ drift: false });
    expect(input.drifting).toBe(false);
    advance(5000);
    expect(input.drifting).toBe(false);
    input.destroy();
    expect(target.h.mousemove.length).toBe(0);
  });
});

describe('device tilt', () => {
  const orient = (target, gamma, beta) => target.emit('deviceorientation', { gamma, beta });

  it('maps roll to p relative to the first reading and pitch to y', () => {
    const { input, target } = make({ tiltRange: 20, tiltRangeY: 10 });
    input.enableTilt();
    orient(target, 5, 40);                 // baseline: roll 5°, pitch 40°
    expect(input.target).toEqual({ p: 0.5, y: 0 });
    orient(target, 15, 45);                // +10° roll = quarter travel, +5° pitch = half
    expect(input.target.p).toBeCloseTo(0.75);
    expect(input.target.y).toBeCloseTo(0.5);
    orient(target, -40, 40);               // beyond range clamps
    expect(input.target.p).toBe(0);
    expect(input.tilting).toBe(true);
  });

  it('ignores touch while tilt readings are fresh, then lets touch back in', () => {
    const { input, target, advance } = make({ drift: false });
    input.enableTilt();
    orient(target, 0, 40);
    target.emit('touchmove', { touches: [{ clientX: 1000, clientY: 250 }] });
    expect(input.target.p).toBe(0.5);      // touch ignored
    advance(1200);                          // readings go stale
    expect(input.tilting).toBe(false);
    target.emit('touchmove', { touches: [{ clientX: 1000, clientY: 250 }] });
    expect(input.target.p).toBe(1);
  });

  it('tiny tilt jitter does not count as movement, so drift can still start', () => {
    const { input, target, advance } = make({ idleDelay: 1 });
    input.enableTilt();
    orient(target, 0, 40);
    for (let i = 0; i < 20; i++) { advance(100); orient(target, 0.1 * (i % 2), 40); }
    expect(input.drifting).toBe(true);
    orient(target, 5, 40);                  // a real move cancels drift
    expect(input.drifting).toBe(false);
  });

  it('requestTilt honours the permission API', async () => {
    const saved = globalThis.DeviceOrientationEvent;
    globalThis.DeviceOrientationEvent = { requestPermission: async () => 'denied' };
    const a = make();
    expect(await a.input.requestTilt()).toBe(false);
    globalThis.DeviceOrientationEvent = { requestPermission: async () => 'granted' };
    const b = make();
    expect(await b.input.requestTilt()).toBe(true);
    expect(b.target.h.deviceorientation.length).toBe(1);
    globalThis.DeviceOrientationEvent = function () {};  // no permission API (Android)
    const c = make();
    expect(await c.input.requestTilt()).toBe(true);
    globalThis.DeviceOrientationEvent = saved;
  });
});

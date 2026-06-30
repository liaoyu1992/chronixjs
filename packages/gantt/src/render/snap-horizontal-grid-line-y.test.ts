import { afterEach, describe, expect, it } from 'vitest';

import { snapHorizontalGridLineY } from './snap-horizontal-grid-line-y.js';

/**
 * Restore the original `window.devicePixelRatio` after each test
 * that mutates it. The vitest jsdom environment defaults to dpr=1.
 */
const originalDpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;
function setDpr(value: number | undefined): void {
  if (typeof window === 'undefined') return;
  Object.defineProperty(window, 'devicePixelRatio', {
    value,
    configurable: true,
    writable: true,
  });
}

describe('snapHorizontalGridLineY', () => {
  afterEach(() => {
    setDpr(originalDpr);
  });

  it('dpr=1 baseline: integer y → y + 0.5 lands on integer device pixel + half-stroke', () => {
    setDpr(1);
    // y=100, drawableHeight=400. round(100*1)+0.5 = 100.5; clamped within [0.5, 399.5].
    expect(snapHorizontalGridLineY(100, 400)).toBe(100.5);
  });

  it('dpr=1 with fractional y rounds to nearest device pixel before adding 0.5', () => {
    setDpr(1);
    // y=100.3 → round(100.3)+0.5 = 100.5; y=100.7 → round(100.7)+0.5 = 101.5.
    expect(snapHorizontalGridLineY(100.3, 400)).toBe(100.5);
    expect(snapHorizontalGridLineY(100.7, 400)).toBe(101.5);
  });

  it('dpr=2 retina: half-CSS-pixel resolution → y * 2 rounds to device pixel, halved back', () => {
    setDpr(2);
    // y=100, dpr=2. round(200)+0.5 = 200.5 → 200.5 / 2 = 100.25.
    expect(snapHorizontalGridLineY(100, 400)).toBe(100.25);
    // y=100.4 → round(200.8)+0.5 = 201.5 → 201.5 / 2 = 100.75.
    expect(snapHorizontalGridLineY(100.4, 400)).toBe(100.75);
  });

  it('dpr=1.25 OS scaling: 4-device-pixel resolution per 5 CSS pixels', () => {
    setDpr(1.25);
    // y=100, dpr=1.25. round(125)+0.5 = 125.5 → 125.5/1.25 = 100.4.
    expect(snapHorizontalGridLineY(100, 400)).toBe(100.4);
  });

  it('dpr=1.5 OS scaling produces 1/3-CSS-pixel resolution snap', () => {
    setDpr(1.5);
    // y=100, dpr=1.5. round(150)+0.5 = 150.5 → 150.5/1.5 ≈ 100.333...
    expect(snapHorizontalGridLineY(100, 400)).toBeCloseTo(100.3333, 4);
  });

  it('NaN dpr falls back to dpr=1 baseline', () => {
    setDpr(Number.NaN);
    // NaN → fallback to 1. Same as dpr=1 baseline.
    expect(snapHorizontalGridLineY(100, 400)).toBe(100.5);
  });

  it('dpr <= 0 falls back to dpr=1 baseline (defensive against zero or negative)', () => {
    setDpr(0);
    expect(snapHorizontalGridLineY(100, 400)).toBe(100.5);
    setDpr(-1);
    expect(snapHorizontalGridLineY(100, 400)).toBe(100.5);
  });

  it('clamps to [margin, drawableHeight - margin] at top edge', () => {
    setDpr(1);
    // y=0 → round(0)+0.5 = 0.5. Margin = 0.5/1 = 0.5. yCrisp(0.5) >= margin(0.5) → no clamp.
    expect(snapHorizontalGridLineY(0, 400)).toBe(0.5);
    // Verify yCrisp < margin clamps UP to margin. With dpr=1 + integer y this can't happen
    // (yCrisp >= 0.5 always for y >= 0), so use dpr=2 + y=0 → round(0)+0.5 = 0.5 → /2 = 0.25.
    // Margin = 0.5/2 = 0.25. yCrisp(0.25) >= margin(0.25) → no clamp; equal boundary.
    setDpr(2);
    expect(snapHorizontalGridLineY(0, 400)).toBe(0.25);
  });

  it('y >= drawableHeight reduces y by 1 first to keep stroke inside SVG bounding box', () => {
    setDpr(1);
    // y=400, drawableHeight=400 → y >= drawableHeight → y = 399. round(399)+0.5 = 399.5.
    expect(snapHorizontalGridLineY(400, 400)).toBe(399.5);
    // y=500 (well past): y = 399 → 399.5.
    expect(snapHorizontalGridLineY(500, 400)).toBe(399.5);
  });

  it('clamps to maxY = drawableHeight - margin at bottom edge', () => {
    setDpr(1);
    // y=399.9 → round(399.9)+0.5 = 400.5. maxY = 400 - 0.5 = 399.5. yCrisp(400.5) > maxY → clamp to 399.5.
    expect(snapHorizontalGridLineY(399.9, 400)).toBe(399.5);
  });
});

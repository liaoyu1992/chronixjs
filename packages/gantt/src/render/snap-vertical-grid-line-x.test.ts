import { afterEach, describe, expect, it } from 'vitest';

import { snapVerticalGridLineX } from './snap-vertical-grid-line-x.js';

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

describe('snapVerticalGridLineX — vertical twin of snapHorizontalGridLineY', () => {
  afterEach(() => {
    setDpr(originalDpr);
  });

  it('dpr=1 baseline: integer x → x + 0.5 lands on integer device pixel + half-stroke', () => {
    setDpr(1);
    // x=100, drawableWidth=400. round(100*1)+0.5 = 100.5; clamped within [0.5, 399.5].
    expect(snapVerticalGridLineX(100, 400)).toBe(100.5);
  });

  it('dpr=1 with fractional x rounds to nearest device pixel before adding 0.5', () => {
    setDpr(1);
    // x=100.3 → round(100.3)+0.5 = 100.5; x=100.7 → round(100.7)+0.5 = 101.5.
    expect(snapVerticalGridLineX(100.3, 400)).toBe(100.5);
    expect(snapVerticalGridLineX(100.7, 400)).toBe(101.5);
  });

  it('dpr=2 retina: half-CSS-pixel resolution → x * 2 rounds to device pixel, halved back', () => {
    setDpr(2);
    // x=100, dpr=2. round(200)+0.5 = 200.5 → 200.5 / 2 = 100.25.
    expect(snapVerticalGridLineX(100, 400)).toBe(100.25);
    // x=100.4 → round(200.8)+0.5 = 201.5 → 201.5 / 2 = 100.75.
    expect(snapVerticalGridLineX(100.4, 400)).toBe(100.75);
  });

  it('dpr=1.25 OS scaling: 4-device-pixel resolution per 5 CSS pixels', () => {
    setDpr(1.25);
    // x=100, dpr=1.25. round(125)+0.5 = 125.5 → 125.5/1.25 = 100.4.
    expect(snapVerticalGridLineX(100, 400)).toBe(100.4);
  });

  it('dpr=1.5 OS scaling produces 1/3-CSS-pixel resolution snap', () => {
    setDpr(1.5);
    // x=100, dpr=1.5. round(150)+0.5 = 150.5 → 150.5/1.5 ≈ 100.333...
    expect(snapVerticalGridLineX(100, 400)).toBeCloseTo(100.3333, 4);
  });

  it('NaN dpr falls back to dpr=1 baseline', () => {
    setDpr(Number.NaN);
    expect(snapVerticalGridLineX(100, 400)).toBe(100.5);
  });

  it('dpr <= 0 falls back to dpr=1 baseline (defensive against zero or negative)', () => {
    setDpr(0);
    expect(snapVerticalGridLineX(100, 400)).toBe(100.5);
    setDpr(-1);
    expect(snapVerticalGridLineX(100, 400)).toBe(100.5);
  });

  it('clamps to [margin, drawableWidth - margin] at left edge', () => {
    setDpr(1);
    expect(snapVerticalGridLineX(0, 400)).toBe(0.5);
    setDpr(2);
    expect(snapVerticalGridLineX(0, 400)).toBe(0.25);
  });

  it('x >= drawableWidth reduces x by 1 first to keep stroke inside SVG bounding box', () => {
    setDpr(1);
    expect(snapVerticalGridLineX(400, 400)).toBe(399.5);
    expect(snapVerticalGridLineX(500, 400)).toBe(399.5);
  });

  it('clamps to maxX = drawableWidth - margin at right edge', () => {
    setDpr(1);
    expect(snapVerticalGridLineX(399.9, 400)).toBe(399.5);
  });

  it('header tick and body vline share one X (the alignment contract)', () => {
    setDpr(1);
    // The whole point: the header tick line and the body grid vline for
    // the same boundary must resolve to the SAME snapped X at every DPR,
    // so they overlay pixel-for-pixel regardless of how each is drawn.
    for (const dpr of [1, 1.25, 1.5, 2]) {
      setDpr(dpr);
      const headerX = snapVerticalGridLineX(240, 1440);
      const bodyX = snapVerticalGridLineX(240, 1440);
      expect(headerX).toBe(bodyX);
    }
  });
});

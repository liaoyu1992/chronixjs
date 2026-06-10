import { describe, expect, it } from 'vitest';

import {
  computeHsvAtSquarePosition,
  computeHueAtStripPosition,
  computeSquarePositionForHsv,
  computeStripPositionForHue,
} from './compute-color-position.js';

describe('computeHsvAtSquarePosition — Phase 99', () => {
  it('top-left (0, 0) → (s=0, v=1, h=currentHue)', () => {
    const result = computeHsvAtSquarePosition({
      positionPxX: 0,
      positionPxY: 0,
      squareWidthPx: 200,
      squareHeightPx: 200,
      currentHue: 120,
    });
    expect(result).toEqual({ h: 120, s: 0, v: 1 });
  });

  it('bottom-right (W, H) → (s=1, v=0)', () => {
    const result = computeHsvAtSquarePosition({
      positionPxX: 200,
      positionPxY: 200,
      squareWidthPx: 200,
      squareHeightPx: 200,
      currentHue: 200,
    });
    expect(result).toEqual({ h: 200, s: 1, v: 0 });
  });

  it('center → (s=0.5, v=0.5)', () => {
    const result = computeHsvAtSquarePosition({
      positionPxX: 100,
      positionPxY: 100,
      squareWidthPx: 200,
      squareHeightPx: 200,
      currentHue: 0,
    });
    expect(result.s).toBeCloseTo(0.5, 5);
    expect(result.v).toBeCloseTo(0.5, 5);
  });

  it('out-of-bounds (negative) clamps to (s=0, v=1)', () => {
    const result = computeHsvAtSquarePosition({
      positionPxX: -50,
      positionPxY: -50,
      squareWidthPx: 200,
      squareHeightPx: 200,
      currentHue: 60,
    });
    expect(result).toEqual({ h: 60, s: 0, v: 1 });
  });

  it('out-of-bounds (beyond) clamps to (s=1, v=0)', () => {
    const result = computeHsvAtSquarePosition({
      positionPxX: 999,
      positionPxY: 999,
      squareWidthPx: 200,
      squareHeightPx: 200,
      currentHue: 60,
    });
    expect(result).toEqual({ h: 60, s: 1, v: 0 });
  });

  it('degenerate square dimensions return black at current hue', () => {
    const result = computeHsvAtSquarePosition({
      positionPxX: 50,
      positionPxY: 50,
      squareWidthPx: 0,
      squareHeightPx: 100,
      currentHue: 200,
    });
    expect(result).toEqual({ h: 200, s: 0, v: 0 });
  });
});

describe('computeSquarePositionForHsv — Phase 99', () => {
  it('(s=0.5, v=0.5) → center', () => {
    const result = computeSquarePositionForHsv({
      hsv: { h: 0, s: 0.5, v: 0.5 },
      squareWidthPx: 200,
      squareHeightPx: 200,
    });
    expect(result.positionPxX).toBe(100);
    expect(result.positionPxY).toBe(100);
  });

  it('(s=0, v=1) → top-left', () => {
    const result = computeSquarePositionForHsv({
      hsv: { h: 0, s: 0, v: 1 },
      squareWidthPx: 200,
      squareHeightPx: 200,
    });
    expect(result.positionPxX).toBe(0);
    expect(result.positionPxY).toBe(0);
  });

  it('(s=1, v=0) → bottom-right', () => {
    const result = computeSquarePositionForHsv({
      hsv: { h: 0, s: 1, v: 0 },
      squareWidthPx: 200,
      squareHeightPx: 200,
    });
    expect(result.positionPxX).toBe(200);
    expect(result.positionPxY).toBe(200);
  });

  it('out-of-range HSV clamps', () => {
    const result = computeSquarePositionForHsv({
      hsv: { h: 0, s: 1.5, v: -0.5 },
      squareWidthPx: 100,
      squareHeightPx: 100,
    });
    // s clamps to 1 ⇒ x=100; v clamps to 0 ⇒ y=100.
    expect(result.positionPxX).toBe(100);
    expect(result.positionPxY).toBe(100);
  });

  it('degenerate square returns (0, 0)', () => {
    const result = computeSquarePositionForHsv({
      hsv: { h: 0, s: 0.5, v: 0.5 },
      squareWidthPx: 0,
      squareHeightPx: 100,
    });
    expect(result).toEqual({ positionPxX: 0, positionPxY: 0 });
  });
});

describe('computeHueAtStripPosition — Phase 99', () => {
  it('position 0 → hue 0', () => {
    expect(computeHueAtStripPosition({ positionPx: 0, stripSizePx: 360 })).toBe(0);
  });

  it('midpoint → hue 180', () => {
    expect(computeHueAtStripPosition({ positionPx: 180, stripSizePx: 360 })).toBe(180);
  });

  it('position at end wraps to 0 (NOT 360)', () => {
    // ratio=1 ⇒ hue=360 ⇒ wraps to 0 per canonical [0, 360) invariant.
    expect(computeHueAtStripPosition({ positionPx: 360, stripSizePx: 360 })).toBe(0);
  });

  it('out-of-bounds positive clamps then wraps to 0', () => {
    expect(computeHueAtStripPosition({ positionPx: 999, stripSizePx: 360 })).toBe(0);
  });

  it('negative position clamps to 0', () => {
    expect(computeHueAtStripPosition({ positionPx: -50, stripSizePx: 360 })).toBe(0);
  });

  it('degenerate strip returns 0', () => {
    expect(computeHueAtStripPosition({ positionPx: 100, stripSizePx: 0 })).toBe(0);
  });

  it('non-square strip ratio still works', () => {
    // ratio=0.5 → hue=180.
    expect(computeHueAtStripPosition({ positionPx: 50, stripSizePx: 100 })).toBe(180);
  });
});

describe('computeStripPositionForHue — Phase 99', () => {
  it('hue 0 → position 0', () => {
    expect(computeStripPositionForHue({ hue: 0, stripSizePx: 360 })).toBe(0);
  });

  it('hue 180 → midpoint', () => {
    expect(computeStripPositionForHue({ hue: 180, stripSizePx: 360 })).toBe(180);
  });

  it('hue 360 wraps to position 0', () => {
    expect(computeStripPositionForHue({ hue: 360, stripSizePx: 360 })).toBe(0);
  });

  it('hue 720 wraps via modulo to position 0', () => {
    expect(computeStripPositionForHue({ hue: 720, stripSizePx: 360 })).toBe(0);
  });

  it('negative hue wraps positive', () => {
    // -60 % 360 + 360 = 300 ⇒ position = 300.
    expect(computeStripPositionForHue({ hue: -60, stripSizePx: 360 })).toBe(300);
  });

  it('degenerate strip returns 0', () => {
    expect(computeStripPositionForHue({ hue: 180, stripSizePx: 0 })).toBe(0);
  });
});

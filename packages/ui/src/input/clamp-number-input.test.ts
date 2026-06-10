import { describe, expect, it } from 'vitest';

import { clampNumberInput } from './clamp-number-input.js';

describe('clampNumberInput — clamp only', () => {
  it('passes through value within range', () => {
    expect(clampNumberInput(5, { min: 0, max: 10 })).toBe(5);
  });

  it('clamps below min', () => {
    expect(clampNumberInput(-5, { min: 0, max: 10 })).toBe(0);
  });

  it('clamps above max', () => {
    expect(clampNumberInput(15, { min: 0, max: 10 })).toBe(10);
  });

  it('only-min: clamps below; pass through above', () => {
    expect(clampNumberInput(-5, { min: 0 })).toBe(0);
    expect(clampNumberInput(100, { min: 0 })).toBe(100);
  });

  it('only-max: clamps above; pass through below', () => {
    expect(clampNumberInput(15, { max: 10 })).toBe(10);
    expect(clampNumberInput(-100, { max: 10 })).toBe(-100);
  });

  it('no bounds: pass through unchanged', () => {
    expect(clampNumberInput(42)).toBe(42);
    expect(clampNumberInput(-42)).toBe(-42);
  });
});

describe('clampNumberInput — step snap', () => {
  it('snaps to nearest step (no base)', () => {
    expect(clampNumberInput(7.4, { step: 5 })).toBe(5);
    expect(clampNumberInput(7.6, { step: 5 })).toBe(10);
    expect(clampNumberInput(12.4, { step: 5 })).toBe(10);
    expect(clampNumberInput(12.5, { step: 5 })).toBe(15);
  });

  it('snaps relative to min by default', () => {
    expect(clampNumberInput(7, { min: 2, step: 5 })).toBe(7); // 2 + 5 = 7
    expect(clampNumberInput(8, { min: 2, step: 5 })).toBe(7); // 2 + 5 = 7
    expect(clampNumberInput(9.51, { min: 2, step: 5 })).toBe(12); // 2 + 10 = 12
  });

  it('explicit stepBase overrides min default', () => {
    expect(clampNumberInput(10, { min: 0, step: 5, stepBase: 2 })).toBe(12); // 2+10
    expect(clampNumberInput(6, { min: 0, step: 5, stepBase: 2 })).toBe(7); // 2+5
  });

  it('zero step disables snap', () => {
    expect(clampNumberInput(7.4, { step: 0 })).toBe(7.4);
  });

  it('negative step disables snap (treated as no step)', () => {
    expect(clampNumberInput(7.4, { step: -1 })).toBe(7.4);
  });

  it('step + clamp: snap then clamp to max', () => {
    // value=11, step=3, base=0 → snaps to 12; clamped to max=10.
    expect(clampNumberInput(11, { min: 0, max: 10, step: 3 })).toBe(10);
  });

  it('avoids floating-point artifacts in step math', () => {
    // 0.1 + 0.2 = 0.30000000000000004 — round-trip should still produce 0.3.
    expect(clampNumberInput(0.3, { min: 0, step: 0.1 })).toBe(0.3);
    expect(clampNumberInput(0.4, { min: 0, step: 0.1 })).toBe(0.4);
  });
});

describe('clampNumberInput — non-finite passthrough', () => {
  it('passes NaN through unchanged', () => {
    expect(Number.isNaN(clampNumberInput(Number.NaN, { min: 0, max: 10 }))).toBe(true);
  });

  it('passes Infinity through unchanged', () => {
    expect(clampNumberInput(Number.POSITIVE_INFINITY, { min: 0, max: 10 })).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it('passes -Infinity through unchanged', () => {
    expect(clampNumberInput(Number.NEGATIVE_INFINITY, { min: 0, max: 10 })).toBe(
      Number.NEGATIVE_INFINITY,
    );
  });
});

import { describe, expect, it } from 'vitest';

import {
  computeRangeClosestHandle,
  computeRangeValueAtPosition,
  computeRangeValueOnKey,
} from './compute-range-value.js';

describe('computeRangeClosestHandle', () => {
  it('position left of midpoint returns low', () => {
    // currentRange low=20, high=80 → midpoint=50 (value-space).
    // positionPx=30 / trackSizePx=100 → ratio=0.3 → valueAtPosition=30.
    const result = computeRangeClosestHandle({
      positionPx: 30,
      currentRange: { low: 20, high: 80 },
      trackSizePx: 100,
      min: 0,
      max: 100,
    });
    expect(result).toBe('low');
  });

  it('position right of midpoint returns high', () => {
    const result = computeRangeClosestHandle({
      positionPx: 70,
      currentRange: { low: 20, high: 80 },
      trackSizePx: 100,
      min: 0,
      max: 100,
    });
    expect(result).toBe('high');
  });

  it('position exactly at midpoint returns low (tie-break per C.1)', () => {
    // midpoint = 50; positionPx = 50 → valueAtPosition = 50.
    const result = computeRangeClosestHandle({
      positionPx: 50,
      currentRange: { low: 20, high: 80 },
      trackSizePx: 100,
      min: 0,
      max: 100,
    });
    expect(result).toBe('low');
  });

  it('position at low handle returns low', () => {
    // currentRange low=20 → midpoint=50; position at value 20 < midpoint.
    const result = computeRangeClosestHandle({
      positionPx: 20,
      currentRange: { low: 20, high: 80 },
      trackSizePx: 100,
      min: 0,
      max: 100,
    });
    expect(result).toBe('low');
  });

  it('position at high handle returns high', () => {
    const result = computeRangeClosestHandle({
      positionPx: 80,
      currentRange: { low: 20, high: 80 },
      trackSizePx: 100,
      min: 0,
      max: 100,
    });
    expect(result).toBe('high');
  });

  it('overlapping handles (low === high) returns low tie-break', () => {
    const result = computeRangeClosestHandle({
      positionPx: 50,
      currentRange: { low: 50, high: 50 },
      trackSizePx: 100,
      min: 0,
      max: 100,
    });
    expect(result).toBe('low');
  });

  it('position out of bounds clamps + still resolves correctly', () => {
    // positionPx=500 clamps to 100% → valueAtPosition=100 > midpoint 50 → high.
    const result = computeRangeClosestHandle({
      positionPx: 500,
      currentRange: { low: 20, high: 80 },
      trackSizePx: 100,
      min: 0,
      max: 100,
    });
    expect(result).toBe('high');
  });

  it('degenerate trackSizePx=0 returns low (deterministic fallback)', () => {
    const result = computeRangeClosestHandle({
      positionPx: 50,
      currentRange: { low: 20, high: 80 },
      trackSizePx: 0,
      min: 0,
      max: 100,
    });
    expect(result).toBe('low');
  });
});

describe('computeRangeValueAtPosition', () => {
  it('drag low handle to a value below current high updates low only', () => {
    // positionPx=30, trackSizePx=100, step=1 → rawValue=30; clamps within [min=0, high=80].
    const result = computeRangeValueAtPosition({
      positionPx: 30,
      activeHandle: 'low',
      currentRange: { low: 20, high: 80 },
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toEqual({ low: 30, high: 80 });
  });

  it('drag high handle to a value above current low updates high only', () => {
    const result = computeRangeValueAtPosition({
      positionPx: 90,
      activeHandle: 'high',
      currentRange: { low: 20, high: 80 },
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toEqual({ low: 20, high: 90 });
  });

  it('drag low handle past high clamps to high (no swap)', () => {
    // Drag low to position 90 → rawValue=90; clamps at currentRange.high=80.
    const result = computeRangeValueAtPosition({
      positionPx: 90,
      activeHandle: 'low',
      currentRange: { low: 20, high: 80 },
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toEqual({ low: 80, high: 80 });
  });

  it('drag high handle past low clamps to low (no swap)', () => {
    const result = computeRangeValueAtPosition({
      positionPx: 10,
      activeHandle: 'high',
      currentRange: { low: 20, high: 80 },
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toEqual({ low: 20, high: 20 });
  });

  it('applies step snap from underlying slider helper', () => {
    // step=10, position=53 → rawValue snaps to 50.
    const result = computeRangeValueAtPosition({
      positionPx: 53,
      activeHandle: 'low',
      currentRange: { low: 20, high: 80 },
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 10,
    });
    expect(result).toEqual({ low: 50, high: 80 });
  });

  it('non-active handle preserved exactly', () => {
    // Drag high handle: low must equal currentRange.low exactly.
    const result = computeRangeValueAtPosition({
      positionPx: 95,
      activeHandle: 'high',
      currentRange: { low: 23, high: 77 },
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result.low).toBe(23);
    expect(result.high).toBe(95);
  });
});

describe('computeRangeValueOnKey', () => {
  it('ArrowRight on low handle increments low', () => {
    const result = computeRangeValueOnKey({
      key: 'ArrowRight',
      activeHandle: 'low',
      currentRange: { low: 20, high: 80 },
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toEqual({ low: 21, high: 80 });
  });

  it('ArrowLeft on high handle decrements high', () => {
    const result = computeRangeValueOnKey({
      key: 'ArrowLeft',
      activeHandle: 'high',
      currentRange: { low: 20, high: 80 },
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toEqual({ low: 20, high: 79 });
  });

  it('Home on low handle jumps low to min', () => {
    const result = computeRangeValueOnKey({
      key: 'Home',
      activeHandle: 'low',
      currentRange: { low: 50, high: 80 },
      min: 5,
      max: 100,
      step: 1,
    });
    expect(result).toEqual({ low: 5, high: 80 });
  });

  it('End on high handle jumps high to max', () => {
    const result = computeRangeValueOnKey({
      key: 'End',
      activeHandle: 'high',
      currentRange: { low: 20, high: 50 },
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toEqual({ low: 20, high: 100 });
  });

  it('Home on high handle clamps to current low (overlap clamp)', () => {
    // Home → underlying returns min=0; high clamps at currentRange.low=20.
    const result = computeRangeValueOnKey({
      key: 'Home',
      activeHandle: 'high',
      currentRange: { low: 20, high: 80 },
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toEqual({ low: 20, high: 20 });
  });

  it('End on low handle clamps to current high', () => {
    const result = computeRangeValueOnKey({
      key: 'End',
      activeHandle: 'low',
      currentRange: { low: 20, high: 80 },
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toEqual({ low: 80, high: 80 });
  });

  it('PageUp on low handle past high clamps to high', () => {
    // PageUp default = 10×step = 10. currentValue=75 + 10 = 85 > high=80 → clamp 80.
    const result = computeRangeValueOnKey({
      key: 'PageUp',
      activeHandle: 'low',
      currentRange: { low: 75, high: 80 },
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toEqual({ low: 80, high: 80 });
  });

  it('PageDown on high handle past low clamps to low', () => {
    const result = computeRangeValueOnKey({
      key: 'PageDown',
      activeHandle: 'high',
      currentRange: { low: 20, high: 25 },
      min: 0,
      max: 100,
      step: 1,
    });
    // PageDown = 25 - 10 = 15 < low=20 → clamp 20.
    expect(result).toEqual({ low: 20, high: 20 });
  });

  it('unrecognized key returns null', () => {
    const result = computeRangeValueOnKey({
      key: 'Escape',
      activeHandle: 'low',
      currentRange: { low: 20, high: 80 },
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toBeNull();
  });

  it('non-active handle preserved exactly on every key', () => {
    const result = computeRangeValueOnKey({
      key: 'ArrowRight',
      activeHandle: 'low',
      currentRange: { low: 17, high: 83 },
      min: 0,
      max: 100,
      step: 5,
    });
    expect(result?.high).toBe(83);
    expect(result?.low).toBe(22);
  });

  it('largeStepMultiplier override propagates to underlying slider helper', () => {
    const result = computeRangeValueOnKey({
      key: 'PageUp',
      activeHandle: 'low',
      currentRange: { low: 0, high: 100 },
      min: 0,
      max: 100,
      step: 1,
      largeStepMultiplier: 25,
    });
    // 0 + 25*1 = 25; well below high=100 ⇒ no clamp.
    expect(result).toEqual({ low: 25, high: 100 });
  });

  it('degenerate range returns null (delegated)', () => {
    const result = computeRangeValueOnKey({
      key: 'Home',
      activeHandle: 'low',
      currentRange: { low: 10, high: 10 },
      min: 10,
      max: 10,
      step: 1,
    });
    expect(result).toBeNull();
  });
});

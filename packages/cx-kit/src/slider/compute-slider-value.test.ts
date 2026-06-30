import { describe, expect, it } from 'vitest';

import {
  DEFAULT_SLIDER_LARGE_STEP_MULTIPLIER,
  computeSliderPositionForValue,
  computeSliderValueAtPosition,
  computeSliderValueOnKey,
} from './compute-slider-value.js';

describe('computeSliderValueAtPosition', () => {
  it('midpoint position returns midpoint value snapped to step', () => {
    const result = computeSliderValueAtPosition({
      positionPx: 50,
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toBe(50);
  });

  it('position 0 returns min', () => {
    const result = computeSliderValueAtPosition({
      positionPx: 0,
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toBe(0);
  });

  it('position at track end returns max', () => {
    const result = computeSliderValueAtPosition({
      positionPx: 100,
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toBe(100);
  });

  it('position beyond track end clamps to max', () => {
    const result = computeSliderValueAtPosition({
      positionPx: 500,
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toBe(100);
  });

  it('negative position clamps to min', () => {
    const result = computeSliderValueAtPosition({
      positionPx: -50,
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toBe(0);
  });

  it('snaps to nearest step (round-to-nearest)', () => {
    // positionPx=33 / trackSizePx=100 ⇒ ratio 0.33 ⇒ rawValue 33;
    // step=10 ⇒ snapped = round(33/10) * 10 = 30.
    const result = computeSliderValueAtPosition({
      positionPx: 33,
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 10,
    });
    expect(result).toBe(30);
  });

  it('snaps upward when nearer to next step', () => {
    // positionPx=37 ⇒ rawValue=37; step=10 ⇒ round(37/10)=4 ⇒ snapped=40.
    const result = computeSliderValueAtPosition({
      positionPx: 37,
      trackSizePx: 100,
      min: 0,
      max: 100,
      step: 10,
    });
    expect(result).toBe(40);
  });

  it('respects non-zero min when snapping', () => {
    // min=10, max=110 (range 100), step=20.
    // positionPx=50, trackSize=100 ⇒ ratio 0.5, rawValue=10+50=60.
    // stepsFromMin=round((60-10)/20)=round(2.5) → JS rounds .5 toward +Inf → 3.
    // snapped = 10 + 3*20 = 70.
    const result = computeSliderValueAtPosition({
      positionPx: 50,
      trackSizePx: 100,
      min: 10,
      max: 110,
      step: 20,
    });
    expect(result).toBe(70);
  });

  it('degenerate trackSizePx=0 returns min', () => {
    const result = computeSliderValueAtPosition({
      positionPx: 50,
      trackSizePx: 0,
      min: 5,
      max: 100,
      step: 1,
    });
    expect(result).toBe(5);
  });

  it('degenerate max<=min returns min', () => {
    const result = computeSliderValueAtPosition({
      positionPx: 50,
      trackSizePx: 100,
      min: 10,
      max: 10,
      step: 1,
    });
    expect(result).toBe(10);
  });
});

describe('computeSliderPositionForValue', () => {
  it('midpoint value returns midpoint position', () => {
    const result = computeSliderPositionForValue({
      value: 50,
      min: 0,
      max: 100,
      trackSizePx: 200,
    });
    expect(result).toBe(100);
  });

  it('value at min returns position 0', () => {
    const result = computeSliderPositionForValue({
      value: 0,
      min: 0,
      max: 100,
      trackSizePx: 200,
    });
    expect(result).toBe(0);
  });

  it('value at max returns position trackSizePx', () => {
    const result = computeSliderPositionForValue({
      value: 100,
      min: 0,
      max: 100,
      trackSizePx: 200,
    });
    expect(result).toBe(200);
  });

  it('value below min clamps to position 0', () => {
    const result = computeSliderPositionForValue({
      value: -50,
      min: 0,
      max: 100,
      trackSizePx: 200,
    });
    expect(result).toBe(0);
  });

  it('value above max clamps to position trackSizePx', () => {
    const result = computeSliderPositionForValue({
      value: 500,
      min: 0,
      max: 100,
      trackSizePx: 200,
    });
    expect(result).toBe(200);
  });

  it('degenerate trackSizePx=0 returns 0', () => {
    const result = computeSliderPositionForValue({
      value: 50,
      min: 0,
      max: 100,
      trackSizePx: 0,
    });
    expect(result).toBe(0);
  });

  it('degenerate max<=min returns 0', () => {
    const result = computeSliderPositionForValue({
      value: 50,
      min: 10,
      max: 10,
      trackSizePx: 200,
    });
    expect(result).toBe(0);
  });
});

describe('computeSliderValueOnKey — W3C ARIA APG semantics', () => {
  it('ArrowLeft decrements by step', () => {
    const result = computeSliderValueOnKey({
      key: 'ArrowLeft',
      currentValue: 50,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toBe(49);
  });

  it('ArrowDown decrements by step (same as ArrowLeft)', () => {
    const result = computeSliderValueOnKey({
      key: 'ArrowDown',
      currentValue: 50,
      min: 0,
      max: 100,
      step: 5,
    });
    expect(result).toBe(45);
  });

  it('ArrowRight increments by step', () => {
    const result = computeSliderValueOnKey({
      key: 'ArrowRight',
      currentValue: 50,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toBe(51);
  });

  it('ArrowUp increments by step (same as ArrowRight)', () => {
    const result = computeSliderValueOnKey({
      key: 'ArrowUp',
      currentValue: 50,
      min: 0,
      max: 100,
      step: 5,
    });
    expect(result).toBe(55);
  });

  it('PageUp jumps DEFAULT_SLIDER_LARGE_STEP_MULTIPLIER × step by default (10×)', () => {
    const result = computeSliderValueOnKey({
      key: 'PageUp',
      currentValue: 50,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toBe(60); // 50 + 10*1
  });

  it('PageDown jumps -10 × step by default', () => {
    const result = computeSliderValueOnKey({
      key: 'PageDown',
      currentValue: 50,
      min: 0,
      max: 100,
      step: 2,
    });
    expect(result).toBe(30); // 50 - 10*2
  });

  it('Home returns min', () => {
    const result = computeSliderValueOnKey({
      key: 'Home',
      currentValue: 75,
      min: 5,
      max: 100,
      step: 1,
    });
    expect(result).toBe(5);
  });

  it('End returns max', () => {
    const result = computeSliderValueOnKey({
      key: 'End',
      currentValue: 25,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toBe(100);
  });

  it('unrecognized key returns null', () => {
    const result = computeSliderValueOnKey({
      key: 'a',
      currentValue: 50,
      min: 0,
      max: 100,
      step: 1,
    });
    expect(result).toBeNull();
  });

  it('clamps to min on ArrowLeft at boundary', () => {
    const result = computeSliderValueOnKey({
      key: 'ArrowLeft',
      currentValue: 0,
      min: 0,
      max: 100,
      step: 5,
    });
    expect(result).toBe(0);
  });

  it('clamps to max on ArrowRight at boundary', () => {
    const result = computeSliderValueOnKey({
      key: 'ArrowRight',
      currentValue: 100,
      min: 0,
      max: 100,
      step: 5,
    });
    expect(result).toBe(100);
  });

  it('largeStepMultiplier override changes PageUp jump size', () => {
    const result = computeSliderValueOnKey({
      key: 'PageUp',
      currentValue: 0,
      min: 0,
      max: 100,
      step: 1,
      largeStepMultiplier: 25,
    });
    expect(result).toBe(25); // 0 + 25*1
  });

  it('largeStepMultiplier below 1 clamps to 1', () => {
    const result = computeSliderValueOnKey({
      key: 'PageUp',
      currentValue: 0,
      min: 0,
      max: 100,
      step: 5,
      largeStepMultiplier: 0.5,
    });
    // Multiplier clamps to 1 ⇒ largeStep=5; 0+5=5.
    expect(result).toBe(5);
  });

  it('degenerate max<=min returns null for all keys', () => {
    const result = computeSliderValueOnKey({
      key: 'Home',
      currentValue: 50,
      min: 10,
      max: 10,
      step: 1,
    });
    expect(result).toBeNull();
  });

  it('DEFAULT_SLIDER_LARGE_STEP_MULTIPLIER constant is 10 (W3C ARIA APG default)', () => {
    expect(DEFAULT_SLIDER_LARGE_STEP_MULTIPLIER).toBe(10);
  });
});

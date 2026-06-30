import {
  computeSliderValueAtPosition,
  computeSliderValueOnKey,
} from '../slider/compute-slider-value.js';

/** Identifier for which of the two range handles is active during a drag or keypress. */
export type RangeHandle = 'low' | 'high';

/**
 * A dual-handle range value. Invariant: `low <= high` for any range
 * passed into or returned from the helpers in this module.
 */
export interface RangeValue {
  readonly low: number;
  readonly high: number;
}

/** Input to `computeRangeClosestHandle`. */
export interface RangeClosestHandleInput {
  /** Pixel offset along the slider track of the pointer event. */
  readonly positionPx: number;
  /** Current range value (well-formed: `low <= high`). */
  readonly currentRange: RangeValue;
  /** Slider track length in pixels. */
  readonly trackSizePx: number;
  /** Minimum range value (inclusive). */
  readonly min: number;
  /** Maximum range value (inclusive). */
  readonly max: number;
}

/** Input to `computeRangeValueAtPosition`. */
export interface RangeValueAtPositionInput {
  /** Pixel offset along the slider track of the active pointer. */
  readonly positionPx: number;
  /** Which handle is being dragged. */
  readonly activeHandle: RangeHandle;
  /** Current range value (well-formed: `low <= high`). */
  readonly currentRange: RangeValue;
  /** Slider track length in pixels. */
  readonly trackSizePx: number;
  /** Minimum range value (inclusive). */
  readonly min: number;
  /** Maximum range value (inclusive). */
  readonly max: number;
  /** Discrete step for snapping. */
  readonly step: number;
}

/** Input to `computeRangeValueOnKey`. */
export interface RangeValueOnKeyInput {
  /** `KeyboardEvent.key` string. */
  readonly key: string;
  /** Which handle has keyboard focus. */
  readonly activeHandle: RangeHandle;
  /** Current range value (well-formed: `low <= high`). */
  readonly currentRange: RangeValue;
  /** Minimum range value (inclusive). */
  readonly min: number;
  /** Maximum range value (inclusive). */
  readonly max: number;
  /** Discrete step for ArrowKey increments. */
  readonly step: number;
  /**
   * Multiplier applied to `step` for `PageUp`/`PageDown`. Defaults
   * per `DEFAULT_SLIDER_LARGE_STEP_MULTIPLIER` from the slider
   * helpers. Values below 1 are clamped to 1 inside the underlying
   * `computeSliderValueOnKey` call.
   */
  readonly largeStepMultiplier?: number;
}

function clamp(value: number, lo: number, hi: number): number {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

/**
 * Resolve which range handle is closer to a pointer position on the
 * track.
 *
 * Algorithm:
 *
 * 1. Degenerate inputs (`trackSizePx <= 0` OR `max <= min`) return
 *    `'low'` (deterministic fallback per Decision C.1).
 * 2. Map `positionPx` to a value via the same arithmetic as
 *    `computeSliderPositionForValue`'s inverse:
 *    `valueAtPosition = min + clamp(positionPx / trackSizePx, 0, 1)
 *    * (max - min)`. Step snapping is NOT applied — closest-handle
 *    resolution operates on the raw click position, not the
 *    snapped value.
 * 3. Compute the midpoint `midpoint = (low + high) / 2`.
 * 4. `valueAtPosition < midpoint` ⇒ `'low'`; `valueAtPosition >
 *    midpoint` ⇒ `'high'`; equal ⇒ `'low'` (tie-break per
 *    Decision C.1).
 */
export function computeRangeClosestHandle(input: RangeClosestHandleInput): RangeHandle {
  const { positionPx, currentRange, trackSizePx, min, max } = input;
  if (trackSizePx <= 0 || max <= min) return 'low';
  const ratio = clamp(positionPx / trackSizePx, 0, 1);
  const valueAtPosition = min + ratio * (max - min);
  const midpoint = (currentRange.low + currentRange.high) / 2;
  if (valueAtPosition < midpoint) return 'low';
  if (valueAtPosition > midpoint) return 'high';
  return 'low';
}

/**
 * Resolve the new range value after dragging the active handle to
 * a new pointer position.
 *
 * Algorithm:
 *
 * 1. Delegate raw value derivation to `computeSliderValueAtPosition`
 * handles step snapping + position clamping +
 *    degenerate-input fallbacks.
 * 2. Apply overlap clamp per Decision B.1:
 *    - Active `'low'`: `newLow = clamp(rawValue, min, currentRange.high)`.
 *    - Active `'high'`: `newHigh = clamp(rawValue, currentRange.low, max)`.
 * 3. Return the updated range with the non-active handle preserved.
 *
 * Invariant: returned `low <= high`.
 */
export function computeRangeValueAtPosition(input: RangeValueAtPositionInput): RangeValue {
  const { positionPx, activeHandle, currentRange, trackSizePx, min, max, step } = input;
  const rawValue = computeSliderValueAtPosition({ positionPx, trackSizePx, min, max, step });
  if (activeHandle === 'low') {
    const newLow = clamp(rawValue, min, currentRange.high);
    return { low: newLow, high: currentRange.high };
  }
  const newHigh = clamp(rawValue, currentRange.low, max);
  return { low: currentRange.low, high: newHigh };
}

/**
 * Apply W3C ARIA APG Slider keyboard semantics to the active handle
 * of a dual-handle range, with overlap clamping.
 *
 * Algorithm:
 *
 * 1. Delegate single-handle key resolution to `computeSliderValueOnKey`
 * with the active handle's current value as
 *    `currentValue`.
 * 2. If the slider helper returns `null` (unrecognized key OR
 *    degenerate range), propagate `null` so the consumer's
 *    `onKeydown` falls through.
 * 3. Apply overlap clamp per Decision B.1 against the other handle's
 *    current value.
 * 4. Return the updated range with the non-active handle preserved.
 *
 * Invariant: returned `low <= high`.
 */
export function computeRangeValueOnKey(input: RangeValueOnKeyInput): RangeValue | null {
  const { key, activeHandle, currentRange, min, max, step, largeStepMultiplier } = input;
  const currentValue = activeHandle === 'low' ? currentRange.low : currentRange.high;
  // Conditional spread for `largeStepMultiplier` per
  // `exactOptionalPropertyTypes: true` — passing explicit
  // `undefined` violates the optional-vs-undefined distinction.
  const rawNewValue = computeSliderValueOnKey({
    key,
    currentValue,
    min,
    max,
    step,
    ...(largeStepMultiplier !== undefined ? { largeStepMultiplier } : {}),
  });
  if (rawNewValue == null) return null;
  if (activeHandle === 'low') {
    const newLow = clamp(rawNewValue, min, currentRange.high);
    return { low: newLow, high: currentRange.high };
  }
  const newHigh = clamp(rawNewValue, currentRange.low, max);
  return { low: currentRange.low, high: newHigh };
}

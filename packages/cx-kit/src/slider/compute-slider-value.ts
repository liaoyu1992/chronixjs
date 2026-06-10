/**
 * Default `PageUp` / `PageDown` step multiplier per W3C ARIA APG
 * Slider pattern (https://www.w3.org/WAI/ARIA/apg/patterns/slider/).
 * Consumer can override via `largeStepMultiplier` on
 * `computeSliderValueOnKey`. Values below 1 are clamped to 1 inside
 * the helper.
 */
export const DEFAULT_SLIDER_LARGE_STEP_MULTIPLIER = 10;

/** Input to `computeSliderValueAtPosition`. */
export interface SliderValueAtPositionInput {
  /** Pixel offset along the slider track (consumer projects pointer event clientX/clientY into this axis-agnostic value). */
  readonly positionPx: number;
  /** Slider track length in pixels. */
  readonly trackSizePx: number;
  /** Minimum slider value (inclusive). */
  readonly min: number;
  /** Maximum slider value (inclusive). */
  readonly max: number;
  /** Discrete step between snap points. Result is snapped to `min + N*step` where N is integer. */
  readonly step: number;
}

/** Input to `computeSliderPositionForValue`. */
export interface SliderPositionForValueInput {
  /** Current slider value. Clamped to `[min, max]` before mapping. */
  readonly value: number;
  /** Minimum slider value (inclusive). */
  readonly min: number;
  /** Maximum slider value (inclusive). */
  readonly max: number;
  /** Slider track length in pixels. */
  readonly trackSizePx: number;
}

/** Input to `computeSliderValueOnKey`. */
export interface SliderValueOnKeyInput {
  /** `KeyboardEvent.key` string (e.g. `'ArrowLeft'`, `'PageUp'`, `'Home'`). */
  readonly key: string;
  /** Current slider value before the key was pressed. */
  readonly currentValue: number;
  /** Minimum slider value (inclusive). */
  readonly min: number;
  /** Maximum slider value (inclusive). */
  readonly max: number;
  /** Discrete step for ArrowKey increments. */
  readonly step: number;
  /**
   * Multiplier applied to `step` for `PageUp`/`PageDown`. Defaults to
   * `DEFAULT_SLIDER_LARGE_STEP_MULTIPLIER` (= 10) per W3C ARIA APG.
   * Values below 1 are clamped to 1.
   */
  readonly largeStepMultiplier?: number;
}

function clamp(value: number, lo: number, hi: number): number {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

function isDegenerateRange(min: number, max: number, step: number): boolean {
  return max <= min || step <= 0;
}

/**
 * Map a pixel offset within the slider track to the corresponding
 * value, snapped to the nearest `step` increment + clamped to
 * `[min, max]`.
 *
 * Algorithm:
 *
 * 1. Degenerate inputs (`trackSizePx <= 0` OR `max <= min` OR
 *    `step <= 0`) ⇒ return `min` (no meaningful position-to-value
 *    mapping exists).
 * 2. Clamp `ratio = positionPx / trackSizePx` to `[0, 1]`. Negative
 *    positions (cursor before track start) clamp to 0; positions
 *    past the track end clamp to 1.
 * 3. Compute `rawValue = min + ratio * (max - min)`.
 * 4. Snap to nearest step: `snapped = min + round((rawValue - min) /
 *    step) * step`.
 * 5. Clamp to `[min, max]` (round-to-nearest at the max edge can
 *    produce snapped > max when `(max - min)` isn't a step multiple).
 */
export function computeSliderValueAtPosition(input: SliderValueAtPositionInput): number {
  const { positionPx, trackSizePx, min, max, step } = input;
  if (trackSizePx <= 0 || isDegenerateRange(min, max, step)) return min;
  const ratio = clamp(positionPx / trackSizePx, 0, 1);
  const rawValue = min + ratio * (max - min);
  const stepsFromMin = Math.round((rawValue - min) / step);
  const snapped = min + stepsFromMin * step;
  return clamp(snapped, min, max);
}

/**
 * Inverse mapping: returns the pixel offset where a thumb at `value`
 * should render. Unclamped to step (consumer may render a thumb at
 * a sub-step position during a drag-in-progress where the value
 * hasn't yet been committed).
 *
 * Algorithm:
 *
 * 1. Degenerate inputs (`trackSizePx <= 0` OR `max <= min`) ⇒ return
 *    `0` (no meaningful value-to-position mapping exists).
 * 2. Clamp `value` to `[min, max]`.
 * 3. Compute `ratio = (clamped - min) / (max - min)`.
 * 4. Return `ratio * trackSizePx`.
 *
 * The result is in the range `[0, trackSizePx]`.
 */
export function computeSliderPositionForValue(input: SliderPositionForValueInput): number {
  const { value, min, max, trackSizePx } = input;
  if (trackSizePx <= 0 || max <= min) return 0;
  const clamped = clamp(value, min, max);
  const ratio = (clamped - min) / (max - min);
  return ratio * trackSizePx;
}

/**
 * Apply W3C ARIA APG Slider keyboard semantics to derive a new
 * value from `currentValue` + a `KeyboardEvent.key` string.
 *
 * Recognized keys:
 *
 * | Key                       | Effect                                   |
 * | ------------------------- | ---------------------------------------- |
 * | `ArrowLeft` / `ArrowDown` | `currentValue - step`, clamped to `min`  |
 * | `ArrowRight` / `ArrowUp`  | `currentValue + step`, clamped to `max`  |
 * | `PageDown`                | `currentValue - largeStep`, clamped      |
 * | `PageUp`                  | `currentValue + largeStep`, clamped      |
 * | `Home`                    | `min`                                    |
 * | `End`                     | `max`                                    |
 *
 * `largeStep = step * max(1, largeStepMultiplier ??
 * DEFAULT_SLIDER_LARGE_STEP_MULTIPLIER)`. Multipliers below 1 clamp
 * to 1 so consumers can't accidentally configure a large-step
 * smaller than a single step.
 *
 * Returns `null` for any other key — consumer's `onKeydown` handler
 * can fall through to its default behavior. This null-on-unhandled
 * pattern mirrors chronix-table Phase 84's `useMenuKeyboardNav` so
 * consumers can chain keyboard handlers cleanly.
 *
 * Degenerate inputs (`max <= min` OR `step <= 0`) ⇒ return `null`
 * for all keys (no meaningful step semantic exists).
 */
export function computeSliderValueOnKey(input: SliderValueOnKeyInput): number | null {
  const { key, currentValue, min, max, step } = input;
  if (isDegenerateRange(min, max, step)) return null;
  const largeStepMultiplier = Math.max(
    1,
    input.largeStepMultiplier ?? DEFAULT_SLIDER_LARGE_STEP_MULTIPLIER,
  );
  const largeStep = step * largeStepMultiplier;

  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return clamp(currentValue - step, min, max);
    case 'ArrowRight':
    case 'ArrowUp':
      return clamp(currentValue + step, min, max);
    case 'PageDown':
      return clamp(currentValue - largeStep, min, max);
    case 'PageUp':
      return clamp(currentValue + largeStep, min, max);
    case 'Home':
      return min;
    case 'End':
      return max;
    default:
      return null;
  }
}

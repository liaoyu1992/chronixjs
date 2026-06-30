/**
 * Clamp a numeric input value to a `[min, max]` range and optionally
 * snap to the nearest multiple of `step` relative to `stepBase`.
 *
 * .
 *
 * Order of operations:
 *
 * 1. Non-finite input (NaN / ±Infinity) passes through untouched —
 *    callers should reject via `parseNumberInput` first if they want
 *    only finite values.
 * 2. If `step > 0`, snap to nearest `stepBase + n * step` for integer n.
 *    `stepBase` defaults to `min` if defined, else `0`.
 * 3. Clamp to `[min, max]` (each bound optional).
 *
 * Note: snapping happens BEFORE clamping. A value just outside the
 * range that snaps within range will be kept; a value that snaps
 * outside range will be clamped to the range boundary, even if that
 * boundary itself isn't a valid step. Consumers requiring strict
 * step adherence should pick `min` and `max` as multiples of `step`.
 */
export interface ClampNumberInputOptions {
  /** Lower bound (inclusive). Omit for no lower bound. */
  readonly min?: number;
  /** Upper bound (inclusive). Omit for no upper bound. */
  readonly max?: number;
  /**
   * Step interval. When `> 0`, snap value to nearest
   * `stepBase + n * step`. Omit or `<= 0` to skip snapping.
   */
  readonly step?: number;
  /**
   * Baseline for step snapping. Defaults to `min` when defined, else `0`.
   * Useful when the snap origin should differ from the range floor
   * (e.g. min=0, step=5, stepBase=2 produces snaps at 2, 7, 12, …).
   */
  readonly stepBase?: number;
}

export function clampNumberInput(value: number, options?: ClampNumberInputOptions): number {
  if (!Number.isFinite(value)) return value;
  const min = options?.min;
  const max = options?.max;
  const step = options?.step;
  let v = value;

  if (step !== undefined && step > 0) {
    const base = options?.stepBase ?? min ?? 0;
    const ticks = Math.round((v - base) / step);
    v = base + ticks * step;
    // Floating-point rounding artifacts: `0.1 + 0.2 = 0.30000000000000004`.
    // Round to a generous 12-decimal precision to absorb these without
    // affecting any realistic step value.
    v = Math.round(v * 1e12) / 1e12;
  }

  if (min !== undefined && v < min) v = min;
  if (max !== undefined && v > max) v = max;
  return v;
}

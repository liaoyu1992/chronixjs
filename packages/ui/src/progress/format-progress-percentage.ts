/**
 * Pure helper — convert a Progress `percentage` (optionally relative
 * to `max`) into a clamped numeric ratio + a display string. Phase 16
 * (2026-06-02). Shared across vue3 / vue2 / react adapters so the
 * `__fill` inline-style width AND the `__info` text always agree
 * (parity-by-construction).
 *
 * Contract:
 *
 * - `max` defaults to `100`. The ratio is `(value / max) * 100`.
 * - The ratio is clamped to `[0, 100]`. Negative / over-max values
 *   floor + cap.
 * - Non-finite `value` (`NaN` / `Infinity` / `-Infinity`) yields a
 *   `clamped: 0` + `display: '0%'` result. Consumers don't need to
 *   guard original.
 * - `display` rounds the clamped ratio to the nearest integer and
 *   suffixes `%`. (Sub-percent granularity is rare in Tier A; if a
 *   consumer needs decimals they can format their own info slot.)
 *
 * Used by `ChronixProgress` adapters; the `__fill` width style is
 * `width: ${clamped}%` and the `__info` text content is `display`.
 */
export interface FormattedProgressPercentage {
  /** Display string e.g. `"42%"`. Rounded to nearest integer. */
  readonly display: string;
  /**
   * Clamped numeric ratio in [0, 100]. NOT rounded — adapters apply
   * this directly to `style.width` so the bar tracks fractional
   * progress smoothly.
   */
  readonly clamped: number;
}

export function formatProgressPercentage(value: number, max?: number): FormattedProgressPercentage {
  const effectiveMax = max ?? 100;
  if (!Number.isFinite(value) || !Number.isFinite(effectiveMax) || effectiveMax === 0) {
    return { display: '0%', clamped: 0 };
  }
  const ratio = (value / effectiveMax) * 100;
  const clamped = Math.max(0, Math.min(100, ratio));
  return { display: `${Math.round(clamped)}%`, clamped };
}

/**
 * Pure helper — convert a Statistic `value` (+ optional precision)
 * into the display string. Phase 18 (2026-06-02). Shared across 3
 * adapters so the rendered text is byte-identical.
 *
 * Contract:
 *
 * - `value === undefined` → `STATISTIC_PLACEHOLDER` (`'-'`). Consumer
 *   signal that the metric is unavailable.
 * - String value → returned verbatim (consumer pre-formatted the
 *   value original; precision is ignored). Allows currencies,
 *   percentages, locale-aware strings the helper can't generate.
 * - Numeric `NaN` / `Infinity` / `-Infinity` → `STATISTIC_PLACEHOLDER`.
 *   Same "metric unknown" signal.
 * - Numeric + `precision === undefined` → `String(value)` (verbatim
 *   numeric stringification, no fixed-decimal padding).
 * - Numeric + `precision: N` → `value.toFixed(N)` (zero-padded
 *   fractional part). Negative precision is clamped to 0 to avoid
 *   `RangeError` from `.toFixed()` (which only accepts 0-100).
 */
export const STATISTIC_PLACEHOLDER = '-';

export function formatStatisticValue(
  value: number | string | undefined,
  precision: number | undefined,
): string {
  if (value === undefined) return STATISTIC_PLACEHOLDER;
  if (typeof value === 'string') return value;
  if (!Number.isFinite(value)) return STATISTIC_PLACEHOLDER;
  if (precision === undefined) return String(value);
  const safePrecision = Math.max(0, Math.min(100, Math.floor(precision)));
  return value.toFixed(safePrecision);
}

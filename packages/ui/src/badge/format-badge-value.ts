/**
 * Pure helper — convert a Badge `value` + optional `max` into the
 * display string the adapter renders into `cx-ui-badge__sup`.
 *
 * . Used by all 3 adapters so the truncation
 * semantics match exactly across vue3 / vue2 / react.
 *
 * Contract:
 *
 * - `undefined` / empty-string → empty string (caller may render
 *   nothing; this is the standalone-no-value case).
 * - Non-numeric string → returned verbatim (e.g. `'NEW'` → `'NEW'`).
 *   The 4-char display-width limit is the adapter CSS's concern, not
 *   ours.
 * - Numeric value ≤ `max` → stringified verbatim (`5`, `max=99` →
 *   `'5'`).
 * - Numeric value > `max` → `'${max}+'` (`999`, `max=99` → `'99+'`).
 * - `max` `undefined` → no truncation (numeric value rendered as-is).
 * - Negative numeric values are passed through (no special handling
 *   below zero; consumers needing zero-floor should clamp themselves).
 */
export function formatBadgeValue(
  value: number | string | undefined,
  max: number | undefined,
): string {
  if (value === undefined || value === '') return '';
  if (typeof value === 'string') return value;
  if (max === undefined) return String(value);
  if (value > max) return `${max}+`;
  return String(value);
}

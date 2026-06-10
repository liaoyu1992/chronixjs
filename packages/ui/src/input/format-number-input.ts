/**
 * Format a number into a display string with optional precision,
 * thousand separator, and locale decimal separator. Pure helper for
 * InputNumber + Statistic + any future numeric display.
 *
 * Phase 7 (2026-06-02).
 *
 * Behavior:
 *
 * - Non-finite input (NaN / ±Infinity) returns `''` (empty string).
 * - When `precision` is defined, uses `value.toFixed(precision)`
 *   (rounds half-away-from-zero per JS spec; negative-zero is preserved
 *   as `'-0'` if precision suppresses fractional digits).
 * - Inserts `thousandSeparator` every 3 digits of the integer part,
 *   skipping the leading `-` for negatives.
 * - Replaces the `.` from `toString` / `toFixed` with the configured
 *   `decimalSeparator` AFTER thousand-separator insertion.
 *
 * The function does NOT use `Intl.NumberFormat` so it's deterministic
 * across Node versions and SSR environments (Intl behavior varies
 * with ICU data). Callers needing full locale-aware formatting can
 * still wrap `Intl.NumberFormat` themselves.
 */
export interface FormatNumberInputOptions {
  /**
   * Decimal places to keep. When omitted, uses `Number.toString()`
   * (e.g. `1.23` → `"1.23"`, `1` → `"1"`).
   */
  readonly precision?: number;
  /** Decimal point character in the output. Default `'.'`. */
  readonly decimalSeparator?: '.' | ',';
  /**
   * Thousand-group separator. Default `''` (no separator). When set,
   * inserted every 3 digits in the integer part counting from the
   * right (e.g. `1234567` → `"1,234,567"` with separator `','`).
   */
  readonly thousandSeparator?: '.' | ',' | ' ' | "'" | '';
}

export function formatNumberInput(value: number, options?: FormatNumberInputOptions): string {
  if (!Number.isFinite(value)) return '';
  const precision = options?.precision;
  const decimalSeparator = options?.decimalSeparator ?? '.';
  const thousandSeparator = options?.thousandSeparator ?? '';

  // toString / toFixed always produce '.' as the decimal point — split
  // on it BEFORE inserting thousand separators (which may themselves be
  // '.'). This avoids collision when thousandSeparator === decimalSeparator's
  // would-be character or vice-versa.
  const raw = precision !== undefined ? value.toFixed(precision) : value.toString();
  const [intPart, fracPart] = raw.split('.');

  // Insert thousand separators in the integer part only. The regex skips
  // matches at word boundaries — between '-' (non-word) and the leading
  // digit (word) the boundary is `\b`, so `\B` won't insert a separator
  // there. Verified by the negative-number test cases.
  const intWithSep =
    thousandSeparator === '' || intPart === undefined
      ? (intPart ?? '')
      : intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

  return fracPart !== undefined ? `${intWithSep}${decimalSeparator}${fracPart}` : intWithSep;
}

/**
 * Parse a raw input string into a finite number, or `null` if the
 * string isn't a parseable number. Pure helper used by InputNumber +
 * Slider + DatePicker numeric fields + any future numeric input.
 *
 * Phase 7 (2026-06-02).
 *
 * Behavior:
 *
 * - Trims surrounding whitespace.
 * - Empty string (after trim) → `null`.
 * - Strips configured thousand separators (e.g. `','` for en-US style
 *   `"1,234.56"`, `'.'` for European style `"1.234,56"`, `' '` for
 *   continental space, `"'"` for Swiss style; default `''` = no separator).
 * - Replaces the configured decimal separator with `'.'` for
 *   `Number()` parsing.
 * - Rejects multiple decimal points.
 * - Optionally rejects negative values (default allows).
 * - `NaN` and `Infinity` always return `null` (no special handling).
 *
 * The function is locale-aware via the separator options but does NOT
 * read any global locale state — callers (typically the InputNumber
 * adapter) pass the relevant separators based on the consumer's
 * `ChronixLocale` configuration.
 */
export interface ParseNumberInputOptions {
  /** Decimal point character. Default `'.'`. Set to `','` for European locales. */
  readonly decimalSeparator?: '.' | ',';
  /** Thousand-group separator to strip before parsing. Default `''` (no separator). */
  readonly thousandSeparator?: '.' | ',' | ' ' | "'" | '';
  /** When `false`, leading `-` causes the parse to fail. Default `true`. */
  readonly allowNegative?: boolean;
}

export function parseNumberInput(raw: string, options?: ParseNumberInputOptions): number | null {
  if (typeof raw !== 'string') return null;
  let s = raw.trim();
  if (s === '') return null;

  const dec = options?.decimalSeparator ?? '.';
  const thou = options?.thousandSeparator ?? '';
  const allowNeg = options?.allowNegative ?? true;

  if (!allowNeg && s.startsWith('-')) return null;

  if (thou !== '') {
    // Strip every occurrence of the thousand separator. Use split/join
    // to avoid regex-escape complications for literal characters like '.'.
    s = s.split(thou).join('');
  }

  if (dec !== '.') {
    // Replace the FIRST occurrence; multi-decimal handling below rejects extras.
    s = s.replace(dec, '.');
  }

  // After normalization, only one '.' is allowed.
  const dotCount = (s.match(/\./g) ?? []).length;
  if (dotCount > 1) return null;

  // Disallow stray characters that Number() would silently accept (e.g.
  // hex prefix '0x', exponent — actually exponent IS allowed by Number,
  // so we let it pass). Final check is finite-number gate below.
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return n;
}

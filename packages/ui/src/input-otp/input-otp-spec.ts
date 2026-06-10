/**
 * InputOtp component IR — Phase 25 (2026-06-03). Tier B one-time-
 * password entry surface: N independent cells that share a single
 * controlled string value of length ≤ length.
 *
 * Value model: a single `string`. Adapter splits into N cells via
 * `buildOtpCells`. `complete` event fires when value.length === length.
 */

export interface InputOtpProps {
  readonly value: string;
  readonly length: number;
  readonly disabled: boolean;
  readonly error: string | undefined;
}

export const defaultInputOtpProps: InputOtpProps = {
  value: '',
  length: 6,
  disabled: false,
  error: undefined,
};

/**
 * Split the controlled string into N cells. Returns exactly `length`
 * items; unfilled trailing cells are `''`.
 *
 * Excess characters in `value` (beyond `length`) are dropped silently
 * — the adapter should clamp on input as well, but the helper is
 * tolerant so adapter tests don't have to pre-clamp.
 */
export function buildOtpCells(value: string, length: number): readonly string[] {
  if (length <= 0) return [];
  const cells: string[] = [];
  for (let i = 0; i < length; i++) {
    cells.push(value[i] ?? '');
  }
  return cells;
}

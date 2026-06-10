/**
 * Rate component IR — Phase 25 (2026-06-03). Tier B star-rating
 * surface. Supports half-star precision via `allowHalf` prop (~10
 * LOC CSS cost; common ergonomic ask).
 *
 * Pure helper `resolveRateStarState` returns the per-star render mode
 * given the current value + the star's 0-based index.
 */

export interface RateProps {
  readonly value: number;
  readonly count: number;
  readonly allowHalf: boolean;
  readonly disabled: boolean;
  readonly readonly: boolean;
  readonly error: string | undefined;
}

export const defaultRateProps: RateProps = {
  value: 0,
  count: 5,
  allowHalf: false,
  disabled: false,
  readonly: false,
  error: undefined,
};

export type RateStarState = 'empty' | 'half' | 'full';

/**
 * Resolve the fill state for the star at `index` (0-based).
 *
 * - star is `full` if `value >= index + 1`.
 * - star is `half` if `allowHalf && index < value < index + 1`
 *   (specifically: `value >= index + 0.5 && value < index + 1`).
 * - otherwise `empty`.
 *
 * When `allowHalf === false`, the helper rounds DOWN — a value of
 * 3.4 displays as 3 full stars + 2 empty, NOT half on the 4th. The
 * adapter is responsible for snapping the value to integers in that
 * mode (typical pattern: `Math.round(value)`).
 */
export function resolveRateStarState(
  index: number,
  value: number,
  allowHalf: boolean,
): RateStarState {
  if (value >= index + 1) return 'full';
  if (allowHalf && value >= index + 0.5) return 'half';
  return 'empty';
}

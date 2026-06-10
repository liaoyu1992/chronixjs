/**
 * Pure helper — convert a Grid `cols` prop into a CSS
 * `grid-template-columns` value string OR `undefined` (caller omits
 * the inline-style declaration). Phase 17 (2026-06-02).
 *
 * Contract:
 *
 * - `undefined` → `undefined` (caller omits inline style; consumer
 *   may supply via own CSS).
 * - Numeric value `N` → `repeat(N, minmax(0, 1fr))`. The
 *   `minmax(0, 1fr)` (vs bare `1fr`) prevents tracks from blowing
 *   out when child content is wider than the equal share — a common
 *   parity-bug-source in Grid implementations that just emit `1fr`.
 * - Non-positive numeric value (`0` / negative) → `undefined`.
 *   Emitting `repeat(0, ...)` produces empty templates which silently
 *   break Grid layout downstream; consumer using `cols={0}` likely
 *   meant "omit cols", so we collapse to the safer no-op.
 * - String value → returned verbatim (`'120px 1fr 120px'`,
 *   `'repeat(3, 200px)'`, `'subgrid'`, etc.). Empty string returns
 *   undefined (treat as no-op, same rationale as `cols=0`).
 */
export function resolveGridTracks(cols: number | string | undefined): string | undefined {
  if (cols === undefined) return undefined;
  if (typeof cols === 'number') {
    if (cols <= 0 || !Number.isFinite(cols)) return undefined;
    return `repeat(${cols}, minmax(0, 1fr))`;
  }
  if (cols === '') return undefined;
  return cols;
}

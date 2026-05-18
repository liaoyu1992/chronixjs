/**
 * Phase 28.2.1: derives the x-coordinate inside a bar where its
 * title text or progress-dot resize handle should anchor on one
 * side (left OR right). Three-way branch:
 *
 *   1. `isViewportClipped` → viewport-edge-locked (chronix-additive
 *      sub-case introduced by Phase 27.1; locks past the
 *      viewport-locked triangle's base).
 *   2. `isAxisClipped` → bar-edge-locked with triangle cushion
 *      (Phase 27 sub-case; mirrors k-ui's
 *      `x + triangleMargin + triangleSize + N` formula).
 *   3. default → `renderEdge ± defaultInset` (Phase 28.2 / 28.1
 *      pre-clipping path).
 *
 * Pure function — no Vue reactivity, no DOM. Consumer (the per-bar
 * flatMap closure) supplies all inputs from already-computed
 * locals: `renderEdge` is the bar's content-coord left or right
 * edge after drag adjustments; `viewportLockedApex` is the Phase
 * 27.1 helper's output for the matching side (already includes
 * `triangleMargin` from the visible viewport edge).
 *
 * Precedence: viewport-clipped wins when both sub-cases fire on
 * the same side. Mirrors the parity reference's first-branch-wins
 * logic at TimelineEvent.tsx:577-587 / 590-600.
 *
 * Per-consumer constants differ:
 *
 *   | consumer    | defaultInset | consumerGap |
 *   | ----------- | ------------ | ----------- |
 *   | title-left  | 8            | 4           |
 *   | title-right | 4            | 4           |
 *   | dot-left    | 1            | 2           |
 *   | dot-right   | 1            | 2           |
 *
 * (`consumerGap` corresponds to `TITLE_TRIANGLE_GAP` or
 * `DOT_TRIANGLE_GAP` in the adapter; the helper takes it as a
 * parameter to stay decoupled from `chronix-gantt.ts`'s file-level
 * constants.)
 *
 * Note on the viewport-clipped formula: `viewportLockedApex` from
 * Phase 27.1 is `scrollLeft + triangleMargin` (left) or
 * `scrollLeft + clientWidth - triangleMargin` (right). The
 * triangle's base extends `triangleSize` further inside the
 * visible area from the apex; the helper adds another
 * `consumerGap` to clear the base. So the total inset from the
 * visible viewport edge is `triangleMargin + triangleSize +
 * consumerGap` — `triangleMargin` is baked into the apex; the
 * helper adds `triangleSize + consumerGap`.
 */
export type EdgeSide = 'start' | 'end';

export function deriveEdgePaddedX(
  side: EdgeSide,
  renderEdge: number,
  viewportLockedApex: number,
  isAxisClipped: boolean,
  isViewportClipped: boolean,
  defaultInset: number,
  triangleMargin: number,
  triangleSize: number,
  consumerGap: number,
): number {
  if (isViewportClipped) {
    return side === 'start'
      ? viewportLockedApex + triangleSize + consumerGap
      : viewportLockedApex - triangleSize - consumerGap;
  }
  if (isAxisClipped) {
    return side === 'start'
      ? renderEdge + triangleMargin + triangleSize + consumerGap
      : renderEdge - triangleMargin - triangleSize - consumerGap;
  }
  return side === 'start' ? renderEdge + defaultInset : renderEdge - defaultInset;
}

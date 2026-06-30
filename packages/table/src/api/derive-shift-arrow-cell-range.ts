import type { CellRange, CellRef } from './compute-cell-range-envelope.js';

/**
 * pure routing helper for shift+arrow cell-range
 * extension. Given the current cell-range (if any), the current
 * activeCell (if any), and the newly-navigated-to cell, returns the
 * `CellRange` the adapter should write.
 *
 * **Anchor source** (Decision A.1):
 * - When `currentRange` is non-null, KEEP its existing anchor + update
 *   focus to `newActive`. This lets the user keep extending in any
 *   direction from the same anchor across consecutive shift+arrows.
 * - When `currentRange` is null AND `activeCell` is non-null, use
 *   `activeCell` as the anchor + `newActive` as the focus. This is the
 *   "first shift+arrow opens a session" case.
 * - When BOTH are null, use `newActive` for both anchor + focus
 *   (degenerate 1x1 range; the keyboard handler would already have
 *   initialized activeCell to top-left in the same tick via the
 *   initial-focus shortcut, so this branch is rarely hit in practice but
 *   makes the function total over its input domain).
 *
 * Pure function. No DOM. No side effects.
 *
 * chronix-NEW (original grids couple shift+arrow extension to internal
 * SelectionExtender / RangeController classes that combine the
 * routing + DOM updates; the pure-function shape with input refs +
 * output CellRange is chronix's own posture, matching the
 * `computeNextActiveCell` + `computeScrollIntoView` precedents).
 */
export function deriveShiftArrowCellRange(
  currentRange: CellRange | null,
  activeCell: CellRef | null,
  newActive: CellRef,
): CellRange {
  if (currentRange != null) {
    return { anchor: currentRange.anchor, focus: newActive };
  }
  const anchor = activeCell ?? newActive;
  return { anchor, focus: newActive };
}

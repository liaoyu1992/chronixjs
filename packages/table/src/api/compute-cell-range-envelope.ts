/**
 * Phase 16 (2026-05-26): rectangular cell-range primitive types + pure
 * envelope resolver.
 *
 * Stores a 2D cell range as the pair `{ anchor, focus }` — the two
 * corner cells that uniquely define a rectangle in (rowId × colId)
 * space. The full rectangle (`{ rowIds, colIds }`) is derived on
 * demand via `computeCellRangeEnvelope` against the current display
 * order. This shape preserves Excel-style shift+click-extend semantics
 * (extend the focus, never the anchor) without losing canonicality
 * after multiple extends — see PHASE_16_DESIGN Decision B.1.
 */

/** A single cell's identity in (rowId, colId) space. */
export interface CellRef {
  readonly rowId: string;
  readonly colId: string;
}

/**
 * A rectangular cell range, identified by its two anchor + focus
 * corner cells. Order-independent: `{anchor: r1c1, focus: r3c3}` and
 * `{anchor: r3c3, focus: r1c1}` resolve to the same envelope.
 */
export interface CellRange {
  readonly anchor: CellRef;
  readonly focus: CellRef;
}

/**
 * The expanded form of a `CellRange`: the inclusive list of rowIds +
 * colIds covered by the rectangle. Rows + cols are returned in display
 * order (top-down + left-right respectively), regardless of which
 * corner was the anchor.
 */
export interface CellRangeEnvelope {
  readonly rowIds: readonly string[];
  readonly colIds: readonly string[];
}

/**
 * Phase 16 (2026-05-26): resolve a `CellRange` against the current
 * display order, producing the inclusive `{rowIds, colIds}` rectangle.
 *
 * Display order is the post-filter + post-sort + post-page slice
 * (`pagedRows`) on the row axis + `visibleColumns` on the column axis.
 * The range NEVER includes cells outside the displayed grid — the
 * defensive empty-on-stale-anchor branch matches `computeRangeRowIds`
 * (Phase 10.1) so that callers can treat "the range I observed last
 * frame may no longer be valid after a filter mutation" uniformly.
 *
 * Order-independent: if the anchor sits BELOW or to the RIGHT of the
 * focus, the result still reads top-down + left-right, not anchor-to-
 * focus direction. This matches Excel's "envelope always reads in
 * display order" rule.
 *
 * Defensive: if any of the 4 ids (anchor.rowId / focus.rowId /
 * anchor.colId / focus.colId) is missing from the displayed grid, the
 * function returns an empty envelope `{ rowIds: [], colIds: [] }`. The
 * caller (SFC) treats empty as "no-op range" and falls through to its
 * own re-anchoring logic on the next pointer gesture.
 *
 * **Pure function.** No side effects.
 */
export function computeCellRangeEnvelope(
  range: CellRange,
  displayedRowIds: readonly string[],
  displayedColIds: readonly string[],
): CellRangeEnvelope {
  if (displayedRowIds.length === 0 || displayedColIds.length === 0) {
    return EMPTY_CELL_RANGE_ENVELOPE;
  }

  const anchorRowIdx = displayedRowIds.indexOf(range.anchor.rowId);
  if (anchorRowIdx < 0) return EMPTY_CELL_RANGE_ENVELOPE;
  const focusRowIdx = displayedRowIds.indexOf(range.focus.rowId);
  if (focusRowIdx < 0) return EMPTY_CELL_RANGE_ENVELOPE;

  const anchorColIdx = displayedColIds.indexOf(range.anchor.colId);
  if (anchorColIdx < 0) return EMPTY_CELL_RANGE_ENVELOPE;
  const focusColIdx = displayedColIds.indexOf(range.focus.colId);
  if (focusColIdx < 0) return EMPTY_CELL_RANGE_ENVELOPE;

  const rowLo = Math.min(anchorRowIdx, focusRowIdx);
  const rowHi = Math.max(anchorRowIdx, focusRowIdx);
  const colLo = Math.min(anchorColIdx, focusColIdx);
  const colHi = Math.max(anchorColIdx, focusColIdx);

  return {
    rowIds: displayedRowIds.slice(rowLo, rowHi + 1),
    colIds: displayedColIds.slice(colLo, colHi + 1),
  };
}

/**
 * Phase 16: shared empty-envelope constant. Identity-stable so that
 * downstream `computed` derivations can skip re-render when the
 * envelope is "no range" — referential equality holds.
 */
export const EMPTY_CELL_RANGE_ENVELOPE: CellRangeEnvelope = {
  rowIds: [],
  colIds: [],
};

/**
 * Phase 44 (2026-05-29): resolved drop target for an in-flight
 * row-drag-reorder session. Produced by `getRowDropTarget` on every
 * `pointermove` during a drag session, consumed by the SFC's
 * drop-indicator render (the 2px horizontal line at the candidate
 * above/below boundary) + by the `row-order-change` emit's payload
 * when the drag commits.
 *
 * Decision C.1: the indicator renders at the boundary either ABOVE
 * or BELOW the row the cursor is currently over — the side is chosen
 * by which half (top vs. bottom) of the target row the cursor is in.
 * This mirrors the universal file-manager / task-list reorder
 * convention (drag to the upper half drops "above"; lower half drops
 * "below"). Cross-axis equivalent of Phase 14 column move's
 * before/after.
 */
export interface RowDropTarget {
  readonly targetRowId: string;
  readonly position: 'above' | 'below';
}

/**
 * Phase 44 (2026-05-29): rect data for a single body row. The adapter
 * measures DOM via `getBoundingClientRect()` then passes
 * `{ top, bottom }` per visible row id. Kept as a separate type (not
 * just `DOMRect`) so the helper stays framework-agnostic + the test
 * suite can pass plain literals.
 */
export interface RowRect {
  readonly top: number;
  readonly bottom: number;
}

/**
 * Phase 44 (2026-05-29): optional Set filter for `getRowDropTarget`.
 * When `pinnedRowIds` is supplied, the resolver skips those rows from
 * its hit-test loop — pinned rows are sticky-by-design (Phase 31) and
 * must not be drop targets per Decision D.1.
 *
 * The set is a `ReadonlySet<string>` of row ids whose `RowSpec.pinned`
 * is truthy. Adapters typically build it once per render from the
 * union of `topPinnedRows.map(r => r.id)` and `bottomPinnedRows.map(r
 * => r.id)`. Omitting the option is equivalent to passing an empty Set
 * (pinned-row exclusion handled separately at the source-prevention
 * gate — no drag-start fires on pinned rows).
 */
export interface GetRowDropTargetOptions {
  readonly pinnedRowIds?: ReadonlySet<string>;
}

/**
 * Phase 44 (2026-05-29): resolve the candidate drop target for a
 * row-drag-reorder session given the current `pointerClientY`. Iterates
 * the supplied row-rect map, skipping `excludeRowId` (the row being
 * dragged never drops onto itself) plus any pinned rows passed via
 * `options.pinnedRowIds`, and:
 *
 * 1. Finds the row whose `[top, bottom]` vertical range contains
 *    `pointerClientY`.
 * 2. Splits the row at its vertical midpoint to decide `position`:
 *    `pointerClientY < midpoint` → `'above'`,
 *    `pointerClientY >= midpoint` → `'below'`.
 * 3. Returns `null` when the pointer is outside every row's vertical
 *    range (typical when the cursor drags above the first row, below
 *    the last row, between rows in a gap, or off-screen) — the SFC
 *    renders no drop indicator in this state.
 *
 * The caller (adapter SFC) supplies row rects in `clientY` coordinates
 * (i.e. `getBoundingClientRect().top` / `.bottom`); `pointerClientY` is
 * the live `PointerEvent.clientY`. Pure function — no DOM access.
 *
 * Mirrors `getColumnDropTarget` (Phase 14) on the Y-axis, with the
 * pinned-row option playing the same role as Phase 18's
 * `pinnedZoneByColId` extension.
 */
export function getRowDropTarget(
  pointerClientY: number,
  rowRectsByRowId: ReadonlyMap<string, RowRect>,
  excludeRowId: string,
  options?: GetRowDropTargetOptions,
): RowDropTarget | null {
  const pinnedRowIds = options?.pinnedRowIds;
  for (const [rowId, rect] of rowRectsByRowId) {
    if (rowId === excludeRowId) continue;
    if (pinnedRowIds?.has(rowId) === true) continue;
    if (pointerClientY < rect.top || pointerClientY >= rect.bottom) continue;
    const midpoint = (rect.top + rect.bottom) / 2;
    return {
      targetRowId: rowId,
      position: pointerClientY < midpoint ? 'above' : 'below',
    };
  }
  return null;
}

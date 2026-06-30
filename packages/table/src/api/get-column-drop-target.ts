/**
 * resolved drop target for an in-flight column-
 * move drag. Produced by `getColumnDropTarget` on every `pointermove`
 * during a drag session, consumed by the SFC's drop-indicator render
 * (the 2px vertical line at the candidate boundary) + by the
 * `column-order-change` emit's payload when the drag commits.
 *
 * Decision B.1: the indicator renders at the boundary either BEFORE
 * or AFTER the cell the cursor is currently over — the side is chosen
 * by which half (left vs. right) of the target cell the cursor is in.
 * This mirrors the universal data-grid + file-manager convention
 * (drag to the left half of a cell drops "before"; right half drops
 * "after").
 */
export interface ColumnDropTarget {
  readonly targetColId: string;
  readonly position: 'before' | 'after';
}

/**
 * rect data for a single header cell. The
 * vue3 adapter measures DOM via `getBoundingClientRect()` then passes
 * `{ left, right }` per visible column id. Kept as a separate type
 * (not just `DOMRect`) so the helper stays framework-agnostic + the
 * test suite can pass plain literals.
 */
export interface ColumnHeaderRect {
  readonly left: number;
  readonly right: number;
}

/**
 * optional zone filter for `getColumnDropTarget`.
 * When `pinnedZoneByColId` is supplied, the resolver only emits drop
 * targets whose zone matches the moved column's zone — cross-zone
 * drops become silent no-ops (no indicator + no commit). When the
 * option is omitted, the helper behaves identically to its
 * form (fully backward-compatible).
 *
 * The map is keyed by column id; the value is the column's
 * `pinned` IR field (`'left'` / `'right'` / `null`). Missing entries
 * are treated as `null` (center zone) — defensive default for
 * adapters that build the map from a subset of `visibleColumns`.
 */
export interface GetColumnDropTargetOptions {
  readonly pinnedZoneByColId?: ReadonlyMap<string, 'left' | 'right' | null>;
}

/**
 * resolve the candidate drop target for a
 * column-move drag given the current `pointerClientX`. Iterates the
 * supplied header-cell rect map, skipping `excludeColId` (the column
 * being dragged never drops onto itself), and:
 *
 * 1. Finds the cell whose `[left, right]` horizontal range contains
 *    `pointerClientX`.
 * 2. Splits the cell at its horizontal midpoint to decide
 *    `position`: `pointerClientX < midpoint` → `'before'`,
 *    `pointerClientX >= midpoint` → `'after'`.
 * 3. Returns `null` when the pointer is outside every cell's
 *    horizontal range (typical when the cursor drags above / below
 *    the header row or off-screen) — the SFC renders no drop
 *    indicator in this state.
 *
 * The caller (vue3 SFC) supplies cell rects in `clientX` coordinates
 * (i.e. `getBoundingClientRect().left` / `.right`); `pointerClientX`
 * is the live `PointerEvent.clientX`. Pure function — no DOM access.
 *
 * when `options.pinnedZoneByColId` is supplied,
 * candidate cells whose zone differs from the moved column's zone are
 * skipped (treated like `excludeColId` — `continue`). This closes
 * parked cross-zone reorder item: dragging a left-pinned
 * column over a center / right-pinned target yields `null` instead of
 * a meaningless drop target that the consumer would mirror but
 * `pinnedColsPass` would re-partition right back. When the option is
 * omitted, behavior is unchanged.
 */
export function getColumnDropTarget(
  pointerClientX: number,
  headerCellRectsByColId: ReadonlyMap<string, ColumnHeaderRect>,
  excludeColId: string,
  options?: GetColumnDropTargetOptions,
): ColumnDropTarget | null {
  const zoneByColId = options?.pinnedZoneByColId;
  const movedZone = zoneByColId != null ? (zoneByColId.get(excludeColId) ?? null) : null;
  for (const [colId, rect] of headerCellRectsByColId) {
    if (colId === excludeColId) continue;
    if (zoneByColId != null) {
      const targetZone = zoneByColId.get(colId) ?? null;
      if (targetZone !== movedZone) continue;
    }
    if (pointerClientX < rect.left || pointerClientX >= rect.right) continue;
    const midpoint = (rect.left + rect.right) / 2;
    return {
      targetColId: colId,
      position: pointerClientX < midpoint ? 'before' : 'after',
    };
  }
  return null;
}

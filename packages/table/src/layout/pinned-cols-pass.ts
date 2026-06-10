import type { ColumnSpec } from '../ir/index.js';

/**
 * Input to `pinnedColsPass`.
 *
 * `visibleColumns` is `columnLayoutPass`'s `visibleColumns` output —
 * post-`hide` filter, in author order. `widthByColId` is the
 * pixel-resolved width map from the same original pass. The pinning
 * pass is purely positional: it does not re-resolve widths, only
 * decides which cells stick to which edge and how far they're offset
 * from it.
 */
export interface PinnedColsInput {
  /** Author-order visible columns from `columnLayoutPass`. */
  readonly visibleColumns: readonly ColumnSpec[];

  /** Map of `column.id` → resolved pixel width from `columnLayoutPass`. */
  readonly widthByColId: Readonly<Record<string, number>>;
}

/**
 * Output of `pinnedColsPass`.
 *
 * The adapter spreads these into per-cell inline styles + class
 * names. Cells whose `colId` is absent from `leftOffsetByColId` /
 * `rightOffsetByColId` are "center" cells and get no sticky
 * positioning.
 *
 * **Author order is preserved within each zone.** A left-pinned
 * column at visible index 2 and another at visible index 0 land in
 * `leftPinnedColIds` as `[idAt0, idAt2]`; the cumulative offsets
 * accumulate in that order. The DOM never reorders columns; the
 * adapter renders cells in `visibleColumns` order and merely shifts
 * the pinned ones with `position: sticky`.
 *
 * `leftPinnedTotalWidth` + `rightPinnedTotalWidth` let the adapter
 * shift the optional selection-rail's own sticky offset (when the
 * rail is on the same side) so the rail sits OUTSIDE the pinned
 * zones, not under them.
 */
export interface PinnedColsResult {
  /**
   * Sticky-left offset (in pixels) for each left-pinned column's
   * cell. Cumulative across left-pinned columns in author order.
   * For the first left-pinned column the value is `0`; for the
   * second it's the first's width; for the third it's the sum of
   * the first two; etc. Non-left-pinned cols are absent.
   */
  readonly leftOffsetByColId: Readonly<Record<string, number>>;

  /**
   * Sticky-right offset (in pixels) for each right-pinned column's
   * cell. Cumulative in **reverse** author order — the rightmost
   * right-pinned column gets `0`; the one to its left gets that
   * one's width; etc. Non-right-pinned cols are absent.
   */
  readonly rightOffsetByColId: Readonly<Record<string, number>>;

  /** Sum of widths across all left-pinned columns. */
  readonly leftPinnedTotalWidth: number;

  /** Sum of widths across all right-pinned columns. */
  readonly rightPinnedTotalWidth: number;

  /** Left-pinned column ids in author order. */
  readonly leftPinnedColIds: readonly string[];

  /** Center (non-pinned) column ids in author order. */
  readonly centerColIds: readonly string[];

  /** Right-pinned column ids in author order. */
  readonly rightPinnedColIds: readonly string[];
}

/**
 * Empty result. The adapter falls back to this when no columns are
 * pinned so the per-render code path doesn't need to allocate a
 * fresh empty record each frame.
 */
export const EMPTY_PINNED_COLS_RESULT: PinnedColsResult = {
  leftOffsetByColId: {},
  rightOffsetByColId: {},
  leftPinnedTotalWidth: 0,
  rightPinnedTotalWidth: 0,
  leftPinnedColIds: [],
  centerColIds: [],
  rightPinnedColIds: [],
};

/**
 * Partition visible columns into left-pinned / center / right-pinned
 * zones and compute the cumulative sticky offset for each pinned
 * cell.
 *
 * Algorithm:
 *
 * 1. **Classify** each visible column by `col.pinned`:
 *    - `'left'` → left-pinned zone
 *    - `'right'` → right-pinned zone
 *    - `null` / `undefined` → center zone
 *    Author order is preserved within each zone.
 *
 * 2. **Walk left-pinned forward**, accumulating a running pixel
 *    count. The first left-pinned column gets offset `0`; each
 *    subsequent left-pinned column gets the running count BEFORE
 *    its width is added. After the walk, the running count equals
 *    `leftPinnedTotalWidth`.
 *
 * 3. **Walk right-pinned in reverse**, doing the symmetric walk:
 *    the rightmost right-pinned column gets offset `0`; each
 *    column moving leftward gets the running count BEFORE its
 *    width is added.
 *
 * 4. **Read widths from `widthByColId`.** A missing entry (defensive
 *    fallback for columns hidden between `columnLayoutPass` and
 *    this pass) is treated as `0` width — the cumulative offset
 *    skips ahead.
 *
 * 5. Return offset maps + totals + per-zone colId lists.
 *
 * Pure function. No DOM. No side effects. Sister of `columnLayoutPass`
 * — same flat-record-in / readonly-record-out shape.
 */
export function pinnedColsPass(input: PinnedColsInput): PinnedColsResult {
  const leftPinned: ColumnSpec[] = [];
  const center: ColumnSpec[] = [];
  const rightPinned: ColumnSpec[] = [];
  for (const col of input.visibleColumns) {
    if (col.pinned === 'left') {
      leftPinned.push(col);
    } else if (col.pinned === 'right') {
      rightPinned.push(col);
    } else {
      center.push(col);
    }
  }

  // Fast path: no pinned columns → reuse the shared empty result.
  if (leftPinned.length === 0 && rightPinned.length === 0) {
    return {
      ...EMPTY_PINNED_COLS_RESULT,
      centerColIds: center.map((c) => c.id),
    };
  }

  const leftOffsetByColId: Record<string, number> = {};
  let runningLeftPx = 0;
  for (const col of leftPinned) {
    leftOffsetByColId[col.id] = runningLeftPx;
    runningLeftPx += input.widthByColId[col.id] ?? 0;
  }

  const rightOffsetByColId: Record<string, number> = {};
  let runningRightPx = 0;
  for (let i = rightPinned.length - 1; i >= 0; i--) {
    const col = rightPinned[i]!;
    rightOffsetByColId[col.id] = runningRightPx;
    runningRightPx += input.widthByColId[col.id] ?? 0;
  }

  return {
    leftOffsetByColId,
    rightOffsetByColId,
    leftPinnedTotalWidth: runningLeftPx,
    rightPinnedTotalWidth: runningRightPx,
    leftPinnedColIds: leftPinned.map((c) => c.id),
    centerColIds: center.map((c) => c.id),
    rightPinnedColIds: rightPinned.map((c) => c.id),
  };
}

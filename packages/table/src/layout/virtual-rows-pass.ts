import type { RowSpec } from '../ir/index.js';

/**
 * Default overscan: render N extra rows above + below the visible
 * window so scroll-driven row mounts don't pop in at the edge.
 * Matches the conventional data-grid default of 3.
 */
const DEFAULT_OVERSCAN = 3;

/**
 * Input to `virtualRowsPass`.
 *
 * Consumers pass row metadata from `rowLayoutPass` (`rowYByRowId` +
 * `rowHeightByRowId`) plus the viewport's current scroll + size.
 * The pass returns the subset of rows whose `[y, y+h)` intersects
 * `[viewportScrollTop, viewportScrollTop + viewportHeight)` plus an
 * `overscan` row buffer above + below.
 *
 * Phase 4 design: kept independent of `rowLayoutPass` (rather than
 * composed into a single combined pass) so consumers can re-window
 * on scroll without re-running the layout pass — `rowLayoutPass`
 * changes only when `rows` / `defaultRowHeight` / `heightHint`
 * change; `virtualRowsPass` re-runs on every scroll + resize.
 */
export interface VirtualRowsInput {
  /** Full row list in display order; matches `RowLayoutResult.visibleRows`. */
  readonly rows: readonly RowSpec[];

  /** Per-row top-edge Y; matches `RowLayoutResult.rowYByRowId`. */
  readonly rowYByRowId: Readonly<Record<string, number>>;

  /** Per-row height; matches `RowLayoutResult.rowHeightByRowId`. */
  readonly rowHeightByRowId: Readonly<Record<string, number>>;

  /** Scroll offset in pixels from the top of the body content layer. */
  readonly viewportScrollTop: number;

  /** Visible body height in pixels (the scrollport's `clientHeight`). */
  readonly viewportHeight: number;

  /**
   * Optional buffer of N extra rows rendered above + below the
   * visible window so scroll-driven row mounts don't pop in at the
   * edge. Defaults to 3. Set to 0 to disable.
   */
  readonly overscan?: number;
}

/**
 * Output of `virtualRowsPass`.
 *
 * `visibleRows` is the pre-sliced subset of input rows in the same
 * order. The adapter iterates this directly — no further slicing
 * needed.
 *
 * `firstRenderedIndex` + `lastRenderedIndex` are inclusive indices
 * into the FULL input `rows` array (post-overscan range). Empty
 * result is `-1 / -1 / []`.
 */
export interface VirtualRowsResult {
  /** Rows to render this frame: subset of input + overscan. */
  readonly visibleRows: readonly RowSpec[];

  /** Inclusive index into input `rows` of the first rendered row. `-1` when empty. */
  readonly firstRenderedIndex: number;

  /** Inclusive index into input `rows` of the last rendered row. `-1` when empty. */
  readonly lastRenderedIndex: number;
}

const EMPTY: VirtualRowsResult = {
  visibleRows: [],
  firstRenderedIndex: -1,
  lastRenderedIndex: -1,
};

/**
 * Resolve the visible row window for a given viewport scroll + height.
 *
 * Algorithm (mirrors chronix-gantt's `defaultVirtualizedPaneLayout`
 * strip-range computation):
 *
 * 1. **Trivial empties** — empty `rows` OR `viewportHeight <= 0`
 *    returns `EMPTY` (typical pre-mount frame: composable hasn't
 *    observed the body element yet so `clientHeight = 0`).
 * 2. **Compute the visible window** `[yTop, yBottom) = [scrollTop,
 *    scrollTop + viewportHeight)`.
 * 3. **Linear scan** rows in input order; a row is visible iff
 *    `row.y + row.height > yTop AND row.y < yBottom`.
 *    Tie-handling: a row whose bottom edge equals `yTop` is OUT
 *    (sits in the row above the viewport); a row whose top edge
 *    equals `yBottom` is OUT (sits in the row below). Same tie
 *    semantics as chronix-gantt's strip-range pass.
 * 4. **Early exit** — once a row's top `y >= yBottom`, rows are
 *    sorted by Y so no subsequent row can be visible. Break.
 * 5. **Apply overscan** — expand `[first, last]` by `overscan` on
 *    each side, clamped to `[0, rows.length - 1]`.
 * 6. **Pre-slice** the visible array + return with indices.
 *
 * **Linear scan O(N)** — chronix-gantt's analog uses the same
 * approach since practical row counts are small (typically ≤
 * ~10000; cache locality + branch prediction make linear scan
 * faster than binary-search overhead until ~100k+ rows). Switch to
 * binary search if a downstream phase hits that scale.
 */
export function virtualRowsPass(input: VirtualRowsInput): VirtualRowsResult {
  const { rows, rowYByRowId, rowHeightByRowId, viewportScrollTop, viewportHeight } = input;
  if (rows.length === 0 || viewportHeight <= 0) return EMPTY;

  const overscan = Math.max(0, input.overscan ?? DEFAULT_OVERSCAN);
  const yTop = viewportScrollTop;
  const yBottom = viewportScrollTop + viewportHeight;

  let firstIndex = -1;
  let lastIndex = -1;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (!row) continue;
    const rowY = rowYByRowId[row.id] ?? 0;
    const rowH = rowHeightByRowId[row.id] ?? 0;
    const rowBottom = rowY + rowH;
    if (rowBottom <= yTop) continue; // entirely above viewport
    if (rowY >= yBottom) break; // entirely below — rows sorted by Y
    if (firstIndex === -1) firstIndex = i;
    lastIndex = i;
  }

  if (firstIndex === -1) return EMPTY;

  const firstRenderedIndex = Math.max(0, firstIndex - overscan);
  const lastRenderedIndex = Math.min(rows.length - 1, lastIndex + overscan);
  const visibleRows = rows.slice(firstRenderedIndex, lastRenderedIndex + 1);

  return { visibleRows, firstRenderedIndex, lastRenderedIndex };
}

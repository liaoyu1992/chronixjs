import {
  columnLayoutPass,
  filterPass,
  pagePass,
  pinnedRowsPass,
  quickFindPass,
  rowLayoutPass,
  sortPass,
  synthesizeLazyChildren,
  treeFlattenPass,
  virtualRowsPass,
  type ColumnSpec,
  type FilterSpec,
  type HeaderCell,
  type RowSpec,
  type SortSpec,
} from '@chronixjs/table';
import { useMemo } from 'react';

/**
 * + 48.1 (2026-05-25): React hook that wraps the chronix-
 * table core's `columnLayoutPass` (/ vue3) +
 * `rowLayoutPass` (/ vue3) + `virtualRowsPass`
 * (/ vue3) + materializes the flat-header
 * `HeaderCell[]` the SFC binds to the header row.
 *
 * Hooks own no DOM and no pointer state — they output the same
 * shapes the core's pass methods would, returned as plain values
 * (NOT `ComputedRef` wrappers). Interactions wire separately in
 * later phases (per-phase hook additions mirror vue3's progression
 * onward — sort / filter / pagination join this hook).
 *
 * + 48.1 ships flat headers only (`depth = 0` / `span = 1`);
 * the nested column groups dimension lands later if/when
 * `ColumnGroupSpec` extends the IR (parked at the vue3 level too).
 *
 * Decision C.1 — One `useMemo` per pass + a second `useMemo` for the
 * headerCells map. React's memo-by-deps model replaces vue3's
 * per-field `ComputedRef`s; consumers read `layout.widthByColId[id]`
 * directly without `.value`.
 */
export interface UseTableLayoutInput {
  /** Visible + hidden columns; the pass filters `hide: true` internally. */
  readonly columns: readonly ColumnSpec[];
  /** Horizontal pixel budget for column distribution. Typically the wrapper's `clientWidth`. */
  readonly containerWidth: number;
  /**
   * Default width for columns that declare neither `width` nor `flex`.
   * Sourced from the merged theme; the SFC always passes
   * `theme.defaultColumnWidth`.
   */
  readonly defaultColumnWidth: number;
  /**
   * Lower clamp for column widths when a column omits its own
   * `minWidth`. Sourced from the merged theme.
   */
  readonly defaultMinColumnWidth: number;
  /**
   * (vue3): rows in display order. Drives
   * `rowLayoutPass` for per-row Y positions + heights. Optional
   * for backward compat with callers; empty array is the
   * neutral default.
   */
  readonly rows?: readonly RowSpec[];
  /**
   * (vue3): uniform per-row height in pixels.
   * Sourced from the merged theme's `rowHeight`. Per-row overrides
   * come from each `RowSpec.heightHint`. Defaults to 28 internally
   * to match `defaultChronixTableTheme.rowHeight`.
   */
  readonly defaultRowHeight?: number;
  /**
   * (vue3): body scrollport's `scrollTop` in
   * pixels. Optional; when omitted (or 0), `virtualRowsPass` may
   * still return the window starting at row 0 depending on
   * `viewportHeight`.
   */
  readonly viewportScrollTop?: number;
  /**
   * (vue3): body scrollport's `clientHeight` in
   * pixels. Optional; when omitted (or 0, the pre-mount frame),
   * `virtualRowsPass` returns the empty result + the SFC falls
   * back to rendering all rows.
   */
  readonly viewportHeight?: number;
  /**
   * (vue3): overscan rows above + below the
   * visible window so scroll-driven row mounts don't pop in.
   * Defaults to 3 inside `virtualRowsPass`; pass 0 to disable.
   */
  readonly overscan?: number;
  /**
   * (vue3): sort spec array. Empty / omitted = no
   * sort. Single-column sort = one-entry array. Multi-column sort =
   * N-entry array in lex-order priority. `sortPass` runs BEFORE
   * `rowLayoutPass` so per-row Y coordinates align with the
   * currently-displayed sort order.
   *
   * (vue3) widened this from `SortSpec | null`
   * to `readonly SortSpec[]` to support multi-column sort. Breaking
   * API change accepted because chronix-table-react is unpublished.
   */
  readonly sortSpec?: readonly SortSpec[];
  /**
   * (vue3): filter spec array. Empty / omitted = no
   * filter. Multi-column filter = N-entry array with AND semantics.
   * `filterPass` runs BEFORE `sortPass` in the pipeline so sort
   * scope shrinks to the filtered subset. (vue3 Phase
   * 9.1) added the `NumberFilterSpec` variant to the FilterSpec
   * discriminated union — no signature change.
   */
  readonly filterSpec?: readonly FilterSpec[];
  /**
   * (2026-05-29 — react port): quick-find substring needle.
   * Runs AFTER `filterPass` (column filters narrow first), BEFORE
   * `sortPass` (sort runs against the intersection). Empty / null /
   * undefined / whitespace-only text → identity (no extra filtering).
   * The SFC unions `quickFindForceExpandedRowIds` with the user's
   * expand state + `filterForceExpandedRowIds` before feeding back
   * into `expandedRowIds`. Verbatim port of vue3 .
   */
  readonly quickFindText?: string | null | undefined;
  /**
   * (vue3): 0-based page index for `pagePass`.
   * Omitted (or `< 0`) is the "first page" default; bounds-clamped
   * by `pagePass` (negative → 0; oversize → last valid page).
   */
  readonly page?: number;
  /**
   * (vue3): rows per page for `pagePass`. Omitted
   * (or `<= 0`) is the "no pagination" passthrough — pagePass returns
   * the input rows by reference and reports `totalPages = 1`. The SFC
   * passes `0` when `paginationEnabled` is false even though internal
   * page / pageSize state is still tracked, so pagePass becomes a
   * passthrough but consumer-observable handle reads still match the
   * latest applied values.
   */
  readonly pageSize?: number;
  /**
   * (react port, 2026-05-28): set of row IDs whose tree-data
   * children are currently expanded. When omitted (or empty),
   * `treeFlattenPass` runs over a flat input and is a no-op (returns
   * the input rows by reference); the layout-pipeline shape is
   * unchanged for non-tree datasets. The set should be the union of
   * the user's manual expand state AND `filterForceExpandedRowIds`
   * (auto-expanded ancestors of filter matches, per Decision
   * F.1) — the SFC owns that union and feeds the result here.
   */
  readonly expandedRowIds?: ReadonlySet<string>;

  /**
   * (2026-05-28 — react port): adapter-cached lazy children
   * Map. Keys are row IDs whose children loaded via `childrenLoader`;
   * values are the cached children arrays. Empty Map (default) is the
   * no-lazy fast-path.
   */
  readonly loadedChildrenByRowId?: ReadonlyMap<string, readonly RowSpec[]>;

  /**
   * -C (2026-05-30 — react port): per-row external height
   * override map. Verbatim mirror of vue3 -C input.
   */
  readonly rowHeightOverridesByRowId?: Readonly<Record<string, number>>;
}

/**
 * Layout outputs as plain values. Every value re-derives when an
 * input changes (via React's memo dependency tracking), so consumers
 * can read them directly without manual memoization on the call site.
 */
export interface UseTableLayoutOutput {
  /** Map of `column.id` → resolved pixel width (visible columns only). */
  readonly widthByColId: Readonly<Record<string, number>>;
  /** Sum of widths across `visibleColumns`. */
  readonly totalWidth: number;
  /** Input columns minus `hide: true` entries; preserves input order. */
  readonly visibleColumns: readonly ColumnSpec[];
  /**
   * Flat-header materialization: one `HeaderCell` per visible
   * column. `label` resolution priority: `headerName ?? field ?? id`.
   * `depth` always `0` and `span` always `1` until nested column
   * groups are introduced.
   */
  readonly headerCells: readonly HeaderCell[];
  /**
   * (vue3): per-row top-edge Y coordinate inside
   * the body's coordinate space. Adapter binds to `style.top` on the
   * row element.
   */
  readonly rowYByRowId: Readonly<Record<string, number>>;
  /**
   * (vue3): per-row resolved height in pixels.
   * Adapter binds to `style.height` on the row element.
   */
  readonly rowHeightByRowId: Readonly<Record<string, number>>;
  /**
   * (vue3): explicit pixel height the body
   * content layer must carry so absolute-positioned rows have a
   * containing block tall enough for the last row's bottom edge.
   */
  readonly totalBodyHeight: number;
  /**
   * (vue3): subset of `rows` whose `[y, y+h)`
   * intersects the viewport plus overscan. Adapter iterates this
   * directly. Empty when `viewportHeight === 0` (pre-mount); SFC
   * falls back to rendering all rows in that case.
   */
  readonly visibleRows: readonly RowSpec[];
  /**
   * (vue3): inclusive index of the first
   * rendered row into the full `rows` array (post-overscan). `-1`
   * when empty.
   */
  readonly firstRenderedIndex: number;
  /**
   * (vue3): inclusive index of the last
   * rendered row into the full `rows` array (post-overscan). `-1`
   * when empty.
   */
  readonly lastRenderedIndex: number;
  /**
   * (vue3): rows after `sortPass` runs. Identity-
   * equal to input rows when `sortSpec` is null (no sort) so the
   * downstream layout + virtualization passes don't re-run.
   */
  readonly sortedRows: readonly RowSpec[];
  /**
   * `true` when the active `sortSpec` references a
   * non-sortable or unknown column. SFC uses this to suppress sort-
   * indicator render + revert any internal click-cycle state.
   */
  readonly sortRejected: boolean;
  /**
   * (vue3): rows after `filterPass` runs (before
   * `sortPass`). Identity-equal to input rows when `filterSpec` is
   * empty / null (no filter). Consumers can read for "X of Y rows
   * visible" pills.
   */
  readonly filteredRows: readonly RowSpec[];
  /**
   * (vue3): `true` when the active `filterSpec`
   * references a non-filterable or unknown column. SFC can surface
   * this to consumers.
   */
  readonly filterRejected: boolean;
  /**
   * (2026-05-29 — react port): rows after `quickFindPass`
   * runs (between filterPass and sortPass). Identity-equal to
   * `filteredRows` when `quickFindText` is empty / null / blank.
   */
  readonly quickFindFilteredRows: readonly RowSpec[];
  /**
   * (2026-05-29 — react port): row IDs of ancestors whose
   * descendants matched the quick-find needle while the ancestor
   * itself did NOT match. The SFC unions this with
   * `filterForceExpandedRowIds` + user expand state before feeding
   * back into `expandedRowIds`.
   */
  readonly quickFindForceExpandedRowIds: readonly string[];
  /**
   * (2026-05-29 — react port): top-level retained row count
   * after `quickFindPass`. Surfaced by the SFC handle method
   * `getQuickFindMatchCount` for the demo's "X of Y matches" pill.
   */
  readonly quickFindMatchCount: number;
  /**
   * (vue3): rows after `pagePass` runs (after sort,
   * before rowLayoutPass). Identity-equal to `sortedRows` when
   * `pageSize <= 0` so the downstream layout + virtualization passes
   * don't re-run for the passthrough case.
   */
  readonly pagedRows: readonly RowSpec[];
  /**
   * 0-based page index after `pagePass`'s clamp. Equals the
   * input `page` when the input is in range; clamped to the last
   * valid page when oversize; `0` when input is negative or empty.
   */
  readonly currentPage: number;
  /**
   * total page count. `1` for the passthrough case
   * (`pageSize <= 0`); `Math.ceil(totalRows / pageSize)` otherwise.
   * `0` when `pageSize > 0` AND `totalRows === 0` (empty page set).
   */
  readonly totalPages: number;
  /**
   * input row count (`sortedRows.length`) so consumers can
   * render "X 行" footer labels without redoing the math.
   */
  readonly totalRowsAcrossPages: number;
  /**
   * (react port, 2026-05-28): rows after `treeFlattenPass`
   * runs (between sortPass and pagePass). When no row has children,
   * identity-equal to `sortedRows`. When tree data is active, each
   * row carries a chronix-populated `depth` + `groupKey`; collapsed-
   * subtree rows are excluded.
   */
  readonly flatTreeRows: readonly RowSpec[];
  /**
   * (react port): deepest `depth` value seen in `flatTreeRows`.
   * `0` for flat datasets.
   */
  readonly maxTreeDepth: number;
  /**
   * (Decision F.1, react port): row IDs whose children
   * matched the filter while the parent itself did NOT match.
   */
  readonly filterForceExpandedRowIds: readonly string[];
  /**
   * (2026-05-28 — react port): rows declaring
   * `RowSpec.pinned === 'top'`, extracted from input before any
   * filter / sort / page pass. Always rendered sticky-top; never
   * sort/paginate. Identity-equal to a shared frozen empty array
   * when no row is pinned.
   */
  readonly topPinnedRows: readonly RowSpec[];
  /** mirror of `topPinnedRows` for bottom-pinned rows. */
  readonly bottomPinnedRows: readonly RowSpec[];
}

const EMPTY_ROWS: readonly RowSpec[] = Object.freeze([]);
const EMPTY_SORT_SPECS: readonly SortSpec[] = Object.freeze([]);
const EMPTY_FILTER_SPECS: readonly FilterSpec[] = Object.freeze([]);
const EMPTY_EXPANDED_SET: ReadonlySet<string> = Object.freeze(new Set<string>());
const EMPTY_LOADED_CHILDREN_MAP: ReadonlyMap<string, readonly RowSpec[]> = new Map();

export function useTableLayout(input: UseTableLayoutInput): UseTableLayoutOutput {
  const {
    columns,
    containerWidth,
    defaultColumnWidth,
    defaultMinColumnWidth,
    rows = EMPTY_ROWS,
    defaultRowHeight = 28,
    viewportScrollTop = 0,
    viewportHeight = 0,
    overscan = 3,
    sortSpec = EMPTY_SORT_SPECS,
    filterSpec = EMPTY_FILTER_SPECS,
    quickFindText = null,
    page = 0,
    pageSize = 0,
    expandedRowIds = EMPTY_EXPANDED_SET,
    loadedChildrenByRowId = EMPTY_LOADED_CHILDREN_MAP,
    rowHeightOverridesByRowId,
  } = input;

  const columnLayoutResult = useMemo(
    () =>
      columnLayoutPass({
        columns,
        containerWidth,
        defaultColumnWidth,
        defaultMinColumnWidth,
      }),
    [columns, containerWidth, defaultColumnWidth, defaultMinColumnWidth],
  );

  const headerCells = useMemo<readonly HeaderCell[]>(
    () =>
      columnLayoutResult.visibleColumns.map((col) => ({
        colId: col.id,
        label: col.headerName ?? col.field ?? col.id,
        depth: 0,
        span: 1,
      })),
    [columnLayoutResult.visibleColumns],
  );

  // (2026-05-28 — react port): pinnedRowsPass runs FIRST.
  // Top + bottom pinned rows are extracted before filter / sort /
  // page / tree-flatten. Identity-equal to input rows when no row is
  // pinned (downstream useMemos don't re-run). Verbatim port of vue3
  // wiring.
  const pinnedRowsResult = useMemo(
    () =>
      pinnedRowsPass({
        rows,
      }),
    [rows],
  );

  // (vue3): filterPass runs over the post-pin-extract
  // regular row set. Empty / null filterSpec → identity (sortPass +
  // rowLayoutPass + virtualRowsPass get the same row reference,
  // useMemo memoization survives).
  const filterPassResult = useMemo(
    () =>
      filterPass({
        rows: pinnedRowsResult.regularRows,
        filterSpec,
        columns,
      }),
    [pinnedRowsResult.regularRows, filterSpec, columns],
  );

  // (2026-05-29 — react port): quickFindPass runs over the
  // post-filter subset (cross-column OR substring match), BEFORE
  // sortPass so sort operates on the find-narrowed set. Empty / null /
  // blank needle → identity (returns filteredRows by reference;
  // downstream useMemos don't re-run). Verbatim port of vue3 .
  const quickFindPassResult = useMemo(
    () =>
      quickFindPass({
        rows: filterPassResult.filteredRows,
        quickFindText,
        columns,
      }),
    [filterPassResult.filteredRows, quickFindText, columns],
  );

  // + 49.1 (vue3 + 8.1): sortPass runs AFTER
  // filterPass + quickFindPass so the sort scope is the
  // filter + find intersection. Accepts a `readonly SortSpec[]`;
  // empty array = identity (downstream useMemos don't re-run).
  const sortPassResult = useMemo(
    () =>
      sortPass({
        rows: quickFindPassResult.filteredRows,
        sortSpec,
        columns,
      }),
    [quickFindPassResult.filteredRows, sortSpec, columns],
  );

  // (2026-05-28 — react port): synthesizeLazyChildren runs
  // AFTER sortPass and BEFORE treeFlattenPass. Substitutes adapter-
  // cached lazy children into the tree. Identity-equal when the loaded
  // map is empty (fast-path).
  const lazyChildrenSynthesisResult = useMemo(
    () =>
      synthesizeLazyChildren({
        rows: sortPassResult.sortedRows,
        loadedChildrenByRowId,
      }),
    [sortPassResult.sortedRows, loadedChildrenByRowId],
  );

  // (react port, 2026-05-28): treeFlattenPass runs AFTER
  // sortPass + lazy synthesis and BEFORE pagePass. When no
  // row has children, the pass is a no-op (returns input by reference);
  // identity propagates through pagePass so the rest of the pipeline
  // is unchanged for flat data. Verbatim port of vue3 .
  const treeFlattenPassResult = useMemo(
    () =>
      treeFlattenPass({
        rows: lazyChildrenSynthesisResult.rows,
        expandedRowIds,
      }),
    [lazyChildrenSynthesisResult.rows, expandedRowIds],
  );

  // (vue3): pagePass runs AFTER sortPass +
  // treeFlattenPass and BEFORE rowLayoutPass. Passthrough case
  // (pageSize <= 0) returns flatTreeRows by reference so downstream
  // useMemos don't re-run.
  const pagePassResult = useMemo(
    () =>
      pagePass({
        rows: treeFlattenPassResult.flatRows,
        page,
        pageSize,
      }),
    [treeFlattenPassResult.flatRows, page, pageSize],
  );

  // (vue3): rowLayoutPass resolves per-row Y +
  // height. Identity-equal output between renders when rows +
  // defaultRowHeight are unchanged (the pass itself short-circuits
  // when its inputs are stable references; the useMemo here keeps
  // the React commit phase quiet).
  // rowLayoutPass + virtualRowsPass now consume `pagedRows`
  // (after pagePass). When pageSize <= 0, pagedRows === sortedRows by
  // reference and -51 behavior is preserved.
  const rowLayoutResult = useMemo(
    () =>
      rowLayoutPass({
        rows: pagePassResult.pagedRows,
        defaultRowHeight,
        ...(rowHeightOverridesByRowId != null ? { rowHeightOverridesByRowId } : {}),
      }),
    [pagePassResult.pagedRows, defaultRowHeight, rowHeightOverridesByRowId],
  );

  // (vue3): virtualRowsPass picks the windowed
  // subset of rows whose layout coordinates intersect the viewport
  // (plus overscan). Returns the empty result when viewportHeight ===
  // 0; SFC falls back to rendering all rows for the pre-mount frame.
  const virtualRowsResult = useMemo(
    () =>
      virtualRowsPass({
        rows: pagePassResult.pagedRows,
        rowYByRowId: rowLayoutResult.rowYByRowId,
        rowHeightByRowId: rowLayoutResult.rowHeightByRowId,
        viewportScrollTop,
        viewportHeight,
        overscan,
      }),
    [
      pagePassResult.pagedRows,
      rowLayoutResult.rowYByRowId,
      rowLayoutResult.rowHeightByRowId,
      viewportScrollTop,
      viewportHeight,
      overscan,
    ],
  );

  return {
    widthByColId: columnLayoutResult.widthByColId,
    totalWidth: columnLayoutResult.totalWidth,
    visibleColumns: columnLayoutResult.visibleColumns,
    headerCells,
    rowYByRowId: rowLayoutResult.rowYByRowId,
    rowHeightByRowId: rowLayoutResult.rowHeightByRowId,
    totalBodyHeight: rowLayoutResult.totalBodyHeight,
    visibleRows: virtualRowsResult.visibleRows,
    firstRenderedIndex: virtualRowsResult.firstRenderedIndex,
    lastRenderedIndex: virtualRowsResult.lastRenderedIndex,
    sortedRows: sortPassResult.sortedRows,
    sortRejected: sortPassResult.rejected,
    filteredRows: filterPassResult.filteredRows,
    filterRejected: filterPassResult.rejected,
    quickFindFilteredRows: quickFindPassResult.filteredRows,
    quickFindForceExpandedRowIds: quickFindPassResult.quickFindForceExpandedRowIds,
    quickFindMatchCount: quickFindPassResult.matchCount,
    pagedRows: pagePassResult.pagedRows,
    currentPage: pagePassResult.currentPage,
    totalPages: pagePassResult.totalPages,
    totalRowsAcrossPages: pagePassResult.totalRowsAcrossPages,
    flatTreeRows: treeFlattenPassResult.flatRows,
    maxTreeDepth: treeFlattenPassResult.maxDepth,
    filterForceExpandedRowIds: filterPassResult.filterForceExpandedRowIds,
    topPinnedRows: pinnedRowsResult.topPinnedRows,
    bottomPinnedRows: pinnedRowsResult.bottomPinnedRows,
  };
}

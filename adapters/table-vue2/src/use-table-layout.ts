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
import { computed, unref, type ComputedRef, type Ref } from 'vue';

/**
 * + + Vue 2.7 composable
 * that wraps the chronix-table core's `columnLayoutPass` +
 * `rowLayoutPass` + `virtualRowsPass` +
 * materializes the flat-header `HeaderCell[]` the SFC binds to the
 * header row. Verbatim port of chronix-table-vue3's `use-table-layout.ts`
 * form.
 *
 * Vue 2.7's terminal Composition API surface predates Vue 3.3's
 * `toValue` helper and its `MaybeRefOrGetter<T>` type by ~1 year.
 * The local shim below is the same one used in chronix-gantt-vue2's
 * `use-gantt-layout.ts:13-29` — accepts plain values, Vue refs,
 * and zero-arg getter functions, all normalized to the underlying
 * value.
 *
 * Composables own no DOM and no pointer state — they output the
 * same shapes the core's pass methods would, just lifted into
 * `ComputedRef` for template binding.
 *
 * ships flat headers only (`depth = 0` / `span = 1`);
 * nested column groups land in vue2 Phase ~50 when
 * `ColumnGroupSpec` extends the IR (also subject to vue3 schedule).
 *
 * adds `rowYByRowId` / `rowHeightByRowId` /
 * `totalBodyHeight` so the SFC can render body rows as absolute-
 * positioned children of an explicit-height body container
 * (canonical layout primitive 's `virtualRowsPass`).
 *
 * adds `visibleRows` / `firstRenderedIndex` /
 * `lastRenderedIndex` so the SFC renders only the visible row
 * window plus overscan. When `viewportScrollTop` / `viewportHeight`
 * inputs are omitted (or `viewportHeight === 0`), `virtualRowsPass`
 * returns the empty result — the SFC falls back to rendering all
 * rows via `props.rows` directly (see `chronix-table.ts` for the
 * fallback logic).
 */
export type MaybeRefOrGetter<T> = T | Ref<T> | (() => T);

function toValue<T>(source: MaybeRefOrGetter<T>): T {
  if (typeof source === 'function') {
    return (source as () => T)();
  }
  return unref(source);
}

export interface UseTableLayoutInput {
  /** Visible + hidden columns; the pass filters `hide: true` internally. */
  readonly columns: MaybeRefOrGetter<readonly ColumnSpec[]>;
  /** Horizontal pixel budget for column distribution. Typically the wrapper's `clientWidth`. */
  readonly containerWidth: MaybeRefOrGetter<number>;
  /**
   * Default width for columns that declare neither `width` nor `flex`.
   * Sourced from the merged theme; the SFC always passes
   * `theme.defaultColumnWidth`.
   */
  readonly defaultColumnWidth: MaybeRefOrGetter<number>;
  /**
   * Lower clamp for column widths when a column omits its own
   * `minWidth`. Sourced from the merged theme.
   */
  readonly defaultMinColumnWidth: MaybeRefOrGetter<number>;
  /**
   * Rows in display order. input — drives `rowLayoutPass`
   * for per-row Y positions + heights.
   */
  readonly rows: MaybeRefOrGetter<readonly RowSpec[]>;
  /**
   * Uniform per-row height in pixels. Sourced from the merged
   * theme's `rowHeight`. Per-row overrides come from each
   * `RowSpec.heightHint`.
   */
  readonly defaultRowHeight: MaybeRefOrGetter<number>;
  /**
   * body scrollport's `scrollTop` in pixels. Optional;
   * when omitted (or 0), `virtualRowsPass` may still return the
   * window starting at row 0 depending on `viewportHeight`.
   */
  readonly viewportScrollTop?: MaybeRefOrGetter<number>;
  /**
   * body scrollport's `clientHeight` in pixels.
   * Optional; when omitted (or 0, the pre-mount frame),
   * `virtualRowsPass` returns the empty result + the SFC falls back
   * to rendering all rows.
   */
  readonly viewportHeight?: MaybeRefOrGetter<number>;
  /**
   * overscan rows above + below the visible window so
   * scroll-driven row mounts don't pop in. Defaults to 3 inside
   * `virtualRowsPass`; pass 0 to disable.
   */
  readonly overscan?: MaybeRefOrGetter<number>;
  /**
   * + 42.1 (2026-05-25): ordered list of sort keys for
   * lex-order multi-column sort. Empty array / null / omitted = no
   * sort (sortedRows identity-equal to input rows). When any entry
   * references a non-sortable or unknown column, `sortPass` rejects
   * atomically + the composable propagates `sortRejected: true` so
   * the SFC can suppress the sort indicator + revert the click-cycle
   * state.
   */
  readonly sortSpec?: MaybeRefOrGetter<readonly SortSpec[] | null>;
  /**
   * list of per-column filter specs (multi-
   * column AND). Empty array / null / omitted = no filter. Runs
   * BEFORE `sortPass` in the pipeline so sort scope shrinks to the
   * filtered subset. When any spec references a non-filterable or
   * unknown column, `filterPass` rejects atomically + the composable
   * propagates `filterRejected: true`. Verbatim port of vue3 .
   */
  readonly filterSpec?: MaybeRefOrGetter<readonly FilterSpec[] | null>;
  /**
   * quick-find substring needle. Runs AFTER
   * `filterPass` (column filters narrow first), BEFORE `sortPass`
   * (sort runs against the intersection). Empty / null / undefined /
   * whitespace-only text → identity. The SFC unions
   * `quickFindForceExpandedRowIds` with the user's expand state +
   * `filterForceExpandedRowIds` before feeding back into
   * `expandedRowIds`, so matches under collapsed branches are visible.
   * Verbatim port of vue3 .
   */
  readonly quickFindText?: MaybeRefOrGetter<string | null | undefined>;
  /**
   * 0-based page index for `pagePass`. Omitted
   * / `0` is the natural first page. Out-of-range values are clamped
   * by `pagePass` (negative → 0; oversize → last valid page). Verbatim
   * port of vue3 .
   */
  readonly page?: MaybeRefOrGetter<number>;
  /**
   * rows per page for `pagePass`. Omitted (or `<= 0`) is
   * the "no pagination" passthrough — pagePass returns the input rows
   * by reference and reports `totalPages = 1`.
   */
  readonly pageSize?: MaybeRefOrGetter<number>;
  /**
   * set of row IDs whose tree-data children
   * are currently expanded. When omitted (or empty), `treeFlattenPass`
   * runs over a flat input and is a no-op (returns the input rows by
   * reference); the layout-pipeline shape is unchanged for non-tree
   * datasets. The set should be the union of the user's manual expand
   * state AND `filterForceExpandedRowIds` (auto-expanded ancestors of
   * filter matches, per Decision F.1) — the SFC owns that
   * union and feeds the result here. Verbatim port of vue3 .
   */
  readonly expandedRowIds?: MaybeRefOrGetter<ReadonlySet<string>>;

  /**
   * (2026-05-28 — vue2 port): adapter-cached lazy children
   * Map. Keys are row IDs whose children loaded via `childrenLoader`;
   * values are the cached children arrays. Empty Map (default) is the
   * no-lazy fast-path — synthesizeLazyChildren returns input rows by
   * reference and the pipeline is unchanged.
   */
  readonly loadedLazyChildrenByRowId?: MaybeRefOrGetter<ReadonlyMap<string, readonly RowSpec[]>>;

  /**
   * -C (2026-05-30 — vue2 port): per-row external height
   * override map. Verbatim mirror of vue3 -C input.
   */
  readonly rowHeightOverridesByRowId?: MaybeRefOrGetter<
    Readonly<Record<string, number>> | undefined
  >;
}

/**
 * Reactive layout outputs. Every value re-derives when an input
 * ref / getter changes, so consumers can bind them directly to
 * template structure / style without manual `watch`es.
 */
export interface UseTableLayoutOutput {
  /** Map of `column.id` → resolved pixel width (visible columns only). */
  readonly widthByColId: ComputedRef<Readonly<Record<string, number>>>;
  /** Sum of widths across `visibleColumns`. */
  readonly totalWidth: ComputedRef<number>;
  /** Input columns minus `hide: true` entries; preserves input order. */
  readonly visibleColumns: ComputedRef<readonly ColumnSpec[]>;
  /**
   * Flat-header materialization: one `HeaderCell` per visible
   * column. `label` resolution priority: `headerName ?? field ?? id`.
   * `depth` always `0` and `span` always `1` until column groups land.
   */
  readonly headerCells: ComputedRef<readonly HeaderCell[]>;
  /**
   * per-row top-edge Y coordinate inside the body's
   * coordinate space. Adapter binds to `style.top` on the row
   * element.
   */
  readonly rowYByRowId: ComputedRef<Readonly<Record<string, number>>>;
  /**
   * per-row resolved height in pixels. Adapter binds
   * to `style.height` on the row element.
   */
  readonly rowHeightByRowId: ComputedRef<Readonly<Record<string, number>>>;
  /**
   * explicit pixel height the body container must
   * carry so absolute-positioned rows have a containing block
   * tall enough for the last row's bottom edge.
   */
  readonly totalBodyHeight: ComputedRef<number>;
  /**
   * subset of `rows` whose `[y, y+h)` intersects the
   * viewport plus overscan. Adapter iterates this directly. Empty
   * when `viewportHeight === 0` (pre-mount); SFC falls back to
   * rendering all rows in that case.
   */
  readonly visibleRows: ComputedRef<readonly RowSpec[]>;
  /**
   * inclusive index of the first rendered row into
   * the full `rows` array (post-overscan). `-1` when empty.
   */
  readonly firstRenderedIndex: ComputedRef<number>;
  /**
   * inclusive index of the last rendered row into the
   * full `rows` array (post-overscan). `-1` when empty.
   */
  readonly lastRenderedIndex: ComputedRef<number>;
  /**
   * rows after `sortPass` runs. Identity-
   * equal to input rows when sortSpec is null (downstream computed
   * memos don't re-run). The SFC's `rowsToRender` fallback uses
   * this when bodyClientHeight is 0 (pre-mount); rowLayoutPass +
   * virtualRowsPass both consume this so per-row Y coordinates +
   * visible windows align with the active sort. With
   * filter wired in, `sortedRows` is the result of `sortPass` over
   * the filtered subset (filter runs first, then sort).
   */
  readonly sortedRows: ComputedRef<readonly RowSpec[]>;
  /**
   * `true` when the active `sortSpec` referenced a non-
   * sortable or unknown column. The SFC uses this to suppress sort-
   * indicator render + revert the click-cycle state.
   */
  readonly sortRejected: ComputedRef<boolean>;
  /**
   * rows after `filterPass` runs (before
   * `sortPass`). Identity-equal to input rows when filterSpec is
   * empty / null OR every entry's value is empty. Consumers can
   * use this for a "X of Y rows visible" pill in the demo.
   */
  readonly filteredRows: ComputedRef<readonly RowSpec[]>;
  /**
   * `true` when the active `filterSpec` referenced a non-
   * filterable or unknown column. The SFC could surface this to
   * consumers (doesn't emit it — matches vue3).
   */
  readonly filterRejected: ComputedRef<boolean>;
  /**
   * rows after `quickFindPass` runs (between
   * filterPass and sortPass). Identity-equal to `filteredRows` when
   * `quickFindText` is empty / null / whitespace-only. Verbatim port
   * of vue3 .
   */
  readonly quickFindFilteredRows: ComputedRef<readonly RowSpec[]>;
  /**
   * row IDs of ancestors whose descendants
   * matched the quick-find needle while the ancestor itself did NOT
   * match. The SFC unions this with `filterForceExpandedRowIds` +
   * user's expand state before feeding back into `expandedRowIds`.
   */
  readonly quickFindForceExpandedRowIds: ComputedRef<readonly string[]>;
  /**
   * top-level retained row count after
   * `quickFindPass`. Surfaced by the SFC handle method
   * `getQuickFindMatchCount` for the demo's "X of Y matches" pill.
   */
  readonly quickFindMatchCount: ComputedRef<number>;
  /**
   * rows after `pagePass` runs (after sort,
   * before `rowLayoutPass`). Identity-equal to `sortedRows` when
   * `pageSize <= 0` (no-pagination passthrough). `rowLayoutPass` +
   * `virtualRowsPass` both consume this so per-row Y coordinates +
   * visible windows align with the currently displayed page. Verbatim
   * port of vue3 .
   */
  readonly pagedRows: ComputedRef<readonly RowSpec[]>;
  /**
   * 0-based page index after `pagePass`'s clamp. Equals
   * the input `page` unless it was out of range. Always `0` when
   * `pageSize <= 0` or rows are empty.
   */
  readonly currentPage: ComputedRef<number>;
  /**
   * total number of pages after `filterPass` + `sortPass`.
   * `1` when pagination is disabled (`pageSize <= 0`); `0` when
   * pagination is enabled but the filtered + sorted row set is empty.
   */
  readonly totalPages: ComputedRef<number>;
  /**
   * total rows in the post-filter + post-sort row set
   * (= `sortedRows.length`). Exposed so the SFC's status pill /
   * pagination footer can render "X rows total" without separately
   * threading the length.
   */
  readonly totalRowsAcrossPages: ComputedRef<number>;
  /**
   * rows after `treeFlattenPass` runs (between
   * sortPass and pagePass). When no row has children, identity-equal
   * to `sortedRows`. When tree data is active, each row carries a
   * chronix-populated `depth` + `groupKey`; collapsed-subtree rows
   * are excluded.
   */
  readonly flatTreeRows: ComputedRef<readonly RowSpec[]>;
  /**
   * deepest `depth` value seen in `flatTreeRows`. `0` for
   * flat datasets. The SFC uses this to skip indent computation
   * entirely when the dataset is flat.
   */
  readonly maxTreeDepth: ComputedRef<number>;
  /**
   * (Decision F.1): row IDs whose children matched the
   * filter while the parent itself did NOT match. The SFC unions this
   * with the user's expand state before feeding `expandedRowIds`
   * back into this composable.
   */
  readonly filterForceExpandedRowIds: ComputedRef<readonly string[]>;
  /**
   * rows declaring `RowSpec.pinned === 'top'`,
   * extracted from input before any filter / sort / page pass runs.
   * Always rendered as sticky-top rows; never participate in sort
   * order or pagination. Identity-equal to a shared frozen empty
   * array when no row is pinned.
   */
  readonly topPinnedRows: ComputedRef<readonly RowSpec[]>;
  /** mirror of `topPinnedRows` for bottom-pinned rows. */
  readonly bottomPinnedRows: ComputedRef<readonly RowSpec[]>;
}

export function useTableLayout(input: UseTableLayoutInput): UseTableLayoutOutput {
  const columnLayoutResult = computed(() =>
    columnLayoutPass({
      columns: toValue(input.columns),
      containerWidth: toValue(input.containerWidth),
      defaultColumnWidth: toValue(input.defaultColumnWidth),
      defaultMinColumnWidth: toValue(input.defaultMinColumnWidth),
    }),
  );

  const widthByColId = computed(() => columnLayoutResult.value.widthByColId);
  const totalWidth = computed(() => columnLayoutResult.value.totalWidth);
  const visibleColumns = computed(() => columnLayoutResult.value.visibleColumns);

  const headerCells = computed<readonly HeaderCell[]>(() =>
    visibleColumns.value.map((col) => ({
      colId: col.id,
      label: col.headerName ?? col.field ?? col.id,
      depth: 0,
      span: 1,
    })),
  );

  // pinnedRowsPass runs FIRST — extract top +
  // bottom pinned rows before any filter / sort / page pass runs.
  // Identity-equal to `input.rows` when no row is pinned (downstream
  // memos don't re-run). Verbatim port of vue3 wiring.
  const pinnedRowsResult = computed(() =>
    pinnedRowsPass({
      rows: toValue(input.rows),
    }),
  );
  const topPinnedRows = computed(() => pinnedRowsResult.value.topPinnedRows);
  const bottomPinnedRows = computed(() => pinnedRowsResult.value.bottomPinnedRows);
  const regularRows = computed(() => pinnedRowsResult.value.regularRows);

  // filterPass runs over the post-pin-extract
  // regular row set. Empty / null filterSpec → identity (returns input
  // rows by reference; downstream computed memos don't re-run).
  // Verbatim port of vue3 wiring.
  const filterPassResult = computed(() =>
    filterPass({
      rows: regularRows.value,
      filterSpec: toValue(input.filterSpec ?? []),
      columns: toValue(input.columns),
    }),
  );
  const filteredRows = computed(() => filterPassResult.value.filteredRows);
  const filterRejected = computed(() => filterPassResult.value.rejected);
  const filterForceExpandedRowIds = computed(
    () => filterPassResult.value.filterForceExpandedRowIds,
  );

  // (2026-05-29 — vue2 port): quickFindPass runs over the
  // post-filter subset (cross-column OR substring match), BEFORE
  // sortPass so sort operates on the find-narrowed set. Empty / null
  // / blank needle → identity (returns filteredRows by reference;
  // downstream memos don't re-run). Verbatim port of vue3 .
  const quickFindPassResult = computed(() =>
    quickFindPass({
      rows: filteredRows.value,
      quickFindText: toValue(input.quickFindText ?? null),
      columns: toValue(input.columns),
    }),
  );
  const quickFindFilteredRows = computed(() => quickFindPassResult.value.filteredRows);
  const quickFindForceExpandedRowIds = computed(
    () => quickFindPassResult.value.quickFindForceExpandedRowIds,
  );
  const quickFindMatchCount = computed(() => quickFindPassResult.value.matchCount);

  // + 42.1: sortPass slots between filtered rows and
  // rowLayoutPass / virtualRowsPass — empty array / null = identity
  // (downstream computeds don't recompute). widened the
  // composable input from single SortSpec to ordered readonly
  // SortSpec[] (lex-order multi-column). changes the input
  // rows to `filteredRows.value`; swaps that to
  // `quickFindFilteredRows.value` so sort operates on the
  // filter + find intersection.
  const sortPassResult = computed(() =>
    sortPass({
      rows: quickFindFilteredRows.value,
      sortSpec: toValue(input.sortSpec ?? null),
      columns: toValue(input.columns),
    }),
  );
  const sortedRows = computed(() => sortPassResult.value.sortedRows);
  const sortRejected = computed(() => sortPassResult.value.rejected);

  // (2026-05-28 — vue2 port): synthesizeLazyChildren runs
  // AFTER sortPass and BEFORE treeFlattenPass. Substitutes adapter-
  // cached lazy children into the tree so treeFlattenPass sees them
  // as regular children. Identity-equal when the loaded map is empty.
  const lazyChildrenSynthesisResult = computed(() =>
    synthesizeLazyChildren({
      rows: sortedRows.value,
      loadedChildrenByRowId: toValue(
        input.loadedLazyChildrenByRowId ?? new Map<string, readonly RowSpec[]>(),
      ),
    }),
  );
  const rowsAfterLazySynthesis = computed(() => lazyChildrenSynthesisResult.value.rows);

  // treeFlattenPass runs AFTER sortPass +
  // lazy synthesis and BEFORE pagePass. When no row has
  // `children`, the pass is a no-op (returns input by reference);
  // identity propagates through pagePass so the rest of the pipeline
  // is unchanged for flat data. For tree data, the output is the
  // visible-only flat row list with chronix-populated `depth` +
  // `groupKey` per emitted row. Verbatim port of vue3 .
  const treeFlattenPassResult = computed(() =>
    treeFlattenPass({
      rows: rowsAfterLazySynthesis.value,
      expandedRowIds: toValue(input.expandedRowIds ?? new Set<string>()),
    }),
  );
  const flatTreeRows = computed(() => treeFlattenPassResult.value.flatRows);
  const maxTreeDepth = computed(() => treeFlattenPassResult.value.maxDepth);

  // pagePass runs AFTER sortPass +
  // treeFlattenPass and BEFORE rowLayoutPass + virtualRowsPass. When
  // `pageSize <= 0` (no pagination), the pass returns `flatTreeRows`
  // by reference so the downstream layout + virtualization passes
  // operate on the same identity-equal input as before .
  const pagePassResult = computed(() =>
    pagePass({
      rows: flatTreeRows.value,
      page: toValue(input.page ?? 0),
      pageSize: toValue(input.pageSize ?? 0),
    }),
  );
  const pagedRows = computed(() => pagePassResult.value.pagedRows);
  const currentPage = computed(() => pagePassResult.value.currentPage);
  const totalPages = computed(() => pagePassResult.value.totalPages);
  const totalRowsAcrossPages = computed(() => pagePassResult.value.totalRowsAcrossPages);

  const rowLayoutResult = computed(() => {
    const overrides = toValue(input.rowHeightOverridesByRowId);
    return rowLayoutPass({
      rows: pagedRows.value,
      defaultRowHeight: toValue(input.defaultRowHeight),
      ...(overrides != null ? { rowHeightOverridesByRowId: overrides } : {}),
    });
  });

  const rowYByRowId = computed(() => rowLayoutResult.value.rowYByRowId);
  const rowHeightByRowId = computed(() => rowLayoutResult.value.rowHeightByRowId);
  const totalBodyHeight = computed(() => rowLayoutResult.value.totalBodyHeight);

  const virtualRowsResult = computed(() =>
    virtualRowsPass({
      rows: pagedRows.value,
      rowYByRowId: rowYByRowId.value,
      rowHeightByRowId: rowHeightByRowId.value,
      viewportScrollTop: toValue(input.viewportScrollTop ?? 0),
      viewportHeight: toValue(input.viewportHeight ?? 0),
      overscan: toValue(input.overscan ?? 3),
    }),
  );

  const visibleRows = computed(() => virtualRowsResult.value.visibleRows);
  const firstRenderedIndex = computed(() => virtualRowsResult.value.firstRenderedIndex);
  const lastRenderedIndex = computed(() => virtualRowsResult.value.lastRenderedIndex);

  return {
    widthByColId,
    totalWidth,
    visibleColumns,
    headerCells,
    rowYByRowId,
    rowHeightByRowId,
    totalBodyHeight,
    visibleRows,
    firstRenderedIndex,
    lastRenderedIndex,
    sortedRows,
    sortRejected,
    filteredRows,
    filterRejected,
    quickFindFilteredRows,
    quickFindForceExpandedRowIds,
    quickFindMatchCount,
    pagedRows,
    currentPage,
    totalPages,
    totalRowsAcrossPages,
    flatTreeRows,
    maxTreeDepth,
    filterForceExpandedRowIds,
    topPinnedRows,
    bottomPinnedRows,
  };
}

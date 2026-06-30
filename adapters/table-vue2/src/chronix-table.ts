import {
  appendMutationBatch,
  clampResizeWidth,
  coerceEditDraftValue,
  computeAutosizeWidth,
  computeCellRangeEnvelope,
  computeColumnReorder,
  computeDragFillEnvelope,
  computeDragFillMutations,
  computeFooterValues,
  computeHeaderGroupSpans,
  computeNextActiveCell,
  computePasteMutations,
  collectDescendantRowIds,
  collectUniqueColumnValues,
  computeColumnNumericExtents,
  computeDragAutoScrollVelocity,
  DEFAULT_DRAG_AUTO_SCROLL_MAX_VELOCITY_PX_PER_FRAME,
  DEFAULT_DRAG_AUTO_SCROLL_TRIGGER_ZONE_PX,
  computeRangeRowIds,
  computeRowReorder,
  getRowDropTarget,
  DEFAULT_ROW_DRAG_THRESHOLD_PX,
  computeRowSelectionTriState,
  type RowSelectionTriState,
  computeScrollIntoView,
  computeVisiblePageNumbers,
  deriveShiftArrowCellRange,
  findDataRegionBoundary,
  type CellValueFn,
  type DataRegionDirection,
  createClientSideRowSource,
  createColumnTable,
  createServerSideRowSource,
  BLOCK_KIND_IDLE,
  DEFAULT_CACHE_BLOCK_SIZE,
  DEFAULT_SERVER_SIDE_MAX_BLOCKS_IN_CACHE,
  SERVER_SIDE_SKELETON_ID_PREFIX,
  isServerSideSkeletonRowId,
  type BlockState,
  type ServerSideDataSource,
  type ServerSideRowSource,
  cssVarsForTheme,
  DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX,
  defaultChronixTableTheme,
  EMPTY_CELL_RANGE_ENVELOPE,
  EMPTY_MUTATION_HISTORY,
  EMPTY_PINNED_COLS_RESULT,
  findNextEditableCell,
  formatCellRangeForClipboard,
  formatCellValue,
  formatPrefixNumberFilter,
  getCellValue,
  getColumnDropTarget,
  parseClipboardTsv,
  parsePrefixNumberFilter,
  pinnedColsPass,
  parseFilterExpression,
  popRedoBatch,
  popUndoBatch,
  defaultStatusBarText,
  exportToCsv,
  exportToXlsx,
  formatActiveCellAnnouncement,
  formatColumnHeaderDescription,
  splitTextByQuickFindMatch,
  type ExportToCsvOptions,
  type ExportToXlsxOptions,
  type FormatActiveCellAnnouncementInput,
  type SingleSheetExportToXlsxInput,
  type StatusBarCounts,
  resolveCellClassNames,
  resolveCellTooltip,
  reverseMutationBatch,
  runAsyncCellValidator,
  runCellValidator,
  runRowValidators,
  serializeTableView,
  applyTableView,
  type TableViewState,
  type CellRange,
  type CellRangeEnvelope,
  type CellRef,
  type ChronixTableTheme,
  type ColumnDropTarget,
  type ColumnHeaderRect,
  type ColumnSpec,
  type ColumnTable,
  type CollectUniqueColumnValuesResult,
  type EditValidationError,
  type MultiFilterChild,
  type MultiFilterChildSet,
  type MultiFilterEntry,
  type MultiFilterGroup,
  type MultiFilterSpec,
  type RowDropTarget,
  type RowRect,
  type ExpressionFilterSpec,
  type FilterExpression,
  type FilterSpec,
  type HeaderGroupSpan,
  type ParseFilterExpressionResult,
  type SetFilterSpec,
  type LazyChildrenState,
  type LazyChildrenStatus,
  type MutationBatch,
  type NavigationDirection,
  type MutationHistoryState,
  type PasteMutation,
  type PasteValidatorGate,
  type PinnedColsResult,
  type RowAction,
  type RowDataSource,
  type RowValidator,
  type RowValidationViolation,
  type NumberFilterSpec,
  type RowSpec,
  type SortSpec,
  type TextFilterSpec,
  type ToolPanelChangePayload,
  type ToolPanelConfig,
  type ToolPanelDescriptor,
  type ToolPanelWidthChangePayload,
  type ContextMenuConfig,
  type ContextMenuContext,
  type ContextMenuItem,
  type ContextMenuOpenPayload,
  DEFAULT_TOOL_PANEL_MAX_WIDTH_PX,
  DEFAULT_TOOL_PANEL_MIN_WIDTH_PX,
  DEFAULT_TOOL_PANEL_WIDTH_PX,
  TOOL_PANEL_ICON_RAIL_WIDTH_PX,
} from '@chronixjs/table';
import {
  DEFAULT_VIRTUAL_WINDOW_OVERSCAN,
  computeHsvAtSquarePosition,
  computeHueAtStripPosition,
  computeRangeClosestHandle,
  computeRangeValueAtPosition,
  computeRangeValueOnKey,
  computeSquarePositionForHsv,
  computeStripPositionForHue,
  computeVirtualWindow,
  hexToRgb,
  hsvToRgb,
  rgbToHex,
  rgbToHsv,
  type Hsv,
  type RangeHandle,
  type Rgb,
} from '@chronixjs/cx-kit';
import {
  computed,
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType,
  type VNode,
} from 'vue';

import { useMenuKeyboardNav, type MenuKeyboardNavItem } from './use-menu-keyboard-nav.js';
import { useTableBodyScroll } from './use-table-body-scroll.js';
import { useTableContainerSize } from './use-table-container-size.js';
import { useTableLayout } from './use-table-layout.js';
import { useTreeExpandState } from './use-tree-expand-state.js';

/**
 * Public imperative facade for `<ChronixTable>`. Mirrors the shape
 * of chronix-table-vue3's `TableHandle` at its form. Per-
 * feature phases extend it (sort / filter / edit / selection /
 * resize methods land in their owning vue2 sub-phases).
 */
export interface TableHandle {
  /** O(1)-lookup wrapper over the consumer-supplied `columns` prop. */
  getColumnTable(): ColumnTable;
  /** O(1)-lookup wrapper over the consumer-supplied `rows` prop. */
  getRowDataSource(): RowDataSource;
  /**
   * Post-layout pixel width for a given column id. Returns
   * `undefined` when the column doesn't exist, is hidden, or
   * `columnLayoutPass` has not yet run (pre-mount).
   */
  getResolvedWidth(colId: string): number | undefined;
  /**
   * + 42.1 (2026-05-25): read the current ordered sort
   * spec. Empty array = no sort. Single-column = one-entry array.
   * Multi-column = N-entry array in lex-order priority. Internal-
   * only state ownership (no controlled `sortSpec` prop per Phase
   * 42 Decision A.1).
   */
  getSort(): readonly SortSpec[];
  /**
   * + 42.1: apply a sort spec. Accepts a single `SortSpec`
   * (wrapped into a one-entry array for convenience), a full ordered
   * `readonly SortSpec[]`, or `null` (cleared = empty array).
   * Silently rejects atomically when any entry's column has
   * `sortable === false` or doesn't exist. Triggers the
   * `sort-change` emit on successful application.
   */
  setSort(spec: SortSpec | readonly SortSpec[] | null): void;
  /** + 42.1: convenience for `setSort(null)`. */
  clearSort(): void;
  /**
   * read the current ordered filter spec.
   * Empty array = no filter. Multi-column filter = N-entry array
   * with multi-column AND semantics. Internal-only state ownership
   * (no controlled `filterSpec` prop; same posture as
   * sort). Verbatim port of vue3 .
   */
  getFilter(): readonly FilterSpec[];
  /**
   * apply a filter spec. Accepts a single `FilterSpec`
   * (wrapped into a one-entry array for convenience), a full
   * `readonly FilterSpec[]`, or `null` (cleared = empty array).
   * Silently rejects atomically when any entry's column has
   * `filterable === false` or doesn't exist. Triggers the
   * `filter-change` emit on successful application.
   */
  setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
  /** convenience for `setFilter(null)`. */
  clearFilter(): void;
  /**
   * read the active advanced filter (if any).
   * Returns `null` when the current filter spec has no
   * `ExpressionFilterSpec` entry; otherwise returns the AST plus the
   * original DSL text when the expression was applied via
   * `parseAndSetAdvancedFilter`. Verbatim port of vue3 .
   */
  getAdvancedFilter(): {
    readonly expression: FilterExpression;
    readonly source: string | null;
  } | null;
  /**
   * apply an advanced filter expression — wraps the AST
   * in an `ExpressionFilterSpec` and dispatches via the same path
   * `setFilter` uses, preserving any pre-existing `text` / `number`
   * variants. Pass `null` to remove just the expression entry.
   */
  setAdvancedFilter(expression: FilterExpression | null, source?: string): void;
  /**
   * parse a DSL string with `parseFilterExpression` and
   * apply it on success; returns the parser result so consumers can
   * render error UIs without separately invoking the parser.
   */
  parseAndSetAdvancedFilter(text: string): ParseFilterExpressionResult;
  /**
   * (2026-05-29 — vue2 port): collect the unique values
   * appearing in a given column across the table's CURRENT rows
   * (pre-filter). Drives the set-filter dropdown UI;
   * consumers building their own filter UIs can reuse this helper.
   * Verbatim port of vue3 .
   */
  getColumnUniqueValues(
    colId: string,
    options?: { maxValues?: number },
  ): CollectUniqueColumnValuesResult;
  /**
   * read the current quick-find needle. Empty
   * string = no quick-find active. Internal-only state ownership (no
   * controlled `quickFindText` prop; same posture as filter / sort).
   * Verbatim port of vue3 .
   */
  getQuickFindText(): string;
  /**
   * apply a quick-find needle. Accepts a string (empty
   * string clears), `null`, or `undefined` (both coerced to `''`).
   * Triggers the `quick-find-text-change` emit when the needle
   * actually changes (no-op dedup). Transitions reset pagination to
   * page 0 (matches filter transition posture).
   */
  setQuickFindText(text: string | null | undefined): void;
  /**
   * read the current top-level match count after
   * `quickFindPass`. Equals `props.rows.length` when no quick-find is
   * active. For tree data, counts top-level retained rows only.
   */
  getQuickFindMatchCount(): number;
  /**
   * read the current selected row ids in
   * insertion order. Empty array = nothing selected.
   *
   * Returns the public array shape (not the internal Set). Selection
   * is orthogonal to filter / sort — row ids that are filtered out
   * remain "selected" in the underlying set; consumers wanting the
   * intersection with visible rows can compute it themselves.
   * Verbatim port of vue3 .
   */
  getSelectedRowIds(): readonly string[];
  /**
   * replace the selection. `null` clears it (equivalent to
   * passing `[]`). Triggers `selection-change` emit on transition.
   * Does NOT validate that ids reference real rows — consumers
   * setting programmatically own that contract (is in-
   * memory state without row-existence validation).
   */
  setSelectedRowIds(ids: readonly string[] | null): void;
  /** convenience for `setSelectedRowIds(null)`. */
  clearSelection(): void;
  /**
   * O(1) check whether `rowId` is in the current
   * selection. Used by the SFC's per-row render to apply the
   * `cx-table-row--selected` modifier; also exposed for consumer
   * row-level conditionals (custom row classes, action buttons).
   */
  isRowSelected(rowId: string): boolean;
  /**
   * read the current 0-based page index.
   * Returns the post-clamp value (so consumers always see the legal
   * page index). `0` when pagination is disabled / pre-mount.
   * Verbatim port of vue3 .
   */
  getPage(): number;
  /**
   * set the 0-based page index. Triggers `page-change` on
   * transition. The composable clamps internally — passing 99 over
   * a 3-page dataset → next `getPage()` returns `2` (last valid).
   */
  setPage(page: number): void;
  /**
   * read the current rows-per-page. Returns the configured
   * `initialPageSize` (or the latest `setPageSize` value) regardless
   * of whether pagination is currently active.
   */
  getPageSize(): number;
  /**
   * set rows-per-page. Triggers `page-change` on transition;
   * may also collapse the current page index downward on next read.
   * Values `<= 0` are accepted but turn pagination into passthrough
   * (one conceptual page).
   */
  setPageSize(pageSize: number): void;
  /**
   * read the total page count after filter + sort + page.
   * `1` when paginationEnabled is `false`; `0` when paginated and
   * the filtered row set is empty; otherwise `Math.ceil(rows /
   * pageSize)`.
   */
  getTotalPages(): number;
  /**
   * start editing the cell at `(rowId,
   * colId)`. Silently no-ops when the column has `editable !==
   * true` or when the row doesn't exist. When an edit is already
   * in progress on a DIFFERENT cell, the previous edit is
   * committed first (matches click-elsewhere blur semantic). Fires
   * `cell-edit-start` on transition. Verbatim port of vue3 .
   */
  startEditingCell(rowId: string, colId: string): void;
  /**
   * commit the in-flight edit. No-op when no edit is in
   * progress. Fires `cell-value-change` (when draftValue differs
   * from baseValue) + `cell-edit-stop {committed: true}`. Clears
   * the editing state.
   */
  commitEditingCell(): void;
  /**
   * cancel the in-flight edit (revert to baseValue).
   * No-op when no edit is in progress. Fires `cell-edit-stop
   * {committed: false}`. Clears the editing state.
   */
  cancelEditingCell(): void;
  /**
   * read the current editing-cell state. Returns `null`
   * when no edit is active. The returned shape is a snapshot at
   * call time; subsequent typing inside the editor will produce a
   * new `EditingCell` object (immutable mutation).
   */
  getEditingCell(): EditingCell | null;
  /**
   * programmatically update the `draftValue` of the
   * in-flight edit. No-op when no edit is in progress. Used by the
   * SFC's `<input>` onInput handler internally; also exposed for
   * consumers driving the editor from external IME state. Does NOT
   * fire any emit.
   */
  setEditingCellDraft(value: unknown): void;
  /**
   * programmatically open a column-resize
   * session for the given column id. `baseWidth` is read from the
   * current `columnLayoutPass` result. `draftWidth` initialises
   * equal to `baseWidth`; subsequent `pointermove` updates (or
   * programmatic draft updates by consumers wiring custom handles)
   * change it. Silent no-op when the column doesn't exist or has
   * `resizable: false`. Fires `column-resize-start`. Verbatim port
   * of vue3 .
   */
  startResizingColumn(colId: string): void;
  /**
   * commit the in-flight resize. Fires
   * `column-width-change` iff `draftWidth !== baseWidth` (no-op
   * dedup matches `cell-value-change` rule); always
   * fires `column-resize-stop {committed: true}`. Clears the
   * resize state. No-op when no resize is in progress.
   */
  commitColumnResize(): void;
  /**
   * cancel the in-flight resize (revert to baseWidth).
   * No-op when no resize is in progress. Fires `column-resize-stop
   * {committed: false}`. Clears the resize state.
   */
  cancelColumnResize(): void;
  /**
   * read the current resize state. Returns `null` when
   * no resize is active. The returned shape is a snapshot at call
   * time; subsequent pointermoves will produce a new
   * `ColumnResizing` object (immutable mutation).
   */
  getResizingColumn(): ColumnResizing | null;
  /**
   * open a column-move session for `colId`
   * programmatically — bypasses the 5px pointer-down threshold.
   * Silent no-op when the column doesn't exist, is `reorderable:
   * false`, or another move is already in flight. Fires
   * `column-move-start`.
   */
  startMovingColumn(colId: string): void;
  /**
   * commit the in-flight move at the specified target.
   * Fires `column-order-change` iff the resulting column array differs
   * (no-op dedup); always fires `column-move-stop {committed: true}`.
   * No-op when no move is in progress.
   */
  commitColumnMove(targetColId: string, position: 'before' | 'after'): void;
  /**
   * cancel the in-flight move. No-op when no move is in
   * progress. Fires `column-move-stop {committed: false}`. No
   * `column-order-change` emit.
   */
  cancelColumnMove(): void;
  /**
   * read the current move state. Returns `null` when no
   * move is active. Snapshot at call time; subsequent pointermoves
   * produce a new `ColumnMoving` object (immutable mutation).
   */
  getMovingColumn(): ColumnMoving | null;
  /** (vue2 port). Verbatim mirror of vue3 . */
  startMovingRow(rowId: string): void;
  /** (vue2 port). */
  commitRowMove(targetRowId: string, position: 'above' | 'below'): void;
  /** (vue2 port). */
  cancelRowMove(): void;
  /** (vue2 port). */
  getMovingRow(): RowMoving | null;
  /** (2026-05-29 — vue2 port). Verbatim mirror of vue3. */
  refreshServerSideRows(): void;
  /** (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
  invalidateServerSideBlocks(blockIndices: readonly number[]): void;
  /** (2026-05-29 — vue2 port). Verbatim mirror of vue3. */
  getServerSideTotalRowCount(): number;
  /** (2026-05-29 — vue2 port). Verbatim mirror of vue3. */
  getServerSideBlockState(blockIndex: number): BlockState;
  /** (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
  openToolPanel(id: string): void;
  /** (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
  closeToolPanel(): void;
  /** (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
  getActiveToolPanelId(): string | null;
  /** -A (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
  openColumnHeaderMenu(colId: string): void;
  /** -A (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
  closeColumnHeaderMenu(): void;
  /** -A (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
  getOpenColumnHeaderMenuColId(): string | null;
  /** -B (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
  openContextMenuAt(rowId: string | null, colId: string | null, x: number, y: number): void;
  /** -B (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
  closeContextMenu(): void;
  /** -B (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
  getOpenContextMenuPosition(): {
    readonly rowId: string | null;
    readonly colId: string | null;
    readonly x: number;
    readonly y: number;
  } | null;
  /**
   * (2026-05-31 — vue2 port): open the cell style editor
   * popover. Verbatim mirror of vue3 method. No-op when
   * `enableCellStyleEditor` SFC prop is `false`.
   */
  openCellStyleEditor(rowId: string, colId: string): void;
  /**
   * autosize a single column to fit its widest
   * cell content (and header label). Measures every body cell in
   * `pagedRows` via `Canvas.measureText`, takes the max + header
   * width, adds `theme.cellPaddingX * 2` padding, and clamps to the
   * column's `[minWidth, maxWidth]` bounds via `computeAutosizeWidth`.
   * Fires `column-width-change` iff the new width differs from the
   * current resolved width (no-op dedup matches). Silent
   * no-op when the column doesn't exist, is `resizable: false`
   * (cannot mutate width), or is `autosizeable: false` (explicit
   * opt-out).
   */
  autosizeColumn(colId: string): void;
  /**
   * autosize every visible column. Equivalent to calling
   * `autosizeColumn(id)` for each visible column id in display order
   * — emits N `column-width-change` events (one per column whose
   * autosized width actually differs from its current width).
   */
  autosizeAllColumns(): void;
  /**
   * (2026-05-26 — vue2 port of vue3): programmatically
   * open / extend / clear the cell-range. Passing a `CellRange` with
   * `focus === anchor` opens a single-cell range; with `focus !== anchor`
   * opens the range AND immediately extends focus (emits cell-range-start
   * + cell-range-change). Passing `null` is equivalent to
   * `clearCellRange()`. No-op when `cellRangeSelection !== 'enabled'`.
   */
  setCellRange(range: CellRange | null): void;
  /**
   * clear the active cell-range. Fires `cell-range-stop` with
   * the last-known envelope so observers can react to the clear. No-op
   * when no range is active OR `cellRangeSelection !== 'enabled'`.
   */
  clearCellRange(): void;
  /**
   * read the current cell-range as the canonical 2-point
   * form `{anchor, focus}`. Returns `null` when no range is active.
   * Consumers needing the resolved `{rowIds, colIds}` rectangle should
   * call `computeCellRangeEnvelope` themselves, OR observe the
   * `cell-range-change` emit payload (which carries both forms).
   */
  getCellRange(): CellRange | null;
  /**
   * (2026-05-27 — vue2 port of vue3): synthesize a
   * TSV string over the active cell-range envelope + write it to
   * `navigator.clipboard`. Mirrors the Ctrl+C keyboard path so
   * consumers can drive the same flow without a real keyboard event.
   * Returns the TSV string on success, or `null` when no range is
   * active OR `cellRangeSelection !== 'enabled'`. The
   * `navigator.clipboard.writeText` failure path (non-secure context,
   * clipboard policy block) is swallowed — the returned string + the
   * emit still fire so consumers can implement their own fallback.
   */
  copyCellRangeToClipboard(): Promise<string | null>;
  /**
   * (2026-05-27 — vue2 port of vue3): read TSV from
   * `navigator.clipboard` → parse → map against active cell-range
   * envelope (1×1 fill-all + N×M clamp-overflow per Decision A.1) →
   * coerce per `column.type` via `coerceEditDraftValue` → emit
   * `cell-range-paste` with the mutations array. Mirrors the Ctrl+V
   * keyboard path so consumers can drive the same flow without a
   * real keyboard event. Returns the mutations array on success, or
   * `null` when no range is active OR `cellRangeSelection !==
   * 'enabled'` OR the clipboard read failed.
   */
  pasteCellRangeFromClipboard(): Promise<readonly PasteMutation[] | null>;
  /**
   * (2026-05-27 — vue2 port of vue3): programmatic
   * drag-fill commit. Extends the active cell-range envelope to include
   * `targetCell` (axis-locked per Decision A.1), computes the constant-
   * fill mutations via `computeDragFillMutations`, emits
   * `cell-range-fill` (with `jsEvent: null` for the programmatic path),
   * and auto-extends the active `cellRange` to cover the fill envelope
   * so the post-call selection matches the visible fill extent.
   *
   * Returns the mutations array on success, or `null` when no range is
   * active OR `cellRangeSelection !== 'enabled'` OR `targetCell` falls
   * outside the displayed grid OR `targetCell` is inside / above-left
   * of the source (no preview, no commit).
   */
  fillCellRange(targetCell: CellRef): readonly PasteMutation[] | null;
  /**
   * (2026-05-27 — vue2 port of vue3): pop the
   * newest entry from `past` + fire `history-replay` with the
   * REVERSED batch. Returns `true` if a batch was undone, `false`
   * when `past` was empty (no-op) or `enableUndoHistory !== true`.
   */
  undo(): boolean;
  /** pop the newest entry from `future` + fire `history-replay` with the ORIGINAL batch. */
  redo(): boolean;
  /** `true` when the next `undo()` call would do something. */
  canUndo(): boolean;
  /** `true` when the next `redo()` call would do something. */
  canRedo(): boolean;
  /** reset internal mutation history to `EMPTY_MUTATION_HISTORY` + fire `history-change`. */
  clearHistory(): void;
  /** read the current internal `{past, future}` state. */
  getHistory(): MutationHistoryState;
  /**
   * manually append a custom batch to the history. Lets
   * consumers record bulk-imports / undo-able custom edits that bypass
   * the 3 built-in mutation emit paths. No-op when
   * `enableUndoHistory !== true`.
   */
  recordMutationBatch(batch: MutationBatch): void;
  /**
   * (2026-05-27 — vue2 port of vue3): programmatic
   * equivalent of the column-visibility-menu checkbox click. Fires
   * `column-visibility-change` with `{column, hidden, jsEvent: null}`;
   * honors the "at least one column visible" guard per Decision C.1.
   * Emit-only persistence per A.1 — consumer rebuilds the `columns`
   * prop with the new `hide` value.
   */
  setColumnVisibility(colId: string, hidden: boolean): void;
  /**
   * (vue2 port): convenience for toggling a column's `hide`
   * state. Routes through `setColumnVisibility` so C.1 guard applies.
   */
  toggleColumnVisibility(colId: string): void;
  /**
   * (2026-05-28 — vue2 port of vue3): read the current
   * keyboard-driven active cell. Returns null when no cell is active.
   */
  getActiveCell(): CellRef | null;
  /**
   * (vue2 port): programmatically set the active cell. Fires
   * `active-cell-change` on transition (dedup).
   */
  setActiveCell(rowId: string, colId: string): void;
  /**
   * (vue2 port): programmatically clear the active cell.
   */
  clearActiveCell(): void;
  /**
   * (vue2 port, 2026-05-28): programmatically expand a tree
   * row. No-op when already expanded or has no children. Fires
   * `expanded-change` on transition.
   */
  expandRow(rowId: string): void;
  /**
   * (vue2 port, 2026-05-28): programmatically collapse a
   * tree row. No-op when already collapsed or has no children. Fires
   * `expanded-change` on transition.
   */
  collapseRow(rowId: string): void;
  /** (2026-05-28 — vue2 port): get lazy-load status for a row. */
  getLazyChildrenState(rowId: string): LazyChildrenStatus | 'idle';
  /** (2026-05-28 — vue2 port): get cached lazy children for a row. */
  getLazyChildren(rowId: string): readonly RowSpec[] | null;
  /** (2026-05-28 — vue2 port): drop the lazy state entry for a row (or all rows). */
  invalidateLazyChildren(rowId?: string): void;
  /** (2026-05-28 — vue2 port): export rows + columns to a CSV file (browser download). */
  exportToCsv(filename: string, options?: TableHandleExportToCsvOptions): void;
  /**
   * (2026-05-29 — vue2 port): project the current `(columns,
   * sort, filter, page, pageSize)` state into a JSON-serializable
   * `TableViewState` snapshot. Verbatim mirror of vue3 .
   */
  getTableView(): TableViewState;
  /**
   * (2026-05-29 — vue2 port): reconcile a saved
   * `TableViewState` against the current `columns` prop + dispatch to
   * 4 setters + emit `columns-change` once with the reconciled array.
   * Foreign / unknown `version` inputs no-op silently. Verbatim mirror
   * of vue3 .
   */
  applyTableView(state: TableViewState): void;
  /**
   * (2026-05-29 — vue2 port): serialize the current rows +
   * columns into an XLSX `ArrayBuffer` and trigger a browser download.
   * Verbatim mirror of vue3 wrapper. Throws when `exceljs` is
   * not installed (optional peer dep on `@chronixjs/table`).
   */
  exportToXlsx(filename: string, options?: TableHandleExportToXlsxOptions): Promise<void>;
  /**
   * (2026-05-29 — vue2 port): produce a multi-sheet .xlsx
   * workbook in one call. Verbatim mirror of vue3 method.
   */
  exportToXlsxMultiSheet(filename: string, sheets: readonly AdapterXlsxSheetSpec[]): Promise<void>;
  /**
   * (2026-06-02 — vue2 port): snapshot of every currently
   * invalid cell. Mirrors vue3 .
   */
  getInvalidCells(): readonly InvalidCellEntry[];
  /**
   * (2026-06-02 — vue2 port): read the multi-filter
   * entry at the given path. Empty path throws.
   */
  getMultiFilterEntryAtPath(colId: string, path: readonly number[]): MultiFilterEntry | null;
  /**
   * (2026-06-02 — vue2 port): immutable replace of the
   * multi-filter entry at the given path. Empty path throws.
   */
  setMultiFilterEntryAtPath(colId: string, path: readonly number[], next: MultiFilterEntry): void;
  /**
   * (2026-06-02 — vue2 port): splice out the
   * multi-filter entry at the given path. Empty path throws.
   */
  removeMultiFilterEntryAtPath(colId: string, path: readonly number[]): void;
}

/**
 * (2026-06-02 — vue2 port): invalid-cell record. Mirrors
 * vue3 `InvalidCellEntry` shape.
 */
export interface InvalidCellEntry {
  readonly rowId: string;
  readonly colId: string;
  readonly error: EditValidationError;
}

/** (2026-05-28 — vue2 port): options for `TableHandle.exportToCsv`. */
export interface TableHandleExportToCsvOptions {
  readonly rowSource?: 'all' | 'visible' | 'filtered' | 'selected';
  readonly visibleColumnsOnly?: boolean;
  readonly csvOptions?: ExportToCsvOptions;
}

/** (2026-05-29 — vue2 port): options for `TableHandle.exportToXlsx`. */
export interface TableHandleExportToXlsxOptions {
  readonly rowSource?: 'all' | 'visible' | 'filtered' | 'selected';
  readonly visibleColumnsOnly?: boolean;
  readonly xlsxOptions?: ExportToXlsxOptions;
}

/** (2026-05-29 — vue2 port): per-sheet spec for `exportToXlsxMultiSheet`. */
export interface AdapterXlsxSheetSpec {
  readonly sheetName: string;
  readonly rowSource?: 'all' | 'visible' | 'filtered' | 'selected';
  readonly columnIds?: readonly string[];
  readonly includeHeaders?: boolean;
  /** (2026-05-29 — vue2 port): per-sheet xlsx-level options (e.g. freezePane). */
  readonly xlsxOptions?: ExportToXlsxOptions;
}

/**
 * payload for the `cell-click` emit. Fires
 * when a body cell receives a primary-button click. `value` is the
 * post-`valueGetter` cell value (the same value `valueFormatter` /
 * `cellClass` would see during render). Verbatim port of vue3
 * `CellClickPayload` (commit `3804764`).
 */
export interface CellClickPayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly value: unknown;
  readonly jsEvent: MouseEvent;
}

/** payload for the `row-click` emit. */
export interface RowClickPayload {
  readonly row: RowSpec;
  readonly jsEvent: MouseEvent;
}

/** payload for the `row-mouseenter` emit. */
export interface RowMouseenterPayload {
  readonly row: RowSpec;
  readonly jsEvent: PointerEvent;
}

/** payload for the `row-mouseleave` emit. */
export interface RowMouseleavePayload {
  readonly row: RowSpec;
  readonly jsEvent: PointerEvent;
}

/**
 * payload for the `header-click` emit.
 * Fires when a header cell receives a primary-button click.
 * Verbatim port of vue3 `HeaderClickPayload` (commit
 * `5a3000a`). Sort phases (42 / 42.1) will wire this into setSort.
 */
export interface HeaderClickPayload {
  readonly column: ColumnSpec;
  readonly jsEvent: MouseEvent;
}

/**
 * payload for the `header-group-click` emit.
 * Fires when a labelled column-group cell in the second header row
 * receives a primary-button click. Empty placeholder spans (un-grouped
 * columns when ANY column declares `headerGroup`) do NOT emit — they
 * have no `data-group-name` attr for the delegate to resolve.
 * Verbatim port of vue3 `HeaderGroupClickPayload`.
 */
export interface HeaderGroupClickPayload {
  readonly groupName: string;
  readonly colIds: readonly string[];
  readonly jsEvent: MouseEvent;
}

/**
 * payload for the `empty-area-click` emit. Fires when a
 * body click lands inside `.cx-table-body-content` but NOT on any
 * row (e.g., in padding when body height exceeds totalBodyHeight).
 * Mutually exclusive with `row-click`/`cell-click` for the same event.
 */
export interface EmptyAreaClickPayload {
  readonly jsEvent: MouseEvent;
}

/** payload for the `cell-dblclick` emit (cell double-click). */
export interface CellDblclickPayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly value: unknown;
  readonly jsEvent: MouseEvent;
}

/** payload for the `row-dblclick` emit (row double-click). */
export interface RowDblclickPayload {
  readonly row: RowSpec;
  readonly jsEvent: MouseEvent;
}

/**
 * + 42.1 (2026-05-25): payload for the `sort-change` emit.
 * Fires every time the internal sort state transitions — including
 * transitions back to `[]` (sort cleared) or to / from a multi-
 * column lex-order arrangement. Consumers can mirror `sortSpec`
 * into external state (URL, store) without using a controlled prop.
 */
export interface SortChangePayload {
  readonly sortSpec: readonly SortSpec[];
}

/**
 * payload for the `filter-change` emit.
 * Fires every time the internal filter state transitions — including
 * transitions back to `[]` (filter cleared) and per-keystroke when
 * the consumer types into a `showFilterRow` input. Consumers can
 * mirror `filterSpec` into external state without a controlled prop.
 * Verbatim port of vue3 `FilterChangePayload`.
 */
export interface FilterChangePayload {
  readonly filterSpec: readonly FilterSpec[];
}

/**
 * (2026-05-29 — vue2 port): payload for the
 * `quick-find-text-change` emit. Fires every time the internal
 * quick-find needle transitions — including transitions back to
 * `''` (cleared) and per-keystroke when the consumer calls
 * `setQuickFindText` from a controlled input. Consumers can mirror
 * `quickFindText` into external state without a controlled prop.
 * Verbatim port of vue3 `QuickFindTextChangePayload`.
 */
export interface QuickFindTextChangePayload {
  readonly quickFindText: string;
}

/**
 * payload for the `selection-change` emit.
 * Fires every time the internal selection state transitions — single
 * select, multi-select toggle, clear, programmatic setSelectedRowIds,
 * etc. `selectedRowIds` is the full current selection in insertion
 * order (NOT a diff of changed rows). Consumers can mirror to URL
 * state / store; the array shape is JSON-serializable by design.
 * Verbatim port of vue3 `SelectionChangePayload`.
 */
export interface SelectionChangePayload {
  readonly selectedRowIds: readonly string[];
}

/**
 * opt-in selection column config. When
 * `show: true`, the SFC renders an independent rail of `<input
 * type="checkbox">` cells before (`side: 'left'`) or after
 * (`side: 'right'`) the column-driven body. The rail sits outside
 * the consumer's `columnLayoutPass` math — its width is the fixed
 * `theme.selectionColumnWidth` (default 36) and does not consume
 * any flex budget from data columns. Verbatim port of vue3 Phase
 * 10.1's `SelectionColumnConfig`.
 */
export interface SelectionColumnConfig {
  readonly show: boolean;
  readonly side: 'left' | 'right';
}

/**
 * payload for the `page-change` emit. Fires
 * on every transition of the internal `(page, pageSize)` tuple —
 * `setPage`, `setPageSize`, the footer `«` / `»` buttons + size
 * `<select>`, AND the auto-reset to page 0 when filter/sort
 * transitions. `page` is 0-based (the footer renders `page + 1`).
 * Consumers can mirror to URL / store; the shape is JSON-serializable
 * by design. Verbatim port of vue3 `PageChangePayload`.
 */
export interface PageChangePayload {
  readonly page: number;
  readonly pageSize: number;
}

/**
 * (2026-05-26 — vue2 port of vue3): payload for
 * `cell-range-start` — fires when a cell-range session opens
 * (pointerdown on a body cell with `cellRangeSelection === 'enabled'`
 * OR programmatic `setCellRange`). `jsEvent` is `null` for the
 * programmatic-start path. The `range` carries the freshly-anchored
 * {anchor, focus} pair (focus === anchor at start).
 */
export interface CellRangeStartPayload {
  readonly range: CellRange;
  readonly jsEvent: PointerEvent | null;
}

/**
 * payload for `cell-range-change` — fires on every pointer
 * move that resolves a NEW cell under the cursor (focus changed), AND
 * on shift+click extend, AND on programmatic `setCellRange` with an
 * asymmetric {anchor, focus} pair. The `envelope` field carries the
 * resolved `{rowIds, colIds}` rectangle for consumer convenience.
 */
export interface CellRangeChangePayload {
  readonly range: CellRange;
  readonly envelope: CellRangeEnvelope;
  readonly jsEvent: PointerEvent | MouseEvent | null;
}

/**
 * payload for `cell-range-stop` — fires on pointerup that
 * commits a drag-extend session, on shift+click that commits an
 * extend, and on programmatic `clearCellRange()`. After
 * `cell-range-stop`, the range is committed — it stays in state
 * until cleared or replaced by a new session.
 */
export interface CellRangeStopPayload {
  readonly range: CellRange;
  readonly envelope: CellRangeEnvelope;
  readonly jsEvent: PointerEvent | MouseEvent | null;
}

/**
 * (2026-05-27 — vue2 port of vue3): payload for
 * `cell-range-paste` — fires when the user presses Ctrl+V (Win/Linux)
 * / Cmd+V (macOS) over a focused body element with
 * `cellRangeSelection === 'enabled'` AND an active non-empty range,
 * OR when consumers call `handle.pasteCellRangeFromClipboard()`
 * programmatically. `jsEvent` is `null` for the programmatic path.
 * `text` is the raw clipboard string returned by
 * `navigator.clipboard.readText()` (un-parsed — `mutations` is the
 * parsed + coerced + clamped form ready for consumer write-back).
 *
 * The `mutations` array contains ONLY cells that actually changed
 * (no-op dedup against current value) AND cells that successfully
 * coerced via `coerceEditDraftValue` (rejected cells silently
 * skipped — matches reject-and-keep semantic).
 */
export interface CellRangePastePayload {
  readonly envelope: CellRangeEnvelope;
  readonly mutations: readonly PasteMutation[];
  readonly text: string;
  readonly jsEvent: KeyboardEvent | null;
}

/**
 * (2026-05-27 — vue2 port of vue3): payload for
 * `cell-range-copy` — fires when the user presses Ctrl+C (Win/Linux)
 * / Cmd+C (macOS) over a focused body element with
 * `cellRangeSelection === 'enabled'` AND an active non-empty range,
 * OR when consumers call `handle.copyCellRangeToClipboard()`
 * programmatically. `jsEvent` is `null` for the programmatic path.
 * `text` is the formatted TSV string (the same value passed to
 * `navigator.clipboard.writeText`).
 */
export interface CellRangeCopyPayload {
  readonly envelope: CellRangeEnvelope;
  readonly text: string;
  readonly jsEvent: KeyboardEvent | null;
}

/**
 * (2026-05-27 — vue2 port of vue3): payload for
 * `cell-range-fill-start` — fires once at pointerdown on the drag-fill
 * handle. The `source` field captures the envelope at the moment the
 * drag began; subsequent fill-change + fill emits reference the same
 * source value so consumers can pair the lifecycle deterministically.
 */
export interface CellRangeFillStartPayload {
  readonly source: CellRangeEnvelope;
  readonly jsEvent: PointerEvent;
}

/**
 * payload for `cell-range-fill-change` — fires on every
 * pointermove that resolves a NEW preview envelope (`fill !==
 * previous`). Used by consumers for live preview UI.
 */
export interface CellRangeFillChangePayload {
  readonly source: CellRangeEnvelope;
  readonly fill: CellRangeEnvelope;
  readonly jsEvent: PointerEvent;
}

/**
 * payload for `cell-range-fill` — fires once at pointerup
 * (drag commit) OR at programmatic `fillCellRange(targetCell)`. The
 * `mutations` array mirrors `CellRangePastePayload`'s shape so
 * consumers can reuse batch-apply handler code.
 * Source cells (in `source ∩ fill`) are NEVER emitted — drag-fill is
 * EXTENSION-only per Decision B.1.
 */
export interface CellRangeFillPayload {
  readonly source: CellRangeEnvelope;
  readonly fill: CellRangeEnvelope;
  readonly mutations: readonly PasteMutation[];
  readonly jsEvent: PointerEvent | null;
}

/**
 * (2026-05-27 — vue2 port of vue3): payload for
 * `history-replay` — fires when Ctrl+Z (undo) / Ctrl+Y / Ctrl+Shift+Z
 * (redo) replays a recorded mutation batch OR programmatic `undo()` /
 * `redo()`. `jsEvent` is `null` for the programmatic path.
 *
 * `batch.mutations` is ALREADY in apply-ready form:
 *
 * - On `direction: 'undo'` the mutations are REVERSED (oldValue +
 *   newValue swapped from the originally-recorded batch).
 * - On `direction: 'redo'` the mutations are the ORIGINAL recorded
 *   batch.
 *
 * Consumers apply `batch.mutations` to their `rows` array via the
 * SAME Map-keyed batch-write code path used for `cell-range-paste` /
 * `cell-range-fill` — no per-direction branching needed in consumer
 * handlers.
 */
export interface HistoryReplayPayload {
  readonly direction: 'undo' | 'redo';
  readonly batch: MutationBatch;
  readonly jsEvent: KeyboardEvent | null;
}

/**
 * payload for `history-change` — fires every time the
 * internal `mutationHistoryRef` transitions. Consumers use this to
 * update undo / redo button-disabled states + display history counts.
 */
export interface HistoryChangePayload {
  readonly history: MutationHistoryState;
}

/**
 * payload for `cell-edit-start` — fires
 * when the user (or programmatic `startEditingCell`) opens an
 * editor on a cell. `baseValue` mirrors the cell's pre-edit value
 * after `valueGetter`. `draftValue` initialises equal to baseValue
 * (or its formatted string, depending on the consumer's
 * valueFormatter — see Decision B.1). Verbatim port of vue3 Phase
 * 12's `CellEditStartPayload`.
 */
export interface CellEditStartPayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly baseValue: unknown;
  readonly draftValue: unknown;
}

/**
 * payload for `cell-edit-stop` — fires on
 * every commit-attempt resolution. Three outcomes (
 * widens the original 2-outcome contract):
 *
 * - **Commit success** (Enter / Tab / Blur with valid input):
 *   `committed: true`, `finalValue: coerced.value`. Edit session
 *   ENDS. Followed by a `cell-value-change` emit iff `finalValue
 *   !== baseValue` (no-op dedup matches applySelection
 *   precedent).
 * - **Cancel** (Esc): `committed: false`, `finalValue: baseValue`.
 *   Edit session ENDS. No `cell-value-change` emit.
 * - **Commit rejected** (+: invalid input on a typed
 *   column — `coerceEditDraftValue` returned `{ok: false}`):
 *   `committed: false`, `finalValue: baseValue`. Edit session
 *   STAYS OPEN — the editor remains rendered so the user can fix
 *   the input. No `cell-value-change` emit. Distinguish from
 *   "cancel" via `getEditingCell()` returning non-null
 *   immediately after the emit.
 * - **Commit rejected by validator** (2026-06-01): the
 *   coerce step passed but `column.validator(coercedValue, row)`
 *   returned a non-null result. Same shape as the coerce-rejected
 *   case (`committed: false`, editor stays open, no
 *   `cell-value-change` emit) PLUS `validationError` is populated
 *   with the normalised `EditValidationError`. Consumers can branch
 *   on `validationError != null` to render rejection feedback (the
 *   chronix SFC paints the cell with `cx-table-cell--invalid` +
 *   `data-cell-invalid="true"` + `aria-invalid="true"` regardless).
 */
export interface CellEditStopPayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly committed: boolean;
  readonly finalValue: unknown;
  /**
   * populated only when the
   * commit was rejected by `column.validator` (sync) or
   * `column.validatorAsync` . Absent for commit-success,
   * cancel, and coerce-rejected outcomes.
   */
  readonly validationError?: EditValidationError;
}

/**
 * (2026-06-01 — vue2 port): payload for
 * `cell-edit-validation-pending`. Verbatim mirror of vue3.
 */
export interface CellEditValidationPendingPayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly draftValue: unknown;
}

/**
 * (2026-06-02 — vue2 port): args for the
 * `multiFilterChildRenderer` slot prop. Verbatim mirror of vue3
 * . Consumer's renderer returns `VNode | null`; non-null
 * replaces the built-in slot widget, `null` falls back.
 */
export interface MultiFilterChildRendererArgs {
  readonly column: ColumnSpec;
  readonly slotIdx: number;
  readonly slotKind: 'text' | 'number' | 'set';
  /** (2026-06-02 — vue2 port): widened to MultiFilterEntry. */
  readonly child: MultiFilterEntry;
  readonly setChildValue: (next: MultiFilterEntry) => void;
}

/**
 * (2026-06-02 — vue2 port): payload for `invalid-cells-
 * change`. Verbatim mirror of vue3 .
 */
export interface InvalidCellsChangePayload {
  readonly entries: readonly InvalidCellEntry[];
  readonly count: number;
}

/**
 * (2026-06-02 — vue2 port): payload for
 * `add-multi-filter-slot`. Verbatim mirror of vue3.
 *
 * extended with optional `path?: readonly number[]` so
 * group-aware consumers can route the add to a nested group
 * (Decision D.1).
 */
export interface AddMultiFilterSlotPayload {
  readonly colId: string;
  readonly slotKind: 'text' | 'number';
  readonly path?: readonly number[];
}

/**
 * (2026-06-02 — vue2 port): payload for
 * `remove-multi-filter-slot`. Verbatim mirror of vue3.
 *
 * extended with optional `path?: readonly number[]`
 * carrying the parent-group path. Root removals send `[]` or omit.
 */
export interface RemoveMultiFilterSlotPayload {
  readonly colId: string;
  readonly slotIdx: number;
  readonly path?: readonly number[];
}

/**
 * (2026-06-02 — vue2 port): payload for the NEW
 * `add-multi-filter-group` emit (Decision D.1). `path` is required
 * — every group add specifies its parent-group location (root = `[]`).
 */
export interface AddMultiFilterGroupPayload {
  readonly colId: string;
  readonly path: readonly number[];
}

/**
 * (2026-06-02 — vue2 port): payload for the NEW
 * `remove-multi-filter-group` emit. `path` points at the GROUP
 * entry itself (full path including final idx).
 */
export interface RemoveMultiFilterGroupPayload {
  readonly colId: string;
  readonly path: readonly number[];
}

/**
 * payload for `cell-value-change` — fires
 * on commit when `draftValue !== baseValue`. `oldValue` is the
 * pre-edit value (i.e., the `baseValue` from the matching
 * `cell-edit-start`); `newValue` is the committed draft.
 *
 * Consumers MUST mirror this into their own state — chronix-table
 * is unopinionated about persistence and does NOT mutate the
 * consumer's `rows` prop on commit. The displayed cell value won't
 * change until the consumer updates the `rows` prop (e.g., by
 * mutating `row.data[column.field]` or by passing a new array).
 */
export interface CellValueChangePayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}

/**
 * per-cell style override shape. All 9
 * axis fields are optional; each cell can carry any combination
 * (background-only, font-only, all 9, etc.). Used as the entry
 * shape for the (optional) controlled-mode SFC prop
 * `cellStyleByRowIdColId?: Record<rowId, Record<colId, CellStyle>>`
 * and as the persisted-form shape of the internal uncontrolled-mode
 * reactive map. Distinct from the `cell-style-change` emit payload's
 * `style` shape (which uses `string | null` to discriminate
 * "newly committed value" vs "cleared" vs "no change to this axis").
 */
export interface CellStyle {
  readonly backgroundColor?: string;
  readonly color?: string;
  readonly fontWeight?: string;
  readonly fontStyle?: string;
  readonly textDecoration?: string;
  readonly borderColor?: string;
  readonly borderWidth?: string;
  readonly borderStyle?: string;
  readonly borderRadius?: string;
  // (2026-06-01 — vue2 port): 12 per-side border
  // override fields (4 sides × 3 axes). Verbatim mirror of vue3.
  readonly borderTopColor?: string;
  readonly borderTopWidth?: string;
  readonly borderTopStyle?: string;
  readonly borderRightColor?: string;
  readonly borderRightWidth?: string;
  readonly borderRightStyle?: string;
  readonly borderBottomColor?: string;
  readonly borderBottomWidth?: string;
  readonly borderBottomStyle?: string;
  readonly borderLeftColor?: string;
  readonly borderLeftWidth?: string;
  readonly borderLeftStyle?: string;
}

// (2026-06-01 — vue2 port): internal mutable variant
// of CellStyle. Verbatim mirror of vue3.
interface CellStyleEntry {
  backgroundColor?: string;
  color?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderRadius?: string;
  borderTopColor?: string;
  borderTopWidth?: string;
  borderTopStyle?: string;
  borderRightColor?: string;
  borderRightWidth?: string;
  borderRightStyle?: string;
  borderBottomColor?: string;
  borderBottomWidth?: string;
  borderBottomStyle?: string;
  borderLeftColor?: string;
  borderLeftWidth?: string;
  borderLeftStyle?: string;
}

/**
 * built-in default for the
 * `cellStylePresetColors` SFC prop. 12-color Tailwind-derived
 * palette (consumers with brand systems override).
 */
export const CELL_STYLE_DEFAULT_PRESET_COLORS: readonly string[] = [
  '#f87171',
  '#fb923c',
  '#facc15',
  '#4ade80',
  '#2dd4bf',
  '#60a5fa',
  '#818cf8',
  '#c084fc',
  '#f472b6',
  '#9ca3af',
  '#000000',
  '#ffffff',
];

const CELL_STYLE_HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

/**
 * in-flight cell-edit state. Tracks the
 * single currently-active edit; chronix-table allows only ONE cell
 * to be in edit mode at a time. `baseValue` is the pre-edit value
 * (used by Esc/cancel to revert + by commit-dedup to suppress no-op
 * emit); `draftValue` is the user's in-progress input that mutates
 * as they type (internal-only; not emitted on every keystroke).
 *
 * Both values are `unknown` because the built-in editor
 * is text-only — the actual draft is always a string, but the
 * baseValue may be any cell value (including null / Date / number
 * round-tripped through `String(...)`). (number editor)
 * will keep the same shape with stricter coercion on commit.
 * Verbatim port of vue3 `EditingCell`.
 */
export interface EditingCell {
  readonly rowId: string;
  readonly colId: string;
  readonly baseValue: unknown;
  readonly draftValue: unknown;
}

/**
 * internal in-flight column-resize
 * transaction. Created on `pointerdown` over a header resizer;
 * updated on every `pointermove` (draftWidth changes); cleared on
 * `pointerup` (commit) or `pointercancel` / `lostpointercapture` /
 * `cancelColumnResize()` (cancel). Mirrors the `EditingCell`
 * shape so the architectural pattern stays uniform across write-back
 * surfaces. Verbatim port of vue3 .
 */
export interface ColumnResizing {
  readonly colId: string;
  readonly baseWidth: number;
  readonly draftWidth: number;
  readonly startX: number;
  readonly pointerId: number;
}

/**
 * payload for `column-resize-start` — fires
 * when the user presses pointer on the resizer (or programmatic
 * `startResizingColumn` is called). `baseWidth` is the resolved
 * pre-drag width from `columnLayoutPass`. `draftWidth` initialises
 * equal to baseWidth (first pointermove will update it).
 */
export interface ColumnResizeStartPayload {
  readonly column: ColumnSpec;
  readonly baseWidth: number;
  readonly draftWidth: number;
}

/**
 * payload for `column-resize-stop` — fires
 * on every resize-session end. Two outcomes:
 *
 * - **Commit** (pointerup with a clean release): `committed: true`,
 *   `finalWidth: draftWidth`. Followed by a `column-width-change`
 *   emit iff `draftWidth !== baseWidth` (no-op dedup matches Phase
 *   46's `cell-value-change` rule).
 * - **Cancel** (pointercancel / lostpointercapture /
 *   `cancelColumnResize()`): `committed: false`,
 *   `finalWidth: baseWidth`. No `column-width-change` emit.
 */
export interface ColumnResizeStopPayload {
  readonly column: ColumnSpec;
  readonly committed: boolean;
  readonly finalWidth: number;
}

/**
 * payload for `column-width-change` — fires
 * on commit when `draftWidth !== baseWidth`. `oldWidth` is the
 * pre-drag resolved width; `newWidth` is the clamped (per
 * `clampResizeWidth`) committed width.
 *
 * Consumers MUST mirror this into their own `columns` state —
 * chronix-table is unopinionated about persistence and does NOT
 * mutate the `columns` prop. Typical rebuild pattern:
 * `this.columns = this.columns.map((c) => c.id === payload.column.id
 *    ? { ...cWithoutFlex, width: payload.newWidth } : c)`.
 * Clearing `flex` is intentional per Decision B.1 — resizing a
 * flex column converts it to an explicit-width column so other
 * flex columns continue to share the remaining space proportionally.
 */
export interface ColumnWidthChangePayload {
  readonly column: ColumnSpec;
  readonly oldWidth: number;
  readonly newWidth: number;
}

/**
 * (2026-05-26 — vue2 port of vue3): pending column-move
 * state, set on header-cell pointerdown and held until the cursor crosses
 * the 5px Chebyshev threshold (promoted to `ColumnMoving`) or pointerup
 * arrives without crossing (cleared — header click → sort cycle takes
 * over). Verbatim shape from vue3.
 */
export interface PendingColumnMove {
  readonly colId: string;
  readonly startClientX: number;
  readonly startClientY: number;
  readonly pointerId: number;
}

/**
 * in-flight column-move transaction. Created when
 * a pending move is promoted to active. Updated on every pointermove
 * (`dropTarget` + `dropLineLeftPx` recomputed via `getColumnDropTarget`).
 * Cleared on pointerup (commit) or pointercancel / lostpointercapture /
 * `cancelColumnMove()` (cancel). Mirrors `ColumnResizing` shape.
 */
export interface ColumnMoving {
  readonly colId: string;
  readonly startClientX: number;
  readonly dropTarget: ColumnDropTarget | null;
  readonly dropLineLeftPx: number | null;
  readonly pointerId: number;
}

/**
 * payload for `column-move-start`. Fires when the drag crosses
 * the 5px threshold or `startMovingColumn` is called programmatically.
 */
export interface ColumnMoveStartPayload {
  readonly column: ColumnSpec;
  readonly startClientX: number;
}

/**
 * payload for `column-move-stop`. Fires on every active move-
 * session end. Two outcomes: Commit (`committed: true`, `dropTarget` =
 * resolved target, followed by `column-order-change` iff the reorder is
 * meaningful) and Cancel (`committed: false`, `dropTarget` may be null,
 * no `column-order-change` emit).
 */
export interface ColumnMoveStopPayload {
  readonly column: ColumnSpec;
  readonly committed: boolean;
  readonly dropTarget: ColumnDropTarget | null;
}

/**
 * payload for `column-order-change`. Fires on commit when the
 * drag resolves to a meaningful reorder. Consumers MUST mirror by passing
 * `(movedColumn.id, targetColumn.id, position)` through `computeColumnReorder`
 * to rebuild their columns prop (Decision A.1 — emit-only persistence).
 */
export interface ColumnOrderChangePayload {
  readonly movedColumn: ColumnSpec;
  readonly targetColumn: ColumnSpec;
  readonly position: 'before' | 'after';
  readonly oldColumnIds: readonly string[];
  readonly newColumnIds: readonly string[];
}

/** (2026-05-29 — vue2 port). Verbatim port of vue3 . */
export interface RowDragColumnConfig {
  readonly show: boolean;
  readonly side?: 'left' | 'right';
}

/** (2026-05-31 — vue2 port). Verbatim port of vue3 . */
export interface RowDragAutoScrollConfig {
  readonly enabled?: boolean;
  readonly triggerZonePx?: number;
  readonly maxVelocityPxPerFrame?: number;
}

/** (vue2 port). */
export interface PendingRowMove {
  readonly rowId: string;
  readonly startClientX: number;
  readonly startClientY: number;
  readonly pointerId: number;
}

/** (vue2 port). */
export interface RowMoving {
  readonly rowId: string;
  readonly startClientY: number;
  readonly dropTarget: RowDropTarget | null;
  readonly dropLineTopPx: number | null;
  readonly pointerId: number;
}

/** (vue2 port). */
export interface RowMoveStartPayload {
  readonly row: RowSpec;
  readonly startClientY: number;
}

/** (vue2 port). */
export interface RowMoveStopPayload {
  readonly row: RowSpec;
  readonly committed: boolean;
  readonly dropTarget: RowDropTarget | null;
}

/** (vue2 port). */
export interface RowOrderChangePayload {
  readonly movedRow: RowSpec;
  readonly targetRow: RowSpec;
  readonly position: 'above' | 'below';
  readonly oldRowIds: readonly string[];
  readonly newRowIds: readonly string[];
}

/**
 * (2026-05-27 — vue2 port of vue3): payload for
 * `column-visibility-change`. Fires when the user toggles a column's
 * checkbox in the visibility menu OR a programmatic
 * `setColumnVisibility` / `toggleColumnVisibility` call runs. Carries
 * the post-toggle `hidden` value. `jsEvent` is `null` for programmatic
 * invocations. Emit-only persistence per A.1.
 */
export interface ColumnVisibilityChangePayload {
  readonly column: ColumnSpec;
  readonly hidden: boolean;
  readonly jsEvent: Event | null;
}

/**
 * (2026-05-29 — vue2 port of vue3): payload for
 * `columns-change` — fires once per `applyTableView()` call after the
 * saved `TableViewState` has been reconciled against the current
 * `columns` prop. Verbatim mirror of vue3 `ColumnsChangePayload`.
 */
export interface ColumnsChangePayload {
  readonly columns: readonly ColumnSpec[];
  readonly reason: 'apply-view';
}

/**
 * (2026-05-28 — vue2 port of vue3): payload for
 * `active-cell-change`. Both `rowId` and `colId` are `null` together
 * when the active cell is cleared (Escape / clearActiveCell). Emit-
 * only; internal-state ownership.
 */
export interface ActiveCellChangePayload {
  readonly rowId: string | null;
  readonly colId: string | null;
  readonly jsEvent: Event | null;
}

/**
 * (vue2 port, 2026-05-28): payload for the `expanded-change`
 * emit. Fires on every transition of the tree-data expand state —
 * chevron click, Enter / Space toggle, ArrowRight expand, ArrowLeft
 * collapse, `expandRow` / `collapseRow` TableHandle calls. `next` is
 * the full ordered list of expanded row IDs after the transition.
 *
 * In controlled mode (`expandedRowIds` prop set), the SFC does not
 * mutate state — consumers MUST handle this emit + update the prop
 * binding for expand state to take effect. In uncontrolled mode, the
 * SFC has already applied the change before emitting.
 */
export interface ExpandedChangePayload {
  readonly next: readonly string[];
}

/** (2026-05-28 — vue2 port): payload for `lazy-load-start`. */
export interface LazyLoadStartPayload {
  readonly parent: RowSpec;
}

/** (2026-05-28 — vue2 port): payload for `lazy-load-success`. */
export interface LazyLoadSuccessPayload {
  readonly parent: RowSpec;
  readonly children: readonly RowSpec[];
}

/** (2026-05-28 — vue2 port): payload for `lazy-load-error`. */
export interface LazyLoadErrorPayload {
  readonly parent: RowSpec;
  readonly error: unknown;
}

/**
 * minimum vue2 wrapper for chronix-table.
 *
 * Renders a `<div class="cx-table-wrapper" role="grid">` containing
 * a header rowgroup + body rowgroup. Column widths are resolved by
 * the core's `columnLayoutPass` against the wrapper's reactive
 * `clientWidth` (observed via `ResizeObserver`). No interactions,
 * no virtualization, no header groups — those land in subsequent
 * vue2 phases (41.1 / 41.2 / 42 / 43 / etc) mirroring vue3's 8→13.
 *
 * Verbatim port of chronix-table-vue3's SFC (commit
 * `3518eb7`). Vue 2.7's composition API surface is identical to
 * Vue 3 for everything uses; the only delta is
 * `ctx.expose(handle)` instead of destructuring `expose` from the
 * setup context (Vue 2.7 uses the `setup(props, ctx)` signature).
 *
 * **DOM contract (+ + + identical to vue3 + + +):**
 *
 * - `.cx-table-wrapper[role="grid"]` — outer container; carries
 *   `data-table-version` for debugging.
 * - `.cx-table-header[role="rowgroup"]` — header rowgroup.
 *   - `.cx-table-row.cx-table-row--header[role="row"]` — single
 *     header row (natural flow).
 *     - `.cx-table-header-cell[role="columnheader"][data-col-id]`
 *       — one per visible column.
 * - `.cx-table-body[role="rowgroup"]` — body scrollport with
 *   `overflow-y: auto; overflow-x: hidden`. Height comes from
 *   the consumer's parent layout (e.g. `flex: 1; min-height: 0`).
 *   `useTableBodyScroll` observes the resolved `clientHeight` +
 *   `scrollTop` and threads them into `virtualRowsPass`.
 *   - `.cx-table-body-content` — virtual-content layer .
 *     `position: relative; width: ${totalWidth}px; height:
 *     ${totalBodyHeight}px` so absolute-positioned rows tile
 *     against the full virtual height (drives the scrollbar even
 *     when only a windowed subset of rows is in the DOM).
 *     - `.cx-table-row[role="row"][data-row-id]` — one per
 *       windowed `RowSpec` (post-virtualRowsPass + overscan).
 *       `position: absolute; top: ${rowYByRowId[id]}px; left: 0;
 *       height: ${rowHeightByRowId[id]}px`.
 *       `virtualRowsPass` only changes which rows render, not the
 *       per-row positioning. The SFC falls back to rendering all
 *       rows when `bodyClientHeight === 0` (pre-mount frame /
 *       happy-dom) so the table is never blank pre-measure.
 *       - `.cx-table-cell[role="gridcell"][data-col-id][data-row-id]`
 *         — one per visible column.
 */
/**
 * helper: identity-stable empty `Set<string>` returned by
 * `dragFillPreviewSet` when no drag-fill preview is active. Verbatim
 * port of vue3's `EMPTY_PREVIEW_SET`.
 */
const EMPTY_PREVIEW_SET: ReadonlySet<string> = new Set<string>();

/**
 * hard-coded Set filter checkbox row height
 * used by `computeVirtualWindow`. Verbatim port of vue3's
 * `SET_FILTER_ITEM_HEIGHT_PX`.
 */
const SET_FILTER_ITEM_HEIGHT_PX = 28;

/**
 * (2026-05-31 — vue2 port): fixed step for Number filter
 * range slider. Verbatim mirror of vue3 constant.
 */
const NUMBER_FILTER_RANGE_STEP = 1;

/**
 * helper: shallow equality on `CellRangeEnvelope` pairs.
 * Verbatim port of vue3's `sameEnvelope`. `computeDragFillEnvelope`
 * returns the same source object when no extension applies; this
 * helper detects identity AND value equality so the drag-fill pointer
 * flow can dedup no-op `cell-range-fill-change` emits + skip the
 * post-pointerup auto-extend when source === fill.
 */
function sameEnvelope(a: CellRangeEnvelope, b: CellRangeEnvelope): boolean {
  if (a === b) return true;
  if (a.rowIds.length !== b.rowIds.length) return false;
  if (a.colIds.length !== b.colIds.length) return false;
  for (let i = 0; i < a.rowIds.length; i++) {
    if (a.rowIds[i] !== b.rowIds[i]) return false;
  }
  for (let i = 0; i < a.colIds.length; i++) {
    if (a.colIds[i] !== b.colIds[i]) return false;
  }
  return true;
}

export const ChronixTable = defineComponent({
  name: 'ChronixTable',
  props: {
    /**
     * Column definitions. Required. Pass a stable array reference
     * across renders when columns don't change (Vue's reactivity
     * recomputes layout on identity change).
     */
    columns: {
      type: Array as PropType<readonly ColumnSpec[]>,
      required: true,
    },
    /**
     * Row data. Required. Each row's `data` record is the source
     * for cell value extraction via `data[column.field]`.
     */
    rows: {
      type: Array as PropType<readonly RowSpec[]>,
      required: true,
    },
    /**
     * Partial theme override. Spread over `defaultChronixTableTheme`
     * at mount time. Per-instance theming (CSS-vars) lands in a
     * later vue2 phase; supports spread-merge only.
     */
    theme: {
      type: Object as PropType<Partial<ChronixTableTheme>>,
      default: undefined,
    },
    /**
     * opt-in filter-input row beneath the
     * column headers. Default `false` — consumers who want a
     * per-column text-filter UX without writing custom inputs set
     * this to `true`. Programmatic `setFilter` works regardless of
     * this prop's value. Verbatim port of vue3 prop.
     */
    showFilterRow: {
      type: Boolean,
      default: false,
    },
    /**
     * (2026-06-02 — vue2 port): default mode for newly-
     * bootstrapped multi-filter specs. Verbatim mirror of vue3.
     */
    multiFilterDefaultMode: {
      type: String as PropType<'AND' | 'OR'>,
      default: 'AND',
    },
    /**
     * (2026-06-02 — vue2 port): per-slot custom renderer.
     * Verbatim mirror of vue3 prop.
     */
    multiFilterChildRenderer: {
      type: Function as PropType<(args: MultiFilterChildRendererArgs) => VNode | null>,
      default: undefined,
    },
    /**
     * (2026-06-02 — vue2 port): cross-cell / cross-row
     * validators. Verbatim mirror of vue3 `rowValidators`
     * prop. Defaults to `undefined` (no row-level validation).
     */
    rowValidators: {
      type: Array as PropType<readonly RowValidator[]>,
      default: undefined,
    },
    /**
     * (2026-06-02 — vue2 port): paste/drag-fill validator
     * policy. Verbatim mirror of vue3 . Default
     * `'skip-rejected'` routes mutations through `runCellValidator`
     * and silently skips rejected cells; `'allow-invalid'` preserves
     * the legacy behavior.
     */
    pasteValidatorPolicy: {
      type: String as PropType<'skip-rejected' | 'allow-invalid'>,
      default: 'skip-rejected',
    },
    /**
     * opt-in sticky footer aggregate row.
     * Verbatim port of vue3 prop — renders one footer row
     * with per-column `aggregator(filteredRows)` output below the
     * body, mirroring horizontal scroll. Columns without an
     * `aggregator` render empty placeholders (Decision C.1). Footer
     * aggregates the post-filter rows (Decision A.1).
     */
    showFooterRow: {
      type: Boolean,
      default: false,
    },
    /**
     * (2026-05-27 — vue2 port of vue3): opt-in column
     * visibility menu. Verbatim port — button affordance in top-right
     * + popover with per-column checkboxes + show-all/hide-all
     * actions. Emit-only persistence per Decision A.1.
     */
    showColumnVisibilityMenu: {
      type: Boolean,
      default: false,
    },
    /**
     * (2026-05-28 — vue2 port of vue3): opt-in
     * cell-level keyboard navigation. Default `false`. When `true`,
     * the body's keydown handler dispatches arrow keys / Home / End /
     * PageUp / PageDown / Ctrl+Home / Ctrl+End to move an internal
     * `activeCell` focus marker; Enter / F2 begins edit on the active
     * cell; Escape clears it. Emits `active-cell-change` on transitions.
     */
    enableKeyboardNavigation: {
      type: Boolean,
      default: false,
    },
    /**
     * (2026-05-28 — vue2 port of vue3): opt-out for
     * keyboard-driven auto-scroll. Default `true`. When the active cell
     * moves via keyboard or programmatic `setActiveCell` and lies
     * outside the body viewport, the body scrolls just enough to bring
     * it into view (pinned-zone-aware). Click-driven activeCell writes
     * never auto-scroll. Set to `false` to disable scroll without
     * losing the nav itself.
     */
    enableKeyboardAutoScroll: {
      type: Boolean,
      default: true,
    },
    /**
     * (vue2 port, 2026-05-28): controlled expanded-row IDs
     * for tree data. When set (non-undefined), the SFC is in CONTROLLED
     * expand mode — chevron clicks emit `expanded-change` but do NOT
     * mutate internal state. Consumer must update the prop binding to
     * apply changes. When omitted, the SFC is in UNCONTROLLED mode and
     * seeds initial state from `defaultExpandedRowIds` or
     * `defaultExpandedDepth`.
     */
    expandedRowIds: {
      type: Array as PropType<readonly string[]>,
      default: undefined,
    },
    /**
     * (vue2 port): initial expanded-row IDs in uncontrolled
     * mode. Wins over `defaultExpandedDepth`. Consulted only at mount.
     */
    defaultExpandedRowIds: {
      type: Array as PropType<readonly string[]>,
      default: undefined,
    },
    /**
     * (vue2 port): initial expand depth in uncontrolled mode.
     * Default `0` (only top-level visible). `Number.POSITIVE_INFINITY`
     * expands everything on mount. Consulted only at mount.
     */
    defaultExpandedDepth: {
      type: Number,
      default: 0,
    },
    /**
     * row-selection mode.
     *
     * - `'none'` (default) — selection disabled; row clicks don't
     *   change selection (programmatic `setSelectedRowIds` still
     *   works but the SFC click handler is a no-op for selection).
     * - `'single'` — plain click selects exactly one row; clicking
     *   the selected row deselects it.
     * - `'multi'` — plain click replaces selection with one row;
     *   Ctrl/Cmd+click toggles a row in / out of the selection;
     *   Shift+click selects the inclusive range from
     *   the last anchor to the click target in display order.
     */
    selectionMode: {
      type: String as PropType<'none' | 'single' | 'multi'>,
      default: 'none',
    },
    /**
     * opt-in selection column. Default
     * `{ show: false, side: 'left' }`. When `show: true`, an
     * independent rail of `<input type="checkbox">` cells renders
     * before (`'left'`) or after (`'right'`) the column-driven
     * body. Header carries a three-state "select-all" checkbox
     * (checked / unchecked / indeterminate). Shift+click on a row
     * (or its checkbox) selects the range from the last anchor to
     * the click target in display order (`pagedRows` +;
     * never spans rows on other pages).
     */
    selectionColumn: {
      type: Object as PropType<SelectionColumnConfig>,
      default: () => ({ show: false, side: 'left' as const }),
    },
    /** (vue2 port). Verbatim mirror of vue3 . */
    rowDragAutoScroll: {
      type: Object as PropType<RowDragAutoScrollConfig | undefined>,
      default: undefined,
    },
    /** (vue2 port). Verbatim mirror of vue3 . */
    rowDragColumn: {
      type: Object as PropType<RowDragColumnConfig>,
      default: () => ({ show: false, side: 'left' as const }),
    },
    /**
     * opt-in pagination. When `true`, the
     * SFC slices rows via `pagePass` and renders a footer with
     * prev/next buttons + page info + page-size dropdown. When
     * `false` (default), the full filtered + sorted row set
     * renders into the virtualized body — programmatic `setPage` /
     * `setPageSize` still update the internal state but `pagePass`
     * is configured with `pageSize: 0` (passthrough) so the body
     * sees the full row set. Verbatim port of vue3 prop.
     */
    paginationEnabled: {
      type: Boolean,
      default: false,
    },
    /**
     * initial rows-per-page on mount. Only consulted at
     * mount; subsequent changes via `setPageSize` / the footer
     * `<select>` override it. Defaults to 20 (matches the most-used
     * data-grid default).
     */
    initialPageSize: {
      type: Number,
      default: 20,
    },
    /**
     * options surfaced in the footer's page-size
     * `<select>` dropdown. Defaults to `[10, 20, 50, 100]`. Passing
     * a custom array (e.g., `[5, 15, 30]`) replaces the entire
     * list — `initialPageSize` should typically appear in the array
     * so the initial render matches a selectable option.
     */
    pageSizeOptions: {
      type: Array as PropType<readonly number[]>,
      default: () => [10, 20, 50, 100] as const,
    },
    /**
     * how many sibling pages to show on
     * each side of `currentPage` in the ellipsis-aware page-number
     * bar. Default `1` (matches Material UI / Notion convention).
     * Increase for denser bars (e.g., `2` → 5 pages around current);
     * decrease to `0` for the minimum 3-page contiguous prefix.
     * Verbatim port of vue3 prop.
     */
    paginationSiblingCount: {
      type: Number,
      default: 1,
    },
    /**
     * how many always-visible pages to show at each edge
     * (page 0 + last page) of the page-number bar. Default `1`.
     * Increase (e.g., `2`) to keep `0, 1, ..., last-1, last` visible
     * even when current page is in the middle.
     */
    paginationBoundaryCount: {
      type: Number,
      default: 1,
    },
    /**
     * (2026-05-26 — vue2 port of vue3): opt-in
     * cell-range selection. Default `'none'` preserves all existing
     * pointer behavior. When `'enabled'`, body cells register pointer
     * handlers for drag-extend + shift+click extend; a new
     * `cx-table-cell--in-cell-range` modifier paints cells in the
     * active envelope.
     */
    cellRangeSelection: {
      type: String as PropType<'none' | 'enabled'>,
      default: 'none',
    },
    /**
     * (2026-05-27 — vue2 port of vue3): opt-in to
     * the internal mutation-history recorder. When `true`, every
     * `cell-value-change` / `cell-range-paste` / `cell-range-fill`
     * emit is auto-recorded into a bounded `{past, future}` stack +
     * Ctrl+Z / Ctrl+Y bindings on the focused body element become
     * active. The 7 history-related TableHandle methods become
     * functional. Default `false` — existing consumers see no
     * behavior change.
     */
    enableUndoHistory: {
      type: Boolean,
      default: false,
    },
    /**
     * maximum number of entries the internal `past` stack
     * retains. When a new mutation appends with `past.length === max`,
     * the OLDEST entry is dropped. Default `100`. Ignored when
     * `enableUndoHistory: false`.
     */
    undoHistoryMaxDepth: {
      type: Number,
      default: 100,
    },
    /**
     * paint the loading overlay over the body
     * region. Default `false`. When `true`, the overlay renders with
     * the configured `loadingOverlay` content (defaulting to `'Loading…'`)
     * + `aria-live="polite"`. Loading state takes precedence over the
     * no-rows overlay per Decision F.1.
     */
    loading: {
      type: Boolean,
      default: false,
    },
    /**
     * content rendered inside the loading overlay.
     * Defaults to the plain string `'Loading…'`. String or vue2 VNode.
     */
    loadingOverlay: {
      type: [String, Object] as PropType<string | VNode | undefined>,
      default: undefined,
    },
    /**
     * content rendered inside the no-rows overlay
     * when `rows.length === 0` AND `loading: false`. Defaults to `'No rows'`.
     */
    noRowsOverlay: {
      type: [String, Object] as PropType<string | VNode | undefined>,
      default: undefined,
    },
    /**
     * (2026-05-28 — vue2 port): lazy children loader. When
     * provided AND a row carries `hasChildren: true` (without sync
     * `children`), the loader fires on first expand. Verbatim port of
     * vue3 prop.
     */
    childrenLoader: {
      type: Function as PropType<
        | ((args: {
            readonly parent: RowSpec;
            readonly signal: AbortSignal;
          }) => Promise<readonly RowSpec[]>)
        | undefined
      >,
      default: undefined,
    },
    /**
     * (2026-05-28 — vue2 port): opt-in status bar between
     * body and pagination footer. Verbatim port of vue3 .
     */
    showStatusBar: {
      type: Boolean,
      default: false,
    },
    /**
     * (2026-05-29 — vue2 port): override the default live-
     * region announce text. Verbatim mirror of vue3 prop.
     */
    announceActiveCellText: {
      type: Function as PropType<(args: FormatActiveCellAnnouncementInput) => string>,
      default: null,
    },
    /**
     * (2026-05-29 — vue2 port): row-model selection switch.
     * Verbatim mirror of vue3 prop. Default `'clientSide'`.
     */
    rowModelType: {
      type: String as PropType<'clientSide' | 'serverSide'>,
      default: 'clientSide',
    },
    /**
     * (2026-05-29 — vue2 port): consumer-supplied async
     * data source. Required when `rowModelType: 'serverSide'`.
     */
    serverSideDataSource: {
      type: Object as PropType<ServerSideDataSource | undefined>,
      default: undefined,
    },
    /**
     * (2026-05-29 — vue2 port): per-block size. Default 100.
     */
    cacheBlockSize: {
      type: Number,
      default: DEFAULT_CACHE_BLOCK_SIZE,
    },
    /**
     * (2026-05-29 — vue2 port): LRU cap on cached blocks.
     * Default 10.
     */
    serverSideMaxBlocksInCache: {
      type: Number,
      default: DEFAULT_SERVER_SIDE_MAX_BLOCKS_IN_CACHE,
    },
    /**
     * (2026-05-31 — vue2 port): anticipatory next-block
     * prefetch ahead of scroll direction. Verbatim mirror of vue3
     * prop. Default `0` (= disabled).
     */
    serverSidePrefetchAheadBlocks: {
      type: Number,
      default: 0,
    },
    /**
     * (2026-05-31 — vue2 port): Set filter dropdown
     * virtualization threshold. Verbatim mirror of vue3
     * prop. Default `100`.
     */
    setFilterVirtualizeThreshold: {
      type: Number,
      default: 100,
    },
    /**
     * (2026-05-31 — vue2 port): opt-in Number filter
     * range slider. Verbatim mirror of vue3 prop.
     * Default `false`.
     */
    numberFilterShowRangeSlider: {
      type: Boolean,
      default: false,
    },
    /**
     * (2026-05-31 — vue2 port) + (2026-05-31
     * — vue2 port): opt-in per-cell style editor with Background +
     * Text tabs. Verbatim mirror of vue3 prop. Default `false`.
     */
    enableCellStyleEditor: {
      type: Boolean,
      default: false,
    },
    /**
     * (2026-06-01 — vue2 port): controlled-mode override
     * of the cell style map. When `undefined` (default), uncontrolled.
     * When defined, prop wins; emits still fire so consumers can
     * update their binding. Verbatim mirror of vue3 prop.
     */
    cellStyleByRowIdColId: {
      type: Object as PropType<Record<string, Record<string, CellStyle>> | undefined>,
      default: undefined,
    },
    /**
     * (2026-06-01 — vue2 port): preset color swatches
     * inside the color tabs. Verbatim mirror of vue3 prop.
     */
    cellStylePresetColors: {
      type: Array as PropType<readonly string[]>,
      default: () => CELL_STYLE_DEFAULT_PRESET_COLORS,
    },
    /**
     * (2026-06-01 — vue2 port): LRU cap on the in-memory
     * recent-colors list. Verbatim mirror of vue3 prop.
     */
    cellStyleRecentColorsLimit: {
      type: Number,
      default: 5,
    },
    /**
     * -C (2026-05-30 — vue2 port): opt-in per-row auto-height
     * measurement. Verbatim mirror of vue3 -C prop.
     */
    enableRowAutoHeight: {
      type: Boolean,
      default: false,
    },
    /**
     * -C (2026-05-30 — vue2 port): optional pixel cap on
     * auto-measured row heights. Verbatim mirror of vue3 -C
     * prop.
     */
    maxRowAutoHeightPx: {
      type: Number,
      default: undefined,
    },
    /**
     * (2026-05-30 — vue2 port): tool-panel container config.
     * Verbatim mirror of vue3 prop.
     */
    toolPanel: {
      type: Object as PropType<ToolPanelConfig | undefined>,
      default: undefined,
    },
    /** -A (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
    showColumnHeaderMenu: {
      type: Boolean,
      default: false,
    },
    /** -B (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
    contextMenu: {
      type: Object as PropType<ContextMenuConfig | null | undefined>,
      default: null,
    },
  },
  emits: {
    /**
     * Fires once at mount when the table has resolved its initial
     * layout. Payload is the imperative `TableHandle` (same object
     * exposed via `ctx.expose()`); consumers can capture it
     * without needing a template ref + `instance.exposed` round-trip.
     */
    'table-ready': (handle: TableHandle) => Boolean(handle),
    /** fires when a body cell receives a click. */
    'cell-click': (payload: CellClickPayload) => Boolean(payload),
    /** fires when a body row receives a click. */
    'row-click': (payload: RowClickPayload) => Boolean(payload),
    /** fires once per row when the pointer enters. */
    'row-mouseenter': (payload: RowMouseenterPayload) => Boolean(payload),
    /** fires once per row when the pointer leaves. */
    'row-mouseleave': (payload: RowMouseleavePayload) => Boolean(payload),
    /** fires when a header cell receives a click. */
    'header-click': (payload: HeaderClickPayload) => Boolean(payload),
    /**
     * fires when a labelled column-group cell in
     * the second header row receives a click. Un-grouped placeholder
     * cells do NOT emit. Verbatim port of vue3 .
     */
    'header-group-click': (payload: HeaderGroupClickPayload) => Boolean(payload),
    /**
     * fires when a body click lands outside any row.
     * Mutually exclusive with `row-click` / `cell-click` for the same
     * event.
     */
    'empty-area-click': (payload: EmptyAreaClickPayload) => Boolean(payload),
    /** fires on body cell double-click. */
    'cell-dblclick': (payload: CellDblclickPayload) => Boolean(payload),
    /** fires on body row double-click. */
    'row-dblclick': (payload: RowDblclickPayload) => Boolean(payload),
    /** fires when the internal sort state transitions. */
    'sort-change': (payload: SortChangePayload) => Boolean(payload),
    /** fires when the internal filter state transitions. */
    'filter-change': (payload: FilterChangePayload) => Boolean(payload),
    'quick-find-text-change': (payload: QuickFindTextChangePayload) => Boolean(payload),
    /** fires when the internal selection state transitions. */
    'selection-change': (payload: SelectionChangePayload) => Boolean(payload),
    /** fires when the internal (page, pageSize) state transitions. */
    'page-change': (payload: PageChangePayload) => Boolean(payload),
    /** fires when an edit session opens on a cell. */
    'cell-edit-start': (payload: CellEditStartPayload) => Boolean(payload),
    /** fires when an edit session ends (commit or cancel). */
    'cell-edit-stop': (payload: CellEditStopPayload) => Boolean(payload),
    /** (2026-06-01 — vue2 port): fires when `column.validatorAsync` starts. */
    'cell-edit-validation-pending': (payload: CellEditValidationPendingPayload) => Boolean(payload),
    /** (2026-06-02 — vue2 port): fires when the invalid-cells map mutates. */
    'invalid-cells-change': (payload: InvalidCellsChangePayload) => Boolean(payload),
    /** (2026-06-02 — vue2 port): fires when the user clicks `+` to add a multi-filter slot. */
    'add-multi-filter-slot': (payload: AddMultiFilterSlotPayload) => Boolean(payload),
    /** (2026-06-02 — vue2 port): fires when the user clicks `×` to remove a multi-filter slot. */
    'remove-multi-filter-slot': (payload: RemoveMultiFilterSlotPayload) => Boolean(payload),
    /** (2026-06-02 — vue2 port): fires when the user clicks `+ 添加分组` on the multi-filter UI. */
    'add-multi-filter-group': (payload: AddMultiFilterGroupPayload) => Boolean(payload),
    /** (2026-06-02 — vue2 port): fires when the user clicks `×` on a nested group. */
    'remove-multi-filter-group': (payload: RemoveMultiFilterGroupPayload) => Boolean(payload),
    /** fires on commit when draftValue !== baseValue (no-op-commit dedup). */
    'cell-value-change': (payload: CellValueChangePayload) => Boolean(payload),
    /** fires when a column-resize session opens (pointerdown on resizer or programmatic start). */
    'column-resize-start': (payload: ColumnResizeStartPayload) => Boolean(payload),
    /** fires when a column-resize session ends (commit or cancel). */
    'column-resize-stop': (payload: ColumnResizeStopPayload) => Boolean(payload),
    /** fires on commit when draftWidth !== baseWidth (no-op dedup). */
    'column-width-change': (payload: ColumnWidthChangePayload) => Boolean(payload),
    /** fires when a column-move drag crosses the threshold (or programmatic start). */
    /** (vue2 port). */
    'row-move-start': (payload: RowMoveStartPayload) => Boolean(payload),
    /** (vue2 port). */
    'row-move-stop': (payload: RowMoveStopPayload) => Boolean(payload),
    /** (vue2 port). */
    'row-order-change': (payload: RowOrderChangePayload) => Boolean(payload),
    'column-move-start': (payload: ColumnMoveStartPayload) => Boolean(payload),
    /** fires when an active column-move session ends (commit or cancel). */
    'column-move-stop': (payload: ColumnMoveStopPayload) => Boolean(payload),
    /** fires on commit when the drag resolves to a meaningful reorder (no-op dedup). */
    'column-order-change': (payload: ColumnOrderChangePayload) => Boolean(payload),
    /** (2026-05-26 — vue2 port of vue3): fires when a cell-range session opens. */
    'cell-range-start': (payload: CellRangeStartPayload) => Boolean(payload),
    /** fires on focus mutation (pointermove to a new cell / shift+click extend / programmatic). */
    'cell-range-change': (payload: CellRangeChangePayload) => Boolean(payload),
    /** fires on commit (pointerup) and on programmatic clear. */
    'cell-range-stop': (payload: CellRangeStopPayload) => Boolean(payload),
    /** (2026-05-27 — vue2 port of vue3): fires when Ctrl+C copies an active range OR `copyCellRangeToClipboard()` is invoked. */
    'cell-range-copy': (payload: CellRangeCopyPayload) => Boolean(payload),
    /** (2026-05-27 — vue2 port of vue3): fires when Ctrl+V pastes into an active range OR `pasteCellRangeFromClipboard()` is invoked. */
    'cell-range-paste': (payload: CellRangePastePayload) => Boolean(payload),
    /** (2026-05-27 — vue2 port of vue3): fires once at pointerdown on the drag-fill handle. */
    'cell-range-fill-start': (payload: CellRangeFillStartPayload) => Boolean(payload),
    /** fires on each pointermove that resolves a new preview envelope during drag-fill. */
    'cell-range-fill-change': (payload: CellRangeFillChangePayload) => Boolean(payload),
    /** fires once at pointerup with the committed mutations array OR at programmatic `fillCellRange`. */
    'cell-range-fill': (payload: CellRangeFillPayload) => Boolean(payload),
    /** (2026-05-27 — vue2 port of vue3): fires when Ctrl+Z / Ctrl+Y replays a recorded mutation batch OR programmatic `undo()` / `redo()`. */
    'history-replay': (payload: HistoryReplayPayload) => Boolean(payload),
    /** fires whenever the internal mutation-history state transitions. */
    'history-change': (payload: HistoryChangePayload) => Boolean(payload),
    /** (2026-05-27 — vue2 port of vue3): fires when the user toggles a column's checkbox in the visibility menu OR a programmatic setColumnVisibility / toggleColumnVisibility call runs. */
    'column-visibility-change': (payload: ColumnVisibilityChangePayload) => Boolean(payload),
    /** (2026-05-28 — vue2 port of vue3): fires when the keyboard-driven active cell transitions. */
    'active-cell-change': (payload: ActiveCellChangePayload) => Boolean(payload),
    /** (vue2 port, 2026-05-28): fires when tree-data expand state transitions (chevron click / Enter / Space / ArrowR / ArrowL / programmatic). Payload is the next full ordered list of expanded row IDs. */
    'expanded-change': (payload: ExpandedChangePayload) => Boolean(payload),
    /** (2026-05-28 — vue2 port): fires synchronously when a lazy-eligible row begins loading children. */
    'lazy-load-start': (payload: LazyLoadStartPayload) => Boolean(payload),
    /** (2026-05-28 — vue2 port): fires after `childrenLoader` resolves AND the cache is committed. */
    'lazy-load-success': (payload: LazyLoadSuccessPayload) => Boolean(payload),
    /** (2026-05-28 — vue2 port): fires after `childrenLoader` rejects. */
    'lazy-load-error': (payload: LazyLoadErrorPayload) => Boolean(payload),
    /** (2026-05-29 — vue2 port of vue3): fires once per `applyTableView()` after the saved state has been reconciled against the current `columns` prop. */
    'columns-change': (payload: ColumnsChangePayload) => Boolean(payload),
    /** (2026-05-30 — vue2 port): fires when the active tool-panel id changes. */
    'tool-panel-change': (payload: ToolPanelChangePayload) => Boolean(payload),
    /** (2026-05-30 — vue2 port): fires on pointer-up after a tool-panel resize drag completes. */
    'tool-panel-width-change': (payload: ToolPanelWidthChangePayload) => Boolean(payload),
    /** -A (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
    'column-header-menu-action': (payload: {
      colId: string;
      action: 'sort-asc' | 'sort-desc' | 'clear-sort' | 'hide' | 'autosize';
    }) => Boolean(payload),
    /** -B (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
    'context-menu-open': (payload: ContextMenuOpenPayload) => Boolean(payload),
    /** -B (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
    'context-menu-close': () => true,
    /** (2026-05-31 — vue2 port): cell style editor commit (Apply or Clear). (2026-05-31 — vue2 port): widened `style` to support `color` axis. (2026-06-01 — vue2 port): further widened to support 3 font axes. (2026-06-01 — vue2 port): further widened to support 4 border axes; font / border tab Apply emits its full cluster atomically. Verbatim mirror of vue3. */
    'cell-style-change': (payload: {
      readonly rowId: string;
      readonly colId: string;
      readonly style: {
        readonly backgroundColor?: string | null;
        readonly color?: string | null;
        readonly fontWeight?: string | null;
        readonly fontStyle?: string | null;
        readonly textDecoration?: string | null;
        readonly borderColor?: string | null;
        readonly borderWidth?: string | null;
        readonly borderStyle?: string | null;
        readonly borderRadius?: string | null;
        // (2026-06-01 — vue2 port): per-side border
        // override fields. Verbatim mirror of vue3.
        readonly borderTopColor?: string | null;
        readonly borderTopWidth?: string | null;
        readonly borderTopStyle?: string | null;
        readonly borderRightColor?: string | null;
        readonly borderRightWidth?: string | null;
        readonly borderRightStyle?: string | null;
        readonly borderBottomColor?: string | null;
        readonly borderBottomWidth?: string | null;
        readonly borderBottomStyle?: string | null;
        readonly borderLeftColor?: string | null;
        readonly borderLeftWidth?: string | null;
        readonly borderLeftStyle?: string | null;
      };
    }) => Boolean(payload),
  },
  setup(props, ctx) {
    const mergedTheme = computed<ChronixTableTheme>(() => ({
      ...defaultChronixTableTheme,
      ...(props.theme ?? {}),
    }));

    const wrapperRef = ref<HTMLElement | null>(null);
    const { clientWidth } = useTableContainerSize(wrapperRef);

    // body scrollport observation. `bodyRef` is bound on
    // the outer `.cx-table-body` div via a function-ref (Vue 2.7
    // composition API form, `as never` cast bridging the wider Vue 2
    // ref signature to our narrower HTMLElement type).
    const bodyRef = ref<HTMLElement | null>(null);
    // (2026-05-26 — vue2 port of vue3): header +
    // filter row are SIBLINGS of body, so the body's `overflowX: auto`
    // scroll does NOT propagate to them. The SFC mirrors
    // `bodyScrollLeft → headerEl.scrollLeft + filterRowEl.scrollLeft`
    // via the body's `on: { scroll }` handler so the header / filter
    // cells stay column-aligned with body cells during horizontal
    // scroll. Header + filter both carry `overflowX: hidden` inline so
    // `scrollLeft` is a meaningful programmatic offset.
    const headerRef = ref<HTMLElement | null>(null);
    const filterRowRef = ref<HTMLElement | null>(null);
    const footerRef = ref<HTMLElement | null>(null);
    // (2026-05-31 — vue2 port): per-column Set filter
    // virtualization state. Verbatim mirror of vue3 .
    const setFilterScrollTopByColId = ref<Record<string, number>>({});
    const setFilterViewportHeightByColId = ref<Record<string, number>>({});
    // (2026-05-31 — vue2 port): per-column Number filter
    // range slider drag state. Verbatim mirror of vue3 .
    const numberFilterRangeDragByColId = ref<Record<string, RangeHandle | null>>({});
    // (2026-05-31 — vue2 port) + + Phase
    // 99.2.2 + (2026-06-01 — vue2 port): per-cell style
    // overrides + editor open state. Entry shape carries 9 optional
    // axes (bg, color, fontWeight, fontStyle, textDecoration,
    // borderColor, borderWidth, borderStyle, borderRadius); open-state
    // shape carries `activeTab` (literal union widened to include
    // `'font'` and `'border'`) + per-color-tab persisted hex slots +
    // `fontState` + `borderState` slots. Verbatim mirror of vue3
    // reactive state.
    const internalCellStyleByRowIdColId = ref<Record<string, Record<string, CellStyleEntry>>>({});
    // (2026-06-01 — vue2 port) Decision I.1: effective-map
    // read wedge. Verbatim mirror of vue3.
    const effectiveCellStyleByRowIdColId = computed<Record<string, Record<string, CellStyleEntry>>>(
      () => props.cellStyleByRowIdColId ?? internalCellStyleByRowIdColId.value,
    );
    // (2026-06-01 — vue2 port) Decision K.1: in-memory
    // recent-colors ring. Verbatim mirror of vue3.
    const recentCellStyleColorsRef = ref<readonly string[]>([]);
    function pushRecentCellStyleColor(hex: string): void {
      if (!CELL_STYLE_HEX_REGEX.test(hex)) return;
      const limit = Math.max(0, Math.min(20, props.cellStyleRecentColorsLimit));
      if (limit === 0) {
        recentCellStyleColorsRef.value = [];
        return;
      }
      const filtered = recentCellStyleColorsRef.value.filter(
        (existing) => existing.toLowerCase() !== hex.toLowerCase(),
      );
      const next = [hex, ...filtered].slice(0, limit);
      recentCellStyleColorsRef.value = next;
    }
    const cellStyleEditorOpenRef = ref<{
      rowId: string;
      colId: string;
      anchorRect: { left: number; top: number; bottom: number };
      hsv: Hsv;
      hex: string;
      activeTab: 'background' | 'text' | 'font' | 'border';
      bgHex: string | null;
      textHex: string | null;
      fontState: {
        fontWeight: string | null;
        fontStyle: string | null;
        textDecoration: string | null;
      };
      borderState: {
        borderColor: string | null;
        borderWidth: string | null;
        borderStyle: string | null;
        borderRadius: string | null;
        // (2026-06-01 — vue2 port): 12 per-side
        // override fields. Verbatim mirror of vue3.
        borderTopColor: string | null;
        borderTopWidth: string | null;
        borderTopStyle: string | null;
        borderRightColor: string | null;
        borderRightWidth: string | null;
        borderRightStyle: string | null;
        borderBottomColor: string | null;
        borderBottomWidth: string | null;
        borderBottomStyle: string | null;
        borderLeftColor: string | null;
        borderLeftWidth: string | null;
        borderLeftStyle: string | null;
        borderSideTarget: 'all' | 'top' | 'right' | 'bottom' | 'left';
        // (2026-06-01 — vue2 port): independent HSV
        // editing-buffer for the border-tab HSV picker disclosure.
        // Verbatim mirror of vue3.
        hsv: Hsv;
        hex: string;
      };
    } | null>(null);
    const cellStyleEditorPopoverRef = ref<HTMLElement | null>(null);
    const cellStyleSquareDragRef = ref<boolean>(false);
    const cellStyleHueDragRef = ref<boolean>(false);
    // (2026-06-01 — vue2 port): variable-font-weight
    // slider drag state. Verbatim mirror of vue3.
    const cellStyleFontWeightSliderDragRef = ref<boolean>(false);
    // (2026-06-01 — vue2 port): border-tab HSV drag
    // refs. Verbatim mirror of vue3.
    const cellStyleBorderSquareDragRef = ref<boolean>(false);
    const cellStyleBorderHueDragRef = ref<boolean>(false);
    // (vue2 port): column-visibility-menu state.
    const columnMenuOpen = ref<boolean>(false);
    const columnMenuButtonRef = ref<HTMLElement | null>(null);
    const columnMenuPopoverRef = ref<HTMLElement | null>(null);
    // ARIA keyboard nav menu container refs
    // for the 4 menu surfaces (tool-panel tablist + column header
    // menu + cell context menu); column-visibility menu reuses
    // `columnMenuPopoverRef` above.
    const toolPanelRailRef = ref<HTMLElement | null>(null);
    const columnHeaderMenuRef = ref<HTMLElement | null>(null);
    const cellContextMenuRef = ref<HTMLElement | null>(null);
    // (vue2 port): active-cell focus marker for keyboard navigation.
    const activeCellRef = ref<CellRef | null>(null);

    // (2026-05-29 — vue2 port): live-region announce text for
    // keyboard-driven activeCell transitions. Verbatim mirror of vue3
    // wiring.
    const srAnnounceTextRef = ref<string>('');

    // (2026-05-29 — vue2 port): aria-rowcount + aria-colcount
    // computed at render time. Verbatim mirror of vue3 logic.
    const ariaRowCount = computed<number>(
      () => 1 + topPinnedRows.value.length + pagedRows.value.length + bottomPinnedRows.value.length,
    );
    const ariaColCount = computed<number>(
      () => visibleColumns.value.length + (props.selectionColumn.show === true ? 1 : 0),
    );

    // tooltip state. Verbatim port of vue3
    // wiring.
    const tooltipPendingCellRef = ref<CellRef | null>(null);
    const tooltipActiveRef = ref<{
      readonly rowId: string;
      readonly colId: string;
      readonly text: string;
      readonly x: number;
      readonly y: number;
    } | null>(null);
    let tooltipTimerId: number | null = null;

    const { clientHeight: bodyClientHeight, scrollTop: bodyScrollTop } =
      useTableBodyScroll(bodyRef);

    // (single-column) / (multi-column): internal
    // sort state. No controlled `sortSpec` prop per Decision A.1 —
    // consumers drive via the imperative setSort/clearSort handle
    // methods + observe via sort-change emit. Always an array;
    // empty array = no sort.
    const sortSpec = ref<readonly SortSpec[]>([]);

    // internal filter state. Same posture as
    // sort — internal-only, imperative handle methods + filter-change
    // emit. Always an array; empty = no filter. Verbatim port of
    // vue3 .
    const filterSpec = ref<readonly FilterSpec[]>([]);

    // (2026-05-29 — vue2 port): internal quick-find text
    // state. Same posture as sort + filter — internal-only,
    // imperative getQuickFindText/setQuickFindText handle methods +
    // quick-find-text-change emit. Empty string = no quick-find.
    // Verbatim port of vue3 .
    const quickFindText = ref<string>('');

    // internal selection state. Array shape
    // is the API-surface canonical form (JSON-serializable; consumers
    // can mirror to URL / store). The derived Set is for O(1)
    // isRowSelected lookups during per-row render. Verbatim port of
    // vue3 (Decision B.1).
    const selectedRowIds = ref<readonly string[]>([]);
    const selectedRowIdsSet = computed(() => new Set(selectedRowIds.value));

    // selection anchor for shift+click range
    // selection. Updates on plain click + Ctrl/Cmd+click + checkbox
    // toggle (the "intentional" selection actions). Reads only on
    // shift+click — the anchor STAYS PUT so consecutive shift+clicks
    // intuitively re-extend the range to the new endpoint. Cleared
    // when the selection goes empty (so the next interaction
    // re-establishes a fresh anchor). Verbatim port of vue3 .
    const selectionAnchorRef = ref<string | null>(null);

    // internal pagination state. Always
    // tracked even when `paginationEnabled` is false — the latter
    // only controls whether pagePass receives a non-zero pageSize
    // (turning the pass into the passthrough state) + whether the
    // footer renders. `currentPageRef` is 0-based; the footer
    // displays `currentPageRef.value + 1` for human-friendly
    // numbering. Verbatim port of vue3 .
    const currentPageRef = ref<number>(0);
    const currentPageSizeRef = ref<number>(props.initialPageSize);
    const effectivePageSize = computed(() =>
      props.paginationEnabled ? currentPageSizeRef.value : 0,
    );

    // in-flight edit state. Only ONE cell at a
    // time can be in edit mode; opening an edit on a different cell
    // commits the previous one first (matches click-elsewhere blur
    // semantic). `null` when no edit is active. Verbatim port of
    // vue3 `editingCellRef`.
    const editingCellRef = ref<EditingCell | null>(null);
    // invalid-cell marker map. Keyed by
    // `${rowId}::${colId}`; populated on validator-rejected commits;
    // cleared on commit-success or cancel for the same key. Drives the
    // cell render's `cx-table-cell--invalid` + `data-cell-invalid` +
    // `aria-invalid` triple per Decision C.1. Verbatim port of vue3
    // invalidCellsRef.
    const invalidCellsRef = ref<Map<string, EditValidationError>>(new Map());
    function invalidCellKey(rowId: string, colId: string): string {
      return `${rowId}::${colId}`;
    }
    function parseInvalidCellKey(key: string): { rowId: string; colId: string } {
      const idx = key.indexOf('::');
      return { rowId: key.slice(0, idx), colId: key.slice(idx + 2) };
    }
    // (2026-06-02 — vue2 port): invalid-cell snapshot +
    // emit helper. Verbatim mirror of vue3 .
    function snapshotInvalidCells(): readonly InvalidCellEntry[] {
      const entries: InvalidCellEntry[] = [];
      for (const [key, error] of invalidCellsRef.value) {
        const { rowId, colId } = parseInvalidCellKey(key);
        entries.push({ rowId, colId, error });
      }
      return Object.freeze(entries);
    }
    function emitInvalidCellsChange(): void {
      const entries = snapshotInvalidCells();
      ctx.emit('invalid-cells-change', { entries, count: entries.length });
    }
    // (2026-06-02 — vue2 port): reconcile invalid markers
    // for a row's cells after a commit lands. Verbatim mirror of vue3.
    function reconcileRowValidationsForRow(row: RowSpec): boolean {
      const rowValidators = props.rowValidators ?? [];
      if (rowValidators.length === 0) return false;
      const violations = runRowValidators({ row, rowValidators });
      const violationByColId = new Map<string, RowValidationViolation>();
      for (const v of violations) violationByColId.set(v.colId, v);
      const next = new Map(invalidCellsRef.value);
      let changed = false;
      for (const key of next.keys()) {
        const { rowId, colId } = parseInvalidCellKey(key);
        if (rowId !== row.id) continue;
        if (pendingAsyncValidationByKey.value.has(key)) continue;
        if (!violationByColId.has(colId)) {
          next.delete(key);
          changed = true;
        }
      }
      for (const v of violations) {
        const key = invalidCellKey(row.id, v.colId);
        const existing = next.get(key);
        const error: EditValidationError =
          v.code != null ? { reason: v.reason, code: v.code } : { reason: v.reason };
        if (existing?.reason === error.reason && existing?.code === error.code) {
          continue;
        }
        next.set(key, error);
        changed = true;
      }
      if (changed) invalidCellsRef.value = next;
      return changed;
    }
    function resolvePasteValidatorGate(): PasteValidatorGate | undefined {
      if (props.pasteValidatorPolicy === 'allow-invalid') return undefined;
      return (column: ColumnSpec, value: unknown, row: RowSpec) =>
        runCellValidator({ column, value, row });
    }
    // (2026-06-02 — vue2 port): synthesize post-commit row.
    // Verbatim mirror of vue3.
    function synthesizePostCommitRow(
      row: RowSpec,
      mutations: readonly { colId: string; newValue: unknown }[],
    ): RowSpec {
      if (mutations.length === 0) return row;
      const data: Record<string, unknown> = { ...(row.data ?? {}) };
      for (const m of mutations) {
        const column = columnTable.value.getById(m.colId);
        const field = column?.field ?? m.colId;
        data[field] = m.newValue;
      }
      return { ...row, data };
    }
    // (2026-06-01 — vue2 port): in-flight async-validator
    // state. Verbatim mirror of vue3.
    interface PendingAsyncValidation {
      readonly requestId: number;
      readonly draftValue: unknown;
    }
    const pendingAsyncValidationByKey = ref<Map<string, PendingAsyncValidation>>(new Map());
    let nextAsyncValidationRequestId = 1;
    // (2026-06-01 — vue2 port): one-time-warn registry for
    // multi-filter columns whose `multiFilterChildTypes.length > 5`.
    const multiFilterSlotCountWarned = ref<Set<string>>(new Set());
    // guards the `<input>` blur handler from double-firing
    // commit/cancel when the Enter / Tab / Esc handler already
    // explicitly committed or cancelled. The keydown handler sets
    // this true before calling commit/cancel; blur reads it + skips.
    const editCommitInProgressRef = ref<boolean>(false);

    // internal column-resize transaction.
    // Created on pointerdown over a header resizer; updated on every
    // pointermove (immutable replacement — new object each step);
    // cleared on pointerup (commit) or pointercancel /
    // lostpointercapture / cancelColumnResize (cancel). `null` when
    // no resize is active. Verbatim port of vue3 .
    const resizingColumnRef = ref<ColumnResizing | null>(null);

    // two-stage column-move state. Pending ref
    // is set on header-cell pointerdown but the drag is NOT active until
    // the cursor crosses 5px Chebyshev distance (then pending is cleared
    // + movingColumnRef is created + column-move-start fires). If
    // pointerup arrives while still pending, the header click → sort
    // cycle fires normally. Verbatim port of vue3 two-stage
    // state machine (Decision C.1).
    const pendingMoveColumnRef = ref<PendingColumnMove | null>(null);
    const movingColumnRef = ref<ColumnMoving | null>(null);
    // (vue2 port).
    const pendingMoveRowRef = ref<PendingRowMove | null>(null);
    const movingRowRef = ref<RowMoving | null>(null);
    // mirrors resizeCommitInProgressRef — guards
    // pointercancel + lostpointercapture from firing redundant cancel
    // when a pointerup commit is in progress. Reset deferred to
    // queueMicrotask to absorb async lostpointercapture.
    const moveCommitInProgressRef = ref<boolean>(false);
    // (2026-05-31 — vue2 port): drag auto-scroll state.
    const autoScrollRafIdRef = ref<number | null>(null);
    const autoScrollLatestClientYRef = ref<number>(0);
    const warnedRowDragMixedRef = ref<boolean>(false);
    // guards the pointercancel + lostpointercapture
    // handlers from firing a redundant cancel when an explicit
    // pointerup commit is in progress. Mirrors
    // editCommitInProgressRef pattern; reset deferred to
    // queueMicrotask to absorb the async lostpointercapture event
    // that fires AFTER pointerup releases the capture.
    const resizeCommitInProgressRef = ref<boolean>(false);

    // `columnsForLayout` patches the resizing
    // column's spec with the draft width during an in-flight resize
    // transaction. Substituting `{ ...col, width: draftWidth,
    // flex: undefined }` is the load-bearing trick — `columnLayoutPass`
    // doesn't need to know about resize state because the SFC pre-
    // patches the input. Clearing `flex` is intentional per Decision
    // B.1 so resizing a flex column converts it to explicit width
    // (matches AG-Grid / MUI DataGrid). When no resize is in flight,
    // returns `props.columns` by reference (no allocation). Verbatim
    // port of vue3 .
    const columnsForLayout = computed<readonly ColumnSpec[]>(() => {
      const resizing = resizingColumnRef.value;
      if (resizing == null) return props.columns;
      return props.columns.map((col): ColumnSpec => {
        if (col.id !== resizing.colId) return col;
        // Destructure to OMIT `flex` (rather than set it to undefined)
        // because the package's tsconfig has `exactOptionalPropertyTypes:
        // true` which rejects `flex: undefined` against `flex?: number`.
        // Omitting is semantically identical (columnLayoutPass reads
        // `col.flex` and treats undefined the same as absent).
        const { flex: _omittedFlex, ...rest } = col;
        return { ...rest, width: resizing.draftWidth };
      });
    });

    // (2026-05-28 — vue2 port): per-row lazy state. Verbatim
    // port of vue3 wiring.
    const lazyChildrenStateRef = ref<Map<string, LazyChildrenState>>(new Map());
    const loadedLazyChildrenByRowId = computed<ReadonlyMap<string, readonly RowSpec[]>>(() => {
      const out = new Map<string, readonly RowSpec[]>();
      for (const [rowId, state] of lazyChildrenStateRef.value) {
        if (state.status === 'loaded' && state.children != null) {
          out.set(rowId, state.children);
        }
      }
      return out;
    });
    const lazyMisconfigWarnedIds = new Set<string>();

    // (vue2 port, 2026-05-28): tree-data expand-state
    // composable. Hybrid controlled/uncontrolled per Decision B.1.
    const treeExpandState = useTreeExpandState({
      controlled: computed(() => props.expandedRowIds),
      defaultExpandedRowIds: computed(() => props.defaultExpandedRowIds),
      defaultExpandedDepth: computed(() => props.defaultExpandedDepth),
      rows: computed(() => props.rows),
      emit: (next) => {
        ctx.emit('expanded-change', { next });
      },
    });
    // Forward-declared union set; populated by the watch below once
    // useTableLayout exposes filterForceExpandedRowIds.
    const effectiveExpandedRowIdsSet = ref<ReadonlySet<string>>(new Set<string>());

    /**
     * (2026-05-29 — vue2 port): server-side row model session.
     * Verbatim mirror of vue3 wiring.
     */
    const serverSideSessionRef = ref<ServerSideRowSource | null>(null);
    const serverSideVersion = ref(0);
    let unsubscribeServerSideListener: (() => void) | null = null;

    // (2026-05-31 — vue2 port) Decision A.1: previous-tick
    // viewport range refs for direction inference. Verbatim mirror of
    // vue3 .
    const prevFirstVisibleRef = ref<number | null>(null);
    const prevLastVisibleRef = ref<number | null>(null);

    function tearDownServerSideSession(): void {
      if (unsubscribeServerSideListener != null) {
        unsubscribeServerSideListener();
        unsubscribeServerSideListener = null;
      }
      const session = serverSideSessionRef.value;
      if (session != null) session.destroy();
      serverSideSessionRef.value = null;
      prevFirstVisibleRef.value = null;
      prevLastVisibleRef.value = null;
    }

    function setUpServerSideSession(source: ServerSideDataSource): void {
      tearDownServerSideSession();
      // (2026-05-30 — vue2 port): pageSize OVERRIDES
      // cacheBlockSize when paginationEnabled. Verbatim mirror of vue3.
      const usePageSizeAsBlockSize = props.paginationEnabled;
      const effectiveBlockSize = usePageSizeAsBlockSize
        ? currentPageSizeRef.value
        : props.cacheBlockSize;
      if (
        usePageSizeAsBlockSize &&
        props.cacheBlockSize !== DEFAULT_CACHE_BLOCK_SIZE &&
        typeof console !== 'undefined'
      ) {
        console.warn(
          '[chronix-table] rowModelType:"serverSide" + paginationEnabled:true: cacheBlockSize prop is ignored; pageSize is used as the block size (A.1). Remove cacheBlockSize to silence this warning.',
        );
      }
      const session = createServerSideRowSource(source, {
        cacheBlockSize: effectiveBlockSize,
        maxBlocksInCache: props.serverSideMaxBlocksInCache,
        initialSortModel: sortSpec.value,
        initialFilterModel: filterSpec.value,
      });
      serverSideSessionRef.value = session;
      unsubscribeServerSideListener = session.subscribe(() => {
        serverSideVersion.value++;
      });
      // (2026-05-31 — vue2 port) Decision C.1: eager
      // bootstrap fetch. Verbatim mirror of vue3.
      session.getRowAt(0);
    }

    watch(
      [
        () => props.rowModelType,
        () => props.serverSideDataSource,
        () => props.cacheBlockSize,
        () => props.serverSideMaxBlocksInCache,
        () => props.paginationEnabled,
        () => (props.paginationEnabled ? currentPageSizeRef.value : 0),
      ] as const,
      ([mode, source]) => {
        if (mode !== 'serverSide' || source == null) {
          tearDownServerSideSession();
          return;
        }
        setUpServerSideSession(source);
      },
      { immediate: true },
    );

    /**
     * -C (2026-05-30 — vue2 port): per-row auto-height
     * measurement state. Verbatim mirror of vue3 -C wiring.
     */
    const measuredRowHeightByRowId = ref<Map<string, number>>(new Map());
    const rowHeightOverridesObject = computed<Readonly<Record<string, number>> | undefined>(() => {
      if (!props.enableRowAutoHeight) return undefined;
      const map = measuredRowHeightByRowId.value;
      if (map.size === 0) return undefined;
      return Object.fromEntries(map);
    });
    let rowAutoHeightObserver: ResizeObserver | null = null;
    function ensureRowAutoHeightObserver(): ResizeObserver | null {
      if (rowAutoHeightObserver != null) return rowAutoHeightObserver;
      if (typeof ResizeObserver === 'undefined') return null;
      rowAutoHeightObserver = new ResizeObserver((entries) => {
        let mutated = false;
        const cap =
          typeof props.maxRowAutoHeightPx === 'number' && props.maxRowAutoHeightPx > 0
            ? props.maxRowAutoHeightPx
            : Number.POSITIVE_INFINITY;
        const floor = mergedTheme.value.rowHeight;
        const next = new Map(measuredRowHeightByRowId.value);
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const rowId = el.getAttribute('data-row-id');
          if (rowId == null) continue;
          const rawHeight = entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight;
          const measured = Math.max(floor, Math.min(cap, rawHeight));
          if (next.get(rowId) !== measured) {
            next.set(rowId, measured);
            mutated = true;
          }
        }
        if (mutated) measuredRowHeightByRowId.value = next;
      });
      return rowAutoHeightObserver;
    }
    function observeRowEl(el: HTMLElement): void {
      if (!props.enableRowAutoHeight) return;
      const observer = ensureRowAutoHeightObserver();
      if (observer != null) observer.observe(el);
    }
    function unobserveRowEl(el: HTMLElement): void {
      if (rowAutoHeightObserver == null) return;
      rowAutoHeightObserver.unobserve(el);
    }
    /**
     * -A (2026-05-30 — vue2 port): per-row displayed-position
     * lookup. Verbatim mirror of vue3 -A wiring.
     */
    const displayedRowIndexByRowId = ref<Record<string, number>>({});

    /**
     * (2026-05-30 — vue2 port): tool-panel container reactive
     * state. Verbatim mirror of vue3 wiring.
     */
    const activeToolPanelId = ref<string | null>(props.toolPanel?.initialOpenId ?? null);
    const toolPanelWidth = ref<number>(
      props.toolPanel?.initialWidth ?? DEFAULT_TOOL_PANEL_WIDTH_PX,
    );
    const resizingToolPanel = ref<boolean>(false);
    function applyToolPanelChange(nextId: string | null): void {
      const prev = activeToolPanelId.value;
      if (prev === nextId) return;
      activeToolPanelId.value = nextId;
      ctx.emit('tool-panel-change', { activePanelId: nextId });
    }
    function applyToolPanelWidthChange(nextWidth: number): void {
      const cfg = props.toolPanel;
      const min = cfg?.minWidth ?? DEFAULT_TOOL_PANEL_MIN_WIDTH_PX;
      const max = cfg?.maxWidth ?? DEFAULT_TOOL_PANEL_MAX_WIDTH_PX;
      const clamped = Math.max(min, Math.min(max, nextWidth));
      if (toolPanelWidth.value === clamped) return;
      toolPanelWidth.value = clamped;
    }
    let toolPanelResizeStartX = 0;
    let toolPanelResizeStartWidth = 0;
    function onToolPanelResizePointerdown(e: PointerEvent): void {
      const cfg = props.toolPanel;
      if (cfg == null) return;
      e.preventDefault();
      resizingToolPanel.value = true;
      toolPanelResizeStartX = e.clientX;
      toolPanelResizeStartWidth = toolPanelWidth.value;
      const side = cfg.side ?? 'right';
      const sign = side === 'right' ? -1 : 1;
      function onMove(ev: PointerEvent): void {
        const dx = (ev.clientX - toolPanelResizeStartX) * sign;
        applyToolPanelWidthChange(toolPanelResizeStartWidth + dx);
      }
      function onUp(): void {
        resizingToolPanel.value = false;
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        ctx.emit('tool-panel-width-change', { width: toolPanelWidth.value });
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    }

    /** -A (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
    const openColumnHeaderMenuColIdRef = ref<string | null>(null);
    /** -B (2026-05-30 — vue2 port). Verbatim mirror of vue3. */
    const contextMenuPositionRef = ref<{
      readonly rowId: string | null;
      readonly colId: string | null;
      readonly x: number;
      readonly y: number;
    } | null>(null);

    function applyOpenColumnHeaderMenu(colId: string | null): void {
      const prev = openColumnHeaderMenuColIdRef.value;
      if (prev === colId) return;
      openColumnHeaderMenuColIdRef.value = colId;
    }

    function applyOpenContextMenu(
      rowId: string | null,
      colId: string | null,
      x: number,
      y: number,
    ): void {
      const cfg = props.contextMenu;
      if (cfg == null || cfg.items.length === 0) return;
      contextMenuPositionRef.value = { rowId, colId, x, y };
      ctx.emit('context-menu-open', { rowId, colId, x, y });
    }

    function applyCloseContextMenu(): void {
      if (contextMenuPositionRef.value == null) return;
      contextMenuPositionRef.value = null;
      ctx.emit('context-menu-close');
    }

    function onColumnHeaderMenuItemClick(
      colId: string,
      action: 'sort-asc' | 'sort-desc' | 'clear-sort' | 'hide' | 'autosize',
    ): void {
      if (action === 'sort-asc') {
        applySort([{ colId, direction: 'asc' }]);
      } else if (action === 'sort-desc') {
        applySort([{ colId, direction: 'desc' }]);
      } else if (action === 'clear-sort') {
        applySort([]);
      } else if (action === 'hide') {
        applyColumnVisibilityChange(colId, true, null);
      } else if (action === 'autosize') {
        applyAutosize(colId);
      }
      ctx.emit('column-header-menu-action', { colId, action });
      applyOpenColumnHeaderMenu(null);
    }

    function onCellContextMenu(rowId: string, colId: string, e: MouseEvent): void {
      const cfg = props.contextMenu;
      if (cfg == null || cfg.items.length === 0) return;
      e.preventDefault();
      e.stopPropagation();
      applyOpenContextMenu(rowId, colId, e.clientX, e.clientY);
    }

    function onContextMenuItemClick(item: ContextMenuItem): void {
      const pos = contextMenuPositionRef.value;
      if (pos == null) return;
      const cmCtx: ContextMenuContext = { rowId: pos.rowId, colId: pos.colId };
      const disabled = item.disabled?.(cmCtx) === true;
      if (disabled) return;
      applyCloseContextMenu();
      item.onClick(cmCtx);
    }

    function onPhase83DocPointerdown(e: PointerEvent): void {
      const target = e.target as HTMLElement | null;
      if (target == null) return;
      if (openColumnHeaderMenuColIdRef.value != null) {
        const insideMenu = target.closest('.cx-table-column-header-menu') != null;
        const insideButton = target.closest('.cx-table-column-header-menu-button') != null;
        if (!insideMenu && !insideButton) {
          applyOpenColumnHeaderMenu(null);
        }
      }
      if (contextMenuPositionRef.value != null) {
        const insideContextMenu = target.closest('.cx-table-cell-context-menu') != null;
        if (!insideContextMenu) {
          applyCloseContextMenu();
        }
      }
      // (2026-05-31 — vue2 port): outside-click closes the
      // cell style editor popover. Verbatim mirror of vue3.
      if (cellStyleEditorOpenRef.value != null) {
        const insideEditor = target.closest('.cx-table-cell-style-editor') != null;
        if (!insideEditor) {
          cancelCellStyleEditor();
        }
      }
    }
    function onPhase83DocKeydown(e: KeyboardEvent): void {
      if (e.key !== 'Escape') return;
      if (openColumnHeaderMenuColIdRef.value != null) {
        applyOpenColumnHeaderMenu(null);
        e.stopPropagation();
      }
      if (contextMenuPositionRef.value != null) {
        applyCloseContextMenu();
        e.stopPropagation();
      }
      // (2026-05-31 — vue2 port): Escape closes editor.
      if (cellStyleEditorOpenRef.value != null) {
        cancelCellStyleEditor();
        e.stopPropagation();
      }
    }
    onMounted(() => {
      document.addEventListener('pointerdown', onPhase83DocPointerdown, true);
      document.addEventListener('keydown', onPhase83DocKeydown);
    });
    onBeforeUnmount(() => {
      document.removeEventListener('pointerdown', onPhase83DocPointerdown, true);
      document.removeEventListener('keydown', onPhase83DocKeydown);
    });

    // wire `useMenuKeyboardNav` into the 4 menu
    // surfaces. Verbatim port of vue3 — Vue 2.7 Composition API matches.
    const toolPanelItems = computed<readonly MenuKeyboardNavItem[]>(() => {
      const cfg = props.toolPanel;
      if (cfg?.show !== true) return [];
      return cfg.panels.map((p) => ({ id: p.id }));
    });
    const toolPanelIsOpen = computed<boolean>(() => {
      const cfg = props.toolPanel;
      return cfg != null && cfg.show && cfg.panels.length > 0;
    });
    const toolPanelKbdNav = useMenuKeyboardNav({
      menuRef: toolPanelRailRef,
      items: toolPanelItems,
      isOpen: toolPanelIsOpen,
    });

    const columnHeaderMenuItems = computed<readonly MenuKeyboardNavItem[]>(() => {
      const openId = openColumnHeaderMenuColIdRef.value;
      if (openId == null) return [];
      const col = columnTable.value.getById(openId);
      const isSortableForMenu = col?.sortable !== false;
      const isAutosizeableForMenu = col?.autosizeable !== false && col?.resizable !== false;
      const isCurrentlySorted = sortSpec.value.some((s) => s.colId === openId);
      return [
        { id: 'sort-asc', disabled: !isSortableForMenu },
        { id: 'sort-desc', disabled: !isSortableForMenu },
        { id: 'clear-sort', disabled: !isCurrentlySorted },
        { id: 'hide', disabled: false },
        { id: 'autosize', disabled: !isAutosizeableForMenu },
      ];
    });
    const columnHeaderMenuIsOpen = computed<boolean>(
      () => openColumnHeaderMenuColIdRef.value != null,
    );
    const columnHeaderMenuKbdNav = useMenuKeyboardNav({
      menuRef: columnHeaderMenuRef,
      items: columnHeaderMenuItems,
      isOpen: columnHeaderMenuIsOpen,
      instanceKey: openColumnHeaderMenuColIdRef,
    });

    const cellContextMenuItems = computed<readonly MenuKeyboardNavItem[]>(() => {
      const pos = contextMenuPositionRef.value;
      const cfg = props.contextMenu;
      if (pos == null || cfg == null || cfg.items.length === 0) return [];
      const ctx: ContextMenuContext = { rowId: pos.rowId, colId: pos.colId };
      return cfg.items.map((it) => ({ id: it.id, disabled: it.disabled?.(ctx) === true }));
    });
    const cellContextMenuIsOpen = computed<boolean>(() => contextMenuPositionRef.value != null);
    const cellContextMenuKbdNav = useMenuKeyboardNav({
      menuRef: cellContextMenuRef,
      items: cellContextMenuItems,
      isOpen: cellContextMenuIsOpen,
    });

    const columnVisibilityMenuItems = computed<readonly MenuKeyboardNavItem[]>(() =>
      props.columns.map((col) => ({ id: col.id })),
    );
    const columnVisibilityMenuKbdNav = useMenuKeyboardNav({
      menuRef: columnMenuPopoverRef,
      items: columnVisibilityMenuItems,
      isOpen: columnMenuOpen,
    });

    const serverSideRowsSynthesized = computed<readonly RowSpec[]>(() => {
      if (props.rowModelType !== 'serverSide') return [];
      const session = serverSideSessionRef.value;
      if (session == null) return [];
      void serverSideVersion.value;
      const total = session.getTotalRowCount();
      if (total <= 0) return [];
      const blockSize = session.cacheBlockSize;
      // (2026-05-30 — vue2 port) Decision B.1: when
      // paginationEnabled, allocate ONLY the current page's rows.
      // Verbatim mirror of vue3.
      if (props.paginationEnabled) {
        const pageSize = currentPageSizeRef.value;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const page = Math.min(Math.max(0, currentPageRef.value), totalPages - 1);
        const startRow = page * pageSize;
        const endRow = Math.min(startRow + pageSize, total);
        const pageRows: RowSpec[] = [];
        for (let i = startRow; i < endRow; i++) {
          const row = session.getRowAt(i);
          if (row != null) {
            pageRows.push(row);
          } else {
            const blockIndex = Math.floor(i / blockSize);
            pageRows.push({
              id: `${SERVER_SIDE_SKELETON_ID_PREFIX}${blockIndex}_${i}`,
              data: {},
            });
          }
        }
        return pageRows;
      }
      // (2026-05-31 — vue2 port) Decision A.1 + B.1: peek-only
      // loop. Verbatim mirror of vue3.
      const result: RowSpec[] = new Array<RowSpec>(total);
      for (let i = 0; i < total; i++) {
        const row = session.peekRowAt(i);
        if (row != null) {
          result[i] = row;
        } else {
          const blockIndex = Math.floor(i / blockSize);
          result[i] = {
            id: `${SERVER_SIDE_SKELETON_ID_PREFIX}${blockIndex}_${i}`,
            data: {},
          };
        }
      }
      return result;
    });

    // (2026-05-31 — vue2 port) Decision B.1: viewport-driven
    // dispatch effect. Verbatim mirror of vue3.
    // (2026-05-31 — vue2 port) Decision B.1 extends this effect with
    // direction-aware prefetch pass appended after visible-range
    // dispatch (gated on `serverSidePrefetchAheadBlocks > 0`).
    watch(
      [
        () => props.rowModelType,
        () => props.paginationEnabled,
        () => bodyScrollTop.value,
        () => bodyClientHeight.value,
        () => mergedTheme.value.rowHeight,
        () => serverSideVersion.value,
        () => props.serverSidePrefetchAheadBlocks,
      ] as const,
      ([mode, paginated, scrollTop, viewportHeight, rowHeight, , prefetchAheadProp]) => {
        if (mode !== 'serverSide' || paginated) return;
        const session = serverSideSessionRef.value;
        if (session == null) return;
        if (rowHeight <= 0) return;
        const overscan = 3;
        const firstVisible = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
        const lastVisible = Math.ceil((scrollTop + viewportHeight) / rowHeight) + overscan;
        for (let i = firstVisible; i < lastVisible; i++) {
          session.getRowAt(i);
        }
        // (2026-05-31 — vue2 port) Decision A.1 + B.1:
        // direction-aware prefetch pass. Verbatim mirror of vue3.
        const prefetchAheadBlocks = Math.max(0, Math.floor(prefetchAheadProp));
        if (prefetchAheadBlocks > 0) {
          const blockSize = session.cacheBlockSize;
          const total = session.getTotalRowCount();
          const prevFirst = prevFirstVisibleRef.value;
          const prevLast = prevLastVisibleRef.value;
          const prefetchSpan = prefetchAheadBlocks * blockSize;
          if (prevLast != null && lastVisible > prevLast) {
            const prefetchEnd = Math.min(total, lastVisible + prefetchSpan);
            for (let i = lastVisible; i < prefetchEnd; i++) {
              session.getRowAt(i);
            }
          } else if (prevFirst != null && firstVisible < prevFirst) {
            const prefetchStart = Math.max(0, firstVisible - prefetchSpan);
            for (let i = prefetchStart; i < firstVisible; i++) {
              session.getRowAt(i);
            }
          }
        }
        prevFirstVisibleRef.value = firstVisible;
        prevLastVisibleRef.value = lastVisible;
      },
    );

    watch(
      [() => props.rowModelType, () => sortSpec.value, () => filterSpec.value] as const,
      ([mode, sortNext, filterNext]) => {
        if (mode !== 'serverSide') return;
        const session = serverSideSessionRef.value;
        if (session == null) return;
        session.applyView({ sortModel: sortNext, filterModel: filterNext });
      },
    );

    // (2026-05-30 — vue2 port) Decision B.1: footer values
    // for serverSide + paginationEnabled mode. Verbatim mirror of vue3.
    const serverSidePaginationActive = computed(
      () => props.rowModelType === 'serverSide' && props.paginationEnabled,
    );
    const serverSideTotalRowsForFooter = computed(() => {
      if (!serverSidePaginationActive.value) return 0;
      void serverSideVersion.value;
      return serverSideSessionRef.value?.getTotalRowCount() ?? 0;
    });
    const serverSideTotalPagesForFooter = computed(() => {
      const total = serverSideTotalRowsForFooter.value;
      const pageSize = currentPageSizeRef.value;
      if (total <= 0 || pageSize <= 0) return 0;
      return Math.ceil(total / pageSize);
    });
    const serverSideCurrentPageForFooter = computed(() => {
      const totalPages = serverSideTotalPagesForFooter.value;
      if (totalPages === 0) return 0;
      return Math.min(Math.max(0, currentPageRef.value), totalPages - 1);
    });

    const {
      widthByColId,
      totalWidth,
      visibleColumns,
      headerCells,
      rowYByRowId,
      rowHeightByRowId,
      totalBodyHeight,
      visibleRows,
      pagedRows,
      filteredRows,
      currentPage: currentPageFromPass,
      totalPages: totalPagesFromPass,
      totalRowsAcrossPages,
      flatTreeRows,
      maxTreeDepth,
      filterForceExpandedRowIds,
      quickFindForceExpandedRowIds,
      quickFindMatchCount,
      topPinnedRows,
      bottomPinnedRows,
    } = useTableLayout({
      columns: () => columnsForLayout.value,
      containerWidth: clientWidth,
      defaultColumnWidth: () => mergedTheme.value.defaultColumnWidth,
      defaultMinColumnWidth: () => mergedTheme.value.defaultMinColumnWidth,
      rows: () =>
        props.rowModelType === 'serverSide' ? serverSideRowsSynthesized.value : props.rows,
      defaultRowHeight: () => mergedTheme.value.rowHeight,
      viewportScrollTop: bodyScrollTop,
      viewportHeight: bodyClientHeight,
      overscan: () => 3,
      sortSpec: () => (props.rowModelType === 'serverSide' ? [] : sortSpec.value),
      filterSpec: () => (props.rowModelType === 'serverSide' ? [] : filterSpec.value),
      quickFindText: () => (props.rowModelType === 'serverSide' ? '' : quickFindText.value),
      page: () => (props.rowModelType === 'serverSide' ? 0 : currentPageRef.value),
      pageSize: () => (props.rowModelType === 'serverSide' ? 0 : effectivePageSize.value),
      expandedRowIds: () => effectiveExpandedRowIdsSet.value,
      loadedLazyChildrenByRowId: () => loadedLazyChildrenByRowId.value,
      rowHeightOverridesByRowId: () => rowHeightOverridesObject.value,
    });

    // Decision F.1 + union user
    // manual expand set with filter-auto-expanded ancestors AND
    // quick-find-auto-expanded ancestors. Both force-expand sources
    // are convergent on their own pass results (never on
    // flatTreeRows) so no cycle.
    watch(
      [
        () => treeExpandState.expandedRowIdsSet.value,
        () => filterForceExpandedRowIds.value,
        () => quickFindForceExpandedRowIds.value,
      ] as const,
      ([userSet, filterForceList, quickFindForceList]) => {
        if (filterForceList.length === 0 && quickFindForceList.length === 0) {
          effectiveExpandedRowIdsSet.value = userSet;
          return;
        }
        const merged = new Set(userSet);
        for (const id of filterForceList) merged.add(id);
        for (const id of quickFindForceList) merged.add(id);
        effectiveExpandedRowIdsSet.value = merged;
      },
      { immediate: true },
    );

    // -A (2026-05-30 — vue2 port): displayed-row-index lookup
    // refresh on pagedRows change. Verbatim mirror of vue3 -A.
    watch(
      pagedRows,
      (next) => {
        const map: Record<string, number> = {};
        for (let i = 0; i < next.length; i++) {
          const row = next[i];
          if (row != null) map[row.id] = i;
        }
        displayedRowIndexByRowId.value = map;
      },
      { immediate: true },
    );

    const columnTable = computed<ColumnTable>(() => createColumnTable(props.columns));
    const rowDataSource = computed<RowDataSource>(() => createClientSideRowSource(props.rows));

    // (2026-05-28 — vue2 port): lazy children load helpers.
    // Verbatim port of vue3 wiring.
    function findRowByIdRecursive(rowId: string): RowSpec | null {
      function walk(rows: readonly RowSpec[]): RowSpec | null {
        for (const r of rows) {
          if (r.id === rowId) return r;
          if (r.children != null) {
            const inSync = walk(r.children);
            if (inSync != null) return inSync;
          }
          const lazyState = lazyChildrenStateRef.value.get(r.id);
          if (lazyState?.status === 'loaded' && lazyState.children != null) {
            const inLazy = walk(lazyState.children);
            if (inLazy != null) return inLazy;
          }
        }
        return null;
      }
      return walk(props.rows);
    }
    function applyLazyChevronClick(rowId: string): void {
      const parent = findRowByIdRecursive(rowId);
      if (parent == null) return;
      const isLazyEligible = parent.children === undefined && parent.hasChildren === true;
      if (!isLazyEligible) {
        treeExpandState.toggle(rowId);
        return;
      }
      const loader = props.childrenLoader;
      if (loader == null) {
        if (!lazyMisconfigWarnedIds.has(rowId)) {
          lazyMisconfigWarnedIds.add(rowId);
          console.warn(
            `[chronix-table] row "${rowId}" has hasChildren: true but no childrenLoader prop. ` +
              `Chevron click is a no-op. Provide childrenLoader to enable lazy load.`,
          );
        }
        treeExpandState.toggle(rowId);
        return;
      }
      const current = lazyChildrenStateRef.value.get(rowId);
      if (current?.status === 'loading') return;
      if (current?.status === 'loaded') {
        treeExpandState.toggle(rowId);
        return;
      }
      const abort = new AbortController();
      const nextMap = new Map(lazyChildrenStateRef.value);
      nextMap.set(rowId, { status: 'loading', abort });
      lazyChildrenStateRef.value = nextMap;
      treeExpandState.expand(rowId);
      ctx.emit('lazy-load-start', { parent });
      void loader({ parent, signal: abort.signal }).then(
        (children) => {
          const currentAfter = lazyChildrenStateRef.value.get(rowId);
          if (currentAfter?.abort !== abort) return;
          const nextMap2 = new Map(lazyChildrenStateRef.value);
          nextMap2.set(rowId, { status: 'loaded', children });
          lazyChildrenStateRef.value = nextMap2;
          ctx.emit('lazy-load-success', { parent, children });
        },
        (error: unknown) => {
          const currentAfter = lazyChildrenStateRef.value.get(rowId);
          if (currentAfter?.abort !== abort) return;
          if (abort.signal.aborted) {
            const nextMap2 = new Map(lazyChildrenStateRef.value);
            nextMap2.delete(rowId);
            lazyChildrenStateRef.value = nextMap2;
            return;
          }
          const nextMap2 = new Map(lazyChildrenStateRef.value);
          nextMap2.set(rowId, { status: 'error', error });
          lazyChildrenStateRef.value = nextMap2;
          ctx.emit('lazy-load-error', { parent, error });
        },
      );
    }
    function abortLazyLoadIfInflight(rowId: string): void {
      const state = lazyChildrenStateRef.value.get(rowId);
      if (state?.status !== 'loading') return;
      state.abort?.abort();
      const nextMap = new Map(lazyChildrenStateRef.value);
      nextMap.delete(rowId);
      lazyChildrenStateRef.value = nextMap;
    }

    /**
     * (2026-05-26 — vue2 port of vue3): downstream
     * of `columnLayoutPass` — partitions `visibleColumns` into left-
     * pinned / center / right-pinned zones and computes cumulative
     * sticky offsets for each pinned cell. The result is read by the
     * header / filter / body cell render blocks to apply
     * `position: sticky` + the right `left:` / `right:` pixel offset
     * + zone modifier classes. Reactively recomputes when columns or
     * widths change.
     */
    const pinnedColsResult = computed<PinnedColsResult>(() => {
      const vis = visibleColumns.value;
      if (vis.length === 0) return EMPTY_PINNED_COLS_RESULT;
      return pinnedColsPass({
        visibleColumns: vis,
        widthByColId: widthByColId.value,
      });
    });

    /**
     * (vue2 port, 2026-05-28): which visible column shows the
     * expand/collapse chevron + indent (Decision D.1). Explicitly opt-in
     * via `treeColumn: true` on a `ColumnSpec`. When zero or multiple
     * are flagged, the first visible flagged column wins; when zero are
     * flagged AND the dataset has tree rows, fall back to the first
     * visible column with a `console.warn`.
     */
    const treeColumnIdRef = computed<string | null>(() => {
      const vis = visibleColumns.value;
      const flagged = vis.filter((c) => c.treeColumn === true);
      if (flagged.length > 1) {
        console.warn(
          `[chronix-table] multiple columns flagged with treeColumn: true (${flagged
            .map((c) => c.id)
            .join(', ')}). Using the first visible (${flagged[0]?.id}).`,
        );
      }
      if (flagged.length > 0) {
        return flagged[0]?.id ?? null;
      }
      if (maxTreeDepth.value > 0 && vis.length > 0) {
        console.warn(
          '[chronix-table] tree data detected but no column declared treeColumn: true. ' +
            `Falling back to first visible column "${vis[0]?.id}". ` +
            'Add treeColumn: true to the column you want the chevron to render in.',
        );
        return vis[0]?.id ?? null;
      }
      return null;
    });

    /**
     * (2026-05-27 — vue2 port): per-zone header-
     * group spans, one inner array per nesting level. Per vue3
     * Decision A.1, groups never span across pinned-zone boundaries.
     * Per vue3 Decision B.1, all zones produce the SAME
     * number of rows (table-wide max depth) by top-padding shallower
     * zones with empty placeholder rows.
     */
    const tableMaxHeaderDepth = computed<number>(() => {
      let depth = 0;
      for (const col of visibleColumns.value) {
        const hg = col.headerGroup;
        if (hg == null) continue;
        const len = typeof hg === 'string' ? 1 : hg.length;
        if (len > depth) depth = len;
      }
      return depth;
    });

    const headerGroupRowsByZone = computed<{
      readonly left: readonly (readonly HeaderGroupSpan[])[];
      readonly center: readonly (readonly HeaderGroupSpan[])[];
      readonly right: readonly (readonly HeaderGroupSpan[])[];
    } | null>(() => {
      const depth = tableMaxHeaderDepth.value;
      if (depth === 0) return null;
      const table = columnTable.value;
      function rowsFor(colIds: readonly string[]): readonly (readonly HeaderGroupSpan[])[] {
        const zoneCols: ColumnSpec[] = [];
        for (const id of colIds) {
          const col = table.getById(id);
          if (col != null) zoneCols.push(col);
        }
        return computeHeaderGroupSpans(zoneCols, depth);
      }
      const pr = pinnedColsResult.value;
      return {
        left: rowsFor(pr.leftPinnedColIds),
        center: rowsFor(pr.centerColIds),
        right: rowsFor(pr.rightPinnedColIds),
      };
    });

    /**
     * per-colId aggregate values for the
     * optional sticky footer row. Verbatim port of vue3
     * computed — reactive over `visibleColumns` + `filteredRows` so
     * the footer recomputes when the user changes the filter spec.
     * Skipped when `showFooterRow: false` so consumers without
     * footers pay nothing for the helper call.
     */
    const footerValuesByColId = computed<Record<string, unknown>>(() => {
      if (!props.showFooterRow) return {};
      return computeFooterValues(visibleColumns.value, filteredRows.value);
    });

    /**
     * assign sort spec + fire `sort-change` when
     * the new array differs from the current. Rejects (silently)
     * when any entry targets a non-sortable or unknown column —
     * matches `sortPass`'s atomic rejection so the SFC and core
     * agree on which specs are observable.
     *
     * Array equality is by length + per-entry colId+direction. The
     * dedup guards against no-op clicks (e.g., setSort([]) when
     * already []).
     */
    function applySort(next: readonly SortSpec[]): void {
      for (const entry of next) {
        const col = columnTable.value.getById(entry.colId);
        if (col == null || col.sortable === false) return;
      }
      const current = sortSpec.value;
      if (
        current.length === next.length &&
        current.every((c, i) => c.colId === next[i]!.colId && c.direction === next[i]!.direction)
      ) {
        return;
      }
      sortSpec.value = next;
      ctx.emit('sort-change', { sortSpec: next });
      // Decision C.1: a sort transition invalidates the
      // current page window — reset to page 0 so the user sees the
      // first page of the freshly ordered row set.
      resetPageToFirstIfPaginated();
    }

    /**
     * normalize the user-facing input shape (single spec /
     * array / null) into the canonical array shape.
     */
    function normalizeSortInput(spec: SortSpec | readonly SortSpec[] | null): readonly SortSpec[] {
      if (spec == null) return [];
      if (Array.isArray(spec)) return spec as readonly SortSpec[];
      return [spec as SortSpec];
    }

    /**
     * assign filter spec + fire `filter-change` when the
     * new array differs from the current. Rejects (silently) when
     * any entry targets a non-filterable or unknown column — matches
     * `filterPass`'s atomic rejection so the SFC and core agree on
     * which specs are observable.
     *
     * Array equality is by length + per-entry type+colId+operator+
     * value+caseSensitive. The dedup guards against no-op keystrokes
     * (e.g., setFilter from an unchanged input event). Verbatim port
     * of vue3 .
     */
    function applyFilter(next: readonly FilterSpec[]): void {
      for (const entry of next) {
        // (vue2 port): expression-variant specs are
        // validated at filterPass evaluation time; skip the colId-
        // keyed pre-flight check here.
        if (entry.type === 'expression') continue;
        const col = columnTable.value.getById(entry.colId);
        if (col == null || col.filterable === false) return;
      }
      const current = filterSpec.value;
      if (current.length === next.length && current.every((c, i) => filterSpecEqual(c, next[i]!))) {
        return;
      }
      filterSpec.value = next;
      ctx.emit('filter-change', { filterSpec: next });
      // Decision C.1: a filter transition invalidates the
      // current page window — reset to page 0 so the user sees the
      // first page of the freshly narrowed row set.
      resetPageToFirstIfPaginated();
    }

    /**
     * (2026-05-29 — vue2 port): apply a new quick-find text.
     * Dedup identical-string applications (no-op) so adapters can
     * safely call setQuickFindText per-keystroke without flooding
     * emits. A non-empty → empty (or empty → non-empty) transition
     * resets pagination to page 0 (matches Decision C.1 for
     * filter transitions). Verbatim port of vue3 .
     */
    function applyQuickFindText(next: string): void {
      const current = quickFindText.value;
      if (current === next) return;
      quickFindText.value = next;
      ctx.emit('quick-find-text-change', { quickFindText: next });
      resetPageToFirstIfPaginated();
    }

    function filterSpecEqual(a: FilterSpec, b: FilterSpec): boolean {
      if (a.type !== b.type) return false;
      if (a.type === 'text' && b.type === 'text') {
        return (
          a.colId === b.colId &&
          a.operator === b.operator &&
          a.value === b.value &&
          (a.caseSensitive ?? false) === (b.caseSensitive ?? false)
        );
      }
      if (a.type === 'number' && b.type === 'number') {
        return (
          a.colId === b.colId &&
          a.operator === b.operator &&
          a.value === b.value &&
          (a.valueTo ?? null) === (b.valueTo ?? null)
        );
      }
      if (a.type === 'set' && b.type === 'set') {
        if (a.colId !== b.colId) return false;
        if (a.selectedValues === b.selectedValues) return true;
        if (a.selectedValues == null || b.selectedValues == null) return false;
        if (a.selectedValues.length !== b.selectedValues.length) return false;
        for (let i = 0; i < a.selectedValues.length; i += 1) {
          if (a.selectedValues[i] !== b.selectedValues[i]) return false;
        }
        return true;
      }
      return false;
    }

    function normalizeFilterInput(
      spec: FilterSpec | readonly FilterSpec[] | null,
    ): readonly FilterSpec[] {
      if (spec == null) return [];
      if (Array.isArray(spec)) return spec as readonly FilterSpec[];
      return [spec as FilterSpec];
    }

    /**
     * + 43.1: SFC-internal helper for per-column filter-input
     * updates. Dispatches on `column.type`:
     *
     * - `'number'` columns → parse the input via
     *   `parsePrefixNumberFilter` (supports `5`, `>10`, `<20`, `>=5`,
     *   `<=10`, `!=3`, `5..50`). Invalid input → no spec entry
     *   (treats typos as "no filter" rather than hiding rows).
     * - other columns → text filter with `'contains'` operator.
     *
     * Empty value (or invalid number-filter input) removes the entry
     * so `getFilter()` doesn't accumulate dead specs. Verbatim port
     * of vue3 .
     */
    function setFilterColumnValue(colId: string, value: string): void {
      const current = filterSpec.value;
      const idx = current.findIndex(
        (s) => s.type !== 'expression' && s.type !== 'set' && s.colId === colId,
      );
      const column = columnTable.value.getById(colId);
      const isNumberColumn = column?.type === 'number';

      let newEntry: FilterSpec | null;
      if (value === '') {
        newEntry = null;
      } else if (isNumberColumn) {
        // Number column: parse the prefix syntax. Invalid → null (no
        // spec entry); valid → NumberFilterSpec.
        newEntry = parsePrefixNumberFilter(value, colId);
      } else {
        const textEntry: TextFilterSpec = {
          type: 'text',
          colId,
          operator: 'contains',
          value,
        };
        newEntry = textEntry;
      }

      let next: readonly FilterSpec[];
      if (newEntry == null) {
        next = idx >= 0 ? [...current.slice(0, idx), ...current.slice(idx + 1)] : current;
      } else if (idx >= 0) {
        next = [...current.slice(0, idx), newEntry, ...current.slice(idx + 1)];
      } else {
        next = [...current, newEntry];
      }
      applyFilter(next);
    }

    /**
     * format the SFC's filter input value from the
     * current filter spec for a given column. Round-trips
     * `setFilter` → input text so external programmatic calls
     * reactively update the visible input. Verbatim port of vue3
     * .
     */
    function filterInputValueFor(colId: string): string {
      const entry = filterSpec.value.find(
        (s) => s.type !== 'expression' && s.type !== 'set' && s.colId === colId,
      );
      if (entry == null || entry.type === 'expression' || entry.type === 'set') return '';
      if (entry.type === 'text') return entry.value;
      if (entry.type === 'number') return formatPrefixNumberFilter(entry);
      return '';
    }

    /**
     * (2026-05-29 — vue2 port): read the current SetFilterSpec
     * for a column. Verbatim port of vue3 .
     */
    function getSetFilterValues(
      colId: string,
    ): readonly (string | number | boolean | null)[] | null {
      const entry = filterSpec.value.find(
        (s): s is SetFilterSpec => s.type === 'set' && s.colId === colId,
      );
      if (entry == null) return null;
      return entry.selectedValues;
    }

    /**
     * (vue2 port): replace the SetFilterSpec entry for a
     * column. Verbatim port of vue3 .
     */
    function applySetFilterValues(
      colId: string,
      selectedValues: readonly (string | number | boolean | null)[] | null,
    ): void {
      const current = filterSpec.value;
      const idx = current.findIndex((s) => s.type === 'set' && s.colId === colId);
      let next: readonly FilterSpec[];
      if (selectedValues == null) {
        next = idx >= 0 ? [...current.slice(0, idx), ...current.slice(idx + 1)] : current;
      } else {
        const entry: SetFilterSpec = { type: 'set', colId, selectedValues };
        if (idx >= 0) {
          next = [...current.slice(0, idx), entry, ...current.slice(idx + 1)];
        } else {
          next = [...current, entry];
        }
      }
      applyFilter(next);
    }

    function setFilterSummaryLabel(colId: string, totalUnique: number): string {
      const selection = getSetFilterValues(colId);
      if (selection == null) return `全部 (${totalUnique}) ▾`;
      if (selection.length === 0) return `空选 (0 / ${totalUnique}) ▾`;
      return `${selection.length} / ${totalUnique} ▾`;
    }

    function isSetFilterValueChecked(
      colId: string,
      value: string | number | boolean | null,
    ): boolean {
      const selection = getSetFilterValues(colId);
      if (selection == null) return true;
      for (const candidate of selection) {
        if (candidate === value) return true;
        if (candidate === null && value === null) return true;
      }
      return false;
    }

    function toggleSetFilterValue(
      colId: string,
      value: string | number | boolean | null,
      allValues: readonly (string | number | boolean | null)[],
    ): void {
      const selection = getSetFilterValues(colId);
      if (selection == null) {
        const next = allValues.filter((v) => v !== value);
        applySetFilterValues(colId, next);
        return;
      }
      const isChecked = isSetFilterValueChecked(colId, value);
      if (isChecked) {
        const next = selection.filter((v) => v !== value);
        applySetFilterValues(colId, next);
      } else {
        applySetFilterValues(colId, [...selection, value]);
      }
    }

    // (2026-06-01 — vue2 port): multi-filter container
    // helpers. Verbatim port of vue3 surface.
    function getMultiFilterSpec(colId: string): MultiFilterSpec | null {
      const entry = filterSpec.value.find(
        (s): s is MultiFilterSpec => s.type === 'multi' && s.colId === colId,
      );
      return entry ?? null;
    }
    function bootstrapMultiFilterSpec(col: ColumnSpec): MultiFilterSpec {
      const slots = col.multiFilterChildTypes ?? (['text', 'text'] as const);
      if (slots.length > 5 && !multiFilterSlotCountWarned.value.has(col.id)) {
        console.warn(
          `[chronix-table] Column "${col.id}" multiFilterChildTypes has ${slots.length} ` +
            `entries; >5 stacked multi-filter widgets hurt the filter-row scan UX. ` +
            `Consider switching to the advanced filter DSL.`,
        );
        multiFilterSlotCountWarned.value = new Set(multiFilterSlotCountWarned.value).add(col.id);
      }
      const filters: MultiFilterChild[] = slots.map((kind) => {
        if (kind === 'text') return { type: 'text', operator: 'contains', value: '' };
        if (kind === 'set') return { type: 'set', selectedValues: null };
        return { type: 'number', operator: '=', value: 0 };
      });
      // (2026-06-02 — vue2 port): consumer-supplied default mode.
      return { type: 'multi', colId: col.id, mode: props.multiFilterDefaultMode, filters };
    }
    function applyMultiFilterSpec(colId: string, spec: MultiFilterSpec | null): void {
      const current = filterSpec.value;
      const idx = current.findIndex((s) => s.type === 'multi' && s.colId === colId);
      let next: readonly FilterSpec[];
      if (spec == null) {
        next = idx >= 0 ? [...current.slice(0, idx), ...current.slice(idx + 1)] : current;
      } else if (idx >= 0) {
        next = [...current.slice(0, idx), spec, ...current.slice(idx + 1)];
      } else {
        next = [...current, spec];
      }
      applyFilter(next);
    }
    function setMultiFilterChildValue(col: ColumnSpec, slotIdx: number, rawValue: string): void {
      const current = getMultiFilterSpec(col.id) ?? bootstrapMultiFilterSpec(col);
      const existing = current.filters[slotIdx];
      // (2026-06-02 — vue2 port): skip when slot at idx is
      // a group entry (consumer-injected via setFilter).
      if (existing?.type === 'group') return;
      const slotKind = (col.multiFilterChildTypes ?? (['text', 'text'] as const))[slotIdx];
      if (slotKind == null) return;
      let nextChild: MultiFilterChild;
      if (slotKind === 'number') {
        const parsed = Number(rawValue);
        nextChild = {
          type: 'number',
          operator: '=',
          value: Number.isFinite(parsed) ? parsed : Number.NaN,
        };
      } else if (slotKind === 'set') {
        return;
      } else {
        nextChild = { type: 'text', operator: 'contains', value: rawValue };
      }
      const nextFilters = current.filters.map((f, i) => (i === slotIdx ? nextChild : f));
      applyMultiFilterSpec(col.id, { ...current, filters: nextFilters });
    }
    // (2026-06-02 — vue2 port): set-child membership toggle.
    function toggleMultiFilterChildSetValue(
      col: ColumnSpec,
      slotIdx: number,
      value: string | number | boolean | null,
    ): void {
      const current = getMultiFilterSpec(col.id) ?? bootstrapMultiFilterSpec(col);
      const existing = current.filters[slotIdx];
      if (existing?.type !== 'set') return;
      const prev = existing.selectedValues;
      let nextSelected: readonly (string | number | boolean | null)[] | null;
      if (prev == null) {
        nextSelected = [value];
      } else {
        const idx = prev.findIndex((v) => Object.is(v, value));
        if (idx >= 0) {
          const next = [...prev.slice(0, idx), ...prev.slice(idx + 1)];
          nextSelected = next.length === 0 ? null : next;
        } else {
          nextSelected = [...prev, value];
        }
      }
      const nextChild: MultiFilterChildSet = { type: 'set', selectedValues: nextSelected };
      const nextFilters = current.filters.map((f, i) => (i === slotIdx ? nextChild : f));
      applyMultiFilterSpec(col.id, { ...current, filters: nextFilters });
    }
    function isMultiFilterChildSetValueChecked(
      col: ColumnSpec,
      slotIdx: number,
      value: string | number | boolean | null,
    ): boolean {
      const spec = getMultiFilterSpec(col.id);
      if (spec == null) return false;
      const child = spec.filters[slotIdx];
      if (child?.type !== 'set') return false;
      const sel = child.selectedValues;
      if (sel == null) return false;
      return sel.some((v) => Object.is(v, value));
    }
    /**
     * (2026-06-02 — vue2 port): walk the multi-filter
     * tree to the entry at the given path. Empty path throws (root
     * spec mutation goes through `setFilter`). Out-of-range path
     * returns null.
     */
    function getMultiFilterEntryAtPathInternal(
      colId: string,
      path: readonly number[],
    ): MultiFilterEntry | null {
      if (path.length === 0) {
        throw new Error('empty path not allowed; use getFilter() for root spec.');
      }
      const spec = getMultiFilterSpec(colId);
      if (spec == null) return null;
      let entries: readonly MultiFilterEntry[] = spec.filters;
      let current: MultiFilterEntry | null = null;
      for (let i = 0; i < path.length; i++) {
        const idx = path[i]!;
        if (idx < 0 || idx >= entries.length) return null;
        current = entries[idx]!;
        if (i === path.length - 1) return current;
        if (current.type !== 'group') return null;
        entries = current.filters;
      }
      return current;
    }

    function setMultiFilterEntryAtPathInternal(
      col: ColumnSpec,
      path: readonly number[],
      next: MultiFilterEntry,
    ): void {
      if (path.length === 0) {
        throw new Error('empty path not allowed; use setFilter() for root spec.');
      }
      const current = getMultiFilterSpec(col.id) ?? bootstrapMultiFilterSpec(col);
      const rebuilt = replaceEntryAtPath(current.filters, path, 0, next);
      if (rebuilt === current.filters) return;
      applyMultiFilterSpec(col.id, { ...current, filters: rebuilt });
    }

    function replaceEntryAtPath(
      entries: readonly MultiFilterEntry[],
      path: readonly number[],
      pathIdx: number,
      next: MultiFilterEntry,
    ): readonly MultiFilterEntry[] {
      const idx = path[pathIdx]!;
      if (idx < 0 || idx >= entries.length) return entries;
      if (pathIdx === path.length - 1) {
        return entries.map((e, i) => (i === idx ? next : e));
      }
      const current = entries[idx]!;
      if (current.type !== 'group') return entries;
      const replacedChildren = replaceEntryAtPath(current.filters, path, pathIdx + 1, next);
      if (replacedChildren === current.filters) return entries;
      const replacedGroup: MultiFilterGroup = { ...current, filters: replacedChildren };
      return entries.map((e, i) => (i === idx ? replacedGroup : e));
    }

    function removeMultiFilterEntryAtPathInternal(col: ColumnSpec, path: readonly number[]): void {
      if (path.length === 0) {
        throw new Error('empty path not allowed; use setFilter(null) to clear.');
      }
      const current = getMultiFilterSpec(col.id);
      if (current == null) return;
      const rebuilt = spliceEntryAtPath(current.filters, path, 0);
      if (rebuilt === current.filters) return;
      applyMultiFilterSpec(col.id, { ...current, filters: rebuilt });
    }

    function spliceEntryAtPath(
      entries: readonly MultiFilterEntry[],
      path: readonly number[],
      pathIdx: number,
    ): readonly MultiFilterEntry[] {
      const idx = path[pathIdx]!;
      if (idx < 0 || idx >= entries.length) return entries;
      if (pathIdx === path.length - 1) {
        return [...entries.slice(0, idx), ...entries.slice(idx + 1)];
      }
      const current = entries[idx]!;
      if (current.type !== 'group') return entries;
      const splicedChildren = spliceEntryAtPath(current.filters, path, pathIdx + 1);
      if (splicedChildren === current.filters) return entries;
      const replacedGroup: MultiFilterGroup = { ...current, filters: splicedChildren };
      return entries.map((e, i) => (i === idx ? replacedGroup : e));
    }

    function setMultiFilterMode(col: ColumnSpec, mode: 'AND' | 'OR'): void {
      const current = getMultiFilterSpec(col.id) ?? bootstrapMultiFilterSpec(col);
      if (current.mode === mode) return;
      applyMultiFilterSpec(col.id, { ...current, mode });
    }
    function multiFilterSummaryLabel(col: ColumnSpec): string {
      const spec = getMultiFilterSpec(col.id);
      if (spec == null) return '未启用';
      const active = spec.filters.filter((f) => {
        if (f.type === 'text') return f.value !== '';
        if (f.type === 'number') return Number.isFinite(f.value);
        if (f.type === 'set') return f.selectedValues != null;
        // group counts as active iff it has any entries.
        return f.filters.length > 0;
      }).length;
      if (active === 0) return '未启用';
      const modeLabel = spec.mode === 'AND' ? '全部' : '任一';
      return `${active} 个筛选器 · ${modeLabel}`;
    }

    /**
     * (2026-05-31 — vue2 port): read the current Number
     * filter range for a column. Verbatim mirror of vue3 helper.
     */
    function readNumberFilterRangeForCol(
      colId: string,
      extents: { min: number; max: number },
    ): { low: number; high: number } {
      const entry = filterSpec.value.find(
        (s): s is NumberFilterSpec => s.type === 'number' && s.colId === colId,
      );
      if (entry == null) return { low: extents.min, high: extents.max };
      if (entry.operator === 'inRange') {
        const low = entry.value;
        const high = entry.valueTo ?? entry.value;
        return { low: Math.min(low, high), high: Math.max(low, high) };
      }
      return { low: entry.value, high: entry.value };
    }

    /**
     * (2026-05-31 — vue2 port): map a slider value to a
     * percent along the track. Verbatim mirror of vue3 helper.
     */
    function rangeThumbLeftPercent(value: number, extents: { min: number; max: number }): number {
      if (extents.max <= extents.min) return 0;
      const ratio = (value - extents.min) / (extents.max - extents.min);
      if (ratio < 0) return 0;
      if (ratio > 1) return 100;
      return ratio * 100;
    }

    /**
     * (2026-05-31 — vue2 port) + + Phase
     * 99.2.2 + (2026-06-01 — vue2 port): open the cell
     * style editor popover. Reads all 9 axes from the persisted map;
     * defaults activeTab based on which axes already have values.
     * Verbatim mirror of vue3 helper.
     */
    function openCellStyleEditor(rowId: string, colId: string): void {
      if (!props.enableCellStyleEditor) return;
      const wrapperEl = wrapperRef.value;
      if (wrapperEl == null) return;
      const cellEl = wrapperEl.querySelector<HTMLElement>(
        `.cx-table-cell[data-row-id="${rowId}"][data-col-id="${colId}"]`,
      );
      if (cellEl == null) return;
      const rect = cellEl.getBoundingClientRect();
      const persistedEntry = effectiveCellStyleByRowIdColId.value[rowId]?.[colId];
      const persistedBgHex = persistedEntry?.backgroundColor ?? null;
      const persistedTextHex = persistedEntry?.color ?? null;
      const persistedFontWeight = persistedEntry?.fontWeight ?? null;
      const persistedFontStyle = persistedEntry?.fontStyle ?? null;
      const persistedTextDecoration = persistedEntry?.textDecoration ?? null;
      const persistedBorderColor = persistedEntry?.borderColor ?? null;
      const persistedBorderWidth = persistedEntry?.borderWidth ?? null;
      const persistedBorderStyle = persistedEntry?.borderStyle ?? null;
      const persistedBorderRadius = persistedEntry?.borderRadius ?? null;
      // (2026-06-01 — vue2 port): 12 per-side fields.
      const persistedBorderTopColor = persistedEntry?.borderTopColor ?? null;
      const persistedBorderTopWidth = persistedEntry?.borderTopWidth ?? null;
      const persistedBorderTopStyle = persistedEntry?.borderTopStyle ?? null;
      const persistedBorderRightColor = persistedEntry?.borderRightColor ?? null;
      const persistedBorderRightWidth = persistedEntry?.borderRightWidth ?? null;
      const persistedBorderRightStyle = persistedEntry?.borderRightStyle ?? null;
      const persistedBorderBottomColor = persistedEntry?.borderBottomColor ?? null;
      const persistedBorderBottomWidth = persistedEntry?.borderBottomWidth ?? null;
      const persistedBorderBottomStyle = persistedEntry?.borderBottomStyle ?? null;
      const persistedBorderLeftColor = persistedEntry?.borderLeftColor ?? null;
      const persistedBorderLeftWidth = persistedEntry?.borderLeftWidth ?? null;
      const persistedBorderLeftStyle = persistedEntry?.borderLeftStyle ?? null;
      const hasFontOverride =
        persistedFontWeight != null ||
        persistedFontStyle != null ||
        persistedTextDecoration != null;
      const hasBorderOverride =
        persistedBorderColor != null ||
        persistedBorderWidth != null ||
        persistedBorderStyle != null ||
        persistedBorderRadius != null ||
        persistedBorderTopColor != null ||
        persistedBorderTopWidth != null ||
        persistedBorderTopStyle != null ||
        persistedBorderRightColor != null ||
        persistedBorderRightWidth != null ||
        persistedBorderRightStyle != null ||
        persistedBorderBottomColor != null ||
        persistedBorderBottomWidth != null ||
        persistedBorderBottomStyle != null ||
        persistedBorderLeftColor != null ||
        persistedBorderLeftWidth != null ||
        persistedBorderLeftStyle != null;
      const activeTab: 'background' | 'text' | 'font' | 'border' =
        persistedBgHex == null && persistedTextHex == null && !hasFontOverride && hasBorderOverride
          ? 'border'
          : persistedBgHex == null && persistedTextHex == null && hasFontOverride
            ? 'font'
            : persistedBgHex == null && persistedTextHex != null
              ? 'text'
              : 'background';
      const initialHex =
        activeTab === 'background'
          ? (persistedBgHex ?? '#ffffff')
          : activeTab === 'text'
            ? (persistedTextHex ?? '#000000')
            : '#ffffff';
      const rgb = hexToRgb(initialHex) ?? { r: 255, g: 255, b: 255 };
      const hsv = rgbToHsv(rgb);
      cellStyleEditorOpenRef.value = {
        rowId,
        colId,
        anchorRect: { left: rect.left, top: rect.top, bottom: rect.bottom },
        hsv,
        hex: rgbToHex(rgb),
        activeTab,
        bgHex: persistedBgHex,
        textHex: persistedTextHex,
        fontState: {
          fontWeight: persistedFontWeight,
          fontStyle: persistedFontStyle,
          textDecoration: persistedTextDecoration,
        },
        borderState: {
          borderColor: persistedBorderColor,
          borderWidth: persistedBorderWidth,
          borderStyle: persistedBorderStyle,
          borderRadius: persistedBorderRadius,
          borderTopColor: persistedBorderTopColor,
          borderTopWidth: persistedBorderTopWidth,
          borderTopStyle: persistedBorderTopStyle,
          borderRightColor: persistedBorderRightColor,
          borderRightWidth: persistedBorderRightWidth,
          borderRightStyle: persistedBorderRightStyle,
          borderBottomColor: persistedBorderBottomColor,
          borderBottomWidth: persistedBorderBottomWidth,
          borderBottomStyle: persistedBorderBottomStyle,
          borderLeftColor: persistedBorderLeftColor,
          borderLeftWidth: persistedBorderLeftWidth,
          borderLeftStyle: persistedBorderLeftStyle,
          borderSideTarget: 'all',
          hsv: rgbToHsv(hexToRgb(persistedBorderColor ?? '#000000') ?? { r: 0, g: 0, b: 0 }),
          hex: persistedBorderColor ?? '#000000',
        },
      };
    }

    /**
     * (2026-05-31 — vue2 port) + + Phase
     * 99.2.3 (2026-06-01 — vue2 port): swap the popover editing
     * buffer to a different axis (`'background'` | `'text'` | `'font'`
     * | `'border'`). Verbatim mirror of vue3 helper.
     */
    function switchCellStyleEditorTab(tab: 'background' | 'text' | 'font' | 'border'): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      if (state.activeTab === tab) return;
      const partialClosing: { bgHex?: string; textHex?: string } =
        state.activeTab === 'background'
          ? { bgHex: state.hex }
          : state.activeTab === 'text'
            ? { textHex: state.hex }
            : {};
      let nextHex: string;
      if (tab === 'background') {
        nextHex = state.bgHex ?? '#ffffff';
      } else if (tab === 'text') {
        nextHex = state.textHex ?? '#000000';
      } else {
        nextHex = '#ffffff';
      }
      const nextRgb = hexToRgb(nextHex) ?? { r: 255, g: 255, b: 255 };
      const nextHsv = rgbToHsv(nextRgb);
      cellStyleEditorOpenRef.value = {
        ...state,
        ...partialClosing,
        activeTab: tab,
        hsv: nextHsv,
        hex: rgbToHex(nextRgb),
      };
    }

    /**
     * (2026-06-01 — vue2 port): toggle Bold weight on
     * the font tab. Verbatim mirror of vue3.
     */
    function toggleCellStyleFontWeight(): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      cellStyleEditorOpenRef.value = {
        ...state,
        fontState: {
          ...state.fontState,
          fontWeight: state.fontState.fontWeight === '700' ? null : '700',
        },
      };
    }

    /**
     * (2026-06-01 — vue2 port): set custom font weight
     * on the font tab. Verbatim mirror of vue3.
     */
    function setCellStyleFontWeight(value: string | null): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      cellStyleEditorOpenRef.value = {
        ...state,
        fontState: { ...state.fontState, fontWeight: value },
      };
    }

    /**
     * (2026-06-01 — vue2 port): toggle Italic style.
     * Verbatim mirror of vue3.
     */
    function toggleCellStyleFontStyle(): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      cellStyleEditorOpenRef.value = {
        ...state,
        fontState: {
          ...state.fontState,
          fontStyle: state.fontState.fontStyle === 'italic' ? null : 'italic',
        },
      };
    }

    /**
     * (2026-06-01 — vue2 port): set text-decoration tri-
     * state. Verbatim mirror of vue3.
     */
    function setCellStyleTextDecoration(value: 'underline' | 'line-through' | null): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      cellStyleEditorOpenRef.value = {
        ...state,
        fontState: { ...state.fontState, textDecoration: value },
      };
    }

    /**
     * (2026-06-01 — vue2 port): compute borderState
     * field name for axis + target. Verbatim mirror of vue3.
     */
    function borderFieldFor(
      axis: 'Color' | 'Width' | 'Style',
      target: 'all' | 'top' | 'right' | 'bottom' | 'left',
    ): keyof CellStyleEntry {
      if (target === 'all') return `border${axis}`;
      const cap = target.charAt(0).toUpperCase() + target.slice(1);
      return `border${cap}${axis}` as keyof CellStyleEntry;
    }

    /**
     * + 99.2.3.1 + 99.2.3.2 (2026-06-01 — vue2 port):
     * target-aware border-color setter. Verbatim mirror of vue3.
     */
    function setCellStyleBorderColor(value: string): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const field = borderFieldFor('Color', state.borderState.borderSideTarget);
      const next: typeof state.borderState = {
        ...state.borderState,
        [field]: value === '' ? null : value,
      };
      const rgb = hexToRgb(value);
      if (rgb != null) {
        next.hex = value;
        next.hsv = rgbToHsv(rgb);
      }
      cellStyleEditorOpenRef.value = { ...state, borderState: next };
    }

    /**
     * + 99.2.3.1 (2026-06-01 — vue2 port): target-aware
     * border-width setter. Verbatim mirror of vue3.
     */
    function setCellStyleBorderWidth(value: string): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const field = borderFieldFor('Width', state.borderState.borderSideTarget);
      cellStyleEditorOpenRef.value = {
        ...state,
        borderState: { ...state.borderState, [field]: value === '' ? null : value },
      };
    }

    /**
     * + 99.2.3.1 (2026-06-01 — vue2 port): target-aware
     * border-style setter. Verbatim mirror of vue3.
     */
    function setCellStyleBorderStyle(value: 'solid' | 'dashed' | 'dotted' | null): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const field = borderFieldFor('Style', state.borderState.borderSideTarget);
      cellStyleEditorOpenRef.value = {
        ...state,
        borderState: { ...state.borderState, [field]: value },
      };
    }

    /**
     * (2026-06-01 — vue2 port): set border radius on the
     * border tab. Radius is always all-sides (no per-side CSS).
     * Verbatim mirror of vue3.
     */
    function setCellStyleBorderRadius(value: string): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      cellStyleEditorOpenRef.value = {
        ...state,
        borderState: { ...state.borderState, borderRadius: value === '' ? null : value },
      };
    }

    /**
     * + 99.2.3.2 (2026-06-01 — vue2 port): switch
     * which side the border tab's 4 widgets edit + re-derive HSV
     * picker buffer. Verbatim mirror of vue3.
     */
    function setCellStyleBorderSideTarget(
      target: 'all' | 'top' | 'right' | 'bottom' | 'left',
    ): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const bs = state.borderState;
      const sideColor =
        target === 'all'
          ? bs.borderColor
          : target === 'top'
            ? (bs.borderTopColor ?? bs.borderColor)
            : target === 'right'
              ? (bs.borderRightColor ?? bs.borderColor)
              : target === 'bottom'
                ? (bs.borderBottomColor ?? bs.borderColor)
                : (bs.borderLeftColor ?? bs.borderColor);
      const effectiveHex = sideColor ?? '#000000';
      const rgb = hexToRgb(effectiveHex) ?? { r: 0, g: 0, b: 0 };
      cellStyleEditorOpenRef.value = {
        ...state,
        borderState: {
          ...bs,
          borderSideTarget: target,
          hsv: rgbToHsv(rgb),
          hex: effectiveHex,
        },
      };
    }

    /**
     * (2026-06-01 — vue2 port): border-tab HSV picker
     * helper. Verbatim mirror of vue3.
     */
    function setCellStyleBorderHsv(hsv: Hsv): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const rgb = hsvToRgb(hsv);
      const hex = rgbToHex(rgb);
      const field = borderFieldFor('Color', state.borderState.borderSideTarget);
      cellStyleEditorOpenRef.value = {
        ...state,
        borderState: { ...state.borderState, hsv, hex, [field]: hex },
      };
    }

    function setCellStyleBorderRgbChannel(ch: 'r' | 'g' | 'b', raw: number): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      if (!Number.isFinite(raw)) return;
      const clamped = Math.max(0, Math.min(255, Math.round(raw)));
      const currentRgb = hsvToRgb(state.borderState.hsv);
      const nextRgb = { ...currentRgb, [ch]: clamped };
      setCellStyleBorderHsv(rgbToHsv(nextRgb));
    }

    function cancelCellStyleEditor(): void {
      cellStyleEditorOpenRef.value = null;
      cellStyleSquareDragRef.value = false;
      cellStyleHueDragRef.value = false;
      cellStyleFontWeightSliderDragRef.value = false;
      cellStyleBorderSquareDragRef.value = false;
      cellStyleBorderHueDragRef.value = false;
    }

    function applyCellStyleEditor(): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const { rowId, colId, hex, activeTab, fontState, borderState } = state;
      // (2026-06-01 — vue2 port): read via effective view;
      // gate writes behind isUncontrolled. Verbatim mirror of vue3.
      const prevForRow = effectiveCellStyleByRowIdColId.value[rowId] ?? {};
      const prevForCell = prevForRow[colId] ?? {};
      const isUncontrolled = props.cellStyleByRowIdColId === undefined;
      if (activeTab === 'font') {
        const nextForCell: CellStyleEntry = { ...prevForCell };
        if (fontState.fontWeight !== null) nextForCell.fontWeight = fontState.fontWeight;
        else delete nextForCell.fontWeight;
        if (fontState.fontStyle !== null) nextForCell.fontStyle = fontState.fontStyle;
        else delete nextForCell.fontStyle;
        if (fontState.textDecoration !== null)
          nextForCell.textDecoration = fontState.textDecoration;
        else delete nextForCell.textDecoration;
        if (isUncontrolled) {
          internalCellStyleByRowIdColId.value = {
            ...internalCellStyleByRowIdColId.value,
            [rowId]: { ...prevForRow, [colId]: nextForCell },
          };
        }
        ctx.emit('cell-style-change', {
          rowId,
          colId,
          style: {
            fontWeight: fontState.fontWeight,
            fontStyle: fontState.fontStyle,
            textDecoration: fontState.textDecoration,
          },
        });
      } else if (activeTab === 'border') {
        const nextForCell: CellStyleEntry = { ...prevForCell };
        if (borderState.borderColor !== null) nextForCell.borderColor = borderState.borderColor;
        else delete nextForCell.borderColor;
        if (borderState.borderWidth !== null) nextForCell.borderWidth = borderState.borderWidth;
        else delete nextForCell.borderWidth;
        if (borderState.borderStyle !== null) nextForCell.borderStyle = borderState.borderStyle;
        else delete nextForCell.borderStyle;
        if (borderState.borderRadius !== null) nextForCell.borderRadius = borderState.borderRadius;
        else delete nextForCell.borderRadius;
        // (2026-06-01 — vue2 port): 12 per-side fields.
        if (borderState.borderTopColor !== null)
          nextForCell.borderTopColor = borderState.borderTopColor;
        else delete nextForCell.borderTopColor;
        if (borderState.borderTopWidth !== null)
          nextForCell.borderTopWidth = borderState.borderTopWidth;
        else delete nextForCell.borderTopWidth;
        if (borderState.borderTopStyle !== null)
          nextForCell.borderTopStyle = borderState.borderTopStyle;
        else delete nextForCell.borderTopStyle;
        if (borderState.borderRightColor !== null)
          nextForCell.borderRightColor = borderState.borderRightColor;
        else delete nextForCell.borderRightColor;
        if (borderState.borderRightWidth !== null)
          nextForCell.borderRightWidth = borderState.borderRightWidth;
        else delete nextForCell.borderRightWidth;
        if (borderState.borderRightStyle !== null)
          nextForCell.borderRightStyle = borderState.borderRightStyle;
        else delete nextForCell.borderRightStyle;
        if (borderState.borderBottomColor !== null)
          nextForCell.borderBottomColor = borderState.borderBottomColor;
        else delete nextForCell.borderBottomColor;
        if (borderState.borderBottomWidth !== null)
          nextForCell.borderBottomWidth = borderState.borderBottomWidth;
        else delete nextForCell.borderBottomWidth;
        if (borderState.borderBottomStyle !== null)
          nextForCell.borderBottomStyle = borderState.borderBottomStyle;
        else delete nextForCell.borderBottomStyle;
        if (borderState.borderLeftColor !== null)
          nextForCell.borderLeftColor = borderState.borderLeftColor;
        else delete nextForCell.borderLeftColor;
        if (borderState.borderLeftWidth !== null)
          nextForCell.borderLeftWidth = borderState.borderLeftWidth;
        else delete nextForCell.borderLeftWidth;
        if (borderState.borderLeftStyle !== null)
          nextForCell.borderLeftStyle = borderState.borderLeftStyle;
        else delete nextForCell.borderLeftStyle;
        if (isUncontrolled) {
          internalCellStyleByRowIdColId.value = {
            ...internalCellStyleByRowIdColId.value,
            [rowId]: { ...prevForRow, [colId]: nextForCell },
          };
        }
        // (2026-06-01 — vue2 port): track recent
        // borderColor (skip null = cleared). also
        // push per-side colors.
        if (borderState.borderColor !== null) {
          pushRecentCellStyleColor(borderState.borderColor);
        }
        if (borderState.borderTopColor !== null) {
          pushRecentCellStyleColor(borderState.borderTopColor);
        }
        if (borderState.borderRightColor !== null) {
          pushRecentCellStyleColor(borderState.borderRightColor);
        }
        if (borderState.borderBottomColor !== null) {
          pushRecentCellStyleColor(borderState.borderBottomColor);
        }
        if (borderState.borderLeftColor !== null) {
          pushRecentCellStyleColor(borderState.borderLeftColor);
        }
        ctx.emit('cell-style-change', {
          rowId,
          colId,
          style: {
            borderColor: borderState.borderColor,
            borderWidth: borderState.borderWidth,
            borderStyle: borderState.borderStyle,
            borderRadius: borderState.borderRadius,
            borderTopColor: borderState.borderTopColor,
            borderTopWidth: borderState.borderTopWidth,
            borderTopStyle: borderState.borderTopStyle,
            borderRightColor: borderState.borderRightColor,
            borderRightWidth: borderState.borderRightWidth,
            borderRightStyle: borderState.borderRightStyle,
            borderBottomColor: borderState.borderBottomColor,
            borderBottomWidth: borderState.borderBottomWidth,
            borderBottomStyle: borderState.borderBottomStyle,
            borderLeftColor: borderState.borderLeftColor,
            borderLeftWidth: borderState.borderLeftWidth,
            borderLeftStyle: borderState.borderLeftStyle,
          },
        });
      } else {
        const field: 'backgroundColor' | 'color' =
          activeTab === 'background' ? 'backgroundColor' : 'color';
        if (isUncontrolled) {
          internalCellStyleByRowIdColId.value = {
            ...internalCellStyleByRowIdColId.value,
            [rowId]: { ...prevForRow, [colId]: { ...prevForCell, [field]: hex } },
          };
        }
        // (2026-06-01 — vue2 port): track recent bg/text.
        pushRecentCellStyleColor(hex);
        ctx.emit('cell-style-change', { rowId, colId, style: { [field]: hex } });
      }
      cancelCellStyleEditor();
    }

    function clearCellStyleForCurrentCell(): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const { rowId, colId, activeTab } = state;
      // (2026-06-01 — vue2 port): widened clear list to
      // 16 border fields. Verbatim mirror of vue3.
      const clearedFields: readonly (keyof CellStyleEntry)[] =
        activeTab === 'font'
          ? ['fontWeight', 'fontStyle', 'textDecoration']
          : activeTab === 'border'
            ? [
                'borderColor',
                'borderWidth',
                'borderStyle',
                'borderRadius',
                'borderTopColor',
                'borderTopWidth',
                'borderTopStyle',
                'borderRightColor',
                'borderRightWidth',
                'borderRightStyle',
                'borderBottomColor',
                'borderBottomWidth',
                'borderBottomStyle',
                'borderLeftColor',
                'borderLeftWidth',
                'borderLeftStyle',
              ]
            : activeTab === 'background'
              ? ['backgroundColor']
              : ['color'];
      const ALL_AXIS_FIELDS = [
        'backgroundColor',
        'color',
        'fontWeight',
        'fontStyle',
        'textDecoration',
        'borderColor',
        'borderWidth',
        'borderStyle',
        'borderRadius',
        'borderTopColor',
        'borderTopWidth',
        'borderTopStyle',
        'borderRightColor',
        'borderRightWidth',
        'borderRightStyle',
        'borderBottomColor',
        'borderBottomWidth',
        'borderBottomStyle',
        'borderLeftColor',
        'borderLeftWidth',
        'borderLeftStyle',
      ] as const satisfies readonly (keyof CellStyleEntry)[];
      // (2026-06-01 — vue2 port): read via effective view;
      // gate write behind isUncontrolled. Verbatim mirror of vue3.
      const prevForRow = effectiveCellStyleByRowIdColId.value[rowId];
      const prevForCell = prevForRow?.[colId];
      const isUncontrolled = props.cellStyleByRowIdColId === undefined;
      if (prevForRow != null && prevForCell != null && isUncontrolled) {
        const nextForCell: CellStyleEntry = {};
        for (const f of ALL_AXIS_FIELDS) {
          if (!clearedFields.includes(f) && prevForCell[f] !== undefined) {
            nextForCell[f] = prevForCell[f];
          }
        }
        const cellEntryEmpty = ALL_AXIS_FIELDS.every((f) => nextForCell[f] === undefined);
        const nextForRow: Record<string, CellStyleEntry> = {};
        for (const key in prevForRow) {
          if (key !== colId) nextForRow[key] = prevForRow[key]!;
        }
        if (!cellEntryEmpty) nextForRow[colId] = nextForCell;
        const next: Record<string, Record<string, CellStyleEntry>> = {};
        for (const key in internalCellStyleByRowIdColId.value) {
          if (key !== rowId) next[key] = internalCellStyleByRowIdColId.value[key]!;
        }
        if (Object.keys(nextForRow).length > 0) next[rowId] = nextForRow;
        internalCellStyleByRowIdColId.value = next;
      }
      const stylePayload: Partial<Record<keyof CellStyleEntry, string | null>> = {};
      for (const f of clearedFields) {
        stylePayload[f] = null;
      }
      ctx.emit('cell-style-change', { rowId, colId, style: stylePayload });
      cancelCellStyleEditor();
    }

    function setCellStyleEditorHsv(hsv: Hsv): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const rgb = hsvToRgb(hsv);
      const hex = rgbToHex(rgb);
      cellStyleEditorOpenRef.value = { ...state, hsv, hex };
    }

    function setCellStyleEditorHex(hex: string): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const rgb = hexToRgb(hex);
      if (rgb == null) return;
      const hsv = rgbToHsv(rgb);
      cellStyleEditorOpenRef.value = { ...state, hsv, hex: rgbToHex(rgb) };
    }

    function setCellStyleEditorRgbChannel(channel: 'r' | 'g' | 'b', raw: number): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const clamped = Math.max(0, Math.min(255, Math.round(raw)));
      if (!Number.isFinite(clamped)) return;
      const currentRgb = hsvToRgb(state.hsv);
      const nextRgb: Rgb = { ...currentRgb, [channel]: clamped };
      const hsv = rgbToHsv(nextRgb);
      cellStyleEditorOpenRef.value = { ...state, hsv, hex: rgbToHex(nextRgb) };
    }

    /**
     * assign selection + fire `selection-change` when the
     * new array differs from the current. Array equality is by
     * length + per-id (insertion order matters because consumers may
     * use it to order action panels / breadcrumbs). Verbatim port
     * of vue3 .
     *
     * also clears `selectionAnchorRef` when
     * the new selection is empty — a stale anchor from a previous
     * range survives `clearSelection` otherwise, which would surprise
     * the next shift+click ("why did it extend from a row I deselected
     * 5 actions ago?"). Non-empty transitions DON'T touch the anchor;
     * the click-handler updates the anchor explicitly via
     * `setAnchorIfNotShift` (the right time to write to the anchor is
     * always at the click site, not at the apply-selection layer).
     */
    function applySelection(next: readonly string[]): void {
      const current = selectedRowIds.value;
      if (current.length === next.length && current.every((id, i) => id === next[i])) {
        return;
      }
      selectedRowIds.value = next;
      if (next.length === 0) {
        selectionAnchorRef.value = null;
      }
      ctx.emit('selection-change', { selectedRowIds: next });
    }

    /**
     * anchor write helper. Called from every click-site
     * (body row click + per-row checkbox click) AFTER the selection
     * has been computed. Only writes when the click was NOT a
     * shift+click — the shift+click semantic is exactly "extend from
     * the established anchor, don't move it".
     */
    function setAnchorIfNotShift(rowId: string, shiftActive: boolean): void {
      if (shiftActive) return;
      selectionAnchorRef.value = rowId;
    }

    /**
     * assign `(page, pageSize)` + fire
     * `page-change` when either value transitions. The page input
     * is clamped via `pagePass` in the composable, so consumers
     * who programmatically `setPage(99)` over a 3-page dataset
     * see the next `getPage()` return `2` (the last valid page).
     * Dedup short-circuit guards against no-op transitions —
     * setting the same `(page, pageSize)` twice does NOT re-emit.
     * Verbatim port of vue3 .
     */
    function applyPage(nextPage: number, nextPageSize: number): void {
      const currentPageValue = currentPageRef.value;
      const currentPageSizeValue = currentPageSizeRef.value;
      const pageChanged = nextPage !== currentPageValue;
      const pageSizeChanged = nextPageSize !== currentPageSizeValue;
      if (!pageChanged && !pageSizeChanged) return;
      currentPageRef.value = nextPage;
      currentPageSizeRef.value = nextPageSize;
      ctx.emit('page-change', { page: nextPage, pageSize: nextPageSize });
    }

    /**
     * Decision C.1: when an original filter/sort transition
     * fires, reset the page index to 0 so the user lands on the first
     * page of the freshly narrowed/reordered row set. No-op when
     * pagination is disabled (the page ref is meaningless) OR when
     * already on page 0. The pageSize is preserved.
     */
    function resetPageToFirstIfPaginated(): void {
      if (!props.paginationEnabled) return;
      if (currentPageRef.value === 0) return;
      applyPage(0, currentPageSizeRef.value);
    }

    /**
     * open an edit session on the given
     * (rowId, colId). Gates:
     *
     * - Column must exist + have `editable === true`. Silent no-op
     *   otherwise.
     * - Row must exist. Silent no-op otherwise.
     * - If an edit is already open on a DIFFERENT cell, commit the
     *   previous one first (matches click-elsewhere blur semantic).
     * - If an edit is already open on the SAME cell, no-op (don't
     *   re-emit `cell-edit-start`).
     *
     * `draftValue` initialises to the cell's formatted text — same
     * text the user was reading. Consumers wanting raw value as
     * draft can intercept `cell-edit-start` + call
     * `setEditingCellDraft(rawValue)` immediately. Verbatim port of
     * vue3 .
     */
    function applyEditStart(rowId: string, colId: string): void {
      const column = columnTable.value.getById(colId);
      if (column?.editable !== true) return;
      const row = rowDataSource.value.getById(rowId);
      if (row == null) return;
      const current = editingCellRef.value;
      if (current?.rowId === rowId && current.colId === colId) return;
      if (current != null) {
        applyEditCommit();
      }
      const baseValue = getCellValue({ row, column });
      const draftValue: unknown =
        column.valueFormatter != null
          ? column.valueFormatter({ value: baseValue, row, column })
          : formatCellValue({ row, column });
      editingCellRef.value = { rowId, colId, baseValue, draftValue };
      ctx.emit('cell-edit-start', { row, column, baseValue, draftValue });
    }

    /**
     * commit the in-flight edit. wraps the
     * raw draft in `coerceEditDraftValue` before the emit so typed
     * columns (currently only `type: 'number'`) receive the typed
     * value in `cell-value-change.newValue` instead of the raw
     * string the editor produced.
     *
     * Fires `cell-value-change` iff the COERCED value differs from
     * `baseValue` (dedup matches applySelection
     * no-op-transition rule — uses the coerced value so e.g. a
     * `'10'` draft against a `10` base correctly suppresses).
     *
     * Decision C.1 (vue3 12.1): coerce-rejected commits
     * (e.g. `'abc'` in a number column) abort. The editor STAYS
     * OPEN with the bad draft visible; `cell-edit-stop
     * {committed: false, finalValue: baseValue}` fires so consumers
     * can render rejection feedback. Consumers disambiguate
     * "rejected" vs "cancel" via `getEditingCell()` returning
     * non-null immediately after the emit.
     */
    function applyEditCommit(): void {
      const current = editingCellRef.value;
      if (current == null) return;
      const column = columnTable.value.getById(current.colId);
      const row = rowDataSource.value.getById(current.rowId);
      if (column == null || row == null) {
        editingCellRef.value = null;
        return;
      }
      const coerced = coerceEditDraftValue(column, current.draftValue);
      if (!coerced.ok) {
        ctx.emit('cell-edit-stop', {
          row,
          column,
          committed: false,
          finalValue: current.baseValue,
        });
        return;
      }
      // post-coerce validator gate. Verbatim
      // port of vue3 same locked execution order per
      // Decision E.1 (coerce → validator → outcome), same payload
      // extension via `validationError?` on `cell-edit-stop`.
      const validationError = runCellValidator({ value: coerced.value, row, column });
      if (validationError != null) {
        invalidCellsRef.value = new Map(invalidCellsRef.value).set(
          invalidCellKey(row.id, column.id),
          validationError,
        );
        emitInvalidCellsChange();
        ctx.emit('cell-edit-stop', {
          row,
          column,
          committed: false,
          finalValue: current.baseValue,
          validationError,
        });
        return;
      }
      // (2026-06-01 — vue2 port): async-validator gate.
      // Verbatim mirror of vue3 race-discard via
      // monotonic requestId token, pending state via
      // `pendingAsyncValidationByKey`, editor stays open during
      // pending, `cell-edit-validation-pending` fires on start.
      if (column.validatorAsync != null) {
        const key = invalidCellKey(row.id, column.id);
        const requestId = nextAsyncValidationRequestId++;
        const draftValue = coerced.value;
        pendingAsyncValidationByKey.value = new Map(pendingAsyncValidationByKey.value).set(key, {
          requestId,
          draftValue,
        });
        if (invalidCellsRef.value.has(key)) {
          const nextInvalid = new Map(invalidCellsRef.value);
          nextInvalid.delete(key);
          invalidCellsRef.value = nextInvalid;
          emitInvalidCellsChange();
        }
        ctx.emit('cell-edit-validation-pending', { row, column, draftValue });
        void runAsyncCellValidator({ value: draftValue, row, column }).then((asyncError) => {
          const currentPending = pendingAsyncValidationByKey.value.get(key);
          if (currentPending?.requestId !== requestId) return;
          const nextPending = new Map(pendingAsyncValidationByKey.value);
          nextPending.delete(key);
          pendingAsyncValidationByKey.value = nextPending;
          if (asyncError != null) {
            invalidCellsRef.value = new Map(invalidCellsRef.value).set(key, asyncError);
            emitInvalidCellsChange();
            ctx.emit('cell-edit-stop', {
              row,
              column,
              committed: false,
              finalValue: current.baseValue,
              validationError: asyncError,
            });
            return;
          }
          editingCellRef.value = null;
          if (draftValue !== current.baseValue) {
            ctx.emit('cell-value-change', {
              row,
              column,
              oldValue: current.baseValue,
              newValue: draftValue,
            });
            recordBatchInternal('cell-edit', [
              {
                rowId: row.id,
                colId: column.id,
                oldValue: current.baseValue,
                newValue: draftValue,
              },
            ]);
          }
          // (2026-06-02 — vue2 port): row-level validator
          // pass on the synthesized post-commit row.
          const postCommitRow = synthesizePostCommitRow(row, [
            { colId: column.id, newValue: draftValue },
          ]);
          const invalidCellsChanged = reconcileRowValidationsForRow(postCommitRow);
          if (invalidCellsChanged) emitInvalidCellsChange();
          ctx.emit('cell-edit-stop', { row, column, committed: true, finalValue: draftValue });
        });
        return;
      }
      const finalValue = coerced.value;
      editingCellRef.value = null;
      // clear any prior invalid-cell marker on success.
      const commitKey = invalidCellKey(row.id, column.id);
      let invalidCellsChanged = false;
      if (invalidCellsRef.value.has(commitKey)) {
        const next = new Map(invalidCellsRef.value);
        next.delete(commitKey);
        invalidCellsRef.value = next;
        invalidCellsChanged = true;
      }
      if (finalValue !== current.baseValue) {
        ctx.emit('cell-value-change', {
          row,
          column,
          oldValue: current.baseValue,
          newValue: finalValue,
        });
        // (2026-05-27 — vue2 port of vue3): auto-
        // record into mutation history. No-op when
        // `enableUndoHistory: false`.
        recordBatchInternal('cell-edit', [
          {
            rowId: row.id,
            colId: column.id,
            oldValue: current.baseValue,
            newValue: finalValue,
          },
        ]);
      }
      // (2026-06-02 — vue2 port): row-level validator
      // pass on the synthesized post-commit row.
      const postCommitRow = synthesizePostCommitRow(row, [
        { colId: column.id, newValue: finalValue },
      ]);
      if (reconcileRowValidationsForRow(postCommitRow)) invalidCellsChanged = true;
      if (invalidCellsChanged) emitInvalidCellsChange();
      ctx.emit('cell-edit-stop', { row, column, committed: true, finalValue });
    }

    /**
     * cancel the in-flight edit (revert to baseValue).
     * Fires `cell-edit-stop {committed: false}`. No
     * `cell-value-change` emit.
     */
    function applyEditCancel(): void {
      const current = editingCellRef.value;
      if (current == null) return;
      const column = columnTable.value.getById(current.colId);
      const row = rowDataSource.value.getById(current.rowId);
      editingCellRef.value = null;
      if (column == null || row == null) return;
      // clear pending validator-rejection
      // marker — baseValue was previously valid (verbatim port).
      const cancelKey = invalidCellKey(row.id, column.id);
      let invalidCellsChanged = false;
      if (invalidCellsRef.value.has(cancelKey)) {
        const next = new Map(invalidCellsRef.value);
        next.delete(cancelKey);
        invalidCellsRef.value = next;
        invalidCellsChanged = true;
      }
      // (2026-06-01 — vue2 port): discard any in-flight
      // async validation for this cell. The pending promise's
      // resolve will be a no-op via race-token check.
      if (pendingAsyncValidationByKey.value.has(cancelKey)) {
        const nextPending = new Map(pendingAsyncValidationByKey.value);
        nextPending.delete(cancelKey);
        pendingAsyncValidationByKey.value = nextPending;
      }
      if (invalidCellsChanged) emitInvalidCellsChange();
      ctx.emit('cell-edit-stop', {
        row,
        column,
        committed: false,
        finalValue: current.baseValue,
      });
    }

    /**
     * programmatic draft-value update. No-op when no edit
     * is in progress. Does NOT fire any emit (only commit fires
     * value-change). Used internally by the `<input>` onInput
     * handler.
     */
    function applyEditDraft(value: unknown): void {
      const current = editingCellRef.value;
      if (current == null) return;
      editingCellRef.value = {
        rowId: current.rowId,
        colId: current.colId,
        baseValue: current.baseValue,
        draftValue: value,
      };
    }

    /**
     * open a column-resize session for
     * `colId`. Reads the current resolved width from `widthByColId`
     * as the baseWidth. Silent no-op when the column doesn't exist,
     * is `resizable: false`, or another resize is already in flight
     * for the same column. Fires `column-resize-start`. Verbatim
     * port of vue3 .
     */
    function applyResizeStart(colId: string, startClientX: number, pointerId: number): void {
      const column = columnTable.value.getById(colId);
      if (column == null || column.resizable === false) return;
      if (resizingColumnRef.value?.colId === colId) return;
      const baseWidth = widthByColId.value[colId] ?? 0;
      const next: ColumnResizing = {
        colId,
        baseWidth,
        draftWidth: baseWidth,
        startX: startClientX,
        pointerId,
      };
      resizingColumnRef.value = next;
      ctx.emit('column-resize-start', { column, baseWidth, draftWidth: baseWidth });
    }

    /**
     * update the draftWidth based on the current pointer
     * X position. Computes `rawWidth = baseWidth + (currentClientX -
     * startX)` then clamps via `clampResizeWidth` so per-column
     * min/max bounds are respected. Reassigns `resizingColumnRef`
     * with a fresh object (immutable mutation pattern matching
     * `applyEditDraft`). Fires no emit — draft updates are
     * internal-only; consumers observe via `getResizingColumn()`
     * or by inspecting the rendered cell width.
     */
    function applyResizeDraft(currentClientX: number): void {
      const current = resizingColumnRef.value;
      if (current == null) return;
      const column = columnTable.value.getById(current.colId);
      if (column == null) return;
      const raw = current.baseWidth + (currentClientX - current.startX);
      const clamped = clampResizeWidth(raw, column, mergedTheme.value.defaultMinColumnWidth);
      if (clamped === current.draftWidth) return; // dedup no-op moves
      resizingColumnRef.value = {
        colId: current.colId,
        baseWidth: current.baseWidth,
        draftWidth: clamped,
        startX: current.startX,
        pointerId: current.pointerId,
      };
    }

    /**
     * commit the in-flight resize. Fires
     * `column-width-change` iff `draftWidth !== baseWidth` (no-op
     * dedup matches `cell-value-change` rule); always
     * fires `column-resize-stop {committed: true}`. Clears the
     * resize state.
     */
    function applyResizeCommit(): void {
      const current = resizingColumnRef.value;
      if (current == null) return;
      const column = columnTable.value.getById(current.colId);
      const finalWidth = current.draftWidth;
      const baseWidth = current.baseWidth;
      resizingColumnRef.value = null;
      if (column == null) return;
      if (finalWidth !== baseWidth) {
        ctx.emit('column-width-change', { column, oldWidth: baseWidth, newWidth: finalWidth });
      }
      ctx.emit('column-resize-stop', { column, committed: true, finalWidth });
    }

    /**
     * cancel the in-flight resize (revert to baseWidth).
     * Fires `column-resize-stop {committed: false}` only. No
     * `column-width-change` emit.
     */
    function applyResizeCancel(): void {
      const current = resizingColumnRef.value;
      if (current == null) return;
      const column = columnTable.value.getById(current.colId);
      const baseWidth = current.baseWidth;
      resizingColumnRef.value = null;
      if (column == null) return;
      ctx.emit('column-resize-stop', { column, committed: false, finalWidth: baseWidth });
    }

    // ─────────────────────── column autosize ───────────────────────
    // Verbatim port of vue3 lazy-init hidden Canvas + Canvas.measureText
    // for text width measurement; pure `computeAutosizeWidth` clamp. Reuses
    // `column-width-change` emit as the persistence channel (Decision A.1 inherits).

    // Lazy-init so tables that never autosize (and SSR / happy-dom without Canvas)
    // don't pay the construction cost up front. The canvas is intentionally NOT
    // attached to the DOM — Canvas's 2D context works without a DOM mount and we
    // avoid layout pollution.
    const autosizeCanvasRef = ref<HTMLCanvasElement | null>(null);

    function getAutosizeContext(): CanvasRenderingContext2D | null {
      if (typeof document === 'undefined') return null;
      autosizeCanvasRef.value ??= document.createElement('canvas');
      // happy-dom doesn't implement Canvas 2D; getContext returns null.
      // Real browsers always return a non-null context for '2d'.
      return autosizeCanvasRef.value.getContext('2d');
    }

    /**
     * measure a single text string's pixel width with the
     * supplied CSS font shorthand. Returns 0 when no Canvas 2D context
     * is available (e.g. happy-dom test env) — caller (applyAutosize)
     * treats 0-width measurements as "no signal" and falls back to
     * header-only sizing or to the minWidth clamp.
     */
    function measureCellTextWidth(text: string, font: string): number {
      const ctx2d = getAutosizeContext();
      if (ctx2d == null) return 0;
      ctx2d.font = font;
      return ctx2d.measureText(text).width;
    }

    /**
     * autosize impl. Reads the current pagedRows + column
     * spec, measures every body cell + header, runs
     * `computeAutosizeWidth` for the clamp, and fires
     * `column-width-change` (reusing emit). No new emit
     * per Decision A.1 — autosize is just another path producing a
     * width change.
     */
    function applyAutosize(colId: string): void {
      const column = columnTable.value.getById(colId);
      if (column == null) return;
      // cannot mutate a non-resizable column's width;
      // explicit autosizeable:false opts out without affecting resize.
      if (column.resizable === false) return;
      if (column.autosizeable === false) return;
      const headerEl =
        typeof window !== 'undefined' && wrapperRef.value != null
          ? wrapperRef.value.querySelector<HTMLElement>(
              `.cx-table-header-cell[data-col-id="${window.CSS?.escape?.(colId) ?? colId}"]`,
            )
          : null;
      const font = headerEl != null ? window.getComputedStyle(headerEl).font : '';
      const headerLabel = column.headerName ?? column.field ?? column.id;
      const headerWidth = measureCellTextWidth(headerLabel, font);
      const widths: number[] = [];
      for (const row of pagedRows.value) {
        const value = getCellValue({ row, column });
        const text =
          column.valueFormatter != null
            ? column.valueFormatter({ value, row, column })
            : formatCellValue({ row, column });
        widths.push(measureCellTextWidth(text, font));
      }
      const baseWidth = widthByColId.value[colId] ?? 0;
      const paddingX = mergedTheme.value.cellPaddingX * 2;
      const newWidth = computeAutosizeWidth(widths, {
        paddingX,
        minWidth: column.minWidth ?? mergedTheme.value.defaultMinColumnWidth,
        ...(column.maxWidth != null ? { maxWidth: column.maxWidth } : {}),
        headerWidth,
      });
      if (newWidth === baseWidth) return; // no-op dedup matches
      ctx.emit('column-width-change', { column, oldWidth: baseWidth, newWidth });
    }

    function applyAutosizeAll(): void {
      for (const cell of headerCells.value) {
        applyAutosize(cell.colId);
      }
    }

    // ─────────────────────── (2026-05-26 — vue2 port of vue3): cell range selection ───────────────────────
    // 2-point {anchor, focus} state shape (Decision B.1) + pure
    // `computeCellRangeEnvelope` derivation. Drag-extend via pointer-
    // capture + document.elementFromPoint resolution (Decision C.1).
    // Opt-in via `cellRangeSelection: 'enabled'` prop (Decision A.1).
    // Verbatim port of vue3 with `ctx.emit` instead of `emit`.

    const cellRangeRef = ref<CellRange | null>(null);
    const cellRangeDraggingRef = ref<boolean>(false);
    const cellRangePointerIdRef = ref<number | null>(null);

    const cellRangeEnvelope = computed<CellRangeEnvelope>(() => {
      const range = cellRangeRef.value;
      if (range == null) return EMPTY_CELL_RANGE_ENVELOPE;
      const rowIds = pagedRows.value.map((r) => r.id);
      const colIds = visibleColumns.value.map((c) => c.id);
      return computeCellRangeEnvelope(range, rowIds, colIds);
    });
    const cellRangeRowSet = computed<ReadonlySet<string>>(
      () => new Set(cellRangeEnvelope.value.rowIds),
    );
    const cellRangeColSet = computed<ReadonlySet<string>>(
      () => new Set(cellRangeEnvelope.value.colIds),
    );

    function applyCellRangeStart(anchor: CellRef, jsEvent: PointerEvent | null): void {
      const next: CellRange = { anchor, focus: anchor };
      cellRangeRef.value = next;
      ctx.emit('cell-range-start', { range: next, jsEvent });
    }

    function applyCellRangeDraft(focus: CellRef, jsEvent: PointerEvent | MouseEvent | null): void {
      const current = cellRangeRef.value;
      if (current == null) return;
      if (current.focus.rowId === focus.rowId && current.focus.colId === focus.colId) {
        return;
      }
      const next: CellRange = { anchor: current.anchor, focus };
      cellRangeRef.value = next;
      const rowIds = pagedRows.value.map((r) => r.id);
      const colIds = visibleColumns.value.map((c) => c.id);
      const envelope = computeCellRangeEnvelope(next, rowIds, colIds);
      ctx.emit('cell-range-change', { range: next, envelope, jsEvent });
    }

    function applyCellRangeStop(jsEvent: PointerEvent | MouseEvent | null): void {
      const current = cellRangeRef.value;
      if (current == null) return;
      ctx.emit('cell-range-stop', {
        range: current,
        envelope: cellRangeEnvelope.value,
        jsEvent,
      });
    }

    function applyCellRangeClear(): void {
      const current = cellRangeRef.value;
      if (current == null) return;
      const envelope = cellRangeEnvelope.value;
      cellRangeRef.value = null;
      ctx.emit('cell-range-stop', { range: current, envelope, jsEvent: null });
    }

    function onCellPointerdown(rowId: string, colId: string, e: PointerEvent): void {
      if (props.cellRangeSelection !== 'enabled') return;
      if (e.button !== 0) return;
      if (rowId === '__cx_select_all__') return;
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      if (typeof target.setPointerCapture === 'function') {
        try {
          target.setPointerCapture(e.pointerId);
        } catch {
          // happy-dom / real Chromium synthesized events can throw
          // InvalidPointerId. Fall through — elementFromPoint
          // resolution still works.
        }
      }
      cellRangeDraggingRef.value = true;
      cellRangePointerIdRef.value = e.pointerId;
      applyCellRangeStart({ rowId, colId }, e);
    }

    function onCellPointermove(e: PointerEvent): void {
      if (!cellRangeDraggingRef.value) return;
      if (cellRangePointerIdRef.value !== e.pointerId) return;
      if (typeof document === 'undefined') return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el == null) return;
      const rowId = closestAttr(el, 'data-row-id');
      if (rowId == null || rowId === '__cx_select_all__') return;
      const colId = closestAttr(el, 'data-col-id');
      if (colId == null) return;
      applyCellRangeDraft({ rowId, colId }, e);
    }

    function onCellPointerup(e: PointerEvent): void {
      if (!cellRangeDraggingRef.value) return;
      if (cellRangePointerIdRef.value !== e.pointerId) return;
      cellRangeDraggingRef.value = false;
      cellRangePointerIdRef.value = null;
      applyCellRangeStop(e);
    }

    function onCellPointercancel(e: PointerEvent): void {
      if (!cellRangeDraggingRef.value) return;
      if (cellRangePointerIdRef.value !== e.pointerId) return;
      cellRangeDraggingRef.value = false;
      cellRangePointerIdRef.value = null;
      applyCellRangeStop(e);
    }

    function onCellShiftClick(rowId: string, colId: string, e: MouseEvent): void {
      if (props.cellRangeSelection !== 'enabled') return;
      if (!e.shiftKey) return;
      if (cellRangeRef.value == null) return;
      e.stopPropagation();
      applyCellRangeDraft({ rowId, colId }, e);
      applyCellRangeStop(e);
    }

    /**
     * (2026-05-27 — vue2 port of vue3): shared
     * TSV-synthesis + writeText + emit path. Both the Ctrl+C keydown
     * handler and the programmatic `copyCellRangeToClipboard()` handle
     * method route through here so the same fail-soft + emit shape
     * applies to both gestures.
     */
    async function performCellRangeCopy(jsEvent: KeyboardEvent | null): Promise<string | null> {
      if (props.cellRangeSelection !== 'enabled') return null;
      if (cellRangeRef.value == null) return null;
      const envelope = cellRangeEnvelope.value;
      if (envelope.rowIds.length === 0 || envelope.colIds.length === 0) return null;
      const text = formatCellRangeForClipboard(envelope, props.rows, props.columns);
      if (
        typeof navigator !== 'undefined' &&
        typeof navigator.clipboard?.writeText === 'function'
      ) {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          // happy-dom + non-secure HTTP contexts + clipboard policy
          // can all throw. Fall through so the emit still fires.
        }
      }
      ctx.emit('cell-range-copy', { envelope, text, jsEvent });
      return text;
    }

    /**
     * (2026-05-27 — vue2 port of vue3): shared
     * TSV-readText + parse + map + emit path for clipboard paste.
     * Both the Ctrl+V keydown handler and the programmatic
     * `pasteCellRangeFromClipboard()` handle method route through
     * here so the same fail-soft + emit shape applies.
     */
    async function performCellRangePaste(
      jsEvent: KeyboardEvent | null,
    ): Promise<readonly PasteMutation[] | null> {
      if (props.cellRangeSelection !== 'enabled') return null;
      if (cellRangeRef.value == null) return null;
      const envelope = cellRangeEnvelope.value;
      if (envelope.rowIds.length === 0 || envelope.colIds.length === 0) return null;
      if (typeof navigator === 'undefined' || typeof navigator.clipboard?.readText !== 'function') {
        return null;
      }
      let text: string;
      try {
        text = await navigator.clipboard.readText();
      } catch {
        // happy-dom + non-secure HTTP contexts + missing
        // 'clipboard-read' permission can all throw. Return null;
        // emit handler doesn't fire (no payload to produce).
        return null;
      }
      const parsed = parseClipboardTsv(text);
      const mutations = computePasteMutations(
        envelope,
        parsed,
        props.rows,
        props.columns,
        resolvePasteValidatorGate(),
      );
      ctx.emit('cell-range-paste', { envelope, mutations, text, jsEvent });
      // auto-record into mutation history.
      recordBatchInternal('cell-range-paste', mutations);
      runPostBatchRowValidations(mutations);
      return mutations;
    }

    /**
     * (2026-06-02 — vue2 port): after a paste/drag-fill
     * mutation batch lands, run `rowValidators` against each
     * affected row's post-commit state. Verbatim mirror of vue3.
     */
    function runPostBatchRowValidations(mutations: readonly PasteMutation[]): void {
      if ((props.rowValidators?.length ?? 0) === 0) return;
      const mutationsByRowId = new Map<string, { colId: string; newValue: unknown }[]>();
      for (const m of mutations) {
        let list = mutationsByRowId.get(m.rowId);
        if (list == null) {
          list = [];
          mutationsByRowId.set(m.rowId, list);
        }
        list.push({ colId: m.colId, newValue: m.newValue });
      }
      let invalidCellsChanged = false;
      for (const [rowId, rowMutations] of mutationsByRowId) {
        const row = rowDataSource.value.getById(rowId);
        if (row == null) continue;
        const postCommitRow = synthesizePostCommitRow(row, rowMutations);
        if (reconcileRowValidationsForRow(postCommitRow)) invalidCellsChanged = true;
      }
      if (invalidCellsChanged) emitInvalidCellsChange();
    }

    // (2026-05-27 — vue2 port of vue3): drag-fill
    // state. Verbatim port of vue3's 4-ref + 1-computed shape.
    const dragFillSourceRef = ref<CellRangeEnvelope | null>(null);
    const dragFillEnvelopeRef = ref<CellRangeEnvelope | null>(null);
    const dragFillPointerIdRef = ref<number | null>(null);
    const dragFillDraggingRef = ref<boolean>(false);

    const dragFillPreviewSet = computed<ReadonlySet<string>>(() => {
      const source = dragFillSourceRef.value;
      const fill = dragFillEnvelopeRef.value;
      if (source == null || fill == null) return EMPTY_PREVIEW_SET;
      const sourceRowSet = new Set(source.rowIds);
      const sourceColSet = new Set(source.colIds);
      const out = new Set<string>();
      for (const rowId of fill.rowIds) {
        for (const colId of fill.colIds) {
          if (sourceRowSet.has(rowId) && sourceColSet.has(colId)) continue;
          out.add(`${rowId}/${colId}`);
        }
      }
      return out;
    });

    /**
     * pointerdown handler attached to the drag-fill handle
     * overlay. Verbatim port of vue3's `onDragFillPointerdown` —
     * captures source envelope + sets dragging refs + try/catch
     * setPointerCapture + emit `cell-range-fill-start`. Stops
     * propagation so the cell-range pointerdown beneath doesn't fire.
     */
    function onDragFillPointerdown(e: PointerEvent): void {
      if (props.cellRangeSelection !== 'enabled') return;
      if (e.button !== 0) return;
      const source = cellRangeEnvelope.value;
      if (source.rowIds.length === 0 || source.colIds.length === 0) return;
      e.stopPropagation();
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      if (typeof target.setPointerCapture === 'function') {
        try {
          target.setPointerCapture(e.pointerId);
        } catch {
          // happy-dom / synthesized events can throw InvalidPointerId.
          // Fall through — pointermove still resolves via elementFromPoint.
        }
      }
      dragFillSourceRef.value = source;
      dragFillEnvelopeRef.value = source;
      dragFillPointerIdRef.value = e.pointerId;
      dragFillDraggingRef.value = true;
      ctx.emit('cell-range-fill-start', { source, jsEvent: e });
    }

    /**
     * pointermove handler. Verbatim port of vue3's
     * `onDragFillPointermove` — resolves cell under pointer +
     * computeDragFillEnvelope + emit change with no-op dedup via
     * `sameEnvelope`.
     */
    function onDragFillPointermove(e: PointerEvent): void {
      if (!dragFillDraggingRef.value) return;
      if (dragFillPointerIdRef.value !== e.pointerId) return;
      if (typeof document === 'undefined') return;
      const source = dragFillSourceRef.value;
      if (source == null) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el == null) return;
      const rowId = closestAttr(el, 'data-row-id');
      if (rowId == null || rowId === '__cx_select_all__') return;
      const colId = closestAttr(el, 'data-col-id');
      if (colId == null) return;
      const displayedRowIds = pagedRows.value.map((r) => r.id);
      const displayedColIds = visibleColumns.value.map((c) => c.id);
      const next = computeDragFillEnvelope(
        source,
        { rowId, colId },
        displayedRowIds,
        displayedColIds,
      );
      const prev = dragFillEnvelopeRef.value;
      if (prev != null && sameEnvelope(prev, next)) return;
      dragFillEnvelopeRef.value = next;
      ctx.emit('cell-range-fill-change', { source, fill: next, jsEvent: e });
    }

    /**
     * pointerup handler. Verbatim port of vue3's
     * `onDragFillPointerup` — computes mutations + emits + auto-extends
     * the active cell-range to cover the fill envelope.
     */
    function onDragFillPointerup(e: PointerEvent): void {
      if (!dragFillDraggingRef.value) return;
      if (dragFillPointerIdRef.value !== e.pointerId) return;
      const source = dragFillSourceRef.value;
      const fill = dragFillEnvelopeRef.value;
      dragFillDraggingRef.value = false;
      dragFillPointerIdRef.value = null;
      dragFillSourceRef.value = null;
      dragFillEnvelopeRef.value = null;
      if (source == null || fill == null) return;
      const mutations = computeDragFillMutations(
        source,
        fill,
        props.rows,
        props.columns,
        resolvePasteValidatorGate(),
      );
      if (!sameEnvelope(source, fill)) {
        const fillAnchor: CellRef = {
          rowId: fill.rowIds[0]!,
          colId: fill.colIds[0]!,
        };
        const fillFocus: CellRef = {
          rowId: fill.rowIds[fill.rowIds.length - 1]!,
          colId: fill.colIds[fill.colIds.length - 1]!,
        };
        applyCellRangeStart(fillAnchor, null);
        applyCellRangeDraft(fillFocus, null);
      }
      ctx.emit('cell-range-fill', { source, fill, mutations, jsEvent: e });
      // auto-record into mutation history.
      recordBatchInternal('cell-range-fill', mutations);
      runPostBatchRowValidations(mutations);
    }

    /**
     * pointercancel handler. Verbatim port — drops the
     * gesture without an emit.
     */
    function onDragFillPointercancel(e: PointerEvent): void {
      if (!dragFillDraggingRef.value) return;
      if (dragFillPointerIdRef.value !== e.pointerId) return;
      dragFillDraggingRef.value = false;
      dragFillPointerIdRef.value = null;
      dragFillSourceRef.value = null;
      dragFillEnvelopeRef.value = null;
    }

    /**
     * programmatic drag-fill commit (TableHandle method).
     * Verbatim port of vue3's `performFillCellRange`.
     */
    function performFillCellRange(targetCell: CellRef): readonly PasteMutation[] | null {
      if (props.cellRangeSelection !== 'enabled') return null;
      const source = cellRangeEnvelope.value;
      if (source.rowIds.length === 0 || source.colIds.length === 0) return null;
      const displayedRowIds = pagedRows.value.map((r) => r.id);
      const displayedColIds = visibleColumns.value.map((c) => c.id);
      const fill = computeDragFillEnvelope(source, targetCell, displayedRowIds, displayedColIds);
      if (sameEnvelope(source, fill)) {
        return null;
      }
      const mutations = computeDragFillMutations(
        source,
        fill,
        props.rows,
        props.columns,
        resolvePasteValidatorGate(),
      );
      const fillAnchor: CellRef = {
        rowId: fill.rowIds[0]!,
        colId: fill.colIds[0]!,
      };
      const fillFocus: CellRef = {
        rowId: fill.rowIds[fill.rowIds.length - 1]!,
        colId: fill.colIds[fill.colIds.length - 1]!,
      };
      applyCellRangeStart(fillAnchor, null);
      applyCellRangeDraft(fillFocus, null);
      ctx.emit('cell-range-fill', { source, fill, mutations, jsEvent: null });
      // auto-record into mutation history.
      recordBatchInternal('cell-range-fill', mutations);
      runPostBatchRowValidations(mutations);
      return mutations;
    }

    // (2026-05-27 — vue2 port of vue3): undo / redo
    // mutation history state. Opt-in via `enableUndoHistory: true`
    // prop; when disabled, recording is fully skipped + Ctrl+Z/Y body-
    // keydown branches fall through (so existing consumers see no
    // behavior change). Verbatim port of vue3's state shape.
    const mutationHistoryRef = ref<MutationHistoryState>(EMPTY_MUTATION_HISTORY);
    const nextMutationBatchIdRef = ref<number>(0);

    /**
     * monotonic batch-id factory. Verbatim port of vue3's
     * helper.
     */
    function nextMutationBatchId(): string {
      const next = nextMutationBatchIdRef.value + 1;
      nextMutationBatchIdRef.value = next;
      return `mb-${next}`;
    }

    /**
     * shared append-and-emit-change helper. Verbatim port
     * of vue3's `recordBatchInternal` — gates on
     * `props.enableUndoHistory`, constructs a MutationBatch, calls
     * `appendMutationBatch` over the bounded `undoHistoryMaxDepth`,
     * and fires `history-change`.
     */
    function recordBatchInternal(
      source: MutationBatch['source'],
      mutations: readonly PasteMutation[],
    ): void {
      if (!props.enableUndoHistory) return;
      const batch: MutationBatch = {
        id: nextMutationBatchId(),
        source,
        mutations,
        recordedAt: Date.now(),
      };
      mutationHistoryRef.value = appendMutationBatch(
        mutationHistoryRef.value,
        batch,
        props.undoHistoryMaxDepth,
      );
      ctx.emit('history-change', { history: mutationHistoryRef.value });
    }

    /**
     * undo — pop newest `past` entry, fire `history-replay`
     * with the REVERSED batch, move original to `future`. Verbatim
     * port of vue3.
     */
    function performUndo(jsEvent: KeyboardEvent | null): boolean {
      if (!props.enableUndoHistory) return false;
      const popped = popUndoBatch(mutationHistoryRef.value);
      if (popped == null) return false;
      mutationHistoryRef.value = popped.state;
      const reversed = reverseMutationBatch(popped.batch);
      ctx.emit('history-replay', { direction: 'undo', batch: reversed, jsEvent });
      ctx.emit('history-change', { history: mutationHistoryRef.value });
      return true;
    }

    /**
     * redo — pop newest `future` entry, fire
     * `history-replay` with ORIGINAL batch, move back to `past`.
     */
    function performRedo(jsEvent: KeyboardEvent | null): boolean {
      if (!props.enableUndoHistory) return false;
      const popped = popRedoBatch(mutationHistoryRef.value);
      if (popped == null) return false;
      mutationHistoryRef.value = popped.state;
      ctx.emit('history-replay', { direction: 'redo', batch: popped.batch, jsEvent });
      ctx.emit('history-change', { history: mutationHistoryRef.value });
      return true;
    }

    /**
     * body keydown handler. Gated on
     * `cellRangeSelection === 'enabled'` + Ctrl+C / Cmd+C. Calls
     * `e.preventDefault()` only when the gate passes so other
     * keystrokes propagate normally.
     *
     * extended to also detect Ctrl+V / Cmd+V
     * for the paste gesture. Same gate; same `e.preventDefault()`
     * discipline; single shared dispatch.
     *
     * (2026-05-27 — vue2 port of vue3): extended to
     * also detect Ctrl+Z / Cmd+Z (undo) + Ctrl+Y / Ctrl+Shift+Z /
     * Cmd+Shift+Z (redo). The undo / redo branches gate on
     * `enableUndoHistory` (independent of `cellRangeSelection`) so
     * consumers can use the history without enabling cell-range
     * selection.
     */
    function onBodyKeydown(e: KeyboardEvent): void {
      const modifier = e.ctrlKey || e.metaKey;
      // (2026-05-28 — vue2 port of vue3): cell-level
      // keyboard navigation. Gated on `enableKeyboardNavigation` +
      // editor NOT active. Handles non-modifier nav keys + Ctrl+Home /
      // Ctrl+End. Existing modifier-prefixed Ctrl+C / Ctrl+V / Ctrl+Z
      // / Ctrl+Y branches stay reachable through the fall-through
      // below.
      if (props.enableKeyboardNavigation && editingCellRef.value == null) {
        const navKey = e.key;
        // (vue2 port, 2026-05-28): tree-data expand/collapse
        // shortcuts. Decision N.1 — Enter / Space toggle, ArrowRight
        // expands, ArrowLeft collapses or jumps to parent. Slotted
        // BEFORE nav-direction resolution so tree gestures
        // take precedence over edit-start + arrow-nav for parent rows.
        const treeKeyboardHandled = maybeHandleTreeKeyboard(navKey, e, modifier);
        if (treeKeyboardHandled) return;
        let navDirection: NavigationDirection | null = null;
        if (navKey === 'ArrowLeft') navDirection = 'left';
        else if (navKey === 'ArrowRight') navDirection = 'right';
        else if (navKey === 'ArrowUp') navDirection = 'up';
        else if (navKey === 'ArrowDown') navDirection = 'down';
        else if (navKey === 'Home') navDirection = modifier ? 'table-start' : 'home';
        else if (navKey === 'End') navDirection = modifier ? 'table-end' : 'end';
        else if (navKey === 'PageUp') navDirection = 'page-up';
        else if (navKey === 'PageDown') navDirection = 'page-down';
        if (navDirection != null) {
          const displayedRowIds = pagedRows.value.map((r) => r.id);
          const rowHeight = mergedTheme.value.rowHeight;
          const pageRowCount = Math.max(
            1,
            Math.floor((bodyClientHeight.value || 0) / rowHeight) || 1,
          );
          const current = activeCellRef.value;
          // (2026-05-28 — vue2 port of vue3):
          // Ctrl+Arrow short-circuits to a data-region boundary jump.
          const isArrowKey =
            navKey === 'ArrowLeft' ||
            navKey === 'ArrowRight' ||
            navKey === 'ArrowUp' ||
            navKey === 'ArrowDown';
          const isCtrlArrow = modifier && isArrowKey;
          let next: CellRef | null;
          if (isCtrlArrow && current != null) {
            const cellValueFn: CellValueFn = (rowId, colId) => {
              const row = rowDataSource.value.getById(rowId);
              if (row == null) return undefined;
              const col = columnTable.value.getById(colId);
              if (col == null) return undefined;
              return getCellValue({ row, column: col });
            };
            next = findDataRegionBoundary(
              current.rowId,
              current.colId,
              navDirection as DataRegionDirection,
              displayedRowIds,
              visibleColumns.value,
              cellValueFn,
            );
          } else {
            next = computeNextActiveCell(
              current?.rowId ?? null,
              current?.colId ?? null,
              displayedRowIds,
              visibleColumns.value,
              navDirection,
              pageRowCount,
            );
          }
          if (next != null) {
            e.preventDefault();
            // (2026-05-28 — vue2 port of vue3):
            // shift+arrow extends cell-range; plain arrow with active
            // range collapses it (Decision A.1 + B.1).
            if (e.shiftKey && props.cellRangeSelection === 'enabled') {
              const derived = deriveShiftArrowCellRange(
                cellRangeRef.value,
                activeCellRef.value,
                next,
              );
              if (cellRangeRef.value == null) {
                applyCellRangeStart(derived.anchor, null);
              }
              applyCellRangeDraft(derived.focus, null);
            } else if (cellRangeRef.value != null) {
              applyCellRangeClear();
            }
            applyActiveCellChange(next, e, { autoScroll: true, announce: true });
          }
          return;
        }
        if (navKey === 'Enter' || navKey === 'F2') {
          const active = activeCellRef.value;
          if (active != null) {
            const col = columnTable.value.getById(active.colId);
            if (col?.editable === true) {
              e.preventDefault();
              applyEditStart(active.rowId, active.colId);
              return;
            }
          }
        }
        // (Decision C.1): Escape clears BOTH activeCell + cellRange.
        if (navKey === 'Escape' && (activeCellRef.value != null || cellRangeRef.value != null)) {
          if (cellRangeRef.value != null) applyCellRangeClear();
          if (activeCellRef.value != null) applyActiveCellChange(null, e);
          return;
        }
      }
      if (!modifier) return;
      const key = e.key.toLowerCase();
      // undo / redo dispatch (independent of cellRangeSelection).
      if (props.enableUndoHistory) {
        const isUndo = key === 'z' && !e.shiftKey;
        const isRedo = (key === 'z' && e.shiftKey) || key === 'y';
        if (isUndo && mutationHistoryRef.value.past.length > 0) {
          e.preventDefault();
          performUndo(e);
          return;
        }
        if (isRedo && mutationHistoryRef.value.future.length > 0) {
          e.preventDefault();
          performRedo(e);
          return;
        }
      }
      // cell-range clipboard dispatch.
      if (props.cellRangeSelection !== 'enabled') return;
      const isCopyKey = key === 'c';
      const isPasteKey = key === 'v';
      if (!isCopyKey && !isPasteKey) return;
      if (cellRangeRef.value == null) return;
      const envelope = cellRangeEnvelope.value;
      if (envelope.rowIds.length === 0 || envelope.colIds.length === 0) return;
      e.preventDefault();
      if (isCopyKey) {
        void performCellRangeCopy(e);
      } else {
        void performCellRangePaste(e);
      }
    }

    /**
     * live `getBoundingClientRect()` snapshot for
     * every visible header cell in clientX coords. Returns empty Map when
     * wrapper isn't mounted. Verbatim port of vue3 helper.
     */
    function getHeaderCellRectsLive(): ReadonlyMap<string, ColumnHeaderRect> {
      const rects = new Map<string, ColumnHeaderRect>();
      const wrapper = wrapperRef.value;
      if (wrapper == null) return rects;
      const cells = wrapper.querySelectorAll<HTMLElement>('.cx-table-header-cell[data-col-id]');
      cells.forEach((el) => {
        const colId = el.getAttribute('data-col-id');
        if (colId == null) return;
        const rect = el.getBoundingClientRect();
        rects.set(colId, { left: rect.left, right: rect.right });
      });
      return rects;
    }

    /**
     * convert a clientX drop target into a wrapper-relative px
     * for the drop-line render. Verbatim port of vue3 .
     */
    function resolveDropLineLeftPx(
      dropTarget: ColumnDropTarget,
      rects: ReadonlyMap<string, ColumnHeaderRect>,
    ): number | null {
      const wrapper = wrapperRef.value;
      if (wrapper == null) return null;
      const targetRect = rects.get(dropTarget.targetColId);
      if (targetRect == null) return null;
      const wrapperLeft = wrapper.getBoundingClientRect().left;
      const boundaryClientX = dropTarget.position === 'before' ? targetRect.left : targetRect.right;
      return boundaryClientX - wrapperLeft - 1;
    }

    /**
     * promote a pending column-move to active. Fires
     * `column-move-start`. Silent no-op when column missing or
     * `reorderable: false` or another move in flight.
     */
    function applyMoveStart(colId: string, startClientX: number, pointerId: number): void {
      const column = columnTable.value.getById(colId);
      if (column == null || column.reorderable === false) return;
      if (movingColumnRef.value?.colId === colId) return;
      movingColumnRef.value = {
        colId,
        startClientX,
        dropTarget: null,
        dropLineLeftPx: null,
        pointerId,
      };
      ctx.emit('column-move-start', { column, startClientX });
    }

    /**
     * recompute drop target on every pointermove. Dedup skips
     * re-assign when target + line position unchanged.
     */
    function applyMoveDraft(currentClientX: number): void {
      const current = movingColumnRef.value;
      if (current == null) return;
      const rects = getHeaderCellRectsLive();
      // (2026-05-27 — vue2 port vue3 baseline):
      // pinned-zone guard. See vue3 adapter comment for the rationale
      // (same closure: cross-zone candidates skipped → null →
      // no drop indicator + no column-order-change emit).
      const pinnedZoneByColId = new Map<string, 'left' | 'right' | null>();
      for (const c of visibleColumns.value) {
        pinnedZoneByColId.set(c.id, c.pinned ?? null);
      }
      const nextTarget = getColumnDropTarget(currentClientX, rects, current.colId, {
        pinnedZoneByColId,
      });
      const nextLeftPx = nextTarget != null ? resolveDropLineLeftPx(nextTarget, rects) : null;
      const sameTarget =
        (current.dropTarget?.targetColId ?? null) === (nextTarget?.targetColId ?? null) &&
        (current.dropTarget?.position ?? null) === (nextTarget?.position ?? null) &&
        current.dropLineLeftPx === nextLeftPx;
      if (sameTarget) return;
      movingColumnRef.value = {
        colId: current.colId,
        startClientX: current.startClientX,
        dropTarget: nextTarget,
        dropLineLeftPx: nextLeftPx,
        pointerId: current.pointerId,
      };
    }

    /**
     * commit the in-flight move. Fires `column-order-change`
     * iff a meaningful reorder (target !== moved AND computeColumnReorder
     * output differs from current columns prop — no-op dedup matches
     *). Always fires `column-move-stop {committed: true}`.
     */
    function applyMoveCommit(): void {
      const current = movingColumnRef.value;
      if (current == null) return;
      const movedColumn = columnTable.value.getById(current.colId);
      const dropTarget = current.dropTarget;
      movingColumnRef.value = null;
      if (movedColumn == null) return;
      if (dropTarget != null && dropTarget.targetColId !== current.colId) {
        const targetColumn = columnTable.value.getById(dropTarget.targetColId);
        if (targetColumn != null) {
          const next = computeColumnReorder(
            props.columns,
            current.colId,
            dropTarget.targetColId,
            dropTarget.position,
          );
          if (next !== props.columns) {
            const oldColumnIds = props.columns.map((c) => c.id);
            const newColumnIds = next.map((c) => c.id);
            ctx.emit('column-order-change', {
              movedColumn,
              targetColumn,
              position: dropTarget.position,
              oldColumnIds,
              newColumnIds,
            });
          }
        }
      }
      ctx.emit('column-move-stop', { column: movedColumn, committed: true, dropTarget });
    }

    /**
     * cancel the in-flight move. Fires `column-move-stop
     * {committed: false, dropTarget: null}` only.
     */
    function applyMoveCancel(): void {
      const current = movingColumnRef.value;
      if (current == null) return;
      const movedColumn = columnTable.value.getById(current.colId);
      movingColumnRef.value = null;
      if (movedColumn == null) return;
      ctx.emit('column-move-stop', { column: movedColumn, committed: false, dropTarget: null });
    }

    /**
     * (2026-05-29 — vue2 port). Verbatim port of vue3
     * row-drag apply* family. See vue3 file for design rationale.
     */
    function findRowById(rowId: string): RowSpec | null {
      for (const r of props.rows) {
        if (r.id === rowId) return r;
      }
      return null;
    }

    function getBodyRowRectsLive(): ReadonlyMap<string, RowRect> {
      const rects = new Map<string, RowRect>();
      const wrapper = wrapperRef.value;
      if (wrapper == null) return rects;
      const cells = wrapper.querySelectorAll<HTMLElement>('.cx-table-row[data-row-id]');
      cells.forEach((el) => {
        const rowId = el.getAttribute('data-row-id');
        if (rowId == null) return;
        const rect = el.getBoundingClientRect();
        rects.set(rowId, { top: rect.top, bottom: rect.bottom });
      });
      return rects;
    }

    function resolveRowDropLineTopPx(
      dropTarget: RowDropTarget,
      rects: ReadonlyMap<string, RowRect>,
    ): number | null {
      const wrapper = wrapperRef.value;
      if (wrapper == null) return null;
      const targetRect = rects.get(dropTarget.targetRowId);
      if (targetRect == null) return null;
      const wrapperTop = wrapper.getBoundingClientRect().top;
      const boundaryClientY = dropTarget.position === 'above' ? targetRect.top : targetRect.bottom;
      return boundaryClientY - wrapperTop - 1;
    }

    function getPinnedRowIdsSet(): ReadonlySet<string> {
      const set = new Set<string>();
      for (const r of topPinnedRows.value) set.add(r.id);
      for (const r of bottomPinnedRows.value) set.add(r.id);
      return set;
    }

    function applyRowMoveStart(rowId: string, startClientY: number, pointerId: number): void {
      const row = findRowById(rowId);
      if (row == null) return;
      if (row.draggable === false) return;
      if (row.pinned != null) return;
      if (movingRowRef.value?.rowId === rowId) return;
      movingRowRef.value = {
        rowId,
        startClientY,
        dropTarget: null,
        dropLineTopPx: null,
        pointerId,
      };
      ctx.emit('row-move-start', { row, startClientY });
    }

    function applyRowMoveDraft(currentClientY: number): void {
      const current = movingRowRef.value;
      if (current == null) return;
      const rects = getBodyRowRectsLive();
      const pinnedRowIds = getPinnedRowIdsSet();
      const nextTarget = getRowDropTarget(currentClientY, rects, current.rowId, { pinnedRowIds });
      const nextTopPx = nextTarget != null ? resolveRowDropLineTopPx(nextTarget, rects) : null;
      const sameTarget =
        (current.dropTarget?.targetRowId ?? null) === (nextTarget?.targetRowId ?? null) &&
        (current.dropTarget?.position ?? null) === (nextTarget?.position ?? null) &&
        current.dropLineTopPx === nextTopPx;
      if (sameTarget) return;
      movingRowRef.value = {
        rowId: current.rowId,
        startClientY: current.startClientY,
        dropTarget: nextTarget,
        dropLineTopPx: nextTopPx,
        pointerId: current.pointerId,
      };
    }

    function applyRowMoveCommit(): void {
      const current = movingRowRef.value;
      if (current == null) return;
      const movedRow = findRowById(current.rowId);
      const dropTarget = current.dropTarget;
      movingRowRef.value = null;
      if (movedRow == null) return;
      if (dropTarget != null && dropTarget.targetRowId !== current.rowId) {
        const targetRow = findRowById(dropTarget.targetRowId);
        if (targetRow != null && targetRow.pinned == null) {
          const next = computeRowReorder(
            props.rows,
            current.rowId,
            dropTarget.targetRowId,
            dropTarget.position,
          );
          if (next !== props.rows) {
            const oldRowIds = props.rows.map((r) => r.id);
            const newRowIds = next.map((r) => r.id);
            ctx.emit('row-order-change', {
              movedRow,
              targetRow,
              position: dropTarget.position,
              oldRowIds,
              newRowIds,
            });
          }
        }
      }
      ctx.emit('row-move-stop', { row: movedRow, committed: true, dropTarget });
    }

    function applyRowMoveCancel(): void {
      const current = movingRowRef.value;
      if (current == null) return;
      const movedRow = findRowById(current.rowId);
      movingRowRef.value = null;
      if (movedRow == null) return;
      ctx.emit('row-move-stop', { row: movedRow, committed: false, dropTarget: null });
    }

    function onRowDragPointerDown(rowId: string, e: PointerEvent): void {
      if (e.button !== 0) return;
      const row = findRowById(rowId);
      if (row == null) return;
      if (row.draggable === false) return;
      if (row.pinned != null) return;
      e.stopPropagation();
      e.preventDefault();
      pendingMoveRowRef.value = {
        rowId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        pointerId: e.pointerId,
      };
      const target = e.currentTarget as HTMLElement;
      if (typeof target.setPointerCapture === 'function') {
        try {
          target.setPointerCapture(e.pointerId);
        } catch {
          // happy-dom / synthesized events can throw.
        }
      }
    }

    function onRowDragPointerMove(e: PointerEvent): void {
      const pending = pendingMoveRowRef.value;
      const moving = movingRowRef.value;
      if (pending?.pointerId === e.pointerId && moving == null) {
        const dx = e.clientX - pending.startClientX;
        const dy = e.clientY - pending.startClientY;
        if (Math.max(Math.abs(dx), Math.abs(dy)) >= DEFAULT_ROW_DRAG_THRESHOLD_PX) {
          pendingMoveRowRef.value = null;
          applyRowMoveStart(pending.rowId, pending.startClientY, pending.pointerId);
          applyRowMoveDraft(e.clientY);
          autoScrollLatestClientYRef.value = e.clientY;
          ensureAutoScrollLoopRunning();
        }
        return;
      }
      if (moving?.pointerId === e.pointerId) {
        applyRowMoveDraft(e.clientY);
        autoScrollLatestClientYRef.value = e.clientY;
        ensureAutoScrollLoopRunning();
      }
    }

    function onRowDragPointerUp(e: PointerEvent): void {
      const pending = pendingMoveRowRef.value;
      const moving = movingRowRef.value;
      if (pending?.pointerId === e.pointerId) {
        pendingMoveRowRef.value = null;
        return;
      }
      if (moving?.pointerId === e.pointerId) {
        cancelAutoScrollLoop();
        applyRowMoveCommit();
      }
    }

    function onRowDragPointerCancel(e: PointerEvent): void {
      const pending = pendingMoveRowRef.value;
      const moving = movingRowRef.value;
      if (pending?.pointerId === e.pointerId) {
        pendingMoveRowRef.value = null;
        return;
      }
      if (moving?.pointerId === e.pointerId) {
        cancelAutoScrollLoop();
        applyRowMoveCancel();
      }
    }

    // (2026-05-31 — vue2 port): drag auto-scroll rAF loop.
    // Verbatim mirror of vue3 wiring.
    function ensureAutoScrollLoopRunning(): void {
      if (autoScrollRafIdRef.value != null) return;
      const cfg = props.rowDragAutoScroll;
      if (cfg?.enabled === false) return;
      autoScrollRafIdRef.value = requestAnimationFrame(autoScrollStep);
    }

    function autoScrollStep(): void {
      autoScrollRafIdRef.value = null;
      if (movingRowRef.value == null) return;
      const body = bodyRef.value;
      if (body == null) return;
      const cfg = props.rowDragAutoScroll;
      if (cfg?.enabled === false) return;
      const rect = body.getBoundingClientRect();
      const triggerZonePx = cfg?.triggerZonePx ?? DEFAULT_DRAG_AUTO_SCROLL_TRIGGER_ZONE_PX;
      const maxVelocityPxPerFrame =
        cfg?.maxVelocityPxPerFrame ?? DEFAULT_DRAG_AUTO_SCROLL_MAX_VELOCITY_PX_PER_FRAME;
      const velocity = computeDragAutoScrollVelocity({
        cursorClientY: autoScrollLatestClientYRef.value,
        bodyTop: rect.top,
        bodyBottom: rect.bottom,
        triggerZonePx,
        maxVelocityPxPerFrame,
      });
      if (velocity === 0) return;
      body.scrollTop = Math.max(0, body.scrollTop + velocity);
      applyRowMoveDraft(autoScrollLatestClientYRef.value);
      autoScrollRafIdRef.value = requestAnimationFrame(autoScrollStep);
    }

    function cancelAutoScrollLoop(): void {
      if (autoScrollRafIdRef.value != null) {
        cancelAnimationFrame(autoScrollRafIdRef.value);
        autoScrollRafIdRef.value = null;
      }
    }

    /**
     * apply OS-conventional click semantics for the
     * row-click selection handler.
     *
     * - `'none'` mode → no-op.
     * - `'single'` mode: plain click replaces; clicking the only-
     *   selected row deselects.
     * - `'multi'` mode: plain click replaces (single-select within
     *   multi); Ctrl/Cmd+click toggles in/out of the set;
     *   **shift+click ** replaces with the inclusive
     *   range from `selectionAnchorRef` to the clicked row in
     *   display order (currently `sortedRows` for vue2 — switches
     *   to `pagedRows` when lands). When no anchor is
     *   established, shift+click degenerates to a plain click.
     *
     * Returns the next selection array; the caller compares with the
     * current via `applySelection` to dedup. Verbatim port of vue3
     * .
     */
    function nextSelectionForClick(
      rowId: string,
      mode: 'none' | 'single' | 'multi',
      modifierActive: boolean,
      shiftActive: boolean,
    ): readonly string[] {
      const current = selectedRowIds.value;
      if (mode === 'none') return current;

      // + 45: shift+click range in multi mode. Range
      // computation operates on `pagedRows` (the post-filter + post-
      // sort + post-page slice) so range NEVER spans rows that are
      // not currently visible to the user. When no anchor is set
      // (first interaction on a fresh page), fall through to plain-
      // click branch. closed deferred switch
      // from `sortedRows` to `pagedRows` (matches vue3).
      if (mode === 'multi' && shiftActive && selectionAnchorRef.value != null) {
        const displayedIds = pagedRows.value.map((r) => r.id);
        const range = computeRangeRowIds(selectionAnchorRef.value, rowId, displayedIds);
        if (range.length > 0) return range;
        // Defensive: range was empty (stale anchor — e.g., anchor row
        // was filtered out after the anchor was set). Fall through to
        // plain-click semantics so the new click re-establishes anchor
        // implicitly.
      }

      if (mode === 'multi' && modifierActive) {
        const idx = current.indexOf(rowId);
        if (idx >= 0) {
          // (vue2 port, 2026-05-28): cascade remove on
          // ctrl+click toggle of a parent row.
          return cascadeRemoveDescendantIds(
            [...current.slice(0, idx), ...current.slice(idx + 1)],
            rowId,
          );
        }
        // cascade add on ctrl+click toggle.
        return cascadeAddDescendantIds(current, rowId);
      }
      // Plain click in 'single' or 'multi' mode → replace with rowId.
      // Special case: clicking the ONLY selected row deselects.
      if (current.length === 1 && current[0] === rowId) {
        return [];
      }
      // (vue2 port, 2026-05-28): plain-click replacement
      // cascades descendants in.
      return cascadeAddDescendantIds([rowId], rowId);
    }

    /**
     * (vue2 port, 2026-05-28): cascade-add / cascade-
     * remove helpers. Verbatim port of vue3 helpers.
     */
    function cascadeAddDescendantIds(
      base: readonly string[],
      parentRowId: string,
    ): readonly string[] {
      const descendants = collectDescendantRowIds(parentRowId, props.rows);
      const seen = new Set(base);
      const next: string[] = [...base];
      if (!seen.has(parentRowId)) {
        next.push(parentRowId);
        seen.add(parentRowId);
      }
      for (const id of descendants) {
        if (!seen.has(id)) {
          next.push(id);
          seen.add(id);
        }
      }
      return next.length === base.length ? base : next;
    }

    function cascadeRemoveDescendantIds(
      base: readonly string[],
      parentRowId: string,
    ): readonly string[] {
      const descendants = collectDescendantRowIds(parentRowId, props.rows);
      if (descendants.length === 0) return base;
      const remove = new Set<string>([parentRowId, ...descendants]);
      const next = base.filter((id) => !remove.has(id));
      return next.length === base.length ? base : next;
    }

    /**
     * per-row checkbox click handler. Semantically a
     * Ctrl+click (always toggle; never replace) regardless of
     * `selectionMode` — checkboxes are explicitly opt-in multi
     * controls. In 'single' mode this still toggles the row in/out
     * but does NOT impose the "single only" rule; consumers wanting
     * single-checkbox behavior should set `selectionMode: 'single'`
     * AND `selectionColumn.show: false` (use row-click).
     *
     * Shift+click on a checkbox reads the anchor + computes a range
     * (same code path as shift+click on a row body). Verbatim port
     * of vue3 .
     */
    function nextSelectionForCheckboxClick(rowId: string, shiftActive: boolean): readonly string[] {
      const current = selectedRowIds.value;

      // Shift+click range path (multi-only — but checkbox is by
      // definition multi). switched from `sortedRows` to
      // `pagedRows` (closes deferred switch).
      if (shiftActive && selectionAnchorRef.value != null) {
        const displayedIds = pagedRows.value.map((r) => r.id);
        const range = computeRangeRowIds(selectionAnchorRef.value, rowId, displayedIds);
        if (range.length > 0) return range;
      }

      // (vue2 port, 2026-05-28): checkbox toggle cascades
      // descendants (Decision A.1 + B.1).
      const idx = current.indexOf(rowId);
      if (idx >= 0) {
        return cascadeRemoveDescendantIds(
          [...current.slice(0, idx), ...current.slice(idx + 1)],
          rowId,
        );
      }
      return cascadeAddDescendantIds(current, rowId);
    }

    /**
     * + 45: header "select-all" checkbox click handler.
     * Three possible states are computed on the currently-displayed
     * row set (`pagedRows`, i.e., post-filter + post-sort + post-page
     * after closed the deferred switch):
     *
     * - If EVERY displayed row is already selected → clear selection
     *   (deselect all).
     * - Otherwise (none OR some selected) → add ALL displayed rowIds
     *   to the selection (union; preserves rows already selected on
     *   other pages so consumers don't accidentally lose selection
     *   state when paginating).
     *
     * Selection state outside the current page is preserved. The
     * anchor is NOT touched (select-all is a "broadcast" action, not
     * a point-anchor action). Verbatim port of vue3 .
     */
    function nextSelectionForSelectAllClick(): readonly string[] {
      const displayedIds = pagedRows.value.map((r) => r.id);
      if (displayedIds.length === 0) return selectedRowIds.value;

      const set = selectedRowIdsSet.value;
      const allSelected = displayedIds.every((id) => set.has(id));
      if (allSelected) {
        // Remove all displayed ids from current selection; keep others.
        const displayedSet = new Set(displayedIds);
        return selectedRowIds.value.filter((id) => !displayedSet.has(id));
      }
      // Union: append the not-yet-selected displayed ids in display
      // order so the array reflects the user's mental model.
      const result = [...selectedRowIds.value];
      for (const id of displayedIds) {
        if (!set.has(id)) result.push(id);
      }
      return result;
    }

    /**
     * (2026-05-28 — vue2 port of vue3): pinned-zone-
     * aware auto-scroll to bring the given cell into the body viewport.
     * Skips horizontal axis when the cell is in a pinned column
     * (sticky-positioned → always visible regardless of scrollLeft).
     */
    function runAutoScrollToCell(cell: CellRef): void {
      const bodyEl = bodyRef.value;
      if (bodyEl == null) return;
      const rowYs = rowYByRowId.value;
      const rowHs = rowHeightByRowId.value;
      const widths = widthByColId.value;
      const targetTop = rowYs[cell.rowId];
      if (targetTop == null) return;
      const targetHeight = rowHs[cell.rowId] ?? mergedTheme.value.rowHeight;
      const targetWidth = widths[cell.colId];
      if (targetWidth == null) return;
      let targetLeft = 0;
      for (const c of visibleColumns.value) {
        if (c.id === cell.colId) break;
        targetLeft += widths[c.id] ?? 0;
      }
      const pinnedResult = pinnedColsResult.value;
      const isPinned =
        pinnedResult.leftPinnedColIds.includes(cell.colId) ||
        pinnedResult.rightPinnedColIds.includes(cell.colId);
      const next = computeScrollIntoView({
        viewport: {
          scrollTop: bodyEl.scrollTop,
          scrollLeft: bodyEl.scrollLeft,
          clientHeight: bodyEl.clientHeight,
          clientWidth: bodyEl.clientWidth,
        },
        target: {
          top: targetTop,
          left: targetLeft,
          height: targetHeight,
          width: targetWidth,
        },
        margins: {
          left: pinnedResult.leftPinnedTotalWidth,
          right: pinnedResult.rightPinnedTotalWidth,
        },
      });
      const newScrollLeft = isPinned ? bodyEl.scrollLeft : next.scrollLeft;
      if (bodyEl.scrollTop !== next.scrollTop) bodyEl.scrollTop = next.scrollTop;
      if (bodyEl.scrollLeft !== newScrollLeft) bodyEl.scrollLeft = newScrollLeft;
    }

    /**
     * (2026-05-28 — vue2 port of vue3): emit-only
     * active-cell-change helper. Dedupes no-op transitions. Pass null
     * for `cell` to clear.
     *
     * (2026-05-28 — vue2 port of vue3): optional
     * `autoScroll` opt. Keyboard handler + programmatic `setActiveCell`
     * pass `true`; click handler + `clearActiveCell` keep default
     * `false` (no scroll on click; no destination on clear).
     */
    function applyActiveCellChange(
      cell: CellRef | null,
      jsEvent: Event | null,
      opts?: { autoScroll?: boolean; announce?: boolean },
    ): void {
      const current = activeCellRef.value;
      if (current == null && cell == null) return;
      if (current?.rowId === cell?.rowId && current?.colId === cell?.colId) {
        return;
      }
      activeCellRef.value = cell;
      ctx.emit('active-cell-change', {
        rowId: cell?.rowId ?? null,
        colId: cell?.colId ?? null,
        jsEvent,
      });
      if (opts?.autoScroll === true && cell != null && props.enableKeyboardAutoScroll) {
        runAutoScrollToCell(cell);
      }
      // (2026-05-29 — vue2 port): produce live-region announce
      // text for keyboard-driven transitions. Verbatim mirror of vue3
      // wiring.
      if (opts?.announce === true && cell != null) {
        const row = rowDataSource.value.getById(cell.rowId);
        const column = columnTable.value.getById(cell.colId);
        if (row != null && column != null) {
          const visibleCols = visibleColumns.value;
          const selectionShown = props.selectionColumn.show === true;
          const colIdxBase = visibleCols.findIndex((c) => c.id === cell.colId);
          const colIdx = colIdxBase < 0 ? 1 : colIdxBase + (selectionShown ? 2 : 1);
          const displayedIds = pagedRows.value.map((r) => r.id);
          const rowIdxBase = displayedIds.indexOf(cell.rowId);
          const rowIdx = rowIdxBase < 0 ? 2 : rowIdxBase + 2 + topPinnedRows.value.length;
          const announceInput: FormatActiveCellAnnouncementInput = {
            row,
            column,
            rowIndex: rowIdx,
            rowCount: ariaRowCount.value,
            colIndex: colIdx,
            colCount: ariaColCount.value,
          };
          const override = props.announceActiveCellText;
          srAnnounceTextRef.value =
            typeof override === 'function'
              ? override(announceInput)
              : formatActiveCellAnnouncement(announceInput);
        }
      }
    }

    /**
     * (vue2 port, 2026-05-28): tree-data keyboard handler
     * (Decision N.1). Returns `true` when the keystroke was consumed
     * (caller short-circuits before falling through to nav-direction
     * handling) or `false` to let the existing nav logic run. Verbatim
     * port of vue3 `maybeHandleTreeKeyboard`.
     */
    function maybeHandleTreeKeyboard(
      navKey: string,
      e: KeyboardEvent,
      _modifier: boolean,
    ): boolean {
      const active = activeCellRef.value;
      if (active == null) return false;
      const treeColId = treeColumnIdRef.value;
      if (treeColId == null || active.colId !== treeColId) return false;
      const flat = flatTreeRows.value;
      const row = flat.find((r) => r.id === active.rowId);
      if (row == null) return false;
      const hasChildren = row.children != null && row.children.length > 0;
      const isExpanded = effectiveExpandedRowIdsSet.value.has(row.id);

      if (navKey === 'Enter' || navKey === ' ' || navKey === 'Spacebar') {
        if (hasChildren) {
          e.preventDefault();
          treeExpandState.toggle(row.id);
          return true;
        }
        return false;
      }
      if (navKey === 'ArrowRight') {
        if (hasChildren && !isExpanded) {
          e.preventDefault();
          treeExpandState.expand(row.id);
          return true;
        }
        return false;
      }
      if (navKey === 'ArrowLeft') {
        if (hasChildren && isExpanded) {
          e.preventDefault();
          treeExpandState.collapse(row.id);
          return true;
        }
        const parentId = row.groupKey;
        if (parentId != null) {
          e.preventDefault();
          applyActiveCellChange({ rowId: parentId, colId: treeColId }, e, {
            autoScroll: true,
            announce: true,
          });
          return true;
        }
        return false;
      }
      return false;
    }

    /**
     * (2026-05-27 — vue2 port of vue3): emit-only
     * column-visibility-change helper. Honors the "at least one column
     * visible" guard per Decision C.1 — refuses to hide the LAST
     * currently-visible column (no-op + no emit). Dedupes no-op
     * transitions.
     */
    function applyColumnVisibilityChange(
      colId: string,
      hidden: boolean,
      jsEvent: Event | null,
    ): void {
      const col = columnTable.value.getById(colId);
      if (col == null) return;
      const currentHidden = col.hide === true;
      if (currentHidden === hidden) return;
      if (hidden) {
        const remainingVisible = props.columns.reduce<number>((sum, c) => {
          if (c.id === colId) return sum;
          return c.hide === true ? sum : sum + 1;
        }, 0);
        if (remainingVisible === 0) return;
      }
      ctx.emit('column-visibility-change', { column: col, hidden, jsEvent });
    }

    function applyShowAllColumns(jsEvent: Event | null): void {
      for (const col of props.columns) {
        if (col.hide === true) {
          ctx.emit('column-visibility-change', { column: col, hidden: false, jsEvent });
        }
      }
    }

    function applyHideAllColumns(jsEvent: Event | null): void {
      let firstVisibleSkipped = false;
      for (const col of props.columns) {
        if (col.hide === true) continue;
        if (!firstVisibleSkipped) {
          firstVisibleSkipped = true;
          continue;
        }
        ctx.emit('column-visibility-change', { column: col, hidden: true, jsEvent });
      }
    }

    function onColumnMenuButtonClick(): void {
      columnMenuOpen.value = !columnMenuOpen.value;
    }

    function onColumnCheckboxChange(colId: string, event: Event): void {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      applyColumnVisibilityChange(colId, !target.checked, event);
    }

    function onShowAllColumnsClick(event: Event): void {
      applyShowAllColumns(event);
    }

    function onHideAllColumnsClick(event: Event): void {
      applyHideAllColumns(event);
    }

    function onDocumentPointerdown(e: PointerEvent): void {
      if (!columnMenuOpen.value) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      const button = columnMenuButtonRef.value;
      const popover = columnMenuPopoverRef.value;
      if (button?.contains(target)) return;
      if (popover?.contains(target)) return;
      columnMenuOpen.value = false;
    }

    function onColumnMenuKeydown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        columnMenuOpen.value = false;
      }
    }

    const handle: TableHandle = {
      getColumnTable(): ColumnTable {
        return columnTable.value;
      },
      getRowDataSource(): RowDataSource {
        return rowDataSource.value;
      },
      getResolvedWidth(colId: string): number | undefined {
        const w = widthByColId.value[colId];
        return typeof w === 'number' ? w : undefined;
      },
      getSort(): readonly SortSpec[] {
        return sortSpec.value;
      },
      setSort(spec: SortSpec | readonly SortSpec[] | null): void {
        applySort(normalizeSortInput(spec));
      },
      clearSort(): void {
        applySort([]);
      },
      getFilter(): readonly FilterSpec[] {
        return filterSpec.value;
      },
      setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void {
        applyFilter(normalizeFilterInput(spec));
      },
      clearFilter(): void {
        applyFilter([]);
      },
      getAdvancedFilter(): {
        readonly expression: FilterExpression;
        readonly source: string | null;
      } | null {
        const found = filterSpec.value.find(
          (s): s is ExpressionFilterSpec => s.type === 'expression',
        );
        if (found == null) return null;
        return { expression: found.expression, source: found.source ?? null };
      },
      setAdvancedFilter(expression: FilterExpression | null, source?: string): void {
        const others = filterSpec.value.filter((s) => s.type !== 'expression');
        if (expression == null) {
          applyFilter(others);
          return;
        }
        const next: ExpressionFilterSpec =
          source == null
            ? { type: 'expression', expression }
            : { type: 'expression', expression, source };
        applyFilter([...others, next]);
      },
      parseAndSetAdvancedFilter(text: string): ParseFilterExpressionResult {
        const result = parseFilterExpression(text, { columns: props.columns });
        if (!result.ok) return result;
        const others = filterSpec.value.filter((s) => s.type !== 'expression');
        if (result.expression == null) {
          applyFilter(others);
          return result;
        }
        const next: ExpressionFilterSpec = {
          type: 'expression',
          expression: result.expression,
          source: text,
        };
        applyFilter([...others, next]);
        return result;
      },
      getColumnUniqueValues(
        colId: string,
        options?: { maxValues?: number },
      ): CollectUniqueColumnValuesResult {
        const column = props.columns.find((c) => c.id === colId);
        if (column == null) {
          return { values: [], truncated: false };
        }
        return collectUniqueColumnValues({
          rows: props.rows,
          column,
          ...(options?.maxValues != null ? { maxValues: options.maxValues } : {}),
        });
      },
      getQuickFindText(): string {
        return quickFindText.value;
      },
      setQuickFindText(text: string | null | undefined): void {
        applyQuickFindText(text ?? '');
      },
      getQuickFindMatchCount(): number {
        return quickFindMatchCount.value;
      },
      getSelectedRowIds(): readonly string[] {
        return selectedRowIds.value;
      },
      setSelectedRowIds(ids: readonly string[] | null): void {
        const next = ids ?? [];
        applySelection(next);
        // a programmatic set establishes a NEW anchor at
        // the first id (or null for empty). applySelection's own
        // empty-clear already handles the null case; we only need to
        // set explicitly for non-empty programmatic sets, so the
        // next shift+click reads a meaningful anchor instead of null.
        // Matches the "anchor follows the latest intentional action" rule.
        if (next.length > 0) {
          selectionAnchorRef.value = next[0]!;
        }
      },
      clearSelection(): void {
        applySelection([]);
      },
      isRowSelected(rowId: string): boolean {
        return selectedRowIdsSet.value.has(rowId);
      },
      getPage(): number {
        // Read from the pass output (post-clamp) so consumers always
        // see the legal page index. Pre-mount or pagination-disabled
        // → 0. (2026-05-30 — vue2 port): serverSide+
        // paginationEnabled reads from the session-derived computed.
        if (serverSidePaginationActive.value) return serverSideCurrentPageForFooter.value;
        return currentPageFromPass.value;
      },
      setPage(page: number): void {
        applyPage(page, currentPageSizeRef.value);
      },
      getPageSize(): number {
        return currentPageSizeRef.value;
      },
      setPageSize(pageSize: number): void {
        applyPage(currentPageRef.value, pageSize);
      },
      getTotalPages(): number {
        // (2026-05-30 — vue2 port): verbatim mirror of vue3.
        if (serverSidePaginationActive.value) return serverSideTotalPagesForFooter.value;
        return totalPagesFromPass.value;
      },
      startEditingCell(rowId: string, colId: string): void {
        applyEditStart(rowId, colId);
      },
      commitEditingCell(): void {
        applyEditCommit();
      },
      cancelEditingCell(): void {
        applyEditCancel();
      },
      getEditingCell(): EditingCell | null {
        return editingCellRef.value;
      },
      setEditingCellDraft(value: unknown): void {
        applyEditDraft(value);
      },
      startResizingColumn(colId: string): void {
        // programmatic-start path — no pointer
        // position, no pointerId. Use 0 for startX (subsequent draft
        // updates from consumers would need to compute their own
        // delta). pointerId -1 so the SFC's onPointermove handlers
        // (which gate on matching pointerId) treat the session as
        // already pointer-detached. Verbatim port of vue3 .
        applyResizeStart(colId, 0, -1);
      },
      commitColumnResize(): void {
        applyResizeCommit();
      },
      cancelColumnResize(): void {
        applyResizeCancel();
      },
      getResizingColumn(): ColumnResizing | null {
        return resizingColumnRef.value;
      },
      startMovingColumn(colId: string): void {
        applyMoveStart(colId, 0, -1);
      },
      commitColumnMove(targetColId: string, position: 'before' | 'after'): void {
        const current = movingColumnRef.value;
        if (current == null) return;
        movingColumnRef.value = {
          colId: current.colId,
          startClientX: current.startClientX,
          dropTarget: { targetColId, position },
          dropLineLeftPx: current.dropLineLeftPx,
          pointerId: current.pointerId,
        };
        applyMoveCommit();
      },
      cancelColumnMove(): void {
        applyMoveCancel();
      },
      getMovingColumn(): ColumnMoving | null {
        return movingColumnRef.value;
      },
      startMovingRow(rowId: string): void {
        applyRowMoveStart(rowId, 0, -1);
      },
      commitRowMove(targetRowId: string, position: 'above' | 'below'): void {
        const current = movingRowRef.value;
        if (current == null) return;
        movingRowRef.value = {
          rowId: current.rowId,
          startClientY: current.startClientY,
          dropTarget: { targetRowId, position },
          dropLineTopPx: current.dropLineTopPx,
          pointerId: current.pointerId,
        };
        applyRowMoveCommit();
      },
      cancelRowMove(): void {
        applyRowMoveCancel();
      },
      getMovingRow(): RowMoving | null {
        return movingRowRef.value;
      },
      refreshServerSideRows(): void {
        serverSideSessionRef.value?.refresh();
      },
      invalidateServerSideBlocks(blockIndices: readonly number[]): void {
        serverSideSessionRef.value?.invalidateBlocks(blockIndices);
      },
      getServerSideTotalRowCount(): number {
        return serverSideSessionRef.value?.getTotalRowCount() ?? 0;
      },
      getServerSideBlockState(blockIndex: number): BlockState {
        return serverSideSessionRef.value?.getBlockState(blockIndex) ?? { kind: BLOCK_KIND_IDLE };
      },
      openToolPanel(id: string): void {
        if (props.toolPanel?.panels.some((p) => p.id === id) !== true) return;
        applyToolPanelChange(id);
      },
      closeToolPanel(): void {
        applyToolPanelChange(null);
      },
      getActiveToolPanelId(): string | null {
        return activeToolPanelId.value;
      },
      openColumnHeaderMenu(colId: string): void {
        if (!props.showColumnHeaderMenu) return;
        const col = columnTable.value.getById(colId);
        if (col == null) return;
        applyOpenColumnHeaderMenu(colId);
      },
      closeColumnHeaderMenu(): void {
        applyOpenColumnHeaderMenu(null);
      },
      getOpenColumnHeaderMenuColId(): string | null {
        return openColumnHeaderMenuColIdRef.value;
      },
      openContextMenuAt(rowId: string | null, colId: string | null, x: number, y: number): void {
        applyOpenContextMenu(rowId, colId, x, y);
      },
      closeContextMenu(): void {
        applyCloseContextMenu();
      },
      getOpenContextMenuPosition(): {
        readonly rowId: string | null;
        readonly colId: string | null;
        readonly x: number;
        readonly y: number;
      } | null {
        return contextMenuPositionRef.value;
      },
      openCellStyleEditor(rowId: string, colId: string): void {
        openCellStyleEditor(rowId, colId);
      },
      autosizeColumn(colId: string): void {
        applyAutosize(colId);
      },
      autosizeAllColumns(): void {
        applyAutosizeAll();
      },
      setCellRange(range: CellRange | null): void {
        if (props.cellRangeSelection !== 'enabled') return;
        if (range == null) {
          applyCellRangeClear();
          return;
        }
        applyCellRangeStart(range.anchor, null);
        if (range.focus.rowId !== range.anchor.rowId || range.focus.colId !== range.anchor.colId) {
          applyCellRangeDraft(range.focus, null);
        }
      },
      clearCellRange(): void {
        if (props.cellRangeSelection !== 'enabled') return;
        applyCellRangeClear();
      },
      getCellRange(): CellRange | null {
        return cellRangeRef.value;
      },
      copyCellRangeToClipboard(): Promise<string | null> {
        return performCellRangeCopy(null);
      },
      pasteCellRangeFromClipboard(): Promise<readonly PasteMutation[] | null> {
        return performCellRangePaste(null);
      },
      fillCellRange(targetCell: CellRef): readonly PasteMutation[] | null {
        return performFillCellRange(targetCell);
      },
      undo(): boolean {
        return performUndo(null);
      },
      redo(): boolean {
        return performRedo(null);
      },
      canUndo(): boolean {
        return props.enableUndoHistory && mutationHistoryRef.value.past.length > 0;
      },
      canRedo(): boolean {
        return props.enableUndoHistory && mutationHistoryRef.value.future.length > 0;
      },
      clearHistory(): void {
        if (!props.enableUndoHistory) return;
        if (mutationHistoryRef.value === EMPTY_MUTATION_HISTORY) return;
        mutationHistoryRef.value = EMPTY_MUTATION_HISTORY;
        ctx.emit('history-change', { history: mutationHistoryRef.value });
      },
      getHistory(): MutationHistoryState {
        return mutationHistoryRef.value;
      },
      recordMutationBatch(batch: MutationBatch): void {
        if (!props.enableUndoHistory) return;
        mutationHistoryRef.value = appendMutationBatch(
          mutationHistoryRef.value,
          batch,
          props.undoHistoryMaxDepth,
        );
        ctx.emit('history-change', { history: mutationHistoryRef.value });
      },
      setColumnVisibility(colId: string, hidden: boolean): void {
        applyColumnVisibilityChange(colId, hidden, null);
      },
      toggleColumnVisibility(colId: string): void {
        const col = columnTable.value.getById(colId);
        if (col == null) return;
        applyColumnVisibilityChange(colId, col.hide !== true, null);
      },
      getActiveCell(): CellRef | null {
        return activeCellRef.value;
      },
      setActiveCell(rowId: string, colId: string): void {
        applyActiveCellChange({ rowId, colId }, null, { autoScroll: true });
      },
      clearActiveCell(): void {
        applyActiveCellChange(null, null);
      },
      expandRow(rowId: string): void {
        treeExpandState.expand(rowId);
      },
      collapseRow(rowId: string): void {
        treeExpandState.collapse(rowId);
      },
      getLazyChildrenState(rowId: string): LazyChildrenStatus | 'idle' {
        return lazyChildrenStateRef.value.get(rowId)?.status ?? 'idle';
      },
      getLazyChildren(rowId: string): readonly RowSpec[] | null {
        const state = lazyChildrenStateRef.value.get(rowId);
        if (state?.status === 'loaded' && state.children != null) {
          return state.children;
        }
        return null;
      },
      invalidateLazyChildren(rowId?: string): void {
        const nextMap = new Map(lazyChildrenStateRef.value);
        if (rowId == null) {
          nextMap.clear();
        } else {
          nextMap.delete(rowId);
        }
        lazyChildrenStateRef.value = nextMap;
      },
      exportToCsv(filename: string, options?: TableHandleExportToCsvOptions): void {
        // (vue2 port): verbatim port of vue3 wrapper.
        const rowSource = options?.rowSource ?? 'filtered';
        let rowsToExport: readonly RowSpec[];
        switch (rowSource) {
          case 'all':
            rowsToExport = props.rows;
            break;
          case 'visible':
            rowsToExport = [...topPinnedRows.value, ...pagedRows.value, ...bottomPinnedRows.value];
            break;
          case 'selected': {
            const sel = selectedRowIdsSet.value;
            rowsToExport = filteredRows.value.filter((r) => sel.has(r.id));
            break;
          }
          case 'filtered':
          default:
            rowsToExport = filteredRows.value;
            break;
        }
        const visibleOnly = options?.visibleColumnsOnly ?? true;
        const exportedColumns = visibleOnly ? visibleColumns.value : props.columns;
        const csv = exportToCsv(
          options?.csvOptions != null
            ? {
                rows: rowsToExport,
                columns: exportedColumns,
                options: options.csvOptions,
              }
            : {
                rows: rowsToExport,
                columns: exportedColumns,
              },
        );
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.setAttribute('data-cx-table-csv-download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      getInvalidCells(): readonly InvalidCellEntry[] {
        return snapshotInvalidCells();
      },
      getMultiFilterEntryAtPath(colId: string, path: readonly number[]): MultiFilterEntry | null {
        return getMultiFilterEntryAtPathInternal(colId, path);
      },
      setMultiFilterEntryAtPath(
        colId: string,
        path: readonly number[],
        next: MultiFilterEntry,
      ): void {
        const col = columnTable.value.getById(colId);
        if (col == null) return;
        setMultiFilterEntryAtPathInternal(col, path, next);
      },
      removeMultiFilterEntryAtPath(colId: string, path: readonly number[]): void {
        const col = columnTable.value.getById(colId);
        if (col == null) return;
        removeMultiFilterEntryAtPathInternal(col, path);
      },
      getTableView(): TableViewState {
        return serializeTableView({
          columns: props.columns,
          sort: sortSpec.value,
          filter: filterSpec.value,
          page: currentPageFromPass.value,
          pageSize: currentPageSizeRef.value,
        });
      },
      applyTableView(state: TableViewState): void {
        // (vue2 port): verbatim mirror of vue3 wiring.
        const result = applyTableView(
          state,
          props.columns,
          sortSpec.value,
          filterSpec.value,
          currentPageFromPass.value,
          currentPageSizeRef.value,
        );
        applySort(result.sort);
        applyFilter(result.filter);
        applyPage(result.page, result.pageSize);
        if (result.columns !== props.columns) {
          ctx.emit('columns-change', { columns: result.columns, reason: 'apply-view' });
        }
      },
      async exportToXlsx(
        filename: string,
        options?: TableHandleExportToXlsxOptions,
      ): Promise<void> {
        // (vue2 port): verbatim mirror of vue3 wrapper.
        const rowSource = options?.rowSource ?? 'filtered';
        let rowsToExport: readonly RowSpec[];
        switch (rowSource) {
          case 'all':
            rowsToExport = props.rows;
            break;
          case 'visible':
            rowsToExport = [...topPinnedRows.value, ...pagedRows.value, ...bottomPinnedRows.value];
            break;
          case 'selected': {
            const sel = selectedRowIdsSet.value;
            rowsToExport = filteredRows.value.filter((r) => sel.has(r.id));
            break;
          }
          case 'filtered':
          default:
            rowsToExport = filteredRows.value;
            break;
        }
        const visibleOnly = options?.visibleColumnsOnly ?? true;
        const exportedColumns = visibleOnly ? visibleColumns.value : props.columns;
        const buffer = await exportToXlsx(
          options?.xlsxOptions != null
            ? {
                rows: rowsToExport,
                columns: exportedColumns,
                options: options.xlsxOptions,
              }
            : {
                rows: rowsToExport,
                columns: exportedColumns,
              },
        );
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.setAttribute('data-cx-table-xlsx-download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      async exportToXlsxMultiSheet(
        filename: string,
        sheets: readonly AdapterXlsxSheetSpec[],
      ): Promise<void> {
        // (2026-05-29 — vue2 port): verbatim mirror of vue3.
        const sheetInputs: SingleSheetExportToXlsxInput[] = sheets.map((spec) => {
          const rowSource = spec.rowSource ?? 'filtered';
          let sheetRows: readonly RowSpec[];
          switch (rowSource) {
            case 'all':
              sheetRows = props.rows;
              break;
            case 'visible':
              sheetRows = [...topPinnedRows.value, ...pagedRows.value, ...bottomPinnedRows.value];
              break;
            case 'selected': {
              const sel = selectedRowIdsSet.value;
              sheetRows = filteredRows.value.filter((r) => sel.has(r.id));
              break;
            }
            case 'filtered':
            default:
              sheetRows = filteredRows.value;
              break;
          }
          const columnPool = visibleColumns.value;
          const sheetColumns: readonly ColumnSpec[] =
            spec.columnIds != null
              ? spec.columnIds
                  .map((id) => columnPool.find((c) => c.id === id))
                  .filter((c): c is ColumnSpec => c != null)
              : columnPool;
          return {
            rows: sheetRows,
            columns: sheetColumns,
            options: {
              ...(spec.xlsxOptions ?? {}),
              sheetName: spec.sheetName,
              includeHeaders: spec.includeHeaders ?? true,
            },
          };
        });
        const buffer = await exportToXlsx({ sheets: sheetInputs });
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.setAttribute('data-cx-table-xlsx-download', filename);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
    };
    ctx.expose(handle);

    onMounted(() => {
      ctx.emit('table-ready', handle);
      // (vue2 port): register the outside-click listener.
      document.addEventListener('pointerdown', onDocumentPointerdown);
    });

    onBeforeUnmount(() => {
      document.removeEventListener('pointerdown', onDocumentPointerdown);
      // (2026-05-29 — vue2 port): server-side session teardown.
      tearDownServerSideSession();
      // -C (2026-05-30 — vue2 port): row-auto-height observer.
      if (rowAutoHeightObserver != null) {
        rowAutoHeightObserver.disconnect();
        rowAutoHeightObserver = null;
      }
      // (vue2 port): cancel any in-flight drag auto-scroll rAF.
      cancelAutoScrollLoop();
    });

    /**
     * walk up from `event.target` to find the closest
     * ancestor that carries a `data-row-id` / `data-col-id`
     * attribute. Returns null if the click landed in body padding
     * or outside any row. Verbatim port of vue3
     * `closestAttr`.
     */
    function closestAttr(target: EventTarget | null, attr: string): string | null {
      let el: Element | null = target instanceof Element ? target : null;
      while (el != null) {
        const val = el.getAttribute(attr);
        if (val != null) return val;
        el = el.parentElement;
      }
      return null;
    }

    /**
     * pointerover / pointerout's `relatedTarget` is the
     * element the pointer is COMING FROM / GOING TO. When the
     * pointer moves between children of the same row, both
     * `event.target` and `event.relatedTarget` have the same
     * closest `[data-row-id]` — suppress those re-entries so
     * `row-mouseenter` / `row-mouseleave` fire once per row.
     */
    function sameRow(a: EventTarget | null, b: EventTarget | null): boolean {
      const rowA = closestAttr(a, 'data-row-id');
      const rowB = closestAttr(b, 'data-row-id');
      return rowA != null && rowA === rowB;
    }

    function onBodyContentClick(jsEvent: MouseEvent): void {
      const rowId = closestAttr(jsEvent.target, 'data-row-id');
      if (rowId == null) {
        // click landed inside body but outside any row →
        // empty-area-click. Mutually exclusive with row-click below.
        ctx.emit('empty-area-click', { jsEvent });
        return;
      }
      const row = rowDataSource.value.getById(rowId);
      if (!row) return;
      // row-click fires for every body click within a row.
      ctx.emit('row-click', { row, jsEvent });
      // apply OS-conventional selection semantics.
      // The selection update happens BEFORE cell-click emit so that
      // observers reading getSelectedRowIds() in a cell-click handler
      // see the post-click state. Verbatim port of vue3 /
      // 10.1 ordering contract.
      const mode = props.selectionMode;
      if (mode !== 'none') {
        const modifierActive = jsEvent.ctrlKey || jsEvent.metaKey;
        const shiftActive = jsEvent.shiftKey;
        const next = nextSelectionForClick(rowId, mode, modifierActive, shiftActive);
        applySelection(next);
        // write to anchor unless this was a shift+click
        // (the click that READS the anchor must NOT mutate it).
        setAnchorIfNotShift(rowId, shiftActive);
      }
      const colId = closestAttr(jsEvent.target, 'data-col-id');
      if (colId == null) return;
      const column = columnTable.value.getById(colId);
      if (!column) return;
      const value = getCellValue({ row, column });
      ctx.emit('cell-click', { row, column, value, jsEvent });
      // (vue2 port of vue3): clicking a body cell
      // also writes the active cell so subsequent arrow keys move
      // from the clicked cell.
      if (props.enableKeyboardNavigation) {
        applyActiveCellChange({ rowId, colId }, jsEvent);
      }
    }

    /**
     * per-row checkbox click handler. Wired directly on
     * each checkbox's `on:{click}` (not delegated, because the click
     * target is well-known + we want stopPropagation to suppress
     * body-row-click bubbling that would otherwise overwrite the
     * checkbox-toggle result). Verbatim port of vue3 .
     */
    function onSelectionCheckboxClick(rowId: string, jsEvent: MouseEvent): void {
      jsEvent.stopPropagation();
      const shiftActive = jsEvent.shiftKey;
      const next = nextSelectionForCheckboxClick(rowId, shiftActive);
      applySelection(next);
      setAnchorIfNotShift(rowId, shiftActive);
    }

    /**
     * header "select-all" checkbox click handler. Verbatim
     * port of vue3 .
     */
    function onSelectAllCheckboxClick(jsEvent: MouseEvent): void {
      jsEvent.stopPropagation();
      const next = nextSelectionForSelectAllClick();
      applySelection(next);
    }

    /**
     * symmetric to `onBodyContentClick` for double-click
     * events. Browsers emit `dblclick` independently of `click`
     * (both fire on a double click; the SFC delegates each). Always
     * emits `row-dblclick` when the dblclick lands on a row;
     * additionally emits `cell-dblclick` when the colId resolves.
     * Empty-area dblclicks are silently ignored (consumers usually
     * only care about row/cell dblclick; matches vue3
     * intentional choice). + inline-edit consumes this.
     */
    function onBodyContentDblclick(jsEvent: MouseEvent): void {
      const rowId = closestAttr(jsEvent.target, 'data-row-id');
      if (rowId == null) return;
      const row = rowDataSource.value.getById(rowId);
      if (!row) return;
      ctx.emit('row-dblclick', { row, jsEvent });
      const colId = closestAttr(jsEvent.target, 'data-col-id');
      if (colId == null) return;
      const column = columnTable.value.getById(colId);
      if (!column) return;
      const value = getCellValue({ row, column });
      ctx.emit('cell-dblclick', { row, column, value, jsEvent });
      // if the column opts into editing,
      // open the cell editor. Order matters — emit cell-dblclick
      // first so consumers observing the dblclick see the pre-edit
      // state; applyEditStart then fires cell-edit-start.
      if (column.editable === true) {
        applyEditStart(rowId, colId);
      }
    }

    /**
     * header rowgroup click delegation. Walks up from
     * `event.target` to the closest `[data-col-id]` ancestor;
     * resolves the `ColumnSpec` via `columnTable.getById` and emits
     * `header-click`. Attaches separately to `.cx-table-header`
     * (sibling to body); body-side handlers don't reach header
     * elements via the body-content delegation.
     *
     * also cycles the internal sort state
     * when the clicked column is sortable. Cycle is `null → asc →
     * desc → null`; clicking a different sortable column resets to
     * `asc` for that column. Non-sortable columns are click-no-op
     * for sort (header-click still emits — consumers may use it
     * for column-menu opens).
     */
    function onHeaderClick(jsEvent: MouseEvent): void {
      // (2026-05-27 — vue2 port of vue3): the same
      // delegated handler also walks up for `[data-group-name]`
      // ancestors so the group row's labelled cells emit
      // `header-group-click`. Group cells do NOT carry `data-col-id`,
      // so the leaf-cell branch below is a clean skip when the click
      // lands on a group cell — no double-emit.
      const groupName = closestAttr(jsEvent.target, 'data-group-name');
      if (groupName != null) {
        const colIdsAttr = closestAttr(jsEvent.target, 'data-col-ids');
        const colIds: readonly string[] =
          typeof colIdsAttr === 'string' && colIdsAttr.length > 0 ? colIdsAttr.split(',') : [];
        ctx.emit('header-group-click', { groupName, colIds, jsEvent });
        return;
      }
      const colId = closestAttr(jsEvent.target, 'data-col-id');
      if (colId == null) return;
      const column = columnTable.value.getById(colId);
      if (!column) return;
      ctx.emit('header-click', { column, jsEvent });
      if (column.sortable === false) return;
      const current = sortSpec.value;
      // shift+click composes (Excel-style multi-column);
      // plain click resets to single-column with the cycle.
      const next: readonly SortSpec[] = jsEvent.shiftKey
        ? cycleMultiColumnSort(current, colId)
        : cycleSingleColumnSort(current, colId);
      applySort(next);
    }

    /**
     * plain-click single-column cycle. Replaces the
     * entire sort array; for the clicked column, walks `null → asc →
     * desc → null`. If the array currently holds another column (or
     * has length > 1), a plain click always RESETS to single-column
     * with the clicked column at `asc`.
     */
    function cycleSingleColumnSort(
      current: readonly SortSpec[],
      colId: string,
    ): readonly SortSpec[] {
      if (current.length === 1 && current[0]!.colId === colId) {
        return current[0]!.direction === 'asc' ? [{ colId, direction: 'desc' }] : [];
      }
      return [{ colId, direction: 'asc' }];
    }

    /**
     * shift+click multi-column compose. Preserves the
     * existing array + the priorities of other columns.
     *
     * - Column absent from array → append `{colId, direction:'asc'}`.
     * - Column present as `'asc'` → flip in place to `'desc'`.
     * - Column present as `'desc'` → remove that entry.
     */
    function cycleMultiColumnSort(
      current: readonly SortSpec[],
      colId: string,
    ): readonly SortSpec[] {
      const idx = current.findIndex((s) => s.colId === colId);
      if (idx < 0) return [...current, { colId, direction: 'asc' }];
      const entry = current[idx]!;
      if (entry.direction === 'asc') {
        const next = current.slice();
        next[idx] = { colId, direction: 'desc' };
        return next;
      }
      return [...current.slice(0, idx), ...current.slice(idx + 1)];
    }

    function onBodyContentPointerover(jsEvent: PointerEvent): void {
      if (sameRow(jsEvent.target, jsEvent.relatedTarget)) return;
      const rowId = closestAttr(jsEvent.target, 'data-row-id');
      if (rowId == null) return;
      const row = rowDataSource.value.getById(rowId);
      if (!row) return;
      ctx.emit('row-mouseenter', { row, jsEvent });
    }

    function onBodyContentPointerout(jsEvent: PointerEvent): void {
      if (sameRow(jsEvent.target, jsEvent.relatedTarget)) return;
      const rowId = closestAttr(jsEvent.target, 'data-row-id');
      if (rowId == null) return;
      const row = rowDataSource.value.getById(rowId);
      if (!row) return;
      ctx.emit('row-mouseleave', { row, jsEvent });
    }

    // cell-tooltip handlers. Verbatim port of
    // vue3 wiring — see vue3 chronix-table.ts for the rationale.
    function clearTooltipTimer(): void {
      if (tooltipTimerId != null) {
        window.clearTimeout(tooltipTimerId);
        tooltipTimerId = null;
      }
    }
    function clearTooltip(): void {
      clearTooltipTimer();
      tooltipPendingCellRef.value = null;
      tooltipActiveRef.value = null;
    }
    function scheduleTooltip(rowId: string, colId: string, cellRect: DOMRect): void {
      const t = mergedTheme.value;
      if (editingCellRef.value != null) return;
      if (cellRangeRef.value != null) return;
      const wrapperEl = wrapperRef.value;
      if (wrapperEl == null) return;
      const wrapperRect = wrapperEl.getBoundingClientRect();
      const x = cellRect.right - wrapperRect.left + 4;
      const y = cellRect.bottom - wrapperRect.top + 2;
      clearTooltipTimer();
      tooltipPendingCellRef.value = { rowId, colId };
      tooltipTimerId = window.setTimeout(() => {
        const pending = tooltipPendingCellRef.value;
        if (pending == null) return;
        if (pending.rowId !== rowId || pending.colId !== colId) return;
        const row = rowDataSource.value.getById(rowId);
        if (row == null) return;
        const column = columnTable.value.getById(colId);
        if (column == null) return;
        const text = resolveCellTooltip({ row, column });
        if (text == null) {
          tooltipActiveRef.value = null;
          return;
        }
        tooltipActiveRef.value = { rowId, colId, text, x, y };
      }, t.tooltipDelayMs);
    }
    function onBodyContentTooltipPointermove(jsEvent: PointerEvent): void {
      const target = jsEvent.target as Element | null;
      if (target == null) return;
      const cellEl = target.closest<HTMLElement>('.cx-table-cell');
      if (cellEl == null) {
        clearTooltip();
        return;
      }
      const rowId = cellEl.getAttribute('data-row-id');
      const colId = cellEl.getAttribute('data-col-id');
      if (rowId == null || colId == null) return;
      const pending = tooltipPendingCellRef.value;
      const active = tooltipActiveRef.value;
      if (active?.rowId === rowId && active.colId === colId) return;
      if (pending?.rowId === rowId && pending.colId === colId) return;
      tooltipActiveRef.value = null;
      scheduleTooltip(rowId, colId, cellEl.getBoundingClientRect());
    }
    function onBodyTooltipPointerleave(_jsEvent: PointerEvent): void {
      clearTooltip();
    }
    function onBodyTooltipScroll(): void {
      clearTooltip();
    }

    return () => {
      const t = mergedTheme.value;
      const cells = headerCells.value;
      const widths = widthByColId.value;
      const visible = visibleColumns.value;
      const total = totalWidth.value;
      const rowYs = rowYByRowId.value;
      const rowHs = rowHeightByRowId.value;
      const bodyHeight = totalBodyHeight.value;
      // hoisted alongside other render-bound values so the
      // headerCellNodes map callback can read it via closure without
      // a TDZ error (headerCellNodes builds BEFORE the rowsToRender
      // / bodyRows section where activeSort would naturally land).
      const activeSort = sortSpec.value;
      // hoisted alongside activeSort so the
      // per-cell map callback below can read the current edit state
      // via closure without re-reading the ref inside the loop.
      // `null` when no edit is active; the per-cell branch swaps in
      // the editor `<input>` only for the exactly-matching cell.
      const activeEdit = editingCellRef.value;

      // selection-column config + derived total row width.
      // When `selectionColumn.show: true`, every row carries an extra
      // <div class="cx-table-selection-cell{-body|-header}"> on the
      // configured side; row width grows by `selectionColumnWidth`.
      // `selectAllState` is computed once per render to drive the
      // header checkbox's checked/indeterminate property. Verbatim
      // port of vue3 .
      const selectionColShow = props.selectionColumn.show;
      const selectionColSide = props.selectionColumn.side;
      const selectionColWidth = t.selectionColumnWidth;
      const totalWithSelection = selectionColShow ? total + selectionColWidth : total;
      // (vue2 port).
      const rowDragColumnShow = props.rowDragColumn.show;
      const rowDragColumnSide = props.rowDragColumn.side ?? 'left';
      const rowDragColumnWidth = 30;
      const totalWithRowDrag = rowDragColumnShow
        ? totalWithSelection + rowDragColumnWidth
        : totalWithSelection;
      // (2026-05-31 — vue2 port): mutual-exclusivity warn.
      const anyColHasRowDragHandle = visible.some((c) => c.rowDragHandle === true);
      if (rowDragColumnShow && anyColHasRowDragHandle && warnedRowDragMixedRef.value !== true) {
        warnedRowDragMixedRef.value = true;
        console.warn(
          'chronix-table: rowDragColumn.show is true; ColumnSpec.rowDragHandle flags are ignored.',
        );
      }
      // switched from `sortedRows` to `pagedRows` so the
      // header select-all 3-state reflects only currently-displayed-
      // page rows (matches vue3).
      const displayedRowIds: readonly string[] = pagedRows.value.map((r) => r.id);

      // (2026-05-29 — vue2 port): verbatim mirror of vue3
      // aria-rowindex / aria-colindex lookups.
      const pagedRowIdxByIdAria = new Map<string, number>(
        pagedRows.value.map((r, i) => [r.id, i] as const),
      );
      const visibleColIdxById = new Map<string, number>(visible.map((c, i) => [c.id, i] as const));
      const selectionAriaColIdx = selectionColShow
        ? selectionColSide === 'left'
          ? 1
          : visible.length + 1
        : 0;
      function ariaColIndexFor(colId: string): number {
        const idx = visibleColIdxById.get(colId);
        if (idx === undefined) return 1;
        return idx + (selectionColShow && selectionColSide === 'left' ? 2 : 1);
      }
      function ariaRowIndexForBody(rowId: string): number {
        const pagedIdx = pagedRowIdxByIdAria.get(rowId);
        if (pagedIdx === undefined) return 2;
        return pagedIdx + 2 + topPinnedRows.value.length;
      }
      const ariaRowIndexAfterBody = 2 + topPinnedRows.value.length + pagedRows.value.length;
      const selSet = selectedRowIdsSet.value;
      const displayedSelectedCount = displayedRowIds.reduce(
        (n, id) => (selSet.has(id) ? n + 1 : n),
        0,
      );
      const selectAllState: 'checked' | 'unchecked' | 'indeterminate' =
        displayedRowIds.length === 0
          ? 'unchecked'
          : displayedSelectedCount === displayedRowIds.length
            ? 'checked'
            : displayedSelectedCount === 0
              ? 'unchecked'
              : 'indeterminate';

      // (2026-05-26 — vue2 port of vue3): pinned-
      // column metadata for the current render frame. Source of truth
      // for per-cell sticky-offset application across header / filter
      // / body / selection-rail render paths. Reading once per render
      // avoids the reactive-overhead of dereferencing `.value` inside
      // per-cell loops.
      //
      // `selectionRailLeftShift` shifts left-pinned cells RIGHTWARD by
      // the selection-rail's width when the rail sits on the same side;
      // otherwise left-pinned cells would render UNDER the rail at
      // `left: 0`. Symmetric for right.
      const pinnedResult = pinnedColsResult.value;
      const pinnedLeftSet = new Set(pinnedResult.leftPinnedColIds);
      const pinnedRightSet = new Set(pinnedResult.rightPinnedColIds);
      const lastLeftPinnedColId =
        pinnedResult.leftPinnedColIds.length > 0
          ? pinnedResult.leftPinnedColIds[pinnedResult.leftPinnedColIds.length - 1]
          : null;
      const firstRightPinnedColId =
        pinnedResult.rightPinnedColIds.length > 0 ? pinnedResult.rightPinnedColIds[0] : null;
      const selectionRailLeftShift =
        selectionColShow && selectionColSide === 'left' ? selectionColWidth : 0;
      const selectionRailRightShift =
        selectionColShow && selectionColSide === 'right' ? selectionColWidth : 0;

      /**
       * helper: returns per-cell sticky-positioning style
       * additions for a column. Returns an empty record for center
       * columns so spreading into the existing cell `style` object is
       * a no-op. The render code applies the matching modifier classes
       * (`--pinned-left` / `--pinned-right` / `--pinned-left-last` /
       * `--pinned-right-first`) separately so CSS can hook on them
       * without re-reading inline style.
       */
      function pinnedCellStyle(colId: string): Record<string, string> {
        if (pinnedLeftSet.has(colId)) {
          const offset = pinnedResult.leftOffsetByColId[colId] ?? 0;
          return {
            position: 'sticky',
            left: `${offset + selectionRailLeftShift}px`,
            zIndex: '2',
            background: 'var(--cx-table-pinned-zone-bg, inherit)',
          };
        }
        if (pinnedRightSet.has(colId)) {
          const offset = pinnedResult.rightOffsetByColId[colId] ?? 0;
          return {
            position: 'sticky',
            right: `${offset + selectionRailRightShift}px`,
            zIndex: '2',
            background: 'var(--cx-table-pinned-zone-bg, inherit)',
          };
        }
        return {};
      }

      /**
       * helper: returns per-cell zone modifier class
       * suffixes. The `--last` / `--first` modifier identifies the
       * boundary cell where the box-shadow visual separator paints.
       */
      function pinnedCellModifierSuffixes(colId: string): readonly string[] {
        if (pinnedLeftSet.has(colId)) {
          return colId === lastLeftPinnedColId
            ? ['--pinned-left', '--pinned-left-last']
            : ['--pinned-left'];
        }
        if (pinnedRightSet.has(colId)) {
          return colId === firstRightPinnedColId
            ? ['--pinned-right', '--pinned-right-first']
            : ['--pinned-right'];
        }
        return [];
      }

      // the selection rail also sticks to its configured
      // edge during horizontal scroll so it stays paired with the
      // pinned columns it sits next to. `left: 0` (or `right: 0`)
      // places it OUTSIDE the pinned zones; left-pinned cells'
      // sticky offsets are shifted by `selectionColWidth` so they
      // sit to the RIGHT of the rail (`pinnedCellStyle` does the
      // shift via `selectionRailLeftShift` above).
      const selectionRailStickyStyle: Record<string, string> = selectionColShow
        ? selectionColSide === 'left'
          ? {
              position: 'sticky',
              left: '0px',
              zIndex: '3',
              background: 'var(--cx-table-pinned-zone-bg, inherit)',
            }
          : {
              position: 'sticky',
              right: '0px',
              zIndex: '3',
              background: 'var(--cx-table-pinned-zone-bg, inherit)',
            }
        : {};

      // selection-cell builders. Vue 2.7 vnode-data deltas
      // from vue3:
      //   - `attrs:` for HTML attributes (type, aria-label, data-*)
      //   - `domProps:` for DOM properties (checked, indeterminate)
      //   - `on: { click: ... }` for handlers
      //   - `ref:` function callback (as never cast) for indeterminate
      //     write — DOM `.indeterminate` has no HTML attribute analog.
      function buildHeaderSelectionCell(): VNode {
        return h(
          'div',
          {
            key: 'header-selection',
            class: 'cx-table-header-cell cx-table-selection-cell',
            attrs: {
              role: 'columnheader',
              'data-col-id': '__cx_selection__',
              'aria-colindex': String(selectionAriaColIdx),
            },
            style: {
              width: `${selectionColWidth}px`,
              height: `${t.headerHeight}px`,
              ...selectionRailStickyStyle,
            },
          },
          [
            h('input', {
              class: 'cx-table-selection-checkbox cx-table-selection-checkbox--header',
              attrs: {
                type: 'checkbox',
                'aria-label': 'Select all visible rows',
                'data-select-all-state': selectAllState,
              },
              domProps: { checked: selectAllState === 'checked' },
              ref: ((el: HTMLElement | null) => {
                if (el && (el as HTMLInputElement).tagName === 'INPUT') {
                  (el as HTMLInputElement).indeterminate = selectAllState === 'indeterminate';
                }
              }) as never,
              on: { click: onSelectAllCheckboxClick },
            }),
          ],
        );
      }

      function buildFilterSelectionCell(): VNode {
        // Placeholder cell to keep column alignment in the filter row.
        return h('div', {
          key: 'filter-selection',
          class: 'cx-table-filter-cell cx-table-selection-cell',
          attrs: { 'data-col-id': '__cx_selection__' },
          style: { width: `${selectionColWidth}px`, ...selectionRailStickyStyle },
        });
      }

      function buildBodySelectionCell(rowId: string, rowH: number): VNode {
        const isRowSel = selSet.has(rowId);
        // (vue2 port, 2026-05-28): tristate visualization
        // (Decision C.1). Indeterminate state when row is a parent
        // with some-but-not-all descendants selected. Set via DOM
        // `input.indeterminate` PROPERTY (vue2's `domProps`).
        const tristate: RowSelectionTriState = computeRowSelectionTriState(
          rowId,
          props.rows,
          selSet,
        );
        const isIndeterminate = tristate === 'some' && !isRowSel;
        const checkboxClasses = ['cx-table-selection-checkbox', 'cx-table-selection-checkbox--row'];
        if (isIndeterminate) checkboxClasses.push('cx-table-row-checkbox--indeterminate');
        return h(
          'div',
          {
            key: `selection-${rowId}`,
            class: 'cx-table-cell cx-table-selection-cell-body',
            attrs: {
              role: 'gridcell',
              'data-col-id': '__cx_selection__',
              'data-row-id': rowId,
              'aria-colindex': String(selectionAriaColIdx),
            },
            style: {
              width: `${selectionColWidth}px`,
              height: `${rowH}px`,
              ...selectionRailStickyStyle,
            },
          },
          [
            h('input', {
              class: checkboxClasses,
              attrs: {
                type: 'checkbox',
                'aria-label': `Select row ${rowId}`,
                'data-row-id': rowId,
              },
              // domProps writes BOTH `checked` AND
              // `indeterminate` PROPERTIES (vue2's idiomatic way to set
              // DOM properties not expressible as HTML attributes).
              domProps: { checked: isRowSel, indeterminate: isIndeterminate },
              on: {
                click: (e: MouseEvent) => onSelectionCheckboxClick(rowId, e),
              },
            }),
          ],
        );
      }

      /**
       * -B (2026-05-30 — vue2 port). Verbatim mirror of vue3
       * -B buildActionsCellChildren; vue2 vnode-data delta:
       * aria-label / disabled / data-action-id go under `attrs:`.
       */
      function buildActionsCellChildren(actions: readonly RowAction[], row: RowSpec): VNode {
        return h(
          'div',
          { class: 'cx-table-cell-actions' },
          actions.map((action) => {
            const isDisabled = action.disabled?.(row) === true;
            const buttonClasses = ['cx-table-cell-action'];
            if (isDisabled) buttonClasses.push('cx-table-cell-action--disabled');
            const buttonChildren: (VNode | string)[] = [];
            if (typeof action.icon === 'string' && action.icon.length > 0) {
              buttonChildren.push(h('span', { class: 'cx-table-cell-action-icon' }, action.icon));
            }
            if (action.iconOnly !== true) {
              buttonChildren.push(h('span', { class: 'cx-table-cell-action-label' }, action.label));
            }
            return h(
              'button',
              {
                key: action.id,
                class: buttonClasses.join(' '),
                attrs: {
                  type: 'button',
                  'data-action-id': action.id,
                  'aria-label': action.ariaLabel ?? action.label,
                  disabled: isDisabled,
                },
                on: {
                  click: (e: MouseEvent) => {
                    e.stopPropagation();
                    if (isDisabled) return;
                    action.onClick(row);
                  },
                },
              },
              buttonChildren,
            );
          }),
        );
      }

      /**
       * (vue2 port). Verbatim mirror of vue3 buildRowDragGripCell.
       */
      function buildRowDragGripCell(row: RowSpec, rowH: number): VNode {
        const isInactive = row.pinned != null || row.draggable === false;
        const railSide: 'left' | 'right' = rowDragColumnSide;
        const railStickyStyle: Record<string, string | number> = {
          position: 'sticky',
          [railSide]: '0px',
          zIndex: 2,
          background: 'var(--cx-table-row-drag-rail-bg, #f8fafc)',
        };
        return h(
          'div',
          {
            key: `row-drag-${row.id}`,
            class: [
              'cx-table-cell',
              'cx-table-row-drag-cell',
              !isInactive && 'cx-table-row-drag-cell--draggable',
            ]
              .filter(Boolean)
              .join(' '),
            attrs: {
              role: 'gridcell',
              'data-col-id': '__cx_row_drag__',
              'data-row-id': row.id,
              ...(isInactive ? {} : { 'data-row-drag-handle': 'true' }),
            },
            style: {
              width: `${rowDragColumnWidth}px`,
              height: `${rowH}px`,
              ...railStickyStyle,
            },
            on: isInactive
              ? {}
              : {
                  pointerdown: (e: PointerEvent) => onRowDragPointerDown(row.id, e),
                },
          },
          isInactive ? [] : ['≡'],
        );
      }

      // hoisted alongside activeSort + activeEdit
      // so the per-cell map callback below can read the current resize
      // state via closure without re-reading the ref inside the loop.
      // `null` when no resize is active; the per-cell branch adds the
      // `--resizing` modifier only to the matching column header.
      const activeResize = resizingColumnRef.value;
      const activeMove = movingColumnRef.value;
      const activeMoveDropTarget = activeMove?.dropTarget ?? null;
      const headerCellNodes: VNode[] = cells.map((cell) => {
        // + 42.1: per-column sort state for the indicator
        // span. activeSort is the full ordered array; resolve this
        // column's index + direction within it. activeIndex >= 0
        // means the column participates in the sort.
        const column = columnTable.value.getById(cell.colId);
        const isSortable = column?.sortable !== false;
        // gate the resizer on column.resizable (default true).
        const isResizable = column?.resizable !== false;
        const isResizingThis = activeResize?.colId === cell.colId;
        // gate the move handler on column.reorderable (default true).
        const isReorderable = column?.reorderable !== false;
        const isMovingThis = activeMove?.colId === cell.colId;
        const isDropTargetBefore =
          activeMoveDropTarget?.targetColId === cell.colId &&
          activeMoveDropTarget?.position === 'before';
        const isDropTargetAfter =
          activeMoveDropTarget?.targetColId === cell.colId &&
          activeMoveDropTarget?.position === 'after';
        const activeIndex = activeSort.findIndex((s) => s.colId === cell.colId);
        const direction = activeIndex >= 0 ? activeSort[activeIndex]!.direction : null;
        const indicatorText = direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '';
        // append a superscript priority number when
        // multi-column sort is active (length > 1) so consumers can
        // see lex-order. Single-column sort omits the superscript.
        const showPosition = activeIndex >= 0 && activeSort.length > 1;
        const positionNode: VNode | null = showPosition
          ? h(
              'sup',
              {
                class: 'cx-table-sort-indicator-position',
                attrs: { 'data-sort-position': String(activeIndex + 1) },
              },
              String(activeIndex + 1),
            )
          : null;
        const indicatorClass = [
          'cx-table-sort-indicator',
          direction != null && `cx-table-sort-indicator--${direction}`,
        ]
          .filter(Boolean)
          .join(' ');
        const indicatorChildren =
          positionNode != null ? [indicatorText, positionNode] : indicatorText;
        const indicatorNode: VNode = h(
          'span',
          {
            class: indicatorClass,
            attrs: { 'data-sort-direction': direction ?? '' },
          },
          indicatorChildren,
        );
        // pinned-zone modifier classes + sticky inline
        // style when the column is pinned. Empty record / empty array
        // for center columns so the spread / class push is a no-op.
        const pinnedHeaderStyle = pinnedCellStyle(cell.colId);
        const pinnedHeaderModifiers = pinnedCellModifierSuffixes(cell.colId).map(
          (suffix) => `cx-table-header-cell${suffix}`,
        );
        const headerClass = [
          'cx-table-header-cell',
          isSortable && 'cx-table-header-cell--sortable',
          direction != null && 'cx-table-header-cell--sorted',
          isResizingThis && 'cx-table-header-cell--resizing',
          isReorderable && 'cx-table-header-cell--reorderable',
          isMovingThis && 'cx-table-header-cell--moving',
          isDropTargetBefore && 'cx-table-header-cell--drop-target-before',
          isDropTargetAfter && 'cx-table-header-cell--drop-target-after',
          ...pinnedHeaderModifiers,
        ]
          .filter(Boolean)
          .join(' ');
        // pointer-capture resizer. Once
        // setPointerCapture is called on the resizer element, all
        // subsequent pointermove + pointerup events fire on THAT
        // element regardless of cursor position — no global window
        // listeners needed. Modern DOM idiom for slider / drag-handle
        // widgets. The 4px hit-area (Decision C.1) is positioned at
        // the column boundary via CSS (right: 0). Verbatim port of
        // vue3 with vue2 vnode-data deltas (attrs / on).
        const resizerNode: VNode | null = isResizable
          ? h('div', {
              key: `resizer-${cell.colId}`,
              class: [
                'cx-table-header-resizer',
                isResizingThis && 'cx-table-header-resizer--active',
              ]
                .filter(Boolean)
                .join(' '),
              attrs: { 'data-resizer-col-id': cell.colId },
              on: {
                pointerdown: (e: PointerEvent) => {
                  // Primary button only — secondary button is reserved
                  // for context menus; the resizer should ignore it.
                  if (e.button !== 0) return;
                  e.preventDefault();
                  e.stopPropagation();
                  const target = e.currentTarget as HTMLElement;
                  // Guard: happy-dom (the vitest env) doesn't implement
                  // setPointerCapture. Real browsers do; skipping in the
                  // test env still exercises the apply* helpers + the
                  // drag-update path via vue-test-utils trigger calls.
                  if (typeof target.setPointerCapture === 'function') {
                    target.setPointerCapture(e.pointerId);
                  }
                  applyResizeStart(cell.colId, e.clientX, e.pointerId);
                },
                pointermove: (e: PointerEvent) => {
                  if (resizingColumnRef.value?.pointerId !== e.pointerId) return;
                  applyResizeDraft(e.clientX);
                },
                pointerup: (e: PointerEvent) => {
                  if (resizingColumnRef.value?.pointerId !== e.pointerId) return;
                  resizeCommitInProgressRef.value = true;
                  applyResizeCommit();
                  // Defer the guard reset to a microtask so the
                  // lostpointercapture event (which fires AFTER
                  // pointerup releases the capture) sees the flag
                  // still set and skips the redundant cancel path.
                  // Mirrors the queueMicrotask pattern.
                  queueMicrotask(() => {
                    resizeCommitInProgressRef.value = false;
                  });
                },
                pointercancel: () => {
                  if (resizeCommitInProgressRef.value) return;
                  if (resizingColumnRef.value != null) {
                    applyResizeCancel();
                  }
                },
                lostpointercapture: () => {
                  if (resizeCommitInProgressRef.value) return;
                  if (resizingColumnRef.value != null) {
                    applyResizeCancel();
                  }
                },
                // Defensive — a click on the 4px hit-area must not
                // bubble up to the header-cell's sort click.
                click: (e: MouseEvent) => e.stopPropagation(),
                // dbl-click on the resizer
                // autosizes the column to its content. Gated on
                // `autosizeable !== false` (separate opt-out from
                // `resizable`). preventDefault + stopPropagation so
                // the dblclick doesn't bubble up to any consumer-wired
                // cell-dblclick / row-dblclick handlers.
                dblclick: (e: MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (column?.autosizeable === false) return;
                  applyAutosize(cell.colId);
                },
              },
            })
          : null;
        // (2026-05-29 — vue2 port): visually-hidden
        // description span + aria-describedby on the columnheader so
        // screen readers narrate sort + filter state. Inline
        // visually-hidden style keeps chronix-table self-contained
        // without requiring consumer CSS. Verbatim port of vue3
        // .
        const headerDescribedById = `cx-table-header-cell-desc-${cell.colId}`;
        const headerDescription =
          column != null
            ? formatColumnHeaderDescription({
                column,
                sortSpec: activeSort,
                filterSpec: filterSpec.value,
              })
            : '';
        const headerDescriptionNode: VNode = h(
          'span',
          {
            attrs: { id: headerDescribedById },
            class: 'cx-table-header-cell__sr-description',
            style: {
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: '0',
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: '0',
            },
          },
          headerDescription,
        );
        // -A (2026-05-30 — vue2 port): column header menu
        // button + popover. Renders only when
        // props.showColumnHeaderMenu === true. Verbatim mirror of vue3.
        const columnHeaderMenuNodes: VNode[] = [];
        if (props.showColumnHeaderMenu === true) {
          const isOpen = openColumnHeaderMenuColIdRef.value === cell.colId;
          const col = columnTable.value.getById(cell.colId);
          const isSortableForMenu = col?.sortable !== false;
          const isHideableForMenu = col != null;
          const isAutosizeableForMenu = col?.autosizeable !== false && col?.resizable !== false;
          const isCurrentlySorted = direction != null;
          columnHeaderMenuNodes.push(
            h(
              'button',
              {
                class: [
                  'cx-table-column-header-menu-button',
                  isOpen && 'cx-table-column-header-menu-button--open',
                ]
                  .filter(Boolean)
                  .join(' '),
                attrs: {
                  type: 'button',
                  'data-col-id': cell.colId,
                  'aria-haspopup': 'menu',
                  'aria-expanded': isOpen ? 'true' : 'false',
                  'aria-label': '列操作菜单',
                },
                on: {
                  click: (e: MouseEvent) => {
                    e.stopPropagation();
                    applyOpenColumnHeaderMenu(isOpen ? null : cell.colId);
                  },
                },
              },
              '▾',
            ),
          );
          if (isOpen) {
            // roving tabindex over the 5 fixed action ids.
            const headerMenuActiveIdx = columnHeaderMenuKbdNav.activeIndex.value;
            const headerMenuItemKbdTabindex = (idx: number, disabled: boolean): number => {
              if (disabled) return -1;
              return headerMenuActiveIdx === idx ? 0 : -1;
            };
            const menuItems: VNode[] = [
              h(
                'button',
                {
                  class: 'cx-table-column-header-menu-item',
                  attrs: {
                    type: 'button',
                    role: 'menuitem',
                    tabindex: headerMenuItemKbdTabindex(0, !isSortableForMenu),
                    'data-action': 'sort-asc',
                    'data-menu-item-index': '0',
                    disabled: !isSortableForMenu ? 'disabled' : undefined,
                  },
                  domProps: { disabled: !isSortableForMenu },
                  on: {
                    click: () => {
                      if (!isSortableForMenu) return;
                      onColumnHeaderMenuItemClick(cell.colId, 'sort-asc');
                    },
                  },
                },
                '升序',
              ),
              h(
                'button',
                {
                  class: 'cx-table-column-header-menu-item',
                  attrs: {
                    type: 'button',
                    role: 'menuitem',
                    tabindex: headerMenuItemKbdTabindex(1, !isSortableForMenu),
                    'data-action': 'sort-desc',
                    'data-menu-item-index': '1',
                  },
                  domProps: { disabled: !isSortableForMenu },
                  on: {
                    click: () => {
                      if (!isSortableForMenu) return;
                      onColumnHeaderMenuItemClick(cell.colId, 'sort-desc');
                    },
                  },
                },
                '降序',
              ),
              h(
                'button',
                {
                  class: 'cx-table-column-header-menu-item',
                  attrs: {
                    type: 'button',
                    role: 'menuitem',
                    tabindex: headerMenuItemKbdTabindex(2, !isCurrentlySorted),
                    'data-action': 'clear-sort',
                    'data-menu-item-index': '2',
                  },
                  domProps: { disabled: !isCurrentlySorted },
                  on: {
                    click: () => {
                      if (!isCurrentlySorted) return;
                      onColumnHeaderMenuItemClick(cell.colId, 'clear-sort');
                    },
                  },
                },
                '清除排序',
              ),
              h(
                'button',
                {
                  class: 'cx-table-column-header-menu-item',
                  attrs: {
                    type: 'button',
                    role: 'menuitem',
                    tabindex: headerMenuItemKbdTabindex(3, !isHideableForMenu),
                    'data-action': 'hide',
                    'data-menu-item-index': '3',
                  },
                  domProps: { disabled: !isHideableForMenu },
                  on: {
                    click: () => {
                      if (!isHideableForMenu) return;
                      onColumnHeaderMenuItemClick(cell.colId, 'hide');
                    },
                  },
                },
                '隐藏',
              ),
              h(
                'button',
                {
                  class: 'cx-table-column-header-menu-item',
                  attrs: {
                    type: 'button',
                    role: 'menuitem',
                    tabindex: headerMenuItemKbdTabindex(4, !isAutosizeableForMenu),
                    'data-action': 'autosize',
                    'data-menu-item-index': '4',
                  },
                  domProps: { disabled: !isAutosizeableForMenu },
                  on: {
                    click: () => {
                      if (!isAutosizeableForMenu) return;
                      onColumnHeaderMenuItemClick(cell.colId, 'autosize');
                    },
                  },
                },
                '自适应宽度',
              ),
            ];
            columnHeaderMenuNodes.push(
              h(
                'div',
                {
                  ref: ((el: HTMLElement | null) => {
                    columnHeaderMenuRef.value = el;
                  }) as never,
                  class: 'cx-table-column-header-menu',
                  attrs: {
                    role: 'menu',
                    'data-col-id': cell.colId,
                  },
                  on: {
                    keydown: (e: KeyboardEvent) => columnHeaderMenuKbdNav.handleKeydown(e),
                  },
                },
                menuItems,
              ),
            );
          }
        }
        const headerChildren: (VNode | null)[] = [
          h('span', { class: 'cx-table-header-cell-label' }, cell.label),
          indicatorNode,
          headerDescriptionNode,
          ...columnHeaderMenuNodes,
          resizerNode,
        ];
        // whole-header-cell pointer wiring for
        // column-move drag. Gated on `reorderable !== false`. The
        // resizer stops propagation on its pointerdown so
        // grabbing the 4px edge wins. Move handler never preventDefault's
        // the pointerdown — that would break the header click → sort
        // cycle delegated on `.cx-table-header`'s parent.
        const headerCellOn: Record<string, (e: PointerEvent) => void> = isReorderable
          ? {
              pointerdown: (e: PointerEvent) => {
                if (e.button !== 0) return;
                const target = e.currentTarget as HTMLElement;
                // Defensive try/catch — setPointerCapture throws
                // InvalidPointerId on synthesized events without an
                // active pointer (B14.3 lesson).
                if (typeof target.setPointerCapture === 'function') {
                  try {
                    target.setPointerCapture(e.pointerId);
                  } catch {
                    // ignore
                  }
                }
                pendingMoveColumnRef.value = {
                  colId: cell.colId,
                  startClientX: e.clientX,
                  startClientY: e.clientY,
                  pointerId: e.pointerId,
                };
              },
              pointermove: (e: PointerEvent) => {
                const pending = pendingMoveColumnRef.value;
                if (pending?.pointerId === e.pointerId) {
                  const dx = Math.abs(e.clientX - pending.startClientX);
                  const dy = Math.abs(e.clientY - pending.startClientY);
                  if (Math.max(dx, dy) >= DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX) {
                    applyMoveStart(pending.colId, pending.startClientX, pending.pointerId);
                    pendingMoveColumnRef.value = null;
                    applyMoveDraft(e.clientX);
                  }
                  return;
                }
                if (movingColumnRef.value?.pointerId !== e.pointerId) return;
                applyMoveDraft(e.clientX);
              },
              pointerup: (e: PointerEvent) => {
                const pending = pendingMoveColumnRef.value;
                if (pending?.pointerId === e.pointerId) {
                  pendingMoveColumnRef.value = null;
                  return;
                }
                if (movingColumnRef.value?.pointerId !== e.pointerId) return;
                moveCommitInProgressRef.value = true;
                applyMoveCommit();
                queueMicrotask(() => {
                  moveCommitInProgressRef.value = false;
                });
              },
              pointercancel: () => {
                pendingMoveColumnRef.value = null;
                if (moveCommitInProgressRef.value) return;
                if (movingColumnRef.value != null) applyMoveCancel();
              },
              lostpointercapture: () => {
                pendingMoveColumnRef.value = null;
                if (moveCommitInProgressRef.value) return;
                if (movingColumnRef.value != null) applyMoveCancel();
              },
            }
          : {};
        return h(
          'div',
          {
            key: `header-${cell.colId}`,
            class: headerClass,
            attrs: {
              role: 'columnheader',
              'data-col-id': cell.colId,
              'aria-colindex': String(ariaColIndexFor(cell.colId)),
              'aria-sort':
                direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none',
              'aria-describedby': headerDescribedById,
            },
            style: {
              width: `${widths[cell.colId] ?? 0}px`,
              height: `${t.headerHeight}px`,
              paddingLeft: `${t.cellPaddingX}px`,
              paddingRight: `${t.cellPaddingX}px`,
              cursor: isReorderable ? 'grab' : isSortable ? 'pointer' : 'default',
              ...pinnedHeaderStyle,
            },
            on: headerCellOn,
          },
          headerChildren.filter((c): c is VNode => c != null),
        );
      });

      // prepend / append the selection header cell when
      // the feature is opted-in. The cell sits inside the same row
      // div so flex layout handles alignment without a separate rail.
      const headerCellNodesWithSelection: VNode[] = selectionColShow
        ? selectionColSide === 'left'
          ? [buildHeaderSelectionCell(), ...headerCellNodes]
          : [...headerCellNodes, buildHeaderSelectionCell()]
        : headerCellNodes;

      const headerRow: VNode = h(
        'div',
        {
          class: 'cx-table-row cx-table-row--header',
          attrs: { role: 'row', 'aria-rowindex': '1' },
          style: { width: `${totalWithRowDrag}px` },
        },
        headerCellNodesWithSelection,
      );

      // (2026-05-27 — vue2 port): when ANY visible
      // column declares a `headerGroup`, prepend N group rows above the
      // leaf row (N = table-wide max nesting depth). Per vue3
      // Decision B.1 + vue3 Decision B.1, all rows have the
      // same column alignment — un-covered cells at a given level
      // render as singleton empty placeholders so the leaf row stays
      // vertically aligned. Per Decision A.1, groups never
      // span pinned-zone boundaries.
      const rowsByZone = headerGroupRowsByZone.value;
      function buildHeaderGroupSpanCell(
        span: HeaderGroupSpan,
        zoneKey: string,
        levelIdx: number,
      ): VNode {
        let spanWidth = 0;
        for (const id of span.colIds) spanWidth += widths[id] ?? 0;
        const isEmpty = span.groupName == null;
        const cellClass =
          'cx-table-header-group' + (isEmpty ? ' cx-table-header-group--empty' : '');
        const cellAttrs: Record<string, unknown> = {
          role: 'columnheader',
          'data-header-group-level': String(levelIdx),
          'aria-colindex': String(ariaColIndexFor(span.colIds[0] ?? '')),
        };
        if (!isEmpty) {
          cellAttrs['data-group-name'] = span.groupName;
          cellAttrs['data-col-ids'] = span.colIds.join(',');
        }
        return h(
          'div',
          {
            key: `header-group-${zoneKey}-L${levelIdx}-${span.startColIdx}-${span.endColIdx}`,
            class: cellClass,
            attrs: cellAttrs,
            style: {
              width: `${spanWidth}px`,
              height: `${t.headerGroupHeight}px`,
              background: isEmpty ? 'transparent' : 'var(--cx-table-header-group-bg, #e8ecf0)',
              paddingLeft: `${t.cellPaddingX}px`,
              paddingRight: `${t.cellPaddingX}px`,
            },
          },
          isEmpty ? [] : [h('span', { class: 'cx-table-header-group-label' }, [span.groupName])],
        );
      }
      const headerGroupRows: VNode[] = [];
      if (rowsByZone != null) {
        const depth = tableMaxHeaderDepth.value;
        for (let levelIdx = 0; levelIdx < depth; levelIdx++) {
          const leftCells = (rowsByZone.left[levelIdx] ?? []).map((s) =>
            buildHeaderGroupSpanCell(s, 'L', levelIdx),
          );
          const centerCells = (rowsByZone.center[levelIdx] ?? []).map((s) =>
            buildHeaderGroupSpanCell(s, 'C', levelIdx),
          );
          const rightCells = (rowsByZone.right[levelIdx] ?? []).map((s) =>
            buildHeaderGroupSpanCell(s, 'R', levelIdx),
          );
          const selectionPlaceholder: VNode | null = selectionColShow
            ? h('div', {
                key: `header-group-selection-L${levelIdx}`,
                class: 'cx-table-header-group cx-table-header-group--empty',
                attrs: { role: 'columnheader' },
                style: {
                  width: `${selectionColWidth}px`,
                  height: `${t.headerGroupHeight}px`,
                  background: 'transparent',
                  ...selectionRailStickyStyle,
                },
              })
            : null;
          const orderedZoneCells: VNode[] = [...leftCells, ...centerCells, ...rightCells];
          const rowChildren: VNode[] = selectionColShow
            ? selectionColSide === 'left'
              ? [selectionPlaceholder!, ...orderedZoneCells]
              : [...orderedZoneCells, selectionPlaceholder!]
            : orderedZoneCells;
          headerGroupRows.push(
            h(
              'div',
              {
                key: `header-group-row-L${levelIdx}`,
                class: 'cx-table-row cx-table-row--header-group',
                attrs: { role: 'row', 'data-header-group-level': String(levelIdx) },
                style: { width: `${totalWithRowDrag}px` },
              },
              rowChildren,
            ),
          );
        }
      }

      const headerRows: VNode[] =
        headerGroupRows.length > 0 ? [...headerGroupRows, headerRow] : [headerRow];

      // delegated header click — emits header-click with
      // resolved ColumnSpec when the click target's ancestor chain
      // includes [data-col-id]. Sort phases (42 / 42.1) will wire
      // this to setSort. Vue 2.7's `on:` vnode-data slot routes the
      // click identically to vue3's flat `onClick:`.
      //
      // `overflowX: hidden` makes header a
      // horizontal-clip container with a meaningful `scrollLeft`
      // setter; the body's `on: { scroll }` handler mirrors
      // `body.scrollLeft → headerEl.scrollLeft` so the header row
      // visually scrolls in lockstep with body cells.
      //
      // `onHeaderClick` extended with a
      // `[data-group-name]` ancestor walk so the same delegate also
      // emits `header-group-click` for the group row's labelled cells.
      const header: VNode = h(
        'div',
        {
          ref: ((el: HTMLElement | null) => {
            headerRef.value = el;
          }) as never,
          class: 'cx-table-header',
          attrs: { role: 'rowgroup' },
          style: { overflowX: 'hidden' },
          on: { click: onHeaderClick },
        },
        headerRows,
      );

      // opt-in filter row beneath the header.
      // One <input> per visible column; filterable columns get an
      // editable text input + `oninput → setFilterColumnValue`;
      // non-filterable columns get a disabled placeholder. Per-input
      // value is read from the current `filterSpec` array so external
      // `setFilter` calls reactively update the visible input text.
      // Verbatim port of vue3 form; vue2 vnode-data delta:
      // attrs goes under `attrs:`, event handlers under `on:`.
      //
      // column.type === 'number' columns get
      // a prefix-syntax placeholder hint + data-filter-type="number"
      // attr and route input through the prefix parser inside
      // setFilterColumnValue. filterInputValueFor round-trips current
      // spec via formatPrefixNumberFilter for number columns.
      // extracted filterColumnNodes so the selection-cell
      // prepend/append can compose cleanly. Identical body to the
      // inline map otherwise.
      //
      // (2026-05-31 — vue2 port): optional dual-handle
      // range slider beneath the Number filter text input. Verbatim
      // mirror of vue3 wiring.
      function renderNumberFilterRangeSlider(
        col: ColumnSpec,
        extents: { min: number; max: number },
      ): VNode {
        const range = readNumberFilterRangeForCol(col.id, extents);
        const onCommit = (next: { low: number; high: number }): void => {
          setFilterColumnValue(col.id, `${next.low}..${next.high}`);
        };
        const onPointerDownTrack = (e: PointerEvent): void => {
          const track = e.currentTarget as HTMLElement;
          const rect = track.getBoundingClientRect();
          const trackSizePx = rect.width;
          const positionPx = e.clientX - rect.left;
          const handle = computeRangeClosestHandle({
            positionPx,
            currentRange: range,
            trackSizePx,
            min: extents.min,
            max: extents.max,
          });
          numberFilterRangeDragByColId.value = {
            ...numberFilterRangeDragByColId.value,
            [col.id]: handle,
          };
          try {
            track.setPointerCapture(e.pointerId);
          } catch {
            // capture not available in happy-dom — drag still works
            // because pointermove on the track bubbles up.
          }
          const next = computeRangeValueAtPosition({
            positionPx,
            activeHandle: handle,
            currentRange: range,
            trackSizePx,
            min: extents.min,
            max: extents.max,
            step: NUMBER_FILTER_RANGE_STEP,
          });
          onCommit(next);
        };
        const onPointerMoveTrack = (e: PointerEvent): void => {
          const active = numberFilterRangeDragByColId.value[col.id] ?? null;
          if (active == null) return;
          const track = e.currentTarget as HTMLElement;
          const rect = track.getBoundingClientRect();
          const positionPx = e.clientX - rect.left;
          const currentRange = readNumberFilterRangeForCol(col.id, extents);
          const next = computeRangeValueAtPosition({
            positionPx,
            activeHandle: active,
            currentRange,
            trackSizePx: rect.width,
            min: extents.min,
            max: extents.max,
            step: NUMBER_FILTER_RANGE_STEP,
          });
          onCommit(next);
        };
        const onPointerUpTrack = (e: PointerEvent): void => {
          numberFilterRangeDragByColId.value = {
            ...numberFilterRangeDragByColId.value,
            [col.id]: null,
          };
          const track = e.currentTarget as HTMLElement;
          try {
            track.releasePointerCapture(e.pointerId);
          } catch {
            // capture may have never been set — ignore.
          }
        };
        const onKeydownThumb =
          (handle: RangeHandle) =>
          (e: KeyboardEvent): void => {
            const currentRange = readNumberFilterRangeForCol(col.id, extents);
            const result = computeRangeValueOnKey({
              key: e.key,
              activeHandle: handle,
              currentRange,
              min: extents.min,
              max: extents.max,
              step: NUMBER_FILTER_RANGE_STEP,
            });
            if (result == null) return;
            e.preventDefault();
            onCommit(result);
          };
        return h(
          'div',
          {
            class: 'cx-table-number-filter__range',
            attrs: {
              role: 'group',
              'aria-label': `${col.headerName ?? col.id} range`,
              'data-col-id': col.id,
              'data-number-filter-range': '',
            },
            style: {
              position: 'relative',
              height: '20px',
              marginTop: '4px',
              touchAction: 'none',
            },
            on: {
              pointerdown: onPointerDownTrack,
              pointermove: onPointerMoveTrack,
              pointerup: onPointerUpTrack,
              pointercancel: onPointerUpTrack,
            },
          },
          [
            h('div', {
              class: 'cx-table-number-filter__range-track',
              style: {
                position: 'absolute',
                left: 0,
                right: 0,
                top: '8px',
                height: '4px',
                background: '#e2e8f0',
              },
            }),
            h('button', {
              class: 'cx-table-number-filter__range-thumb',
              attrs: {
                type: 'button',
                'data-range-handle': 'low',
                role: 'slider',
                tabindex: '0',
                'aria-valuemin': String(extents.min),
                'aria-valuemax': String(extents.max),
                'aria-valuenow': String(range.low),
                'aria-label': `${col.headerName ?? col.id} low`,
              },
              style: {
                position: 'absolute',
                top: 0,
                width: '12px',
                height: '20px',
                marginLeft: '-6px',
                left: `${rangeThumbLeftPercent(range.low, extents)}%`,
                background: '#3b82f6',
                border: 'none',
                cursor: 'pointer',
              },
              on: {
                keydown: onKeydownThumb('low'),
              },
            }),
            h('button', {
              class: 'cx-table-number-filter__range-thumb',
              attrs: {
                type: 'button',
                'data-range-handle': 'high',
                role: 'slider',
                tabindex: '0',
                'aria-valuemin': String(extents.min),
                'aria-valuemax': String(extents.max),
                'aria-valuenow': String(range.high),
                'aria-label': `${col.headerName ?? col.id} high`,
              },
              style: {
                position: 'absolute',
                top: 0,
                width: '12px',
                height: '20px',
                marginLeft: '-6px',
                left: `${rangeThumbLeftPercent(range.high, extents)}%`,
                background: '#3b82f6',
                border: 'none',
                cursor: 'pointer',
              },
              on: {
                keydown: onKeydownThumb('high'),
              },
            }),
          ],
        );
      }
      const filterColumnNodes: VNode[] = props.showFilterRow
        ? visible.map((col) => {
            const isFilterable = col.filterable !== false;
            const isNumberColumn = col.type === 'number';
            const isSetFilterUi = col.filterUi === 'set';
            // filter-row cells inherit pinned styling so
            // they stay column-aligned with header + body cells
            // during horizontal scroll.
            const pinnedFilterStyle = pinnedCellStyle(col.id);
            const pinnedFilterClasses = pinnedCellModifierSuffixes(col.id)
              .map((suffix) => `cx-table-filter-cell${suffix}`)
              .join(' ');

            // (vue2 port): set-filter dropdown branch.
            if (isSetFilterUi && isFilterable) {
              const unique = collectUniqueColumnValues({ rows: props.rows, column: col });
              const allValues = unique.values.map((v) => v.value);
              const summaryLabel = setFilterSummaryLabel(col.id, unique.values.length);
              const totalItemCount = unique.values.length;
              // (vue2 port): verbatim mirror of vue3 Phase
              // 96.2 — threshold-gated `computeVirtualWindow`
              // virtualization for the unique-value checkbox list.
              const shouldVirtualize = totalItemCount > props.setFilterVirtualizeThreshold;
              const renderSetFilterItem = (entry: (typeof unique.values)[number]): VNode =>
                h(
                  'label',
                  {
                    key: `set-filter-item-${col.id}-${String(entry.value)}`,
                    class: 'cx-table-set-filter__item',
                  },
                  [
                    h('input', {
                      class: 'cx-table-set-filter__checkbox',
                      attrs: {
                        type: 'checkbox',
                        checked: isSetFilterValueChecked(col.id, entry.value),
                        'data-set-filter-value': String(entry.value),
                      },
                      domProps: {
                        checked: isSetFilterValueChecked(col.id, entry.value),
                      },
                      on: {
                        change: () => toggleSetFilterValue(col.id, entry.value, allValues),
                      },
                    }),
                    h(
                      'span',
                      { class: 'cx-table-set-filter__label' },
                      entry.value === null ? '(空)' : String(entry.value),
                    ),
                    h('span', { class: 'cx-table-set-filter__count' }, ` (${entry.count})`),
                  ],
                );
              let listChildren: VNode | VNode[];
              if (shouldVirtualize) {
                const scrollTop = setFilterScrollTopByColId.value[col.id] ?? 0;
                const viewportHeight = setFilterViewportHeightByColId.value[col.id] ?? 0;
                const vWindow = computeVirtualWindow({
                  totalItemCount,
                  itemHeightPx: SET_FILTER_ITEM_HEIGHT_PX,
                  scrollTop,
                  viewportHeight,
                  overscan: DEFAULT_VIRTUAL_WINDOW_OVERSCAN,
                });
                const visibleNodes = unique.values
                  .slice(vWindow.startIndex, vWindow.endIndex)
                  .map(renderSetFilterItem);
                listChildren = h(
                  'div',
                  {
                    class: 'cx-table-set-filter__sizer',
                    attrs: { 'data-set-filter-sizer': '' },
                    style: {
                      position: 'relative',
                      height: `${vWindow.totalHeightPx}px`,
                    },
                  },
                  [
                    h(
                      'div',
                      {
                        class: 'cx-table-set-filter__window',
                        attrs: {
                          'data-set-filter-window': '',
                          'data-window-start': String(vWindow.startIndex),
                          'data-window-end': String(vWindow.endIndex),
                        },
                        style: {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          transform: `translateY(${vWindow.offsetTopPx}px)`,
                        },
                      },
                      visibleNodes,
                    ),
                  ],
                );
              } else {
                listChildren = unique.values.map(renderSetFilterItem);
              }
              const panelChildren: VNode[] = [
                h('div', { class: 'cx-table-set-filter__actions' }, [
                  h(
                    'button',
                    {
                      class: 'cx-table-set-filter__action',
                      attrs: { type: 'button', 'data-action': 'select-all' },
                      on: { click: () => applySetFilterValues(col.id, null) },
                    },
                    '全选',
                  ),
                  h(
                    'button',
                    {
                      class: 'cx-table-set-filter__action',
                      attrs: { type: 'button', 'data-action': 'clear' },
                      on: { click: () => applySetFilterValues(col.id, []) },
                    },
                    '清空',
                  ),
                ]),
                h(
                  'div',
                  {
                    class: 'cx-table-set-filter__list',
                    attrs: {
                      role: 'group',
                      'data-virtualized': shouldVirtualize ? 'true' : 'false',
                    },
                    ref: ((el: HTMLElement | null) => {
                      if (!shouldVirtualize) return;
                      if (!el) return;
                      const next = el.clientHeight;
                      const prev = setFilterViewportHeightByColId.value[col.id];
                      if (prev !== next) {
                        setFilterViewportHeightByColId.value = {
                          ...setFilterViewportHeightByColId.value,
                          [col.id]: next,
                        };
                      }
                    }) as never,
                    on: {
                      scroll: (e: Event) => {
                        if (!shouldVirtualize) return;
                        const target = e.target as HTMLElement;
                        const next = target.scrollTop;
                        const prev = setFilterScrollTopByColId.value[col.id];
                        if (prev !== next) {
                          setFilterScrollTopByColId.value = {
                            ...setFilterScrollTopByColId.value,
                            [col.id]: next,
                          };
                        }
                      },
                    },
                  },
                  Array.isArray(listChildren) ? listChildren : [listChildren],
                ),
              ];
              if (unique.truncated) {
                panelChildren.push(
                  h(
                    'p',
                    { class: 'cx-table-set-filter__truncated' },
                    `已截断 (>${unique.values.length})`,
                  ),
                );
              }
              return h(
                'div',
                {
                  key: `filter-cell-${col.id}`,
                  class: pinnedFilterClasses
                    ? `cx-table-filter-cell ${pinnedFilterClasses}`
                    : 'cx-table-filter-cell',
                  attrs: {
                    'data-col-id': col.id,
                    'data-filter-ui': 'set',
                  },
                  style: {
                    width: `${widths[col.id] ?? 0}px`,
                    paddingLeft: `${t.cellPaddingX}px`,
                    paddingRight: `${t.cellPaddingX}px`,
                    ...pinnedFilterStyle,
                  },
                },
                [
                  h(
                    'details',
                    {
                      class: 'cx-table-set-filter',
                      attrs: { 'data-col-id': col.id },
                    },
                    [
                      h(
                        'summary',
                        {
                          class: 'cx-table-set-filter__summary',
                          attrs: { 'aria-label': `Filter ${col.headerName ?? col.id}` },
                        },
                        summaryLabel,
                      ),
                      h('div', { class: 'cx-table-set-filter__panel' }, panelChildren),
                    ],
                  ),
                ],
              );
            }

            // + (2026-06-02 — vue2
            // port) + (2026-06-02 — vue2 port):
            // multi-filter container branch. ships
            // recursive render via `renderMultiFilterEntries` driving
            // both root + nested groups. Verbatim mirror of vue3.
            const isMultiFilterUi = col.filterUi === 'multi';
            if (isMultiFilterUi && isFilterable) {
              const slots = col.multiFilterChildTypes ?? (['text', 'text'] as const);
              const summary = multiFilterSummaryLabel(col);
              const spec = getMultiFilterSpec(col.id);
              const effectiveRootEntries: readonly MultiFilterEntry[] =
                spec?.filters ??
                slots.map((kind) => {
                  if (kind === 'text') return { type: 'text', operator: 'contains', value: '' };
                  if (kind === 'set') return { type: 'set', selectedValues: null };
                  return { type: 'number', operator: '=', value: 0 };
                });
              const effectiveRootMode = spec?.mode ?? props.multiFilterDefaultMode;
              const slotCount = slots.length;
              let setSlotUnique: ReturnType<typeof collectUniqueColumnValues> | null = null;
              const ensureSetSlotUnique = (): ReturnType<typeof collectUniqueColumnValues> => {
                setSlotUnique ??= collectUniqueColumnValues({ rows: props.rows, column: col });
                return setSlotUnique;
              };
              const slotKindOfEntry = (entry: MultiFilterEntry): 'text' | 'number' | 'set' => {
                if (entry.type === 'group') return 'text';
                return entry.type;
              };
              const renderRemoveSlotButton = (
                slotIdx: number,
                parentPath: readonly number[],
                siblingCount: number,
              ): VNode => {
                const disabled = parentPath.length === 0 ? slotCount <= 1 : siblingCount <= 1;
                return h(
                  'button',
                  {
                    class: 'cx-table-multi-filter__remove-slot',
                    attrs: {
                      type: 'button',
                      'data-col-id': col.id,
                      'data-multi-filter-slot': String(slotIdx),
                      'data-testid': 'cx-table-multi-filter-remove-slot',
                      'aria-label': `Remove filter slot ${slotIdx + 1}`,
                      disabled: disabled ? 'disabled' : undefined,
                      'aria-disabled': disabled ? 'true' : 'false',
                    },
                    on: {
                      click: () => {
                        if (disabled) return;
                        ctx.emit('remove-multi-filter-slot', {
                          colId: col.id,
                          slotIdx,
                          path: parentPath,
                        });
                      },
                    },
                  },
                  '×',
                );
              };
              const isSetValueCheckedAtPath = (
                path: readonly number[],
                value: string | number | boolean | null,
              ): boolean => {
                if (path.length === 1) {
                  return isMultiFilterChildSetValueChecked(col, path[0]!, value);
                }
                const entry = getMultiFilterEntryAtPathInternal(col.id, path);
                if (entry?.type !== 'set') return false;
                const sel = entry.selectedValues;
                if (sel == null) return true;
                return sel.some((v) => Object.is(v, value));
              };
              const toggleSetValueAtPath = (
                path: readonly number[],
                value: string | number | boolean | null,
              ): void => {
                if (path.length === 1) {
                  toggleMultiFilterChildSetValue(col, path[0]!, value);
                  return;
                }
                const entry = getMultiFilterEntryAtPathInternal(col.id, path);
                if (entry?.type !== 'set') return;
                const sel = entry.selectedValues;
                const nextSel: readonly (string | number | boolean | null)[] =
                  sel == null
                    ? []
                    : sel.some((v) => Object.is(v, value))
                      ? sel.filter((v) => !Object.is(v, value))
                      : [...sel, value];
                setMultiFilterEntryAtPathInternal(col, path, {
                  type: 'set',
                  selectedValues: nextSel,
                });
              };
              const renderBuiltinSlotAtPath = (
                entry: MultiFilterEntry,
                slotIdx: number,
                path: readonly number[],
                siblingCount: number,
              ): VNode => {
                const slotKind = slotKindOfEntry(entry);
                if (slotKind === 'set') {
                  const unique = ensureSetSlotUnique();
                  return h('div', { class: 'cx-table-multi-filter__slot' }, [
                    h(
                      'details',
                      {
                        class: 'cx-table-multi-filter__set-slot',
                        attrs: {
                          'data-col-id': col.id,
                          'data-multi-filter-slot': String(slotIdx),
                          'data-multi-filter-slot-kind': 'set',
                        },
                      },
                      [
                        h(
                          'summary',
                          {
                            class: 'cx-table-multi-filter__set-slot-summary',
                            attrs: {
                              'aria-label': `Filter ${col.headerName ?? col.id} slot ${slotIdx + 1}`,
                            },
                          },
                          (() => {
                            if (entry.type !== 'set') return '集合筛选';
                            const sel = entry.selectedValues;
                            if (sel == null) return '全部';
                            if (sel.length === 0) return '(无)';
                            return `${sel.length} 项已选`;
                          })(),
                        ),
                        h(
                          'div',
                          { class: 'cx-table-multi-filter__set-slot-list' },
                          unique.values.map((uniqEntry) =>
                            h(
                              'label',
                              {
                                key: `multi-set-${col.id}-${path.join('-')}-${String(uniqEntry.value)}`,
                                class: 'cx-table-set-filter__item',
                              },
                              [
                                h('input', {
                                  class: 'cx-table-set-filter__checkbox',
                                  attrs: {
                                    type: 'checkbox',
                                    'data-set-filter-value': String(uniqEntry.value),
                                  },
                                  domProps: {
                                    checked: isSetValueCheckedAtPath(path, uniqEntry.value),
                                  },
                                  on: {
                                    change: () => toggleSetValueAtPath(path, uniqEntry.value),
                                  },
                                }),
                                h(
                                  'span',
                                  { class: 'cx-table-set-filter__label' },
                                  uniqEntry.value === null ? '(空)' : String(uniqEntry.value),
                                ),
                                h(
                                  'span',
                                  { class: 'cx-table-set-filter__count' },
                                  ` (${uniqEntry.count})`,
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    renderRemoveSlotButton(slotIdx, path.slice(0, -1), siblingCount),
                  ]);
                }
                const inputValue: string =
                  entry.type === 'number'
                    ? Number.isFinite(entry.value)
                      ? String(entry.value)
                      : ''
                    : entry.type === 'text'
                      ? String(entry.value)
                      : '';
                return h('div', { class: 'cx-table-multi-filter__slot' }, [
                  h('input', {
                    class: 'cx-table-multi-filter__input',
                    attrs: {
                      type: slotKind === 'number' ? 'number' : 'text',
                      inputmode: slotKind === 'number' ? 'decimal' : undefined,
                      placeholder: slotKind === 'number' ? '数值…' : '关键词…',
                      'aria-label': `Filter ${col.headerName ?? col.id} slot ${slotIdx + 1}`,
                      'data-col-id': col.id,
                      'data-multi-filter-slot': String(slotIdx),
                      'data-multi-filter-slot-kind': slotKind,
                    },
                    domProps: {
                      value: inputValue,
                    },
                    on: {
                      input: (e: Event) => {
                        const target = e.target as HTMLInputElement;
                        if (path.length === 1) {
                          setMultiFilterChildValue(col, slotIdx, target.value);
                          return;
                        }
                        const raw = target.value;
                        let nextEntry: MultiFilterEntry;
                        if (slotKind === 'number') {
                          const num = raw.trim() === '' ? Number.NaN : Number(raw);
                          nextEntry = { type: 'number', operator: '=', value: num };
                        } else {
                          nextEntry = { type: 'text', operator: 'contains', value: raw };
                        }
                        setMultiFilterEntryAtPathInternal(col, path, nextEntry);
                      },
                    },
                  }),
                  renderRemoveSlotButton(slotIdx, path.slice(0, -1), siblingCount),
                ]);
              };
              const renderLeafEntryAtPath = (
                entry: MultiFilterEntry,
                slotIdx: number,
                path: readonly number[],
                siblingCount: number,
              ): VNode => {
                const slotKind = slotKindOfEntry(entry);
                const renderer = props.multiFilterChildRenderer;
                if (renderer != null && entry.type !== 'group') {
                  const node = renderer({
                    column: col,
                    slotIdx,
                    slotKind,
                    child: entry,
                    setChildValue: (next) => {
                      setMultiFilterEntryAtPathInternal(col, path, next);
                    },
                  });
                  if (node != null) {
                    return h('div', { class: 'cx-table-multi-filter__slot' }, [
                      node,
                      renderRemoveSlotButton(slotIdx, path.slice(0, -1), siblingCount),
                    ]);
                  }
                }
                return renderBuiltinSlotAtPath(entry, slotIdx, path, siblingCount);
              };
              const renderMultiFilterEntries = (
                entries: readonly MultiFilterEntry[],
                mode: 'AND' | 'OR',
                parentPath: readonly number[],
              ): VNode => {
                const onModeChange = (nextMode: 'AND' | 'OR'): void => {
                  if (parentPath.length === 0) {
                    setMultiFilterMode(col, nextMode);
                    return;
                  }
                  const entry = getMultiFilterEntryAtPathInternal(col.id, parentPath);
                  if (entry?.type !== 'group') return;
                  if (entry.mode === nextMode) return;
                  setMultiFilterEntryAtPathInternal(col, parentPath, {
                    ...entry,
                    mode: nextMode,
                  });
                };
                const modeToggle = h(
                  'div',
                  {
                    class: 'cx-table-multi-filter__mode',
                    attrs: {
                      role: 'radiogroup',
                      'aria-label': '筛选模式',
                    },
                  },
                  [
                    h(
                      'button',
                      {
                        class:
                          'cx-table-multi-filter__mode-button' +
                          (mode === 'AND' ? ' cx-table-multi-filter__mode-button--active' : ''),
                        attrs: {
                          type: 'button',
                          role: 'radio',
                          'aria-checked': mode === 'AND' ? 'true' : 'false',
                          'data-mode': 'AND',
                        },
                        on: { click: () => onModeChange('AND') },
                      },
                      '全部满足 (AND)',
                    ),
                    h(
                      'button',
                      {
                        class:
                          'cx-table-multi-filter__mode-button' +
                          (mode === 'OR' ? ' cx-table-multi-filter__mode-button--active' : ''),
                        attrs: {
                          type: 'button',
                          role: 'radio',
                          'aria-checked': mode === 'OR' ? 'true' : 'false',
                          'data-mode': 'OR',
                        },
                        on: { click: () => onModeChange('OR') },
                      },
                      '任一满足 (OR)',
                    ),
                  ],
                );
                const entryNodes = entries.map((entry, idx) => {
                  const path = [...parentPath, idx];
                  if (entry.type === 'group') {
                    return h(
                      'details',
                      {
                        key: `multi-group-${col.id}-${path.join('-')}`,
                        class: 'cx-table-multi-filter__group',
                        attrs: {
                          'data-cx-multi-filter-group-path': path.join('.'),
                          open: 'open',
                        },
                      },
                      [
                        h('summary', { class: 'cx-table-multi-filter__group-summary' }, [
                          `分组 (${entry.mode}) · ${entry.filters.length} 条件`,
                          h(
                            'button',
                            {
                              class: 'cx-table-multi-filter__remove-group',
                              attrs: {
                                type: 'button',
                                'data-testid': 'cx-table-multi-filter-remove-group',
                                'aria-label': '移除分组',
                              },
                              on: {
                                click: (e: Event) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  ctx.emit('remove-multi-filter-group', {
                                    colId: col.id,
                                    path,
                                  });
                                },
                              },
                            },
                            '×',
                          ),
                        ]),
                        renderMultiFilterEntries(entry.filters, entry.mode, path),
                      ],
                    );
                  }
                  return renderLeafEntryAtPath(entry, idx, path, entries.length);
                });
                const addSlotBtn = h(
                  'button',
                  {
                    class: 'cx-table-multi-filter__add-slot',
                    attrs: {
                      type: 'button',
                      'data-col-id': col.id,
                      'data-testid': 'cx-table-multi-filter-add-slot',
                    },
                    on: {
                      click: () => {
                        ctx.emit('add-multi-filter-slot', {
                          colId: col.id,
                          slotKind: 'text',
                          path: parentPath,
                        });
                      },
                    },
                  },
                  '+ 添加条件',
                );
                const addGroupBtn = h(
                  'button',
                  {
                    class: 'cx-table-multi-filter__add-group',
                    attrs: {
                      type: 'button',
                      'data-col-id': col.id,
                      'data-testid': 'cx-table-multi-filter-add-group',
                    },
                    on: {
                      click: () => {
                        ctx.emit('add-multi-filter-group', { colId: col.id, path: parentPath });
                      },
                    },
                  },
                  '+ 添加分组',
                );
                return h('div', { class: 'cx-table-multi-filter__group-body' }, [
                  modeToggle,
                  h('div', { class: 'cx-table-multi-filter__slots' }, entryNodes),
                  addSlotBtn,
                  addGroupBtn,
                ]);
              };
              return h(
                'div',
                {
                  key: `filter-cell-${col.id}`,
                  class: `cx-table-filter-cell ${pinnedFilterClasses}`,
                  attrs: {
                    'data-col-id': col.id,
                    'data-filter-ui': 'multi',
                  },
                  style: {
                    width: `${widths[col.id] ?? 0}px`,
                    paddingLeft: `${t.cellPaddingX}px`,
                    paddingRight: `${t.cellPaddingX}px`,
                    ...pinnedFilterStyle,
                  },
                },
                [
                  h(
                    'details',
                    {
                      class: 'cx-table-multi-filter',
                      attrs: { 'data-col-id': col.id },
                    },
                    [
                      h(
                        'summary',
                        {
                          class: 'cx-table-multi-filter__summary',
                          attrs: {
                            'aria-label': `Multi filter ${col.headerName ?? col.id}`,
                          },
                        },
                        summary,
                      ),
                      h('div', { class: 'cx-table-multi-filter__panel' }, [
                        renderMultiFilterEntries(effectiveRootEntries, effectiveRootMode, []),
                      ]),
                    ],
                  ),
                ],
              );
            }

            const value = filterInputValueFor(col.id);
            const placeholder = !isFilterable
              ? ''
              : isNumberColumn
                ? '过滤 (e.g. 5, >10, 5..50)'
                : '过滤…';
            let rangeSliderNode: VNode | null = null;
            if (props.numberFilterShowRangeSlider && isNumberColumn && isFilterable) {
              const extents = computeColumnNumericExtents({ rows: props.rows, column: col });
              if (extents !== null) {
                rangeSliderNode = renderNumberFilterRangeSlider(col, extents);
              }
            }
            const cellChildren: VNode[] = [
              h('input', {
                class: 'cx-table-filter-input',
                attrs: {
                  type: 'text',
                  value,
                  disabled: !isFilterable,
                  placeholder,
                  'aria-label': `Filter ${col.headerName ?? col.id}`,
                  'data-col-id': col.id,
                  'data-filter-type': isNumberColumn ? 'number' : 'text',
                },
                on: {
                  input: (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    setFilterColumnValue(col.id, target.value);
                  },
                },
              }),
            ];
            if (rangeSliderNode !== null) {
              cellChildren.push(rangeSliderNode);
            }
            return h(
              'div',
              {
                key: `filter-cell-${col.id}`,
                class: pinnedFilterClasses
                  ? `cx-table-filter-cell ${pinnedFilterClasses}`
                  : 'cx-table-filter-cell',
                attrs: { 'data-col-id': col.id },
                style: {
                  width: `${widths[col.id] ?? 0}px`,
                  paddingLeft: `${t.cellPaddingX}px`,
                  paddingRight: `${t.cellPaddingX}px`,
                  ...pinnedFilterStyle,
                },
              },
              cellChildren,
            );
          })
        : [];
      // filter row also gets a (placeholder) selection cell
      // so columns stay aligned vertically with the header + body.
      const filterRowChildren: VNode[] = !props.showFilterRow
        ? []
        : selectionColShow
          ? selectionColSide === 'left'
            ? [buildFilterSelectionCell(), ...filterColumnNodes]
            : [...filterColumnNodes, buildFilterSelectionCell()]
          : filterColumnNodes;
      const filterRow: VNode | null = props.showFilterRow
        ? h(
            'div',
            {
              ref: ((el: HTMLElement | null) => {
                filterRowRef.value = el;
              }) as never,
              class: 'cx-table-filter-row',
              attrs: { role: 'rowgroup' },
              // mirror the header's outer-clip
              // / inner-content-row structure so the body's
              // `scrollLeft` can be programmatically mirrored to
              // `filterRowEl.scrollLeft` (default `overflow: visible`
              // ignores `scrollLeft`).
              style: { overflowX: 'hidden' },
            },
            [
              h(
                'div',
                {
                  class: 'cx-table-filter-row-content',
                  style: { width: `${totalWithRowDrag}px` },
                },
                filterRowChildren,
              ),
            ],
          )
        : null;

      // + + virtualRowsPass returns the
      // windowed subset; the pre-mount frame (bodyClientHeight === 0)
      // yields an empty visibleRows array — fall back to `pagedRows`
      // so first paint reflects current sort + page slice. `pagedRows`
      // is identity-equal to `sortedRows` when pagination is disabled
      // (pagePass passthrough), preserving the pre-mount
      // fallback semantic for non-paginated tables.
      /**
       * narrow an `unknown` draft value into a
       * displayable string for the editor `<input>.value` binding.
       * Mirrors the spirit of `defaultFormatCellValue` but always
       * yields a string (the input element requires a string value).
       * Objects fall back to `''` to avoid the `[object Object]`
       * stringification trap (and because there's no sensible
       * round-trip back). Verbatim port of vue3 .
       */
      function editorDraftToString(raw: unknown): string {
        if (raw == null) return '';
        if (typeof raw === 'string') return raw;
        if (typeof raw === 'number' || typeof raw === 'boolean' || typeof raw === 'bigint') {
          return String(raw);
        }
        if (raw instanceof Date) return raw.toISOString();
        return '';
      }

      /**
       * build the in-cell text editor `<input>`.
       * Auto-focus + select-all-text on mount via the `ref` callback.
       * Keydown handlers: Enter/Tab commits, Esc cancels; blur
       * commits (Notion/Sheets convention). All key handlers set
       * `editCommitInProgressRef` BEFORE calling commit/cancel so
       * the subsequent native blur (triggered by removing the input
       * from DOM) doesn't double-fire.
       *
       * Vue 2.7 vnode-data deltas:
       * - `attrs: inputAttrs` — mutable Record holding `type` (and
       *   `inputmode` for the number variant). Matches /
       *   45.1's established mutable-Record pattern for conditional
       *   attrs.
       * - `domProps: { value: editorDraftToString(...) }` for the
       *   reactive DOM property (Vue 2's render layer treats input
       *   `value` / select `value` / checkbox `checked` as DOM
       *   properties, not HTML attributes — matches
       *   checkbox precedent).
       * - `on: { input, blur, keydown, click }` (NOT vue3's flat
       *   `onInput` / `onBlur` / `onKeydown` / `onClick`).
       * - `ref: (el) => { ... } as never` — the `as never` cast is
       *   the established vue2 ref pattern (Vue 2's ref signature
       *   is wider; the cast bridges).
       *
       * dispatch on `column.type === 'number'`
       * to render `<input type="number">` instead of `<input
       * type="text">` for numeric columns. The number variant also
       * sets `inputmode="decimal"` as a mobile soft-keyboard hint.
       * Coercion of the raw string draft to a typed value happens
       * in `applyEditCommit` via `coerceEditDraftValue`, NOT here.
       */
      /**
       * (vue2 port, 2026-05-28): chevron SVG / leaf spacer
       * for the tree column (Decision I.1). For parent rows, renders a
       * clickable chevron with the `--expanded` modifier class when
       * the row is expanded. For leaf rows, renders a fixed-width
       * spacer so leaf cells stay column-aligned with parent cells at
       * the same depth.
       *
       * Chevron click handler calls `e.stopPropagation()` to suppress
       * row-click + cell-click delegated handlers. Vue 2 uses the
       * `attrs:` vnode-data slot for `role` / `aria-*` / `data-*`.
       */
      function renderTreeChevronOrSpacer(
        hasChildren: boolean,
        expanded: boolean,
        rowId: string,
      ): VNode {
        // (2026-05-28 — vue2 port): dispatch on lazy status.
        const lazyState = lazyChildrenStateRef.value.get(rowId);
        if (lazyState?.status === 'loading') {
          return h(
            'span',
            {
              class: 'cx-table-tree-spinner',
              attrs: {
                role: 'status',
                'aria-label': 'Loading children',
                'data-tree-spinner': rowId,
              },
              style: { color: 'var(--cx-table-tree-spinner-color, #5a6675)' },
            },
            [
              h(
                'svg',
                {
                  class: 'cx-table-tree-spinner-svg',
                  attrs: { width: 12, height: 12, viewBox: '0 0 12 12', 'aria-hidden': 'true' },
                  style: { animation: 'cx-table-tree-spinner-rotate 1s linear infinite' },
                },
                [
                  h('circle', {
                    attrs: {
                      cx: 6,
                      cy: 6,
                      r: 4,
                      fill: 'none',
                      stroke: 'currentColor',
                      'stroke-width': 1.5,
                      'stroke-dasharray': '6 18',
                    },
                  }),
                ],
              ),
            ],
          );
        }
        if (lazyState?.status === 'error') {
          return h(
            'span',
            {
              class: 'cx-table-tree-error-icon',
              attrs: {
                role: 'button',
                'aria-label': 'Retry load',
                'data-tree-error': rowId,
              },
              style: {
                color: 'var(--cx-table-tree-error-color, #dc2626)',
                cursor: 'pointer',
              },
              on: {
                click: (e: MouseEvent) => {
                  e.stopPropagation();
                  applyLazyChevronClick(rowId);
                },
              },
            },
            [
              h(
                'svg',
                { attrs: { width: 12, height: 12, viewBox: '0 0 12 12', 'aria-hidden': 'true' } },
                [
                  h('path', {
                    attrs: {
                      d: 'M6 1 L11 11 L1 11 Z',
                      fill: 'none',
                      stroke: 'currentColor',
                      'stroke-width': 1.5,
                      'stroke-linejoin': 'round',
                    },
                  }),
                  h('path', {
                    attrs: {
                      d: 'M6 5 L6 8',
                      stroke: 'currentColor',
                      'stroke-width': 1.5,
                      'stroke-linecap': 'round',
                    },
                  }),
                  h('circle', { attrs: { cx: 6, cy: 9.5, r: 0.6, fill: 'currentColor' } }),
                ],
              ),
            ],
          );
        }
        if (!hasChildren) {
          return h('span', {
            class: 'cx-table-tree-chevron-spacer',
            attrs: { 'aria-hidden': 'true' },
          });
        }
        const classList = ['cx-table-tree-chevron'];
        if (expanded) classList.push('cx-table-tree-chevron--expanded');
        return h(
          'span',
          {
            class: classList,
            attrs: {
              role: 'button',
              'aria-label': expanded ? 'Collapse row' : 'Expand row',
              'aria-expanded': expanded ? 'true' : 'false',
              'data-tree-chevron': rowId,
            },
            on: {
              click: (e: MouseEvent) => {
                e.stopPropagation();
                if (expanded) {
                  abortLazyLoadIfInflight(rowId);
                  treeExpandState.toggle(rowId);
                } else {
                  applyLazyChevronClick(rowId);
                }
              },
            },
          },
          [
            h(
              'svg',
              {
                attrs: {
                  width: 12,
                  height: 12,
                  viewBox: '0 0 12 12',
                  'aria-hidden': 'true',
                },
              },
              [
                h('polygon', {
                  attrs: {
                    points: '3,2 9,6 3,10',
                    fill: 'currentColor',
                  },
                }),
              ],
            ),
          ],
        );
      }

      function buildCellEditorInput(edit: EditingCell, theme: ChronixTableTheme): VNode {
        const column = columnTable.value.getById(edit.colId);
        const isNumberEditor = column?.type === 'number';
        const inputAttrs: Record<string, string> = isNumberEditor
          ? { type: 'number', inputmode: 'decimal' }
          : { type: 'text' };
        return h('input', {
          key: `editor-${edit.rowId}-${edit.colId}`,
          class: 'cx-table-cell-editor',
          attrs: inputAttrs,
          domProps: { value: editorDraftToString(edit.draftValue) },
          style: {
            paddingLeft: `${theme.cellPaddingX}px`,
            paddingRight: `${theme.cellPaddingX}px`,
          },
          ref: ((el: unknown) => {
            if (el == null) return;
            const input = el as HTMLInputElement;
            if (input.tagName !== 'INPUT') return;
            // Defer focus + select to the next microtask so Vue has
            // committed the DOM patch + parent layout is stable.
            // happy-dom (test env) executes microtasks synchronously
            // so this works in both real DOM + tests.
            queueMicrotask(() => {
              if (document.activeElement === input) return;
              input.focus();
              input.select();
            });
          }) as never,
          on: {
            input: (e: Event) => {
              const target = e.target as HTMLInputElement;
              applyEditDraft(target.value);
            },
            keydown: (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                editCommitInProgressRef.value = true;
                applyEditCommit();
                editCommitInProgressRef.value = false;
              } else if (e.key === 'Tab') {
                // Tab commits THEN auto-
                // advances to the next editable cell in display order
                // (forward by default; Shift+Tab backward).
                // rejection path is preserved — if the commit was
                // rejected (editingCellRef still set), do NOT
                // auto-advance so the user can fix the bad input.
                //
                // The `editCommitInProgressRef` guard MUST stay true
                // across the auto-advance step AND the subsequent
                // microtask. When Vue removes the old `<input>` from
                // the DOM (because the editor's key changes from
                // `editor-{prevRow}-{prevCol}` to
                // `editor-{nextRow}-{nextCol}`), the removed element
                // dispatches a native `blur` event asynchronously. If
                // the guard were already cleared, that blur's handler
                // would re-fire `applyEditCommit` and erase the
                // freshly-installed auto-advance editor. We defer the
                // guard reset to `queueMicrotask` so the blur fires
                // while the guard is still set.
                e.preventDefault();
                const prevRowId = edit.rowId;
                const prevColId = edit.colId;
                const direction: 'forward' | 'backward' = e.shiftKey ? 'backward' : 'forward';
                editCommitInProgressRef.value = true;
                applyEditCommit();
                if (editingCellRef.value != null) {
                  // rejection — editor stays on the bad cell.
                  editCommitInProgressRef.value = false;
                  return;
                }
                const next = findNextEditableCell(
                  prevRowId,
                  prevColId,
                  pagedRows.value.map((r) => r.id),
                  columnTable.value.columns,
                  direction,
                );
                if (next != null) {
                  applyEditStart(next.rowId, next.colId);
                }
                queueMicrotask(() => {
                  editCommitInProgressRef.value = false;
                });
              } else if (e.key === 'Escape') {
                e.preventDefault();
                editCommitInProgressRef.value = true;
                applyEditCancel();
                editCommitInProgressRef.value = false;
              }
            },
            blur: () => {
              if (editCommitInProgressRef.value) return;
              // Decision C.1 (vue3): blur commits
              // (Notion semantic).
              applyEditCommit();
            },
            // Stop click from bubbling up to the body delegated handler
            // and re-triggering row-click / selection mutation.
            click: (e: MouseEvent) => e.stopPropagation(),
          },
        });
      }

      const rowsToRender = bodyClientHeight.value > 0 ? visibleRows.value : pagedRows.value;
      const bodyRows: VNode[] = rowsToRender.map((row) => {
        // per-row height from `rowLayoutPass`. Falls back
        // to the theme default if a row id is missing from the map
        // (defensive; the pass always populates every input row).
        const rowH = rowHs[row.id] ?? t.rowHeight;
        // (2026-05-29 — vue2 port): server-side row model
        // skeleton placeholder. Verbatim mirror of vue3 with
        // vue2 vnode-data delta (aria-* under `attrs:`).
        if (isServerSideSkeletonRowId(row.id)) {
          const skeletonCells: VNode[] = visible.map((col) =>
            h(
              'div',
              {
                key: `cell-${row.id}-${col.id}`,
                class: 'cx-table-cell cx-table-cell--skeleton',
                attrs: {
                  role: 'gridcell',
                  'data-col-id': col.id,
                  'data-row-id': row.id,
                  'aria-colindex': String(ariaColIndexFor(col.id)),
                },
                style: {
                  width: `${widths[col.id] ?? 0}px`,
                  height: `${rowH}px`,
                  paddingLeft: `${t.cellPaddingX}px`,
                  paddingRight: `${t.cellPaddingX}px`,
                },
              },
              [h('div', { class: 'cx-table-cell-skeleton-bar' })],
            ),
          );
          return h(
            'div',
            {
              key: `row-${row.id}`,
              class: 'cx-table-row cx-table-row--skeleton',
              attrs: {
                role: 'row',
                'data-row-id': row.id,
                'aria-rowindex': String(ariaRowIndexForBody(row.id)),
              },
              style: {
                position: 'absolute',
                top: `${rowYs[row.id] ?? 0}px`,
                left: '0',
                width: `${totalWithRowDrag}px`,
                height: `${rowH}px`,
              },
            },
            skeletonCells,
          );
        }
        const cellNodes: VNode[] = visible.map((col) => {
          // compute the value once, share between formatter
          // + class resolver. `getCellValue` applies col.valueGetter or
          // default field-based extraction; `formatCellValue` applies
          // col.valueFormatter or defaultFormatCellValue;
          // `resolveCellClassNames` normalizes static/array/function
          // cellClass into a flat string[] of class additions on top
          // of the structural `cx-table-cell`. Verbatim port of vue3
          // wiring at commit `34660d5`. Vue 2.7's `h()`
          // flattens array `class:` values identically to Vue 3.
          const value = getCellValue({ row, column: col });
          // -A (2026-05-30 — vue2 port): row-number column override.
          const isRowNumberCol = col.rowNumber === true;
          const rowNumberIndex = isRowNumberCol
            ? displayedRowIndexByRowId.value[row.id]
            : undefined;
          // -B (2026-05-30 — vue2 port): actions column flag.
          const isActionsCol = col.actions != null && col.actions.length > 0;
          const text = isRowNumberCol
            ? rowNumberIndex != null
              ? String(rowNumberIndex + 1)
              : ''
            : col.valueFormatter != null
              ? col.valueFormatter({ value, row, column: col })
              : formatCellValue({ row, column: col });
          const extraClasses = resolveCellClassNames({ value, row, column: col });
          // when this cell is the active edit
          // cell, render the `<input>` editor in place of the text.
          // The cell still carries its data-* attrs + base styling so
          // consumers observing the cell DOM see consistent structure.
          const editingThisCell: EditingCell | null =
            activeEdit?.rowId === row.id && activeEdit.colId === col.id ? activeEdit : null;
          const classList = ['cx-table-cell', ...extraClasses];
          if (editingThisCell != null) classList.push('cx-table-cell--editing');
          // (2026-06-01 — vue2 port): invalid-cell marker
          // class. Painted when a prior commit attempt was rejected by
          // `column.validator`; cleared by next commit-success /
          // cancel on the same cell.
          const cellInvalidError = invalidCellsRef.value.get(invalidCellKey(row.id, col.id));
          const isInvalidCell = cellInvalidError != null;
          if (isInvalidCell) classList.push('cx-table-cell--invalid');
          // (2026-06-01 — vue2 port): in-flight async
          // validation marker. Verbatim mirror of vue3.
          const isValidatingCell = pendingAsyncValidationByKey.value.has(
            invalidCellKey(row.id, col.id),
          );
          if (isValidatingCell) classList.push('cx-table-cell--validating');
          // -C (2026-05-30 — vue2 port): wrap-text modifier.
          if (col.wrapText === true) classList.push('cx-table-cell--wrap-text');
          // -A (2026-05-30 — vue2 port): row-number marker class.
          if (isRowNumberCol) classList.push('cx-table-cell--row-number');
          // -B (2026-05-30 — vue2 port): actions marker class.
          if (isActionsCol) classList.push('cx-table-cell--actions');
          // (vue2 port of vue3): active-cell modifier.
          const isActiveCell =
            activeCellRef.value?.rowId === row.id && activeCellRef.value.colId === col.id;
          if (isActiveCell) classList.push('cx-table-cell--active');
          // (2026-05-26 — vue2 port of vue3): paint
          // the cell-range modifier when this cell falls inside the
          // resolved envelope. O(1) lookup via the Set-derived
          // computed values.
          const inCellRange =
            cellRangeRowSet.value.has(row.id) && cellRangeColSet.value.has(col.id);
          if (inCellRange) classList.push('cx-table-cell--in-cell-range');
          // (2026-05-27 — vue2 port of vue3): preview
          // class for cells in the drag-fill extension envelope.
          if (dragFillPreviewSet.value.has(`${row.id}/${col.id}`)) {
            classList.push('cx-table-cell--in-fill-preview');
          }
          // (2026-05-26 — vue2 port of vue3):
          // pinned-zone modifier classes + sticky inline style.
          // Center columns get neither.
          const pinnedCellSuffixes = pinnedCellModifierSuffixes(col.id);
          for (const suffix of pinnedCellSuffixes) {
            classList.push(`cx-table-cell${suffix}`);
          }
          const pinnedBodyStyle = pinnedCellStyle(col.id);
          // (vue2 port, 2026-05-28): tree-column chevron +
          // indent. Decision D.1 + I.1 + J.1. Only the column flagged
          // with `treeColumn: true` (or implicit fallback) renders the
          // chevron; non-tree columns receive no extra padding.
          const isTreeColumn = treeColumnIdRef.value === col.id;
          const treeActive = isTreeColumn;
          let treeIndentLeft = 0;
          let treeLeadingNode: VNode | null = null;
          if (treeActive) {
            const rowDepth = row.depth ?? 0;
            treeIndentLeft = rowDepth * t.treeIndentPx;
            // hasChildren OR sync children both mean "show chevron."
            const rowHasChildren =
              (row.children != null && row.children.length > 0) || row.hasChildren === true;
            const rowExpanded = effectiveExpandedRowIdsSet.value.has(row.id);
            treeLeadingNode = renderTreeChevronOrSpacer(rowHasChildren, rowExpanded, row.id);
          }
          // (2026-05-29 — vue2 port): quick-find highlight.
          // Only applies when needle non-empty + column filterable !== false.
          // Plain-string text only; consumer cellRenderer VNodes skip.
          // Verbatim port of vue3 . Match segments wrapped in
          // <span>; non-match segments wrapped in <span> too (vue2's `h`
          // children array requires VNode[], not mixed VNode|string).
          const renderedText: VNode[] | string = (() => {
            if (typeof text !== 'string') return text;
            const needle = quickFindText.value;
            if (needle === '' || col.filterable === false) return text;
            const segments = splitTextByQuickFindMatch(text, needle);
            if (!segments.some((s) => s.isMatch)) return text;
            return segments.map<VNode>((seg) =>
              seg.isMatch
                ? h('span', { class: 'cx-table-cell__find-match' }, seg.text)
                : h('span', {}, seg.text),
            );
          })();
          const cellChildren: VNode[] | string =
            isActionsCol && col.actions != null
              ? [buildActionsCellChildren(col.actions, row)]
              : editingThisCell != null
                ? [buildCellEditorInput(editingThisCell, t)]
                : treeActive
                  ? [
                      ...(treeLeadingNode != null ? [treeLeadingNode] : []),
                      h(
                        'span',
                        { class: 'cx-table-cell-tree-label' },
                        typeof renderedText === 'string' ? renderedText : renderedText,
                      ),
                    ]
                  : renderedText;
          // per-cell pointer handlers — gated on
          // `cellRangeSelection === 'enabled'` (the gate runs INSIDE
          // each handler so we avoid conditional handler attachment
          // that would force a re-render dance on prop toggle).
          const cellRangeEnabled = props.cellRangeSelection === 'enabled';
          // (2026-05-31 — vue2 port): per-cell row-drag grip
          // wiring; verbatim mirror of vue3.
          const isRowDragHandleCell =
            col.rowDragHandle === true &&
            !rowDragColumnShow &&
            row.draggable !== false &&
            row.pinned == null;
          const cellOn: Record<string, (e: PointerEvent | MouseEvent) => void> = isRowDragHandleCell
            ? {
                pointerdown: (e) => {
                  onRowDragPointerDown(row.id, e as PointerEvent);
                },
              }
            : cellRangeEnabled
              ? {
                  pointerdown: (e) => {
                    onCellPointerdown(row.id, col.id, e as PointerEvent);
                  },
                  pointermove: (e) => {
                    onCellPointermove(e as PointerEvent);
                  },
                  pointerup: (e) => {
                    onCellPointerup(e as PointerEvent);
                  },
                  pointercancel: (e) => {
                    onCellPointercancel(e as PointerEvent);
                  },
                  // Vue 2 vnode-data form: '!click' = capture phase click
                  // (template equivalent of `@click.capture`).
                  '!click': (e) => {
                    onCellShiftClick(row.id, col.id, e);
                  },
                }
              : {};
          // -B (2026-05-30 — vue2 port): cell right-click
          // intercept. Verbatim mirror of vue3.
          if (props.contextMenu != null && props.contextMenu.items.length > 0) {
            cellOn['contextmenu'] = (e) => {
              onCellContextMenu(row.id, col.id, e);
            };
          }
          return h(
            'div',
            {
              key: `cell-${row.id}-${col.id}`,
              class: [
                ...classList,
                ...(isRowDragHandleCell ? ['cx-table-row-drag-handle-cell'] : []),
              ],
              attrs: {
                role: 'gridcell',
                'data-col-id': col.id,
                'data-row-id': row.id,
                'aria-colindex': String(ariaColIndexFor(col.id)),
                ...(isActiveCell ? { 'data-active': 'true' } : {}),
                ...(isRowDragHandleCell ? { 'data-row-drag-handle': 'cell' } : {}),
                ...(isInvalidCell ? { 'data-cell-invalid': 'true', 'aria-invalid': 'true' } : {}),
                ...(isValidatingCell
                  ? { 'data-cell-validating': 'true', 'aria-busy': 'true' }
                  : {}),
              },
              style: {
                width: `${widths[col.id] ?? 0}px`,
                // -C (2026-05-30 — vue2 port): auto-height
                // cells use min-height to allow content growth.
                ...(props.enableRowAutoHeight
                  ? { minHeight: `${rowH}px` }
                  : { height: `${rowH}px` }),
                paddingLeft: `${t.cellPaddingX + treeIndentLeft}px`,
                paddingRight: `${t.cellPaddingX}px`,
                ...pinnedBodyStyle,
                ...(isRowDragHandleCell ? { cursor: 'grab' } : {}),
                // + 99.2.1 + 99.2.2 + 99.2.3 (2026-06-01 —
                // vue2 port): 9 conditional spreads for the 9 cell
                // style axes. Verbatim mirror of vue3.
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.backgroundColor !==
                undefined
                  ? {
                      backgroundColor:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.backgroundColor,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.color !== undefined
                  ? { color: effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.color }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.fontWeight !== undefined
                  ? {
                      fontWeight: effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.fontWeight,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.fontStyle !== undefined
                  ? { fontStyle: effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.fontStyle }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.textDecoration !==
                undefined
                  ? {
                      textDecoration:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.textDecoration,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderColor !==
                undefined
                  ? {
                      borderColor:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderColor,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderWidth !==
                undefined
                  ? {
                      borderWidth:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderWidth,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderStyle !==
                undefined
                  ? {
                      borderStyle:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderStyle,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderRadius !==
                undefined
                  ? {
                      borderRadius:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderRadius,
                    }
                  : {}),
                // (2026-06-01 — vue2 port): 12 per-side
                // border longhand overrides. Verbatim mirror of vue3.
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderTopColor !==
                undefined
                  ? {
                      borderTopColor:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderTopColor,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderTopWidth !==
                undefined
                  ? {
                      borderTopWidth:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderTopWidth,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderTopStyle !==
                undefined
                  ? {
                      borderTopStyle:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderTopStyle,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderRightColor !==
                undefined
                  ? {
                      borderRightColor:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderRightColor,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderRightWidth !==
                undefined
                  ? {
                      borderRightWidth:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderRightWidth,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderRightStyle !==
                undefined
                  ? {
                      borderRightStyle:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderRightStyle,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderBottomColor !==
                undefined
                  ? {
                      borderBottomColor:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderBottomColor,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderBottomWidth !==
                undefined
                  ? {
                      borderBottomWidth:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderBottomWidth,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderBottomStyle !==
                undefined
                  ? {
                      borderBottomStyle:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderBottomStyle,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderLeftColor !==
                undefined
                  ? {
                      borderLeftColor:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderLeftColor,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderLeftWidth !==
                undefined
                  ? {
                      borderLeftWidth:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderLeftWidth,
                    }
                  : {}),
                ...(effectiveCellStyleByRowIdColId.value[row.id]?.[col.id]?.borderLeftStyle !==
                undefined
                  ? {
                      borderLeftStyle:
                        effectiveCellStyleByRowIdColId.value[row.id]![col.id]!.borderLeftStyle,
                    }
                  : {}),
              } as Record<string, string>,
              on: cellOn,
            },
            cellChildren,
          );
        });
        // body rows are absolute-positioned children of
        // `.cx-table-body` (position: relative + explicit
        // totalBodyHeight). Sets up virtualisation with
        // zero refactor — virtualRowsPass only changes which rows
        // render, not the per-row positioning.
        //
        // rows in the active selection set carry the
        // `cx-table-row--selected` modifier + `aria-selected="true"`.
        // Verbatim port of vue3; vue2 vnode-data delta:
        // aria-selected goes under `attrs:`.
        //
        // optionally prepend / append a per-row selection
        // cell (checkbox) on the configured side.
        const isSelected = selSet.has(row.id);
        // (vue2 port): row-drag modifier classes + grip cell.
        const isRowDragSource = movingRowRef.value?.rowId === row.id;
        const rowDropTarget = movingRowRef.value?.dropTarget;
        const isRowDropTargetAbove =
          rowDropTarget?.targetRowId === row.id && rowDropTarget.position === 'above';
        const isRowDropTargetBelow =
          rowDropTarget?.targetRowId === row.id && rowDropTarget.position === 'below';
        // -C (2026-05-30 — vue2 port): auto-height row uses
        // min-height so content can grow beyond defaultRowHeight.
        const rowAutoHeight = props.enableRowAutoHeight === true;
        const rowClass = [
          'cx-table-row',
          isSelected && 'cx-table-row--selected',
          isRowDragSource && 'cx-table-row--moving',
          isRowDropTargetAbove && 'cx-table-row--drop-target-above',
          isRowDropTargetBelow && 'cx-table-row--drop-target-below',
          rowAutoHeight && 'cx-table-row--auto-height',
        ]
          .filter(Boolean)
          .join(' ');
        const rowAttrs: Record<string, string> = {
          role: 'row',
          'data-row-id': row.id,
          'aria-rowindex': String(ariaRowIndexForBody(row.id)),
        };
        if (isSelected) rowAttrs['aria-selected'] = 'true';
        const gripCell: VNode | null = rowDragColumnShow ? buildRowDragGripCell(row, rowH) : null;
        const rowChildrenWithSelection: VNode[] = selectionColShow
          ? selectionColSide === 'left'
            ? [buildBodySelectionCell(row.id, rowH), ...cellNodes]
            : [...cellNodes, buildBodySelectionCell(row.id, rowH)]
          : cellNodes;
        const rowChildren: VNode[] = gripCell
          ? rowDragColumnSide === 'left'
            ? [gripCell, ...rowChildrenWithSelection]
            : [...rowChildrenWithSelection, gripCell]
          : rowChildrenWithSelection;
        return h(
          'div',
          {
            key: `row-${row.id}`,
            class: rowClass,
            attrs: rowAttrs,
            style: {
              position: 'absolute',
              top: `${rowYs[row.id] ?? 0}px`,
              left: '0',
              width: `${totalWithRowDrag}px`,
              ...(rowAutoHeight ? { minHeight: `${rowH}px` } : { height: `${rowH}px` }),
            },
            ...(rowAutoHeight
              ? {
                  hook: {
                    insert: (vnode: VNode) => {
                      const el = vnode.elm;
                      if (el instanceof HTMLElement) observeRowEl(el);
                    },
                    destroy: (vnode: VNode) => {
                      const el = vnode.elm;
                      if (el instanceof HTMLElement) unobserveRowEl(el);
                    },
                  },
                }
              : {}),
          },
          rowChildren,
        );
      });

      // split body into scrollport + virtual-content layer.
      // Outer `.cx-table-body` captures scroll + height via
      // `useTableBodyScroll`; inner `.cx-table-body-content` hosts the
      // absolute-positioned rows + carries the full `totalBodyHeight`
      // so the scrollbar matches the virtual dataset size even when
      // only a windowed subset of rows is in the DOM.
      // (2026-05-27 — vue2 port of vue3): drag-fill
      // handle overlay. Verbatim port of vue3's `dragFillHandle` —
      // rendered as the last child of `.cx-table-body-content`.
      // Visible iff `cellRangeSelection === 'enabled'` AND the envelope
      // is non-empty. Position is computed from `rowYByRowId[lastRow] +
      // rowHeight(lastRow)` for top + cumulative sum of `widthByColId`
      // up to and including the envelope's last col for left (selection-
      // rail-aware). z-index 4 keeps it above pinned cells (z-index 2-3).
      const dragFillHandle: VNode | null = (() => {
        if (props.cellRangeSelection !== 'enabled') return null;
        const env = cellRangeEnvelope.value;
        if (env.rowIds.length === 0 || env.colIds.length === 0) return null;
        const lastRowId = env.rowIds[env.rowIds.length - 1]!;
        const lastColId = env.colIds[env.colIds.length - 1]!;
        const top = (rowYs[lastRowId] ?? 0) + (rowHs[lastRowId] ?? t.rowHeight);
        let left = 0;
        for (const col of visible) {
          left += widths[col.id] ?? 0;
          if (col.id === lastColId) break;
        }
        if (selectionColShow && selectionColSide === 'left') {
          left += selectionColWidth;
        }
        return h('div', {
          class: 'cx-table-drag-fill-handle',
          attrs: { 'data-testid': 'cx-drag-fill-handle' },
          style: {
            position: 'absolute',
            top: `${top - 4}px`,
            left: `${left - 4}px`,
            width: '8px',
            height: '8px',
            background: 'var(--cx-table-drag-fill-handle-color, #2563eb)',
            border: '1px solid white',
            boxSizing: 'border-box',
            cursor: 'crosshair',
            zIndex: 4,
            touchAction: 'none',
          },
          on: {
            pointerdown: onDragFillPointerdown,
            pointermove: onDragFillPointermove,
            pointerup: onDragFillPointerup,
            pointercancel: onDragFillPointercancel,
          },
        });
      })();

      const bodyContentChildren: VNode[] =
        dragFillHandle != null ? [...bodyRows, dragFillHandle] : bodyRows;

      const bodyContent: VNode = h(
        'div',
        {
          class: 'cx-table-body-content',
          style: {
            position: 'relative',
            width: `${totalWithRowDrag}px`,
            height: `${bodyHeight}px`,
          },
          // delegated event handlers (one set per body
          // content layer, not per row). With virtualization
          // rows mount/unmount on scroll; per-row listeners would
          // thrash the registry. The handlers walk up from
          // `event.target` to the closest [data-row-id] /
          // [data-col-id] ancestor and emit with typed payloads.
          // Vue 2.7 takes event listeners under `on:` (not vue3's
          // flat `onClick` / `onPointerover` / `onPointerout` keys).
          on: {
            click: onBodyContentClick,
            // dblclick is independent of click in the
            // browser event model; the SFC delegates it symmetrically.
            dblclick: onBodyContentDblclick,
            pointerover: onBodyContentPointerover,
            pointerout: onBodyContentPointerout,
            // (2026-05-28 — vue2 port): cell-tooltip delay
            // timer driven by pointermove delegated at the body-content
            // layer.
            pointermove: onBodyContentTooltipPointermove,
          },
        },
        bodyContentChildren,
      );

      // (2026-05-28 — vue2 port of vue3): pinned rows.
      // Sticky-positioned inside the body scroll container; never
      // participate in filter / sort / page / virtualization (per
      // pinnedRowsPass A.1 + C.1). Cells reuse the per-cell value +
      // class + pinned-column-zone logic; skip edit / range / drag-
      // fill / tree-chevron features (read-only summary rows v1).
      const topPinned = topPinnedRows.value;
      const bottomPinned = bottomPinnedRows.value;
      function buildPinnedRowVNode(
        row: RowSpec,
        position: 'top' | 'bottom',
        zoneIndex: number,
        zoneCount: number,
      ): VNode {
        const rowH = row.heightHint ?? t.rowHeight;
        const stickyAnchor: Record<string, string> =
          position === 'top'
            ? { top: `${zoneIndex * rowH}px` }
            : { bottom: `${(zoneCount - 1 - zoneIndex) * rowH}px` };
        const cellNodes: VNode[] = visible.map((col) => {
          const value = getCellValue({ row, column: col });
          const text =
            col.valueFormatter != null
              ? col.valueFormatter({ value, row, column: col })
              : formatCellValue({ row, column: col });
          const extraClasses = resolveCellClassNames({ value, row, column: col });
          const classList = ['cx-table-cell', 'cx-table-cell--pinned-row', ...extraClasses];
          const pinnedSuffixes = pinnedCellModifierSuffixes(col.id);
          for (const suffix of pinnedSuffixes) {
            classList.push(`cx-table-cell${suffix}`);
          }
          const pinnedStyle = pinnedCellStyle(col.id);
          const isPinnedCol = pinnedLeftSet.has(col.id) || pinnedRightSet.has(col.id);
          const cellZIndex = isPinnedCol ? 4 : t.pinnedRowZIndex;
          return h(
            'div',
            {
              key: `pinned-${position}-cell-${row.id}-${col.id}`,
              class: classList.join(' '),
              attrs: {
                role: 'gridcell',
                'data-col-id': col.id,
                'data-row-id': row.id,
                'aria-colindex': String(ariaColIndexFor(col.id)),
              },
              style: {
                width: `${widths[col.id] ?? 0}px`,
                height: `${rowH}px`,
                paddingLeft: `${t.cellPaddingX}px`,
                paddingRight: `${t.cellPaddingX}px`,
                ...pinnedStyle,
                ...(pinnedStyle['position'] != null ? { zIndex: String(cellZIndex) } : {}),
              },
            },
            [text],
          );
        });
        const isSelected = selectedRowIdsSet.value.has(row.id);
        const selectionCell: VNode | null = selectionColShow
          ? buildBodySelectionCell(row.id, rowH)
          : null;
        const rowChildren: VNode[] = selectionCell
          ? selectionColSide === 'left'
            ? [selectionCell, ...cellNodes]
            : [...cellNodes, selectionCell]
          : cellNodes;
        return h(
          'div',
          {
            key: `pinned-${position}-row-${row.id}`,
            class: [
              'cx-table-row',
              `cx-table-row--pinned-${position}`,
              isSelected && 'cx-table-row--selected',
            ]
              .filter(Boolean)
              .join(' '),
            attrs: {
              role: 'row',
              'data-row-id': row.id,
              'data-pinned-row': position,
              'aria-rowindex': String(
                position === 'top' ? zoneIndex + 2 : ariaRowIndexAfterBody + zoneIndex,
              ),
              'aria-selected': isSelected ? 'true' : undefined,
            },
            style: {
              position: 'sticky',
              ...stickyAnchor,
              left: '0',
              width: `${totalWithRowDrag}px`,
              height: `${rowH}px`,
              zIndex: String(t.pinnedRowZIndex),
              background: 'var(--cx-table-pinned-zone-bg, inherit)',
            },
          },
          rowChildren,
        );
      }
      const topPinnedRowNodes: VNode[] = topPinned.map((row, i) =>
        buildPinnedRowVNode(row, 'top', i, topPinned.length),
      );
      const bottomPinnedRowNodes: VNode[] = bottomPinned.map((row, i) =>
        buildPinnedRowVNode(row, 'bottom', i, bottomPinned.length),
      );

      // (2026-05-28 — vue2 port): loading + no-rows overlays.
      // Loading takes precedence over no-rows per Decision F.1.
      const filteredRowsCount = filteredRows.value.length;
      const showLoadingOverlay = props.loading;
      const showNoRowsOverlay =
        !showLoadingOverlay &&
        filteredRowsCount === 0 &&
        topPinned.length === 0 &&
        bottomPinned.length === 0;
      const overlayVNode: VNode | null = (() => {
        if (!showLoadingOverlay && !showNoRowsOverlay) return null;
        const content: string | VNode = showLoadingOverlay
          ? (props.loadingOverlay ?? 'Loading…')
          : (props.noRowsOverlay ?? 'No rows');
        return h(
          'div',
          {
            class: showLoadingOverlay
              ? 'cx-table-overlay cx-table-overlay--loading'
              : 'cx-table-overlay cx-table-overlay--no-rows',
            attrs: {
              role: 'status',
              'aria-live': 'polite',
              'data-testid': showLoadingOverlay ? 'cx-overlay-loading' : 'cx-overlay-no-rows',
            },
            style: {
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              bottom: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--cx-table-overlay-bg, rgba(255,255,255,0.85))',
              pointerEvents: showLoadingOverlay ? 'auto' : 'none',
              zIndex: '5',
            },
          },
          [
            typeof content === 'string'
              ? h('span', { class: 'cx-table-overlay-content' }, [content])
              : content,
          ],
        );
      })();

      const body: VNode = h(
        'div',
        {
          // Vue 2.7's vnode-data ref accepts function refs in composition
          // API form. The `as never` cast bridges the wider Vue 2 ref
          // type (Element | Component) to our narrower HTMLElement
          // signature — same idiom as `wrapperRef` below.
          ref: ((el: HTMLElement | null) => {
            bodyRef.value = el;
          }) as never,
          class: 'cx-table-body',
          // (2026-05-27 — vue2 port of vue3):
          // `tabindex: 0` makes the body focusable so Ctrl+C / Cmd+C
          // keydown lands here when the user is interacting with the
          // data area. Standard a11y pattern for "div that should
          // accept keyboard input"; the role="rowgroup" + per-cell
          // gridcell roles still describe semantics correctly.
          attrs: { role: 'rowgroup', tabindex: 0 },
          // (2026-05-26 — vue2 port of vue3):
          // `overflowX` flips `'hidden'` → `'auto'` so that when the
          // total column width exceeds the body's viewport width a
          // horizontal scrollbar appears + pinned cells' sticky
          // positioning has a scrolling ancestor to anchor against.
          // No visible change when columns fit (no scrollbar
          // materializes).
          style: {
            overflowY: 'auto',
            overflowX: 'auto',
            position: 'relative',
          },
          on: {
            // mirror body's horizontal scroll into the
            // header + filter row's `scrollLeft` so the column-aligned
            // strips track together. Imperative DOM mutation (no
            // reactive ref round-trip) — scroll events fire ~60Hz and
            // a reactive ref update + render would add ~1-2ms per
            // event. Additive to (not replacing) the existing vertical-
            // scroll tracking that `useTableBodyScroll` registers via
            // addEventListener — both observers run.
            scroll: (e: Event) => {
              const target = e.currentTarget as HTMLElement | null;
              if (target == null) return;
              const x = target.scrollLeft;
              const headerEl = headerRef.value;
              if (headerEl != null && headerEl.scrollLeft !== x) {
                headerEl.scrollLeft = x;
              }
              const filterEl = filterRowRef.value;
              if (filterEl != null && filterEl.scrollLeft !== x) {
                filterEl.scrollLeft = x;
              }
              // (2026-05-27 — vue2 port of vue3):
              // mirror horizontal scroll into the optional sticky
              // footer so its column-aligned cells track the body.
              // Additive to header + filter mirrors.
              const footerEl = footerRef.value;
              if (footerEl != null && footerEl.scrollLeft !== x) {
                footerEl.scrollLeft = x;
              }
              // (2026-05-28 — vue2 port): clear active
              // tooltip on scroll (popover coords captured pre-scroll).
              onBodyTooltipScroll();
            },
            // Ctrl+C / Cmd+C copies the active cell-range as
            // TSV. Gates on cellRangeSelection === 'enabled' + active
            // range; non-matching keystrokes propagate normally.
            keydown: onBodyKeydown,
            // (2026-05-28 — vue2 port): pointerleave clears
            // pending + active tooltip when exiting via non-cell edges.
            pointerleave: onBodyTooltipPointerleave,
          },
        },
        [
          ...topPinnedRowNodes,
          bodyContent,
          ...bottomPinnedRowNodes,
          ...(overlayVNode != null ? [overlayVNode] : []),
        ],
      );

      // (2026-05-27 — vue2 port of vue3): opt-in
      // sticky footer aggregate row beneath the body. Verbatim port
      // of vue3 footer build; vue2 vnode-data deltas: `attrs:` for
      // data-* attributes, `ref:` function callback (as never cast),
      // and explicit `key` on root for stable diffing.
      const footer: VNode | null = props.showFooterRow
        ? (() => {
            const valuesByColId = footerValuesByColId.value;
            function buildFooterCell(col: ColumnSpec): VNode {
              const width = widths[col.id] ?? 0;
              const hasAggregator = col.aggregator != null;
              const cellClasses: string[] = ['cx-table-footer-cell'];
              if (!hasAggregator) cellClasses.push('cx-table-footer-cell--empty');
              for (const suffix of pinnedCellModifierSuffixes(col.id)) {
                cellClasses.push(`cx-table-footer-cell${suffix}`);
              }
              const style: Record<string, string> = {
                width: `${width}px`,
                height: `${t.footerHeight}px`,
                paddingLeft: `${t.cellPaddingX}px`,
                paddingRight: `${t.cellPaddingX}px`,
                background: 'var(--cx-table-footer-bg, #f8f9fa)',
                ...pinnedCellStyle(col.id),
              };
              const children: VNode[] = [];
              if (hasAggregator) {
                const value = valuesByColId[col.id];
                const synthRow: RowSpec = {
                  id: '__footer__',
                  data: { [col.field ?? col.id]: value },
                };
                const text = col.valueFormatter
                  ? col.valueFormatter({ value, row: synthRow, column: col })
                  : formatCellValue({ row: synthRow, column: col });
                children.push(h('span', { class: 'cx-table-footer-cell-label' }, text));
              }
              return h(
                'div',
                {
                  key: `footer-${col.id}`,
                  class: cellClasses.join(' '),
                  attrs: {
                    role: 'gridcell',
                    'data-col-id': col.id,
                  },
                  style,
                },
                children,
              );
            }
            const leftCells = pinnedResult.leftPinnedColIds
              .map((id) => columnTable.value.getById(id))
              .filter((c): c is ColumnSpec => c != null)
              .map(buildFooterCell);
            const centerCells = pinnedResult.centerColIds
              .map((id) => columnTable.value.getById(id))
              .filter((c): c is ColumnSpec => c != null)
              .map(buildFooterCell);
            const rightCells = pinnedResult.rightPinnedColIds
              .map((id) => columnTable.value.getById(id))
              .filter((c): c is ColumnSpec => c != null)
              .map(buildFooterCell);
            const selectionPlaceholder: VNode | null = selectionColShow
              ? h('div', {
                  key: 'footer-selection-rail',
                  class: 'cx-table-footer-cell cx-table-footer-cell--selection-rail',
                  style: {
                    width: `${selectionColWidth}px`,
                    height: `${t.footerHeight}px`,
                    background: 'var(--cx-table-footer-bg, #f8f9fa)',
                    ...selectionRailStickyStyle,
                  },
                })
              : null;
            const orderedZoneCells: VNode[] = [...leftCells, ...centerCells, ...rightCells];
            const rowChildren: VNode[] = selectionColShow
              ? selectionColSide === 'left'
                ? [selectionPlaceholder!, ...orderedZoneCells]
                : [...orderedZoneCells, selectionPlaceholder!]
              : orderedZoneCells;
            const footerRow: VNode = h(
              'div',
              {
                class: 'cx-table-row cx-table-row--footer',
                attrs: { role: 'row' },
                style: { width: `${totalWithRowDrag}px` },
              },
              rowChildren,
            );
            return h(
              'div',
              {
                ref: ((el: HTMLElement | null) => {
                  footerRef.value = el;
                }) as never,
                class: 'cx-table-footer',
                attrs: { role: 'rowgroup' },
                style: { overflowX: 'hidden' },
              },
              [footerRow],
            );
          })()
        : null;

      // opt-in pagination footer rendered
      // below the body. Layout: prev button + page info (1-based for
      // human reading) + next button on the left; rows total text +
      // page-size <select> on the right. Buttons disable at boundaries;
      // the <select> renders `pageSizeOptions` and routes change events
      // through `setPageSize`. The component always exposes the
      // (2026-05-28 — vue2 port): opt-in status bar. Verbatim
      // port of vue3 . Vue 2.7 ctx.slots['status-bar'] returns
      // a slot factory; invoke with `{counts}` to get the VNode array.
      const statusBar: VNode | null = props.showStatusBar
        ? (() => {
            const counts: StatusBarCounts = {
              total: props.rows.length,
              filtered: filteredRows.value.length,
              selected: selectedRowIdsSet.value.size,
              page: currentPageRef.value,
              pageSize: currentPageSizeRef.value,
            };
            const slot = ctx.slots['status-bar'];
            const inner: VNode | string | (VNode | string)[] =
              slot != null ? slot({ counts }) : defaultStatusBarText(counts);
            return h(
              'div',
              {
                class: 'cx-table-status-bar',
                attrs: {
                  role: 'status',
                  'aria-live': 'polite',
                  'data-testid': 'cx-status-bar',
                },
                style: {
                  height: `${t.statusBarHeight}px`,
                  background: 'var(--cx-table-status-bar-bg, #f4f6f8)',
                  display: 'flex',
                  alignItems: 'center',
                  paddingLeft: `${t.cellPaddingX}px`,
                  paddingRight: `${t.cellPaddingX}px`,
                  fontSize: '12px',
                  color: '#3a414a',
                  borderTop: `1px solid var(--cx-table-row-divider-color, #eceff2)`,
                },
              },
              Array.isArray(inner) ? inner : [inner],
            );
          })()
        : null;

      // pagination handle methods even when this footer is suppressed
      // (programmatic control still works). Verbatim port of vue3
      // footer; vue2 vnode-data deltas: attrs:{disabled,type}
      // for <button>, domProps:{value} for <select>, on:{click|change}
      // for handlers.
      const paginationFooter: VNode | null = props.paginationEnabled
        ? (() => {
            // (2026-05-30 — vue2 port) Decision B.1:
            // serverSide+paginationEnabled reads totals from the
            // session-derived computeds directly. Verbatim mirror of vue3.
            const cp = serverSidePaginationActive.value
              ? serverSideCurrentPageForFooter.value
              : currentPageFromPass.value;
            const tp = serverSidePaginationActive.value
              ? serverSideTotalPagesForFooter.value
              : totalPagesFromPass.value;
            const ps = currentPageSizeRef.value;
            const totalRows = serverSidePaginationActive.value
              ? serverSideTotalRowsForFooter.value
              : totalRowsAcrossPages.value;
            // Last valid page is tp-1; when tp=0 (empty), both ends
            // are disabled (no navigation makes sense).
            const atFirst = tp === 0 || cp <= 0;
            const atLast = tp === 0 || cp >= tp - 1;
            // Display 1-based per vue3 Decision B; empty
            // dataset shows "0 / 0" so users see the empty state.
            const humanCurrent = tp === 0 ? 0 : cp + 1;
            const humanTotal = tp;
            const prevBtn: VNode = h(
              'button',
              {
                class: 'cx-table-pagination-button cx-table-pagination-button--prev',
                attrs: {
                  type: 'button',
                  'aria-label': 'Previous page',
                  disabled: atFirst,
                },
                on: {
                  click: () => {
                    if (atFirst) return;
                    applyPage(cp - 1, ps);
                  },
                },
              },
              '«',
            );
            const nextBtn: VNode = h(
              'button',
              {
                class: 'cx-table-pagination-button cx-table-pagination-button--next',
                attrs: {
                  type: 'button',
                  'aria-label': 'Next page',
                  disabled: atLast,
                },
                on: {
                  click: () => {
                    if (atLast) return;
                    applyPage(cp + 1, ps);
                  },
                },
              },
              '»',
            );
            // page-number bar — replaces the
            // "第 N / M 页" info text with an ellipsis-aware
            // list of clickable page buttons. Empty for tp === 0 (no
            // pages to show; the bar collapses to just prev/next which
            // are both disabled). Verbatim port of vue3; vue2
            // vnode-data deltas: attrs:{...} for button HTML attrs with
            // a mutable Record build for conditional aria-current;
            // attrs:{'aria-hidden': 'true'} for ellipsis; on:{click}.
            const visiblePages = computeVisiblePageNumbers(
              cp,
              tp,
              props.paginationSiblingCount,
              props.paginationBoundaryCount,
            );
            const pageBarChildren: VNode[] = visiblePages.map((el, idx) => {
              if (el === 'ellipsis') {
                return h(
                  'span',
                  {
                    key: `ellipsis-${idx}`,
                    class: 'cx-table-pagination-ellipsis',
                    attrs: { 'aria-hidden': 'true' },
                  },
                  '…',
                );
              }
              const isCurrent = el === cp;
              const pageBtnAttrs: Record<string, string | number | boolean> = {
                type: 'button',
                'aria-label': `Go to page ${el + 1}`,
                'data-page-index': String(el),
                disabled: isCurrent,
              };
              if (isCurrent) pageBtnAttrs['aria-current'] = 'page';
              return h(
                'button',
                {
                  key: `page-${el}`,
                  class: isCurrent
                    ? 'cx-table-pagination-page cx-table-pagination-page--current'
                    : 'cx-table-pagination-page',
                  attrs: pageBtnAttrs,
                  on: {
                    click: () => {
                      if (isCurrent) return;
                      applyPage(el, ps);
                    },
                  },
                },
                String(el + 1),
              );
            });
            const pageInfo: VNode = h(
              'div',
              {
                class: 'cx-table-pagination-pages',
                attrs: {
                  'data-current-page': String(cp),
                  'data-total-pages': String(tp),
                  role: 'group',
                  'aria-label': `Page ${humanCurrent} of ${humanTotal}`,
                },
              },
              pageBarChildren,
            );
            const sizeSelect: VNode = h(
              'select',
              {
                class: 'cx-table-pagination-size-select',
                attrs: { 'aria-label': 'Rows per page' },
                domProps: { value: ps },
                on: {
                  change: (e: Event) => {
                    const target = e.target as HTMLSelectElement;
                    const nextSize = Number(target.value);
                    if (Number.isFinite(nextSize) && nextSize > 0) {
                      applyPage(currentPageRef.value, nextSize);
                    }
                  },
                },
              },
              props.pageSizeOptions.map((opt) =>
                h('option', { key: `size-${opt}`, attrs: { value: opt } }, `${opt} 行/页`),
              ),
            );
            const sizeWrap: VNode = h('label', { class: 'cx-table-pagination-size' }, [
              h('span', { class: 'cx-table-pagination-size-label' }, '每页 '),
              sizeSelect,
            ]);
            const totalLabel: VNode = h(
              'span',
              { class: 'cx-table-pagination-total' },
              `共 ${totalRows} 行`,
            );
            return h(
              'div',
              {
                class: 'cx-table-pagination',
                attrs: { role: 'navigation', 'aria-label': 'Pagination' },
              },
              [
                h('div', { class: 'cx-table-pagination-nav' }, [prevBtn, pageInfo, nextBtn]),
                h('div', { class: 'cx-table-pagination-meta' }, [totalLabel, sizeWrap]),
              ],
            );
          })()
        : null;

      // inline CSS custom properties on the wrapper so the
      // theme reaches descendant CSS via `var(--cx-table-*, fallback)`.
      // Geometry tokens emit with `px` units; color tokens pass through
      // as raw strings. Consumers override per-instance by passing the
      // `theme` prop. Verbatim port of vue3 wiring at commit
      // `3c14fdd`. Vue 2.7's `h()` accepts a `style:` slot whose CSS-
      // custom-property keys (`--cx-table-*`) Just Work™ via
      // `element.style.setProperty`.
      const themeVars = cssVarsForTheme(t);
      // assemble wrapper children — header, optional filter
      // row, body, optional pagination footer. Filter + footer are
      // independently opt-in.
      const children: VNode[] = [header];
      if (filterRow != null) children.push(filterRow);
      children.push(body);
      if (footer != null) children.push(footer);
      if (statusBar != null) children.push(statusBar);
      if (paginationFooter != null) children.push(paginationFooter);

      // (2026-05-27 — vue2 port of vue3): opt-in
      // column-visibility-menu button + popover. Both are absolute-
      // positioned overlays anchored to the wrapper's top-right corner.
      // vue2 vnode-data idiom: `attrs:` for HTML attributes + `on:` for
      // handlers + `ref:` function callback cast as `never`.
      if (props.showColumnVisibilityMenu) {
        const menuButton: VNode = h(
          'button',
          {
            key: 'cx-table-column-menu-button',
            ref: ((el: HTMLElement | null) => {
              columnMenuButtonRef.value = el;
            }) as never,
            class: 'cx-table-column-menu-button',
            attrs: {
              type: 'button',
              'aria-label': '列显隐',
              'aria-haspopup': 'menu',
              'aria-expanded': columnMenuOpen.value ? 'true' : 'false',
              'data-column-menu-open': columnMenuOpen.value ? 'true' : 'false',
            },
            style: {
              position: 'absolute',
              top: '4px',
              right: '4px',
              zIndex: '5',
              padding: '2px 8px',
              fontSize: '14px',
              lineHeight: '1.4',
              background: 'var(--cx-table-header-bg, #f1f3f5)',
              border: '1px solid var(--cx-table-header-border-color, #d9dde2)',
              borderRadius: '4px',
              cursor: 'pointer',
            },
            on: {
              click: onColumnMenuButtonClick,
            },
          },
          '列',
        );
        children.push(menuButton);

        if (columnMenuOpen.value) {
          // roving tabindex on the checkbox inputs.
          const colMenuActiveIdx = columnVisibilityMenuKbdNav.activeIndex.value;
          const checkboxItems: VNode[] = props.columns.map((col, idx) => {
            const isHidden = col.hide === true;
            const label = col.headerName ?? col.field ?? col.id;
            const isKbdActive = colMenuActiveIdx === idx;
            return h(
              'label',
              {
                key: `column-menu-item-${col.id}`,
                class: 'cx-table-column-menu-item',
                attrs: { 'data-col-id': col.id },
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  userSelect: 'none',
                },
              },
              [
                h('input', {
                  class: 'cx-table-column-menu-checkbox',
                  attrs: {
                    type: 'checkbox',
                    tabindex: isKbdActive ? 0 : -1,
                    'data-col-id': col.id,
                    'data-menu-item-index': String(idx),
                  },
                  domProps: { checked: !isHidden },
                  on: {
                    change: (e: Event) => {
                      onColumnCheckboxChange(col.id, e);
                    },
                  },
                }),
                h('span', { class: 'cx-table-column-menu-label' }, label),
              ],
            );
          });

          const actionRow: VNode = h(
            'div',
            {
              class: 'cx-table-column-menu-actions',
              style: {
                display: 'flex',
                gap: '6px',
                padding: '6px 8px',
                borderBottom: '1px solid var(--cx-table-header-border-color, #d9dde2)',
              },
            },
            [
              h(
                'button',
                {
                  class: 'cx-table-column-menu-action cx-table-column-menu-action--show-all',
                  attrs: { type: 'button' },
                  on: { click: onShowAllColumnsClick },
                },
                '全部显示',
              ),
              h(
                'button',
                {
                  class: 'cx-table-column-menu-action cx-table-column-menu-action--hide-all',
                  attrs: { type: 'button' },
                  on: { click: onHideAllColumnsClick },
                },
                '全部隐藏',
              ),
            ],
          );

          const popover: VNode = h(
            'div',
            {
              key: 'cx-table-column-menu-popover',
              ref: ((el: HTMLElement | null) => {
                columnMenuPopoverRef.value = el;
              }) as never,
              class: 'cx-table-column-menu-popover',
              attrs: { role: 'menu', tabindex: 0 },
              // chain existing Escape handler + new Arrow nav.
              on: {
                keydown: (e: KeyboardEvent) => {
                  onColumnMenuKeydown(e);
                  columnVisibilityMenuKbdNav.handleKeydown(e);
                },
              },
              style: {
                position: 'absolute',
                top: '36px',
                right: '4px',
                zIndex: '5',
                minWidth: '160px',
                maxHeight: '320px',
                overflowY: 'auto',
                background: '#ffffff',
                border: '1px solid var(--cx-table-header-border-color, #d9dde2)',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.12)',
                padding: '4px 0',
              },
            },
            [actionRow, ...checkboxItems],
          );
          children.push(popover);
        }
      }

      // drop-line overlay for column-move drag.
      // Absolute-positioned 2px line spanning the wrapper's full vertical
      // extent (anchored against the wrapper's position:relative). `left`
      // is `movingColumnRef.dropLineLeftPx` (pre-computed wrapper-relative
      // px). Only mounted when active drag has a valid drop target.
      // Verbatim port of vue3 .
      if (activeMove?.dropLineLeftPx != null) {
        children.push(
          h('div', {
            key: 'cx-table-drop-line',
            class: 'cx-table-drop-line',
            attrs: {
              'aria-hidden': 'true',
              'data-drop-target-col-id': activeMove.dropTarget?.targetColId ?? '',
              'data-drop-target-position': activeMove.dropTarget?.position ?? '',
            },
            style: {
              position: 'absolute',
              top: '0',
              bottom: '0',
              left: `${activeMove.dropLineLeftPx}px`,
              width: '2px',
              backgroundColor: 'var(--cx-table-drop-indicator-color, #2680eb)',
              pointerEvents: 'none',
              zIndex: '4',
            },
          }),
        );
      }
      // (2026-05-28 — vue2 port): tooltip popover at wrapper
      // level so it escapes the body's overflow clipping. Coords are
      // wrapper-relative.
      const activeTooltip = tooltipActiveRef.value;
      if (activeTooltip != null) {
        children.push(
          h(
            'div',
            {
              key: 'cx-table-tooltip',
              class: 'cx-table-tooltip',
              // Intentionally no `role="tooltip"` — that ARIA role
              // requires `aria-describedby` wiring from the trigger,
              // which chronix's hover-only popover does not provide.
              attrs: {
                'data-testid': 'cx-tooltip',
                'data-row-id': activeTooltip.rowId,
                'data-col-id': activeTooltip.colId,
              },
              style: {
                position: 'absolute',
                top: `${activeTooltip.y}px`,
                left: `${activeTooltip.x}px`,
                background: 'var(--cx-table-tooltip-bg, #2a2f36)',
                color: 'var(--cx-table-tooltip-color, #ffffff)',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                lineHeight: '16px',
                maxWidth: '320px',
                whiteSpace: 'pre-wrap',
                pointerEvents: 'none',
                zIndex: '10',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              },
            },
            [activeTooltip.text],
          ),
        );
      }
      // wrapper carries position:relative inline so the
      // .cx-table-drop-line overlay's absolute coords resolve against
      // the wrapper, not the document.
      const wrapperStyle: Record<string, string> = { ...themeVars, position: 'relative' };
      // (2026-05-29 — vue2 port): off-screen live region.
      const liveRegion: VNode = h(
        'div',
        {
          class: 'cx-table-sr-announce',
          attrs: {
            role: 'status',
            'aria-live': 'polite',
            'aria-atomic': 'true',
          },
        },
        srAnnounceTextRef.value,
      );
      // (vue2 port): row-drop-line overlay.
      const rowDropLine: VNode | null =
        movingRowRef.value?.dropLineTopPx != null
          ? h('div', {
              class: 'cx-table-row-drop-line',
              attrs: {
                'data-testid': 'cx-row-drop-line',
                'data-drop-target-row-id': movingRowRef.value.dropTarget?.targetRowId ?? '',
                'data-drop-target-position': movingRowRef.value.dropTarget?.position ?? '',
              },
              style: {
                position: 'absolute',
                top: `${movingRowRef.value.dropLineTopPx}px`,
                left: '0',
                width: '100%',
                height: '2px',
                background: 'var(--cx-table-drop-line-color, #2563eb)',
                pointerEvents: 'none',
                zIndex: 5,
              },
            })
          : null;
      // -B (2026-05-30 — vue2 port): cell context menu overlay.
      // Verbatim mirror of vue3 — cursor-anchored via position: fixed.
      const contextMenuOverlay: VNode | null = (() => {
        const pos = contextMenuPositionRef.value;
        const cfg = props.contextMenu;
        if (pos == null || cfg == null || cfg.items.length === 0) return null;
        const cmCtx: ContextMenuContext = { rowId: pos.rowId, colId: pos.colId };
        const ctxMenuActiveIdx = cellContextMenuKbdNav.activeIndex.value;
        return h(
          'div',
          {
            ref: ((el: HTMLElement | null) => {
              cellContextMenuRef.value = el;
            }) as never,
            class: 'cx-table-cell-context-menu',
            attrs: {
              role: 'menu',
              'data-testid': 'cx-cell-context-menu',
            },
            style: {
              position: 'fixed',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              zIndex: 7,
            },
            on: {
              keydown: (e: KeyboardEvent) => cellContextMenuKbdNav.handleKeydown(e),
            },
          },
          cfg.items.map((item: ContextMenuItem, idx: number) => {
            const isDisabled = item.disabled?.(cmCtx) === true;
            const isKbdActive = !isDisabled && ctxMenuActiveIdx === idx;
            return h(
              'button',
              {
                key: item.id,
                class: [
                  'cx-table-cell-context-menu-item',
                  isDisabled && 'cx-table-cell-context-menu-item--disabled',
                ]
                  .filter(Boolean)
                  .join(' '),
                attrs: {
                  type: 'button',
                  role: 'menuitem',
                  tabindex: isKbdActive ? 0 : -1,
                  'data-item-id': item.id,
                  'data-menu-item-index': String(idx),
                },
                domProps: { disabled: isDisabled },
                on: {
                  click: () => {
                    onContextMenuItemClick(item);
                  },
                },
              },
              item.icon != null ? `${item.icon} ${item.label}` : item.label,
            );
          }),
        );
      })();

      // (2026-05-31 — vue2 port): cell style editor
      // popover. Verbatim mirror of vue3 popover.
      const cellStyleEditorPopover: VNode | null = (() => {
        if (!props.enableCellStyleEditor) return null;
        const state = cellStyleEditorOpenRef.value;
        if (state == null) return null;
        const { anchorRect, hsv, hex } = state;
        const rgb = hsvToRgb(hsv);
        const SQUARE_SIZE_PX = 180;
        const HUE_HEIGHT_PX = 14;
        const squarePos = computeSquarePositionForHsv({
          hsv,
          squareWidthPx: SQUARE_SIZE_PX,
          squareHeightPx: SQUARE_SIZE_PX,
        });
        const huePosPx = computeStripPositionForHue({ hue: hsv.h, stripSizePx: SQUARE_SIZE_PX });
        const hueOnlyRgb = hsvToRgb({ h: hsv.h, s: 1, v: 1 });
        const hueOnlyHex = rgbToHex(hueOnlyRgb);
        const onSquarePointerDown = (e: PointerEvent): void => {
          const sq = e.currentTarget as HTMLElement;
          const rect = sq.getBoundingClientRect();
          cellStyleSquareDragRef.value = true;
          try {
            sq.setPointerCapture(e.pointerId);
          } catch {
            /* capture may not be available */
          }
          const nextHsv = computeHsvAtSquarePosition({
            positionPxX: e.clientX - rect.left,
            positionPxY: e.clientY - rect.top,
            squareWidthPx: rect.width,
            squareHeightPx: rect.height,
            currentHue: hsv.h,
          });
          setCellStyleEditorHsv(nextHsv);
        };
        const onSquarePointerMove = (e: PointerEvent): void => {
          if (!cellStyleSquareDragRef.value) return;
          const sq = e.currentTarget as HTMLElement;
          const rect = sq.getBoundingClientRect();
          const open = cellStyleEditorOpenRef.value;
          if (open == null) return;
          const nextHsv = computeHsvAtSquarePosition({
            positionPxX: e.clientX - rect.left,
            positionPxY: e.clientY - rect.top,
            squareWidthPx: rect.width,
            squareHeightPx: rect.height,
            currentHue: open.hsv.h,
          });
          setCellStyleEditorHsv(nextHsv);
        };
        const onSquarePointerUp = (e: PointerEvent): void => {
          cellStyleSquareDragRef.value = false;
          const sq = e.currentTarget as HTMLElement;
          try {
            sq.releasePointerCapture(e.pointerId);
          } catch {
            /* capture may have never been set */
          }
        };
        const onHuePointerDown = (e: PointerEvent): void => {
          const strip = e.currentTarget as HTMLElement;
          const rect = strip.getBoundingClientRect();
          cellStyleHueDragRef.value = true;
          try {
            strip.setPointerCapture(e.pointerId);
          } catch {
            /* capture may not be available */
          }
          const nextHue = computeHueAtStripPosition({
            positionPx: e.clientX - rect.left,
            stripSizePx: rect.width,
          });
          const open = cellStyleEditorOpenRef.value;
          if (open == null) return;
          setCellStyleEditorHsv({ ...open.hsv, h: nextHue });
        };
        const onHuePointerMove = (e: PointerEvent): void => {
          if (!cellStyleHueDragRef.value) return;
          const strip = e.currentTarget as HTMLElement;
          const rect = strip.getBoundingClientRect();
          const open = cellStyleEditorOpenRef.value;
          if (open == null) return;
          const nextHue = computeHueAtStripPosition({
            positionPx: e.clientX - rect.left,
            stripSizePx: rect.width,
          });
          setCellStyleEditorHsv({ ...open.hsv, h: nextHue });
        };
        const onHuePointerUp = (e: PointerEvent): void => {
          cellStyleHueDragRef.value = false;
          const strip = e.currentTarget as HTMLElement;
          try {
            strip.releasePointerCapture(e.pointerId);
          } catch {
            /* capture may have never been set */
          }
        };
        const popoverTop = anchorRect.bottom + 4;
        // (vue2 port): tab strip — Background / Text axis
        // switcher. Verbatim mirror of vue3.
        const tabStrip = h(
          'div',
          {
            class: 'cx-table-cell-style-editor__tabs',
            attrs: {
              role: 'tablist',
              'aria-label': 'Cell style axis',
            },
            style: {
              display: 'flex',
              gap: '4px',
              marginBottom: '8px',
              borderBottom: '1px solid #e5e7eb',
            },
          },
          (['background', 'text', 'font', 'border'] as const).map((tab) => {
            const isActive = state.activeTab === tab;
            return h(
              'button',
              {
                attrs: {
                  type: 'button',
                  role: 'tab',
                  'data-cx-style-tab': tab,
                  'aria-selected': isActive ? 'true' : 'false',
                },
                class: `cx-table-cell-style-editor__tab${isActive ? ' cx-table-cell-style-editor__tab--active' : ''}`,
                style: {
                  padding: '4px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                  fontSize: '12px',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                },
                on: { click: () => switchCellStyleEditorTab(tab) },
              },
              tab === 'background'
                ? '背景色'
                : tab === 'text'
                  ? '文字色'
                  : tab === 'font'
                    ? '字体'
                    : '边框',
            );
          }),
        );

        // (2026-06-01 — vue2 port): font tab widget
        // cluster. Verbatim mirror of vue3.
        const isFontTab = state.activeTab === 'font';
        const fontWidgets: VNode | null = isFontTab
          ? h(
              'div',
              {
                class: 'cx-table-cell-style-editor__font-cluster',
                style: { display: 'flex', flexDirection: 'column', gap: '8px' },
              },
              [
                h(
                  'button',
                  {
                    attrs: {
                      type: 'button',
                      'data-cx-style-font': 'weight-bold',
                      'aria-pressed': state.fontState.fontWeight === '700' ? 'true' : 'false',
                    },
                    class: `cx-table-cell-style-editor__font-btn${state.fontState.fontWeight === '700' ? ' cx-table-cell-style-editor__font-btn--active' : ''}`,
                    style: {
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: state.fontState.fontWeight === '700' ? '#eff6ff' : '#ffffff',
                      border: '1px solid #d9dde2',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    },
                    on: { click: toggleCellStyleFontWeight },
                  },
                  '加粗 (Bold)',
                ),
                // (2026-06-01 — vue2 port): custom font-
                // weight 9-step picker in a native <details> disclosure.
                // Verbatim mirror of vue3.
                h(
                  'details',
                  {
                    class: 'cx-table-cell-style-editor__font-weight-details',
                    attrs: { 'data-cx-style-font-weight-picker': '' },
                  },
                  [
                    h(
                      'summary',
                      { style: { fontSize: '12px', cursor: 'pointer' } },
                      '更多字重 (More weights)',
                    ),
                    h(
                      'div',
                      {
                        class: 'cx-table-cell-style-editor__font-weight-grid',
                        attrs: { role: 'group', 'aria-label': 'Custom font weight' },
                        style: {
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '4px',
                          marginTop: '6px',
                        },
                      },
                      ['100', '200', '300', '400', '500', '600', '700', '800', '900'].map((w) => {
                        const isActiveW = state.fontState.fontWeight === w;
                        return h(
                          'button',
                          {
                            attrs: {
                              type: 'button',
                              'data-cx-style-font': `weight-${w}`,
                              'aria-pressed': isActiveW ? 'true' : 'false',
                            },
                            class: `cx-table-cell-style-editor__font-weight-btn${isActiveW ? ' cx-table-cell-style-editor__font-weight-btn--active' : ''}`,
                            style: {
                              padding: '4px 0',
                              fontSize: '12px',
                              fontWeight: w,
                              background: isActiveW ? '#eff6ff' : '#ffffff',
                              border: '1px solid #d9dde2',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            },
                            on: { click: () => setCellStyleFontWeight(w) },
                          },
                          w,
                        );
                      }),
                    ),
                  ],
                ),
                // (2026-06-01 — vue2 port): variable-
                // font weight slider in 2nd <details> sibling.
                // Verbatim mirror of vue3 single-handle inline math.
                (() => {
                  const parsed = parseInt(state.fontState.fontWeight ?? '400', 10);
                  const currentWeight =
                    Number.isFinite(parsed) && parsed >= 1 && parsed <= 1000 ? parsed : 400;
                  const ratio = (currentWeight - 1) / 999;
                  const applyAtPos = (e: PointerEvent): void => {
                    const track = e.currentTarget as HTMLElement | null;
                    if (track == null) return;
                    const rect = track.getBoundingClientRect();
                    if (rect.width <= 0) return;
                    const r = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const next = Math.round(1 + r * 999);
                    setCellStyleFontWeight(String(next));
                  };
                  return h(
                    'details',
                    {
                      class: 'cx-table-cell-style-editor__font-weight-slider-details',
                      attrs: { 'data-cx-style-font-weight-slider': '' },
                    },
                    [
                      h(
                        'summary',
                        { style: { fontSize: '12px', cursor: 'pointer' } },
                        '自定义滑杆 (Custom slider)',
                      ),
                      h(
                        'div',
                        {
                          class: 'cx-table-cell-style-editor__font-weight-slider',
                          attrs: {
                            role: 'group',
                            'aria-label': 'Variable font weight slider',
                          },
                          style: { marginTop: '6px' },
                        },
                        [
                          h(
                            'div',
                            {
                              class: 'cx-table-cell-style-editor__font-weight-slider-track',
                              attrs: { 'data-cx-style-font-weight-slider-track': '' },
                              style: {
                                position: 'relative',
                                width: '180px',
                                height: '8px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                touchAction: 'none',
                              },
                              on: {
                                pointerdown: (e: PointerEvent) => {
                                  cellStyleFontWeightSliderDragRef.value = true;
                                  try {
                                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                                  } catch {
                                    // ignore
                                  }
                                  applyAtPos(e);
                                },
                                pointermove: (e: PointerEvent) => {
                                  if (!cellStyleFontWeightSliderDragRef.value) return;
                                  applyAtPos(e);
                                },
                                pointerup: (e: PointerEvent) => {
                                  cellStyleFontWeightSliderDragRef.value = false;
                                  try {
                                    (e.currentTarget as HTMLElement).releasePointerCapture(
                                      e.pointerId,
                                    );
                                  } catch {
                                    // ignore
                                  }
                                },
                                pointercancel: () => {
                                  cellStyleFontWeightSliderDragRef.value = false;
                                },
                              },
                            },
                            [
                              h('div', {
                                class: 'cx-table-cell-style-editor__font-weight-slider-track-fill',
                                style: {
                                  position: 'absolute',
                                  top: '0',
                                  left: '0',
                                  height: '8px',
                                  width: `${ratio * 100}%`,
                                  background: '#3b82f6',
                                  borderRadius: '4px',
                                  pointerEvents: 'none',
                                },
                              }),
                              h('div', {
                                class: 'cx-table-cell-style-editor__font-weight-slider-thumb',
                                attrs: { 'data-cx-style-font-weight-slider-thumb': '' },
                                style: {
                                  position: 'absolute',
                                  top: '-4px',
                                  left: `calc(${ratio * 100}% - 8px)`,
                                  width: '16px',
                                  height: '16px',
                                  background: '#ffffff',
                                  border: '2px solid #3b82f6',
                                  borderRadius: '50%',
                                  pointerEvents: 'none',
                                },
                              }),
                            ],
                          ),
                          h(
                            'span',
                            {
                              class: 'cx-table-cell-style-editor__font-weight-slider-readout',
                              attrs: { 'data-cx-style-font-weight-slider-readout': '' },
                              style: {
                                fontSize: '11px',
                                color: '#374151',
                                marginTop: '4px',
                                display: 'inline-block',
                              },
                            },
                            String(currentWeight),
                          ),
                        ],
                      ),
                    ],
                  );
                })(),
                h(
                  'button',
                  {
                    attrs: {
                      type: 'button',
                      'data-cx-style-font': 'style-italic',
                      'aria-pressed': state.fontState.fontStyle === 'italic' ? 'true' : 'false',
                    },
                    class: `cx-table-cell-style-editor__font-btn${state.fontState.fontStyle === 'italic' ? ' cx-table-cell-style-editor__font-btn--active' : ''}`,
                    style: {
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontStyle: 'italic',
                      background: state.fontState.fontStyle === 'italic' ? '#eff6ff' : '#ffffff',
                      border: '1px solid #d9dde2',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    },
                    on: { click: toggleCellStyleFontStyle },
                  },
                  '斜体 (Italic)',
                ),
                h(
                  'div',
                  {
                    class: 'cx-table-cell-style-editor__deco-row',
                    attrs: { role: 'group', 'aria-label': 'Text decoration' },
                    style: { display: 'flex', gap: '4px' },
                  },
                  [
                    { value: null, label: '无', dataValue: 'none' },
                    { value: 'underline' as const, label: '下划线', dataValue: 'underline' },
                    {
                      value: 'line-through' as const,
                      label: '删除线',
                      dataValue: 'line-through',
                    },
                  ].map((opt) => {
                    const isActiveOpt = state.fontState.textDecoration === opt.value;
                    return h(
                      'button',
                      {
                        attrs: {
                          type: 'button',
                          'data-cx-style-font-deco': opt.dataValue,
                          'aria-pressed': isActiveOpt ? 'true' : 'false',
                        },
                        class: `cx-table-cell-style-editor__deco-btn${isActiveOpt ? ' cx-table-cell-style-editor__deco-btn--active' : ''}`,
                        style: {
                          flex: '1',
                          padding: '6px 4px',
                          fontSize: '12px',
                          background: isActiveOpt ? '#eff6ff' : '#ffffff',
                          border: '1px solid #d9dde2',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          textDecoration: opt.value ?? 'none',
                        },
                        on: { click: () => setCellStyleTextDecoration(opt.value) },
                      },
                      opt.label,
                    );
                  }),
                ),
              ],
            )
          : null;

        // + 99.2.3.1 + 99.2.3.2 (2026-06-01 — vue2 port):
        // border tab widget cluster with segmented control + per-side
        // editing + HSV picker disclosure. Verbatim mirror of vue3.
        const isBorderTab = state.activeTab === 'border';
        const borderStateLocal = state.borderState;
        const borderTarget = borderStateLocal.borderSideTarget;
        function borderEffectiveField(axis: 'Color' | 'Width' | 'Style'): string | null {
          const allField = `border${axis}` as keyof typeof borderStateLocal;
          if (borderTarget === 'all') {
            return borderStateLocal[allField] as string | null;
          }
          const cap = borderTarget.charAt(0).toUpperCase() + borderTarget.slice(1);
          const sideField = `border${cap}${axis}` as keyof typeof borderStateLocal;
          const sideValue = borderStateLocal[sideField] as string | null;
          return sideValue ?? (borderStateLocal[allField] as string | null);
        }
        const borderWidgets: VNode | null = isBorderTab
          ? h(
              'div',
              {
                class: 'cx-table-cell-style-editor__border-cluster',
                style: { display: 'flex', flexDirection: 'column', gap: '8px' },
              },
              [
                // 5-button segmented control for side
                // target.
                h(
                  'div',
                  {
                    class: 'cx-table-cell-style-editor__border-side-row',
                    attrs: { role: 'group', 'aria-label': 'Border side target' },
                    style: { display: 'flex', gap: '4px' },
                  },
                  [
                    { value: 'all' as const, label: '全部' },
                    { value: 'top' as const, label: '上' },
                    { value: 'right' as const, label: '右' },
                    { value: 'bottom' as const, label: '下' },
                    { value: 'left' as const, label: '左' },
                  ].map((opt) => {
                    const isActiveSide = borderTarget === opt.value;
                    return h(
                      'button',
                      {
                        attrs: {
                          type: 'button',
                          'data-cx-style-border-side': opt.value,
                          'aria-pressed': isActiveSide ? 'true' : 'false',
                        },
                        class: `cx-table-cell-style-editor__border-side-btn${isActiveSide ? ' cx-table-cell-style-editor__border-side-btn--active' : ''}`,
                        style: {
                          flex: '1',
                          padding: '6px 4px',
                          fontSize: '12px',
                          background: isActiveSide ? '#eff6ff' : '#ffffff',
                          border: '1px solid #d9dde2',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        },
                        on: { click: () => setCellStyleBorderSideTarget(opt.value) },
                      },
                      opt.label,
                    );
                  }),
                ),
                h(
                  'label',
                  {
                    class: 'cx-table-cell-style-editor__border-color-row',
                    style: { display: 'flex', gap: '6px', alignItems: 'center' },
                  },
                  [
                    h('span', { style: { fontSize: '11px', width: '48px' } }, '颜色'),
                    h('input', {
                      class: 'cx-table-cell-style-editor__border-color-input',
                      attrs: {
                        type: 'text',
                        'data-cx-style-border': 'color',
                        placeholder: '#000000',
                      },
                      domProps: { value: borderEffectiveField('Color') ?? '' },
                      style: { flex: '1', fontSize: '12px' },
                      on: {
                        input: (e: Event) => {
                          setCellStyleBorderColor((e.target as HTMLInputElement).value);
                        },
                      },
                    }),
                  ],
                ),
                // HSV picker disclosure.
                (() => {
                  const bHsv = borderStateLocal.hsv;
                  const bRgb = hsvToRgb(bHsv);
                  const bSquarePos = computeSquarePositionForHsv({
                    hsv: bHsv,
                    squareWidthPx: SQUARE_SIZE_PX,
                    squareHeightPx: SQUARE_SIZE_PX,
                  });
                  const bHuePosPx = computeStripPositionForHue({
                    hue: bHsv.h,
                    stripSizePx: SQUARE_SIZE_PX,
                  });
                  const bHueOnlyRgb = hsvToRgb({ h: bHsv.h, s: 1, v: 1 });
                  const bHueOnlyHex = rgbToHex(bHueOnlyRgb);
                  const onBSquarePointerDown = (e: PointerEvent): void => {
                    const sq = e.currentTarget as HTMLElement;
                    const rect = sq.getBoundingClientRect();
                    cellStyleBorderSquareDragRef.value = true;
                    try {
                      sq.setPointerCapture(e.pointerId);
                    } catch {
                      /* capture may not be available */
                    }
                    setCellStyleBorderHsv(
                      computeHsvAtSquarePosition({
                        positionPxX: e.clientX - rect.left,
                        positionPxY: e.clientY - rect.top,
                        squareWidthPx: rect.width,
                        squareHeightPx: rect.height,
                        currentHue: bHsv.h,
                      }),
                    );
                  };
                  const onBSquarePointerMove = (e: PointerEvent): void => {
                    if (!cellStyleBorderSquareDragRef.value) return;
                    const sq = e.currentTarget as HTMLElement;
                    const rect = sq.getBoundingClientRect();
                    const open = cellStyleEditorOpenRef.value;
                    if (open == null) return;
                    setCellStyleBorderHsv(
                      computeHsvAtSquarePosition({
                        positionPxX: e.clientX - rect.left,
                        positionPxY: e.clientY - rect.top,
                        squareWidthPx: rect.width,
                        squareHeightPx: rect.height,
                        currentHue: open.borderState.hsv.h,
                      }),
                    );
                  };
                  const onBSquarePointerUp = (e: PointerEvent): void => {
                    cellStyleBorderSquareDragRef.value = false;
                    try {
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                    } catch {
                      /* capture may have never been set */
                    }
                  };
                  const onBHuePointerDown = (e: PointerEvent): void => {
                    const strip = e.currentTarget as HTMLElement;
                    const rect = strip.getBoundingClientRect();
                    cellStyleBorderHueDragRef.value = true;
                    try {
                      strip.setPointerCapture(e.pointerId);
                    } catch {
                      /* capture may not be available */
                    }
                    const open = cellStyleEditorOpenRef.value;
                    if (open == null) return;
                    setCellStyleBorderHsv({
                      ...open.borderState.hsv,
                      h: computeHueAtStripPosition({
                        positionPx: e.clientX - rect.left,
                        stripSizePx: rect.width,
                      }),
                    });
                  };
                  const onBHuePointerMove = (e: PointerEvent): void => {
                    if (!cellStyleBorderHueDragRef.value) return;
                    const strip = e.currentTarget as HTMLElement;
                    const rect = strip.getBoundingClientRect();
                    const open = cellStyleEditorOpenRef.value;
                    if (open == null) return;
                    setCellStyleBorderHsv({
                      ...open.borderState.hsv,
                      h: computeHueAtStripPosition({
                        positionPx: e.clientX - rect.left,
                        stripSizePx: rect.width,
                      }),
                    });
                  };
                  const onBHuePointerUp = (e: PointerEvent): void => {
                    cellStyleBorderHueDragRef.value = false;
                    try {
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                    } catch {
                      /* capture may have never been set */
                    }
                  };
                  return h(
                    'details',
                    {
                      class: 'cx-table-cell-style-editor__border-color-hsv-details',
                      attrs: { 'data-cx-style-border-color-hsv': '' },
                    },
                    [
                      h(
                        'summary',
                        { style: { fontSize: '12px', cursor: 'pointer' } },
                        'HSV 选色 (HSV picker)',
                      ),
                      h(
                        'div',
                        {
                          class: 'cx-table-cell-style-editor__border-color-hsv',
                          style: { marginTop: '6px' },
                        },
                        [
                          h(
                            'div',
                            {
                              class: 'cx-table-cell-style-editor__square',
                              attrs: { 'data-cx-style-border-square': '' },
                              style: {
                                position: 'relative',
                                width: `${SQUARE_SIZE_PX}px`,
                                height: `${SQUARE_SIZE_PX}px`,
                                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${bHueOnlyHex})`,
                                cursor: 'crosshair',
                                touchAction: 'none',
                              },
                              on: {
                                pointerdown: onBSquarePointerDown,
                                pointermove: onBSquarePointerMove,
                                pointerup: onBSquarePointerUp,
                                pointercancel: onBSquarePointerUp,
                              },
                            },
                            [
                              h('div', {
                                class: 'cx-table-cell-style-editor__square-thumb',
                                style: {
                                  position: 'absolute',
                                  left: `${bSquarePos.positionPxX}px`,
                                  top: `${bSquarePos.positionPxY}px`,
                                  width: '10px',
                                  height: '10px',
                                  marginLeft: '-5px',
                                  marginTop: '-5px',
                                  borderRadius: '50%',
                                  border: '2px solid #ffffff',
                                  boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
                                  pointerEvents: 'none',
                                },
                              }),
                            ],
                          ),
                          h(
                            'div',
                            {
                              class: 'cx-table-cell-style-editor__hue-strip',
                              attrs: { 'data-cx-style-border-hue': '' },
                              style: {
                                position: 'relative',
                                width: `${SQUARE_SIZE_PX}px`,
                                height: `${HUE_HEIGHT_PX}px`,
                                marginTop: '6px',
                                background:
                                  'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))',
                                cursor: 'ew-resize',
                                touchAction: 'none',
                              },
                              on: {
                                pointerdown: onBHuePointerDown,
                                pointermove: onBHuePointerMove,
                                pointerup: onBHuePointerUp,
                                pointercancel: onBHuePointerUp,
                              },
                            },
                            [
                              h('div', {
                                class: 'cx-table-cell-style-editor__hue-thumb',
                                style: {
                                  position: 'absolute',
                                  left: `${bHuePosPx}px`,
                                  top: '-2px',
                                  width: '4px',
                                  height: `${HUE_HEIGHT_PX + 4}px`,
                                  marginLeft: '-2px',
                                  background: '#ffffff',
                                  border: '1px solid rgba(0,0,0,0.6)',
                                  pointerEvents: 'none',
                                },
                              }),
                            ],
                          ),
                          h(
                            'div',
                            {
                              class: 'cx-table-cell-style-editor__rgb-row',
                              style: { display: 'flex', gap: '6px', marginTop: '8px' },
                            },
                            (['r', 'g', 'b'] as const).map((ch) =>
                              h('label', { class: 'cx-table-cell-style-editor__rgb-label' }, [
                                h(
                                  'span',
                                  { style: { fontSize: '11px', marginRight: '2px' } },
                                  ch.toUpperCase(),
                                ),
                                h('input', {
                                  class: 'cx-table-cell-style-editor__rgb-input',
                                  attrs: {
                                    type: 'number',
                                    'data-cx-style-border-rgb': ch,
                                    min: '0',
                                    max: '255',
                                    step: '1',
                                  },
                                  domProps: { value: String(bRgb[ch]) },
                                  style: { width: '48px', fontSize: '12px' },
                                  on: {
                                    input: (e: Event) => {
                                      setCellStyleBorderRgbChannel(
                                        ch,
                                        Number((e.target as HTMLInputElement).value),
                                      );
                                    },
                                  },
                                }),
                              ]),
                            ),
                          ),
                        ],
                      ),
                    ],
                  );
                })(),
                h(
                  'label',
                  {
                    class: 'cx-table-cell-style-editor__border-width-row',
                    style: { display: 'flex', gap: '6px', alignItems: 'center' },
                  },
                  [
                    h('span', { style: { fontSize: '11px', width: '48px' } }, '宽度'),
                    h('input', {
                      class: 'cx-table-cell-style-editor__border-width-input',
                      attrs: {
                        type: 'text',
                        'data-cx-style-border': 'width',
                        placeholder: '1px',
                      },
                      domProps: { value: borderEffectiveField('Width') ?? '' },
                      style: { flex: '1', fontSize: '12px' },
                      on: {
                        input: (e: Event) => {
                          setCellStyleBorderWidth((e.target as HTMLInputElement).value);
                        },
                      },
                    }),
                  ],
                ),
                h(
                  'div',
                  {
                    class: 'cx-table-cell-style-editor__border-style-row',
                    attrs: { role: 'group', 'aria-label': 'Border style' },
                    style: { display: 'flex', gap: '4px' },
                  },
                  [
                    { value: null, label: '无', dataValue: 'none' },
                    { value: 'solid' as const, label: '实线', dataValue: 'solid' },
                    { value: 'dashed' as const, label: '虚线', dataValue: 'dashed' },
                    { value: 'dotted' as const, label: '点线', dataValue: 'dotted' },
                  ].map((opt) => {
                    const isActiveOpt = borderEffectiveField('Style') === opt.value;
                    return h(
                      'button',
                      {
                        attrs: {
                          type: 'button',
                          'data-cx-style-border-style': opt.dataValue,
                          'aria-pressed': isActiveOpt ? 'true' : 'false',
                        },
                        class: `cx-table-cell-style-editor__border-style-btn${isActiveOpt ? ' cx-table-cell-style-editor__border-style-btn--active' : ''}`,
                        style: {
                          flex: '1',
                          padding: '6px 4px',
                          fontSize: '12px',
                          background: isActiveOpt ? '#eff6ff' : '#ffffff',
                          border: '1px solid #d9dde2',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        },
                        on: { click: () => setCellStyleBorderStyle(opt.value) },
                      },
                      opt.label,
                    );
                  }),
                ),
                // radius widget hidden when per-side.
                borderTarget !== 'all'
                  ? null
                  : h(
                      'label',
                      {
                        class: 'cx-table-cell-style-editor__border-radius-row',
                        style: { display: 'flex', gap: '6px', alignItems: 'center' },
                      },
                      [
                        h('span', { style: { fontSize: '11px', width: '48px' } }, '圆角'),
                        h('input', {
                          class: 'cx-table-cell-style-editor__border-radius-input',
                          attrs: {
                            type: 'text',
                            'data-cx-style-border': 'radius',
                            placeholder: '0px',
                          },
                          domProps: { value: state.borderState.borderRadius ?? '' },
                          style: { flex: '1', fontSize: '12px' },
                          on: {
                            input: (e: Event) => {
                              setCellStyleBorderRadius((e.target as HTMLInputElement).value);
                            },
                          },
                        }),
                      ],
                    ),
              ],
            )
          : null;
        return h(
          'div',
          {
            ref: ((el: HTMLElement | null) => {
              cellStyleEditorPopoverRef.value = el;
            }) as never,
            class: 'cx-table-cell-style-editor',
            attrs: {
              'data-testid': 'cx-cell-style-editor',
              'data-row-id': state.rowId,
              'data-col-id': state.colId,
              'data-cx-style-active-tab': state.activeTab,
              role: 'dialog',
              'aria-label': 'Cell style editor',
            },
            style: {
              position: 'fixed',
              left: `${anchorRect.left}px`,
              top: `${popoverTop}px`,
              zIndex: 8,
              padding: '10px',
              background: '#ffffff',
              border: '1px solid #d9dde2',
              borderRadius: '4px',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.18)',
              width: `${SQUARE_SIZE_PX + 20}px`,
            },
          },
          [
            tabStrip,
            isFontTab ? fontWidgets : null,
            isBorderTab ? borderWidgets : null,
            isFontTab || isBorderTab
              ? null
              : h(
                  'div',
                  {
                    class: 'cx-table-cell-style-editor__sv-square',
                    attrs: { 'data-cx-style-square': '' },
                    style: {
                      position: 'relative',
                      width: `${SQUARE_SIZE_PX}px`,
                      height: `${SQUARE_SIZE_PX}px`,
                      background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueOnlyHex})`,
                      cursor: 'crosshair',
                      touchAction: 'none',
                    },
                    on: {
                      pointerdown: onSquarePointerDown,
                      pointermove: onSquarePointerMove,
                      pointerup: onSquarePointerUp,
                      pointercancel: onSquarePointerUp,
                    },
                  },
                  [
                    h('div', {
                      class: 'cx-table-cell-style-editor__sv-thumb',
                      style: {
                        position: 'absolute',
                        left: `${squarePos.positionPxX}px`,
                        top: `${squarePos.positionPxY}px`,
                        width: '10px',
                        height: '10px',
                        marginLeft: '-5px',
                        marginTop: '-5px',
                        borderRadius: '50%',
                        border: '2px solid #ffffff',
                        boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
                        pointerEvents: 'none',
                      },
                    }),
                  ],
                ),
            isFontTab || isBorderTab
              ? null
              : h(
                  'div',
                  {
                    class: 'cx-table-cell-style-editor__hue-strip',
                    attrs: { 'data-cx-style-hue': '' },
                    style: {
                      position: 'relative',
                      width: `${SQUARE_SIZE_PX}px`,
                      height: `${HUE_HEIGHT_PX}px`,
                      marginTop: '8px',
                      background:
                        'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
                      cursor: 'pointer',
                      touchAction: 'none',
                    },
                    on: {
                      pointerdown: onHuePointerDown,
                      pointermove: onHuePointerMove,
                      pointerup: onHuePointerUp,
                      pointercancel: onHuePointerUp,
                    },
                  },
                  [
                    h('div', {
                      class: 'cx-table-cell-style-editor__hue-thumb',
                      style: {
                        position: 'absolute',
                        left: `${huePosPx}px`,
                        top: '-2px',
                        width: '4px',
                        height: `${HUE_HEIGHT_PX + 4}px`,
                        marginLeft: '-2px',
                        background: '#ffffff',
                        border: '1px solid rgba(0,0,0,0.6)',
                        pointerEvents: 'none',
                      },
                    }),
                  ],
                ),
            isFontTab || isBorderTab
              ? null
              : h(
                  'div',
                  {
                    class: 'cx-table-cell-style-editor__rgb-row',
                    style: { display: 'flex', gap: '6px', marginTop: '8px' },
                  },
                  (['r', 'g', 'b'] as const).map((ch) =>
                    h('label', { class: 'cx-table-cell-style-editor__rgb-label' }, [
                      h(
                        'span',
                        {
                          style: { fontSize: '11px', marginRight: '2px' },
                        },
                        ch.toUpperCase(),
                      ),
                      h('input', {
                        class: 'cx-table-cell-style-editor__rgb-input',
                        attrs: {
                          type: 'number',
                          'data-cx-style-rgb': ch,
                          min: '0',
                          max: '255',
                          step: '1',
                        },
                        domProps: { value: String(rgb[ch]) },
                        style: { width: '48px', fontSize: '12px' },
                        on: {
                          input: (e: Event) => {
                            const raw = Number((e.target as HTMLInputElement).value);
                            setCellStyleEditorRgbChannel(ch, raw);
                          },
                        },
                      }),
                    ]),
                  ),
                ),
            isFontTab || isBorderTab
              ? null
              : h(
                  'div',
                  {
                    class: 'cx-table-cell-style-editor__hex-row',
                    style: { display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center' },
                  },
                  [
                    h('span', { style: { fontSize: '11px' } }, 'HEX'),
                    h('input', {
                      class: 'cx-table-cell-style-editor__hex-input',
                      attrs: {
                        type: 'text',
                        'data-cx-style-hex': '',
                      },
                      domProps: { value: hex },
                      style: { flex: '1', fontSize: '12px' },
                      on: {
                        input: (e: Event) => {
                          setCellStyleEditorHex((e.target as HTMLInputElement).value);
                        },
                      },
                    }),
                  ],
                ),
            // (2026-06-01 — vue2 port) +
            // (2026-06-02 — vue2 port): preset palette + recent row.
            // lifts the border-tab gate — palette now
            // renders on bg / text / border tabs.
            isFontTab
              ? null
              : (() => {
                  const validPresets = (props.cellStylePresetColors ?? []).filter((h0) =>
                    CELL_STYLE_HEX_REGEX.test(h0),
                  );
                  return h(
                    'div',
                    {
                      class: 'cx-table-cell-style-editor__palette',
                      style: { marginTop: '8px' },
                    },
                    [
                      validPresets.length === 0
                        ? null
                        : h(
                            'div',
                            {
                              class: 'cx-table-cell-style-editor__palette-row',
                              attrs: { 'data-cx-style-palette-section': 'preset' },
                              style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(12, 1fr)',
                                gap: '3px',
                              },
                            },
                            validPresets.map((swatchHex) =>
                              h('button', {
                                class: 'cx-table-cell-style-editor__swatch',
                                attrs: {
                                  type: 'button',
                                  'data-cx-style-palette-preset': swatchHex,
                                  title: swatchHex,
                                  'aria-label': swatchHex,
                                },
                                style: {
                                  backgroundColor: swatchHex,
                                  width: '14px',
                                  height: '14px',
                                  border: '1px solid #d1d5db',
                                  padding: '0',
                                  cursor: 'pointer',
                                },
                                on: {
                                  click: () => {
                                    setCellStyleEditorHex(swatchHex);
                                  },
                                },
                              }),
                            ),
                          ),
                      recentCellStyleColorsRef.value.length === 0
                        ? null
                        : h(
                            'div',
                            {
                              class: 'cx-table-cell-style-editor__palette-row',
                              attrs: { 'data-cx-style-palette-section': 'recent' },
                              style: {
                                display: 'flex',
                                gap: '3px',
                                marginTop: '4px',
                                alignItems: 'center',
                              },
                            },
                            [
                              h(
                                'span',
                                {
                                  style: {
                                    fontSize: '10px',
                                    color: '#6b7280',
                                    marginRight: '2px',
                                  },
                                },
                                '近期',
                              ),
                              ...recentCellStyleColorsRef.value.map((swatchHex) =>
                                h('button', {
                                  class: 'cx-table-cell-style-editor__swatch',
                                  attrs: {
                                    type: 'button',
                                    'data-cx-style-palette-recent': swatchHex,
                                    title: swatchHex,
                                    'aria-label': swatchHex,
                                  },
                                  style: {
                                    backgroundColor: swatchHex,
                                    width: '14px',
                                    height: '14px',
                                    border: '1px solid #d1d5db',
                                    padding: '0',
                                    cursor: 'pointer',
                                  },
                                  on: {
                                    click: () => {
                                      setCellStyleEditorHex(swatchHex);
                                    },
                                  },
                                }),
                              ),
                            ],
                          ),
                    ],
                  );
                })(),
            h(
              'div',
              {
                class: 'cx-table-cell-style-editor__actions',
                style: {
                  display: 'flex',
                  gap: '6px',
                  marginTop: '10px',
                  justifyContent: 'flex-end',
                },
              },
              [
                h(
                  'button',
                  {
                    class: 'cx-table-cell-style-editor__btn',
                    attrs: { type: 'button', 'data-cx-style-action': 'clear' },
                    on: { click: clearCellStyleForCurrentCell },
                  },
                  '清除',
                ),
                h(
                  'button',
                  {
                    class: 'cx-table-cell-style-editor__btn',
                    attrs: { type: 'button', 'data-cx-style-action': 'cancel' },
                    on: { click: cancelCellStyleEditor },
                  },
                  '取消',
                ),
                h(
                  'button',
                  {
                    class: 'cx-table-cell-style-editor__btn',
                    attrs: { type: 'button', 'data-cx-style-action': 'apply' },
                    on: { click: applyCellStyleEditor },
                  },
                  '应用',
                ),
              ],
            ),
          ],
        );
      })();

      const tableWrapper = h(
        'div',
        {
          // Vue 2.7's vnode-data ref accepts both string refs (Options
          // API) and function refs (composition API). The `as never`
          // cast bridges the wider Vue 2 ref type (Element | Component)
          // to our narrower HTMLElement signature — matches the gantt-
          // vue2 precedent at `adapters/gantt-vue2/src/chronix-gantt.ts:2924`.
          ref: ((el: HTMLElement | null) => {
            wrapperRef.value = el;
          }) as never,
          class: 'cx-table-wrapper',
          attrs: {
            role: 'grid',
            'aria-rowcount': String(ariaRowCount.value),
            'aria-colcount': String(ariaColCount.value),
            'data-table-version': '0.1.0-alpha',
          },
          style: wrapperStyle,
          on: {
            // (vue2 port): wrapper-level pointer move/up/cancel.
            pointermove: onRowDragPointerMove,
            pointerup: onRowDragPointerUp,
            pointercancel: onRowDragPointerCancel,
          },
        },
        [
          ...children,
          liveRegion,
          ...(rowDropLine != null ? [rowDropLine] : []),
          ...(contextMenuOverlay != null ? [contextMenuOverlay] : []),
          ...(cellStyleEditorPopover != null ? [cellStyleEditorPopover] : []),
        ],
      );
      // (2026-05-30 — vue2 port): tool-panel container wrap.
      // Verbatim mirror of vue3 root render branch with vue2
      // vnode-data delta (attrs: + on:).
      const cfg = props.toolPanel;
      if (cfg == null || !cfg.show || cfg.panels.length === 0) {
        return tableWrapper;
      }
      const side: 'left' | 'right' = cfg.side ?? 'right';
      const containerWidth = toolPanelWidth.value;
      const activeId = activeToolPanelId.value;
      const activeDescriptor: ToolPanelDescriptor | undefined = cfg.panels.find(
        (p) => p.id === activeId,
      );
      const toolPanelActiveIdx = toolPanelKbdNav.activeIndex.value;
      const iconRail = h(
        'div',
        {
          ref: ((el: HTMLElement | null) => {
            toolPanelRailRef.value = el;
          }) as never,
          class: 'cx-table-tool-panel-rail',
          attrs: {
            role: 'tablist',
            'aria-orientation': 'vertical',
          },
          style: { width: `${TOOL_PANEL_ICON_RAIL_WIDTH_PX}px` },
          on: {
            keydown: (e: KeyboardEvent) => toolPanelKbdNav.handleKeydown(e),
          },
        },
        cfg.panels.map((descriptor, idx) => {
          const isActive = descriptor.id === activeId;
          // roving tabindex via composable's activeIndex.
          const isKbdActive = toolPanelActiveIdx === idx;
          return h(
            'button',
            {
              key: descriptor.id,
              class: ['cx-table-tool-panel-icon', isActive && 'cx-table-tool-panel-icon--active']
                .filter(Boolean)
                .join(' '),
              attrs: {
                type: 'button',
                role: 'tab',
                tabindex: isKbdActive ? 0 : -1,
                'data-tool-panel-id': descriptor.id,
                'data-menu-item-index': String(idx),
                'aria-selected': isActive ? 'true' : 'false',
                'aria-controls': `cx-table-tool-panel-content-${descriptor.id}`,
                'aria-label': descriptor.ariaLabel ?? descriptor.label,
                title: descriptor.label,
              },
              on: {
                click: () => {
                  applyToolPanelChange(isActive ? null : descriptor.id);
                },
              },
            },
            descriptor.icon ?? descriptor.label.charAt(0),
          );
        }),
      );
      const contentArea =
        activeDescriptor != null
          ? h(
              'div',
              {
                class: 'cx-table-tool-panel-content',
                attrs: {
                  id: `cx-table-tool-panel-content-${activeDescriptor.id}`,
                  role: 'tabpanel',
                  'data-tool-panel-id': activeDescriptor.id,
                },
                style: { width: `${containerWidth - TOOL_PANEL_ICON_RAIL_WIDTH_PX}px` },
              },
              [activeDescriptor.renderer() as VNode | string],
            )
          : null;
      const resizer = h('div', {
        class: [
          'cx-table-tool-panel-resizer',
          resizingToolPanel.value && 'cx-table-tool-panel-resizer--active',
        ]
          .filter(Boolean)
          .join(' '),
        attrs: {
          role: 'separator',
          'aria-orientation': 'vertical',
          'data-testid': 'cx-tool-panel-resizer',
        },
        on: {
          pointerdown: onToolPanelResizePointerdown,
        },
      });
      const containerChildren =
        side === 'right'
          ? activeDescriptor != null
            ? [resizer, contentArea, iconRail]
            : [resizer, iconRail]
          : activeDescriptor != null
            ? [iconRail, contentArea, resizer]
            : [iconRail, resizer];
      const containerActualWidth =
        activeDescriptor != null ? containerWidth : TOOL_PANEL_ICON_RAIL_WIDTH_PX;
      const toolPanelContainer = h(
        'div',
        {
          class: 'cx-table-tool-panel-container',
          attrs: {
            'data-tool-panel-side': side,
            role: 'region',
            'aria-label': 'Tool panels',
          },
          style: { width: `${containerActualWidth}px` },
        },
        containerChildren as VNode[],
      );
      return h(
        'div',
        {
          class: 'cx-table-with-tool-panel',
          attrs: { 'data-tool-panel-side': side },
        },
        side === 'right' ? [tableWrapper, toolPanelContainer] : [toolPanelContainer, tableWrapper],
      );
    };
  },
});

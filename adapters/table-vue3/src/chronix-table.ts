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
  DEFAULT_TOOL_PANEL_MAX_WIDTH_PX,
  DEFAULT_TOOL_PANEL_MIN_WIDTH_PX,
  DEFAULT_TOOL_PANEL_WIDTH_PX,
  TOOL_PANEL_ICON_RAIL_WIDTH_PX,
  type RowAction,
  type RowDataSource,
  type RowSpec,
  type RowValidator,
  type RowValidationViolation,
  type ToolPanelChangePayload,
  type ToolPanelConfig,
  type ToolPanelDescriptor,
  type ToolPanelWidthChangePayload,
  type ContextMenuConfig,
  type ContextMenuContext,
  type ContextMenuItem,
  type ContextMenuOpenPayload,
  type NumberFilterSpec,
  type SortSpec,
  type TextFilterSpec,
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
 * of chronix-gantt's `GanttHandle` — every consumer-facing read or
 * imperative action lives on this object, exposed via Vue 3's
 * `expose()`. ships the minimum read surface; per-feature
 * phases extend it (sort / filter / edit / selection / resize
 * methods land in their owning phases).
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
   * + 8.1 (2026-05-24): read the current ordered sort spec.
   * Empty array = no sort. Single-column sort = one-entry array.
   * Multi-column sort = N-entry array in lex-order priority.
   * Internal-only state ownership (no controlled `sortSpec` prop in
   * per Decision C.1; keeps the same posture).
   */
  getSort(): readonly SortSpec[];
  /**
   * + 8.1: apply a sort spec. Accepts a single `SortSpec`
   * (wrapped into a one-entry array for convenience), a full ordered
   * `readonly SortSpec[]`, or `null` (cleared = empty array).
   * Silently rejects atomically when any entry's column has
   * `sortable === false` or doesn't exist. Triggers the
   * `sort-change` emit on successful application.
   */
  setSort(spec: SortSpec | readonly SortSpec[] | null): void;
  /** + 8.1: convenience for `setSort(null)`. */
  clearSort(): void;
  /**
   * read the current ordered filter spec.
   * Empty array = no filter. Multi-column filter = N-entry array
   * with multi-column AND semantics. Internal-only state ownership
   * (no controlled `filterSpec` prop; same posture as
   * sort).
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
   * `parseAndSetAdvancedFilter` (so consumers can round-trip the
   * input text into a controlled input).
   */
  getAdvancedFilter(): {
    readonly expression: FilterExpression;
    readonly source: string | null;
  } | null;
  /**
   * apply an advanced filter expression — wraps the AST
   * in an `ExpressionFilterSpec` and dispatches via the same path
   * `setFilter` uses, preserving any pre-existing `text` / `number`
   * variants in the current spec. Pass `null` to remove just the
   * expression entry while leaving other variants in place.
   */
  setAdvancedFilter(expression: FilterExpression | null, source?: string): void;
  /**
   * parse a DSL string with `parseFilterExpression` and
   * apply it on success; returns the parser result so consumers can
   * render error UIs without separately invoking the parser. The
   * empty-input identity case returns `{ok: true, expression: null}`
   * and clears any active advanced filter (mirrors the parser
   * semantics).
   */
  parseAndSetAdvancedFilter(text: string): ParseFilterExpressionResult;
  /**
   * collect the unique values appearing in a
   * given column across the table's CURRENT rows (pre-filter). The
   * returned envelope drives the set-filter dropdown UI;
   * consumers building their own filter UIs can reuse this helper to
   * render category lists / facets. `maxValues` defaults to 10000
   * (matches the core helper). When the unique-value count exceeds
   * the cap, `truncated: true` surfaces on the result envelope.
   */
  getColumnUniqueValues(
    colId: string,
    options?: { maxValues?: number },
  ): CollectUniqueColumnValuesResult;
  /**
   * read the current quick-find needle. Empty
   * string = no quick-find active (identity case). Internal-only
   * state ownership (no controlled `quickFindText` prop; same posture
   * as filter / sort).
   */
  getQuickFindText(): string;
  /**
   * apply a quick-find needle. Accepts a string (empty
   * string clears), `null`, or `undefined` (both coerced to `''`).
   * Triggers the `quick-find-text-change` emit when the needle
   * actually changes (no-op dedup on identical strings). A non-empty
   * → empty (or empty → non-empty) transition resets pagination to
   * page 0 (matches Decision C.1 for filter transitions).
   */
  setQuickFindText(text: string | null | undefined): void;
  /**
   * read the current top-level match count after `quickFindPass`
   * runs. Equals `props.rows.length` when no quick-find is active. For
   * tree data, counts top-level retained rows only (not deep descendants).
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
   * Always returns `0` when `paginationEnabled` is `false`. When
   * pagination is on, the value reflects `pagePass`'s clamped
   * `currentPage` — programmatic `setPage(99)` over a 3-page
   * dataset returns `2` from the next `getPage()` call.
   */
  getPage(): number;
  /**
   * set the 0-based page index. Out-of-range values are
   * silently clamped by `pagePass` to `[0, totalPages - 1]`. Fires
   * `page-change` emit on transition (no-op when target equals the
   * current clamped page). Calling with the same page is a no-op
   * (no emit storm).
   */
  setPage(page: number): void;
  /**
   * read the current rows-per-page. Returns the configured
   * `initialPageSize` (or the latest `setPageSize` value) regardless
   * of whether pagination is currently active.
   */
  getPageSize(): number;
  /**
   * set rows-per-page. Triggers a `page-change` emit on
   * transition; may also adjust `currentPage` downward if the new
   * `pageSize` collapses the row set into fewer pages than the
   * current page index. Values `<= 0` are accepted but turn
   * pagination into the passthrough state (one conceptual page).
   */
  setPageSize(pageSize: number): void;
  /**
   * read the total page count after filter + sort + page.
   * `1` when `paginationEnabled` is `false`; `0` when paginated and
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
   * `cell-edit-start` on transition.
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
   * `resizable: false`. Fires `column-resize-start`.
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
   * programmatically — bypasses the 5px pointerdown→pointermove
   * threshold. Equivalent to the user grabbing the header cell and
   * dragging past the threshold instantly. Silent no-op when the
   * column doesn't exist, is `reorderable: false`, or another move
   * is already in flight. Fires `column-move-start`.
   */
  startMovingColumn(colId: string): void;
  /**
   * commit the in-flight move at the specified target.
   * `targetColId` + `position` together identify the drop boundary.
   * Fires `column-order-change` iff the resulting column array
   * differs from the current `columns` prop (no-op dedup); always
   * fires `column-move-stop {committed: true}`. No-op when no move
   * is in progress.
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
   * move is active. The returned shape is a snapshot at call time;
   * subsequent pointermoves will produce a new `ColumnMoving` object
   * (immutable mutation).
   */
  getMovingColumn(): ColumnMoving | null;
  /**
   * open a row-drag session for `rowId`
   * programmatically. Marks the move state and fires
   * `row-move-start`. Silent no-op when the row doesn't exist, is
   * `draggable: false`, is pinned, or another move is already in
   * flight.
   */
  startMovingRow(rowId: string): void;
  /**
   * commit the in-flight row-drag session to
   * a specific drop target. Fires `row-order-change` iff the
   * resulting rows array differs from `props.rows`; always fires
   * `row-move-stop {committed: true}`. No-op when no move is in
   * flight.
   */
  commitRowMove(targetRowId: string, position: 'above' | 'below'): void;
  /**
   * cancel the in-flight row-drag session.
   * Fires `row-move-stop {committed: false}`. No `row-order-change`
   * emit.
   */
  cancelRowMove(): void;
  /**
   * read the current `RowMoving` transaction
   * (or `null` when no drag is active). The shape mirrors
   * `getMovingColumn` on the Y-axis.
   */
  getMovingRow(): RowMoving | null;
  /**
   * drop the server-side block cache + abort
   * any in-flight `getRows` calls; subsequent body renders re-request
   * blocks. No-op when `rowModelType !== 'serverSide'`.
   */
  refreshServerSideRows(): void;
  /**
   * partial cache invalidation. For each
   * input blockIndex: LOADING blocks are aborted + removed; LOADED +
   * ERROR blocks are removed; IDLE blocks (= not in cache) are
   * silently skipped. `totalRowCount`, the current sort/filter state,
   * and every non-invalidated block are LEFT UNTOUCHED — only the
   * named blocks return to IDLE state + are re-fetched on the next
   * `getRowAt`. No-op when `rowModelType !== 'serverSide'` or when
   * the input array is empty.
   */
  invalidateServerSideBlocks(blockIndices: readonly number[]): void;
  /**
   * server-reported total row count for the
   * active view. Returns `0` before the first response or when not
   * in server-side mode.
   */
  getServerSideTotalRowCount(): number;
  /**
   * snapshot of the per-block state machine
   * for diagnostics + adapter wiring tests. Returns
   * `{ kind: 'idle' }` for never-touched blocks. Returns
   * `{ kind: 'idle' }` when not in server-side mode.
   */
  getServerSideBlockState(blockIndex: number): BlockState;
  /**
   * open a tool panel by descriptor id. No-op
   * when the id doesn't exist in `props.toolPanel.panels` or when
   * `toolPanel` is not configured. Fires `tool-panel-change`.
   */
  openToolPanel(id: string): void;
  /**
   * collapse the tool-panel content area. The
   * icon rail stays visible. Fires `tool-panel-change` with
   * `activePanelId: null`.
   */
  closeToolPanel(): void;
  /**
   * read the currently active tool-panel id.
   * Returns `null` when the content area is collapsed or when
   * `toolPanel` is not configured.
   */
  getActiveToolPanelId(): string | null;
  /**
   * -A (2026-05-30): open the column header menu for `colId`.
   * Closes any other open header menu first. No-op when
   * `showColumnHeaderMenu === false` or `colId` doesn't exist.
   */
  openColumnHeaderMenu(colId: string): void;
  /**
   * -A (2026-05-30): close the open column header menu.
   * No-op when no menu is open.
   */
  closeColumnHeaderMenu(): void;
  /**
   * -A (2026-05-30): read the colId of the currently open
   * column header menu. Returns `null` when no menu is open.
   */
  getOpenColumnHeaderMenuColId(): string | null;
  /**
   * -B (2026-05-30): open the cell context menu at viewport
   * coordinates `(x, y)` for cell `(rowId, colId)`. No-op when
   * `contextMenu` prop is `null` or `items` is empty. Fires
   * `context-menu-open`.
   */
  openContextMenuAt(rowId: string | null, colId: string | null, x: number, y: number): void;
  /**
   * -B (2026-05-30): close the cell context menu.
   * Fires `context-menu-close` if a menu was open.
   */
  closeContextMenu(): void;
  /**
   * -B (2026-05-30): read the open context menu's position
   * + cell coordinates. Returns `null` when no menu is open.
   */
  getOpenContextMenuPosition(): {
    readonly rowId: string | null;
    readonly colId: string | null;
    readonly x: number;
    readonly y: number;
  } | null;
  /**
   * open the cell style editor popover for
   * the cell at `(rowId, colId)`. No-op when `enableCellStyleEditor`
   * SFC prop is `false` or the cell is not currently rendered.
   * Composes `@chronixjs/cx-kit`'s KitColorPicker helpers
   * for the HSV picker math. Apply / Clear fire `cell-style-change`.
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
   * programmatically open / extend / clear the
   * cell-range. Passing a `CellRange` with `focus === anchor` opens a
   * single-cell range; passing one with focus !== anchor opens the
   * range AND immediately extends focus (emits cell-range-start +
   * cell-range-change). Passing `null` is equivalent to
   * `clearCellRange()`. No-op when `cellRangeSelection !== 'enabled'`.
   */
  setCellRange(range: CellRange | null): void;
  /**
   * clear the active cell-range. Fires `cell-range-stop`
   * with the last-known range envelope so observers can react to the
   * clear (e.g., dismiss a "copy" toast). No-op when no range is
   * active OR when `cellRangeSelection !== 'enabled'`.
   */
  clearCellRange(): void;
  /**
   * read the current cell-range as the canonical 2-point
   * form `{anchor, focus}`. Returns `null` when no range is active.
   * Consumers needing the resolved `{rowIds, colIds}` rectangle
   * should call `computeCellRangeEnvelope(range, displayedRowIds,
   * displayedColIds)` themselves, OR observe the `cell-range-change`
   * emit payload (which carries both forms).
   */
  getCellRange(): CellRange | null;
  /**
   * synthesize a TSV string over the active
   * cell-range envelope + write it to `navigator.clipboard`. Mirrors
   * the Ctrl+C keyboard path so consumers can drive the same flow
   * without a real keyboard event. Returns the TSV string on success,
   * or `null` when no range is active OR `cellRangeSelection !==
   * 'enabled'`. The `navigator.clipboard.writeText` failure path
   * (non-secure context, clipboard policy block) is swallowed — the
   * returned string + the emit still fire so consumers can implement
   * their own fallback (e.g., manual textarea-select hack).
   */
  copyCellRangeToClipboard(): Promise<string | null>;
  /**
   * read TSV from `navigator.clipboard` →
   * parse → map against the active cell-range envelope (1×1 fill-
   * all + N×M clamp-overflow per Decision A.1) → coerce per
   * `column.type` via `coerceEditDraftValue` → emit
   * `cell-range-paste` with the mutations array. Mirrors the Ctrl+V
   * keyboard path so consumers can drive the same flow without a
   * real keyboard event. Returns the mutations array on success, or
   * `null` when no range is active OR `cellRangeSelection !==
   * 'enabled'` OR the clipboard read failed (non-secure context /
   * clipboard policy block). Consumers apply the mutations to their
   * `rows` array — emit-only persistence, identical write-back
   * contract 's `cell-value-change`.
   */
  pasteCellRangeFromClipboard(): Promise<readonly PasteMutation[] | null>;
  /**
   * programmatic drag-fill commit. Extends the
   * active cell-range envelope to include `targetCell` (axis-locked per
   * Decision A.1), computes the constant-fill mutations via
   * `computeDragFillMutations`, emits `cell-range-fill` (with `jsEvent:
   * null` for the programmatic path), and auto-extends the active
   * `cellRange` to cover the fill envelope so the post-call selection
   * matches the visible fill extent.
   *
   * Returns the mutations array on success, or `null` when no range is
   * active OR `cellRangeSelection !== 'enabled'` OR `targetCell` falls
   * outside the displayed grid OR `targetCell` is inside / above-left
   * of the source (no preview, no commit).
   */
  fillCellRange(targetCell: CellRef): readonly PasteMutation[] | null;
  /**
   * pop the newest entry from the internal
   * mutation-history `past` stack + fire `history-replay` with the
   * REVERSED batch (consumer applies via the same Map-keyed batch-
   * write code used for paste / fill). The popped batch moves to
   * `future` so a subsequent `redo()` can replay it forward.
   *
   * Returns `true` if a batch was undone, `false` when `past` was
   * empty (no-op) or `enableUndoHistory !== true`.
   */
  undo(): boolean;
  /**
   * pop the newest entry from the internal mutation-history
   * `future` stack + fire `history-replay` with the ORIGINAL batch.
   * The popped batch moves back to `past`.
   *
   * Returns `true` if a batch was redone, `false` when `future` was
   * empty (no-op) or `enableUndoHistory !== true`.
   */
  redo(): boolean;
  /** `true` when the next `undo()` call would do something. */
  canUndo(): boolean;
  /** `true` when the next `redo()` call would do something. */
  canRedo(): boolean;
  /**
   * reset the internal mutation history to
   * `EMPTY_MUTATION_HISTORY` + fire `history-change` so consumer UI
   * (undo/redo buttons) updates its disabled state. Useful when the
   * consumer rejects a mutation emit out-of-band and the recorded
   * batch no longer matches the actual data.
   */
  clearHistory(): void;
  /**
   * read the current internal `{past, future}` state.
   * Consumers wanting to persist the history (e.g., to localStorage)
   * can `JSON.stringify(handle.getHistory())` here + restore via
   * repeated `recordMutationBatch` after re-mount.
   */
  getHistory(): MutationHistoryState;
  /**
   * manually append a custom batch to the history. The
   * append goes through the same `appendMutationBatch` helper as the
   * auto-recorded gestures + fires `history-change`. Lets consumers
   * record bulk-imports / undo-able custom edits that bypass the 3
   * built-in mutation emit paths (cell-value-change / cell-range-paste
   * / cell-range-fill). No-op when `enableUndoHistory !== true`.
   */
  recordMutationBatch(batch: MutationBatch): void;
  /**
   * programmatic equivalent of the column-
   * visibility-menu checkbox click. Fires `column-visibility-change`
   * with `{colId, hidden, jsEvent: null}` on transition (no-op when
   * the column's current `hide` matches the requested value). Honors
   * the "at least one column visible" guard per Decision C.1 — calling
   * with `hidden: true` when the target is the only visible column is
   * a silent no-op. Consumers consume the emit + rebuild the `columns`
   * prop with the new `hide` value (emit-only persistence per A.1).
   */
  setColumnVisibility(colId: string, hidden: boolean): void;
  /**
   * convenience for toggling a column's `hide` state. Reads
   * the current `columns` prop, flips the target's `hide` field, then
   * routes through `setColumnVisibility` (so the C.1 guard + emit
   * fire as normal).
   */
  toggleColumnVisibility(colId: string): void;
  /**
   * read the current keyboard-driven active
   * cell. Returns `null` when no cell is active (default / cleared
   * via Escape / cleared via `clearActiveCell`). Independent of
   * `enableKeyboardNavigation` — `setActiveCell` from outside the
   * keyboard handler still works.
   */
  getActiveCell(): CellRef | null;
  /**
   * programmatically set the active cell. Fires
   * `active-cell-change` on transition. No-op when the requested
   * cell equals the current active cell (dedup).
   */
  setActiveCell(rowId: string, colId: string): void;
  /**
   * programmatically clear the active cell. Fires
   * `active-cell-change` with `rowId: null, colId: null` on
   * transition.
   */
  clearActiveCell(): void;
  /**
   * programmatically expand a tree row. No-op
   * when the row is already expanded or has no `children`. Fires
   * `expanded-change` with the next id list on transition.
   */
  expandRow(rowId: string): void;
  /**
   * programmatically collapse a tree row. No-op
   * when the row is already collapsed or has no `children`. Fires
   * `expanded-change` with the next id list on transition.
   */
  collapseRow(rowId: string): void;
  /**
   * return the lazy-load status for a row.
   * Returns `'idle'` when the row has no entry in the lazy state Map
   * (default — no load attempted yet). For sync tree rows (with
   * `children` set), always returns `'idle'`.
   */
  getLazyChildrenState(rowId: string): LazyChildrenStatus | 'idle';
  /**
   * return the cached lazy children for a row.
   * Returns the cached array when status is `'loaded'`, else `null`.
   */
  getLazyChildren(rowId: string): readonly RowSpec[] | null;
  /**
   * drop the lazy state entry for a row (or all
   * rows when `rowId` is omitted). Forces a re-fetch on next expand.
   * Does NOT abort an in-flight load — call after collapsing the row
   * if needed.
   */
  invalidateLazyChildren(rowId?: string): void;
  /**
   * serialize the current rows + columns into
   * a CSV string and trigger a browser download. Side-effecting wrapper
   * around the pure `exportToCsv` core helper. `rowSource` selects which
   * row set to export (default `'filtered'`). `visibleColumnsOnly`
   * limits the columns to those currently visible (default `true`).
   * Pass `options.csvOptions` to forward separator / eol / etc to the
   * pure helper.
   */
  exportToCsv(filename: string, options?: TableHandleExportToCsvOptions): void;
  /**
   * project the current `(columns, sort, filter,
   * page, pageSize)` state into a JSON-serializable `TableViewState`
   * snapshot. Side-effect-free. Consumers `JSON.stringify` the result
   * for whichever persistence layer they choose (localStorage / URL
   * hash / server profile / Yjs). The pure helper is also exported
   * from `@chronixjs/table` for non-adapter contexts.
   */
  getTableView(): TableViewState;
  /**
   * reconcile a saved `TableViewState` against
   * the current `columns` prop + dispatch the resolved fields to the
   * 4 setters (`setSort` / `setFilter` / `setPage` / `setPageSize`) +
   * emit `columns-change` once with the reconciled columns array so
   * the consumer rebuilds the prop atomically. Foreign / unknown
   * `version` inputs are silently no-op'd. Drops sort/filter entries
   * whose `colId` is missing from the reconciled column list. Columns
   * present in the current prop but absent from the snapshot are
   * appended at the end in declared order (newly-added columns).
   */
  applyTableView(state: TableViewState): void;
  /**
   * serialize the current rows + columns into an
   * XLSX `ArrayBuffer` and trigger a browser download. Side-effecting
   * wrapper around the pure `exportToXlsx` core helper (which
   * dynamic-imports `exceljs`). `rowSource` / `visibleColumnsOnly`
   * mirror `exportToCsv` semantics verbatim; pass `options.xlsxOptions`
   * for `sheetName` / `includeHeaders` / `columnIds`.
   *
   * Returns a `Promise<void>` that resolves AFTER the download anchor
   * fires — consumers can `await` to show a "done" toast. Throws when
   * `exceljs` is not installed (consumers MUST add it themselves; it's
   * an optional peer dependency on `@chronixjs/table` to avoid
   * burdening CSV-only consumers with the ~800KB cost).
   */
  exportToXlsx(filename: string, options?: TableHandleExportToXlsxOptions): Promise<void>;
  /**
   * produce a multi-sheet .xlsx workbook in
   * one call. Each entry in `sheets` becomes its own worksheet inside
   * the workbook; the adapter resolves each entry's `rowSource` +
   * `columnIds` + `includeHeaders` using the same internal state
   * machine as `exportToXlsx`. Per-sheet `sheetName` controls the tab
   * label inside Excel. Throws when `exceljs` is not installed
   * (optional peer dependency).
   */
  exportToXlsxMultiSheet(filename: string, sheets: readonly AdapterXlsxSheetSpec[]): Promise<void>;
  /**
   * snapshot of every cell currently flagged
   * invalid (per-cell validator OR per-row rowValidator OR
   * `validatorAsync`). Returns entries in insertion order; mutates
   * only via subsequent commits (no internal write surface).
   */
  getInvalidCells(): readonly InvalidCellEntry[];
  /**
   * read the multi-filter entry at the
   * given tree path. Empty path throws — root spec isn't itself
   * an entry (use `getFilter()` for root). Returns `null` when the
   * column has no multi-filter spec OR the path goes out of range
   * OR drills past a leaf.
   */
  getMultiFilterEntryAtPath(colId: string, path: readonly number[]): MultiFilterEntry | null;
  /**
   * immutable replace of the entry at the
   * given tree path. Empty path throws — use `setFilter` for root.
   * No-op when path is out of range. Spreads intermediate groups
   * along the path; unrelated branches stay by reference.
   */
  setMultiFilterEntryAtPath(colId: string, path: readonly number[], next: MultiFilterEntry): void;
  /**
   * immutable remove of the entry at the
   * given tree path. Empty path throws — use `setFilter(null)` to
   * clear. No-op when path is out of range or column has no spec.
   */
  removeMultiFilterEntryAtPath(colId: string, path: readonly number[]): void;
}

/**
 * single invalid-cell record surfaced via
 * `TableHandle.getInvalidCells()` and the `invalid-cells-change`
 * emit payload. `error` is the same `EditValidationError` shape the
 * `cell-edit-stop` payload carries on validator rejection.
 */
export interface InvalidCellEntry {
  readonly rowId: string;
  readonly colId: string;
  readonly error: EditValidationError;
}

/**
 * per-sheet spec accepted by
 * `TableHandle.exportToXlsxMultiSheet`. Each spec carries its own
 * sheet name + row-source resolution choice + optional column subset.
 * Defaults mirror `exportToXlsx`'s single-sheet wrapper.
 */
export interface AdapterXlsxSheetSpec {
  /** Sheet name shown as the tab label in Excel. Required. */
  readonly sheetName: string;
  /** Which row set to use. Default `'filtered'`. Same enum as `exportToCsv`. */
  readonly rowSource?: 'all' | 'visible' | 'filtered' | 'selected';
  /**
   * Subset of column ids to export, in the given order. When omitted,
   * exports every visible column in declared order.
   */
  readonly columnIds?: readonly string[];
  /** When `false`, omit the header row for this sheet. Default `true`. */
  readonly includeHeaders?: boolean;
  /**
   * forward xlsx-level options for this sheet.
   * Merged with the adapter-generated `sheetName` / `includeHeaders`
   * (this field's values take precedence). The most common use is
   * `{ freezePane: { xSplit: N, ySplit: 1 } }` for frozen rows /
   * columns; other fields (`columnIds`) duplicate what's already in
   * the spec and are typically left unset here.
   */
  readonly xlsxOptions?: ExportToXlsxOptions;
}

/**
 * options for `TableHandle.exportToCsv`. Mirrors
 * the pure helper's options + adds the row-source + column-subset
 * choices needed by the side-effecting wrapper.
 */
export interface TableHandleExportToCsvOptions {
  /**
   * Which row set to export. Default `'filtered'` (post-filter, matches
   * the footer aggregator scope). `'all'` exports `props.rows` verbatim
   * (skips pinned-row extraction + filter + sort + page). `'visible'`
   * exports the current page slice + pinned rows (what the user sees).
   * `'selected'` exports only rows whose id is in `selectedRowIds`.
   */
  readonly rowSource?: 'all' | 'visible' | 'filtered' | 'selected';
  /** When `false`, export ALL columns (including `hide: true`). Default `true`. */
  readonly visibleColumnsOnly?: boolean;
  /** Options forwarded verbatim to the pure `exportToCsv` core helper. */
  readonly csvOptions?: ExportToCsvOptions;
}

/**
 * options for `TableHandle.exportToXlsx`. Mirrors
 * `TableHandleExportToCsvOptions` for the row-source + column-subset
 * choices, with `xlsxOptions` replacing `csvOptions` as the pass-through
 * to the pure `exportToXlsx` core helper.
 */
export interface TableHandleExportToXlsxOptions {
  /** Which row set to export. Same enum as `exportToCsv`. Default `'filtered'`. */
  readonly rowSource?: 'all' | 'visible' | 'filtered' | 'selected';
  /** When `false`, export ALL columns (including `hide: true`). Default `true`. */
  readonly visibleColumnsOnly?: boolean;
  /** Options forwarded verbatim to the pure `exportToXlsx` core helper. */
  readonly xlsxOptions?: ExportToXlsxOptions;
}

/**
 * payload for the `cell-click` emit. Fires
 * when a body cell receives a primary-button click. `value` is the
 * post-`valueGetter` cell value (the same value `valueFormatter` /
 * `cellClass` would see during render).
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
 * payload for the `header-click` emit. Fires
 * when a header cell receives a primary-button click.
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
 */
export interface HeaderGroupClickPayload {
  readonly groupName: string;
  readonly colIds: readonly string[];
  readonly jsEvent: MouseEvent;
}

/**
 * payload for the `empty-area-click` emit. Fires when a body
 * click lands inside `.cx-table-body-content` but NOT on any row
 * (e.g., in padding when the body height exceeds totalBodyHeight).
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
 * + 8.1 (2026-05-24): payload for the `sort-change` emit.
 * Fires every time the internal sort state transitions — including
 * transitions back to `[]` (sort cleared) or to / from a multi-column
 * lex-order arrangement. Consumers can mirror `sortSpec` into
 * external state (URL, store) without using a controlled prop.
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
 */
export interface FilterChangePayload {
  readonly filterSpec: readonly FilterSpec[];
}

/**
 * payload for the `quick-find-text-change`
 * emit. Fires every time the internal quick-find needle transitions
 * — including transitions back to `''` (cleared) and per-keystroke
 * when the consumer calls `setQuickFindText` from a controlled
 * input. Consumers can mirror `quickFindText` into external state
 * without a controlled prop (same posture as `filter-change` /
 * `sort-change`).
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
 */
export interface SelectionChangePayload {
  readonly selectedRowIds: readonly string[];
}

/**
 * payload for `cell-edit-start` — fires
 * when the user (or programmatic `startEditingCell`) opens an
 * editor on a cell. `baseValue` mirrors the cell's pre-edit value
 * after `valueGetter`. `draftValue` initialises equal to baseValue
 * (or its formatted string, depending on the consumer's
 * valueFormatter — see Decision B.1).
 */
export interface CellEditStartPayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly baseValue: unknown;
  readonly draftValue: unknown;
}

/**
 * payload for `cell-edit-stop` — fires on
 * every commit-attempt resolution. Three outcomes:
 *
 * - **Commit success** (Enter / Tab / Blur with valid input):
 *   `committed: true`, `finalValue: draftValue`. Edit session ENDS.
 *   Followed by a `cell-value-change` emit iff `draftValue !==
 *   baseValue` (no-op dedup matches applySelection
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
   * populated only when the commit was
   * rejected by `column.validator` OR `column.validatorAsync`
   * . Absent for commit-success, cancel, and
   * coerce-rejected outcomes. When `code === 'async-error'` (Phase
   * 111 E.1), the rejection came from a thrown Promise rather than
   * a business-validation failure.
   */
  readonly validationError?: EditValidationError;
}

/**
 * payload for `cell-edit-validation-pending`
 * — fires when `column.validatorAsync` starts (i.e. coerce + sync
 * `validator` both passed). The editor remains open while the
 * promise is in flight; the cell paints
 * `cx-table-cell--validating` + `data-cell-validating="true"` +
 * `aria-busy="true"`. Followed by `cell-edit-stop` on final resolve.
 *
 * `draftValue` is the post-coerce typed value passed to
 * `validatorAsync` — same shape `cell-value-change`
 * uses for `newValue`. Consumers can mirror it into their own
 * "validating cells" state.
 */
export interface CellEditValidationPendingPayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly draftValue: unknown;
}

/**
 * args for the `multiFilterChildRenderer`
 * slot-prop. Consumer's renderer receives the column + slot context
 * + the current `MultiFilterChild` + a `setChildValue` callback for
 * write access. Returning `null` from the renderer falls back to the
 * built-in widget for `slotKind`.
 */
export interface MultiFilterChildRendererArgs {
  readonly column: ColumnSpec;
  readonly slotIdx: number;
  readonly slotKind: 'text' | 'number' | 'set';
  /**
   * widened to `MultiFilterEntry` so the
   * renderer can receive a group entry (when the consumer has
   * injected a nested-group spec via `setFilter`). Consumers writing
   * a renderer that only handles text/number/set leaves can narrow
   * with a `child.type !== 'group'` guard.
   */
  readonly child: MultiFilterEntry;
  readonly setChildValue: (next: MultiFilterEntry) => void;
}

/**
 * payload for `invalid-cells-change` —
 * fires AFTER the SFC's internal invalid-cell map mutates. Common
 * triggers:
 *
 * - per-cell sync `validator` rejects a commit
 * - per-cell `validatorAsync` resolves to a rejection
 * - a successful commit clears a stale invalid marker
 * - `rowValidators` returns violations after a commit lands
 * - paste/drag-fill batch lands + rowValidators flags some cells
 *
 * `entries` is a frozen snapshot of the current invalid state;
 * `count` is the entries length (provided for the common "show a
 * badge with the count" use case so consumers don't recompute on
 * every emit).
 */
export interface InvalidCellsChangePayload {
  readonly entries: readonly InvalidCellEntry[];
  readonly count: number;
}

/**
 * payload for `add-multi-filter-slot` —
 * fires when the user clicks the `+` button at the bottom of a
 * multi-filter `<details>` panel. Consumer mirrors by appending
 * `slotKind` to `column.multiFilterChildTypes` AND extending the
 * in-flight `MultiFilterSpec.filters[]` (or letting the next
 * bootstrap regenerate the spec from the longer config).
 *
 * v1 always emits `slotKind: 'text'` — a future phase may add a
 * type-picker dropdown to choose between `'text' | 'number'` per
 * click.
 */
export interface AddMultiFilterSlotPayload {
  readonly colId: string;
  readonly slotKind: 'text' | 'number';
  /**
   * tree path to the GROUP under which
   * the new slot should be appended. Empty path / undefined =
   * root group (legacy shape). Consumer mirrors by
   * inserting the new entry into the group at the given path.
   */
  readonly path?: readonly number[];
}

/**
 * payload for `remove-multi-filter-slot` —
 * fires when the user clicks the `×` button next to a specific
 * slot. Consumer mirrors by splicing
 * `column.multiFilterChildTypes` at `slotIdx` AND removing the
 * same index from the in-flight `MultiFilterSpec.filters[]`.
 *
 * The `×` button is disabled (and the emit suppressed) when slot
 * count = 1 — at-least-one-slot is invariant.
 */
export interface RemoveMultiFilterSlotPayload {
  readonly colId: string;
  readonly slotIdx: number;
  /**
   * tree path to the slot's parent
   * group. Empty path / undefined = root (legacy).
   * Full path to the slot itself = `[...path, slotIdx]`.
   */
  readonly path?: readonly number[];
}

/**
 * payload for `add-multi-filter-group` —
 * fires when the user clicks `+ 添加分组` to nest a new empty
 * group inside the current group at `path`. Consumer mirrors by
 * inserting `{ type: 'group', mode: 'AND', filters: [] }` (or
 * their preferred default mode + initial entry) into the parent
 * group's `filters[]`.
 */
export interface AddMultiFilterGroupPayload {
  readonly colId: string;
  readonly path: readonly number[];
}

/**
 * payload for `remove-multi-filter-group` —
 * fires when the user clicks `×` on a non-root group. Consumer
 * mirrors by splicing the entry at `path` out of its parent
 * group's `filters[]`.
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
  // per-side border overrides (12
  // fields = 4 sides × 3 axes). Each optional; per-side fields
  // OVERRIDE the all-sides shorthand on that side via CSS cascade.
  // No per-side `borderRadius` (radii are corner-not-side in CSS;
  // trigger).
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

// internal mutable variant of CellStyle
// used for in-place Apply/Clear builders + the adapter-local map
// storage. Mirrors CellStyle field-for-field but drops `readonly`
// modifiers so the Apply branch can construct entries via
// `nextForCell.X = value` / `delete nextForCell.X`. Centralizes the
// shape so future widening edits a single type.
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
 * `cellStylePresetColors` SFC prop. 12-color palette spanning warm
 * (red/orange/yellow), cool (green/teal/blue/indigo/violet/pink),
 * neutral (gray), and 2-tone (black + white). Tailwind 400-shade
 * baseline (legible on both light + dark backgrounds). Consumers
 * with brand systems override the prop entirely with their own
 * palette; consumers happy with the default omit the prop.
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
 * internal in-flight column-resize
 * transaction. Created on `pointerdown` over a header resizer;
 * updated on every `pointermove` (draftWidth changes); cleared on
 * `pointerup` (commit) or `pointercancel` / `lostpointercapture` /
 * `cancelColumnResize()` (cancel). Mirrors the `EditingCell`
 * shape so the architectural pattern stays uniform across write-back
 * surfaces.
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
 *   12's `cell-value-change` rule).
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
 * `columns.value = columns.value.map(c => c.id === payload.column.id
 *    ? { ...c, width: payload.newWidth, flex: undefined } : c)`.
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
 * pending column-move state, set on the
 * header-cell `pointerdown` and held until either (a) the pointer
 * moves ≥ `DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX` from the origin
 * (promoted to `ColumnMoving`) or (b) `pointerup` arrives without
 * crossing the threshold (cleared without emit — the normal header
 * click → sort cycle takes over). The two-stage state keeps the
 * header click intact while still capturing pointerdown coordinates
 * for the threshold calculation.
 */
export interface PendingColumnMove {
  readonly colId: string;
  readonly startClientX: number;
  readonly startClientY: number;
  readonly pointerId: number;
}

/**
 * in-flight column-move transaction. Created
 * when a pending move (`PendingColumnMove`) is promoted to active
 * (pointer travelled past the drag threshold). Updated on every
 * `pointermove` (`dropTarget` + `dropLineLeftPx` recomputed via
 * `getColumnDropTarget`). Cleared on `pointerup` (commit) or
 * `pointercancel` / `lostpointercapture` / `cancelColumnMove()`
 * (cancel). Mirrors the `ColumnResizing` shape so the
 * architectural pattern stays uniform across column-infrastructure
 * write-back surfaces.
 *
 * `dropLineLeftPx` is the wrapper-relative `clientX` for the 2px
 * drop-indicator line; pre-computed during `applyMoveDraft` so the
 * render function does no DOM measurement.
 */
export interface ColumnMoving {
  readonly colId: string;
  readonly startClientX: number;
  readonly dropTarget: ColumnDropTarget | null;
  readonly dropLineLeftPx: number | null;
  readonly pointerId: number;
}

/**
 * payload for `column-move-start` — fires when
 * the user's drag crosses the threshold (transitioning from "pending"
 * to "active"), OR when `startMovingColumn` is called programmatically.
 * The threshold-discrimination semantic means consumers never see a
 * spurious move-start for accidental cursor jitter on a header click.
 */
export interface ColumnMoveStartPayload {
  readonly column: ColumnSpec;
  readonly startClientX: number;
}

/**
 * payload for `column-move-stop` — fires on
 * every active move-session end. Two outcomes:
 *
 * - **Commit** (pointerup with a valid drop target): `committed: true`,
 *   `dropTarget` is the resolved target. Followed by a
 *   `column-order-change` emit iff the drop target identifies a
 *   meaningful reorder (not the same column, not the current adjacent
 *   position).
 * - **Cancel** (pointercancel / lostpointercapture /
 *   `cancelColumnMove()`, OR pointerup with no valid drop target):
 *   `committed: false`, `dropTarget` may be null. No
 *   `column-order-change` emit.
 */
export interface ColumnMoveStopPayload {
  readonly column: ColumnSpec;
  readonly committed: boolean;
  readonly dropTarget: ColumnDropTarget | null;
}

/**
 * payload for `column-order-change` — fires
 * on commit when the drag resolves to a meaningful reorder (target
 * column not the moved column itself + the move produces a different
 * array than the current `columns` prop). `oldColumnIds` / `newColumnIds`
 * give consumers a turnkey before / after snapshot for undo stacks
 * + telemetry.
 *
 * Consumers MUST mirror this into their own `columns` state by passing
 * `(movedColumn.id, targetColumn.id, position)` through the
 * `computeColumnReorder` pure helper exported from `@chronixjs/table`.
 * chronix-table is unopinionated about persistence and does NOT mutate
 * the `columns` prop (Decision A.1 — emit-only persistence; mirrors
 * `column-width-change` contract).
 */
export interface ColumnOrderChangePayload {
  readonly movedColumn: ColumnSpec;
  readonly targetColumn: ColumnSpec;
  readonly position: 'before' | 'after';
  readonly oldColumnIds: readonly string[];
  readonly newColumnIds: readonly string[];
}

/**
 * SFC config prop for the row-drag rail
 * column. When `show: true`, the adapter renders a 30px sticky column
 * with a `≡` grip glyph on every non-pinned, draggable row. Pointer-
 * down on a grip cell opens a row-drag session per Decision
 * B.1; pointer-down anywhere else in the row keeps all existing
 * row-surface gestures intact.
 *
 * `side` defaults to `'left'`. When both `selectionColumn` and
 * `rowDragColumn` are configured on the same side, the row-drag rail
 * renders BETWEEN the selection rail and the data columns (sticky
 * order: selection-outer, drag-inner) so consumers reading left-to-
 * right see selection → drag → data.
 */
export interface RowDragColumnConfig {
  readonly show: boolean;
  readonly side?: 'left' | 'right';
}

/**
 * tuning + opt-out for the drag auto-scroll
 * feature. Defaults to `{ enabled: true, triggerZonePx: 30,
 * maxVelocityPxPerFrame: 12 }`. Setting `enabled: false` disables the
 * rAF loop entirely (no scroll mutation during drag — consumers wanting
 * to handle scroll themselves opt out here). Setting `triggerZonePx`
 * or `maxVelocityPxPerFrame` overrides chronix's defaults.
 */
export interface RowDragAutoScrollConfig {
  readonly enabled?: boolean;
  readonly triggerZonePx?: number;
  readonly maxVelocityPxPerFrame?: number;
}

/**
 * pending row-move state, set on the grip
 * cell's `pointerdown` and held until either (a) the pointer moves ≥
 * `DEFAULT_ROW_DRAG_THRESHOLD_PX` from the origin (promoted to
 * `RowMoving`) or (b) `pointerup` arrives without crossing the
 * threshold (cleared silently — a no-op grip click). Two-stage state
 * mirrors column-move pattern.
 */
export interface PendingRowMove {
  readonly rowId: string;
  readonly startClientX: number;
  readonly startClientY: number;
  readonly pointerId: number;
}

/**
 * in-flight row-move transaction. Created when
 * a pending move is promoted to active (pointer travelled past the
 * drag threshold). Updated on every `pointermove` (`dropTarget` +
 * `dropLineTopPx` recomputed via `getRowDropTarget`). Cleared on
 * `pointerup` (commit) or `pointercancel` / `lostpointercapture` /
 * `cancelRowMove()` (cancel). Mirrors `ColumnMoving` shape on the
 * Y-axis.
 *
 * `dropLineTopPx` is the wrapper-relative `clientY` for the 2px
 * horizontal drop-indicator line; pre-computed during
 * `applyRowMoveDraft` so the render function does no DOM measurement.
 */
export interface RowMoving {
  readonly rowId: string;
  readonly startClientY: number;
  readonly dropTarget: RowDropTarget | null;
  readonly dropLineTopPx: number | null;
  readonly pointerId: number;
}

/**
 * payload for `row-move-start` — fires when
 * the grip drag crosses the threshold (transitioning from "pending"
 * to "active"), OR when `startMovingRow` is called programmatically.
 * The threshold-discrimination semantic means consumers never see a
 * spurious move-start for a no-op grip click.
 */
export interface RowMoveStartPayload {
  readonly row: RowSpec;
  readonly startClientY: number;
}

/**
 * payload for `row-move-stop` — fires on every
 * active row-move-session end. Two outcomes (mirror
 * column-move-stop semantics):
 *
 * - **Commit** (pointerup with a valid drop target): `committed: true`,
 *   `dropTarget` is the resolved target. Followed by a
 *   `row-order-change` emit iff the drop target identifies a
 *   meaningful reorder (not the same row, not the current adjacent
 *   position).
 * - **Cancel** (pointercancel / lostpointercapture / `cancelRowMove()`,
 *   OR pointerup with no valid drop target): `committed: false`,
 *   `dropTarget` may be null. No `row-order-change` emit.
 */
export interface RowMoveStopPayload {
  readonly row: RowSpec;
  readonly committed: boolean;
  readonly dropTarget: RowDropTarget | null;
}

/**
 * payload for `row-order-change` — fires on
 * commit when the drag resolves to a meaningful reorder. `oldRowIds`
 * / `newRowIds` give consumers a turnkey before / after snapshot for
 * undo stacks + telemetry.
 *
 * Consumers MUST mirror this into their own `rows` state by passing
 * `(movedRow.id, targetRow.id, position)` through the
 * `computeRowReorder` pure helper exported from `@chronixjs/table`.
 * chronix-table is unopinionated about persistence and does NOT
 * mutate the `rows` prop (Decision A.1 — emit-only; mirrors
 * `column-order-change`).
 */
export interface RowOrderChangePayload {
  readonly movedRow: RowSpec;
  readonly targetRow: RowSpec;
  readonly position: 'above' | 'below';
  readonly oldRowIds: readonly string[];
  readonly newRowIds: readonly string[];
}

/**
 * payload for `column-visibility-change` — fires
 * when the user toggles a column's checkbox in the visibility menu OR
 * a programmatic `setColumnVisibility` / `toggleColumnVisibility` call
 * runs. Carries the new `hidden` value (post-toggle) so consumers can
 * apply directly to their `columns` array without recomputing.
 *
 * `jsEvent` is `null` for programmatic invocations and the original
 * checkbox `change` event for user-driven toggles.
 *
 * Per Decision A.1, chronix-table does NOT mutate the `columns` prop
 * — consumers consume the emit + rebuild their columns ref with the
 * new `hide` value (same posture as Phases 13 / 14 / 22 column-
 * infrastructure mutations).
 */
export interface ColumnVisibilityChangePayload {
  readonly column: ColumnSpec;
  readonly hidden: boolean;
  readonly jsEvent: Event | null;
}

/**
 * payload for `columns-change` — fires once per
 * `applyTableView()` call after the saved `TableViewState` has been
 * reconciled against the current `columns` prop. Consumers do a single
 * `columnsRef.value = payload.columns` rebuild instead of N partial
 * updates from `column-{visibility,width,order}-change` emits.
 *
 * `reason` discriminates the trigger:
 * - `'apply-view'` — the only value shipped; future bulk-
 *   rebuild paths (e.g. `'reset-defaults'`) reuse this emit.
 *
 * Per Decision F.1, the individual `column-{visibility,width,order}-
 * change` emits do NOT fire during `applyTableView` — they fire only
 * for user-driven mutations to keep audit-history semantics aligned
 * with the "atomic restore = single transaction" intuition.
 */
export interface ColumnsChangePayload {
  readonly columns: readonly ColumnSpec[];
  readonly reason: 'apply-view';
}

/**
 * payload for `active-cell-change` — fires when
 * the keyboard-driven active cell transitions. Both `rowId` and
 * `colId` are `null` together when the active cell is cleared via
 * `clearActiveCell()` / Escape. `jsEvent` is `null` for programmatic
 * invocations and the originating keyboard / click event for user-
 * driven transitions.
 *
 * Active-cell state is INTERNAL to the SFC (no controlled prop) —
 * consumers consume this emit to observe transitions but cannot
 * directly drive it via a `activeCell` prop. Programmatic control runs
 * through the TableHandle methods `setActiveCell` / `clearActiveCell`.
 */
export interface ActiveCellChangePayload {
  readonly rowId: string | null;
  readonly colId: string | null;
  readonly jsEvent: Event | null;
}

/**
 * payload for the `expanded-change` emit. Fires
 * on every transition of the tree-data expand state — chevron click,
 * Enter / Space toggle, ArrowRight expand, ArrowLeft collapse,
 * `expandRow` / `collapseRow` TableHandle calls. `next` is the full
 * ordered list of expanded row IDs after the transition; the previous
 * list is not carried (consumers can compute the delta locally).
 *
 * In controlled mode (`expandedRowIds` prop set), the SFC does not
 * mutate state — consumers MUST handle this emit + update the prop
 * binding for expand state to take effect. In uncontrolled mode, the
 * SFC has already applied the change before emitting.
 */
export interface ExpandedChangePayload {
  readonly next: readonly string[];
}

/**
 * payload for the `lazy-load-start` emit. Fires
 * synchronously when a lazy-eligible row's chevron is clicked +
 * `childrenLoader` is invoked. Consumers wiring telemetry / global
 * loading bars listen here.
 */
export interface LazyLoadStartPayload {
  readonly parent: RowSpec;
}

/**
 * payload for `lazy-load-success`. Fires after
 * the loader resolves AND the lazy cache is updated AND the SFC
 * re-renders. `children` is the verbatim array returned by the loader.
 */
export interface LazyLoadSuccessPayload {
  readonly parent: RowSpec;
  readonly children: readonly RowSpec[];
}

/**
 * payload for `lazy-load-error`. Fires after
 * the loader rejects. `error` is the verbatim rejection value (no
 * chronix normalization) so consumers handle their own error shapes.
 * Cancellation (collapse mid-load) does NOT fire this emit.
 */
export interface LazyLoadErrorPayload {
  readonly parent: RowSpec;
  readonly error: unknown;
}

/**
 * payload for the `page-change` emit. Fires
 * on every transition of the internal `(page, pageSize)` tuple —
 * `setPage`, `setPageSize`, the footer `«` / `»` buttons + size
 * `<select>`, AND the auto-reset to page 0 when filter/sort
 * transitions. `page` is 0-based (the footer renders `page + 1`).
 * Consumers can mirror to URL / store; the shape is
 * JSON-serializable by design.
 */
export interface PageChangePayload {
  readonly page: number;
  readonly pageSize: number;
}

/**
 * payload for `cell-range-start` — fires when a
 * cell-range session opens (pointerdown on a body cell with
 * `cellRangeSelection === 'enabled'` OR programmatic `setCellRange`).
 * `jsEvent` is `null` for the programmatic-start path. The `range`
 * carries the freshly-anchored {anchor, focus} pair (focus === anchor
 * at start).
 */
export interface CellRangeStartPayload {
  readonly range: CellRange;
  readonly jsEvent: PointerEvent | null;
}

/**
 * payload for `cell-range-change` — fires on every pointer
 * move that resolves a NEW cell under the cursor (focus changed), AND
 * on shift+click extend, AND on programmatic `setCellRange` that
 * supplies an asymmetric {anchor, focus} pair. The `envelope` field
 * carries the resolved `{rowIds, colIds}` rectangle for consumer
 * convenience (avoids round-tripping through `computeCellRangeEnvelope`).
 */
export interface CellRangeChangePayload {
  readonly range: CellRange;
  readonly envelope: CellRangeEnvelope;
  readonly jsEvent: PointerEvent | MouseEvent | null;
}

/**
 * payload for `cell-range-stop` — fires on pointerup that
 * commits a drag-extend session, on shift+click that commits an
 * extend, and on programmatic `clearCellRange()`. After `cell-range-
 * stop`, the range is "committed" — it stays in state until cleared
 * or replaced by a new session.
 */
export interface CellRangeStopPayload {
  readonly range: CellRange;
  readonly envelope: CellRangeEnvelope;
  readonly jsEvent: PointerEvent | MouseEvent | null;
}

/**
 * payload for `cell-range-paste` — fires when
 * the user presses Ctrl+V (Win/Linux) / Cmd+V (macOS) over a focused
 * body element with `cellRangeSelection === 'enabled'` AND an active
 * non-empty range, OR when consumers call
 * `handle.pasteCellRangeFromClipboard()` programmatically. `jsEvent`
 * is `null` for the programmatic path. `text` is the raw clipboard
 * string returned by `navigator.clipboard.readText()` (un-parsed —
 * `mutations` is the parsed + coerced + clamped form ready for
 * consumer write-back).
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
 * payload for `cell-range-copy` — fires when
 * the user presses Ctrl+C (Win/Linux) / Cmd+C (macOS) over a focused
 * body element with `cellRangeSelection === 'enabled'` AND an active
 * non-empty range, OR when consumers call
 * `handle.copyCellRangeToClipboard()` programmatically. `jsEvent` is
 * `null` for the programmatic path. `text` is the formatted TSV
 * string (the same value passed to `navigator.clipboard.writeText`).
 */
export interface CellRangeCopyPayload {
  readonly envelope: CellRangeEnvelope;
  readonly text: string;
  readonly jsEvent: KeyboardEvent | null;
}

/**
 * payload for `history-replay` — fires when
 * the user presses Ctrl+Z (Win/Linux) / Cmd+Z (macOS) / Ctrl+Y / Cmd+Y
 * / Ctrl+Shift+Z over a focused body element with `enableUndoHistory
 * === true` AND a non-empty `past` (undo) / `future` (redo), OR when
 * consumers call `handle.undo()` / `handle.redo()` programmatically.
 * `jsEvent` is `null` for the programmatic path.
 *
 * `batch.mutations` is ALREADY in apply-ready form:
 *
 * - On `direction: 'undo'` the mutations are REVERSED (oldValue +
 *   newValue swapped from the originally-recorded batch).
 * - On `direction: 'redo'` the mutations are the ORIGINAL (un-swapped)
 *   recorded batch.
 *
 * Consumers apply `batch.mutations` to their `rows` array via the
 * SAME Map-keyed batch-write code path used for `cell-range-paste` /
 * `cell-range-fill` — no per-direction branching needed in the
 * consumer handler. The adapter does the reversal.
 */
export interface HistoryReplayPayload {
  readonly direction: 'undo' | 'redo';
  readonly batch: MutationBatch;
  readonly jsEvent: KeyboardEvent | null;
}

/**
 * payload for `history-change` — fires every
 * time the internal `mutationHistoryRef` transitions. Consumers use
 * this to update undo / redo button disabled states + display history
 * counts. The payload mirrors the internal `MutationHistoryState`
 * exactly (no derived fields).
 */
export interface HistoryChangePayload {
  readonly history: MutationHistoryState;
}

/**
 * payload for `cell-range-fill-start` — fires
 * once at pointerdown on the drag-fill handle (the small 8×8 px square
 * at the bottom-right corner of an active cell-range envelope). The
 * `source` field captures the envelope at the moment the drag began;
 * subsequent fill-change + fill emits reference the same source value
 * so consumers can pair the lifecycle deterministically.
 */
export interface CellRangeFillStartPayload {
  readonly source: CellRangeEnvelope;
  readonly jsEvent: PointerEvent;
}

/**
 * payload for `cell-range-fill-change` — fires on every
 * pointermove that resolves a NEW preview envelope (`fill !==
 * previous`). `source` is the drag's anchor envelope (matches the
 * paired `cell-range-fill-start` payload); `fill` is the current
 * preview envelope per `computeDragFillEnvelope` (axis-locked per
 * Decision A.1). Used by consumers for live preview UI (e.g.,
 * dashed-outline overlay on the fill region).
 */
export interface CellRangeFillChangePayload {
  readonly source: CellRangeEnvelope;
  readonly fill: CellRangeEnvelope;
  readonly jsEvent: PointerEvent;
}

/**
 * payload for `cell-range-fill` — fires once at pointerup
 * (drag commit) OR at programmatic `fillCellRange(targetCell)` call.
 * Carries the committed mutations array (mirrors `CellRangePastePayload`'s
 * `mutations` shape so consumers reuse batch-apply
 * handler code). `jsEvent` is `null` for the programmatic path.
 *
 * The `mutations` array contains ONLY cells that actually changed
 * (no-op dedup against current value) AND cells that successfully
 * coerced via `coerceEditDraftValue` against the TARGET column's type
 * (rejected cells silently skipped — matches Decision C.1).
 * Source cells (in `source ∩ fill`) are NEVER emitted; drag-fill is
 * an EXTENSION-only gesture per Decision B.1.
 */
export interface CellRangeFillPayload {
  readonly source: CellRangeEnvelope;
  readonly fill: CellRangeEnvelope;
  readonly mutations: readonly PasteMutation[];
  readonly jsEvent: PointerEvent | null;
}

/**
 * opt-in selection column config. When
 * `show: true`, the SFC renders an independent rail of `<input
 * type="checkbox">` cells before (`side: 'left'`) or after
 * (`side: 'right'`) the column-driven body. The rail sits outside
 * the consumer's `columnLayoutPass` math — its width is the fixed
 * `theme.selectionColumnWidth` (default 36) and does not consume
 * any flex budget from data columns.
 */
export interface SelectionColumnConfig {
  readonly show: boolean;
  readonly side: 'left' | 'right';
}

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
 */
export interface EditingCell {
  readonly rowId: string;
  readonly colId: string;
  readonly baseValue: unknown;
  readonly draftValue: unknown;
}

/**
 * minimum vue3 wrapper for chronix-table.
 *
 * Renders a `<div class="cx-table-wrapper" role="grid">` containing
 * a header rowgroup + body rowgroup. Column widths are resolved by
 * the core's `columnLayoutPass` against the wrapper's reactive
 * `clientWidth` (observed via `ResizeObserver`). No interactions,
 * no virtualization, no header groups — those land in subsequent
 * phases per `audit/TABLE_MIGRATION_PLAN.md`.
 *
 * **DOM contract (+ +):**
 *
 * - `.cx-table-wrapper[role="grid"]` — outer container; carries
 *   `data-table-version` for debugging.
 * - `.cx-table-header[role="rowgroup"]` — header rowgroup; one
 *   per table; not pinned at (CSS handles sticky-header
 *   in the example styles).
 *   - `.cx-table-row.cx-table-row--header[role="row"]` — single
 *     header row (natural flow).
 *     - `.cx-table-header-cell[role="columnheader"][data-col-id]`
 *       — one per visible column.
 * - `.cx-table-body[role="rowgroup"]` — body scrollport .
 *   `overflow-y: auto; overflow-x: hidden`. Height comes from
 *   external CSS (consumer sets `max-height` / parent flex sizing);
 *   `useTableBodyScroll` observes the resolved `clientHeight` +
 *   `scrollTop` and threads them into `virtualRowsPass`.
 *   - `.cx-table-body-content` — virtual-content layer .
 *     `position: relative; width: ${totalWidth}px;
 *     height: ${totalBodyHeight}px`. Holds absolute-positioned rows.
 *     The full `totalBodyHeight` drives the scrollbar even when
 *     only a windowed subset of rows is rendered.
 *     - `.cx-table-row[role="row"][data-row-id]` — one per visible
 *       `RowSpec` (post-virtualRowsPass window + overscan).
 *       `position: absolute; top: ${rowYByRowId[id]}px; left: 0;
 *       height: ${rowHeightByRowId[id]}px`. virtualRowsPass
 *       only changes which rows render, not their per-row geometry.
 *       - `.cx-table-cell[role="gridcell"][data-col-id][data-row-id]`
 *         — one per visible column.
 */
/**
 * helper: identity-stable empty `Set<string>` returned by
 * `dragFillPreviewSet` when no drag-fill preview is active. Identity
 * stability lets the per-cell render skip class-list rebuilds when the
 * preview is empty (the common case).
 */
const EMPTY_PREVIEW_SET: ReadonlySet<string> = new Set<string>();

/**
 * hard-coded row height for Set filter
 * checkbox `<label>` rows used by `computeVirtualWindow`. Matches the
 * ~28px label height established + the example CSS
 * (1px padding + 12px font-size + checkbox baseline).
 */
const SET_FILTER_ITEM_HEIGHT_PX = 28;

/**
 * fixed step for Number filter range slider.
 * Integer step covers the v1 use case (price columns, count columns,
 * etc.). Fractional-step is deferred to a future sub-phase per the
 * design doc Out-of-scope.
 */
const NUMBER_FILTER_RANGE_STEP = 1;

/**
 * helper: shallow equality on `CellRangeEnvelope` pairs.
 * `computeDragFillEnvelope` returns the same source object when no
 * extension applies; this helper detects identity AND value equality
 * so the drag-fill pointer flow can dedup no-op `cell-range-fill-change`
 * emits + skip the post-pointerup auto-extend when source === fill.
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
     * at mount time. Per-instance theming (CSS-vars) lands in
     * Phase ~6; supports spread-merge only.
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
     * this prop's value.
     */
    showFilterRow: {
      type: Boolean,
      default: false,
    },
    /**
     * default mode (`'AND'` or `'OR'`) for
     * newly-bootstrapped multi-filter specs on columns with
     * `filterUi: 'multi'`. Default `'AND'` preserves
     * behavior. Consumers wanting OR-by-default pass `'OR'`.
     * Existing specs (already in `filterSpec`) keep their stored
     * mode; this prop only affects the FIRST bootstrap of a column.
     */
    multiFilterDefaultMode: {
      type: String as PropType<'AND' | 'OR'>,
      default: 'AND',
    },
    /**
     * per-slot custom renderer for the
     * multi-filter container. When the function returns a non-null
     * VNode, the SFC uses it as the slot's content; when it returns
     * `null`, the SFC falls back to the built-in text/number/set
     * renderer for `slotKind`. Layered on TOP of one of the 3 declared
     * `multiFilterChildTypes` literals (no new `'custom'` kind);
     * consumers pick the closest built-in kind for their slot and
     * override the render. Args include `setChildValue` for consumer-
     * driven write access.
     */
    multiFilterChildRenderer: {
      type: Function as PropType<(args: MultiFilterChildRendererArgs) => VNode | null>,
      default: undefined,
    },
    /**
     * cross-cell / cross-row validators.
     * Each entry receives a post-commit row + returns zero or more
     * `RowValidationViolation` entries (each anchored to a `colId`).
     * Violations populate the invalid-cell map under their `colId`;
     * subsequent commits on the same row reconcile (new violations
     * add, stale ones clear). Defaults to `undefined` → no row-level
     * validation. Composes with per-cell `validator` + async
     * `validatorAsync`: row-level runs AFTER per-cell passes.
     */
    rowValidators: {
      type: Array as PropType<readonly RowValidator[]>,
      default: undefined,
    },
    /**
     * how `computePasteMutations` /
     * `computeDragFillMutations` treat validator-rejected cells.
     * `'skip-rejected'` (default) routes each cell through
     * `runCellValidator`; non-null result → cell is silently SKIPPED
     * (parallels coerce-reject skip). `'allow-invalid'` preserves the
     * legacy behavior (validator gate bypassed;
     * raw clipboard values land in the dataset). Row-level
     * rowValidators still run after the paste batch lands regardless
     * of this prop (Decision E.1 step 6).
     */
    pasteValidatorPolicy: {
      type: String as PropType<'skip-rejected' | 'allow-invalid'>,
      default: 'skip-rejected',
    },
    /**
     * opt-in sticky footer aggregate row
     * rendered BELOW the body. Default `false` — when `true`, the SFC
     * renders one footer row mirroring the body's column layout +
     * horizontal scroll, with each column's `aggregator(filteredRows)`
     * output formatted via the column's `valueFormatter` (or the
     * default formatter). Columns without an `aggregator` render
     * empty placeholder cells so column alignment is preserved
     * (Decision C.1). The footer aggregates the post-filter rows,
     * NOT the current page (Decision A.1).
     */
    showFooterRow: {
      type: Boolean,
      default: false,
    },
    /**
     * opt-in column visibility menu rendered in
     * the top-right corner of the wrapper. Default `false`. When
     * `true`, a button affordance opens a popover listing every column
     * with per-column checkboxes + "全部显示" / "全部隐藏" actions. User
     * toggles fire `column-visibility-change` with the new `hidden`
     * value; consumer rebuilds the `columns` prop with the updated
     * `hide` field per Decision A.1 (emit-only persistence). Programmatic
     * `setColumnVisibility` / `toggleColumnVisibility` handle methods
     * stay available regardless of this prop's value.
     */
    showColumnVisibilityMenu: {
      type: Boolean,
      default: false,
    },
    /**
     * opt-in cell-level keyboard navigation.
     * Default `false`. When `true`, the body's keydown handler
     * dispatches arrow keys / Home / End / PageUp / PageDown /
     * Ctrl+Home / Ctrl+End to move an internal `activeCell` (the
     * spreadsheet "active cell" focus marker). Enter / F2 begin edit
     * on the active cell (when editable). Escape clears the active
     * cell. Body cells matching the active cell carry the
     * `cx-table-cell--active` modifier + `data-active="true"` attr.
     * Edge-press is a no-op (Decision C.1 — stop at boundaries).
     * Active-cell transitions fire `active-cell-change` per A.1.
     * Programmatic `setActiveCell` / `clearActiveCell` / `getActiveCell`
     * handle methods stay available regardless of this prop's value.
     */
    enableKeyboardNavigation: {
      type: Boolean,
      default: false,
    },
    /**
     * opt-out for the keyboard-driven auto-
     * scroll side effect (Decision C.1). Default `true` — whenever
     * `enableKeyboardNavigation === true` AND the active cell moves
     * via keyboard or programmatic `setActiveCell`, the body
     * scrollport scrolls just enough to bring the new active cell
     * into view (pinned-zone-aware). Click-driven activeCell writes
     * never auto-scroll (the clicked cell is by definition visible).
     * Consumers set to `false` to disable scroll without losing the
     * nav itself (useful for testing harnesses + headless tooling).
     * Meaningless when `enableKeyboardNavigation: false` (no keyboard-
     * driven activeCell writes happen).
     */
    enableKeyboardAutoScroll: {
      type: Boolean,
      default: true,
    },
    /**
     * controlled expanded-row IDs for tree
     * data. When set (non-undefined), the SFC is in CONTROLLED expand
     * mode — chevron clicks emit `expanded-change` but do NOT mutate
     * internal state; the consumer must update the prop binding to
     * see expand state change. When omitted, the SFC is in
     * UNCONTROLLED mode and seeds initial state from
     * `defaultExpandedRowIds` or `defaultExpandedDepth`.
     */
    expandedRowIds: {
      type: Array as PropType<readonly string[]>,
      default: undefined,
    },
    /**
     * initial expanded-row IDs in uncontrolled
     * mode. Wins over `defaultExpandedDepth` when both are set. Only
     * consulted at composable mount; subsequent changes are ignored
     * (so they don't fight the user's toggle gestures). Re-seeding at
     * runtime: flip to controlled mode via `expandedRowIds` prop.
     */
    defaultExpandedRowIds: {
      type: Array as PropType<readonly string[]>,
      default: undefined,
    },
    /**
     * initial expand depth in uncontrolled
     * mode (ignored when `defaultExpandedRowIds` is set). Default
     * `0` = only top-level rows visible. Set to `Number.POSITIVE_INFINITY`
     * (or any depth ≥ tree's max depth) to expand everything on
     * mount. Consulted only at composable mount.
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
     *   Ctrl/Cmd+click toggles a row in / out of the selection.
     *
     * Shift+click range selection + the checkbox-column UI are
     * deferred .
     */
    selectionMode: {
      type: String as PropType<'none' | 'single' | 'multi'>,
      default: 'none',
    },
    /**
     * opt-in pagination. When `true`, the
     * SFC slices rows via `pagePass` and renders a footer with
     * prev/next buttons + page info + page-size dropdown. When
     * `false` (default), the full filtered + sorted row set
     * renders into the virtualized body — programmatic `setPage` /
     * `setPageSize` still update the internal state but `pagePass`
     * is configured with `pageSize: 0` (passthrough) so the body
     * sees the full row set.
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
     * opt-in selection column. Default
     * `{ show: false, side: 'left' }`. When `show: true`, an
     * independent rail of `<input type="checkbox">` cells renders
     * before (`'left'`) or after (`'right'`) the column-driven
     * body. Header carries a three-state "select-all" checkbox
     * (checked / unchecked / indeterminate). Shift+click on a row
     * (or its checkbox) selects the range from the last anchor to
     * the click target in display order (`pagedRows`).
     */
    selectionColumn: {
      type: Object as PropType<SelectionColumnConfig>,
      default: () => ({ show: false, side: 'left' as const }),
    },
    /**
     * opt-in row-drag rail column. When
     * `{ show: true }`, the adapter renders a 30px sticky rail with a
     * `≡` grip glyph on every non-pinned, draggable row; pointer-down
     * on a grip cell starts a row-drag session per Decision
     * B.1. Default `{ show: false }` — fully backward-compatible.
     */
    rowDragColumn: {
      type: Object as PropType<RowDragColumnConfig>,
      default: () => ({ show: false, side: 'left' as const }),
    },
    /**
     * drag auto-scroll tuning + opt-out.
     * `undefined` (default) = enabled with chronix defaults
     * (30px trigger zone, 12 px/frame max velocity). Set
     * `{ enabled: false }` to disable. See `RowDragAutoScrollConfig`.
     */
    rowDragAutoScroll: {
      type: Object as PropType<RowDragAutoScrollConfig | undefined>,
      default: undefined,
    },
    /**
     * how many sibling pages to show on
     * each side of `currentPage` in the ellipsis-aware page-number
     * bar. Default `1` (matches Material UI / Notion convention).
     * Increase for denser bars (e.g., `2` → 5 pages around current);
     * decrease to `0` for the minimum 3-page contiguous prefix.
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
     * opt-in cell-range selection. Default
     * `'none'` preserves all existing pointer behavior (
     * cell-click + row-select + dblclick-edit).
     * When `'enabled'`, the body cells register pointer handlers
     * for drag-extend + shift+click extend; a new
     * `cx-table-cell--in-cell-range` modifier paints cells in the
     * active envelope.
     */
    cellRangeSelection: {
      type: String as PropType<'none' | 'enabled'>,
      default: 'none',
    },
    /**
     * opt-in to the internal mutation-history
     * recorder. When `true`, every `cell-value-change` / `cell-range-
     * paste` / `cell-range-fill` emit is auto-recorded into the
     * `{past, future}` stack + Ctrl+Z / Ctrl+Y bindings on the focused
     * body element become active (gated on non-empty past/future). The
     * 7 history-related TableHandle methods (`undo` / `redo` / `canUndo`
     * / `canRedo` / `clearHistory` / `getHistory` / `recordMutationBatch`)
     * become functional. Default `false` — existing consumers see no
     * behavior change.
     */
    enableUndoHistory: {
      type: Boolean,
      default: false,
    },
    /**
     * maximum number of entries the internal `past` stack
     * retains. When a new mutation appends with `past.length === max`,
     * the OLDEST entry is dropped. Default `100` — prevents long-
     * running tables from accumulating gigabytes of history.
     * Ignored when `enableUndoHistory: false`.
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
     * no-rows overlay per Decision F.1 — even when `rows.length === 0`,
     * a `loading: true` table shows only the loading overlay.
     */
    loading: {
      type: Boolean,
      default: false,
    },
    /**
     * content rendered inside the loading overlay.
     * Defaults to the plain string `'Loading…'`. Consumers can pass a
     * custom string (i18n) or a VNode for a richer affordance (spinner +
     * label). Ignored when `loading: false`.
     */
    loadingOverlay: {
      type: [String, Object] as PropType<string | VNode | undefined>,
      default: undefined,
    },
    /**
     * content rendered inside the no-rows overlay
     * when `rows.length === 0` AND `loading: false`. Defaults to `'No rows'`.
     * Suppressed entirely while `loading: true`.
     */
    noRowsOverlay: {
      type: [String, Object] as PropType<string | VNode | undefined>,
      default: undefined,
    },
    /**
     * lazy children loader. When provided AND a
     * row carries `hasChildren: true` (without sync `children`), the
     * loader fires on first expand. Result is cached for the SFC's
     * mounted lifetime; subsequent expand/collapse cycles toggle the
     * cached children without re-fetching. See Decision A.1.
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
     * opt-in status bar rendered between the
     * body and the optional pagination footer. Default `false`. When
     * `true`, the SFC renders a sticky-bottom strip with row counts.
     * Consumers customize content via the `status-bar` named slot
     * (slot props: `{counts: StatusBarCounts}`).
     */
    showStatusBar: {
      type: Boolean,
      default: false,
    },
    /**
     * override the default live-region announce
     * text produced for keyboard-driven activeCell transitions. The
     * default helper (`formatActiveCellAnnouncement` from
     * `@chronixjs/table`) produces the English sentence "Column X (col
     * i of N), Row j of M: value". Pass a function here to swap in
     * i18n / domain-specific phrasing; return the empty string to
     * suppress the announce for a given transition.
     */
    announceActiveCellText: {
      type: Function as PropType<(args: FormatActiveCellAnnouncementInput) => string>,
      default: null,
    },
    /**
     * row-model selection switch. Default
     * `'clientSide'` — the SFC consumes `props.rows` directly through
     * the existing `filterPass` / `sortPass` / `pagePass` pipeline.
     * When `'serverSide'`, the SFC bypasses those passes entirely +
     * fetches rows lazily via the consumer-supplied
     * `serverSideDataSource` prop. The server is the source of truth
     * for sort + filter + paginate; the SFC's `sortSpec` / `filterSpec`
     * are forwarded to each `getRows` call. `props.rows` is ignored in
     * server-side mode (consumers pass `[]`).
     */
    rowModelType: {
      type: String as PropType<'clientSide' | 'serverSide'>,
      default: 'clientSide',
    },
    /**
     * consumer-supplied async data source.
     * Required when `rowModelType: 'serverSide'`. The single method
     * `getRows({startRow, endRow, sortModel, filterModel, signal})`
     * is dispatched once per block as the user scrolls / sorts /
     * filters. Consumer impls should wire `signal` into their
     * underlying `fetch` so the SFC's view-change abort propagates.
     */
    serverSideDataSource: {
      type: Object as PropType<ServerSideDataSource | undefined>,
      default: undefined,
    },
    /**
     * per-block size for `createServerSideRowSource`.
     * Defaults to 100. Ignored when `rowModelType: 'clientSide'`.
     */
    cacheBlockSize: {
      type: Number,
      default: DEFAULT_CACHE_BLOCK_SIZE,
    },
    /**
     * LRU cap on cached blocks. Defaults to 10
     * (= ~1000 rows at default block size). Ignored when
     * `rowModelType: 'clientSide'`.
     */
    serverSideMaxBlocksInCache: {
      type: Number,
      default: DEFAULT_SERVER_SIDE_MAX_BLOCKS_IN_CACHE,
    },
    /**
     * anticipatory next-block prefetch ahead
     * of scroll direction. Defaults to `0` (= disabled — strict
     * viewport-only dispatch per). When set to `N > 0` and
     * `rowModelType: 'serverSide'` + `!paginationEnabled`, the
     * viewport effect appends an extra dispatch pass that fires
     * `getRowAt` for `N * cacheBlockSize` indices AHEAD of the scroll
     * direction (forward when `lastVisible` grows tick-over-tick;
     * backward when `firstVisible` shrinks). Stationary viewport ⇒ no
     * prefetch. Paginated mode ⇒ prop ignored (the page-range loop
     * handles dispatch independently). Increases network quota in
     * exchange for fewer skeleton flashes during scroll-momentum-fast
     * UX. Decision A.1 (single-direction) + B.1 (inline in viewport
     * effect) per `audit/TABLE_PHASE_45_5_PREFETCH_POLICY_DESIGN.md`.
     */
    serverSidePrefetchAheadBlocks: {
      type: Number,
      default: 0,
    },
    /**
     * Set filter dropdown virtualization
     * threshold. When a column's unique-value count exceeds this
     * threshold, the Set filter dropdown switches from eager render
     * (one `<label>` per unique value) to a virtualized window backed
     * by `@chronixjs/cx-kit`'s `computeVirtualWindow`. Default `100`.
     * Set to `Infinity` to force eager render regardless of count.
     */
    setFilterVirtualizeThreshold: {
      type: Number,
      default: 100,
    },
    /**
     * opt-in dual-handle range slider beneath
     * the Number filter text input. When `true`, every `type: 'number'`
     * column with finite numeric data in `rows` renders a slider
     * (low + high thumbs) under the prefix-syntax `<input>`. Slider
     * commits route through `setFilterColumnValue(colId, 'low..high')`
     * — same path as user-typed prefix syntax. Default `false` (no
     * slider; existing text input unchanged). Composes +
     * cx-kit helpers (`computeRangeClosestHandle` /
     * `computeRangeValueAtPosition` / `computeRangeValueOnKey`).
     */
    numberFilterShowRangeSlider: {
      type: Boolean,
      default: false,
    },
    /**
     * + opt-in
     * per-cell style editor. When `true`, the SFC exposes a
     * TableHandle method `openCellStyleEditor(rowId, colId)` that
     * opens a fixed-position popover anchored to the cell, containing
     * a tab strip (Background / Text) above an HSV square + hue
     * strip + RGB number inputs + HEX text input (composing
     * `@chronixjs/cx-kit`'s KitColorPicker helpers). Each
     * tab edits its own axis (`backgroundColor` or `color`); the
     * per-cell map carries both axes independently. Apply commits
     * the currently editing tab's value; Clear removes the active
     * tab's value while preserving the other axis (if any). Each
     * Apply / Clear fires a `cell-style-change` event with a
     * per-axis-only payload. Default `false` — popover doesn't
     * mount, handle method no-ops, no per-cell style overrides
     * applied (zero-cost for non-consumers).
     */
    enableCellStyleEditor: {
      type: Boolean,
      default: false,
    },
    /**
     * controlled-mode override of the cell
     * style map. When `undefined` (default), the SFC is in
     * UNCONTROLLED mode — Apply / Clear paths mutate an internal
     * reactive map + emit `cell-style-change`. When defined (any
     * value, including `{}`), the SFC is in CONTROLLED mode — Apply /
     * Clear emit `cell-style-change` so consumers can update the
     * prop binding, but the internal map writes are skipped; the
     * body cell renderer reads from this prop. Mirrors the
     * controlled-mode pattern from `expandedRowIds` /
     * `selectedRowIds` / `filterRules`.
     */
    cellStyleByRowIdColId: {
      type: Object as PropType<Record<string, Record<string, CellStyle>> | undefined>,
      default: undefined,
    },
    /**
     * preset color swatches rendered above
     * the Apply / Clear / Cancel button row inside the color tabs
     * (background / text). Each entry must match
     * `^#[0-9a-fA-F]{6}$`; non-matching entries are silently skipped.
     * Defaults to `CELL_STYLE_DEFAULT_PRESET_COLORS` (12-color
     * Tailwind-derived palette). Pass `[]` to disable the preset row.
     */
    cellStylePresetColors: {
      type: Array as PropType<readonly string[]>,
      default: () => CELL_STYLE_DEFAULT_PRESET_COLORS,
    },
    /**
     * LRU cap on the in-memory recent-colors
     * list (the row of recently-applied swatches rendered between the
     * preset palette and the Apply button row in color tabs). Capped
     * to [0, 20] to keep the row layout sane; default `5`. State lives
     * in memory only for the SFC's lifetime — chronix does NOT touch
     * `localStorage`. Set to `0` to disable the recent row entirely.
     */
    cellStyleRecentColorsLimit: {
      type: Number,
      default: 5,
    },
    /**
     * -C (2026-05-30): opt-in per-row auto-height measurement.
     * Default `false`. When `true`, the SFC attaches a ResizeObserver
     * to each visible body row; the observed height is written into a
     * reactive `measuredRowHeightByRowId` map that overrides both
     * `RowSpec.heightHint` and `defaultRowHeight` in `rowLayoutPass`.
     * Composes with `ColumnSpec.wrapText: true` — multi-line cells +
     * auto-height yield rows that grow to fit wrapped content.
     */
    enableRowAutoHeight: {
      type: Boolean,
      default: false,
    },
    /**
     * -C (2026-05-30): optional pixel cap on auto-measured row
     * heights. When set, measured heights are clamped at this value; the
     * row clips overflow content. Defaults to `undefined` (no cap).
     * Ignored when `enableRowAutoHeight: false`.
     */
    maxRowAutoHeightPx: {
      type: Number,
      default: undefined,
    },
    /**
     * tool-panel container config. When
     * `show: true` + non-empty `panels`, the SFC renders a chronix-NEW
     * tool-panel container (vertical icon rail + active-panel content
     * area + resizer) docked at the configured side. The container
     * hosts consumer-supplied tool panels via each descriptor's
     * `renderer` callback. Defaults to `undefined` — fully backward-
     * compatible; the wrapper layout falls back to its pre-Phase-80
     * shape (no container, no rail, no resizer).
     */
    toolPanel: {
      type: Object as PropType<ToolPanelConfig | undefined>,
      default: undefined,
    },
    /**
     * -A (2026-05-30): when `true`, every column header
     * renders a ▾ button next to the sort indicator that opens a
     * column-scoped menu of 5 hardcoded actions (Sort ASC / Sort
     * DESC / Clear Sort / Hide / Autosize). Disabled state per
     * `column.sortable` / `column.hideable` / `column.autosizeable`
     * + `column.resizable` flags. Actions dispatch via existing
     * TableHandle methods + emit `column-header-menu-action`.
     * Defaults to `false` (no ▾ button rendered).
     */
    showColumnHeaderMenu: {
      type: Boolean,
      default: false,
    },
    /**
     * -B (2026-05-30): when set, right-clicking a body
     * cell opens a chronix-NEW cell context menu at the cursor
     * coords (`position: fixed`). The menu renders one button
     * per `ContextMenuItem` descriptor; each item's `onClick`
     * callback receives the right-clicked cell's
     * `{ rowId, colId }`. `null` (default) suppresses the
     * overlay and allows the browser's native context menu to
     * surface.
     */
    contextMenu: {
      type: Object as PropType<ContextMenuConfig | null | undefined>,
      default: null,
    },
  },
  emits: {
    /**
     * Fires once at mount when the table has resolved its initial
     * layout. Payload is the imperative `TableHandle` (same object
     * exposed via `expose()`); consumers can capture it without
     * needing a template ref + `instance.exposed` round-trip.
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
     * cells do NOT emit.
     */
    'header-group-click': (payload: HeaderGroupClickPayload) => Boolean(payload),
    /**
     * fires when a body click lands outside any row. Mutually
     * exclusive with `row-click` / `cell-click` for the same event.
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
    /** fires when the internal quick-find needle transitions. */
    'quick-find-text-change': (payload: QuickFindTextChangePayload) => Boolean(payload),
    /** fires when the internal selection state transitions. */
    'selection-change': (payload: SelectionChangePayload) => Boolean(payload),
    /** fires when the internal (page, pageSize) state transitions. */
    'page-change': (payload: PageChangePayload) => Boolean(payload),
    /** fires when an edit session opens on a cell. */
    'cell-edit-start': (payload: CellEditStartPayload) => Boolean(payload),
    /** fires when an edit session ends (commit or cancel). */
    'cell-edit-stop': (payload: CellEditStopPayload) => Boolean(payload),
    /** fires when `column.validatorAsync` starts (between sync-validate-passed and final resolve). */
    'cell-edit-validation-pending': (payload: CellEditValidationPendingPayload) => Boolean(payload),
    /** fires when the invalid-cells map mutates (validator reject, async resolve, rowValidator pass, commit success clearing prior reject). */
    'invalid-cells-change': (payload: InvalidCellsChangePayload) => Boolean(payload),
    /** fires when the user clicks `+` to add a new multi-filter slot. */
    'add-multi-filter-slot': (payload: AddMultiFilterSlotPayload) => Boolean(payload),
    /** fires when `+ 添加分组` clicked. */
    'add-multi-filter-group': (payload: AddMultiFilterGroupPayload) => Boolean(payload),
    /** fires when the user clicks `×` to remove a multi-filter slot. */
    'remove-multi-filter-slot': (payload: RemoveMultiFilterSlotPayload) => Boolean(payload),
    /** fires when `×` clicked on a non-root group. */
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
    /** fires when a row-drag session crosses the threshold (or programmatic start). */
    'row-move-start': (payload: RowMoveStartPayload) => Boolean(payload),
    /** fires when an active row-drag session ends (commit or cancel). */
    'row-move-stop': (payload: RowMoveStopPayload) => Boolean(payload),
    /** fires when a committed row-drag produces a different rows ordering. */
    'row-order-change': (payload: RowOrderChangePayload) => Boolean(payload),
    'column-move-start': (payload: ColumnMoveStartPayload) => Boolean(payload),
    /** fires when an active column-move session ends (commit or cancel). */
    'column-move-stop': (payload: ColumnMoveStopPayload) => Boolean(payload),
    /** fires on commit when the drag resolves to a meaningful reorder (no-op dedup). */
    'column-order-change': (payload: ColumnOrderChangePayload) => Boolean(payload),
    /** fires when a cell-range session opens (pointerdown / programmatic setCellRange). */
    'cell-range-start': (payload: CellRangeStartPayload) => Boolean(payload),
    /** fires on focus mutation (pointermove to a new cell / shift+click extend / programmatic). */
    'cell-range-change': (payload: CellRangeChangePayload) => Boolean(payload),
    /** fires on commit (pointerup) and on programmatic clear. */
    'cell-range-stop': (payload: CellRangeStopPayload) => Boolean(payload),
    /** fires when Ctrl+C copies an active range OR `copyCellRangeToClipboard()` is invoked. */
    'cell-range-copy': (payload: CellRangeCopyPayload) => Boolean(payload),
    /** fires when Ctrl+V pastes into an active range OR `pasteCellRangeFromClipboard()` is invoked. */
    'cell-range-paste': (payload: CellRangePastePayload) => Boolean(payload),
    /** fires once at pointerdown on the drag-fill handle. */
    'cell-range-fill-start': (payload: CellRangeFillStartPayload) => Boolean(payload),
    /** fires on each pointermove that resolves a new preview envelope during drag-fill. */
    'cell-range-fill-change': (payload: CellRangeFillChangePayload) => Boolean(payload),
    /** fires once at pointerup with the committed mutations array OR at programmatic `fillCellRange`. */
    'cell-range-fill': (payload: CellRangeFillPayload) => Boolean(payload),
    /** fires when Ctrl+Z / Ctrl+Y replays a recorded mutation batch OR programmatic `undo()` / `redo()`. */
    'history-replay': (payload: HistoryReplayPayload) => Boolean(payload),
    /** fires whenever the internal mutation-history state transitions (after every append / undo / redo / clearHistory). */
    'history-change': (payload: HistoryChangePayload) => Boolean(payload),
    /** fires when the user toggles a column's checkbox in the visibility menu OR a programmatic setColumnVisibility / toggleColumnVisibility call runs. Carries the post-toggle `hidden` value. */
    'column-visibility-change': (payload: ColumnVisibilityChangePayload) => Boolean(payload),
    /** fires when the keyboard-driven active cell transitions (arrow / Home / End / PageUp / PageDown / click / programmatic). `rowId` + `colId` are both null together when the active cell is cleared. */
    'active-cell-change': (payload: ActiveCellChangePayload) => Boolean(payload),
    /** fires when tree-data expand state transitions (chevron click / Enter / Space / ArrowR / ArrowL / programmatic). Payload is the next full ordered list of expanded row IDs. */
    'expanded-change': (payload: ExpandedChangePayload) => Boolean(payload),
    /** fires synchronously when a lazy-eligible row begins loading children (chevron click on `hasChildren: true && children === undefined`). */
    'lazy-load-start': (payload: LazyLoadStartPayload) => Boolean(payload),
    /** fires after `childrenLoader` resolves AND the cache + state are committed. */
    'lazy-load-success': (payload: LazyLoadSuccessPayload) => Boolean(payload),
    /** fires after `childrenLoader` rejects. Payload carries the rejection value verbatim. */
    'lazy-load-error': (payload: LazyLoadErrorPayload) => Boolean(payload),
    /** fires once per `applyTableView()` call after the saved state has been reconciled against the current columns prop. Payload carries the reconciled columns array so the consumer can do a single `ref.value = next` rebuild instead of N partial updates. `reason` future-proofs against other bulk-rebuild paths. */
    'columns-change': (payload: ColumnsChangePayload) => Boolean(payload),
    /** fires when the active tool-panel id changes (icon click, programmatic openToolPanel / closeToolPanel, or initialOpenId-driven mount). `activePanelId` is `null` when the content area collapses. */
    'tool-panel-change': (payload: ToolPanelChangePayload) => Boolean(payload),
    /** fires on pointer-up after a tool-panel resize drag completes. `width` is the post-clamp container width in pixels. Consumer can persist + feed back via `initialWidth` on next mount. */
    'tool-panel-width-change': (payload: ToolPanelWidthChangePayload) => Boolean(payload),
    /** -A (2026-05-30): fires when the user picks an action from the column header menu (informational; chronix has already dispatched the action via the corresponding TableHandle method). `action` is one of `'sort-asc' | 'sort-desc' | 'clear-sort' | 'hide' | 'autosize'`. */
    'column-header-menu-action': (payload: {
      colId: string;
      action: 'sort-asc' | 'sort-desc' | 'clear-sort' | 'hide' | 'autosize';
    }) => Boolean(payload),
    /** -B (2026-05-30): fires when the cell context menu opens (via right-click or `openContextMenuAt`). Carries the right-clicked cell's `{ rowId, colId }` + viewport `(x, y)` pixel coords. */
    'context-menu-open': (payload: ContextMenuOpenPayload) => Boolean(payload),
    /** -B (2026-05-30): fires when the cell context menu closes (item click, outside click, Escape, or `closeContextMenu()`). */
    'context-menu-close': () => true,
    /** fires when the cell style editor commits Apply or Clear. widens the `style` field to support a `color` axis in addition to `backgroundColor`. widens further with 3 font axes (`fontWeight`, `fontStyle`, `textDecoration`). widens further with 4 border axes (`borderColor`, `borderWidth`, `borderStyle`, `borderRadius`); all 9 fields optional + per-axis only — payload describes WHAT CHANGED, not WHAT THE FULL STATE IS (so absent field = no change to that axis; `null` = cleared; `string` = newly committed value). Font-tab Apply emits all 3 font fields atomically; border-tab Apply emits all 4 border fields atomically (each tab edits its axis cluster as a unit). */
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
        // per-side border override fields.
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
    const { emit, expose } = ctx;
    const mergedTheme = computed<ChronixTableTheme>(() => ({
      ...defaultChronixTableTheme,
      ...(props.theme ?? {}),
    }));

    const wrapperRef = ref<HTMLElement | null>(null);
    const bodyRef = ref<HTMLElement | null>(null);
    // header + filter row are SIBLINGS of body,
    // so the body's `overflowX: auto` scroll does NOT propagate to
    // them. The SFC mirrors `bodyScrollLeft → headerEl.scrollLeft +
    // filterRowEl.scrollLeft` via an inline scroll listener so the
    // header / filter cells stay column-aligned with body cells during
    // horizontal scroll. Header + filter both carry `overflowX: hidden`
    // inline so `scrollLeft` is a meaningful programmatic offset
    // (default `overflow: visible` ignores `scrollLeft`).
    const headerRef = ref<HTMLElement | null>(null);
    const filterRowRef = ref<HTMLElement | null>(null);
    const footerRef = ref<HTMLElement | null>(null);
    // per-column Set filter scroll state for
    // virtualized rendering. Lazily populated when a Set filter
    // dropdown crosses `setFilterVirtualizeThreshold`.
    const setFilterScrollTopByColId = ref<Record<string, number>>({});
    const setFilterViewportHeightByColId = ref<Record<string, number>>({});
    // per-column Number filter range slider
    // drag state. `null` = no active drag for that column. Only one
    // handle is active at any time per column (set on pointerdown,
    // cleared on pointerup / pointercancel).
    const numberFilterRangeDragByColId = ref<Record<string, RangeHandle | null>>({});
    // per-cell style override map populated
    // by the cell style editor. widens the
    // entry shape to support both `backgroundColor` and `color`
    // (foreground / text color) axes. adds
    // 3 font axes (`fontWeight`, `fontStyle`, `textDecoration`).
    // adds 4 border axes (`borderColor`,
    // `borderWidth`, `borderStyle`, `borderRadius`); all 9 fields
    // optional + each cell may carry any combination. Cell renderer
    // applies 9 conditional inline-style spreads (one per axis).
    const internalCellStyleByRowIdColId = ref<Record<string, Record<string, CellStyleEntry>>>({});
    // Decision I.1: effective-map read wedge.
    // Controlled-mode prop wins (presence ≠ undefined). All read sites
    // (body cell renderer + `openCellStyleEditor`'s persisted-entry
    // lookup + Apply / Clear `prevForRow` / `prevForCell` computations)
    // consult this computed; write sites continue targeting the
    // internal ref directly, gated behind
    // `if (props.cellStyleByRowIdColId === undefined)`. Centralizes the
    // precedence rule in one audit point.
    const effectiveCellStyleByRowIdColId = computed<Record<string, Record<string, CellStyleEntry>>>(
      () => props.cellStyleByRowIdColId ?? internalCellStyleByRowIdColId.value,
    );
    // Decision K.1: in-memory recent-colors
    // ring. LRU push on successful color-axis Apply (bg / text /
    // border-color); dedup + cap to `cellStyleRecentColorsLimit`. No
    // localStorage — consumer wanting persistence wires the controlled-
    // mode `cellStyleByRowIdColId?` prop + supplies the recent list
    // out-of-band, OR a future ships a dedicated
    // controlled-recent prop.
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
    // cell style editor open state. `null`
    // when the popover is closed. When open, carries the target cell
    // identity, the cell's anchor bounding rect (for popover
    // positioning), and the current in-popover HSV / HEX state being
    // edited (single source of truth for the 4 color control
    // surfaces). adds: `activeTab`
    // discriminator + per-axis persisted hex slots (`bgHex` /
    // `textHex`) for the inactive color tab. On tab switch, the
    // editing buffer (`hsv` / `hex`) swaps in the slot for the
    // opening color tab; the closing color tab's current `hex` is
    // persisted back into its slot. widens
    // `activeTab` to include `'font'` + adds a `fontState` slot
    // carrying the 3 font-axis values; the font tab's widgets read /
    // write `fontState` directly (no HSV/HEX buffer swap needed for
    // font since font has no HEX representation).
    // (2026-06-01) widens `activeTab` to include `'border'` + adds a
    // `borderState` slot carrying the 4 border-axis values; the
    // border tab's widgets read / write `borderState` directly (no
    // HSV/HEX buffer swap, same pattern as font).
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
        // per-side override fields (12
        // total = 4 sides × 3 axes). Each `null` when no override
        // for that side. Per-side fields override the all-sides
        // shorthand on that side via CSS cascade.
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
        // Decision O.1: which side is
        // currently being edited via the segmented control. `'all'`
        // → 4 widgets write to all-sides fields. `'top'|'right'|
        // `'bottom'`|`'left'` → 4 widgets write to per-side fields
        // (radius widget hidden — no per-side radius in CSS).
        borderSideTarget: 'all' | 'top' | 'right' | 'bottom' | 'left';
        // Decision P.1: independent HSV
        // editing-buffer for the border-tab HSV picker disclosure.
        // Mirrors `state.hsv` / `state.hex` for bg/text tabs but
        // targets the active border side via `borderSideTarget`.
        // Initialized in `openCellStyleEditor` from the persisted
        // active-side color field (with fallback to `borderColor`
        // then `'#000000'`); refreshed on `switchCellStyleEditorTab`
        // (entering border tab) and on
        // `setCellStyleBorderSideTarget` (side switch). Kept in sync
        // with the hex input + per-side color field via the new
        // border-targeted helpers.
        hsv: Hsv;
        hex: string;
      };
    } | null>(null);
    // popover root element ref + per-surface
    // drag refs. The drag flags are checked inside pointermove
    // handlers to decide whether to consume the event.
    const cellStyleEditorPopoverRef = ref<HTMLElement | null>(null);
    const cellStyleSquareDragRef = ref<boolean>(false);
    const cellStyleHueDragRef = ref<boolean>(false);
    // pointer-capture state for the
    // variable-font-weight slider (single-handle range slider in the
    // font widget cluster). Drag flag flips to true on pointerdown +
    // resets on pointerup / pointercancel.
    const cellStyleFontWeightSliderDragRef = ref<boolean>(false);
    // drag refs for the border-tab HSV
    // picker disclosure (independent from the bg/text HSV cluster).
    // Same role + lifecycle as cellStyleSquareDragRef /
    // cellStyleHueDragRef but for the border-targeted HSV widget.
    const cellStyleBorderSquareDragRef = ref<boolean>(false);
    const cellStyleBorderHueDragRef = ref<boolean>(false);
    // column-visibility-menu state.
    // `columnMenuOpen` controls popover visibility; mount-time default
    // is false. `columnMenuButtonRef` / `columnMenuPopoverRef` anchor
    // the outside-click detection (clicks INSIDE these elements do not
    // close the popover; clicks anywhere else do).
    const columnMenuOpen = ref<boolean>(false);
    const columnMenuButtonRef = ref<HTMLElement | null>(null);
    const columnMenuPopoverRef = ref<HTMLElement | null>(null);
    // ARIA keyboard nav menu container refs.
    // Each of the 4 menu surfaces (tool-panel tablist + column header
    // menu + cell context menu + column-visibility menu) needs its
    // own container ref so `useMenuKeyboardNav` can scope its
    // `[data-menu-item-index]` query lookup. The column-visibility
    // menu reuses `columnMenuPopoverRef` (declared above) — no
    // duplicate ref needed.
    const toolPanelRailRef = ref<HTMLElement | null>(null);
    const columnHeaderMenuRef = ref<HTMLElement | null>(null);
    const cellContextMenuRef = ref<HTMLElement | null>(null);
    // cell-level keyboard navigation state. The
    // active cell is the spreadsheet "focused cell" — distinct from
    // editingCellRef (in-edit) and cellRangeRef (range selection).
    // Internal-only state ownership (no controlled prop); consumers
    // observe via the `active-cell-change` emit + programmatic
    // setActiveCell / clearActiveCell / getActiveCell handle methods.
    const activeCellRef = ref<CellRef | null>(null);

    // live-region announce text for keyboard-
    // driven activeCell transitions. Wired into an off-screen
    // `<div role="status" aria-live="polite">` rendered at the wrapper
    // level. Updated by `applyActiveCellChange` ONLY when the caller
    // passes `announce: true` (keyboard nav handlers do; click-driven
    // writes don't, per Decision B.2). Consumers can override the text
    // via `props.announceActiveCellText`.
    const srAnnounceTextRef = ref<string>('');

    // aria-rowcount + aria-colcount on the
    // wrapper. Counts ALL navigable rows + columns (header + pinned +
    // displayed-page body + selection column if shown). Excludes filter
    // row / footer / status bar per Decision A.1 — those aren't part of
    // the navigable grid surface.
    const ariaRowCount = computed<number>(
      () =>
        1 + // header row
        topPinnedRows.value.length +
        pagedRows.value.length +
        bottomPinnedRows.value.length,
    );
    const ariaColCount = computed<number>(
      () => visibleColumns.value.length + (props.selectionColumn.show === true ? 1 : 0),
    );

    // tooltip state. A single SFC-level timer
    // backs the hover-delay (`mergedTheme.value.tooltipDelayMs`,
    // default 400ms). `tooltipPendingCellRef` tracks the cell the
    // timer is waiting on so pointermove between cells can decide
    // whether to restart the timer. `tooltipActiveRef` is set when
    // the timer fires + the popover is visible; cleared on
    // pointerleave / scroll / edit-start / range-drag-start.
    const tooltipPendingCellRef = ref<CellRef | null>(null);
    const tooltipActiveRef = ref<{
      readonly rowId: string;
      readonly colId: string;
      readonly text: string;
      readonly x: number;
      readonly y: number;
    } | null>(null);
    let tooltipTimerId: number | null = null;

    const { clientWidth } = useTableContainerSize(wrapperRef);
    const { clientHeight: bodyClientHeight, scrollTop: bodyScrollTop } =
      useTableBodyScroll(bodyRef);

    // (single-column) / (multi-column): internal
    // sort state. No controlled `sortSpec` prop per Decision C.1 —
    // consumers drive via the imperative setSort/clearSort handle
    // methods + observe via sort-change emit. Always an array; empty
    // array = no sort.
    const sortSpec = ref<readonly SortSpec[]>([]);

    // internal filter state. Same posture as
    // sort — internal-only, imperative handle methods + filter-change
    // emit. Always an array; empty = no filter.
    const filterSpec = ref<readonly FilterSpec[]>([]);

    // internal quick-find text state. Same
    // posture as sort + filter — internal-only, imperative
    // getQuickFindText/setQuickFindText handle methods + quick-find-
    // text-change emit. Empty string = no quick-find (identity).
    const quickFindText = ref<string>('');

    // internal selection state. Array shape
    // is the API-surface canonical form (JSON-serializable; consumers
    // can mirror to URL / store). The derived Set is for O(1)
    // isRowSelected lookups during per-row render.
    const selectedRowIds = ref<readonly string[]>([]);
    const selectedRowIdsSet = computed(() => new Set(selectedRowIds.value));

    // selection anchor for shift+click range
    // selection. Updates on plain click + Ctrl/Cmd+click + checkbox
    // toggle (the "intentional" selection actions). Reads only on
    // shift+click — the anchor STAYS PUT so consecutive shift+clicks
    // intuitively re-extend the range to the new endpoint. Cleared
    // when the selection goes empty (so the next interaction
    // re-establishes a fresh anchor).
    const selectionAnchorRef = ref<string | null>(null);

    // in-flight edit state. Only ONE cell at a
    // time can be in edit mode; opening an edit on a different cell
    // commits the previous one first (matches click-elsewhere blur
    // semantic). `null` when no edit is active.
    const editingCellRef = ref<EditingCell | null>(null);
    // guards the `<input>` blur handler from double-firing
    // commit/cancel when Enter / Tab / Esc handler already explicitly
    // committed or cancelled. The keydown handler sets this true
    // before calling commit/cancel; blur reads it + skips.
    const editCommitInProgressRef = ref<boolean>(false);
    // invalid-cell marker map. Keyed by
    // `${rowId}::${colId}`; populated on validator-rejected commits;
    // cleared on commit-success or cancel for the same key. Drives the
    // cell render's `cx-table-cell--invalid` + `data-cell-invalid` +
    // `aria-invalid` triple per Decision C.1.
    const invalidCellsRef = ref<Map<string, EditValidationError>>(new Map());
    function invalidCellKey(rowId: string, colId: string): string {
      return `${rowId}::${colId}`;
    }
    function parseInvalidCellKey(key: string): { rowId: string; colId: string } {
      const idx = key.indexOf('::');
      return { rowId: key.slice(0, idx), colId: key.slice(idx + 2) };
    }
    // snapshot the invalid-cell map as a
    // `readonly InvalidCellEntry[]` (insertion-ordered, frozen).
    // Adapter calls this whenever the map mutates and either emits
    // `invalid-cells-change` or returns from `TableHandle.getInvalidCells`.
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
      emit('invalid-cells-change', { entries, count: entries.length });
    }
    // reconcile invalid markers for a row's
    // cells after a commit lands. Runs `rowValidators` against the
    // POST-commit row + replaces the row's portion of `invalidCellsRef`
    // with the new violation set. Cells previously marked invalid on
    // this row whose colIds are NOT in the new violation set are
    // cleared (per Decision B.1 step 6). Cells in OTHER rows are
    // untouched. Returns `true` when the map changed.
    function reconcileRowValidationsForRow(row: RowSpec): boolean {
      const rowValidators = props.rowValidators ?? [];
      if (rowValidators.length === 0) {
        // No row validators — clearing-only branch is a no-op; per-cell
        // validators own their own clear path elsewhere.
        return false;
      }
      const violations = runRowValidators({ row, rowValidators });
      const violationByColId = new Map<string, RowValidationViolation>();
      for (const v of violations) violationByColId.set(v.colId, v);
      const next = new Map(invalidCellsRef.value);
      let changed = false;
      // Clear stale entries on this row (cells not in the new
      // violation set). Skip async-pending cells — their state is
      // owned by the async-resolve branch.
      for (const key of next.keys()) {
        const { rowId, colId } = parseInvalidCellKey(key);
        if (rowId !== row.id) continue;
        if (pendingAsyncValidationByKey.value.has(key)) continue;
        if (!violationByColId.has(colId)) {
          next.delete(key);
          changed = true;
        }
      }
      // Add new violations.
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
    // paste-pipeline validator gate. Wires
    // `runCellValidator` per `pasteValidatorPolicy`. Returns
    // `undefined` when the policy is `'allow-invalid'` (legacy Phase
    // 20 / behavior); returns the gate function when
    // `'skip-rejected'` (default).
    function resolvePasteValidatorGate(): PasteValidatorGate | undefined {
      if (props.pasteValidatorPolicy === 'allow-invalid') return undefined;
      return (column: ColumnSpec, value: unknown, row: RowSpec) =>
        runCellValidator({ column, value, row });
    }
    // synthesize a "would-be post-commit"
    // row by applying mutations into a shallow data clone. chronix
    // is emit-only — the consumer hasn't yet written mutations
    // back to props.rows — so rowValidators must see the simulated
    // post-commit row, not the unchanged source row.
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
    // in-flight async-validator state. Keyed
    // by `${rowId}::${colId}` (same shape as `invalidCellsRef`).
    // `requestId` is a monotonic global counter so stale promise
    // resolutions can race-discard against the current entry.
    // `draftValue` is the post-coerce typed value being validated
    // (used in the final emit's `finalValue`).
    interface PendingAsyncValidation {
      readonly requestId: number;
      readonly draftValue: unknown;
    }
    const pendingAsyncValidationByKey = ref<Map<string, PendingAsyncValidation>>(new Map());
    let nextAsyncValidationRequestId = 1;
    // one-time-warn registry for multi-filter
    // columns whose `multiFilterChildTypes.length > 5` (Decision C.1
    // cap). Keyed by colId to avoid spamming the console on every
    // bootstrap of the same column.
    const multiFilterSlotCountWarned = ref<Set<string>>(new Set());

    // internal column-resize transaction.
    // Created on pointerdown over a header resizer; updated on every
    // pointermove (immutable replacement — new object each step);
    // cleared on pointerup (commit) or pointercancel /
    // lostpointercapture / cancelColumnResize (cancel). `null` when
    // no resize is active.
    const resizingColumnRef = ref<ColumnResizing | null>(null);
    // guards the pointercancel + lostpointercapture
    // handlers from firing a redundant cancel when an explicit
    // pointerup commit is in progress. Mirrors
    // editCommitInProgressRef pattern; reset deferred to
    // queueMicrotask to absorb the async lostpointercapture event
    // that fires AFTER pointerup releases the capture.
    const resizeCommitInProgressRef = ref<boolean>(false);

    // two-stage column-move state. The pending
    // ref is set on header-cell pointerdown but the drag is NOT active
    // (no emits, no drop indicator) until the cursor travels past
    // `DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX` (5px Chebyshev), at
    // which point pending is cleared + `movingColumnRef` is created
    // + `column-move-start` fires. If pointerup arrives while still
    // pending, the cell's normal click → sort cycle takes over. This
    // is Decision C.1 — the threshold preserves the existing single-
    // click sort gesture while still capturing the pointerdown origin
    // needed to detect intent.
    const pendingMoveColumnRef = ref<PendingColumnMove | null>(null);
    const movingColumnRef = ref<ColumnMoving | null>(null);
    // mirror of pendingMoveColumnRef +
    // movingColumnRef on the row axis. Same two-stage promotion pattern
    // (pending → moving on threshold crossing).
    const pendingMoveRowRef = ref<PendingRowMove | null>(null);
    const movingRowRef = ref<RowMoving | null>(null);
    // mirrors resizeCommitInProgressRef — guards
    // pointercancel + lostpointercapture from firing a redundant
    // cancel when an explicit pointerup commit is in progress. Reset
    // deferred to queueMicrotask to absorb the async lostpointercapture
    // event that fires after pointerup releases the capture.
    const moveCommitInProgressRef = ref<boolean>(false);

    // drag auto-scroll state. `rafIdRef` holds
    // the active rAF id while the loop runs; null when idle.
    // `latestClientYRef` mirrors the latest pointermove clientY so the
    // rAF callback reads the freshest cursor position. Mutual-
    // exclusivity warn flag is one-shot per mount (Decision A.1).
    const autoScrollRafIdRef = ref<number | null>(null);
    const autoScrollLatestClientYRef = ref<number>(0);
    const warnedRowDragMixedRef = ref<boolean>(false);

    // internal pagination state. Always
    // tracked even when `paginationEnabled` is false — the latter
    // only controls whether pagePass receives a non-zero pageSize
    // (turning the pass into the passthrough state) + whether the
    // footer renders. `currentPageRef` is 0-based; the footer
    // displays `currentPageRef.value + 1` for human-friendly
    // numbering per Decision B.
    const currentPageRef = ref<number>(0);
    const currentPageSizeRef = ref<number>(props.initialPageSize);
    const effectivePageSize = computed(() =>
      props.paginationEnabled ? currentPageSizeRef.value : 0,
    );

    // `filteredRows` is computed inside the composable;
    // the SFC reads `pagedRows` (the post-filter + post-sort + post-
    // page projection) for the body render. `sortedRows` is still
    // exposed because the pre-mount frame falls back to it when
    // viewport height is unknown (see render below).
    //
    // `columnsForLayout` patches the resizing
    // column's spec with the draft width during an in-flight resize
    // transaction. Substituting `{ ...col, width: draftWidth,
    // flex: undefined }` is the load-bearing trick — `columnLayoutPass`
    // doesn't need to know about resize state because the SFC pre-
    // patches the input. Clearing `flex` is intentional per Decision
    // B.1 so resizing a flex column converts it to explicit width
    // (matches AG-Grid / MUI DataGrid). When no resize is in flight,
    // returns `props.columns` by reference (no allocation).
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

    // per-row lazy state. Map keyed by rowId →
    // LazyChildrenState; absent entries = implicit 'idle'. Stored as
    // a shallowRef so Vue treats the Map as a single reactive unit;
    // we replace the Map (not mutate in place) to trigger render
    // updates. Also tracks `loadedChildrenByRowId` derived from the
    // state map's 'loaded' entries for downstream synthesis.
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
    // one-time warn tracker so each rowId only logs once.
    const lazyMisconfigWarnedIds = new Set<string>();

    // tree-data expand-state composable. Hybrid
    // controlled / uncontrolled per Decision B.1. The composable owns
    // the source-of-truth Set; chevron-click / Enter / Space / ArrowR /
    // ArrowL all route through `toggle` / `expand` / `collapse`.
    const treeExpandState = useTreeExpandState({
      controlled: computed(() => props.expandedRowIds),
      defaultExpandedRowIds: computed(() => props.defaultExpandedRowIds),
      defaultExpandedDepth: computed(() => props.defaultExpandedDepth),
      rows: computed(() => props.rows),
      emit: (next) => {
        emit('expanded-change', { next });
      },
    });
    // Decision F.1: union the user's manual expand set with
    // any filter-auto-expanded ancestors (the union is what
    // treeFlattenPass actually consumes). We forward-declare a
    // placeholder Set ref so the consumer in `useTableLayout`'s
    // `expandedRowIds` input has something to read on first frame —
    // it's populated below once `filterForceExpandedRowIds` is
    // available.
    const effectiveExpandedRowIdsSet = ref<ReadonlySet<string>>(new Set<string>());

    /**
     * server-side row model session. Lazily
     * created when `rowModelType === 'serverSide'` + a source is
     * supplied. The version ref is bumped by the source's subscribe
     * listener so the synthesized-rows computed re-runs after each
     * block resolves. Skeleton rows carry the `SERVER_SIDE_SKELETON_ID_PREFIX`
     * marker so the body render block can swap their content for a
     * shimmer placeholder.
     */
    const serverSideSessionRef = ref<ServerSideRowSource | null>(null);
    const serverSideVersion = ref(0);
    let unsubscribeServerSideListener: (() => void) | null = null;

    // Decision A.1: previous-tick viewport
    // range refs for direction inference. `null` = first tick (or
    // post-session-reset) — no prior range, skip prefetch. Declared
    // here (above the session up/teardown helpers) so the helpers can
    // reset them when a session transitions.
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
      // Decision A.1: when paginationEnabled,
      // pageSize OVERRIDES props.cacheBlockSize (page N maps 1:1 to
      // block N). One-time warn when an explicit non-default
      // cacheBlockSize is supplied alongside paginationEnabled in
      // server-side mode — silent override would surprise the consumer.
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
      // Decision C.1: eager bootstrap fetch.
      // Fires block 0's dispatch immediately so totalRowCount is
      // discoverable without waiting for viewport metrics. Resolves
      // the chicken-and-egg between viewport-effect dispatch (needs
      // totalRowCount + viewport size) and totalRowCount discovery
      // (needs a first request to fire).
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
     * -C (2026-05-30): per-row auto-height measurement state.
     * Active only when `enableRowAutoHeight === true`. Each visible
     * body row's DOM node is observed via a single ResizeObserver;
     * measured heights are written into the reactive Map keyed by
     * row id, then surfaced as an override object for
     * `rowLayoutPass`. The override wins over `RowSpec.heightHint`
     * and `defaultRowHeight` (per `row-layout-pass.ts` -C
     * cascade). Settle: 2 render frames per row (first at
     * defaultRowHeight → observer fires → ref updates → re-render
     * with measured height → observer fires again with no diff →
     * stable).
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
     * -A (2026-05-30): per-row displayed-position lookup. Maps
     * each row's id to its 0-based index in `pagedRows` (the post-
     * pipeline rows the user sees). Row-number cells read this map to
     * render `index + 1` as the cell value.
     */
    const displayedRowIndexByRowId = ref<Record<string, number>>({});

    /**
     * tool-panel container reactive state.
     * `activeToolPanelId` holds the id of the open panel or `null` when
     * the content area is collapsed. `toolPanelWidth` is the resizable
     * container width in pixels (clamped to `[minWidth, maxWidth]`).
     * Initialized from `props.toolPanel?.initialOpenId` +
     * `props.toolPanel?.initialWidth` at mount; subsequent changes are
     * internal (icon click toggles activeToolPanelId; drag updates
     * toolPanelWidth; both fire chronix-NEW emits).
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
      emit('tool-panel-change', { activePanelId: nextId });
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
        emit('tool-panel-width-change', { width: toolPanelWidth.value });
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    }

    /**
     * -A (2026-05-30) — column header menu state. Only one
     * column-header menu open at a time; opening a new one
     * auto-closes the previous via `openColumnHeaderMenuColIdRef`.
     */
    const openColumnHeaderMenuColIdRef = ref<string | null>(null);

    /**
     * -B (2026-05-30) — cell context menu state. `null`
     * when the menu is closed. When set, the wrapper renders the
     * overlay at `position: fixed; left: x; top: y`.
     */
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
      emit('context-menu-open', { rowId, colId, x, y });
    }

    function applyCloseContextMenu(): void {
      if (contextMenuPositionRef.value == null) return;
      contextMenuPositionRef.value = null;
      emit('context-menu-close');
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
      emit('column-header-menu-action', { colId, action });
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
      const ctx: ContextMenuContext = { rowId: pos.rowId, colId: pos.colId };
      const disabled = item.disabled?.(ctx) === true;
      if (disabled) return;
      applyCloseContextMenu();
      item.onClick(ctx);
    }

    /**
     * — document-level close-on-outside +
     * close-on-Escape listeners shared by column header menu +
     * cell context menu. Mounted once; checks both refs and
     * closes whichever is open when the target is outside.
     */
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
      // close cell style editor on outside-
      // click (handled in the same document-level listener as Phase
      // 83 menus to keep listener count minimal).
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
      // Escape closes cell style editor.
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
    // surfaces. Each composable manages a roving-tabindex `activeIndex`
    // + ArrowDown/Up/Home/End handler scoped to its menu container.
    // Render code reads `activeIndex` to set `tabindex={0|-1}` per item
    // and binds `handleKeydown` on the menu container's `onKeydown`.
    //
    // Item identity contracts:
    //   - tool-panel tablist: `{ id: <panel.id> }` per descriptor.
    //   - column header menu: 5 fixed action ids (sort-asc / sort-desc /
    //     clear-sort / hide / autosize) with derived `disabled` from
    //     the currently-open column's sortable + autosizeable state.
    //   - cell context menu: `{ id: <item.id>, disabled }` per consumer
    //     item; `disabled` runs item.disabled?(ctx) once per items recompute.
    //   - column-visibility menu: `{ id: <col.id> }` per consumer column
    //     (no disabled — all columns can be hidden).
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
      // Column header menu cycles between columns without closing
      // (clicking another column's ▾ button swaps which menu is open
      // while keeping `openColumnHeaderMenuColIdRef != null` → isOpen
      // stays true). Treat the colId as the menu's instance key so
      // activeIndex resets on column switch.
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
      // Read version so re-render fires when a block resolves.
      void serverSideVersion.value;
      const total = session.getTotalRowCount();
      if (total <= 0) return [];
      const blockSize = session.cacheBlockSize;
      // Decision B.1: when paginationEnabled,
      // allocate ONLY the current page's rows. Per Decision A.1,
      // pageSize === cacheBlockSize, so page N maps 1:1 to block N
      // and the visible range is [page*pageSize, (page+1)*pageSize).
      // Non-paginated mode keeps the existing full-virtual-array loop.
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
      // Decision A.1 + B.1: peek-only loop —
      // the synthesized array is filled with cached rows + skeletons
      // without dispatching for off-screen blocks. A separate viewport
      // effect (see `serverSideViewportEffect` watch below) fires
      // `getRowAt` for visible indices only.
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

    // Decision B.1: viewport-driven dispatch
    // effect. Active only when `rowModelType === 'serverSide' &&
    // !paginationEnabled` — paginated mode keeps the existing Phase
    // 45.1 page-range loop's getRowAt calls. Watches the visible row
    // range derived from body scroll metrics + theme rowHeight + a
    // 3-row overscan (matches `DEFAULT_OVERSCAN` from virtualRowsPass).
    // Decision B.1 extends this effect with a
    // direction-aware prefetch pass appended after the visible-range
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
        // Decision A.1 + B.1: direction-aware
        // prefetch pass. Only fires when prop > 0 AND there's a prior
        // viewport range to compare against AND the range actually
        // shifted (= user scrolled, not just a `serverSideVersion`
        // re-fire).
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

    // Decision B.1: pagination footer values
    // for serverSide + paginationEnabled mode. The client-side
    // pagination footer reads from pagePass output, but in server-side
    // mode the synthesized rows ARE already the current page's slice
    // (pagePass passthrough), so the footer needs totals derived from
    // session.getTotalRowCount() + effectivePageSize directly.
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
      sortSpec: () => (props.rowModelType === 'serverSide' ? [] : sortSpec.value),
      filterSpec: () => (props.rowModelType === 'serverSide' ? [] : filterSpec.value),
      quickFindText: () => (props.rowModelType === 'serverSide' ? '' : quickFindText.value),
      page: () => (props.rowModelType === 'serverSide' ? 0 : currentPageRef.value),
      pageSize: () => (props.rowModelType === 'serverSide' ? 0 : effectivePageSize.value),
      expandedRowIds: () => effectiveExpandedRowIdsSet.value,
      loadedLazyChildrenByRowId: () => loadedLazyChildrenByRowId.value,
      rowHeightOverridesByRowId: () => rowHeightOverridesObject.value,
    });

    // rowsByIdAcrossTree — lookup helper used by
    // the lazy load handler to fetch the parent RowSpec given its id.
    // Reads from props.rows recursively (synchronous tree only); for
    // loaded-lazy nested parents, walks through `lazyChildrenStateRef`
    // entries' loaded children.
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

    // load handler invoked on chevron click for
    // a lazy-eligible row. Dispatches on current status per Decision D.1.
    function applyLazyChevronClick(rowId: string): void {
      const parent = findRowByIdRecursive(rowId);
      if (parent == null) return;
      const isLazyEligible = parent.children === undefined && parent.hasChildren === true;
      if (!isLazyEligible) {
        // Sync tree row — fall back to standard expand/collapse.
        treeExpandState.toggle(rowId);
        return;
      }
      const loader = props.childrenLoader;
      if (loader == null) {
        // Misconfiguration: hasChildren: true + no loader. Render
        // chevron + click no-op + one-time console.warn per rowId.
        if (!lazyMisconfigWarnedIds.has(rowId)) {
          lazyMisconfigWarnedIds.add(rowId);
          console.warn(
            `[chronix-table] row "${rowId}" has hasChildren: true but no childrenLoader prop. ` +
              `Chevron click is a no-op. Provide childrenLoader to enable lazy load.`,
          );
        }
        // Still toggle visual expand state so the chevron rotates (no
        // children appear because synthesis pass has nothing to merge).
        treeExpandState.toggle(rowId);
        return;
      }
      const current = lazyChildrenStateRef.value.get(rowId);
      if (current?.status === 'loading') {
        // Dedup: already loading; click is no-op.
        return;
      }
      if (current?.status === 'loaded') {
        // Already loaded — toggle expand/collapse of the cached
        // children. NO re-fetch (Decision H.1).
        treeExpandState.toggle(rowId);
        return;
      }
      // current is undefined (idle) OR status === 'error' (retry).
      // Both paths: spin up a fresh AbortController + invoke loader.
      const abort = new AbortController();
      const nextMap = new Map(lazyChildrenStateRef.value);
      nextMap.set(rowId, { status: 'loading', abort });
      lazyChildrenStateRef.value = nextMap;
      // Expand the row visually so the spinner takes the chevron's
      // place + the row reads as "opening."
      treeExpandState.expand(rowId);
      emit('lazy-load-start', { parent });
      void loader({ parent, signal: abort.signal }).then(
        (children) => {
          // Stale-resolution guard: only commit when our controller is
          // still the active one for this rowId.
          const currentAfter = lazyChildrenStateRef.value.get(rowId);
          if (currentAfter?.abort !== abort) return;
          const nextMap2 = new Map(lazyChildrenStateRef.value);
          nextMap2.set(rowId, { status: 'loaded', children });
          lazyChildrenStateRef.value = nextMap2;
          emit('lazy-load-success', { parent, children });
        },
        (error: unknown) => {
          const currentAfter = lazyChildrenStateRef.value.get(rowId);
          if (currentAfter?.abort !== abort) return;
          // If aborted: drop state silently (no emit per Decision E.1).
          if (abort.signal.aborted) {
            const nextMap2 = new Map(lazyChildrenStateRef.value);
            nextMap2.delete(rowId);
            lazyChildrenStateRef.value = nextMap2;
            return;
          }
          const nextMap2 = new Map(lazyChildrenStateRef.value);
          nextMap2.set(rowId, { status: 'error', error });
          lazyChildrenStateRef.value = nextMap2;
          emit('lazy-load-error', { parent, error });
        },
      );
    }

    // collapse-mid-load aborter. When the row
    // is collapsing AND its lazy state is 'loading', abort the
    // controller + drop state. Called from the chevron-click branch
    // BELOW (in renderTreeChevronOrSpacer's onClick) before we route
    // through the expand state toggle.
    function abortLazyLoadIfInflight(rowId: string): void {
      const state = lazyChildrenStateRef.value.get(rowId);
      if (state?.status !== 'loading') return;
      state.abort?.abort();
      const nextMap = new Map(lazyChildrenStateRef.value);
      nextMap.delete(rowId);
      lazyChildrenStateRef.value = nextMap;
    }

    /**
     * which visible column shows the
     * expand/collapse chevron + indent (Decision D.1). Explicitly
     * opt-in via `treeColumn: true` on a `ColumnSpec`. When zero or
     * multiple are flagged, the first visible flagged column wins;
     * when zero are flagged AND the dataset has tree rows, fall back
     * to the first visible column with a `console.warn`.
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

    // Decision F.1 + compute the
    // effective expand set = user's manual set ∪ filter-auto-expanded
    // ancestors ∪ quick-find-auto-expanded ancestors. Vue's computed
    // graph converges naturally — both force-expand lists depend only
    // on their pass results (NOT on `flatTreeRows`), so the back-
    // feeding loop has no cycle.
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

    // -A (2026-05-30): populate the displayed-row-index lookup
    // whenever the post-pipeline rows array changes. `pagedRows` is the
    // chronix-canonical "rows the user sees" array (post-filter + post-
    // sort + post-page). Identity-stable empty object when there are
    // no rows, so consumer-side downstream computeds don't churn.
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

    /**
     * downstream of `columnLayoutPass` —
     * partitions `visibleColumns` into left-pinned / center /
     * right-pinned zones and computes cumulative sticky offsets for
     * each pinned cell. The result is read by the header / filter /
     * body cell render blocks to apply `position: sticky` + the right
     * `left:`/`right:` pixel offset + zone modifier classes. Reactively
     * recomputes when columns or widths change (resize,
     * reorder, autosize, hide-show, theme override).
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
     * per-zone header-group spans, one inner
     * array per nesting level (outermost level at index 0). Per
     * Decision A.1, groups never span across pinned-zone
     * boundaries. Per Decision B.1, all zones produce the
     * SAME number of rows (table-wide max depth) by top-padding
     * shallower-depth zones with empty placeholder rows so the multi-
     * row header strip aligns horizontally across zones.
     *
     * Returns `null` when `tableMaxHeaderDepth` is 0 so the render
     * block can short-circuit before allocating empty per-zone arrays.
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
     * per-colId aggregate values for the optional
     * sticky footer row. Reactive over `visibleColumns` + `filteredRows`
     * so the footer recomputes when the user changes the filter spec.
     * Skipped when `showFooterRow: false` so consumers without footers
     * pay nothing for the helper call.
     */
    const footerValuesByColId = computed<Record<string, unknown>>(() => {
      if (!props.showFooterRow) return {};
      return computeFooterValues(visibleColumns.value, filteredRows.value);
    });

    /**
     * assign sort spec + fire `sort-change` when the
     * new array differs from the current. Rejects (silently) when
     * any entry targets a non-sortable or unknown column — matches
     * `sortPass`'s atomic rejection so the SFC and the core agree on
     * which specs are observable.
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
      emit('sort-change', { sortSpec: next });
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
      // Array.isArray narrows the value to any[] in TS — re-narrow via
      // the explicit shape we promised in the input signature. The
      // `as SortSpec` on the single-spec branch is the symmetric
      // narrowing (TS's negative-Array.isArray check doesn't remove
      // the array variant from the union).
      if (Array.isArray(spec)) return spec as readonly SortSpec[];
      return [spec as SortSpec];
    }

    /**
     * assign filter spec + fire `filter-change` when the
     * new array differs from the current. Rejects (silently) when
     * any entry targets a non-filterable or unknown column — matches
     * `filterPass`'s atomic rejection.
     *
     * Array equality is by length + per-entry type+colId+operator+
     * value+caseSensitive equality. The dedup guards against no-op
     * keystrokes (e.g., setFilter from an unchanged input event).
     */
    function applyFilter(next: readonly FilterSpec[]): void {
      for (const entry of next) {
        // expression-variant specs are validated at
        // `filterPass` evaluation time (every compare leaf checked
        // against `filterable !== false`); skip the colId-keyed
        // pre-flight check here.
        if (entry.type === 'expression') continue;
        const col = columnTable.value.getById(entry.colId);
        if (col == null || col.filterable === false) return;
      }
      const current = filterSpec.value;
      if (current.length === next.length && current.every((c, i) => filterSpecEqual(c, next[i]!))) {
        return;
      }
      filterSpec.value = next;
      emit('filter-change', { filterSpec: next });
      // Decision C.1: a filter transition invalidates the
      // current page window — reset to page 0 so the user sees the
      // first page of the freshly narrowed row set.
      resetPageToFirstIfPaginated();
    }

    /**
     * apply a new quick-find text. Dedup
     * identical-string applications (no-op) so adapters can safely
     * call `setQuickFindText` per-keystroke without flooding emits.
     * A non-empty → empty (or empty → non-empty) transition resets
     * pagination to page 0 (same posture as filter transition per
     * Decision C.1).
     */
    function applyQuickFindText(next: string): void {
      const current = quickFindText.value;
      if (current === next) return;
      quickFindText.value = next;
      emit('quick-find-text-change', { quickFindText: next });
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
     * + 9.1: SFC-internal helper for per-column filter-input
     * updates. Dispatches on `column.type`:
     *
     * - `'number'` columns → parse the input via
     *   `parsePrefixNumberFilter` (supports `5`, `>10`, `<20`, `>=5`,
     *   `<=10`, `!=3`, `5..50`). Invalid input → no spec entry
     *   (treats typos as "no filter" rather than hiding rows).
     * - other columns → text filter with `'contains'` operator.
     *
     * Empty value (or invalid number-filter input) removes the entry
     * so `getFilter()` doesn't accumulate dead specs.
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
     * reactively update the visible input.
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
     * read the current `SetFilterSpec` for a
     * column. Returns `null` when no set-filter spec is active for the
     * column (every value passes). Returns the selectedValues array
     * (which may be `null` for the explicit identity case, `[]` for
     * vacuous-false, or `[...]` for partial selection). Drives the
     * dropdown checkbox state.
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
     * replace the `SetFilterSpec` entry for a column. Pass
     * `null` to remove the entry (filter inactive — same as no
     * SetFilterSpec). Empty array `[]` keeps an active vacuous-false
     * spec (no rows pass). Dispatches via the same `applyFilter` path
     * as text / number / expression variants.
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

    /**
     * produce a label for the `<summary>` of a column's
     * set-filter dropdown. Reads the current SetFilterSpec + the
     * column's unique-value count to render "全部 (N)" or "M / N".
     */
    function setFilterSummaryLabel(colId: string, totalUnique: number): string {
      const selection = getSetFilterValues(colId);
      if (selection == null) return `全部 (${totalUnique}) ▾`;
      if (selection.length === 0) return `空选 (0 / ${totalUnique}) ▾`;
      return `${selection.length} / ${totalUnique} ▾`;
    }

    /**
     * stable membership-test helper. Used by the dropdown
     * checkbox render to decide which boxes are checked. When the
     * SetFilterSpec is absent (filter inactive) every value is
     * considered checked (identity); when the array is empty no value
     * is checked; otherwise the value is checked iff it appears.
     */
    function isSetFilterValueChecked(
      colId: string,
      value: string | number | boolean | null,
    ): boolean {
      const selection = getSetFilterValues(colId);
      if (selection == null) return true;
      for (const candidate of selection) {
        if (candidate === value) return true;
        // Match null/undefined cell-coercion equivalence at the IR.
        if (candidate === null && value === null) return true;
      }
      return false;
    }

    /**
     * toggle the checked state of a single value in the
     * SetFilterSpec for a column. When the spec is absent (null
     * identity), toggling OFF a value transitions to "all values
     * except this one"; toggling ON is a no-op (already included).
     * When the spec is present, the value moves in / out of the
     * selectedValues array.
     */
    function toggleSetFilterValue(
      colId: string,
      value: string | number | boolean | null,
      allValues: readonly (string | number | boolean | null)[],
    ): void {
      const selection = getSetFilterValues(colId);
      if (selection == null) {
        // Currently all selected (identity). Toggling OFF excludes
        // the value; build the array of all values minus this one.
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

    /**
     * read the current `MultiFilterSpec` for a
     * column, or `null` when no multi-filter is active. Drives the
     * `<details>` body's per-slot input value + segmented mode toggle
     * state.
     */
    function getMultiFilterSpec(colId: string): MultiFilterSpec | null {
      const entry = filterSpec.value.find(
        (s): s is MultiFilterSpec => s.type === 'multi' && s.colId === colId,
      );
      return entry ?? null;
    }

    /**
     * bootstrap a fresh `MultiFilterSpec` from the column's
     * `multiFilterChildTypes` config. Default slot layout is
     * `['text', 'text']` when the field is omitted. Each slot starts
     * with an empty-value child (text → empty string; number → 0 with
     * `=` operator which won't match anything pre-input — predicate
     * factory still constructs but never matches until the user types).
     *
     * Logs a one-time `console.warn` per session when slot count > 5
     * (per design Decision C.1 cap).
     */
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
      // consumer-supplied default mode via the
      // `multiFilterDefaultMode` SFC prop (default `'AND'`).
      return { type: 'multi', colId: col.id, mode: props.multiFilterDefaultMode, filters };
    }

    /**
     * replace the in-flight `MultiFilterSpec` for a column.
     * Pass `null` to remove the entry. Dispatches via the same
     * `applyFilter` path as text / number / set / expression variants.
     */
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

    /**
     * replace a single child slot's value at index
     * `slotIdx`. Text children store the raw string; number children
     * store the parsed numeric (`Number.NaN` → spec preserved with raw
     * value to keep the input round-trippable; predicate then rejects).
     */
    function setMultiFilterChildValue(col: ColumnSpec, slotIdx: number, rawValue: string): void {
      const current = getMultiFilterSpec(col.id) ?? bootstrapMultiFilterSpec(col);
      const existing = current.filters[slotIdx];
      // if the slot at slotIdx is a group entry
      // (consumer-injected via setFilter), the flat-slot writer doesn't
      // apply — return without mutation. Per-group editing happens via
      // the consumer's own spec mutations until 117.1 ships in-UI
      // affordances.
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
        // Set slot ignores raw string input — toggleMultiFilterChildSetValue
        // owns the membership update (callback-driven, not input-driven).
        return;
      } else {
        nextChild = { type: 'text', operator: 'contains', value: rawValue };
      }
      const nextFilters = current.filters.map((f, i) => (i === slotIdx ? nextChild : f));
      applyMultiFilterSpec(col.id, { ...current, filters: nextFilters });
    }

    /**
     * toggle membership of `value` in a set-
     * type multi-filter child's `selectedValues`. `null` ↔ `[value]`
     * transitions (first click on identity opens the membership set to
     * just that value; subsequent clicks toggle the entry). Mutates
     * `spec.filters[slotIdx]` immutably and dispatches via
     * `applyMultiFilterSpec`.
     */
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

    /**
     * consumer-facing write-access for a
     * custom-rendered multi-filter slot. Receives the next
     * `MultiFilterChild` shape (any of the 3 variants) and splices it
     * into the spec's `filters[]` at `slotIdx`. Bootstraps the spec
     * via `bootstrapMultiFilterSpec` when absent. Drives the
     * `setChildValue` arg of `multiFilterChildRenderer`.
     */
    function setMultiFilterChildSpec(
      col: ColumnSpec,
      slotIdx: number,
      next: MultiFilterEntry,
    ): void {
      const current = getMultiFilterSpec(col.id) ?? bootstrapMultiFilterSpec(col);
      const nextFilters = current.filters.map((f, i) => (i === slotIdx ? next : f));
      applyMultiFilterSpec(col.id, { ...current, filters: nextFilters });
    }

    /**
     * is `value` currently a member of the set-child at
     * `slotIdx`? Returns false for non-set slots OR identity
     * (`selectedValues: null`). Drives the checkbox `checked` attr.
     */
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
     * change the AND/OR mode for the column's multi-filter
     * container. Bootstraps the spec if not already present.
     */
    function setMultiFilterMode(col: ColumnSpec, mode: 'AND' | 'OR'): void {
      const current = getMultiFilterSpec(col.id) ?? bootstrapMultiFilterSpec(col);
      if (current.mode === mode) return;
      applyMultiFilterSpec(col.id, { ...current, mode });
    }

    /**
     * walk an immutable path through a
     * `MultiFilterSpec`'s entries tree, returning the entry at the
     * path or null when the path is out of range. Empty path throws
     * — the root spec is not itself an entry. The path is
     * `readonly number[]` indexing into successive `filters[]`
     * arrays.
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

    /**
     * immutable replace of an entry at the
     * given path. Spreads each intermediate group along the path so
     * unrelated branches stay by reference. Empty path throws.
     * Out-of-range path is a no-op (defensive).
     */
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
      if (current.type !== 'group') return entries; // can't drill into a leaf
      const replacedChildren = replaceEntryAtPath(current.filters, path, pathIdx + 1, next);
      if (replacedChildren === current.filters) return entries;
      const replacedGroup: MultiFilterGroup = { ...current, filters: replacedChildren };
      return entries.map((e, i) => (i === idx ? replacedGroup : e));
    }

    /**
     * immutable remove of the entry at the
     * given path. Same spread-walk shape as `set` but splices the
     * leaf out of its parent's `filters[]`. Empty path throws.
     */
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

    /**
    /**
     * summary label for the `<details>` `<summary>`. Shows
     * "N 个筛选器" with N = count of active (non-empty-value) child
     * slots, or "未启用" when all slots empty / spec absent.
     */
    function multiFilterSummaryLabel(col: ColumnSpec): string {
      const spec = getMultiFilterSpec(col.id);
      if (spec == null) return '未启用';
      const active = spec.filters.filter((f) => {
        if (f.type === 'text') return f.value !== '';
        if (f.type === 'number') return Number.isFinite(f.value);
        if (f.type === 'set') {
          // set-child is active when selectedValues is a
          // non-empty array (vacuous-false `[]` STILL counts as active —
          // user picked "no values pass"). null = identity / inactive.
          return f.selectedValues != null;
        }
        // group counts as active when it has
        // at least one entry. Empty groups are identity per filter-pass.
        return f.filters.length > 0;
      }).length;
      if (active === 0) return '未启用';
      const modeLabel = spec.mode === 'AND' ? '全部' : '任一';
      return `${active} 个筛选器 · ${modeLabel}`;
    }

    /**
     * read the current Number filter range
     * for a column from the filterSpec. `inRange` ⇒ low/high from
     * spec values; single-value comparator (`=`, `>`, `<`, etc.) ⇒
     * both handles map to the spec's `value` (slider visually pinned
     * together); no entry ⇒ both at column extents.
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
     * map a slider value to a percent
     * along the track. Degenerate (max <= min) extents collapse to 0.
     */
    function rangeThumbLeftPercent(value: number, extents: { min: number; max: number }): number {
      if (extents.max <= extents.min) return 0;
      const ratio = (value - extents.min) / (extents.max - extents.min);
      if (ratio < 0) return 0;
      if (ratio > 1) return 100;
      return ratio * 100;
    }

    /**
     * open the cell style editor popover
     * anchored to the cell at `(rowId, colId)`. No-op when
     * `enableCellStyleEditor` is false. Reads existing per-cell
     * background-color override (if any) to initialize the in-popover
     * HSV / HEX state; falls back to white (`#ffffff`) for cells with
     * no override.
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
      // read all 9 axes from the
      // persisted map. Default active tab is 'background' (mirrors
      // single-axis behavior — opening on a fresh cell
      // shows bg axis first). If a cell has only a text / font /
      // border override, default to that axis so the user sees the
      // existing axis.
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
      // 12 per-side override fields.
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
            : '#ffffff'; // font + border tabs do not use hex; placeholder.
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
          // 12 per-side override fields.
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
          // Decision O.1: each cell-edit
          // session starts on the all-sides default; per-side
          // selection is a session-local UI ergonomic.
          borderSideTarget: 'all',
          // initialize border HSV
          // picker buffer from persisted borderColor (all-sides
          // start; effective fallback `borderColor → '#000000'`).
          hsv: rgbToHsv(hexToRgb(persistedBorderColor ?? '#000000') ?? { r: 0, g: 0, b: 0 }),
          hex: persistedBorderColor ?? '#000000',
        },
      };
    }

    /**
     * swap the popover editing buffer to a
     * different axis (`'background'` or `'text'`). Persists the
     * closing tab's current `hex` back into its slot (`bgHex` /
     * `textHex`); loads the opening tab's slot value (or the per-
     * axis default if empty) into the editing buffer (`hex` + `hsv`).
     * No-op if the requested tab is already active.
     */
    function switchCellStyleEditorTab(tab: 'background' | 'text' | 'font' | 'border'): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      if (state.activeTab === tab) return;
      // persist closing color tab's hex back
      // to its slot ONLY when leaving a color tab; font + border tabs
      // have no hex buffer to persist (fontState / borderState IS the
      // buffer + already current).
      const partialClosing: { bgHex?: string; textHex?: string } =
        state.activeTab === 'background'
          ? { bgHex: state.hex }
          : state.activeTab === 'text'
            ? { textHex: state.hex }
            : {};
      // Load opening tab's editing buffer. Color tabs: load slot →
      // hex → derive HSV. Font / border tabs: no buffer to load
      // (widgets read from fontState / borderState directly); but we
      // still need to refresh `hex` / `hsv` to a sensible placeholder
      // so re-entering a color tab works cleanly. Use white as the
      // font / border-tab placeholder.
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
     * toggle Bold weight on the font tab
     * (`fontState.fontWeight` between `'700'` and `null`). No-op when
     * popover is closed or font tab is not active.
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
     * set custom font weight on the font
     * tab. Accepts any of the 9 CSS numeric weights (`'100'`-`'900'`)
     * or `null` (clears). Sibling of `toggleCellStyleFontWeight` (Bold
     * shortcut); both write to the same `fontState.fontWeight` field.
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
     * toggle Italic style on the font tab
     * (`fontState.fontStyle` between `'italic'` and `null`).
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
     * set text-decoration on the font tab
     * (`fontState.textDecoration`). Accepts `'underline'` /
     * `'line-through'` / `null` (None clears the override).
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
     * compute the borderState field name
     * for a given axis + current `borderSideTarget`. All-sides target
     * → unprefixed (`borderColor`); per-side target → prefixed
     * (`borderTopColor`). Used by the 3 target-aware border setters
     * (color / width / style). Radius is always all-sides — no helper
     * needed.
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
     * set border color on the border tab.
     * target-aware — writes to
     * `borderColor` when `borderSideTarget === 'all'`; writes to
     * `borderTopColor` / etc. when a specific side is selected.
     * Accepts any hex string or empty string (clears the override on
     * the current target).
     * ALSO syncs `borderState.hex` +
     * `borderState.hsv` (the HSV picker disclosure's editing buffer)
     * when the input value is a valid 6-char hex — so typing in the
     * hex input updates the HSV picker on the next render.
     */
    function setCellStyleBorderColor(value: string): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const field = borderFieldFor('Color', state.borderState.borderSideTarget);
      const next: typeof state.borderState = {
        ...state.borderState,
        [field]: value === '' ? null : value,
      };
      // Sync HSV picker buffer when input is a valid hex literal.
      const rgb = hexToRgb(value);
      if (rgb != null) {
        next.hex = value;
        next.hsv = rgbToHsv(rgb);
      }
      cellStyleEditorOpenRef.value = { ...state, borderState: next };
    }

    /**
     * set border width on the border tab.
     * target-aware. `value` is the
     * numeric pixel string (`'2px'`) or empty (clears).
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
     * set border style on the border tab.
     * target-aware. Accepts `'solid'` /
     * `'dashed'` / `'dotted'` / `null` (None clears the override on
     * the current target).
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
     * set border radius on the border tab.
     * `value` is the numeric pixel string (`'4px'`) or empty (clears).
     * RADIUS IS ALWAYS ALL-SIDES — CSS
     * has no `border-top-radius` (radii are corner-not-side). Per-
     * side selection hides the radius widget in the render (so this
     * setter is only invoked when target === 'all').
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
     * switch which side the border tab's
     * 4 widgets edit. `'all'` → widgets write to all-sides fields;
     * `'top'|'right'|'bottom'|'left'` → widgets write to per-side
     * fields (radius widget hidden in per-side modes). State change
     * propagates immediately; widgets re-render with the new
     * target's values via `borderEffectiveField` reads.
     * ALSO re-derive borderState.hsv +
     * borderState.hex from the new active side's effective color
     * (with fallback to all-sides borderColor → '#000000') so the
     * HSV picker disclosure reflects the new target on next render.
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
     * given a new HSV from the border-
     * tab HSV picker disclosure, re-derive RGB + hex and write to
     * (a) `borderState.hsv` + `borderState.hex` (the picker's
     * editing buffer), AND (b) the active border side's color field
     * via `borderFieldFor('Color', borderSideTarget)` — same write
     * path as `setCellStyleBorderColor` for the hex input.
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

    /**
     * RGB-channel input handler for the
     * border-tab HSV picker disclosure. Reads current HSV → RGB,
     * patches the channel, derives new HSV, then routes through
     * `setCellStyleBorderHsv`. Mirrors `setCellStyleEditorRgbChannel`
     * but for the border-tab target.
     */
    function setCellStyleBorderRgbChannel(ch: 'r' | 'g' | 'b', raw: number): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      if (!Number.isFinite(raw)) return;
      const clamped = Math.max(0, Math.min(255, Math.round(raw)));
      const currentRgb = hsvToRgb(state.borderState.hsv);
      const nextRgb = { ...currentRgb, [ch]: clamped };
      const nextHsv = rgbToHsv(nextRgb);
      setCellStyleBorderHsv(nextHsv);
    }

    /**
     * close the cell style editor without
     * committing. Idempotent.
     */
    function cancelCellStyleEditor(): void {
      cellStyleEditorOpenRef.value = null;
      cellStyleSquareDragRef.value = false;
      cellStyleHueDragRef.value = false;
      cellStyleFontWeightSliderDragRef.value = false;
      // reset border-tab HSV drag refs.
      cellStyleBorderSquareDragRef.value = false;
      cellStyleBorderHueDragRef.value = false;
    }

    /**
     * commit the current in-popover HEX as
     * the cell's style override + emit `cell-style-change` + close
     * popover. commits ONLY the active
     * tab's field; the other axis's persisted value (if any) is
     * preserved in the map untouched. Emit payload reflects only the
     * committed field (backward-compatible per Decision D.1).
     */
    function applyCellStyleEditor(): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const { rowId, colId, hex, activeTab, fontState, borderState } = state;
      // Decision I.1: read prevForRow via
      // the effective view (controlled-mode prop wins). Internal map
      // write is gated below.
      const prevForRow = effectiveCellStyleByRowIdColId.value[rowId] ?? {};
      const prevForCell = prevForRow[colId] ?? {};
      const isUncontrolled = props.cellStyleByRowIdColId === undefined;
      // font / border tabs commit their full
      // cluster atomically; bg/text tabs commit single field
      // (existing 99.2.1 behavior). writes
      // gated behind `isUncontrolled`; emits always fire.
      if (activeTab === 'font') {
        const nextForCell: CellStyleEntry = { ...prevForCell };
        // Set each font field if non-null; delete via undefined if
        // null. Use conditional spread so optional fields stay clean.
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
        emit('cell-style-change', {
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
        // 4 all-sides fields.
        if (borderState.borderColor !== null) nextForCell.borderColor = borderState.borderColor;
        else delete nextForCell.borderColor;
        if (borderState.borderWidth !== null) nextForCell.borderWidth = borderState.borderWidth;
        else delete nextForCell.borderWidth;
        if (borderState.borderStyle !== null) nextForCell.borderStyle = borderState.borderStyle;
        else delete nextForCell.borderStyle;
        if (borderState.borderRadius !== null) nextForCell.borderRadius = borderState.borderRadius;
        else delete nextForCell.borderRadius;
        // 12 per-side override fields.
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
        // track recent borderColor (skip
        // when null = cleared). only push the
        // all-sides borderColor to recent; per-side colors are picked
        // via segmented control + same recent ring (the active side's
        // color is whichever 99.2.3.1 chose to write).
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
        emit('cell-style-change', {
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
        // track recent bg / text color.
        pushRecentCellStyleColor(hex);
        emit('cell-style-change', { rowId, colId, style: { [field]: hex } });
      }
      cancelCellStyleEditor();
    }

    /**
     * remove the current cell's style
     * override + emit `cell-style-change` with `null` + close popover.
     * clears ONLY the active tab's field.
     * If the other axis still has a value, the cell entry is
     * preserved with just the remaining field; if both fields would
     * be cleared, the cell entry is removed entirely (and the row
     * entry if it becomes empty).
     */
    function clearCellStyleForCurrentCell(): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const { rowId, colId, activeTab } = state;
      // font / border tabs clear their full
      // cluster atomically; bg/text tabs clear single field
      // (existing 99.2.1 behavior).
      // border-tab clear nulls ALL 4
      // all-sides + 12 per-side border fields (16 total) — same atomic
      // model as 99.2.3's 4-field clear, generalized.
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
      // All 21 axis field names — used for preserving non-cleared
      // fields in nextForCell + computing cellEntryEmpty.
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
      // read prevForRow / prevForCell via
      // the effective view; internal map write is gated below.
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
      // Emit one nulled field per cleared axis. Font tab emits 3
      // nulls; border tab emits 16 nulls (4 all-sides + 12 per-side);
      // bg/text tabs emit 1 null.
      const stylePayload: Partial<Record<keyof CellStyleEntry, string | null>> = {};
      for (const f of clearedFields) {
        stylePayload[f] = null;
      }
      emit('cell-style-change', { rowId, colId, style: stylePayload });
      cancelCellStyleEditor();
    }

    /**
     * given a new HSV, re-derive RGB + HEX
     * and patch the open-editor state. Single source of truth: HSV.
     * Called from HSV square drag, hue strip drag, and RGB-input
     * change handlers (which convert RGB→HSV first).
     */
    function setCellStyleEditorHsv(hsv: Hsv): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const rgb = hsvToRgb(hsv);
      const hex = rgbToHex(rgb);
      cellStyleEditorOpenRef.value = { ...state, hsv, hex };
    }

    /**
     * user typed into the HEX input. Parse;
     * if valid, derive RGB → HSV and patch state. Invalid input is
     * ignored (the input stays focused so user can fix).
     */
    function setCellStyleEditorHex(hex: string): void {
      const state = cellStyleEditorOpenRef.value;
      if (state == null) return;
      const rgb = hexToRgb(hex);
      if (rgb == null) return;
      const hsv = rgbToHsv(rgb);
      cellStyleEditorOpenRef.value = { ...state, hsv, hex: rgbToHex(rgb) };
    }

    /**
     * user changed one of the RGB number
     * inputs. Clamp to `[0, 255]` integer, re-derive HSV from the
     * full new RGB, and patch state.
     */
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
     * use it to order action panels / breadcrumbs).
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
      emit('selection-change', { selectedRowIds: next });
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
     */
    function applyPage(nextPage: number, nextPageSize: number): void {
      const currentPageValue = currentPageRef.value;
      const currentPageSizeValue = currentPageSizeRef.value;
      const pageChanged = nextPage !== currentPageValue;
      const pageSizeChanged = nextPageSize !== currentPageSizeValue;
      if (!pageChanged && !pageSizeChanged) return;
      currentPageRef.value = nextPage;
      currentPageSizeRef.value = nextPageSize;
      emit('page-change', { page: nextPage, pageSize: nextPageSize });
    }

    /**
     * Decision C.1: when an original filter/sort transition
     * fires, reset the page index to 0 so the user lands on the
     * first page of the freshly narrowed/reordered row set. No-op
     * when pagination is disabled (the page ref is meaningless) OR
     * when already on page 0. The pageSize is preserved.
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
     * `setEditingCellDraft(rawValue)` immediately.
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
      emit('cell-edit-start', { row, column, baseValue, draftValue });
    }

    /**
     * commit the in-flight edit. Fires `cell-value-change`
     * iff `draftValue !== baseValue` (dedup matches
     * applySelection no-op-transition rule); always fires
     * `cell-edit-stop {committed: true}`.
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
      // Decision C.1: coerce the editor's raw draft to
      // the column's typed value BEFORE emitting. Rejected coercion
      // (e.g. "abc" in a number column) aborts the commit — leaves
      // editingCellRef set so the <input> stays rendered with the
      // bad draft visible + fires cell-edit-stop {committed:false}
      // so consumers can render rejection feedback. The edit session
      // does NOT end — consumers disambiguate "rejected" vs "cancel"
      // by checking getEditingCell() immediately after the emit.
      const coerced = coerceEditDraftValue(column, current.draftValue);
      if (!coerced.ok) {
        emit('cell-edit-stop', {
          row,
          column,
          committed: false,
          finalValue: current.baseValue,
        });
        return;
      }
      // post-coerce validator gate. Runs
      // AFTER coerce succeeds; uses the typed value (not the raw
      // draft string). Locked execution order per Decision E.1 —
      // coerce-rejected short-circuits BEFORE this branch so a
      // throwing validator never sees an unparsable input.
      const validationError = runCellValidator({ value: coerced.value, row, column });
      if (validationError != null) {
        invalidCellsRef.value = new Map(invalidCellsRef.value).set(
          invalidCellKey(row.id, column.id),
          validationError,
        );
        emitInvalidCellsChange();
        emit('cell-edit-stop', {
          row,
          column,
          committed: false,
          finalValue: current.baseValue,
          validationError,
        });
        return;
      }
      // if a `validatorAsync` is configured,
      // park into the pending state + fire `cell-edit-validation-
      // pending`. Editor stays open; on promise resolve we either
      // continue the commit-success path or the validation-rejected
      // path. Race-discard: a new commit attempt before the prior
      // resolve discards the prior via `requestId` token check.
      if (column.validatorAsync != null) {
        const key = invalidCellKey(row.id, column.id);
        const requestId = nextAsyncValidationRequestId++;
        const draftValue = coerced.value;
        pendingAsyncValidationByKey.value = new Map(pendingAsyncValidationByKey.value).set(key, {
          requestId,
          draftValue,
        });
        // Clear any stale invalid marker from a prior sync attempt
        // (pending state supersedes invalid state for this cell).
        if (invalidCellsRef.value.has(key)) {
          const nextInvalid = new Map(invalidCellsRef.value);
          nextInvalid.delete(key);
          invalidCellsRef.value = nextInvalid;
          emitInvalidCellsChange();
        }
        emit('cell-edit-validation-pending', { row, column, draftValue });
        void runAsyncCellValidator({ value: draftValue, row, column }).then((asyncError) => {
          const currentPending = pendingAsyncValidationByKey.value.get(key);
          if (currentPending?.requestId !== requestId) return; // race-discard
          // Clear pending state regardless of outcome.
          const nextPending = new Map(pendingAsyncValidationByKey.value);
          nextPending.delete(key);
          pendingAsyncValidationByKey.value = nextPending;
          if (asyncError != null) {
            invalidCellsRef.value = new Map(invalidCellsRef.value).set(key, asyncError);
            emitInvalidCellsChange();
            emit('cell-edit-stop', {
              row,
              column,
              committed: false,
              finalValue: current.baseValue,
              validationError: asyncError,
            });
            return;
          }
          // Async-success path: finalise the commit as if
          // sync-validator had passed inline.
          editingCellRef.value = null;
          if (draftValue !== current.baseValue) {
            emit('cell-value-change', {
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
          // row-level validator pass on the post-commit row.
          const postCommitRow = synthesizePostCommitRow(row, [
            { colId: column.id, newValue: draftValue },
          ]);
          const invalidCellsChanged = reconcileRowValidationsForRow(postCommitRow);
          if (invalidCellsChanged) emitInvalidCellsChange();
          emit('cell-edit-stop', { row, column, committed: true, finalValue: draftValue });
        });
        return;
      }
      const finalValue = coerced.value;
      editingCellRef.value = null;
      // a successful commit clears any prior invalid-cell
      // marker for this rowId/colId (a stale rejection from an
      // earlier draft no longer reflects the cell's state).
      const key = invalidCellKey(row.id, column.id);
      let invalidCellsChanged = false;
      if (invalidCellsRef.value.has(key)) {
        const next = new Map(invalidCellsRef.value);
        next.delete(key);
        invalidCellsRef.value = next;
        invalidCellsChanged = true;
      }
      if (finalValue !== current.baseValue) {
        emit('cell-value-change', {
          row,
          column,
          oldValue: current.baseValue,
          newValue: finalValue,
        });
        // auto-record into mutation history.
        // No-op when `enableUndoHistory: false`.
        recordBatchInternal('cell-edit', [
          {
            rowId: row.id,
            colId: column.id,
            oldValue: current.baseValue,
            newValue: finalValue,
          },
        ]);
      }
      // row-level validator pass on the
      // synthesized post-commit row (emit-only persistence — props
      // haven't been written back yet, so chronix simulates the
      // mutation locally for validation).
      const postCommitRow = synthesizePostCommitRow(row, [
        { colId: column.id, newValue: finalValue },
      ]);
      if (reconcileRowValidationsForRow(postCommitRow)) invalidCellsChanged = true;
      if (invalidCellsChanged) emitInvalidCellsChange();
      emit('cell-edit-stop', { row, column, committed: true, finalValue });
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
      // Esc reverts the cell to baseValue,
      // which was previously valid by definition (you can't open an
      // edit on an already-invalid cell without first committing it).
      // Clear any pending validator-rejection marker for this cell.
      const key = invalidCellKey(row.id, column.id);
      let invalidCellsChanged = false;
      if (invalidCellsRef.value.has(key)) {
        const next = new Map(invalidCellsRef.value);
        next.delete(key);
        invalidCellsRef.value = next;
        invalidCellsChanged = true;
      }
      // cancel also discards any in-flight
      // async validation for this cell (race-token bump makes the
      // pending promise's resolve a no-op when it eventually fires).
      if (pendingAsyncValidationByKey.value.has(key)) {
        const nextPending = new Map(pendingAsyncValidationByKey.value);
        nextPending.delete(key);
        pendingAsyncValidationByKey.value = nextPending;
      }
      if (invalidCellsChanged) emitInvalidCellsChange();
      emit('cell-edit-stop', { row, column, committed: false, finalValue: current.baseValue });
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
     * for the same column. Fires `column-resize-start`.
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
      emit('column-resize-start', { column, baseWidth, draftWidth: baseWidth });
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
        emit('column-width-change', { column, oldWidth: baseWidth, newWidth: finalWidth });
      }
      emit('column-resize-stop', { column, committed: true, finalWidth });
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
      emit('column-resize-stop', { column, committed: false, finalWidth: baseWidth });
    }

    /**
     * snapshot the live `getBoundingClientRect()`
     * for every visible header cell in clientX coords. Excludes the
     * selection rail cell (it has no `data-col-id`). Returns an empty
     * Map when the wrapper isn't yet mounted (defensive — should
     * never happen during an active drag since the wrapper is the
     * pointer-event target).
     *
     * Called on every `pointermove` during an active column-move; the
     * cost is N (= number of visible columns ≤ ~20 in typical demos)
     * `getBoundingClientRect()` calls per move event which is well
     * within the 60Hz pointer-event budget. Caching across moves
     * would be incorrect if a column-resize transaction
     * mutates a column width DURING a move — but +
     * are mutually exclusive (resize is initiated on the 4px resizer
     * with `stopPropagation`, so a move can't start while a resize is
     * in flight; same the other way).
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
     * convert a clientX drop target into a
     * wrapper-relative pixel X for the drop-line render. Returns null
     * when wrapper isn't mounted (defensive).
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
      // 2px line straddles the boundary (offset -1 from the boundary
      // so the 2px-wide line is centered on it).
      const boundaryClientX = dropTarget.position === 'before' ? targetRect.left : targetRect.right;
      return boundaryClientX - wrapperLeft - 1;
    }

    /**
     * live snapshot of body row rects for
     * row-drag hit testing. Mirrors `getHeaderCellRectsLive` shape on
     * the Y-axis. Only body rows (not header / footer / filter-row)
     * are included via the `[data-row-id]` data attribute (consistent
     * with the rest of the SFC's body-only delegation pattern). The
     * Map's insertion order follows DOM order so iteration in
     * `getRowDropTarget` walks rows top-to-bottom — the natural search
     * order for "which row does this Y coordinate hit?".
     */
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

    /**
     * convert a clientY drop target into a wrapper-relative
     * pixel Y for the drop-line render. Returns null when wrapper
     * isn't mounted (defensive — same shape as
     * `resolveDropLineLeftPx`).
     */
    function resolveDropLineTopPx(
      dropTarget: RowDropTarget,
      rects: ReadonlyMap<string, RowRect>,
    ): number | null {
      const wrapper = wrapperRef.value;
      if (wrapper == null) return null;
      const targetRect = rects.get(dropTarget.targetRowId);
      if (targetRect == null) return null;
      const wrapperTop = wrapper.getBoundingClientRect().top;
      // 2px line straddles the boundary (offset -1 from the boundary
      // so the 2px-tall line is centered on it).
      const boundaryClientY = dropTarget.position === 'above' ? targetRect.top : targetRect.bottom;
      return boundaryClientY - wrapperTop - 1;
    }

    /**
     * build the Set of pinned row ids for `getRowDropTarget`
     * to skip. Pinned rows are NEITHER draggable NOR drop targets per
     * Decision D.1 — sticky-by-design .
     */
    function getPinnedRowIdsSet(): ReadonlySet<string> {
      const set = new Set<string>();
      for (const r of topPinnedRows.value) set.add(r.id);
      for (const r of bottomPinnedRows.value) set.add(r.id);
      return set;
    }

    /**
     * promote a pending column-move to an
     * active session. Fires `column-move-start`. Silent no-op when the
     * column doesn't exist or is `reorderable: false` (defensive —
     * the SFC's pointerdown handler already gates on `reorderable`
     * but the programmatic `startMovingColumn` handle method needs the
     * same gate).
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
      emit('column-move-start', { column, startClientX });
    }

    /**
     * recompute the drop target on every
     * pointermove during an active column-move. Uses
     * `getColumnDropTarget` against a live snapshot of header cell
     * rects. Reassigns `movingColumnRef` with a fresh object
     * (immutable mutation pattern matching `applyResizeDraft`). Fires
     * no emit — draft updates are internal-only; consumers observe
     * via the drop-indicator visual or by polling `getMovingColumn()`.
     */
    function applyMoveDraft(currentClientX: number): void {
      const current = movingColumnRef.value;
      if (current == null) return;
      const rects = getHeaderCellRectsLive();
      // build the pinned-zone map from
      // `visibleColumns` and pass it to `getColumnDropTarget`. The
      // helper skips any candidate cell whose zone differs from the
      // moved column's zone (treating cross-zone candidates the same
      // as `excludeColId` — `continue`). Cross-zone drags then resolve
      // to `null`, which renders no drop indicator + makes
      // `applyMoveCommit` a silent no-op (no `column-order-change`
      // emit). Closes parked cross-zone reorder item.
      const pinnedZoneByColId = new Map<string, 'left' | 'right' | null>();
      for (const c of visibleColumns.value) {
        pinnedZoneByColId.set(c.id, c.pinned ?? null);
      }
      const nextTarget = getColumnDropTarget(currentClientX, rects, current.colId, {
        pinnedZoneByColId,
      });
      const nextLeftPx = nextTarget != null ? resolveDropLineLeftPx(nextTarget, rects) : null;
      // Dedup: skip re-assign if the drop target + line position
      // didn't change (cheap pointer-move-spam guard mirroring
      // draftWidth dedup).
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
     * commit the in-flight move. Fires
     * `column-order-change` iff the drop target identifies a
     * meaningful reorder (target column not the moved column AND the
     * `computeColumnReorder` output differs from the current columns
     * array — same no-op-dedup posture as
     * `column-width-change`). Always fires
     * `column-move-stop {committed: true, dropTarget}`. Clears the
     * move state.
     */
    function applyMoveCommit(): void {
      const current = movingColumnRef.value;
      if (current == null) return;
      const movedColumn = columnTable.value.getById(current.colId);
      const dropTarget = current.dropTarget;
      movingColumnRef.value = null;
      if (movedColumn == null) return;
      let emittedReorder = false;
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
            emit('column-order-change', {
              movedColumn,
              targetColumn,
              position: dropTarget.position,
              oldColumnIds,
              newColumnIds,
            });
            emittedReorder = true;
          }
        }
      }
      // Even when no reorder happens, the stop event reports
      // committed: true with the final dropTarget snapshot so
      // consumers can distinguish "drag ended in a void" (committed:
      // true, dropTarget: null) from "drag was cancelled by Esc"
      // (committed: false). `emittedReorder` is only used to gate the
      // `column-order-change` emit above; the stop-emit fires
      // unconditionally below.
      void emittedReorder;
      emit('column-move-stop', { column: movedColumn, committed: true, dropTarget });
    }

    /**
     * cancel the in-flight move (no reorder).
     * Fires `column-move-stop {committed: false, dropTarget: null}`
     * only. No `column-order-change` emit.
     */
    function applyMoveCancel(): void {
      const current = movingColumnRef.value;
      if (current == null) return;
      const movedColumn = columnTable.value.getById(current.colId);
      movingColumnRef.value = null;
      if (movedColumn == null) return;
      emit('column-move-stop', { column: movedColumn, committed: false, dropTarget: null });
    }

    /**
     * row-drag transaction family. Mirrors the
     * column-move trio (`applyMoveStart` / `applyMoveDraft` /
     * `applyMoveCommit` / `applyMoveCancel`) on the Y-axis, with
     * pinned-row guard logic added per Decision D.1.
     */
    function findRowById(rowId: string): RowSpec | null {
      for (const r of props.rows) {
        if (r.id === rowId) return r;
      }
      return null;
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
      emit('row-move-start', { row, startClientY });
    }

    function applyRowMoveDraft(currentClientY: number): void {
      const current = movingRowRef.value;
      if (current == null) return;
      const rects = getBodyRowRectsLive();
      const pinnedRowIds = getPinnedRowIdsSet();
      const nextTarget = getRowDropTarget(currentClientY, rects, current.rowId, { pinnedRowIds });
      const nextTopPx = nextTarget != null ? resolveDropLineTopPx(nextTarget, rects) : null;
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
            emit('row-order-change', {
              movedRow,
              targetRow,
              position: dropTarget.position,
              oldRowIds,
              newRowIds,
            });
          }
        }
      }
      emit('row-move-stop', { row: movedRow, committed: true, dropTarget });
    }

    function applyRowMoveCancel(): void {
      const current = movingRowRef.value;
      if (current == null) return;
      const movedRow = findRowById(current.rowId);
      movingRowRef.value = null;
      if (movedRow == null) return;
      emit('row-move-stop', { row: movedRow, committed: false, dropTarget: null });
    }

    /**
     * row-drag pointer wiring. Grip-cell
     * `pointerdown` opens a pending session; pointermove past the
     * threshold promotes to active + fires `row-move-start`; further
     * pointermoves recompute the drop target; pointerup commits;
     * pointercancel / lostpointercapture cancel.
     *
     * Pointer-move + pointer-up + pointer-cancel handlers are attached
     * at the wrapper level so the drag tracking continues even if the
     * cursor leaves the grip cell (the common case during a drag).
     * `setPointerCapture` wraps in try/catch per B14.3 lesson
     * for synthesized-event resilience.
     */
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
          // happy-dom / synthesized events can throw InvalidPointerId.
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
        // Below threshold — silent no-op (no emits).
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

    // drag auto-scroll rAF loop. Started by
    // `onRowDragPointerMove` when a drag is active; runs until velocity
    // observed at the current cursorY drops to 0 OR drag ends. Reads
    // body's getBoundingClientRect() + cursorY + config to compute
    // per-frame scroll delta via `computeDragAutoScrollVelocity`. Each
    // frame also re-fires `applyRowMoveDraft(latestY)` so the drop-line
    // re-resolves against the new scroll position.
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

    // hidden Canvas for autosize text
    // measurement. Lazy-init on first use so non-browser contexts
    // (SSR / happy-dom without Canvas) don't pay the construction
    // cost up front. The canvas is intentionally NOT attached to the
    // DOM — Canvas's 2D context works without a DOM mount and we
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
     * supplied CSS font shorthand. Returns 0 when no Canvas 2D
     * context is available (e.g. happy-dom test env) — caller
     * (applyAutosize) treats 0-width measurements as "no signal" and
     * falls back to header-only sizing or to the minWidth clamp.
     */
    function measureCellTextWidth(text: string, font: string): number {
      const ctx = getAutosizeContext();
      if (ctx == null) return 0;
      ctx.font = font;
      return ctx.measureText(text).width;
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
      emit('column-width-change', { column, oldWidth: baseWidth, newWidth });
    }

    function applyAutosizeAll(): void {
      for (const cell of headerCells.value) {
        applyAutosize(cell.colId);
      }
    }

    // ─────────────────────── cell range selection ───────────────────────
    // 2-point {anchor, focus} state shape (Decision B.1) + pure
    // `computeCellRangeEnvelope` derivation. Drag-extend via pointer-
    // capture + document.elementFromPoint resolution (Decision C.1).
    // Opt-in via `cellRangeSelection: 'enabled'` prop (Decision A.1).

    // Canonical 2-point form. null = no active range.
    const cellRangeRef = ref<CellRange | null>(null);
    // True between pointerdown and pointerup of an active drag-extend
    // session. Gates the pointermove hit-test path so we don't
    // accidentally update focus on idle hover.
    const cellRangeDraggingRef = ref<boolean>(false);
    // Captured pointerId so pointermove handlers can match by id.
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

    /**
     * open a fresh cell-range session anchored on `cell`.
     * focus === anchor at start. Emits `cell-range-start`. Replaces
     * any active range (the drag-extend / shift+click extend logic
     * preserves anchor only WITHIN a session — a new pointerdown
     * always re-anchors).
     */
    function applyCellRangeStart(anchor: CellRef, jsEvent: PointerEvent | null): void {
      const next: CellRange = { anchor, focus: anchor };
      cellRangeRef.value = next;
      emit('cell-range-start', { range: next, jsEvent });
    }

    /**
     * extend the active range to a new focus. Emits
     * `cell-range-change` iff focus actually changes (no-op dedup
     * matches `column-width-change` dedup pattern).
     * Silent no-op when no range is active.
     */
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
      emit('cell-range-change', { range: next, envelope, jsEvent });
    }

    /**
     * commit the active range (pointerup / shift+click
     * end / programmatic close). Emits `cell-range-stop`. The range
     * STAYS in state — clearing requires `applyCellRangeClear`.
     */
    function applyCellRangeStop(jsEvent: PointerEvent | MouseEvent | null): void {
      const current = cellRangeRef.value;
      if (current == null) return;
      emit('cell-range-stop', {
        range: current,
        envelope: cellRangeEnvelope.value,
        jsEvent,
      });
    }

    /**
     * clear the active range. Emits `cell-range-stop` with
     * the last-known range envelope (so observers see the cleared
     * range one last time before state goes to null). No-op when no
     * range is active.
     */
    function applyCellRangeClear(): void {
      const current = cellRangeRef.value;
      if (current == null) return;
      const envelope = cellRangeEnvelope.value;
      cellRangeRef.value = null;
      emit('cell-range-stop', { range: current, envelope, jsEvent: null });
    }

    /**
     * per-cell pointerdown handler. Gated on
     * `cellRangeSelection === 'enabled'` + primary button +
     * non-selection-rail cell. Opens a new cell-range session +
     * setsPointerCapture for drag-extend.
     */
    function onCellPointerdown(rowId: string, colId: string, e: PointerEvent): void {
      if (props.cellRangeSelection !== 'enabled') return;
      if (e.button !== 0) return;
      // Skip selection-rail synthetic cells (no data-col-id reached or
      // synthetic select-all marker). checkbox cells use
      // data-row-id="__cx_select_all__" — also skip those.
      if (rowId === '__cx_select_all__') return;
      // Prevent the default text-selection drag that the browser would
      // otherwise initiate when the user drags across cells.
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

    /**
     * per-cell pointermove handler. During an active drag
     * (cellRangeDraggingRef.value === true + matching pointerId),
     * resolves the cell currently under the pointer via
     * `document.elementFromPoint` + walks data-row-id / data-col-id
     * ancestors. Updates focus when the resolved cell differs from
     * the current focus.
     */
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

    /**
     * per-cell pointerup handler. Commits the active range
     * (pointerup terminates the drag session; the range stays in
     * state until cleared). Resets the dragging flag + pointerId.
     */
    function onCellPointerup(e: PointerEvent): void {
      if (!cellRangeDraggingRef.value) return;
      if (cellRangePointerIdRef.value !== e.pointerId) return;
      cellRangeDraggingRef.value = false;
      cellRangePointerIdRef.value = null;
      applyCellRangeStop(e);
    }

    /**
     * per-cell pointercancel handler. Mirrors pointerup —
     * treat cancel as a commit (the user's last focus stays in
     * state). Avoids confusing "range disappears" UX if the system
     * sends a cancel for whatever reason.
     */
    function onCellPointercancel(e: PointerEvent): void {
      if (!cellRangeDraggingRef.value) return;
      if (cellRangePointerIdRef.value !== e.pointerId) return;
      cellRangeDraggingRef.value = false;
      cellRangePointerIdRef.value = null;
      applyCellRangeStop(e);
    }

    /**
     * per-cell click handler — specifically handles
     * shift+click extend. Plain clicks pass through to the existing
     * `onBodyContentClick` delegation (cell-click + row-selection +
     * cell-range re-anchor via the preceding pointerdown). Only the
     * SHIFT+CLICK path needs cell-level intervention because shift+
     * click extends focus from the EXISTING anchor without re-
     * anchoring; the body-content click delegation can't distinguish
     * "shift+click extends cell-range" from "shift+click extends row-
     * selection" without this peer handler.
     */
    function onCellShiftClick(rowId: string, colId: string, e: MouseEvent): void {
      if (props.cellRangeSelection !== 'enabled') return;
      if (!e.shiftKey) return;
      if (cellRangeRef.value == null) return;
      // Stop propagation so the body-content click delegation doesn't
      // ALSO process this as a plain cell-click + re-anchor.
      e.stopPropagation();
      applyCellRangeDraft({ rowId, colId }, e);
      applyCellRangeStop(e);
    }

    /**
     * shared TSV-synthesis + writeText + emit
     * path. Both the Ctrl+C keydown handler and the programmatic
     * `copyCellRangeToClipboard()` handle method route through here so
     * the same fail-soft + emit shape applies to both gestures.
     *
     * Returns `null` when there is no active range (or
     * `cellRangeSelection !== 'enabled'`), else the synthesized TSV
     * string. The `navigator.clipboard.writeText` failure path
     * (non-secure context / clipboard policy block) is swallowed via
     * try/catch — the emit still fires + the TSV is returned so
     * consumers retain the data for their own fallback path.
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
      emit('cell-range-copy', { envelope, text, jsEvent });
      return text;
    }

    /**
     * shared TSV-readText + parse + map + emit
     * path for clipboard paste. Both the Ctrl+V keydown handler and
     * the programmatic `pasteCellRangeFromClipboard()` handle method
     * route through here so the same fail-soft + emit shape applies
     * to both gestures.
     *
     * Returns `null` when there is no active range, OR
     * `cellRangeSelection !== 'enabled'`, OR the clipboard read
     * failed (returned `null` from `readText` due to non-secure
     * context / clipboard policy block). Otherwise returns the full
     * `mutations` array — the same array that's passed to the
     * `cell-range-paste` emit. Mutations array may be empty (paste
     * was all no-ops, or every cell rejected coercion) — emit STILL
     * fires so consumers can observe the gesture even when no
     * effective change occurred.
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
        // consumer's emit handler doesn't fire (no payload to
        // produce — we don't have the source TSV).
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
      emit('cell-range-paste', { envelope, mutations, text, jsEvent });
      // auto-record into mutation history.
      // No-op when `enableUndoHistory: false`.
      recordBatchInternal('cell-range-paste', mutations);
      // row-level validator pass on each
      // affected row's post-batch state (Decision E.1 step 6 + E.1
      // step 6 applied to paste). Mutations land via `cell-range-paste`
      // emit → consumer writes them back into `props.rows` → the
      // POST-COMMIT row is what rowValidators see on the next tick.
      // We DON'T run rowValidators on the pre-mutation row; consumers
      // hydrating from the emit need a microtask to settle, but the
      // ref-based reactive read on props.rows will pick up the mutated
      // row on the next render frame regardless. For test determinism
      // we re-read here and reconcile — empty path when consumer hasn't
      // written back yet (rowValidators see unchanged row → no change).
      runPostBatchRowValidations(mutations);
      return mutations;
    }

    /**
     * after a paste/drag-fill mutation batch
     * lands, run `rowValidators` against each affected row's
     * post-commit state. Mutations may have changed several columns
     * on the same row; dedupe by rowId and re-validate once per row.
     */
    function runPostBatchRowValidations(mutations: readonly PasteMutation[]): void {
      if ((props.rowValidators?.length ?? 0) === 0) return;
      // Group mutations by rowId so each row's full post-batch state
      // is composed before rowValidators run (multi-column paste on
      // one row should evaluate against ALL mutated columns at once).
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

    // drag-fill state. The drag-fill handle is
    // a small overlay at the bottom-right of the active cell-range
    // envelope; pointerdown on the handle starts a dedicated drag
    // session that's INDEPENDENT of the cell-range pointer flow (the
    // handle's pointerdown stops propagation so the cell beneath
    // doesn't also start a re-anchor session).
    //
    // - `dragFillSourceRef` captures the envelope at the moment the
    //   drag began. Stays stable across the entire drag so multiple
    //   pointermoves resolve against the same anchor.
    // - `dragFillEnvelopeRef` is the live preview envelope (axis-locked
    //   per Decision A.1). Drives the `cx-table-cell--in-fill-preview`
    //   class on cells in `fill \ source`.
    // - `dragFillPointerIdRef` matches pointermove/up events back to
    //   the original pointerdown (multi-pointer-safe).
    // - `dragFillDraggingRef` gates the pointermove path so idle hover
    //   doesn't update the preview.
    const dragFillSourceRef = ref<CellRangeEnvelope | null>(null);
    const dragFillEnvelopeRef = ref<CellRangeEnvelope | null>(null);
    const dragFillPointerIdRef = ref<number | null>(null);
    const dragFillDraggingRef = ref<boolean>(false);

    // Set of `"rowId/colId"` keys for cells in `fillEnvelope \ source`.
    // Drives the cell-render `cx-table-cell--in-fill-preview` class.
    // Empty when no drag-fill preview is active.
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
     * overlay. Captures the source envelope + sets dragging refs +
     * tries to call setPointerCapture (try/catch — happy-dom doesn't
     * implement it; falls through to `elementFromPoint` resolution).
     * `e.stopPropagation()` keeps the underlying cell's pointerdown
     * from firing (which would re-anchor the cell-range to the corner
     * cell — clobbering the drag-fill source).
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
      emit('cell-range-fill-start', { source, jsEvent: e });
    }

    /**
     * pointermove handler. Gated on the active drag + matching
     * pointerId. Resolves the cell under the pointer via
     * `document.elementFromPoint` → data-row-id / data-col-id ancestors,
     * then computes the new fill envelope via `computeDragFillEnvelope`.
     * Only emits `cell-range-fill-change` when the envelope identity
     * (rowIds + colIds) differs from the previous — avoids a stream of
     * no-op emits during pointer dwell on the same cell.
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
      emit('cell-range-fill-change', { source, fill: next, jsEvent: e });
    }

    /**
     * pointerup handler. Computes the final mutations array
     * via `computeDragFillMutations`, emits `cell-range-fill`, and
     * auto-extends the active `cellRangeRef` to cover the fill envelope
     * (so the post-drop selection visually matches the fill extent).
     * Auto-extension routes through `applyCellRangeStart` +
     * `applyCellRangeDraft` so the regular `cell-range-change` emit
     * fires alongside `cell-range-fill` — consumers observing the
     * standard cell-range lifecycle see the post-fill selection.
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
      // Auto-extend the active range to cover the fill envelope so the
      // post-drop selection visually matches the fill extent. Skip the
      // anchor/focus update when source === fill (no extension — pointer
      // never crossed the source boundary).
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
      emit('cell-range-fill', { source, fill, mutations, jsEvent: e });
      // auto-record into mutation history.
      // No-op when `enableUndoHistory: false`.
      recordBatchInternal('cell-range-fill', mutations);
      runPostBatchRowValidations(mutations);
    }

    /**
     * pointercancel symmetric to pointerup but DROPS the
     * mutations + does NOT emit. Cancel = "treat the drag as if it
     * never happened". The system-cancel path (window-blur,
     * lostpointercapture during a forced layout) shouldn't write
     * surprise mutations.
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
     * Computes the fill envelope + mutations identically to the
     * pointerup path, but with `jsEvent: null` for the emit payload.
     * Returns the mutations array OR `null` when the gate fails.
     */
    function performFillCellRange(targetCell: CellRef): readonly PasteMutation[] | null {
      if (props.cellRangeSelection !== 'enabled') return null;
      const source = cellRangeEnvelope.value;
      if (source.rowIds.length === 0 || source.colIds.length === 0) return null;
      const displayedRowIds = pagedRows.value.map((r) => r.id);
      const displayedColIds = visibleColumns.value.map((c) => c.id);
      const fill = computeDragFillEnvelope(source, targetCell, displayedRowIds, displayedColIds);
      if (sameEnvelope(source, fill)) {
        // Pointer inside/above-left → no preview, no commit. Returning
        // null instead of [] mirrors the cellRangeRef-null gate above
        // (consumer can distinguish "no active range" from "empty
        // fill — nothing to do").
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
      emit('cell-range-fill', { source, fill, mutations, jsEvent: null });
      // auto-record into mutation history.
      // No-op when `enableUndoHistory: false`.
      recordBatchInternal('cell-range-fill', mutations);
      runPostBatchRowValidations(mutations);
      return mutations;
    }

    // undo / redo mutation history state. Opt-
    // in via `enableUndoHistory: true` prop; when disabled, recording
    // is fully skipped + Ctrl+Z/Y body-keydown branches fall through
    // (so existing consumers see no behavior change).
    const mutationHistoryRef = ref<MutationHistoryState>(EMPTY_MUTATION_HISTORY);
    const nextMutationBatchIdRef = ref<number>(0);

    /**
     * monotonic batch-id factory. Format `'mb-{counter}'`
     * with counter incrementing per call. Stable across SFC instance
     * lifetime; consumers wanting cross-instance uniqueness can prefix
     * via the `recordMutationBatch` handle method.
     */
    function nextMutationBatchId(): string {
      const next = nextMutationBatchIdRef.value + 1;
      nextMutationBatchIdRef.value = next;
      return `mb-${next}`;
    }

    /**
     * shared append-and-emit-change helper. Gates on
     * `props.enableUndoHistory`; constructs a MutationBatch via
     * `appendMutationBatch` over the bounded `undoHistoryMaxDepth`;
     * fires `history-change` so consumer-side UI updates its disabled
     * state. Called from all 3 mutation emit sites (cell-edit / paste
     * / fill) AND from the public `recordMutationBatch` TableHandle
     * method.
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
      emit('history-change', { history: mutationHistoryRef.value });
    }

    /**
     * pop the newest `past` entry, fire `history-replay`
     * with the REVERSED batch, and move the original to `future`.
     * Returns `true` if a batch was undone, `false` on no-op.
     */
    function performUndo(jsEvent: KeyboardEvent | null): boolean {
      if (!props.enableUndoHistory) return false;
      const popped = popUndoBatch(mutationHistoryRef.value);
      if (popped == null) return false;
      mutationHistoryRef.value = popped.state;
      const reversed = reverseMutationBatch(popped.batch);
      emit('history-replay', { direction: 'undo', batch: reversed, jsEvent });
      emit('history-change', { history: mutationHistoryRef.value });
      return true;
    }

    /**
     * pop the newest `future` entry, fire `history-replay`
     * with the ORIGINAL batch, and move it back to `past`. Returns
     * `true` if a batch was redone, `false` on no-op.
     */
    function performRedo(jsEvent: KeyboardEvent | null): boolean {
      if (!props.enableUndoHistory) return false;
      const popped = popRedoBatch(mutationHistoryRef.value);
      if (popped == null) return false;
      mutationHistoryRef.value = popped.state;
      emit('history-replay', { direction: 'redo', batch: popped.batch, jsEvent });
      emit('history-change', { history: mutationHistoryRef.value });
      return true;
    }

    /**
     * body keydown handler. Gated on
     * `cellRangeSelection === 'enabled'` + Ctrl+C (Win/Linux) /
     * Cmd+C (macOS). Calls `e.preventDefault()` only when the gate
     * passes so other keystrokes (Tab navigation, native shortcut
     * keys outside our copy gesture) propagate normally.
     *
     * extended to also detect Ctrl+V / Cmd+V
     * for the paste gesture. Same gate (cellRangeSelection +
     * non-empty envelope); same `e.preventDefault()` discipline.
     *
     * extended to also detect Ctrl+Z / Cmd+Z
     * (undo) + Ctrl+Y / Ctrl+Shift+Z / Cmd+Shift+Z (redo). The undo /
     * redo branches gate on `enableUndoHistory` (independent of
     * `cellRangeSelection`) so consumers can use the history without
     * enabling cell-range selection. Non-applicable keystrokes
     * propagate normally — only intercepted when the gate AND the
     * history state allow the action.
     */
    function onBodyKeydown(e: KeyboardEvent): void {
      const modifier = e.ctrlKey || e.metaKey;
      // cell-level keyboard navigation. Gated
      // on `enableKeyboardNavigation` + editor NOT active (editor input
      // intercepts keys to move text cursor instead). Handles non-
      // modifier keys (arrow / Home / End / PageUp / PageDown / Enter /
      // F2 / Escape) AND modifier-prefixed corner jumps (Ctrl+Home /
      // Ctrl+End). Modifier-prefixed Ctrl+C / Ctrl+V / Ctrl+Z / Ctrl+Y
      // remain handled in the cell-range + undo/redo branches below;
      // because nav-key returns early on `return`, modifier branches
      // are reachable only when the key DIDN'T match a nav key.
      if (props.enableKeyboardNavigation && editingCellRef.value == null) {
        const navKey = e.key;
        // tree-data expand/collapse shortcuts.
        // Decision N.1 — Enter / Space toggle when active row has
        // children; ArrowRight expands collapsed parent; ArrowLeft
        // collapses expanded parent, or jumps to parent row when
        // collapsed + has parent. Branch runs ONLY when activeCell is
        // in the tree column AND tree data is active. Falls through
        // to the existing nav logic when conditions aren't met.
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
          // Ctrl+Arrow short-circuits to a data-
          // region boundary jump (Decisions B.1 + D.1). Only applies for
          // the 4 arrow directions; Ctrl+Home / Ctrl+End / PageUp / Down
          // continue via the existing `computeNextActiveCell` path
          // because `navDirection` for those is 'table-start' /
          // 'table-end' / 'page-up' / 'page-down', not 'up' / 'down' /
          // 'left' / 'right'.
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
            // shift+arrow extends cell-range
            // from the activeCell anchor (Decision A.1). Plain arrow
            // with an active range collapses the range before moving
            // (Decision B.1). Both branches still fire activeCell-
            // change + auto-scroll afterwards (path).
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
        // Enter / F2 begin edit on active cell (when editable).
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
        // Escape clears active cell. (Decision C.1): also
        // clears any active cell-range. Either non-null state triggers
        // the branch; both get cleared together for a consistent
        // "Escape resets selection" gesture.
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
      // Prevent the browser's default copy/paste (which would target
      // whatever native text-selection or focused-input overlap
      // exists — usually nothing meaningful since cell-range gestures
      // call `e.preventDefault()` on pointerdown to suppress text
      // selection in the first place).
      e.preventDefault();
      if (isCopyKey) {
        void performCellRangeCopy(e);
      } else {
        void performCellRangePaste(e);
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
     *   display order (`pagedRows`). When no anchor is established,
     *   shift+click degenerates to a plain click.
     *
     * Returns the next selection array; the caller compares with the
     * current via `applySelection` to dedup.
     */
    function nextSelectionForClick(
      rowId: string,
      mode: 'none' | 'single' | 'multi',
      modifierActive: boolean,
      shiftActive: boolean,
    ): readonly string[] {
      const current = selectedRowIds.value;
      if (mode === 'none') return current;

      // shift+click range in multi mode. Range computation
      // operates on `pagedRows` (the post-filter + post-sort + post-
      // page slice) so range NEVER spans rows that are not currently
      // visible to the user. When no anchor is set (first interaction
      // on a fresh page), fall through to plain-click branch.
      if (mode === 'multi' && shiftActive && selectionAnchorRef.value != null) {
        const displayedIds = pagedRows.value.map((r) => r.id);
        const range = computeRangeRowIds(selectionAnchorRef.value, rowId, displayedIds);
        // shift+click range does NOT cascade
        // through tree descendants (per design — range is a flat
        // "rows between A and B" gesture; cascade applies to direct
        // parent-toggle clicks only).
        if (range.length > 0) return range;
        // Defensive: range was empty (stale anchor — e.g., anchor row
        // was filtered out after the anchor was set). Fall through to
        // plain-click semantics so the new click re-establishes anchor
        // implicitly.
      }

      if (mode === 'multi' && modifierActive) {
        const idx = current.indexOf(rowId);
        if (idx >= 0) {
          // Toggle off: remove rowId AND any descendants (
          // cascade per Decision B.1).
          return cascadeRemoveDescendantIds(
            [...current.slice(0, idx), ...current.slice(idx + 1)],
            rowId,
          );
        }
        // Toggle on: append rowId + descendants at end of insertion order.
        return cascadeAddDescendantIds(current, rowId);
      }
      // Plain click in 'single' or 'multi' mode → replace with rowId.
      // Special case: clicking the ONLY selected row deselects.
      if (current.length === 1 && current[0] === rowId) {
        return [];
      }
      // plain-click in multi mode also
      // cascades descendants — clicking a parent row selects the
      // whole subtree. In 'single' mode the replacement is a single
      // row, but if that row has descendants we still cascade
      // descendants in (matches "select the whole group" UX).
      return cascadeAddDescendantIds([rowId], rowId);
    }

    /**
     * add `parentRowId` + all its
     * descendants to the existing selection list. Descendants are
     * computed against the consumer's tree-shaped `props.rows` so
     * cascade applies regardless of expand state (Decision A.1).
     * Identity-preserving when the row is a leaf (no descendants) —
     * just appends the parent ID itself if not already present.
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

    /**
     * remove `parentRowId` + all its
     * descendants from the existing selection list. Identity-
     * preserving when the parent is a leaf.
     */
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
     * (same code path as shift+click on a row body).
     */
    function nextSelectionForCheckboxClick(rowId: string, shiftActive: boolean): readonly string[] {
      const current = selectedRowIds.value;

      // Shift+click range path (multi-only — but checkbox is by
      // definition multi). range does NOT cascade
      // through tree descendants (per design — range is a flat
      // gesture; cascade applies to direct parent-toggle clicks).
      if (shiftActive && selectionAnchorRef.value != null) {
        const displayedIds = pagedRows.value.map((r) => r.id);
        const range = computeRangeRowIds(selectionAnchorRef.value, rowId, displayedIds);
        if (range.length > 0) return range;
      }

      // checkbox toggle cascades descendants
      // (Decision A.1 + B.1). When the row is in the set, remove it
      // AND all descendants; otherwise add it AND all descendants.
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
     * header "select-all" checkbox click handler. Three
     * possible states are computed on the currently-displayed row set
     * (`pagedRows`, i.e., post-filter + post-sort + post-page):
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
     * a point-anchor action).
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
     * emit-only column-visibility-change helper.
     * Honors the "at least one column visible" guard per Decision C.1
     * — refuses to hide the LAST currently-visible column (no-op + no
     * emit). De-duplicates no-op transitions (current `hide` already
     * matches the requested value → no emit). All UI checkbox handlers
     * + the 2 programmatic TableHandle methods + the show-all / hide-
     * all action handlers route through this helper so the C.1 guard +
     * the emit-only contract apply uniformly.
     */
    /**
     * pinned-zone-aware auto-scroll to bring
     * the given cell into the body viewport. Reads the body element's
     * current scroll position + the cell's resolved Y / X via the
     * already-computed `rowYByRowId` + cumulative `widthByColId` sum.
     * Skips horizontal axis when the cell's column is in a pinned
     * zone (those cells are sticky-positioned + always visible
     * regardless of scrollLeft). Gated by callers — runs only when
     * `enableKeyboardAutoScroll` is true AND the caller opted in via
     * the `autoScroll` arg to `applyActiveCellChange`.
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
      // Pinned column → permanently visible via sticky positioning;
      // do not move scrollLeft for it.
      const newScrollLeft = isPinned ? bodyEl.scrollLeft : next.scrollLeft;
      if (bodyEl.scrollTop !== next.scrollTop) bodyEl.scrollTop = next.scrollTop;
      if (bodyEl.scrollLeft !== newScrollLeft) bodyEl.scrollLeft = newScrollLeft;
    }

    /**
     * emit-only active-cell-change helper.
     * Dedupes no-op transitions (same row + same col). Writes the
     * internal `activeCellRef` BEFORE firing the emit so handle reads
     * via `getActiveCell()` synchronously after the emit see the new
     * value (matches the setSort pattern). Pass `null` for
     * `cell` to clear; the emit fires with `rowId: null, colId: null`.
     *
     * extended with optional `autoScroll`
     * opt (default `false`). When `true` AND the new cell is non-null
     * AND `enableKeyboardAutoScroll` is on, runs `runAutoScrollToCell`
     * after the emit. The keyboard handler + programmatic
     * `setActiveCell` pass `true`; the click handler + `clearActiveCell`
     * keep the default `false` (Decision A.1).
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
      emit('active-cell-change', {
        rowId: cell?.rowId ?? null,
        colId: cell?.colId ?? null,
        jsEvent,
      });
      if (opts?.autoScroll === true && cell != null && props.enableKeyboardAutoScroll) {
        runAutoScrollToCell(cell);
      }
      // produce the live-region announce text
      // for keyboard-driven transitions (Decision B.2: keyboard-only;
      // click-driven activeCell writes skip the announce). The pure
      // helper handles unicode + null + valueFormatter cascade. The
      // consumer prop override (announceActiveCellText) takes
      // precedence over the default helper.
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
          // +2: 1 (header row = aria-rowindex 1) + 1 (convert 0-based
          // page-local index to 1-based aria-rowindex).
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
     * tree-data keyboard handler (Decision N.1).
     * Returns `true` when the keystroke was consumed (caller short-
     * circuits before falling through to nav-direction handling) or
     * `false` to let the existing nav logic run.
     *
     * Triggers only when activeCell is in the tree column. The handled
     * cases:
     *
     * - `Enter` / `Space` + row has children → toggle expand state +
     *   consume. Enter takes precedence over edit-start when
     *   the active row is a parent; leaf rows (no children) keep
     *   Enter-to-edit behavior + this handler returns false.
     * - `ArrowRight` + row collapsed + has children → expand + consume.
     *   When row is already expanded OR has no children, return false
     *   so the existing nav moves activeCell one column right.
     * - `ArrowLeft` + row expanded → collapse + consume.
     * - `ArrowLeft` + row collapsed (or leaf) + has parent → move
     *   activeCell to parent row's tree column cell + consume.
     *   Top-level row + ArrowLeft → return false (existing nav runs).
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
      // Resolve the active row from the flat tree-aware list so depth
      // + groupKey + children are populated.
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
        // Collapsed (or leaf) with a parent → jump to parent's tree cell.
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
        // Decision C.1 guard: refuse to hide the LAST currently-visible
        // column. Counts the columns that would remain visible after
        // applying this hide; refuses when the count drops to 0.
        const remainingVisible = props.columns.reduce<number>((sum, c) => {
          if (c.id === colId) return sum;
          return c.hide === true ? sum : sum + 1;
        }, 0);
        if (remainingVisible === 0) return;
      }
      emit('column-visibility-change', { column: col, hidden, jsEvent });
    }

    /**
     * "全部显示" — iterate the columns and fire
     * `column-visibility-change` for each previously-hidden column.
     * Consumer's handler rebuilds the columns prop; one emit per
     * column keeps the emit shape uniform per Decision A.1 (batched
     * payload is parked per Out-of-scope). Skips already-visible
     * columns so the consumer's batch rebuild only sees real
     * transitions.
     */
    function applyShowAllColumns(jsEvent: Event | null): void {
      for (const col of props.columns) {
        if (col.hide === true) {
          emit('column-visibility-change', { column: col, hidden: false, jsEvent });
        }
      }
    }

    /**
     * "全部隐藏" — iterate the columns and fire
     * `column-visibility-change` for each currently-visible column
     * EXCEPT the FIRST visible column (which stays visible per
     * Decision C.1 to keep virtualRowsPass + body render assumptions
     * intact). One emit per actually-hidden column.
     */
    function applyHideAllColumns(jsEvent: Event | null): void {
      let firstVisibleSkipped = false;
      for (const col of props.columns) {
        if (col.hide === true) continue;
        if (!firstVisibleSkipped) {
          firstVisibleSkipped = true;
          continue;
        }
        emit('column-visibility-change', { column: col, hidden: true, jsEvent });
      }
    }

    function onColumnMenuButtonClick(): void {
      columnMenuOpen.value = !columnMenuOpen.value;
    }

    function onColumnCheckboxChange(colId: string, event: Event): void {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      // Checkbox is checked = column visible; hidden is the inverse.
      applyColumnVisibilityChange(colId, !target.checked, event);
    }

    function onShowAllColumnsClick(event: Event): void {
      applyShowAllColumns(event);
    }

    function onHideAllColumnsClick(event: Event): void {
      applyHideAllColumns(event);
    }

    /**
     * document-level pointerdown listener — closes the popover
     * when the user clicks outside the button + popover. Registered on
     * mount, cleaned up on unmount. Uses `pointerdown` (not `click`) so
     * the popover closes BEFORE the body's own click handlers see the
     * event (matches Notion / Linear menu UX). Capturing phase is NOT
     * needed — bubbling is sufficient because we test ancestry.
     */
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

    /**
     * Escape inside the popover closes it. Body-scoped
     * keydown rather than document-scoped so we don't accidentally
     * swallow Escape elsewhere.
     */
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
        // next shift+click reads a meaningful anchor instead of
        // null. Matches the "anchor follows the latest intentional
        // action" rule.
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
        // → 0. serverSide+paginationEnabled
        // reads the clamped current page from the session-derived
        // computed (pagePass is in passthrough state).
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
        // Decision B.1: serverSide+paginationEnabled
        // bypasses pagePass — read totals from the session directly.
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
        // Programmatic-start path: no pointer position, no pointerId.
        // Use 0 for startX (subsequent draft updates from consumers
        // would need to compute their own delta). pointerId -1 so
        // the SFC's onPointermove handlers (which gate on
        // matching pointerId) treat the session as already
        // pointer-detached — consumers driving programmatic
        // resizes call setResizingColumnDraft (not yet exposed)
        // or commit/cancel directly without going through pointer
        // events.
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
        // Programmatic-start path: no pointer position, no pointerId.
        // Use 0 for startClientX (consumers driving programmatic
        // moves call commitColumnMove(target, position) directly
        // rather than feeding draft updates). pointerId -1 so the
        // SFC's onPointermove handlers (gated on matching pointerId)
        // treat the session as pointer-detached. Mirrors
        // startResizingColumn(...) pattern.
        applyMoveStart(colId, 0, -1);
      },
      commitColumnMove(targetColId: string, position: 'before' | 'after'): void {
        const current = movingColumnRef.value;
        if (current == null) return;
        // Patch the drop target then commit. Reuses applyMoveCommit's
        // computeColumnReorder + emit pipeline so the programmatic
        // path and the pointer-driven path share the same no-op-dedup
        // semantic.
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
        // Patch the drop target then commit. Mirrors
        // programmatic-commitColumnMove pattern (no need to recompute
        // dropLineTopPx since commit doesn't read it).
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
        emit('history-change', { history: mutationHistoryRef.value });
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
        emit('history-change', { history: mutationHistoryRef.value });
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
        // resolve row set per `rowSource`.
        const rowSource = options?.rowSource ?? 'filtered';
        let rowsToExport: readonly RowSpec[];
        switch (rowSource) {
          case 'all':
            rowsToExport = props.rows;
            break;
          case 'visible':
            // Current page slice + top/bottom pinned rows.
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
        // resolve column subset.
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
        // Browser download via Blob + anchor click. Documented side-
        // effect; non-browser environments should call exportToCsv pure
        // helper directly per Decision A.1.
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
      async exportToXlsxMultiSheet(
        filename: string,
        sheets: readonly AdapterXlsxSheetSpec[],
      ): Promise<void> {
        // resolve each per-sheet spec into a
        // SingleSheetExportToXlsxInput, then dispatch the union shape
        // to the pure core helper for a single multi-sheet workbook.
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
        // reconcile against the current columns prop, then
        // dispatch each field to its corresponding setter. The
        // `columns-change` emit fires once with the reconciled array
        // so the consumer's prop-rebuild is a single transaction
        // (Decision F.1). For an unknown / foreign `version`, the
        // pure helper returns the current state unchanged + no emit
        // fires.
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
          emit('columns-change', { columns: result.columns, reason: 'apply-view' });
        }
      },
      async exportToXlsx(
        filename: string,
        options?: TableHandleExportToXlsxOptions,
      ): Promise<void> {
        // row-source + column-subset resolution
        // mirrors exportToCsv wrapper.
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
    };
    expose(handle);

    onMounted(() => {
      emit('table-ready', handle);
      // register the document-level outside-
      // click listener for the column-visibility-menu popover. Done at
      // mount so a programmatic open via consumer code (e.g. when the
      // menu is the only initial UI affordance) responds to outside
      // clicks even before the user clicks the button.
      document.addEventListener('pointerdown', onDocumentPointerdown);
    });

    onBeforeUnmount(() => {
      // paired cleanup for the document-level listener.
      document.removeEventListener('pointerdown', onDocumentPointerdown);
      // tear down the server-side row-source
      // session — aborts in-flight `getRows` + clears the block cache.
      tearDownServerSideSession();
      // -C (2026-05-30): disconnect the row-auto-height
      // ResizeObserver. Per-row unobserve already fired via
      // onVnodeBeforeUnmount during the unmount cascade; `disconnect`
      // is a final safety net.
      if (rowAutoHeightObserver != null) {
        rowAutoHeightObserver.disconnect();
        rowAutoHeightObserver = null;
      }
      // cancel any in-flight drag auto-scroll rAF.
      cancelAutoScrollLoop();
    });

    /**
     * walk up from `event.target` to find the closest
     * ancestor that carries a `data-row-id` / `data-col-id`
     * attribute. Returns null if the click landed in body padding
     * or outside any row.
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
        emit('empty-area-click', { jsEvent });
        return;
      }
      const row = rowDataSource.value.getById(rowId);
      if (!row) return;
      // row-click fires for every body click within a row.
      emit('row-click', { row, jsEvent });
      // apply OS-conventional selection semantics.
      // The selection update happens BEFORE cell-click emit so that
      // observers reading getSelectedRowIds() in a cell-click handler
      // see the post-click state.
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
      emit('cell-click', { row, column, value, jsEvent });
      // clicking a body cell ALSO writes the
      // keyboard-navigation active cell so subsequent arrow-key
      // presses move from the clicked cell. Gated on the prop so
      // consumers who don't use kb-nav avoid the extra emit overhead.
      if (props.enableKeyboardNavigation) {
        applyActiveCellChange({ rowId, colId }, jsEvent);
      }
    }

    /**
     * per-row checkbox click handler. Wired directly on
     * each checkbox's `onClick` (not delegated, because the click
     * target is well-known + we want stopPropagation to suppress
     * body-row-click bubbling that would otherwise overwrite the
     * checkbox-toggle result).
     */
    function onSelectionCheckboxClick(rowId: string, jsEvent: MouseEvent): void {
      jsEvent.stopPropagation();
      const shiftActive = jsEvent.shiftKey;
      const next = nextSelectionForCheckboxClick(rowId, shiftActive);
      applySelection(next);
      setAnchorIfNotShift(rowId, shiftActive);
    }

    /**
     * header "select-all" checkbox click handler.
     */
    function onSelectAllCheckboxClick(jsEvent: MouseEvent): void {
      jsEvent.stopPropagation();
      const next = nextSelectionForSelectAllClick();
      applySelection(next);
    }

    /**
     * symmetric to `onBodyContentClick` for double-click
     * events. Browsers emit `dblclick` independently of `click`
     * (both fire on a double click; the SFC delegates each).
     * Always emits `row-dblclick` when the dblclick lands on a row;
     * additionally emits `cell-dblclick` when the colId resolves.
     * Empty-area dblclicks are silently ignored (consumers usually
     * only care about row/cell dblclick; can extend later).
     */
    function onBodyContentDblclick(jsEvent: MouseEvent): void {
      const rowId = closestAttr(jsEvent.target, 'data-row-id');
      if (rowId == null) return;
      const row = rowDataSource.value.getById(rowId);
      if (!row) return;
      emit('row-dblclick', { row, jsEvent });
      const colId = closestAttr(jsEvent.target, 'data-col-id');
      if (colId == null) return;
      const column = columnTable.value.getById(colId);
      if (!column) return;
      const value = getCellValue({ row, column });
      emit('cell-dblclick', { row, column, value, jsEvent });
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
     * also cycles the internal sort state when
     * the clicked column is sortable. Cycle is `null → asc → desc →
     * null`; clicking a different sortable column resets to `asc` for
     * that column. Non-sortable columns are click-no-op for sort
     * (header-click still emits — consumers may use it for other UI).
     */
    function onHeaderClick(jsEvent: MouseEvent): void {
      // the same delegated handler also walks
      // up for `[data-group-name]` ancestors so the group row's
      // labelled cells emit `header-group-click`. Group cells do NOT
      // carry `data-col-id`, so the leaf-cell branch below is a clean
      // skip when the click lands on a group cell — no double-emit.
      const groupName = closestAttr(jsEvent.target, 'data-group-name');
      if (groupName != null) {
        const colIdsAttr = closestAttr(jsEvent.target, 'data-col-ids');
        const colIds: readonly string[] =
          typeof colIdsAttr === 'string' && colIdsAttr.length > 0 ? colIdsAttr.split(',') : [];
        emit('header-group-click', { groupName, colIds, jsEvent });
        return;
      }
      const colId = closestAttr(jsEvent.target, 'data-col-id');
      if (colId == null) return;
      const column = columnTable.value.getById(colId);
      if (!column) return;
      emit('header-click', { column, jsEvent });
      if (column.sortable === false) return;
      const current = sortSpec.value;
      // shift+click composes (Excel-style multi-column);
      // plain click resets to single-column mode with the cycle from
      // .
      const next: readonly SortSpec[] = jsEvent.shiftKey
        ? cycleMultiColumnSort(current, colId)
        : cycleSingleColumnSort(current, colId);
      applySort(next);
    }

    /**
     * plain-click single-column cycle. Replaces the entire
     * sort array; for the clicked column, walks `null → asc → desc →
     * null`. If the array currently holds another column (or has
     * length > 1), a plain click always RESETS to single-column with
     * the clicked column at `asc`.
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
     * existing array (and the priorities of other columns).
     *
     * - Column absent from array → append `{colId, direction:'asc'}`.
     * - Column present as `'asc'` → flip in place to `'desc'`.
     * - Column present as `'desc'` → remove that entry (others keep order).
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
      // entry.direction === 'desc' → remove it.
      return [...current.slice(0, idx), ...current.slice(idx + 1)];
    }

    function onBodyContentPointerover(jsEvent: PointerEvent): void {
      if (sameRow(jsEvent.target, jsEvent.relatedTarget)) return;
      const rowId = closestAttr(jsEvent.target, 'data-row-id');
      if (rowId == null) return;
      const row = rowDataSource.value.getById(rowId);
      if (!row) return;
      emit('row-mouseenter', { row, jsEvent });
    }

    function onBodyContentPointerout(jsEvent: PointerEvent): void {
      if (sameRow(jsEvent.target, jsEvent.relatedTarget)) return;
      const rowId = closestAttr(jsEvent.target, 'data-row-id');
      if (rowId == null) return;
      const row = rowDataSource.value.getById(rowId);
      if (!row) return;
      emit('row-mouseleave', { row, jsEvent });
    }

    // cell-tooltip handlers. Pointermove on the
    // body-content layer detects the hovered cell; the timer fires after
    // `mergedTheme.value.tooltipDelayMs` (default 400ms) and resolves the
    // tooltip text via `resolveCellTooltip`. Pointermove between cells
    // restarts the timer; pointerleave / scroll / edit-start / range-
    // drag-start cancel it entirely. Suppressed entirely while an edit
    // session is active OR a cell-range pointer drag is in flight (per
    // Decision E.1).
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
      // Suppress entirely during edit / range drag — Decision E.1.
      if (editingCellRef.value != null) return;
      if (cellRangeRef.value != null) return;
      const wrapperEl = wrapperRef.value;
      if (wrapperEl == null) return;
      const wrapperRect = wrapperEl.getBoundingClientRect();
      // Wrapper-relative coordinates so the popover anchors to the
      // `position: relative` wrapper.
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
      // Same-cell hover (continuous pointer movement inside the same
      // cell) — keep timer alive without restarting.
      const pending = tooltipPendingCellRef.value;
      const active = tooltipActiveRef.value;
      if (active?.rowId === rowId && active.colId === colId) return;
      if (pending?.rowId === rowId && pending.colId === colId) return;
      // New cell — restart timer + clear any active popover.
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
      const activeSort = sortSpec.value;
      // + + virtualRowsPass returns the
      // windowed subset; the pre-mount frame (bodyClientHeight === 0)
      // yields an empty visibleRows array — fall back to `pagedRows`
      // so the first paint reflects the current sort + page slice.
      // `pagedRows` is identity-equal to `sortedRows` when pagination
      // is disabled (pagePass passthrough), preserving the
      // fallback semantic for non-paginated tables.
      const rowsToRender = bodyClientHeight.value > 0 ? visibleRows.value : pagedRows.value;

      // selection-column config + derived total row width.
      // When `selectionColumn.show: true`, every row carries an extra
      // <div class="cx-table-selection-cell{-body|-header}"> on the
      // configured side; row width grows by `selectionColumnWidth`.
      // `selectAllState` is computed once per render to drive the
      // header checkbox's checked/indeterminate property.
      const selectionColShow = props.selectionColumn.show;
      const selectionColSide = props.selectionColumn.side;
      const selectionColWidth = t.selectionColumnWidth;
      const totalWithSelection = selectionColShow ? total + selectionColWidth : total;
      // row-drag rail width is a fixed 30px in
      // v1. Promote to a theme token in a follow-up phase if consumer
      // demand surfaces. Rail render gated on
      // `props.rowDragColumn.show`.
      const rowDragColumnShow = props.rowDragColumn.show;
      const rowDragColumnSide = props.rowDragColumn.side ?? 'left';
      const rowDragColumnWidth = 30;
      const totalWithRowDrag = rowDragColumnShow
        ? totalWithSelection + rowDragColumnWidth
        : totalWithSelection;
      // mutual-exclusivity warn — when
      // `rowDragColumn.show: true` AND any column has `rowDragHandle:
      // true`, the dedicated sticky rail wins and the per-column flag
      // is ignored. Warn once per mount (Decision A.1).
      const anyColHasRowDragHandle = visible.some((c) => c.rowDragHandle === true);
      if (rowDragColumnShow && anyColHasRowDragHandle && warnedRowDragMixedRef.value !== true) {
        warnedRowDragMixedRef.value = true;
        console.warn(
          'chronix-table: rowDragColumn.show is true; ColumnSpec.rowDragHandle flags are ignored.',
        );
      }
      const displayedRowIds: readonly string[] = pagedRows.value.map((r) => r.id);

      // pre-compute aria-rowindex / aria-colindex
      // lookups once per render. Body row aria-rowindex uses pagedRows
      // position (NOT rowsToRender) per Decision B.1 for
      // virtualization-correctness. Selection column aria-colindex
      // follows visual order per Decision A.1.
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
        // +2: 1 (header at rowindex 1) + 1 (1-based) + topPinnedRows.length offset
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

      // pinned-column metadata for the current
      // render frame. The pass result is the source of truth for per-
      // cell sticky-offset application across header / filter / body /
      // selection-rail render paths. Reading once per render avoids the
      // reactive-overhead of dereferencing `.value` inside per-cell
      // loops.
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
       * helper: returns the per-cell sticky-positioning
       * style additions for a column. Returns an empty record for
       * center columns so spreading into the existing cell `style`
       * object is a no-op. The render code applies the matching
       * modifier classes (`--pinned-left` / `--pinned-right` /
       * `--pinned-left-last` / `--pinned-right-first`) separately so
       * CSS can hook on them without re-reading inline style.
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
       * helper: returns the per-cell zone modifier class
       * suffixes. Used by header / filter / body / by composing with
       * the base class prefix (`cx-table-cell` / `cx-table-header-cell`
       * / `cx-table-filter-cell`). Returns an empty array for center
       * columns. The `--last` / `--first` modifier identifies the
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
      const selectionRailSide: 'left' | 'right' = selectionColSide;
      const selectionRailStickyStyle: Record<string, string> = selectionColShow
        ? selectionRailSide === 'left'
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

      // row-drag rail sticky style — mirrors the selection rail but
      // sits one z-layer BELOW so the selection rail wins on overlap.
      // Applied to the row-drag placeholder cells rendered in the
      // header / header-group / filter / footer rows; the body row
      // uses `buildRowDragGripCell` which carries its own copy.
      const rowDragRailStickyStyle: Record<string, string> = rowDragColumnShow
        ? rowDragColumnSide === 'left'
          ? {
              position: 'sticky',
              left: '0px',
              zIndex: '2',
              background: 'var(--cx-table-row-drag-rail-bg, #f8fafc)',
            }
          : {
              position: 'sticky',
              right: '0px',
              zIndex: '2',
              background: 'var(--cx-table-row-drag-rail-bg, #f8fafc)',
            }
        : {};

      function buildHeaderRowDragCell(): VNode {
        // Empty placeholder reserving the row-drag rail's width in the
        // header row so the header's column boundaries line up with the
        // body's (the body renders the actual grip here).
        return h('div', {
          key: 'header-row-drag',
          class: 'cx-table-header-cell cx-table-row-drag-cell',
          role: 'columnheader',
          'data-col-id': '__cx_row_drag__',
          style: {
            width: `${rowDragColumnWidth}px`,
            height: `${t.headerHeight}px`,
            ...rowDragRailStickyStyle,
          },
        });
      }

      function buildHeaderSelectionCell(): VNode {
        // The header checkbox needs `indeterminate` set via the DOM
        // property (no HTML attribute equivalent). The Vue render
        // function uses an inline ref callback on the input.
        return h(
          'div',
          {
            key: 'header-selection',
            class: 'cx-table-header-cell cx-table-selection-cell',
            role: 'columnheader',
            'data-col-id': '__cx_selection__',
            'aria-colindex': String(selectionAriaColIdx),
            style: {
              width: `${selectionColWidth}px`,
              height: `${t.headerHeight}px`,
              ...selectionRailStickyStyle,
            },
          },
          [
            h('input', {
              type: 'checkbox',
              class: 'cx-table-selection-checkbox cx-table-selection-checkbox--header',
              'aria-label': 'Select all visible rows',
              'data-select-all-state': selectAllState,
              checked: selectAllState === 'checked',
              ref: (el: unknown) => {
                if (el && (el as HTMLInputElement).tagName === 'INPUT') {
                  (el as HTMLInputElement).indeterminate = selectAllState === 'indeterminate';
                }
              },
              onClick: onSelectAllCheckboxClick,
            }),
          ],
        );
      }

      function buildFilterSelectionCell(): VNode {
        // Placeholder cell to keep column alignment in the filter row.
        return h('div', {
          key: 'filter-selection',
          class: 'cx-table-filter-cell cx-table-selection-cell',
          'data-col-id': '__cx_selection__',
          style: { width: `${selectionColWidth}px`, ...selectionRailStickyStyle },
        });
      }

      function buildFilterRowDragCell(): VNode {
        // Empty placeholder reserving the row-drag rail's width in the
        // filter row so filter inputs align with the body's grip column.
        return h('div', {
          key: 'filter-row-drag',
          class: 'cx-table-filter-cell cx-table-row-drag-cell',
          'data-col-id': '__cx_row_drag__',
          style: { width: `${rowDragColumnWidth}px`, ...rowDragRailStickyStyle },
        });
      }

      function buildBodySelectionCell(rowId: string, rowH: number): VNode {
        const isRowSel = selSet.has(rowId);
        // tristate visualization for parent
        // rows (Decision C.1). When the row has descendants AND some-
        // but-not-all are in the selection set → indeterminate state
        // applied via DOM `input.indeterminate` property (HTML attribute
        // has no effect). The class hook `--indeterminate` lets CSS
        // restyle the mark.
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
            role: 'gridcell',
            'data-col-id': '__cx_selection__',
            'data-row-id': rowId,
            'aria-colindex': String(selectionAriaColIdx),
            style: {
              width: `${selectionColWidth}px`,
              height: `${rowH}px`,
              ...selectionRailStickyStyle,
            },
          },
          [
            h('input', {
              type: 'checkbox',
              class: checkboxClasses,
              'aria-label': `Select row ${rowId}`,
              'data-row-id': rowId,
              checked: isRowSel,
              onClick: (e: MouseEvent) => onSelectionCheckboxClick(rowId, e),
              // ref callback writes the DOM
              // `input.indeterminate` property after Vue mounts /
              // updates the element. HTML has no indeterminate
              // attribute; only the JS property works.
              ref: (el: unknown) => {
                if (el instanceof HTMLInputElement) {
                  el.indeterminate = isIndeterminate;
                }
              },
            }),
          ],
        );
      }

      /**
       * build a row-drag grip cell for a body
       * row. Renders `≡` glyph + pointer-down handler that opens a
       * two-stage pending → moving drag session. Pinned rows + rows
       * with `draggable: false` get an empty cell (no glyph, no
       * pointer wiring) — Decision D.1 / B.1.
       *
       * Pointer-move + pointer-up wiring lives at the wrapper level
       * (`onWrapperRowMovePointerMove` etc.) so the drag can continue
       * tracking even when the cursor leaves the grip cell.
       */
      /**
       * -B (2026-05-30): build the actions strip for an
       * actions column cell. One `<button>` per `RowAction` descriptor;
       * each button shows icon + label (or icon-only when
       * `iconOnly: true`). `disabled?(row)` is called per render;
       * truthy result adds the `--disabled` modifier + sets the
       * `disabled` attribute. `onClick(row)` fires on click with
       * `event.stopPropagation()` applied so cell-click / row-click
       * bubbling is suppressed.
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
                type: 'button',
                class: buttonClasses.join(' '),
                'data-action-id': action.id,
                'aria-label': action.ariaLabel ?? action.label,
                disabled: isDisabled,
                onClick: (e: MouseEvent) => {
                  e.stopPropagation();
                  if (isDisabled) return;
                  action.onClick(row);
                },
              },
              buttonChildren,
            );
          }),
        );
      }

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
            role: 'gridcell',
            'data-col-id': '__cx_row_drag__',
            'data-row-id': row.id,
            'data-row-drag-handle': isInactive ? undefined : 'true',
            style: {
              width: `${rowDragColumnWidth}px`,
              height: `${rowH}px`,
              ...railStickyStyle,
            },
            onPointerdown: isInactive
              ? undefined
              : (e: PointerEvent) => onRowDragPointerDown(row.id, e),
          },
          isInactive ? [] : ['≡'],
        );
      }

      /**
       * narrow an `unknown` draft value into a
       * displayable string for the editor `<input>.value` binding.
       * Mirrors the spirit of `defaultFormatCellValue` but always
       * yields a string (the input element requires a string value).
       * Objects fall back to `''` to avoid the `[object Object]`
       * stringification trap (and because there's no sensible
       * round-trip back).
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
       * dispatch on `column.type === 'number'`
       * to render `<input type="number">` instead of `<input type="text">`
       * for numeric columns. The number variant also sets
       * `inputmode="decimal"` as a mobile soft-keyboard hint.
       * Coercion of the raw string draft to a typed value happens
       * in `applyEditCommit` via `coerceEditDraftValue`, NOT here.
       */
      /**
       * chevron SVG / leaf spacer for the tree
       * column (Decision I.1). For parent rows, renders a clickable
       * chevron with the `--expanded` modifier class when the row is
       * expanded. For leaf rows, renders a fixed-width spacer so leaf
       * cells stay column-aligned with parent cells at the same depth.
       *
       * The chevron's click handler calls `e.stopPropagation()` to
       * suppress row-click + cell-click delegated handlers — clicking
       * the chevron is a tree gesture, not a row selection / focus
       * gesture.
       */
      function renderTreeChevronOrSpacer(
        hasChildren: boolean,
        expanded: boolean,
        rowId: string,
      ): VNode {
        // if the row has a lazy state, dispatch
        // on its status — spinner during load, error icon during
        // failure. 'loaded' / undefined / 'idle' fall through to the
        // standard chevron / spacer below.
        const lazyState = lazyChildrenStateRef.value.get(rowId);
        if (lazyState?.status === 'loading') {
          return h(
            'span',
            {
              class: 'cx-table-tree-spinner',
              role: 'status',
              'aria-label': 'Loading children',
              'data-tree-spinner': rowId,
              style: {
                color: 'var(--cx-table-tree-spinner-color, #5a6675)',
              },
            },
            [
              h(
                'svg',
                {
                  width: 12,
                  height: 12,
                  viewBox: '0 0 12 12',
                  'aria-hidden': 'true',
                  class: 'cx-table-tree-spinner-svg',
                  style: {
                    animation: 'cx-table-tree-spinner-rotate 1s linear infinite',
                  },
                },
                [
                  h('circle', {
                    cx: 6,
                    cy: 6,
                    r: 4,
                    fill: 'none',
                    stroke: 'currentColor',
                    'stroke-width': 1.5,
                    'stroke-dasharray': '6 18',
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
              role: 'button',
              'aria-label': 'Retry load',
              'data-tree-error': rowId,
              style: {
                color: 'var(--cx-table-tree-error-color, #dc2626)',
                cursor: 'pointer',
              },
              onClick: (e: MouseEvent) => {
                e.stopPropagation();
                applyLazyChevronClick(rowId);
              },
            },
            [
              h(
                'svg',
                {
                  width: 12,
                  height: 12,
                  viewBox: '0 0 12 12',
                  'aria-hidden': 'true',
                },
                [
                  h('path', {
                    d: 'M6 1 L11 11 L1 11 Z',
                    fill: 'none',
                    stroke: 'currentColor',
                    'stroke-width': 1.5,
                    'stroke-linejoin': 'round',
                  }),
                  h('path', {
                    d: 'M6 5 L6 8',
                    stroke: 'currentColor',
                    'stroke-width': 1.5,
                    'stroke-linecap': 'round',
                  }),
                  h('circle', { cx: 6, cy: 9.5, r: 0.6, fill: 'currentColor' }),
                ],
              ),
            ],
          );
        }
        if (!hasChildren) {
          return h('span', {
            class: 'cx-table-tree-chevron-spacer',
            'aria-hidden': 'true',
          });
        }
        const classList = ['cx-table-tree-chevron'];
        if (expanded) classList.push('cx-table-tree-chevron--expanded');
        return h(
          'span',
          {
            class: classList,
            role: 'button',
            'aria-label': expanded ? 'Collapse row' : 'Expand row',
            'aria-expanded': expanded ? 'true' : 'false',
            'data-tree-chevron': rowId,
            onClick: (e: MouseEvent) => {
              e.stopPropagation();
              // if collapsing during load, abort first.
              if (expanded) {
                abortLazyLoadIfInflight(rowId);
                treeExpandState.toggle(rowId);
              } else {
                applyLazyChevronClick(rowId);
              }
            },
          },
          [
            h(
              'svg',
              {
                width: 12,
                height: 12,
                viewBox: '0 0 12 12',
                'aria-hidden': 'true',
              },
              [
                h('polygon', {
                  points: '3,2 9,6 3,10',
                  fill: 'currentColor',
                }),
              ],
            ),
          ],
        );
      }

      function buildCellEditorInput(edit: EditingCell, theme: ChronixTableTheme): VNode {
        const column = columnTable.value.getById(edit.colId);
        const isNumberEditor = column?.type === 'number';
        const inputAttrs: Record<string, unknown> = isNumberEditor
          ? { type: 'number', inputmode: 'decimal' }
          : { type: 'text' };
        return h('input', {
          ...inputAttrs,
          key: `editor-${edit.rowId}-${edit.colId}`,
          class: 'cx-table-cell-editor',
          value: editorDraftToString(edit.draftValue),
          style: {
            paddingLeft: `${theme.cellPaddingX}px`,
            paddingRight: `${theme.cellPaddingX}px`,
          },
          ref: (el: unknown) => {
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
          },
          onInput: (e: Event) => {
            const target = e.target as HTMLInputElement;
            applyEditDraft(target.value);
          },
          onKeydown: (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              editCommitInProgressRef.value = true;
              applyEditCommit();
              editCommitInProgressRef.value = false;
            } else if (e.key === 'Tab') {
              // Tab commits THEN auto-advances to the
              // next editable cell in display order (forward by
              // default; Shift+Tab backward). rejection
              // path is preserved — if the commit was rejected
              // (editingCellRef still set), do NOT auto-advance so
              // the user can fix the bad input.
              //
              // The `editCommitInProgressRef` guard MUST stay true
              // across the auto-advance step AND the subsequent
              // microtask. When Vue removes the old <input> from the
              // DOM (because the editor's key changes from
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
          onBlur: () => {
            if (editCommitInProgressRef.value) return;
            // Decision C.1: blur commits (Notion semantic).
            applyEditCommit();
          },
          // Stop click from bubbling up to the body delegated handler
          // and re-triggering row-click / selection mutation.
          onClick: (e: MouseEvent) => e.stopPropagation(),
        });
      }

      const activeResize = resizingColumnRef.value;
      const activeMove = movingColumnRef.value;
      const activeMoveDropTarget = activeMove?.dropTarget ?? null;
      const headerCellNodes: VNode[] = cells.map((cell) => {
        // + 8.1: per-column sort state for the indicator span.
        const column = columnTable.value.getById(cell.colId);
        const isSortable = column?.sortable !== false;
        // gate the resizer on column.resizable (default true).
        const isResizable = column?.resizable !== false;
        // gate the move handler on column.reorderable (default true).
        const isReorderable = column?.reorderable !== false;
        const isResizingThis = activeResize?.colId === cell.colId;
        // source-column visual fade during active move.
        const isMovingThis = activeMove?.colId === cell.colId;
        // drop-target visual hooks (gap-line via ::before / ::after).
        const isDropTargetBefore =
          activeMoveDropTarget?.targetColId === cell.colId &&
          activeMoveDropTarget?.position === 'before';
        const isDropTargetAfter =
          activeMoveDropTarget?.targetColId === cell.colId &&
          activeMoveDropTarget?.position === 'after';
        const activeIndex = activeSort.findIndex((s) => s.colId === cell.colId);
        const direction = activeIndex >= 0 ? activeSort[activeIndex]!.direction : null;
        const indicatorText = direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '';
        // when multi-column sort is active (length > 1),
        // append a superscript priority number after the arrow so
        // consumers can see the lex-order. Single-column sort omits
        // the superscript (clean default for the common case).
        const showPosition = activeIndex >= 0 && activeSort.length > 1;
        const positionNode: VNode | null = showPosition
          ? h(
              'sup',
              {
                class: 'cx-table-sort-indicator-position',
                'data-sort-position': String(activeIndex + 1),
              },
              String(activeIndex + 1),
            )
          : null;
        const indicatorNode: VNode = h(
          'span',
          {
            class: [
              'cx-table-sort-indicator',
              direction != null && `cx-table-sort-indicator--${direction}`,
            ]
              .filter(Boolean)
              .join(' '),
            'data-sort-direction': direction ?? '',
          },
          positionNode != null ? [indicatorText, positionNode] : indicatorText,
        );
        // pointer-capture resizer. Once
        // setPointerCapture is called on the resizer element, all
        // subsequent pointermove + pointerup events fire on THAT
        // element regardless of cursor position — no global window
        // listeners needed. Modern DOM idiom for slider / drag-handle
        // widgets. The 4px hit-area (Decision C.1) is positioned
        // straddling the column boundary via CSS (right: -2px).
        const resizerNode: VNode | null = isResizable
          ? h('div', {
              class: [
                'cx-table-header-resizer',
                isResizingThis && 'cx-table-header-resizer--active',
              ]
                .filter(Boolean)
                .join(' '),
              'data-resizer-col-id': cell.colId,
              onPointerdown: (e: PointerEvent) => {
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
              onPointermove: (e: PointerEvent) => {
                if (resizingColumnRef.value?.pointerId !== e.pointerId) return;
                applyResizeDraft(e.clientX);
              },
              onPointerup: (e: PointerEvent) => {
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
              onPointercancel: () => {
                if (resizeCommitInProgressRef.value) return;
                if (resizingColumnRef.value != null) {
                  applyResizeCancel();
                }
              },
              onLostpointercapture: () => {
                if (resizeCommitInProgressRef.value) return;
                if (resizingColumnRef.value != null) {
                  applyResizeCancel();
                }
              },
              // Defensive — a click on the 4px hit-area must not
              // bubble up to the header-cell's sort click.
              onClick: (e: MouseEvent) => e.stopPropagation(),
              // dbl-click on the resizer
              // autosizes the column to its content. Gated on
              // `autosizeable !== false` (separate opt-out from
              // `resizable`). preventDefault + stopPropagation so
              // the dblclick doesn't bubble up to any consumer-wired
              // cell-dblclick / row-dblclick handlers.
              onDblclick: (e: MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                if (column?.autosizeable === false) return;
                applyAutosize(cell.colId);
              },
            })
          : null;
        // visually-hidden description text +
        // aria-describedby reference so screen readers narrate sort +
        // filter state when the user lands on the column header. Empty
        // description string for columns without sort / filter state
        // (still a valid aria-describedby target per WAI-ARIA 1.2).
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
            id: headerDescribedById,
            class: 'cx-table-header-cell__sr-description',
            // Inline visually-hidden style — keeps chronix-table self-
            // contained without requiring consumer CSS. Same pattern
            // as the WAI-ARIA-recommended `.sr-only` visually-hidden
            // declaration. Distinct from the live-region
            // `.cx-table-sr-announce` which the SFC owns elsewhere.
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
        // -A (2026-05-30): column header menu button + popover.
        // Renders only when props.showColumnHeaderMenu === true. Button
        // sits between sort indicator + resizer; popover overlays at
        // bottom-left of header cell (cell is position: relative).
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
                type: 'button',
                class: [
                  'cx-table-column-header-menu-button',
                  isOpen && 'cx-table-column-header-menu-button--open',
                ]
                  .filter(Boolean)
                  .join(' '),
                'data-col-id': cell.colId,
                'aria-haspopup': 'menu',
                'aria-expanded': isOpen ? 'true' : 'false',
                'aria-label': '列操作菜单',
                onClick: (e: MouseEvent) => {
                  e.stopPropagation();
                  applyOpenColumnHeaderMenu(isOpen ? null : cell.colId);
                },
              },
              '▾',
            ),
          );
          if (isOpen) {
            // roving tabindex over the 5 fixed action ids;
            // composable's `activeIndex` drives `tabindex={0|-1}` per item.
            const headerMenuActiveIdx = columnHeaderMenuKbdNav.activeIndex.value;
            const headerMenuItemKbdTabindex = (idx: number, disabled: boolean): number => {
              if (disabled) return -1;
              return headerMenuActiveIdx === idx ? 0 : -1;
            };
            const menuItems: VNode[] = [
              h(
                'button',
                {
                  type: 'button',
                  class: 'cx-table-column-header-menu-item',
                  role: 'menuitem',
                  tabindex: headerMenuItemKbdTabindex(0, !isSortableForMenu),
                  'data-action': 'sort-asc',
                  'data-menu-item-index': '0',
                  disabled: !isSortableForMenu,
                  onClick: () => {
                    if (!isSortableForMenu) return;
                    onColumnHeaderMenuItemClick(cell.colId, 'sort-asc');
                  },
                },
                '升序',
              ),
              h(
                'button',
                {
                  type: 'button',
                  class: 'cx-table-column-header-menu-item',
                  role: 'menuitem',
                  tabindex: headerMenuItemKbdTabindex(1, !isSortableForMenu),
                  'data-action': 'sort-desc',
                  'data-menu-item-index': '1',
                  disabled: !isSortableForMenu,
                  onClick: () => {
                    if (!isSortableForMenu) return;
                    onColumnHeaderMenuItemClick(cell.colId, 'sort-desc');
                  },
                },
                '降序',
              ),
              h(
                'button',
                {
                  type: 'button',
                  class: 'cx-table-column-header-menu-item',
                  role: 'menuitem',
                  tabindex: headerMenuItemKbdTabindex(2, !isCurrentlySorted),
                  'data-action': 'clear-sort',
                  'data-menu-item-index': '2',
                  disabled: !isCurrentlySorted,
                  onClick: () => {
                    if (!isCurrentlySorted) return;
                    onColumnHeaderMenuItemClick(cell.colId, 'clear-sort');
                  },
                },
                '清除排序',
              ),
              h(
                'button',
                {
                  type: 'button',
                  class: 'cx-table-column-header-menu-item',
                  role: 'menuitem',
                  tabindex: headerMenuItemKbdTabindex(3, !isHideableForMenu),
                  'data-action': 'hide',
                  'data-menu-item-index': '3',
                  disabled: !isHideableForMenu,
                  onClick: () => {
                    if (!isHideableForMenu) return;
                    onColumnHeaderMenuItemClick(cell.colId, 'hide');
                  },
                },
                '隐藏',
              ),
              h(
                'button',
                {
                  type: 'button',
                  class: 'cx-table-column-header-menu-item',
                  role: 'menuitem',
                  tabindex: headerMenuItemKbdTabindex(4, !isAutosizeableForMenu),
                  'data-action': 'autosize',
                  'data-menu-item-index': '4',
                  disabled: !isAutosizeableForMenu,
                  onClick: () => {
                    if (!isAutosizeableForMenu) return;
                    onColumnHeaderMenuItemClick(cell.colId, 'autosize');
                  },
                },
                '自适应宽度',
              ),
            ];
            columnHeaderMenuNodes.push(
              h(
                'div',
                {
                  ref: (el: unknown) => {
                    columnHeaderMenuRef.value = el as HTMLElement | null;
                  },
                  class: 'cx-table-column-header-menu',
                  role: 'menu',
                  'data-col-id': cell.colId,
                  onKeydown: (e: KeyboardEvent) => columnHeaderMenuKbdNav.handleKeydown(e),
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
        // per-cell sticky positioning + zone modifier classes
        // when the column is pinned. Empty record / empty array for
        // center columns so the spread / class push is a no-op.
        const pinnedStyle = pinnedCellStyle(cell.colId);
        const pinnedModifiers = pinnedCellModifierSuffixes(cell.colId).map(
          (suffix) => `cx-table-header-cell${suffix}`,
        );
        return h(
          'div',
          {
            key: `header-${cell.colId}`,
            class: [
              'cx-table-header-cell',
              isSortable && 'cx-table-header-cell--sortable',
              direction != null && 'cx-table-header-cell--sorted',
              isResizingThis && 'cx-table-header-cell--resizing',
              isReorderable && 'cx-table-header-cell--reorderable',
              isMovingThis && 'cx-table-header-cell--moving',
              isDropTargetBefore && 'cx-table-header-cell--drop-target-before',
              isDropTargetAfter && 'cx-table-header-cell--drop-target-after',
              ...pinnedModifiers,
            ]
              .filter(Boolean)
              .join(' '),
            role: 'columnheader',
            'data-col-id': cell.colId,
            'aria-colindex': String(ariaColIndexFor(cell.colId)),
            'aria-sort':
              direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none',
            'aria-describedby': headerDescribedById,
            style: {
              width: `${widths[cell.colId] ?? 0}px`,
              height: `${t.headerHeight}px`,
              paddingLeft: `${t.cellPaddingX}px`,
              paddingRight: `${t.cellPaddingX}px`,
              cursor: isReorderable ? 'grab' : isSortable ? 'pointer' : 'default',
              ...pinnedStyle,
            },
            // pointer-capture wiring for column-move drag.
            // Only attached when the column is `reorderable !== false`.
            // The resizer lives inside the cell + calls
            // `e.stopPropagation()` on its pointerdown so the move
            // handler ignores resizer drags — resize wins when the
            // user grabs the 4px right edge. Move never preventDefault's
            // the pointerdown so the cell's normal click → sort cycle
            // (via the delegated `.cx-table-header onClick`) still
            // fires on a sub-threshold click.
            ...(isReorderable
              ? {
                  onPointerdown: (e: PointerEvent) => {
                    if (e.button !== 0) return;
                    const target = e.currentTarget as HTMLElement;
                    // Defensive: setPointerCapture can throw
                    // `InvalidPointerId` when the underlying pointer
                    // isn't currently active (synthesized PointerEvents
                    // in test harnesses + edge cases where the pointer
                    // was released between the event dispatch + this
                    // handler). The capture is best-effort — a missed
                    // capture means subsequent pointermove events still
                    // route to the document, which is fine for a drag
                    // session entirely above the header row.
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
                  onPointermove: (e: PointerEvent) => {
                    const pending = pendingMoveColumnRef.value;
                    if (pending?.pointerId === e.pointerId) {
                      const dx = Math.abs(e.clientX - pending.startClientX);
                      const dy = Math.abs(e.clientY - pending.startClientY);
                      if (Math.max(dx, dy) >= DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX) {
                        applyMoveStart(pending.colId, pending.startClientX, pending.pointerId);
                        pendingMoveColumnRef.value = null;
                        // First draft update so the indicator appears
                        // immediately at the threshold-crossing position.
                        applyMoveDraft(e.clientX);
                      }
                      return;
                    }
                    if (movingColumnRef.value?.pointerId !== e.pointerId) return;
                    applyMoveDraft(e.clientX);
                  },
                  onPointerup: (e: PointerEvent) => {
                    const pending = pendingMoveColumnRef.value;
                    if (pending?.pointerId === e.pointerId) {
                      // Sub-threshold release — clear pending, let the
                      // normal header click → sort cycle fire.
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
                  onPointercancel: () => {
                    pendingMoveColumnRef.value = null;
                    if (moveCommitInProgressRef.value) return;
                    if (movingColumnRef.value != null) applyMoveCancel();
                  },
                  onLostpointercapture: () => {
                    pendingMoveColumnRef.value = null;
                    if (moveCommitInProgressRef.value) return;
                    if (movingColumnRef.value != null) applyMoveCancel();
                  },
                }
              : {}),
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
      // prepend / append the row-drag rail placeholder so the header's
      // column boundaries align with the body's (body carries the grip).
      const headerCellNodesWithRails: VNode[] = rowDragColumnShow
        ? rowDragColumnSide === 'left'
          ? [buildHeaderRowDragCell(), ...headerCellNodesWithSelection]
          : [...headerCellNodesWithSelection, buildHeaderRowDragCell()]
        : headerCellNodesWithSelection;

      const headerRow: VNode = h(
        'div',
        {
          class: 'cx-table-row cx-table-row--header',
          role: 'row',
          'aria-rowindex': '1',
          style: { width: `${totalWithRowDrag}px` },
        },
        headerCellNodesWithRails,
      );

      // when ANY visible column
      // declares a `headerGroup`, prepend N group rows above the leaf
      // row (N = table-wide max nesting depth). Per Decision
      // B.1 + Decision B.1, all rows have the same column
      // alignment — un-covered cells at a given level render as
      // singleton empty placeholders so the leaf row beneath stays
      // vertically aligned. Per Decision A.1, groups never
      // span across pinned-zone boundaries (each zone's spans come
      // from its own `computeHeaderGroupSpans` call, padded to the
      // table-wide max depth).
      const rowsByZone = headerGroupRowsByZone.value;
      function buildHeaderGroupSpanCell(
        span: HeaderGroupSpan,
        zoneKey: string,
        levelIdx: number,
      ): VNode {
        let spanWidth = 0;
        for (const id of span.colIds) spanWidth += widths[id] ?? 0;
        const isEmpty = span.groupName == null;
        const baseClass =
          'cx-table-header-group' + (isEmpty ? ' cx-table-header-group--empty' : '');
        // pinned-zone group cells stick to their edge so the group label
        // stays aligned with its pinned columns during horizontal scroll
        // (mirrors `pinnedCellStyle` for leaf header cells). center groups
        // scroll with the body. Without this, a group spanning pinned-left
        // columns (e.g. 基础信息 over ID+名称) slides off-screen when the
        // body is scrolled horizontally, leaving the pinned columns under a
        // wrong (or empty) group label — and adjacent groups overlap.
        let groupStickyStyle: Record<string, string> = {};
        if (zoneKey === 'L' && span.colIds.length > 0) {
          const firstOffset = pinnedResult.leftOffsetByColId[span.colIds[0] ?? ''] ?? 0;
          groupStickyStyle = {
            position: 'sticky',
            left: `${firstOffset + selectionRailLeftShift}px`,
            zIndex: '2',
          };
        } else if (zoneKey === 'R' && span.colIds.length > 0) {
          const lastColId = span.colIds[span.colIds.length - 1] ?? '';
          const lastOffset = pinnedResult.rightOffsetByColId[lastColId] ?? 0;
          groupStickyStyle = {
            position: 'sticky',
            right: `${lastOffset + selectionRailRightShift}px`,
            zIndex: '2',
          };
        }
        const cellAttrs: Record<string, unknown> = {
          key: `header-group-${zoneKey}-L${levelIdx}-${span.startColIdx}-${span.endColIdx}`,
          class: baseClass,
          role: 'columnheader',
          'data-header-group-level': String(levelIdx),
          // header group span maps to its
          // LEFTMOST column for aria-colindex per W3C grid semantics.
          'aria-colindex': String(ariaColIndexFor(span.colIds[0] ?? '')),
          style: {
            width: `${spanWidth}px`,
            height: `${t.headerGroupHeight}px`,
            background: isEmpty ? 'transparent' : 'var(--cx-table-header-group-bg, #e8ecf0)',
            paddingLeft: `${t.cellPaddingX}px`,
            paddingRight: `${t.cellPaddingX}px`,
            ...groupStickyStyle,
          },
        };
        if (!isEmpty) {
          cellAttrs['data-group-name'] = span.groupName;
          cellAttrs['data-col-ids'] = span.colIds.join(',');
        }
        return h(
          'div',
          cellAttrs,
          isEmpty ? [] : [h('span', { class: 'cx-table-header-group-label' }, span.groupName)],
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
                style: {
                  width: `${selectionColWidth}px`,
                  height: `${t.headerGroupHeight}px`,
                  background: 'transparent',
                  ...selectionRailStickyStyle,
                },
              })
            : null;
          // row-drag rail placeholder keeping this group row's edge
          // aligned with the body's grip column.
          const rowDragPlaceholder: VNode | null = rowDragColumnShow
            ? h('div', {
                key: `header-group-row-drag-L${levelIdx}`,
                class: 'cx-table-header-group cx-table-header-group--empty cx-table-row-drag-cell',
                style: {
                  width: `${rowDragColumnWidth}px`,
                  height: `${t.headerGroupHeight}px`,
                  background: 'transparent',
                  ...rowDragRailStickyStyle,
                },
              })
            : null;
          const orderedZoneCells: VNode[] = [...leftCells, ...centerCells, ...rightCells];
          const rowChildrenWithSelection: VNode[] = selectionColShow
            ? selectionColSide === 'left'
              ? [selectionPlaceholder!, ...orderedZoneCells]
              : [...orderedZoneCells, selectionPlaceholder!]
            : orderedZoneCells;
          const rowChildren: VNode[] = rowDragPlaceholder
            ? rowDragColumnSide === 'left'
              ? [rowDragPlaceholder, ...rowChildrenWithSelection]
              : [...rowChildrenWithSelection, rowDragPlaceholder]
            : rowChildrenWithSelection;
          headerGroupRows.push(
            h(
              'div',
              {
                key: `header-group-row-L${levelIdx}`,
                class: 'cx-table-row cx-table-row--header-group',
                role: 'row',
                'data-header-group-level': String(levelIdx),
                style: { width: `${totalWithRowDrag}px` },
              },
              rowChildren,
            ),
          );
        }
      }

      const headerRows: VNode[] =
        headerGroupRows.length > 0 ? [...headerGroupRows, headerRow] : [headerRow];

      const header: VNode = h(
        'div',
        {
          ref: (el: unknown) => {
            headerRef.value = el as HTMLElement | null;
          },
          class: 'cx-table-header',
          role: 'rowgroup',
          // `overflowX: hidden` makes header a
          // horizontal-clip container with a meaningful `scrollLeft`
          // setter; the body's `onScroll` handler mirrors
          // `body.scrollLeft → headerEl.scrollLeft` so the header row
          // visually scrolls in lockstep with body cells. Without
          // `overflow: hidden`, `scrollLeft` assignment is a no-op.
          style: { overflowX: 'hidden' },
          // delegated header click — emits header-click with
          // resolved ColumnSpec when the click target's ancestor chain
          // includes [data-col-id]. adds a sibling delegate
          // that emits `header-group-click` for the group row's labelled
          // cells; the two delegates are independent because the leaf
          // row's cells carry `[data-col-id]` while the group row's
          // cells carry `[data-group-name]`.
          onClick: onHeaderClick,
        },
        headerRows,
      );

      // opt-in filter row beneath the header.
      // One <input> per visible column; filterable columns get an
      // editable text input + `oninput → setFilterColumnValue`;
      // non-filterable columns get a disabled placeholder. Per-input
      // value is read from the current `filterSpec` array so external
      // `setFilter` calls reactively update the visible input text.
      // column.type === 'number' columns get a prefix-
      // syntax placeholder hint and route input through the prefix
      // parser inside setFilterColumnValue.
      //
      // when `numberFilterShowRangeSlider`
      // is `true` and the column is `type: 'number'` with finite
      // numeric data, an additional dual-handle range slider renders
      // below the text input. Slider commits route through
      // `setFilterColumnValue(colId, 'low..high')` — same code path
      // as user-typed prefix syntax.
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
            // happy-dom / older browsers — capture not available; events
            // still fire on the track for the duration of the drag in
            // happy-dom + jsdom because pointermove bubbles up.
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
            role: 'group',
            'aria-label': `${col.headerName ?? col.id} range`,
            'data-col-id': col.id,
            'data-number-filter-range': '',
            style: {
              position: 'relative',
              height: '20px',
              marginTop: '4px',
              touchAction: 'none',
            },
            onPointerdown: onPointerDownTrack,
            onPointermove: onPointerMoveTrack,
            onPointerup: onPointerUpTrack,
            onPointercancel: onPointerUpTrack,
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
              type: 'button',
              class: 'cx-table-number-filter__range-thumb',
              'data-range-handle': 'low',
              role: 'slider',
              tabindex: '0',
              'aria-valuemin': String(extents.min),
              'aria-valuemax': String(extents.max),
              'aria-valuenow': String(range.low),
              'aria-label': `${col.headerName ?? col.id} low`,
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
              onKeydown: onKeydownThumb('low'),
            }),
            h('button', {
              type: 'button',
              class: 'cx-table-number-filter__range-thumb',
              'data-range-handle': 'high',
              role: 'slider',
              tabindex: '0',
              'aria-valuemin': String(extents.min),
              'aria-valuemax': String(extents.max),
              'aria-valuenow': String(range.high),
              'aria-label': `${col.headerName ?? col.id} high`,
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
              onKeydown: onKeydownThumb('high'),
            }),
          ],
        );
      }
      const filterColumnNodes: VNode[] = props.showFilterRow
        ? visible.map((col) => {
            const isFilterable = col.filterable !== false;
            const isNumberColumn = col.type === 'number';
            const isSetFilterUi = col.filterUi === 'set';
            // filter-row cells inherit pinned styling so they
            // stay column-aligned with the header + body cells during
            // horizontal scroll.
            const pinnedStyle = pinnedCellStyle(col.id);
            const pinnedClassList = pinnedCellModifierSuffixes(col.id).map(
              (suffix) => `cx-table-filter-cell${suffix}`,
            );

            // set-filter dropdown branch. Renders
            // a native HTML `<details><summary>` so the browser owns
            // toggle behavior + keyboard accessibility (no JS for
            // open/close + no click-outside listener).
            if (isSetFilterUi && isFilterable) {
              const unique = collectUniqueColumnValues({ rows: props.rows, column: col });
              const allValues = unique.values.map((v) => v.value);
              const summaryLabel = setFilterSummaryLabel(col.id, unique.values.length);
              const totalItemCount = unique.values.length;
              // virtualize the unique-values
              // list when its size crosses `setFilterVirtualizeThreshold`.
              // Below the threshold the list renders eagerly (one
              // `<label>` per unique value) — same shape as
              // shipped. Above the threshold the inner list contents
              // are replaced with a 2-level sizer + transformed-window
              // wrapper backed by `@chronixjs/cx-kit`'s
              // `computeVirtualWindow` helper, and a scroll listener on
              // the list element drives `setFilterScrollTopByColId`.
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
                      type: 'checkbox',
                      class: 'cx-table-set-filter__checkbox',
                      checked: isSetFilterValueChecked(col.id, entry.value),
                      'data-set-filter-value': String(entry.value),
                      onChange: () => toggleSetFilterValue(col.id, entry.value, allValues),
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
                    'data-set-filter-sizer': '',
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
                        'data-set-filter-window': '',
                        'data-window-start': String(vWindow.startIndex),
                        'data-window-end': String(vWindow.endIndex),
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
              return h(
                'div',
                {
                  key: `filter-cell-${col.id}`,
                  class: ['cx-table-filter-cell', ...pinnedClassList].join(' '),
                  'data-col-id': col.id,
                  'data-filter-ui': 'set',
                  style: {
                    width: `${widths[col.id] ?? 0}px`,
                    paddingLeft: `${t.cellPaddingX}px`,
                    paddingRight: `${t.cellPaddingX}px`,
                    ...pinnedStyle,
                  },
                },
                [
                  h(
                    'details',
                    {
                      class: 'cx-table-set-filter',
                      'data-col-id': col.id,
                    },
                    [
                      h(
                        'summary',
                        {
                          class: 'cx-table-set-filter__summary',
                          'aria-label': `Filter ${col.headerName ?? col.id}`,
                        },
                        summaryLabel,
                      ),
                      h('div', { class: 'cx-table-set-filter__panel' }, [
                        h('div', { class: 'cx-table-set-filter__actions' }, [
                          h(
                            'button',
                            {
                              type: 'button',
                              class: 'cx-table-set-filter__action',
                              'data-action': 'select-all',
                              onClick: () => applySetFilterValues(col.id, null),
                            },
                            '全选',
                          ),
                          h(
                            'button',
                            {
                              type: 'button',
                              class: 'cx-table-set-filter__action',
                              'data-action': 'clear',
                              onClick: () => applySetFilterValues(col.id, []),
                            },
                            '清空',
                          ),
                        ]),
                        h(
                          'div',
                          {
                            class: 'cx-table-set-filter__list',
                            role: 'group',
                            'data-virtualized': shouldVirtualize ? 'true' : 'false',
                            ref: (el: unknown) => {
                              if (!shouldVirtualize) return;
                              const node = el as HTMLElement | null;
                              if (!node) return;
                              const next = node.clientHeight;
                              const prev = setFilterViewportHeightByColId.value[col.id];
                              if (prev !== next) {
                                setFilterViewportHeightByColId.value = {
                                  ...setFilterViewportHeightByColId.value,
                                  [col.id]: next,
                                };
                              }
                            },
                            onScroll: (e: Event) => {
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
                          listChildren,
                        ),
                        unique.truncated
                          ? h(
                              'p',
                              { class: 'cx-table-set-filter__truncated' },
                              `已截断 (>${unique.values.length})`,
                            )
                          : null,
                      ]),
                    ],
                  ),
                ],
              );
            }

            // + +
            // multi-filter container branch.
            // ships recursive render — root entries +
            // nested groups share one `renderMultiFilterEntries`
            // helper. Path threads through every emit so consumers
            // always know WHERE in the tree the action happened.
            const isMultiFilterUi = col.filterUi === 'multi';
            if (isMultiFilterUi && isFilterable) {
              const slots = col.multiFilterChildTypes ?? (['text', 'text'] as const);
              const summary = multiFilterSummaryLabel(col);
              const spec = getMultiFilterSpec(col.id);
              // effective root entries = spec.filters
              // when a spec exists; else bootstrap shape from column
              // config (preserves backwards-compat for
              // first-render UX).
              const effectiveRootEntries: readonly MultiFilterEntry[] =
                spec?.filters ??
                slots.map((kind) => {
                  if (kind === 'text') return { type: 'text', operator: 'contains', value: '' };
                  if (kind === 'set') return { type: 'set', selectedValues: null };
                  return { type: 'number', operator: '=', value: 0 };
                });
              const effectiveRootMode = spec?.mode ?? props.multiFilterDefaultMode;
              const slotCount = slots.length;
              // build unique-values lookup once per render
              // for set-slots on this column (reuses the outer Phase
              // 43 set-filter source; same unique-values
              // pipeline minus virtualization at v1 per Decision B.1).
              let setSlotUnique: ReturnType<typeof collectUniqueColumnValues> | null = null;
              const ensureSetSlotUnique = (): ReturnType<typeof collectUniqueColumnValues> => {
                setSlotUnique ??= collectUniqueColumnValues({ rows: props.rows, column: col });
                return setSlotUnique;
              };
              // derive slotKind from entry.type (vs.
              // column-config) so consumer-injected groups render
              // their own child kinds correctly.
              const slotKindOfEntry = (entry: MultiFilterEntry): 'text' | 'number' | 'set' => {
                if (entry.type === 'group') return 'text'; // unreachable in leaf path
                return entry.type;
              };
              // at root level, slotIdx-based helpers
              // (setMultiFilterChildValue, isMultiFilterChildSetValueChecked,
              // toggleMultiFilterChildSetValue) only work for root-flat
              // shapes. For consumer-injected groups, the consumer
              // mutates via setMultiFilterEntryAtPath; in-UI checkbox
              // toggle for set-slots inside groups uses a path-aware
              // helper. For v1, set-slots inside groups stay
              // read-only (consumer-driven); the in-UI toggle path
              // only triggers for ROOT slots — `path.length === 1`.
              const renderRemoveSlotButton = (
                slotIdx: number,
                parentPath: readonly number[],
                siblingCount: number,
              ): VNode => {
                // at root level (parentPath = []), the
                // legacy `slotCount <= 1` invariant applies (column
                // config with 1 slot → unremovable). Inside a group,
                // require at least 1 remaining sibling.
                const disabled = parentPath.length === 0 ? slotCount <= 1 : siblingCount <= 1;
                return h(
                  'button',
                  {
                    type: 'button',
                    class: 'cx-table-multi-filter__remove-slot',
                    'data-col-id': col.id,
                    'data-multi-filter-slot': String(slotIdx),
                    'data-testid': 'cx-table-multi-filter-remove-slot',
                    'aria-label': `Remove filter slot ${slotIdx + 1}`,
                    disabled: disabled ? true : undefined,
                    'aria-disabled': disabled ? 'true' : 'false',
                    onClick: () => {
                      if (disabled) return;
                      emit('remove-multi-filter-slot', {
                        colId: col.id,
                        slotIdx,
                        path: parentPath,
                      });
                    },
                  },
                  '×',
                );
              };
              // leaf set-slot toggle / read at path.
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
                if (sel == null) return false;
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
                const prev = entry.selectedValues;
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
                setMultiFilterEntryAtPathInternal(col, path, {
                  type: 'set',
                  selectedValues: nextSelected,
                });
              };
              const renderBuiltinSlotAtPath = (
                entry: MultiFilterChild,
                slotIdx: number,
                path: readonly number[],
                siblingCount: number,
              ): VNode => {
                const slotKind = slotKindOfEntry(entry);
                if (slotKind === 'set') {
                  const unique = ensureSetSlotUnique();
                  const setEntry = entry.type === 'set' ? entry : null;
                  return h('div', { class: 'cx-table-multi-filter__slot' }, [
                    h(
                      'details',
                      {
                        class: 'cx-table-multi-filter__set-slot',
                        'data-col-id': col.id,
                        'data-multi-filter-slot': String(slotIdx),
                        'data-multi-filter-slot-kind': 'set',
                      },
                      [
                        h(
                          'summary',
                          {
                            class: 'cx-table-multi-filter__set-slot-summary',
                            'aria-label': `Filter ${col.headerName ?? col.id} slot ${slotIdx + 1}`,
                          },
                          (() => {
                            const sel = setEntry?.selectedValues;
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
                                  type: 'checkbox',
                                  class: 'cx-table-set-filter__checkbox',
                                  checked: isSetValueCheckedAtPath(path, uniqEntry.value),
                                  'data-set-filter-value': String(uniqEntry.value),
                                  onChange: () => toggleSetValueAtPath(path, uniqEntry.value),
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
                // text/number leaf
                const inputValue =
                  entry.type === 'number'
                    ? Number.isFinite(entry.value)
                      ? String(entry.value)
                      : ''
                    : entry.type === 'text'
                      ? entry.value
                      : '';
                return h('div', { class: 'cx-table-multi-filter__slot' }, [
                  h('input', {
                    class: 'cx-table-multi-filter__input',
                    type: slotKind === 'number' ? 'number' : 'text',
                    inputmode: slotKind === 'number' ? 'decimal' : undefined,
                    value: inputValue,
                    placeholder: slotKind === 'number' ? '数值…' : '关键词…',
                    'aria-label': `Filter ${col.headerName ?? col.id} slot ${slotIdx + 1}`,
                    'data-col-id': col.id,
                    'data-multi-filter-slot': String(slotIdx),
                    'data-multi-filter-slot-kind': slotKind,
                    onInput: (e: Event) => {
                      const target = e.target as HTMLInputElement;
                      // at root level use legacy path
                      // (preserves emit behavior); at nested
                      // depths build the right entry shape + set via path.
                      if (path.length === 1) {
                        setMultiFilterChildValue(col, path[0]!, target.value);
                        return;
                      }
                      let nextEntry: MultiFilterChild;
                      if (slotKind === 'number') {
                        const parsed = Number(target.value);
                        nextEntry = {
                          type: 'number',
                          operator: '=',
                          value: Number.isFinite(parsed) ? parsed : Number.NaN,
                        };
                      } else {
                        nextEntry = {
                          type: 'text',
                          operator: 'contains',
                          value: target.value,
                        };
                      }
                      setMultiFilterEntryAtPathInternal(col, path, nextEntry);
                    },
                  }),
                  renderRemoveSlotButton(slotIdx, path.slice(0, -1), siblingCount),
                ]);
              };
              // consumer-override hook. When the renderer
              // returns non-null, replace the slot's content; null
              // falls back to the built-in widget. Layered on top of
              // a built-in slotKind (no new `'custom'` kind).
              const renderLeafEntryAtPath = (
                entry: MultiFilterChild,
                slotIdx: number,
                path: readonly number[],
                siblingCount: number,
              ): VNode => {
                const slotKind = slotKindOfEntry(entry);
                const renderer = props.multiFilterChildRenderer;
                if (renderer != null) {
                  const node = renderer({
                    column: col,
                    slotIdx,
                    slotKind,
                    child: entry,
                    setChildValue: (next) => {
                      if (path.length === 1) {
                        setMultiFilterChildSpec(col, slotIdx, next);
                      } else {
                        setMultiFilterEntryAtPathInternal(col, path, next);
                      }
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
              // recursive renderer driving root + nested
              // groups through one helper. Mode toggle dispatches via
              // setMultiFilterMode at root OR
              // setMultiFilterEntryAtPathInternal for nested groups.
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
                    role: 'radiogroup',
                    'aria-label': '筛选模式',
                  },
                  [
                    h(
                      'button',
                      {
                        type: 'button',
                        class:
                          'cx-table-multi-filter__mode-button' +
                          (mode === 'AND' ? ' cx-table-multi-filter__mode-button--active' : ''),
                        role: 'radio',
                        'aria-checked': mode === 'AND' ? 'true' : 'false',
                        'data-mode': 'AND',
                        onClick: () => onModeChange('AND'),
                      },
                      '全部满足 (AND)',
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        class:
                          'cx-table-multi-filter__mode-button' +
                          (mode === 'OR' ? ' cx-table-multi-filter__mode-button--active' : ''),
                        role: 'radio',
                        'aria-checked': mode === 'OR' ? 'true' : 'false',
                        'data-mode': 'OR',
                        onClick: () => onModeChange('OR'),
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
                        'data-cx-multi-filter-group-path': path.join('.'),
                        open: true,
                      },
                      [
                        h('summary', { class: 'cx-table-multi-filter__group-summary' }, [
                          `分组 (${entry.mode}) · ${entry.filters.length} 条件`,
                          h(
                            'button',
                            {
                              type: 'button',
                              class: 'cx-table-multi-filter__remove-group',
                              'data-testid': 'cx-table-multi-filter-remove-group',
                              'aria-label': '移除分组',
                              onClick: (e: Event) => {
                                e.preventDefault();
                                e.stopPropagation();
                                emit('remove-multi-filter-group', {
                                  colId: col.id,
                                  path,
                                });
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
                    type: 'button',
                    class: 'cx-table-multi-filter__add-slot',
                    'data-col-id': col.id,
                    'data-testid': 'cx-table-multi-filter-add-slot',
                    onClick: () => {
                      emit('add-multi-filter-slot', {
                        colId: col.id,
                        slotKind: 'text',
                        path: parentPath,
                      });
                    },
                  },
                  '+ 添加条件',
                );
                const addGroupBtn = h(
                  'button',
                  {
                    type: 'button',
                    class: 'cx-table-multi-filter__add-group',
                    'data-col-id': col.id,
                    'data-testid': 'cx-table-multi-filter-add-group',
                    onClick: () => {
                      emit('add-multi-filter-group', { colId: col.id, path: parentPath });
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
                  class: ['cx-table-filter-cell', ...pinnedClassList].join(' '),
                  'data-col-id': col.id,
                  'data-filter-ui': 'multi',
                  style: {
                    width: `${widths[col.id] ?? 0}px`,
                    paddingLeft: `${t.cellPaddingX}px`,
                    paddingRight: `${t.cellPaddingX}px`,
                    ...pinnedStyle,
                  },
                },
                [
                  h(
                    'details',
                    {
                      class: 'cx-table-multi-filter',
                      'data-col-id': col.id,
                    },
                    [
                      h(
                        'summary',
                        {
                          class: 'cx-table-multi-filter__summary',
                          'aria-label': `Multi filter ${col.headerName ?? col.id}`,
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
            // optional dual-handle range
            // slider beneath the Number filter text input. Renders
            // only when (a) the opt-in SFC prop is true, (b) the
            // column is numeric + filterable, and (c) the row
            // population yields finite numeric extents for the column.
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
                type: 'text',
                value,
                disabled: !isFilterable,
                placeholder,
                'aria-label': `Filter ${col.headerName ?? col.id}`,
                'data-col-id': col.id,
                'data-filter-type': isNumberColumn ? 'number' : 'text',
                onInput: (e: Event) => {
                  const target = e.target as HTMLInputElement;
                  setFilterColumnValue(col.id, target.value);
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
                class: ['cx-table-filter-cell', ...pinnedClassList].join(' '),
                'data-col-id': col.id,
                style: {
                  width: `${widths[col.id] ?? 0}px`,
                  paddingLeft: `${t.cellPaddingX}px`,
                  paddingRight: `${t.cellPaddingX}px`,
                  ...pinnedStyle,
                },
              },
              cellChildren,
            );
          })
        : [];
      // filter row also gets a (placeholder) selection cell
      // so columns stay aligned vertically with the header + body.
      const filterRowWithSelection: VNode[] = !props.showFilterRow
        ? []
        : selectionColShow
          ? selectionColSide === 'left'
            ? [buildFilterSelectionCell(), ...filterColumnNodes]
            : [...filterColumnNodes, buildFilterSelectionCell()]
          : filterColumnNodes;
      // row-drag rail placeholder so the filter row's inputs stay
      // aligned with the body's grip column.
      const filterRowChildren: VNode[] =
        !props.showFilterRow || !rowDragColumnShow
          ? filterRowWithSelection
          : rowDragColumnSide === 'left'
            ? [buildFilterRowDragCell(), ...filterRowWithSelection]
            : [...filterRowWithSelection, buildFilterRowDragCell()];
      const filterRow: VNode | null = props.showFilterRow
        ? h(
            'div',
            {
              ref: (el: unknown) => {
                filterRowRef.value = el as HTMLElement | null;
              },
              class: 'cx-table-filter-row',
              role: 'rowgroup',
              // mirror the header's outer-clip /
              // inner-content-row structure so the body's `scrollLeft`
              // can be programmatically mirrored to `filterRowEl.scrollLeft`
              // (default `overflow: visible` ignores `scrollLeft`).
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

      const activeEdit = editingCellRef.value;
      const bodyRows: VNode[] = rowsToRender.map((row) => {
        const rowH = rowHs[row.id] ?? t.rowHeight;
        // server-side row model skeleton
        // placeholder. Synthetic rows (block not yet loaded) skip the
        // full cell-render pipeline + render a row of shimmer bars.
        if (isServerSideSkeletonRowId(row.id)) {
          const skeletonCells: VNode[] = visible.map((col) =>
            h(
              'div',
              {
                key: `cell-${row.id}-${col.id}`,
                class: 'cx-table-cell cx-table-cell--skeleton',
                role: 'gridcell',
                'data-col-id': col.id,
                'data-row-id': row.id,
                'aria-colindex': String(ariaColIndexFor(col.id)),
                style: {
                  width: `${widths[col.id] ?? 0}px`,
                  height: `${rowH}px`,
                  paddingLeft: `${t.cellPaddingX}px`,
                  paddingRight: `${t.cellPaddingX}px`,
                },
              },
              h('div', { class: 'cx-table-cell-skeleton-bar' }),
            ),
          );
          return h(
            'div',
            {
              key: `row-${row.id}`,
              class: 'cx-table-row cx-table-row--skeleton',
              role: 'row',
              'data-row-id': row.id,
              'aria-rowindex': String(ariaRowIndexForBody(row.id)),
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
          // + class resolver. `getCellValue` applies col.valueGetter
          // or default field-based extraction; `formatCellValue`
          // applies col.valueFormatter or defaultFormatCellValue;
          // `resolveCellClassNames` normalizes static/array/function
          // cellClass into a flat string[] of class additions on
          // top of the structural `cx-table-cell`.
          const value = getCellValue({ row, column: col });
          // -A (2026-05-30): row-number column override. When
          // `col.rowNumber === true`, the cell text is the row's
          // displayed-position index (1-based, post-filter / post-sort
          // / post-page) instead of the field-extracted value.
          // valueGetter / valueFormatter / cellRenderer are all
          // skipped for row-number cells.
          const isRowNumberCol = col.rowNumber === true;
          const rowNumberIndex = isRowNumberCol
            ? displayedRowIndexByRowId.value[row.id]
            : undefined;
          // -B (2026-05-30): actions column flag. Non-empty
          // `col.actions` array swaps the cell's content for an
          // action-button strip (built below in the cellChildren
          // branch); the cell still carries every other cascade
          // (pinned-zone / cellClass / wrapText / quickFind).
          const isActionsCol = col.actions != null && col.actions.length > 0;
          const text = isRowNumberCol
            ? rowNumberIndex != null
              ? String(rowNumberIndex + 1)
              : ''
            : col.valueFormatter != null
              ? col.valueFormatter({ value, row, column: col })
              : formatCellValue({ row, column: col });
          const extraClasses = resolveCellClassNames({ value, row, column: col });
          // when this cell is the active edit cell, render
          // the `<input>` editor in place of the text. The cell still
          // carries its data-* attrs + base styling so consumers
          // observing the cell DOM see consistent structure.
          const editingThisCell: EditingCell | null =
            activeEdit?.rowId === row.id && activeEdit.colId === col.id ? activeEdit : null;
          const classList = ['cx-table-cell', ...extraClasses];
          if (editingThisCell != null) classList.push('cx-table-cell--editing');
          // invalid-cell marker class +
          // data-attr + ARIA (Decision C.1). Painted when a prior
          // commit attempt was rejected by `column.validator`; cleared
          // by the next successful commit / cancel on the same cell.
          const cellInvalidError = invalidCellsRef.value.get(invalidCellKey(row.id, col.id));
          const isInvalidCell = cellInvalidError != null;
          if (isInvalidCell) classList.push('cx-table-cell--invalid');
          // in-flight async-validation marker
          // class. Painted while `column.validatorAsync` is pending;
          // cleared on resolve/reject/cancel. Mirrors the invalid-
          // cell triple (CSS class + data-attr + ARIA `aria-busy`).
          const isValidatingCell = pendingAsyncValidationByKey.value.has(
            invalidCellKey(row.id, col.id),
          );
          if (isValidatingCell) classList.push('cx-table-cell--validating');
          // -C (2026-05-30): wrap-text modifier — CSS sets
          // white-space: pre-wrap + word-break: break-word for
          // multi-line cell content.
          if (col.wrapText === true) classList.push('cx-table-cell--wrap-text');
          // -A (2026-05-30): row-number marker class for
          // theming + test discoverability.
          if (isRowNumberCol) classList.push('cx-table-cell--row-number');
          // -B (2026-05-30): actions marker class.
          if (isActionsCol) classList.push('cx-table-cell--actions');
          // active-cell modifier — outline +
          // outline-offset CSS styling lives in the consumer's
          // stylesheet so the SFC stays theme-agnostic.
          const isActiveCell =
            activeCellRef.value?.rowId === row.id && activeCellRef.value.colId === col.id;
          if (isActiveCell) classList.push('cx-table-cell--active');
          // paint the cell-range modifier when
          // this cell falls inside the resolved envelope. O(1) lookup
          // via the Set-derived computed values.
          const inCellRange =
            cellRangeRowSet.value.has(row.id) && cellRangeColSet.value.has(col.id);
          if (inCellRange) classList.push('cx-table-cell--in-cell-range');
          // preview class for cells in the
          // drag-fill extension envelope (rendered while a drag-fill
          // gesture is in flight). Identity-stable empty Set keeps
          // this lookup O(1) in the no-fill case.
          if (dragFillPreviewSet.value.has(`${row.id}/${col.id}`)) {
            classList.push('cx-table-cell--in-fill-preview');
          }
          // pinned-zone modifier classes +
          // sticky inline style. Center columns get neither.
          const pinnedSuffixes = pinnedCellModifierSuffixes(col.id);
          for (const suffix of pinnedSuffixes) {
            classList.push(`cx-table-cell${suffix}`);
          }
          const pinnedStyle = pinnedCellStyle(col.id);
          // tree-column chevron + indent
          // (Decisions D.1 + I.1 + J.1). Only the column flagged with
          // `treeColumn: true` (or the implicit fallback) renders the
          // chevron; non-tree columns receive no extra padding.
          const isTreeColumn = treeColumnIdRef.value === col.id;
          const treeActive = isTreeColumn;
          let treeIndentLeft = 0;
          let treeLeadingNode: VNode | null = null;
          if (treeActive) {
            const rowDepth = row.depth ?? 0;
            treeIndentLeft = rowDepth * t.treeIndentPx;
            // hasChildren OR sync children both mean "show
            // chevron." Lazy-eligible rows render the chevron even
            // before children are loaded.
            const rowHasChildren =
              (row.children != null && row.children.length > 0) || row.hasChildren === true;
            const rowExpanded = effectiveExpandedRowIdsSet.value.has(row.id);
            treeLeadingNode = renderTreeChevronOrSpacer(rowHasChildren, rowExpanded, row.id);
          }
          // quick-find highlight. Only applies
          // when the needle is non-empty AND the column has
          // `filterable !== false` (mirrors quickFindPass's
          // "contributing columns" rule). Plain-string text only — when
          // `text` is a VNode (consumer's cellRenderer / structured
          // node), highlight is skipped to avoid touching the consumer's
          // own DOM tree.
          const renderedText: VNode | string | (VNode | string)[] = (() => {
            if (typeof text !== 'string') return text;
            const needle = quickFindText.value;
            if (needle === '' || col.filterable === false) return text;
            const segments = splitTextByQuickFindMatch(text, needle);
            if (!segments.some((s) => s.isMatch)) return text;
            return segments.map((seg) =>
              seg.isMatch ? h('span', { class: 'cx-table-cell__find-match' }, seg.text) : seg.text,
            );
          })();
          const cellChildren: VNode | string | (VNode | string)[] =
            isActionsCol && col.actions != null
              ? buildActionsCellChildren(col.actions, row)
              : editingThisCell != null
                ? [buildCellEditorInput(editingThisCell, t)]
                : treeActive
                  ? [
                      ...(treeLeadingNode != null ? [treeLeadingNode] : []),
                      h('span', { class: 'cx-table-cell-tree-label' }, renderedText),
                    ]
                  : renderedText;
          // per-cell pointer handlers — gated on
          // `cellRangeSelection === 'enabled'` (the gate runs INSIDE
          // each handler so we avoid conditional handler attachment
          // that would force a re-render dance on prop toggle).
          const cellRangeEnabled = props.cellRangeSelection === 'enabled';
          // per-cell row-drag grip wiring.
          // Active when `col.rowDragHandle === true` AND the dedicated
          // sticky rail is NOT shown (Decision A.1 mutual exclusivity)
          // AND the row is draggable + non-pinned (Decision D.1
          // exclusions). When active, the cell adds `cursor: grab` +
          // an `onPointerdown` that initiates a row-drag session.
          const isRowDragHandleCell =
            col.rowDragHandle === true &&
            !rowDragColumnShow &&
            row.draggable !== false &&
            row.pinned == null;
          // -C (2026-05-30): auto-height cells use min-height so
          // their content can grow beyond defaultRowHeight; otherwise
          // existing fixed-height behavior applies.
          const cellHeightStyle: Record<string, string> = props.enableRowAutoHeight
            ? { minHeight: `${rowH}px` }
            : { height: `${rowH}px` };
          return h(
            'div',
            {
              key: `cell-${row.id}-${col.id}`,
              class: [
                ...classList,
                ...(isRowDragHandleCell ? ['cx-table-row-drag-handle-cell'] : []),
              ],
              role: 'gridcell',
              'data-col-id': col.id,
              'data-row-id': row.id,
              'aria-colindex': String(ariaColIndexFor(col.id)),
              ...(isActiveCell ? { 'data-active': 'true' } : {}),
              ...(isRowDragHandleCell ? { 'data-row-drag-handle': 'cell' } : {}),
              ...(isInvalidCell ? { 'data-cell-invalid': 'true', 'aria-invalid': 'true' } : {}),
              ...(isValidatingCell ? { 'data-cell-validating': 'true', 'aria-busy': 'true' } : {}),
              style: {
                width: `${widths[col.id] ?? 0}px`,
                ...cellHeightStyle,
                paddingLeft: `${t.cellPaddingX + treeIndentLeft}px`,
                paddingRight: `${t.cellPaddingX}px`,
                ...pinnedStyle,
                ...(isRowDragHandleCell ? { cursor: 'grab' } : {}),
                // per-cell background-color
                // override from the cell style editor map (last-wins
                // precedence over pinnedStyle's background). Phase
                // 99.2.1 (2026-05-31) adds text-color (`color`) axis.
                // adds 3 font axes. Phase
                // 99.2.3 (2026-06-01) adds 4 border axes
                // (`borderColor`, `borderWidth`, `borderStyle`,
                // `borderRadius`). All 9 axes independently optional
                // per cell.
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
                // 12 per-side border
                // longhand overrides. Order matters — these come
                // AFTER the all-sides shorthand spreads so the
                // browser's `style` setter applies them as
                // overrides per CSS cascade (shorthand sets 4
                // longhand defaults first; per-side longhand
                // overrides specific sides).
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
              },
              ...(isRowDragHandleCell
                ? {
                    onPointerdown: (e: PointerEvent) => {
                      onRowDragPointerDown(row.id, e);
                    },
                  }
                : cellRangeEnabled
                  ? {
                      onPointerdown: (e: PointerEvent) => {
                        onCellPointerdown(row.id, col.id, e);
                      },
                      onPointermove: (e: PointerEvent) => {
                        onCellPointermove(e);
                      },
                      onPointerup: (e: PointerEvent) => {
                        onCellPointerup(e);
                      },
                      onPointercancel: (e: PointerEvent) => {
                        onCellPointercancel(e);
                      },
                      onClickCapture: (e: MouseEvent) => {
                        onCellShiftClick(row.id, col.id, e);
                      },
                    }
                  : {}),
              // -B (2026-05-30): cell right-click intercept.
              // When `contextMenu` is configured + has items, open the
              // chronix overlay at cursor coords + suppress browser
              // native menu. When unconfigured, the handler is omitted
              // entirely so the browser's native menu surfaces.
              ...(props.contextMenu != null && props.contextMenu.items.length > 0
                ? {
                    onContextmenu: (e: MouseEvent) => {
                      onCellContextMenu(row.id, col.id, e);
                    },
                  }
                : {}),
            },
            cellChildren,
          );
        });
        // body rows are absolute-positioned children of
        // `.cx-table-body` (position: relative + explicit
        // totalBodyHeight). Sets up virtualization with no
        // refactor — virtualRowsPass only changes which rows render.
        // rows in the active selection set carry the
        // `cx-table-row--selected` modifier + `aria-selected="true"`.
        // optionally prepend / append a per-row selection
        // cell (checkbox) on the configured side.
        const isSelected = selectedRowIdsSet.value.has(row.id);
        // row-drag grip cell + modifier classes.
        const isRowDragSource = movingRowRef.value?.rowId === row.id;
        const rowDropTarget = movingRowRef.value?.dropTarget;
        const isRowDropTargetAbove =
          rowDropTarget?.targetRowId === row.id && rowDropTarget.position === 'above';
        const isRowDropTargetBelow =
          rowDropTarget?.targetRowId === row.id && rowDropTarget.position === 'below';
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
        // -C (2026-05-30): when auto-height is enabled, the
        // row's outer height becomes `min-height` so content can grow
        // beyond the initial defaultRowHeight without clipping. The
        // ResizeObserver attached via vnode hooks measures the natural
        // height + writes it back to the override map for the next
        // layout-pass invocation.
        const rowAutoHeight = props.enableRowAutoHeight === true;
        const rowStyle: Record<string, string> = {
          position: 'absolute',
          top: `${rowYs[row.id] ?? 0}px`,
          left: '0',
          width: `${totalWithRowDrag}px`,
          ...(rowAutoHeight ? { minHeight: `${rowH}px` } : { height: `${rowH}px` }),
        };
        return h(
          'div',
          {
            key: `row-${row.id}`,
            class: [
              'cx-table-row',
              isSelected && 'cx-table-row--selected',
              isRowDragSource && 'cx-table-row--moving',
              isRowDropTargetAbove && 'cx-table-row--drop-target-above',
              isRowDropTargetBelow && 'cx-table-row--drop-target-below',
              rowAutoHeight && 'cx-table-row--auto-height',
            ]
              .filter(Boolean)
              .join(' '),
            role: 'row',
            'data-row-id': row.id,
            'aria-rowindex': String(ariaRowIndexForBody(row.id)),
            'aria-selected': isSelected ? 'true' : undefined,
            style: rowStyle,
            ...(rowAutoHeight
              ? {
                  onVnodeMounted: (vnode: VNode) => {
                    const el = vnode.el;
                    if (el instanceof HTMLElement) observeRowEl(el);
                  },
                  onVnodeBeforeUnmount: (vnode: VNode) => {
                    const el = vnode.el;
                    if (el instanceof HTMLElement) unobserveRowEl(el);
                  },
                }
              : {}),
          },
          rowChildren,
        );
      });

      // split body into scrollport + virtual-content layer.
      // The outer `.cx-table-body` captures scroll + height via
      // `useTableBodyScroll`; the inner `.cx-table-body-content`
      // hosts absolute-positioned rows. Full totalBodyHeight on the
      // content layer drives the scrollbar even when only a windowed
      // subset of rows is in the DOM.
      // drag-fill handle overlay. Rendered as
      // the last child of `.cx-table-body-content` (the absolutely-
      // positioned virtualization layer) so it scrolls + lays out with
      // rows. Visible iff `cellRangeSelection === 'enabled'` AND the
      // envelope is non-empty. Position is computed from
      // `rowYByRowId[lastRow] + rowHeight(lastRow)` for top + cumulative
      // sum of `widthByColId` up to and including the envelope's last
      // col for left (plus the selection rail's width when the rail
      // sits on the left). z-index 4 keeps it above pinned cells
      // (z-index 2-3).
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
        // Center the 8×8 handle on the bottom-right corner pixel.
        return h('div', {
          class: 'cx-table-drag-fill-handle',
          'data-testid': 'cx-drag-fill-handle',
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
            // Drag-fill is an opt-in interaction; `touch-action: none`
            // prevents the browser's native scroll/pinch handling from
            // swallowing the pointer sequence on touch devices.
            touchAction: 'none',
          },
          onPointerdown: onDragFillPointerdown,
          onPointermove: onDragFillPointermove,
          onPointerup: onDragFillPointerup,
          onPointercancel: onDragFillPointercancel,
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
          onClick: onBodyContentClick,
          // dblclick is independent of click in the browser
          // event model; the SFC delegates it symmetrically to onClick.
          onDblclick: onBodyContentDblclick,
          onPointerover: onBodyContentPointerover,
          onPointerout: onBodyContentPointerout,
          // pointermove drives the cell-tooltip
          // delay timer. Delegated at the body-content layer to avoid
          // per-row listener churn during virtualization scroll.
          onPointermove: onBodyContentTooltipPointermove,
        },
        bodyContentChildren,
      );

      // build top + bottom pinned-row VNodes.
      // Pinned rows are sticky-positioned inside the body scroll
      // container; they never participate in filter / sort / page /
      // virtualization (per pinnedRowsPass + decisions A.1 + C.1).
      // Render pipeline reuses the per-cell value + class + pinned-
      // column-zone logic; pinned rows skip edit / range / drag-fill /
      // tree-chevron features (read-only summary rows per design v1).
      const topPinned = topPinnedRows.value;
      const bottomPinned = bottomPinnedRows.value;
      function buildPinnedRowVNode(
        row: RowSpec,
        position: 'top' | 'bottom',
        zoneIndex: number,
        zoneCount: number,
      ): VNode {
        const rowH = row.heightHint ?? t.rowHeight;
        // Sticky offset: stack pinned rows of the same zone by row
        // index × rowHeight. Top rows accumulate downward from `top: 0`;
        // bottom rows accumulate upward from `bottom: 0` (using the
        // reverse zone index).
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
          // Decision J.1: pinned-row × pinned-col intersection lifts
          // z-index above the per-zone defaults (2-3) so the corner
          // cell sits above all other sticky cells.
          const isPinnedCol = pinnedLeftSet.has(col.id) || pinnedRightSet.has(col.id);
          const cellZIndex = isPinnedCol ? 4 : t.pinnedRowZIndex;
          return h(
            'div',
            {
              key: `pinned-${position}-cell-${row.id}-${col.id}`,
              class: classList,
              role: 'gridcell',
              'data-col-id': col.id,
              'data-row-id': row.id,
              'aria-colindex': String(ariaColIndexFor(col.id)),
              style: {
                width: `${widths[col.id] ?? 0}px`,
                height: `${rowH}px`,
                paddingLeft: `${t.cellPaddingX}px`,
                paddingRight: `${t.cellPaddingX}px`,
                ...pinnedStyle,
                ...(pinnedStyle['position'] != null ? { zIndex: String(cellZIndex) } : {}),
              },
            },
            text,
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
            role: 'row',
            'data-row-id': row.id,
            'data-pinned-row': position,
            // top-pinned rows interleave 2..N+1
            // between header and body; bottom-pinned rows tail after body
            // (Decision A.1).
            'aria-rowindex': String(
              position === 'top' ? zoneIndex + 2 : ariaRowIndexAfterBody + zoneIndex,
            ),
            'aria-selected': isSelected ? 'true' : undefined,
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

      // loading + no-rows overlays. Loading
      // takes precedence over no-rows per Decision F.1.
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
            role: 'status',
            'aria-live': 'polite',
            'data-testid': showLoadingOverlay ? 'cx-overlay-loading' : 'cx-overlay-no-rows',
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
              zIndex: 5,
            },
          },
          [
            typeof content === 'string'
              ? h('span', { class: 'cx-table-overlay-content' }, content)
              : content,
          ],
        );
      })();

      const body: VNode = h(
        'div',
        {
          ref: (el: unknown) => {
            bodyRef.value = el as HTMLElement | null;
          },
          class: 'cx-table-body',
          role: 'rowgroup',
          // make the body focusable so Ctrl+C
          // keydown lands here. `tabIndex: 0` is the standard pattern
          // for "div that should accept keyboard input"; the role
          // (`rowgroup`) + the per-cell `gridcell` roles still
          // describe semantics correctly for screen readers.
          tabindex: 0,
          onKeydown: onBodyKeydown,
          // pointerleave on the body clears the
          // tooltip timer + popover. This catches the case where the
          // pointer exits the body through a non-cell edge (e.g., onto
          // the scrollbar or out the bottom).
          onPointerleave: onBodyTooltipPointerleave,
          // `overflowX` flips to `auto` so that
          // when the total column width exceeds the body's viewport
          // width (e.g. with pinned columns + many center columns) a
          // horizontal scrollbar appears + pinned cells' sticky
          // positioning has a scrolling ancestor to anchor against. No
          // visible change when columns fit (no scrollbar materializes).
          style: {
            overflowY: 'auto',
            overflowX: 'auto',
            position: 'relative',
          },
          // mirror body's horizontal scroll into
          // the header + filter row's `scrollLeft` so the column-aligned
          // strips track together. Imperative DOM mutation (no Vue state
          // round-trip) — scroll events fire ~60Hz and a reactive ref
          // update + render would add ~1-2ms per event. The handler is
          // additive to (not replacing) the existing vertical-scroll
          // tracking that `useTableBodyScroll` registers via
          // addEventListener — both observers run.
          onScroll: (e: Event) => {
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
            // mirror horizontal scroll into the
            // optional sticky footer so its column-aligned cells track
            // the body. Same imperative pattern as the header + filter
            // mirror above (additive; not a replacement).
            const footerEl = footerRef.value;
            if (footerEl != null && footerEl.scrollLeft !== x) {
              footerEl.scrollLeft = x;
            }
            // clear active tooltip on scroll —
            // popover coordinates were captured pre-scroll and would
            // misposition otherwise.
            onBodyTooltipScroll();
          },
        },
        [
          ...topPinnedRowNodes,
          bodyContent,
          ...bottomPinnedRowNodes,
          ...(overlayVNode != null ? [overlayVNode] : []),
        ],
      );

      // opt-in sticky footer aggregate row
      // beneath the body. Per Decision A.1, aggregators receive the
      // post-filter rows; per Decision C.1, columns without an
      // aggregator render empty placeholder cells sized to the
      // column width so the row stays column-aligned with the body +
      // header. Per-zone iteration mirrors the header strip (left
      // pinned + selection rail placeholder + center + right pinned).
      // Horizontal scroll is mirrored from the body's onScroll
      // handler via `footerRef` (additive to the header + filter
      // mirrors).
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
                // border-box keeps `width` inclusive of the horizontal
                // padding below, matching header / body cells so the
                // footer does not overflow its row width and trigger a
                // flex-shrink that would misalign aggregate cells with
                // the body.
                boxSizing: 'border-box',
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
                // Format via the column's valueFormatter (if set) or
                // the default formatter — synthesize a footer-row
                // RowSpec so a row-aware formatter still sees the
                // aggregate value through the standard CellRenderArgs
                // shape (matches valueFormatter signature
                // without introducing a footer-specific overload).
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
                  role: 'gridcell',
                  'data-col-id': col.id,
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
            // row-drag rail placeholder so the footer's aggregate
            // cells line up with the body's grip column (and the row
            // width is fully consumed, so flex no longer stretches the
            // footer cells wider than their declared column widths).
            const footerRowDragPlaceholder: VNode | null = rowDragColumnShow
              ? h('div', {
                  key: 'footer-row-drag-rail',
                  class: 'cx-table-footer-cell cx-table-row-drag-cell',
                  style: {
                    width: `${rowDragColumnWidth}px`,
                    height: `${t.footerHeight}px`,
                    background: 'var(--cx-table-row-drag-rail-bg, #f8fafc)',
                    ...rowDragRailStickyStyle,
                  },
                })
              : null;
            const orderedZoneCells: VNode[] = [...leftCells, ...centerCells, ...rightCells];
            const rowChildrenWithSelection: VNode[] = selectionColShow
              ? selectionColSide === 'left'
                ? [selectionPlaceholder!, ...orderedZoneCells]
                : [...orderedZoneCells, selectionPlaceholder!]
              : orderedZoneCells;
            const rowChildren: VNode[] = footerRowDragPlaceholder
              ? rowDragColumnSide === 'left'
                ? [footerRowDragPlaceholder, ...rowChildrenWithSelection]
                : [...rowChildrenWithSelection, footerRowDragPlaceholder]
              : rowChildrenWithSelection;
            const footerRow: VNode = h(
              'div',
              {
                class: 'cx-table-row cx-table-row--footer',
                role: 'row',
                style: { width: `${totalWithRowDrag}px` },
              },
              rowChildren,
            );
            return h(
              'div',
              {
                ref: (el: unknown) => {
                  footerRef.value = el as HTMLElement | null;
                },
                class: 'cx-table-footer',
                role: 'rowgroup',
                // `overflowX: hidden` makes the footer's
                // `scrollLeft` setter meaningful so the body's
                // onScroll mirror works (same trick as the header).
                style: { overflowX: 'hidden' },
              },
              [footerRow],
            );
          })()
        : null;

      // opt-in status bar between body and
      // pagination footer. Default content via defaultStatusBarText;
      // consumer override via `status-bar` named slot. Counts come
      // from current rows + selection + pagination state. Sticky-
      // bottom strip; sits BELOW the footer aggregate row + ABOVE
      // the pagination footer.
      const statusBar: VNode | null = props.showStatusBar
        ? (() => {
            const counts: StatusBarCounts = {
              total: props.rows.length,
              filtered: filteredRows.value.length,
              selected: selectedRowIdsSet.value.size,
              page: currentPageRef.value,
              pageSize: currentPageSizeRef.value,
            };
            // Vue 3 `slots` API: prefer the named slot when consumer
            // provided one; else fall back to defaultStatusBarText.
            const slot = ctx.slots['status-bar'];
            const inner: VNode | string =
              slot != null ? (slot({ counts }) as unknown as VNode) : defaultStatusBarText(counts);
            return h(
              'div',
              {
                class: 'cx-table-status-bar',
                role: 'status',
                'aria-live': 'polite',
                'data-testid': 'cx-status-bar',
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
              [inner],
            );
          })()
        : null;

      // opt-in pagination footer rendered
      // below the body. Layout: prev button + page info (1-based
      // for human reading) + next button on the left; rows total
      // text + page-size <select> on the right. Buttons disable at
      // boundaries; the <select> renders `pageSizeOptions` and
      // routes change events through `setPageSize`. The component
      // always exposes the pagination handle methods even when
      // this footer is suppressed (programmatic control still
      // works).
      const paginationFooter: VNode | null = props.paginationEnabled
        ? (() => {
            // Decision B.1: in serverSide+
            // paginationEnabled mode, the footer reads totals from
            // session.getTotalRowCount() / effectivePageSize / the
            // SFC's currentPageRef directly because pagePass is in
            // passthrough state (the synthesized rows ARE the page
            // slice). Client-side mode reads pagePass output as before.
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
            // Display 1-based per Decision B; empty
            // dataset shows "0 / 0" so users see the empty state.
            const humanCurrent = tp === 0 ? 0 : cp + 1;
            const humanTotal = tp;
            const prevBtn: VNode = h(
              'button',
              {
                type: 'button',
                class: 'cx-table-pagination-button cx-table-pagination-button--prev',
                'aria-label': 'Previous page',
                disabled: atFirst,
                onClick: () => {
                  if (atFirst) return;
                  applyPage(cp - 1, ps);
                },
              },
              '«',
            );
            const nextBtn: VNode = h(
              'button',
              {
                type: 'button',
                class: 'cx-table-pagination-button cx-table-pagination-button--next',
                'aria-label': 'Next page',
                disabled: atLast,
                onClick: () => {
                  if (atLast) return;
                  applyPage(cp + 1, ps);
                },
              },
              '»',
            );
            // page-number bar — replaces the
            // "第 N / M 页" info text with an ellipsis-aware
            // list of clickable page buttons. Empty for tp === 0 (no
            // pages to show; the bar collapses to just prev/next which
            // are both disabled).
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
                    'aria-hidden': 'true',
                  },
                  '…',
                );
              }
              const isCurrent = el === cp;
              return h(
                'button',
                {
                  key: `page-${el}`,
                  type: 'button',
                  class: isCurrent
                    ? 'cx-table-pagination-page cx-table-pagination-page--current'
                    : 'cx-table-pagination-page',
                  'aria-label': `Go to page ${el + 1}`,
                  'aria-current': isCurrent ? 'page' : undefined,
                  'data-page-index': String(el),
                  disabled: isCurrent,
                  onClick: () => {
                    if (isCurrent) return;
                    applyPage(el, ps);
                  },
                },
                String(el + 1),
              );
            });
            const pageInfo: VNode = h(
              'div',
              {
                class: 'cx-table-pagination-pages',
                'data-current-page': String(cp),
                'data-total-pages': String(tp),
                role: 'group',
                'aria-label': `Page ${humanCurrent} of ${humanTotal}`,
              },
              pageBarChildren,
            );
            const sizeSelect: VNode = h(
              'select',
              {
                class: 'cx-table-pagination-size-select',
                'aria-label': 'Rows per page',
                value: ps,
                onChange: (e: Event) => {
                  const target = e.target as HTMLSelectElement;
                  const nextSize = Number(target.value);
                  if (Number.isFinite(nextSize) && nextSize > 0) {
                    applyPage(currentPageRef.value, nextSize);
                  }
                },
              },
              props.pageSizeOptions.map((opt) =>
                h('option', { key: `size-${opt}`, value: opt }, `${opt} 行/页`),
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
                role: 'navigation',
                'aria-label': 'Pagination',
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
      // `theme` prop.
      const themeVars = cssVarsForTheme(t);
      // assemble wrapper children — header, optional
      // filter row, body, optional pagination footer. Filter and
      // footer are independently opt-in.
      const children: VNode[] = [header];
      if (filterRow != null) children.push(filterRow);
      children.push(body);
      if (footer != null) children.push(footer);
      if (statusBar != null) children.push(statusBar);
      if (paginationFooter != null) children.push(paginationFooter);

      // opt-in column-visibility-menu button +
      // popover. Both are absolute-positioned overlays anchored to the
      // wrapper's top-right corner. The button is always present when
      // `showColumnVisibilityMenu` is true; the popover only mounts
      // when `columnMenuOpen.value === true`. Clicking the button
      // toggles `columnMenuOpen`; outside clicks close it (registered
      // at mount via `onDocumentPointerdown`).
      if (props.showColumnVisibilityMenu) {
        const menuButton: VNode = h(
          'button',
          {
            ref: (el: unknown) => {
              columnMenuButtonRef.value = el as HTMLElement | null;
            },
            class: 'cx-table-column-menu-button',
            type: 'button',
            'aria-label': '列显隐',
            'aria-haspopup': 'menu',
            'aria-expanded': columnMenuOpen.value ? 'true' : 'false',
            'data-column-menu-open': columnMenuOpen.value ? 'true' : 'false',
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
            onClick: onColumnMenuButtonClick,
          },
          '列',
        );
        children.push(menuButton);

        if (columnMenuOpen.value) {
          // roving tabindex over the checkbox list — input is
          // the focusable element so `[data-menu-item-index]` lives on
          // the input. The popover container has `tabindex: 0` (pre-
          // Phase-84 behavior) so Tab still lands on the menu first;
          // once focus enters the menu, Arrow/Home/End cycle checkboxes.
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
                'data-col-id': col.id,
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
                  type: 'checkbox',
                  class: 'cx-table-column-menu-checkbox',
                  tabindex: isKbdActive ? 0 : -1,
                  'data-col-id': col.id,
                  'data-menu-item-index': String(idx),
                  checked: !isHidden,
                  onChange: (e: Event) => {
                    onColumnCheckboxChange(col.id, e);
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
                  type: 'button',
                  class: 'cx-table-column-menu-action cx-table-column-menu-action--show-all',
                  onClick: onShowAllColumnsClick,
                },
                '全部显示',
              ),
              h(
                'button',
                {
                  type: 'button',
                  class: 'cx-table-column-menu-action cx-table-column-menu-action--hide-all',
                  onClick: onHideAllColumnsClick,
                },
                '全部隐藏',
              ),
            ],
          );

          const popover: VNode = h(
            'div',
            {
              ref: (el: unknown) => {
                columnMenuPopoverRef.value = el as HTMLElement | null;
              },
              class: 'cx-table-column-menu-popover',
              role: 'menu',
              tabindex: 0,
              // chain existing Escape handler with the new
              // arrow-key nav from `useMenuKeyboardNav`. Both check
              // their own keys + early-return on no-match so they
              // compose without conflict.
              onKeydown: (e: KeyboardEvent) => {
                onColumnMenuKeydown(e);
                columnVisibilityMenuKbdNav.handleKeydown(e);
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
      // Rendered as an absolute-positioned 2px-wide line spanning the
      // wrapper's full vertical extent (header + filter + body +
      // pagination footer). `left` is `movingColumnRef.dropLineLeftPx`
      // (pre-computed in `applyMoveDraft` as wrapper-relative px so
      // the render does no DOM read). Only mounted when an active
      // drag has resolved to a valid drop target. The wrapper carries
      // `position: relative` via CSS so the overlay's absolute
      // coordinates resolve against the wrapper, not the document.
      if (activeMove?.dropLineLeftPx != null) {
        children.push(
          h('div', {
            class: 'cx-table-drop-line',
            'aria-hidden': 'true',
            'data-drop-target-col-id': activeMove.dropTarget?.targetColId ?? '',
            'data-drop-target-position': activeMove.dropTarget?.position ?? '',
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
      // tooltip popover. Rendered as a wrapper-
      // level child so it can escape the body's `overflow: auto`
      // clipping. Coordinates are wrapper-relative (captured at timer-
      // fire time from `cell.getBoundingClientRect() - wrapper.getBoundingClientRect()`).
      const activeTooltip = tooltipActiveRef.value;
      if (activeTooltip != null) {
        // Intentionally no `role="tooltip"` — that ARIA role requires
        // `aria-describedby` wiring from the trigger, which chronix's
        // hover-only popover does not provide. data-* attrs only.
        children.push(
          h(
            'div',
            {
              key: 'cx-table-tooltip',
              class: 'cx-table-tooltip',
              'data-testid': 'cx-tooltip',
              'data-row-id': activeTooltip.rowId,
              'data-col-id': activeTooltip.colId,
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
            activeTooltip.text,
          ),
        );
      }
      // wrapper carries `position: relative` (via inline
      // style) so the drop-line overlay's absolute coords resolve
      // against the wrapper. The CSS file can override / extend.
      const wrapperStyle: Record<string, string> = { ...themeVars, position: 'relative' };
      // off-screen live region for keyboard-
      // driven activeCell transitions. The element MUST live inside
      // the same wrapper subtree as the grid so screen readers
      // associate the announce with the grid; the visual is hidden via
      // the `cx-table-sr-announce` CSS class (clip-path 0 / abs pos).
      const liveRegion: VNode = h(
        'div',
        {
          class: 'cx-table-sr-announce',
          role: 'status',
          'aria-live': 'polite',
          'aria-atomic': 'true',
        },
        srAnnounceTextRef.value,
      );

      // wrapper-level row-drag drop-line
      // overlay. Visible iff a row-drag session is active AND a valid
      // drop target has been resolved. Position is computed during
      // `applyRowMoveDraft` via `resolveDropLineTopPx`.
      const rowDropLine: VNode | null =
        movingRowRef.value?.dropLineTopPx != null
          ? h('div', {
              class: 'cx-table-row-drop-line',
              'data-testid': 'cx-row-drop-line',
              'data-drop-target-row-id': movingRowRef.value.dropTarget?.targetRowId,
              'data-drop-target-position': movingRowRef.value.dropTarget?.position,
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

      // -B (2026-05-30): cell context menu overlay.
      // Cursor-anchored via `position: fixed` so the menu stays at
      // viewport coords (independent of any scroll). Rendered only
      // when `contextMenuPositionRef` is set + the prop has items.
      const contextMenuOverlay: VNode | null = (() => {
        const pos = contextMenuPositionRef.value;
        const cfg = props.contextMenu;
        if (pos == null || cfg == null || cfg.items.length === 0) return null;
        const ctx: ContextMenuContext = { rowId: pos.rowId, colId: pos.colId };
        const ctxMenuActiveIdx = cellContextMenuKbdNav.activeIndex.value;
        return h(
          'div',
          {
            ref: (el: unknown) => {
              cellContextMenuRef.value = el as HTMLElement | null;
            },
            class: 'cx-table-cell-context-menu',
            role: 'menu',
            'data-testid': 'cx-cell-context-menu',
            style: {
              position: 'fixed',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              zIndex: 7,
            },
            onKeydown: (e: KeyboardEvent) => cellContextMenuKbdNav.handleKeydown(e),
          },
          cfg.items.map((item: ContextMenuItem, idx: number) => {
            const isDisabled = item.disabled?.(ctx) === true;
            const isKbdActive = !isDisabled && ctxMenuActiveIdx === idx;
            return h(
              'button',
              {
                key: item.id,
                type: 'button',
                class: [
                  'cx-table-cell-context-menu-item',
                  isDisabled && 'cx-table-cell-context-menu-item--disabled',
                ]
                  .filter(Boolean)
                  .join(' '),
                role: 'menuitem',
                tabindex: isKbdActive ? 0 : -1,
                'data-item-id': item.id,
                'data-menu-item-index': String(idx),
                disabled: isDisabled,
                onClick: () => {
                  onContextMenuItemClick(item);
                },
              },
              item.icon != null ? `${item.icon} ${item.label}` : item.label,
            );
          }),
        );
      })();

      // cell style editor popover. Mounts
      // only when (a) the SFC prop `enableCellStyleEditor` is true
      // AND (b) `cellStyleEditorOpenRef` is non-null (i.e. the
      // consumer called `openCellStyleEditor`). Fixed-position
      // anchored to the cell's bounding rect. Contents: HSV square
      // (180×180) + hue strip (180×14) + RGB inputs (3×) + HEX
      // input + Apply / Clear / Cancel buttons. All 4 control
      // surfaces (square + strip + RGB + HEX) drive a single in-
      // popover HSV source of truth.
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
            /* capture may not be available in happy-dom */
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
        // Anchor below the cell; flip above only if not enough room.
        const popoverTop = anchorRect.bottom + 4;
        // tab strip — Background / Text axis switcher.
        // Active tab gets bold weight + bottom border accent; click
        // calls `switchCellStyleEditorTab` which swaps the editing
        // buffer between axes.
        const tabStrip = h(
          'div',
          {
            class: 'cx-table-cell-style-editor__tabs',
            role: 'tablist',
            'aria-label': 'Cell style axis',
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
                type: 'button',
                role: 'tab',
                class: `cx-table-cell-style-editor__tab${isActive ? ' cx-table-cell-style-editor__tab--active' : ''}`,
                'data-cx-style-tab': tab,
                'aria-selected': isActive ? 'true' : 'false',
                style: {
                  padding: '4px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                  fontSize: '12px',
                  fontWeight: isActive ? '600' : '400',
                  cursor: 'pointer',
                },
                onClick: () => switchCellStyleEditorTab(tab),
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

        // font tab widget cluster — 3
        // axis-specific controls rendered IN PLACE of the HSV
        // picker / RGB inputs / HEX input cluster when the font tab
        // is active.
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
                    type: 'button',
                    'data-cx-style-font': 'weight-bold',
                    class: `cx-table-cell-style-editor__font-btn${state.fontState.fontWeight === '700' ? ' cx-table-cell-style-editor__font-btn--active' : ''}`,
                    'aria-pressed': state.fontState.fontWeight === '700' ? 'true' : 'false',
                    style: {
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontWeight: '700',
                      background: state.fontState.fontWeight === '700' ? '#eff6ff' : '#ffffff',
                      border: '1px solid #d9dde2',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    },
                    onClick: toggleCellStyleFontWeight,
                  },
                  '加粗 (Bold)',
                ),
                // custom font-weight 9-step
                // picker in a native <details> disclosure. Collapsed by
                // default; expanding reveals a 3x3 grid of weight
                // buttons (100-900).
                h(
                  'details',
                  {
                    class: 'cx-table-cell-style-editor__font-weight-details',
                    'data-cx-style-font-weight-picker': '',
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
                        role: 'group',
                        'aria-label': 'Custom font weight',
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
                            type: 'button',
                            'data-cx-style-font': `weight-${w}`,
                            class: `cx-table-cell-style-editor__font-weight-btn${isActiveW ? ' cx-table-cell-style-editor__font-weight-btn--active' : ''}`,
                            'aria-pressed': isActiveW ? 'true' : 'false',
                            style: {
                              padding: '4px 0',
                              fontSize: '12px',
                              fontWeight: w,
                              background: isActiveW ? '#eff6ff' : '#ffffff',
                              border: '1px solid #d9dde2',
                              borderRadius: '4px',
                              cursor: 'pointer',
                            },
                            onClick: () => setCellStyleFontWeight(w),
                          },
                          w,
                        );
                      }),
                    ),
                  ],
                ),
                // variable-font weight
                // continuous range slider (single-handle) in its own
                // collapsed-by-default <details> sibling beneath the
                // 99.2.2.1 9-button grid. CSS `font-weight` accepts
                // any integer 1-1000 with variable fonts; the slider
                // covers that full range. Both widgets read/write the
                // same `fontState.fontWeight` field — clicking grid
                // weight 500 and dragging slider to 425 are equivalent
                // assignments. Inline single-handle math (Decision L.1)
                // — no new cx-kit primitive.
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
                      'data-cx-style-font-weight-slider': '',
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
                          role: 'group',
                          'aria-label': 'Variable font weight slider',
                          style: { marginTop: '6px' },
                        },
                        [
                          h(
                            'div',
                            {
                              class: 'cx-table-cell-style-editor__font-weight-slider-track',
                              'data-cx-style-font-weight-slider-track': '',
                              style: {
                                position: 'relative',
                                width: '180px',
                                height: '8px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                touchAction: 'none',
                              },
                              onPointerdown: (e: PointerEvent) => {
                                cellStyleFontWeightSliderDragRef.value = true;
                                try {
                                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                                } catch {
                                  // happy-dom / older browsers — pointer
                                  // capture optional; pointermove still
                                  // bubbles within the track.
                                }
                                applyAtPos(e);
                              },
                              onPointermove: (e: PointerEvent) => {
                                if (!cellStyleFontWeightSliderDragRef.value) return;
                                applyAtPos(e);
                              },
                              onPointerup: (e: PointerEvent) => {
                                cellStyleFontWeightSliderDragRef.value = false;
                                try {
                                  (e.currentTarget as HTMLElement).releasePointerCapture(
                                    e.pointerId,
                                  );
                                } catch {
                                  // ignore
                                }
                              },
                              onPointercancel: () => {
                                cellStyleFontWeightSliderDragRef.value = false;
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
                                'data-cx-style-font-weight-slider-thumb': '',
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
                              'data-cx-style-font-weight-slider-readout': '',
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
                    type: 'button',
                    'data-cx-style-font': 'style-italic',
                    class: `cx-table-cell-style-editor__font-btn${state.fontState.fontStyle === 'italic' ? ' cx-table-cell-style-editor__font-btn--active' : ''}`,
                    'aria-pressed': state.fontState.fontStyle === 'italic' ? 'true' : 'false',
                    style: {
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontStyle: 'italic',
                      background: state.fontState.fontStyle === 'italic' ? '#eff6ff' : '#ffffff',
                      border: '1px solid #d9dde2',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    },
                    onClick: toggleCellStyleFontStyle,
                  },
                  '斜体 (Italic)',
                ),
                h(
                  'div',
                  {
                    class: 'cx-table-cell-style-editor__deco-row',
                    role: 'group',
                    'aria-label': 'Text decoration',
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
                        type: 'button',
                        'data-cx-style-font-deco': opt.dataValue,
                        class: `cx-table-cell-style-editor__deco-btn${isActiveOpt ? ' cx-table-cell-style-editor__deco-btn--active' : ''}`,
                        'aria-pressed': isActiveOpt ? 'true' : 'false',
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
                        onClick: () => setCellStyleTextDecoration(opt.value),
                      },
                      opt.label,
                    );
                  }),
                ),
              ],
            )
          : null;

        // border tab widget cluster — 4
        // axis-specific controls (hex color input / numeric width
        // input / 4-button style segmented control / numeric radius
        // input). Rendered IN PLACE of the HSV picker cluster when
        // the border tab is active.
        // adds a 5-button segmented
        // control at the TOP ("全部 / 上 / 右 / 下 / 左") for the
        // editing target. The 3 axis widgets (color/width/style)
        // become target-aware (read effective value with fallback
        // to all-sides; write to the active target's field). The
        // radius widget hides when target !== 'all' (no CSS
        // `border-top-radius`).
        const isBorderTab = state.activeTab === 'border';
        const borderStateLocal = state.borderState;
        const borderTarget = borderStateLocal.borderSideTarget;
        // Read the effective value for the current target with
        // fallback to the all-sides default (for visual continuity:
        // switching from 'all' to 'top' shows top's effective color
        // = `borderTopColor ?? borderColor`). Captures
        // `borderStateLocal` (not `state`) so TS's null-narrowing on
        // `state` doesn't have to flow through the closure.
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
                // 5-button segmented control at the
                // top of the cluster — picks which side is being
                // edited.
                h(
                  'div',
                  {
                    class: 'cx-table-cell-style-editor__border-side-row',
                    role: 'group',
                    'aria-label': 'Border side target',
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
                        type: 'button',
                        'data-cx-style-border-side': opt.value,
                        class: `cx-table-cell-style-editor__border-side-btn${isActiveSide ? ' cx-table-cell-style-editor__border-side-btn--active' : ''}`,
                        'aria-pressed': isActiveSide ? 'true' : 'false',
                        style: {
                          flex: '1',
                          padding: '6px 4px',
                          fontSize: '12px',
                          background: isActiveSide ? '#eff6ff' : '#ffffff',
                          border: '1px solid #d9dde2',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        },
                        onClick: () => setCellStyleBorderSideTarget(opt.value),
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
                      type: 'text',
                      class: 'cx-table-cell-style-editor__border-color-input',
                      'data-cx-style-border': 'color',
                      value: borderEffectiveField('Color') ?? '',
                      placeholder: '#000000',
                      style: { flex: '1', fontSize: '12px' },
                      onInput: (e: Event) => {
                        setCellStyleBorderColor((e.target as HTMLInputElement).value);
                      },
                    }),
                  ],
                ),
                // HSV picker disclosure
                // (collapsed by default). Independent HSV widget
                // cluster bound to borderState.hsv + borderState.hex
                // via the new border-targeted helpers. Picks write to
                // the active border-side color field 's
                // borderSideTarget.
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
                    const nextHue = computeHueAtStripPosition({
                      positionPx: e.clientX - rect.left,
                      stripSizePx: rect.width,
                    });
                    const open = cellStyleEditorOpenRef.value;
                    if (open == null) return;
                    setCellStyleBorderHsv({ ...open.borderState.hsv, h: nextHue });
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
                      'data-cx-style-border-color-hsv': '',
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
                              'data-cx-style-border-square': '',
                              style: {
                                position: 'relative',
                                width: `${SQUARE_SIZE_PX}px`,
                                height: `${SQUARE_SIZE_PX}px`,
                                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${bHueOnlyHex})`,
                                cursor: 'crosshair',
                                touchAction: 'none',
                              },
                              onPointerdown: onBSquarePointerDown,
                              onPointermove: onBSquarePointerMove,
                              onPointerup: onBSquarePointerUp,
                              onPointercancel: onBSquarePointerUp,
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
                              'data-cx-style-border-hue': '',
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
                              onPointerdown: onBHuePointerDown,
                              onPointermove: onBHuePointerMove,
                              onPointerup: onBHuePointerUp,
                              onPointercancel: onBHuePointerUp,
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
                                  type: 'number',
                                  class: 'cx-table-cell-style-editor__rgb-input',
                                  'data-cx-style-border-rgb': ch,
                                  min: '0',
                                  max: '255',
                                  step: '1',
                                  value: String(bRgb[ch]),
                                  style: { width: '48px', fontSize: '12px' },
                                  onInput: (e: Event) => {
                                    setCellStyleBorderRgbChannel(
                                      ch,
                                      Number((e.target as HTMLInputElement).value),
                                    );
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
                      type: 'text',
                      class: 'cx-table-cell-style-editor__border-width-input',
                      'data-cx-style-border': 'width',
                      value: borderEffectiveField('Width') ?? '',
                      placeholder: '1px',
                      style: { flex: '1', fontSize: '12px' },
                      onInput: (e: Event) => {
                        setCellStyleBorderWidth((e.target as HTMLInputElement).value);
                      },
                    }),
                  ],
                ),
                h(
                  'div',
                  {
                    class: 'cx-table-cell-style-editor__border-style-row',
                    role: 'group',
                    'aria-label': 'Border style',
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
                        type: 'button',
                        'data-cx-style-border-style': opt.dataValue,
                        class: `cx-table-cell-style-editor__border-style-btn${isActiveOpt ? ' cx-table-cell-style-editor__border-style-btn--active' : ''}`,
                        'aria-pressed': isActiveOpt ? 'true' : 'false',
                        style: {
                          flex: '1',
                          padding: '6px 4px',
                          fontSize: '12px',
                          background: isActiveOpt ? '#eff6ff' : '#ffffff',
                          border: '1px solid #d9dde2',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        },
                        onClick: () => setCellStyleBorderStyle(opt.value),
                      },
                      opt.label,
                    );
                  }),
                ),
                // radius widget hidden when per-side
                // is selected (CSS has no `border-top-radius`).
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
                          type: 'text',
                          class: 'cx-table-cell-style-editor__border-radius-input',
                          'data-cx-style-border': 'radius',
                          value: state.borderState.borderRadius ?? '',
                          placeholder: '0px',
                          style: { flex: '1', fontSize: '12px' },
                          onInput: (e: Event) => {
                            setCellStyleBorderRadius((e.target as HTMLInputElement).value);
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
            ref: (el: unknown) => {
              cellStyleEditorPopoverRef.value = el as HTMLElement | null;
            },
            class: 'cx-table-cell-style-editor',
            'data-testid': 'cx-cell-style-editor',
            'data-row-id': state.rowId,
            'data-col-id': state.colId,
            'data-cx-style-active-tab': state.activeTab,
            role: 'dialog',
            'aria-label': 'Cell style editor',
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
                    'data-cx-style-square': '',
                    style: {
                      position: 'relative',
                      width: `${SQUARE_SIZE_PX}px`,
                      height: `${SQUARE_SIZE_PX}px`,
                      background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueOnlyHex})`,
                      cursor: 'crosshair',
                      touchAction: 'none',
                    },
                    onPointerdown: onSquarePointerDown,
                    onPointermove: onSquarePointerMove,
                    onPointerup: onSquarePointerUp,
                    onPointercancel: onSquarePointerUp,
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
                    'data-cx-style-hue': '',
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
                    onPointerdown: onHuePointerDown,
                    onPointermove: onHuePointerMove,
                    onPointerup: onHuePointerUp,
                    onPointercancel: onHuePointerUp,
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
                        type: 'number',
                        class: 'cx-table-cell-style-editor__rgb-input',
                        'data-cx-style-rgb': ch,
                        min: '0',
                        max: '255',
                        step: '1',
                        value: String(rgb[ch]),
                        style: { width: '48px', fontSize: '12px' },
                        onInput: (e: Event) => {
                          const raw = Number((e.target as HTMLInputElement).value);
                          setCellStyleEditorRgbChannel(ch, raw);
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
                      type: 'text',
                      class: 'cx-table-cell-style-editor__hex-input',
                      'data-cx-style-hex': '',
                      value: hex,
                      style: { flex: '1', fontSize: '12px' },
                      onInput: (e: Event) => {
                        setCellStyleEditorHex((e.target as HTMLInputElement).value);
                      },
                    }),
                  ],
                ),
            // preset palette row + recent
            // gated to bg / text tabs only
            // at v1. lifted the border-tab
            // carve-out — palette + recent now render on all 3 color
            // tabs (bg / text / border). Font tab still excluded
            // (variable-weight slider has its own ui).
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
                              'data-cx-style-palette-section': 'preset',
                              style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(12, 1fr)',
                                gap: '3px',
                              },
                            },
                            validPresets.map((swatchHex) =>
                              h('button', {
                                type: 'button',
                                class: 'cx-table-cell-style-editor__swatch',
                                'data-cx-style-palette-preset': swatchHex,
                                title: swatchHex,
                                'aria-label': swatchHex,
                                style: {
                                  backgroundColor: swatchHex,
                                  width: '14px',
                                  height: '14px',
                                  border: '1px solid #d1d5db',
                                  padding: '0',
                                  cursor: 'pointer',
                                },
                                onClick: () => {
                                  setCellStyleEditorHex(swatchHex);
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
                              'data-cx-style-palette-section': 'recent',
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
                                  style: { fontSize: '10px', color: '#6b7280', marginRight: '2px' },
                                },
                                '近期',
                              ),
                              ...recentCellStyleColorsRef.value.map((swatchHex) =>
                                h('button', {
                                  type: 'button',
                                  class: 'cx-table-cell-style-editor__swatch',
                                  'data-cx-style-palette-recent': swatchHex,
                                  title: swatchHex,
                                  'aria-label': swatchHex,
                                  style: {
                                    backgroundColor: swatchHex,
                                    width: '14px',
                                    height: '14px',
                                    border: '1px solid #d1d5db',
                                    padding: '0',
                                    cursor: 'pointer',
                                  },
                                  onClick: () => {
                                    setCellStyleEditorHex(swatchHex);
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
                    type: 'button',
                    class: 'cx-table-cell-style-editor__btn',
                    'data-cx-style-action': 'clear',
                    onClick: clearCellStyleForCurrentCell,
                  },
                  '清除',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'cx-table-cell-style-editor__btn',
                    'data-cx-style-action': 'cancel',
                    onClick: cancelCellStyleEditor,
                  },
                  '取消',
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    class: 'cx-table-cell-style-editor__btn',
                    'data-cx-style-action': 'apply',
                    onClick: applyCellStyleEditor,
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
          ref: (el: unknown) => {
            wrapperRef.value = el as HTMLElement | null;
          },
          class: 'cx-table-wrapper',
          role: 'grid',
          'aria-rowcount': String(ariaRowCount.value),
          'aria-colcount': String(ariaColCount.value),
          'data-table-version': '0.1.0-alpha',
          style: wrapperStyle,
          // wrapper-level pointer move/up/cancel so a row-
          // drag tracks even when the cursor leaves the grip cell.
          onPointermove: onRowDragPointerMove,
          onPointerup: onRowDragPointerUp,
          onPointercancel: onRowDragPointerCancel,
        },
        [
          ...children,
          liveRegion,
          ...(rowDropLine != null ? [rowDropLine] : []),
          ...(contextMenuOverlay != null ? [contextMenuOverlay] : []),
          ...(cellStyleEditorPopover != null ? [cellStyleEditorPopover] : []),
        ],
      );

      // wrap the existing table wrapper in a
      // horizontal flex layout when the tool-panel container is active;
      // otherwise return the wrapper directly (zero behavior change for
      // pre-Phase-80 consumers).
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
          ref: (el: unknown) => {
            toolPanelRailRef.value = el as HTMLElement | null;
          },
          class: 'cx-table-tool-panel-rail',
          role: 'tablist',
          'aria-orientation': 'vertical',
          style: { width: `${TOOL_PANEL_ICON_RAIL_WIDTH_PX}px` },
          onKeydown: (e: KeyboardEvent) => toolPanelKbdNav.handleKeydown(e),
        },
        cfg.panels.map((descriptor, idx) => {
          const isActive = descriptor.id === activeId;
          // roving tabindex — only the kbd-nav active tab is
          // in the Tab cycle; arrow keys move focus among the rest.
          const isKbdActive = toolPanelActiveIdx === idx;
          return h(
            'button',
            {
              key: descriptor.id,
              type: 'button',
              class: ['cx-table-tool-panel-icon', isActive && 'cx-table-tool-panel-icon--active']
                .filter(Boolean)
                .join(' '),
              role: 'tab',
              tabindex: isKbdActive ? 0 : -1,
              'data-tool-panel-id': descriptor.id,
              'data-menu-item-index': String(idx),
              'aria-selected': isActive ? 'true' : 'false',
              'aria-controls': `cx-table-tool-panel-content-${descriptor.id}`,
              'aria-label': descriptor.ariaLabel ?? descriptor.label,
              title: descriptor.label,
              onClick: () => {
                applyToolPanelChange(isActive ? null : descriptor.id);
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
                id: `cx-table-tool-panel-content-${activeDescriptor.id}`,
                role: 'tabpanel',
                'data-tool-panel-id': activeDescriptor.id,
                style: { width: `${containerWidth - TOOL_PANEL_ICON_RAIL_WIDTH_PX}px` },
              },
              activeDescriptor.renderer() as VNode | string | (VNode | string)[],
            )
          : null;
      const resizer = h('div', {
        class: [
          'cx-table-tool-panel-resizer',
          resizingToolPanel.value && 'cx-table-tool-panel-resizer--active',
        ]
          .filter(Boolean)
          .join(' '),
        role: 'separator',
        'aria-orientation': 'vertical',
        'data-testid': 'cx-tool-panel-resizer',
        onPointerdown: onToolPanelResizePointerdown,
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
          'data-tool-panel-side': side,
          role: 'region',
          'aria-label': 'Tool panels',
          style: { width: `${containerActualWidth}px` },
        },
        containerChildren,
      );
      return h(
        'div',
        {
          class: 'cx-table-with-tool-panel',
          'data-tool-panel-side': side,
        },
        side === 'right' ? [tableWrapper, toolPanelContainer] : [toolPanelContainer, tableWrapper],
      );
    };
  },
});

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
  createClientSideRowSource,
  deriveShiftArrowCellRange,
  findDataRegionBoundary,
  type CellValueFn,
  type DataRegionDirection,
  createColumnTable,
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
  type ParseFilterExpressionResult,
  type SetFilterSpec,
  type ChildrenLoaderArgs,
  type HeaderGroupSpan,
  type LazyChildrenState,
  type LazyChildrenStatus,
  type MutationBatch,
  type NavigationDirection,
  type MutationHistoryState,
  type PasteMutation,
  type PasteValidatorGate,
  type PinnedColsResult,
  DEFAULT_TOOL_PANEL_POPOVER_MAX_HEIGHT_PX,
  DEFAULT_TOOL_PANEL_POPOVER_WIDTH_PX,
  SETTINGS_COLUMN_SPEC,
  normalizeColumnSpec,
  type RowAction,
  type RowDataSource,
  type RowSpec,
  type RowValidator,
  type RowValidationViolation,
  type ToolPanelChangePayload,
  type ToolPanelConfig,
  type ToolPanelDescriptor,
  type ContextMenuConfig,
  type ContextMenuContext,
  type ContextMenuItem,
  type ContextMenuOpenPayload,
  type NumberFilterSpec,
  type SortSpec,
  type TextFilterSpec,
} from '@chronixjs/table';
import {
  createServerSideRowSource,
  BLOCK_KIND_IDLE,
  DEFAULT_CACHE_BLOCK_SIZE,
  DEFAULT_SERVER_SIDE_MAX_BLOCKS_IN_CACHE,
  SERVER_SIDE_SKELETON_ID_PREFIX,
  isServerSideSkeletonRowId,
  type BlockState,
  type ServerSideDataSource,
  type ServerSideRowSource,
} from '@chronixjs/table-server-side';
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
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { useMenuKeyboardNav, type MenuKeyboardNavItem } from './use-menu-keyboard-nav.js';
import { useTableBodyScroll } from './use-table-body-scroll.js';
import { useTableContainerSize } from './use-table-container-size.js';
import { useTableLayout } from './use-table-layout.js';
import { useTreeExpandState } from './use-tree-expand-state.js';

/**
 * Public imperative facade for `<ChronixTable>`. Mirrors the shape
 * of chronix-table-vue3's `TableHandle` at its form. Every
 * consumer-facing read or imperative action lives on this object,
 * exposed via React's `forwardRef` + `useImperativeHandle` pattern.
 * shipped the minimum read surface; per-feature phases
 * extend it (sort / filter / edit / selection / resize methods
 * land in their owning sub-phases mirroring vue3's progression).
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
   * + 49.1 (vue3 + 8.1 equivalent): read the current
   * ordered sort spec. Empty array = no sort. Single-column = one-entry
   * array. Multi-column = N-entry array in lex-order priority.
   * Internal-only state ownership (no controlled `sortSpec` prop —
   * Decision A.1 verbatim port; keeps the same
   * posture).
   */
  getSort(): readonly SortSpec[];
  /**
   * + 49.1: apply a sort spec. Accepts a single `SortSpec`
   * (wrapped into a one-entry array for convenience), a full ordered
   * `readonly SortSpec[]`, or `null` (cleared = empty array).
   * Silently rejects atomically when any entry's column has
   * `sortable === false` or doesn't exist.
   */
  setSort(spec: SortSpec | readonly SortSpec[] | null): void;
  /** + 49.1: convenience for `setSort(null)`. */
  clearSort(): void;
  /**
   * (vue3 equivalent): read the current ordered
   * filter spec. Empty array = no filter. Multi-column filter =
   * N-entry array with AND semantics. Internal-only state ownership.
   */
  getFilter(): readonly FilterSpec[];
  /**
   * apply a filter spec. Accepts a single `FilterSpec`
   * (wrapped into a one-entry array for convenience), a full
   * `readonly FilterSpec[]`, or `null` (cleared = empty array).
   * Silently rejects atomically when any entry's column has
   * `filterable === false` or doesn't exist.
   */
  setFilter(spec: FilterSpec | readonly FilterSpec[] | null): void;
  /** convenience for `setFilter(null)`. */
  clearFilter(): void;
  /**
   * (2026-05-29 — react port): read the active advanced
   * filter (if any). Returns `null` when the current filter spec has
   * no `ExpressionFilterSpec` entry; otherwise returns the AST plus
   * the original DSL text when applied via `parseAndSetAdvancedFilter`.
   * Verbatim port of vue3 .
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
   * render error UIs.
   */
  parseAndSetAdvancedFilter(text: string): ParseFilterExpressionResult;
  /**
   * (2026-05-29 — react port): collect the unique values
   * appearing in a given column across the table's CURRENT rows
   * (pre-filter). Drives the set-filter dropdown UI.
   * Verbatim port of vue3 .
   */
  getColumnUniqueValues(
    colId: string,
    options?: { maxValues?: number },
  ): CollectUniqueColumnValuesResult;
  /**
   * (2026-05-29 — react port): read the current quick-find
   * needle. Empty string = no quick-find active. Internal-only state
   * (no controlled `quickFindText` prop; same posture as filter / sort).
   * Verbatim port of vue3 .
   */
  getQuickFindText(): string;
  /**
   * apply a quick-find needle. Accepts a string (empty
   * string clears), `null`, or `undefined` (both coerced to `''`).
   * Triggers the `onQuickFindTextChange` callback when the needle
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
   * (vue3 equivalent): read the current selected
   * row ids in insertion order. Empty array = nothing selected.
   * Selection is orthogonal to filter / sort — row ids that are
   * filtered out remain "selected" in the underlying set.
   */
  getSelectedRowIds(): readonly string[];
  /**
   * replace the selection. `null` clears it (equivalent to
   * passing `[]`). Fires `onSelectionChange` callback on transition.
   * Does NOT validate that ids reference real rows.
   */
  setSelectedRowIds(ids: readonly string[] | null): void;
  /** convenience for `setSelectedRowIds(null)`. */
  clearSelection(): void;
  /**
   * O(1) check whether `rowId` is in the current selection.
   * Used by the SFC's per-row render to apply the
   * `cx-table-row--selected` modifier; also exposed for consumer
   * row-level conditionals.
   */
  isRowSelected(rowId: string): boolean;
  /**
   * (vue3 equivalent): read the current 0-based
   * page index. Internal-only state ownership matches sort / filter /
   * selection. Returns `0` when `showPagination` is `false` —
   * programmatic `setPage(99)` over a 3-page dataset returns `2` from
   * the next `getPage()` call (clamped to the last valid page).
   */
  getPage(): number;
  /**
   * set the 0-based page index. Triggers an `onPageChange`
   * callback on transition (no-op when target equals the current
   * page). Clamped by `pagePass`; out-of-range writes silently
   * resolve to the nearest valid page.
   */
  setPage(page: number): void;
  /**
   * read the current rows-per-page value. Returns
   * `initialPageSize` (or the latest `setPageSize` value) regardless
   * of `showPagination` so consumers can pre-seed page sizes
   * before enabling pagination.
   */
  getPageSize(): number;
  /**
   * set rows-per-page. Triggers an `onPageChange` callback
   * on transition (no-op when target equals the current pageSize).
   * If the new `pageSize` collapses the row set into fewer pages
   * than the current page index, `pagePass` clamps page to the new
   * last-valid value (no separate setPage needed).
   */
  setPageSize(pageSize: number): void;
  /**
   * read the total page count. `1` when `showPagination`
   * is `false`; `0` when paginated and the dataset is empty;
   * otherwise `Math.ceil(totalRows / pageSize)`.
   */
  getTotalPages(): number;
  /**
   * (vue3 equivalent): open the editor on a given
   * cell. No-op when the column has `editable !== true` or the row
   * doesn't exist. When a different cell is already in edit mode,
   * commits the previous one first (matches click-elsewhere blur
   * semantic). Fires `onCellEditStart` on transition.
   */
  startEditingCell(rowId: string, colId: string): void;
  /**
   * commit the in-flight edit. No-op when no edit is in
   * progress. Fires `onCellValueChange` (when draftValue differs
   * from baseValue) + `onCellEditStop {committed: true}`. Clears
   * `editingCell` state. on rejection (invalid input
   * for a `type: 'number'` column), fires `onCellEditStop
   * {committed: false}` but keeps `editingCell` set so the bad
   * input remains visible.
   */
  commitEditingCell(): void;
  /**
   * cancel the in-flight edit (revert to baseValue).
   * No-op when no edit is in progress. Fires `onCellEditStop
   * {committed: false}`. Clears `editingCell` state.
   */
  cancelEditingCell(): void;
  /**
   * read the current `editingCell` state, or `null` when
   * no edit is in progress. Consumers should treat the returned
   * object as immutable — `setEditingCellDraft` swaps in a new
   * `EditingCell` object (immutable mutation).
   */
  getEditingCell(): EditingCell | null;
  /**
   * programmatic draft-value update. No-op when no edit
   * is in progress. Does NOT fire any callback (only commit fires
   * `onCellValueChange`). Used internally by the `<input>` onChange
   * handler; consumers can also call it to seed a raw value at
   * `onCellEditStart` time.
   */
  setEditingCellDraft(value: unknown): void;
  /**
   * (vue3 equivalent): open a column-resize session
   * for `colId`. Reads the current resolved width from the latest
   * layout as the baseWidth. Silent no-op when the column doesn't
   * exist, has `resizable: false`, or another resize is already in
   * flight for the same column. Fires `onColumnResizeStart`.
   */
  startResizingColumn(colId: string): void;
  /**
   * commit the in-flight resize. No-op when no resize is in
   * progress. Fires `onColumnWidthChange` iff `draftWidth !==
   * baseWidth` (no-op dedup matches `onCellValueChange`
   * rule); always fires `onColumnResizeStop {committed: true}`.
   * Clears `resizingColumn` state.
   */
  commitColumnResize(): void;
  /**
   * cancel the in-flight resize (revert to baseWidth).
   * No-op when no resize is in progress. Fires `onColumnResizeStop
   * {committed: false}` only. No `onColumnWidthChange` callback.
   */
  cancelColumnResize(): void;
  /**
   * read the current `ColumnResizing` state, or `null` when
   * no resize is in progress. Consumers should treat the returned
   * object as immutable — every `applyResizeDraft` call swaps in a
   * new `ColumnResizing` object (immutable mutation).
   */
  getResizingColumn(): ColumnResizing | null;
  /**
   * (2026-05-26 — react port of vue3): open a
   * column-move session for `colId` programmatically. Bypasses the
   * 5px pointer-down threshold. Silent no-op when column doesn't
   * exist, is `reorderable: false`, or another move is in flight.
   * Fires `onColumnMoveStart`.
   */
  startMovingColumn(colId: string): void;
  /**
   * commit the in-flight move at `(targetColId, position)`.
   * Fires `onColumnOrderChange` iff the resulting column array differs
   * (no-op dedup); always fires `onColumnMoveStop {committed: true}`.
   * No-op when no move is in progress.
   */
  commitColumnMove(targetColId: string, position: 'before' | 'after'): void;
  /**
   * cancel the in-flight move. No-op when no move is in
   * progress. Fires `onColumnMoveStop {committed: false}`. No
   * `onColumnOrderChange` callback.
   */
  cancelColumnMove(): void;
  /**
   * read the current move state. Returns `null` when no
   * move is active.
   */
  getMovingColumn(): ColumnMoving | null;
  /** (react port). */
  startMovingRow(rowId: string): void;
  /** (react port). */
  commitRowMove(targetRowId: string, position: 'above' | 'below'): void;
  /** (react port). */
  cancelRowMove(): void;
  /** (react port). */
  getMovingRow(): RowMoving | null;
  /** (2026-05-29 — react port). Verbatim mirror of vue3. */
  refreshServerSideRows(): void;
  /**
   * (2026-05-30 — react port): partial cache invalidation.
   * Verbatim mirror of vue3 + vue2.
   */
  invalidateServerSideBlocks(blockIndices: readonly number[]): void;
  /** (2026-05-29 — react port). Verbatim mirror of vue3. */
  getServerSideTotalRowCount(): number;
  /** (2026-05-29 — react port). Verbatim mirror of vue3. */
  getServerSideBlockState(blockIndex: number): BlockState;
  /** open the settings popover with the given panel active. No-op
   * when the id doesn't exist in `props.toolPanel.panels` or when
   * `toolPanel` is not configured. Fires `tool-panel-change`.
   */
  openToolPanel(id: string): void;
  /** close the settings popover. The active panel id persists
   * so the next open resumes the same panel. Fires
   * `tool-panel-change` with `activePanelId: null`.
   */
  closeToolPanel(): void;
  /** read the currently active tool-panel id.
   * Returns `null` when the popover is closed or when
   * `toolPanel` is not configured.
   */
  getActiveToolPanelId(): string | null;
  /** -A (2026-05-30 — react port). Verbatim mirror of vue3. */
  openColumnHeaderMenu(colId: string): void;
  /** -A (2026-05-30 — react port). Verbatim mirror of vue3. */
  closeColumnHeaderMenu(): void;
  /** -A (2026-05-30 — react port). Verbatim mirror of vue3. */
  getOpenColumnHeaderMenuColId(): string | null;
  /** -B (2026-05-30 — react port). Verbatim mirror of vue3. */
  openContextMenuAt(rowId: string | null, colId: string | null, x: number, y: number): void;
  /** -B (2026-05-30 — react port). Verbatim mirror of vue3. */
  closeContextMenu(): void;
  /** -B (2026-05-30 — react port). Verbatim mirror of vue3. */
  getOpenContextMenuPosition(): {
    readonly rowId: string | null;
    readonly colId: string | null;
    readonly x: number;
    readonly y: number;
  } | null;
  /**
   * (2026-05-31 — react port): open the cell style editor
   * popover. Verbatim mirror of vue3 method. No-op when
   * `enableCellStyleEditor` SFC prop is `false`.
   */
  openCellStyleEditor(rowId: string, colId: string): void;
  /**
   * (2026-05-26 — react port of vue3): autosize a
   * single column to fit its widest cell content (and header label).
   * Measures every body cell in `pagedRows` via `Canvas.measureText`,
   * takes the max + header width, adds `theme.cellPaddingX * 2`
   * padding, and clamps to the column's `[minWidth, maxWidth]` bounds
   * via `computeAutosizeWidth`. Fires `onColumnWidthChange` iff the
   * new width differs from the current resolved width (no-op dedup
   * matches). Silent no-op when the column doesn't exist,
   * is `resizable: false` (cannot mutate width), or is
   * `autosizeable: false` (explicit opt-out).
   */
  autosizeColumn(colId: string): void;
  /**
   * autosize every visible column. Equivalent to calling
   * `autosizeColumn(id)` for each visible column id in display order
   * — fires N `onColumnWidthChange` callbacks (one per column whose
   * autosized width actually differs from its current width).
   */
  autosizeAllColumns(): void;
  /**
   * (2026-05-26 — react port of vue3): programmatically
   * open / extend / clear the cell-range. Passing a `CellRange` with
   * `focus === anchor` opens a single-cell range; with `focus !== anchor`
   * opens the range AND immediately extends focus (fires onCellRangeStart
   * + onCellRangeChange). Passing `null` is equivalent to
   * `clearCellRange()`. No-op when `cellRangeSelection !== 'enabled'`.
   */
  setCellRange(range: CellRange | null): void;
  /**
   * clear the active cell-range. Fires onCellRangeStop with
   * the last-known envelope so observers can react to the clear. No-op
   * when no range is active OR `cellRangeSelection !== 'enabled'`.
   */
  clearCellRange(): void;
  /**
   * read the current cell-range as the canonical 2-point
   * form `{anchor, focus}`. Returns `null` when no range is active.
   */
  getCellRange(): CellRange | null;
  /**
   * (2026-05-27 — react port of vue3): synthesize a
   * TSV string over the active cell-range envelope + write it to
   * `navigator.clipboard`. Mirrors the Ctrl+C keyboard path so
   * consumers can drive the same flow without a real keyboard event.
   * Returns the TSV string on success, or `null` when no range is
   * active OR `cellRangeSelection !== 'enabled'`. The
   * `navigator.clipboard.writeText` failure path (non-secure context,
   * clipboard policy block) is swallowed — the returned string + the
   * `onCellRangeCopy` callback still fire so consumers can implement
   * their own fallback.
   */
  copyCellRangeToClipboard(): Promise<string | null>;
  /**
   * (2026-05-27 — react port of vue3): read TSV
   * from `navigator.clipboard` → parse → map against active
   * cell-range envelope (1×1 fill-all + N×M clamp-overflow per
   * Decision A.1) → coerce per `column.type` via
   * `coerceEditDraftValue` → fire `onCellRangePaste` with the
   * mutations array. Mirrors the Ctrl+V keyboard path so consumers
   * can drive the same flow without a real keyboard event. Returns
   * the mutations array on success, or `null` when no range is
   * active OR `cellRangeSelection !== 'enabled'` OR the clipboard
   * read failed.
   */
  pasteCellRangeFromClipboard(): Promise<readonly PasteMutation[] | null>;
  /**
   * (2026-05-27 — react port of vue3): programmatic
   * drag-fill commit. Extends the active cell-range envelope to include
   * `targetCell` (axis-locked per Decision A.1), computes the constant-
   * fill mutations via `computeDragFillMutations`, fires `onCellRangeFill`
   * (with `jsEvent: null` for the programmatic path), and auto-extends
   * the active `cellRange` to cover the fill envelope so the post-call
   * selection matches the visible fill extent.
   *
   * Returns the mutations array on success, or `null` when no range is
   * active OR `cellRangeSelection !== 'enabled'` OR `targetCell` falls
   * outside the displayed grid OR `targetCell` is inside / above-left
   * of the source (no preview, no commit).
   */
  fillCellRange(targetCell: CellRef): readonly PasteMutation[] | null;
  /**
   * (2026-05-27 — react port of vue3): pop newest
   * `past` entry + fire `onHistoryReplay` with the REVERSED batch.
   * Returns `true` if a batch was undone, `false` on no-op or when
   * `enableUndoHistory !== true`.
   */
  undo(): boolean;
  /** pop newest `future` + fire `onHistoryReplay` with the ORIGINAL batch. */
  redo(): boolean;
  /** `true` when the next `undo()` would do something. */
  canUndo(): boolean;
  /** `true` when the next `redo()` would do something. */
  canRedo(): boolean;
  /** reset internal mutation history to `EMPTY_MUTATION_HISTORY` + fire `onHistoryChange`. */
  clearHistory(): void;
  /** read the current internal `{past, future}` state. */
  getHistory(): MutationHistoryState;
  /** manually append a custom batch to the history. No-op when `enableUndoHistory !== true`. */
  recordMutationBatch(batch: MutationBatch): void;
  /**
   * (2026-05-27 — react port of vue3): programmatic
   * equivalent of the column-visibility-menu checkbox click. Fires
   * `onColumnVisibilityChange` with `{column, hidden, jsEvent: null}`;
   * honors "at least one column visible" guard per Decision C.1.
   * Emit-only persistence per A.1.
   */
  setColumnVisibility(colId: string, hidden: boolean): void;
  /** (react port): convenience for toggling a column's `hide` state. */
  toggleColumnVisibility(colId: string): void;
  /**
   * (2026-05-28 — react port of vue3): read the
   * current keyboard-driven active cell. Returns null when no cell is
   * active.
   */
  getActiveCell(): CellRef | null;
  /**
   * (react port): programmatically set the active cell. Fires
   * `onActiveCellChange` on transition (dedup).
   */
  setActiveCell(rowId: string, colId: string): void;
  /**
   * (react port): programmatically clear the active cell.
   */
  clearActiveCell(): void;
  /**
   * (react port, 2026-05-28): programmatically expand a
   * tree row. No-op when already expanded or has no children. Fires
   * `onExpandedChange` on transition.
   */
  expandRow(rowId: string): void;
  /**
   * (react port, 2026-05-28): programmatically collapse a
   * tree row. No-op when already collapsed or has no children. Fires
   * `onExpandedChange` on transition.
   */
  collapseRow(rowId: string): void;
  /** (2026-05-28 — react port): get lazy-load status for a row. */
  getLazyChildrenState(rowId: string): LazyChildrenStatus | 'idle';
  /** (2026-05-28 — react port): get cached lazy children for a row. */
  getLazyChildren(rowId: string): readonly RowSpec[] | null;
  /** (2026-05-28 — react port): drop the lazy state entry for a row (or all rows). */
  invalidateLazyChildren(rowId?: string): void;
  /** (2026-05-28 — react port): export rows + columns to CSV via browser download. */
  exportToCsv(filename: string, options?: TableHandleExportToCsvOptions): void;
  /**
   * (2026-05-29 — react port): serialize the current rows +
   * columns into an XLSX `ArrayBuffer` and trigger a browser download.
   * Async — returns `Promise<void>` that resolves after the anchor
   * click fires. Throws when `exceljs` is not installed (optional peer
   * dep on `@chronixjs/table`).
   */
  exportToXlsx(filename: string, options?: TableHandleExportToXlsxOptions): Promise<void>;
  /**
   * (2026-05-29 — react port): produce a multi-sheet .xlsx
   * workbook in one call. Verbatim mirror of vue3 method.
   */
  exportToXlsxMultiSheet(filename: string, sheets: readonly AdapterXlsxSheetSpec[]): Promise<void>;
  /**
   * (2026-06-02 — react port): snapshot of every invalid
   * cell. Verbatim mirror of vue3 .
   */
  getInvalidCells(): readonly InvalidCellEntry[];
  /**
   * (2026-06-02 — react port): read the multi-filter
   * entry at the given path. Empty path throws.
   */
  getMultiFilterEntryAtPath(colId: string, path: readonly number[]): MultiFilterEntry | null;
  /**
   * (2026-06-02 — react port): immutable replace of the
   * multi-filter entry at the given path. Empty path throws.
   */
  setMultiFilterEntryAtPath(colId: string, path: readonly number[], next: MultiFilterEntry): void;
  /**
   * (2026-06-02 — react port): splice out the
   * multi-filter entry at the given path. Empty path throws.
   */
  removeMultiFilterEntryAtPath(colId: string, path: readonly number[]): void;
  /**
   * (2026-05-29 — react port): project the current `(columns,
   * sort, filter, page, pageSize)` state into a JSON-serializable
   * `TableViewState` snapshot. Verbatim mirror of vue3 .
   */
  getTableView(): TableViewState;
  /**
   * (2026-05-29 — react port): reconcile a saved
   * `TableViewState` against the current `columns` prop + dispatch to
   * 4 setters + invoke `onColumnsChange` once with the reconciled
   * array. Foreign / unknown `version` inputs no-op silently. Verbatim
   * mirror of vue3 .
   */
  applyTableView(state: TableViewState): void;
}

/** (2026-05-28 — react port): options for `TableHandle.exportToCsv`. */
export interface TableHandleExportToCsvOptions {
  readonly rowSource?: 'all' | 'visible' | 'filtered' | 'selected';
  readonly visibleColumnsOnly?: boolean;
  readonly csvOptions?: ExportToCsvOptions;
}

/** (2026-05-29 — react port): options for `TableHandle.exportToXlsx`. */
export interface TableHandleExportToXlsxOptions {
  readonly rowSource?: 'all' | 'visible' | 'filtered' | 'selected';
  readonly visibleColumnsOnly?: boolean;
  readonly xlsxOptions?: ExportToXlsxOptions;
}

/** (2026-05-29 — react port): per-sheet spec for `exportToXlsxMultiSheet`. */
export interface AdapterXlsxSheetSpec {
  readonly sheetName: string;
  readonly rowSource?: 'all' | 'visible' | 'filtered' | 'selected';
  readonly columnIds?: readonly string[];
  readonly includeHeaders?: boolean;
  /** (2026-05-29 — react port): per-sheet xlsx-level options (e.g. freezePane). */
  readonly xlsxOptions?: ExportToXlsxOptions;
}

/**
 * payload for the `onCellClick` callback.
 * Fires when a body cell receives a primary-button click. `value` is
 * the post-`valueGetter` cell value (the same value `valueFormatter`
 * / `cellClass` would see during render).
 */
export interface CellClickPayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly value: unknown;
  readonly jsEvent: ReactMouseEvent;
}

/** payload for the `onRowClick` callback. */
export interface RowClickPayload {
  readonly row: RowSpec;
  readonly jsEvent: ReactMouseEvent;
}

/** payload for the `onRowMouseenter` callback. */
export interface RowMouseenterPayload {
  readonly row: RowSpec;
  readonly jsEvent: ReactPointerEvent;
}

/** payload for the `onRowMouseleave` callback. */
export interface RowMouseleavePayload {
  readonly row: RowSpec;
  readonly jsEvent: ReactPointerEvent;
}

/**
 * payload for the `onHeaderClick` callback.
 * Fires when a header cell receives a primary-button click.
 */
export interface HeaderClickPayload {
  readonly column: ColumnSpec;
  readonly jsEvent: ReactMouseEvent;
}

/**
 * payload for the `onHeaderGroupClick` callback.
 * Fires when a labelled column-group cell in the second header row
 * receives a primary-button click. Empty placeholder spans (un-grouped
 * columns when ANY column declares `headerGroup`) do NOT emit — they
 * have no `data-group-name` attr for the delegate to resolve.
 * Verbatim port of vue3 `HeaderGroupClickPayload`.
 */
export interface HeaderGroupClickPayload {
  readonly groupName: string;
  readonly colIds: readonly string[];
  readonly jsEvent: ReactMouseEvent;
}

/**
 * payload for the `onEmptyAreaClick` callback. Fires
 * when a body click lands inside `.cx-table-body-content` but NOT
 * on any row (e.g., in padding when the body height exceeds
 * totalBodyHeight). Mutually exclusive with `onRowClick` /
 * `onCellClick` for the same event.
 */
export interface EmptyAreaClickPayload {
  readonly jsEvent: ReactMouseEvent;
}

/** payload for the `onCellDblclick` callback. */
export interface CellDblclickPayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly value: unknown;
  readonly jsEvent: ReactMouseEvent;
}

/** payload for the `onRowDblclick` callback. */
export interface RowDblclickPayload {
  readonly row: RowSpec;
  readonly jsEvent: ReactMouseEvent;
}

/**
 * + 49.1 (2026-05-25): payload for the `onSortChange`
 * callback. Fires every time the internal sort state transitions —
 * including transitions back to `[]` (sort cleared) and to / from a
 * multi-column lex-order arrangement. Consumers can mirror `sortSpec`
 * into external state without a controlled prop.
 */
export interface SortChangePayload {
  readonly sortSpec: readonly SortSpec[];
}

/**
 * payload for the `onFilterChange` callback.
 * Fires every time the internal filter state transitions — including
 * transitions back to `[]` (filter cleared) and per-keystroke when
 * the consumer types into a `showFilterRow` input. Consumers can
 * mirror `filterSpec` into external state without a controlled prop.
 */
export interface FilterChangePayload {
  readonly filterSpec: readonly FilterSpec[];
}

/**
 * (2026-05-29 — react port): payload for the
 * `onQuickFindTextChange` callback. Fires every time the internal
 * quick-find needle transitions — including transitions back to `''`
 * (cleared) and per-keystroke when the consumer calls
 * `setQuickFindText` from a controlled input. Consumers can mirror
 * `quickFindText` into external state without a controlled prop.
 * Verbatim port of vue3 `QuickFindTextChangePayload`.
 */
export interface QuickFindTextChangePayload {
  readonly quickFindText: string;
}

/**
 * payload for the `onSelectionChange`
 * callback. Fires every time the internal selection state
 * transitions — single select, multi-select toggle, clear,
 * programmatic setSelectedRowIds, etc. `selectedRowIds` is the full
 * current selection in insertion order (NOT a diff). The array
 * shape is JSON-serializable by design.
 */
export interface SelectionChangePayload {
  readonly selectedRowIds: readonly string[];
}

/**
 * opt-in selection column config. When
 * `show: true`, the SFC renders an independent rail of
 * `<input type="checkbox">` cells before (`side: 'left'`) or after
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
 * payload for the `onPageChange` callback.
 * Fires on every transition of the internal `(page, pageSize)` tuple
 * — `setPage`, `setPageSize`, the footer `«` / `»` buttons + size
 * `<select>` + page-number bar clicks. `page` is 0-based; `pageSize`
 * is the rows-per-page value (NOT capped to `showPagination` —
 * fires the same payload even when the footer is suppressed).
 */
export interface PageChangePayload {
  readonly page: number;
  readonly pageSize: number;
}

/**
 * (2026-05-26 — react port of vue3): payload for
 * `onCellRangeStart` — fires when a cell-range session opens
 * (pointerdown on a body cell with `cellRangeSelection === 'enabled'`
 * OR programmatic `setCellRange`). `jsEvent` is `null` for the
 * programmatic-start path.
 */
export interface CellRangeStartPayload {
  readonly range: CellRange;
  readonly jsEvent: ReactPointerEvent | null;
}

/**
 * payload for `onCellRangeChange` — fires on every pointer
 * move that resolves a NEW cell under the cursor, AND on shift+click
 * extend, AND on programmatic `setCellRange` with asymmetric anchor +
 * focus. Carries both 2-point form + resolved envelope.
 */
export interface CellRangeChangePayload {
  readonly range: CellRange;
  readonly envelope: CellRangeEnvelope;
  readonly jsEvent: ReactPointerEvent | ReactMouseEvent | null;
}

/**
 * payload for `onCellRangeStop` — fires on pointerup that
 * commits a drag-extend, on shift+click that commits, and on
 * programmatic `clearCellRange()`. Range stays in state after stop
 * until cleared or replaced.
 */
export interface CellRangeStopPayload {
  readonly range: CellRange;
  readonly envelope: CellRangeEnvelope;
  readonly jsEvent: ReactPointerEvent | ReactMouseEvent | null;
}

/**
 * (2026-05-27 — react port of vue3): payload for
 * `onCellRangePaste` — fires when the user presses Ctrl+V (Win/Linux)
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
  readonly jsEvent: ReactKeyboardEvent | null;
}

/**
 * (2026-05-27 — react port of vue3): payload for
 * `onCellRangeCopy` — fires when the user presses Ctrl+C (Win/Linux)
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
  readonly jsEvent: ReactKeyboardEvent | null;
}

/**
 * (2026-05-27 — react port of vue3): payload for
 * `onCellRangeFillStart` — fires once at pointerdown on the drag-fill
 * handle. The `source` field captures the envelope at the moment the
 * drag began; subsequent fill-change + fill callback invocations
 * reference the same source value so consumers can pair the lifecycle
 * deterministically.
 */
export interface CellRangeFillStartPayload {
  readonly source: CellRangeEnvelope;
  readonly jsEvent: ReactPointerEvent;
}

/**
 * payload for `onCellRangeFillChange` — fires on every
 * pointermove that resolves a NEW preview envelope (`fill !==
 * previous`). Used by consumers for live preview UI.
 */
export interface CellRangeFillChangePayload {
  readonly source: CellRangeEnvelope;
  readonly fill: CellRangeEnvelope;
  readonly jsEvent: ReactPointerEvent;
}

/**
 * payload for `onCellRangeFill` — fires once at pointerup
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
  readonly jsEvent: ReactPointerEvent | null;
}

/**
 * (2026-05-27 — react port of vue3): payload for
 * `onHistoryReplay` — fires when Ctrl+Z (undo) / Ctrl+Y / Ctrl+Shift+Z
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
 * SAME Map-keyed batch-write code path used for `onCellRangePaste` /
 * `onCellRangeFill` — no per-direction branching needed.
 */
export interface HistoryReplayPayload {
  readonly direction: 'undo' | 'redo';
  readonly batch: MutationBatch;
  readonly jsEvent: ReactKeyboardEvent | null;
}

/**
 * payload for `onHistoryChange` — fires every time the
 * internal `mutationHistoryRef` transitions. Consumers use this to
 * update undo / redo button-disabled states + display history counts.
 */
export interface HistoryChangePayload {
  readonly history: MutationHistoryState;
}

/**
 * in-flight edit state. `rowId` + `colId`
 * identify the cell; `baseValue` is the original value the editor
 * opened against (sourced via `getCellValue`); `draftValue` is the
 * editor `<input>.value` parsed back through `editorDraftToString`
 * for display + through `coerceEditDraftValue` at commit time
 * . Consumers MUST treat this as immutable — every
 * `applyEditDraft` call replaces the object reference.
 */
export interface EditingCell {
  readonly rowId: string;
  readonly colId: string;
  readonly baseValue: unknown;
  readonly draftValue: unknown;
}

/**
 * payload for the `onCellEditStart` callback.
 * Fires when the user (or programmatic `startEditingCell`) opens an
 * editor on an `editable: true` column's cell. `baseValue` is the
 * pre-edit cell value; `draftValue` starts at the formatted display
 * text (same text the user was reading). Consumers wanting a raw
 * value as the initial draft can call `setEditingCellDraft(rawValue)`
 * immediately inside this handler.
 */
export interface CellEditStartPayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly baseValue: unknown;
  readonly draftValue: unknown;
}

/**
 * payload for the `onCellEditStop` callback.
 * Fires on every commit-attempt resolution — success / cancel /
 * rejection. Three observable outcomes (disambiguated by combining
 * `committed` + an immediate `getEditingCell()` read after the emit):
 *
 * - Successful commit: `committed: true`, `finalValue` = coerced
 *   newValue. Followed by a `cell-value-change` emit iff
 *   `finalValue !== baseValue`. Edit session ENDS (`getEditingCell()`
 *   returns null).
 * - Cancel: `committed: false`, `finalValue` = baseValue. Edit
 *   session ENDS. No `cell-value-change` emit. `getEditingCell()`
 *   returns null.
 *.1 rejection (invalid input for a typed column —
 *   `coerceEditDraftValue` returned `{ok: false}`): `committed:
 *   false`, `finalValue` = baseValue. Edit session does NOT end —
 *   editor stays on the bad cell + draftValue is preserved in the
 *   input. No `cell-value-change` emit. `getEditingCell()` returns
 *   non-null. Consumers can render rejection feedback (e.g. a red
 *   outline) without losing the user's typed input.
 * - validator rejection: coerce succeeded
 *   but `column.validator(coercedValue, row)` returned a non-null
 *   result. `committed: false`, `finalValue` = baseValue,
 *   `validationError` populated with the normalised
 *   `EditValidationError`. Editor stays open same as the
 *   coerce-rejected case; consumers can branch on `validationError
 *   != null` for richer feedback (the SFC paints the cell with
 *   `cx-table-cell--invalid` + `data-cell-invalid="true"` +
 *   `aria-invalid="true"` regardless).
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
 * (2026-06-01 — react port): payload for the
 * `onCellEditValidationPending` callback. Verbatim mirror of vue3.
 */
export interface CellEditValidationPendingPayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly draftValue: unknown;
}

/**
 * (2026-06-02 — react port): invalid-cell record. Mirrors
 * vue3 `InvalidCellEntry` shape.
 */
export interface InvalidCellEntry {
  readonly rowId: string;
  readonly colId: string;
  readonly error: EditValidationError;
}

/**
 * (2026-06-02 — react port): payload for `onInvalidCellsChange`.
 * Verbatim mirror of vue3 .
 */
export interface InvalidCellsChangePayload {
  readonly entries: readonly InvalidCellEntry[];
  readonly count: number;
}

/**
 * (2026-06-02 — react port): args for the
 * `multiFilterChildRenderer` slot prop. Verbatim mirror of vue3
 * . Consumer's renderer returns `ReactNode | null`.
 */
export interface MultiFilterChildRendererArgs {
  readonly column: ColumnSpec;
  readonly slotIdx: number;
  readonly slotKind: 'text' | 'number' | 'set';
  /** (2026-06-02 — react port): widened to MultiFilterEntry. */
  readonly child: MultiFilterEntry;
  readonly setChildValue: (next: MultiFilterEntry) => void;
}

/**
 * (2026-06-02 — react port): payload for
 * `onAddMultiFilterSlot`. Verbatim mirror of vue3.
 *
 * (2026-06-02 — react port): extended with optional
 * `path?: readonly number[]` so group-aware consumers can route
 * the add to a nested group (Decision D.1).
 */
export interface AddMultiFilterSlotPayload {
  readonly colId: string;
  readonly slotKind: 'text' | 'number';
  readonly path?: readonly number[];
}

/**
 * (2026-06-02 — react port): payload for
 * `onRemoveMultiFilterSlot`. Verbatim mirror of vue3.
 *
 * extended with optional `path?: readonly number[]`
 * carrying the parent-group path.
 */
export interface RemoveMultiFilterSlotPayload {
  readonly colId: string;
  readonly slotIdx: number;
  readonly path?: readonly number[];
}

/**
 * (2026-06-02 — react port): payload for the NEW
 * `onAddMultiFilterGroup` callback (Decision D.1). `path` is
 * required — every group add specifies its parent-group location
 * (root = `[]`).
 */
export interface AddMultiFilterGroupPayload {
  readonly colId: string;
  readonly path: readonly number[];
}

/**
 * (2026-06-02 — react port): payload for the NEW
 * `onRemoveMultiFilterGroup` callback. `path` points at the GROUP
 * entry itself.
 */
export interface RemoveMultiFilterGroupPayload {
  readonly colId: string;
  readonly path: readonly number[];
}

/**
 * payload for the `onCellValueChange` callback.
 * Fires AFTER a successful commit iff `coerceEditDraftValue` returned
 * a value !== baseValue. `oldValue` = baseValue captured at
 * `cell-edit-start`; `newValue` is the committed (
 * coerced) draft.
 *
 * (vue3): for `column.type === 'number'`
 * columns, `newValue` is the coerced typed value (`number | null`),
 * not the raw string from the `<input>` element. Coercion happens
 * inside `applyEditCommit` via `coerceEditDraftValue` BEFORE this
 * payload is constructed.
 */
export interface CellValueChangePayload {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}

/**
 * (2026-06-01 — react port): per-cell style override
 * shape. Verbatim mirror of vue3 + vue2 `CellStyle` interface; 9
 * optional axis fields; each cell can carry any combination.
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
  // (2026-06-01 — react port): 12 per-side border
  // override fields. Verbatim mirror of vue3.
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

// (2026-06-01 — react port): internal mutable variant
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
 * (2026-06-01 — react port): built-in default for the
 * `cellStylePresetColors` SFC prop. Verbatim mirror of vue3 + vue2.
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
 * in-flight column-resize state. Created on
 * pointerdown over a header resizer (or via the imperative
 * `startResizingColumn`); updated on every pointermove (immutable
 * mutation — fresh object reference each tick); cleared on pointerup
 * (commit) or pointercancel / lostpointercapture / cancelColumnResize
 * (cancel). `null` when no resize is active. Mirrors the
 * `EditingCell` shape so the architectural pattern stays uniform
 * across write-back surfaces (edit + resize).
 */
export interface ColumnResizing {
  readonly colId: string;
  readonly baseWidth: number;
  readonly draftWidth: number;
  readonly startX: number;
  readonly pointerId: number;
}

/**
 * payload for `onColumnResizeStart`. Fires when
 * the user presses pointer on the resizer (or `startResizingColumn` is
 * invoked imperatively). `baseWidth` is the resolved pre-drag width
 * from `columnLayoutPass`. `draftWidth` initialises equal to baseWidth
 * (the first pointermove updates it).
 */
export interface ColumnResizeStartPayload {
  readonly column: ColumnSpec;
  readonly baseWidth: number;
  readonly draftWidth: number;
}

/**
 * payload for `onColumnResizeStop`. Fires on
 * every resize-session end. Two outcomes:
 *
 * - **Commit** (pointerup with a clean release / `commitColumnResize`):
 *   `committed: true`, `finalWidth: draftWidth`. Followed by an
 *   `onColumnWidthChange` callback iff `draftWidth !== baseWidth`
 *   (no-op dedup matches `onCellValueChange` rule).
 * - **Cancel** (pointercancel / lostpointercapture /
 *   `cancelColumnResize`): `committed: false`, `finalWidth: baseWidth`.
 *   No `onColumnWidthChange` callback.
 */
export interface ColumnResizeStopPayload {
  readonly column: ColumnSpec;
  readonly committed: boolean;
  readonly finalWidth: number;
}

/**
 * payload for `onColumnWidthChange`. Fires on
 * commit when `draftWidth !== baseWidth`. `oldWidth` is the pre-drag
 * resolved width; `newWidth` is the clamped (per `clampResizeWidth`)
 * committed width.
 *
 * Consumers MUST mirror this into their own `columns` state —
 * chronix-table is unopinionated about persistence and does NOT
 * mutate the `columns` prop. Typical rebuild pattern:
 * `setColumns(cs => cs.map(c => c.id === payload.column.id ? { ...c,
 * width: payload.newWidth, flex: undefined } : c))`. Clearing `flex`
 * is intentional — resizing a flex column converts it to an explicit-
 * width column so other flex columns continue to share the remaining
 * space proportionally.
 */
export interface ColumnWidthChangePayload {
  readonly column: ColumnSpec;
  readonly oldWidth: number;
  readonly newWidth: number;
}

/**
 * (2026-05-26 — react port of vue3): pending column-
 * move state, set on header-cell pointerdown and held until cursor
 * crosses 5px Chebyshev threshold (promoted to `ColumnMoving`) or
 * pointerup arrives without crossing (cleared — header click → sort
 * cycle takes over). Verbatim shape from vue3.
 */
export interface PendingColumnMove {
  readonly colId: string;
  readonly startClientX: number;
  readonly startClientY: number;
  readonly pointerId: number;
}

/**
 * in-flight column-move transaction. Created on threshold-
 * promotion. Updated on every pointermove (dropTarget + dropLineLeftPx
 * recomputed via getColumnDropTarget). Cleared on pointerup (commit) or
 * pointercancel / lostpointercapture / cancelColumnMove() (cancel).
 * Mirrors ColumnResizing shape.
 */
export interface ColumnMoving {
  readonly colId: string;
  readonly startClientX: number;
  readonly dropTarget: ColumnDropTarget | null;
  readonly dropLineLeftPx: number | null;
  readonly pointerId: number;
}

/**
 * payload for `onColumnMoveStart` callback. Fires when the
 * drag crosses the 5px threshold or `startMovingColumn` is called
 * programmatically.
 */
export interface ColumnMoveStartPayload {
  readonly column: ColumnSpec;
  readonly startClientX: number;
}

/**
 * payload for `onColumnMoveStop`. Fires on every active
 * move-session end. Commit: `committed: true`, `dropTarget` = resolved
 * target, followed by `onColumnOrderChange` iff reorder is meaningful.
 * Cancel: `committed: false`, `dropTarget` may be null, no
 * `onColumnOrderChange` callback.
 */
export interface ColumnMoveStopPayload {
  readonly column: ColumnSpec;
  readonly committed: boolean;
  readonly dropTarget: ColumnDropTarget | null;
}

/**
 * payload for `onColumnOrderChange`. Fires on commit when
 * the drag resolves to a meaningful reorder. Consumers MUST mirror by
 * passing `(movedColumn.id, targetColumn.id, position)` through
 * `computeColumnReorder` to rebuild their `columns` prop (Decision A.1
 * — emit-only persistence).
 */
export interface ColumnOrderChangePayload {
  readonly movedColumn: ColumnSpec;
  readonly targetColumn: ColumnSpec;
  readonly position: 'before' | 'after';
  readonly oldColumnIds: readonly string[];
  readonly newColumnIds: readonly string[];
}

/** (react port). Verbatim mirror of vue3 . */
export interface RowDragColumnConfig {
  readonly show: boolean;
  readonly side?: 'left' | 'right';
}

/** (react port). Verbatim mirror of vue3 . */
export interface RowDragAutoScrollConfig {
  readonly enabled?: boolean;
  readonly triggerZonePx?: number;
  readonly maxVelocityPxPerFrame?: number;
}

/** (react port). */
export interface PendingRowMove {
  readonly rowId: string;
  readonly startClientX: number;
  readonly startClientY: number;
  readonly pointerId: number;
}

/** (react port). */
export interface RowMoving {
  readonly rowId: string;
  readonly startClientY: number;
  readonly dropTarget: RowDropTarget | null;
  readonly dropLineTopPx: number | null;
  readonly pointerId: number;
}

/** (react port). */
export interface RowMoveStartPayload {
  readonly row: RowSpec;
  readonly startClientY: number;
}

/** (react port). */
export interface RowMoveStopPayload {
  readonly row: RowSpec;
  readonly committed: boolean;
  readonly dropTarget: RowDropTarget | null;
}

/** (react port). */
export interface RowOrderChangePayload {
  readonly movedRow: RowSpec;
  readonly targetRow: RowSpec;
  readonly position: 'above' | 'below';
  readonly oldRowIds: readonly string[];
  readonly newRowIds: readonly string[];
}

/**
 * (2026-05-27 — react port of vue3): payload for
 * `onColumnVisibilityChange`. Fires when the user toggles a column's
 * checkbox in the visibility menu OR a programmatic
 * `setColumnVisibility` / `toggleColumnVisibility` call runs. Carries
 * the post-toggle `hidden` value. `jsEvent` is `null` for programmatic
 * invocations and the original checkbox `change` event for user-driven
 * toggles. Emit-only persistence per A.1.
 */
export interface ColumnVisibilityChangePayload {
  readonly column: ColumnSpec;
  readonly hidden: boolean;
  readonly jsEvent: Event | null;
}

/**
 * (2026-05-29 — react port of vue3): payload for
 * `onColumnsChange` — fires once per `applyTableView()` call after the
 * saved `TableViewState` has been reconciled against the current
 * `columns` prop. Verbatim mirror of vue3 `ColumnsChangePayload`.
 */
export interface ColumnsChangePayload {
  readonly columns: readonly ColumnSpec[];
  readonly reason: 'apply-view';
}

/**
 * (2026-05-28 — react port of vue3): payload for
 * `onActiveCellChange`. Both `rowId` and `colId` are `null` together
 * when the active cell is cleared (Escape / clearActiveCell). Emit-
 * only; internal-state ownership.
 */
export interface ActiveCellChangePayload {
  readonly rowId: string | null;
  readonly colId: string | null;
  readonly jsEvent: Event | null;
}

/**
 * (react port, 2026-05-28): payload for the
 * `onExpandedChange` callback. Fires on every transition of the
 * tree-data expand state. `next` is the full ordered list of
 * expanded row IDs after the transition.
 *
 * In controlled mode (`expandedRowIds` prop set), the consumer MUST
 * handle this callback + update the prop binding for expand state to
 * take effect. In uncontrolled mode, the SFC has already applied the
 * change before invoking the callback.
 */
export interface ExpandedChangePayload {
  readonly next: readonly string[];
}

/** (2026-05-28 — react port): payload for `onLazyLoadStart`. */
export interface LazyLoadStartPayload {
  readonly parent: RowSpec;
}

/** (2026-05-28 — react port): payload for `onLazyLoadSuccess`. */
export interface LazyLoadSuccessPayload {
  readonly parent: RowSpec;
  readonly children: readonly RowSpec[];
}

/** (2026-05-28 — react port): payload for `onLazyLoadError`. */
export interface LazyLoadErrorPayload {
  readonly parent: RowSpec;
  readonly error: unknown;
}

/**
 * + 48.1: React props for `<ChronixTable>`. Mirrors the
 * chronix-table-vue3 props surface scoped + 3 + 4 + 5 +
 * 5.1 + 6 + 7; per-feature phases extend it (sort / filter /
 * selection / pagination / edit / resize props land in their owning
 * sub-phases).
 */
export interface ChronixTableProps {
  /**
   * Column definitions. Required. Pass a stable array reference
   * across renders when columns don't change — React's `useMemo`
   * inside the hooks recomputes layout on identity change.
   */
  readonly columns: readonly ColumnSpec[];
  /**
   * Row data. Required. Each row's `data` record is the source
   * for cell value extraction via `getCellValue({ row, column })`
   * (or `column.valueGetter` if provided).
   */
  readonly rows: readonly RowSpec[];
  /**
   * Partial theme override. Spread over `defaultChronixTableTheme`
   * at mount time. wires the merged theme into wrapper
   * inline CSS custom properties so descendant CSS can resolve
   * `var(--cx-table-*, fallback)`.
   */
  readonly theme?: Partial<ChronixTableTheme>;
  /**
   * Fires once on mount when the table has resolved its initial
   * layout. Payload is the imperative `TableHandle` (same object
   * exposed via the forwarded `ref`); consumers can capture it
   * without needing a `useRef` + effect round-trip.
   *
   * React equivalent of chronix-table-vue3's `table-ready` emit.
   */
  readonly onTableReady?: (handle: TableHandle) => void;
  /**
   * (vue3 equivalent): fires when a body cell
   * receives a primary-button click. Delegated via a single
   * `onClick` handler on `.cx-table-body-content`.
   */
  readonly onCellClick?: (payload: CellClickPayload) => void;
  /**
   * fires when a body row receives a primary-button
   * click. Fires for every body click within a row, even if the
   * click lands on padding (no column resolution). Mutually
   * exclusive with `onEmptyAreaClick` for the same event.
   */
  readonly onRowClick?: (payload: RowClickPayload) => void;
  /**
   * fires once per row when the pointer enters the row.
   * Intra-row child-element re-entries are suppressed via
   * `relatedTarget` comparison.
   */
  readonly onRowMouseenter?: (payload: RowMouseenterPayload) => void;
  /**
   * fires once per row when the pointer leaves the row.
   * Intra-row child-element exits are suppressed via
   * `relatedTarget` comparison.
   */
  readonly onRowMouseleave?: (payload: RowMouseleavePayload) => void;
  /**
   * (vue3 equivalent): fires when a header cell
   * receives a primary-button click.
   */
  readonly onHeaderClick?: (payload: HeaderClickPayload) => void;
  /**
   * (2026-05-27 — react port of vue3): fires when a
   * labelled column-group cell in the second header row receives a
   * click. Un-grouped placeholder cells do NOT fire.
   */
  readonly onHeaderGroupClick?: (payload: HeaderGroupClickPayload) => void;
  /**
   * fires when a body click lands inside the body
   * content layer but NOT on any row. Mutually exclusive with
   * `onRowClick` / `onCellClick` for the same event.
   */
  readonly onEmptyAreaClick?: (payload: EmptyAreaClickPayload) => void;
  /** fires on body cell double-click. */
  readonly onCellDblclick?: (payload: CellDblclickPayload) => void;
  /** fires on body row double-click. */
  readonly onRowDblclick?: (payload: RowDblclickPayload) => void;
  /**
   * + 49.1 (vue3 + 8.1 equivalent): fires when the
   * internal sort state transitions.
   */
  readonly onSortChange?: (payload: SortChangePayload) => void;
  /**
   * (vue3 equivalent): opt-in filter-input row
   * beneath the column headers. Default `false`. Programmatic
   * `setFilter` works regardless of this prop's value.
   */
  readonly showFilterRow?: boolean;
  /**
   * (2026-06-02 — react port): default mode for newly-
   * bootstrapped multi-filter specs. Verbatim mirror of vue3.
   * Default `'AND'`.
   */
  readonly multiFilterDefaultMode?: 'AND' | 'OR';
  /**
   * (2026-06-02 — react port): per-slot custom renderer.
   * Verbatim mirror of vue3 . Consumer returns a
   * `ReactNode` to replace the built-in widget for that slot, or
   * `null` to fall back to the chronix built-in. Layered on top of
   * one of the 3 declared `multiFilterChildTypes` literals.
   */
  readonly multiFilterChildRenderer?: (args: MultiFilterChildRendererArgs) => ReactNode | null;
  /**
   * (2026-06-02 — react port): cross-cell / cross-row
   * validators. Verbatim mirror of vue3 .
   */
  readonly rowValidators?: readonly RowValidator[];
  /**
   * (2026-06-02 — react port): paste / drag-fill validator
   * policy. Default `'skip-rejected'` routes mutations through
   * `runCellValidator`; `'allow-invalid'` preserves legacy behavior.
   */
  readonly pasteValidatorPolicy?: 'skip-rejected' | 'allow-invalid';
  /**
   * (2026-06-02 — react port): fires when the invalid-
   * cells map mutates. Consumer mirrors the entries into their own
   * state for summary-panel rendering.
   */
  readonly onInvalidCellsChange?: (payload: InvalidCellsChangePayload) => void;
  /**
   * (2026-05-27 — react port of vue3): opt-in
   * sticky footer aggregate row beneath the body. Default `false`.
   * When `true`, the SFC renders one footer row mirroring the body's
   * column layout + horizontal scroll, with each column's
   * `aggregator(filteredRows)` output formatted via the column's
   * `valueFormatter` (or the default formatter). Columns without an
   * `aggregator` render empty placeholder cells preserving column
   * alignment (Decision C.1). The footer aggregates the post-filter
   * rows, NOT the current page (Decision A.1).
   */
  readonly showFooterRow?: boolean;
  /**
   * (react port): fires when the user toggles a column's
   * checkbox in the visibility menu OR a programmatic
   * `setColumnVisibility` / `toggleColumnVisibility` call runs.
   */
  readonly onColumnVisibilityChange?: (payload: ColumnVisibilityChangePayload) => void;
  /**
   * (2026-05-29 — react port of vue3): fires once per
   * `applyTableView()` call after the saved `TableViewState` has been
   * reconciled against the current `columns` prop. Consumers do a
   * single `setColumns(payload.columns)` rebuild instead of N partial
   * updates from `onColumnVisibilityChange` / `onColumnWidthChange` /
   * `onColumnOrderChange`. The individual emits do NOT fire during
   * `applyTableView` (Decision F.1).
   */
  readonly onColumnsChange?: (payload: ColumnsChangePayload) => void;
  /**
   * (2026-05-28 — react port of vue3): opt-in
   * cell-level keyboard navigation. Default `false`. When `true`,
   * arrow keys / Home / End / PageUp / PageDown / Ctrl+Home /
   * Ctrl+End move an internal `activeCell` focus marker; Enter / F2
   * begin edit on the active cell (when editable); Escape clears
   * the active cell. Transitions fire `onActiveCellChange`.
   */
  readonly enableKeyboardNavigation?: boolean;
  /**
   * (react port of vue3): opt-out for keyboard-
   * driven auto-scroll. Default `true`. When the active cell moves via
   * keyboard or programmatic `setActiveCell` and lies outside the body
   * viewport, the body scrolls just enough to bring it into view
   * (pinned-zone-aware). Click-driven activeCell writes never auto-
   * scroll. Set to `false` to disable scroll without losing the nav
   * itself.
   */
  readonly enableKeyboardAutoScroll?: boolean;
  /**
   * (react port of vue3 2026-05-28): controlled
   * expanded-row IDs for tree data. When set (non-undefined), the SFC
   * is in CONTROLLED expand mode — chevron clicks fire
   * `onExpandedChange` but do NOT mutate internal state. Consumer
   * must update the prop binding to apply changes. When omitted, the
   * SFC is in UNCONTROLLED mode and seeds initial state from
   * `defaultExpandedRowIds` or `defaultExpandedDepth`.
   */
  readonly expandedRowIds?: readonly string[];
  /**
   * (react port): initial expanded-row IDs in uncontrolled
   * mode. Wins over `defaultExpandedDepth`. Consulted only at mount.
   */
  readonly defaultExpandedRowIds?: readonly string[];
  /**
   * (react port): initial expand depth in uncontrolled
   * mode (default `0` = only top-level visible).
   * `Number.POSITIVE_INFINITY` expands everything on mount.
   * Consulted only at mount.
   */
  readonly defaultExpandedDepth?: number;
  /**
   * (react port): fires when tree-data expand state
   * transitions (chevron click / Enter / Space / ArrowR / ArrowL /
   * programmatic). Payload carries the next full ordered list of
   * expanded row IDs.
   */
  readonly onExpandedChange?: (payload: ExpandedChangePayload) => void;
  /**
   * (react port): fires when the keyboard-driven active cell
   * transitions. Both `rowId` + `colId` null when cleared.
   */
  readonly onActiveCellChange?: (payload: ActiveCellChangePayload) => void;
  /**
   * (vue3 equivalent): fires when the internal
   * filter state transitions.
   */
  readonly onFilterChange?: (payload: FilterChangePayload) => void;
  /**
   * (2026-05-29 — react port): fires when the internal
   * quick-find needle transitions. Same posture as `onFilterChange` /
   * `onSortChange` — no controlled `quickFindText` prop; consumers
   * mirror the latest needle into external state through this
   * callback.
   */
  readonly onQuickFindTextChange?: (payload: QuickFindTextChangePayload) => void;
  /**
   * (vue3 equivalent): row-selection mode.
   *
   * - `'none'` (default) — row clicks don't change selection.
   * - `'single'` — plain click selects one; clicking selected deselects.
   * - `'multi'` — plain click replaces; Ctrl/Cmd+click toggles;
   *   shift+click range (when `selectionColumn.show` or anchor set).
   */
  readonly selectionMode?: 'none' | 'single' | 'multi';
  /**
   * (vue3 equivalent): opt-in selection column
   * with checkboxes + header three-state select-all. Default
   * `{ show: false, side: 'left' }`.
   */
  readonly selectionColumn?: SelectionColumnConfig;
  /** (react port). */
  readonly rowDragColumn?: RowDragColumnConfig;
  /** (react port). */
  readonly rowDragAutoScroll?: RowDragAutoScrollConfig;
  /** (react port). */
  readonly onRowMoveStart?: (payload: RowMoveStartPayload) => void;
  /** (react port). */
  readonly onRowMoveStop?: (payload: RowMoveStopPayload) => void;
  /** (react port). */
  readonly onRowOrderChange?: (payload: RowOrderChangePayload) => void;
  /**
   * (vue3 equivalent): fires when the internal
   * selection state transitions.
   */
  readonly onSelectionChange?: (payload: SelectionChangePayload) => void;
  /**
   * show the pagination cluster (right side of the footer row).
   * Default `false`. Also enables client-side pagination semantics:
   * `pagePass` slices rows into pages + the page/pageSize state drives
   * `effectivePageSize`. When `false`, internal `page` / `pageSize`
   * state is still tracked + handle methods still work + pagePass
   * becomes a passthrough - the cluster simply isn't rendered.
   *
   * Combined with `showStatusBar` (left side), both share one footer
   * row; when both are `false` the entire footer is omitted.
   */
  readonly showPagination?: boolean;
  /**
   * initial rows-per-page. Default 20. Only consulted at
   * mount; subsequent changes via `setPageSize` / the footer
   * `<select>` override.
   */
  readonly initialPageSize?: number;
  /**
   * rows-per-page options rendered in the footer `<select>`.
   * Default `[10, 20, 50, 100]`. Must include `initialPageSize` (the
   * `<select>` value would otherwise mismatch).
   */
  readonly pageSizeOptions?: readonly number[];
  /**
   * (vue3 equivalent): how many sibling pages
   * to show on either side of the current page in the page-number
   * bar. Default `1`.
   */
  readonly paginationSiblingCount?: number;
  /**
   * how many boundary pages to pin at the start + end of
   * the page-number bar. Default `1`.
   */
  readonly paginationBoundaryCount?: number;
  /**
   * fires when the internal `(page, pageSize)` state
   * transitions. Consumers can mirror into external state without a
   * controlled prop.
   */
  readonly onPageChange?: (payload: PageChangePayload) => void;
  /**
   * (vue3 equivalent): fires when an editor opens
   * on an `editable: true` column's cell (either via dblclick or via
   * programmatic `startEditingCell`).
   */
  readonly onCellEditStart?: (payload: CellEditStartPayload) => void;
  /**
   * fires on every commit-attempt resolution — successful
   * commit / cancel / rejection. See `CellEditStopPayload`
   * for the 3-outcome contract.
   */
  readonly onCellEditStop?: (payload: CellEditStopPayload) => void;
  /**
   * fires when `column.validatorAsync`
   * starts (after coerce + sync-validator pass, before final
   * resolve). The editor stays open while the promise is in flight;
   * the cell paints `cx-table-cell--validating` + `data-cell-
   * validating="true"` + `aria-busy="true"`. Followed by
   * `onCellEditStop` on final resolve.
   */
  readonly onCellEditValidationPending?: (payload: CellEditValidationPendingPayload) => void;
  /**
   * (2026-06-02 — react port): fires when the user clicks
   * `+` to add a new multi-filter slot. Verbatim mirror of vue3.
   */
  readonly onAddMultiFilterSlot?: (payload: AddMultiFilterSlotPayload) => void;
  /**
   * (2026-06-02 — react port): fires when the user clicks
   * `×` to remove a multi-filter slot. Verbatim mirror of vue3.
   */
  readonly onRemoveMultiFilterSlot?: (payload: RemoveMultiFilterSlotPayload) => void;
  /**
   * (2026-06-02 — react port): fires when the user
   * clicks `+ 添加分组` on the multi-filter UI. Path carries the
   * parent-group location (root = `[]`).
   */
  readonly onAddMultiFilterGroup?: (payload: AddMultiFilterGroupPayload) => void;
  /**
   * (2026-06-02 — react port): fires when the user
   * clicks `×` on a nested group.
   */
  readonly onRemoveMultiFilterGroup?: (payload: RemoveMultiFilterGroupPayload) => void;
  /**
   * fires AFTER a successful commit iff the committed
   * (coerced) draft value differs from the baseValue.
   * Consumers mirror this back into their `rows` array to persist
   * the edit.
   */
  readonly onCellValueChange?: (payload: CellValueChangePayload) => void;
  /**
   * (vue3 equivalent): fires when a column-resize
   * session opens — either pointerdown on the resizer or imperative
   * `startResizingColumn`.
   */
  readonly onColumnResizeStart?: (payload: ColumnResizeStartPayload) => void;
  /**
   * fires on every resize-session end — successful commit /
   * cancel. See `ColumnResizeStopPayload` for the 2-outcome contract.
   */
  readonly onColumnResizeStop?: (payload: ColumnResizeStopPayload) => void;
  /**
   * fires AFTER a successful commit iff the committed
   * (clampResizeWidth-bounded) `draftWidth` differs from the
   * pre-drag `baseWidth`. Consumers mirror this back into their
   * `columns` state to persist the resize.
   */
  readonly onColumnWidthChange?: (payload: ColumnWidthChangePayload) => void;
  /** fires when a column-move drag crosses the threshold (or programmatic start). */
  readonly onColumnMoveStart?: (payload: ColumnMoveStartPayload) => void;
  /** fires when an active column-move session ends (commit or cancel). */
  readonly onColumnMoveStop?: (payload: ColumnMoveStopPayload) => void;
  /** fires on commit when the drag resolves to a meaningful reorder (no-op dedup). */
  readonly onColumnOrderChange?: (payload: ColumnOrderChangePayload) => void;
  /**
   * (2026-05-26 — react port of vue3): opt-in
   * cell-range selection. Default `'none'` preserves all existing
   * pointer behavior. When `'enabled'`, body cells register pointer
   * handlers for drag-extend + shift+click extend; a new
   * `cx-table-cell--in-cell-range` modifier paints cells in the
   * active envelope.
   */
  readonly cellRangeSelection?: 'none' | 'enabled';
  /**
   * (2026-05-27 — react port of vue3): opt-in to
   * the internal mutation-history recorder. When `true`, every
   * onCellValueChange / onCellRangePaste / onCellRangeFill callback
   * fires is auto-recorded into a bounded `{past, future}` stack +
   * Ctrl+Z / Ctrl+Y keystrokes on the focused body element become
   * active. The 7 history-related TableHandle methods become
   * functional. Default `false` — existing consumers see no behavior
   * change.
   */
  readonly enableUndoHistory?: boolean;
  /**
   * maximum number of entries the internal `past` stack
   * retains. Default `100`. Ignored when `enableUndoHistory: false`.
   */
  readonly undoHistoryMaxDepth?: number;
  /** fires when Ctrl+Z / Ctrl+Y replays a recorded mutation batch OR programmatic `undo()` / `redo()`. */
  readonly onHistoryReplay?: (payload: HistoryReplayPayload) => void;
  /** fires whenever the internal mutation-history state transitions. */
  readonly onHistoryChange?: (payload: HistoryChangePayload) => void;
  /** fires when a cell-range session opens (pointerdown / programmatic setCellRange). */
  readonly onCellRangeStart?: (payload: CellRangeStartPayload) => void;
  /** fires on focus mutation (pointermove to a new cell / shift+click / programmatic). */
  readonly onCellRangeChange?: (payload: CellRangeChangePayload) => void;
  /** fires on commit (pointerup) and on programmatic clear. */
  readonly onCellRangeStop?: (payload: CellRangeStopPayload) => void;
  /** (2026-05-27 — react port of vue3): fires when Ctrl+C copies an active range OR `copyCellRangeToClipboard()` is invoked. */
  readonly onCellRangeCopy?: (payload: CellRangeCopyPayload) => void;
  /** (2026-05-27 — react port of vue3): fires when Ctrl+V pastes into an active range OR `pasteCellRangeFromClipboard()` is invoked. */
  readonly onCellRangePaste?: (payload: CellRangePastePayload) => void;
  /** (2026-05-27 — react port of vue3): fires once at pointerdown on the drag-fill handle. */
  readonly onCellRangeFillStart?: (payload: CellRangeFillStartPayload) => void;
  /** fires on each pointermove that resolves a new preview envelope during drag-fill. */
  readonly onCellRangeFillChange?: (payload: CellRangeFillChangePayload) => void;
  /** fires once at pointerup with the committed mutations array OR at programmatic `fillCellRange`. */
  readonly onCellRangeFill?: (payload: CellRangeFillPayload) => void;
  /**
   * (2026-05-28 — react port): paint the loading overlay over
   * the body region. Default `false`. When `true`, the overlay renders
   * with the configured `loadingOverlay` content (default `'Loading…'`)
   * + `aria-live="polite"`. Loading state takes precedence over the
   * no-rows overlay per Decision F.1.
   */
  readonly loading?: boolean;
  /**
   * (2026-05-28 — react port): content rendered inside the
   * loading overlay. Defaults to `'Loading…'`. String or ReactNode.
   */
  readonly loadingOverlay?: string | ReactNode;
  /**
   * (2026-05-28 — react port): content rendered inside the
   * no-rows overlay when `rows.length === 0` AND `loading: false`.
   * Defaults to `'No rows'`.
   */
  readonly noRowsOverlay?: string | ReactNode;
  /**
   * (2026-05-28 — react port): lazy children loader. When
   * provided AND a row carries `hasChildren: true` (without sync
   * `children`), the loader fires on first expand. Verbatim port of
   * vue3 prop.
   */
  readonly childrenLoader?: (args: ChildrenLoaderArgs) => Promise<readonly RowSpec[]>;
  /** (2026-05-28 — react port): fires synchronously when a lazy-eligible row begins loading children. */
  readonly onLazyLoadStart?: (payload: LazyLoadStartPayload) => void;
  /** (2026-05-28 — react port): fires after `childrenLoader` resolves AND the cache is committed. */
  readonly onLazyLoadSuccess?: (payload: LazyLoadSuccessPayload) => void;
  /** (2026-05-28 — react port): fires after `childrenLoader` rejects. */
  readonly onLazyLoadError?: (payload: LazyLoadErrorPayload) => void;
  /**
   * show the status area (left cluster of the footer row). Default
   * `false`. Renders the row-count summary ("共 N 行，已选 M 行，筛选
   * K 行" by default, or a custom `statusBarRenderer`). Combined with
   * `showPagination` (right cluster), both share one footer row; when
   * both are `false` the entire footer is omitted.
   */
  readonly showStatusBar?: boolean;
  /**
   * (2026-05-28 — react port): custom status bar renderer.
   * Receives the current counts; returns ReactNode to replace the
   * default text. When omitted, `defaultStatusBarText` is rendered.
   */
  readonly statusBarRenderer?: (counts: StatusBarCounts) => ReactNode;
  /**
   * (2026-05-29 — react port): override the default live-
   * region announce text. Verbatim mirror of vue3 prop.
   */
  readonly announceActiveCellText?: (args: FormatActiveCellAnnouncementInput) => string;
  /**
   * (2026-05-29 — react port): row-model selection switch.
   * Verbatim mirror of vue3 prop. Default `'clientSide'`.
   */
  readonly rowModelType?: 'clientSide' | 'serverSide';
  /**
   * (2026-05-29 — react port): consumer-supplied async
   * data source. Required when `rowModelType === 'serverSide'`.
   */
  readonly serverSideDataSource?: ServerSideDataSource;
  /**
   * (2026-05-29 — react port): per-block size. Default 100.
   */
  readonly cacheBlockSize?: number;
  /**
   * (2026-05-29 — react port): LRU cap on cached blocks.
   * Default 10.
   */
  readonly serverSideMaxBlocksInCache?: number;
  /**
   * (2026-05-31 — react port): anticipatory next-block
   * prefetch ahead of scroll direction. Verbatim mirror of vue3
   * prop. Default `0` (= disabled).
   */
  readonly serverSidePrefetchAheadBlocks?: number;
  /**
   * (2026-05-31 — react port): Set filter dropdown
   * virtualization threshold. Verbatim mirror of vue3 prop.
   * Default `100`.
   */
  readonly setFilterVirtualizeThreshold?: number;
  /**
   * (2026-05-31 — react port): opt-in Number filter range
   * slider. Verbatim mirror of vue3 prop. Default `false`.
   */
  readonly numberFilterShowRangeSlider?: boolean;
  /**
   * (2026-05-31 — react port) + (2026-05-31 —
   * react port): opt-in per-cell style editor with Background + Text
   * tabs. Verbatim mirror of vue3 prop. Default `false`.
   */
  readonly enableCellStyleEditor?: boolean;
  /**
   * (2026-06-01 — react port): controlled-mode override
   * of the cell style map. When `undefined` (default), uncontrolled
   * mode (internal state authoritative; `onCellStyleChange` fires +
   * internal map mutates). When defined (any value, including `{}`),
   * controlled mode (prop authoritative; `onCellStyleChange` fires
   * but internal map writes are skipped). Mirrors vue3 / vue2 prop.
   */
  readonly cellStyleByRowIdColId?: Record<string, Record<string, CellStyle>>;
  /**
   * (2026-06-01 — react port): preset color swatches
   * inside color tabs (background / text). Defaults to
   * `CELL_STYLE_DEFAULT_PRESET_COLORS`. Pass `[]` to disable preset row.
   */
  readonly cellStylePresetColors?: readonly string[];
  /**
   * (2026-06-01 — react port): LRU cap on the in-memory
   * recent-colors ring. Default 5. Clamped to [0, 20]. Set 0 to disable.
   */
  readonly cellStyleRecentColorsLimit?: number;
  /**
   * (2026-05-31 — react port): callback invoked when the
   * cell style editor commits Apply or Clear. (2026-05-31
   * — react port) widens `style` to support a `color` axis. Phase
   * 99.2.2 (2026-06-01 — react port) further widens to support 3
   * font axes (`fontWeight`, `fontStyle`, `textDecoration`). Phase
   * 99.2.3 (2026-06-01 — react port) further widens to support 4
   * border axes (`borderColor`, `borderWidth`, `borderStyle`,
   * `borderRadius`); font / border tab Apply emits its full cluster
   * atomically. All 9 fields optional + per-axis only.
   */
  readonly onCellStyleChange?: (payload: {
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
      // (2026-06-01 — react port): per-side border
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
  }) => void;
  /**
   * -C (2026-05-30 — react port): opt-in per-row auto-height
   * measurement. Verbatim mirror of vue3 -C prop.
   */
  readonly enableRowAutoHeight?: boolean;
  /**
   * -C (2026-05-30 — react port): optional pixel cap on
   * auto-measured row heights. Verbatim mirror of vue3 -C prop.
   */
  readonly maxRowAutoHeightPx?: number;
  /**
   * tool-panel popover config. When
   * `show: true` + non-empty `panels`, the SFC renders a settings
   * (gear) icon in the action column header. Clicking the icon
   * opens a floating popover hosting consumer-supplied tool panels
   * via each descriptor's `renderer` callback. When the action
   * column has no action buttons (`actions: []`), the header shows
   * only the settings icon (no "操作" text). Defaults to
   * `undefined` — no settings icon, no popover.
   */
  readonly toolPanel?: ToolPanelConfig;
  /**
   * (2026-05-30 — react port): fires when the active tool-
   * panel id changes (icon click / programmatic openToolPanel /
   * closeToolPanel / initialOpenId-driven mount).
   */
  readonly onToolPanelChange?: (payload: ToolPanelChangePayload) => void;
  /** -A (2026-05-30 — react port). Verbatim mirror of vue3. */
  readonly showColumnHeaderMenu?: boolean;
  /** -B (2026-05-30 — react port). Verbatim mirror of vue3. */
  readonly contextMenu?: ContextMenuConfig | null;
  /** -A (2026-05-30 — react port). Verbatim mirror of vue3. */
  readonly onColumnHeaderMenuAction?: (payload: {
    colId: string;
    action: 'sort-asc' | 'sort-desc' | 'clear-sort' | 'hide' | 'autosize';
  }) => void;
  /** -B (2026-05-30 — react port). Verbatim mirror of vue3. */
  readonly onContextMenuOpen?: (payload: ContextMenuOpenPayload) => void;
  /** -B (2026-05-30 — react port). Verbatim mirror of vue3. */
  readonly onContextMenuClose?: () => void;
}

/**
 * default for `selectionColumn` prop. Module-level constant
 * so React's prop-destructuring `= DEFAULT_SELECTION_COLUMN` gets a
 * stable reference (avoids re-running effects that depend on
 * `selectionColumn` on every render).
 */
const DEFAULT_SELECTION_COLUMN: SelectionColumnConfig = Object.freeze({
  show: false,
  side: 'left',
});

/** (react port): stable default for the rowDragColumn prop. */
const DEFAULT_ROW_DRAG_COLUMN: RowDragColumnConfig = Object.freeze({
  show: false,
  side: 'left',
});

/** stable identity for the no-sort default. */
const EMPTY_SORT_SPECS: readonly SortSpec[] = Object.freeze([]);
/** stable identity for the no-filter default. */
const EMPTY_FILTER_SPECS: readonly FilterSpec[] = Object.freeze([]);
/** stable identity for the no-selection default. */
const EMPTY_ROW_IDS: readonly string[] = Object.freeze([]);
/** (2026-05-29 — react port): stable identity for the no-rows default. */
const EMPTY_ROW_LIST: readonly RowSpec[] = Object.freeze([]);
const EMPTY_MENU_KBD_ITEMS: readonly MenuKeyboardNavItem[] = Object.freeze([]);

/**
 * stable identity for the page-size options
 * default. Frozen so React's prop-destructuring `= DEFAULT_PAGE_SIZE_OPTIONS`
 * doesn't allocate a fresh array per render (avoids re-running effects
 * that depend on `pageSizeOptions`).
 */
const DEFAULT_PAGE_SIZE_OPTIONS: readonly number[] = Object.freeze([10, 20, 50, 100]);

// (2026-05-29 — react port): visually-hidden inline style
// applied to the per-columnheader description span. Module-level
// constant so React's render path doesn't allocate a new object each
// frame. Identical to the WAI-ARIA-recommended .sr-only declaration.
const SR_ONLY_STYLE: CSSProperties = Object.freeze({
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});

/**
 * (2026-05-29 — react port): wrap matching substrings in
 * `<span class="cx-table-cell__find-match">` for quick-find visual
 * highlight. Returns the original `text` unchanged when no highlight
 * applies (empty needle / non-string cell text / column with
 * `filterable === false` / no match in this cell). Verbatim port of
 * vue3 .
 */
function renderQuickFindHighlight(
  text: string | ReactNode,
  col: ColumnSpec,
  needle: string,
): ReactNode {
  if (typeof text !== 'string') return text;
  if (needle === '' || col.filterable === false) return text;
  const segments = splitTextByQuickFindMatch(text, needle);
  if (!segments.some((s) => s.isMatch)) return text;
  return segments.map((seg, i) =>
    seg.isMatch ? (
      <span key={i} className="cx-table-cell__find-match">
        {seg.text}
      </span>
    ) : (
      <span key={i}>{seg.text}</span>
    ),
  );
}

/**
 * narrow an `unknown` draft value into a
 * displayable string for the editor `<input>.value` binding. Mirrors
 * the spirit of `defaultFormatCellValue` but always yields a string
 * (the input element requires a string value). Objects fall back to
 * `''` to avoid the `[object Object]` stringification trap (no
 * sensible round-trip back).
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
 * normalize a possibly-single / array / null input
 * to the canonical readonly array shape used internally.
 */
function normalizeSortInput(spec: SortSpec | readonly SortSpec[] | null): readonly SortSpec[] {
  if (spec == null) return [];
  if (Array.isArray(spec)) return spec as readonly SortSpec[];
  return [spec as SortSpec];
}

function normalizeFilterInput(
  spec: FilterSpec | readonly FilterSpec[] | null,
): readonly FilterSpec[] {
  if (spec == null) return [];
  if (Array.isArray(spec)) return spec as readonly FilterSpec[];
  return [spec as FilterSpec];
}

/**
 * compare two `FilterSpec`s for the dedup check in
 * `applyFilter`. Dispatches on the `type` discriminant; returns false
 * for cross-type comparisons.
 */
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

/**
 * plain-click single-column cycle. Replaces the entire
 * sort array; for the clicked column, walks `null → asc → desc →
 * null`. If the array currently holds another column (or length > 1),
 * a plain click always RESETS to single-column with the clicked
 * column at `asc`.
 */
function cycleSingleColumnSort(current: readonly SortSpec[], colId: string): readonly SortSpec[] {
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
function cycleMultiColumnSort(current: readonly SortSpec[], colId: string): readonly SortSpec[] {
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

/**
 * walk up from `event.target` to find the
 * closest ancestor that carries a `data-row-id` / `data-col-id`
 * attribute. Returns null if the click landed in body padding or
 * outside any row. Pure helper; mirrors vue3 closestAttr.
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
 * element the pointer is COMING FROM / GOING TO. When the pointer
 * moves between children of the same row, both `event.target` and
 * `event.relatedTarget` have the same closest `[data-row-id]` —
 * suppress those re-entries so `onRowMouseenter` / `onRowMouseleave`
 * fire once per row.
 */
function sameRow(a: EventTarget | null, b: EventTarget | null): boolean {
  const rowA = closestAttr(a, 'data-row-id');
  const rowB = closestAttr(b, 'data-row-id');
  return rowA != null && rowA === rowB;
}

/**
 * + 48.1 (2026-05-25): react wrapper for chronix-table.
 *
 * Renders a `<div className="cx-table-wrapper" role="grid">`
 * containing a header rowgroup + body scrollport with a virtual
 * content layer. Column widths are resolved by the core's
 * `columnLayoutPass` against the wrapper's reactive `clientWidth`
 * (observed via `ResizeObserver`). Row Y + heights are resolved by
 * `rowLayoutPass`; visible row window by `virtualRowsPass`. Cell
 * values resolve through `getCellValue` + `formatCellValue` +
 * `resolveCellClassNames`. Theme tokens emit as inline CSS custom
 * properties via `cssVarsForTheme`. 8 callback props
 * cover cell + row click/hover + header click + dblclick + empty-
 * area-click via delegated handlers on `.cx-table-body-content` +
 * `.cx-table-header`.
 *
 * Architecturally equivalent to chronix-table-vue3's SFC
 * form. React idioms replace Vue composables: `useImperativeHandle`
 * instead of `expose()`; `useEffect` instead of `onMounted`;
 * `useMemo` instead of `computed`; `forwardRef<TableHandle,
 * ChronixTableProps>` wrapping the function component instead of
 * `defineComponent`; optional callback props replace emits.
 *
 * **DOM contract (+ 48.1 — identical to vue3):**
 *
 * - `.cx-table-wrapper[role="grid"]` — outer container with theme
 *   CSS custom properties inlined via `cssVarsForTheme(mergedTheme)`;
 *   carries `data-table-version` for debugging.
 * - `.cx-table-header[role="rowgroup"]` — header rowgroup; delegates
 *   `onClick` → `onHeaderClick` callback.
 *   - `.cx-table-row.cx-table-row--header[role="row"]` — single
 *     header row.
 *     - `.cx-table-header-cell[role="columnheader"][data-col-id]`
 *       — one per visible column.
 * - `.cx-table-body[role="rowgroup"]` — body scrollport.
 *   `overflow-y: auto`. `useTableBodyScroll` observes the resolved
 *   `clientHeight` + `scrollTop` and threads them into
 *   `virtualRowsPass`.
 *   - `.cx-table-body-content` — virtual content layer.
 *     `position: relative; width: ${totalWidth}px;
 *     height: ${totalBodyHeight}px`. Delegates `onClick` /
 *     `onDoubleClick` / `onPointerOver` / `onPointerOut` to the 6
 *     body interaction callbacks. The full `totalBodyHeight` drives
 *     the scrollbar even when only a windowed subset of rows is
 *     rendered.
 *     - `.cx-table-row[role="row"][data-row-id]` — one per visible
 *       `RowSpec` (post-virtualRowsPass window + overscan).
 *       `position: absolute; top: ${rowYByRowId[id]}px; left: 0;
 *       height: ${rowHeightByRowId[id]}px`.
 *       - `.cx-table-cell[role="gridcell"][data-col-id][data-row-id]`
 *         — one per visible column. ClassName extends with
 *         `resolveCellClassNames` outputs.
 */
/**
 * helper: identity-stable empty `Set<string>` returned by
 * `dragFillPreviewSet` when no drag-fill preview is active. Verbatim
 * port of vue3's `EMPTY_PREVIEW_SET`.
 */
const EMPTY_PREVIEW_SET: ReadonlySet<string> = new Set<string>();

/**
 * (2026-05-31 — react port): hard-coded Set filter
 * checkbox row height used by `computeVirtualWindow`. Verbatim port
 * of vue3's `SET_FILTER_ITEM_HEIGHT_PX`.
 */
const SET_FILTER_ITEM_HEIGHT_PX = 28;

/**
 * (2026-05-31 — react port): fixed step for Number filter
 * range slider. Verbatim port of vue3 constant.
 */
const NUMBER_FILTER_RANGE_STEP = 1;

/**
 * helper: shallow equality on `CellRangeEnvelope` pairs.
 * Verbatim port of vue3's `sameEnvelope`. Detects identity AND value
 * equality so the drag-fill pointer flow can dedup no-op
 * `onCellRangeFillChange` callbacks + skip the post-pointerup auto-
 * extend when source === fill.
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

export const ChronixTable = forwardRef<TableHandle, ChronixTableProps>(
  function ChronixTableRender(props, ref): ReactElement {
    const {
      columns,
      rows,
      theme,
      onTableReady,
      onCellClick,
      onRowClick,
      onRowMouseenter,
      onRowMouseleave,
      onHeaderClick,
      onHeaderGroupClick,
      onEmptyAreaClick,
      onCellDblclick,
      onRowDblclick,
      onSortChange,
      showFilterRow = false,
      multiFilterDefaultMode = 'AND',
      multiFilterChildRenderer,
      rowValidators,
      pasteValidatorPolicy = 'skip-rejected',
      onInvalidCellsChange,
      showFooterRow = false,
      onColumnVisibilityChange,
      onColumnsChange,
      enableKeyboardNavigation = false,
      enableKeyboardAutoScroll = true,
      onActiveCellChange,
      expandedRowIds: controlledExpandedRowIds,
      defaultExpandedRowIds,
      defaultExpandedDepth = 0,
      onExpandedChange,
      onFilterChange,
      onQuickFindTextChange,
      selectionMode = 'none',
      selectionColumn = DEFAULT_SELECTION_COLUMN,
      rowDragColumn = DEFAULT_ROW_DRAG_COLUMN,
      rowDragAutoScroll,
      onRowMoveStart,
      onRowMoveStop,
      onRowOrderChange,
      onSelectionChange,
      showPagination = false,
      initialPageSize = 20,
      pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
      paginationSiblingCount = 1,
      paginationBoundaryCount = 1,
      onPageChange,
      onCellEditStart,
      onCellEditStop,
      onCellEditValidationPending,
      onAddMultiFilterSlot,
      onRemoveMultiFilterSlot,
      onAddMultiFilterGroup,
      onRemoveMultiFilterGroup,
      onCellValueChange,
      onColumnResizeStart,
      onColumnResizeStop,
      onColumnWidthChange,
      onColumnMoveStart,
      onColumnMoveStop,
      onColumnOrderChange,
      cellRangeSelection = 'none',
      onCellRangeStart,
      onCellRangeChange,
      onCellRangeStop,
      onCellRangeCopy,
      onCellRangePaste,
      onCellRangeFillStart,
      onCellRangeFillChange,
      onCellRangeFill,
      enableUndoHistory = false,
      undoHistoryMaxDepth = 100,
      onHistoryReplay,
      onHistoryChange,
      loading = false,
      loadingOverlay,
      noRowsOverlay,
      childrenLoader,
      onLazyLoadStart,
      onLazyLoadSuccess,
      onLazyLoadError,
      showStatusBar = false,
      statusBarRenderer,
      announceActiveCellText,
      rowModelType = 'clientSide',
      serverSideDataSource,
      cacheBlockSize = DEFAULT_CACHE_BLOCK_SIZE,
      serverSideMaxBlocksInCache = DEFAULT_SERVER_SIDE_MAX_BLOCKS_IN_CACHE,
      serverSidePrefetchAheadBlocks = 0,
      setFilterVirtualizeThreshold = 100,
      numberFilterShowRangeSlider = false,
      enableCellStyleEditor = false,
      cellStyleByRowIdColId,
      cellStylePresetColors = CELL_STYLE_DEFAULT_PRESET_COLORS,
      cellStyleRecentColorsLimit = 5,
      onCellStyleChange,
      enableRowAutoHeight = false,
      maxRowAutoHeightPx,
      toolPanel,
      onToolPanelChange,
      showColumnHeaderMenu = false,
      contextMenu = null,
      onColumnHeaderMenuAction,
      onContextMenuOpen,
      onContextMenuClose,
    } = props;

    const mergedTheme = useMemo<ChronixTableTheme>(
      () => ({
        ...defaultChronixTableTheme,
        ...(theme ?? {}),
      }),
      [theme],
    );

    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const bodyRef = useRef<HTMLDivElement | null>(null);
    // (2026-05-26 — react port of vue3): header +
    // filter row are SIBLINGS of body, so the body's `overflowX: auto`
    // scroll does NOT propagate to them. The SFC mirrors
    // `bodyScrollLeft → headerEl.scrollLeft + filterRowEl.scrollLeft`
    // via the body's `onScroll` handler so the header / filter cells
    // stay column-aligned with body cells during horizontal scroll.
    // Header + filter both carry `overflowX: hidden` inline so
    // `scrollLeft` is a meaningful programmatic offset.
    const headerRef = useRef<HTMLDivElement | null>(null);
    const filterRowRef = useRef<HTMLDivElement | null>(null);
    // (2026-05-31 — react port): per-column Set filter
    // virtualization state. Verbatim mirror of vue3 .
    const [setFilterScrollTopByColId, setSetFilterScrollTopByColId] = useState<
      Record<string, number>
    >({});
    const [setFilterViewportHeightByColId, setSetFilterViewportHeightByColId] = useState<
      Record<string, number>
    >({});
    // (2026-05-31 — react port): per-column Number filter
    // range slider drag state. Verbatim port of vue3 .
    const numberFilterRangeDragRef = useRef<Record<string, RangeHandle | null>>({});
    // (2026-05-31 — react port) + + Phase
    // 99.2.2 + (2026-06-01 — react port): per-cell style
    // override map + editor open state. Entry shape carries 9 optional
    // axes; open-state shape carries `activeTab` (literal union widened
    // to include `'font'` and `'border'`) + per-color-tab persisted hex
    // slots + `fontState` + `borderState` slots. Verbatim port of vue3
    // .
    const [internalCellStyleByRowIdColId, setInternalCellStyleByRowIdColId] = useState<
      Record<string, Record<string, CellStyleEntry>>
    >({});
    // (2026-06-01 — react port) Decision I.1: effective-
    // map read wedge. Controlled-mode prop wins. All read sites consult
    // this memo; write sites continue targeting internal state via
    // setInternalCellStyleByRowIdColId, gated behind
    // `cellStyleByRowIdColId === undefined`.
    const effectiveCellStyleByRowIdColId = useMemo<Record<string, Record<string, CellStyleEntry>>>(
      () => cellStyleByRowIdColId ?? internalCellStyleByRowIdColId,
      [cellStyleByRowIdColId, internalCellStyleByRowIdColId],
    );
    // (2026-06-01 — react port) Decision K.1: in-memory
    // recent-colors ring. Verbatim mirror of vue3.
    const [recentCellStyleColors, setRecentCellStyleColors] = useState<readonly string[]>([]);
    const pushRecentCellStyleColor = useCallback(
      (hex: string): void => {
        if (!CELL_STYLE_HEX_REGEX.test(hex)) return;
        const limit = Math.max(0, Math.min(20, cellStyleRecentColorsLimit));
        if (limit === 0) {
          setRecentCellStyleColors([]);
          return;
        }
        setRecentCellStyleColors((prev) => {
          const filtered = prev.filter((existing) => existing.toLowerCase() !== hex.toLowerCase());
          return [hex, ...filtered].slice(0, limit);
        });
      },
      [cellStyleRecentColorsLimit],
    );
    const [cellStyleEditorOpen, setCellStyleEditorOpen] = useState<{
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
        // (2026-06-01 — react port): 12 per-side
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
        // (2026-06-01 — react port): independent HSV
        // editing-buffer for the border-tab HSV picker disclosure.
        hsv: Hsv;
        hex: string;
      };
    } | null>(null);
    // Mirror ref so the document-level outside-click / Escape
    // listener (registered once via useEffect with empty deps) reads
    // the latest open state without re-subscribing.
    const cellStyleEditorOpenStateRef = useRef<typeof cellStyleEditorOpen>(null);
    cellStyleEditorOpenStateRef.current = cellStyleEditorOpen;
    const cellStyleSquareDragRef = useRef<boolean>(false);
    const cellStyleHueDragRef = useRef<boolean>(false);
    // (2026-06-01 — react port): variable-font-weight
    // slider drag state. Verbatim mirror of vue3.
    const cellStyleFontWeightSliderDragRef = useRef<boolean>(false);
    // (2026-06-01 — react port): border-tab HSV drag
    // refs. Verbatim mirror of vue3.
    const cellStyleBorderSquareDragRef = useRef<boolean>(false);
    const cellStyleBorderHueDragRef = useRef<boolean>(false);
    // (2026-05-27 — react port of vue3): column-
    // (2026-05-28 — react port of vue3): active-cell
    // focus marker for keyboard navigation. State mirror via ref so
    // the keydown useCallback can read the latest active cell without
    // re-subscribing on every render.
    const [activeCellState, setActiveCellState] = useState<CellRef | null>(null);
    // (2026-05-29 — react port): live-region announce text.
    // Verbatim mirror of vue3 wiring; updated by
    // `applyActiveCellChange` only when `announce: true` is passed.
    const [srAnnounceText, setSrAnnounceText] = useState<string>('');
    const activeCellRef = useRef<CellRef | null>(null);
    activeCellRef.current = activeCellState;
    const { clientWidth } = useTableContainerSize(wrapperRef);
    const { clientHeight: bodyClientHeight, scrollTop: bodyScrollTop } =
      useTableBodyScroll(bodyRef);

    // + 49.1 (vue3 + 8.1 equivalent): internal sort
    // state. Widened from `SortSpec | null` to `readonly SortSpec[]`
    // for multi-column sort. No controlled prop — consumers drive
    // via imperative setSort/clearSort handle methods + observe via
    // the onSortChange callback prop. `sortSpecRef` mirrors for
    // synchronous handle reads (B49.1 pattern).
    const [sortSpec, setSortSpec] = useState<readonly SortSpec[]>(EMPTY_SORT_SPECS);
    const sortSpecRef = useRef<readonly SortSpec[]>(EMPTY_SORT_SPECS);

    // (vue3 equivalent): internal filter state. Same
    // posture as sort — internal-only, imperative handle methods +
    // onFilterChange callback. Always an array; empty = no filter.
    const [filterSpec, setFilterSpec] = useState<readonly FilterSpec[]>(EMPTY_FILTER_SPECS);
    const filterSpecRef = useRef<readonly FilterSpec[]>(EMPTY_FILTER_SPECS);

    // (2026-05-29 — react port): internal quick-find text
    // state. Same posture as sort + filter — internal-only, imperative
    // handle methods + onQuickFindTextChange callback. Empty string =
    // no quick-find. Verbatim port of vue3 .
    const [quickFindText, setQuickFindTextState] = useState<string>('');
    const quickFindTextRef = useRef<string>('');

    // (vue3 equivalent): internal selection state.
    // Array shape is the API-surface canonical form (JSON-serializable).
    // Derived Set is for O(1) isRowSelected lookups during per-row
    // render — computed via useMemo so identity is stable when
    // selectedRowIds hasn't changed.
    const [selectedRowIds, setSelectedRowIds] = useState<readonly string[]>(EMPTY_ROW_IDS);
    const selectedRowIdsRef = useRef<readonly string[]>(EMPTY_ROW_IDS);
    const selectedRowIdsSet = useMemo(() => new Set(selectedRowIds), [selectedRowIds]);

    // (vue3 equivalent): selection anchor for
    // shift+click range. Updates on plain click + Ctrl/Cmd+click +
    // checkbox toggle (the "intentional" selection actions); stays
    // put on shift+click so consecutive shift+clicks re-extend from
    // the same anchor. Cleared when selection goes empty.
    const selectionAnchorRef = useRef<string | null>(null);

    // (vue3 equivalent): internal pagination state.
    // 0-based page index + rows-per-page (seeded by initialPageSize at
    // mount). useState drives re-renders; useRef mirrors hold the
    // synchronous value handle methods read so post-`setPage(...)`
    // reads observe the latest values immediately. State is tracked
    // even when `showPagination` is false — the latter only
    // controls whether pagePass receives a non-zero pageSize (the
    // passthrough state) + whether the footer renders.
    const [pageState, setPageState] = useState<number>(0);
    const pageStateRef = useRef<number>(0);
    const [pageSizeState, setPageSizeState] = useState<number>(initialPageSize);
    const pageSizeStateRef = useRef<number>(initialPageSize);

    // (vue3 equivalent): internal edit state.
    // editingCellRef is the canonical state holder (synchronous reads
    // for handle methods); editingCellState only triggers re-renders
    // when its shape changes (the per-cell render loop reads from the
    // state mirror to know which cell swaps in the <input> editor).
    // (2026-05-27 — react port of vue3): undo /
    // redo mutation history state. Hoisted ABOVE applyEditCommit /
    // performCellRangePaste / performFillCellRange so they can take
    // `recordBatchInternal` as a useCallback dep without TDZ. Per
    // Bundle J Decision B.1 — useRef only (no useState mirror); SFC
    // render has no dependency on history state; consumer subscribes
    // via `onHistoryChange` callback for UI updates (undo button
    // disabled state).
    const mutationHistoryRef = useRef<MutationHistoryState>(EMPTY_MUTATION_HISTORY);
    const nextMutationBatchIdRef = useRef<number>(0);

    /**
     * shared append-and-notify helper. Gates on
     * `enableUndoHistory`; constructs a MutationBatch via
     * `appendMutationBatch`; fires `onHistoryChange` so consumer-side
     * UI updates its disabled state. Verbatim port of vue3's
     * `recordBatchInternal` in `useCallback` form.
     */
    const recordBatchInternal = useCallback(
      (source: MutationBatch['source'], mutations: readonly PasteMutation[]): void => {
        if (!enableUndoHistory) return;
        const next = nextMutationBatchIdRef.current + 1;
        nextMutationBatchIdRef.current = next;
        const batch: MutationBatch = {
          id: `mb-${next}`,
          source,
          mutations,
          recordedAt: Date.now(),
        };
        mutationHistoryRef.current = appendMutationBatch(
          mutationHistoryRef.current,
          batch,
          undoHistoryMaxDepth,
        );
        onHistoryChange?.({ history: mutationHistoryRef.current });
      },
      [enableUndoHistory, undoHistoryMaxDepth, onHistoryChange],
    );

    /**
     * undo — pop newest `past` entry, fire
     * `onHistoryReplay` with the REVERSED batch, move original to
     * `future`. Returns true if action taken.
     */
    const performUndo = useCallback(
      (jsEvent: ReactKeyboardEvent | null): boolean => {
        if (!enableUndoHistory) return false;
        const popped = popUndoBatch(mutationHistoryRef.current);
        if (popped == null) return false;
        mutationHistoryRef.current = popped.state;
        const reversed = reverseMutationBatch(popped.batch);
        onHistoryReplay?.({ direction: 'undo', batch: reversed, jsEvent });
        onHistoryChange?.({ history: mutationHistoryRef.current });
        return true;
      },
      [enableUndoHistory, onHistoryReplay, onHistoryChange],
    );

    /**
     * redo — pop newest `future`, fire `onHistoryReplay`
     * with ORIGINAL batch.
     */
    const performRedo = useCallback(
      (jsEvent: ReactKeyboardEvent | null): boolean => {
        if (!enableUndoHistory) return false;
        const popped = popRedoBatch(mutationHistoryRef.current);
        if (popped == null) return false;
        mutationHistoryRef.current = popped.state;
        onHistoryReplay?.({ direction: 'redo', batch: popped.batch, jsEvent });
        onHistoryChange?.({ history: mutationHistoryRef.current });
        return true;
      },
      [enableUndoHistory, onHistoryReplay, onHistoryChange],
    );

    // Only one cell at a time can be in edit mode; opening an edit on
    // a different cell commits the previous one first (matches
    // click-elsewhere blur semantic).
    const editingCellRef = useRef<EditingCell | null>(null);
    const [editingCellState, setEditingCellState] = useState<EditingCell | null>(null);

    // (2026-06-01 — react port): invalid-cell marker map.
    // Keyed by `${rowId}::${colId}`. `useRef` for the synchronous-read
    // holder (consumers don't need re-render on each transition); a
    // sibling version counter `useState` (per react
    // precedent) bumps on every mutation to re-render the cell with
    // the updated class / data-attr / ARIA triple.
    const invalidCellsRef = useRef<Map<string, EditValidationError>>(new Map());
    const [, setInvalidCellsVersion] = useState<number>(0);
    const invalidCellKey = useCallback(
      (rowId: string, colId: string): string => `${rowId}::${colId}`,
      [],
    );
    const parseInvalidCellKey = useCallback((key: string): { rowId: string; colId: string } => {
      const idx = key.indexOf('::');
      return { rowId: key.slice(0, idx), colId: key.slice(idx + 2) };
    }, []);
    // (2026-06-02 — react port): invalid-cell snapshot +
    // emit helper. Verbatim mirror of vue3 .
    const snapshotInvalidCells = useCallback((): readonly InvalidCellEntry[] => {
      const entries: InvalidCellEntry[] = [];
      for (const [key, error] of invalidCellsRef.current) {
        const { rowId, colId } = parseInvalidCellKey(key);
        entries.push({ rowId, colId, error });
      }
      return Object.freeze(entries);
    }, [parseInvalidCellKey]);
    const onInvalidCellsChangeRef = useRef(onInvalidCellsChange);
    useEffect(() => {
      onInvalidCellsChangeRef.current = onInvalidCellsChange;
    }, [onInvalidCellsChange]);
    const emitInvalidCellsChange = useCallback((): void => {
      const entries = snapshotInvalidCells();
      onInvalidCellsChangeRef.current?.({ entries, count: entries.length });
    }, [snapshotInvalidCells]);
    // (2026-06-01 — react port): in-flight async-validator
    // state. `useRef` for the holder + sibling version counter for
    // reactive re-render on writes (matches + Phase
    // 100.2.2.1 react pattern). Verbatim mirror of vue3.
    interface PendingAsyncValidation {
      readonly requestId: number;
      readonly draftValue: unknown;
    }
    const pendingAsyncValidationByKeyRef = useRef<Map<string, PendingAsyncValidation>>(new Map());
    const [, setPendingAsyncValidationVersion] = useState<number>(0);
    const nextAsyncValidationRequestIdRef = useRef<number>(1);

    // (2026-06-02 — react port): reconcile invalid markers
    // for a row's cells after a commit lands. Verbatim mirror of
    // vue3. Mutates `invalidCellsRef.current` in place via Map clone;
    // caller bumps the version + emits.
    const rowValidatorsRef = useRef(rowValidators);
    useEffect(() => {
      rowValidatorsRef.current = rowValidators;
    }, [rowValidators]);
    const reconcileRowValidationsForRow = useCallback(
      (row: RowSpec): boolean => {
        const validators = rowValidatorsRef.current ?? [];
        if (validators.length === 0) return false;
        const violations = runRowValidators({ row, rowValidators: validators });
        const violationByColId = new Map<string, RowValidationViolation>();
        for (const v of violations) violationByColId.set(v.colId, v);
        const next = new Map(invalidCellsRef.current);
        let changed = false;
        for (const key of next.keys()) {
          const { rowId, colId } = parseInvalidCellKey(key);
          if (rowId !== row.id) continue;
          if (pendingAsyncValidationByKeyRef.current.has(key)) continue;
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
        if (changed) {
          invalidCellsRef.current = next;
          setInvalidCellsVersion((v) => v + 1);
        }
        return changed;
      },
      [invalidCellKey, parseInvalidCellKey],
    );
    const pasteValidatorPolicyRef = useRef(pasteValidatorPolicy);
    useEffect(() => {
      pasteValidatorPolicyRef.current = pasteValidatorPolicy;
    }, [pasteValidatorPolicy]);
    const resolvePasteValidatorGate = useCallback((): PasteValidatorGate | undefined => {
      if (pasteValidatorPolicyRef.current === 'allow-invalid') return undefined;
      return (column: ColumnSpec, value: unknown, row: RowSpec) =>
        runCellValidator({ column, value, row });
    }, []);
    // (2026-06-02 — react port): synthesize post-commit
    // row from a base row + mutations. Verbatim mirror of vue3.
    // Uses a columnTable lookup via the ref-mirror so the helper can
    // run before columnTable is declared in hook order.
    const columnsRef = useRef(columns);
    useEffect(() => {
      columnsRef.current = columns;
    }, [columns]);
    const synthesizePostCommitRow = useCallback(
      (row: RowSpec, mutations: readonly { colId: string; newValue: unknown }[]): RowSpec => {
        if (mutations.length === 0) return row;
        const data: Record<string, unknown> = {
          ...(row.data ?? {}),
        };
        for (const m of mutations) {
          const column = columnsRef.current.find((c) => c.id === m.colId);
          const field = column?.field ?? m.colId;
          data[field] = m.newValue;
        }
        return { ...row, data };
      },
      [],
    );
    // (2026-06-02 — react port): after a paste/drag-fill
    // mutation batch lands, run `rowValidators` against each affected
    // row's post-commit state. Verbatim mirror of vue3. Looks up
    // post-batch rows via a rowsRef (rowDataSource isn't yet declared
    // at this hook order; the ref-mirror sidesteps TDZ).
    const rowsRef = useRef(rows);
    useEffect(() => {
      rowsRef.current = rows;
    }, [rows]);
    const runPostBatchRowValidations = useCallback(
      (mutations: readonly PasteMutation[]): void => {
        if ((rowValidatorsRef.current?.length ?? 0) === 0) return;
        const rowsById = new Map<string, RowSpec>();
        for (const r of rowsRef.current) rowsById.set(r.id, r);
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
          const row = rowsById.get(rowId);
          if (row == null) continue;
          const postCommitRow = synthesizePostCommitRow(row, rowMutations);
          if (reconcileRowValidationsForRow(postCommitRow)) invalidCellsChanged = true;
        }
        if (invalidCellsChanged) emitInvalidCellsChange();
      },
      [reconcileRowValidationsForRow, synthesizePostCommitRow, emitInvalidCellsChange],
    );

    // (2026-05-28 — react port): tooltip state. Verbatim port
    // of vue3 wiring — single setTimeout-driven delay, state
    // captured at fire time, cleared on pointerleave / scroll / edit /
    // range-drag.
    const tooltipPendingCellRef = useRef<CellRef | null>(null);
    const tooltipTimerIdRef = useRef<number | null>(null);
    const [tooltipActive, setTooltipActive] = useState<{
      readonly rowId: string;
      readonly colId: string;
      readonly text: string;
      readonly x: number;
      readonly y: number;
    } | null>(null);

    // guards the editor `<input>` blur handler from double-
    // firing commit / cancel when Enter / Tab / Esc keydown handler
    // already explicitly committed / cancelled. The keydown handler
    // sets this true before calling commit/cancel; blur reads it +
    // skips.
    const editCommitInProgressRef = useRef<boolean>(false);

    // (vue3 equivalent): internal column-resize
    // transaction. `resizingColumnRef` is the canonical synchronous-
    // read holder (used by handle methods + pointermove gate);
    // `resizingColumnState` is the render-trigger mirror (consumed by
    // `columnsForLayout` so the layout pipeline re-derives on every
    // pointermove tick). Same pattern as editingCellRef +
    // editingCellState.
    const resizingColumnRef = useRef<ColumnResizing | null>(null);
    const [resizingColumnState, setResizingColumnState] = useState<ColumnResizing | null>(null);

    // guards `onPointerCancel` + `onLostPointerCapture`
    // handlers from firing a redundant cancel when an explicit
    // pointerup commit is in progress. Mirrors
    // editCommitInProgressRef; reset deferred to `queueMicrotask`
    // to absorb the async `lostpointercapture` that fires AFTER
    // pointerup releases the capture.
    const resizeCommitInProgressRef = useRef<boolean>(false);

    // (2026-05-26 — react port of vue3): two-stage
    // column-move state. `pendingMoveColumnRef` is set on header-cell
    // pointerdown but the drag is NOT active until cursor crosses 5px
    // Chebyshev (then pending is cleared + movingColumnRef +
    // movingColumnState are set + onColumnMoveStart fires). If
    // pointerup arrives while still pending, the header click → sort
    // cycle fires normally. `movingColumnRef` is the canonical
    // synchronous-read holder (used by handle + pointermove gate);
    // `movingColumnState` is the render-trigger mirror (consumed by
    // render for drop-line + modifier classes). Same useRef-canonical-
    // + useState-mirror pattern as ColumnResizing.
    const pendingMoveColumnRef = useRef<PendingColumnMove | null>(null);
    const movingColumnRef = useRef<ColumnMoving | null>(null);
    const [movingColumnState, setMovingColumnState] = useState<ColumnMoving | null>(null);
    // mirrors resizeCommitInProgressRef.
    const moveCommitInProgressRef = useRef<boolean>(false);

    // (react port): pending + in-flight row-drag state. Same
    // useRef-canonical + useState-mirror pattern as column-move.
    const pendingMoveRowRef = useRef<PendingRowMove | null>(null);
    const movingRowRef = useRef<RowMoving | null>(null);
    const [movingRowState, setMovingRowState] = useState<RowMoving | null>(null);

    // (2026-05-31 — react port): drag auto-scroll state.
    const autoScrollRafIdRef = useRef<number | null>(null);
    const autoScrollLatestClientYRef = useRef<number>(0);
    const warnedRowDragMixedRef = useRef<boolean>(false);
    const rowDragAutoScrollPropRef = useRef<RowDragAutoScrollConfig | undefined>(rowDragAutoScroll);
    rowDragAutoScrollPropRef.current = rowDragAutoScroll;

    // Decision B.1: `columnsForLayout` patches the resizing
    // column's spec with the draft width during an in-flight resize
    // transaction. Substituting `{ ...col, width: draftWidth }` with
    // `flex` destructure-omitted is the load-bearing trick —
    // `columnLayoutPass` doesn't need to know about resize state
    // because we pre-patch the input. When no resize is in flight,
    // returns the `columns` prop by reference so the useMemo chain
    // inside `useTableLayout` doesn't re-trigger.
    const effectiveColumns = useMemo<readonly ColumnSpec[]>(() => {
      const normalized = columns.map(normalizeColumnSpec);
      const tp = toolPanel;
      if (tp == null || !tp.show || tp.panels.length === 0) return normalized;
      if (normalized.some((c) => c.actions != null)) return normalized;
      return [...normalized, SETTINGS_COLUMN_SPEC];
    }, [columns, toolPanel]);

    const columnsForLayout = useMemo<readonly ColumnSpec[]>(() => {
      const resizing = resizingColumnState;
      if (resizing == null) return effectiveColumns;
      return effectiveColumns.map((col): ColumnSpec => {
        if (col.id !== resizing.colId) return col;
        // Destructure to OMIT `flex` (rather than set it to undefined)
        // because the package's tsconfig has
        // `exactOptionalPropertyTypes: true` which rejects
        // `flex: undefined` against `flex?: number`. Omitting is
        // semantically identical (columnLayoutPass reads `col.flex`
        // and treats undefined the same as absent).
        const { flex: _omittedFlex, ...rest } = col;
        return { ...rest, width: resizing.draftWidth };
      });
    }, [effectiveColumns, resizingColumnState]);

    // (vue3 equivalent): pagePass is a passthrough
    // when showPagination is false — feed `pageSize: 0` so the
    // pipeline preserves -51 identity-equal output. The
    // internal pageSizeState is still tracked for the imperative
    // handle methods, so consumers can pre-seed it before flipping
    // showPagination.
    const effectivePageSize = showPagination ? pageSizeState : 0;

    // (react port, 2026-05-28): tree-data expand-state hook.
    // The hook owns the source-of-truth Set; chevron-click / keyboard
    // shortcuts route through `toggle` / `expand` / `collapse`. The
    // callback fires `onExpandedChange` if the consumer supplied one.
    const onExpandedChangeStable = useCallback(
      (next: readonly string[]) => {
        onExpandedChange?.({ next });
      },
      [onExpandedChange],
    );
    const treeExpandState = useTreeExpandState({
      controlled: controlledExpandedRowIds,
      defaultExpandedRowIds,
      defaultExpandedDepth,
      rows,
      onChange: onExpandedChangeStable,
    });

    // (2026-05-28 — react port): per-row lazy state. The Map
    // is stored via setLazyChildrenState; we replace (not mutate) so
    // React detects the change. The Ref mirror lets stale-resolution
    // guards read the current state synchronously inside load callbacks.
    const [lazyChildrenState, setLazyChildrenState] = useState<Map<string, LazyChildrenState>>(
      () => new Map(),
    );
    const lazyChildrenStateRef = useRef(lazyChildrenState);
    lazyChildrenStateRef.current = lazyChildrenState;
    const lazyMisconfigWarnedIdsRef = useRef(new Set<string>());
    const loadedChildrenByRowId = useMemo<ReadonlyMap<string, readonly RowSpec[]>>(() => {
      const out = new Map<string, readonly RowSpec[]>();
      for (const [rowId, state] of lazyChildrenState) {
        if (state.status === 'loaded' && state.children != null) {
          out.set(rowId, state.children);
        }
      }
      return out;
    }, [lazyChildrenState]);

    // Decision F.1: effective expand set = user manual set
    // ∪ filter-auto-expanded ancestors. We use `useState` + `useEffect`
    // to break the cycle (useTableLayout consumes this; useTableLayout
    // produces `filterForceExpandedRowIds` which then feeds back).
    // React-idiomatic equivalent of vue3's `ref` + `watch`; 2-render
    // settle on filter activation, stable thereafter.
    const [effectiveExpandedRowIdsSet, setEffectiveExpandedRowIdsSet] = useState<
      ReadonlySet<string>
    >(() => treeExpandState.expandedRowIdsSet);

    /**
     * (2026-05-29 — react port): server-side row model session.
     * Verbatim mirror of vue3 wiring. `serverSideSessionRef`
     * is the sync-read holder; `serverSideVersion` is the re-render
     * trigger bumped by the source's subscribe listener.
     */
    const serverSideSessionRef = useRef<ServerSideRowSource | null>(null);
    const [serverSideVersion, setServerSideVersion] = useState(0);

    // (2026-05-31 — react port) Decision A.1: previous-tick
    // viewport range refs for direction inference. Verbatim mirror of
    // vue3 (refs instead of state — read-only inside the
    // viewport effect; no re-render needed when they change).
    const prevFirstVisibleRef = useRef<number | null>(null);
    const prevLastVisibleRef = useRef<number | null>(null);

    // (2026-05-30 — react port) Decision A.1: pageSize
    // OVERRIDES cacheBlockSize when showPagination. Re-create the
    // session when pageSize changes (= showPagination active +
    // pageSizeState transitions). Verbatim mirror of vue3 watch.
    useEffect(() => {
      if (rowModelType !== 'serverSide' || serverSideDataSource == null) {
        if (serverSideSessionRef.current != null) {
          serverSideSessionRef.current.destroy();
          serverSideSessionRef.current = null;
        }
        prevFirstVisibleRef.current = null;
        prevLastVisibleRef.current = null;
        return;
      }
      const usePageSizeAsBlockSize = showPagination;
      const effectiveBlockSize = usePageSizeAsBlockSize ? pageSizeState : cacheBlockSize;
      if (
        usePageSizeAsBlockSize &&
        cacheBlockSize !== DEFAULT_CACHE_BLOCK_SIZE &&
        typeof console !== 'undefined'
      ) {
        console.warn(
          '[chronix-table] rowModelType:"serverSide" + showPagination:true: cacheBlockSize prop is ignored; pageSize is used as the block size (A.1). Remove cacheBlockSize to silence this warning.',
        );
      }
      const session = createServerSideRowSource(serverSideDataSource, {
        cacheBlockSize: effectiveBlockSize,
        maxBlocksInCache: serverSideMaxBlocksInCache,
        initialSortModel: sortSpecRef.current,
        initialFilterModel: filterSpecRef.current,
      });
      serverSideSessionRef.current = session;
      const unsubscribe = session.subscribe(() => {
        setServerSideVersion((v) => v + 1);
      });
      // (2026-05-31 — react port) Decision C.1: eager
      // bootstrap fetch. Verbatim mirror of vue3.
      session.getRowAt(0);
      return () => {
        unsubscribe();
        session.destroy();
        if (serverSideSessionRef.current === session) {
          serverSideSessionRef.current = null;
        }
        // (2026-05-31 — react port) Decision A.1: reset
        // direction-tracking refs on session teardown so a new session
        // (= mode/source change) doesn't carry stale prev-tick state.
        prevFirstVisibleRef.current = null;
        prevLastVisibleRef.current = null;
      };
    }, [
      rowModelType,
      serverSideDataSource,
      cacheBlockSize,
      serverSideMaxBlocksInCache,
      showPagination,
      pageSizeState,
    ]);

    useEffect(() => {
      if (rowModelType !== 'serverSide') return;
      const session = serverSideSessionRef.current;
      if (session == null) return;
      session.applyView({ sortModel: sortSpec, filterModel: filterSpec });
    }, [rowModelType, sortSpec, filterSpec]);

    // (2026-05-31 — react port) Decision B.1: viewport-driven
    // dispatch effect. Verbatim mirror of vue3.
    // (2026-05-31 — react port) Decision B.1 extends this effect with
    // direction-aware prefetch pass appended after visible-range
    // dispatch (gated on `serverSidePrefetchAheadBlocks > 0`).
    useEffect(() => {
      if (rowModelType !== 'serverSide' || showPagination) return;
      const session = serverSideSessionRef.current;
      if (session == null) return;
      const rowHeight = mergedTheme.rowHeight;
      if (rowHeight <= 0) return;
      const overscan = 3;
      const firstVisible = Math.max(0, Math.floor(bodyScrollTop / rowHeight) - overscan);
      const lastVisible = Math.ceil((bodyScrollTop + bodyClientHeight) / rowHeight) + overscan;
      for (let i = firstVisible; i < lastVisible; i++) {
        session.getRowAt(i);
      }
      // (2026-05-31 — react port) Decision A.1 + B.1:
      // direction-aware prefetch pass. Verbatim mirror of vue3.
      const prefetchAheadBlocks = Math.max(0, Math.floor(serverSidePrefetchAheadBlocks));
      if (prefetchAheadBlocks > 0) {
        const blockSize = session.cacheBlockSize;
        const total = session.getTotalRowCount();
        const prevFirst = prevFirstVisibleRef.current;
        const prevLast = prevLastVisibleRef.current;
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
      prevFirstVisibleRef.current = firstVisible;
      prevLastVisibleRef.current = lastVisible;
    }, [
      rowModelType,
      showPagination,
      bodyScrollTop,
      bodyClientHeight,
      mergedTheme.rowHeight,
      serverSideVersion,
      serverSidePrefetchAheadBlocks,
    ]);

    /**
     * -C (2026-05-30 — react port): per-row auto-height
     * measurement state. Verbatim mirror of vue3 -C with
     * useState + useRef React idioms. The Map ref is the sync-read
     * holder; setMeasuredRowHeightVersion triggers re-renders when
     * the observer mutates the map.
     */
    const measuredRowHeightRef = useRef<Map<string, number>>(new Map());
    const [measuredRowHeightVersion, setMeasuredRowHeightVersion] = useState(0);
    const rowAutoHeightObserverRef = useRef<ResizeObserver | null>(null);
    const enableRowAutoHeightRef = useRef(enableRowAutoHeight);
    enableRowAutoHeightRef.current = enableRowAutoHeight;
    const maxRowAutoHeightPxRef = useRef(maxRowAutoHeightPx);
    maxRowAutoHeightPxRef.current = maxRowAutoHeightPx;
    const themeRowHeightRef = useRef(mergedTheme.rowHeight);
    themeRowHeightRef.current = mergedTheme.rowHeight;

    const ensureRowAutoHeightObserver = useCallback((): ResizeObserver | null => {
      if (rowAutoHeightObserverRef.current != null) return rowAutoHeightObserverRef.current;
      if (typeof ResizeObserver === 'undefined') return null;
      const observer = new ResizeObserver((entries) => {
        let mutated = false;
        const cap =
          typeof maxRowAutoHeightPxRef.current === 'number' && maxRowAutoHeightPxRef.current > 0
            ? maxRowAutoHeightPxRef.current
            : Number.POSITIVE_INFINITY;
        const floor = themeRowHeightRef.current;
        const map = measuredRowHeightRef.current;
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const rowId = el.getAttribute('data-row-id');
          if (rowId == null) continue;
          const rawHeight = entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight;
          const measured = Math.max(floor, Math.min(cap, rawHeight));
          if (map.get(rowId) !== measured) {
            map.set(rowId, measured);
            mutated = true;
          }
        }
        if (mutated) setMeasuredRowHeightVersion((v) => v + 1);
      });
      rowAutoHeightObserverRef.current = observer;
      return observer;
    }, []);

    const observeRowEl = useCallback(
      (el: HTMLElement | null) => {
        if (el == null) return;
        if (!enableRowAutoHeightRef.current) return;
        const observer = ensureRowAutoHeightObserver();
        if (observer != null) observer.observe(el);
      },
      [ensureRowAutoHeightObserver],
    );

    useEffect(() => {
      return () => {
        const observer = rowAutoHeightObserverRef.current;
        if (observer != null) {
          observer.disconnect();
          rowAutoHeightObserverRef.current = null;
        }
      };
    }, []);

    const rowHeightOverridesObject = useMemo<Readonly<Record<string, number>> | undefined>(() => {
      if (!enableRowAutoHeight) return undefined;
      // Read measuredRowHeightVersion so the memo re-runs when the
      // observer mutates the underlying map.
      void measuredRowHeightVersion;
      const map = measuredRowHeightRef.current;
      if (map.size === 0) return undefined;
      return Object.fromEntries(map);
    }, [enableRowAutoHeight, measuredRowHeightVersion]);

    /**
     * tool-panel popover reactive state.
     * `activeToolPanelId` holds the id of the active panel (persists
     * across open/close cycles). `settingsPopoverOpenRef` controls
     * popover visibility. `settingsIconButtonRef` anchors the popover
     * position to the settings icon button in the action column header.
     */
    const [activeToolPanelId, setActiveToolPanelId] = useState<string | null>(
      toolPanel?.initialOpenId ?? null,
    );
    const activeToolPanelIdRef = useRef(activeToolPanelId);
    activeToolPanelIdRef.current = activeToolPanelId;
    const [settingsPopoverOpen, setSettingsPopoverOpen] = useState<boolean>(false);
    const settingsPopoverOpenRef = useRef(settingsPopoverOpen);
    settingsPopoverOpenRef.current = settingsPopoverOpen;
    const settingsIconButtonRef = useRef<HTMLElement | null>(null);
    const settingsPopoverRef = useRef<HTMLElement | null>(null);
    const toolPanelRef = useRef(toolPanel);
    toolPanelRef.current = toolPanel;
    const onToolPanelChangeRef = useRef(onToolPanelChange);
    onToolPanelChangeRef.current = onToolPanelChange;

    const applyToolPanelChange = useCallback((nextId: string | null) => {
      setActiveToolPanelId((prev) => {
        if (prev === nextId && settingsPopoverOpenRef.current) return prev;
        onToolPanelChangeRef.current?.({ activePanelId: nextId });
        return nextId;
      });
      setSettingsPopoverOpen(nextId != null);
    }, []);

    const toggleSettingsPopover = useCallback(() => {
      if (settingsPopoverOpenRef.current) {
        setSettingsPopoverOpen(false);
        onToolPanelChangeRef.current?.({ activePanelId: null });
      } else {
        const cfg = toolPanelRef.current;
        if (cfg == null || !cfg.show || cfg.panels.length === 0) return;
        const id =
          activeToolPanelIdRef.current != null &&
          cfg.panels.some((p) => p.id === activeToolPanelIdRef.current)
            ? activeToolPanelIdRef.current
            : (cfg.panels[0]?.id ?? null);
        setActiveToolPanelId(id);
        setSettingsPopoverOpen(true);
        if (id != null) onToolPanelChangeRef.current?.({ activePanelId: id });
      }
    }, []);

    /** -A (2026-05-30 — react port). Verbatim mirror of vue3. */
    const [openColumnHeaderMenuColId, setOpenColumnHeaderMenuColId] = useState<string | null>(null);
    const openColumnHeaderMenuColIdRef = useRef(openColumnHeaderMenuColId);
    openColumnHeaderMenuColIdRef.current = openColumnHeaderMenuColId;
    // Position of the hoisted column-header menu, relative to the
    // wrapper. The menu is rendered at wrapper level (not inside the
    // header cell) so it escapes the cell's `overflow:hidden` clipping.
    const [columnHeaderMenuPos, setColumnHeaderMenuPos] = useState<{
      left: number;
      top: number;
    } | null>(null);
    const [contextMenuPosition, setContextMenuPosition] = useState<{
      readonly rowId: string | null;
      readonly colId: string | null;
      readonly x: number;
      readonly y: number;
    } | null>(null);
    const contextMenuPositionRef = useRef(contextMenuPosition);
    contextMenuPositionRef.current = contextMenuPosition;
    const contextMenuRef = useRef(contextMenu);
    contextMenuRef.current = contextMenu;
    const onColumnHeaderMenuActionRef = useRef(onColumnHeaderMenuAction);
    onColumnHeaderMenuActionRef.current = onColumnHeaderMenuAction;
    const onContextMenuOpenRef = useRef(onContextMenuOpen);
    onContextMenuOpenRef.current = onContextMenuOpen;
    const onContextMenuCloseRef = useRef(onContextMenuClose);
    onContextMenuCloseRef.current = onContextMenuClose;
    const showColumnHeaderMenuRef = useRef(showColumnHeaderMenu);
    showColumnHeaderMenuRef.current = showColumnHeaderMenu;

    const applyOpenColumnHeaderMenu = useCallback((colId: string | null) => {
      setOpenColumnHeaderMenuColId((prev) => (prev === colId ? prev : colId));
      if (colId == null) {
        setColumnHeaderMenuPos(null);
        return;
      }
      // Compute the hoisted menu's left/top (relative to the wrapper)
      // synchronously so the menu renders at the correct position on
      // the same tick it opens (preserves keyboard-nav auto-focus).
      const wrapper = wrapperRef.current;
      if (wrapper == null) return;
      const escaped =
        typeof window !== 'undefined' ? (window.CSS?.escape?.(colId) ?? colId) : colId;
      const cell = wrapper.querySelector<HTMLElement>(
        `.cx-table-header-cell[data-col-id="${escaped}"]`,
      );
      if (cell == null) return;
      const wRect = wrapper.getBoundingClientRect();
      const cRect = cell.getBoundingClientRect();
      setColumnHeaderMenuPos({
        left: Math.round(cRect.right - wRect.left),
        top: Math.round(cRect.bottom - wRect.top),
      });
    }, []);

    // Close the hoisted menu on any scroll (capture-phase) so it never
    // detaches from its anchor cell during horizontal/vertical scroll.
    useEffect(() => {
      function onScrollClose(): void {
        if (openColumnHeaderMenuColIdRef.current != null) {
          applyOpenColumnHeaderMenu(null);
        }
      }
      window.addEventListener('scroll', onScrollClose, true);
      return () => window.removeEventListener('scroll', onScrollClose, true);
    }, [applyOpenColumnHeaderMenu]);

    const applyOpenContextMenu = useCallback(
      (rowId: string | null, colId: string | null, x: number, y: number) => {
        const cfg = contextMenuRef.current;
        if (cfg == null || cfg.items.length === 0) return;
        setContextMenuPosition({ rowId, colId, x, y });
        onContextMenuOpenRef.current?.({ rowId, colId, x, y });
      },
      [],
    );

    const applyCloseContextMenu = useCallback(() => {
      if (contextMenuPositionRef.current == null) return;
      setContextMenuPosition(null);
      onContextMenuCloseRef.current?.();
    }, []);

    const serverSideRowsSynthesized = useMemo<readonly RowSpec[]>(() => {
      if (rowModelType !== 'serverSide') return EMPTY_ROW_LIST;
      const session = serverSideSessionRef.current;
      if (session == null) return EMPTY_ROW_LIST;
      // serverSideVersion ensures this re-runs after each block resolve.
      void serverSideVersion;
      const total = session.getTotalRowCount();
      if (total <= 0) return EMPTY_ROW_LIST;
      const blockSize = session.cacheBlockSize;
      // (2026-05-30 — react port) Decision B.1: when
      // showPagination, allocate ONLY the current page's rows.
      // Verbatim mirror of vue3.
      if (showPagination) {
        const pageSize = pageSizeState;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));
        const page = Math.min(Math.max(0, pageState), totalPages - 1);
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
      // (2026-05-31 — react port) Decision A.1 + B.1: peek-only
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
    }, [rowModelType, serverSideVersion, showPagination, pageSizeState, pageState]);

    // (2026-05-30 — react port) Decision B.1: footer values
    // for serverSide + showPagination mode. Verbatim mirror of vue3.
    const serverSidePaginationActive = rowModelType === 'serverSide' && showPagination;
    const serverSideTotalRowsForFooter = useMemo(() => {
      if (!serverSidePaginationActive) return 0;
      void serverSideVersion;
      return serverSideSessionRef.current?.getTotalRowCount() ?? 0;
    }, [serverSidePaginationActive, serverSideVersion]);
    const serverSideTotalPagesForFooter = useMemo(() => {
      const total = serverSideTotalRowsForFooter;
      if (total <= 0 || pageSizeState <= 0) return 0;
      return Math.ceil(total / pageSizeState);
    }, [serverSideTotalRowsForFooter, pageSizeState]);
    const serverSideCurrentPageForFooter = useMemo(() => {
      if (serverSideTotalPagesForFooter === 0) return 0;
      return Math.min(Math.max(0, pageState), serverSideTotalPagesForFooter - 1);
    }, [serverSideTotalPagesForFooter, pageState]);

    const effectiveRowsForLayout = useMemo<readonly RowSpec[]>(
      () => (rowModelType === 'serverSide' ? serverSideRowsSynthesized : rows),
      [rowModelType, serverSideRowsSynthesized, rows],
    );
    const effectiveSortSpecForLayout = useMemo<readonly SortSpec[]>(
      () => (rowModelType === 'serverSide' ? EMPTY_SORT_SPECS : sortSpec),
      [rowModelType, sortSpec],
    );
    const effectiveFilterSpecForLayout = useMemo<readonly FilterSpec[]>(
      () => (rowModelType === 'serverSide' ? EMPTY_FILTER_SPECS : filterSpec),
      [rowModelType, filterSpec],
    );
    const effectivePageSizeForLayout = rowModelType === 'serverSide' ? 0 : effectivePageSize;
    const effectivePageForLayout = rowModelType === 'serverSide' ? 0 : pageState;
    const effectiveQuickFindForLayout = rowModelType === 'serverSide' ? '' : quickFindText;

    const {
      widthByColId,
      totalWidth,
      visibleColumns,
      headerCells,
      rowYByRowId,
      rowHeightByRowId,
      totalBodyHeight,
      visibleRows,
      filteredRows,
      pagedRows,
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
      // Decision B.1: `columnsForLayout` patches the
      // resizing column's spec with the draft width when a resize
      // is in flight; identity-equal to `columns` otherwise.
      columns: columnsForLayout,
      containerWidth: clientWidth,
      defaultColumnWidth: mergedTheme.defaultColumnWidth,
      defaultMinColumnWidth: mergedTheme.defaultMinColumnWidth,
      rows: effectiveRowsForLayout,
      defaultRowHeight: mergedTheme.rowHeight,
      viewportScrollTop: bodyScrollTop,
      viewportHeight: bodyClientHeight,
      sortSpec: effectiveSortSpecForLayout,
      filterSpec: effectiveFilterSpecForLayout,
      quickFindText: effectiveQuickFindForLayout,
      page: effectivePageForLayout,
      pageSize: effectivePageSizeForLayout,
      expandedRowIds: effectiveExpandedRowIdsSet,
      loadedChildrenByRowId,
      ...(rowHeightOverridesObject != null
        ? { rowHeightOverridesByRowId: rowHeightOverridesObject }
        : {}),
    });

    // -A (2026-05-30 — react port): displayed-row-index lookup
    // derived from pagedRows. Verbatim mirror of vue3 -A.
    const displayedRowIndexByRowId = useMemo<Record<string, number>>(() => {
      const map: Record<string, number> = {};
      for (let i = 0; i < pagedRows.length; i++) {
        const row = pagedRows[i];
        if (row != null) map[row.id] = i;
      }
      return map;
    }, [pagedRows]);

    // (2026-05-28 — react port): lazy children load helpers.
    const findRowByIdRecursive = useCallback(
      (rowId: string): RowSpec | null => {
        const walk = (rs: readonly RowSpec[]): RowSpec | null => {
          for (const r of rs) {
            if (r.id === rowId) return r;
            if (r.children != null) {
              const inSync = walk(r.children);
              if (inSync != null) return inSync;
            }
            const lazyState = lazyChildrenStateRef.current.get(r.id);
            if (lazyState?.status === 'loaded' && lazyState.children != null) {
              const inLazy = walk(lazyState.children);
              if (inLazy != null) return inLazy;
            }
          }
          return null;
        };
        return walk(rows);
      },
      [rows],
    );
    const applyLazyChevronClick = useCallback(
      (rowId: string): void => {
        const parent = findRowByIdRecursive(rowId);
        if (parent == null) return;
        const isLazyEligible = parent.children === undefined && parent.hasChildren === true;
        if (!isLazyEligible) {
          treeExpandState.toggle(rowId);
          return;
        }
        if (childrenLoader == null) {
          if (!lazyMisconfigWarnedIdsRef.current.has(rowId)) {
            lazyMisconfigWarnedIdsRef.current.add(rowId);
            console.warn(
              `[chronix-table] row "${rowId}" has hasChildren: true but no childrenLoader prop. ` +
                `Chevron click is a no-op. Provide childrenLoader to enable lazy load.`,
            );
          }
          treeExpandState.toggle(rowId);
          return;
        }
        const current = lazyChildrenStateRef.current.get(rowId);
        if (current?.status === 'loading') return;
        if (current?.status === 'loaded') {
          treeExpandState.toggle(rowId);
          return;
        }
        const abort = new AbortController();
        setLazyChildrenState((prev) => {
          const next = new Map(prev);
          next.set(rowId, { status: 'loading', abort });
          return next;
        });
        treeExpandState.expand(rowId);
        onLazyLoadStart?.({ parent });
        void childrenLoader({ parent, signal: abort.signal }).then(
          (children) => {
            const currentAfter = lazyChildrenStateRef.current.get(rowId);
            if (currentAfter?.abort !== abort) return;
            setLazyChildrenState((prev) => {
              const next = new Map(prev);
              next.set(rowId, { status: 'loaded', children });
              return next;
            });
            onLazyLoadSuccess?.({ parent, children });
          },
          (error: unknown) => {
            const currentAfter = lazyChildrenStateRef.current.get(rowId);
            if (currentAfter?.abort !== abort) return;
            if (abort.signal.aborted) {
              setLazyChildrenState((prev) => {
                const next = new Map(prev);
                next.delete(rowId);
                return next;
              });
              return;
            }
            setLazyChildrenState((prev) => {
              const next = new Map(prev);
              next.set(rowId, { status: 'error', error });
              return next;
            });
            onLazyLoadError?.({ parent, error });
          },
        );
      },
      [
        childrenLoader,
        findRowByIdRecursive,
        onLazyLoadError,
        onLazyLoadStart,
        onLazyLoadSuccess,
        treeExpandState,
      ],
    );
    const abortLazyLoadIfInflight = useCallback((rowId: string): void => {
      const state = lazyChildrenStateRef.current.get(rowId);
      if (state?.status !== 'loading') return;
      state.abort?.abort();
      setLazyChildrenState((prev) => {
        const next = new Map(prev);
        next.delete(rowId);
        return next;
      });
    }, []);

    // (2026-05-28 — react port): refs mirroring the latest
    // hook outputs so `runExportToCsv` can read fresh values without
    // depending on (and re-creating on) every render-cycle of those
    // outputs. Refs are updated below in render; the handle method
    // reads them at call time.
    const exportStateRef = useRef({
      filteredRows,
      pagedRows,
      topPinnedRows,
      bottomPinnedRows,
      visibleColumns,
      selectedRowIdsSet,
      props,
    });
    exportStateRef.current = {
      filteredRows,
      pagedRows,
      topPinnedRows,
      bottomPinnedRows,
      visibleColumns,
      selectedRowIdsSet,
      props,
    };
    const runExportToCsv = useCallback(
      (filename: string, options?: TableHandleExportToCsvOptions): void => {
        const s = exportStateRef.current;
        const rowSource = options?.rowSource ?? 'filtered';
        let rowsToExport: readonly RowSpec[];
        switch (rowSource) {
          case 'all':
            rowsToExport = s.props.rows;
            break;
          case 'visible':
            rowsToExport = [...s.topPinnedRows, ...s.pagedRows, ...s.bottomPinnedRows];
            break;
          case 'selected':
            rowsToExport = s.filteredRows.filter((r) => s.selectedRowIdsSet.has(r.id));
            break;
          case 'filtered':
          default:
            rowsToExport = s.filteredRows;
            break;
        }
        const visibleOnly = options?.visibleColumnsOnly ?? true;
        const exportedColumns = visibleOnly ? s.visibleColumns : s.props.columns;
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
      [],
    );

    const runExportToXlsxMultiSheet = useCallback(
      async (filename: string, sheets: readonly AdapterXlsxSheetSpec[]): Promise<void> => {
        // (react port): mirror of vue3 method. Resolve each
        // spec's rowSource via exportStateRef + delegate to core.
        const s = exportStateRef.current;
        const sheetInputs: SingleSheetExportToXlsxInput[] = sheets.map((spec) => {
          const rowSource = spec.rowSource ?? 'filtered';
          let sheetRows: readonly RowSpec[];
          switch (rowSource) {
            case 'all':
              sheetRows = s.props.rows;
              break;
            case 'visible':
              sheetRows = [...s.topPinnedRows, ...s.pagedRows, ...s.bottomPinnedRows];
              break;
            case 'selected':
              sheetRows = s.filteredRows.filter((r) => s.selectedRowIdsSet.has(r.id));
              break;
            case 'filtered':
            default:
              sheetRows = s.filteredRows;
              break;
          }
          const columnPool = s.visibleColumns;
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
      [],
    );

    const runExportToXlsx = useCallback(
      async (filename: string, options?: TableHandleExportToXlsxOptions): Promise<void> => {
        // (react port): verbatim mirror of runExportToCsv with
        // the Blob mimetype + dynamic exportToXlsx await.
        const s = exportStateRef.current;
        const rowSource = options?.rowSource ?? 'filtered';
        let rowsToExport: readonly RowSpec[];
        switch (rowSource) {
          case 'all':
            rowsToExport = s.props.rows;
            break;
          case 'visible':
            rowsToExport = [...s.topPinnedRows, ...s.pagedRows, ...s.bottomPinnedRows];
            break;
          case 'selected':
            rowsToExport = s.filteredRows.filter((r) => s.selectedRowIdsSet.has(r.id));
            break;
          case 'filtered':
          default:
            rowsToExport = s.filteredRows;
            break;
        }
        const visibleOnly = options?.visibleColumnsOnly ?? true;
        const exportedColumns = visibleOnly ? s.visibleColumns : s.props.columns;
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
      [],
    );

    // Recompute the effective set whenever the user's set, the
    // filter-force set, OR the quick-find-force set changes. Identity-
    // preserving on stable inputs: when both force lists are empty,
    // returns the user set by reference so virtualRowsPass / pagePass
    // memoizations survive. extended this union
    // with `quickFindForceExpandedRowIds`.
    useEffect(() => {
      const userSet = treeExpandState.expandedRowIdsSet;
      if (filterForceExpandedRowIds.length === 0 && quickFindForceExpandedRowIds.length === 0) {
        setEffectiveExpandedRowIdsSet(userSet);
        return;
      }
      const merged = new Set(userSet);
      for (const id of filterForceExpandedRowIds) merged.add(id);
      for (const id of quickFindForceExpandedRowIds) merged.add(id);
      setEffectiveExpandedRowIdsSet(merged);
    }, [
      treeExpandState.expandedRowIdsSet,
      filterForceExpandedRowIds,
      quickFindForceExpandedRowIds,
    ]);
    // `pagedRows` is the post-pagePass row set that virtualRowsPass
    // already consumes original; reading it here keeps the body-row
    // render pre-mount fallback (used when bodyClientHeight === 0)
    // consistent with the paginated view.
    void pagedRows;
    // `filteredRows` is read by `nextSelectionForSelectAllClick` to
    // compute "all displayed" semantics; ignore eslint warning when
    // unused in current scope (consumed below in selection helpers).
    void filteredRows;

    const columnTable = useMemo<ColumnTable>(
      () => createColumnTable(effectiveColumns),
      [effectiveColumns],
    );
    /** -A (2026-05-30 — react port): ref-mirror for imperative TableHandle access. */
    const columnTableRef = useRef(columnTable);
    columnTableRef.current = columnTable;
    const rowDataSource = useMemo<RowDataSource>(() => createClientSideRowSource(rows), [rows]);

    // ARIA keyboard nav menu container refs +
    // 4 hook instantiations. Each hook manages a roving-tabindex
    // `activeIndex` + ArrowDown/Up/Home/End handler scoped to its
    // menu container. Items lists are useMemo'd over the surfaces'
    // reactive state. Verbatim react port of the vue3 wiring.
    const settingsPopoverTabsRef = useRef<HTMLDivElement | null>(null);
    const columnHeaderMenuRef = useRef<HTMLDivElement | null>(null);
    const cellContextMenuRef = useRef<HTMLDivElement | null>(null);

    const toolPanelKbdItems = useMemo<readonly MenuKeyboardNavItem[]>(() => {
      if (toolPanel?.show !== true) return EMPTY_MENU_KBD_ITEMS;
      return toolPanel.panels.map((p) => ({ id: p.id }));
    }, [toolPanel]);
    const settingsPopoverKbdNav = useMenuKeyboardNav({
      menuRef: settingsPopoverTabsRef,
      items: toolPanelKbdItems,
      isOpen: settingsPopoverOpen,
      orientation: 'horizontal',
    });

    const columnHeaderMenuKbdItems = useMemo<readonly MenuKeyboardNavItem[]>(() => {
      if (openColumnHeaderMenuColId == null) return EMPTY_MENU_KBD_ITEMS;
      const col = columnTable.getById(openColumnHeaderMenuColId);
      const isSortableForMenu = col?.sortable !== false;
      const isAutosizeableForMenu = col?.autosizeable !== false && col?.resizable !== false;
      const isCurrentlySorted = sortSpec.some((s) => s.colId === openColumnHeaderMenuColId);
      return [
        { id: 'sort-asc', disabled: !isSortableForMenu },
        { id: 'sort-desc', disabled: !isSortableForMenu },
        { id: 'clear-sort', disabled: !isCurrentlySorted },
        { id: 'hide', disabled: false },
        { id: 'autosize', disabled: !isAutosizeableForMenu },
      ];
    }, [openColumnHeaderMenuColId, columnTable, sortSpec]);
    const columnHeaderMenuKbdIsOpen = openColumnHeaderMenuColId != null;
    const columnHeaderMenuKbdNav = useMenuKeyboardNav({
      menuRef: columnHeaderMenuRef,
      items: columnHeaderMenuKbdItems,
      isOpen: columnHeaderMenuKbdIsOpen,
      instanceKey: openColumnHeaderMenuColId,
    });

    const cellContextMenuKbdItems = useMemo<readonly MenuKeyboardNavItem[]>(() => {
      const pos = contextMenuPosition;
      const cfg = contextMenu;
      if (pos == null || cfg == null || cfg.items.length === 0) return EMPTY_MENU_KBD_ITEMS;
      const ctx: ContextMenuContext = { rowId: pos.rowId, colId: pos.colId };
      return cfg.items.map((it) => ({ id: it.id, disabled: it.disabled?.(ctx) === true }));
    }, [contextMenuPosition, contextMenu]);
    const cellContextMenuKbdIsOpen = contextMenuPosition != null;
    const cellContextMenuKbdNav = useMenuKeyboardNav({
      menuRef: cellContextMenuRef,
      items: cellContextMenuKbdItems,
      isOpen: cellContextMenuKbdIsOpen,
    });
    /**
     * (2026-05-26 — react port of vue3): downstream
     * of `columnLayoutPass` — partitions `visibleColumns` into left-
     * pinned / center / right-pinned zones and computes cumulative
     * sticky offsets for each pinned cell. The result is read by the
     * header / filter / body cell render JSX to apply
     * `position: sticky` + the right `left:` / `right:` pixel offset
     * + zone modifier classes. useMemo dep on `visibleColumns` +
     * `widthByColId` (changes only when columns / widths change).
     */
    const pinnedColsResult = useMemo<PinnedColsResult>(() => {
      if (visibleColumns.length === 0) return EMPTY_PINNED_COLS_RESULT;
      return pinnedColsPass({
        visibleColumns,
        widthByColId,
      });
    }, [visibleColumns, widthByColId]);

    /**
     * (react port, 2026-05-28): which visible column shows
     * the expand/collapse chevron + indent (Decision D.1). Explicitly
     * opt-in via `treeColumn: true`; dev-warn fallback to first visible
     * column when tree present but no opt-in.
     */
    const treeColumnId = useMemo<string | null>(() => {
      const flagged = visibleColumns.filter((c) => c.treeColumn === true);
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
      if (maxTreeDepth > 0 && visibleColumns.length > 0) {
        console.warn(
          '[chronix-table] tree data detected but no column declared treeColumn: true. ' +
            `Falling back to first visible column "${visibleColumns[0]?.id}". ` +
            'Add treeColumn: true to the column you want the chevron to render in.',
        );
        return visibleColumns[0]?.id ?? null;
      }
      return null;
    }, [visibleColumns, maxTreeDepth]);

    // (2026-05-27 — react port): table-wide
    // header-group depth + per-zone spans (one inner array per nesting
    // level). Per vue3 Decision A.1, groups never span across
    // pinned-zone boundaries. Per vue3 Decision B.1, all
    // zones produce the SAME number of rows (table-wide max depth) by
    // top-padding shallower zones with empty placeholder rows.
    const tableMaxHeaderDepth = useMemo<number>(() => {
      let depth = 0;
      for (const col of visibleColumns) {
        const hg = col.headerGroup;
        if (hg == null) continue;
        const len = typeof hg === 'string' ? 1 : hg.length;
        if (len > depth) depth = len;
      }
      return depth;
    }, [visibleColumns]);

    const headerGroupRowsByZone = useMemo<{
      readonly left: readonly (readonly HeaderGroupSpan[])[];
      readonly center: readonly (readonly HeaderGroupSpan[])[];
      readonly right: readonly (readonly HeaderGroupSpan[])[];
    } | null>(() => {
      if (tableMaxHeaderDepth === 0) return null;
      function rowsFor(colIds: readonly string[]): readonly (readonly HeaderGroupSpan[])[] {
        const zoneCols: ColumnSpec[] = [];
        for (const id of colIds) {
          const col = columnTable.getById(id);
          if (col != null) zoneCols.push(col);
        }
        return computeHeaderGroupSpans(zoneCols, tableMaxHeaderDepth);
      }
      return {
        left: rowsFor(pinnedColsResult.leftPinnedColIds),
        center: rowsFor(pinnedColsResult.centerColIds),
        right: rowsFor(pinnedColsResult.rightPinnedColIds),
      };
    }, [tableMaxHeaderDepth, columnTable, pinnedColsResult]);

    /**
     * (2026-05-27 — react port of vue3): per-colId
     * aggregate values for the optional sticky footer row. useMemo
     * deps on `visibleColumns` + `filteredRows` + `showFooterRow` so
     * the footer recomputes when the filter spec narrows the input.
     * Skipped (`{}`) when `showFooterRow: false` so consumers without
     * footers pay nothing for the helper call.
     */
    const footerValuesByColId = useMemo<Record<string, unknown>>(() => {
      if (!showFooterRow) return {};
      return computeFooterValues(visibleColumns, filteredRows);
    }, [showFooterRow, visibleColumns, filteredRows]);

    // (vue3 equivalent): apply a sort spec with
    // rejection + diff semantics. Silently rejects when target column
    // has `sortable === false` or doesn't exist (matches sortPass).
    // No-op when spec is identical to current. Fires onSortChange on
    // every observable transition (including transition back to null).
    // + 49.1 (vue3 + 8.1 equivalent): apply array
    // sort spec with rejection + dedup semantics. Rejects atomically
    // when ANY entry's column has sortable===false or doesn't exist
    // (matches sortPass). Array equality by length + per-entry
    // colId+direction. Writes ref-then-state-then-callback so handle
    // methods + cycle helpers can read sortSpecRef.current
    // synchronously (matches vue3 ref.value semantics).
    //
    // (vue3 Decision C.1): on every observable sort
    // transition, reset page index to 0 (the user expects to see the
    // top of the newly-ordered list, not whatever page index they
    // happened to be on under the previous sort). Reset fires only
    // when `showPagination` is true; the dedup guards no-op
    // transitions. The reset itself fires an `onPageChange` emit when
    // the page actually moves.
    const applySort = useCallback(
      (next: readonly SortSpec[]): void => {
        for (const entry of next) {
          const col = columnTable.getById(entry.colId);
          if (col == null || col.sortable === false) return;
        }
        const current = sortSpecRef.current;
        if (
          current.length === next.length &&
          current.every((c, i) => c.colId === next[i]!.colId && c.direction === next[i]!.direction)
        ) {
          return;
        }
        sortSpecRef.current = next;
        setSortSpec(next);
        onSortChange?.({ sortSpec: next });
        if (showPagination && pageStateRef.current !== 0) {
          pageStateRef.current = 0;
          setPageState(0);
          onPageChange?.({ page: 0, pageSize: pageSizeStateRef.current });
        }
      },
      [columnTable, onSortChange, showPagination, onPageChange],
    );

    // + 50.1 (vue3 + 9.1 equivalent): apply filter
    // spec array. Atomic rejection on filterable===false / unknown
    // column. Per-entry equality via filterSpecEqual (text + number
    // variants).
    //
    // (vue3 Decision C.1): same auto-reset-to-page-0
    // applied to filter transitions as to sort transitions — the user
    // expects to see the top of the newly-filtered list. Reset only
    // fires when `showPagination` is true and a transition actually
    // occurred (the existing dedup above guards no-op writes).
    const applyFilter = useCallback(
      (next: readonly FilterSpec[]): void => {
        for (const entry of next) {
          // (react port): expression-variant specs are
          // validated at filterPass evaluation time; skip the colId-
          // keyed pre-flight check here.
          if (entry.type === 'expression') continue;
          const col = columnTable.getById(entry.colId);
          if (col == null || col.filterable === false) return;
        }
        const current = filterSpecRef.current;
        if (
          current.length === next.length &&
          current.every((c, i) => filterSpecEqual(c, next[i]!))
        ) {
          return;
        }
        filterSpecRef.current = next;
        setFilterSpec(next);
        onFilterChange?.({ filterSpec: next });
        if (showPagination && pageStateRef.current !== 0) {
          pageStateRef.current = 0;
          setPageState(0);
          onPageChange?.({ page: 0, pageSize: pageSizeStateRef.current });
        }
      },
      [columnTable, onFilterChange, showPagination, onPageChange],
    );

    // (2026-05-29 — react port): apply a new quick-find text.
    // Dedup identical-string applications. A non-empty → empty (or
    // empty → non-empty) transition resets pagination to page 0
    // (matches filter transition posture per Decision C.1).
    // Verbatim port of vue3 .
    const applyQuickFindText = useCallback(
      (next: string): void => {
        const current = quickFindTextRef.current;
        if (current === next) return;
        quickFindTextRef.current = next;
        setQuickFindTextState(next);
        onQuickFindTextChange?.({ quickFindText: next });
        if (showPagination && pageStateRef.current !== 0) {
          pageStateRef.current = 0;
          setPageState(0);
          onPageChange?.({ page: 0, pageSize: pageSizeStateRef.current });
        }
      },
      [onQuickFindTextChange, showPagination, onPageChange],
    );

    // + 51.1 (vue3 + 10.1 equivalent): apply
    // selection array with dedup. Clears the shift+click anchor
    // when next.length === 0 (stale anchor would
    // confuse next shift+click).
    const applySelection = useCallback(
      (next: readonly string[]): void => {
        const current = selectedRowIdsRef.current;
        if (current.length === next.length && current.every((id, i) => id === next[i])) {
          return;
        }
        selectedRowIdsRef.current = next;
        setSelectedRowIds(next);
        if (next.length === 0) {
          selectionAnchorRef.current = null;
        }
        onSelectionChange?.({ selectedRowIds: next });
      },
      [onSelectionChange],
    );

    // anchor write helper. Called from every click-site
    // (body row click + per-row checkbox click) AFTER applySelection.
    // Only writes when NOT shift+click — shift+click reads the anchor
    // without moving it.
    const setAnchorIfNotShift = useCallback((rowId: string, shiftActive: boolean): void => {
      if (shiftActive) return;
      selectionAnchorRef.current = rowId;
    }, []);

    // (2026-05-27 — react port of vue3): emit-only
    // column-visibility-change helper. Honors "at least one column
    // visible" guard per Decision C.1 — refuses to hide the LAST
    // currently-visible column (no-op + no emit). Dedupes no-op
    // transitions. All UI checkbox handlers + the 2 programmatic
    // handle methods + the show-all / hide-all actions route through
    // this helper so the guard + emit-only contract apply uniformly.
    const applyColumnVisibilityChange = useCallback(
      (colId: string, hidden: boolean, jsEvent: Event | null): void => {
        const col = columnTable.getById(colId);
        if (col == null) return;
        const currentHidden = col.hide === true;
        if (currentHidden === hidden) return;
        if (hidden) {
          const remainingVisible = columns.reduce<number>((sum, c) => {
            if (c.id === colId) return sum;
            return c.hide === true ? sum : sum + 1;
          }, 0);
          if (remainingVisible === 0) return;
        }
        onColumnVisibilityChange?.({ column: col, hidden, jsEvent });
      },
      [columnTable, columns, onColumnVisibilityChange],
    );

    // (vue3 equivalent): apply a (page, pageSize)`n    // tuple. Dedup against the current tuple - no-op writes (e.g.
    // setPage(currentPage)) don't re-fire onPageChange. Page input
    // is NOT clamped here - pagePass clamps when materializing
    // pagedRows, and currentPage exposed via the handle reads the
    // pass's clamped value (currentPageFromPass) so a consumer who
    // calls setPage(99) over a 3-page dataset gets 2 back from
    // the next getPage() call.
    const applyPage = useCallback(
      (nextPage: number, nextPageSize: number): void => {
        const currentPage = pageStateRef.current;
        const currentPageSize = pageSizeStateRef.current;
        const pageChanged = nextPage !== currentPage;
        const pageSizeChanged = nextPageSize !== currentPageSize;
        if (!pageChanged && !pageSizeChanged) return;
        pageStateRef.current = nextPage;
        pageSizeStateRef.current = nextPageSize;
        setPageState(nextPage);
        setPageSizeState(nextPageSize);
        onPageChange?.({ page: nextPage, pageSize: nextPageSize });
      },
      [onPageChange],
    );

    // (vue3 equivalent): programmatic draft-value
    // update. No-op when no edit is in progress. Does NOT fire any
    // callback (only commit fires `onCellValueChange`). Used
    // internally by the `<input>` onChange handler.
    const applyEditDraft = useCallback((value: unknown): void => {
      const current = editingCellRef.current;
      if (current == null) return;
      const next: EditingCell = {
        rowId: current.rowId,
        colId: current.colId,
        baseValue: current.baseValue,
        draftValue: value,
      };
      editingCellRef.current = next;
      setEditingCellState(next);
    }, []);

    // commit the in-flight edit. Fires `onCellValueChange`
    // iff `draftValue !== baseValue` (dedup matches
    // applySelection no-op-transition rule); always fires
    // `onCellEditStop {committed: true}`.
    //
    // Decision B.1: coerce the editor's raw draft to the
    // column's typed value BEFORE emitting. Rejected coercion
    // (e.g. "abc" in a number column) aborts the commit — leaves
    // editingCellRef set so the `<input>` stays rendered with the
    // bad draft visible + fires `onCellEditStop {committed:false}`
    // so consumers can render rejection feedback. The edit session
    // does NOT end — consumers disambiguate "rejected" vs "cancel"
    // by checking getEditingCell() immediately after the emit.
    const applyEditCommit = useCallback((): void => {
      const current = editingCellRef.current;
      if (current == null) return;
      const column = columnTable.getById(current.colId);
      const row = rowDataSource.getById(current.rowId);
      if (column == null || row == null) {
        editingCellRef.current = null;
        setEditingCellState(null);
        return;
      }
      const coerced = coerceEditDraftValue(column, current.draftValue);
      if (!coerced.ok) {
        onCellEditStop?.({
          row,
          column,
          committed: false,
          finalValue: current.baseValue,
        });
        return;
      }
      // (2026-06-01 — react port): post-coerce validator
      // gate. Verbatim port of vue3 same locked execution
      // order per Decision E.1 (coerce → validator → outcome). Map
      // mutation followed by version-counter bump triggers re-render.
      const validationError = runCellValidator({ value: coerced.value, row, column });
      if (validationError != null) {
        invalidCellsRef.current = new Map(invalidCellsRef.current).set(
          invalidCellKey(row.id, column.id),
          validationError,
        );
        setInvalidCellsVersion((v) => v + 1);
        emitInvalidCellsChange();
        onCellEditStop?.({
          row,
          column,
          committed: false,
          finalValue: current.baseValue,
          validationError,
        });
        return;
      }
      // (2026-06-01 — react port): async-validator gate.
      // Verbatim mirror of vue3 race-discard via
      // monotonic requestId token + ref-backed map with version
      // counter for re-render. `nextAsyncValidationRequestIdRef`
      // increments in place so each commit attempt gets a unique
      // token; stale resolves race-check against the latest entry.
      if (column.validatorAsync != null) {
        const key = invalidCellKey(row.id, column.id);
        const requestId = nextAsyncValidationRequestIdRef.current++;
        const draftValue = coerced.value;
        pendingAsyncValidationByKeyRef.current = new Map(
          pendingAsyncValidationByKeyRef.current,
        ).set(key, { requestId, draftValue });
        if (invalidCellsRef.current.has(key)) {
          const nextInvalid = new Map(invalidCellsRef.current);
          nextInvalid.delete(key);
          invalidCellsRef.current = nextInvalid;
          setInvalidCellsVersion((v) => v + 1);
          emitInvalidCellsChange();
        }
        setPendingAsyncValidationVersion((v) => v + 1);
        onCellEditValidationPending?.({ row, column, draftValue });
        void runAsyncCellValidator({ value: draftValue, row, column }).then((asyncError) => {
          const currentPending = pendingAsyncValidationByKeyRef.current.get(key);
          if (currentPending?.requestId !== requestId) return;
          const nextPending = new Map(pendingAsyncValidationByKeyRef.current);
          nextPending.delete(key);
          pendingAsyncValidationByKeyRef.current = nextPending;
          setPendingAsyncValidationVersion((v) => v + 1);
          if (asyncError != null) {
            invalidCellsRef.current = new Map(invalidCellsRef.current).set(key, asyncError);
            setInvalidCellsVersion((v) => v + 1);
            emitInvalidCellsChange();
            onCellEditStop?.({
              row,
              column,
              committed: false,
              finalValue: current.baseValue,
              validationError: asyncError,
            });
            return;
          }
          editingCellRef.current = null;
          setEditingCellState(null);
          if (draftValue !== current.baseValue) {
            onCellValueChange?.({
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
          // row-level validator pass on synthesized
          // post-commit row.
          const postCommitRow = synthesizePostCommitRow(row, [
            { colId: column.id, newValue: draftValue },
          ]);
          const invalidCellsChanged = reconcileRowValidationsForRow(postCommitRow);
          if (invalidCellsChanged) emitInvalidCellsChange();
          onCellEditStop?.({ row, column, committed: true, finalValue: draftValue });
        });
        return;
      }
      const finalValue = coerced.value;
      editingCellRef.current = null;
      setEditingCellState(null);
      // clear any prior invalid-cell marker on success.
      const commitKey = invalidCellKey(row.id, column.id);
      let invalidCellsChanged = false;
      if (invalidCellsRef.current.has(commitKey)) {
        const next = new Map(invalidCellsRef.current);
        next.delete(commitKey);
        invalidCellsRef.current = next;
        setInvalidCellsVersion((v) => v + 1);
        invalidCellsChanged = true;
      }
      if (finalValue !== current.baseValue) {
        onCellValueChange?.({
          row,
          column,
          oldValue: current.baseValue,
          newValue: finalValue,
        });
        // (2026-05-27 — react port of vue3): auto-
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
      // (2026-06-02 — react port): row-level validator
      // pass on the synthesized post-commit row.
      const postCommitRow = synthesizePostCommitRow(row, [
        { colId: column.id, newValue: finalValue },
      ]);
      if (reconcileRowValidationsForRow(postCommitRow)) invalidCellsChanged = true;
      if (invalidCellsChanged) emitInvalidCellsChange();
      onCellEditStop?.({ row, column, committed: true, finalValue });
    }, [
      columnTable,
      rowDataSource,
      invalidCellKey,
      emitInvalidCellsChange,
      reconcileRowValidationsForRow,
      synthesizePostCommitRow,
      onCellEditStop,
      onCellEditValidationPending,
      onCellValueChange,
      recordBatchInternal,
    ]);

    // cancel the in-flight edit (revert to baseValue).
    // Fires `onCellEditStop {committed: false}`. No `onCellValueChange`
    // emit.
    const applyEditCancel = useCallback((): void => {
      const current = editingCellRef.current;
      if (current == null) return;
      const column = columnTable.getById(current.colId);
      const row = rowDataSource.getById(current.rowId);
      editingCellRef.current = null;
      setEditingCellState(null);
      if (column == null || row == null) return;
      // (2026-06-01 — react port): clear pending validator-
      // rejection marker (baseValue was previously valid).
      const cancelKey = invalidCellKey(row.id, column.id);
      let invalidCellsChanged = false;
      if (invalidCellsRef.current.has(cancelKey)) {
        const next = new Map(invalidCellsRef.current);
        next.delete(cancelKey);
        invalidCellsRef.current = next;
        setInvalidCellsVersion((v) => v + 1);
        invalidCellsChanged = true;
      }
      // (2026-06-01 — react port): discard any in-flight
      // async validation for this cell. Verbatim mirror of vue3.
      if (pendingAsyncValidationByKeyRef.current.has(cancelKey)) {
        const nextPending = new Map(pendingAsyncValidationByKeyRef.current);
        nextPending.delete(cancelKey);
        pendingAsyncValidationByKeyRef.current = nextPending;
        setPendingAsyncValidationVersion((v) => v + 1);
      }
      if (invalidCellsChanged) emitInvalidCellsChange();
      onCellEditStop?.({ row, column, committed: false, finalValue: current.baseValue });
    }, [columnTable, rowDataSource, invalidCellKey, emitInvalidCellsChange, onCellEditStop]);

    // open the editor on `(rowId, colId)`.
    // - Column must have `editable === true`. Silent no-op otherwise.
    // - Row must exist. Silent no-op otherwise.
    // - If an edit is already open on a DIFFERENT cell, commit the
    //   previous one first (matches click-elsewhere blur semantic).
    // - If an edit is already open on the SAME cell, no-op (don't
    //   re-emit `onCellEditStart`).
    //
    // `draftValue` initialises to the cell's formatted text — same
    // text the user was reading. Consumers wanting raw value as
    // draft can intercept `onCellEditStart` + call
    // `setEditingCellDraft(rawValue)` immediately.
    const applyEditStart = useCallback(
      (rowId: string, colId: string): void => {
        const column = columnTable.getById(colId);
        if (column?.editable !== true) return;
        const row = rowDataSource.getById(rowId);
        if (row == null) return;
        const current = editingCellRef.current;
        if (current?.rowId === rowId && current.colId === colId) return;
        if (current != null) {
          applyEditCommit();
        }
        const baseValue = getCellValue({ row, column });
        const draftValue: unknown =
          column.valueFormatter != null
            ? column.valueFormatter({ value: baseValue, row, column })
            : formatCellValue({ row, column });
        const next: EditingCell = { rowId, colId, baseValue, draftValue };
        editingCellRef.current = next;
        setEditingCellState(next);
        onCellEditStart?.({ row, column, baseValue, draftValue });
      },
      [columnTable, rowDataSource, applyEditCommit, onCellEditStart],
    );

    // (vue3 equivalent): open a column-resize
    // session for `colId`. Silent no-op when the column doesn't exist,
    // is `resizable: false`, or another resize is already in flight
    // for the same column. Reads the current resolved width from
    // `widthByColId` as the baseWidth. Fires `onColumnResizeStart`.
    const applyResizeStart = useCallback(
      (colId: string, startClientX: number, pointerId: number): void => {
        const column = columnTable.getById(colId);
        if (column == null || column.resizable === false) return;
        if (resizingColumnRef.current?.colId === colId) return;
        const baseWidth = widthByColId[colId] ?? 0;
        const next: ColumnResizing = {
          colId,
          baseWidth,
          draftWidth: baseWidth,
          startX: startClientX,
          pointerId,
        };
        resizingColumnRef.current = next;
        setResizingColumnState(next);
        onColumnResizeStart?.({ column, baseWidth, draftWidth: baseWidth });
      },
      [columnTable, widthByColId, onColumnResizeStart],
    );

    // update the draftWidth based on the current pointer X
    // position. Computes `raw = baseWidth + (currentClientX - startX)`
    // then clamps via `clampResizeWidth` so per-column min/max bounds
    // are respected. Reassigns `resizingColumnRef` + state with a
    // fresh object (immutable mutation matching applyEditDraft). No-op
    // when clamped width is identical to the current draftWidth.
    const applyResizeDraft = useCallback(
      (currentClientX: number): void => {
        const current = resizingColumnRef.current;
        if (current == null) return;
        const column = columnTable.getById(current.colId);
        if (column == null) return;
        const raw = current.baseWidth + (currentClientX - current.startX);
        const clamped = clampResizeWidth(raw, column, mergedTheme.defaultMinColumnWidth);
        if (clamped === current.draftWidth) return;
        const next: ColumnResizing = {
          colId: current.colId,
          baseWidth: current.baseWidth,
          draftWidth: clamped,
          startX: current.startX,
          pointerId: current.pointerId,
        };
        resizingColumnRef.current = next;
        setResizingColumnState(next);
      },
      [columnTable, mergedTheme.defaultMinColumnWidth],
    );

    // commit the in-flight resize. Fires
    // `onColumnWidthChange` iff `draftWidth !== baseWidth` (no-op
    // dedup matches `onCellValueChange` rule); always
    // fires `onColumnResizeStop {committed: true}`. Clears the resize
    // state.
    const applyResizeCommit = useCallback((): void => {
      const current = resizingColumnRef.current;
      if (current == null) return;
      const column = columnTable.getById(current.colId);
      const finalWidth = current.draftWidth;
      const baseWidth = current.baseWidth;
      resizingColumnRef.current = null;
      setResizingColumnState(null);
      if (column == null) return;
      if (finalWidth !== baseWidth) {
        onColumnWidthChange?.({ column, oldWidth: baseWidth, newWidth: finalWidth });
      }
      onColumnResizeStop?.({ column, committed: true, finalWidth });
    }, [columnTable, onColumnWidthChange, onColumnResizeStop]);

    // cancel the in-flight resize (revert to baseWidth).
    // Fires `onColumnResizeStop {committed: false}` only. No
    // `onColumnWidthChange` callback.
    const applyResizeCancel = useCallback((): void => {
      const current = resizingColumnRef.current;
      if (current == null) return;
      const column = columnTable.getById(current.colId);
      const baseWidth = current.baseWidth;
      resizingColumnRef.current = null;
      setResizingColumnState(null);
      if (column == null) return;
      onColumnResizeStop?.({ column, committed: false, finalWidth: baseWidth });
    }, [columnTable, onColumnResizeStop]);

    // ─────────────────────── (2026-05-26 — react port of vue3): column autosize ───────────────────────
    // Verbatim port of vue3 lazy-init hidden Canvas + Canvas.measureText
    // for text width measurement; pure `computeAutosizeWidth` clamp. Reuses Phase
    // 54's `onColumnWidthChange` callback as the persistence channel (Decision
    // A.1 inherits — autosize is just another path producing a width change).
    //
    // Lazy-init so tables that never autosize (and SSR / happy-dom without
    // Canvas) don't pay the construction cost up front. The canvas is
    // intentionally NOT attached to the DOM — Canvas's 2D context works without
    // a DOM mount and we avoid layout pollution.
    const autosizeCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const applyAutosize = useCallback(
      (colId: string): void => {
        const column = columnTable.getById(colId);
        if (column == null) return;
        // cannot mutate a non-resizable column's width;
        // explicit autosizeable:false opts out without affecting resize.
        if (column.resizable === false) return;
        if (column.autosizeable === false) return;
        // Lazy-init the hidden Canvas. happy-dom returns null for
        // getContext('2d') → measureCellTextWidth returns 0 → autosize
        // falls back to headerWidth = 0 → clamped to minWidth.
        if (typeof document !== 'undefined') {
          autosizeCanvasRef.current ??= document.createElement('canvas');
        }
        const ctx2d = autosizeCanvasRef.current?.getContext('2d') ?? null;
        function measureCellTextWidth(text: string, font: string): number {
          if (ctx2d == null) return 0;
          ctx2d.font = font;
          return ctx2d.measureText(text).width;
        }
        const headerEl =
          typeof window !== 'undefined' && wrapperRef.current != null
            ? wrapperRef.current.querySelector<HTMLElement>(
                `.cx-table-header-cell[data-col-id="${window.CSS?.escape?.(colId) ?? colId}"]`,
              )
            : null;
        const font = headerEl != null ? window.getComputedStyle(headerEl).font : '';
        const headerLabel = column.headerName ?? column.field ?? column.id;
        const headerWidth = measureCellTextWidth(headerLabel, font);
        const widths: number[] = [];
        for (const row of pagedRows) {
          const value = getCellValue({ row, column });
          const text =
            column.valueFormatter != null
              ? column.valueFormatter({ value, row, column })
              : formatCellValue({ row, column });
          widths.push(measureCellTextWidth(text, font));
        }
        const baseWidth = widthByColId[colId] ?? 0;
        const paddingX = mergedTheme.cellPaddingX * 2;
        const newWidth = computeAutosizeWidth(widths, {
          paddingX,
          minWidth: column.minWidth ?? mergedTheme.defaultMinColumnWidth,
          ...(column.maxWidth != null ? { maxWidth: column.maxWidth } : {}),
          headerWidth,
        });
        if (newWidth === baseWidth) return; // no-op dedup matches
        onColumnWidthChange?.({ column, oldWidth: baseWidth, newWidth });
      },
      [
        columnTable,
        pagedRows,
        widthByColId,
        mergedTheme.cellPaddingX,
        mergedTheme.defaultMinColumnWidth,
        onColumnWidthChange,
      ],
    );

    const applyAutosizeAll = useCallback((): void => {
      for (const cell of headerCells) {
        applyAutosize(cell.colId);
      }
    }, [headerCells, applyAutosize]);

    /** -A (2026-05-30 — react port). Verbatim mirror of vue3. */
    const onColumnHeaderMenuItemClick = useCallback(
      (
        colId: string,
        action: 'sort-asc' | 'sort-desc' | 'clear-sort' | 'hide' | 'autosize',
      ): void => {
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
        onColumnHeaderMenuActionRef.current?.({ colId, action });
        applyOpenColumnHeaderMenu(null);
      },
      [applySort, applyColumnVisibilityChange, applyAutosize, applyOpenColumnHeaderMenu],
    );

    /** -B (2026-05-30 — react port). Verbatim mirror of vue3. */
    const onCellContextMenu = useCallback(
      (rowId: string, colId: string, e: ReactMouseEvent): void => {
        const cfg = contextMenuRef.current;
        if (cfg == null || cfg.items.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        applyOpenContextMenu(rowId, colId, e.clientX, e.clientY);
      },
      [applyOpenContextMenu],
    );

    const onContextMenuItemClick = useCallback(
      (item: ContextMenuItem): void => {
        const pos = contextMenuPositionRef.current;
        if (pos == null) return;
        const cmCtx: ContextMenuContext = { rowId: pos.rowId, colId: pos.colId };
        const disabled = item.disabled?.(cmCtx) === true;
        if (disabled) return;
        applyCloseContextMenu();
        item.onClick(cmCtx);
      },
      [applyCloseContextMenu],
    );

    // (2026-05-30 — react port): document-level close-on-
    // outside + close-on-Escape listeners shared by column header
    // menu + cell context menu.
    useEffect(() => {
      function onPhase83DocPointerdown(e: PointerEvent): void {
        const target = e.target as HTMLElement | null;
        if (target == null) return;
        if (openColumnHeaderMenuColIdRef.current != null) {
          const insideMenu = target.closest('.cx-table-column-header-menu') != null;
          const insideButton = target.closest('.cx-table-column-header-menu-button') != null;
          if (!insideMenu && !insideButton) {
            applyOpenColumnHeaderMenu(null);
          }
        }
        if (contextMenuPositionRef.current != null) {
          const insideContextMenu = target.closest('.cx-table-cell-context-menu') != null;
          if (!insideContextMenu) {
            applyCloseContextMenu();
          }
        }
        // (2026-05-31 — react port): outside-click closes
        // the cell style editor popover. Verbatim mirror of vue3.
        // Cancel logic is inlined (rather than calling the
        // `cancelCellStyleEditor` useCallback) to avoid a forward
        // reference; the listener is registered once on mount and
        // reads latest state via `cellStyleEditorOpenStateRef`.
        if (cellStyleEditorOpenStateRef.current != null) {
          const insideEditor = target.closest('.cx-table-cell-style-editor') != null;
          if (!insideEditor) {
            setCellStyleEditorOpen(null);
            cellStyleSquareDragRef.current = false;
            cellStyleHueDragRef.current = false;
          }
        }
        // close settings popover on outside click
        if (settingsPopoverOpenRef.current) {
          const insidePopover = target.closest('.cx-table-settings-popover') != null;
          const insideSettingsBtn = target.closest('.cx-table-header-settings-button') != null;
          if (!insidePopover && !insideSettingsBtn) {
            setSettingsPopoverOpen(false);
            onToolPanelChangeRef.current?.({ activePanelId: null });
          }
        }
      }
      function onPhase83DocKeydown(e: KeyboardEvent): void {
        if (e.key !== 'Escape') return;
        if (openColumnHeaderMenuColIdRef.current != null) {
          applyOpenColumnHeaderMenu(null);
          e.stopPropagation();
        }
        if (contextMenuPositionRef.current != null) {
          applyCloseContextMenu();
          e.stopPropagation();
        }
        // (2026-05-31 — react port): Escape closes editor.
        if (cellStyleEditorOpenStateRef.current != null) {
          setCellStyleEditorOpen(null);
          cellStyleSquareDragRef.current = false;
          cellStyleHueDragRef.current = false;
          e.stopPropagation();
        }
        // Escape closes settings popover.
        if (settingsPopoverOpenRef.current) {
          setSettingsPopoverOpen(false);
          onToolPanelChangeRef.current?.({ activePanelId: null });
          e.stopPropagation();
        }
      }
      document.addEventListener('pointerdown', onPhase83DocPointerdown, true);
      document.addEventListener('keydown', onPhase83DocKeydown);
      return () => {
        document.removeEventListener('pointerdown', onPhase83DocPointerdown, true);
        document.removeEventListener('keydown', onPhase83DocKeydown);
      };
    }, [applyOpenColumnHeaderMenu, applyCloseContextMenu]);

    // (2026-05-26 — react port of vue3): live
    // getBoundingClientRect snapshot for every visible header cell.
    // Empty Map when wrapper unmounted. Verbatim port of vue3 helper.
    const getHeaderCellRectsLive = useCallback((): ReadonlyMap<string, ColumnHeaderRect> => {
      const rects = new Map<string, ColumnHeaderRect>();
      const wrapper = wrapperRef.current;
      if (wrapper == null) return rects;
      const cells = wrapper.querySelectorAll<HTMLElement>('.cx-table-header-cell[data-col-id]');
      cells.forEach((el) => {
        const colId = el.getAttribute('data-col-id');
        if (colId == null) return;
        const rect = el.getBoundingClientRect();
        rects.set(colId, { left: rect.left, right: rect.right });
      });
      return rects;
    }, []);

    // convert a clientX drop target to wrapper-relative px.
    const resolveDropLineLeftPx = useCallback(
      (
        dropTarget: ColumnDropTarget,
        rects: ReadonlyMap<string, ColumnHeaderRect>,
      ): number | null => {
        const wrapper = wrapperRef.current;
        if (wrapper == null) return null;
        const targetRect = rects.get(dropTarget.targetColId);
        if (targetRect == null) return null;
        const wrapperLeft = wrapper.getBoundingClientRect().left;
        const boundaryClientX =
          dropTarget.position === 'before' ? targetRect.left : targetRect.right;
        return boundaryClientX - wrapperLeft - 1;
      },
      [],
    );

    // promote pending → active. Fires onColumnMoveStart.
    const applyMoveStart = useCallback(
      (colId: string, startClientX: number, pointerId: number): void => {
        const column = columnTable.getById(colId);
        if (column == null || column.reorderable === false) return;
        if (movingColumnRef.current?.colId === colId) return;
        const next: ColumnMoving = {
          colId,
          startClientX,
          dropTarget: null,
          dropLineLeftPx: null,
          pointerId,
        };
        movingColumnRef.current = next;
        setMovingColumnState(next);
        onColumnMoveStart?.({ column, startClientX });
      },
      [columnTable, onColumnMoveStart],
    );

    // recompute drop target on every pointermove. Dedup
    // skips re-assign when target + line position unchanged.
    const applyMoveDraft = useCallback(
      (currentClientX: number): void => {
        const current = movingColumnRef.current;
        if (current == null) return;
        const rects = getHeaderCellRectsLive();
        // (2026-05-27 — react port vue3 baseline):
        // pinned-zone guard. See vue3 adapter comment for the rationale
        // (same closure: cross-zone candidates skipped → null → no drop
        // indicator + no onColumnOrderChange callback).
        const pinnedZoneByColId = new Map<string, 'left' | 'right' | null>();
        for (const c of visibleColumns) {
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
        const next: ColumnMoving = {
          colId: current.colId,
          startClientX: current.startClientX,
          dropTarget: nextTarget,
          dropLineLeftPx: nextLeftPx,
          pointerId: current.pointerId,
        };
        movingColumnRef.current = next;
        setMovingColumnState(next);
      },
      [getHeaderCellRectsLive, resolveDropLineLeftPx, visibleColumns],
    );

    // commit in-flight move. Fires onColumnOrderChange iff
    // meaningful reorder. Always fires onColumnMoveStop {committed:true}.
    const applyMoveCommit = useCallback((): void => {
      const current = movingColumnRef.current;
      if (current == null) return;
      const movedColumn = columnTable.getById(current.colId);
      const dropTarget = current.dropTarget;
      movingColumnRef.current = null;
      setMovingColumnState(null);
      if (movedColumn == null) return;
      if (dropTarget != null && dropTarget.targetColId !== current.colId) {
        const targetColumn = columnTable.getById(dropTarget.targetColId);
        if (targetColumn != null) {
          const next = computeColumnReorder(
            columns,
            current.colId,
            dropTarget.targetColId,
            dropTarget.position,
          );
          if (next !== columns) {
            const oldColumnIds = columns.map((c) => c.id);
            const newColumnIds = next.map((c) => c.id);
            onColumnOrderChange?.({
              movedColumn,
              targetColumn,
              position: dropTarget.position,
              oldColumnIds,
              newColumnIds,
            });
          }
        }
      }
      onColumnMoveStop?.({ column: movedColumn, committed: true, dropTarget });
    }, [columns, columnTable, onColumnOrderChange, onColumnMoveStop]);

    // cancel in-flight move (no reorder).
    const applyMoveCancel = useCallback((): void => {
      const current = movingColumnRef.current;
      if (current == null) return;
      const movedColumn = columnTable.getById(current.colId);
      movingColumnRef.current = null;
      setMovingColumnState(null);
      if (movedColumn == null) return;
      onColumnMoveStop?.({ column: movedColumn, committed: false, dropTarget: null });
    }, [columnTable, onColumnMoveStop]);

    /**
     * (2026-05-29 — react port): row-drag apply* family.
     * Verbatim mirror of vue3 .
     */
    const findRowById = useCallback(
      (rowId: string): RowSpec | null => {
        for (const r of rows) {
          if (r.id === rowId) return r;
        }
        return null;
      },
      [rows],
    );

    const getBodyRowRectsLive = useCallback((): ReadonlyMap<string, RowRect> => {
      const rects = new Map<string, RowRect>();
      const wrapper = wrapperRef.current;
      if (wrapper == null) return rects;
      const cells = wrapper.querySelectorAll<HTMLElement>('.cx-table-row[data-row-id]');
      cells.forEach((el) => {
        const rowId = el.getAttribute('data-row-id');
        if (rowId == null) return;
        const rect = el.getBoundingClientRect();
        rects.set(rowId, { top: rect.top, bottom: rect.bottom });
      });
      return rects;
    }, []);

    const resolveRowDropLineTopPx = useCallback(
      (dropTarget: RowDropTarget, rects: ReadonlyMap<string, RowRect>): number | null => {
        const wrapper = wrapperRef.current;
        if (wrapper == null) return null;
        const targetRect = rects.get(dropTarget.targetRowId);
        if (targetRect == null) return null;
        const wrapperTop = wrapper.getBoundingClientRect().top;
        const boundaryClientY =
          dropTarget.position === 'above' ? targetRect.top : targetRect.bottom;
        return boundaryClientY - wrapperTop - 1;
      },
      [],
    );

    const applyRowMoveStart = useCallback(
      (rowId: string, startClientY: number, pointerId: number): void => {
        const row = findRowById(rowId);
        if (row == null) return;
        if (row.draggable === false) return;
        if (row.pinned != null) return;
        if (movingRowRef.current?.rowId === rowId) return;
        const next: RowMoving = {
          rowId,
          startClientY,
          dropTarget: null,
          dropLineTopPx: null,
          pointerId,
        };
        movingRowRef.current = next;
        setMovingRowState(next);
        onRowMoveStart?.({ row, startClientY });
      },
      [findRowById, onRowMoveStart],
    );

    const applyRowMoveDraft = useCallback(
      (currentClientY: number): void => {
        const current = movingRowRef.current;
        if (current == null) return;
        const rects = getBodyRowRectsLive();
        const pinnedRowIds = new Set<string>();
        // Note: react port doesn't pre-compute topPinnedRows / bottomPinnedRows
        // in this scope. Build the pinned set on demand from rows.
        for (const r of rows) {
          if (r.pinned != null) pinnedRowIds.add(r.id);
        }
        const nextTarget = getRowDropTarget(currentClientY, rects, current.rowId, {
          pinnedRowIds,
        });
        const nextTopPx = nextTarget != null ? resolveRowDropLineTopPx(nextTarget, rects) : null;
        const sameTarget =
          (current.dropTarget?.targetRowId ?? null) === (nextTarget?.targetRowId ?? null) &&
          (current.dropTarget?.position ?? null) === (nextTarget?.position ?? null) &&
          current.dropLineTopPx === nextTopPx;
        if (sameTarget) return;
        const next: RowMoving = {
          rowId: current.rowId,
          startClientY: current.startClientY,
          dropTarget: nextTarget,
          dropLineTopPx: nextTopPx,
          pointerId: current.pointerId,
        };
        movingRowRef.current = next;
        setMovingRowState(next);
      },
      [getBodyRowRectsLive, resolveRowDropLineTopPx, rows],
    );

    const applyRowMoveCommit = useCallback((): void => {
      const current = movingRowRef.current;
      if (current == null) return;
      const movedRow = findRowById(current.rowId);
      const dropTarget = current.dropTarget;
      movingRowRef.current = null;
      setMovingRowState(null);
      if (movedRow == null) return;
      if (dropTarget != null && dropTarget.targetRowId !== current.rowId) {
        const targetRow = findRowById(dropTarget.targetRowId);
        if (targetRow != null && targetRow.pinned == null) {
          const next = computeRowReorder(
            rows,
            current.rowId,
            dropTarget.targetRowId,
            dropTarget.position,
          );
          if (next !== rows) {
            const oldRowIds = rows.map((r) => r.id);
            const newRowIds = next.map((r) => r.id);
            onRowOrderChange?.({
              movedRow,
              targetRow,
              position: dropTarget.position,
              oldRowIds,
              newRowIds,
            });
          }
        }
      }
      onRowMoveStop?.({ row: movedRow, committed: true, dropTarget });
    }, [findRowById, rows, onRowMoveStop, onRowOrderChange]);

    const applyRowMoveCancel = useCallback((): void => {
      const current = movingRowRef.current;
      if (current == null) return;
      const movedRow = findRowById(current.rowId);
      movingRowRef.current = null;
      setMovingRowState(null);
      if (movedRow == null) return;
      onRowMoveStop?.({ row: movedRow, committed: false, dropTarget: null });
    }, [findRowById, onRowMoveStop]);

    const onRowDragPointerDown = useCallback(
      (rowId: string, e: ReactPointerEvent<HTMLDivElement>): void => {
        if (e.button !== 0) return;
        const row = findRowById(rowId);
        if (row == null) return;
        if (row.draggable === false) return;
        if (row.pinned != null) return;
        e.stopPropagation();
        e.preventDefault();
        pendingMoveRowRef.current = {
          rowId,
          startClientX: e.clientX,
          startClientY: e.clientY,
          pointerId: e.pointerId,
        };
        const target = e.currentTarget;
        if (typeof target.setPointerCapture === 'function') {
          try {
            target.setPointerCapture(e.pointerId);
          } catch {
            // happy-dom / synthesized events can throw.
          }
        }
      },
      [findRowById],
    );

    // (2026-05-31 — react port): drag auto-scroll rAF loop.
    // Verbatim mirror of vue3 wiring. `bodyRef.current` reads the body
    // element synchronously (mirror of vue3's bodyRef.value).
    const ensureAutoScrollLoopRunning = useCallback((): void => {
      if (autoScrollRafIdRef.current != null) return;
      const cfg = rowDragAutoScrollPropRef.current;
      if (cfg?.enabled === false) return;
      autoScrollRafIdRef.current = requestAnimationFrame(autoScrollStep);
    }, []);

    const cancelAutoScrollLoop = useCallback((): void => {
      if (autoScrollRafIdRef.current != null) {
        cancelAnimationFrame(autoScrollRafIdRef.current);
        autoScrollRafIdRef.current = null;
      }
    }, []);

    function autoScrollStep(): void {
      autoScrollRafIdRef.current = null;
      if (movingRowRef.current == null) return;
      const body = bodyRef.current;
      if (body == null) return;
      const cfg = rowDragAutoScrollPropRef.current;
      if (cfg?.enabled === false) return;
      const rect = body.getBoundingClientRect();
      const triggerZonePx = cfg?.triggerZonePx ?? DEFAULT_DRAG_AUTO_SCROLL_TRIGGER_ZONE_PX;
      const maxVelocityPxPerFrame =
        cfg?.maxVelocityPxPerFrame ?? DEFAULT_DRAG_AUTO_SCROLL_MAX_VELOCITY_PX_PER_FRAME;
      const velocity = computeDragAutoScrollVelocity({
        cursorClientY: autoScrollLatestClientYRef.current,
        bodyTop: rect.top,
        bodyBottom: rect.bottom,
        triggerZonePx,
        maxVelocityPxPerFrame,
      });
      if (velocity === 0) return;
      body.scrollTop = Math.max(0, body.scrollTop + velocity);
      applyRowMoveDraft(autoScrollLatestClientYRef.current);
      autoScrollRafIdRef.current = requestAnimationFrame(autoScrollStep);
    }

    const onRowDragPointerMove = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>): void => {
        const pending = pendingMoveRowRef.current;
        const moving = movingRowRef.current;
        if (pending?.pointerId === e.pointerId && moving == null) {
          const dx = e.clientX - pending.startClientX;
          const dy = e.clientY - pending.startClientY;
          if (Math.max(Math.abs(dx), Math.abs(dy)) >= DEFAULT_ROW_DRAG_THRESHOLD_PX) {
            const pendingRowId = pending.rowId;
            const pendingClientY = pending.startClientY;
            const pendingPointerId = pending.pointerId;
            pendingMoveRowRef.current = null;
            applyRowMoveStart(pendingRowId, pendingClientY, pendingPointerId);
            applyRowMoveDraft(e.clientY);
            autoScrollLatestClientYRef.current = e.clientY;
            ensureAutoScrollLoopRunning();
          }
          return;
        }
        if (moving?.pointerId === e.pointerId) {
          applyRowMoveDraft(e.clientY);
          autoScrollLatestClientYRef.current = e.clientY;
          ensureAutoScrollLoopRunning();
        }
      },
      [applyRowMoveStart, applyRowMoveDraft, ensureAutoScrollLoopRunning],
    );

    const onRowDragPointerUp = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>): void => {
        const pending = pendingMoveRowRef.current;
        const moving = movingRowRef.current;
        if (pending?.pointerId === e.pointerId) {
          pendingMoveRowRef.current = null;
          return;
        }
        if (moving?.pointerId === e.pointerId) {
          cancelAutoScrollLoop();
          applyRowMoveCommit();
        }
      },
      [applyRowMoveCommit, cancelAutoScrollLoop],
    );

    const onRowDragPointerCancel = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>): void => {
        const pending = pendingMoveRowRef.current;
        const moving = movingRowRef.current;
        if (pending?.pointerId === e.pointerId) {
          pendingMoveRowRef.current = null;
          return;
        }
        if (moving?.pointerId === e.pointerId) {
          cancelAutoScrollLoop();
          applyRowMoveCancel();
        }
      },
      [applyRowMoveCancel, cancelAutoScrollLoop],
    );

    // (react port): cleanup any in-flight rAF on unmount.
    useEffect(() => {
      return () => {
        cancelAutoScrollLoop();
      };
    }, [cancelAutoScrollLoop]);

    // ─────────────────────── (2026-05-26 — react port of vue3): cell range selection ───────────────────────
    // 2-point {anchor, focus} state shape (Decision B.1) + pure
    // `computeCellRangeEnvelope` derivation. Drag-extend via pointer-
    // capture + document.elementFromPoint resolution (Decision C.1).
    // Opt-in via `cellRangeSelection: 'enabled'` prop (Decision A.1).
    //
    // Bundle B2 pattern: canonical ref + setState render-mirror. The
    // ref drives all the apply* helper reads (synchronous); the state
    // drives the cellRangeEnvelope useMemo so render re-paints the
    // modifier class.
    const cellRangeRef = useRef<CellRange | null>(null);
    const [cellRangeState, setCellRangeState] = useState<CellRange | null>(null);
    const cellRangeDraggingRef = useRef<boolean>(false);
    const cellRangePointerIdRef = useRef<number | null>(null);

    const cellRangeEnvelope = useMemo<CellRangeEnvelope>(() => {
      if (cellRangeState == null) return EMPTY_CELL_RANGE_ENVELOPE;
      const rowIds = pagedRows.map((r) => r.id);
      const colIds = visibleColumns.map((c) => c.id);
      return computeCellRangeEnvelope(cellRangeState, rowIds, colIds);
    }, [cellRangeState, pagedRows, visibleColumns]);
    const cellRangeRowSet = useMemo<ReadonlySet<string>>(
      () => new Set(cellRangeEnvelope.rowIds),
      [cellRangeEnvelope],
    );
    const cellRangeColSet = useMemo<ReadonlySet<string>>(
      () => new Set(cellRangeEnvelope.colIds),
      [cellRangeEnvelope],
    );

    const applyCellRangeStart = useCallback(
      (anchor: CellRef, jsEvent: ReactPointerEvent | null): void => {
        const next: CellRange = { anchor, focus: anchor };
        cellRangeRef.current = next;
        setCellRangeState(next);
        onCellRangeStart?.({ range: next, jsEvent });
      },
      [onCellRangeStart],
    );

    const applyCellRangeDraft = useCallback(
      (focus: CellRef, jsEvent: ReactPointerEvent | ReactMouseEvent | null): void => {
        const current = cellRangeRef.current;
        if (current == null) return;
        if (current.focus.rowId === focus.rowId && current.focus.colId === focus.colId) {
          return;
        }
        const next: CellRange = { anchor: current.anchor, focus };
        cellRangeRef.current = next;
        setCellRangeState(next);
        const rowIds = pagedRows.map((r) => r.id);
        const colIds = visibleColumns.map((c) => c.id);
        const envelope = computeCellRangeEnvelope(next, rowIds, colIds);
        onCellRangeChange?.({ range: next, envelope, jsEvent });
      },
      [pagedRows, visibleColumns, onCellRangeChange],
    );

    const applyCellRangeStop = useCallback(
      (jsEvent: ReactPointerEvent | ReactMouseEvent | null): void => {
        const current = cellRangeRef.current;
        if (current == null) return;
        const rowIds = pagedRows.map((r) => r.id);
        const colIds = visibleColumns.map((c) => c.id);
        const envelope = computeCellRangeEnvelope(current, rowIds, colIds);
        onCellRangeStop?.({ range: current, envelope, jsEvent });
      },
      [pagedRows, visibleColumns, onCellRangeStop],
    );

    const applyCellRangeClear = useCallback((): void => {
      const current = cellRangeRef.current;
      if (current == null) return;
      const rowIds = pagedRows.map((r) => r.id);
      const colIds = visibleColumns.map((c) => c.id);
      const envelope = computeCellRangeEnvelope(current, rowIds, colIds);
      cellRangeRef.current = null;
      setCellRangeState(null);
      onCellRangeStop?.({ range: current, envelope, jsEvent: null });
    }, [pagedRows, visibleColumns, onCellRangeStop]);

    const onCellPointerDown = useCallback(
      (rowId: string, colId: string, e: ReactPointerEvent<HTMLDivElement>): void => {
        if (cellRangeSelection !== 'enabled') return;
        if (e.button !== 0) return;
        if (rowId === '__cx_select_all__') return;
        e.preventDefault();
        const target = e.currentTarget;
        if (typeof target.setPointerCapture === 'function') {
          try {
            target.setPointerCapture(e.pointerId);
          } catch {
            // happy-dom / Chromium synthesized events can throw InvalidPointerId.
          }
        }
        cellRangeDraggingRef.current = true;
        cellRangePointerIdRef.current = e.pointerId;
        applyCellRangeStart({ rowId, colId }, e);
      },
      [cellRangeSelection, applyCellRangeStart],
    );

    const onCellPointerMove = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>): void => {
        if (!cellRangeDraggingRef.current) return;
        if (cellRangePointerIdRef.current !== e.pointerId) return;
        if (typeof document === 'undefined') return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el == null) return;
        const rowId = closestAttr(el, 'data-row-id');
        if (rowId == null || rowId === '__cx_select_all__') return;
        const colId = closestAttr(el, 'data-col-id');
        if (colId == null) return;
        applyCellRangeDraft({ rowId, colId }, e);
      },
      [applyCellRangeDraft],
    );

    const onCellPointerUp = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>): void => {
        if (!cellRangeDraggingRef.current) return;
        if (cellRangePointerIdRef.current !== e.pointerId) return;
        cellRangeDraggingRef.current = false;
        cellRangePointerIdRef.current = null;
        applyCellRangeStop(e);
      },
      [applyCellRangeStop],
    );

    const onCellPointerCancel = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>): void => {
        if (!cellRangeDraggingRef.current) return;
        if (cellRangePointerIdRef.current !== e.pointerId) return;
        cellRangeDraggingRef.current = false;
        cellRangePointerIdRef.current = null;
        applyCellRangeStop(e);
      },
      [applyCellRangeStop],
    );

    const onCellShiftClick = useCallback(
      (rowId: string, colId: string, e: ReactMouseEvent<HTMLDivElement>): void => {
        if (cellRangeSelection !== 'enabled') return;
        if (!e.shiftKey) return;
        if (cellRangeRef.current == null) return;
        e.stopPropagation();
        applyCellRangeDraft({ rowId, colId }, e);
        applyCellRangeStop(e);
      },
      [cellRangeSelection, applyCellRangeDraft, applyCellRangeStop],
    );

    // ─────────────────────── (2026-05-27 — react port of vue3): clipboard copy ───────────────────────
    // Shared TSV-synthesis + writeText + callback path. Both the Ctrl+C
    // keydown handler and the programmatic `copyCellRangeToClipboard()`
    // handle method route through here so the same fail-soft + callback
    // shape applies to both gestures.
    const performCellRangeCopy = useCallback(
      async (jsEvent: ReactKeyboardEvent | null): Promise<string | null> => {
        if (cellRangeSelection !== 'enabled') return null;
        if (cellRangeRef.current == null) return null;
        const envelopeNow = cellRangeEnvelope;
        if (envelopeNow.rowIds.length === 0 || envelopeNow.colIds.length === 0) return null;
        const text = formatCellRangeForClipboard(envelopeNow, rows, columns);
        if (
          typeof navigator !== 'undefined' &&
          typeof navigator.clipboard?.writeText === 'function'
        ) {
          try {
            await navigator.clipboard.writeText(text);
          } catch {
            // happy-dom + non-secure HTTP contexts + clipboard policy
            // can all throw. Fall through so the callback still fires.
          }
        }
        onCellRangeCopy?.({ envelope: envelopeNow, text, jsEvent });
        return text;
      },
      [cellRangeSelection, cellRangeEnvelope, rows, columns, onCellRangeCopy],
    );

    // (2026-05-27 — react port of vue3): shared
    // TSV-readText + parse + map + callback path for clipboard paste.
    // Both the Ctrl+V keydown handler and the programmatic
    // `pasteCellRangeFromClipboard()` handle method route through
    // here so the same fail-soft + callback shape applies.
    const performCellRangePaste = useCallback(
      async (jsEvent: ReactKeyboardEvent | null): Promise<readonly PasteMutation[] | null> => {
        if (cellRangeSelection !== 'enabled') return null;
        if (cellRangeRef.current == null) return null;
        const envelopeNow = cellRangeEnvelope;
        if (envelopeNow.rowIds.length === 0 || envelopeNow.colIds.length === 0) return null;
        if (
          typeof navigator === 'undefined' ||
          typeof navigator.clipboard?.readText !== 'function'
        ) {
          return null;
        }
        let text: string;
        try {
          text = await navigator.clipboard.readText();
        } catch {
          // happy-dom + non-secure HTTP contexts + missing
          // 'clipboard-read' permission can all throw. Return null;
          // consumer's callback doesn't fire (no payload to produce).
          return null;
        }
        const parsed = parseClipboardTsv(text);
        const mutations = computePasteMutations(
          envelopeNow,
          parsed,
          rows,
          columns,
          resolvePasteValidatorGate(),
        );
        onCellRangePaste?.({ envelope: envelopeNow, mutations, text, jsEvent });
        // auto-record into mutation history.
        recordBatchInternal('cell-range-paste', mutations);
        runPostBatchRowValidations(mutations);
        return mutations;
      },
      [
        cellRangeSelection,
        cellRangeEnvelope,
        rows,
        columns,
        onCellRangePaste,
        recordBatchInternal,
        resolvePasteValidatorGate,
        runPostBatchRowValidations,
      ],
    );

    // (2026-05-27 — react port of vue3): drag-fill
    // state. Per Bundle I Decision B.1 — refs hold imperative state
    // read inside handlers (no re-render dependency); a parallel
    // useState slot mirrors the preview envelope so the preview-set
    // useMemo re-runs only when the resolved fill envelope actually
    // changes.
    //
    // - `dragFillSourceRef` captures the envelope at pointerdown.
    // - `dragFillEnvelopeRef` is the live preview (read by handlers).
    // - `dragFillPreviewState` mirrors the preview envelope (drives
    //   `dragFillPreviewSet` useMemo + cell preview class re-render).
    // - `dragFillPointerIdRef` matches pointermove/up to pointerdown.
    // - `dragFillDraggingRef` gates the pointermove path.
    const dragFillSourceRef = useRef<CellRangeEnvelope | null>(null);
    const dragFillEnvelopeRef = useRef<CellRangeEnvelope | null>(null);
    const dragFillPointerIdRef = useRef<number | null>(null);
    const dragFillDraggingRef = useRef<boolean>(false);
    const [dragFillPreviewState, setDragFillPreviewState] = useState<{
      source: CellRangeEnvelope;
      fill: CellRangeEnvelope;
    } | null>(null);

    const dragFillPreviewSet = useMemo<ReadonlySet<string>>(() => {
      if (dragFillPreviewState == null) return EMPTY_PREVIEW_SET;
      const { source, fill } = dragFillPreviewState;
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
    }, [dragFillPreviewState]);

    /**
     * pointerdown handler attached to the drag-fill handle
     * overlay. Verbatim port of vue3's `onDragFillPointerdown`.
     */
    const onDragFillPointerDown = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>): void => {
        if (cellRangeSelection !== 'enabled') return;
        if (e.button !== 0) return;
        const source = cellRangeEnvelope;
        if (source.rowIds.length === 0 || source.colIds.length === 0) return;
        e.stopPropagation();
        e.preventDefault();
        const target = e.currentTarget;
        if (typeof target.setPointerCapture === 'function') {
          try {
            target.setPointerCapture(e.pointerId);
          } catch {
            // happy-dom / synthesized events can throw InvalidPointerId.
          }
        }
        dragFillSourceRef.current = source;
        dragFillEnvelopeRef.current = source;
        dragFillPointerIdRef.current = e.pointerId;
        dragFillDraggingRef.current = true;
        setDragFillPreviewState({ source, fill: source });
        onCellRangeFillStart?.({ source, jsEvent: e });
      },
      [cellRangeSelection, cellRangeEnvelope, onCellRangeFillStart],
    );

    /**
     * pointermove handler. Verbatim port of vue3's
     * `onDragFillPointermove` — resolves cell under pointer +
     * computeDragFillEnvelope + fires `onCellRangeFillChange` with
     * no-op dedup via `sameEnvelope`. Updates BOTH the imperative ref
     * (for next-tick dedup read) AND the preview state (for render).
     */
    const onDragFillPointerMove = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>): void => {
        if (!dragFillDraggingRef.current) return;
        if (dragFillPointerIdRef.current !== e.pointerId) return;
        if (typeof document === 'undefined') return;
        const source = dragFillSourceRef.current;
        if (source == null) return;
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el == null) return;
        const rowId = closestAttr(el, 'data-row-id');
        if (rowId == null || rowId === '__cx_select_all__') return;
        const colId = closestAttr(el, 'data-col-id');
        if (colId == null) return;
        const displayedRowIds = pagedRows.map((r) => r.id);
        const displayedColIds = visibleColumns.map((c) => c.id);
        const next = computeDragFillEnvelope(
          source,
          { rowId, colId },
          displayedRowIds,
          displayedColIds,
        );
        const prev = dragFillEnvelopeRef.current;
        if (prev != null && sameEnvelope(prev, next)) return;
        dragFillEnvelopeRef.current = next;
        setDragFillPreviewState({ source, fill: next });
        onCellRangeFillChange?.({ source, fill: next, jsEvent: e });
      },
      [pagedRows, visibleColumns, onCellRangeFillChange],
    );

    /**
     * pointerup handler. Verbatim port of vue3's
     * `onDragFillPointerup` — computes mutations + fires
     * `onCellRangeFill` + auto-extends the active cell-range to cover
     * the fill envelope.
     */
    const onDragFillPointerUp = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>): void => {
        if (!dragFillDraggingRef.current) return;
        if (dragFillPointerIdRef.current !== e.pointerId) return;
        const source = dragFillSourceRef.current;
        const fill = dragFillEnvelopeRef.current;
        dragFillDraggingRef.current = false;
        dragFillPointerIdRef.current = null;
        dragFillSourceRef.current = null;
        dragFillEnvelopeRef.current = null;
        setDragFillPreviewState(null);
        if (source == null || fill == null) return;
        const mutations = computeDragFillMutations(
          source,
          fill,
          rows,
          columns,
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
        onCellRangeFill?.({ source, fill, mutations, jsEvent: e });
        // auto-record into mutation history.
        recordBatchInternal('cell-range-fill', mutations);
        runPostBatchRowValidations(mutations);
      },
      [
        rows,
        columns,
        applyCellRangeStart,
        applyCellRangeDraft,
        onCellRangeFill,
        recordBatchInternal,
        resolvePasteValidatorGate,
        runPostBatchRowValidations,
      ],
    );

    /**
     * pointercancel handler. Drops the gesture without
     * firing the commit callback.
     */
    const onDragFillPointerCancel = useCallback((e: ReactPointerEvent<HTMLDivElement>): void => {
      if (!dragFillDraggingRef.current) return;
      if (dragFillPointerIdRef.current !== e.pointerId) return;
      dragFillDraggingRef.current = false;
      dragFillPointerIdRef.current = null;
      dragFillSourceRef.current = null;
      dragFillEnvelopeRef.current = null;
      setDragFillPreviewState(null);
    }, []);

    /**
     * programmatic drag-fill commit (TableHandle method).
     * Reads the live `cellRangeRef.current` + recomputes the source
     * envelope locally (NOT the closed-over `cellRangeEnvelope`
     * useMemo) so a consumer can call `setCellRange(...)` immediately
     * followed by `fillCellRange(...)` and observe the latest range.
     * Matches vue3's behavior where `cellRangeEnvelope.value` reads
     * live state via the ref getter; mirrors `applyCellRangeDraft`'s
     * `cellRangeRef.current`-driven pattern (Bundle I caught this
     * stale-closure bug in browser verify).
     */
    const performFillCellRange = useCallback(
      (targetCell: CellRef): readonly PasteMutation[] | null => {
        if (cellRangeSelection !== 'enabled') return null;
        const currentRange = cellRangeRef.current;
        if (currentRange == null) return null;
        const displayedRowIds = pagedRows.map((r) => r.id);
        const displayedColIds = visibleColumns.map((c) => c.id);
        const source = computeCellRangeEnvelope(currentRange, displayedRowIds, displayedColIds);
        if (source.rowIds.length === 0 || source.colIds.length === 0) return null;
        const fill = computeDragFillEnvelope(source, targetCell, displayedRowIds, displayedColIds);
        if (sameEnvelope(source, fill)) {
          return null;
        }
        const mutations = computeDragFillMutations(
          source,
          fill,
          rows,
          columns,
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
        onCellRangeFill?.({ source, fill, mutations, jsEvent: null });
        // auto-record into mutation history.
        recordBatchInternal('cell-range-fill', mutations);
        runPostBatchRowValidations(mutations);
        return mutations;
      },
      [
        cellRangeSelection,
        pagedRows,
        visibleColumns,
        rows,
        columns,
        applyCellRangeStart,
        applyCellRangeDraft,
        onCellRangeFill,
        recordBatchInternal,
        resolvePasteValidatorGate,
        runPostBatchRowValidations,
      ],
    );

    // body keydown handler. Gated on
    // `cellRangeSelection === 'enabled'` + Ctrl+C / Cmd+C. Calls
    // `e.preventDefault()` only when the gate passes so other
    // keystrokes propagate normally.
    //
    // extended to also detect Ctrl+V / Cmd+V
    // for the paste gesture. Same gate; same `e.preventDefault()`
    // discipline; single shared dispatch.
    //
    // (2026-05-27 — react port of vue3): extended
    // to also detect Ctrl+Z (undo) + Ctrl+Y / Ctrl+Shift+Z (redo).
    // The undo / redo branches gate INDEPENDENTLY of `cellRangeSelection`
    // so consumers can use the history without enabling cell-range
    // selection.
    // (2026-05-28 — react port of vue3): pinned-zone-
    // aware auto-scroll to bring the given cell into the body viewport.
    // Skips horizontal axis when the cell is in a pinned column (sticky
    // positioning → always visible regardless of scrollLeft). Defined
    // BEFORE applyActiveCellChange per react TDZ — useCallback dep on
    // this helper must see it already initialized.
    const runAutoScrollToCell = useCallback(
      (cell: CellRef): void => {
        const bodyEl = bodyRef.current;
        if (bodyEl == null) return;
        const targetTop = rowYByRowId[cell.rowId];
        if (targetTop == null) return;
        const targetHeight = rowHeightByRowId[cell.rowId] ?? mergedTheme.rowHeight;
        const targetWidth = widthByColId[cell.colId];
        if (targetWidth == null) return;
        let targetLeft = 0;
        for (const c of visibleColumns) {
          if (c.id === cell.colId) break;
          targetLeft += widthByColId[c.id] ?? 0;
        }
        const isPinned =
          pinnedColsResult.leftPinnedColIds.includes(cell.colId) ||
          pinnedColsResult.rightPinnedColIds.includes(cell.colId);
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
            left: pinnedColsResult.leftPinnedTotalWidth,
            right: pinnedColsResult.rightPinnedTotalWidth,
          },
        });
        const newScrollLeft = isPinned ? bodyEl.scrollLeft : next.scrollLeft;
        if (bodyEl.scrollTop !== next.scrollTop) bodyEl.scrollTop = next.scrollTop;
        if (bodyEl.scrollLeft !== newScrollLeft) bodyEl.scrollLeft = newScrollLeft;
      },
      [rowYByRowId, rowHeightByRowId, widthByColId, visibleColumns, pinnedColsResult, mergedTheme],
    );

    // (2026-05-28 — react port of vue3): emit-only
    // active-cell-change helper. Dedupes no-op transitions. Pass null
    // for `cell` to clear; the callback fires with `rowId: null,
    // colId: null`.
    // (2026-05-28 — react port of vue3): optional
    // `autoScroll` opt. Keyboard handler + programmatic `setActiveCell`
    // pass `true`; click handler + `clearActiveCell` keep default
    // `false`.
    const applyActiveCellChange = useCallback(
      (
        cell: CellRef | null,
        jsEvent: Event | null,
        opts?: { autoScroll?: boolean; announce?: boolean },
      ): void => {
        const current = activeCellRef.current;
        if (current == null && cell == null) return;
        if (current?.rowId === cell?.rowId && current?.colId === cell?.colId) {
          return;
        }
        activeCellRef.current = cell;
        setActiveCellState(cell);
        onActiveCellChange?.({
          rowId: cell?.rowId ?? null,
          colId: cell?.colId ?? null,
          jsEvent,
        });
        if (opts?.autoScroll === true && cell != null && enableKeyboardAutoScroll) {
          runAutoScrollToCell(cell);
        }
        // (2026-05-29 — react port): produce live-region
        // announce text for keyboard-driven transitions. Verbatim
        // mirror of vue3 wiring.
        if (opts?.announce === true && cell != null) {
          const row = rowDataSource.getById(cell.rowId);
          const column = columnTable.getById(cell.colId);
          if (row != null && column != null) {
            const selectionShown = selectionColumn.show === true;
            const colIdxBase = visibleColumns.findIndex((c) => c.id === cell.colId);
            const colIdx = colIdxBase < 0 ? 1 : colIdxBase + (selectionShown ? 2 : 1);
            const displayedIds = pagedRows.map((r) => r.id);
            const rowIdxBase = displayedIds.indexOf(cell.rowId);
            const rowIdx = rowIdxBase < 0 ? 2 : rowIdxBase + 2 + topPinnedRows.length;
            const colCount = visibleColumns.length + (selectionShown ? 1 : 0);
            const rowCount = 1 + topPinnedRows.length + pagedRows.length + bottomPinnedRows.length;
            const announceInput: FormatActiveCellAnnouncementInput = {
              row,
              column,
              rowIndex: rowIdx,
              rowCount,
              colIndex: colIdx,
              colCount,
            };
            const announceText =
              typeof announceActiveCellText === 'function'
                ? announceActiveCellText(announceInput)
                : formatActiveCellAnnouncement(announceInput);
            setSrAnnounceText(announceText);
          }
        }
      },
      [
        onActiveCellChange,
        enableKeyboardAutoScroll,
        runAutoScrollToCell,
        rowDataSource,
        columnTable,
        visibleColumns,
        pagedRows,
        topPinnedRows,
        bottomPinnedRows,
        selectionColumn,
        announceActiveCellText,
      ],
    );

    /**
     * (react port, 2026-05-28): tree-data keyboard handler
     * (Decision N.1). Returns `true` when the keystroke was consumed
     * or `false` to let the existing nav logic run. Verbatim port of
     * vue3 `maybeHandleTreeKeyboard`. Defined AFTER `applyActiveCellChange`
     * so it can call into the active-cell helper without TDZ.
     */
    const maybeHandleTreeKeyboard = useCallback(
      (navKey: string, e: ReactKeyboardEvent<HTMLDivElement>): boolean => {
        const active = activeCellRef.current;
        if (active == null) return false;
        if (treeColumnId == null || active.colId !== treeColumnId) return false;
        const row = flatTreeRows.find((r) => r.id === active.rowId);
        if (row == null) return false;
        const hasChildren = row.children != null && row.children.length > 0;
        const isExpanded = effectiveExpandedRowIdsSet.has(row.id);

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
            applyActiveCellChange({ rowId: parentId, colId: treeColumnId }, e.nativeEvent, {
              announce: true,
              autoScroll: true,
            });
            return true;
          }
          return false;
        }
        return false;
      },
      [
        treeColumnId,
        flatTreeRows,
        effectiveExpandedRowIdsSet,
        treeExpandState,
        applyActiveCellChange,
      ],
    );

    const onBodyKeyDown = useCallback(
      (e: ReactKeyboardEvent<HTMLDivElement>): void => {
        const modifier = e.ctrlKey || e.metaKey;
        // (2026-05-28 — react port of vue3): cell-
        // level keyboard navigation. Gated on enableKeyboardNavigation
        // + editor NOT active. Handles non-modifier nav keys + Ctrl+
        // Home / Ctrl+End. Existing modifier branches stay reachable
        // through fall-through.
        if (enableKeyboardNavigation && editingCellRef.current == null) {
          const navKey = e.key;
          // (react port, 2026-05-28): tree-data shortcuts
          // (Enter/Space toggle, ArrowR expand, ArrowL collapse/parent-
          // jump) handled BEFORE nav-direction resolution so tree
          // gestures take precedence over edit-start + arrow-nav for
          // parent rows.
          const treeKeyboardHandled = maybeHandleTreeKeyboard(navKey, e);
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
            const displayedRowIds = pagedRows.map((r) => r.id);
            const rowHeight = mergedTheme.rowHeight;
            const pageRowCount = Math.max(1, Math.floor((bodyClientHeight || 0) / rowHeight) || 1);
            const current = activeCellRef.current;
            // (2026-05-28 — react port of vue3):
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
                const row = rowDataSource.getById(rowId);
                if (row == null) return undefined;
                const col = columnTable.getById(colId);
                if (col == null) return undefined;
                return getCellValue({ row, column: col });
              };
              next = findDataRegionBoundary(
                current.rowId,
                current.colId,
                navDirection as DataRegionDirection,
                displayedRowIds,
                visibleColumns,
                cellValueFn,
              );
            } else {
              next = computeNextActiveCell(
                current?.rowId ?? null,
                current?.colId ?? null,
                displayedRowIds,
                visibleColumns,
                navDirection,
                pageRowCount,
              );
            }
            if (next != null) {
              e.preventDefault();
              // (2026-05-28 — react port of vue3):
              // shift+arrow extends cell-range; plain arrow with active
              // range collapses it (Decisions A.1 + B.1).
              if (e.shiftKey && cellRangeSelection === 'enabled') {
                const derived = deriveShiftArrowCellRange(
                  cellRangeRef.current,
                  activeCellRef.current,
                  next,
                );
                if (cellRangeRef.current == null) {
                  applyCellRangeStart(derived.anchor, null);
                }
                applyCellRangeDraft(derived.focus, null);
              } else if (cellRangeRef.current != null) {
                applyCellRangeClear();
              }
              applyActiveCellChange(next, e.nativeEvent, { autoScroll: true, announce: true });
            }
            return;
          }
          if (navKey === 'Enter' || navKey === 'F2') {
            const active = activeCellRef.current;
            if (active != null) {
              const col = columnTable.getById(active.colId);
              if (col?.editable === true) {
                e.preventDefault();
                applyEditStart(active.rowId, active.colId);
                return;
              }
            }
          }
          // (Decision C.1): Escape clears BOTH activeCell + cellRange.
          if (
            navKey === 'Escape' &&
            (activeCellRef.current != null || cellRangeRef.current != null)
          ) {
            if (cellRangeRef.current != null) applyCellRangeClear();
            if (activeCellRef.current != null) applyActiveCellChange(null, e.nativeEvent);
            return;
          }
        }
        if (!modifier) return;
        const key = e.key.toLowerCase();
        // undo / redo dispatch.
        if (enableUndoHistory) {
          const isUndo = key === 'z' && !e.shiftKey;
          const isRedo = (key === 'z' && e.shiftKey) || key === 'y';
          if (isUndo && mutationHistoryRef.current.past.length > 0) {
            e.preventDefault();
            performUndo(e);
            return;
          }
          if (isRedo && mutationHistoryRef.current.future.length > 0) {
            e.preventDefault();
            performRedo(e);
            return;
          }
        }
        // cell-range clipboard dispatch.
        if (cellRangeSelection !== 'enabled') return;
        const isCopyKey = key === 'c';
        const isPasteKey = key === 'v';
        if (!isCopyKey && !isPasteKey) return;
        if (cellRangeRef.current == null) return;
        if (cellRangeEnvelope.rowIds.length === 0 || cellRangeEnvelope.colIds.length === 0) {
          return;
        }
        e.preventDefault();
        if (isCopyKey) {
          void performCellRangeCopy(e);
        } else {
          void performCellRangePaste(e);
        }
      },
      [
        cellRangeSelection,
        cellRangeEnvelope,
        performCellRangeCopy,
        performCellRangePaste,
        enableUndoHistory,
        performUndo,
        performRedo,
        enableKeyboardNavigation,
        mergedTheme,
        bodyClientHeight,
        visibleColumns,
        columnTable,
        applyEditStart,
        pagedRows,
        applyActiveCellChange,
        maybeHandleTreeKeyboard,
      ],
    );

    // + 50.1: per-column filter-input update. Dispatches on
    // column.type: 'number' → parsePrefixNumberFilter (supports `5`,
    // `>10`, `<20`, `>=5`, `<=10`, `!=3`, `5..50`); other → text
    // filter with 'contains' operator. Empty value (or invalid
    // number-filter input) removes the entry so getFilter() doesn't
    // accumulate dead specs.
    const setFilterColumnValue = useCallback(
      (colId: string, value: string): void => {
        const current = filterSpecRef.current;
        const idx = current.findIndex(
          (s) => s.type !== 'expression' && s.type !== 'set' && s.colId === colId,
        );
        const column = columnTable.getById(colId);
        const isNumberColumn = column?.type === 'number';

        let newEntry: FilterSpec | null;
        if (value === '') {
          newEntry = null;
        } else if (isNumberColumn) {
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
      },
      [columnTable, applyFilter],
    );

    // round-trip the current filter spec back to the
    // visible input value for a given column. Lets external
    // setFilter calls reactively update the input text.
    const filterInputValueFor = useCallback((colId: string): string => {
      const entry = filterSpecRef.current.find(
        (s) => s.type !== 'expression' && s.type !== 'set' && s.colId === colId,
      );
      if (entry == null || entry.type === 'expression' || entry.type === 'set') return '';
      if (entry.type === 'text') return entry.value;
      if (entry.type === 'number') return formatPrefixNumberFilter(entry);
      return '';
    }, []);

    // (2026-05-29 — react port): set-filter dropdown helpers.
    // Verbatim port of vue3 surface — reads from filterSpecRef
    // for always-current state + dispatches via applyFilter.
    const getSetFilterValues = useCallback(
      (colId: string): readonly (string | number | boolean | null)[] | null => {
        const entry = filterSpecRef.current.find(
          (s): s is SetFilterSpec => s.type === 'set' && s.colId === colId,
        );
        if (entry == null) return null;
        return entry.selectedValues;
      },
      [],
    );

    const applySetFilterValues = useCallback(
      (
        colId: string,
        selectedValues: readonly (string | number | boolean | null)[] | null,
      ): void => {
        const current = filterSpecRef.current;
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
      },
      [applyFilter],
    );

    const setFilterSummaryLabel = useCallback(
      (colId: string, totalUnique: number): string => {
        const selection = getSetFilterValues(colId);
        if (selection == null) return `全部 (${totalUnique}) ▾`;
        if (selection.length === 0) return `空选 (0 / ${totalUnique}) ▾`;
        return `${selection.length} / ${totalUnique} ▾`;
      },
      [getSetFilterValues],
    );

    const isSetFilterValueChecked = useCallback(
      (colId: string, value: string | number | boolean | null): boolean => {
        const selection = getSetFilterValues(colId);
        if (selection == null) return true;
        for (const candidate of selection) {
          if (candidate === value) return true;
          if (candidate === null && value === null) return true;
        }
        return false;
      },
      [getSetFilterValues],
    );

    const toggleSetFilterValue = useCallback(
      (
        colId: string,
        value: string | number | boolean | null,
        allValues: readonly (string | number | boolean | null)[],
      ): void => {
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
      },
      [getSetFilterValues, applySetFilterValues, isSetFilterValueChecked],
    );

    // (2026-06-01 — react port): multi-filter container
    // helpers. Verbatim port of vue3 . The slot-count warn
    // registry is a `useRef<Set>` (no version counter needed; we
    // never read it during render — only mutate inside the bootstrap
    // path where the `console.warn` side effect is the goal).
    const multiFilterSlotCountWarnedRef = useRef<Set<string>>(new Set());
    const getMultiFilterSpec = useCallback(
      (colId: string): MultiFilterSpec | null => {
        const entry = filterSpec.find(
          (s): s is MultiFilterSpec => s.type === 'multi' && s.colId === colId,
        );
        return entry ?? null;
      },
      [filterSpec],
    );
    const bootstrapMultiFilterSpec = useCallback(
      (col: ColumnSpec): MultiFilterSpec => {
        const slots = col.multiFilterChildTypes ?? (['text', 'text'] as const);
        if (slots.length > 5 && !multiFilterSlotCountWarnedRef.current.has(col.id)) {
          console.warn(
            `[chronix-table] Column "${col.id}" multiFilterChildTypes has ${slots.length} ` +
              `entries; >5 stacked multi-filter widgets hurt the filter-row scan UX. ` +
              `Consider switching to the advanced filter DSL.`,
          );
          multiFilterSlotCountWarnedRef.current = new Set(
            multiFilterSlotCountWarnedRef.current,
          ).add(col.id);
        }
        const filters: MultiFilterChild[] = slots.map((kind) => {
          if (kind === 'text') return { type: 'text', operator: 'contains', value: '' };
          if (kind === 'set') return { type: 'set', selectedValues: null };
          return { type: 'number', operator: '=', value: 0 };
        });
        // (2026-06-02 — react port): consumer-supplied default mode.
        return { type: 'multi', colId: col.id, mode: multiFilterDefaultMode, filters };
      },
      [multiFilterDefaultMode],
    );
    const applyMultiFilterSpec = useCallback(
      (colId: string, spec: MultiFilterSpec | null): void => {
        const current = filterSpec;
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
      },
      [filterSpec, applyFilter],
    );
    const setMultiFilterChildValue = useCallback(
      (col: ColumnSpec, slotIdx: number, rawValue: string): void => {
        const current = getMultiFilterSpec(col.id) ?? bootstrapMultiFilterSpec(col);
        const existing = current.filters[slotIdx];
        // (2026-06-02 — react port): skip when slot is a group.
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
      },
      [getMultiFilterSpec, bootstrapMultiFilterSpec, applyMultiFilterSpec],
    );
    // (2026-06-02 — react port): set-child membership toggle.
    const toggleMultiFilterChildSetValue = useCallback(
      (col: ColumnSpec, slotIdx: number, value: string | number | boolean | null): void => {
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
      },
      [getMultiFilterSpec, bootstrapMultiFilterSpec, applyMultiFilterSpec],
    );
    const isMultiFilterChildSetValueChecked = useCallback(
      (col: ColumnSpec, slotIdx: number, value: string | number | boolean | null): boolean => {
        const spec = getMultiFilterSpec(col.id);
        if (spec == null) return false;
        const child = spec.filters[slotIdx];
        if (child?.type !== 'set') return false;
        const sel = child.selectedValues;
        if (sel == null) return false;
        return sel.some((v) => Object.is(v, value));
      },
      [getMultiFilterSpec],
    );
    // (2026-06-02 — react port): path-based mutation helpers.
    const getMultiFilterEntryAtPathInternal = useCallback(
      (colId: string, path: readonly number[]): MultiFilterEntry | null => {
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
      },
      [getMultiFilterSpec],
    );

    const replaceEntryAtPath = useCallback(
      (
        entries: readonly MultiFilterEntry[],
        path: readonly number[],
        pathIdx: number,
        next: MultiFilterEntry,
      ): readonly MultiFilterEntry[] => {
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
      },
      [],
    );

    const setMultiFilterEntryAtPathInternal = useCallback(
      (col: ColumnSpec, path: readonly number[], next: MultiFilterEntry): void => {
        if (path.length === 0) {
          throw new Error('empty path not allowed; use setFilter() for root spec.');
        }
        const current = getMultiFilterSpec(col.id) ?? bootstrapMultiFilterSpec(col);
        const rebuilt = replaceEntryAtPath(current.filters, path, 0, next);
        if (rebuilt === current.filters) return;
        applyMultiFilterSpec(col.id, { ...current, filters: rebuilt });
      },
      [getMultiFilterSpec, bootstrapMultiFilterSpec, applyMultiFilterSpec, replaceEntryAtPath],
    );

    const spliceEntryAtPath = useCallback(
      (
        entries: readonly MultiFilterEntry[],
        path: readonly number[],
        pathIdx: number,
      ): readonly MultiFilterEntry[] => {
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
      },
      [],
    );

    const removeMultiFilterEntryAtPathInternal = useCallback(
      (col: ColumnSpec, path: readonly number[]): void => {
        if (path.length === 0) {
          throw new Error('empty path not allowed; use setFilter(null) to clear.');
        }
        const current = getMultiFilterSpec(col.id);
        if (current == null) return;
        const rebuilt = spliceEntryAtPath(current.filters, path, 0);
        if (rebuilt === current.filters) return;
        applyMultiFilterSpec(col.id, { ...current, filters: rebuilt });
      },
      [getMultiFilterSpec, applyMultiFilterSpec, spliceEntryAtPath],
    );

    const setMultiFilterMode = useCallback(
      (col: ColumnSpec, mode: 'AND' | 'OR'): void => {
        const current = getMultiFilterSpec(col.id) ?? bootstrapMultiFilterSpec(col);
        if (current.mode === mode) return;
        applyMultiFilterSpec(col.id, { ...current, mode });
      },
      [getMultiFilterSpec, bootstrapMultiFilterSpec, applyMultiFilterSpec],
    );
    const multiFilterSummaryLabel = useCallback(
      (col: ColumnSpec): string => {
        const spec = getMultiFilterSpec(col.id);
        if (spec == null) return '未启用';
        const active = spec.filters.filter((f) => {
          if (f.type === 'text') return f.value !== '';
          if (f.type === 'number') return Number.isFinite(f.value);
          if (f.type === 'set') return f.selectedValues != null;
          return f.filters.length > 0;
        }).length;
        if (active === 0) return '未启用';
        const modeLabel = spec.mode === 'AND' ? '全部' : '任一';
        return `${active} 个筛选器 · ${modeLabel}`;
      },
      [getMultiFilterSpec],
    );

    // (2026-05-31 — react port): read the current Number
    // filter range for a column from the filterSpec. Verbatim port
    // of vue3 helper.
    const readNumberFilterRangeForCol = useCallback(
      (colId: string, extents: { min: number; max: number }): { low: number; high: number } => {
        const entry = filterSpec.find(
          (s): s is NumberFilterSpec => s.type === 'number' && s.colId === colId,
        );
        if (entry == null) return { low: extents.min, high: extents.max };
        if (entry.operator === 'inRange') {
          const low = entry.value;
          const high = entry.valueTo ?? entry.value;
          return { low: Math.min(low, high), high: Math.max(low, high) };
        }
        return { low: entry.value, high: entry.value };
      },
      [filterSpec],
    );

    // (2026-05-31 — react port): map a slider value to a
    // percent along the track. Verbatim port of vue3 helper.
    const rangeThumbLeftPercent = useCallback(
      (value: number, extents: { min: number; max: number }): number => {
        if (extents.max <= extents.min) return 0;
        const ratio = (value - extents.min) / (extents.max - extents.min);
        if (ratio < 0) return 0;
        if (ratio > 1) return 100;
        return ratio * 100;
      },
      [],
    );

    // (2026-05-31 — react port) + + Phase
    // 99.2.2 + (2026-06-01 — react port): cell style
    // editor helpers. Verbatim port of vue3.
    const openCellStyleEditor = useCallback(
      (rowId: string, colId: string): void => {
        if (!enableCellStyleEditor) return;
        const wrapperEl = wrapperRef.current;
        if (wrapperEl == null) return;
        const cellEl = wrapperEl.querySelector<HTMLElement>(
          `.cx-table-cell[data-row-id="${rowId}"][data-col-id="${colId}"]`,
        );
        if (cellEl == null) return;
        const rect = cellEl.getBoundingClientRect();
        const persistedEntry = effectiveCellStyleByRowIdColId[rowId]?.[colId];
        const persistedBgHex = persistedEntry?.backgroundColor ?? null;
        const persistedTextHex = persistedEntry?.color ?? null;
        const persistedFontWeight = persistedEntry?.fontWeight ?? null;
        const persistedFontStyle = persistedEntry?.fontStyle ?? null;
        const persistedTextDecoration = persistedEntry?.textDecoration ?? null;
        const persistedBorderColor = persistedEntry?.borderColor ?? null;
        const persistedBorderWidth = persistedEntry?.borderWidth ?? null;
        const persistedBorderStyle = persistedEntry?.borderStyle ?? null;
        const persistedBorderRadius = persistedEntry?.borderRadius ?? null;
        // (2026-06-01 — react port): 12 per-side fields.
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
          persistedBgHex == null &&
          persistedTextHex == null &&
          !hasFontOverride &&
          hasBorderOverride
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
        setCellStyleEditorOpen({
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
        });
      },
      [enableCellStyleEditor, effectiveCellStyleByRowIdColId],
    );

    const switchCellStyleEditorTab = useCallback(
      (tab: 'background' | 'text' | 'font' | 'border'): void => {
        setCellStyleEditorOpen((state) => {
          if (state == null) return null;
          if (state.activeTab === tab) return state;
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
          return {
            ...state,
            ...partialClosing,
            activeTab: tab,
            hsv: nextHsv,
            hex: rgbToHex(nextRgb),
          };
        });
      },
      [],
    );

    const toggleCellStyleFontWeight = useCallback((): void => {
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
        return {
          ...state,
          fontState: {
            ...state.fontState,
            fontWeight: state.fontState.fontWeight === '700' ? null : '700',
          },
        };
      });
    }, []);

    // (2026-06-01 — react port): set custom font weight.
    const setCellStyleFontWeight = useCallback((value: string | null): void => {
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
        return {
          ...state,
          fontState: { ...state.fontState, fontWeight: value },
        };
      });
    }, []);

    const toggleCellStyleFontStyle = useCallback((): void => {
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
        return {
          ...state,
          fontState: {
            ...state.fontState,
            fontStyle: state.fontState.fontStyle === 'italic' ? null : 'italic',
          },
        };
      });
    }, []);

    const setCellStyleTextDecoration = useCallback(
      (value: 'underline' | 'line-through' | null): void => {
        setCellStyleEditorOpen((state) => {
          if (state == null) return null;
          return {
            ...state,
            fontState: { ...state.fontState, textDecoration: value },
          };
        });
      },
      [],
    );

    // (2026-06-01 — react port): compute borderState
    // field name for axis + target. Verbatim mirror of vue3.
    function borderFieldFor(
      axis: 'Color' | 'Width' | 'Style',
      target: 'all' | 'top' | 'right' | 'bottom' | 'left',
    ): keyof CellStyleEntry {
      if (target === 'all') return `border${axis}`;
      const cap = target.charAt(0).toUpperCase() + target.slice(1);
      return `border${cap}${axis}` as keyof CellStyleEntry;
    }

    const setCellStyleBorderColor = useCallback((value: string): void => {
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
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
        return { ...state, borderState: next };
      });
    }, []);

    const setCellStyleBorderWidth = useCallback((value: string): void => {
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
        const field = borderFieldFor('Width', state.borderState.borderSideTarget);
        return {
          ...state,
          borderState: { ...state.borderState, [field]: value === '' ? null : value },
        };
      });
    }, []);

    const setCellStyleBorderStyle = useCallback(
      (value: 'solid' | 'dashed' | 'dotted' | null): void => {
        setCellStyleEditorOpen((state) => {
          if (state == null) return null;
          const field = borderFieldFor('Style', state.borderState.borderSideTarget);
          return {
            ...state,
            borderState: { ...state.borderState, [field]: value },
          };
        });
      },
      [],
    );

    const setCellStyleBorderRadius = useCallback((value: string): void => {
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
        return {
          ...state,
          borderState: { ...state.borderState, borderRadius: value === '' ? null : value },
        };
      });
    }, []);

    const setCellStyleBorderSideTarget = useCallback(
      (target: 'all' | 'top' | 'right' | 'bottom' | 'left'): void => {
        setCellStyleEditorOpen((state) => {
          if (state == null) return null;
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
          return {
            ...state,
            borderState: {
              ...bs,
              borderSideTarget: target,
              hsv: rgbToHsv(rgb),
              hex: effectiveHex,
            },
          };
        });
      },
      [],
    );

    const setCellStyleBorderHsv = useCallback((hsv: Hsv): void => {
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
        const rgb = hsvToRgb(hsv);
        const hex = rgbToHex(rgb);
        const field = borderFieldFor('Color', state.borderState.borderSideTarget);
        return {
          ...state,
          borderState: { ...state.borderState, hsv, hex, [field]: hex },
        };
      });
    }, []);

    const setCellStyleBorderRgbChannel = useCallback((ch: 'r' | 'g' | 'b', raw: number): void => {
      if (!Number.isFinite(raw)) return;
      const clamped = Math.max(0, Math.min(255, Math.round(raw)));
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
        const currentRgb = hsvToRgb(state.borderState.hsv);
        const nextRgb = { ...currentRgb, [ch]: clamped };
        const nextHsv = rgbToHsv(nextRgb);
        const hex = rgbToHex(nextRgb);
        const field = borderFieldFor('Color', state.borderState.borderSideTarget);
        return {
          ...state,
          borderState: { ...state.borderState, hsv: nextHsv, hex, [field]: hex },
        };
      });
    }, []);

    const cancelCellStyleEditor = useCallback((): void => {
      setCellStyleEditorOpen(null);
      cellStyleSquareDragRef.current = false;
      cellStyleHueDragRef.current = false;
      cellStyleFontWeightSliderDragRef.current = false;
      cellStyleBorderSquareDragRef.current = false;
      cellStyleBorderHueDragRef.current = false;
    }, []);

    const applyCellStyleEditor = useCallback((): void => {
      // (2026-06-01 — react port): gate internal writes
      // behind isUncontrolled. Verbatim mirror of vue3.
      const isUncontrolled = cellStyleByRowIdColId === undefined;
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
        const { rowId, colId, hex, activeTab, fontState, borderState } = state;
        if (activeTab === 'font') {
          if (isUncontrolled) {
            setInternalCellStyleByRowIdColId((prev) => {
              const prevForRow = prev[rowId] ?? {};
              const prevForCell = prevForRow[colId] ?? {};
              const nextForCell: CellStyleEntry = { ...prevForCell };
              if (fontState.fontWeight !== null) nextForCell.fontWeight = fontState.fontWeight;
              else delete nextForCell.fontWeight;
              if (fontState.fontStyle !== null) nextForCell.fontStyle = fontState.fontStyle;
              else delete nextForCell.fontStyle;
              if (fontState.textDecoration !== null)
                nextForCell.textDecoration = fontState.textDecoration;
              else delete nextForCell.textDecoration;
              return { ...prev, [rowId]: { ...prevForRow, [colId]: nextForCell } };
            });
          }
          onCellStyleChange?.({
            rowId,
            colId,
            style: {
              fontWeight: fontState.fontWeight,
              fontStyle: fontState.fontStyle,
              textDecoration: fontState.textDecoration,
            },
          });
        } else if (activeTab === 'border') {
          if (isUncontrolled) {
            setInternalCellStyleByRowIdColId((prev) => {
              const prevForRow = prev[rowId] ?? {};
              const prevForCell = prevForRow[colId] ?? {};
              const nextForCell: CellStyleEntry = { ...prevForCell };
              if (borderState.borderColor !== null)
                nextForCell.borderColor = borderState.borderColor;
              else delete nextForCell.borderColor;
              if (borderState.borderWidth !== null)
                nextForCell.borderWidth = borderState.borderWidth;
              else delete nextForCell.borderWidth;
              if (borderState.borderStyle !== null)
                nextForCell.borderStyle = borderState.borderStyle;
              else delete nextForCell.borderStyle;
              if (borderState.borderRadius !== null)
                nextForCell.borderRadius = borderState.borderRadius;
              else delete nextForCell.borderRadius;
              // (2026-06-01 — react port): 12 per-side fields.
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
              return { ...prev, [rowId]: { ...prevForRow, [colId]: nextForCell } };
            });
          }
          // (2026-06-01 — react port): track recent
          // borderColor (skip null). also push per-side.
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
          onCellStyleChange?.({
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
            setInternalCellStyleByRowIdColId((prev) => {
              const prevForRow = prev[rowId] ?? {};
              const prevForCell = prevForRow[colId] ?? {};
              return {
                ...prev,
                [rowId]: { ...prevForRow, [colId]: { ...prevForCell, [field]: hex } },
              };
            });
          }
          // (2026-06-01 — react port): track recent
          // bg/text color.
          pushRecentCellStyleColor(hex);
          onCellStyleChange?.({ rowId, colId, style: { [field]: hex } });
        }
        return null;
      });
      cellStyleSquareDragRef.current = false;
      cellStyleHueDragRef.current = false;
      cellStyleFontWeightSliderDragRef.current = false;
    }, [onCellStyleChange, cellStyleByRowIdColId, pushRecentCellStyleColor]);

    const clearCellStyleForCurrentCell = useCallback((): void => {
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
        const { rowId, colId, activeTab } = state;
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
        // (2026-06-01 — react port): gate internal Clear
        // writes behind isUncontrolled. Verbatim mirror of vue3.
        const isUncontrolled = cellStyleByRowIdColId === undefined;
        if (isUncontrolled)
          setInternalCellStyleByRowIdColId((prev) => {
            const prevForRow = prev[rowId];
            const prevForCell = prevForRow?.[colId];
            if (prevForRow == null || prevForCell == null) return prev;
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
            for (const key in prev) {
              if (key !== rowId) next[key] = prev[key]!;
            }
            if (Object.keys(nextForRow).length > 0) next[rowId] = nextForRow;
            return next;
          });
        const stylePayload: Partial<Record<keyof CellStyleEntry, string | null>> = {};
        for (const f of clearedFields) {
          stylePayload[f] = null;
        }
        onCellStyleChange?.({ rowId, colId, style: stylePayload });
        return null;
      });
      cellStyleSquareDragRef.current = false;
      cellStyleHueDragRef.current = false;
      cellStyleFontWeightSliderDragRef.current = false;
      cellStyleBorderSquareDragRef.current = false;
      cellStyleBorderHueDragRef.current = false;
    }, [onCellStyleChange, cellStyleByRowIdColId]);

    const setCellStyleEditorHsv = useCallback((hsv: Hsv): void => {
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
        const rgb = hsvToRgb(hsv);
        const hex = rgbToHex(rgb);
        return { ...state, hsv, hex };
      });
    }, []);

    const setCellStyleEditorHex = useCallback((hex: string): void => {
      setCellStyleEditorOpen((state) => {
        if (state == null) return null;
        const rgb = hexToRgb(hex);
        if (rgb == null) return state;
        const hsv = rgbToHsv(rgb);
        return { ...state, hsv, hex: rgbToHex(rgb) };
      });
    }, []);

    const setCellStyleEditorRgbChannel = useCallback(
      (channel: 'r' | 'g' | 'b', raw: number): void => {
        setCellStyleEditorOpen((state) => {
          if (state == null) return null;
          const clamped = Math.max(0, Math.min(255, Math.round(raw)));
          if (!Number.isFinite(clamped)) return state;
          const currentRgb = hsvToRgb(state.hsv);
          const nextRgb: Rgb = { ...currentRgb, [channel]: clamped };
          const hsv = rgbToHsv(nextRgb);
          return { ...state, hsv, hex: rgbToHex(nextRgb) };
        });
      },
      [],
    );

    // + 51.1: OS-conventional row-click selection semantics.
    // - 'none' → no-op.
    // - 'single' → plain click replaces; only-selected click deselects.
    // - 'multi' → plain click replaces; Ctrl/Cmd+click toggles;
    //   shift+click range from selectionAnchor .
    /**
     * (react port, 2026-05-28): cascade-add / cascade-
     * remove helpers. Verbatim port of vue3 helpers; in
     * react these are useCallback'd so other useCallbacks can depend
     * on stable references.
     */
    const cascadeAddDescendantIds = useCallback(
      (base: readonly string[], parentRowId: string): readonly string[] => {
        const descendants = collectDescendantRowIds(parentRowId, rows);
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
      },
      [rows],
    );

    const cascadeRemoveDescendantIds = useCallback(
      (base: readonly string[], parentRowId: string): readonly string[] => {
        const descendants = collectDescendantRowIds(parentRowId, rows);
        if (descendants.length === 0) return base;
        const remove = new Set<string>([parentRowId, ...descendants]);
        const next = base.filter((id) => !remove.has(id));
        return next.length === base.length ? base : next;
      },
      [rows],
    );

    const nextSelectionForClick = useCallback(
      (
        rowId: string,
        mode: 'none' | 'single' | 'multi',
        modifierActive: boolean,
        shiftActive: boolean,
      ): readonly string[] => {
        const current = selectedRowIdsRef.current;
        if (mode === 'none') return current;

        // shift+click range (multi-mode only) — operates
        // on filteredRows so range never spans filtered-out rows.
        // No anchor set → fall through to plain-click branch.
        // range gesture does NOT cascade descendants.
        if (mode === 'multi' && shiftActive && selectionAnchorRef.current != null) {
          const displayedIds = filteredRows.map((r) => r.id);
          const range = computeRangeRowIds(selectionAnchorRef.current, rowId, displayedIds);
          if (range.length > 0) return range;
        }

        if (mode === 'multi' && modifierActive) {
          const idx = current.indexOf(rowId);
          if (idx >= 0) {
            // cascade remove on ctrl+click toggle off.
            return cascadeRemoveDescendantIds(
              [...current.slice(0, idx), ...current.slice(idx + 1)],
              rowId,
            );
          }
          // cascade add on ctrl+click toggle on.
          return cascadeAddDescendantIds(current, rowId);
        }

        // Plain click in 'single' or 'multi' → replace; only-selected
        // click deselects.
        if (current.length === 1 && current[0] === rowId) {
          return [];
        }
        // plain-click replacement cascades descendants.
        return cascadeAddDescendantIds([rowId], rowId);
      },
      [filteredRows, cascadeAddDescendantIds, cascadeRemoveDescendantIds],
    );

    // per-row checkbox click semantics (always toggle;
    // checkbox is by definition multi). Shift+click reads anchor.
    const nextSelectionForCheckboxClick = useCallback(
      (rowId: string, shiftActive: boolean): readonly string[] => {
        const current = selectedRowIdsRef.current;

        if (shiftActive && selectionAnchorRef.current != null) {
          const displayedIds = filteredRows.map((r) => r.id);
          const range = computeRangeRowIds(selectionAnchorRef.current, rowId, displayedIds);
          if (range.length > 0) return range;
        }

        // checkbox toggle cascades descendants.
        const idx = current.indexOf(rowId);
        if (idx >= 0) {
          return cascadeRemoveDescendantIds(
            [...current.slice(0, idx), ...current.slice(idx + 1)],
            rowId,
          );
        }
        return cascadeAddDescendantIds(current, rowId);
      },
      [filteredRows, cascadeAddDescendantIds, cascadeRemoveDescendantIds],
    );

    // header "select-all" click semantics.
    // - Every displayed row selected → deselect all displayed (keeps
    //   selection on other pages / filtered-out rows).
    // - Some / none displayed selected → add all displayed to selection.
    // Anchor is NOT touched (broadcast action, not point-anchor).
    const nextSelectionForSelectAllClick = useCallback((): readonly string[] => {
      const displayedIds = filteredRows.map((r) => r.id);
      if (displayedIds.length === 0) return selectedRowIdsRef.current;

      const set = selectedRowIdsSet;
      const allSelected = displayedIds.every((id) => set.has(id));
      if (allSelected) {
        const displayedSet = new Set(displayedIds);
        return selectedRowIdsRef.current.filter((id) => !displayedSet.has(id));
      }
      const result = [...selectedRowIdsRef.current];
      for (const id of displayedIds) {
        if (!set.has(id)) result.push(id);
      }
      return result;
    }, [filteredRows, selectedRowIdsSet]);

    // Stable handle reference — `useImperativeHandle` rebuilds the
    // closure on each dependency change, so consumers reading
    // `handleRef.current` between renders get the up-to-date functions.
    // Using a stable `handleRef.current` for the `onTableReady` emit
    // ensures the emit-once useEffect always fires with the latest
    // closure rather than a stale Phase-1 snapshot.
    const handleRef = useRef<TableHandle | null>(null);
    useImperativeHandle(ref, (): TableHandle => {
      const handle: TableHandle = {
        getColumnTable: () => columnTable,
        getRowDataSource: () => rowDataSource,
        getResolvedWidth: (colId: string) => {
          const w = widthByColId[colId];
          return typeof w === 'number' ? w : undefined;
        },
        getSort: () => sortSpecRef.current,
        setSort: (spec: SortSpec | readonly SortSpec[] | null) =>
          applySort(normalizeSortInput(spec)),
        clearSort: () => applySort(EMPTY_SORT_SPECS),
        getFilter: () => filterSpecRef.current,
        setFilter: (spec: FilterSpec | readonly FilterSpec[] | null) =>
          applyFilter(normalizeFilterInput(spec)),
        clearFilter: () => applyFilter(EMPTY_FILTER_SPECS),
        getAdvancedFilter: () => {
          const found = filterSpecRef.current.find(
            (s): s is ExpressionFilterSpec => s.type === 'expression',
          );
          if (found == null) return null;
          return { expression: found.expression, source: found.source ?? null };
        },
        setAdvancedFilter: (expression: FilterExpression | null, source?: string) => {
          const others = filterSpecRef.current.filter((s) => s.type !== 'expression');
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
        parseAndSetAdvancedFilter: (text: string): ParseFilterExpressionResult => {
          const result = parseFilterExpression(text, { columns });
          if (!result.ok) return result;
          const others = filterSpecRef.current.filter((s) => s.type !== 'expression');
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
        getColumnUniqueValues: (
          colId: string,
          options?: { maxValues?: number },
        ): CollectUniqueColumnValuesResult => {
          const column = columns.find((c) => c.id === colId);
          if (column == null) {
            return { values: [], truncated: false };
          }
          return collectUniqueColumnValues({
            rows,
            column,
            ...(options?.maxValues != null ? { maxValues: options.maxValues } : {}),
          });
        },
        getQuickFindText: () => quickFindTextRef.current,
        setQuickFindText: (text: string | null | undefined) => applyQuickFindText(text ?? ''),
        getQuickFindMatchCount: () => quickFindMatchCount,
        getSelectedRowIds: () => selectedRowIdsRef.current,
        setSelectedRowIds: (ids: readonly string[] | null) => {
          const next = ids ?? EMPTY_ROW_IDS;
          applySelection(next);
          // programmatic set seeds anchor at first id
          // (matches "anchor follows latest intentional action" rule).
          if (next.length > 0) {
            selectionAnchorRef.current = next[0]!;
          }
        },
        clearSelection: () => applySelection(EMPTY_ROW_IDS),
        // Read from ref (always-current) so consumers calling
        // isRowSelected synchronously after setSelectedRowIds see the
        // new state — matching vue3's ref.value semantics. The
        // useMemo'd selectedRowIdsSet is for render-path O(1)
        // lookups; the handle's lookup builds a fresh Set lazily.
        isRowSelected: (rowId: string) => {
          const current = selectedRowIdsRef.current;
          // Fast path for short arrays — avoid Set allocation.
          if (current.length <= 8) return current.includes(rowId);
          return new Set(current).has(rowId);
        },
        // (vue3 equivalent): 5 pagination methods.
        // getPage / getTotalPages read the post-clamp values from the
        // pass (so `setPage(99)` over a 3-page dataset returns `2`).
        // getPageSize reads from the ref (the SFC's source of truth;
        // pagePass's pageSize is `0` for the passthrough case but
        // consumers should observe the SFC-tracked value).
        // (2026-05-30 — react port): serverSide+showPagination
        // reads from the session-derived computeds (pagePass is in
        // passthrough state). Verbatim mirror of vue3.
        getPage: () =>
          serverSidePaginationActive ? serverSideCurrentPageForFooter : currentPageFromPass,
        setPage: (page: number) => applyPage(page, pageSizeStateRef.current),
        getPageSize: () => pageSizeStateRef.current,
        setPageSize: (pageSize: number) => applyPage(pageStateRef.current, pageSize),
        getTotalPages: () =>
          serverSidePaginationActive ? serverSideTotalPagesForFooter : totalPagesFromPass,
        // (vue3 equivalent): 5 edit methods. All
        // route through the applyEdit* useCallbacks; getEditingCell
        // reads from the ref so it returns the latest state even
        // when called synchronously after setEditingCellDraft.
        startEditingCell: (rowId: string, colId: string) => applyEditStart(rowId, colId),
        commitEditingCell: () => applyEditCommit(),
        cancelEditingCell: () => applyEditCancel(),
        getEditingCell: () => editingCellRef.current,
        setEditingCellDraft: (value: unknown) => applyEditDraft(value),
        // (vue3 equivalent): 4 resize methods. All
        // route through the applyResize* useCallbacks;
        // getResizingColumn reads from the ref so it returns the
        // latest state synchronously after programmatic start.
        // `startResizingColumn(colId)` passes `startClientX=0` +
        // `pointerId=-1` because the SFC's onPointerMove handler
        // gates on `resizingColumnRef.current?.pointerId === e.pointerId`
        // so programmatic-start sessions don't accidentally drift
        // when a real pointer happens to be moving.
        startResizingColumn: (colId: string) => applyResizeStart(colId, 0, -1),
        commitColumnResize: () => applyResizeCommit(),
        cancelColumnResize: () => applyResizeCancel(),
        getResizingColumn: () => resizingColumnRef.current,
        startMovingColumn: (colId: string) => applyMoveStart(colId, 0, -1),
        commitColumnMove: (targetColId: string, position: 'before' | 'after') => {
          const current = movingColumnRef.current;
          if (current == null) return;
          const next: ColumnMoving = {
            colId: current.colId,
            startClientX: current.startClientX,
            dropTarget: { targetColId, position },
            dropLineLeftPx: current.dropLineLeftPx,
            pointerId: current.pointerId,
          };
          movingColumnRef.current = next;
          setMovingColumnState(next);
          applyMoveCommit();
        },
        cancelColumnMove: () => applyMoveCancel(),
        getMovingColumn: () => movingColumnRef.current,
        startMovingRow: (rowId: string) => applyRowMoveStart(rowId, 0, -1),
        commitRowMove: (targetRowId: string, position: 'above' | 'below') => {
          const current = movingRowRef.current;
          if (current == null) return;
          const next: RowMoving = {
            rowId: current.rowId,
            startClientY: current.startClientY,
            dropTarget: { targetRowId, position },
            dropLineTopPx: current.dropLineTopPx,
            pointerId: current.pointerId,
          };
          movingRowRef.current = next;
          setMovingRowState(next);
          applyRowMoveCommit();
        },
        cancelRowMove: () => applyRowMoveCancel(),
        getMovingRow: () => movingRowRef.current,
        refreshServerSideRows: () => {
          serverSideSessionRef.current?.refresh();
        },
        invalidateServerSideBlocks: (blockIndices: readonly number[]) => {
          serverSideSessionRef.current?.invalidateBlocks(blockIndices);
        },
        getServerSideTotalRowCount: () => serverSideSessionRef.current?.getTotalRowCount() ?? 0,
        getServerSideBlockState: (blockIndex: number): BlockState =>
          serverSideSessionRef.current?.getBlockState(blockIndex) ?? { kind: BLOCK_KIND_IDLE },
        openToolPanel: (id: string) => {
          if (toolPanelRef.current?.panels.some((p) => p.id === id) !== true) return;
          applyToolPanelChange(id);
        },
        closeToolPanel: () => applyToolPanelChange(null),
        getActiveToolPanelId: () => activeToolPanelIdRef.current,
        openColumnHeaderMenu: (colId: string) => {
          if (!showColumnHeaderMenuRef.current) return;
          const col = columnTableRef.current.getById(colId);
          if (col == null) return;
          applyOpenColumnHeaderMenu(colId);
        },
        closeColumnHeaderMenu: () => applyOpenColumnHeaderMenu(null),
        getOpenColumnHeaderMenuColId: () => openColumnHeaderMenuColIdRef.current,
        openContextMenuAt: (rowId: string | null, colId: string | null, x: number, y: number) => {
          applyOpenContextMenu(rowId, colId, x, y);
        },
        closeContextMenu: () => applyCloseContextMenu(),
        getOpenContextMenuPosition: () => contextMenuPositionRef.current,
        openCellStyleEditor: (rowId: string, colId: string) => {
          openCellStyleEditor(rowId, colId);
        },
        autosizeColumn: (colId: string) => applyAutosize(colId),
        autosizeAllColumns: () => applyAutosizeAll(),
        setCellRange: (range: CellRange | null) => {
          if (cellRangeSelection !== 'enabled') return;
          if (range == null) {
            applyCellRangeClear();
            return;
          }
          applyCellRangeStart(range.anchor, null);
          if (
            range.focus.rowId !== range.anchor.rowId ||
            range.focus.colId !== range.anchor.colId
          ) {
            applyCellRangeDraft(range.focus, null);
          }
        },
        clearCellRange: () => {
          if (cellRangeSelection !== 'enabled') return;
          applyCellRangeClear();
        },
        getCellRange: () => cellRangeRef.current,
        copyCellRangeToClipboard: () => performCellRangeCopy(null),
        pasteCellRangeFromClipboard: () => performCellRangePaste(null),
        fillCellRange: (targetCell: CellRef) => performFillCellRange(targetCell),
        undo: () => performUndo(null),
        redo: () => performRedo(null),
        canUndo: () => enableUndoHistory && mutationHistoryRef.current.past.length > 0,
        canRedo: () => enableUndoHistory && mutationHistoryRef.current.future.length > 0,
        clearHistory: () => {
          if (!enableUndoHistory) return;
          if (mutationHistoryRef.current === EMPTY_MUTATION_HISTORY) return;
          mutationHistoryRef.current = EMPTY_MUTATION_HISTORY;
          onHistoryChange?.({ history: mutationHistoryRef.current });
        },
        getHistory: () => mutationHistoryRef.current,
        recordMutationBatch: (batch: MutationBatch) => {
          if (!enableUndoHistory) return;
          mutationHistoryRef.current = appendMutationBatch(
            mutationHistoryRef.current,
            batch,
            undoHistoryMaxDepth,
          );
          onHistoryChange?.({ history: mutationHistoryRef.current });
        },
        setColumnVisibility: (colId: string, hidden: boolean) => {
          applyColumnVisibilityChange(colId, hidden, null);
        },
        toggleColumnVisibility: (colId: string) => {
          const col = columnTable.getById(colId);
          if (col == null) return;
          applyColumnVisibilityChange(colId, col.hide !== true, null);
        },
        getActiveCell: () => activeCellRef.current,
        setActiveCell: (rowId: string, colId: string) => {
          applyActiveCellChange({ rowId, colId }, null, { autoScroll: true });
        },
        clearActiveCell: () => {
          applyActiveCellChange(null, null);
        },
        expandRow: (rowId: string) => {
          treeExpandState.expand(rowId);
        },
        collapseRow: (rowId: string) => {
          treeExpandState.collapse(rowId);
        },
        getLazyChildrenState: (rowId: string): LazyChildrenStatus | 'idle' => {
          return lazyChildrenStateRef.current.get(rowId)?.status ?? 'idle';
        },
        getLazyChildren: (rowId: string): readonly RowSpec[] | null => {
          const state = lazyChildrenStateRef.current.get(rowId);
          if (state?.status === 'loaded' && state.children != null) {
            return state.children;
          }
          return null;
        },
        invalidateLazyChildren: (rowId?: string): void => {
          setLazyChildrenState((prev) => {
            const next = new Map(prev);
            if (rowId == null) next.clear();
            else next.delete(rowId);
            return next;
          });
        },
        exportToCsv: runExportToCsv,
        exportToXlsx: runExportToXlsx,
        exportToXlsxMultiSheet: runExportToXlsxMultiSheet,
        getInvalidCells: () => snapshotInvalidCells(),
        getMultiFilterEntryAtPath: (
          colId: string,
          path: readonly number[],
        ): MultiFilterEntry | null => getMultiFilterEntryAtPathInternal(colId, path),
        setMultiFilterEntryAtPath: (
          colId: string,
          path: readonly number[],
          next: MultiFilterEntry,
        ): void => {
          const col = columnTable.getById(colId);
          if (col == null) return;
          setMultiFilterEntryAtPathInternal(col, path, next);
        },
        removeMultiFilterEntryAtPath: (colId: string, path: readonly number[]): void => {
          const col = columnTable.getById(colId);
          if (col == null) return;
          removeMultiFilterEntryAtPathInternal(col, path);
        },
        getTableView: () =>
          serializeTableView({
            columns,
            sort: sortSpecRef.current,
            filter: filterSpecRef.current,
            page: currentPageFromPass,
            pageSize: pageSizeStateRef.current,
          }),
        applyTableView: (state: TableViewState) => {
          // (react port): mirror of vue3 wiring. Reconcile +
          // dispatch to 4 setters + invoke onColumnsChange once with
          // the reconciled array (Decision F.1 atomic restore).
          const result = applyTableView(
            state,
            columns,
            sortSpecRef.current,
            filterSpecRef.current,
            currentPageFromPass,
            pageSizeStateRef.current,
          );
          applySort(result.sort);
          applyFilter(result.filter);
          applyPage(result.page, result.pageSize);
          if (result.columns !== columns) {
            onColumnsChange?.({ columns: result.columns, reason: 'apply-view' });
          }
        },
      };
      handleRef.current = handle;
      return handle;
    }, [
      columnTable,
      rowDataSource,
      widthByColId,
      sortSpec,
      applySort,
      filterSpec,
      applyFilter,
      quickFindText,
      applyQuickFindText,
      quickFindMatchCount,
      selectedRowIds,
      applySelection,
      currentPageFromPass,
      totalPagesFromPass,
      applyPage,
      pageState,
      pageSizeState,
      editingCellState,
      applyEditStart,
      applyEditCommit,
      applyEditCancel,
      applyEditDraft,
      resizingColumnState,
      applyResizeStart,
      applyResizeCommit,
      applyResizeCancel,
      movingColumnState,
      applyMoveStart,
      applyMoveCommit,
      applyMoveCancel,
      applyAutosize,
      applyAutosizeAll,
      cellRangeSelection,
      applyCellRangeStart,
      applyCellRangeDraft,
      applyCellRangeClear,
      performCellRangeCopy,
      performCellRangePaste,
      performFillCellRange,
      enableUndoHistory,
      undoHistoryMaxDepth,
      performUndo,
      performRedo,
      onHistoryChange,
      applyColumnVisibilityChange,
      applyActiveCellChange,
      treeExpandState,
      columns,
      onColumnsChange,
      openCellStyleEditor,
    ]);

    // emit-once on mount. React's `useEffect`
    // with `[]` deps runs after the first render commits. Inside we
    // rebuild the handle locally because `handleRef.current` may not
    // be populated yet — `useImperativeHandle` runs at commit AND this
    // useEffect with `[]` deps runs once at the same commit pass; the
    // order is `useImperativeHandle` first, then `useEffect`.
    useEffect(() => {
      const cb = onTableReady;
      if (cb == null) return;
      const current =
        handleRef.current ??
        ({
          getColumnTable: () => columnTable,
          getRowDataSource: () => rowDataSource,
          getResolvedWidth: (colId: string) => {
            const w = widthByColId[colId];
            return typeof w === 'number' ? w : undefined;
          },
          getSort: () => sortSpecRef.current,
          setSort: (spec: SortSpec | readonly SortSpec[] | null) =>
            applySort(normalizeSortInput(spec)),
          clearSort: () => applySort(EMPTY_SORT_SPECS),
          getFilter: () => filterSpecRef.current,
          setFilter: (spec: FilterSpec | readonly FilterSpec[] | null) =>
            applyFilter(normalizeFilterInput(spec)),
          clearFilter: () => applyFilter(EMPTY_FILTER_SPECS),
          getAdvancedFilter: () => {
            const found = filterSpecRef.current.find(
              (s): s is ExpressionFilterSpec => s.type === 'expression',
            );
            if (found == null) return null;
            return { expression: found.expression, source: found.source ?? null };
          },
          setAdvancedFilter: (expression: FilterExpression | null, source?: string) => {
            const others = filterSpecRef.current.filter((s) => s.type !== 'expression');
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
          parseAndSetAdvancedFilter: (text: string): ParseFilterExpressionResult => {
            const result = parseFilterExpression(text, { columns });
            if (!result.ok) return result;
            const others = filterSpecRef.current.filter((s) => s.type !== 'expression');
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
          getColumnUniqueValues: (
            colId: string,
            options?: { maxValues?: number },
          ): CollectUniqueColumnValuesResult => {
            const column = columns.find((c) => c.id === colId);
            if (column == null) {
              return { values: [], truncated: false };
            }
            return collectUniqueColumnValues({
              rows,
              column,
              ...(options?.maxValues != null ? { maxValues: options.maxValues } : {}),
            });
          },
          getQuickFindText: () => quickFindTextRef.current,
          setQuickFindText: (text: string | null | undefined) => applyQuickFindText(text ?? ''),
          getQuickFindMatchCount: () => quickFindMatchCount,
          getSelectedRowIds: () => selectedRowIdsRef.current,
          setSelectedRowIds: (ids: readonly string[] | null) =>
            applySelection(ids ?? EMPTY_ROW_IDS),
          clearSelection: () => applySelection(EMPTY_ROW_IDS),
          isRowSelected: (rowId: string) => {
            const current = selectedRowIdsRef.current;
            if (current.length <= 8) return current.includes(rowId);
            return new Set(current).has(rowId);
          },
          // + 53: same 10 new methods as the
          // useImperativeHandle-built handle, in case the consumer
          // captured `onTableReady` before mount commit ran (rare
          // edge case — preserves vue3 parity for the fallback path).
          getPage: () =>
            serverSidePaginationActive ? serverSideCurrentPageForFooter : currentPageFromPass,
          setPage: (page: number) => applyPage(page, pageSizeStateRef.current),
          getPageSize: () => pageSizeStateRef.current,
          setPageSize: (pageSize: number) => applyPage(pageStateRef.current, pageSize),
          getTotalPages: () =>
            serverSidePaginationActive ? serverSideTotalPagesForFooter : totalPagesFromPass,
          startEditingCell: (rowId: string, colId: string) => applyEditStart(rowId, colId),
          commitEditingCell: () => applyEditCommit(),
          cancelEditingCell: () => applyEditCancel(),
          getEditingCell: () => editingCellRef.current,
          setEditingCellDraft: (value: unknown) => applyEditDraft(value),
          startResizingColumn: (colId: string) => applyResizeStart(colId, 0, -1),
          commitColumnResize: () => applyResizeCommit(),
          cancelColumnResize: () => applyResizeCancel(),
          getResizingColumn: () => resizingColumnRef.current,
          startMovingColumn: (colId: string) => applyMoveStart(colId, 0, -1),
          commitColumnMove: (targetColId: string, position: 'before' | 'after') => {
            const current = movingColumnRef.current;
            if (current == null) return;
            const next: ColumnMoving = {
              colId: current.colId,
              startClientX: current.startClientX,
              dropTarget: { targetColId, position },
              dropLineLeftPx: current.dropLineLeftPx,
              pointerId: current.pointerId,
            };
            movingColumnRef.current = next;
            setMovingColumnState(next);
            applyMoveCommit();
          },
          cancelColumnMove: () => applyMoveCancel(),
          getMovingColumn: () => movingColumnRef.current,
          startMovingRow: (rowId: string) => applyRowMoveStart(rowId, 0, -1),
          commitRowMove: (targetRowId: string, position: 'above' | 'below') => {
            const current = movingRowRef.current;
            if (current == null) return;
            const next: RowMoving = {
              rowId: current.rowId,
              startClientY: current.startClientY,
              dropTarget: { targetRowId, position },
              dropLineTopPx: current.dropLineTopPx,
              pointerId: current.pointerId,
            };
            movingRowRef.current = next;
            setMovingRowState(next);
            applyRowMoveCommit();
          },
          cancelRowMove: () => applyRowMoveCancel(),
          getMovingRow: () => movingRowRef.current,
          refreshServerSideRows: () => {
            serverSideSessionRef.current?.refresh();
          },
          invalidateServerSideBlocks: (blockIndices: readonly number[]) => {
            serverSideSessionRef.current?.invalidateBlocks(blockIndices);
          },
          getServerSideTotalRowCount: () => serverSideSessionRef.current?.getTotalRowCount() ?? 0,
          getServerSideBlockState: (blockIndex: number): BlockState =>
            serverSideSessionRef.current?.getBlockState(blockIndex) ?? { kind: BLOCK_KIND_IDLE },
          openToolPanel: (id: string) => {
            if (toolPanelRef.current?.panels.some((p) => p.id === id) !== true) return;
            applyToolPanelChange(id);
          },
          closeToolPanel: () => applyToolPanelChange(null),
          getActiveToolPanelId: () => activeToolPanelIdRef.current,
          openColumnHeaderMenu: (colId: string) => {
            if (!showColumnHeaderMenuRef.current) return;
            const col = columnTableRef.current.getById(colId);
            if (col == null) return;
            applyOpenColumnHeaderMenu(colId);
          },
          closeColumnHeaderMenu: () => applyOpenColumnHeaderMenu(null),
          getOpenColumnHeaderMenuColId: () => openColumnHeaderMenuColIdRef.current,
          openContextMenuAt: (rowId: string | null, colId: string | null, x: number, y: number) => {
            applyOpenContextMenu(rowId, colId, x, y);
          },
          closeContextMenu: () => applyCloseContextMenu(),
          getOpenContextMenuPosition: () => contextMenuPositionRef.current,
          openCellStyleEditor: (rowId: string, colId: string) => {
            openCellStyleEditor(rowId, colId);
          },
          autosizeColumn: (colId: string) => applyAutosize(colId),
          autosizeAllColumns: () => applyAutosizeAll(),
          setCellRange: (range: CellRange | null) => {
            if (cellRangeSelection !== 'enabled') return;
            if (range == null) {
              applyCellRangeClear();
              return;
            }
            applyCellRangeStart(range.anchor, null);
            if (
              range.focus.rowId !== range.anchor.rowId ||
              range.focus.colId !== range.anchor.colId
            ) {
              applyCellRangeDraft(range.focus, null);
            }
          },
          clearCellRange: () => {
            if (cellRangeSelection !== 'enabled') return;
            applyCellRangeClear();
          },
          getCellRange: () => cellRangeRef.current,
          copyCellRangeToClipboard: () => performCellRangeCopy(null),
          pasteCellRangeFromClipboard: () => performCellRangePaste(null),
          fillCellRange: (targetCell: CellRef) => performFillCellRange(targetCell),
          undo: () => performUndo(null),
          redo: () => performRedo(null),
          canUndo: () => enableUndoHistory && mutationHistoryRef.current.past.length > 0,
          canRedo: () => enableUndoHistory && mutationHistoryRef.current.future.length > 0,
          clearHistory: () => {
            if (!enableUndoHistory) return;
            if (mutationHistoryRef.current === EMPTY_MUTATION_HISTORY) return;
            mutationHistoryRef.current = EMPTY_MUTATION_HISTORY;
            onHistoryChange?.({ history: mutationHistoryRef.current });
          },
          getHistory: () => mutationHistoryRef.current,
          recordMutationBatch: (batch: MutationBatch) => {
            if (!enableUndoHistory) return;
            mutationHistoryRef.current = appendMutationBatch(
              mutationHistoryRef.current,
              batch,
              undoHistoryMaxDepth,
            );
            onHistoryChange?.({ history: mutationHistoryRef.current });
          },
          setColumnVisibility: (colId: string, hidden: boolean) => {
            applyColumnVisibilityChange(colId, hidden, null);
          },
          toggleColumnVisibility: (colId: string) => {
            const col = columnTable.getById(colId);
            if (col == null) return;
            applyColumnVisibilityChange(colId, col.hide !== true, null);
          },
          getActiveCell: () => activeCellRef.current,
          setActiveCell: (rowId: string, colId: string) => {
            applyActiveCellChange({ rowId, colId }, null, { autoScroll: true });
          },
          clearActiveCell: () => {
            applyActiveCellChange(null, null);
          },
          expandRow: (rowId: string) => {
            treeExpandState.expand(rowId);
          },
          collapseRow: (rowId: string) => {
            treeExpandState.collapse(rowId);
          },
          getLazyChildrenState: (rowId: string): LazyChildrenStatus | 'idle' => {
            return lazyChildrenStateRef.current.get(rowId)?.status ?? 'idle';
          },
          getLazyChildren: (rowId: string): readonly RowSpec[] | null => {
            const state = lazyChildrenStateRef.current.get(rowId);
            if (state?.status === 'loaded' && state.children != null) {
              return state.children;
            }
            return null;
          },
          invalidateLazyChildren: (rowId?: string): void => {
            setLazyChildrenState((prev) => {
              const next = new Map(prev);
              if (rowId == null) next.clear();
              else next.delete(rowId);
              return next;
            });
          },
          exportToCsv: runExportToCsv,
          exportToXlsx: runExportToXlsx,
          exportToXlsxMultiSheet: runExportToXlsxMultiSheet,
          getInvalidCells: () => snapshotInvalidCells(),
          getMultiFilterEntryAtPath: (
            colId: string,
            path: readonly number[],
          ): MultiFilterEntry | null => getMultiFilterEntryAtPathInternal(colId, path),
          setMultiFilterEntryAtPath: (
            colId: string,
            path: readonly number[],
            next: MultiFilterEntry,
          ): void => {
            const col = columnTable.getById(colId);
            if (col == null) return;
            setMultiFilterEntryAtPathInternal(col, path, next);
          },
          removeMultiFilterEntryAtPath: (colId: string, path: readonly number[]): void => {
            const col = columnTable.getById(colId);
            if (col == null) return;
            removeMultiFilterEntryAtPathInternal(col, path);
          },
          getTableView: () =>
            serializeTableView({
              columns,
              sort: sortSpecRef.current,
              filter: filterSpecRef.current,
              page: currentPageFromPass,
              pageSize: pageSizeStateRef.current,
            }),
          applyTableView: (state: TableViewState) => {
            const result = applyTableView(
              state,
              columns,
              sortSpecRef.current,
              filterSpecRef.current,
              currentPageFromPass,
              pageSizeStateRef.current,
            );
            applySort(result.sort);
            applyFilter(result.filter);
            applyPage(result.page, result.pageSize);
            if (result.columns !== columns) {
              onColumnsChange?.({ columns: result.columns, reason: 'apply-view' });
            }
          },
        } satisfies TableHandle);
      cb(current);
      // Intentionally empty deps — fire once on mount. Subsequent
      // column/row mutations re-render the table; consumers using
      // `onTableReady` to capture the handle should receive it once,
      // not on every re-render. The closure captures the latest
      // columnTable / rowDataSource / widthByColId at mount because
      // useImperativeHandle commits before this useEffect runs.
    }, []);

    // (vue3 equivalent): delegated body-
    // content click handler. Walks up from event.target to the
    // closest [data-row-id] / [data-col-id] ancestor and fires the
    // relevant callback. Per-event mutually-exclusive routing:
    //   - rowId resolved → row-click + (cell-click when colId also resolves)
    //   - rowId NOT resolved → empty-area-click
    const onBodyContentClick = useCallback(
      (jsEvent: ReactMouseEvent): void => {
        const rowId = closestAttr(jsEvent.target, 'data-row-id');
        if (rowId == null) {
          onEmptyAreaClick?.({ jsEvent });
          return;
        }
        const row = rowDataSource.getById(rowId);
        if (!row) return;
        onRowClick?.({ row, jsEvent });
        // + 51.1: apply OS-conventional selection semantics
        // BEFORE the cell-click emit so observers reading
        // getSelectedRowIds() in a cell-click handler see post-click
        // state. Skip for selection-column synthetic data-row-id="__cx_select_all__"
        // (handled by select-all click handler).
        if (selectionMode !== 'none' && rowId !== '__cx_select_all__') {
          const modifierActive = jsEvent.ctrlKey || jsEvent.metaKey;
          const shiftActive = jsEvent.shiftKey;
          const next = nextSelectionForClick(rowId, selectionMode, modifierActive, shiftActive);
          applySelection(next);
          setAnchorIfNotShift(rowId, shiftActive);
        }
        const colId = closestAttr(jsEvent.target, 'data-col-id');
        if (colId == null) return;
        const column = columnTable.getById(colId);
        if (!column) return;
        const value = getCellValue({ row, column });
        onCellClick?.({ row, column, value, jsEvent });
        // (react port of vue3): clicking a body cell
        // also writes the active cell so subsequent arrow keys move
        // from the clicked cell.
        if (enableKeyboardNavigation) {
          applyActiveCellChange({ rowId, colId }, jsEvent.nativeEvent);
        }
      },
      [
        columnTable,
        rowDataSource,
        onCellClick,
        onRowClick,
        onEmptyAreaClick,
        selectionMode,
        nextSelectionForClick,
        applySelection,
        setAnchorIfNotShift,
        enableKeyboardNavigation,
        applyActiveCellChange,
      ],
    );

    // per-row checkbox click handler. stopPropagation
    // prevents the body-row-click bubbling that would overwrite the
    // checkbox-toggle result.
    const onSelectionCheckboxClick = useCallback(
      (rowId: string, jsEvent: ReactMouseEvent): void => {
        jsEvent.stopPropagation();
        const shiftActive = jsEvent.shiftKey;
        const next = nextSelectionForCheckboxClick(rowId, shiftActive);
        applySelection(next);
        setAnchorIfNotShift(rowId, shiftActive);
      },
      [nextSelectionForCheckboxClick, applySelection, setAnchorIfNotShift],
    );

    // header "select-all" checkbox click handler.
    const onSelectAllCheckboxClick = useCallback(
      (jsEvent: ReactMouseEvent): void => {
        jsEvent.stopPropagation();
        const next = nextSelectionForSelectAllClick();
        applySelection(next);
      },
      [nextSelectionForSelectAllClick, applySelection],
    );

    // (vue3 equivalent): delegated body-content
    // dblclick handler. Symmetric to click; emits row-dblclick + cell-
    // dblclick (when colId resolves). Empty-area dblclicks are silently
    // ignored to match vue3 (consumers usually only care about
    // row/cell dblclick).
    //
    // (vue3 equivalent): after the cell-dblclick
    // emit, when the cell's column has `editable === true`, open the
    // inline editor on that cell. The double-click event itself does
    // not bubble through the cell-click handler (browsers fire
    // dblclick after the second click) so the selection-modifying
    // click handler already ran before this — applyEditStart's prior-
    // edit commit handles the rare case where another cell was mid-
    // edit when the user dblclick'd a new one.
    const onBodyContentDblclick = useCallback(
      (jsEvent: ReactMouseEvent): void => {
        const rowId = closestAttr(jsEvent.target, 'data-row-id');
        if (rowId == null) return;
        const row = rowDataSource.getById(rowId);
        if (!row) return;
        onRowDblclick?.({ row, jsEvent });
        const colId = closestAttr(jsEvent.target, 'data-col-id');
        if (colId == null) return;
        const column = columnTable.getById(colId);
        if (!column) return;
        const value = getCellValue({ row, column });
        onCellDblclick?.({ row, column, value, jsEvent });
        if (column.editable === true) {
          applyEditStart(rowId, colId);
        }
      },
      [columnTable, rowDataSource, onCellDblclick, onRowDblclick, applyEditStart],
    );

    // (vue3 equivalent): pointerover delegation
    // with sameRow filter for intra-row child element re-entries.
    const onBodyContentPointerOver = useCallback(
      (jsEvent: ReactPointerEvent): void => {
        if (sameRow(jsEvent.target, jsEvent.relatedTarget)) return;
        const rowId = closestAttr(jsEvent.target, 'data-row-id');
        if (rowId == null) return;
        const row = rowDataSource.getById(rowId);
        if (!row) return;
        onRowMouseenter?.({ row, jsEvent });
      },
      [rowDataSource, onRowMouseenter],
    );

    // (vue3 equivalent): pointerout delegation
    // with sameRow filter for intra-row child element exits.
    const onBodyContentPointerOut = useCallback(
      (jsEvent: ReactPointerEvent): void => {
        if (sameRow(jsEvent.target, jsEvent.relatedTarget)) return;
        const rowId = closestAttr(jsEvent.target, 'data-row-id');
        if (rowId == null) return;
        const row = rowDataSource.getById(rowId);
        if (!row) return;
        onRowMouseleave?.({ row, jsEvent });
      },
      [rowDataSource, onRowMouseleave],
    );

    // (2026-05-28 — react port): tooltip handlers. Verbatim
    // port of vue3 wiring (see vue3 chronix-table.ts for rationale).
    const clearTooltipTimer = useCallback((): void => {
      if (tooltipTimerIdRef.current != null) {
        window.clearTimeout(tooltipTimerIdRef.current);
        tooltipTimerIdRef.current = null;
      }
    }, []);
    const clearTooltip = useCallback((): void => {
      clearTooltipTimer();
      tooltipPendingCellRef.current = null;
      setTooltipActive(null);
    }, [clearTooltipTimer]);
    const scheduleTooltip = useCallback(
      (rowId: string, colId: string, cellRect: DOMRect): void => {
        if (editingCellRef.current != null) return;
        if (cellRangeRef.current != null) return;
        const wrapperEl = wrapperRef.current;
        if (wrapperEl == null) return;
        const wrapperRect = wrapperEl.getBoundingClientRect();
        const x = cellRect.right - wrapperRect.left + 4;
        const y = cellRect.bottom - wrapperRect.top + 2;
        clearTooltipTimer();
        tooltipPendingCellRef.current = { rowId, colId };
        tooltipTimerIdRef.current = window.setTimeout(() => {
          const pending = tooltipPendingCellRef.current;
          if (pending == null) return;
          if (pending.rowId !== rowId || pending.colId !== colId) return;
          const row = rowDataSource.getById(rowId);
          if (row == null) return;
          const column = columnTable.getById(colId);
          if (column == null) return;
          const text = resolveCellTooltip({ row, column });
          if (text == null) {
            setTooltipActive(null);
            return;
          }
          setTooltipActive({ rowId, colId, text, x, y });
        }, mergedTheme.tooltipDelayMs);
      },
      [clearTooltipTimer, rowDataSource, columnTable, mergedTheme.tooltipDelayMs],
    );
    const onBodyContentTooltipPointerMove = useCallback(
      (jsEvent: ReactPointerEvent<HTMLDivElement>): void => {
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
        const pending = tooltipPendingCellRef.current;
        const active = tooltipActive;
        if (active?.rowId === rowId && active.colId === colId) return;
        if (pending?.rowId === rowId && pending.colId === colId) return;
        setTooltipActive(null);
        scheduleTooltip(rowId, colId, cellEl.getBoundingClientRect());
      },
      [clearTooltip, scheduleTooltip, tooltipActive],
    );
    const onBodyTooltipPointerLeave = useCallback((): void => {
      clearTooltip();
    }, [clearTooltip]);
    const onBodyTooltipScroll = useCallback((): void => {
      clearTooltip();
    }, [clearTooltip]);

    // (vue3 equivalent): header rowgroup click
    // delegation. Walks to closest [data-col-id]; resolves the
    // ColumnSpec via columnTable.getById and fires onHeaderClick.
    // Attaches separately to .cx-table-header (sibling to body);
    // body-side handlers don't reach header elements via the body-
    // content delegation.
    //
    // (vue3 equivalent): also cycles the internal
    // sort state when the clicked column is sortable. Cycle is `null
    // → asc → desc → null`; clicking a different sortable column
    // resets to `asc` for that column. Non-sortable columns are
    // click-no-op for sort but onHeaderClick still fires.
    const onHeaderRowgroupClick = useCallback(
      (jsEvent: ReactMouseEvent): void => {
        // (2026-05-27 — react port of vue3): the
        // same delegate also walks up for `[data-group-name]` ancestors
        // so the group row's labelled cells fire onHeaderGroupClick.
        // Group cells do NOT carry `data-col-id`, so the leaf-cell
        // branch below is a clean skip when the click lands on a
        // group cell — no double-emit.
        const groupName = closestAttr(jsEvent.target, 'data-group-name');
        if (groupName != null) {
          const colIdsAttr = closestAttr(jsEvent.target, 'data-col-ids');
          const colIds: readonly string[] =
            typeof colIdsAttr === 'string' && colIdsAttr.length > 0 ? colIdsAttr.split(',') : [];
          onHeaderGroupClick?.({ groupName, colIds, jsEvent });
          return;
        }
        const colId = closestAttr(jsEvent.target, 'data-col-id');
        if (colId == null) return;
        const column = columnTable.getById(colId);
        if (!column) return;
        onHeaderClick?.({ column, jsEvent });
        if (column.sortable === false) return;
        // Read latest sort via the ref (B49.1 pattern).
        // shift+click composes (Excel-style multi-column);
        // plain click resets to single-column with the cycle.
        const current = sortSpecRef.current;
        const next: readonly SortSpec[] = jsEvent.shiftKey
          ? cycleMultiColumnSort(current, colId)
          : cycleSingleColumnSort(current, colId);
        applySort(next);
      },
      [columnTable, onHeaderClick, onHeaderGroupClick, applySort],
    );

    const t = mergedTheme;

    // (vue3 equivalent): selection-column
    // geometry. Declared early because header / filter row / body row
    // styles all reference totalWithSelection.
    const selectionColShow = selectionColumn.show;
    const selectionColSide = selectionColumn.side;
    const selectionColWidth = t.selectionColumnWidth;
    const totalWithSelection = selectionColShow ? totalWidth + selectionColWidth : totalWidth;
    // (react port).
    const rowDragColumnShow = rowDragColumn.show;
    const rowDragColumnSide = rowDragColumn.side ?? 'left';
    const rowDragColumnWidth = 30;
    const totalWithRowDrag = rowDragColumnShow
      ? totalWithSelection + rowDragColumnWidth
      : totalWithSelection;
    // (2026-05-31 — react port): mutual-exclusivity warn.
    const anyColHasRowDragHandle = visibleColumns.some((c) => c.rowDragHandle === true);
    if (rowDragColumnShow && anyColHasRowDragHandle && warnedRowDragMixedRef.current !== true) {
      warnedRowDragMixedRef.current = true;
      console.warn(
        'chronix-table: rowDragColumn.show is true; ColumnSpec.rowDragHandle flags are ignored.',
      );
    }

    // (2026-05-29 — react port): pre-compute aria-rowindex /
    // aria-colindex lookups. Verbatim mirror of vue3 logic.
    const pagedRowIdxByIdAria = new Map<string, number>(
      pagedRows.map((r, i) => [r.id, i] as const),
    );
    const visibleColIdxByIdAria = new Map<string, number>(
      visibleColumns.map((c, i) => [c.id, i] as const),
    );
    const selectionAriaColIdx = selectionColShow
      ? selectionColSide === 'left'
        ? 1
        : visibleColumns.length + 1
      : 0;
    function ariaColIndexFor(colId: string): number {
      const idx = visibleColIdxByIdAria.get(colId);
      if (idx === undefined) return 1;
      return idx + (selectionColShow && selectionColSide === 'left' ? 2 : 1);
    }
    function ariaRowIndexForBody(rowId: string): number {
      const pagedIdx = pagedRowIdxByIdAria.get(rowId);
      if (pagedIdx === undefined) return 2;
      return pagedIdx + 2 + topPinnedRows.length;
    }
    const ariaRowIndexAfterBody = 2 + topPinnedRows.length + pagedRows.length;

    // select-all state computed once per render to drive
    // the header checkbox's checked / indeterminate property. Uses
    // filteredRows so "displayed" means post-filter (not raw `rows`).
    const displayedRowIds: readonly string[] = filteredRows.map((r) => r.id);
    const displayedSelectedCount = displayedRowIds.reduce(
      (n, id) => (selectedRowIdsSet.has(id) ? n + 1 : n),
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

    // header checkbox needs `indeterminate` set via DOM
    // property (no HTML attribute equivalent). useEffect sets it
    // whenever selectAllState changes. Declared HERE (above the
    // header render) so build* helpers can reference `selectAllCheckboxRef`
    // without hitting a TDZ error (`const` is not hoisted).
    const selectAllCheckboxRef = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
      const el = selectAllCheckboxRef.current;
      if (el == null) return;
      el.indeterminate = selectAllState === 'indeterminate';
    }, [selectAllState]);

    // (2026-05-26 — react port of vue3): pinned-
    // column metadata for the current render. Source of truth for
    // per-cell sticky-offset application across header / filter /
    // body / selection-rail render. `pinnedColsResult` is the
    // useMemo above; reading once here flattens it into per-render
    // primitive locals so the per-cell closures don't reach into the
    // memoized object on every iteration.
    const pinnedLeftSet = useMemo(
      () => new Set(pinnedColsResult.leftPinnedColIds),
      [pinnedColsResult],
    );
    const pinnedRightSet = useMemo(
      () => new Set(pinnedColsResult.rightPinnedColIds),
      [pinnedColsResult],
    );
    const lastLeftPinnedColId =
      pinnedColsResult.leftPinnedColIds.length > 0
        ? pinnedColsResult.leftPinnedColIds[pinnedColsResult.leftPinnedColIds.length - 1]
        : null;
    const firstRightPinnedColId =
      pinnedColsResult.rightPinnedColIds.length > 0 ? pinnedColsResult.rightPinnedColIds[0] : null;
    const selectionRailLeftShift =
      selectionColShow && selectionColSide === 'left' ? selectionColWidth : 0;
    const selectionRailRightShift =
      selectionColShow && selectionColSide === 'right' ? selectionColWidth : 0;

    /**
     * helper: returns per-cell sticky-positioning style
     * additions for a column. Returns an empty record for center
     * columns so spreading into the existing cell `style` object is a
     * no-op. Modifier classes are emitted separately so CSS hooks
     * don't need to re-read inline style.
     */
    function pinnedCellStyle(colId: string): CSSProperties {
      if (pinnedLeftSet.has(colId)) {
        const offset = pinnedColsResult.leftOffsetByColId[colId] ?? 0;
        return {
          position: 'sticky',
          left: `${offset + selectionRailLeftShift}px`,
          zIndex: 2,
          background: 'var(--cx-table-pinned-zone-bg, inherit)',
        };
      }
      if (pinnedRightSet.has(colId)) {
        const offset = pinnedColsResult.rightOffsetByColId[colId] ?? 0;
        return {
          position: 'sticky',
          right: `${offset + selectionRailRightShift}px`,
          zIndex: 2,
          background: 'var(--cx-table-pinned-zone-bg, inherit)',
        };
      }
      return {};
    }

    /**
     * helper: returns per-cell zone modifier class suffixes.
     * The `--last` / `--first` modifier identifies the boundary cell
     * where the box-shadow visual separator paints.
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

    // the selection rail also sticks to its configured edge
    // during horizontal scroll so it stays paired with the pinned
    // columns it sits next to. `left: 0` (or `right: 0`) places it
    // OUTSIDE the pinned zones; left-pinned cells' sticky offsets are
    // shifted by `selectionColWidth` so they sit to the RIGHT of the
    // rail.
    const selectionRailStickyStyle: CSSProperties = selectionColShow
      ? selectionColSide === 'left'
        ? {
            position: 'sticky',
            left: '0px',
            zIndex: 3,
            background: 'var(--cx-table-pinned-zone-bg, inherit)',
          }
        : {
            position: 'sticky',
            right: '0px',
            zIndex: 3,
            background: 'var(--cx-table-pinned-zone-bg, inherit)',
          }
      : {};

    // row-drag rail sticky style — mirrors the selection rail but one
    // z-layer below so the selection rail wins on overlap. Applied to
    // the row-drag placeholder cells in the header / header-group /
    // filter / footer rows; the body row uses `buildRowDragGripCell`
    // which carries its own copy.
    const rowDragRailStickyStyle: CSSProperties = rowDragColumnShow
      ? rowDragColumnSide === 'left'
        ? {
            position: 'sticky',
            left: '0px',
            zIndex: 2,
            background: 'var(--cx-table-row-drag-rail-bg, #f8fafc)',
          }
        : {
            position: 'sticky',
            right: '0px',
            zIndex: 2,
            background: 'var(--cx-table-row-drag-rail-bg, #f8fafc)',
          }
      : {};

    const headerCellNodes = headerCells.map((cell) => {
      // + 49.1 (vue3 + 8.1 equivalent): per-cell sort
      // state + sortable lookup drive className modifiers + aria-sort
      // + the indicator span. when multi-column sort is
      // active (length > 1), append a superscript priority number
      // after the arrow so consumers can see the lex-order. Single-
      // column sort omits the superscript.
      const column = columnTable.getById(cell.colId);
      const isSortable = column?.sortable !== false;
      // actions columns are functional (row-action buttons), not data -
      // they never sort, never show the column-header menu, and are not
      // reorderable, regardless of the column-spec defaults.
      const isActionsCol = column?.actions != null;
      // (2026-05-29 — react port): visually-hidden description
      // text + aria-describedby reference so screen readers narrate sort
      // + filter state. Verbatim port of vue3 .
      const headerDescribedById = `cx-table-header-cell-desc-${cell.colId}`;
      const headerDescription: string =
        column != null
          ? formatColumnHeaderDescription({
              column,
              sortSpec,
              filterSpec,
            })
          : '';
      // (vue3): per-column `resizable: false` opt-
      // out of the drag-resize affordance. When opted out, no resizer
      // DOM renders + the column-resizing modifier is unreachable.
      const isResizable = column?.resizable !== false;
      const isResizingThis = resizingColumnState?.colId === cell.colId;
      // (2026-05-26 — react port of vue3): per-column
      // `reorderable: false` opt-out of the drag-to-reorder affordance.
      const isReorderable = column?.reorderable !== false;
      const isMovingThis = movingColumnState?.colId === cell.colId;
      const activeMoveDropTargetForRender = movingColumnState?.dropTarget ?? null;
      const isDropTargetBefore =
        activeMoveDropTargetForRender?.targetColId === cell.colId &&
        activeMoveDropTargetForRender?.position === 'before';
      const isDropTargetAfter =
        activeMoveDropTargetForRender?.targetColId === cell.colId &&
        activeMoveDropTargetForRender?.position === 'after';
      const activeIndex = sortSpec.findIndex((s) => s.colId === cell.colId);
      const direction = activeIndex >= 0 ? sortSpec[activeIndex]!.direction : null;
      const indicatorText = direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '';
      const showPosition = activeIndex >= 0 && sortSpec.length > 1;
      // pinned-zone modifier classes + sticky inline style
      // when the column is pinned. Empty record / empty array for
      // center columns so the spread / class push is a no-op.
      const pinnedHeaderStyle = pinnedCellStyle(cell.colId);
      const pinnedHeaderModifiers = pinnedCellModifierSuffixes(cell.colId).map(
        (suffix) => `cx-table-header-cell${suffix}`,
      );
      const cellStyle: CSSProperties = {
        // border-box keeps this cell's flex basis at its declared width so
        // the header row's column edges stay aligned with the body / filter
        // / group rows even when consumer CSS omits a box-sizing rule.
        boxSizing: 'border-box',
        width: `${widthByColId[cell.colId] ?? 0}px`,
        height: `${t.headerHeight}px`,
        paddingLeft: `${t.cellPaddingX}px`,
        paddingRight: `${t.cellPaddingX}px`,
        cursor: isReorderable ? 'grab' : isSortable ? 'pointer' : 'default',
        position: 'relative',
        ...pinnedHeaderStyle,
      };
      const className = [
        'cx-table-header-cell',
        isSortable && !isActionsCol && 'cx-table-header-cell--sortable',
        direction != null && 'cx-table-header-cell--sorted',
        isResizingThis && 'cx-table-header-cell--resizing',
        isReorderable && !isActionsCol && 'cx-table-header-cell--reorderable',
        isMovingThis && 'cx-table-header-cell--moving',
        isDropTargetBefore && 'cx-table-header-cell--drop-target-before',
        isDropTargetAfter && 'cx-table-header-cell--drop-target-after',
        ...pinnedHeaderModifiers,
      ]
        .filter(Boolean)
        .join(' ');
      const ariaSort: 'ascending' | 'descending' | 'none' =
        direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none';
      const indicatorClassName = [
        'cx-table-sort-indicator',
        direction != null && `cx-table-sort-indicator--${direction}`,
      ]
        .filter(Boolean)
        .join(' ');
      // (vue3): 4px pointer-capture resizer at the
      // right edge of every `resizable !== false` header cell. Once
      // setPointerCapture is called on the resizer element, all
      // subsequent pointermove + pointerup events fire on THAT
      // element regardless of cursor position — no global window
      // listeners needed. happy-dom (the vitest env) doesn't
      // implement setPointerCapture; the typeof guard skips it in
      // the test environment, the apply* helpers still exercise.
      const resizerClassName = [
        'cx-table-header-resizer',
        isResizingThis && 'cx-table-header-resizer--active',
      ]
        .filter(Boolean)
        .join(' ');
      const resizerNode = isResizable ? (
        <div
          className={resizerClassName}
          data-resizer-col-id={cell.colId}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            const target = e.currentTarget;
            if (typeof target.setPointerCapture === 'function') {
              target.setPointerCapture(e.pointerId);
            }
            applyResizeStart(cell.colId, e.clientX, e.pointerId);
          }}
          onPointerMove={(e) => {
            if (resizingColumnRef.current?.pointerId !== e.pointerId) return;
            applyResizeDraft(e.clientX);
          }}
          onPointerUp={(e) => {
            if (resizingColumnRef.current?.pointerId !== e.pointerId) return;
            resizeCommitInProgressRef.current = true;
            applyResizeCommit();
            // Defer the guard reset to a microtask so the
            // lostpointercapture event (which fires AFTER pointerup
            // releases the capture) sees the flag still set and
            // skips the redundant cancel path. Mirrors the Phase
            // 53.2 queueMicrotask pattern.
            queueMicrotask(() => {
              resizeCommitInProgressRef.current = false;
            });
          }}
          onPointerCancel={() => {
            if (resizeCommitInProgressRef.current) return;
            if (resizingColumnRef.current != null) {
              applyResizeCancel();
            }
          }}
          onLostPointerCapture={() => {
            if (resizeCommitInProgressRef.current) return;
            if (resizingColumnRef.current != null) {
              applyResizeCancel();
            }
          }}
          // Defensive — a click on the 4px hit-area must not bubble
          // up to the header-cell's sort click.
          onClick={(e) => e.stopPropagation()}
          // (2026-05-26 — react port of vue3):
          // dbl-click on the resizer autosizes the column to its
          // content. Gated on `autosizeable !== false` (separate
          // opt-out from `resizable`). preventDefault +
          // stopPropagation so the dblclick doesn't bubble up to any
          // consumer-wired onCellDblclick / onRowDblclick callbacks.
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (column?.autosizeable === false) return;
            applyAutosize(cell.colId);
          }}
        />
      ) : null;
      // whole-header-cell pointer wiring for
      // column-move drag. Gated on `reorderable !== false`. The resizer
      // stops propagation on its pointerdown so grabbing
      // the 4px edge wins. Move handler never preventDefault's the
      // pointerdown — that would break the header click → sort cycle
      // delegated on `.cx-table-header` parent.
      const moveHandlers = isReorderable
        ? {
            onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => {
              if (e.button !== 0) return;
              const target = e.currentTarget;
              if (typeof target.setPointerCapture === 'function') {
                try {
                  target.setPointerCapture(e.pointerId);
                } catch {
                  // Defensive: setPointerCapture throws InvalidPointerId
                  // on synthesized events without an active pointer
                  // (B14.3 lesson).
                }
              }
              pendingMoveColumnRef.current = {
                colId: cell.colId,
                startClientX: e.clientX,
                startClientY: e.clientY,
                pointerId: e.pointerId,
              };
            },
            onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => {
              const pending = pendingMoveColumnRef.current;
              if (pending?.pointerId === e.pointerId) {
                const dx = Math.abs(e.clientX - pending.startClientX);
                const dy = Math.abs(e.clientY - pending.startClientY);
                if (Math.max(dx, dy) >= DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX) {
                  applyMoveStart(pending.colId, pending.startClientX, pending.pointerId);
                  pendingMoveColumnRef.current = null;
                  applyMoveDraft(e.clientX);
                }
                return;
              }
              if (movingColumnRef.current?.pointerId !== e.pointerId) return;
              applyMoveDraft(e.clientX);
            },
            onPointerUp: (e: ReactPointerEvent<HTMLDivElement>) => {
              const pending = pendingMoveColumnRef.current;
              if (pending?.pointerId === e.pointerId) {
                pendingMoveColumnRef.current = null;
                return;
              }
              if (movingColumnRef.current?.pointerId !== e.pointerId) return;
              moveCommitInProgressRef.current = true;
              applyMoveCommit();
              queueMicrotask(() => {
                moveCommitInProgressRef.current = false;
              });
            },
            onPointerCancel: () => {
              pendingMoveColumnRef.current = null;
              if (moveCommitInProgressRef.current) return;
              if (movingColumnRef.current != null) applyMoveCancel();
            },
            onLostPointerCapture: () => {
              pendingMoveColumnRef.current = null;
              if (moveCommitInProgressRef.current) return;
              if (movingColumnRef.current != null) applyMoveCancel();
            },
          }
        : {};
      return (
        <div
          key={`header-${cell.colId}`}
          className={className}
          role="columnheader"
          data-col-id={cell.colId}
          aria-colindex={ariaColIndexFor(cell.colId)}
          aria-sort={ariaSort}
          aria-describedby={headerDescribedById}
          style={cellStyle}
          {...moveHandlers}
        >
          {/* Settings icon for the action column header. Renders only
           * when toolPanel.show is true AND this column has `actions`
           * defined (even an empty array). When actions is non-empty,
           * the label text ("操作") is shown alongside the icon. When
           * actions is empty, only the icon is shown (no label). */}
          {(() => {
            const toolPanelEnabled =
              toolPanel != null && toolPanel.show && toolPanel.panels.length > 0;
            const colForSettings = columnTable.getById(cell.colId);
            const isActionsColForSettings = colForSettings?.actions != null;
            const showHeaderLabel =
              !isActionsColForSettings || (colForSettings?.actions?.length ?? 0) > 0;
            return (
              <>
                {showHeaderLabel && (
                  <span className="cx-table-header-cell-label">{cell.label}</span>
                )}
                {toolPanelEnabled && isActionsColForSettings && (
                  <button
                    ref={(el: HTMLButtonElement | null) => {
                      settingsIconButtonRef.current = el;
                    }}
                    type="button"
                    className={[
                      'cx-table-header-settings-button',
                      settingsPopoverOpen && 'cx-table-header-settings-button--open',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-haspopup="dialog"
                    aria-expanded={settingsPopoverOpen ? 'true' : 'false'}
                    aria-label="设置"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSettingsPopover();
                    }}
                  >
                    ⚙
                  </button>
                )}
              </>
            );
          })()}
          {isSortable && !isActionsCol && (
            <span className={indicatorClassName} data-sort-direction={direction ?? ''}>
              {indicatorText}
              {showPosition && (
                <sup
                  className="cx-table-sort-indicator-position"
                  data-sort-position={String(activeIndex + 1)}
                >
                  {String(activeIndex + 1)}
                </sup>
              )}
            </span>
          )}
          <span
            id={headerDescribedById}
            className="cx-table-header-cell__sr-description"
            style={SR_ONLY_STYLE}
          >
            {headerDescription}
          </span>
          {showColumnHeaderMenu === true &&
            !isActionsCol &&
            (() => {
              const isOpen = openColumnHeaderMenuColId === cell.colId;
              return (
                <button
                  type="button"
                  className={['cx-table-column-header-menu-button'].filter(Boolean).join(' ')}
                  data-col-id={cell.colId}
                  aria-haspopup="menu"
                  aria-expanded={isOpen ? 'true' : 'false'}
                  aria-label="列操作菜单"
                  onPointerDown={(e: ReactPointerEvent) => {
                    e.stopPropagation();
                  }}
                  onClick={(e: ReactMouseEvent) => {
                    e.stopPropagation();
                    applyOpenColumnHeaderMenu(isOpen ? null : cell.colId);
                  }}
                >
                  <svg
                    width="14"
                    height="16"
                    viewBox="0 0 14 16"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="7" cy="4" r="1.2" />
                    <circle cx="7" cy="8" r="1.2" />
                    <circle cx="7" cy="12" r="1.2" />
                  </svg>
                </button>
              );
            })()}
          {resizerNode}
        </div>
      );
    });

    const headerRowStyle: CSSProperties = { width: `${totalWithRowDrag}px` };
    const headerChildrenWithSelection = selectionColShow
      ? selectionColSide === 'left'
        ? [buildHeaderSelectionCell(), ...headerCellNodes]
        : [...headerCellNodes, buildHeaderSelectionCell()]
      : headerCellNodes;
    // prepend / append the row-drag rail placeholder so the header's
    // column boundaries align with the body's (body carries the grip).
    const headerChildren = rowDragColumnShow
      ? rowDragColumnSide === 'left'
        ? [buildHeaderRowDragCell(), ...headerChildrenWithSelection]
        : [...headerChildrenWithSelection, buildHeaderRowDragCell()]
      : headerChildrenWithSelection;
    const headerRow = (
      <div
        className="cx-table-row cx-table-row--header"
        role="row"
        aria-rowindex={1}
        style={headerRowStyle}
      >
        {headerChildren}
      </div>
    );

    // (2026-05-27 — react port): when ANY visible
    // column declares a `headerGroup`, prepend N group rows above the
    // leaf row (N = table-wide max nesting depth). Per vue3
    // Decision B.1 + vue3 Decision B.1, all rows have the
    // same column alignment — un-covered cells at a given level
    // render as singleton empty placeholders so the leaf row stays
    // vertically aligned. Per Decision A.1, groups never
    // span pinned-zone boundaries.
    function buildHeaderGroupSpanCell(
      span: HeaderGroupSpan,
      zoneKey: string,
      levelIdx: number,
    ): ReactNode {
      let spanWidth = 0;
      for (const id of span.colIds) spanWidth += widthByColId[id] ?? 0;
      const isEmpty = span.groupName == null;
      const cellClassName =
        'cx-table-header-group' + (isEmpty ? ' cx-table-header-group--empty' : '');
      // pinned-zone group cells stick to their edge so the group label
      // stays aligned with its pinned columns during horizontal scroll
      // (mirrors the leaf-cell pinned style). center groups scroll.
      let groupStickyStyle: Partial<CSSProperties> = {};
      if (zoneKey === 'L' && span.colIds.length > 0) {
        const firstOffset = pinnedColsResult.leftOffsetByColId[span.colIds[0] ?? ''] ?? 0;
        groupStickyStyle = {
          position: 'sticky',
          left: `${firstOffset + selectionRailLeftShift}px`,
          zIndex: 2,
        };
      } else if (zoneKey === 'R' && span.colIds.length > 0) {
        const lastColId = span.colIds[span.colIds.length - 1] ?? '';
        const lastOffset = pinnedColsResult.rightOffsetByColId[lastColId] ?? 0;
        groupStickyStyle = {
          position: 'sticky',
          right: `${lastOffset + selectionRailRightShift}px`,
          zIndex: 2,
        };
      }
      const cellStyle: CSSProperties = {
        width: `${spanWidth}px`,
        height: `${t.headerGroupHeight}px`,
        boxSizing: 'border-box',
        // Every group-row cell uses the group bg — including empty cells over
        // columns that have no parent group — so the group strip is a uniform
        // band (center empty cells used to be transparent, which made grouped
        // vs ungrouped columns look inconsistent).
        background: 'var(--cx-table-header-group-bg, #e8ecf0)',
        paddingLeft: `${t.cellPaddingX}px`,
        paddingRight: `${t.cellPaddingX}px`,
        ...groupStickyStyle,
      };
      if (isEmpty) {
        return (
          <div
            key={`header-group-${zoneKey}-L${levelIdx}-${span.startColIdx}-${span.endColIdx}`}
            className={cellClassName}
            role="columnheader"
            data-header-group-level={String(levelIdx)}
            aria-colindex={ariaColIndexFor(span.colIds[0] ?? '')}
            style={cellStyle}
          />
        );
      }
      return (
        <div
          key={`header-group-${zoneKey}-L${levelIdx}-${span.startColIdx}-${span.endColIdx}`}
          className={cellClassName}
          role="columnheader"
          data-header-group-level={String(levelIdx)}
          data-group-name={span.groupName ?? undefined}
          data-col-ids={span.colIds.join(',')}
          aria-colindex={ariaColIndexFor(span.colIds[0] ?? '')}
          style={cellStyle}
        >
          <span className="cx-table-header-group-label">{span.groupName}</span>
        </div>
      );
    }
    const headerGroupRowsJsx: ReactNode[] = [];
    if (headerGroupRowsByZone != null) {
      for (let levelIdx = 0; levelIdx < tableMaxHeaderDepth; levelIdx++) {
        const leftCells = (headerGroupRowsByZone.left[levelIdx] ?? []).map((s) =>
          buildHeaderGroupSpanCell(s, 'L', levelIdx),
        );
        const centerCells = (headerGroupRowsByZone.center[levelIdx] ?? []).map((s) =>
          buildHeaderGroupSpanCell(s, 'C', levelIdx),
        );
        const rightCells = (headerGroupRowsByZone.right[levelIdx] ?? []).map((s) =>
          buildHeaderGroupSpanCell(s, 'R', levelIdx),
        );
        const selectionPlaceholder: ReactNode = selectionColShow ? (
          <div
            key={`header-group-selection-L${levelIdx}`}
            className="cx-table-header-group cx-table-header-group--empty"
            role="columnheader"
            style={{
              width: `${selectionColWidth}px`,
              height: `${t.headerGroupHeight}px`,
              background: 'transparent',
              ...selectionRailStickyStyle,
            }}
          />
        ) : null;
        const rowDragPlaceholder: ReactNode = rowDragColumnShow ? (
          <div
            key={`header-group-row-drag-L${levelIdx}`}
            className="cx-table-header-group cx-table-header-group--empty cx-table-row-drag-cell"
            role="columnheader"
            style={{
              width: `${rowDragColumnWidth}px`,
              height: `${t.headerGroupHeight}px`,
              background: 'transparent',
              ...rowDragRailStickyStyle,
            }}
          />
        ) : null;
        const orderedZoneCells: ReactNode[] = [...leftCells, ...centerCells, ...rightCells];
        const rowChildrenWithSelection: ReactNode[] = selectionColShow
          ? selectionColSide === 'left'
            ? [selectionPlaceholder, ...orderedZoneCells]
            : [...orderedZoneCells, selectionPlaceholder]
          : orderedZoneCells;
        const rowChildren: ReactNode[] = rowDragPlaceholder
          ? rowDragColumnSide === 'left'
            ? [rowDragPlaceholder, ...rowChildrenWithSelection]
            : [...rowChildrenWithSelection, rowDragPlaceholder]
          : rowChildrenWithSelection;
        headerGroupRowsJsx.push(
          <div
            key={`header-group-row-L${levelIdx}`}
            className="cx-table-row cx-table-row--header-group"
            role="row"
            data-header-group-level={String(levelIdx)}
            style={headerRowStyle}
          >
            {rowChildren}
          </div>,
        );
      }
    }

    const header = (
      <div
        ref={headerRef}
        className="cx-table-header"
        role="rowgroup"
        // `overflowX: hidden` makes header a
        // horizontal-clip container with a meaningful `scrollLeft`
        // setter; the body's `onScroll` handler mirrors
        // `body.scrollLeft → headerEl.scrollLeft` so the header row
        // visually scrolls in lockstep with body cells.
        //
        // `overflowY: 'scroll'` reserves the same vertical-scrollbar
        // gutter the body's `overflowY` scrollbar occupies, so a
        // pinned-right column's sticky `right: 0` anchors to the SAME
        // right content edge in the header as in the body. Without it
        // the body's ~15px classic scrollbar shifts the body's pinned
        // column left of the header's by the scrollbar width (filter
        // row + footer mirror this for the same reason).
        //
        // `onHeaderRowgroupClick` extended with
        // a `[data-group-name]` ancestor walk so the same delegate also
        // fires `onHeaderGroupClick` for the group row's labelled cells.
        //
        // `--cx-table-header-group-rows-h` exposes the group-rows total height
        // so the demo CSS can paint the 15px scrollbar gutter with a split
        // background (group bg over the group rows, leaf bg over the leaf row).
        // Without it the gutter shows the leaf bg alone and mismatches the group
        // row it sits beside.
        style={
          {
            overflowX: 'hidden',
            overflowY: 'scroll',
            '--cx-table-header-group-rows-h': `${tableMaxHeaderDepth * t.headerGroupHeight}px`,
          } as CSSProperties
        }
        onClick={onHeaderRowgroupClick}
      >
        {headerGroupRowsJsx}
        {headerRow}
      </div>
    );

    // + 50.1 (vue3 + 9.1 equivalent): opt-in filter
    // row beneath the header. One <input> per visible column; per-
    // input value reads from filterInputValueFor(colId). Number
    // columns get data-filter-type="number" + prefix-syntax
    // placeholder hint; text columns get the contains placeholder.
    // Non-filterable columns get disabled input.
    const filterRow = showFilterRow ? (
      <div
        ref={filterRowRef}
        className="cx-table-filter-row"
        role="rowgroup"
        // mirror the header's outer-clip /
        // inner-content-row structure so the body's `scrollLeft` can
        // be programmatically mirrored to `filterRowEl.scrollLeft`
        // (default `overflow: visible` ignores `scrollLeft`).
        // `overflowY: 'scroll'` reserves the body-matching scrollbar
        // gutter so a pinned-right filter cell aligns with its body
        // cell (see header container comment above).
        style={{ overflowX: 'hidden', overflowY: 'scroll' }}
      >
        <div className="cx-table-filter-row-content" style={{ width: `${totalWithRowDrag}px` }}>
          {rowDragColumnShow && rowDragColumnSide === 'left' && buildFilterRowDragCell()}
          {(selectionColShow && selectionColSide === 'left'
            ? [buildFilterRowSelectionCell()]
            : []
          ).concat(
            visibleColumns.map((col) => {
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

              // Action columns render an empty filter cell - no input
              // at all. The actions strip is button-only content; a
              // filter input (even disabled) is meaningless UI noise.
              if (col.actions != null && col.actions.length > 0) {
                return (
                  <div
                    key={`filter-cell-${col.id}`}
                    className={
                      pinnedFilterClasses
                        ? `cx-table-filter-cell ${pinnedFilterClasses}`
                        : 'cx-table-filter-cell'
                    }
                    data-col-id={col.id}
                    style={{
                      boxSizing: 'border-box',
                      width: `${widthByColId[col.id] ?? 0}px`,
                      paddingLeft: `${t.cellPaddingX}px`,
                      paddingRight: `${t.cellPaddingX}px`,
                      ...pinnedFilterStyle,
                    }}
                  />
                );
              }

              // (react port): set-filter dropdown branch.
              if (isSetFilterUi && isFilterable) {
                const unique = collectUniqueColumnValues({ rows, column: col });
                const allValues = unique.values.map((v) => v.value);
                const summaryLabel = setFilterSummaryLabel(col.id, unique.values.length);
                const totalItemCount = unique.values.length;
                // (react port): verbatim mirror of vue3
                // threshold-gated
                // `computeVirtualWindow` virtualization.
                const shouldVirtualize = totalItemCount > setFilterVirtualizeThreshold;
                const renderSetFilterItem = (
                  entry: (typeof unique.values)[number],
                ): ReactElement => {
                  const checked = isSetFilterValueChecked(col.id, entry.value);
                  return (
                    <label
                      key={`set-filter-item-${col.id}-${String(entry.value)}`}
                      className="cx-table-set-filter__item"
                    >
                      <input
                        type="checkbox"
                        className="cx-table-set-filter__checkbox"
                        checked={checked}
                        data-set-filter-value={String(entry.value)}
                        onChange={() => toggleSetFilterValue(col.id, entry.value, allValues)}
                      />
                      <span className="cx-table-set-filter__label">
                        {entry.value === null ? '(空)' : String(entry.value)}
                      </span>
                      <span className="cx-table-set-filter__count"> ({entry.count})</span>
                    </label>
                  );
                };
                let listChildren: ReactNode;
                if (shouldVirtualize) {
                  const scrollTop = setFilterScrollTopByColId[col.id] ?? 0;
                  const viewportHeight = setFilterViewportHeightByColId[col.id] ?? 0;
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
                  listChildren = (
                    <div
                      className="cx-table-set-filter__sizer"
                      data-set-filter-sizer=""
                      style={{
                        position: 'relative',
                        height: `${vWindow.totalHeightPx}px`,
                      }}
                    >
                      <div
                        className="cx-table-set-filter__window"
                        data-set-filter-window=""
                        data-window-start={String(vWindow.startIndex)}
                        data-window-end={String(vWindow.endIndex)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          transform: `translateY(${vWindow.offsetTopPx}px)`,
                        }}
                      >
                        {visibleNodes}
                      </div>
                    </div>
                  );
                } else {
                  listChildren = unique.values.map(renderSetFilterItem);
                }
                return (
                  <div
                    key={`filter-cell-${col.id}`}
                    className={
                      pinnedFilterClasses
                        ? `cx-table-filter-cell ${pinnedFilterClasses}`
                        : 'cx-table-filter-cell'
                    }
                    data-col-id={col.id}
                    data-filter-ui="set"
                    style={{
                      boxSizing: 'border-box',
                      width: `${widthByColId[col.id] ?? 0}px`,
                      paddingLeft: `${t.cellPaddingX}px`,
                      paddingRight: `${t.cellPaddingX}px`,
                      ...pinnedFilterStyle,
                    }}
                  >
                    <details className="cx-table-set-filter" data-col-id={col.id}>
                      <summary
                        className="cx-table-set-filter__summary"
                        aria-label={`Filter ${col.headerName ?? col.id}`}
                      >
                        {summaryLabel}
                      </summary>
                      <div className="cx-table-set-filter__panel">
                        <div className="cx-table-set-filter__actions">
                          <button
                            type="button"
                            className="cx-table-set-filter__action"
                            data-action="select-all"
                            onClick={() => applySetFilterValues(col.id, null)}
                          >
                            全选
                          </button>
                          <button
                            type="button"
                            className="cx-table-set-filter__action"
                            data-action="clear"
                            onClick={() => applySetFilterValues(col.id, [])}
                          >
                            清空
                          </button>
                        </div>
                        <div
                          className="cx-table-set-filter__list"
                          role="group"
                          data-virtualized={shouldVirtualize ? 'true' : 'false'}
                          ref={(el) => {
                            if (!shouldVirtualize) return;
                            if (!el) return;
                            const next = el.clientHeight;
                            setSetFilterViewportHeightByColId((prev) => {
                              if (prev[col.id] === next) return prev;
                              return { ...prev, [col.id]: next };
                            });
                          }}
                          onScroll={(e) => {
                            if (!shouldVirtualize) return;
                            const target = e.currentTarget;
                            const next = target.scrollTop;
                            setSetFilterScrollTopByColId((prev) => {
                              if (prev[col.id] === next) return prev;
                              return { ...prev, [col.id]: next };
                            });
                          }}
                        >
                          {listChildren}
                        </div>
                        {unique.truncated && (
                          <p className="cx-table-set-filter__truncated">
                            已截断 (&gt;{unique.values.length})
                          </p>
                        )}
                      </div>
                    </details>
                  </div>
                );
              }

              // (2026-06-01 — react port) +
              // (2026-06-02 — react port) + (2026-06-02 —
              // react port): multi-filter container branch.
              // ships recursive render — root + nested groups share
              // one `renderMultiFilterEntries` helper. Path threads
              // through every emit so consumers always know WHERE in
              // the tree the action happened.
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
                const effectiveRootMode = spec?.mode ?? multiFilterDefaultMode;
                const slotCount = slots.length;
                let cachedSetSlotUnique: ReturnType<typeof collectUniqueColumnValues> | null = null;
                const ensureSetSlotUnique = (): ReturnType<typeof collectUniqueColumnValues> => {
                  cachedSetSlotUnique ??= collectUniqueColumnValues({ rows, column: col });
                  return cachedSetSlotUnique;
                };
                const slotKindOfEntry = (entry: MultiFilterEntry): 'text' | 'number' | 'set' => {
                  if (entry.type === 'group') return 'text';
                  return entry.type;
                };
                const renderRemoveSlotButton = (
                  slotIdx: number,
                  parentPath: readonly number[],
                  siblingCount: number,
                ): ReactNode => {
                  const disabled = parentPath.length === 0 ? slotCount <= 1 : siblingCount <= 1;
                  return (
                    <button
                      type="button"
                      className="cx-table-multi-filter__remove-slot"
                      data-col-id={col.id}
                      data-multi-filter-slot={String(slotIdx)}
                      data-testid="cx-table-multi-filter-remove-slot"
                      aria-label={`Remove filter slot ${slotIdx + 1}`}
                      disabled={disabled}
                      aria-disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        onRemoveMultiFilterSlot?.({
                          colId: col.id,
                          slotIdx,
                          path: parentPath,
                        });
                      }}
                    >
                      ×
                    </button>
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
                ): ReactNode => {
                  const slotKind = slotKindOfEntry(entry);
                  if (slotKind === 'set') {
                    const unique = ensureSetSlotUnique();
                    const summaryText =
                      entry.type !== 'set'
                        ? '集合筛选'
                        : entry.selectedValues == null
                          ? '全部'
                          : entry.selectedValues.length === 0
                            ? '(无)'
                            : `${entry.selectedValues.length} 项已选`;
                    return (
                      <div key={`slot-${path.join('-')}`} className="cx-table-multi-filter__slot">
                        <details
                          className="cx-table-multi-filter__set-slot"
                          data-col-id={col.id}
                          data-multi-filter-slot={String(slotIdx)}
                          data-multi-filter-slot-kind="set"
                        >
                          <summary
                            className="cx-table-multi-filter__set-slot-summary"
                            aria-label={`Filter ${col.headerName ?? col.id} slot ${slotIdx + 1}`}
                          >
                            {summaryText}
                          </summary>
                          <div className="cx-table-multi-filter__set-slot-list">
                            {unique.values.map((uniqEntry) => (
                              <label
                                key={`multi-set-${col.id}-${path.join('-')}-${String(uniqEntry.value)}`}
                                className="cx-table-set-filter__item"
                              >
                                <input
                                  type="checkbox"
                                  className="cx-table-set-filter__checkbox"
                                  checked={isSetValueCheckedAtPath(path, uniqEntry.value)}
                                  data-set-filter-value={String(uniqEntry.value)}
                                  onChange={() => toggleSetValueAtPath(path, uniqEntry.value)}
                                />
                                <span className="cx-table-set-filter__label">
                                  {uniqEntry.value === null ? '(空)' : String(uniqEntry.value)}
                                </span>
                                <span className="cx-table-set-filter__count">
                                  {` (${uniqEntry.count})`}
                                </span>
                              </label>
                            ))}
                          </div>
                        </details>
                        {renderRemoveSlotButton(slotIdx, path.slice(0, -1), siblingCount)}
                      </div>
                    );
                  }
                  const inputValue: string =
                    entry.type === 'number'
                      ? Number.isFinite(entry.value)
                        ? String(entry.value)
                        : ''
                      : entry.type === 'text'
                        ? String(entry.value)
                        : '';
                  return (
                    <div key={`slot-${path.join('-')}`} className="cx-table-multi-filter__slot">
                      <input
                        className="cx-table-multi-filter__input"
                        type={slotKind === 'number' ? 'number' : 'text'}
                        inputMode={slotKind === 'number' ? 'decimal' : undefined}
                        placeholder={slotKind === 'number' ? '数值…' : '关键词…'}
                        aria-label={`Filter ${col.headerName ?? col.id} slot ${slotIdx + 1}`}
                        data-col-id={col.id}
                        data-multi-filter-slot={String(slotIdx)}
                        data-multi-filter-slot-kind={slotKind}
                        value={inputValue}
                        onChange={(e) => {
                          if (path.length === 1) {
                            setMultiFilterChildValue(col, slotIdx, e.target.value);
                            return;
                          }
                          const raw = e.target.value;
                          let nextEntry: MultiFilterEntry;
                          if (slotKind === 'number') {
                            const num = raw.trim() === '' ? Number.NaN : Number(raw);
                            nextEntry = { type: 'number', operator: '=', value: num };
                          } else {
                            nextEntry = { type: 'text', operator: 'contains', value: raw };
                          }
                          setMultiFilterEntryAtPathInternal(col, path, nextEntry);
                        }}
                      />
                      {renderRemoveSlotButton(slotIdx, path.slice(0, -1), siblingCount)}
                    </div>
                  );
                };
                const renderLeafEntryAtPath = (
                  entry: MultiFilterEntry,
                  slotIdx: number,
                  path: readonly number[],
                  siblingCount: number,
                ): ReactNode => {
                  const slotKind = slotKindOfEntry(entry);
                  if (multiFilterChildRenderer != null && entry.type !== 'group') {
                    const node = multiFilterChildRenderer({
                      column: col,
                      slotIdx,
                      slotKind,
                      child: entry,
                      setChildValue: (next) => {
                        setMultiFilterEntryAtPathInternal(col, path, next);
                      },
                    });
                    if (node != null) {
                      return (
                        <div key={`slot-${path.join('-')}`} className="cx-table-multi-filter__slot">
                          {node}
                          {renderRemoveSlotButton(slotIdx, path.slice(0, -1), siblingCount)}
                        </div>
                      );
                    }
                  }
                  return renderBuiltinSlotAtPath(entry, slotIdx, path, siblingCount);
                };
                const renderMultiFilterEntries = (
                  entries: readonly MultiFilterEntry[],
                  mode: 'AND' | 'OR',
                  parentPath: readonly number[],
                ): ReactNode => {
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
                  return (
                    <div className="cx-table-multi-filter__group-body">
                      <div
                        className="cx-table-multi-filter__mode"
                        role="radiogroup"
                        aria-label="筛选模式"
                      >
                        <button
                          type="button"
                          className={
                            'cx-table-multi-filter__mode-button' +
                            (mode === 'AND' ? ' cx-table-multi-filter__mode-button--active' : '')
                          }
                          role="radio"
                          aria-checked={mode === 'AND'}
                          data-mode="AND"
                          onClick={() => onModeChange('AND')}
                        >
                          全部满足 (AND)
                        </button>
                        <button
                          type="button"
                          className={
                            'cx-table-multi-filter__mode-button' +
                            (mode === 'OR' ? ' cx-table-multi-filter__mode-button--active' : '')
                          }
                          role="radio"
                          aria-checked={mode === 'OR'}
                          data-mode="OR"
                          onClick={() => onModeChange('OR')}
                        >
                          任一满足 (OR)
                        </button>
                      </div>
                      <div className="cx-table-multi-filter__slots">
                        {entries.map((entry, idx) => {
                          const path = [...parentPath, idx];
                          if (entry.type === 'group') {
                            return (
                              <details
                                key={`multi-group-${col.id}-${path.join('-')}`}
                                className="cx-table-multi-filter__group"
                                data-cx-multi-filter-group-path={path.join('.')}
                                open
                              >
                                <summary className="cx-table-multi-filter__group-summary">
                                  {`分组 (${entry.mode}) · ${entry.filters.length} 条件`}
                                  <button
                                    type="button"
                                    className="cx-table-multi-filter__remove-group"
                                    data-testid="cx-table-multi-filter-remove-group"
                                    aria-label="移除分组"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      onRemoveMultiFilterGroup?.({ colId: col.id, path });
                                    }}
                                  >
                                    ×
                                  </button>
                                </summary>
                                {renderMultiFilterEntries(entry.filters, entry.mode, path)}
                              </details>
                            );
                          }
                          return renderLeafEntryAtPath(entry, idx, path, entries.length);
                        })}
                      </div>
                      <button
                        type="button"
                        className="cx-table-multi-filter__add-slot"
                        data-col-id={col.id}
                        data-testid="cx-table-multi-filter-add-slot"
                        onClick={() => {
                          onAddMultiFilterSlot?.({
                            colId: col.id,
                            slotKind: 'text',
                            path: parentPath,
                          });
                        }}
                      >
                        + 添加条件
                      </button>
                      <button
                        type="button"
                        className="cx-table-multi-filter__add-group"
                        data-col-id={col.id}
                        data-testid="cx-table-multi-filter-add-group"
                        onClick={() => {
                          onAddMultiFilterGroup?.({ colId: col.id, path: parentPath });
                        }}
                      >
                        + 添加分组
                      </button>
                    </div>
                  );
                };
                return (
                  <div
                    key={`filter-cell-${col.id}`}
                    className={`cx-table-filter-cell ${pinnedFilterClasses}`}
                    data-col-id={col.id}
                    data-filter-ui="multi"
                    style={{
                      boxSizing: 'border-box',
                      width: `${widthByColId[col.id] ?? 0}px`,
                      paddingLeft: `${t.cellPaddingX}px`,
                      paddingRight: `${t.cellPaddingX}px`,
                      ...pinnedFilterStyle,
                    }}
                  >
                    <details className="cx-table-multi-filter" data-col-id={col.id}>
                      <summary
                        className="cx-table-multi-filter__summary"
                        aria-label={`Multi filter ${col.headerName ?? col.id}`}
                      >
                        {summary}
                      </summary>
                      <div className="cx-table-multi-filter__panel">
                        {renderMultiFilterEntries(effectiveRootEntries, effectiveRootMode, [])}
                      </div>
                    </details>
                  </div>
                );
              }

              const value = filterInputValueFor(col.id);
              const placeholder = !isFilterable
                ? ''
                : isNumberColumn
                  ? '过滤 (e.g. 5, >10, 5..50)'
                  : '过滤…';
              // (react port): optional dual-handle range
              // slider beneath the Number filter text input. Verbatim
              // port of vue3 wiring.
              let rangeSliderNode: ReactNode = null;
              if (numberFilterShowRangeSlider && isNumberColumn && isFilterable) {
                const extents = computeColumnNumericExtents({ rows, column: col });
                if (extents !== null) {
                  const range = readNumberFilterRangeForCol(col.id, extents);
                  const onCommit = (next: { low: number; high: number }): void => {
                    setFilterColumnValue(col.id, `${next.low}..${next.high}`);
                  };
                  const onPointerDownTrack = (e: ReactPointerEvent<HTMLDivElement>): void => {
                    const track = e.currentTarget;
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
                    numberFilterRangeDragRef.current = {
                      ...numberFilterRangeDragRef.current,
                      [col.id]: handle,
                    };
                    try {
                      track.setPointerCapture(e.pointerId);
                    } catch {
                      /* capture not available — pointermove still bubbles */
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
                  const onPointerMoveTrack = (e: ReactPointerEvent<HTMLDivElement>): void => {
                    const active = numberFilterRangeDragRef.current[col.id] ?? null;
                    if (active == null) return;
                    const track = e.currentTarget;
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
                  const onPointerUpTrack = (e: ReactPointerEvent<HTMLDivElement>): void => {
                    numberFilterRangeDragRef.current = {
                      ...numberFilterRangeDragRef.current,
                      [col.id]: null,
                    };
                    const track = e.currentTarget;
                    try {
                      track.releasePointerCapture(e.pointerId);
                    } catch {
                      /* capture may have never been set — ignore */
                    }
                  };
                  const onKeydownThumb =
                    (handle: RangeHandle) =>
                    (e: ReactKeyboardEvent<HTMLButtonElement>): void => {
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
                  rangeSliderNode = (
                    <div
                      className="cx-table-number-filter__range"
                      role="group"
                      aria-label={`${col.headerName ?? col.id} range`}
                      data-col-id={col.id}
                      data-number-filter-range=""
                      style={{
                        position: 'relative',
                        height: '20px',
                        marginTop: '4px',
                        touchAction: 'none',
                      }}
                      onPointerDown={onPointerDownTrack}
                      onPointerMove={onPointerMoveTrack}
                      onPointerUp={onPointerUpTrack}
                      onPointerCancel={onPointerUpTrack}
                    >
                      <div
                        className="cx-table-number-filter__range-track"
                        style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          top: '8px',
                          height: '4px',
                          background: '#e2e8f0',
                        }}
                      />
                      <button
                        type="button"
                        className="cx-table-number-filter__range-thumb"
                        data-range-handle="low"
                        role="slider"
                        tabIndex={0}
                        aria-valuemin={extents.min}
                        aria-valuemax={extents.max}
                        aria-valuenow={range.low}
                        aria-label={`${col.headerName ?? col.id} low`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          width: '12px',
                          height: '20px',
                          marginLeft: '-6px',
                          left: `${rangeThumbLeftPercent(range.low, extents)}%`,
                          background: '#3b82f6',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        onKeyDown={onKeydownThumb('low')}
                      />
                      <button
                        type="button"
                        className="cx-table-number-filter__range-thumb"
                        data-range-handle="high"
                        role="slider"
                        tabIndex={0}
                        aria-valuemin={extents.min}
                        aria-valuemax={extents.max}
                        aria-valuenow={range.high}
                        aria-label={`${col.headerName ?? col.id} high`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          width: '12px',
                          height: '20px',
                          marginLeft: '-6px',
                          left: `${rangeThumbLeftPercent(range.high, extents)}%`,
                          background: '#3b82f6',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        onKeyDown={onKeydownThumb('high')}
                      />
                    </div>
                  );
                }
              }
              return (
                <div
                  key={`filter-cell-${col.id}`}
                  className={
                    pinnedFilterClasses
                      ? `cx-table-filter-cell ${pinnedFilterClasses}`
                      : 'cx-table-filter-cell'
                  }
                  data-col-id={col.id}
                  style={{
                    boxSizing: 'border-box',
                    width: `${widthByColId[col.id] ?? 0}px`,
                    paddingLeft: `${t.cellPaddingX}px`,
                    paddingRight: `${t.cellPaddingX}px`,
                    ...pinnedFilterStyle,
                  }}
                >
                  <input
                    className="cx-table-filter-input"
                    type="text"
                    value={value}
                    disabled={!isFilterable}
                    placeholder={placeholder}
                    aria-label={`Filter ${col.headerName ?? col.id}`}
                    data-col-id={col.id}
                    data-filter-type={isNumberColumn ? 'number' : 'text'}
                    onInput={(e) => {
                      const target = e.target as HTMLInputElement;
                      setFilterColumnValue(col.id, target.value);
                    }}
                    onChange={() => {
                      /* onInput drives state; onChange present for React */
                    }}
                  />
                  {rangeSliderNode}
                </div>
              );
            }),
          )}
          {selectionColShow && selectionColSide === 'right' && buildFilterRowSelectionCell()}
          {rowDragColumnShow && rowDragColumnSide === 'right' && buildFilterRowDragCell()}
        </div>
      </div>
    ) : null;

    // + + (vue3 + 8 + 11
    // equivalent): pick the row subset to render. Pre-mount frame
    // (bodyClientHeight === 0) yields an empty visibleRows array —
    // fall back to `pagedRows` so the first paint reflects the
    // current sort + filter + pagination state. (pagedRows is
    // identity-equal to `sortedRows` when pageSize <= 0, preserving
    // the fallback semantic.) After mount, visibleRows
    // tracks the scroll viewport and is already paginated because
    // virtualRowsPass consumes pagePass's output.
    const rowsToRender = bodyClientHeight > 0 ? visibleRows : pagedRows;

    // (Note: selectAllCheckboxRef + its useEffect are hoisted up
    // above the header render block so build* helpers can reference
    // them without hitting TDZ.)

    function buildHeaderRowDragCell(): ReactElement {
      // Empty placeholder reserving the row-drag rail's width in the
      // header row so the header's column boundaries align with the
      // body's (body renders the actual grip here).
      const cellStyle: CSSProperties = {
        width: `${rowDragColumnWidth}px`,
        height: `${t.headerHeight}px`,
        ...rowDragRailStickyStyle,
      };
      return (
        <div
          key="header-row-drag"
          className="cx-table-header-cell cx-table-row-drag-cell"
          role="columnheader"
          data-col-id="__cx_row_drag__"
          style={cellStyle}
        />
      );
    }

    function buildHeaderSelectionCell(): ReactElement {
      const checked = selectAllState === 'checked';
      const cellStyle: CSSProperties = {
        width: `${selectionColWidth}px`,
        height: `${t.headerHeight}px`,
        ...selectionRailStickyStyle,
      };
      return (
        <div
          key="header-selection"
          className="cx-table-header-cell cx-table-selection-cell"
          role="columnheader"
          data-col-id="__cx_selection__"
          aria-colindex={selectionAriaColIdx}
          style={cellStyle}
        >
          <input
            ref={selectAllCheckboxRef}
            type="checkbox"
            className="cx-table-selection-checkbox cx-table-selection-checkbox--header"
            aria-label="Select all displayed rows"
            checked={checked}
            onChange={() => {
              /* state is driven by onClick — onChange present only to satisfy React's controlled-input warning */
            }}
            onClick={onSelectAllCheckboxClick}
          />
        </div>
      );
    }

    function buildFilterRowSelectionCell(): ReactElement {
      // Placeholder spacer aligned with the per-row selection cell.
      const cellStyle: CSSProperties = {
        width: `${selectionColWidth}px`,
        ...selectionRailStickyStyle,
      };
      return (
        <div
          key="filter-selection"
          className="cx-table-filter-cell cx-table-selection-cell"
          data-col-id="__cx_selection__"
          style={cellStyle}
        />
      );
    }

    function buildFilterRowDragCell(): ReactElement {
      // Empty placeholder reserving the row-drag rail's width in the
      // filter row so filter inputs align with the body's grip column.
      const cellStyle: CSSProperties = {
        width: `${rowDragColumnWidth}px`,
        ...rowDragRailStickyStyle,
      };
      return (
        <div
          key="filter-row-drag"
          className="cx-table-filter-cell cx-table-row-drag-cell"
          data-col-id="__cx_row_drag__"
          style={cellStyle}
        />
      );
    }

    // (vue3 equivalent): build the in-cell editor
    // `<input>`. Auto-focus + select-all-text on mount via the ref
    // callback. Keydown handlers: Enter / Tab commit; Esc cancels;
    // blur commits (Notion / Sheets convention). All key handlers
    // set `editCommitInProgressRef` BEFORE calling commit/cancel so
    // the subsequent native blur (triggered by removing the input
    // from the DOM) doesn't double-fire.
    //
    // (vue3 equivalent): dispatch on
    // `column.type === 'number'` to render `<input type="number">`
    // instead of `<input type="text">` for numeric columns. The
    // number variant also sets `inputMode="decimal"` as a mobile
    // soft-keyboard hint. Coercion of the raw string draft to a
    // typed value happens inside `applyEditCommit` via
    // `coerceEditDraftValue`, NOT here.
    /**
     * (react port, 2026-05-28): chevron SVG / leaf spacer
     * for the tree column (Decision I.1). For parent rows, renders a
     * clickable chevron with the `--expanded` modifier when expanded.
     * For leaf rows, renders a fixed-width spacer for column alignment.
     *
     * Chevron click handler calls `e.stopPropagation()` to suppress
     * row-click / cell-click delegated handlers. Uses non-async
     * handler (no-misused-promises) and a plain function (not async).
     */
    function renderTreeChevronOrSpacer(
      hasChildren: boolean,
      expanded: boolean,
      rowId: string,
    ): ReactElement {
      // (2026-05-28 — react port): dispatch on lazy status.
      const lazyState = lazyChildrenState.get(rowId);
      if (lazyState?.status === 'loading') {
        return (
          <span
            className="cx-table-tree-spinner"
            role="status"
            aria-label="Loading children"
            data-tree-spinner={rowId}
            key="tree-spinner"
            style={{ color: 'var(--cx-table-tree-spinner-color, #5a6675)' }}
          >
            <svg
              width={12}
              height={12}
              viewBox="0 0 12 12"
              aria-hidden="true"
              className="cx-table-tree-spinner-svg"
              style={{ animation: 'cx-table-tree-spinner-rotate 1s linear infinite' }}
            >
              <circle
                cx={6}
                cy={6}
                r={4}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeDasharray="6 18"
              />
            </svg>
          </span>
        );
      }
      if (lazyState?.status === 'error') {
        return (
          <span
            className="cx-table-tree-error-icon"
            role="button"
            aria-label="Retry load"
            data-tree-error={rowId}
            key="tree-error"
            style={{
              color: 'var(--cx-table-tree-error-color, #dc2626)',
              cursor: 'pointer',
            }}
            onClick={(e) => {
              e.stopPropagation();
              applyLazyChevronClick(rowId);
            }}
          >
            <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M6 1 L11 11 L1 11 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
              <path d="M6 5 L6 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
              <circle cx={6} cy={9.5} r={0.6} fill="currentColor" />
            </svg>
          </span>
        );
      }
      if (!hasChildren) {
        return (
          <span className="cx-table-tree-chevron-spacer" aria-hidden="true" key="tree-spacer" />
        );
      }
      const chevronClass = expanded
        ? 'cx-table-tree-chevron cx-table-tree-chevron--expanded'
        : 'cx-table-tree-chevron';
      const onChevronClick = (e: ReactMouseEvent): void => {
        e.stopPropagation();
        if (expanded) {
          abortLazyLoadIfInflight(rowId);
          treeExpandState.toggle(rowId);
        } else {
          applyLazyChevronClick(rowId);
        }
      };
      return (
        <span
          className={chevronClass}
          role="button"
          aria-label={expanded ? 'Collapse row' : 'Expand row'}
          aria-expanded={expanded ? 'true' : 'false'}
          data-tree-chevron={rowId}
          onClick={onChevronClick}
          key="tree-chevron"
        >
          <svg width={12} height={12} viewBox="0 0 12 12" aria-hidden="true">
            <polygon points="3,2 9,6 3,10" fill="currentColor" />
          </svg>
        </span>
      );
    }

    function buildCellEditorInput(edit: EditingCell): ReactElement {
      const column = columnTable.getById(edit.colId);
      const isNumberEditor = column?.type === 'number';
      const editorStyle: CSSProperties = {
        paddingLeft: `${t.cellPaddingX}px`,
        paddingRight: `${t.cellPaddingX}px`,
      };
      const editorLabel = `Edit ${column?.headerName ?? column?.id ?? edit.colId}`;
      return (
        <input
          key={`editor-${edit.rowId}-${edit.colId}`}
          className="cx-table-cell-editor"
          type={isNumberEditor ? 'number' : 'text'}
          inputMode={isNumberEditor ? 'decimal' : undefined}
          aria-label={editorLabel}
          value={editorDraftToString(edit.draftValue)}
          style={editorStyle}
          ref={(el) => {
            if (el == null) return;
            // Defer focus + select to the next microtask so React has
            // committed the DOM patch + parent layout is stable.
            // happy-dom (test env) executes microtasks synchronously
            // so this works in both real DOM + tests.
            queueMicrotask(() => {
              if (document.activeElement === el) return;
              el.focus();
              el.select();
            });
          }}
          onChange={(e) => {
            applyEditDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              editCommitInProgressRef.current = true;
              applyEditCommit();
              editCommitInProgressRef.current = false;
            } else if (e.key === 'Tab') {
              // (vue3): Tab commits THEN auto-
              // advances to the next editable cell in display order
              // (forward by default; Shift+Tab backward).
              // rejection path is preserved — if the commit was
              // rejected (editingCellRef still set), do NOT auto-
              // advance so the user can fix the bad input.
              //
              // The `editCommitInProgressRef` guard MUST stay true
              // across the auto-advance step AND the subsequent
              // microtask. When React unmounts the old `<input>`
              // (because the editor's `key` changes from
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
              editCommitInProgressRef.current = true;
              applyEditCommit();
              if (editingCellRef.current != null) {
                // rejection — editor stays on the bad cell.
                editCommitInProgressRef.current = false;
                return;
              }
              // Decision C.1: use `pagedRows` (post-filter
              // + post-sort + post-page) NOT `visibleRows`. The
              // virtualization window is a render-only concern;
              // auto-advance respects the conceptual displayed-row
              // boundary, not the rendered subset.
              const next = findNextEditableCell(
                prevRowId,
                prevColId,
                pagedRows.map((r) => r.id),
                columns,
                direction,
              );
              if (next != null) {
                applyEditStart(next.rowId, next.colId);
              }
              queueMicrotask(() => {
                editCommitInProgressRef.current = false;
              });
            } else if (e.key === 'Escape') {
              e.preventDefault();
              editCommitInProgressRef.current = true;
              applyEditCancel();
              editCommitInProgressRef.current = false;
            }
          }}
          onBlur={() => {
            if (editCommitInProgressRef.current) return;
            // Decision: blur commits (Notion semantic).
            applyEditCommit();
          }}
          onClick={(e) => {
            // Stop click from bubbling up to the body delegated handler
            // and re-triggering row-click / selection mutation.
            e.stopPropagation();
          }}
          onDoubleClick={(e) => {
            // Same as above for the dblclick path — prevents
            // applyEditStart from re-firing on the same active cell.
            e.stopPropagation();
          }}
        />
      );
    }

    function buildBodyRowSelectionCell(row: RowSpec, rowH: number): ReactElement {
      const isSelected = selectedRowIdsSet.has(row.id);
      // (react port, 2026-05-28): tristate visualization
      // (Decision C.1). DOM `input.indeterminate` PROPERTY set via a
      // `ref` callback after React commits — HTML attribute has no
      // effect; only the JS property does.
      const tristate: RowSelectionTriState = computeRowSelectionTriState(
        row.id,
        rows,
        selectedRowIdsSet,
      );
      const isIndeterminate = tristate === 'some' && !isSelected;
      const checkboxClass = isIndeterminate
        ? 'cx-table-selection-checkbox cx-table-selection-checkbox--row cx-table-row-checkbox--indeterminate'
        : 'cx-table-selection-checkbox cx-table-selection-checkbox--row';
      const cellStyle: CSSProperties = {
        width: `${selectionColWidth}px`,
        height: `${rowH}px`,
        ...selectionRailStickyStyle,
      };
      return (
        <div
          key={`selection-${row.id}`}
          className="cx-table-cell cx-table-selection-cell-body"
          role="gridcell"
          data-col-id="__cx_selection__"
          data-row-id={row.id}
          aria-colindex={selectionAriaColIdx}
          style={cellStyle}
        >
          <input
            type="checkbox"
            className={checkboxClass}
            aria-label={`Select row ${row.id}`}
            data-row-id={row.id}
            checked={isSelected}
            onChange={() => {
              /* state driven by onClick; onChange present to satisfy controlled warning */
            }}
            onClick={(e) => onSelectionCheckboxClick(row.id, e)}
            ref={(el) => {
              if (el != null) el.indeterminate = isIndeterminate;
            }}
          />
        </div>
      );
    }

    /**
     * (react port). Verbatim mirror of vue3 buildRowDragGripCell.
     */
    /**
     * -B (2026-05-30 — react port). Verbatim mirror of vue3
     * -B buildActionsCellChildren.
     */
    function renderActionsCellChildren(actions: readonly RowAction[], row: RowSpec): ReactElement {
      return (
        <div className="cx-table-cell-actions">
          {actions.map((action) => {
            const isDisabled = action.disabled?.(row) === true;
            const buttonClass = [
              'cx-table-cell-action',
              isDisabled && 'cx-table-cell-action--disabled',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <button
                key={action.id}
                type="button"
                className={buttonClass}
                data-action-id={action.id}
                aria-label={action.ariaLabel ?? action.label}
                disabled={isDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isDisabled) return;
                  action.onClick(row);
                }}
              >
                {typeof action.icon === 'string' && action.icon.length > 0 ? (
                  <span className="cx-table-cell-action-icon">{action.icon}</span>
                ) : null}
                {action.iconOnly !== true ? (
                  <span className="cx-table-cell-action-label">{action.label}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      );
    }

    function buildRowDragGripCell(row: RowSpec, rowH: number): ReactElement {
      const isInactive = row.pinned != null || row.draggable === false;
      const railSide: 'left' | 'right' = rowDragColumnSide;
      const railStickyStyle: CSSProperties = {
        position: 'sticky',
        [railSide]: '0px',
        zIndex: 2,
      };
      return (
        <div
          key={`row-drag-${row.id}`}
          className={[
            'cx-table-cell',
            'cx-table-row-drag-cell',
            !isInactive && 'cx-table-row-drag-cell--draggable',
          ]
            .filter(Boolean)
            .join(' ')}
          role="gridcell"
          data-col-id="__cx_row_drag__"
          data-row-id={row.id}
          data-row-drag-handle={isInactive ? undefined : 'true'}
          title={isInactive ? undefined : '拖拽以调整行顺序'}
          aria-label={isInactive ? undefined : '拖拽以调整行顺序'}
          style={{
            width: `${rowDragColumnWidth}px`,
            height: `${rowH}px`,
            ...railStickyStyle,
          }}
          onPointerDown={isInactive ? undefined : (e) => onRowDragPointerDown(row.id, e)}
        >
          {isInactive ? null : (
            <span className="cx-table-row-drag-cell__grip" aria-hidden="true">
              <svg
                width="10"
                height="16"
                viewBox="0 0 10 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="2.5" cy="3" r="1.3" />
                <circle cx="7.5" cy="3" r="1.3" />
                <circle cx="2.5" cy="8" r="1.3" />
                <circle cx="7.5" cy="8" r="1.3" />
                <circle cx="2.5" cy="13" r="1.3" />
                <circle cx="7.5" cy="13" r="1.3" />
              </svg>
            </span>
          )}
        </div>
      );
    }

    // (vue3 equivalent): read the active edit state
    // from the mirror so the per-cell render block can swap in the
    // editor `<input>` instead of the formatted text for the matching
    // (rowId, colId).
    const activeEdit = editingCellState;
    const bodyRows = rowsToRender.map((row) => {
      const rowH = rowHeightByRowId[row.id] ?? t.rowHeight;
      // (2026-05-29 — react port): server-side row model
      // skeleton placeholder. Verbatim mirror of vue3 .
      if (isServerSideSkeletonRowId(row.id)) {
        return (
          <div
            key={`row-${row.id}`}
            className="cx-table-row cx-table-row--skeleton"
            role="row"
            data-row-id={row.id}
            aria-rowindex={ariaRowIndexForBody(row.id)}
            style={{
              position: 'absolute',
              top: `${rowYByRowId[row.id] ?? 0}px`,
              left: '0',
              width: `${totalWithRowDrag}px`,
              height: `${rowH}px`,
            }}
          >
            {visibleColumns.map((col) => (
              <div
                key={`cell-${row.id}-${col.id}`}
                className="cx-table-cell cx-table-cell--skeleton"
                role="gridcell"
                data-col-id={col.id}
                data-row-id={row.id}
                aria-colindex={ariaColIndexFor(col.id)}
                style={{
                  boxSizing: 'border-box',
                  width: `${widthByColId[col.id] ?? 0}px`,
                  height: `${rowH}px`,
                  paddingLeft: `${t.cellPaddingX}px`,
                  paddingRight: `${t.cellPaddingX}px`,
                }}
              >
                <div className="cx-table-cell-skeleton-bar" />
              </div>
            ))}
          </div>
        );
      }
      const isSelected = selectedRowIdsSet.has(row.id);
      const cellNodes = visibleColumns.map((col) => {
        // (vue3 equivalent): compute the value
        // once, share between formatter + class resolver.
        // `getCellValue` applies col.valueGetter or default field-
        // based extraction; `formatCellValue` applies
        // col.valueFormatter or defaultFormatCellValue;
        // `resolveCellClassNames` normalizes static/array/function
        // cellClass into a flat string[] of class additions on top of
        // the structural `cx-table-cell`.
        const value = getCellValue({ row, column: col });
        // -A (2026-05-30 — react port): row-number column override.
        const isRowNumberCol = col.rowNumber === true;
        const rowNumberIndex = isRowNumberCol ? displayedRowIndexByRowId[row.id] : undefined;
        // -B (2026-05-30 — react port): actions column flag. When
        // `col.actions` is defined (even an empty array), the cell
        // gets the `cx-table-cell--actions` modifier. The action-
        // button strip is only rendered when `actions.length > 0`;
        // an empty array means the column exists solely to host the
        // settings icon in the header.
        const isActionsCol = col.actions != null;
        const text = isRowNumberCol
          ? rowNumberIndex != null
            ? String(rowNumberIndex + 1)
            : ''
          : col.valueFormatter != null
            ? col.valueFormatter({ value, row, column: col })
            : formatCellValue({ row, column: col });
        const extraClasses = resolveCellClassNames({ value, row, column: col });
        // (vue3 equivalent): when this cell is the
        // active edit cell, render the `<input>` editor in place of
        // the formatted text. The cell still carries its data-* attrs
        // + base styling so consumers observing cell DOM see
        // consistent structure.
        const editingThisCell: EditingCell | null =
          activeEdit?.rowId === row.id && activeEdit.colId === col.id ? activeEdit : null;
        const classList = ['cx-table-cell', ...extraClasses];
        if (editingThisCell != null) classList.push('cx-table-cell--editing');
        // (2026-06-01 — react port): invalid-cell marker
        // class. Painted when a prior commit attempt was rejected by
        // `column.validator`; cleared by next commit-success / cancel
        // on the same cell.
        const cellInvalidError = invalidCellsRef.current.get(invalidCellKey(row.id, col.id));
        const isInvalidCell = cellInvalidError != null;
        if (isInvalidCell) classList.push('cx-table-cell--invalid');
        // (2026-06-01 — react port): in-flight async
        // validation marker. Verbatim mirror of vue3.
        const isValidatingCell = pendingAsyncValidationByKeyRef.current.has(
          invalidCellKey(row.id, col.id),
        );
        if (isValidatingCell) classList.push('cx-table-cell--validating');
        // -C (2026-05-30 — react port): wrap-text modifier.
        if (col.wrapText === true) classList.push('cx-table-cell--wrap-text');
        // -A (2026-05-30 — react port): row-number marker class.
        if (isRowNumberCol) classList.push('cx-table-cell--row-number');
        // -B (2026-05-30 — react port): actions marker class.
        if (isActionsCol) classList.push('cx-table-cell--actions');
        // (2026-05-28 — react port of vue3): active-
        // cell modifier — outline + outline-offset CSS styling lives
        // in the consumer's stylesheet so the SFC stays theme-agnostic.
        const isActiveCell = activeCellState?.rowId === row.id && activeCellState.colId === col.id;
        if (isActiveCell) classList.push('cx-table-cell--active');
        // (2026-05-26 — react port of vue3): paint
        // the cell-range modifier when this cell falls inside the
        // resolved envelope. O(1) lookup via Set-derived useMemo values.
        const inCellRange = cellRangeRowSet.has(row.id) && cellRangeColSet.has(col.id);
        if (inCellRange) classList.push('cx-table-cell--in-cell-range');
        // (2026-05-27 — react port of vue3): preview
        // class for cells in the drag-fill extension envelope.
        if (dragFillPreviewSet.has(`${row.id}/${col.id}`)) {
          classList.push('cx-table-cell--in-fill-preview');
        }
        // (2026-05-26 — react port of vue3):
        // pinned-zone modifier classes + sticky inline style. Center
        // columns get neither.
        const pinnedCellSuffixes = pinnedCellModifierSuffixes(col.id);
        for (const suffix of pinnedCellSuffixes) {
          classList.push(`cx-table-cell${suffix}`);
        }
        const pinnedBodyStyle = pinnedCellStyle(col.id);
        const className = classList.join(' ');
        // (react port, 2026-05-28): tree-column chevron +
        // indent (Decisions D.1 + I.1 + J.1).
        const isTreeColumn = treeColumnId === col.id;
        const treeActive = isTreeColumn;
        let treeIndentLeft = 0;
        let treeLeadingNode: ReactElement | null = null;
        if (treeActive) {
          const rowDepth = row.depth ?? 0;
          treeIndentLeft = rowDepth * t.treeIndentPx;
          // hasChildren OR sync children both mean "show chevron."
          const rowHasChildren =
            (row.children != null && row.children.length > 0) || row.hasChildren === true;
          const rowExpanded = effectiveExpandedRowIdsSet.has(row.id);
          treeLeadingNode = renderTreeChevronOrSpacer(rowHasChildren, rowExpanded, row.id);
        }
        // -C (2026-05-30 — react port): auto-height cells use
        // min-height so content can grow beyond defaultRowHeight.
        // (2026-06-01 — react port): the 12 per-side
        // border longhand spreads emit `string` values but React's
        // CSSProperties types them as literal unions
        // ('solid'|'dashed'|...) — cast the whole literal to bypass
        // the strict checking (chronix-NEW CellStyle data is
        // consumer-supplied and may include legitimate-but-unmodeled
        // values like 'groove' or 'inherit').
        const cellStyle = {
          boxSizing: 'border-box',
          width: `${widthByColId[col.id] ?? 0}px`,
          ...(enableRowAutoHeight ? { minHeight: `${rowH}px` } : { height: `${rowH}px` }),
          paddingLeft: `${t.cellPaddingX + treeIndentLeft}px`,
          paddingRight: `${t.cellPaddingX}px`,
          ...pinnedBodyStyle,
          // (2026-05-31 — react port): per-cell
          // background-color override. (2026-05-31 —
          // react port): second conditional spread for text-color
          // (`color`) axis. (2026-06-01 — react port):
          // 3 more spreads for `fontWeight`, `fontStyle`,
          // `textDecoration`. Verbatim port of vue3.
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.backgroundColor !== undefined
            ? {
                backgroundColor: effectiveCellStyleByRowIdColId[row.id]![col.id]!.backgroundColor,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.color !== undefined
            ? { color: effectiveCellStyleByRowIdColId[row.id]![col.id]!.color }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.fontWeight !== undefined
            ? { fontWeight: effectiveCellStyleByRowIdColId[row.id]![col.id]!.fontWeight }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.fontStyle !== undefined
            ? { fontStyle: effectiveCellStyleByRowIdColId[row.id]![col.id]!.fontStyle }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.textDecoration !== undefined
            ? {
                textDecoration: effectiveCellStyleByRowIdColId[row.id]![col.id]!.textDecoration,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderColor !== undefined
            ? { borderColor: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderColor }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderWidth !== undefined
            ? { borderWidth: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderWidth }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderStyle !== undefined
            ? { borderStyle: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderStyle }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderRadius !== undefined
            ? {
                borderRadius: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderRadius,
              }
            : {}),
          // (2026-06-01 — react port): 12 per-side
          // border longhand overrides. Verbatim mirror of vue3.
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderTopColor !== undefined
            ? { borderTopColor: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderTopColor }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderTopWidth !== undefined
            ? { borderTopWidth: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderTopWidth }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderTopStyle !== undefined
            ? { borderTopStyle: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderTopStyle }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderRightColor !== undefined
            ? {
                borderRightColor: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderRightColor,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderRightWidth !== undefined
            ? {
                borderRightWidth: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderRightWidth,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderRightStyle !== undefined
            ? {
                borderRightStyle: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderRightStyle,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderBottomColor !== undefined
            ? {
                borderBottomColor:
                  effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderBottomColor,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderBottomWidth !== undefined
            ? {
                borderBottomWidth:
                  effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderBottomWidth,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderBottomStyle !== undefined
            ? {
                borderBottomStyle:
                  effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderBottomStyle,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderLeftColor !== undefined
            ? { borderLeftColor: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderLeftColor }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderLeftWidth !== undefined
            ? { borderLeftWidth: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderLeftWidth }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderLeftStyle !== undefined
            ? { borderLeftStyle: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderLeftStyle }
            : {}),
        } as CSSProperties;
        // per-cell pointer handlers — gated on
        // `cellRangeSelection === 'enabled'` (gate runs INSIDE each
        // handler so we avoid conditional handler attach/detach that
        // would force a re-render on prop toggle).
        const cellRangeEnabled = cellRangeSelection === 'enabled';
        const cellAriaColIdx: number = ariaColIndexFor(col.id);
        // (2026-05-31 — react port): per-cell row-drag grip
        // wiring. Verbatim mirror of vue3.
        const isRowDragHandleCell =
          col.rowDragHandle === true &&
          !rowDragColumnShow &&
          row.draggable !== false &&
          row.pinned == null;
        return (
          <div
            key={`cell-${row.id}-${col.id}`}
            className={
              isRowDragHandleCell ? `${className} cx-table-row-drag-handle-cell` : className
            }
            role="gridcell"
            data-col-id={col.id}
            data-row-id={row.id}
            aria-colindex={cellAriaColIdx}
            {...(isActiveCell ? { 'data-active': 'true' } : {})}
            {...(isRowDragHandleCell ? { 'data-row-drag-handle': 'cell' } : {})}
            {...(isInvalidCell ? { 'data-cell-invalid': 'true', 'aria-invalid': true } : {})}
            {...(isValidatingCell ? { 'data-cell-validating': 'true', 'aria-busy': true } : {})}
            style={isRowDragHandleCell ? { ...cellStyle, cursor: 'grab' } : cellStyle}
            {...(isRowDragHandleCell
              ? {
                  onPointerDown: (e) => {
                    onRowDragPointerDown(row.id, e);
                  },
                }
              : cellRangeEnabled
                ? {
                    onPointerDown: (e) => {
                      onCellPointerDown(row.id, col.id, e);
                    },
                    onPointerMove: (e) => {
                      onCellPointerMove(e);
                    },
                    onPointerUp: (e) => {
                      onCellPointerUp(e);
                    },
                    onPointerCancel: (e) => {
                      onCellPointerCancel(e);
                    },
                    onClickCapture: (e) => {
                      onCellShiftClick(row.id, col.id, e);
                    },
                  }
                : {})}
            {...(contextMenu != null && contextMenu.items.length > 0
              ? {
                  onContextMenu: (e: ReactMouseEvent) => {
                    onCellContextMenu(row.id, col.id, e);
                  },
                }
              : {})}
          >
            {isActionsCol && col.actions != null && col.actions.length > 0 ? (
              renderActionsCellChildren(col.actions, row)
            ) : editingThisCell != null ? (
              buildCellEditorInput(editingThisCell)
            ) : treeActive ? (
              <>
                {treeLeadingNode}
                <span className="cx-table-cell-tree-label">
                  {renderQuickFindHighlight(text, col, quickFindText)}
                </span>
              </>
            ) : (
              renderQuickFindHighlight(text, col, quickFindText)
            )}
          </div>
        );
      });
      // (vue3 equivalent): body rows are absolute-
      // positioned children of `.cx-table-body-content` (position:
      // relative + explicit totalBodyHeight). Sets up
      // virtualization with no refactor — virtualRowsPass only changes
      // which rows render.
      // selected rows get cx-table-row--selected modifier +
      // aria-selected="true". row width grows by selection
      // column width when the selection rail is shown; selection cell
      // is prepended (left) or appended (right) per `selectionColumn.side`.
      // (react port): row-drag modifier classes + grip cell.
      const isRowDragSource = movingRowState?.rowId === row.id;
      const rowDropTarget = movingRowState?.dropTarget;
      const isRowDropTargetAbove =
        rowDropTarget?.targetRowId === row.id && rowDropTarget.position === 'above';
      const isRowDropTargetBelow =
        rowDropTarget?.targetRowId === row.id && rowDropTarget.position === 'below';
      // -C (2026-05-30 — react port): auto-height row uses
      // min-height so content can grow beyond defaultRowHeight.
      const rowAutoHeight = enableRowAutoHeight === true;
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
      const rowStyle: CSSProperties = {
        position: 'absolute',
        top: `${rowYByRowId[row.id] ?? 0}px`,
        left: 0,
        width: `${totalWithRowDrag}px`,
        ...(rowAutoHeight ? { minHeight: `${rowH}px` } : { height: `${rowH}px` }),
      };
      const ariaSelectedAttr: boolean | undefined =
        selectionMode !== 'none' && isSelected ? true : undefined;
      const rowAriaRowIdx: number = ariaRowIndexForBody(row.id);
      const rowChildrenWithSelection = selectionColShow
        ? selectionColSide === 'left'
          ? [buildBodyRowSelectionCell(row, rowH), ...cellNodes]
          : [...cellNodes, buildBodyRowSelectionCell(row, rowH)]
        : cellNodes;
      const gripCell = rowDragColumnShow ? buildRowDragGripCell(row, rowH) : null;
      const rowChildren = gripCell
        ? rowDragColumnSide === 'left'
          ? [gripCell, ...rowChildrenWithSelection]
          : [...rowChildrenWithSelection, gripCell]
        : rowChildrenWithSelection;
      return (
        <div
          key={`row-${row.id}`}
          className={rowClass}
          role="row"
          data-row-id={row.id}
          aria-rowindex={rowAriaRowIdx}
          aria-selected={ariaSelectedAttr}
          style={rowStyle}
          ref={
            rowAutoHeight
              ? (el) => {
                  if (el != null) {
                    observeRowEl(el);
                  }
                }
              : undefined
          }
        >
          {rowChildren}
        </div>
      );
    });

    // (vue3 equivalent): split body into scrollport
    // + virtual-content layer. The outer `.cx-table-body` captures
    // scroll + height via `useTableBodyScroll`; the inner
    // `.cx-table-body-content` hosts absolute-positioned rows + carries
    // delegated interaction handlers (+ 7). Full
    // totalBodyHeight on the content layer drives the scrollbar even
    // when only a windowed subset of rows is in the DOM.
    const bodyContentStyle: CSSProperties = {
      position: 'relative',
      width: `${totalWidth}px`,
      height: `${totalBodyHeight}px`,
    };
    // (2026-05-27 — react port of vue3): drag-fill
    // handle overlay. Verbatim port of vue3's `dragFillHandle` —
    // rendered as the last child of `.cx-table-body-content`. Visible
    // iff `cellRangeSelection === 'enabled'` AND the envelope is
    // non-empty. Position computed from `rowYByRowId[lastRow] +
    // rowHeight(lastRow)` for top + cumulative `widthByColId` to last
    // col for left (selection-rail-aware). z-index 4 above pinned
    // cells.
    let dragFillHandleNode: ReactElement | null = null;
    if (
      cellRangeSelection === 'enabled' &&
      cellRangeEnvelope.rowIds.length > 0 &&
      cellRangeEnvelope.colIds.length > 0
    ) {
      const lastRowId = cellRangeEnvelope.rowIds[cellRangeEnvelope.rowIds.length - 1]!;
      const lastColId = cellRangeEnvelope.colIds[cellRangeEnvelope.colIds.length - 1]!;
      const handleTop =
        (rowYByRowId[lastRowId] ?? 0) + (rowHeightByRowId[lastRowId] ?? t.rowHeight);
      let handleLeft = 0;
      for (const col of visibleColumns) {
        handleLeft += widthByColId[col.id] ?? 0;
        if (col.id === lastColId) break;
      }
      if (selectionColShow && selectionColSide === 'left') {
        handleLeft += selectionColWidth;
      }
      const dragFillHandleStyle: CSSProperties = {
        position: 'absolute',
        top: `${handleTop - 4}px`,
        left: `${handleLeft - 4}px`,
        width: '8px',
        height: '8px',
        background: 'var(--cx-table-drag-fill-handle-color, #2563eb)',
        border: '1px solid white',
        boxSizing: 'border-box',
        cursor: 'crosshair',
        zIndex: 4,
        touchAction: 'none',
      };
      dragFillHandleNode = (
        <div
          className="cx-table-drag-fill-handle"
          data-testid="cx-drag-fill-handle"
          style={dragFillHandleStyle}
          onPointerDown={onDragFillPointerDown}
          onPointerMove={onDragFillPointerMove}
          onPointerUp={onDragFillPointerUp}
          onPointerCancel={onDragFillPointerCancel}
        />
      );
    }

    const bodyContent = (
      <div
        className="cx-table-body-content"
        style={bodyContentStyle}
        onClick={onBodyContentClick}
        onDoubleClick={onBodyContentDblclick}
        onPointerOver={onBodyContentPointerOver}
        onPointerOut={onBodyContentPointerOut}
        onPointerMove={onBodyContentTooltipPointerMove}
      >
        {bodyRows}
        {dragFillHandleNode}
      </div>
    );

    // (2026-05-28 — react port of vue3): pinned
    // rows. Sticky-positioned inside the body scroll container; never
    // participate in filter / sort / page / virtualization.
    const buildPinnedRowNode = (
      row: RowSpec,
      position: 'top' | 'bottom',
      zoneIndex: number,
      zoneCount: number,
      bottomOffset = 0,
    ): ReactElement => {
      const rowH = row.heightHint ?? t.rowHeight;
      const stickyAnchor: CSSProperties =
        position === 'top'
          ? { top: `${zoneIndex * rowH}px` }
          : { bottom: `${(zoneCount - 1 - zoneIndex) * rowH + bottomOffset}px` };
      const cellNodes: ReactElement[] = visibleColumns.map((col) => {
        const value = getCellValue({ row, column: col });
        const text =
          col.valueFormatter != null
            ? col.valueFormatter({ value, row, column: col })
            : formatCellValue({ row, column: col });
        const extraClasses = resolveCellClassNames({ value, row, column: col });
        const classList = ['cx-table-cell', 'cx-table-cell--pinned-row', ...extraClasses];
        for (const suffix of pinnedCellModifierSuffixes(col.id)) {
          classList.push(`cx-table-cell${suffix}`);
        }
        const pinnedBodyStyle = pinnedCellStyle(col.id);
        const isPinnedCol = pinnedLeftSet.has(col.id) || pinnedRightSet.has(col.id);
        const cellZIndex = isPinnedCol ? 4 : t.pinnedRowZIndex;
        // cast bypasses strict per-side CSSProperty
        // literal-union checking — same rationale as body cell renderer.
        const cellStyle = {
          boxSizing: 'border-box',
          width: `${widthByColId[col.id] ?? 0}px`,
          height: `${rowH}px`,
          paddingLeft: `${t.cellPaddingX}px`,
          paddingRight: `${t.cellPaddingX}px`,
          ...pinnedBodyStyle,
          ...(pinnedBodyStyle.position != null ? { zIndex: cellZIndex } : {}),
          // + 99.2.1 + 99.2.2 (2026-06-01 — react port):
          // 5 conditional spreads for cell style axes, applied to
          // pinned-row cells for consistency with body cells.
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.backgroundColor !== undefined
            ? {
                backgroundColor: effectiveCellStyleByRowIdColId[row.id]![col.id]!.backgroundColor,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.color !== undefined
            ? { color: effectiveCellStyleByRowIdColId[row.id]![col.id]!.color }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.fontWeight !== undefined
            ? { fontWeight: effectiveCellStyleByRowIdColId[row.id]![col.id]!.fontWeight }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.fontStyle !== undefined
            ? { fontStyle: effectiveCellStyleByRowIdColId[row.id]![col.id]!.fontStyle }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.textDecoration !== undefined
            ? {
                textDecoration: effectiveCellStyleByRowIdColId[row.id]![col.id]!.textDecoration,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderColor !== undefined
            ? { borderColor: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderColor }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderWidth !== undefined
            ? { borderWidth: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderWidth }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderStyle !== undefined
            ? { borderStyle: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderStyle }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderRadius !== undefined
            ? {
                borderRadius: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderRadius,
              }
            : {}),
          // (2026-06-01 — react port): 12 per-side
          // border longhand overrides on pinned-row cells. Verbatim
          // mirror of vue3 body cell renderer.
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderTopColor !== undefined
            ? { borderTopColor: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderTopColor }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderTopWidth !== undefined
            ? { borderTopWidth: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderTopWidth }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderTopStyle !== undefined
            ? { borderTopStyle: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderTopStyle }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderRightColor !== undefined
            ? {
                borderRightColor: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderRightColor,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderRightWidth !== undefined
            ? {
                borderRightWidth: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderRightWidth,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderRightStyle !== undefined
            ? {
                borderRightStyle: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderRightStyle,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderBottomColor !== undefined
            ? {
                borderBottomColor:
                  effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderBottomColor,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderBottomWidth !== undefined
            ? {
                borderBottomWidth:
                  effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderBottomWidth,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderBottomStyle !== undefined
            ? {
                borderBottomStyle:
                  effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderBottomStyle,
              }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderLeftColor !== undefined
            ? { borderLeftColor: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderLeftColor }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderLeftWidth !== undefined
            ? { borderLeftWidth: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderLeftWidth }
            : {}),
          ...(effectiveCellStyleByRowIdColId[row.id]?.[col.id]?.borderLeftStyle !== undefined
            ? { borderLeftStyle: effectiveCellStyleByRowIdColId[row.id]![col.id]!.borderLeftStyle }
            : {}),
        } as CSSProperties;
        const pinnedCellAriaColIdx: number = ariaColIndexFor(col.id);
        return (
          <div
            key={`pinned-${position}-cell-${row.id}-${col.id}`}
            className={classList.join(' ')}
            role="gridcell"
            data-col-id={col.id}
            data-row-id={row.id}
            aria-colindex={pinnedCellAriaColIdx}
            style={cellStyle}
          >
            {text}
          </div>
        );
      });
      const isSelectedPinned = selectedRowIdsSet.has(row.id);
      const selectionCell: ReactElement | null = selectionColShow
        ? buildBodyRowSelectionCell(row, rowH)
        : null;
      const rowChildren: readonly ReactElement[] = selectionCell
        ? selectionColSide === 'left'
          ? [selectionCell, ...cellNodes]
          : [...cellNodes, selectionCell]
        : cellNodes;
      const rowClass = [
        'cx-table-row',
        `cx-table-row--pinned-${position}`,
        isSelectedPinned && 'cx-table-row--selected',
      ]
        .filter(Boolean)
        .join(' ');
      const ariaSel: boolean | undefined =
        selectionMode !== 'none' && isSelectedPinned ? true : undefined;
      const pinnedRowAriaRowIdx: number =
        position === 'top' ? zoneIndex + 2 : ariaRowIndexAfterBody + zoneIndex;
      const rowStyle: CSSProperties = {
        position: 'sticky',
        ...stickyAnchor,
        left: 0,
        width: `${totalWithRowDrag}px`,
        height: `${rowH}px`,
        zIndex: t.pinnedRowZIndex,
        background: 'var(--cx-table-pinned-zone-bg, var(--cx-table-odd-row-bg, #ffffff))',
      };
      return (
        <div
          key={`pinned-${position}-row-${row.id}`}
          className={rowClass}
          role="row"
          data-row-id={row.id}
          data-pinned-row={position}
          aria-rowindex={pinnedRowAriaRowIdx}
          aria-selected={ariaSel}
          style={rowStyle}
        >
          {rowChildren}
        </div>
      );
    };
    const topPinnedRowNodes: ReactElement[] = topPinnedRows.map((row, i) =>
      buildPinnedRowNode(row, 'top', i, topPinnedRows.length),
    );
    // lift bottom-pinned rows above the sticky footer so they don't
    // overlap (footerHeight when footer is shown, 0 otherwise).
    const pinnedRowBottomOffset = showFooterRow ? t.footerHeight : 0;
    const bottomPinnedRowNodes: ReactElement[] = bottomPinnedRows.map((row, i) =>
      buildPinnedRowNode(row, 'bottom', i, bottomPinnedRows.length, pinnedRowBottomOffset),
    );

    // (2026-05-28 — react port): loading + no-rows overlays.
    // Loading takes precedence over no-rows per Decision F.1.
    const showLoadingOverlay = loading;
    const showNoRowsOverlay =
      !showLoadingOverlay &&
      filteredRows.length === 0 &&
      topPinnedRows.length === 0 &&
      bottomPinnedRows.length === 0;
    let overlayNode: ReactElement | null = null;
    if (showLoadingOverlay || showNoRowsOverlay) {
      const content: ReactNode = showLoadingOverlay
        ? (loadingOverlay ?? 'Loading…')
        : (noRowsOverlay ?? 'No rows');
      overlayNode = (
        <div
          className={
            showLoadingOverlay
              ? 'cx-table-overlay cx-table-overlay--loading'
              : 'cx-table-overlay cx-table-overlay--no-rows'
          }
          aria-live="polite"
          data-testid={showLoadingOverlay ? 'cx-overlay-loading' : 'cx-overlay-no-rows'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--cx-table-overlay-bg, rgba(255,255,255,0.85))',
            pointerEvents: showLoadingOverlay ? 'auto' : 'none',
            zIndex: 5,
          }}
        >
          {typeof content === 'string' ? (
            <span className="cx-table-overlay-content">{content}</span>
          ) : (
            content
          )}
        </div>
      );
    }

    // (2026-05-27 — react port of vue3): opt-in
    // sticky footer aggregate row rendered INSIDE the body scrollport
    // as a sticky-bottom element so the body's horizontal scrollbar
    // sits BELOW the footer (not above it). Per Decision A.1,
    // aggregators receive the post-filter rows; per Decision C.1,
    // columns without an aggregator render empty placeholder cells
    // sized to the column width so the row stays column-aligned with
    // the body + header. Per-zone iteration mirrors the header strip
    // (left pinned + selection rail placeholder + center + right
    // pinned). Horizontal scroll is automatic (the footer is a child
    // of the body scrollport). Declared before `body` because `body`
    // embeds it.
    let footer: ReactElement | null = null;
    if (showFooterRow) {
      const buildFooterCell = (col: ColumnSpec): ReactElement => {
        const width = widthByColId[col.id] ?? 0;
        const hasAggregator = col.aggregator != null;
        const cellClasses: string[] = ['cx-table-footer-cell'];
        if (!hasAggregator) cellClasses.push('cx-table-footer-cell--empty');
        for (const suffix of pinnedCellModifierSuffixes(col.id)) {
          cellClasses.push(`cx-table-footer-cell${suffix}`);
        }
        const style: CSSProperties = {
          // border-box keeps `width` inclusive of the horizontal
          // padding below, matching header / body cells so the footer
          // does not overflow its row width and trigger a flex-shrink
          // that would misalign aggregate cells with the body.
          boxSizing: 'border-box',
          width: `${width}px`,
          height: `${t.footerHeight}px`,
          paddingLeft: `${t.cellPaddingX}px`,
          paddingRight: `${t.cellPaddingX}px`,
          background: 'var(--cx-table-footer-bg, #f8f9fa)',
          ...pinnedCellStyle(col.id),
        };
        // Mirror body's plain-column shape (text rendered directly as the
        // cell child, NOT wrapped in a label span) so the consumer's
        // `.cx-table-cell` / `.cx-table-footer-cell` CSS (flex + overflow
        // hidden + text-overflow ellipsis) applies identically - avoids a
        // footer-specific span that would need its own flex:1/min-width:0
        // rule and otherwise breaks ellipsis / alignment with body rows.
        let content: string | null = null;
        if (hasAggregator) {
          const value = footerValuesByColId[col.id];
          const synthRow: RowSpec = {
            id: '__footer__',
            data: { [col.field ?? col.id]: value },
          };
          const text = col.valueFormatter
            ? col.valueFormatter({ value, row: synthRow, column: col })
            : formatCellValue({ row: synthRow, column: col });
          content = text;
        }
        return (
          <div
            key={`footer-${col.id}`}
            className={cellClasses.join(' ')}
            role="gridcell"
            data-col-id={col.id}
            style={style}
          >
            {content}
          </div>
        );
      };
      const leftCells = pinnedColsResult.leftPinnedColIds
        .map((id) => columnTable.getById(id))
        .filter((c): c is ColumnSpec => c != null)
        .map(buildFooterCell);
      const centerCells = pinnedColsResult.centerColIds
        .map((id) => columnTable.getById(id))
        .filter((c): c is ColumnSpec => c != null)
        .map(buildFooterCell);
      const rightCells = pinnedColsResult.rightPinnedColIds
        .map((id) => columnTable.getById(id))
        .filter((c): c is ColumnSpec => c != null)
        .map(buildFooterCell);
      const selectionPlaceholder: ReactElement | null = selectionColShow ? (
        <div
          key="footer-selection-rail"
          className="cx-table-footer-cell cx-table-footer-cell--selection-rail"
          style={{
            width: `${selectionColWidth}px`,
            height: `${t.footerHeight}px`,
            background: 'var(--cx-table-footer-bg, #f8f9fa)',
            ...selectionRailStickyStyle,
          }}
        />
      ) : null;
      const footerRowDragPlaceholder: ReactElement | null = rowDragColumnShow ? (
        <div
          key="footer-row-drag-rail"
          className="cx-table-footer-cell cx-table-row-drag-cell"
          style={{
            width: `${rowDragColumnWidth}px`,
            height: `${t.footerHeight}px`,
            background: 'var(--cx-table-row-drag-rail-bg, #f8fafc)',
            ...rowDragRailStickyStyle,
          }}
        />
      ) : null;
      const orderedZoneCells: ReactElement[] = [...leftCells, ...centerCells, ...rightCells];
      const rowChildrenWithSelection: ReactElement[] = selectionColShow
        ? selectionColSide === 'left'
          ? [selectionPlaceholder!, ...orderedZoneCells]
          : [...orderedZoneCells, selectionPlaceholder!]
        : orderedZoneCells;
      const rowChildren: ReactElement[] = footerRowDragPlaceholder
        ? rowDragColumnSide === 'left'
          ? [footerRowDragPlaceholder, ...rowChildrenWithSelection]
          : [...rowChildrenWithSelection, footerRowDragPlaceholder]
        : rowChildrenWithSelection;
      footer = (
        <div
          className="cx-table-footer"
          role="rowgroup"
          // position: sticky; bottom: 0 keeps the footer pinned to
          // the bottom of the body viewport (visible while the body
          // scrolls vertically). The footer scrolls horizontally
          // with the body naturally (sticky only applies to the
          // block axis), so no scrollLeft mirror is needed. width
          // matches total content width so footer cells track body
          // columns. zIndex 3 sits above body rows (0) + pinned
          // rows (2) but below the drag-fill handle (4).
          style={
            {
              position: 'sticky',
              bottom: '0',
              width: `${totalWithRowDrag}px`,
              zIndex: 3,
              // Pinned footer cells read `var(--cx-table-pinned-zone-bg, inherit)`
              // via pinnedCellStyle(); without this override they fall back to
              // `inherit` (transparent) and lose the footer background, making the
              // aggregator row look patchy. Pin the token to the footer bg so
              // columns WITHOUT an aggregator still show the footer background.
              '--cx-table-pinned-zone-bg': 'var(--cx-table-footer-bg, #f8f9fa)',
            } as CSSProperties
          }
        >
          <div
            className="cx-table-row cx-table-row--footer"
            role="row"
            style={{ width: `${totalWithRowDrag}px` }}
          >
            {rowChildren}
          </div>
        </div>
      );
    }

    // (2026-05-26 — react port of vue3):
    // `overflowX` flips `'hidden'` → `'auto'` so that when the total
    // column width exceeds the body's viewport width a horizontal
    // scrollbar appears + pinned cells' sticky positioning has a
    // scrolling ancestor to anchor against. No visible change when
    // columns fit (no scrollbar materializes).
    //
    // `overflowY: 'scroll'` (not `auto`) reserves a STABLE vertical-
    // scrollbar gutter whether the body overflows or not, matching the
    // header / filter's reserved gutter so a pinned-right column's
    // sticky `right: 0` lands on the same right edge across header,
    // filter + body. The sticky footer lives INSIDE the body scrollport
    // so it shares the body's gutter (no separate overflow needed).
    // With `auto`, a short body drops the scrollbar + shifts its pinned
    // column ~15px right of the header's; `scroll` keeps the edges
    // identical.
    const bodyStyle: CSSProperties = {
      overflowY: 'scroll',
      overflowX: 'auto',
      position: 'relative',
    };
    const body = (
      <div
        ref={bodyRef}
        className="cx-table-body"
        role="rowgroup"
        style={bodyStyle}
        // (2026-05-27 — react port of vue3):
        // `tabIndex={0}` makes the body focusable so Ctrl+C / Cmd+C
        // keydown lands here when the user is interacting with the
        // data area. Standard a11y pattern for "div that should
        // accept keyboard input"; the role="rowgroup" + per-cell
        // gridcell roles still describe semantics correctly.
        tabIndex={0}
        // Ctrl+C / Cmd+C copies the active cell-range as
        // TSV. Gates on cellRangeSelection === 'enabled' + active
        // range; non-matching keystrokes propagate normally.
        onKeyDown={onBodyKeyDown}
        // (2026-05-28 — react port): pointer leaves body via
        // non-cell edge → clear pending + active tooltip.
        onPointerLeave={onBodyTooltipPointerLeave}
        // mirror body's horizontal scroll into the header +
        // filter row's `scrollLeft` so the column-aligned strips
        // track together. Imperative DOM mutation (no React state
        // round-trip) — scroll events fire ~60Hz and a setState would
        // force a re-render per event. Additive to (not replacing)
        // the vertical-scroll tracking via useTableBodyScroll's
        // addEventListener — both observers run.
        onScroll={(e) => {
          const target = e.currentTarget;
          const x = target.scrollLeft;
          const headerEl = headerRef.current;
          if (headerEl != null && headerEl.scrollLeft !== x) {
            headerEl.scrollLeft = x;
          }
          const filterEl = filterRowRef.current;
          if (filterEl != null && filterEl.scrollLeft !== x) {
            filterEl.scrollLeft = x;
          }
          // The sticky footer lives INSIDE the body scrollport now
          // (position: sticky; bottom: 0), so it scrolls naturally
          // with the body - no imperative scrollLeft mirror needed.
          // clear tooltip on scroll (popover coords captured
          // pre-scroll).
          onBodyTooltipScroll();
        }}
      >
        {topPinnedRowNodes}
        {bodyContent}
        {bottomPinnedRowNodes}
        {/* the sticky footer is a child of the body scrollport so
            the body's horizontal scrollbar sits BELOW it (not above). */}
        {footer}
        {overlayNode}
      </div>
    );

    // merged footer row: status area (left) + pagination cluster (right).
    // Shown when either `showStatusBar` or `showPagination` is on; when
    // both are off the entire footer is omitted. The two clusters are
    // siblings (not nested) so `role="status"` + `role="navigation"` stay
    // in separate subtrees under the neutral `role="group"` root.
    let footerBar: ReactElement | null = null;
    const showFooter = showStatusBar || showPagination;
    if (showFooter) {
      // --- left: status area ---
      let statusArea: ReactElement | null = null;
      if (showStatusBar) {
        const counts: StatusBarCounts = {
          total: rows.length,
          filtered: filteredRows.length,
          selected: selectedRowIdsSet.size,
          page: pageStateRef.current,
          pageSize: pageSizeStateRef.current,
        };
        const inner: ReactNode =
          statusBarRenderer != null ? statusBarRenderer(counts) : defaultStatusBarText(counts);
        statusArea = (
          <div
            className="cx-table-pagination-status cx-table-status-bar"
            role="status"
            aria-live="polite"
            data-testid="cx-status-bar"
          >
            {inner}
          </div>
        );
      }

      // --- right: pagination cluster (nav + meta) ---
      // The calc logic below is preserved verbatim from the legacy
      // `paginationFooter` block; only the outer wrapper changed.
      let cluster: ReactElement | null = null;
      if (showPagination) {
        // (2026-05-30 - react port) Decision B.1: serverSide+
        // showPagination reads totals from session-derived computeds.
        const cp = serverSidePaginationActive
          ? serverSideCurrentPageForFooter
          : currentPageFromPass;
        const tp = serverSidePaginationActive ? serverSideTotalPagesForFooter : totalPagesFromPass;
        const ps = pageSizeStateRef.current;
        const totalRows = serverSidePaginationActive
          ? serverSideTotalRowsForFooter
          : totalRowsAcrossPages;
        // Last valid page is tp-1; when tp=0 (empty), both ends are
        // disabled (no navigation makes sense).
        const atFirst = tp === 0 || cp <= 0;
        const atLast = tp === 0 || cp >= tp - 1;
        // Display 1-based per Decision B; empty dataset shows
        // "0 / 0" so users see the empty state.
        const humanCurrent = tp === 0 ? 0 : cp + 1;
        const humanTotal = tp;
        const visiblePages = computeVisiblePageNumbers(
          cp,
          tp,
          paginationSiblingCount,
          paginationBoundaryCount,
        );
        const pageBarChildren = visiblePages.map((el, idx) => {
          if (el === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="cx-table-pagination-ellipsis"
                aria-hidden="true"
              >
                …
              </span>
            );
          }
          const isCurrent = el === cp;
          const pageBtnClass = isCurrent
            ? 'cx-table-pagination-page cx-table-pagination-page--current'
            : 'cx-table-pagination-page';
          return (
            <button
              key={`page-${el}`}
              type="button"
              className={pageBtnClass}
              aria-label={`Go to page ${el + 1}`}
              aria-current={isCurrent ? 'page' : undefined}
              data-page-index={String(el)}
              disabled={isCurrent}
              onClick={() => {
                if (isCurrent) return;
                applyPage(el, ps);
              }}
            >
              {String(el + 1)}
            </button>
          );
        });
        // The "共 N 行" total label is shown only when the status area
        // is NOT rendered - otherwise the status bar already surfaces
        // the full row-count summary and the label would be a duplicate.
        const totalLabel = showStatusBar ? null : (
          <span className="cx-table-pagination-total">{`共 ${totalRows} 行`}</span>
        );
        cluster = (
          <div className="cx-table-pagination-cluster" role="navigation" aria-label="分页">
            <div className="cx-table-pagination-nav">
              <button
                type="button"
                className="cx-table-pagination-button cx-table-pagination-button--prev"
                aria-label="Previous page"
                disabled={atFirst}
                onClick={() => {
                  if (atFirst) return;
                  applyPage(cp - 1, ps);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div
                className="cx-table-pagination-pages"
                data-current-page={String(cp)}
                data-total-pages={String(tp)}
                role="group"
                aria-label={`Page ${humanCurrent} of ${humanTotal}`}
              >
                {pageBarChildren}
              </div>
              <button
                type="button"
                className="cx-table-pagination-button cx-table-pagination-button--next"
                aria-label="Next page"
                disabled={atLast}
                onClick={() => {
                  if (atLast) return;
                  applyPage(cp + 1, ps);
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            <div className="cx-table-pagination-meta">
              {totalLabel}
              <label className="cx-table-pagination-size">
                <span className="cx-table-pagination-size-label">每页 </span>
                <select
                  className="cx-table-pagination-size-select"
                  aria-label="Rows per page"
                  value={ps}
                  onChange={(e) => {
                    const nextSize = Number(e.target.value);
                    if (Number.isFinite(nextSize) && nextSize > 0) {
                      applyPage(pageStateRef.current, nextSize);
                    }
                  }}
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={`size-${opt}`} value={opt}>{`${opt} 行/页`}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        );
      }

      footerBar = (
        <div className="cx-table-pagination" role="group" aria-label="表格底栏">
          {statusArea}
          {cluster}
        </div>
      );
    }
    // (vue3 equivalent): inline CSS custom
    // properties on the wrapper so the theme reaches descendant CSS
    // via `var(--cx-table-*, fallback)`. Geometry tokens emit with
    // `px` units; color tokens pass through as raw strings. The cast
    // through `CSSProperties` is required because React's typed style
    // record does not declare `--cx-table-*` keys; spreading the
    // string-only record into the style attribute is the standard
    // React pattern for custom properties.
    const themeVars = cssVarsForTheme(t);
    // wrapper carries position:relative inline
    // so `.cx-table-drop-line` overlay's absolute coords resolve
    // against the wrapper (not the document).
    const wrapperStyle = { ...themeVars, position: 'relative' } as CSSProperties;
    // drop-line overlay for column-move drag. Absolute-
    // positioned 2px line spanning the wrapper's full vertical extent;
    // `left` is `movingColumnState.dropLineLeftPx` (pre-computed
    // wrapper-relative px). Only mounted when an active drag has a
    // valid drop target.
    const dropLineStyle: CSSProperties = {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: `${movingColumnState?.dropLineLeftPx ?? 0}px`,
      width: '2px',
      backgroundColor: 'var(--cx-table-drop-indicator-color, #2680eb)',
      pointerEvents: 'none',
      zIndex: 4,
    };

    // (2026-05-29 — react port): aria-rowcount + aria-colcount
    // + off-screen live region. Verbatim mirror of vue3
    // wrapper attrs + child div.
    const ariaRowCount = 1 + topPinnedRows.length + pagedRows.length + bottomPinnedRows.length;
    const ariaColCount = visibleColumns.length + (selectionColumn.show === true ? 1 : 0);

    // (react port): row-drop-line overlay.
    const rowDropLine: ReactElement | null =
      movingRowState?.dropLineTopPx != null ? (
        <div
          className="cx-table-row-drop-line"
          data-testid="cx-row-drop-line"
          data-drop-target-row-id={movingRowState.dropTarget?.targetRowId}
          data-drop-target-position={movingRowState.dropTarget?.position}
          style={{
            position: 'absolute',
            top: `${movingRowState.dropLineTopPx}px`,
            left: 0,
            width: '100%',
            height: '2px',
            background: 'var(--cx-table-drop-line-color, #2563eb)',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />
      ) : null;

    // Settings popover. Renders only when settingsPopoverOpen is
    // true AND toolPanel is configured. Fixed-position anchored to the
    // settings icon button in the action column header. Contains a
    // horizontal tab bar (one tab per panel descriptor) + the active
    // panel's renderer output below.
    const settingsPopover =
      settingsPopoverOpen && toolPanel != null && toolPanel.show && toolPanel.panels.length > 0
        ? (() => {
            const cfg = toolPanel;
            const btnEl = settingsIconButtonRef.current;
            const rect = btnEl?.getBoundingClientRect();
            const popoverWidth = cfg.popoverWidth ?? DEFAULT_TOOL_PANEL_POPOVER_WIDTH_PX;
            const maxHeight = cfg.popoverMaxHeight ?? DEFAULT_TOOL_PANEL_POPOVER_MAX_HEIGHT_PX;
            const btnBottom = rect?.bottom ?? 0;
            const btnRight = rect?.right ?? 0;
            const spaceBelow = window.innerHeight - btnBottom;
            const showBelow = spaceBelow >= 200 || spaceBelow >= window.innerHeight / 2;
            const top = showBelow ? btnBottom + 4 : (rect?.top ?? 0) - maxHeight - 4;
            const rightAligned = btnRight;
            const left = Math.max(
              8,
              Math.min(rightAligned - popoverWidth, window.innerWidth - popoverWidth - 8),
            );
            const activeId = activeToolPanelId;
            const activeDescriptor: ToolPanelDescriptor | undefined =
              cfg.panels.find((p) => p.id === activeId) ?? cfg.panels[0];
            const popoverActiveIdx = settingsPopoverKbdNav.activeIndex;
            return (
              <div
                ref={(el: HTMLDivElement | null) => {
                  settingsPopoverRef.current = el;
                }}
                className="cx-table-settings-popover"
                role="dialog"
                aria-label="设置面板"
                style={{
                  position: 'fixed',
                  left: `${left}px`,
                  top: `${top}px`,
                  width: `${popoverWidth}px`,
                  zIndex: 8,
                }}
              >
                <div
                  ref={settingsPopoverTabsRef}
                  className="cx-table-settings-popover__tabs"
                  role="tablist"
                  aria-orientation="horizontal"
                  onKeyDown={(e) => settingsPopoverKbdNav.handleKeydown(e)}
                >
                  {cfg.panels.map((descriptor, idx) => {
                    const isActive = descriptor.id === (activeDescriptor?.id ?? '');
                    const isKbdActive = popoverActiveIdx === idx;
                    return (
                      <button
                        key={descriptor.id}
                        type="button"
                        className={[
                          'cx-table-settings-popover-tab',
                          isActive && 'cx-table-settings-popover-tab--active',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        role="tab"
                        tabIndex={isKbdActive ? 0 : -1}
                        data-tool-panel-id={descriptor.id}
                        data-menu-item-index={String(idx)}
                        aria-selected={isActive ? 'true' : 'false'}
                        aria-label={descriptor.ariaLabel ?? descriptor.label}
                        title={descriptor.label}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveToolPanelId(descriptor.id);
                          onToolPanelChangeRef.current?.({ activePanelId: descriptor.id });
                        }}
                      >
                        {descriptor.icon ?? descriptor.label.charAt(0)}
                      </button>
                    );
                  })}
                </div>
                {activeDescriptor != null ? (
                  <div
                    className="cx-table-settings-popover__content"
                    role="tabpanel"
                    data-tool-panel-id={activeDescriptor.id}
                    style={{ maxHeight: `${maxHeight}px`, overflowY: 'auto' }}
                  >
                    {activeDescriptor.renderer() as ReactNode}
                  </div>
                ) : null}
              </div>
            );
          })()
        : null;

    // Hoisted column-header menu. Rendered as a direct child of the
    // wrapper (not inside the header cell) so it escapes the cell's
    // `overflow:hidden` clipping. Position is computed synchronously in
    // `applyOpenColumnHeaderMenu`.
    const columnHeaderMenuNode =
      showColumnHeaderMenu === true &&
      openColumnHeaderMenuColId != null &&
      columnHeaderMenuPos != null
        ? (() => {
            const openMenuColId = openColumnHeaderMenuColId;
            const col = columnTable.getById(openMenuColId);
            const isSortableForMenu = col?.sortable !== false;
            const isHideableForMenu = col != null;
            const isAutosizeableForMenu = col?.autosizeable !== false && col?.resizable !== false;
            const sortIdx = sortSpec.findIndex((s) => s.colId === openMenuColId);
            const direction = sortIdx >= 0 ? (sortSpec[sortIdx]?.direction ?? null) : null;
            const isCurrentlySorted = direction != null;
            const headerMenuActiveIdx = columnHeaderMenuKbdNav.activeIndex;
            const tabForIdx = (idx: number, disabled: boolean): number => {
              if (disabled) return -1;
              return headerMenuActiveIdx === idx ? 0 : -1;
            };
            return (
              <div
                ref={columnHeaderMenuRef}
                className="cx-table-column-header-menu"
                role="menu"
                data-col-id={openMenuColId}
                style={{
                  position: 'absolute',
                  left: columnHeaderMenuPos.left,
                  top: columnHeaderMenuPos.top,
                  zIndex: 6,
                }}
                onKeyDown={(e) => columnHeaderMenuKbdNav.handleKeydown(e)}
              >
                <button
                  type="button"
                  className="cx-table-column-header-menu-item"
                  role="menuitem"
                  tabIndex={tabForIdx(0, !isSortableForMenu)}
                  data-action="sort-asc"
                  data-menu-item-index="0"
                  disabled={!isSortableForMenu}
                  onClick={() => {
                    if (!isSortableForMenu) return;
                    onColumnHeaderMenuItemClick(openMenuColId, 'sort-asc');
                  }}
                >
                  升序
                </button>
                <button
                  type="button"
                  className="cx-table-column-header-menu-item"
                  role="menuitem"
                  tabIndex={tabForIdx(1, !isSortableForMenu)}
                  data-action="sort-desc"
                  data-menu-item-index="1"
                  disabled={!isSortableForMenu}
                  onClick={() => {
                    if (!isSortableForMenu) return;
                    onColumnHeaderMenuItemClick(openMenuColId, 'sort-desc');
                  }}
                >
                  降序
                </button>
                <button
                  type="button"
                  className="cx-table-column-header-menu-item"
                  role="menuitem"
                  tabIndex={tabForIdx(2, !isCurrentlySorted)}
                  data-action="clear-sort"
                  data-menu-item-index="2"
                  disabled={!isCurrentlySorted}
                  onClick={() => {
                    if (!isCurrentlySorted) return;
                    onColumnHeaderMenuItemClick(openMenuColId, 'clear-sort');
                  }}
                >
                  清除排序
                </button>
                <button
                  type="button"
                  className="cx-table-column-header-menu-item"
                  role="menuitem"
                  tabIndex={tabForIdx(3, !isHideableForMenu)}
                  data-action="hide"
                  data-menu-item-index="3"
                  disabled={!isHideableForMenu}
                  onClick={() => {
                    if (!isHideableForMenu) return;
                    onColumnHeaderMenuItemClick(openMenuColId, 'hide');
                  }}
                >
                  隐藏
                </button>
                <button
                  type="button"
                  className="cx-table-column-header-menu-item"
                  role="menuitem"
                  tabIndex={tabForIdx(4, !isAutosizeableForMenu)}
                  data-action="autosize"
                  data-menu-item-index="4"
                  disabled={!isAutosizeableForMenu}
                  onClick={() => {
                    if (!isAutosizeableForMenu) return;
                    onColumnHeaderMenuItemClick(openMenuColId, 'autosize');
                  }}
                >
                  自适应宽度
                </button>
              </div>
            );
          })()
        : null;

    const tableWrapper = (
      <div
        ref={wrapperRef}
        className="cx-table-wrapper"
        role="grid"
        aria-rowcount={ariaRowCount}
        aria-colcount={ariaColCount}
        data-table-version="0.1.0-alpha"
        style={wrapperStyle}
        onPointerMove={onRowDragPointerMove}
        onPointerUp={onRowDragPointerUp}
        onPointerCancel={onRowDragPointerCancel}
      >
        {header}
        {filterRow}
        {body}
        {footerBar}
        {rowDropLine}
        {contextMenuPosition != null && contextMenu != null && contextMenu.items.length > 0 && (
          <div
            ref={cellContextMenuRef}
            className="cx-table-cell-context-menu"
            role="menu"
            data-testid="cx-cell-context-menu"
            style={{
              position: 'fixed',
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
              zIndex: 7,
            }}
            onKeyDown={(e) => cellContextMenuKbdNav.handleKeydown(e)}
          >
            {contextMenu.items.map((item: ContextMenuItem, idx: number) => {
              const cmCtx: ContextMenuContext = {
                rowId: contextMenuPosition.rowId,
                colId: contextMenuPosition.colId,
              };
              const isDisabled = item.disabled?.(cmCtx) === true;
              const isKbdActive = !isDisabled && cellContextMenuKbdNav.activeIndex === idx;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    'cx-table-cell-context-menu-item',
                    isDisabled && 'cx-table-cell-context-menu-item--disabled',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  role="menuitem"
                  tabIndex={isKbdActive ? 0 : -1}
                  data-item-id={item.id}
                  data-menu-item-index={String(idx)}
                  disabled={isDisabled}
                  onClick={() => {
                    onContextMenuItemClick(item);
                  }}
                >
                  {item.icon != null ? `${item.icon} ${item.label}` : item.label}
                </button>
              );
            })}
          </div>
        )}
        {enableCellStyleEditor &&
          cellStyleEditorOpen != null &&
          (() => {
            const state = cellStyleEditorOpen;
            const SQUARE_SIZE_PX = 180;
            const HUE_HEIGHT_PX = 14;
            const rgb = hsvToRgb(state.hsv);
            const squarePos = computeSquarePositionForHsv({
              hsv: state.hsv,
              squareWidthPx: SQUARE_SIZE_PX,
              squareHeightPx: SQUARE_SIZE_PX,
            });
            const huePosPx = computeStripPositionForHue({
              hue: state.hsv.h,
              stripSizePx: SQUARE_SIZE_PX,
            });
            const hueOnlyRgb = hsvToRgb({ h: state.hsv.h, s: 1, v: 1 });
            const hueOnlyHex = rgbToHex(hueOnlyRgb);
            const popoverTop = state.anchorRect.bottom + 4;
            return (
              <div
                className="cx-table-cell-style-editor"
                data-testid="cx-cell-style-editor"
                data-row-id={state.rowId}
                data-col-id={state.colId}
                data-cx-style-active-tab={state.activeTab}
                role="dialog"
                aria-label="Cell style editor"
                style={{
                  position: 'fixed',
                  left: `${state.anchorRect.left}px`,
                  top: `${popoverTop}px`,
                  zIndex: 8,
                  padding: '10px',
                  background: '#ffffff',
                  border: '1px solid #d9dde2',
                  borderRadius: '4px',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.18)',
                  width: `${SQUARE_SIZE_PX + 20}px`,
                }}
              >
                {/* (react port): tab strip — Background / Text. */}
                <div
                  className="cx-table-cell-style-editor__tabs"
                  role="tablist"
                  aria-label="Cell style axis"
                  style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '8px',
                    borderBottom: '1px solid #e5e7eb',
                  }}
                >
                  {(['background', 'text', 'font', 'border'] as const).map((tab) => {
                    const isActive = state.activeTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        role="tab"
                        data-cx-style-tab={tab}
                        aria-selected={isActive ? true : false}
                        className={`cx-table-cell-style-editor__tab${
                          isActive ? ' cx-table-cell-style-editor__tab--active' : ''
                        }`}
                        style={{
                          padding: '4px 10px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                          fontSize: '12px',
                          fontWeight: isActive ? 600 : 400,
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          switchCellStyleEditorTab(tab);
                        }}
                      >
                        {tab === 'background'
                          ? '背景色'
                          : tab === 'text'
                            ? '文字色'
                            : tab === 'font'
                              ? '字体'
                              : '边框'}
                      </button>
                    );
                  })}
                </div>
                {state.activeTab === 'font' && (
                  <div
                    className="cx-table-cell-style-editor__font-cluster"
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    <button
                      type="button"
                      data-cx-style-font="weight-bold"
                      aria-pressed={state.fontState.fontWeight === '700' ? true : false}
                      className={`cx-table-cell-style-editor__font-btn${
                        state.fontState.fontWeight === '700'
                          ? ' cx-table-cell-style-editor__font-btn--active'
                          : ''
                      }`}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: state.fontState.fontWeight === '700' ? '#eff6ff' : '#ffffff',
                        border: '1px solid #d9dde2',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={toggleCellStyleFontWeight}
                    >
                      加粗 (Bold)
                    </button>
                    {/* (2026-06-01 — react port): custom
                        font-weight 9-step picker in <details> disclosure.
                        Verbatim mirror of vue3. */}
                    <details
                      className="cx-table-cell-style-editor__font-weight-details"
                      data-cx-style-font-weight-picker=""
                    >
                      <summary style={{ fontSize: '12px', cursor: 'pointer' }}>
                        更多字重 (More weights)
                      </summary>
                      <div
                        className="cx-table-cell-style-editor__font-weight-grid"
                        role="group"
                        aria-label="Custom font weight"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '4px',
                          marginTop: '6px',
                        }}
                      >
                        {(
                          ['100', '200', '300', '400', '500', '600', '700', '800', '900'] as const
                        ).map((w) => {
                          const isActiveW = state.fontState.fontWeight === w;
                          return (
                            <button
                              key={w}
                              type="button"
                              data-cx-style-font={`weight-${w}`}
                              aria-pressed={isActiveW ? true : false}
                              className={`cx-table-cell-style-editor__font-weight-btn${
                                isActiveW
                                  ? ' cx-table-cell-style-editor__font-weight-btn--active'
                                  : ''
                              }`}
                              style={{
                                padding: '4px 0',
                                fontSize: '12px',
                                fontWeight: Number(w),
                                background: isActiveW ? '#eff6ff' : '#ffffff',
                                border: '1px solid #d9dde2',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                              onClick={() => setCellStyleFontWeight(w)}
                            >
                              {w}
                            </button>
                          );
                        })}
                      </div>
                    </details>
                    {(() => {
                      // (2026-06-01 — react port):
                      // variable-font weight single-handle range slider
                      // in 2nd <details> sibling. Verbatim mirror of
                      // vue3 single-handle inline math (Decision L.1).
                      const parsed = parseInt(state.fontState.fontWeight ?? '400', 10);
                      const currentWeight =
                        Number.isFinite(parsed) && parsed >= 1 && parsed <= 1000 ? parsed : 400;
                      const ratio = (currentWeight - 1) / 999;
                      const applyAtPos = (e: React.PointerEvent<HTMLDivElement>): void => {
                        const track = e.currentTarget;
                        const rect = track.getBoundingClientRect();
                        if (rect.width <= 0) return;
                        const r = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                        const next = Math.round(1 + r * 999);
                        setCellStyleFontWeight(String(next));
                      };
                      return (
                        <details
                          className="cx-table-cell-style-editor__font-weight-slider-details"
                          data-cx-style-font-weight-slider=""
                        >
                          <summary style={{ fontSize: '12px', cursor: 'pointer' }}>
                            自定义滑杆 (Custom slider)
                          </summary>
                          <div
                            className="cx-table-cell-style-editor__font-weight-slider"
                            role="group"
                            aria-label="Variable font weight slider"
                            style={{ marginTop: '6px' }}
                          >
                            <div
                              className="cx-table-cell-style-editor__font-weight-slider-track"
                              data-cx-style-font-weight-slider-track=""
                              style={{
                                position: 'relative',
                                width: '180px',
                                height: '8px',
                                background: '#e5e7eb',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                touchAction: 'none',
                              }}
                              onPointerDown={(e) => {
                                cellStyleFontWeightSliderDragRef.current = true;
                                try {
                                  e.currentTarget.setPointerCapture(e.pointerId);
                                } catch {
                                  /* capture optional */
                                }
                                applyAtPos(e);
                              }}
                              onPointerMove={(e) => {
                                if (!cellStyleFontWeightSliderDragRef.current) return;
                                applyAtPos(e);
                              }}
                              onPointerUp={(e) => {
                                cellStyleFontWeightSliderDragRef.current = false;
                                try {
                                  e.currentTarget.releasePointerCapture(e.pointerId);
                                } catch {
                                  /* ignore */
                                }
                              }}
                              onPointerCancel={() => {
                                cellStyleFontWeightSliderDragRef.current = false;
                              }}
                            >
                              <div
                                className="cx-table-cell-style-editor__font-weight-slider-track-fill"
                                style={{
                                  position: 'absolute',
                                  top: '0',
                                  left: '0',
                                  height: '8px',
                                  width: `${ratio * 100}%`,
                                  background: '#3b82f6',
                                  borderRadius: '4px',
                                  pointerEvents: 'none',
                                }}
                              />
                              <div
                                className="cx-table-cell-style-editor__font-weight-slider-thumb"
                                data-cx-style-font-weight-slider-thumb=""
                                style={{
                                  position: 'absolute',
                                  top: '-4px',
                                  left: `calc(${ratio * 100}% - 8px)`,
                                  width: '16px',
                                  height: '16px',
                                  background: '#ffffff',
                                  border: '2px solid #3b82f6',
                                  borderRadius: '50%',
                                  pointerEvents: 'none',
                                }}
                              />
                            </div>
                            <span
                              className="cx-table-cell-style-editor__font-weight-slider-readout"
                              data-cx-style-font-weight-slider-readout=""
                              style={{
                                fontSize: '11px',
                                color: '#374151',
                                marginTop: '4px',
                                display: 'inline-block',
                              }}
                            >
                              {String(currentWeight)}
                            </span>
                          </div>
                        </details>
                      );
                    })()}
                    <button
                      type="button"
                      data-cx-style-font="style-italic"
                      aria-pressed={state.fontState.fontStyle === 'italic' ? true : false}
                      className={`cx-table-cell-style-editor__font-btn${
                        state.fontState.fontStyle === 'italic'
                          ? ' cx-table-cell-style-editor__font-btn--active'
                          : ''
                      }`}
                      style={{
                        padding: '6px 10px',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        background: state.fontState.fontStyle === 'italic' ? '#eff6ff' : '#ffffff',
                        border: '1px solid #d9dde2',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                      onClick={toggleCellStyleFontStyle}
                    >
                      斜体 (Italic)
                    </button>
                    <div
                      className="cx-table-cell-style-editor__deco-row"
                      role="group"
                      aria-label="Text decoration"
                      style={{ display: 'flex', gap: '4px' }}
                    >
                      {(
                        [
                          { value: null, label: '无', dataValue: 'none' },
                          {
                            value: 'underline' as const,
                            label: '下划线',
                            dataValue: 'underline',
                          },
                          {
                            value: 'line-through' as const,
                            label: '删除线',
                            dataValue: 'line-through',
                          },
                        ] as const
                      ).map((opt) => {
                        const isActiveOpt = state.fontState.textDecoration === opt.value;
                        return (
                          <button
                            key={opt.dataValue}
                            type="button"
                            data-cx-style-font-deco={opt.dataValue}
                            aria-pressed={isActiveOpt ? true : false}
                            className={`cx-table-cell-style-editor__deco-btn${
                              isActiveOpt ? ' cx-table-cell-style-editor__deco-btn--active' : ''
                            }`}
                            style={{
                              flex: 1,
                              padding: '6px 4px',
                              fontSize: '12px',
                              background: isActiveOpt ? '#eff6ff' : '#ffffff',
                              border: '1px solid #d9dde2',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              textDecoration: opt.value ?? 'none',
                            }}
                            onClick={() => setCellStyleTextDecoration(opt.value)}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {state.activeTab === 'border' &&
                  (() => {
                    // + 99.2.3.2 (2026-06-01 — react port):
                    // segmented control + target-aware widgets + HSV
                    // disclosure. Verbatim mirror of vue3.
                    const borderStateLocal = state.borderState;
                    const borderTarget = borderStateLocal.borderSideTarget;
                    const borderEffectiveField = (
                      axis: 'Color' | 'Width' | 'Style',
                    ): string | null => {
                      const allField = `border${axis}` as keyof typeof borderStateLocal;
                      if (borderTarget === 'all') {
                        return borderStateLocal[allField] as string | null;
                      }
                      const cap = borderTarget.charAt(0).toUpperCase() + borderTarget.slice(1);
                      const sideField = `border${cap}${axis}` as keyof typeof borderStateLocal;
                      const sideValue = borderStateLocal[sideField] as string | null;
                      return sideValue ?? (borderStateLocal[allField] as string | null);
                    };
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
                    return (
                      <div
                        className="cx-table-cell-style-editor__border-cluster"
                        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                      >
                        <div
                          className="cx-table-cell-style-editor__border-side-row"
                          role="group"
                          aria-label="Border side target"
                          style={{ display: 'flex', gap: '4px' }}
                        >
                          {(
                            [
                              { value: 'all' as const, label: '全部' },
                              { value: 'top' as const, label: '上' },
                              { value: 'right' as const, label: '右' },
                              { value: 'bottom' as const, label: '下' },
                              { value: 'left' as const, label: '左' },
                            ] as const
                          ).map((opt) => {
                            const isActiveSide = borderTarget === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                data-cx-style-border-side={opt.value}
                                aria-pressed={isActiveSide ? true : false}
                                className={`cx-table-cell-style-editor__border-side-btn${
                                  isActiveSide
                                    ? ' cx-table-cell-style-editor__border-side-btn--active'
                                    : ''
                                }`}
                                style={{
                                  flex: 1,
                                  padding: '6px 4px',
                                  fontSize: '12px',
                                  background: isActiveSide ? '#eff6ff' : '#ffffff',
                                  border: '1px solid #d9dde2',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => setCellStyleBorderSideTarget(opt.value)}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                        <label
                          className="cx-table-cell-style-editor__border-color-row"
                          style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                        >
                          <span style={{ fontSize: '11px', width: '48px' }}>颜色</span>
                          <input
                            type="text"
                            className="cx-table-cell-style-editor__border-color-input"
                            data-cx-style-border="color"
                            value={borderEffectiveField('Color') ?? ''}
                            placeholder="#000000"
                            style={{ flex: 1, fontSize: '12px' }}
                            onChange={(e) => {
                              setCellStyleBorderColor(e.target.value);
                            }}
                          />
                        </label>
                        <details
                          className="cx-table-cell-style-editor__border-color-hsv-details"
                          data-cx-style-border-color-hsv=""
                        >
                          <summary style={{ fontSize: '12px', cursor: 'pointer' }}>
                            HSV 选色 (HSV picker)
                          </summary>
                          <div
                            className="cx-table-cell-style-editor__border-color-hsv"
                            style={{ marginTop: '6px' }}
                          >
                            <div
                              className="cx-table-cell-style-editor__square"
                              data-cx-style-border-square=""
                              style={{
                                position: 'relative',
                                width: `${SQUARE_SIZE_PX}px`,
                                height: `${SQUARE_SIZE_PX}px`,
                                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${bHueOnlyHex})`,
                                cursor: 'crosshair',
                                touchAction: 'none',
                              }}
                              onPointerDown={(e) => {
                                const sq = e.currentTarget;
                                const rect = sq.getBoundingClientRect();
                                cellStyleBorderSquareDragRef.current = true;
                                try {
                                  sq.setPointerCapture(e.pointerId);
                                } catch {
                                  /* capture not available */
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
                              }}
                              onPointerMove={(e) => {
                                if (!cellStyleBorderSquareDragRef.current) return;
                                const sq = e.currentTarget;
                                const rect = sq.getBoundingClientRect();
                                setCellStyleBorderHsv(
                                  computeHsvAtSquarePosition({
                                    positionPxX: e.clientX - rect.left,
                                    positionPxY: e.clientY - rect.top,
                                    squareWidthPx: rect.width,
                                    squareHeightPx: rect.height,
                                    currentHue: bHsv.h,
                                  }),
                                );
                              }}
                              onPointerUp={(e) => {
                                cellStyleBorderSquareDragRef.current = false;
                                try {
                                  e.currentTarget.releasePointerCapture(e.pointerId);
                                } catch {
                                  /* capture may have never been set */
                                }
                              }}
                              onPointerCancel={(e) => {
                                cellStyleBorderSquareDragRef.current = false;
                                try {
                                  e.currentTarget.releasePointerCapture(e.pointerId);
                                } catch {
                                  /* capture may have never been set */
                                }
                              }}
                            >
                              <div
                                className="cx-table-cell-style-editor__square-thumb"
                                style={{
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
                                }}
                              />
                            </div>
                            <div
                              className="cx-table-cell-style-editor__hue-strip"
                              data-cx-style-border-hue=""
                              style={{
                                position: 'relative',
                                width: `${SQUARE_SIZE_PX}px`,
                                height: `${HUE_HEIGHT_PX}px`,
                                marginTop: '6px',
                                background:
                                  'linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))',
                                cursor: 'ew-resize',
                                touchAction: 'none',
                              }}
                              onPointerDown={(e) => {
                                const strip = e.currentTarget;
                                const rect = strip.getBoundingClientRect();
                                cellStyleBorderHueDragRef.current = true;
                                try {
                                  strip.setPointerCapture(e.pointerId);
                                } catch {
                                  /* capture not available */
                                }
                                setCellStyleBorderHsv({
                                  ...bHsv,
                                  h: computeHueAtStripPosition({
                                    positionPx: e.clientX - rect.left,
                                    stripSizePx: rect.width,
                                  }),
                                });
                              }}
                              onPointerMove={(e) => {
                                if (!cellStyleBorderHueDragRef.current) return;
                                const strip = e.currentTarget;
                                const rect = strip.getBoundingClientRect();
                                setCellStyleBorderHsv({
                                  ...bHsv,
                                  h: computeHueAtStripPosition({
                                    positionPx: e.clientX - rect.left,
                                    stripSizePx: rect.width,
                                  }),
                                });
                              }}
                              onPointerUp={(e) => {
                                cellStyleBorderHueDragRef.current = false;
                                try {
                                  e.currentTarget.releasePointerCapture(e.pointerId);
                                } catch {
                                  /* capture may have never been set */
                                }
                              }}
                              onPointerCancel={(e) => {
                                cellStyleBorderHueDragRef.current = false;
                                try {
                                  e.currentTarget.releasePointerCapture(e.pointerId);
                                } catch {
                                  /* capture may have never been set */
                                }
                              }}
                            >
                              <div
                                className="cx-table-cell-style-editor__hue-thumb"
                                style={{
                                  position: 'absolute',
                                  left: `${bHuePosPx}px`,
                                  top: '-2px',
                                  width: '4px',
                                  height: `${HUE_HEIGHT_PX + 4}px`,
                                  marginLeft: '-2px',
                                  background: '#ffffff',
                                  border: '1px solid rgba(0,0,0,0.6)',
                                  pointerEvents: 'none',
                                }}
                              />
                            </div>
                            <div
                              className="cx-table-cell-style-editor__rgb-row"
                              style={{ display: 'flex', gap: '6px', marginTop: '8px' }}
                            >
                              {(['r', 'g', 'b'] as const).map((ch) => (
                                <label key={ch} className="cx-table-cell-style-editor__rgb-label">
                                  <span style={{ fontSize: '11px', marginRight: '2px' }}>
                                    {ch.toUpperCase()}
                                  </span>
                                  <input
                                    type="number"
                                    className="cx-table-cell-style-editor__rgb-input"
                                    data-cx-style-border-rgb={ch}
                                    min={0}
                                    max={255}
                                    step={1}
                                    value={String(bRgb[ch])}
                                    style={{ width: '48px', fontSize: '12px' }}
                                    onChange={(e) => {
                                      setCellStyleBorderRgbChannel(ch, Number(e.target.value));
                                    }}
                                  />
                                </label>
                              ))}
                            </div>
                          </div>
                        </details>
                        <label
                          className="cx-table-cell-style-editor__border-width-row"
                          style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                        >
                          <span style={{ fontSize: '11px', width: '48px' }}>宽度</span>
                          <input
                            type="text"
                            className="cx-table-cell-style-editor__border-width-input"
                            data-cx-style-border="width"
                            value={borderEffectiveField('Width') ?? ''}
                            placeholder="1px"
                            style={{ flex: 1, fontSize: '12px' }}
                            onChange={(e) => {
                              setCellStyleBorderWidth(e.target.value);
                            }}
                          />
                        </label>
                        <div
                          className="cx-table-cell-style-editor__border-style-row"
                          role="group"
                          aria-label="Border style"
                          style={{ display: 'flex', gap: '4px' }}
                        >
                          {(
                            [
                              { value: null, label: '无', dataValue: 'none' },
                              { value: 'solid' as const, label: '实线', dataValue: 'solid' },
                              { value: 'dashed' as const, label: '虚线', dataValue: 'dashed' },
                              { value: 'dotted' as const, label: '点线', dataValue: 'dotted' },
                            ] as const
                          ).map((opt) => {
                            const isActiveOpt = borderEffectiveField('Style') === opt.value;
                            return (
                              <button
                                key={opt.dataValue}
                                type="button"
                                data-cx-style-border-style={opt.dataValue}
                                aria-pressed={isActiveOpt ? true : false}
                                className={`cx-table-cell-style-editor__border-style-btn${
                                  isActiveOpt
                                    ? ' cx-table-cell-style-editor__border-style-btn--active'
                                    : ''
                                }`}
                                style={{
                                  flex: 1,
                                  padding: '6px 4px',
                                  fontSize: '12px',
                                  background: isActiveOpt ? '#eff6ff' : '#ffffff',
                                  border: '1px solid #d9dde2',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                }}
                                onClick={() => setCellStyleBorderStyle(opt.value)}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                        {borderTarget === 'all' && (
                          <label
                            className="cx-table-cell-style-editor__border-radius-row"
                            style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
                          >
                            <span style={{ fontSize: '11px', width: '48px' }}>圆角</span>
                            <input
                              type="text"
                              className="cx-table-cell-style-editor__border-radius-input"
                              data-cx-style-border="radius"
                              value={state.borderState.borderRadius ?? ''}
                              placeholder="0px"
                              style={{ flex: 1, fontSize: '12px' }}
                              onChange={(e) => {
                                setCellStyleBorderRadius(e.target.value);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })()}
                {state.activeTab !== 'font' && state.activeTab !== 'border' && (
                  <>
                    <div
                      className="cx-table-cell-style-editor__sv-square"
                      data-cx-style-square=""
                      style={{
                        position: 'relative',
                        width: `${SQUARE_SIZE_PX}px`,
                        height: `${SQUARE_SIZE_PX}px`,
                        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueOnlyHex})`,
                        cursor: 'crosshair',
                        touchAction: 'none',
                      }}
                      onPointerDown={(e) => {
                        const sq = e.currentTarget;
                        const rect = sq.getBoundingClientRect();
                        cellStyleSquareDragRef.current = true;
                        try {
                          sq.setPointerCapture(e.pointerId);
                        } catch {
                          /* capture not available */
                        }
                        setCellStyleEditorHsv(
                          computeHsvAtSquarePosition({
                            positionPxX: e.clientX - rect.left,
                            positionPxY: e.clientY - rect.top,
                            squareWidthPx: rect.width,
                            squareHeightPx: rect.height,
                            currentHue: state.hsv.h,
                          }),
                        );
                      }}
                      onPointerMove={(e) => {
                        if (!cellStyleSquareDragRef.current) return;
                        const sq = e.currentTarget;
                        const rect = sq.getBoundingClientRect();
                        setCellStyleEditorHsv(
                          computeHsvAtSquarePosition({
                            positionPxX: e.clientX - rect.left,
                            positionPxY: e.clientY - rect.top,
                            squareWidthPx: rect.width,
                            squareHeightPx: rect.height,
                            currentHue: state.hsv.h,
                          }),
                        );
                      }}
                      onPointerUp={(e) => {
                        cellStyleSquareDragRef.current = false;
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch {
                          /* capture may have never been set */
                        }
                      }}
                      onPointerCancel={(e) => {
                        cellStyleSquareDragRef.current = false;
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch {
                          /* capture may have never been set */
                        }
                      }}
                    >
                      <div
                        className="cx-table-cell-style-editor__sv-thumb"
                        style={{
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
                        }}
                      />
                    </div>
                    <div
                      className="cx-table-cell-style-editor__hue-strip"
                      data-cx-style-hue=""
                      style={{
                        position: 'relative',
                        width: `${SQUARE_SIZE_PX}px`,
                        height: `${HUE_HEIGHT_PX}px`,
                        marginTop: '8px',
                        background:
                          'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
                        cursor: 'pointer',
                        touchAction: 'none',
                      }}
                      onPointerDown={(e) => {
                        const strip = e.currentTarget;
                        const rect = strip.getBoundingClientRect();
                        cellStyleHueDragRef.current = true;
                        try {
                          strip.setPointerCapture(e.pointerId);
                        } catch {
                          /* capture not available */
                        }
                        setCellStyleEditorHsv({
                          ...state.hsv,
                          h: computeHueAtStripPosition({
                            positionPx: e.clientX - rect.left,
                            stripSizePx: rect.width,
                          }),
                        });
                      }}
                      onPointerMove={(e) => {
                        if (!cellStyleHueDragRef.current) return;
                        const strip = e.currentTarget;
                        const rect = strip.getBoundingClientRect();
                        setCellStyleEditorHsv({
                          ...state.hsv,
                          h: computeHueAtStripPosition({
                            positionPx: e.clientX - rect.left,
                            stripSizePx: rect.width,
                          }),
                        });
                      }}
                      onPointerUp={(e) => {
                        cellStyleHueDragRef.current = false;
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch {
                          /* capture may have never been set */
                        }
                      }}
                      onPointerCancel={(e) => {
                        cellStyleHueDragRef.current = false;
                        try {
                          e.currentTarget.releasePointerCapture(e.pointerId);
                        } catch {
                          /* capture may have never been set */
                        }
                      }}
                    >
                      <div
                        className="cx-table-cell-style-editor__hue-thumb"
                        style={{
                          position: 'absolute',
                          left: `${huePosPx}px`,
                          top: '-2px',
                          width: '4px',
                          height: `${HUE_HEIGHT_PX + 4}px`,
                          marginLeft: '-2px',
                          background: '#ffffff',
                          border: '1px solid rgba(0,0,0,0.6)',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                    <div
                      className="cx-table-cell-style-editor__rgb-row"
                      style={{ display: 'flex', gap: '6px', marginTop: '8px' }}
                    >
                      {(['r', 'g', 'b'] as const).map((ch) => (
                        <label key={ch} className="cx-table-cell-style-editor__rgb-label">
                          <span style={{ fontSize: '11px', marginRight: '2px' }}>
                            {ch.toUpperCase()}
                          </span>
                          <input
                            type="number"
                            className="cx-table-cell-style-editor__rgb-input"
                            data-cx-style-rgb={ch}
                            min={0}
                            max={255}
                            step={1}
                            value={String(rgb[ch])}
                            style={{ width: '48px', fontSize: '12px' }}
                            onChange={(e) => {
                              const raw = Number(e.target.value);
                              setCellStyleEditorRgbChannel(ch, raw);
                            }}
                          />
                        </label>
                      ))}
                    </div>
                    <div
                      className="cx-table-cell-style-editor__hex-row"
                      style={{
                        display: 'flex',
                        gap: '6px',
                        marginTop: '6px',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '11px' }}>HEX</span>
                      <input
                        type="text"
                        className="cx-table-cell-style-editor__hex-input"
                        data-cx-style-hex=""
                        value={state.hex}
                        style={{ flex: '1', fontSize: '12px' }}
                        onChange={(e) => {
                          setCellStyleEditorHex(e.target.value);
                        }}
                      />
                    </div>
                  </>
                )}
                {/* (2026-06-01 — react port) +
                    (2026-06-02 — react port): preset palette + recent
                    row. lifts the border-tab gate — palette
                    now renders for bg / text / border tabs. Hoisted
                    out of the bg/text branch so border-tab also sees
                    it. */}
                {state.activeTab !== 'font' &&
                  (() => {
                    const validPresets = (cellStylePresetColors ?? []).filter((h0) =>
                      CELL_STYLE_HEX_REGEX.test(h0),
                    );
                    return (
                      <div
                        className="cx-table-cell-style-editor__palette"
                        style={{ marginTop: '8px' }}
                      >
                        {validPresets.length > 0 && (
                          <div
                            className="cx-table-cell-style-editor__palette-row"
                            data-cx-style-palette-section="preset"
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(12, 1fr)',
                              gap: '3px',
                            }}
                          >
                            {validPresets.map((swatchHex) => (
                              <button
                                key={`preset-${swatchHex}`}
                                type="button"
                                className="cx-table-cell-style-editor__swatch"
                                data-cx-style-palette-preset={swatchHex}
                                title={swatchHex}
                                aria-label={swatchHex}
                                style={{
                                  backgroundColor: swatchHex,
                                  width: '14px',
                                  height: '14px',
                                  border: '1px solid #d1d5db',
                                  padding: '0',
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  setCellStyleEditorHex(swatchHex);
                                }}
                              />
                            ))}
                          </div>
                        )}
                        {recentCellStyleColors.length > 0 && (
                          <div
                            className="cx-table-cell-style-editor__palette-row"
                            data-cx-style-palette-section="recent"
                            style={{
                              display: 'flex',
                              gap: '3px',
                              marginTop: '4px',
                              alignItems: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontSize: '10px',
                                color: '#6b7280',
                                marginRight: '2px',
                              }}
                            >
                              近期
                            </span>
                            {recentCellStyleColors.map((swatchHex) => (
                              <button
                                key={`recent-${swatchHex}`}
                                type="button"
                                className="cx-table-cell-style-editor__swatch"
                                data-cx-style-palette-recent={swatchHex}
                                title={swatchHex}
                                aria-label={swatchHex}
                                style={{
                                  backgroundColor: swatchHex,
                                  width: '14px',
                                  height: '14px',
                                  border: '1px solid #d1d5db',
                                  padding: '0',
                                  cursor: 'pointer',
                                }}
                                onClick={() => {
                                  setCellStyleEditorHex(swatchHex);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                <div
                  className="cx-table-cell-style-editor__actions"
                  style={{
                    display: 'flex',
                    gap: '6px',
                    marginTop: '10px',
                    justifyContent: 'flex-end',
                  }}
                >
                  <button
                    type="button"
                    className="cx-table-cell-style-editor__btn"
                    data-cx-style-action="clear"
                    onClick={clearCellStyleForCurrentCell}
                  >
                    清除
                  </button>
                  <button
                    type="button"
                    className="cx-table-cell-style-editor__btn"
                    data-cx-style-action="cancel"
                    onClick={cancelCellStyleEditor}
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    className="cx-table-cell-style-editor__btn"
                    data-cx-style-action="apply"
                    onClick={applyCellStyleEditor}
                  >
                    应用
                  </button>
                </div>
              </div>
            );
          })()}
        <div className="cx-table-sr-announce" role="status" aria-live="polite" aria-atomic="true">
          {srAnnounceText}
        </div>
        {movingColumnState?.dropLineLeftPx != null && (
          <div
            className="cx-table-drop-line"
            aria-hidden="true"
            data-drop-target-col-id={movingColumnState.dropTarget?.targetColId ?? ''}
            data-drop-target-position={movingColumnState.dropTarget?.position ?? ''}
            style={dropLineStyle}
          />
        )}
        {tooltipActive != null && (
          // Intentionally no `role="tooltip"` — that role requires an
          // `aria-describedby` wiring from the triggering cell, which
          // chronix's hover-only popover does not provide. The data-*
          // attrs are sufficient for tests + consumer overrides.
          <div
            className="cx-table-tooltip"
            data-testid="cx-tooltip"
            data-row-id={tooltipActive.rowId}
            data-col-id={tooltipActive.colId}
            style={{
              position: 'absolute',
              top: `${tooltipActive.y}px`,
              left: `${tooltipActive.x}px`,
              background: 'var(--cx-table-tooltip-bg, #2a2f36)',
              color: 'var(--cx-table-tooltip-color, #ffffff)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              lineHeight: '16px',
              maxWidth: '320px',
              whiteSpace: 'pre-wrap',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {tooltipActive.text}
          </div>
        )}
        {settingsPopover}
        {columnHeaderMenuNode}
      </div>
    );

    return tableWrapper;
  },
);

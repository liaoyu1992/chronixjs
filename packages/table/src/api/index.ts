/**
 * Public API barrel.
 *
 * Phase 1 (2026-05-23): `ChronixTableTheme` + `defaultChronixTableTheme`.
 * Phase 6 (2026-05-24): `cssVarsForTheme` for CSS-var injection.
 * Phase 9.1 (2026-05-24): `parsePrefixNumberFilter` + `formatPrefixNumberFilter`.
 * Phase 10.1 (2026-05-24): `computeRangeRowIds` for shift+click range selection.
 * Phase 12.1 (2026-05-24): `coerceEditDraftValue` for editor-string → typed-value coercion.
 * Phase 12.2 (2026-05-24): `findNextEditableCell` for Tab / Shift+Tab auto-advance during in-cell editing.
 * Phase 13 (2026-05-25): `clampResizeWidth` for column-resize drag width clamping.
 * Phase 14 (2026-05-26): `computeColumnReorder` + `getColumnDropTarget` +
 *   `DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX` for column-move drag-to-reorder.
 * Subsequent phases add `TableHandle`, `hitTestFromClient`, validation
 * helpers, formatter helpers, export helpers, etc.
 */

export type { ChronixTableTheme } from './chronix-table-theme.js';
export { defaultChronixTableTheme } from './chronix-table-theme.js';
export { cssVarsForTheme } from './css-vars-for-theme.js';
export { formatPrefixNumberFilter, parsePrefixNumberFilter } from './parse-prefix-number-filter.js';
export { computeRangeRowIds } from './compute-range-row-ids.js';
export {
  computeVisiblePageNumbers,
  type VisiblePageElement,
} from './compute-visible-page-numbers.js';
export {
  coerceEditDraftValue,
  type CoerceEditDraftValueOk,
  type CoerceEditDraftValueRejected,
  type CoerceEditDraftValueResult,
} from './coerce-edit-draft-value.js';
export { runCellValidator, type RunCellValidatorArgs } from './run-cell-validator.js';
export {
  runAsyncCellValidator,
  type RunAsyncCellValidatorArgs,
} from './run-async-cell-validator.js';
export { runRowValidators, type RunRowValidatorsArgs } from './run-row-validators.js';
export {
  createLocalStorageRecentStorage,
  createMemoryRecentStorage,
  DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX,
  type TypeaheadRecentStorage,
} from './typeahead-recent-storage.js';
export {
  findNextEditableCell,
  type FindNextEditableCellResult,
} from './find-next-editable-cell.js';
export { clampResizeWidth } from './clamp-resize-width.js';
export {
  computeColumnReorder,
  DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX,
} from './compute-column-reorder.js';
export { computeRowReorder, DEFAULT_ROW_DRAG_THRESHOLD_PX } from './compute-row-reorder.js';
export {
  getColumnDropTarget,
  type ColumnDropTarget,
  type ColumnHeaderRect,
  type GetColumnDropTargetOptions,
} from './get-column-drop-target.js';
export {
  getRowDropTarget,
  type GetRowDropTargetOptions,
  type RowDropTarget,
  type RowRect,
} from './get-row-drop-target.js';
export {
  computeAutosizeWidth,
  type ComputeAutosizeWidthOptions,
} from './compute-autosize-width.js';
export {
  computeCellRangeEnvelope,
  EMPTY_CELL_RANGE_ENVELOPE,
  type CellRange,
  type CellRangeEnvelope,
  type CellRef,
} from './compute-cell-range-envelope.js';
export {
  formatCellRangeForClipboard,
  type FormatCellRangeForClipboardOptions,
} from './format-cell-range-for-clipboard.js';
export { parseClipboardTsv } from './parse-clipboard-tsv.js';
export {
  computePasteMutations,
  type PasteMutation,
  type PasteValidatorGate,
} from './compute-paste-mutations.js';
export { computeDragFillEnvelope } from './compute-drag-fill-envelope.js';
export { computeDragFillMutations } from './compute-drag-fill-mutations.js';
export { computeHeaderGroupSpans, type HeaderGroupSpan } from './compute-header-group-spans.js';
export { computeFooterValues } from './compute-footer-values.js';
export { computeNextActiveCell, type NavigationDirection } from './compute-next-active-cell.js';
export { deriveShiftArrowCellRange } from './derive-shift-arrow-cell-range.js';
export {
  findDataRegionBoundary,
  type CellValueFn,
  type DataRegionDirection,
} from './find-data-region-boundary.js';
export {
  computeScrollIntoView,
  type ScrollIntoViewInput,
  type ScrollIntoViewMargins,
  type ScrollIntoViewResult,
  type ScrollIntoViewTarget,
  type ScrollIntoViewViewport,
} from './compute-scroll-into-view.js';
export {
  computeDragAutoScrollVelocity,
  DEFAULT_DRAG_AUTO_SCROLL_MAX_VELOCITY_PX_PER_FRAME,
  DEFAULT_DRAG_AUTO_SCROLL_TRIGGER_ZONE_PX,
  type DragAutoScrollVelocityInput,
} from './compute-drag-auto-scroll-velocity.js';
export {
  appendMutationBatch,
  EMPTY_MUTATION_HISTORY,
  popRedoBatch,
  popUndoBatch,
  reverseMutationBatch,
  type MutationBatch,
  type MutationHistoryState,
} from './mutation-history.js';
export { collectDescendantRowIds } from './collect-descendant-row-ids.js';
export {
  computeRowSelectionTriState,
  type RowSelectionTriState,
} from './compute-row-selection-tristate.js';
export { resolveCellTooltip, type ResolveCellTooltipInput } from './resolve-cell-tooltip.js';
export {
  synthesizeLazyChildren,
  type SynthesizeLazyChildrenInput,
  type SynthesizeLazyChildrenResult,
} from './synthesize-lazy-children.js';
export type {
  ChildrenLoaderArgs,
  LazyChildrenState,
  LazyChildrenStatus,
} from './lazy-children-state.js';
export { exportToCsv, type ExportToCsvInput, type ExportToCsvOptions } from './export-to-csv.js';
export {
  buildXlsxSheetData,
  type BuildXlsxSheetDataInput,
  type BuildXlsxSheetDataResult,
  type ExportToXlsxFreezePane,
  type ExportToXlsxOptions,
  type XlsxCellValue,
} from './build-xlsx-sheet-data.js';
export {
  exportToXlsx,
  type ExportToXlsxInput,
  type MultiSheetExportToXlsxInput,
  type SingleSheetExportToXlsxInput,
} from './export-to-xlsx.js';
export { defaultStatusBarText, type StatusBarCounts } from './default-status-bar-text.js';
export {
  applyTableView,
  serializeTableView,
  type SerializeTableViewInput,
  type TableViewApplyResult,
  type TableViewColumnState,
  type TableViewState,
} from './saved-table-view.js';
export {
  formatActiveCellAnnouncement,
  type FormatActiveCellAnnouncementInput,
} from './format-active-cell-announcement.js';
export {
  formatColumnHeaderDescription,
  type FormatColumnHeaderDescriptionInput,
} from './format-column-header-description.js';
export { splitTextByQuickFindMatch, type TextSegment } from './split-text-by-quick-find-match.js';
export {
  parseFilterExpression,
  type ParseFilterExpressionError,
  type ParseFilterExpressionOptions,
  type ParseFilterExpressionResult,
} from './parse-filter-expression.js';
export {
  buildExpressionPredicate,
  expressionReferencesValidColumns,
  type EvaluateFilterExpressionContext,
} from './evaluate-filter-expression.js';
export {
  collectUniqueColumnValues,
  type CollectUniqueColumnValuesInput,
  type CollectUniqueColumnValuesResult,
  type ColumnUniqueValue,
} from './collect-unique-column-values.js';
export {
  computeColumnNumericExtents,
  type ColumnNumericExtents,
  type ComputeColumnNumericExtentsInput,
} from './compute-column-numeric-extents.js';
export type {
  ExportStyle,
  ExportStyleAlignment,
  ExportStyleBorder,
  ExportStyleFill,
  ExportStyleFont,
} from './export-style.js';

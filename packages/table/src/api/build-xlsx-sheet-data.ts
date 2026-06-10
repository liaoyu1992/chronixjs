import { formatCellValue, getCellValue } from '../render/format-cell-value.js';

import type { ExportStyle } from './export-style.js';
import type { ColumnSpec, RowSpec } from '../ir/index.js';

/**
 * Phase 39 (2026-05-29): discriminated union over Excel cell types.
 *
 * Maps 1:1 to exceljs's `Cell.value` shape used by the `exportToXlsx`
 * async wrapper. The discriminator (`type`) lets the wrapper switch on
 * the variant without re-running the type detection that
 * `buildXlsxSheetData` already did. `'null'` cells become empty Excel
 * cells (no `value` set on the row); `'string'` cells go through
 * Excel's string-cell path; native types (`'number'` / `'boolean'` /
 * `'date'`) preserve their Excel-native cell-type metadata so receivers
 * see numeric / boolean / date cells rather than text.
 */
export type XlsxCellValue =
  | { readonly type: 'string'; readonly value: string }
  | { readonly type: 'number'; readonly value: number }
  | { readonly type: 'boolean'; readonly value: boolean }
  | { readonly type: 'date'; readonly value: Date }
  | { readonly type: 'null'; readonly value: null };

/**
 * Phase 39.3 (2026-05-29): freeze-pane configuration. When set on a
 * sheet's `ExportToXlsxOptions.freezePane`, the async `exportToXlsx`
 * helper threads `{state:'frozen', xSplit, ySplit}` to exceljs's
 * `worksheet.views[0]` so Excel renders the configured rows + columns
 * as frozen (sticky on horizontal / vertical scroll inside Excel).
 *
 * `xSplit` = number of columns to freeze from the left edge (0 = none).
 * `ySplit` = number of rows to freeze from the top edge (0 = none).
 * Pass `{ySplit: 1}` to freeze the header row; `{xSplit: 2}` to freeze
 * the leftmost 2 columns; `{xSplit: 2, ySplit: 1}` to freeze both.
 *
 * Phase 39.3 ships explicit numeric values only (no auto-detect from
 * `ColumnSpec.pinned`) per Decision D.2 — consumers may want a
 * different freeze policy than the on-screen pinning.
 */
export interface ExportToXlsxFreezePane {
  readonly xSplit?: number;
  readonly ySplit?: number;
}

/**
 * Phase 39 (2026-05-29): options accepted by `buildXlsxSheetData` and
 * passed through to the `exportToXlsx` async wrapper. Mirrors the
 * shape of `ExportToCsvOptions` from Phase 35 where applicable, with
 * `sheetName` added as the xlsx-specific extension.
 */
export interface ExportToXlsxOptions {
  /** Sheet name for the single workbook sheet. Default `'Sheet1'`. */
  readonly sheetName?: string;

  /**
   * When `false`, omit the header row. Default `true`. Headers use the
   * column's `headerName` (falling back to `field`, then `id`) — same
   * cascade as `exportToCsv`.
   */
  readonly includeHeaders?: boolean;

  /**
   * When set, only export columns whose `id` is in this list. Order is
   * preserved per the input list (not the original column order).
   * Missing ids are silently skipped. Matches `exportToCsv`'s
   * `columnIds` semantics verbatim.
   */
  readonly columnIds?: readonly string[];

  /**
   * Phase 39.3 (2026-05-29): when set, configure exceljs's
   * `worksheet.views = [{state:'frozen', xSplit, ySplit}]` so Excel
   * renders the configured rows/columns as frozen. Unset = no freeze
   * (default — preserves Phase 39 backwards compatibility).
   */
  readonly freezePane?: ExportToXlsxFreezePane;
}

/**
 * Phase 39 (2026-05-29): input shape for `buildXlsxSheetData`.
 */
export interface BuildXlsxSheetDataInput {
  /** Rows to export. Iteration order = output row order. */
  readonly rows: readonly RowSpec[];
  /** Columns to consider. Subset selectable via `options.columnIds`. */
  readonly columns: readonly ColumnSpec[];
  /** Optional formatting / subset options. */
  readonly options?: ExportToXlsxOptions;
}

/**
 * Phase 39 (2026-05-29): result of `buildXlsxSheetData`. The async
 * `exportToXlsx` wrapper consumes this shape and emits exceljs cells
 * via `worksheet.addRow` + per-cell `type` override (when not string).
 *
 * `cells[r][c]` is the cell at body row `r`, column `c` (after the
 * `columnIds` subset filter has been applied — `c` indexes into the
 * filtered column array, NOT the input `columns` array).
 *
 * `columnWidths[c]` is the pixel width of the same column position,
 * used by the wrapper to set Excel column widths via
 * `worksheet.columns[c].width = columnWidths[c] / 7` (exceljs's width
 * unit = approx. character count of the default font at 11pt).
 */
export interface BuildXlsxSheetDataResult {
  readonly sheetName: string;
  /** Header text per column (empty array when `includeHeaders === false`). */
  readonly headers: readonly string[];
  /** Per-column pixel widths preserved from `ColumnSpec.width` (or default 100). */
  readonly columnWidths: readonly number[];
  /**
   * Phase 39.4 (2026-05-29): per-column body-cell style; entry `c` is
   * `undefined` when the column has no `exportStyle` set. The async
   * `exportToXlsx` wrapper iterates body cells and applies each non-
   * undefined style via exceljs's per-cell `cell.style` setter; header
   * row preserves Phase 39 Decision C.1 bold-row default (never reads
   * this array).
   */
  readonly columnExportStyles: readonly (ExportStyle | undefined)[];
  /** Cells[row][col] after the column-subset filter. */
  readonly cells: readonly (readonly XlsxCellValue[])[];
}

/**
 * Default Excel column width in pixels when `ColumnSpec.width` is
 * unset. Matches the long-standing chronix theme `defaultColumnWidth`
 * value (~100px ≈ 14 Excel-width-units).
 */
const DEFAULT_COLUMN_WIDTH_PX = 100;

/**
 * Phase 39 (2026-05-29): project the consumer's rows + columns into a
 * sheet-data shape ready for the async `exportToXlsx` wrapper.
 *
 * Pure function. No DOM, no I/O, no exceljs import — safe to run in
 * Node / Bun / edge runtimes / test environments without the optional
 * peer dependency installed.
 *
 * **Type-driven cell mapping** (per Decision C.1):
 *
 * - `ColumnSpec.type === 'number'` → `XlsxCellValue` of variant
 *   `'number'` when the post-`valueGetter` value is a finite number;
 *   `NaN` / `Infinity` / non-number coerce to `'null'`.
 * - `ColumnSpec.type === 'date'` → variant `'date'` when the value is
 *   a `Date` instance; string falls back to `'string'` (Excel parses
 *   ISO-8601 strings as dates anyway, but we don't promise);
 *   non-Date / non-string coerces to `'null'`.
 * - `ColumnSpec.type === 'boolean'` → variant `'boolean'` when the
 *   value is a JS boolean; other types coerce to `'null'`.
 * - default / any other `type` → variant `'string'` with text resolved
 *   via `formatCellValue` (consumer's `valueGetter` + `valueFormatter`
 *   apply; matches `exportToCsv` semantics).
 *
 * **Column subset** (per `options.columnIds`): identical to
 * `exportToCsv`'s behavior — when supplied, filter + reorder per the
 * id list; missing ids silently skipped.
 *
 * **Header row** (per `options.includeHeaders`, default `true`): uses
 * `column.headerName ?? column.field ?? column.id` — same cascade as
 * `exportToCsv` so CSV / XLSX exports are header-text-identical.
 */
export function buildXlsxSheetData(input: BuildXlsxSheetDataInput): BuildXlsxSheetDataResult {
  const { rows, columns, options } = input;
  const sheetName = options?.sheetName ?? 'Sheet1';
  const includeHeaders = options?.includeHeaders ?? true;

  // Resolve the column subset (same algorithm as exportToCsv).
  let exportedColumns: readonly ColumnSpec[];
  if (options?.columnIds != null) {
    const byId = new Map(columns.map((c) => [c.id, c]));
    const out: ColumnSpec[] = [];
    for (const id of options.columnIds) {
      const col = byId.get(id);
      if (col != null) out.push(col);
    }
    exportedColumns = out;
  } else {
    exportedColumns = columns;
  }

  const headers: string[] = includeHeaders
    ? exportedColumns.map((col) => col.headerName ?? col.field ?? col.id)
    : [];

  const columnWidths: number[] = exportedColumns.map((col) => col.width ?? DEFAULT_COLUMN_WIDTH_PX);

  // Phase 39.4 (2026-05-29): collect per-column body-cell styles in
  // the SAME order as `exportedColumns` so consumers can index by
  // column position post-subset.
  const columnExportStyles: (ExportStyle | undefined)[] = exportedColumns.map(
    (col) => col.exportStyle,
  );

  const cells: XlsxCellValue[][] = rows.map((row) =>
    exportedColumns.map((column) => projectCell(row, column)),
  );

  return {
    sheetName,
    headers,
    columnWidths,
    columnExportStyles,
    cells,
  };
}

/**
 * Resolve a single cell. Module-private. Encapsulates the type-driven
 * dispatch defined by Decision C.1.
 */
function projectCell(row: RowSpec, column: ColumnSpec): XlsxCellValue {
  // For default-typed columns, replicate exportToCsv's behavior: run
  // formatCellValue so consumer's valueGetter + valueFormatter apply.
  if (column.type !== 'number' && column.type !== 'date' && column.type !== 'boolean') {
    return { type: 'string', value: formatCellValue({ row, column }) };
  }

  // Native-type columns: bypass formatCellValue, read the raw value
  // via getCellValue so consumer's valueGetter still applies (but
  // valueFormatter does NOT — Excel renders the native type itself).
  const raw = getCellValue({ row, column });

  if (column.type === 'number') {
    return typeof raw === 'number' && Number.isFinite(raw)
      ? { type: 'number', value: raw }
      : { type: 'null', value: null };
  }

  if (column.type === 'date') {
    return raw instanceof Date && !Number.isNaN(raw.getTime())
      ? { type: 'date', value: raw }
      : { type: 'null', value: null };
  }

  // column.type === 'boolean'
  return typeof raw === 'boolean' ? { type: 'boolean', value: raw } : { type: 'null', value: null };
}

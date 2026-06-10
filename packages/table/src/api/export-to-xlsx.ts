import { buildXlsxSheetData, type ExportToXlsxOptions } from './build-xlsx-sheet-data.js';
import { mapExportStyleToExcelJs, type ExcelJsCellStyle } from './export-style.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

/**
 * Phase 39 (2026-05-29): single-sheet input shape — `{rows, columns,
 * options}`. Identical structure to `BuildXlsxSheetDataInput`; the
 * async wrapper composes `buildXlsxSheetData` then routes the
 * projected sheet data through exceljs's workbook builder.
 *
 * Phase 39.1 (2026-05-29) wraps this in the discriminated union
 * `ExportToXlsxInput` along with `MultiSheetExportToXlsxInput`. Pre-
 * existing Phase 39 callers pass this shape unchanged.
 */
export interface SingleSheetExportToXlsxInput {
  readonly rows: readonly RowSpec[];
  readonly columns: readonly ColumnSpec[];
  readonly options?: ExportToXlsxOptions;
}

/**
 * Phase 39.1 (2026-05-29): multi-sheet input shape. Carries an array
 * of single-sheet specs; each entry becomes its own worksheet in the
 * output workbook. Per-entry `options.sheetName` controls each sheet's
 * tab label.
 *
 * Discriminator: the presence of the `sheets` field. TypeScript
 * narrows `ExportToXlsxInput` to this branch via `'sheets' in input`.
 */
export interface MultiSheetExportToXlsxInput {
  readonly sheets: readonly SingleSheetExportToXlsxInput[];
}

/**
 * Phase 39 + 39.1 (2026-05-29): public input to `exportToXlsx`. Either
 * single-sheet (the original Phase 39 shape) or multi-sheet (Phase
 * 39.1 superset). Backwards-compatible — every Phase 39 caller continues
 * to type-check + behave identically.
 */
export type ExportToXlsxInput = SingleSheetExportToXlsxInput | MultiSheetExportToXlsxInput;

/**
 * Minimum shape of the `exceljs` module we depend on. Pinned to the
 * subset Phase 39 uses so we don't pull exceljs's full type surface
 * into chronix-table's public types. The actual exceljs runtime
 * matches this shape; consumers without exceljs installed see this
 * type but never instantiate it.
 */
interface ExcelJsModule {
  readonly Workbook: new () => ExcelJsWorkbook;
}

interface ExcelJsWorkbook {
  addWorksheet(name?: string): ExcelJsWorksheet;
  readonly xlsx: {
    writeBuffer(): Promise<ArrayBufferLike>;
  };
}

interface ExcelJsWorksheet {
  columns: ExcelJsColumnSpec[];
  views: ExcelJsView[];
  addRow(values: readonly (string | number | boolean | Date | null)[]): ExcelJsRow;
  getRow(rowNumber: number): ExcelJsRow;
}

interface ExcelJsCell {
  style: ExcelJsCellStyle;
}

interface ExcelJsView {
  state?: 'frozen' | 'split' | 'normal';
  xSplit?: number;
  ySplit?: number;
}

interface ExcelJsColumnSpec {
  width?: number;
}

interface ExcelJsRow {
  font?: { bold?: boolean };
  commit?(): void;
  getCell(columnNumber: number): ExcelJsCell;
}

/**
 * Conversion factor between chronix's pixel widths and exceljs's
 * column-width unit (~character count of the default 11pt font). 7
 * pixels per character is the long-standing approximation used by
 * Excel + most spreadsheet libraries.
 */
const EXCELJS_PIXELS_PER_WIDTH_UNIT = 7;

/**
 * Phase 39 (2026-05-29): generate an XLSX `ArrayBuffer` from the
 * consumer's rows + columns.
 *
 * Composes the pure `buildXlsxSheetData` helper (which does all type
 * mapping + width derivation + header projection — fully testable
 * without exceljs) with the exceljs workbook builder (dynamic-imported
 * to keep the ~800KB dependency out of consumers' default bundles).
 *
 * **Optional peer dependency**: `exceljs` is listed under
 * `peerDependencies` with `peerDependenciesMeta.exceljs.optional = true`
 * in `@chronixjs/table`'s package.json. Consumers calling
 * `exportToXlsx` MUST install it themselves (`pnpm add exceljs`).
 * Without it, this function rejects with a clear error pointing at
 * the install command.
 *
 * **Output**: `ArrayBuffer`. Adapter wrappers (`TableHandle.exportToXlsx`)
 * compose this with `new Blob([buffer], {type: '...'})` +
 * `URL.createObjectURL` + anchor-click to trigger a browser download.
 * Non-browser consumers (Node / Bun) can write the buffer to disk via
 * `fs.writeFile('out.xlsx', new Uint8Array(buffer))`.
 *
 * **Header row**: rendered with `font: { bold: true }` per Decision
 * C.1. Other per-cell styling is out of scope for v1.
 *
 * **Column widths**: each `worksheet.columns[i].width` is set to
 * `buildResult.columnWidths[i] / 7` (pixels → Excel-width-units).
 *
 * **Cell types**: native Excel types for `XlsxCellValue` variants
 * `'number'` / `'boolean'` / `'date'`; `'null'` produces empty cells;
 * `'string'` produces text cells.
 */
export async function exportToXlsx(input: ExportToXlsxInput): Promise<ArrayBuffer> {
  // Phase 39.1 (2026-05-29): dispatch on the discriminator. Single-
  // sheet branch wraps in a 1-element array so the multi-sheet loop
  // handles both cases uniformly. Caller's shape is type-narrowed by
  // TypeScript via `'sheets' in input`.
  const sheetInputs: readonly SingleSheetExportToXlsxInput[] =
    'sheets' in input ? input.sheets : [input];

  let WorkbookCtor: ExcelJsModule['Workbook'];
  try {
    // Dynamic import keeps exceljs out of the consumer's default
    // bundle. Modern bundlers (Vite / Rollup / esbuild) produce a
    // separate chunk; the chunk loads on first call to exportToXlsx.
    const mod = (await import(/* @vite-ignore */ 'exceljs')) as Record<string, unknown>;
    // exceljs publishes Workbook as either a named ESM export or via
    // the CJS-interop default object depending on bundler. Probe both
    // before failing.
    const namedWorkbook = mod['Workbook'] as ExcelJsModule['Workbook'] | undefined;
    const defaultExport = mod['default'] as { Workbook?: ExcelJsModule['Workbook'] } | undefined;
    const resolved = namedWorkbook ?? defaultExport?.Workbook;
    if (typeof resolved !== 'function') {
      throw new Error('exceljs module loaded but `Workbook` constructor was not found');
    }
    WorkbookCtor = resolved;
  } catch (cause) {
    const message =
      'exportToXlsx requires the `exceljs` package. Install it with `pnpm add exceljs` (or npm/yarn equivalent).';
    throw new Error(message, { cause });
  }

  const workbook = new WorkbookCtor();

  for (const sheetInput of sheetInputs) {
    const sheetData = buildXlsxSheetData(sheetInput);
    const worksheet = workbook.addWorksheet(sheetData.sheetName);

    // Column widths first — exceljs uses the columns array as the
    // schema spine for per-column metadata.
    worksheet.columns = sheetData.columnWidths.map((px) => ({
      width: px / EXCELJS_PIXELS_PER_WIDTH_UNIT,
    }));

    // Header row (when included). Render as plain strings; apply bold
    // via the Excel row's font shorthand.
    if (sheetData.headers.length > 0) {
      const headerRow = worksheet.addRow(sheetData.headers);
      headerRow.font = { bold: true };
    }

    // Phase 39.4 (2026-05-29): pre-compute per-column exceljs style
    // map once per sheet — body-cell style application below references
    // it by column index. Identity-stable; consumers paying for no
    // styling allocate a length-0 array (skipped via the early-return
    // inside the body loop).
    const exceljsStyleByCol: (ExcelJsCellStyle | undefined)[] = sheetData.columnExportStyles.map(
      (style) => (style != null ? mapExportStyleToExcelJs(style) : undefined),
    );
    const anyColumnStyled = exceljsStyleByCol.some((s) => s != null);

    // Header row position is 1 when included, 0 when omitted. Body
    // rows start at 1-based index `headerOffset + 1` for exceljs's
    // `worksheet.getRow(n)`.
    const headerOffset = sheetData.headers.length > 0 ? 1 : 0;

    // Body cells. Each XlsxCellValue maps to its native exceljs type.
    let bodyRowIndex = 0;
    for (const row of sheetData.cells) {
      const values = row.map((cell) => cell.value);
      worksheet.addRow(values);
      // Phase 39.4: apply per-column body-cell style. exceljs's row /
      // cell indices are 1-based, so this body row's number is
      // `headerOffset + bodyRowIndex + 1`. Skip entirely when no
      // column carries a style (fast-path; preserves Phase 39 perf).
      if (anyColumnStyled) {
        const excelRow = worksheet.getRow(headerOffset + bodyRowIndex + 1);
        for (let c = 0; c < exceljsStyleByCol.length; c += 1) {
          const style = exceljsStyleByCol[c];
          if (style != null) {
            excelRow.getCell(c + 1).style = style;
          }
        }
      }
      bodyRowIndex += 1;
    }

    // Phase 39.3 (2026-05-29): per-sheet freeze-pane. Threads through
    // to exceljs's worksheet.views array. Only fires when the consumer
    // explicitly sets options.freezePane (Decision D.1 — no
    // auto-detect from ColumnSpec.pinned).
    const freeze = sheetInput.options?.freezePane;
    if (freeze != null) {
      worksheet.views = [
        {
          state: 'frozen',
          xSplit: freeze.xSplit ?? 0,
          ySplit: freeze.ySplit ?? 0,
        },
      ];
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  // exceljs returns ArrayBufferLike; coerce to ArrayBuffer for the
  // Blob constructor in adapter wrappers.
  if (buffer instanceof ArrayBuffer) return buffer;
  // Browser builds may return Uint8Array; unwrap to its backing
  // ArrayBuffer slice. The cast through `unknown` is required because
  // ArrayBufferLike includes SharedArrayBuffer which doesn't satisfy
  // ArrayBufferView directly.
  const view = buffer as unknown as ArrayBufferView;
  const out = view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
  return out as ArrayBuffer;
}

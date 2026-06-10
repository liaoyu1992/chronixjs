import { formatCellValue } from '../render/format-cell-value.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

/**
 * Phase 35 (2026-05-28): options accepted by `exportToCsv`.
 */
export interface ExportToCsvOptions {
  /** Field separator. Default `','`. Pass `'\t'` for TSV. */
  readonly separator?: string;

  /**
   * End-of-line sequence. Default `'\r\n'` (RFC 4180). Pass `'\n'` for
   * Unix-style line endings — most modern Excel / Sheets imports accept
   * either, but `'\r\n'` is the canonical CSV form.
   */
  readonly eol?: string;

  /**
   * When `false`, omit the header row. Default `true`. Headers use the
   * column's `headerName` (falling back to `field`, then `id`).
   */
  readonly includeHeaders?: boolean;

  /**
   * When set, only export columns whose `id` is in this list. Order is
   * preserved per the input list (not the original column order). When
   * omitted, all input columns are exported in their declared order.
   */
  readonly columnIds?: readonly string[];
}

/**
 * Phase 35 (2026-05-28): input to `exportToCsv`.
 */
export interface ExportToCsvInput {
  /** Rows to export. Iteration order = output row order. */
  readonly rows: readonly RowSpec[];
  /** Columns to consider. Subset selectable via `options.columnIds`. */
  readonly columns: readonly ColumnSpec[];
  /** Optional formatting / subset options. */
  readonly options?: ExportToCsvOptions;
}

/**
 * Phase 35 (2026-05-28): RFC 4180-compliant CSV serializer.
 *
 * - Cell values are resolved via `formatCellValue({row, column})` so the
 *   exported text matches what the user sees on screen (consumer's
 *   `valueGetter` + `valueFormatter` apply).
 * - Cells containing the separator, `"`, CR, or LF are wrapped in
 *   double quotes; embedded double-quotes are doubled.
 * - Header row uses `column.headerName ?? column.field ?? column.id`.
 *
 * Pure function. No DOM. No side effects. Reusable from Node / Bun /
 * edge runtimes. Adapters wrap this with `Blob` + `URL.createObjectURL`
 * + anchor-click to trigger a browser download.
 */
export function exportToCsv(input: ExportToCsvInput): string {
  const { rows, columns, options } = input;
  const separator = options?.separator ?? ',';
  const eol = options?.eol ?? '\r\n';
  const includeHeaders = options?.includeHeaders ?? true;

  // Resolve the column subset. When `columnIds` is supplied, filter +
  // reorder the columns list to match; missing ids are silently
  // skipped (consumer can audit by comparing input.length vs output).
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

  const lines: string[] = [];

  if (includeHeaders) {
    const headerCells = exportedColumns.map((col) =>
      escapeCell(col.headerName ?? col.field ?? col.id, separator),
    );
    lines.push(headerCells.join(separator));
  }

  for (const row of rows) {
    const cells = exportedColumns.map((column) => {
      // Use formatCellValue so consumer's valueFormatter applies; the
      // exported string matches the on-screen render.
      const text = formatCellValue({ row, column });
      return escapeCell(text, separator);
    });
    lines.push(cells.join(separator));
  }

  return lines.join(eol);
}

/**
 * RFC 4180 cell-escaping helper. Module-private.
 */
function escapeCell(value: string, separator: string): string {
  const needsQuote =
    value.includes(separator) ||
    value.includes('"') ||
    value.includes('\r') ||
    value.includes('\n');
  if (!needsQuote) return value;
  return '"' + value.replaceAll('"', '""') + '"';
}

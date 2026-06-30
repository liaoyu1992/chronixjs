import { formatCellValue } from '../render/format-cell-value.js';

import type { CellRangeEnvelope } from './compute-cell-range-envelope.js';
import type { ColumnSpec } from '../ir/column-spec.js';
import type { RowSpec } from '../ir/row-spec.js';

/**
 * options for `formatCellRangeForClipboard`.
 *
 * `lineSeparator` controls how individual row strings are joined.
 * Default `'\n'` (Unix-style) — both Excel-on-Windows and
 * Sheets-on-paste accept `'\n'` and `'\r\n'` seamlessly. Consumers
 * who prefer explicit `'\r\n'` for cross-platform paste-into-
 * notepad consistency can opt in.
 */
export interface FormatCellRangeForClipboardOptions {
  readonly lineSeparator?: '\n' | '\r\n';
}

/**
 * TSV synthesis over a resolved
 * `CellRangeEnvelope`. First downstream consumer 's
 * envelope primitive.
 *
 * Walks `envelope.rowIds × envelope.colIds` in nested order, looking
 * up each row in `rows` and each column in `columns`, then resolves
 * + formats the cell value via `formatCellValue` — the SAME pipeline
 * the body render uses (`valueGetter` → `valueFormatter` →
 * `defaultFormatCellValue`). Clipboard text therefore matches what
 * the user visually sees.
 *
 * Inner row values join with `'\t'`; outer rows join with
 * `options.lineSeparator ?? '\n'`. NO trailing line separator —
 * single-cell envelope → just that one cell's formatted value, no
 * `\t` or `\n` decoration. Excel / Sheets / Notion paste-into-grid
 * heuristics rely on this minimal shape.
 *
 * Defensive: when either axis is empty (e.g. envelope returned by
 * `computeCellRangeEnvelope` after a stale-anchor `null`), the
 * function returns an empty string. Callers can `if (tsv === '')`
 * gate the actual `writeText` call.
 *
 * **Pure function.** No side effects, no DOM access, no clipboard
 * I/O — that is the adapter's job.
 */
export function formatCellRangeForClipboard(
  envelope: CellRangeEnvelope,
  rows: readonly RowSpec[],
  columns: readonly ColumnSpec[],
  options?: FormatCellRangeForClipboardOptions,
): string {
  if (envelope.rowIds.length === 0 || envelope.colIds.length === 0) {
    return '';
  }

  const lineSeparator = options?.lineSeparator ?? '\n';

  const rowById = new Map<string, RowSpec>();
  for (const row of rows) rowById.set(row.id, row);
  const columnById = new Map<string, ColumnSpec>();
  for (const column of columns) columnById.set(column.id, column);

  const lines: string[] = [];
  for (const rowId of envelope.rowIds) {
    const row = rowById.get(rowId);
    const cells: string[] = [];
    for (const colId of envelope.colIds) {
      const column = columnById.get(colId);
      if (row == null || column == null) {
        cells.push('');
        continue;
      }
      cells.push(formatCellValue({ row, column }));
    }
    lines.push(cells.join('\t'));
  }
  return lines.join(lineSeparator);
}

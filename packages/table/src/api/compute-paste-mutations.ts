import { getCellValue } from '../render/format-cell-value.js';

import { coerceEditDraftValue } from './coerce-edit-draft-value.js';

import type { CellRangeEnvelope } from './compute-cell-range-envelope.js';
import type { ColumnSpec } from '../ir/column-spec.js';
import type { EditValidationError } from '../ir/edit-validation-error.js';
import type { RowSpec } from '../ir/row-spec.js';

/**
 * optional per-cell validator gate signature
 * accepted by `computePasteMutations` + `computeDragFillMutations`.
 * Receives the post-coerce typed value plus the row context; non-null
 * return → cell is silently SKIPPED from the mutations (parallels
 * the coerce-reject skip Decision C.1).
 *
 * Adapter wires this to `runCellValidator` when `pasteValidatorPolicy`
 * is `'skip-rejected'`; passes `undefined` for `'allow-invalid'`.
 */
export type PasteValidatorGate = (
  column: ColumnSpec,
  value: unknown,
  row: RowSpec,
) => EditValidationError | null;

/**
 * mutation entry produced by
 * `computePasteMutations`. Mirrors `CellValueChangePayload`'s shape
 * (rowId / colId / oldValue / newValue) so consumers can reuse their
 * write-back code for paste batches.
 */
export interface PasteMutation {
  readonly rowId: string;
  readonly colId: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}

/**
 * map a parsed clipboard TSV grid against an active
 * cell-range envelope into a write-ready list of mutations.
 *
 * **Semantics** (Decision A.1):
 *
 * - **1×1 paste → fill-all**: a single-cell clipboard fills every
 *   cell of the envelope. Excel / Sheets / Notion convention.
 * - **Otherwise → clamp-overflow**: walks
 *   `min(M_paste, M_envelope) × min(N_paste, N_envelope)` cells.
 *   Paste cells beyond the envelope are silently dropped. Envelope
 *   cells beyond the paste are left untouched (no clear-to-empty).
 * - **No auto-extension**: paste NEVER grows the envelope.
 *
 * **Coercion** (Decision C.1): every cell routes through
 * `coerceEditDraftValue(column, rawString)` — number columns coerce
 * via `Number(...)` (empty → null; non-numeric → reject). Rejected
 * cells are silently SKIPPED from the mutations array (Excel
 * convention; matches reject-and-keep semantic).
 *
 * **No-op dedup** (matches `cell-value-change` rule): if
 * the coerced `newValue` === current `oldValue` (read via
 * `getCellValue` — post-`valueGetter`, pre-`valueFormatter`), the
 * cell is excluded from the mutations array. Consumers therefore
 * receive an array that contains ONLY cells that actually change.
 *
 * **Pure function.** No DOM, no clipboard I/O. Adapter calls
 * `navigator.clipboard.readText()` → `parseClipboardTsv(text)` →
 * `computePasteMutations(envelope, grid, rows, columns)`.
 */
export function computePasteMutations(
  envelope: CellRangeEnvelope,
  parsedGrid: readonly (readonly string[])[],
  rows: readonly RowSpec[],
  columns: readonly ColumnSpec[],
  /**
   * optional validator gate. When provided,
   * each coerced cell value is passed through `runValidator(column,
   * value, row)`; non-null return → cell is silently SKIPPED (same
   * shape as coerce-reject skip). Defaults to `undefined` → legacy
   * behavior preserved (validator gate is opt-in).
   */
  runValidator?: PasteValidatorGate,
): readonly PasteMutation[] {
  if (envelope.rowIds.length === 0 || envelope.colIds.length === 0) return [];
  if (parsedGrid.length === 0) return [];
  // Defensive: drop rows whose width is 0 (no cells to use).
  const firstRow = parsedGrid[0]!;
  if (firstRow.length === 0) return [];

  const rowsById = new Map<string, RowSpec>();
  for (const row of rows) rowsById.set(row.id, row);
  const columnsById = new Map<string, ColumnSpec>();
  for (const column of columns) columnsById.set(column.id, column);

  // 1×1 fill-all detection (Decision A.1, special case 1).
  const fillAll = parsedGrid.length === 1 && firstRow.length === 1;
  const fillValue = fillAll ? firstRow[0]! : null;

  const mutations: PasteMutation[] = [];

  for (let rIdx = 0; rIdx < envelope.rowIds.length; rIdx++) {
    const rowId = envelope.rowIds[rIdx]!;
    const row = rowsById.get(rowId);
    if (row == null) continue;
    for (let cIdx = 0; cIdx < envelope.colIds.length; cIdx++) {
      const colId = envelope.colIds[cIdx]!;
      const column = columnsById.get(colId);
      if (column == null) continue;

      let rawString: string;
      if (fillAll) {
        rawString = fillValue!;
      } else {
        const pasteRow = parsedGrid[rIdx];
        if (pasteRow == null) continue; // envelope taller than paste → drop.
        const pasteCell = pasteRow[cIdx];
        if (pasteCell == null) continue; // envelope wider than this paste row → drop.
        rawString = pasteCell;
      }

      const coerced = coerceEditDraftValue(column, rawString);
      if (!coerced.ok) continue; // Decision C.1: silently skip rejected cells.

      // validator-gate skip parallels coerce-reject skip.
      if (runValidator != null) {
        const validationError = runValidator(column, coerced.value, row);
        if (validationError != null) continue;
      }

      const oldValue = getCellValue({ row, column });
      if (Object.is(coerced.value, oldValue)) continue; // no-op dedup.

      mutations.push({
        rowId,
        colId,
        oldValue,
        newValue: coerced.value,
      });
    }
  }

  return mutations;
}

import { getCellValue } from '../render/format-cell-value.js';

import { coerceEditDraftValue } from './coerce-edit-draft-value.js';

import type { CellRangeEnvelope } from './compute-cell-range-envelope.js';
import type { PasteMutation, PasteValidatorGate } from './compute-paste-mutations.js';
import type { ColumnSpec } from '../ir/column-spec.js';
import type { RowSpec } from '../ir/row-spec.js';

/**
 * map a drag-fill source envelope's values into
 * the fill envelope's extension cells, producing a write-ready list of
 * mutations.
 *
 * **Constant-fill rule (Decision B.1)**: for each cell in
 * `fill \ source` (i.e., cells in the fill envelope NOT also in the
 * source envelope), copy the source-cell value by modulo:
 *
 * - `sourceRowIdx = (newRowIdx_in_fill - firstSourceRowIdx_in_fill) % source.rowIds.length`
 * - `sourceColIdx = (newColIdx_in_fill - firstSourceColIdx_in_fill) % source.colIds.length`
 *
 * Per axis-lock (Decision A.1 in `computeDragFillEnvelope`), the fill
 * envelope extends along exactly ONE axis from the source: either
 * `fill.rowIds ⊃ source.rowIds` (vertical extension) or `fill.colIds ⊃
 * source.colIds` (horizontal extension). The modulo above degrades
 * gracefully for either case: e.g., a 2-row source extended down to 4
 * new rows yields `r3 ← r1, r4 ← r2, r5 ← r1, r6 ← r2`.
 *
 * **Coercion (per-cell)**: every fill cell's resolved source value is
 * passed through `coerceEditDraftValue(targetColumn, sourceValue)`. For
 * the common in-column fill-down case, this is a passthrough (number-
 * typed source value → number-typed mutation). For cross-column fills
 * (fill-right beyond source.colIds), the target column's type takes
 * precedence; coercion-rejected cells (e.g., text source into number
 * column where coerce fails) are silently SKIPPED from the mutations
 * array — same reject-and-skip semantic.
 *
 * **No-op dedup**: if the resolved fill value === current cell value
 * (via `Object.is` for NaN-safety), the cell is excluded from the
 * mutations array. Consumers therefore receive an array containing
 * ONLY cells that actually change.
 *
 * **Source cells excluded**: cells in `source ∩ fill` (i.e., the
 * source envelope itself) are NEVER emitted as mutations. Drag-fill is
 * an EXTENSION gesture; the source range stays put.
 *
 * **Pure function.** No DOM, no clipboard I/O.
 */
export function computeDragFillMutations(
  source: CellRangeEnvelope,
  fill: CellRangeEnvelope,
  rows: readonly RowSpec[],
  columns: readonly ColumnSpec[],
  /**
   * optional validator gate. When provided,
   * each coerced cell value is passed through `runValidator(column,
   * value, row)`; non-null return → cell is silently SKIPPED. Same
   * shape as `computePasteMutations`. Defaults to `undefined`.
   */
  runValidator?: PasteValidatorGate,
): readonly PasteMutation[] {
  if (source.rowIds.length === 0 || source.colIds.length === 0) return [];
  if (fill.rowIds.length === 0 || fill.colIds.length === 0) return [];

  // Build maps for O(1) row/column lookup.
  const rowsById = new Map<string, RowSpec>();
  for (const row of rows) rowsById.set(row.id, row);
  const columnsById = new Map<string, ColumnSpec>();
  for (const column of columns) columnsById.set(column.id, column);

  // Locate source within fill so the modulo indices wrap correctly.
  // Per Decision A.1 axis-lock, source is always anchored at fill's
  // top-left corner (vertical extension keeps colIds; horizontal
  // extension keeps rowIds — in both cases source occupies the leading
  // slice of the fill axis).
  const firstSourceRowIdInFill = source.rowIds[0]!;
  const firstSourceColIdInFill = source.colIds[0]!;
  const firstSourceRowIdxInFill = fill.rowIds.indexOf(firstSourceRowIdInFill);
  const firstSourceColIdxInFill = fill.colIds.indexOf(firstSourceColIdInFill);
  if (firstSourceRowIdxInFill < 0 || firstSourceColIdxInFill < 0) return [];

  const sourceRowSet = new Set(source.rowIds);
  const sourceColSet = new Set(source.colIds);

  const mutations: PasteMutation[] = [];

  for (let rIdx = 0; rIdx < fill.rowIds.length; rIdx++) {
    const fillRowId = fill.rowIds[rIdx]!;
    const targetRow = rowsById.get(fillRowId);
    if (targetRow == null) continue;

    for (let cIdx = 0; cIdx < fill.colIds.length; cIdx++) {
      const fillColId = fill.colIds[cIdx]!;
      // Skip cells in source ∩ fill (the source rectangle itself).
      if (sourceRowSet.has(fillRowId) && sourceColSet.has(fillColId)) continue;

      const targetColumn = columnsById.get(fillColId);
      if (targetColumn == null) continue;

      // Locate the source cell by modulo. The wrap is anchored at the
      // source's position INSIDE the fill envelope (always 0 in
      // practice given axis-lock, but explicit subtraction keeps the
      // helper correct under any future 2D-fill variant).
      const sourceRowOffset = rIdx - firstSourceRowIdxInFill;
      const sourceColOffset = cIdx - firstSourceColIdxInFill;
      const sourceRowIdx =
        ((sourceRowOffset % source.rowIds.length) + source.rowIds.length) % source.rowIds.length;
      const sourceColIdx =
        ((sourceColOffset % source.colIds.length) + source.colIds.length) % source.colIds.length;

      const sourceRowId = source.rowIds[sourceRowIdx]!;
      const sourceColId = source.colIds[sourceColIdx]!;
      const sourceRow = rowsById.get(sourceRowId);
      const sourceColumn = columnsById.get(sourceColId);
      if (sourceRow == null || sourceColumn == null) continue;

      const sourceValue = getCellValue({ row: sourceRow, column: sourceColumn });

      // Coerce through the TARGET column's type. For the common fill-
      // down within the same column the target type equals the source
      // type → passthrough. For cross-column fills the target's type
      // takes precedence; rejections silently skip (Decision B.1
      // fallthrough — mirrors Decision C.1).
      const coerced = coerceEditDraftValue(targetColumn, sourceValue);
      if (!coerced.ok) continue;

      // validator-gate skip parallels coerce-reject skip.
      if (runValidator != null) {
        const validationError = runValidator(targetColumn, coerced.value, targetRow);
        if (validationError != null) continue;
      }

      const oldValue = getCellValue({ row: targetRow, column: targetColumn });
      if (Object.is(coerced.value, oldValue)) continue;

      mutations.push({
        rowId: fillRowId,
        colId: fillColId,
        oldValue,
        newValue: coerced.value,
      });
    }
  }

  return mutations;
}

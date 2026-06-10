import type { ColumnSpec } from '../ir/index.js';

/**
 * Phase 12.2 (2026-05-24): result shape for `findNextEditableCell`.
 * `null` (from the parent return type) signals "no further editable
 * cell exists in the requested direction" — the consumer adapter
 * uses this to close the editor at the table boundary (Decision A.1).
 */
export interface FindNextEditableCellResult {
  readonly rowId: string;
  readonly colId: string;
}

/**
 * Phase 12.2: pure traversal helper for Tab / Shift+Tab auto-advance
 * during in-cell editing. Used by the vue3 adapter (and future vue2 /
 * react ports) to compute "the next editable cell in display order"
 * after a commit.
 *
 * Algorithm (forward):
 *
 * 1. Locate `currentColIdx` / `currentRowIdx`. Either being `< 0`
 *    returns `null` (defensive — current cell isn't in the displayed
 *    window, which can happen after sort/filter changes mid-edit).
 * 2. Scan `columns` rightward from `currentColIdx + 1`: return the
 *    first column where `editable === true && hide !== true`, paired
 *    with `currentRowId`.
 * 3. If the current row has no further editable column, scan
 *    `displayedRowIds` downward from `currentRowIdx + 1`: for each
 *    row, scan columns left-to-right and return the first editable
 *    visible match paired with that row's id. (Decision B.1 — row
 *    exhaustion skips to next row's FIRST editable column, matches
 *    Excel + Sheets + AG-Grid Tab traversal as the cross-row reading
 *    order.)
 * 4. Otherwise return `null` (end of table per Decision A.1 — close
 *    editor instead of wrapping).
 *
 * Backward (`Shift+Tab`): symmetric — scans columns leftward then
 * previous rows right-to-left, exhausts to `null` at the top of the
 * table.
 *
 * Pure function. No DOM. No side effects. Skips `hide: true` columns
 * so the helper composes with the column-hide feature without
 * special-casing.
 */
export function findNextEditableCell(
  currentRowId: string,
  currentColId: string,
  displayedRowIds: readonly string[],
  columns: readonly ColumnSpec[],
  direction: 'forward' | 'backward',
): FindNextEditableCellResult | null {
  if (columns.length === 0 || displayedRowIds.length === 0) return null;

  const currentColIdx = columns.findIndex((c) => c.id === currentColId);
  const currentRowIdx = displayedRowIds.indexOf(currentRowId);
  if (currentColIdx < 0 || currentRowIdx < 0) return null;

  const isEditableVisible = (col: ColumnSpec): boolean =>
    col.editable === true && col.hide !== true;

  if (direction === 'forward') {
    for (let c = currentColIdx + 1; c < columns.length; c++) {
      const col = columns[c]!;
      if (isEditableVisible(col)) return { rowId: currentRowId, colId: col.id };
    }
    for (let r = currentRowIdx + 1; r < displayedRowIds.length; r++) {
      const nextRowId = displayedRowIds[r]!;
      for (const col of columns) {
        if (isEditableVisible(col)) return { rowId: nextRowId, colId: col.id };
      }
    }
    return null;
  }

  // backward
  for (let c = currentColIdx - 1; c >= 0; c--) {
    const col = columns[c]!;
    if (isEditableVisible(col)) return { rowId: currentRowId, colId: col.id };
  }
  for (let r = currentRowIdx - 1; r >= 0; r--) {
    const prevRowId = displayedRowIds[r]!;
    for (let c = columns.length - 1; c >= 0; c--) {
      const col = columns[c]!;
      if (isEditableVisible(col)) return { rowId: prevRowId, colId: col.id };
    }
  }
  return null;
}

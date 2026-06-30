import type { CellRef } from './compute-cell-range-envelope.js';
import type { ColumnSpec } from '../ir/index.js';

/**
 * Direction subset of `NavigationDirection` — only
 * supports the 4 arrow directions. Home / End / PageUp / PageDown have
 * their own corner-jump semantics that aren't data-region-aware.
 */
export type DataRegionDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Caller-supplied value resolver. Called once per scanned cell. Adapters
 * pass `(rowId, colId) => getCellValue({row, column})` where row +
 * column are resolved from chronix's data sources. Keeping the helper
 * decoupled from chronix's render layer lets the algorithm stay pure.
 */
export type CellValueFn = (rowId: string, colId: string) => unknown;

function isEmptyCell(value: unknown): boolean {
  return value == null || value === '';
}

/**
 * pure boundary-scanning helper for Excel-style
 * Ctrl+Arrow / Ctrl+Shift+Arrow data-region navigation.
 *
 * **Empty detection** (Decision A.1): a cell is empty iff its value is
 * `null`, `undefined`, or `''`. `0` / `false` / whitespace-only strings
 * are NON-empty (matches Excel exactly).
 *
 * **Algorithm** (Decision B.1):
 * - Starting cell **non-empty**: walk one step in `direction`. If the
 *   next cell is empty (or out of bounds), boundary = starting cell
 *   (no movement — the starting cell is the last filled cell already).
 *   Else continue walking, stop at the LAST non-empty cell BEFORE
 *   encountering an empty cell or the table edge.
 * - Starting cell **empty**: walk one step in `direction`. If the next
 *   cell is non-empty, boundary = that next cell. Else continue walking,
 *   stop at the FIRST non-empty cell encountered, OR the table edge if
 *   no non-empty cell exists in that direction.
 *
 * **Edge cases**:
 * - Empty `displayedRowIds` or `visibleColumns` → starting cell returned
 *   unchanged.
 * - Starting cell not in displayed rows / visible columns → starting
 *   cell returned unchanged (caller should re-establish focus first).
 * - Out-of-bounds first step → starting cell returned unchanged.
 *
 * Pure function. No DOM. No side effects.
 *
 * chronix-NEW (original grids couple data-region scanning to internal
 * `DataRegionScanner` / `NavigationFinder` classes that combine the
 * algorithm + DOM updates; the pure-function shape with a caller-
 * supplied `cellValueFn` is chronix's own posture, matching the Phase
 * 26 / 27 / 28 precedents).
 */
export function findDataRegionBoundary(
  currentRowId: string,
  currentColId: string,
  direction: DataRegionDirection,
  displayedRowIds: readonly string[],
  visibleColumns: readonly ColumnSpec[],
  cellValueFn: CellValueFn,
): CellRef {
  const starting: CellRef = { rowId: currentRowId, colId: currentColId };
  if (displayedRowIds.length === 0 || visibleColumns.length === 0) return starting;

  const rowIdx = displayedRowIds.indexOf(currentRowId);
  const colIdx = visibleColumns.findIndex((c) => c.id === currentColId);
  if (rowIdx < 0 || colIdx < 0) return starting;

  const verticalStep = direction === 'down' ? 1 : direction === 'up' ? -1 : 0;
  const horizontalStep = direction === 'right' ? 1 : direction === 'left' ? -1 : 0;

  function cellAt(rIdx: number, cIdx: number): { ref: CellRef; empty: boolean } | null {
    if (rIdx < 0 || rIdx >= displayedRowIds.length) return null;
    if (cIdx < 0 || cIdx >= visibleColumns.length) return null;
    const rowId = displayedRowIds[rIdx]!;
    const colId = visibleColumns[cIdx]!.id;
    return { ref: { rowId, colId }, empty: isEmptyCell(cellValueFn(rowId, colId)) };
  }

  const startingCellState = cellAt(rowIdx, colIdx);
  if (startingCellState == null) return starting;
  const startingEmpty = startingCellState.empty;

  let curR = rowIdx + verticalStep;
  let curC = colIdx + horizontalStep;
  const first = cellAt(curR, curC);
  if (first == null) {
    // Already at table edge; no movement.
    return starting;
  }

  if (!startingEmpty) {
    // Non-empty start: find LAST non-empty cell before empty / edge.
    if (first.empty) {
      // Immediate next is empty → no movement; current cell IS the last
      // filled in this direction.
      return starting;
    }
    // Walk while non-empty. Track the last non-empty cell seen.
    let lastFilled = first.ref;
    while (true) {
      curR += verticalStep;
      curC += horizontalStep;
      const cell = cellAt(curR, curC);
      if (cell == null) {
        // Hit table edge while walking through filled cells.
        return lastFilled;
      }
      if (cell.empty) {
        // Found the empty break — boundary is the last filled cell.
        return lastFilled;
      }
      lastFilled = cell.ref;
    }
  } else {
    // Empty start: find FIRST non-empty cell.
    if (!first.empty) {
      return first.ref;
    }
    while (true) {
      curR += verticalStep;
      curC += horizontalStep;
      const cell = cellAt(curR, curC);
      if (cell == null) {
        // Hit table edge with no non-empty cell found; boundary = LAST
        // cell in the direction (table edge).
        const edgeR = verticalStep > 0 ? displayedRowIds.length - 1 : verticalStep < 0 ? 0 : rowIdx;
        const edgeC =
          horizontalStep > 0 ? visibleColumns.length - 1 : horizontalStep < 0 ? 0 : colIdx;
        return { rowId: displayedRowIds[edgeR]!, colId: visibleColumns[edgeC]!.id };
      }
      if (!cell.empty) {
        return cell.ref;
      }
    }
  }
}

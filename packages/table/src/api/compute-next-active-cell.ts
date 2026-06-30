import type { CellRef } from './compute-cell-range-envelope.js';
import type { ColumnSpec } from '../ir/index.js';

/**
 * the 10 supported navigation directions for
 * keyboard-driven active-cell motion. `up` / `down` / `left` / `right`
 * are single-cell moves; `home` / `end` jump to first / last column in
 * the current row; `page-up` / `page-down` jump by `pageRowCount` rows
 * (clamped to the table); `table-start` / `table-end` jump to the
 * top-left / bottom-right cell respectively (Ctrl+Home / Ctrl+End in
 * the spreadsheet convention).
 */
export type NavigationDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'home'
  | 'end'
  | 'page-up'
  | 'page-down'
  | 'table-start'
  | 'table-end';

/**
 * pure traversal helper for keyboard-driven
 * cell-level navigation. Computes the next active cell given the
 * current focus + a direction. Walks ALL visible cells (in contrast
 * 's `findNextEditableCell` which skips non-editable).
 *
 * **Edge behavior** (Decision C.1): pressing a direction key that
 * would move past the table boundary returns `null` (the adapter
 * interprets `null` as a no-op + no emit). Excel / Sheets / Numbers
 * convention. Wrap-around is rejected.
 *
 * **Initial focus** (Decision A.1): when `currentRowId` and
 * `currentColId` are both `null` (no active cell yet), ANY direction
 * returns the first row + first column. This lets a single Arrow Down
 * keypress establish initial focus when the user keyboard-enters the
 * body without first clicking.
 *
 * **`pageRowCount`** is the number of rows currently visible in the
 * body viewport (the adapter computes `Math.max(1, Math.floor(
 * bodyClientHeight / rowHeight))` and passes it). `page-down` jumps
 * `currentRowIdx + pageRowCount`, clamped to the last row;
 * `page-up` jumps `currentRowIdx - pageRowCount`, clamped to 0.
 *
 * **Caller pre-filters `hide: true` columns**: `visibleColumns` is the
 * already-filtered list (the adapter's `visibleColumns` ref / state).
 * The helper does NOT re-filter — it assumes every entry in
 * `visibleColumns` is currently rendered.
 *
 * Pure function. No DOM. No side effects.
 *
 * chronix-NEW (no original grid exposes a comparable adapter-agnostic
 * pure helper; comparable grids couple keyboard navigation to internal
 * CellNavigationService classes that combine the algorithm + DOM focus
 * management).
 */
export function computeNextActiveCell(
  currentRowId: string | null,
  currentColId: string | null,
  displayedRowIds: readonly string[],
  visibleColumns: readonly ColumnSpec[],
  direction: NavigationDirection,
  pageRowCount: number,
): CellRef | null {
  if (displayedRowIds.length === 0 || visibleColumns.length === 0) return null;

  const firstRowId = displayedRowIds[0]!;
  const lastRowId = displayedRowIds[displayedRowIds.length - 1]!;
  const firstColId = visibleColumns[0]!.id;
  const lastColId = visibleColumns[visibleColumns.length - 1]!.id;

  // Initial-focus shortcut: when no active cell is set, ANY direction
  // (excluding the rejected wrap branches) snaps to the top-left so a
  // single keystroke establishes focus.
  if (currentRowId == null || currentColId == null) {
    return { rowId: firstRowId, colId: firstColId };
  }

  const currentRowIdx = displayedRowIds.indexOf(currentRowId);
  const currentColIdx = visibleColumns.findIndex((c) => c.id === currentColId);
  if (currentRowIdx < 0 || currentColIdx < 0) {
    // Current cell no longer in the displayed window (filter / sort
    // mid-navigation). Reset to top-left.
    return { rowId: firstRowId, colId: firstColId };
  }

  const safePageRowCount = Math.max(1, Math.floor(pageRowCount));

  switch (direction) {
    case 'left': {
      if (currentColIdx === 0) return null;
      return { rowId: currentRowId, colId: visibleColumns[currentColIdx - 1]!.id };
    }
    case 'right': {
      if (currentColIdx === visibleColumns.length - 1) return null;
      return { rowId: currentRowId, colId: visibleColumns[currentColIdx + 1]!.id };
    }
    case 'up': {
      if (currentRowIdx === 0) return null;
      return { rowId: displayedRowIds[currentRowIdx - 1]!, colId: currentColId };
    }
    case 'down': {
      if (currentRowIdx === displayedRowIds.length - 1) return null;
      return { rowId: displayedRowIds[currentRowIdx + 1]!, colId: currentColId };
    }
    case 'home': {
      if (currentColIdx === 0) return null;
      return { rowId: currentRowId, colId: firstColId };
    }
    case 'end': {
      if (currentColIdx === visibleColumns.length - 1) return null;
      return { rowId: currentRowId, colId: lastColId };
    }
    case 'page-up': {
      if (currentRowIdx === 0) return null;
      const targetIdx = Math.max(0, currentRowIdx - safePageRowCount);
      return { rowId: displayedRowIds[targetIdx]!, colId: currentColId };
    }
    case 'page-down': {
      if (currentRowIdx === displayedRowIds.length - 1) return null;
      const targetIdx = Math.min(displayedRowIds.length - 1, currentRowIdx + safePageRowCount);
      return { rowId: displayedRowIds[targetIdx]!, colId: currentColId };
    }
    case 'table-start': {
      if (currentRowIdx === 0 && currentColIdx === 0) return null;
      return { rowId: firstRowId, colId: firstColId };
    }
    case 'table-end': {
      if (
        currentRowIdx === displayedRowIds.length - 1 &&
        currentColIdx === visibleColumns.length - 1
      ) {
        return null;
      }
      return { rowId: lastRowId, colId: lastColId };
    }
  }
}

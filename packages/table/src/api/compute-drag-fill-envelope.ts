import { EMPTY_CELL_RANGE_ENVELOPE } from './compute-cell-range-envelope.js';

import type { CellRangeEnvelope, CellRef } from './compute-cell-range-envelope.js';

/**
 * extend a source cell-range envelope along ONE
 * axis (axis-locked per Decision A.1) to include the cell under the
 * drag-fill pointer.
 *
 * **Axis-lock rule (Decision A.1)**:
 *
 * 1. Compute `deltaRow = pointerRowIdx - source.lastRowIdx` and
 *    `deltaCol = pointerColIdx - source.lastColIdx` against display order.
 * 2. If `deltaRow <= 0 && deltaCol <= 0` (pointer inside source or
 *    above-left), return the source unchanged — no preview.
 * 3. Otherwise, snap to the dominant axis:
 *    - `Math.abs(deltaRow) >= Math.abs(deltaCol) && deltaRow > 0` →
 *      extend **vertically**: `rowIds = displayedRowIds[firstSourceRowIdx..pointerRowIdx]`,
 *      `colIds = source.colIds`.
 *    - Otherwise (deltaCol > 0 dominant) → extend **horizontally**:
 *      `rowIds = source.rowIds`,
 *      `colIds = displayedColIds[firstSourceColIdx..pointerColIdx]`.
 *
 * Stateless: the chosen axis is purely a function of the current pointer
 * position relative to the source's bottom-right anchor. Matches Excel /
 * Sheets / Numbers drag-fill convention.
 *
 * **Defensive**: if the source envelope is empty, OR pointer's rowId
 * or colId is missing from the displayed grid (e.g., pointer dropped
 * outside the table), return the source unchanged. Caller treats the
 * "envelope did not change" case as no-op preview.
 *
 * Pure function. No side effects.
 */
export function computeDragFillEnvelope(
  source: CellRangeEnvelope,
  pointer: CellRef,
  displayedRowIds: readonly string[],
  displayedColIds: readonly string[],
): CellRangeEnvelope {
  if (source.rowIds.length === 0 || source.colIds.length === 0) {
    return EMPTY_CELL_RANGE_ENVELOPE;
  }

  // Locate source's bottom-right anchor in displayed order.
  const firstSourceRowId = source.rowIds[0]!;
  const lastSourceRowId = source.rowIds[source.rowIds.length - 1]!;
  const firstSourceColId = source.colIds[0]!;
  const lastSourceColId = source.colIds[source.colIds.length - 1]!;

  const firstSourceRowIdx = displayedRowIds.indexOf(firstSourceRowId);
  const lastSourceRowIdx = displayedRowIds.indexOf(lastSourceRowId);
  const firstSourceColIdx = displayedColIds.indexOf(firstSourceColId);
  const lastSourceColIdx = displayedColIds.indexOf(lastSourceColId);
  if (
    firstSourceRowIdx < 0 ||
    lastSourceRowIdx < 0 ||
    firstSourceColIdx < 0 ||
    lastSourceColIdx < 0
  ) {
    return source;
  }

  const pointerRowIdx = displayedRowIds.indexOf(pointer.rowId);
  const pointerColIdx = displayedColIds.indexOf(pointer.colId);
  if (pointerRowIdx < 0 || pointerColIdx < 0) {
    return source;
  }

  const deltaRow = pointerRowIdx - lastSourceRowIdx;
  const deltaCol = pointerColIdx - lastSourceColIdx;

  // Decision A.1 short-circuit: no-fill preview when pointer is inside
  // or above-left of source. (Drag-fill extends only down or right.)
  if (deltaRow <= 0 && deltaCol <= 0) {
    return source;
  }

  // Axis-lock: dominant delta wins; row-delta wins ties (matches Excel's
  // bias when the pointer sits exactly on the diagonal).
  if (Math.abs(deltaRow) >= Math.abs(deltaCol) && deltaRow > 0) {
    return {
      rowIds: displayedRowIds.slice(firstSourceRowIdx, pointerRowIdx + 1),
      colIds: source.colIds,
    };
  }

  // Horizontal branch: deltaCol must be > 0 here (the above-left case
  // is filtered above and the vertical branch handles deltaRow > 0
  // ties).
  if (deltaCol > 0) {
    return {
      rowIds: source.rowIds,
      colIds: displayedColIds.slice(firstSourceColIdx, pointerColIdx + 1),
    };
  }

  return source;
}

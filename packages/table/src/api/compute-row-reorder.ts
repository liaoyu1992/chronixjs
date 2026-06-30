import type { RowSpec } from '../ir/index.js';

/**
 * pixel-distance threshold used by the
 * chronix-table adapters to discriminate a tap / cell-click from a
 * row-drag-reorder gesture on the dedicated drag-handle column. On
 * `pointerdown` on a grip cell the adapter records
 * `(startClientX, startClientY)`; the session is promoted to an active
 * drag once the pointer travels this many pixels (Chebyshev distance)
 * from the origin. Below the threshold, the gesture is treated as a
 * click on the grip (which is a silent no-op — the grip cell has no
 * other affordance).
 *
 * 5px matches the convention established column-move +
 * common drag handles across modern data-grid libraries. Not exposed
 * as a theme token at a future phase can promote it if real
 * consumer demand surfaces.
 */
export const DEFAULT_ROW_DRAG_THRESHOLD_PX = 5;

/**
 * pure reorder of a `readonly RowSpec[]`. Moves
 * the row identified by `movedRowId` so it appears `position` (= `'above'
 * | 'below'`) the row identified by `targetRowId`. Returns a NEW array
 * preserving the rest of the row order; row object references for
 * non-moved rows are preserved identity-stable (the helper does NOT
 * clone).
 *
 * Mirrors `computeColumnReorder` on the Y-axis. Used by the
 * chronix-table adapters inside the consumer's `row-order-change`
 * handler:
 *
 * ```ts
 * function onRowOrderChange(payload: RowOrderChangePayload) {
 *   rows.value = computeRowReorder(
 *     rows.value,
 *     payload.movedRow.id,
 *     payload.targetRow.id,
 *     payload.position,
 *   );
 * }
 * ```
 *
 * Decision A.1 (emit-only persistence): chronix-table does NOT mutate
 * the consumer's `rows` prop and does NOT keep an internal row-order
 * override; the consumer's prop remains the single source of truth.
 * This helper makes the consumer-side rebuild trivial.
 *
 * No-op semantics (returns the input array reference unchanged):
 *
 * 1. `movedRowId` and `targetRowId` are the same id.
 * 2. Either id is not present in `rows` (defensive — protects against
 *    stale drop targets from rapid prop replacement during a drag).
 * 3. The move would land the row in its current position (e.g., moving
 *    row[2] to `'below'` row[1] when row[2] is already immediately
 *    below row[1]).
 *
 * **Pure function.** No DOM. No side effects.
 */
export function computeRowReorder(
  rows: readonly RowSpec[],
  movedRowId: string,
  targetRowId: string,
  position: 'above' | 'below',
): readonly RowSpec[] {
  if (movedRowId === targetRowId) return rows;

  const fromIdx = rows.findIndex((r) => r.id === movedRowId);
  if (fromIdx < 0) return rows;
  const targetIdx = rows.findIndex((r) => r.id === targetRowId);
  if (targetIdx < 0) return rows;

  // Compute the desired final index for the moved row AFTER removal.
  // When position === 'above', the moved row lands at targetIdx
  // (in the post-removal numbering). When position === 'below', it
  // lands at targetIdx + 1 (post-removal). Removing the moved row
  // first shifts every index above `fromIdx` down by 1; account for
  // that when target is below the moved row in the input order.
  const adjustedTargetIdx = targetIdx > fromIdx ? targetIdx - 1 : targetIdx;
  const finalIdx = position === 'above' ? adjustedTargetIdx : adjustedTargetIdx + 1;

  // No-op: row already at finalIdx (post-removal numbering).
  if (finalIdx === fromIdx) return rows;

  const movedRow = rows[fromIdx]!;
  const without = [...rows.slice(0, fromIdx), ...rows.slice(fromIdx + 1)];
  return [...without.slice(0, finalIdx), movedRow, ...without.slice(finalIdx)];
}

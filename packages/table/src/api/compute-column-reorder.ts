import type { ColumnSpec } from '../ir/index.js';

/**
 * pixel-distance threshold used by the
 * chronix-table-vue3 adapter (and future ports) to discriminate a
 * header-cell click from a column-move drag. On `pointerdown` the
 * adapter records `(startClientX, startClientY)`; the session is
 * promoted to an active drag once the pointer travels this many
 * pixels (Chebyshev distance) from the origin. Below the threshold,
 * the normal header-click sort cycle runs as if no drag was attempted.
 *
 * 5px matches the common slider / drag-handle convention across modern
 * data-grid libraries. Not exposed as a theme token at a
 * future phase can promote it if real consumer demand surfaces.
 */
export const DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX = 5;

/**
 * pure reorder of a `readonly ColumnSpec[]`.
 * Moves the column identified by `movedColId` so that it appears
 * `position` (= `'before' | 'after'`) the column identified by
 * `targetColId`. Returns a NEW array preserving the rest of the
 * column order; column object references for non-moved columns are
 * preserved identity-stable.
 *
 * Used by the chronix-table-vue3 adapter (and future vue2 / react
 * ports) inside the consumer's `column-order-change` handler:
 *
 * ```ts
 * function onColumnOrderChange(payload: ColumnOrderChangePayload) {
 *   columns.value = computeColumnReorder(
 *     columns.value,
 *     payload.movedColumn.id,
 *     payload.targetColumn.id,
 *     payload.position,
 *   );
 * }
 * ```
 *
 * Decision A.1 (emit-only persistence): chronix-table does NOT mutate
 * the consumer's `columns` prop and does NOT keep an internal order
 * override; the consumer's prop remains the single source of truth.
 * This helper makes the consumer-side rebuild trivial.
 *
 * No-op semantics (returns the input array reference unchanged):
 *
 * 1. `movedColId` and `targetColId` are the same id.
 * 2. Either id is not present in `columns` (defensive — protects
 *    against stale drop targets from rapid prop replacement during
 *    drag).
 * 3. The move would land the column in its current position (e.g.,
 *    moving col-2 to `'after'` col-1 when col-2 is already immediately
 *    after col-1).
 *
 * **Pure function.** No DOM. No side effects.
 */
export function computeColumnReorder(
  columns: readonly ColumnSpec[],
  movedColId: string,
  targetColId: string,
  position: 'before' | 'after',
): readonly ColumnSpec[] {
  if (movedColId === targetColId) return columns;

  const fromIdx = columns.findIndex((c) => c.id === movedColId);
  if (fromIdx < 0) return columns;
  const targetIdx = columns.findIndex((c) => c.id === targetColId);
  if (targetIdx < 0) return columns;

  // Compute the desired final index for the moved column AFTER removal.
  // When position === 'before', the moved column lands at targetIdx
  // (in the post-removal numbering). When position === 'after', it
  // lands at targetIdx + 1 (post-removal). Removing the moved column
  // first shifts every index above `fromIdx` down by 1; account for
  // that when target is to the right of the moved column.
  const adjustedTargetIdx = targetIdx > fromIdx ? targetIdx - 1 : targetIdx;
  const finalIdx = position === 'before' ? adjustedTargetIdx : adjustedTargetIdx + 1;

  // No-op: column already at finalIdx (post-removal numbering).
  if (finalIdx === fromIdx) return columns;

  const movedColumn = columns[fromIdx]!;
  const without = [...columns.slice(0, fromIdx), ...columns.slice(fromIdx + 1)];
  return [...without.slice(0, finalIdx), movedColumn, ...without.slice(finalIdx)];
}

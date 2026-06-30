import { collectDescendantRowIds } from './collect-descendant-row-ids.js';

import type { RowSpec } from '../ir/index.js';

/**
 * tristate row-selection state for parent
 * rows with `children`. Returns:
 *
 * - `'all'`: every descendant row is in `selectedRowIds`.
 * - `'none'`: no descendant row is in `selectedRowIds`.
 * - `'some'`: at least one descendant is selected but not all (the
 *   indeterminate checkbox state).
 *
 * Leaf rows + rows not found in `rows` return `'none'`. The parent
 * row's OWN selection state is NOT considered — `computeRowSelectionTriState`
 * only inspects descendants. The SFC's render layer combines this
 * with the parent's own selection state when wiring `checked` vs
 * `indeterminate` (Decision C.1):
 *
 * - parent in selection + tristate `'all'` → `checked = true`, `indeterminate = false`.
 * - parent in selection + tristate `'some'` → `checked = false`, `indeterminate = true`.
 * - parent NOT in selection + tristate `'none'` → `checked = false`, `indeterminate = false`.
 * - parent NOT in selection + tristate `'some' | 'all'` → `checked = false`, `indeterminate = true`.
 *
 * Pure. Operates on the TREE-SHAPED input row list (`props.rows`),
 * not the post-`treeFlattenPass` flat list — cascade applies
 * regardless of expand state.
 *
 * Algorithm: collect descendant IDs via `collectDescendantRowIds`,
 * then count how many are in the selection set. Single Set lookup
 * per descendant = O(N) where N is the descendant count.
 */
export type RowSelectionTriState = 'none' | 'some' | 'all';

export function computeRowSelectionTriState(
  rowId: string,
  rows: readonly RowSpec[],
  selectedRowIds: ReadonlySet<string>,
): RowSelectionTriState {
  const descendants = collectDescendantRowIds(rowId, rows);
  if (descendants.length === 0) return 'none';
  let selectedCount = 0;
  for (const id of descendants) {
    if (selectedRowIds.has(id)) selectedCount++;
  }
  if (selectedCount === 0) return 'none';
  if (selectedCount === descendants.length) return 'all';
  return 'some';
}

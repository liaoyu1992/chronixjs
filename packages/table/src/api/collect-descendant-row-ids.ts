import type { RowSpec } from '../ir/index.js';

/**
 * Phase 30.1.1 (2026-05-28): collect every descendant row ID of a
 * parent row, walking `children` recursively to any depth. The parent
 * row's own ID is NOT included in the output (callers can prepend it
 * if they need an inclusive set).
 *
 * Used by the tristate row-selection cascade (Decision A.1 + B.1) to
 * implement "clicking a parent toggles all descendants regardless of
 * expand state." Operates on the TREE-SHAPED input row list (`props.rows`),
 * NOT the post-`treeFlattenPass` flat list — descendants in collapsed
 * subtrees must still cascade.
 *
 * Pure. Returns `[]` when:
 *
 * - The parent row is not found in `rows`.
 * - The parent row has no `children` (or empty children array).
 *
 * Algorithm: depth-first walk via explicit stack; collects every row
 * ID reachable through `children` chains. The explicit stack guards
 * against pathologically deep trees (10k+ levels) without overflowing
 * the JS call stack — same posture as `treeFlattenPass`.
 */
export function collectDescendantRowIds(
  parentRowId: string,
  rows: readonly RowSpec[],
): readonly string[] {
  const parent = findRowById(parentRowId, rows);
  if (parent == null) return [];
  const children = parent.children;
  if (children == null || children.length === 0) return [];

  const out: string[] = [];
  const stack: RowSpec[] = [];
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (child != null) stack.push(child);
  }
  while (stack.length > 0) {
    const row = stack.pop();
    if (row == null) continue;
    out.push(row.id);
    const grandchildren = row.children;
    if (grandchildren != null && grandchildren.length > 0) {
      for (let i = grandchildren.length - 1; i >= 0; i--) {
        const grand = grandchildren[i];
        if (grand != null) stack.push(grand);
      }
    }
  }
  return out;
}

/**
 * Locate a row by its `id` anywhere in a tree-shaped row list. Uses
 * the same explicit-stack DFS as `collectDescendantRowIds`. Returns
 * `undefined` when no row matches.
 */
function findRowById(rowId: string, rows: readonly RowSpec[]): RowSpec | undefined {
  const stack: RowSpec[] = [];
  for (let i = rows.length - 1; i >= 0; i--) {
    const row = rows[i];
    if (row != null) stack.push(row);
  }
  while (stack.length > 0) {
    const row = stack.pop();
    if (row == null) continue;
    if (row.id === rowId) return row;
    const children = row.children;
    if (children != null && children.length > 0) {
      for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child != null) stack.push(child);
      }
    }
  }
  return undefined;
}

import { traverseTreePreOrder } from './traverse-tree.js';

import type { TreeNodeSpec } from './tree-spec.js';

/**
 * Collect all descendant keys of a node in pre-order. Pure function.
 *
 * Phase 5 (2026-06-02). Used by Tree's checkbox-cascade logic, "expand
 * all" operations, and bulk-action targeting.
 *
 * By default, the result EXCLUDES `node.key` itself (only descendants).
 * Pass `{ includeSelf: true }` to prepend the node's own key.
 *
 * Returns an empty array for leaf nodes (no descendants), or `[node.key]`
 * for leaves when `includeSelf: true`.
 */
export function collectDescendantKeys<T>(
  node: TreeNodeSpec<T>,
  options?: { readonly includeSelf?: boolean },
): readonly (string | number)[] {
  const includeSelf = options?.includeSelf ?? false;
  const out: (string | number)[] = [];
  if (includeSelf) out.push(node.key);
  if (node.children && node.children.length > 0) {
    traverseTreePreOrder(node.children, (descendant) => {
      out.push(descendant.key);
    });
  }
  return out;
}

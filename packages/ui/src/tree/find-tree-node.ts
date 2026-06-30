import { traverseTreePreOrder } from './traverse-tree.js';

import type { TreeKeyPath, TreeNodeSpec } from './tree-spec.js';

/**
 * Result of a successful `findTreeNode` lookup. Bundles the node with
 * its location in the tree so callers don't re-traverse to derive
 * ancestry info.
 */
export interface TreeNodeLookup<T> {
  readonly node: TreeNodeSpec<T>;
  /** Depth of `node`: 0 for roots, 1 for their children, etc. */
  readonly depth: number;
  /** Keys of the ancestors from root to parent (exclusive of `node.key`). */
  readonly parentKeyPath: TreeKeyPath;
}

/**
 * Find the first node with the given `key` in pre-order traversal of
 * `roots`. Returns `undefined` if no node matches.
 *
 * . Linear time (O(N) where N = total nodes).
 * Suitable for one-off lookups; for repeated lookups in a stable tree
 * a future `createTreeIndex` helper will provide O(1) lookup
 * via a key→node Map.
 *
 * If multiple nodes share the same key (which violates the tree spec
 * but isn't enforced), the first occurrence in pre-order wins.
 */
export function findTreeNode<T>(
  roots: readonly TreeNodeSpec<T>[],
  key: string | number,
): TreeNodeLookup<T> | undefined {
  let found: TreeNodeLookup<T> | undefined;
  traverseTreePreOrder(roots, (node, depth, parentKeyPath) => {
    if (node.key === key) {
      found = { node, depth, parentKeyPath };
      return false; // short-circuit traversal
    }
  });
  return found;
}

import { traverseTreePreOrder } from './traverse-tree.js';

import type { TreeKeyPath, TreeNodeSpec } from './tree-spec.js';

/**
 * One entry in a flattened-tree array. Pairs the node with its depth
 * + ancestor path so consumers can render the tree as an indented list
 * (typical Tree component rendering) without re-deriving ancestry.
 */
export interface FlatTreeEntry<T> {
  readonly node: TreeNodeSpec<T>;
  readonly depth: number;
  readonly parentKeyPath: TreeKeyPath;
}

/**
 * Flatten a tree into a pre-order array of `FlatTreeEntry` records.
 * Pre-order matches DOM document order for rendering.
 *
 * Phase 5 (2026-06-02). Useful for:
 *
 * - Rendering a tree as a virtualized flat list (Tree component
 *   plus `KitVirtualList` from cx-kit).
 * - Computing the next/previous keyboard-navigation target.
 * - Snapshotting tree state for persistence / undo.
 *
 * The flat array preserves the tree's full content (no filtering).
 * Use `filterTree` first if you need a pruned version.
 */
export function flattenTree<T>(roots: readonly TreeNodeSpec<T>[]): readonly FlatTreeEntry<T>[] {
  const out: FlatTreeEntry<T>[] = [];
  traverseTreePreOrder(roots, (node, depth, parentKeyPath) => {
    out.push({ node, depth, parentKeyPath });
  });
  return out;
}

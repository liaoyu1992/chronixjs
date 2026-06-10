import type { TreeKeyPath, TreeNodeSpec } from './tree-spec.js';

/**
 * Visitor invoked once per node during a tree traversal.
 *
 * - `node` — the visited node.
 * - `depth` — 0 for roots; 1 for children of roots; etc.
 * - `parentKeyPath` — keys of ancestors from root to parent (exclusive
 *   of `node` itself). Empty for roots.
 *
 * Visitors may return `false` to short-circuit traversal (stop visiting
 * the rest of the tree). Any other return value (including `undefined`)
 * continues normally.
 */
export type TreeVisitor<T> = (
  node: TreeNodeSpec<T>,
  depth: number,
  parentKeyPath: TreeKeyPath,
) => boolean | void;

/**
 * Visit every node in `roots` in pre-order traversal (parent before
 * children, siblings in source order). The visitor receives the node,
 * its depth, and the keys of its ancestors.
 *
 * Pre-order is the natural order for rendering an expanded tree as a
 * flat list (matches DOM document order).
 *
 * Returns `true` if traversal completed; `false` if the visitor
 * short-circuited.
 */
export function traverseTreePreOrder<T>(
  roots: readonly TreeNodeSpec<T>[],
  visit: TreeVisitor<T>,
): boolean {
  return walkPreOrder(roots, 0, [], visit);
}

/**
 * Visit every node in `roots` in post-order traversal (children before
 * parent, siblings in source order). Useful for bottom-up aggregations
 * (e.g. computing a node's check state from its descendants).
 *
 * Returns `true` if traversal completed; `false` if the visitor
 * short-circuited.
 */
export function traverseTreePostOrder<T>(
  roots: readonly TreeNodeSpec<T>[],
  visit: TreeVisitor<T>,
): boolean {
  return walkPostOrder(roots, 0, [], visit);
}

function walkPreOrder<T>(
  nodes: readonly TreeNodeSpec<T>[],
  depth: number,
  parentKeyPath: TreeKeyPath,
  visit: TreeVisitor<T>,
): boolean {
  for (const node of nodes) {
    const stop = visit(node, depth, parentKeyPath) === false;
    if (stop) return false;
    if (node.children && node.children.length > 0) {
      const nextPath = [...parentKeyPath, node.key];
      const childOk = walkPreOrder(node.children, depth + 1, nextPath, visit);
      if (!childOk) return false;
    }
  }
  return true;
}

function walkPostOrder<T>(
  nodes: readonly TreeNodeSpec<T>[],
  depth: number,
  parentKeyPath: TreeKeyPath,
  visit: TreeVisitor<T>,
): boolean {
  for (const node of nodes) {
    if (node.children && node.children.length > 0) {
      const nextPath = [...parentKeyPath, node.key];
      const childOk = walkPostOrder(node.children, depth + 1, nextPath, visit);
      if (!childOk) return false;
    }
    const stop = visit(node, depth, parentKeyPath) === false;
    if (stop) return false;
  }
  return true;
}

import type { TreeKeyPath, TreeNodeSpec } from './tree-spec.js';

/**
 * Transform every node in the tree by applying `fn` to derive a new
 * payload, while preserving the tree's structure + each node's `key`.
 *
 * . Type-changing: input `TreeNodeSpec<T>` becomes
 * output `TreeNodeSpec<U>` where `U` is `fn`'s return type. Useful for:
 *
 * - Computing per-node derived state (e.g. "disabled" flag from raw
 *   business rules) and freezing it into the tree.
 * - Converting between payload types (e.g. backend response shape →
 *   chronix-ui Tree node payload).
 * - Stripping payload (`mapTree(roots, () => undefined)`) to produce a
 *   key-only skeleton.
 *
 * Children are transformed recursively. The result is always a fresh
 * tree (no reference-sharing with input — even leaves are recreated
 * because their payload type changes).
 */
export function mapTree<T, U>(
  roots: readonly TreeNodeSpec<T>[],
  fn: (node: TreeNodeSpec<T>, depth: number, parentKeyPath: TreeKeyPath) => U,
): readonly TreeNodeSpec<U>[] {
  return mapAt(roots, 0, [], fn);
}

function mapAt<T, U>(
  nodes: readonly TreeNodeSpec<T>[],
  depth: number,
  parentKeyPath: TreeKeyPath,
  fn: (node: TreeNodeSpec<T>, depth: number, parentKeyPath: TreeKeyPath) => U,
): readonly TreeNodeSpec<U>[] {
  const out: TreeNodeSpec<U>[] = [];
  for (const node of nodes) {
    const newData = fn(node, depth, parentKeyPath);
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren) {
      const nextPath = [...parentKeyPath, node.key];
      const newChildren = mapAt(node.children, depth + 1, nextPath, fn);
      out.push({ key: node.key, data: newData, children: newChildren });
    } else {
      out.push({ key: node.key, data: newData });
    }
  }
  return out;
}

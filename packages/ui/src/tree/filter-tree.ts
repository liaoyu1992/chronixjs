import type { TreeKeyPath, TreeNodeSpec } from './tree-spec.js';

/**
 * Predicate invoked once per node during `filterTree`. Returns `true`
 * if the node directly matches the filter (e.g. search-text matches
 * the node's label). The filter helper handles ancestry inclusion
 * automatically — predicates focus only on "does this single node
 * match".
 */
export type TreeFilterPredicate<T> = (
  node: TreeNodeSpec<T>,
  depth: number,
  parentKeyPath: TreeKeyPath,
) => boolean;

/**
 * Filter a tree to nodes matching `predicate`, **preserving ancestors**
 * so every match remains reachable through its parent chain.
 *
 * Phase 5 (2026-06-02) — ancestry-preserving semantics (the convention
 * used by Tree search UIs: searching "foo" shows "foo" along with its
 * folder chain so it stays clickable).
 *
 * Rules:
 *
 * - A node is INCLUDED in the result if either (a) the predicate
 *   returns true for it OR (b) at least one of its descendants would
 *   be included.
 * - An included node's `children` is itself filtered the same way; a
 *   node included only because of descendant matches keeps just the
 *   matching subtree.
 * - The original tree is not mutated; the result reuses node references
 *   only when no children-level change occurred (reference-equal
 *   subtrees imply "no change in this subtree").
 *
 * Returns a fresh array (potentially empty) of root nodes. Subtree
 * order is preserved.
 */
export function filterTree<T>(
  roots: readonly TreeNodeSpec<T>[],
  predicate: TreeFilterPredicate<T>,
): readonly TreeNodeSpec<T>[] {
  return filterAt(roots, 0, [], predicate);
}

function filterAt<T>(
  nodes: readonly TreeNodeSpec<T>[],
  depth: number,
  parentKeyPath: TreeKeyPath,
  predicate: TreeFilterPredicate<T>,
): readonly TreeNodeSpec<T>[] {
  const out: TreeNodeSpec<T>[] = [];
  for (const node of nodes) {
    const selfMatches = predicate(node, depth, parentKeyPath);
    const hasChildren = node.children && node.children.length > 0;
    if (hasChildren) {
      const nextPath = [...parentKeyPath, node.key];
      const filteredChildren = filterAt(node.children, depth + 1, nextPath, predicate);
      if (filteredChildren.length > 0) {
        // Include node with its filtered children (whether self matches or not).
        if (filteredChildren === node.children) {
          // No children-level change AND no self-match question — keep reference.
          out.push(node);
        } else {
          out.push({ ...node, children: filteredChildren });
        }
        continue;
      }
      // No descendants matched; include only if self matches (and drop
      // children since none survived).
      if (selfMatches) {
        out.push({ ...node, children: [] });
      }
    } else if (selfMatches) {
      out.push(node);
    }
  }
  return out;
}

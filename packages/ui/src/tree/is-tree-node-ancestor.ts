import { collectDescendantKeys } from './collect-descendant-keys.js';
import { findTreeNode } from './find-tree-node.js';

import type { TreeNodeSpec } from './tree-spec.js';

export function isTreeNodeAncestor<T>(
  roots: readonly TreeNodeSpec<T>[],
  ancestorKey: string | number,
  descendantKey: string | number,
): boolean {
  if (ancestorKey === descendantKey) return false;
  const lookup = findTreeNode(roots, ancestorKey);
  if (!lookup) return false;
  const descKeys = collectDescendantKeys(lookup.node);
  return descKeys.some((k) => k === descendantKey);
}

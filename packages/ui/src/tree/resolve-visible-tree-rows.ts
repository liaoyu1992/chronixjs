import { flattenTree } from './flatten-tree.js';

import type { FlatTreeEntry } from './flatten-tree.js';
import type { TreeNodeData } from './tree-component-spec.js';
import type { TreeNodeSpec } from './tree-spec.js';

export interface ResolveVisibleTreeRowsInput {
  readonly items: readonly TreeNodeSpec<TreeNodeData>[];
  readonly expandedKeys: ReadonlySet<string>;
}

export function resolveVisibleTreeRows(
  input: ResolveVisibleTreeRowsInput,
): readonly FlatTreeEntry<TreeNodeData>[] {
  const all = flattenTree(input.items);
  return all.filter((entry) => {
    if (entry.parentKeyPath.length === 0) return true;
    return entry.parentKeyPath.every((k) => input.expandedKeys.has(String(k)));
  });
}

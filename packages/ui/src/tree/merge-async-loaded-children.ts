import type { TreeNodeData } from './tree-component-spec.js';
import type { TreeNodeSpec } from './tree-spec.js';

export interface MergeAsyncLoadedChildrenInput {
  readonly items: readonly TreeNodeSpec<TreeNodeData>[];
  readonly parentKey: string;
  readonly loadedChildren: readonly TreeNodeSpec<TreeNodeData>[];
}

export function mergeAsyncLoadedChildren(
  input: MergeAsyncLoadedChildrenInput,
): readonly TreeNodeSpec<TreeNodeData>[] {
  const { items, parentKey, loadedChildren } = input;
  return items.map((item) => {
    if (String(item.key) === parentKey) {
      return { ...item, children: loadedChildren };
    }
    if (item.children) {
      return {
        ...item,
        children: mergeAsyncLoadedChildren({ items: item.children, parentKey, loadedChildren }),
      };
    }
    return item;
  });
}

import type { FlatTreeEntry } from './flatten-tree.js';
import type { TreeNodeData } from './tree-component-spec.js';
import type { TreeNodeSpec } from './tree-spec.js';

export type TreeKeyboardDirection = 'up' | 'down' | 'left' | 'right' | 'home' | 'end' | 'select';

export interface ComposeTreeKeyboardSelectionInput {
  readonly items: readonly TreeNodeSpec<TreeNodeData>[];
  readonly visibleRows: readonly FlatTreeEntry<TreeNodeData>[];
  readonly currentKey: string | null;
  readonly expandedKeys: ReadonlySet<string>;
  readonly direction: TreeKeyboardDirection;
}

export interface ComposeTreeKeyboardSelectionResult {
  readonly nextKey: string | null;
  readonly toggleExpand: 'expand' | 'collapse' | null;
  readonly selectNext: boolean;
}

export function composeTreeKeyboardSelection(
  input: ComposeTreeKeyboardSelectionInput,
): ComposeTreeKeyboardSelectionResult {
  const { visibleRows, currentKey, expandedKeys, direction } = input;
  if (visibleRows.length === 0) {
    return { nextKey: null, toggleExpand: null, selectNext: false };
  }

  const keys = visibleRows.map((r) => String(r.node.key));
  const lastIndex = keys.length - 1;
  const EMPTY = { nextKey: null, toggleExpand: null, selectNext: false };

  switch (direction) {
    case 'home':
      return { nextKey: keys[0] ?? null, toggleExpand: null, selectNext: false };
    case 'end':
      return { nextKey: keys[lastIndex] ?? null, toggleExpand: null, selectNext: false };
    case 'select': {
      if (currentKey === null) return EMPTY;
      const entry = visibleRows.find((r) => String(r.node.key) === currentKey);
      if (!entry) return EMPTY;
      const hasChildren =
        (entry.node.children !== undefined && entry.node.children.length > 0) ||
        (entry.node.data?.isLeaf !== true && entry.node.children === undefined);
      if (hasChildren && !entry.node.data?.isLeaf) return EMPTY;
      return { nextKey: currentKey, toggleExpand: null, selectNext: true };
    }
    case 'down':
    case 'up': {
      const idx = currentKey === null ? -1 : keys.indexOf(currentKey);
      if (idx < 0) {
        return {
          nextKey: direction === 'down' ? keys[0]! : keys[lastIndex]!,
          toggleExpand: null,
          selectNext: false,
        };
      }
      const step = direction === 'down' ? 1 : -1;
      const next = Math.max(0, Math.min(lastIndex, idx + step));
      return { nextKey: keys[next] ?? null, toggleExpand: null, selectNext: false };
    }
    case 'left': {
      if (currentKey === null) return EMPTY;
      const entry = visibleRows.find((r) => String(r.node.key) === currentKey);
      if (!entry) return EMPTY;
      const hasChildren = entry.node.children !== undefined && entry.node.children.length > 0;
      if (hasChildren && expandedKeys.has(currentKey)) {
        return { nextKey: currentKey, toggleExpand: 'collapse', selectNext: false };
      }
      // jump to parent
      if (entry.parentKeyPath.length > 0) {
        const parentKey = String(entry.parentKeyPath[entry.parentKeyPath.length - 1]!);
        return { nextKey: parentKey, toggleExpand: null, selectNext: false };
      }
      return { nextKey: currentKey, toggleExpand: null, selectNext: false };
    }
    case 'right': {
      if (currentKey === null) return EMPTY;
      const entry = visibleRows.find((r) => String(r.node.key) === currentKey);
      if (!entry) return EMPTY;
      const hasChildren = entry.node.children !== undefined && entry.node.children.length > 0;
      if (hasChildren) {
        if (!expandedKeys.has(currentKey)) {
          return { nextKey: currentKey, toggleExpand: 'expand', selectNext: false };
        }
        // already expanded — focus first child
        const firstChild = entry.node.children[0];
        if (firstChild) {
          return { nextKey: String(firstChild.key), toggleExpand: null, selectNext: false };
        }
      }
      return { nextKey: currentKey, toggleExpand: null, selectNext: false };
    }
  }
}

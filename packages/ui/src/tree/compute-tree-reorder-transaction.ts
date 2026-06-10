import { collectDescendantKeys } from './collect-descendant-keys.js';
import { findTreeNode } from './find-tree-node.js';

import type { TreeDropPosition } from './detect-tree-drop-position.js';
import type { TreeNodeData } from './tree-component-spec.js';
import type { TreeNodeSpec } from './tree-spec.js';

export type TreeReorderCancelReason = 'self' | 'cycle' | 'missing';

export interface ComputeTreeReorderTransactionInput {
  readonly sourceKey: string;
  readonly hoverKey: string;
  readonly hoverPosition: TreeDropPosition;
  readonly items: readonly TreeNodeSpec<TreeNodeData>[];
}

export interface ComputeTreeReorderTransactionResult {
  readonly nextItems: readonly TreeNodeSpec<TreeNodeData>[];
  readonly cancelled: boolean;
  readonly cancelReason?: TreeReorderCancelReason;
}

export function computeTreeReorderTransaction(
  input: ComputeTreeReorderTransactionInput,
): ComputeTreeReorderTransactionResult {
  const { sourceKey, hoverKey, hoverPosition, items } = input;

  if (sourceKey === hoverKey) {
    return { nextItems: items, cancelled: true, cancelReason: 'self' };
  }

  // cycle check: source must not be an ancestor of hover
  const sourceLookup = findTreeNode(items, sourceKey);
  if (!sourceLookup) {
    return { nextItems: items, cancelled: true, cancelReason: 'missing' };
  }
  const hoverLookup = findTreeNode(items, hoverKey);
  if (!hoverLookup) {
    return { nextItems: items, cancelled: true, cancelReason: 'missing' };
  }

  // check if source is ancestor of hover
  const sourceDescKeys = collectDescendantKeys(sourceLookup.node);
  if (sourceDescKeys.some((k) => String(k) === hoverKey)) {
    return { nextItems: items, cancelled: true, cancelReason: 'cycle' };
  }

  // Remove source from tree, then insert at target position
  const sourceNode = sourceLookup.node;
  const withoutSource = removeNode(items, sourceKey);
  if (!withoutSource) {
    return { nextItems: items, cancelled: true, cancelReason: 'missing' };
  }

  if (hoverPosition === 'inside') {
    const result = insertAsChild(withoutSource, hoverKey, sourceNode);
    return { nextItems: result, cancelled: false };
  }

  const result = insertSibling(withoutSource, hoverKey, sourceNode, hoverPosition === 'before');
  return { nextItems: result, cancelled: false };
}

function removeNode<T>(
  items: readonly TreeNodeSpec<T>[],
  key: string,
): readonly TreeNodeSpec<T>[] | null {
  const result: TreeNodeSpec<T>[] = [];
  let removed = false;
  for (const item of items) {
    if (String(item.key) === key) {
      removed = true;
      continue;
    }
    if (item.children) {
      const newChildren = removeNode(item.children, key);
      if (newChildren) {
        result.push({ ...item, children: newChildren });
      } else {
        result.push(item);
      }
    } else {
      result.push(item);
    }
  }
  return removed ? result : null;
}

function insertAsChild<T>(
  items: readonly TreeNodeSpec<T>[],
  parentKey: string,
  node: TreeNodeSpec<T>,
): readonly TreeNodeSpec<T>[] {
  return items.map((item) => {
    if (String(item.key) === parentKey) {
      const children = item.children ? [...item.children, node] : [node];
      return { ...item, children };
    }
    if (item.children) {
      return { ...item, children: insertAsChild(item.children, parentKey, node) };
    }
    return item;
  });
}

function insertSibling<T>(
  items: readonly TreeNodeSpec<T>[],
  siblingKey: string,
  node: TreeNodeSpec<T>,
  before: boolean,
): readonly TreeNodeSpec<T>[] {
  const idx = items.findIndex((item) => String(item.key) === siblingKey);
  if (idx >= 0) {
    const arr = [...items];
    arr.splice(before ? idx : idx + 1, 0, node);
    return arr;
  }
  return items.map((item) => {
    if (item.children) {
      return { ...item, children: insertSibling(item.children, siblingKey, node, before) };
    }
    return item;
  });
}

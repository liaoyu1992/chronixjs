/**
 * chronix-ui tree module — Phase 5 (2026-06-02).
 *
 * Framework-agnostic tree-traversal helpers used by Tree, Cascader,
 * TreeSelect, Menu, Dropdown, and other hierarchical components.
 * chronix-NEW surface focused on what chronix-ui actually needs.
 *
 * Public surface:
 *
 * - `TreeNodeSpec<T>` — generic tree node interface (`key`, `data?`, `children?`).
 * - `TreeKeyPath` — ordered list of ancestor keys.
 * - `TreeVisitor<T>` — visitor signature for `traverseTree*`.
 * - `TreeFilterPredicate<T>` — predicate signature for `filterTree`.
 * - `FlatTreeEntry<T>` — entry shape returned by `flattenTree`.
 * - `TreeNodeLookup<T>` — result shape returned by `findTreeNode`.
 * - `traverseTreePreOrder` / `traverseTreePostOrder` — visitor traversals.
 * - `flattenTree` — pre-order flat array for list rendering.
 * - `filterTree` — ancestry-preserving predicate filter.
 * - `mapTree` — payload transform (preserves structure + keys).
 * - `collectDescendantKeys` — all descendant keys of a node.
 * - `findTreeNode` — O(N) lookup by key, returns node + ancestry info.
 */

export type { TreeKeyPath, TreeNodeSpec } from './tree-spec.js';
export type { TreeVisitor } from './traverse-tree.js';
export { traverseTreePostOrder, traverseTreePreOrder } from './traverse-tree.js';
export type { FlatTreeEntry } from './flatten-tree.js';
export { flattenTree } from './flatten-tree.js';
export type { TreeFilterPredicate } from './filter-tree.js';
export { filterTree } from './filter-tree.js';
export { mapTree } from './map-tree.js';
export { collectDescendantKeys } from './collect-descendant-keys.js';
export type { TreeNodeLookup } from './find-tree-node.js';
export { findTreeNode } from './find-tree-node.js';

// Phase 30 — Tier C Tree component IR.
export type { TreeNodeData, TreeProps } from './tree-component-spec.js';
export { DEFAULT_TREE_ROW_HEIGHT_PX, defaultTreeProps } from './tree-component-spec.js';
export { normalizeExpandedKeysProp } from './normalize-expanded-keys-prop.js';
export type { ResolveVisibleTreeRowsInput } from './resolve-visible-tree-rows.js';
export { resolveVisibleTreeRows } from './resolve-visible-tree-rows.js';
export type {
  ComputeTreeVirtualWindowInput,
  TreeVirtualWindow,
} from './compute-tree-virtual-window.js';
export {
  computeTreeVirtualWindow,
  DEFAULT_TREE_VIRTUAL_WINDOW_OVERSCAN,
} from './compute-tree-virtual-window.js';
export { isTreeNodeAncestor } from './is-tree-node-ancestor.js';
export type {
  ComposeTreeKeyboardSelectionInput,
  ComposeTreeKeyboardSelectionResult,
  TreeKeyboardDirection,
} from './compose-tree-keyboard-selection.js';
export { composeTreeKeyboardSelection } from './compose-tree-keyboard-selection.js';
export type { TreeDropPosition } from './detect-tree-drop-position.js';
export { detectTreeDropPosition } from './detect-tree-drop-position.js';
export type {
  ComputeTreeReorderTransactionInput,
  ComputeTreeReorderTransactionResult,
  TreeReorderCancelReason,
} from './compute-tree-reorder-transaction.js';
export { computeTreeReorderTransaction } from './compute-tree-reorder-transaction.js';
export type { MergeAsyncLoadedChildrenInput } from './merge-async-loaded-children.js';
export { mergeAsyncLoadedChildren } from './merge-async-loaded-children.js';
export type {
  ResolveTreeClassListInput,
  ResolveTreeRowClassListInput,
  ResolveTreeArrowClassListInput,
  ResolveTreeDropIndicatorClassListInput,
} from './resolve-tree-class-list.js';
export {
  resolveTreeClassList,
  resolveTreeRowClassList,
  resolveTreeArrowClassList,
  resolveTreeDropIndicatorClassList,
} from './resolve-tree-class-list.js';
export { CHRONIX_TREE_CSS, ensureChronixTreeStyles } from './tree-styles.js';

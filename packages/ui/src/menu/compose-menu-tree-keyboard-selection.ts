import { findMenuItemByKey, findMenuParentKey, findMenuPath } from './find-menu-path.js';

import type { MenuItem } from './menu-spec.js';

/**
 * Keyboard-navigation direction for tree-shaped menus.
 *
 * - `'up'` / `'down'` — move within the flattened-visible key
 *   sequence (collapsed branches' children are skipped).
 * - `'home'` / `'end'` — first / last in the visible sequence.
 * - `'left'` — collapse current (if expanded branch) OR jump to
 *   parent.
 * - `'right'` — expand current (if collapsed branch) OR jump to
 *   first child (if already expanded).
 */
export type MenuTreeNavDirection = 'up' | 'down' | 'left' | 'right' | 'home' | 'end';

export interface ComposeMenuTreeKeyboardSelectionInput {
  readonly items: readonly MenuItem[];
  readonly currentKey: string | null;
  readonly expandedKeys: ReadonlySet<string>;
  readonly direction: MenuTreeNavDirection;
}

export interface ComposeMenuTreeKeyboardSelectionResult {
  /** The key to focus next, or `null` when no move is meaningful. */
  readonly nextKey: string | null;
  /**
   * When non-null, the adapter should mutate the `expandedKeys` set
   * for the **current** key (NOT `nextKey`) — `'expand'` adds it,
   * `'collapse'` removes it.
   */
  readonly toggleExpand: 'expand' | 'collapse' | null;
}

/**
 * Flatten only the visible keys — start with all root-level keys,
 * descend into each item's children only if that item is in
 * `expandedKeys`.
 */
function flattenVisibleKeys(
  items: readonly MenuItem[],
  expandedKeys: ReadonlySet<string>,
): readonly string[] {
  const out: string[] = [];
  function walk(list: readonly MenuItem[]): void {
    for (const item of list) {
      out.push(item.key);
      if (item.children !== undefined && item.children.length > 0 && expandedKeys.has(item.key)) {
        walk(item.children);
      }
    }
  }
  walk(items);
  return out;
}

/**
 * Tree-aware keyboard navigation for `<ChronixMenu>`. Pure helper —
 * returns the next key the adapter should focus + an optional
 * `expand` / `collapse` directive the adapter should apply to the
 * **current** key's expanded state.
 *
 * The adapter's responsibility:
 * 1. Apply `toggleExpand` (if non-null) by adding/removing the
 *    `currentKey` from its `expandedKeys` set.
 * 2. Focus `nextKey` (if non-null).
 *
 * Disabled items are NOT filtered out — the helper navigates the
 * visible sequence regardless of disabled state. Adapters wanting
 * "skip disabled on Up/Down" can post-filter.
 */
export function composeMenuTreeKeyboardSelection(
  input: ComposeMenuTreeKeyboardSelectionInput,
): ComposeMenuTreeKeyboardSelectionResult {
  const { items, currentKey, expandedKeys, direction } = input;
  const visible = flattenVisibleKeys(items, expandedKeys);
  if (visible.length === 0) return { nextKey: null, toggleExpand: null };
  const lastIndex = visible.length - 1;

  switch (direction) {
    case 'home':
      return { nextKey: visible[0] ?? null, toggleExpand: null };
    case 'end':
      return { nextKey: visible[lastIndex] ?? null, toggleExpand: null };
    case 'down':
    case 'up': {
      const idx = currentKey === null ? -1 : visible.indexOf(currentKey);
      if (idx < 0) {
        return {
          nextKey: direction === 'down' ? visible[0]! : visible[lastIndex]!,
          toggleExpand: null,
        };
      }
      const step = direction === 'down' ? 1 : -1;
      const next = Math.max(0, Math.min(lastIndex, idx + step));
      return { nextKey: visible[next] ?? null, toggleExpand: null };
    }
    case 'left': {
      if (currentKey === null) return { nextKey: null, toggleExpand: null };
      const item = findMenuItemByKey(items, currentKey);
      if (
        item?.children !== undefined &&
        item.children.length > 0 &&
        expandedKeys.has(currentKey)
      ) {
        // collapse this branch; keep focus on the same node
        return { nextKey: currentKey, toggleExpand: 'collapse' };
      }
      // jump to parent
      const parent = findMenuParentKey(items, currentKey);
      return { nextKey: parent ?? currentKey, toggleExpand: null };
    }
    case 'right': {
      if (currentKey === null) return { nextKey: null, toggleExpand: null };
      const item = findMenuItemByKey(items, currentKey);
      if (item?.children !== undefined && item.children.length > 0) {
        if (!expandedKeys.has(currentKey)) {
          // expand; keep focus here so the consumer can see it open
          return { nextKey: currentKey, toggleExpand: 'expand' };
        }
        // already expanded → focus first child
        return { nextKey: item.children[0]!.key, toggleExpand: null };
      }
      return { nextKey: currentKey, toggleExpand: null };
    }
  }
}

/**
 * Convenience: compute the set of keys that should be expanded when
 * the menu mounts with a given active value. Returns the path to the
 * value's parent (the value itself is a leaf and doesn't need
 * expanding).
 */
export function deriveInitialExpandedKeys(
  items: readonly MenuItem[],
  value: string | undefined,
): ReadonlySet<string> {
  if (value === undefined) return new Set<string>();
  const path = findMenuPath(items, value);
  if (path.length <= 1) return new Set<string>();
  // exclude the leaf itself; only ancestors expand
  return new Set(path.slice(0, -1));
}

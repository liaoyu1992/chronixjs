import type { MenuItem } from './menu-spec.js';

/**
 * Find the chain of keys from the root of the tree down to (and
 * including) the target key. Returns the empty array when the target
 * isn't found.
 *
 * Used by adapter `<ChronixMenu>` mount logic to pre-expand the
 * ancestors of an initially-active leaf.
 *
 * Pre-order DFS. Stops at the first match.
 */
export function findMenuPath(items: readonly MenuItem[], targetKey: string): readonly string[] {
  function walk(list: readonly MenuItem[], trail: readonly string[]): readonly string[] | null {
    for (const item of list) {
      const nextTrail = [...trail, item.key];
      if (item.key === targetKey) return nextTrail;
      if (item.children !== undefined) {
        const child = walk(item.children, nextTrail);
        if (child !== null) return child;
      }
    }
    return null;
  }
  const result = walk(items, []);
  return result ?? [];
}

/**
 * Find the immediate parent's key for a given target key. Returns
 * `null` when the target is at the root level OR isn't found.
 */
export function findMenuParentKey(items: readonly MenuItem[], targetKey: string): string | null {
  const path = findMenuPath(items, targetKey);
  if (path.length <= 1) return null;
  return path[path.length - 2] ?? null;
}

/**
 * Look up a `MenuItem` by key. Returns `null` when the key isn't in
 * the tree.
 */
export function findMenuItemByKey(items: readonly MenuItem[], targetKey: string): MenuItem | null {
  for (const item of items) {
    if (item.key === targetKey) return item;
    if (item.children !== undefined) {
      const child = findMenuItemByKey(item.children, targetKey);
      if (child !== null) return child;
    }
  }
  return null;
}

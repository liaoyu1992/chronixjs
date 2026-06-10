import type { MenuItem } from './menu-spec.js';

/**
 * Recursively flatten a `MenuItem` tree into a single array,
 * pre-order. Children whose parent has `children: undefined` aren't
 * possible; children whose parent has `children: []` produce no
 * additional entries.
 *
 * Used by tests to assert tree shapes + by adapter keyboard
 * navigation to enumerate all keys.
 */
export function flattenMenuTree(items: readonly MenuItem[]): readonly MenuItem[] {
  const out: MenuItem[] = [];
  function walk(list: readonly MenuItem[]): void {
    for (const item of list) {
      out.push(item);
      if (item.children !== undefined) walk(item.children);
    }
  }
  walk(items);
  return out;
}

/**
 * Same as `flattenMenuTree` but returns only the keys (no objects).
 * Convenience for keyboard-nav code that just needs the key ordering.
 */
export function flattenMenuTreeKeys(items: readonly MenuItem[]): readonly string[] {
  return flattenMenuTree(items).map((i) => i.key);
}

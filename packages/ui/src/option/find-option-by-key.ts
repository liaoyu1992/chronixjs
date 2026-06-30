/**
 * Look up an `OptionSpec` by key in an `OptionListItem[]`.
 * (2026-06-04). Walks groups; returns the leaf option (NOT the group
 * container). Returns `null` when no leaf matches.
 */
import { isOptionGroup, type OptionListItem, type OptionSpec } from './option-spec.js';

export function findOptionByKey(
  items: readonly OptionListItem[],
  key: string | null,
): OptionSpec | null {
  if (key === null) return null;
  for (const item of items) {
    if (isOptionGroup(item)) {
      for (const child of item.children) {
        if (child.key === key) return child;
      }
    } else if (item.key === key) {
      return item;
    }
  }
  return null;
}

/**
 * Convenience: look up by `value` instead of `key`. Returns the first
 * leaf option whose `value === value`. Used by trigger-label
 * resolution when adapter has the controlled `value` but needs the
 * label.
 */
export function findOptionByValue(
  items: readonly OptionListItem[],
  value: string | null | undefined,
): OptionSpec | null {
  if (value === null || value === undefined) return null;
  for (const item of items) {
    if (isOptionGroup(item)) {
      for (const child of item.children) {
        if (child.value === value) return child;
      }
    } else if (item.value === value) {
      return item;
    }
  }
  return null;
}

/**
 * Filter Select options by query — Phase 31 (2026-06-04).
 *
 * Pure helper: filters `SelectOption[]` by a search query string.
 * Preserves group structure (empty groups are removed).
 * Case-insensitive label matching.
 */

import { isOptionGroup } from './option-spec.js';

import type { SelectOption } from './option-spec.js';

/**
 * Filter `SelectOption[]` by query, preserving group hierarchy.
 *
 * - Leaf `OptionSpec`: matches if `label` contains `query` (case-insensitive).
 * - `OptionGroupSpec`: preserved if any descendant matches. Group label
 *   itself is NOT searched — only leaf labels are.
 * - Disabled options that match are still shown (they just can't be selected).
 * - Empty groups (no matching descendants) are removed.
 */
export function filterSelectOptions(
  options: readonly SelectOption[],
  query: string,
): readonly SelectOption[] {
  if (!query) return [...options];
  const lowerQuery = query.toLowerCase();
  return filterRecursive(options, lowerQuery);
}

function filterRecursive(
  options: readonly SelectOption[],
  lowerQuery: string,
): readonly SelectOption[] {
  const result: SelectOption[] = [];
  for (const option of options) {
    if (isOptionGroup(option)) {
      const filteredChildren = filterRecursive(option.children, lowerQuery);
      if (filteredChildren.length > 0) {
        result.push({
          ...option,
          children: filteredChildren,
        });
      }
    } else {
      const leaf = option;
      if (leaf.label.toLowerCase().includes(lowerQuery)) {
        result.push(leaf);
      }
    }
  }
  return result;
}

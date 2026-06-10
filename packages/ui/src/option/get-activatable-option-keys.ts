/**
 * Walk an `OptionListItem[]` (flat options + groups) and return the
 * keys of all non-disabled leaf options in source order. Phase 31
 * (2026-06-04).
 *
 * Used by adapter keyboard navigation: pair with
 * `composeKeyboardSelection({ availableKeys })` to compute the next
 * keyboard target.
 *
 * Group headers are NOT activatable (they're not selectable; pressing
 * Enter on a group header is a no-op).
 */
import { isOptionGroup, type OptionListItem } from './option-spec.js';

export function getActivatableOptionKeys(items: readonly OptionListItem[]): readonly string[] {
  const out: string[] = [];
  for (const item of items) {
    if (isOptionGroup(item)) {
      for (const child of item.children) {
        if (child.disabled !== true) out.push(child.key);
      }
    } else if (item.disabled !== true) {
      out.push(item.key);
    }
  }
  return out;
}

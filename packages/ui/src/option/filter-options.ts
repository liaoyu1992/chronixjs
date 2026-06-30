/**
 * Case-insensitive substring filter for `OptionListItem[]`.
 * (2026-06-04). Ancestry-preserving: a group is kept when at least
 * one of its children matches; an unmatched group is dropped.
 *
 * Fast-path: empty / whitespace-only `query` returns the input by
 * reference.
 */
import {
  isOptionGroup,
  type OptionGroupSpec,
  type OptionListItem,
  type OptionSpec,
} from './option-spec.js';

export function filterOptions(
  items: readonly OptionListItem[],
  query: string,
): readonly OptionListItem[] {
  if (query === '') return items;
  const needle = query.toLowerCase();
  if (needle === '') return items;
  const out: OptionListItem[] = [];
  for (const item of items) {
    if (isOptionGroup(item)) {
      const matched: OptionSpec[] = [];
      for (const child of item.children) {
        if (child.label.toLowerCase().includes(needle)) matched.push(child);
      }
      if (matched.length > 0) {
        const next: OptionGroupSpec = { ...item, children: matched };
        out.push(next);
      }
    } else if (item.label.toLowerCase().includes(needle)) {
      out.push(item);
    }
  }
  return out;
}

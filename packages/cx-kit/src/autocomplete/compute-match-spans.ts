import type { AutocompleteMatchMode, MatchSpan } from './filter-autocomplete-items.js';

/**
 * Compute the highlight spans for a single text + query pair.
 *
 * Standalone helper for cases where the consumer's filtering
 * already happened elsewhere (e.g. async server-fetched results)
 * but they still need char-range spans for highlight rendering.
 *
 * Algorithm matches `filterAutocompleteItems` per-item logic:
 *
 * - Empty query ⇒ `[]` (no spans to render).
 * - `'prefix'` mode: if `text` starts with `query` (case-insensitive),
 *   return `[{ start: 0, end: query.length }]`; else `[]`.
 * - `'substring'` mode (default): find first occurrence of `query`
 *   in `text` (case-insensitive); return one span at that index;
 *   `[]` if no match.
 *
 * Returns a fresh array on every call.
 */
export function computeMatchSpans(
  text: string,
  query: string,
  matchMode: AutocompleteMatchMode = 'substring',
): readonly MatchSpan[] {
  if (query === '') return [];
  const queryLower = query.toLowerCase();
  const queryLen = query.length;
  const textLower = text.toLowerCase();
  if (matchMode === 'prefix') {
    if (!textLower.startsWith(queryLower)) return [];
    return [{ start: 0, end: queryLen }];
  }
  const idx = textLower.indexOf(queryLower);
  if (idx === -1) return [];
  return [{ start: idx, end: idx + queryLen }];
}

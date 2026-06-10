/** Match strategy for autocomplete filtering. */
export type AutocompleteMatchMode = 'prefix' | 'substring';

/**
 * Half-open character range within a matched item's text. `start`
 * is inclusive, `end` exclusive. Consumers use these spans to
 * render highlight markup (e.g. wrap matched chars in `<mark>`).
 */
export interface MatchSpan {
  readonly start: number;
  readonly end: number;
}

/**
 * A filtered item with its score + highlight spans.
 *
 * - `score` is lower-is-better. Prefix matches have score `-1` so
 *   they sort before any substring match. Substring matches have
 *   `score = matchStartIndex` so earlier matches sort first.
 * - Empty-query results have `score = 0` (no relevant ordering;
 *   inputs are returned in input order).
 */
export interface AutocompleteMatch<T> {
  readonly item: T;
  readonly score: number;
  readonly matchSpans: readonly MatchSpan[];
}

/** Input to `filterAutocompleteItems`. */
export interface FilterAutocompleteItemsInput<T> {
  /** Items to filter. */
  readonly items: readonly T[];
  /** User-typed query (case-insensitive match). */
  readonly query: string;
  /** Extracts the searchable text from each item. */
  readonly getText: (item: T) => string;
  /** Match mode; defaults to `'substring'`. */
  readonly matchMode?: AutocompleteMatchMode;
}

/**
 * Filter + rank items by a typed query for typeahead autocomplete.
 *
 * Algorithm:
 *
 * 1. Empty query ⇒ return all items mapped to `{ item, score: 0,
 *    matchSpans: [] }` in input order (the "show all when blank"
 *    UX is the natural default).
 * 2. Lowercase query for case-insensitive matching.
 * 3. For each item, compute the text + check for a match:
 *    - `'prefix'` mode: include iff `text.startsWith(queryLower)`;
 *      score = `-1`; span = `{ start: 0, end: query.length }`.
 *    - `'substring'` mode (default): `idx = text.indexOf(queryLower)`;
 *      exclude if `idx === -1`; otherwise score = `idx === 0 ? -1 :
 *      idx`; span = `{ start: idx, end: idx + query.length }`.
 * 4. Sort: by score ascending, then alphabetic by text.
 *
 * Returns a fresh array on every call; consumers memoize via their
 * framework reactivity.
 */
export function filterAutocompleteItems<T>(
  input: FilterAutocompleteItemsInput<T>,
): readonly AutocompleteMatch<T>[] {
  const { items, query, getText } = input;
  const matchMode = input.matchMode ?? 'substring';
  if (query === '') {
    return items.map((item) => ({ item, score: 0, matchSpans: [] }));
  }
  const queryLower = query.toLowerCase();
  const queryLen = query.length;
  const result: { item: T; text: string; score: number; matchSpans: readonly MatchSpan[] }[] = [];
  for (const item of items) {
    const text = getText(item);
    const textLower = text.toLowerCase();
    if (matchMode === 'prefix') {
      if (!textLower.startsWith(queryLower)) continue;
      result.push({
        item,
        text,
        score: -1,
        matchSpans: [{ start: 0, end: queryLen }],
      });
      continue;
    }
    const idx = textLower.indexOf(queryLower);
    if (idx === -1) continue;
    result.push({
      item,
      text,
      score: idx === 0 ? -1 : idx,
      matchSpans: [{ start: idx, end: idx + queryLen }],
    });
  }
  result.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    if (a.text < b.text) return -1;
    if (a.text > b.text) return 1;
    return 0;
  });
  return result.map(({ item, score, matchSpans }) => ({ item, score, matchSpans }));
}

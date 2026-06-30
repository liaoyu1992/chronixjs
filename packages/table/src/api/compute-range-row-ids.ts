/**
 * compute the inclusive range of rowIds
 * between an anchor and a clicked row, in the order they appear in
 * the currently-displayed row list.
 *
 * Used by the chronix-table-vue3 SFC's shift+click range-selection
 * handler. The display order is the post-filter + post-sort + post-
 * page slice (`pagedRows`), so the range NEVER includes rows that
 * are filtered out / on a different page. That is the load-bearing
 * UX property — the user can only ever pick rows they can see.
 *
 * The function is order-independent on inputs: if the anchor sits
 * AFTER the clicked row in display order, the result still reads
 * top-down (lo..hi), not anchor-to-click direction. This matches
 * Excel's "selection always reads in display order" rule.
 *
 * Defensive: if either id is not present in `displayedRowIds`
 * (e.g., a stale anchor from before a filter narrowed it away), the
 * function returns an empty array. The caller (SFC) treats empty
 * as "no-op range" and falls back to its own anchor-establishment
 * logic.
 *
 * **Pure function.** No side effects.
 */
export function computeRangeRowIds(
  anchorId: string,
  clickedId: string,
  displayedRowIds: readonly string[],
): readonly string[] {
  if (displayedRowIds.length === 0) return [];

  const anchorIdx = displayedRowIds.indexOf(anchorId);
  if (anchorIdx < 0) return [];

  const clickedIdx = displayedRowIds.indexOf(clickedId);
  if (clickedIdx < 0) return [];

  const lo = Math.min(anchorIdx, clickedIdx);
  const hi = Math.max(anchorIdx, clickedIdx);
  return displayedRowIds.slice(lo, hi + 1);
}

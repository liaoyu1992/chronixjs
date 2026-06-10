/**
 * Pagination page computation — Phase 33 (2026-06-05).
 *
 * Pure helpers to compute page number arrays with ellipsis logic,
 * and derive page count from item count + page size.
 */

/**
 * Compute total pages from item count and page size.
 */
export function computePageCount(itemCount: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

/**
 * Compute the visible page number array with `null` for ellipsis gaps.
 *
 * Algorithm:
 * 1. If pageCount <= pageSlot, show all pages.
 * 2. Otherwise, show first page, last page, and a window of
 *    middle pages centered on the current page.
 * 3. When there is a gap of 2+ between shown pages, insert `null`
 *    (ellipsis indicator). A gap of exactly 1 shows the intervening page.
 *
 * @returns Array of page numbers and `null` for ellipsis positions.
 */
export function computePaginationPages(
  page: number,
  pageCount: number,
  pageSlot: number,
): (number | null)[] {
  if (pageCount <= 0) return [1];
  if (pageCount <= pageSlot) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  // Ensure page is in valid range
  const current = Math.max(1, Math.min(page, pageCount));

  // Middle window: pageSlot - 2 (first + last) slots for middle pages
  const middleSlots = Math.max(1, pageSlot - 2);

  // Compute start of middle window, centered on current page
  let middleStart = current - Math.floor(middleSlots / 2);
  // Clamp so we don't exceed bounds
  if (middleStart < 2) middleStart = 2;
  if (middleStart + middleSlots - 1 > pageCount - 1) {
    middleStart = pageCount - middleSlots;
  }
  middleStart = Math.max(2, middleStart);

  const middleEnd = Math.min(pageCount - 1, middleStart + middleSlots - 1);

  const result: (number | null)[] = [];

  // First page
  result.push(1);

  // Gap before middle
  if (middleStart > 2) {
    result.push(null); // ellipsis
  } else if (middleStart === 2) {
    // No gap, will be included in middle
  }

  // Middle pages
  for (let i = middleStart; i <= middleEnd; i++) {
    result.push(i);
  }

  // Gap after middle
  if (middleEnd < pageCount - 1) {
    result.push(null); // ellipsis
  }

  // Last page
  if (pageCount > 1) {
    result.push(pageCount);
  }

  return result;
}

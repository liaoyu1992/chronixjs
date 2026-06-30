/**
 * compute the ellipsis-aware sequence of
 * page numbers + ellipsis markers to render in the chronix-table
 * pagination footer.
 *
 * Output shape: `readonly (number | 'ellipsis')[]`. Numbers are
 * 0-based (matching `pagePass` + `setPage`); the SFC renders them
 * as `n + 1` for human display.
 *
 * Visible-page policy (Decision B.1):
 *
 * - Always show `boundaryCount` pages at each edge.
 * - Show `siblingCount` pages on each side of `currentPage` when in
 *   the middle.
 * - **Near the start** (current page within `boundaryCount +
 *   siblingCount` of page 0): show the first
 *   `boundaryCount + siblingCount + 1` pages contiguously, then
 *   ellipsis + end-boundary. This matches Notion / Material UI
 *   convention of keeping a visible "page 1 2 3" prefix when the
 *   user is at the start.
 * - **Near the end**: mirror — show end-boundary, ellipsis, then the
 *   last `boundaryCount + siblingCount + 1` pages.
 * - **Single-page gap collapses** to the literal missing page (no
 *   ellipsis for a 1-page gap — that would waste DOM).
 * - When `totalPages <= boundaryCount * 2 + siblingCount * 2 + 3`
 *   (defaults `<= 7`), show all pages — the "every page fits"
 *   threshold.
 *
 * Defensive: when `totalPages <= 0` or `currentPage < 0`, returns
 * empty. The caller should clamp `currentPage` via `pagePass`
 * first; this guard is defensive.
 *
 * **Pure function.** No side effects.
 */
export type VisiblePageElement = number | 'ellipsis';

export function computeVisiblePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
  boundaryCount = 1,
): readonly VisiblePageElement[] {
  if (totalPages <= 0) return [];
  if (currentPage < 0) return [];

  const fitsAllThreshold = boundaryCount * 2 + siblingCount * 2 + 3;
  if (totalPages <= fitsAllThreshold) {
    return makeRange(0, totalPages - 1);
  }

  // The "near start" cutoff = boundary + sibling. If currentPage is at
  // or before this index, the left ellipsis would only hide 0 or 1
  // pages — render contiguous prefix instead.
  const nearStartCutoff = boundaryCount + siblingCount;
  const nearEndCutoff = totalPages - 1 - boundaryCount - siblingCount;

  const startPages = makeRange(0, boundaryCount - 1);
  const endPages = makeRange(totalPages - boundaryCount, totalPages - 1);

  let middlePages: readonly number[];
  if (currentPage <= nearStartCutoff) {
    // Near-start mode: contiguous prefix of boundary + siblingCount
    // pages (so combined with startPages we show
    // boundaryCount + siblingCount + 1 leading pages total).
    middlePages = makeRange(boundaryCount, boundaryCount + siblingCount);
  } else if (currentPage >= nearEndCutoff) {
    // Near-end mode: mirror — contiguous suffix.
    middlePages = makeRange(
      totalPages - boundaryCount - 1 - siblingCount,
      totalPages - boundaryCount - 1,
    );
  } else {
    // Middle mode: symmetric window around currentPage, clipped by
    // the boundaries.
    const siblingStart = Math.max(currentPage - siblingCount, boundaryCount);
    const siblingEnd = Math.min(currentPage + siblingCount, totalPages - boundaryCount - 1);
    middlePages = makeRange(siblingStart, siblingEnd);
  }

  return mergeWithGapFillers(startPages, middlePages, endPages);
}

/** Inclusive integer range [lo, hi]. Empty when hi < lo. */
function makeRange(lo: number, hi: number): readonly number[] {
  if (hi < lo) return [];
  const out: number[] = [];
  for (let i = lo; i <= hi; i++) out.push(i);
  return out;
}

/**
 * Merge three sorted page-index ranges (start / middle / end) into a
 * single sequence with `'ellipsis'` markers inserted where adjacent
 * numbers have a gap `> 1`. A gap of exactly 1 collapses to the
 * literal missing page number (no ellipsis for a 1-page gap).
 *
 * Out-of-order or duplicate inputs are skipped defensively.
 */
function mergeWithGapFillers(
  startPages: readonly number[],
  middlePages: readonly number[],
  endPages: readonly number[],
): readonly VisiblePageElement[] {
  const result: VisiblePageElement[] = [];

  const append = (page: number) => {
    if (result.length === 0) {
      result.push(page);
      return;
    }
    const prev = result[result.length - 1];
    if (typeof prev !== 'number') {
      result.push(page);
      return;
    }
    if (page <= prev) return; // duplicate or out-of-order
    const gap = page - prev;
    if (gap === 1) {
      result.push(page);
      return;
    }
    if (gap === 2) {
      result.push(prev + 1);
      result.push(page);
      return;
    }
    result.push('ellipsis');
    result.push(page);
  };

  for (const p of startPages) append(p);
  for (const p of middlePages) append(p);
  for (const p of endPages) append(p);

  return result;
}

import type { RowSpec } from '../ir/index.js';

/**
 * Input to `pagePass` (2026-05-24).
 *
 * `rows` is the post-filter + post-sort row order (the canonical
 * pipeline runs `rows → filterPass → sortPass → pagePass`). `page`
 * is 0-based — the SFC's footer renders `page + 1` for display, but
 * the internal contract + handle API stays 0-based for consistency
 * with `Array.prototype.slice` arithmetic.
 *
 * `pageSize <= 0` is treated as "no pagination" — the pass returns
 * the input rows by reference, `currentPage` is `0`, `totalPages` is
 * `1` (one conceptual page containing everything). This makes the
 * pass safe to call unconditionally in the composable; the adapter
 * chooses whether to enable pagination via a separate flag.
 */
export interface PagePassInput {
  readonly rows: readonly RowSpec[];
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Output of `pagePass`.
 *
 * `pagedRows` is a new array sliced via `Array.prototype.slice` when
 * pagination is active; it is identity-equal to `rows` when
 * `pageSize <= 0` (degenerate-input passthrough) so downstream
 * computed memos don't re-run unnecessarily.
 *
 * `currentPage` is the input `page` value clamped into the legal
 * `[0, totalPages - 1]` range — out-of-range inputs collapse to the
 * nearest valid page. This is intentional: a consumer who calls
 * `setPage(99)` when only 3 pages exist sees page 2 (the last valid
 * page), not a blank view. `totalPages === 0` (empty `rows`) yields
 * `currentPage === 0`.
 *
 * `totalRowsAcrossPages` is `rows.length` — exposed so the SFC's
 * footer + status pill can render "page N / M (X rows total)" without
 * threading `rows.length` separately.
 */
export interface PagePassResult {
  readonly pagedRows: readonly RowSpec[];
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalRowsAcrossPages: number;
}

/**
 * Slice rows into a single page of the post-filter + post-sort row
 * order (2026-05-24).
 *
 * Algorithm:
 *
 * 1. `totalRowsAcrossPages = rows.length`.
 * 2. **Degenerate passthrough**. When `pageSize <= 0`, return
 *    `{pagedRows: rows, currentPage: 0, totalPages: 1,
 *     totalRowsAcrossPages}`. The input array is returned by
 *    reference so downstream computed values can identity-check to
 *    skip work.
 * 3. **Empty rows**. When `totalRowsAcrossPages === 0`, return an
 *    empty slice with `totalPages: 0` + `currentPage: 0`.
 * 4. **Page-count derivation**. `totalPages = Math.ceil(totalRows /
 *    pageSize)`.
 * 5. **Page-index clamp**. `currentPage = clamp(page, 0, totalPages -
 *    1)`. Negative inputs collapse to `0`; oversize inputs collapse
 *    to the last valid page. The clamp protects the SFC from "I was
 *    on page 5 and a filter narrowed me to 2 pages" blank-view
 *    situations.
 * 6. **Slice**. `pagedRows = rows.slice(currentPage * pageSize,
 *    (currentPage + 1) * pageSize)`. The end index naturally clamps
 *    via `Array.prototype.slice`'s overflow semantics on the last
 *    (potentially partial) page.
 *
 * **Pure function.** No mutation of inputs.
 */
export function pagePass(input: PagePassInput): PagePassResult {
  const { rows, page, pageSize } = input;
  const totalRowsAcrossPages = rows.length;

  if (pageSize <= 0) {
    return {
      pagedRows: rows,
      currentPage: 0,
      totalPages: 1,
      totalRowsAcrossPages,
    };
  }

  if (totalRowsAcrossPages === 0) {
    return {
      pagedRows: rows,
      currentPage: 0,
      totalPages: 0,
      totalRowsAcrossPages,
    };
  }

  const totalPages = Math.ceil(totalRowsAcrossPages / pageSize);
  const lastValidPage = totalPages - 1;
  const currentPage = page < 0 ? 0 : page > lastValidPage ? lastValidPage : page;

  const start = currentPage * pageSize;
  const pagedRows = rows.slice(start, start + pageSize);

  return {
    pagedRows,
    currentPage,
    totalPages,
    totalRowsAcrossPages,
  };
}

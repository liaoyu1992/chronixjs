/**
 * row counts surfaced to the optional status
 * bar. Adapters compute this from their internal state + pass to the
 * default-text helper or to the consumer's custom renderer.
 */
export interface StatusBarCounts {
  /** Total rows in `props.rows` (includes pinned rows). */
  readonly total: number;
  /**
   * Post-filter row count. Excludes pinned rows because they're
   * synthetic summary rows independent of the user's data filter.
   * Equals `total - pinned.length` when no filter is applied.
   */
  readonly filtered: number;
  /** Currently selected row id count. */
  readonly selected: number;
  /** Current page (0-based). When pagination is disabled, always `0`. */
  readonly page: number;
  /** Page size. `0` when pagination is disabled. */
  readonly pageSize: number;
}

/**
 * default Chinese-locale status-bar summary.
 *
 * Format: "共 N 行，已选 M 行，筛选 K 行" - all three segments are
 * always shown (no conditional omission), so the status bar reads as
 * a complete row-count summary. When sharing the footer row with the
 * pagination cluster (`showPagination` + `showStatusBar` both on), the
 * pagination side hides its own "共 N 行" total label to avoid the
 * duplicate - the status bar is the single source of row counts.
 *
 * Consumers wanting English / other locales pass a custom renderer
 * via the adapter's `status-bar` slot (vue3/vue2) or
 * `statusBarRenderer` prop (react). This default text is the
 * structural fallback only - not theme-able.
 */
export function defaultStatusBarText(counts: StatusBarCounts): string {
  return `共 ${counts.total} 行，已选 ${counts.selected} 行，筛选 ${counts.filtered} 行`;
}

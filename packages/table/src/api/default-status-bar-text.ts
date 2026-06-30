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
 * Format: "N 行 · 已选 M · 过滤后 K" with the latter two segments
 * omitted when not applicable:
 *
 * - `selected === 0` → omit "已选 M".
 * - `filtered === total` → omit "过滤后 K" (nothing was filtered out).
 *
 * Consumers wanting English / other locales pass a custom renderer
 * via the adapter's `status-bar` slot (vue3/vue2) or
 * `statusBarRenderer` prop (react). This default text is the
 * structural fallback only — not theme-able.
 */
export function defaultStatusBarText(counts: StatusBarCounts): string {
  const parts: string[] = [`${counts.total} 行`];
  if (counts.selected > 0) {
    parts.push(`已选 ${counts.selected}`);
  }
  if (counts.filtered !== counts.total) {
    parts.push(`过滤后 ${counts.filtered}`);
  }
  return parts.join(' · ');
}

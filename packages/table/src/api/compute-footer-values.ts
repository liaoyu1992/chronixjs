import type { ColumnSpec } from '../ir/column-spec.js';
import type { RowSpec } from '../ir/row-spec.js';

/**
 * walk `visibleColumns` and call each column's
 * `aggregator(rows)` to produce a per-colId map of aggregate values for
 * the optional sticky footer row. Columns without an `aggregator` are
 * omitted from the output entirely — the adapter renders an empty
 * placeholder cell for them, sized to the column's width, so the footer
 * row stays column-aligned with the body + header strips (
 * Decision C.1).
 *
 * The `rows` input is the post-filter row set (Decision A.1) — the
 * adapter pulls `filteredRows` from the table layout composable so the
 * footer reflects the user's filter selection regardless of which page
 * is currently displayed.
 *
 * **Exception safety**: when an aggregator throws, its colId's entry is
 * set to `null` (the throw is swallowed). Sibling aggregators are not
 * affected. Matches `valueFormatter`'s defensive posture so a
 * single misbehaving aggregator can't crash the whole footer render.
 *
 * **Hidden columns**: the helper does not filter `hide: true` columns
 * itself — the adapter passes the already-visible column list (the same
 * one driving the header + body render). Aggregators on hidden columns
 * are never invoked.
 *
 * Pure function. No DOM. No side effects.
 *
 * chronix-NEW (no original grid exposes a comparable adapter-agnostic
 * helper that walks ColumnSpec[] + filtered rows and returns a per-colId
 * aggregate map; popular grids either couple pinned-bottom rows to a
 * separate row-data API or require consumers to hand-author footer
 * cells).
 */
export function computeFooterValues(
  visibleColumns: readonly ColumnSpec[],
  rows: readonly RowSpec[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const col of visibleColumns) {
    if (col.aggregator == null) continue;
    try {
      out[col.id] = col.aggregator(rows);
    } catch {
      out[col.id] = null;
    }
  }
  return out;
}

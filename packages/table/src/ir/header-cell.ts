/**
 * IR primitive: flattened header cell.
 *
 * `HeaderCell` is the rendering-ready representation of a single
 * cell in the table header. Adapters consume an array of these
 * (one per visible column, optionally one per group at depth > 0)
 * and render each cell at the position resolved by the column
 * layout pass.
 *
 * **Phase 1 contract (flat headers only):** every `HeaderCell` has
 * `depth = 0` and `span = 1`. Nested column groups (Phase ~9) will
 * introduce header cells at `depth > 0` with `span > 1`.
 *
 * **`label` resolution priority:** `column.headerName` ?? `column.field`
 * ?? `column.id`. The adapter resolves this at construction time;
 * `HeaderCell.label` is the post-resolution string.
 *
 * **`classNames`:** state-driven CSS class hints produced by future
 * phases (sort-active / filter-active / header-hover). Empty at
 * Phase 1.
 */
export interface HeaderCell {
  /** The `id` of the column this header cell renders. */
  readonly colId: string;

  /** Resolved display label. */
  readonly label: string;

  /**
   * Header-tree depth. `0` is the leaf row (closest to the body).
   * Phase 1 always emits `0`. Group headers at `depth > 0` arrive
   * in Phase ~9.
   */
  readonly depth: number;

  /**
   * Horizontal span (colspan). Phase 1 always emits `1`. Group
   * headers spanning multiple columns arrive in Phase ~9.
   */
  readonly span: number;

  /**
   * State-driven CSS class names (sort-active / filter-active /
   * hover / etc.). Empty array at Phase 1; populated by feature
   * phases as their state machines come online.
   */
  readonly classNames?: readonly string[];
}

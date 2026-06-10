import type { ColumnSpec } from './column-spec.js';
import type { RowSpec } from './row-spec.js';

/**
 * IR primitive: single-column sort specification.
 *
 * Phase 8 (2026-05-24) ships a single-entry shape; Phase 8.1 will
 * widen the public sort surface to `readonly SortSpec[]` for
 * shift-click multi-column sort. The single-entry shape is the
 * canonical primitive — multi-column sort threads an ordered array of
 * these through `sortPass`.
 *
 * `colId` references a `ColumnSpec.id`. When the referenced column
 * doesn't exist (or has `sortable === false`), `sortPass` returns
 * `{sortedRows: inputRows, rejected: true}` and the SFC silently
 * ignores the spec at the wiring layer.
 */
export interface SortSpec {
  /** The id of the column to sort by. */
  readonly colId: string;
  /** Ascending or descending. Null-last is direction-independent. */
  readonly direction: 'asc' | 'desc';
}

/**
 * Args passed to a `ColumnSpec.comparator` callback when a row pair
 * is being ordered. The comparator receives the post-`valueGetter`
 * values (matching the rendered cell text), plus the two source rows
 * + the column itself for cases where the comparator needs side data
 * (e.g., sort by a sibling field instead of the column's own value).
 *
 * Phase 8 (2026-05-24).
 */
export interface CellComparatorArgs {
  readonly rowA: RowSpec;
  readonly rowB: RowSpec;
  readonly column: ColumnSpec;
}

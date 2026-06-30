import type { ColumnSpec, RowSpec } from '../ir/index.js';

/**
 * Args passed to `ColumnSpec.valueGetter`. .
 *
 * The value-getter runs BEFORE value resolution, so it has access to
 * `row` + `column` but NOT to a resolved `value`. Use the row's
 * `data` record + the column's `field` to extract the source.
 *
 * Args-object pattern is forward-compatible — future context fields
 * (e.g., `rowIndex`, `colIndex`, `data` shortcuts) can land without
 * breaking the signature.
 */
export interface CellValueArgs {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
}

/**
 * Args passed to `ColumnSpec.valueFormatter` + `ColumnSpec.cellClass`
 * (the function form). .
 *
 * The pipeline order is: `valueGetter` → `value` → `valueFormatter` +
 * `cellClass` both receive the post-getter `value`. If `valueGetter`
 * is omitted, the default extraction `row.data[col.field ?? col.id]`
 * runs in its place.
 */
export interface CellRenderArgs {
  readonly value: unknown;
  readonly row: RowSpec;
  readonly column: ColumnSpec;
}

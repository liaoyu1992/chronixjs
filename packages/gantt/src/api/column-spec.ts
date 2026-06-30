import type { RowSpec } from '../ir/row-spec.js';

/**
 * sidebar column descriptor. Relocated to core from the
 * vue3 + react adapter-local copies (`HeaderCellArg`
 * precedent: when the 3rd concrete consumer lands, the primitive
 * moves to core). Used by every adapter's sidebar `<colgroup>` +
 * `<th>` / `<td>` cell render.
 *
 * `key` references a column inside `RowSpec.columns[key]`; `label`
 * is the rendered column header in the top-left pane; `width` is in
 * CSS pixels and contributes additively to the sidebar's total
 * track width.
 *
 * When `group: true`, consecutive rows that share the same value in
 * this column merge into a single cell with `rowspan=N` (vGrouping
 * mode). Rows must be adjacent in the input order; rows with the
 * same value but separated by a different-valued row don't merge.
 * Columns without `group: true` always render one cell per row.
 */
export interface ColumnSpec {
  readonly key: string;
  readonly label: string;
  readonly width: number;
  readonly group?: boolean;
}

/**
 * vGrouping rowspan matrix. For each (column × row) position, decide
 * whether the cell should render with a rowspan (N > 1, this is the
 * first of a merged group), be skipped entirely (0, absorbed by an
 * earlier row's rowspan), or render individually (1).
 *
 * Pure function — exported for unit testing the matrix shape
 * independently of the render path. Verbatim shape across all three
 * adapters (vue3, vue2, react) since consolidated the
 * declaration here.
 */
export function computeRowSpans(
  rows: readonly RowSpec[],
  columns: readonly ColumnSpec[],
): number[][] {
  return columns.map((col) => {
    const spans = new Array<number>(rows.length).fill(1);
    if (!col.group) return spans;
    let r = 0;
    while (r < rows.length) {
      const value = rows[r]!.columns[col.key];
      let endR = r;
      while (endR + 1 < rows.length && rows[endR + 1]!.columns[col.key] === value) {
        spans[endR + 1] = 0;
        endR += 1;
      }
      spans[r] = endR - r + 1;
      r = endR + 1;
    }
    return spans;
  });
}

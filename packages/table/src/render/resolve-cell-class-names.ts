import type { CellRenderArgs } from './cell-args.js';

/**
 * Resolve a cell's CSS class additions from `ColumnSpec.cellClass`.
 * .
 *
 * `cellClass` can take three shapes:
 *
 * - Static `string` → returned as a single-element array.
 * - Static `readonly string[]` → returned as-is.
 * - Function `(args) => string | readonly string[]` → invoked with
 *   the cell's `{value, row, column}` args; result normalized to
 *   array form.
 *
 * The returned array contains ADDITIONS to the cell's structural
 * `cx-table-cell` class. Adapters spread the result into the cell's
 * class list.
 *
 * Returns `[]` when `cellClass` is omitted or the function returns
 * an empty string / array — the adapter falls back to the structural
 * class only.
 *
 * `cellClassRules` (condition-keyed object) is deliberately omitted
 * (per Decision C.1) — the function form covers the same
 * expressive power with one fewer concept.
 */
export function resolveCellClassNames(args: CellRenderArgs): readonly string[] {
  const cellClass = args.column.cellClass;
  if (cellClass == null) return [];
  const raw = typeof cellClass === 'function' ? cellClass(args) : cellClass;
  if (raw == null) return [];
  if (typeof raw === 'string') return raw === '' ? [] : [raw];
  return raw;
}

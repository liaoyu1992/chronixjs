import type { ColumnSpec, RowSpec } from '../ir/index.js';

/**
 * Args to `resolveCellTooltip` (Phase 32, 2026-05-28).
 *
 * Same shape as `CellValueArgs` — the tooltip resolver is logically a
 * sibling resolver to `valueGetter`, just one with a separate
 * precedence cascade.
 */
export interface ResolveCellTooltipInput {
  readonly row: RowSpec;
  readonly column: ColumnSpec;
}

/**
 * Phase 32 (2026-05-28): resolve the tooltip text for a single body
 * cell.
 *
 * Precedence cascade (chronix-NEW helper):
 *
 * 1. `column.tooltipValueGetter({row, column})` — when set, call it and
 *    return the result (whatever the function returns, including `null`
 *    / `undefined` / empty string).
 *
 * 2. `column.tooltipField` — when set, read `row.data[tooltipField]`
 *    and coerce to string via `String(value)` for primitives; objects
 *    return `null` (caller should suppress tooltip — rich content is
 *    out of scope for v1 per Phase 32 Decision G.1).
 *
 * 3. Neither set → `null` (no tooltip).
 *
 * **Return contract:**
 *
 * - `null` / `undefined` / empty string `''` → adapter SHOULD suppress
 *   the popover entirely. (Adapters treat all three identically; the
 *   helper passes through whatever the resolver returns.)
 * - Non-empty string → render as text in the popover.
 *
 * **Pure function.** No DOM. No side effects. The function may invoke
 * the consumer's `tooltipValueGetter`; consumer throws are NOT caught
 * here — the caller (adapter) is responsible for try/catch if needed.
 * In practice we let the throw propagate up to the SFC's render loop
 * since debugging an opaque "no tooltip" is harder than a console
 * error stack trace.
 *
 * **Why a chronix-NEW helper instead of inline adapter logic:** ensures
 * vue3 + vue2 + react all share the same precedence rule. Otherwise
 * the cascading "getter > field > null" rule would be re-implemented
 * 3 times with subtle drift (we've seen this happen with cellClass +
 * valueFormatter in earlier phases).
 */
export function resolveCellTooltip(input: ResolveCellTooltipInput): string | null {
  const { row, column } = input;

  // 1. Custom value getter.
  if (column.tooltipValueGetter != null) {
    const result = column.tooltipValueGetter({ row, column });
    if (result == null || result === '') return null;
    return result;
  }

  // 2. Field-based extraction.
  if (column.tooltipField != null) {
    const value = row.data[column.tooltipField];
    if (value == null) return null;
    if (typeof value === 'string') return value === '' ? null : value;
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return String(value);
    }
    // Objects / arrays / functions / symbols → rich content not
    // supported in v1; return null so the popover is suppressed.
    return null;
  }

  // 3. No opt-in → no tooltip.
  return null;
}

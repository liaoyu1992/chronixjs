import { getCellValue } from '../render/format-cell-value.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

/**
 * Input to `computeColumnNumericExtents` (Phase 98.2, 2026-05-31).
 *
 * - `rows` is the FULL row population to walk — typically the
 *   `props.rows` passed to the table.
 * - `column` carries the `valueGetter` / `field` / `id` lookup
 *   strategy for the per-cell value extraction.
 */
export interface ComputeColumnNumericExtentsInput {
  readonly rows: readonly RowSpec[];
  readonly column: ColumnSpec;
}

/**
 * Numeric extents of a column across the input row population. The
 * `min` and `max` fields are always finite and satisfy `min <= max`.
 */
export interface ColumnNumericExtents {
  readonly min: number;
  readonly max: number;
}

/**
 * Compute the `[min, max]` numeric extents for a column from a row
 * population (Phase 98.2, 2026-05-31). Used by adapters when wiring a
 * Number filter range slider — the slider needs a known value range
 * to map pointer positions to filter values.
 *
 * Algorithm:
 *
 * 1. Walk `rows`; for each row resolve the cell via `getCellValue`
 *    (which honors `column.valueGetter` / `column.field` / `column.id`).
 * 2. Coerce the raw cell value to a finite number: actual `number`
 *    values pass through if `Number.isFinite`; `bigint` is converted
 *    via `Number()` if the result is finite; strings are NOT coerced
 *    (the text-input prefix-syntax parser is the canonical text →
 *    number path; the extents helper only walks data values).
 *    Everything else (objects, null, undefined, NaN, Infinity) is
 *    skipped.
 * 3. Track the running min + max across all finite values.
 * 4. Return `null` if the column yielded zero finite values across
 *    the entire row population.
 *
 * Pure function. No mutation of inputs.
 */
export function computeColumnNumericExtents(
  input: ComputeColumnNumericExtentsInput,
): ColumnNumericExtents | null {
  const { rows, column } = input;
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let seen = false;
  for (const row of rows) {
    const raw = getCellValue({ row, column });
    let n: number | null = null;
    if (typeof raw === 'number') {
      if (Number.isFinite(raw)) n = raw;
    } else if (typeof raw === 'bigint') {
      const coerced = Number(raw);
      if (Number.isFinite(coerced)) n = coerced;
    }
    if (n === null) continue;
    seen = true;
    if (n < min) min = n;
    if (n > max) max = n;
  }
  if (!seen) return null;
  return { min, max };
}

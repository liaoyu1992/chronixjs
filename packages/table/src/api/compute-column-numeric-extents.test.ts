import { describe, expect, it } from 'vitest';

import { computeColumnNumericExtents } from './compute-column-numeric-extents.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

const PRICE_COL: ColumnSpec = { id: 'price', field: 'price' };

describe('computeColumnNumericExtents ', () => {
  it('returns null for empty row population', () => {
    const result = computeColumnNumericExtents({ rows: [], column: PRICE_COL });
    expect(result).toBeNull();
  });

  it('returns null when every row has a non-finite value at the column', () => {
    const rows: readonly RowSpec[] = [
      { id: 'r1', data: { price: null } },
      { id: 'r2', data: { price: undefined } },
      { id: 'r3', data: { price: Number.NaN } },
      { id: 'r4', data: { price: 'abc' } },
      { id: 'r5', data: { price: Number.POSITIVE_INFINITY } },
    ];
    const result = computeColumnNumericExtents({ rows, column: PRICE_COL });
    expect(result).toBeNull();
  });

  it('returns extents over the numeric subset (skips non-numeric rows)', () => {
    const rows: readonly RowSpec[] = [
      { id: 'r1', data: { price: 10 } },
      { id: 'r2', data: { price: 'bogus' } },
      { id: 'r3', data: { price: 25 } },
      { id: 'r4', data: { price: null } },
      { id: 'r5', data: { price: 7 } },
    ];
    const result = computeColumnNumericExtents({ rows, column: PRICE_COL });
    expect(result).toEqual({ min: 7, max: 25 });
  });

  it('single-value column yields { min: v, max: v }', () => {
    const rows: readonly RowSpec[] = [{ id: 'r1', data: { price: 42 } }];
    const result = computeColumnNumericExtents({ rows, column: PRICE_COL });
    expect(result).toEqual({ min: 42, max: 42 });
  });

  it('handles negative + positive values correctly', () => {
    const rows: readonly RowSpec[] = [
      { id: 'r1', data: { price: -15 } },
      { id: 'r2', data: { price: 0 } },
      { id: 'r3', data: { price: 22 } },
      { id: 'r4', data: { price: -100 } },
    ];
    const result = computeColumnNumericExtents({ rows, column: PRICE_COL });
    expect(result).toEqual({ min: -100, max: 22 });
  });

  it('honors column.valueGetter when defined', () => {
    const col: ColumnSpec = {
      id: 'total',
      valueGetter: ({ row }) => {
        const data = row.data as { qty?: number; unitPrice?: number };
        const qty = data.qty ?? 0;
        const unit = data.unitPrice ?? 0;
        return qty * unit;
      },
    };
    const rows: readonly RowSpec[] = [
      { id: 'r1', data: { qty: 2, unitPrice: 10 } },
      { id: 'r2', data: { qty: 5, unitPrice: 3 } },
      { id: 'r3', data: { qty: 1, unitPrice: 99 } },
    ];
    const result = computeColumnNumericExtents({ rows, column: col });
    expect(result).toEqual({ min: 15, max: 99 });
  });
});

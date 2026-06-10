import { describe, expect, it } from 'vitest';

import { computeFooterValues } from './compute-footer-values.js';

import type { ColumnSpec } from '../ir/column-spec.js';
import type { RowSpec } from '../ir/row-spec.js';

const rowsFixture: readonly RowSpec[] = [
  { id: 'r1', data: { qty: 10, price: 5 } },
  { id: 'r2', data: { qty: 20, price: 7 } },
  { id: 'r3', data: { qty: 30, price: 9 } },
];

function sumQty(rows: readonly RowSpec[]): number {
  return rows.reduce((s, r) => s + (typeof r.data['qty'] === 'number' ? r.data['qty'] : 0), 0);
}

function avgPrice(rows: readonly RowSpec[]): number {
  if (rows.length === 0) return 0;
  const sum = rows.reduce(
    (s, r) => s + (typeof r.data['price'] === 'number' ? r.data['price'] : 0),
    0,
  );
  return sum / rows.length;
}

describe('computeFooterValues', () => {
  it('returns an empty map when no column declares an aggregator', () => {
    const cols: readonly ColumnSpec[] = [{ id: 'qty', field: 'qty' }];
    const result = computeFooterValues(cols, rowsFixture);
    expect(result).toEqual({});
  });

  it('returns a single key/value when one column has a sum aggregator', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'qty', field: 'qty', aggregator: sumQty },
      { id: 'price', field: 'price' },
    ];
    const result = computeFooterValues(cols, rowsFixture);
    expect(result).toEqual({ qty: 60 });
  });

  it('aggregates multiple columns independently', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'qty', field: 'qty', aggregator: sumQty },
      { id: 'price', field: 'price', aggregator: avgPrice },
    ];
    const result = computeFooterValues(cols, rowsFixture);
    expect(result).toEqual({ qty: 60, price: 7 });
  });

  it('swallows aggregator throws and writes null for that colId', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'qty', field: 'qty', aggregator: sumQty },
      {
        id: 'price',
        field: 'price',
        aggregator: () => {
          throw new Error('boom');
        },
      },
    ];
    const result = computeFooterValues(cols, rowsFixture);
    expect(result).toEqual({ qty: 60, price: null });
  });

  it('calls aggregator with the input rows array (including empty)', () => {
    let received: readonly RowSpec[] | null = null;
    const cols: readonly ColumnSpec[] = [
      {
        id: 'qty',
        field: 'qty',
        aggregator: (rows) => {
          received = rows;
          return rows.length;
        },
      },
    ];
    const result = computeFooterValues(cols, []);
    expect(result).toEqual({ qty: 0 });
    expect(received).toEqual([]);
  });

  it('only sees the input visibleColumns (caller pre-filters hide:true)', () => {
    const cols: readonly ColumnSpec[] = [{ id: 'qty', field: 'qty', aggregator: sumQty }];
    const result = computeFooterValues(cols, rowsFixture);
    expect(Object.keys(result)).toEqual(['qty']);
    expect(result['qty']).toBe(60);
  });
});

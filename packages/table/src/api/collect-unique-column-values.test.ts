import { describe, expect, it } from 'vitest';

import { collectUniqueColumnValues } from './collect-unique-column-values.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

function row(id: string, data: Record<string, unknown>): RowSpec {
  return { id, data };
}

const statusColumn: ColumnSpec = { id: 'status', field: 'status' };
const qtyColumn: ColumnSpec = { id: 'qty', field: 'qty' };
const flagColumn: ColumnSpec = { id: 'flag', field: 'flag' };
const computedColumn: ColumnSpec = {
  id: 'computed',
  field: 'qty',
  valueGetter: ({ row }) => {
    const q = row.data['qty'];
    return typeof q === 'number' ? q * 2 : null;
  },
};

describe('collectUniqueColumnValues (Phase 43)', () => {
  it('returns empty list for empty rows', () => {
    const out = collectUniqueColumnValues({ rows: [], column: statusColumn });
    expect(out).toEqual({ values: [], truncated: false });
  });

  it('single-row → single entry with count 1', () => {
    const out = collectUniqueColumnValues({
      rows: [row('r1', { status: 'done' })],
      column: statusColumn,
    });
    expect(out.values).toEqual([{ value: 'done', count: 1 }]);
    expect(out.truncated).toBe(false);
  });

  it('multi-row same value → single entry with summed count', () => {
    const rows = [
      row('r1', { status: 'done' }),
      row('r2', { status: 'done' }),
      row('r3', { status: 'done' }),
    ];
    const out = collectUniqueColumnValues({ rows, column: statusColumn });
    expect(out.values).toEqual([{ value: 'done', count: 3 }]);
  });

  it('mixed string values sorted ascending', () => {
    const rows = [
      row('r1', { status: 'gamma' }),
      row('r2', { status: 'alpha' }),
      row('r3', { status: 'beta' }),
    ];
    const out = collectUniqueColumnValues({ rows, column: statusColumn });
    expect(out.values.map((v) => v.value)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('mixed number values sorted ascending', () => {
    const rows = [row('r1', { qty: 30 }), row('r2', { qty: 10 }), row('r3', { qty: 20 })];
    const out = collectUniqueColumnValues({ rows, column: qtyColumn });
    expect(out.values.map((v) => v.value)).toEqual([10, 20, 30]);
  });

  it('mixed boolean values — false before true', () => {
    const rows = [row('r1', { flag: true }), row('r2', { flag: false }), row('r3', { flag: true })];
    const out = collectUniqueColumnValues({ rows, column: flagColumn });
    expect(out.values).toEqual([
      { value: false, count: 1 },
      { value: true, count: 2 },
    ]);
  });

  it('mixed types — numbers → strings → booleans → null ordering', () => {
    const mixedColumn: ColumnSpec = { id: 'mix', field: 'mix' };
    const rows = [
      row('r1', { mix: null }),
      row('r2', { mix: 'gamma' }),
      row('r3', { mix: 42 }),
      row('r4', { mix: true }),
      row('r5', { mix: 'alpha' }),
    ];
    const out = collectUniqueColumnValues({ rows, column: mixedColumn });
    expect(out.values.map((v) => v.value)).toEqual([42, 'alpha', 'gamma', true, null]);
  });

  it('null / undefined / missing cells collapse to a single null entry', () => {
    const rows = [
      row('r1', { status: null }),
      row('r2', { status: undefined }),
      row('r3', {}),
      row('r4', { status: 'done' }),
    ];
    const out = collectUniqueColumnValues({ rows, column: statusColumn });
    expect(out.values.find((v) => v.value === null)?.count).toBe(3);
    expect(out.values.find((v) => v.value === 'done')?.count).toBe(1);
  });

  it('honors valueGetter', () => {
    const rows = [row('r1', { qty: 5 }), row('r2', { qty: 10 }), row('r3', { qty: 5 })];
    const out = collectUniqueColumnValues({ rows, column: computedColumn });
    expect(out.values).toEqual([
      { value: 10, count: 2 },
      { value: 20, count: 1 },
    ]);
  });

  it('maxValues cap stops at limit with truncated: true', () => {
    const rows = Array.from({ length: 20 }, (_, i) => row(`r${i}`, { qty: i }));
    const out = collectUniqueColumnValues({ rows, column: qtyColumn, maxValues: 5 });
    expect(out.values.length).toBe(5);
    expect(out.truncated).toBe(true);
  });

  it('maxValues = 0 returns empty + truncated when rows non-empty', () => {
    const out = collectUniqueColumnValues({
      rows: [row('r1', { qty: 1 })],
      column: qtyColumn,
      maxValues: 0,
    });
    expect(out.values).toEqual([]);
    expect(out.truncated).toBe(true);
  });

  it('Date cells stringify via toISOString', () => {
    const dateColumn: ColumnSpec = { id: 'when', field: 'when' };
    const d1 = new Date('2026-01-01T00:00:00.000Z');
    const d2 = new Date('2026-02-01T00:00:00.000Z');
    const rows = [row('r1', { when: d1 }), row('r2', { when: d2 })];
    const out = collectUniqueColumnValues({ rows, column: dateColumn });
    expect(out.values.map((v) => v.value)).toEqual([d1.toISOString(), d2.toISOString()]);
  });

  it('Bigint cells stringify via String', () => {
    const bigColumn: ColumnSpec = { id: 'big', field: 'big' };
    const rows = [row('r1', { big: 100n }), row('r2', { big: 200n })];
    const out = collectUniqueColumnValues({ rows, column: bigColumn });
    expect(out.values.map((v) => v.value)).toEqual(['100', '200']);
  });

  it('object cells coerce to null entry', () => {
    const objColumn: ColumnSpec = { id: 'obj', field: 'obj' };
    const rows = [
      row('r1', { obj: { nested: 'x' } }),
      row('r2', { obj: { nested: 'y' } }),
      row('r3', { obj: 'plain' }),
    ];
    const out = collectUniqueColumnValues({ rows, column: objColumn });
    expect(out.values.find((v) => v.value === null)?.count).toBe(2);
    expect(out.values.find((v) => v.value === 'plain')?.count).toBe(1);
  });

  it('NaN / Infinity number cells skipped (collapsed to null)', () => {
    const rows = [
      row('r1', { qty: 10 }),
      row('r2', { qty: Number.NaN }),
      row('r3', { qty: Number.POSITIVE_INFINITY }),
      row('r4', { qty: Number.NEGATIVE_INFINITY }),
    ];
    const out = collectUniqueColumnValues({ rows, column: qtyColumn });
    expect(out.values.find((v) => v.value === 10)?.count).toBe(1);
    expect(out.values.find((v) => v.value === null)?.count).toBe(3);
  });

  it('count accuracy across many same-value rows', () => {
    const rows = Array.from({ length: 100 }, (_, i) => row(`r${i}`, { status: 'done' }));
    const out = collectUniqueColumnValues({ rows, column: statusColumn });
    expect(out.values).toEqual([{ value: 'done', count: 100 }]);
  });

  it('string and numeric "0" distinguish (no collapse)', () => {
    const mix: ColumnSpec = { id: 'mix', field: 'mix' };
    const rows = [row('r1', { mix: 0 }), row('r2', { mix: '0' })];
    const out = collectUniqueColumnValues({ rows, column: mix });
    expect(out.values).toEqual([
      { value: 0, count: 1 },
      { value: '0', count: 1 },
    ]);
  });

  it('string sort is lexicographic (locale-naïve)', () => {
    const rows = [
      row('r1', { status: 'b' }),
      row('r2', { status: 'A' }),
      row('r3', { status: 'a' }),
    ];
    const out = collectUniqueColumnValues({ rows, column: statusColumn });
    // 'A' < 'a' < 'b' in JS default string comparison.
    expect(out.values.map((v) => v.value)).toEqual(['A', 'a', 'b']);
  });

  it('cap exactly at limit returns full list with truncated false', () => {
    const rows = Array.from({ length: 5 }, (_, i) => row(`r${i}`, { qty: i }));
    const out = collectUniqueColumnValues({ rows, column: qtyColumn, maxValues: 5 });
    expect(out.values.length).toBe(5);
    expect(out.truncated).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import { computePasteMutations } from './compute-paste-mutations.js';

import type { CellRangeEnvelope } from './compute-cell-range-envelope.js';
import type { ColumnSpec } from '../ir/column-spec.js';
import type { RowSpec } from '../ir/row-spec.js';

const rows: readonly RowSpec[] = [
  { id: 'r1', data: { name: 'Alice', qty: 5, price: 10 } },
  { id: 'r2', data: { name: 'Bob', qty: 7, price: 20 } },
  { id: 'r3', data: { name: 'Carol', qty: 9, price: 30 } },
  { id: 'r4', data: { name: 'Dave', qty: 11, price: 40 } },
  { id: 'r5', data: { name: 'Eve', qty: 13, price: 50 } },
];

const columns: readonly ColumnSpec[] = [
  { id: 'name', field: 'name' },
  { id: 'qty', field: 'qty', type: 'number' },
  { id: 'price', field: 'price', type: 'number' },
];

describe('computePasteMutations', () => {
  it('1×1 paste over 1×1 envelope → single mutation', () => {
    const envelope: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['name'] };
    const mutations = computePasteMutations(envelope, [['Zara']], rows, columns);
    expect(mutations).toEqual([
      { rowId: 'r1', colId: 'name', oldValue: 'Alice', newValue: 'Zara' },
    ]);
  });

  it('1×1 paste over 3×3 envelope → fill-all (9 mutations of the same value)', () => {
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1', 'r2', 'r3'],
      colIds: ['name', 'qty', 'price'],
    };
    const mutations = computePasteMutations(envelope, [['42']], rows, columns);
    expect(mutations).toHaveLength(9);
    for (const m of mutations) {
      // qty + price (number columns) coerce '42' to 42; name passes through as '42'.
      const expected = m.colId === 'name' ? '42' : 42;
      expect(m.newValue).toBe(expected);
    }
  });

  it('3×3 paste over 3×3 envelope (exact match) → 9 mutations', () => {
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1', 'r2', 'r3'],
      colIds: ['name', 'qty', 'price'],
    };
    const grid = [
      ['A1', '1', '11'],
      ['A2', '2', '22'],
      ['A3', '3', '33'],
    ];
    const mutations = computePasteMutations(envelope, grid, rows, columns);
    expect(mutations).toHaveLength(9);
    expect(mutations[0]).toEqual({ rowId: 'r1', colId: 'name', oldValue: 'Alice', newValue: 'A1' });
    expect(mutations[1]).toEqual({ rowId: 'r1', colId: 'qty', oldValue: 5, newValue: 1 });
    expect(mutations[2]).toEqual({ rowId: 'r1', colId: 'price', oldValue: 10, newValue: 11 });
    expect(mutations[8]).toEqual({ rowId: 'r3', colId: 'price', oldValue: 30, newValue: 33 });
  });

  it('3×3 paste over 5×5 envelope → clamp to 3×3 top-left (paste smaller than envelope)', () => {
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1', 'r2', 'r3', 'r4', 'r5'],
      colIds: ['name', 'qty', 'price'], // only 3 cols available; tests pure row-clamp
    };
    const grid = [
      ['A1', '1', '11'],
      ['A2', '2', '22'],
      ['A3', '3', '33'],
    ];
    const mutations = computePasteMutations(envelope, grid, rows, columns);
    // Top-left 3×3 of the 5×3 envelope mutated; bottom 2 rows untouched.
    expect(mutations).toHaveLength(9);
    const touchedRowIds = new Set(mutations.map((m) => m.rowId));
    expect(touchedRowIds).toEqual(new Set(['r1', 'r2', 'r3']));
  });

  it('5×3 paste over 3×3 envelope → clamp to 3×3 top-left (paste larger than envelope)', () => {
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1', 'r2', 'r3'],
      colIds: ['name', 'qty', 'price'],
    };
    const grid = [
      ['A1', '1', '11'],
      ['A2', '2', '22'],
      ['A3', '3', '33'],
      ['A4', '4', '44'], // dropped
      ['A5', '5', '55'], // dropped
    ];
    const mutations = computePasteMutations(envelope, grid, rows, columns);
    expect(mutations).toHaveLength(9);
    const touchedRowIds = new Set(mutations.map((m) => m.rowId));
    expect(touchedRowIds).toEqual(new Set(['r1', 'r2', 'r3']));
  });

  it('no-op dedup: paste value === current value → mutation excluded', () => {
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1', 'r2'],
      colIds: ['name', 'qty'],
    };
    // r1/name 'Alice' + r2/qty 7 → identical to current → no mutation.
    // r1/qty '5' coerces to 5 → matches current → no mutation.
    // r2/name 'Beto' → differs from 'Bob' → mutation.
    const grid = [
      ['Alice', '5'],
      ['Beto', '7'],
    ];
    const mutations = computePasteMutations(envelope, grid, rows, columns);
    expect(mutations).toEqual([{ rowId: 'r2', colId: 'name', oldValue: 'Bob', newValue: 'Beto' }]);
  });

  it("column.type: 'number' — empty string coerces to null", () => {
    const envelope: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    const mutations = computePasteMutations(envelope, [['']], rows, columns);
    expect(mutations).toEqual([{ rowId: 'r1', colId: 'qty', oldValue: 5, newValue: null }]);
  });

  it("column.type: 'number' — non-numeric (e.g. 'abc') silently skips the cell", () => {
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1', 'r2'],
      colIds: ['name', 'qty'],
    };
    // r1/name 'X' → mutation. r1/qty 'abc' → reject → skip.
    // r2/name 'Y' → mutation. r2/qty '99' → mutation.
    const grid = [
      ['X', 'abc'],
      ['Y', '99'],
    ];
    const mutations = computePasteMutations(envelope, grid, rows, columns);
    expect(mutations).toHaveLength(3);
    expect(mutations.find((m) => m.rowId === 'r1' && m.colId === 'qty')).toBeUndefined();
    expect(mutations.find((m) => m.rowId === 'r2' && m.colId === 'qty')).toEqual({
      rowId: 'r2',
      colId: 'qty',
      oldValue: 7,
      newValue: 99,
    });
  });

  it('empty envelope or empty grid → empty mutations array', () => {
    const empty: CellRangeEnvelope = { rowIds: [], colIds: [] };
    expect(computePasteMutations(empty, [['x']], rows, columns)).toEqual([]);
    expect(computePasteMutations({ rowIds: ['r1'], colIds: ['name'] }, [], rows, columns)).toEqual(
      [],
    );
    expect(
      computePasteMutations({ rowIds: ['r1'], colIds: ['name'] }, [[]], rows, columns),
    ).toEqual([]);
  });

  // validator-gate retrofit.
  describe('validator gate', () => {
    const envelope: CellRangeEnvelope = { rowIds: ['r1', 'r2'], colIds: ['qty'] };
    const grid = [['100'], ['-5']];

    it('runValidator undefined → legacy behavior (no validator skip)', () => {
      const mutations = computePasteMutations(envelope, grid, rows, columns);
      expect(mutations).toHaveLength(2);
      expect(mutations[0]?.newValue).toBe(100);
      expect(mutations[1]?.newValue).toBe(-5);
    });

    it('runValidator returning null → cell included', () => {
      const runValidator = () => null;
      const mutations = computePasteMutations(envelope, grid, rows, columns, runValidator);
      expect(mutations).toHaveLength(2);
    });

    it('runValidator returning error on negatives → those cells skipped', () => {
      const runValidator = (_col: ColumnSpec, value: unknown) =>
        typeof value === 'number' && value < 0 ? { reason: 'must be positive' } : null;
      const mutations = computePasteMutations(envelope, grid, rows, columns, runValidator);
      expect(mutations).toHaveLength(1);
      expect(mutations[0]?.rowId).toBe('r1');
      expect(mutations[0]?.newValue).toBe(100);
    });
  });
});

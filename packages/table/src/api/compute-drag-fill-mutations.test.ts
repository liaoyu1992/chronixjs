import { describe, expect, it } from 'vitest';

import { computeDragFillMutations } from './compute-drag-fill-mutations.js';

import type { CellRangeEnvelope } from './compute-cell-range-envelope.js';
import type { ColumnSpec } from '../ir/column-spec.js';
import type { RowSpec } from '../ir/row-spec.js';

const rows: readonly RowSpec[] = [
  { id: 'r1', data: { name: 'Alice', qty: 5, price: 10 } },
  { id: 'r2', data: { name: 'Bob', qty: 7, price: 20 } },
  { id: 'r3', data: { name: 'Carol', qty: 9, price: 30 } },
  { id: 'r4', data: { name: 'Dave', qty: 11, price: 40 } },
  { id: 'r5', data: { name: 'Eve', qty: 13, price: 50 } },
  { id: 'r6', data: { name: 'Frank', qty: 15, price: 60 } },
];

const columns: readonly ColumnSpec[] = [
  { id: 'name', field: 'name' },
  { id: 'qty', field: 'qty', type: 'number' },
  { id: 'price', field: 'price', type: 'number' },
];

describe('computeDragFillMutations', () => {
  it('1-row source fill-down N rows → N - 1 mutations (each new row mirrors the single source row)', () => {
    const source: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    const fill: CellRangeEnvelope = { rowIds: ['r1', 'r2', 'r3', 'r4'], colIds: ['qty'] };
    const out = computeDragFillMutations(source, fill, rows, columns);
    expect(out).toEqual([
      { rowId: 'r2', colId: 'qty', oldValue: 7, newValue: 5 },
      { rowId: 'r3', colId: 'qty', oldValue: 9, newValue: 5 },
      { rowId: 'r4', colId: 'qty', oldValue: 11, newValue: 5 },
    ]);
  });

  it('1-col source fill-right N cols → N - 1 mutations', () => {
    const source: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    const fill: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty', 'price'] };
    // Source r1.qty = 5; target r1.price = 10 (old), coerced 5 (new).
    const out = computeDragFillMutations(source, fill, rows, columns);
    expect(out).toEqual([{ rowId: 'r1', colId: 'price', oldValue: 10, newValue: 5 }]);
  });

  it('2-row source fill-down 4 new rows → 4 mutations with values modulo source (r3 ← r1, r4 ← r2, r5 ← r1, r6 ← r2)', () => {
    const source: CellRangeEnvelope = { rowIds: ['r1', 'r2'], colIds: ['qty'] };
    const fill: CellRangeEnvelope = {
      rowIds: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'],
      colIds: ['qty'],
    };
    const out = computeDragFillMutations(source, fill, rows, columns);
    expect(out).toEqual([
      { rowId: 'r3', colId: 'qty', oldValue: 9, newValue: 5 }, // ← r1
      { rowId: 'r4', colId: 'qty', oldValue: 11, newValue: 7 }, // ← r2
      { rowId: 'r5', colId: 'qty', oldValue: 13, newValue: 5 }, // ← r1
      { rowId: 'r6', colId: 'qty', oldValue: 15, newValue: 7 }, // ← r2
    ]);
  });

  it('fill envelope === source envelope → 0 mutations (no extension)', () => {
    const source: CellRangeEnvelope = { rowIds: ['r1', 'r2'], colIds: ['qty'] };
    const out = computeDragFillMutations(source, source, rows, columns);
    expect(out).toEqual([]);
  });

  it('number-column passthrough coercion: source numeric value → target numeric mutation', () => {
    const source: CellRangeEnvelope = { rowIds: ['r2'], colIds: ['qty'] };
    const fill: CellRangeEnvelope = { rowIds: ['r2', 'r3'], colIds: ['qty'] };
    const out = computeDragFillMutations(source, fill, rows, columns);
    expect(out).toEqual([{ rowId: 'r3', colId: 'qty', oldValue: 9, newValue: 7 }]);
    expect(typeof out[0]!.newValue).toBe('number');
  });

  it('empty source OR empty fill → 0 mutations', () => {
    const emptySource: CellRangeEnvelope = { rowIds: [], colIds: [] };
    const validFill: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    expect(computeDragFillMutations(emptySource, validFill, rows, columns)).toEqual([]);

    const validSource: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    const emptyFill: CellRangeEnvelope = { rowIds: [], colIds: [] };
    expect(computeDragFillMutations(validSource, emptyFill, rows, columns)).toEqual([]);
  });

  it('no-op dedup: fill target cell already === source value → mutation excluded', () => {
    // Source r1.qty = 5. Imagine r3.qty also happens to be 5 already
    // (we mutate rows fixture's r3 below). Use a tailored fixture inline.
    const tailoredRows: readonly RowSpec[] = [
      { id: 'r1', data: { name: 'Alice', qty: 5 } },
      { id: 'r2', data: { name: 'Bob', qty: 7 } },
      { id: 'r3', data: { name: 'Carol', qty: 5 } }, // already 5 → dedup
    ];
    const source: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    const fill: CellRangeEnvelope = { rowIds: ['r1', 'r2', 'r3'], colIds: ['qty'] };
    const out = computeDragFillMutations(source, fill, tailoredRows, columns);
    // Only r2 mutates; r3 deduped (5 → 5).
    expect(out).toEqual([{ rowId: 'r2', colId: 'qty', oldValue: 7, newValue: 5 }]);
  });

  // validator-gate retrofit.
  describe('validator gate', () => {
    const source: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    const fill: CellRangeEnvelope = { rowIds: ['r1', 'r2', 'r3'], colIds: ['qty'] };

    it('runValidator undefined → legacy behavior (validator gate skipped)', () => {
      const mutations = computeDragFillMutations(source, fill, rows, columns);
      expect(mutations).toHaveLength(2);
    });

    it('runValidator returning null → all extension cells included', () => {
      const runValidator = () => null;
      const mutations = computeDragFillMutations(source, fill, rows, columns, runValidator);
      expect(mutations).toHaveLength(2);
    });

    it('runValidator rejecting target row r3 → r3 skipped, r2 kept', () => {
      const runValidator = (_col: ColumnSpec, _value: unknown, row: RowSpec) =>
        row.id === 'r3' ? { reason: 'r3 read-only' } : null;
      const mutations = computeDragFillMutations(source, fill, rows, columns, runValidator);
      expect(mutations).toHaveLength(1);
      expect(mutations[0]?.rowId).toBe('r2');
      expect(mutations[0]?.newValue).toBe(5);
    });
  });

  it('mixed-type fill-right: text-source value into number target column → coerce passes via finite Number(source)', () => {
    // r1.name='Alice' → coerce as number column rejects 'Alice'.
    // r1.qty=5 → fill into r1.notes (text col below) → text passthrough.
    const columnsWithNotes: readonly ColumnSpec[] = [
      { id: 'name', field: 'name' },
      { id: 'qty', field: 'qty', type: 'number' },
      { id: 'notes', field: 'notes' }, // text col
    ];
    const rowsWithNotes: readonly RowSpec[] = [
      { id: 'r1', data: { name: 'Alice', qty: 5, notes: 'hello' } },
    ];
    // Source 1×1 = r1/qty (number=5). Fill 1×2 = r1/qty + r1/notes.
    const source: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    const fill: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty', 'notes'] };
    const out = computeDragFillMutations(source, fill, rowsWithNotes, columnsWithNotes);
    // r1/notes is text-passthrough; coerce accepts source's number 5 verbatim.
    expect(out).toEqual([{ rowId: 'r1', colId: 'notes', oldValue: 'hello', newValue: 5 }]);
  });
});

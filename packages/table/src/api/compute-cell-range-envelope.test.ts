import { describe, expect, it } from 'vitest';

import {
  computeCellRangeEnvelope,
  EMPTY_CELL_RANGE_ENVELOPE,
  type CellRange,
} from './compute-cell-range-envelope.js';

const rows = ['r1', 'r2', 'r3', 'r4', 'r5'];
const cols = ['c1', 'c2', 'c3', 'c4'];

describe('computeCellRangeEnvelope', () => {
  it('anchor === focus → single-cell rectangle (1×1)', () => {
    const range: CellRange = {
      anchor: { rowId: 'r2', colId: 'c2' },
      focus: { rowId: 'r2', colId: 'c2' },
    };
    expect(computeCellRangeEnvelope(range, rows, cols)).toEqual({
      rowIds: ['r2'],
      colIds: ['c2'],
    });
  });

  it('anchor before focus, same row → horizontal stripe (1×N)', () => {
    const range: CellRange = {
      anchor: { rowId: 'r3', colId: 'c1' },
      focus: { rowId: 'r3', colId: 'c4' },
    };
    expect(computeCellRangeEnvelope(range, rows, cols)).toEqual({
      rowIds: ['r3'],
      colIds: ['c1', 'c2', 'c3', 'c4'],
    });
  });

  it('anchor before focus, same col → vertical stripe (M×1)', () => {
    const range: CellRange = {
      anchor: { rowId: 'r1', colId: 'c2' },
      focus: { rowId: 'r4', colId: 'c2' },
    };
    expect(computeCellRangeEnvelope(range, rows, cols)).toEqual({
      rowIds: ['r1', 'r2', 'r3', 'r4'],
      colIds: ['c2'],
    });
  });

  it('anchor top-left → focus bottom-right → MxN rectangle', () => {
    const range: CellRange = {
      anchor: { rowId: 'r2', colId: 'c2' },
      focus: { rowId: 'r4', colId: 'c4' },
    };
    expect(computeCellRangeEnvelope(range, rows, cols)).toEqual({
      rowIds: ['r2', 'r3', 'r4'],
      colIds: ['c2', 'c3', 'c4'],
    });
  });

  it('anchor bottom-right → focus top-left → same MxN rectangle (order-independent)', () => {
    const range: CellRange = {
      anchor: { rowId: 'r4', colId: 'c4' },
      focus: { rowId: 'r2', colId: 'c2' },
    };
    expect(computeCellRangeEnvelope(range, rows, cols)).toEqual({
      rowIds: ['r2', 'r3', 'r4'],
      colIds: ['c2', 'c3', 'c4'],
    });
  });

  it('stale anchor (rowId not in displayedRowIds) → empty envelope', () => {
    const range: CellRange = {
      anchor: { rowId: 'r-deleted', colId: 'c2' },
      focus: { rowId: 'r2', colId: 'c3' },
    };
    expect(computeCellRangeEnvelope(range, rows, cols)).toBe(EMPTY_CELL_RANGE_ENVELOPE);
  });

  it('stale colId in focus → empty envelope', () => {
    const range: CellRange = {
      anchor: { rowId: 'r1', colId: 'c2' },
      focus: { rowId: 'r2', colId: 'c-removed' },
    };
    expect(computeCellRangeEnvelope(range, rows, cols)).toBe(EMPTY_CELL_RANGE_ENVELOPE);
  });

  it('empty displayedRowIds / displayedColIds → empty envelope', () => {
    const range: CellRange = {
      anchor: { rowId: 'r1', colId: 'c1' },
      focus: { rowId: 'r2', colId: 'c2' },
    };
    expect(computeCellRangeEnvelope(range, [], cols)).toBe(EMPTY_CELL_RANGE_ENVELOPE);
    expect(computeCellRangeEnvelope(range, rows, [])).toBe(EMPTY_CELL_RANGE_ENVELOPE);
  });
});

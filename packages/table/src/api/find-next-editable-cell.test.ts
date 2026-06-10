import { describe, expect, it } from 'vitest';

import { findNextEditableCell } from './find-next-editable-cell.js';

import type { ColumnSpec } from '../ir/index.js';

const colA: ColumnSpec = { id: 'a', field: 'a', editable: true };
const colB: ColumnSpec = { id: 'b', field: 'b' }; // non-editable
const colC: ColumnSpec = { id: 'c', field: 'c', editable: true };
const colD: ColumnSpec = { id: 'd', field: 'd', editable: true, hide: true }; // hidden
const colE: ColumnSpec = { id: 'e', field: 'e', editable: true };

const allCols = [colA, colB, colC, colD, colE];
const rows = ['r1', 'r2', 'r3'];

describe('findNextEditableCell', () => {
  it('forward → next editable column in same row', () => {
    expect(findNextEditableCell('r2', 'a', rows, allCols, 'forward')).toEqual({
      rowId: 'r2',
      colId: 'c',
    });
  });

  it('forward → skips non-editable columns', () => {
    // From column 'a' (idx 0), skips 'b' (non-editable) to land on 'c'.
    expect(findNextEditableCell('r1', 'a', rows, allCols, 'forward')).toEqual({
      rowId: 'r1',
      colId: 'c',
    });
  });

  it('forward → skips hide:true columns', () => {
    // From 'c' (idx 2), skips 'd' (hide:true) to land on 'e'.
    expect(findNextEditableCell('r1', 'c', rows, allCols, 'forward')).toEqual({
      rowId: 'r1',
      colId: 'e',
    });
  });

  it('forward → wraps into next displayed row when current row exhausted (Decision B.1)', () => {
    // From last editable column of r1, jumps to r2's first editable column.
    expect(findNextEditableCell('r1', 'e', rows, allCols, 'forward')).toEqual({
      rowId: 'r2',
      colId: 'a',
    });
  });

  it('forward at last editable cell of last displayed row → null (Decision A.1 close)', () => {
    expect(findNextEditableCell('r3', 'e', rows, allCols, 'forward')).toBeNull();
  });

  it('backward → previous editable column in same row + previous row last editable when exhausted', () => {
    // Same-row backward: from 'c' on r2 → 'a' (skipping non-editable 'b').
    expect(findNextEditableCell('r2', 'c', rows, allCols, 'backward')).toEqual({
      rowId: 'r2',
      colId: 'a',
    });
    // Row-exhaustion backward: from 'a' on r2 → r1's LAST editable column ('e').
    expect(findNextEditableCell('r2', 'a', rows, allCols, 'backward')).toEqual({
      rowId: 'r1',
      colId: 'e',
    });
    // Top of table → null.
    expect(findNextEditableCell('r1', 'a', rows, allCols, 'backward')).toBeNull();
  });

  it('defensive: missing ids / empty inputs / no editable columns → null', () => {
    expect(findNextEditableCell('nope', 'a', rows, allCols, 'forward')).toBeNull();
    expect(findNextEditableCell('r1', 'nope', rows, allCols, 'forward')).toBeNull();
    expect(findNextEditableCell('r1', 'a', [], allCols, 'forward')).toBeNull();
    expect(findNextEditableCell('r1', 'a', rows, [], 'forward')).toBeNull();
    const noEditable: ColumnSpec[] = [
      { id: 'x', field: 'x' },
      { id: 'y', field: 'y' },
    ];
    expect(findNextEditableCell('r1', 'x', rows, noEditable, 'forward')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';

import { computeNextActiveCell } from './compute-next-active-cell.js';

import type { ColumnSpec } from '../ir/index.js';

const cols: readonly ColumnSpec[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
const rows: readonly string[] = ['r1', 'r2', 'r3', 'r4', 'r5'];

describe('computeNextActiveCell', () => {
  it('returns null when displayedRowIds is empty for any direction', () => {
    expect(computeNextActiveCell('r1', 'a', [], cols, 'down', 10)).toBeNull();
    expect(computeNextActiveCell('r1', 'a', [], cols, 'table-end', 10)).toBeNull();
  });

  it('returns null when visibleColumns is empty for any direction', () => {
    expect(computeNextActiveCell('r1', 'a', rows, [], 'right', 10)).toBeNull();
  });

  it('initializes to top-left when currentRow + currentCol are both null', () => {
    expect(computeNextActiveCell(null, null, rows, cols, 'down', 10)).toEqual({
      rowId: 'r1',
      colId: 'a',
    });
    expect(computeNextActiveCell(null, null, rows, cols, 'up', 10)).toEqual({
      rowId: 'r1',
      colId: 'a',
    });
  });

  it('returns null when right-pressing from the last column (C.1 edge stop)', () => {
    expect(computeNextActiveCell('r2', 'd', rows, cols, 'right', 10)).toBeNull();
  });

  it('returns null when left-pressing from the first column (C.1 edge stop)', () => {
    expect(computeNextActiveCell('r2', 'a', rows, cols, 'left', 10)).toBeNull();
  });

  it('returns null when up-pressing from the first row (C.1 edge stop)', () => {
    expect(computeNextActiveCell('r1', 'b', rows, cols, 'up', 10)).toBeNull();
  });

  it('returns null when down-pressing from the last row (C.1 edge stop)', () => {
    expect(computeNextActiveCell('r5', 'b', rows, cols, 'down', 10)).toBeNull();
  });

  it('moves right one column from a middle column', () => {
    expect(computeNextActiveCell('r2', 'b', rows, cols, 'right', 10)).toEqual({
      rowId: 'r2',
      colId: 'c',
    });
  });

  it('moves down one row from a middle row', () => {
    expect(computeNextActiveCell('r2', 'b', rows, cols, 'down', 10)).toEqual({
      rowId: 'r3',
      colId: 'b',
    });
  });

  it('home jumps to first column same row', () => {
    expect(computeNextActiveCell('r3', 'd', rows, cols, 'home', 10)).toEqual({
      rowId: 'r3',
      colId: 'a',
    });
  });

  it('end jumps to last column same row', () => {
    expect(computeNextActiveCell('r3', 'a', rows, cols, 'end', 10)).toEqual({
      rowId: 'r3',
      colId: 'd',
    });
  });

  it('home returns null when already on first column', () => {
    expect(computeNextActiveCell('r2', 'a', rows, cols, 'home', 10)).toBeNull();
  });

  it('end returns null when already on last column', () => {
    expect(computeNextActiveCell('r2', 'd', rows, cols, 'end', 10)).toBeNull();
  });

  it('page-down jumps by pageRowCount, clamping to the last row', () => {
    expect(computeNextActiveCell('r1', 'b', rows, cols, 'page-down', 2)).toEqual({
      rowId: 'r3',
      colId: 'b',
    });
    expect(computeNextActiveCell('r4', 'b', rows, cols, 'page-down', 3)).toEqual({
      rowId: 'r5',
      colId: 'b',
    });
  });

  it('page-up jumps by pageRowCount, clamping to the first row', () => {
    expect(computeNextActiveCell('r5', 'b', rows, cols, 'page-up', 2)).toEqual({
      rowId: 'r3',
      colId: 'b',
    });
    expect(computeNextActiveCell('r2', 'b', rows, cols, 'page-up', 5)).toEqual({
      rowId: 'r1',
      colId: 'b',
    });
  });

  it('table-start jumps to top-left from anywhere; null when already there', () => {
    expect(computeNextActiveCell('r3', 'c', rows, cols, 'table-start', 10)).toEqual({
      rowId: 'r1',
      colId: 'a',
    });
    expect(computeNextActiveCell('r1', 'a', rows, cols, 'table-start', 10)).toBeNull();
  });

  it('table-end jumps to bottom-right from anywhere; null when already there', () => {
    expect(computeNextActiveCell('r2', 'b', rows, cols, 'table-end', 10)).toEqual({
      rowId: 'r5',
      colId: 'd',
    });
    expect(computeNextActiveCell('r5', 'd', rows, cols, 'table-end', 10)).toBeNull();
  });

  it('falls back to top-left when current cell is not in displayed window (filter/sort mid-nav)', () => {
    // Current cell `rXX` is not in the displayed window; helper resets.
    expect(computeNextActiveCell('rXX', 'a', rows, cols, 'right', 10)).toEqual({
      rowId: 'r1',
      colId: 'a',
    });
    expect(computeNextActiveCell('r1', 'zz', rows, cols, 'down', 10)).toEqual({
      rowId: 'r1',
      colId: 'a',
    });
  });

  it('page-up returns null when on first row, page-down returns null when on last row', () => {
    expect(computeNextActiveCell('r1', 'b', rows, cols, 'page-up', 3)).toBeNull();
    expect(computeNextActiveCell('r5', 'b', rows, cols, 'page-down', 3)).toBeNull();
  });
});

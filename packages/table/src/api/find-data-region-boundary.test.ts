import { describe, expect, it } from 'vitest';

import { findDataRegionBoundary, type CellValueFn } from './find-data-region-boundary.js';

import type { ColumnSpec } from '../ir/index.js';

const cols: readonly ColumnSpec[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
const rows: readonly string[] = ['r1', 'r2', 'r3', 'r4', 'r5'];

/**
 * Build a `cellValueFn` from an explicit data map.
 *
 * Keys are `${rowId}/${colId}`. Absent keys treated as empty.
 */
function makeCellValueFn(data: Record<string, unknown>): CellValueFn {
  return (rowId, colId) => data[`${rowId}/${colId}`];
}

describe('findDataRegionBoundary', () => {
  it('returns starting cell when displayedRowIds is empty', () => {
    const fn = makeCellValueFn({});
    expect(findDataRegionBoundary('r1', 'a', 'down', [], cols, fn)).toEqual({
      rowId: 'r1',
      colId: 'a',
    });
  });

  it('returns starting cell when visibleColumns is empty', () => {
    const fn = makeCellValueFn({});
    expect(findDataRegionBoundary('r1', 'a', 'right', rows, [], fn)).toEqual({
      rowId: 'r1',
      colId: 'a',
    });
  });

  it("returns starting cell when starting cell isn't in displayed rows/cols", () => {
    const fn = makeCellValueFn({});
    expect(findDataRegionBoundary('rZ', 'a', 'down', rows, cols, fn)).toEqual({
      rowId: 'rZ',
      colId: 'a',
    });
  });

  it('returns starting cell when first step is out of bounds (top edge + direction up)', () => {
    const fn = makeCellValueFn({ 'r1/a': 'X' });
    expect(findDataRegionBoundary('r1', 'a', 'up', rows, cols, fn)).toEqual({
      rowId: 'r1',
      colId: 'a',
    });
  });

  it('non-empty start with all filled below → boundary = last row (table edge)', () => {
    const fn = makeCellValueFn({
      'r1/a': 'X',
      'r2/a': 'X',
      'r3/a': 'X',
      'r4/a': 'X',
      'r5/a': 'X',
    });
    expect(findDataRegionBoundary('r1', 'a', 'down', rows, cols, fn)).toEqual({
      rowId: 'r5',
      colId: 'a',
    });
  });

  it('non-empty start with immediate empty below → no movement', () => {
    const fn = makeCellValueFn({ 'r1/a': 'X' });
    expect(findDataRegionBoundary('r1', 'a', 'down', rows, cols, fn)).toEqual({
      rowId: 'r1',
      colId: 'a',
    });
  });

  it('non-empty start with 3 filled then empty → boundary = 3rd filled cell', () => {
    const fn = makeCellValueFn({
      'r1/a': 'X',
      'r2/a': 'X',
      'r3/a': 'X',
      // r4/a empty
      'r5/a': 'X',
    });
    expect(findDataRegionBoundary('r1', 'a', 'down', rows, cols, fn)).toEqual({
      rowId: 'r3',
      colId: 'a',
    });
  });

  it('empty start with first-next non-empty → boundary = that first non-empty', () => {
    const fn = makeCellValueFn({ 'r3/a': 'X' });
    expect(findDataRegionBoundary('r1', 'a', 'down', rows, cols, fn)).toEqual({
      rowId: 'r3',
      colId: 'a',
    });
  });

  it('empty start with all empties → boundary = table edge', () => {
    const fn = makeCellValueFn({});
    expect(findDataRegionBoundary('r1', 'a', 'down', rows, cols, fn)).toEqual({
      rowId: 'r5',
      colId: 'a',
    });
  });

  it('direction right works the same as direction down for horizontal scans', () => {
    const fn = makeCellValueFn({
      'r1/a': 'X',
      'r1/b': 'X',
      // r1/c empty
      'r1/d': 'X',
    });
    expect(findDataRegionBoundary('r1', 'a', 'right', rows, cols, fn)).toEqual({
      rowId: 'r1',
      colId: 'b',
    });
  });

  it('direction up walks upward correctly', () => {
    const fn = makeCellValueFn({
      'r3/a': 'X',
      'r4/a': 'X',
      'r5/a': 'X',
    });
    // Starting non-empty at r5, walking up; all cells above to r3 filled,
    // r2 empty → boundary = r3.
    expect(findDataRegionBoundary('r5', 'a', 'up', rows, cols, fn)).toEqual({
      rowId: 'r3',
      colId: 'a',
    });
  });

  it('direction left walks leftward correctly (non-empty edge stop)', () => {
    const fn = makeCellValueFn({ 'r1/c': 'X', 'r1/d': 'X' });
    // Starting non-empty at r1/d, walking left; r1/c filled, r1/b empty →
    // boundary = r1/c.
    expect(findDataRegionBoundary('r1', 'd', 'left', rows, cols, fn)).toEqual({
      rowId: 'r1',
      colId: 'c',
    });
  });

  it('treats `0` and `false` as non-empty (Excel semantics)', () => {
    const fn = makeCellValueFn({ 'r1/a': 0, 'r2/a': false, 'r3/a': '' });
    // Starting at r1 (value=0, non-empty), walk down; r2 (value=false,
    // non-empty), r3 (value='', empty) → boundary = r2.
    expect(findDataRegionBoundary('r1', 'a', 'down', rows, cols, fn)).toEqual({
      rowId: 'r2',
      colId: 'a',
    });
  });

  it('treats whitespace-only string as non-empty', () => {
    const fn = makeCellValueFn({ 'r1/a': ' ', 'r2/a': '\t' });
    // Starting at r1 (value=' '), walk down; r2 (value='\t', non-empty),
    // r3 absent (empty) → boundary = r2.
    expect(findDataRegionBoundary('r1', 'a', 'down', rows, cols, fn)).toEqual({
      rowId: 'r2',
      colId: 'a',
    });
  });
});

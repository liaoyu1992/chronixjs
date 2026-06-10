import { describe, expect, it } from 'vitest';

import {
  DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX,
  computeColumnReorder,
} from './compute-column-reorder.js';

import type { ColumnSpec } from '../ir/index.js';

function makeColumns(ids: readonly string[]): readonly ColumnSpec[] {
  return ids.map((id) => ({ id, field: id }));
}

describe('computeColumnReorder', () => {
  it('moves the first column to before the last column', () => {
    const before = makeColumns(['a', 'b', 'c', 'd']);
    const after = computeColumnReorder(before, 'a', 'd', 'before');
    expect(after.map((c) => c.id)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves the last column to before the first column', () => {
    const before = makeColumns(['a', 'b', 'c', 'd']);
    const after = computeColumnReorder(before, 'd', 'a', 'before');
    expect(after.map((c) => c.id)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('moves a middle column to after another middle column', () => {
    const before = makeColumns(['a', 'b', 'c', 'd', 'e']);
    const after = computeColumnReorder(before, 'b', 'd', 'after');
    expect(after.map((c) => c.id)).toEqual(['a', 'c', 'd', 'b', 'e']);
  });

  it('returns the input reference when moving a column to its own position', () => {
    const before = makeColumns(['a', 'b', 'c']);
    const after = computeColumnReorder(before, 'b', 'b', 'before');
    expect(after).toBe(before);
  });

  it('returns the input reference when the move would land at the current position (before-adjacent)', () => {
    // b is already immediately after a → "before b" of a is a no-op.
    const before = makeColumns(['a', 'b', 'c']);
    const after = computeColumnReorder(before, 'a', 'b', 'before');
    expect(after).toBe(before);
  });

  it('returns the input reference when the move would land at the current position (after-adjacent)', () => {
    // a is already immediately before b → "after a" of b is a no-op.
    const before = makeColumns(['a', 'b', 'c']);
    const after = computeColumnReorder(before, 'b', 'a', 'after');
    expect(after).toBe(before);
  });

  it('returns the input reference for non-existent moved id', () => {
    const before = makeColumns(['a', 'b', 'c']);
    const after = computeColumnReorder(before, 'missing', 'b', 'before');
    expect(after).toBe(before);
  });

  it('returns the input reference for non-existent target id', () => {
    const before = makeColumns(['a', 'b', 'c']);
    const after = computeColumnReorder(before, 'a', 'missing', 'before');
    expect(after).toBe(before);
  });

  it('preserves column object identity for non-moved columns', () => {
    const before = makeColumns(['a', 'b', 'c', 'd']);
    const after = computeColumnReorder(before, 'a', 'd', 'before');
    // 'b' / 'c' / 'd' should be the same object references.
    expect(after[0]).toBe(before[1]);
    expect(after[1]).toBe(before[2]);
    expect(after[2]).toBe(before[0]);
    expect(after[3]).toBe(before[3]);
  });
});

describe('DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX', () => {
  it('exports a positive integer matching the drag-vs-click convention (5px)', () => {
    expect(DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX).toBe(5);
    expect(Number.isInteger(DEFAULT_COLUMN_MOVE_DRAG_THRESHOLD_PX)).toBe(true);
  });
});

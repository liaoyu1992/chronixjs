import { describe, expect, it } from 'vitest';

import { EMPTY_PINNED_COLS_RESULT, pinnedColsPass } from './pinned-cols-pass.js';

import type { ColumnSpec } from '../ir/index.js';

function widths(map: Record<string, number>): Readonly<Record<string, number>> {
  return map;
}

describe('pinnedColsPass', () => {
  it('returns the empty result (with empty center list) when no columns are visible', () => {
    const result = pinnedColsPass({
      visibleColumns: [],
      widthByColId: widths({}),
    });
    expect(result.leftOffsetByColId).toEqual({});
    expect(result.rightOffsetByColId).toEqual({});
    expect(result.leftPinnedTotalWidth).toBe(0);
    expect(result.rightPinnedTotalWidth).toBe(0);
    expect(result.leftPinnedColIds).toEqual([]);
    expect(result.centerColIds).toEqual([]);
    expect(result.rightPinnedColIds).toEqual([]);
  });

  it('classifies all columns into center when no pinned hint is set', () => {
    const cols: ColumnSpec[] = [
      { id: 'a', width: 80 },
      { id: 'b', width: 120 },
      { id: 'c', width: 100, pinned: null },
    ];
    const result = pinnedColsPass({
      visibleColumns: cols,
      widthByColId: widths({ a: 80, b: 120, c: 100 }),
    });
    expect(result.centerColIds).toEqual(['a', 'b', 'c']);
    expect(result.leftPinnedColIds).toEqual([]);
    expect(result.rightPinnedColIds).toEqual([]);
    expect(result.leftPinnedTotalWidth).toBe(0);
    expect(result.rightPinnedTotalWidth).toBe(0);
    expect(result.leftOffsetByColId).toEqual({});
    expect(result.rightOffsetByColId).toEqual({});
  });

  it('computes cumulative offsets for two left-pinned columns in author order', () => {
    const cols: ColumnSpec[] = [
      { id: 'id', width: 80, pinned: 'left' },
      { id: 'name', width: 120, pinned: 'left' },
      { id: 'qty', width: 100 },
      { id: 'price', width: 110 },
    ];
    const result = pinnedColsPass({
      visibleColumns: cols,
      widthByColId: widths({ id: 80, name: 120, qty: 100, price: 110 }),
    });
    expect(result.leftPinnedColIds).toEqual(['id', 'name']);
    expect(result.centerColIds).toEqual(['qty', 'price']);
    expect(result.rightPinnedColIds).toEqual([]);
    expect(result.leftOffsetByColId).toEqual({ id: 0, name: 80 });
    expect(result.rightOffsetByColId).toEqual({});
    expect(result.leftPinnedTotalWidth).toBe(200);
    expect(result.rightPinnedTotalWidth).toBe(0);
  });

  it('computes cumulative right offsets in reverse author order', () => {
    const cols: ColumnSpec[] = [
      { id: 'a', width: 100 },
      { id: 'b', width: 120, pinned: 'right' },
      { id: 'c', width: 80, pinned: 'right' },
    ];
    const result = pinnedColsPass({
      visibleColumns: cols,
      widthByColId: widths({ a: 100, b: 120, c: 80 }),
    });
    expect(result.rightPinnedColIds).toEqual(['b', 'c']);
    expect(result.centerColIds).toEqual(['a']);
    expect(result.leftPinnedColIds).toEqual([]);
    // c is rightmost → offset 0; b sits to c's left → offset = c.width (80).
    expect(result.rightOffsetByColId).toEqual({ b: 80, c: 0 });
    expect(result.rightPinnedTotalWidth).toBe(200);
    expect(result.leftPinnedTotalWidth).toBe(0);
  });

  it('handles all three zones simultaneously with non-contiguous author order', () => {
    const cols: ColumnSpec[] = [
      { id: 'id', width: 60, pinned: 'left' },
      { id: 'name', width: 140, pinned: 'left' },
      { id: 'qty', width: 100 },
      { id: 'price', width: 110 },
      { id: 'status', width: 120 },
      { id: 'actions', width: 80, pinned: 'right' },
    ];
    const result = pinnedColsPass({
      visibleColumns: cols,
      widthByColId: widths({ id: 60, name: 140, qty: 100, price: 110, status: 120, actions: 80 }),
    });
    expect(result.leftPinnedColIds).toEqual(['id', 'name']);
    expect(result.centerColIds).toEqual(['qty', 'price', 'status']);
    expect(result.rightPinnedColIds).toEqual(['actions']);
    expect(result.leftOffsetByColId).toEqual({ id: 0, name: 60 });
    expect(result.rightOffsetByColId).toEqual({ actions: 0 });
    expect(result.leftPinnedTotalWidth).toBe(200);
    expect(result.rightPinnedTotalWidth).toBe(80);
  });

  it('preserves author order within each zone when a pinned column appears AFTER a center column', () => {
    const cols: ColumnSpec[] = [
      { id: 'qty', width: 100 },
      { id: 'name', width: 140, pinned: 'left' },
      { id: 'price', width: 110 },
      { id: 'id', width: 60, pinned: 'left' },
    ];
    const result = pinnedColsPass({
      visibleColumns: cols,
      widthByColId: widths({ qty: 100, name: 140, price: 110, id: 60 }),
    });
    // 'name' appears at visible index 1, 'id' at visible index 3 — left zone
    // preserves that order: name first, then id.
    expect(result.leftPinnedColIds).toEqual(['name', 'id']);
    expect(result.centerColIds).toEqual(['qty', 'price']);
    expect(result.leftOffsetByColId).toEqual({ name: 0, id: 140 });
    expect(result.leftPinnedTotalWidth).toBe(200);
  });

  it('treats a missing width as 0 (defensive — author skipped the col between passes)', () => {
    const cols: ColumnSpec[] = [
      { id: 'a', width: 80, pinned: 'left' },
      { id: 'b', width: 120, pinned: 'left' },
    ];
    const result = pinnedColsPass({
      visibleColumns: cols,
      // 'a' missing from widthByColId — pass treats as 0.
      widthByColId: widths({ b: 120 }),
    });
    expect(result.leftOffsetByColId).toEqual({ a: 0, b: 0 });
    expect(result.leftPinnedTotalWidth).toBe(120);
  });

  it('exports an EMPTY_PINNED_COLS_RESULT constant matching the shape of an empty run', () => {
    expect(EMPTY_PINNED_COLS_RESULT.leftOffsetByColId).toEqual({});
    expect(EMPTY_PINNED_COLS_RESULT.rightOffsetByColId).toEqual({});
    expect(EMPTY_PINNED_COLS_RESULT.leftPinnedColIds).toEqual([]);
    expect(EMPTY_PINNED_COLS_RESULT.centerColIds).toEqual([]);
    expect(EMPTY_PINNED_COLS_RESULT.rightPinnedColIds).toEqual([]);
    expect(EMPTY_PINNED_COLS_RESULT.leftPinnedTotalWidth).toBe(0);
    expect(EMPTY_PINNED_COLS_RESULT.rightPinnedTotalWidth).toBe(0);
  });
});

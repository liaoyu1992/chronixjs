import { describe, expect, it } from 'vitest';

import { getRowDropTarget } from './get-row-drop-target.js';

import type { RowRect } from './get-row-drop-target.js';

const rect = (top: number, bottom: number): RowRect => ({ top, bottom });

describe('getRowDropTarget ', () => {
  it('returns null when pointer is above all row rects', () => {
    const rects = new Map<string, RowRect>([
      ['r1', rect(100, 130)],
      ['r2', rect(130, 160)],
    ]);
    const out = getRowDropTarget(50, rects, 'unrelated');
    expect(out).toBeNull();
  });

  it('returns null when pointer is below all row rects', () => {
    const rects = new Map<string, RowRect>([
      ['r1', rect(100, 130)],
      ['r2', rect(130, 160)],
    ]);
    const out = getRowDropTarget(200, rects, 'unrelated');
    expect(out).toBeNull();
  });

  it('upper half of row → position "above"', () => {
    const rects = new Map<string, RowRect>([['r1', rect(100, 130)]]);
    // Midpoint = 115; pointerY = 110 < midpoint → above.
    const out = getRowDropTarget(110, rects, 'unrelated');
    expect(out).toEqual({ targetRowId: 'r1', position: 'above' });
  });

  it('lower half of row → position "below"', () => {
    const rects = new Map<string, RowRect>([['r1', rect(100, 130)]]);
    // Midpoint = 115; pointerY = 120 >= midpoint → below.
    const out = getRowDropTarget(120, rects, 'unrelated');
    expect(out).toEqual({ targetRowId: 'r1', position: 'below' });
  });

  it('pointer exactly at midpoint → position "below" (gte midpoint)', () => {
    const rects = new Map<string, RowRect>([['r1', rect(100, 130)]]);
    const out = getRowDropTarget(115, rects, 'unrelated');
    expect(out).toEqual({ targetRowId: 'r1', position: 'below' });
  });

  it('excludeRowId — pointer in excluded row with no other overlap → null', () => {
    const rects = new Map<string, RowRect>([
      ['r1', rect(100, 130)],
      ['r2', rect(140, 170)],
    ]);
    const out = getRowDropTarget(115, rects, 'r1');
    expect(out).toBeNull();
  });

  it('excludeRowId — pointer in excluded rect overlapping with another → returns the other', () => {
    // Two rows with overlapping rects (unusual but defensive — test the
    // skip-then-continue branch). Map iteration order preserves
    // insertion order in JS.
    const rects = new Map<string, RowRect>([
      ['r1', rect(100, 130)],
      ['r2', rect(110, 140)],
    ]);
    const out = getRowDropTarget(115, rects, 'r1');
    expect(out?.targetRowId).toBe('r2');
  });

  it('empty rect map → null', () => {
    const rects = new Map<string, RowRect>();
    const out = getRowDropTarget(100, rects, 'unrelated');
    expect(out).toBeNull();
  });

  it('pointer in gap between rows → null', () => {
    const rects = new Map<string, RowRect>([
      ['r1', rect(100, 130)],
      ['r2', rect(150, 180)],
    ]);
    const out = getRowDropTarget(140, rects, 'unrelated');
    expect(out).toBeNull();
  });

  it('pinnedRowIds option excludes pinned rows from hit test', () => {
    const rects = new Map<string, RowRect>([
      ['pinnedTop', rect(0, 30)],
      ['body', rect(30, 60)],
    ]);
    const pinnedRowIds = new Set(['pinnedTop']);
    // Pointer at 15 is inside pinnedTop's rect but the pinned row is
    // skipped → falls through to body which doesn't contain 15 → null.
    const out = getRowDropTarget(15, rects, 'unrelated', { pinnedRowIds });
    expect(out).toBeNull();
  });

  it('pinnedRowIds empty Set → identical to omitting option', () => {
    const rects = new Map<string, RowRect>([['r1', rect(100, 130)]]);
    const outWith = getRowDropTarget(110, rects, 'unrelated', { pinnedRowIds: new Set() });
    const outWithout = getRowDropTarget(110, rects, 'unrelated');
    expect(outWith).toEqual(outWithout);
  });

  it('excludeRowId + pinnedRowIds both filter; pointer hits next non-excluded non-pinned row', () => {
    const rects = new Map<string, RowRect>([
      ['pinnedTop', rect(0, 30)],
      ['exclude', rect(30, 60)],
      ['target', rect(45, 75)],
    ]);
    // Pointer at 50 inside pinnedTop → skip / inside exclude → skip /
    // inside target → match at lower half.
    const out = getRowDropTarget(50, rects, 'exclude', { pinnedRowIds: new Set(['pinnedTop']) });
    expect(out?.targetRowId).toBe('target');
  });

  it('multiple rows, pointer in second row upper half → that row at "above"', () => {
    const rects = new Map<string, RowRect>([
      ['r1', rect(100, 130)],
      ['r2', rect(130, 160)],
      ['r3', rect(160, 190)],
    ]);
    const out = getRowDropTarget(140, rects, 'unrelated');
    expect(out).toEqual({ targetRowId: 'r2', position: 'above' });
  });
});

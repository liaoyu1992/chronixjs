import { describe, expect, it } from 'vitest';

import { getColumnDropTarget, type ColumnHeaderRect } from './get-column-drop-target.js';

function makeRects(
  entries: readonly { colId: string; left: number; right: number }[],
): ReadonlyMap<string, ColumnHeaderRect> {
  return new Map(entries.map((e) => [e.colId, { left: e.left, right: e.right }]));
}

describe('getColumnDropTarget', () => {
  it("returns {target, position: 'before'} when pointer falls in the LEFT half of a cell", () => {
    const rects = makeRects([
      { colId: 'a', left: 0, right: 100 },
      { colId: 'b', left: 100, right: 200 },
    ]);
    // Pointer at clientX=130 → cell 'b' (midpoint 150), left half → 'before'.
    expect(getColumnDropTarget(130, rects, 'a')).toEqual({ targetColId: 'b', position: 'before' });
  });

  it("returns {target, position: 'after'} when pointer falls in the RIGHT half of a cell", () => {
    const rects = makeRects([
      { colId: 'a', left: 0, right: 100 },
      { colId: 'b', left: 100, right: 200 },
    ]);
    // Pointer at clientX=170 → cell 'b' (midpoint 150), right half → 'after'.
    expect(getColumnDropTarget(170, rects, 'a')).toEqual({ targetColId: 'b', position: 'after' });
  });

  it('returns null when pointer is outside all cell rects (e.g. above / off-screen)', () => {
    const rects = makeRects([
      { colId: 'a', left: 0, right: 100 },
      { colId: 'b', left: 100, right: 200 },
    ]);
    // Pointer at clientX=500 — far to the right of all rects.
    expect(getColumnDropTarget(500, rects, 'a')).toBeNull();
    // Pointer at clientX=-50 — to the left of all rects.
    expect(getColumnDropTarget(-50, rects, 'a')).toBeNull();
  });

  it('skips the excluded (moved) column even when the pointer is inside its rect', () => {
    const rects = makeRects([
      { colId: 'a', left: 0, right: 100 },
      { colId: 'b', left: 100, right: 200 },
      { colId: 'c', left: 200, right: 300 },
    ]);
    // Pointer at clientX=50 — inside 'a's rect, but 'a' is the moved column.
    expect(getColumnDropTarget(50, rects, 'a')).toBeNull();
    // Pointer at clientX=150 — inside 'b's rect, 'a' excluded → finds 'b'.
    expect(getColumnDropTarget(150, rects, 'a')).toEqual({
      targetColId: 'b',
      position: 'after',
    });
  });

  it('places the boundary at the midpoint (left-inclusive: midpoint itself counts as right-half)', () => {
    const rects = makeRects([{ colId: 'a', left: 0, right: 100 }]);
    // Exactly at midpoint=50: per the `<` test, midpoint counts as right
    // half → 'after'. Documents the inclusive convention so consumers
    // know the side the helper will pick for a perfectly-centered cursor.
    expect(getColumnDropTarget(50, rects, 'x')).toEqual({ targetColId: 'a', position: 'after' });
    expect(getColumnDropTarget(49.99, rects, 'x')).toEqual({
      targetColId: 'a',
      position: 'before',
    });
  });

  // ────────────────────────── pinned-zone guard ──────────────────────────

  it('same-zone drop target is allowed when pinnedZoneByColId is supplied', () => {
    const rects = makeRects([
      { colId: 'id', left: 0, right: 80 },
      { colId: 'name', left: 80, right: 200 },
      { colId: 'qty', left: 200, right: 300 },
    ]);
    const zoneByColId = new Map<string, 'left' | 'right' | null>([
      ['id', 'left'],
      ['name', 'left'],
      ['qty', null],
    ]);
    // Moved column = 'id' (zone 'left'); pointer over 'name' (also 'left').
    // Same-zone → drop target resolves normally.
    expect(getColumnDropTarget(120, rects, 'id', { pinnedZoneByColId: zoneByColId })).toEqual({
      targetColId: 'name',
      position: 'before',
    });
  });

  it('cross-zone drop target is rejected (returns null) when pinnedZoneByColId is supplied', () => {
    const rects = makeRects([
      { colId: 'id', left: 0, right: 80 },
      { colId: 'name', left: 80, right: 200 },
      { colId: 'qty', left: 200, right: 300 },
      { colId: 'note', left: 300, right: 400 },
    ]);
    const zoneByColId = new Map<string, 'left' | 'right' | null>([
      ['id', 'left'],
      ['name', 'left'],
      ['qty', null],
      ['note', 'right'],
    ]);
    // Moved column = 'id' (zone 'left'); pointer over 'qty' (center) →
    // cross-zone → null. Same for pointer over 'note' (zone 'right').
    expect(getColumnDropTarget(250, rects, 'id', { pinnedZoneByColId: zoneByColId })).toBeNull();
    expect(getColumnDropTarget(350, rects, 'id', { pinnedZoneByColId: zoneByColId })).toBeNull();
    // Sanity: pointer over 'name' (same 'left' zone) still resolves.
    expect(getColumnDropTarget(150, rects, 'id', { pinnedZoneByColId: zoneByColId })).toEqual({
      targetColId: 'name',
      position: 'after',
    });
  });
});

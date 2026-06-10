import { describe, expect, it } from 'vitest';

import { computeRowReorder, DEFAULT_ROW_DRAG_THRESHOLD_PX } from './compute-row-reorder.js';

import type { RowSpec } from '../ir/index.js';

function row(id: string): RowSpec {
  return { id, data: { id } };
}

describe('computeRowReorder (Phase 44)', () => {
  it('exports DEFAULT_ROW_DRAG_THRESHOLD_PX = 5', () => {
    expect(DEFAULT_ROW_DRAG_THRESHOLD_PX).toBe(5);
  });

  it('returns input identity when movedRowId === targetRowId', () => {
    const rows: readonly RowSpec[] = [row('r1'), row('r2'), row('r3')];
    const out = computeRowReorder(rows, 'r2', 'r2', 'below');
    expect(out).toBe(rows);
  });

  it('returns input identity when movedRowId not found', () => {
    const rows: readonly RowSpec[] = [row('r1'), row('r2')];
    const out = computeRowReorder(rows, 'unknown', 'r1', 'below');
    expect(out).toBe(rows);
  });

  it('returns input identity when targetRowId not found', () => {
    const rows: readonly RowSpec[] = [row('r1'), row('r2')];
    const out = computeRowReorder(rows, 'r1', 'unknown', 'below');
    expect(out).toBe(rows);
  });

  it('moves row[0] to "below" row[2] → row[0] lands at index 2', () => {
    const rows: readonly RowSpec[] = [row('r1'), row('r2'), row('r3')];
    const out = computeRowReorder(rows, 'r1', 'r3', 'below');
    expect(out.map((r) => r.id)).toEqual(['r2', 'r3', 'r1']);
  });

  it('moves row[2] to "above" row[0] → row[2] lands at index 0', () => {
    const rows: readonly RowSpec[] = [row('r1'), row('r2'), row('r3')];
    const out = computeRowReorder(rows, 'r3', 'r1', 'above');
    expect(out.map((r) => r.id)).toEqual(['r3', 'r1', 'r2']);
  });

  it('returns identity when moving row[1] to "below" row[0] (already there)', () => {
    const rows: readonly RowSpec[] = [row('r1'), row('r2'), row('r3')];
    const out = computeRowReorder(rows, 'r2', 'r1', 'below');
    expect(out).toBe(rows);
  });

  it('returns identity when moving row[1] to "above" row[2] (already there)', () => {
    const rows: readonly RowSpec[] = [row('r1'), row('r2'), row('r3')];
    const out = computeRowReorder(rows, 'r2', 'r3', 'above');
    expect(out).toBe(rows);
  });

  it('preserves identity-by-reference for non-moved rows', () => {
    const r1 = row('r1');
    const r2 = row('r2');
    const r3 = row('r3');
    const rows: readonly RowSpec[] = [r1, r2, r3];
    const out = computeRowReorder(rows, 'r1', 'r3', 'below');
    // r1 moves to the end; r2 and r3 should be the SAME object references.
    expect(out[0]).toBe(r2);
    expect(out[1]).toBe(r3);
    expect(out[2]).toBe(r1);
  });

  it('handles 5-row array reorder: move r3 to "above" r1', () => {
    const rows: readonly RowSpec[] = [row('r1'), row('r2'), row('r3'), row('r4'), row('r5')];
    const out = computeRowReorder(rows, 'r3', 'r1', 'above');
    expect(out.map((r) => r.id)).toEqual(['r3', 'r1', 'r2', 'r4', 'r5']);
  });

  it('computes correct adjusted index when target is below moved (right-of-source)', () => {
    // Moving r1 to "below" r3 — target index 2 in input; after removing
    // r1 (index 0), r3 becomes index 1 in the shrunken array; final
    // landing index is 1+1 = 2 (post-removal numbering = 'below' target).
    const rows: readonly RowSpec[] = [row('r1'), row('r2'), row('r3'), row('r4')];
    const out = computeRowReorder(rows, 'r1', 'r3', 'below');
    expect(out.map((r) => r.id)).toEqual(['r2', 'r3', 'r1', 'r4']);
  });

  it('single-row array → identity for any input', () => {
    const rows: readonly RowSpec[] = [row('r1')];
    expect(computeRowReorder(rows, 'r1', 'r1', 'above')).toBe(rows);
    expect(computeRowReorder(rows, 'r1', 'r1', 'below')).toBe(rows);
  });

  it('empty array → identity for any input', () => {
    const rows: readonly RowSpec[] = [];
    expect(computeRowReorder(rows, 'r1', 'r2', 'above')).toBe(rows);
  });
});

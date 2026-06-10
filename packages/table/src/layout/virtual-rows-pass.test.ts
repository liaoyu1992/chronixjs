import { describe, expect, it } from 'vitest';

import { rowLayoutPass } from './row-layout-pass.js';
import { virtualRowsPass } from './virtual-rows-pass.js';

import type { RowSpec } from '../ir/index.js';

function row(id: string, heightHint?: number): RowSpec {
  return heightHint != null ? { id, data: {}, heightHint } : { id, data: {} };
}

function layoutOf(rows: readonly RowSpec[], defaultRowHeight = 28) {
  return rowLayoutPass({ rows, defaultRowHeight });
}

describe('virtualRowsPass', () => {
  it('returns empty result for zero rows', () => {
    const layout = layoutOf([]);
    const result = virtualRowsPass({
      rows: [],
      rowYByRowId: layout.rowYByRowId,
      rowHeightByRowId: layout.rowHeightByRowId,
      viewportScrollTop: 0,
      viewportHeight: 400,
    });
    expect(result.visibleRows).toEqual([]);
    expect(result.firstRenderedIndex).toBe(-1);
    expect(result.lastRenderedIndex).toBe(-1);
  });

  it('returns all rows when viewportHeight >= totalBodyHeight (no virtualization needed)', () => {
    const rows = [row('r1'), row('r2'), row('r3')]; // total = 84
    const layout = layoutOf(rows);
    const result = virtualRowsPass({
      rows,
      rowYByRowId: layout.rowYByRowId,
      rowHeightByRowId: layout.rowHeightByRowId,
      viewportScrollTop: 0,
      viewportHeight: 400,
      overscan: 0,
    });
    expect(result.visibleRows).toEqual(rows);
    expect(result.firstRenderedIndex).toBe(0);
    expect(result.lastRenderedIndex).toBe(2);
  });

  it('returns empty result when viewportHeight is 0 (pre-mount frame)', () => {
    const rows = [row('r1'), row('r2')];
    const layout = layoutOf(rows);
    const result = virtualRowsPass({
      rows,
      rowYByRowId: layout.rowYByRowId,
      rowHeightByRowId: layout.rowHeightByRowId,
      viewportScrollTop: 0,
      viewportHeight: 0,
    });
    expect(result.visibleRows).toEqual([]);
    expect(result.firstRenderedIndex).toBe(-1);
    expect(result.lastRenderedIndex).toBe(-1);
  });

  it('renders the visible window starting at row 0 when scrollTop is 0', () => {
    // 20 rows × 28 = 560 total; viewport=100; should show rows 0..3 (4 rows fit).
    const rows = Array.from({ length: 20 }, (_, i) => row(`r${i}`));
    const layout = layoutOf(rows);
    const result = virtualRowsPass({
      rows,
      rowYByRowId: layout.rowYByRowId,
      rowHeightByRowId: layout.rowHeightByRowId,
      viewportScrollTop: 0,
      viewportHeight: 100,
      overscan: 0,
    });
    // Rows 0..3 have y = 0, 28, 56, 84; row 3's top (84) < 100 (visible),
    // row 4's top (112) >= 100 (above-loop break).
    expect(result.firstRenderedIndex).toBe(0);
    expect(result.lastRenderedIndex).toBe(3);
    expect(result.visibleRows.map((r) => r.id)).toEqual(['r0', 'r1', 'r2', 'r3']);
  });

  it('renders the middle window when scrollTop lands mid-stream', () => {
    // 20 rows × 28 = 560. scrollTop=200 ⇒ visible window starts at row whose
    // y+h > 200. Row 7 has y=196, y+h=224 → visible. Row 6 has y+h=196 → OUT
    // (exact bottom-equals-yTop is OUT). Viewport=100 ⇒ yBottom=300. Row 10
    // has y=280, y+h=308 → visible (y < 300). Row 11 has y=308 → OUT.
    const rows = Array.from({ length: 20 }, (_, i) => row(`r${i}`));
    const layout = layoutOf(rows);
    const result = virtualRowsPass({
      rows,
      rowYByRowId: layout.rowYByRowId,
      rowHeightByRowId: layout.rowHeightByRowId,
      viewportScrollTop: 200,
      viewportHeight: 100,
      overscan: 0,
    });
    expect(result.firstRenderedIndex).toBe(7);
    expect(result.lastRenderedIndex).toBe(10);
    expect(result.visibleRows.map((r) => r.id)).toEqual(['r7', 'r8', 'r9', 'r10']);
  });

  it('returns empty when scrolled past the last row', () => {
    const rows = Array.from({ length: 5 }, (_, i) => row(`r${i}`));
    const layout = layoutOf(rows);
    // Total body = 5 × 28 = 140. Scroll past: top=200.
    const result = virtualRowsPass({
      rows,
      rowYByRowId: layout.rowYByRowId,
      rowHeightByRowId: layout.rowHeightByRowId,
      viewportScrollTop: 200,
      viewportHeight: 100,
      overscan: 0,
    });
    expect(result.visibleRows).toEqual([]);
    expect(result.firstRenderedIndex).toBe(-1);
    expect(result.lastRenderedIndex).toBe(-1);
  });

  it('tie semantics: row whose bottom == scrollTop is OUT (above); row whose top == scrollTop+vh is OUT (below)', () => {
    // 10 rows × 28; scrollTop = 28 ⇒ row 0 has y+h = 28 = scrollTop (OUT,
    // above). scrollTop+vh = 28+56 = 84 ⇒ row 3 has y = 84 (OUT, below).
    // Visible: rows 1, 2.
    const rows = Array.from({ length: 10 }, (_, i) => row(`r${i}`));
    const layout = layoutOf(rows);
    const result = virtualRowsPass({
      rows,
      rowYByRowId: layout.rowYByRowId,
      rowHeightByRowId: layout.rowHeightByRowId,
      viewportScrollTop: 28,
      viewportHeight: 56,
      overscan: 0,
    });
    expect(result.firstRenderedIndex).toBe(1);
    expect(result.lastRenderedIndex).toBe(2);
  });

  it('overscan default is 3: range extends 3 rows above + below visible window, clamped to bounds', () => {
    // 20 rows × 28 = 560. scrollTop=200 ⇒ visible rows 7..10 (per case above).
    // Overscan default 3 ⇒ rendered range 4..13.
    const rows = Array.from({ length: 20 }, (_, i) => row(`r${i}`));
    const layout = layoutOf(rows);
    const result = virtualRowsPass({
      rows,
      rowYByRowId: layout.rowYByRowId,
      rowHeightByRowId: layout.rowHeightByRowId,
      viewportScrollTop: 200,
      viewportHeight: 100,
      // overscan default: 3
    });
    expect(result.firstRenderedIndex).toBe(4);
    expect(result.lastRenderedIndex).toBe(13);
    expect(result.visibleRows).toHaveLength(10);
  });

  it('overscan clamps to row-array bounds (top + bottom edge cases)', () => {
    // 5 rows × 28 = 140; viewport=100 covers rows 0..3. Overscan 3 would
    // extend to [-3, 6] → clamped to [0, 4]. So all 5 rows render.
    const rows = Array.from({ length: 5 }, (_, i) => row(`r${i}`));
    const layout = layoutOf(rows);
    const result = virtualRowsPass({
      rows,
      rowYByRowId: layout.rowYByRowId,
      rowHeightByRowId: layout.rowHeightByRowId,
      viewportScrollTop: 0,
      viewportHeight: 100,
      overscan: 3,
    });
    expect(result.firstRenderedIndex).toBe(0);
    expect(result.lastRenderedIndex).toBe(4);
    expect(result.visibleRows).toHaveLength(5);
  });

  it('overscan = 0 explicitly disables the buffer', () => {
    const rows = Array.from({ length: 20 }, (_, i) => row(`r${i}`));
    const layout = layoutOf(rows);
    const result = virtualRowsPass({
      rows,
      rowYByRowId: layout.rowYByRowId,
      rowHeightByRowId: layout.rowHeightByRowId,
      viewportScrollTop: 200,
      viewportHeight: 100,
      overscan: 0,
    });
    expect(result.firstRenderedIndex).toBe(7);
    expect(result.lastRenderedIndex).toBe(10);
  });

  it('honors per-row heightHint via rowHeightByRowId map (mixed heights)', () => {
    // Row 0 h=50, row 1 h=20, row 2 h=80, row 3 h=20. Y values 0, 50, 70, 150.
    // Total = 170. viewport=60 starting at scrollTop=40 ⇒ yBottom=100.
    // Visible: row 0 (y+h=50 > 40 ⇒ visible; y=0 < 100), row 1 (y=50; y+h=70;
    // both within), row 2 (y=70 < 100 ⇒ visible). Row 3 y=150 ≥ 100 ⇒ OUT.
    const rows = [row('a', 50), row('b', 20), row('c', 80), row('d', 20)];
    const layout = layoutOf(rows);
    const result = virtualRowsPass({
      rows,
      rowYByRowId: layout.rowYByRowId,
      rowHeightByRowId: layout.rowHeightByRowId,
      viewportScrollTop: 40,
      viewportHeight: 60,
      overscan: 0,
    });
    expect(result.firstRenderedIndex).toBe(0);
    expect(result.lastRenderedIndex).toBe(2);
    expect(result.visibleRows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
});

import { describe, expect, it } from 'vitest';

import { pinnedRowsPass } from './pinned-rows-pass.js';

import type { RowSpec } from '../ir/index.js';

function row(id: string, pinned?: 'top' | 'bottom'): RowSpec {
  return pinned == null ? { id, data: { name: id } } : { id, data: { name: id }, pinned };
}

describe('pinnedRowsPass', () => {
  it('returns empty buckets + input alias for empty input', () => {
    const empty: readonly RowSpec[] = [];
    const result = pinnedRowsPass({ rows: empty });
    expect(result.topPinnedRows).toEqual([]);
    expect(result.regularRows).toBe(empty);
    expect(result.bottomPinnedRows).toEqual([]);
    expect(result.hasPinnedRows).toBe(false);
  });

  it('returns input rows by reference when no row is pinned (identity preserved)', () => {
    const rows: readonly RowSpec[] = [row('a'), row('b'), row('c')];
    const result = pinnedRowsPass({ rows });
    expect(result.regularRows).toBe(rows);
    expect(result.topPinnedRows).toEqual([]);
    expect(result.bottomPinnedRows).toEqual([]);
    expect(result.hasPinnedRows).toBe(false);
  });

  it('partitions a single top-pinned row out of regular rows', () => {
    const rows: readonly RowSpec[] = [row('total', 'top'), row('a'), row('b'), row('c')];
    const result = pinnedRowsPass({ rows });
    expect(result.topPinnedRows.map((r) => r.id)).toEqual(['total']);
    expect(result.regularRows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(result.bottomPinnedRows).toEqual([]);
    expect(result.hasPinnedRows).toBe(true);
  });

  it('partitions a single bottom-pinned row out of regular rows', () => {
    const rows: readonly RowSpec[] = [row('a'), row('b'), row('c'), row('avg', 'bottom')];
    const result = pinnedRowsPass({ rows });
    expect(result.topPinnedRows).toEqual([]);
    expect(result.regularRows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(result.bottomPinnedRows.map((r) => r.id)).toEqual(['avg']);
    expect(result.hasPinnedRows).toBe(true);
  });

  it('partitions both top and bottom pinned rows, mixed with regulars', () => {
    const rows: readonly RowSpec[] = [
      row('header', 'top'),
      row('a'),
      row('b'),
      row('footer', 'bottom'),
      row('c'),
      row('subtotal', 'top'),
      row('grand-total', 'bottom'),
    ];
    const result = pinnedRowsPass({ rows });
    expect(result.topPinnedRows.map((r) => r.id)).toEqual(['header', 'subtotal']);
    expect(result.regularRows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
    expect(result.bottomPinnedRows.map((r) => r.id)).toEqual(['footer', 'grand-total']);
    expect(result.hasPinnedRows).toBe(true);
  });

  it('preserves author order within each bucket', () => {
    const rows: readonly RowSpec[] = [
      row('top-3', 'top'),
      row('top-1', 'top'),
      row('top-2', 'top'),
      row('mid'),
      row('bot-2', 'bottom'),
      row('bot-1', 'bottom'),
    ];
    const result = pinnedRowsPass({ rows });
    expect(result.topPinnedRows.map((r) => r.id)).toEqual(['top-3', 'top-1', 'top-2']);
    expect(result.bottomPinnedRows.map((r) => r.id)).toEqual(['bot-2', 'bot-1']);
  });

  it('handles input where every row is pinned (no regular rows)', () => {
    const rows: readonly RowSpec[] = [row('header', 'top'), row('footer', 'bottom')];
    const result = pinnedRowsPass({ rows });
    expect(result.topPinnedRows.map((r) => r.id)).toEqual(['header']);
    expect(result.regularRows).toEqual([]);
    expect(result.bottomPinnedRows.map((r) => r.id)).toEqual(['footer']);
    expect(result.hasPinnedRows).toBe(true);
  });

  it('does not mutate the input row references', () => {
    const a = row('a', 'top');
    const b = row('b');
    const c = row('c', 'bottom');
    const rows: readonly RowSpec[] = [a, b, c];
    const result = pinnedRowsPass({ rows });
    expect(result.topPinnedRows[0]).toBe(a);
    expect(result.regularRows[0]).toBe(b);
    expect(result.bottomPinnedRows[0]).toBe(c);
  });

  it('scales linearly on large flat input (100k rows, no pinning)', () => {
    const rows: RowSpec[] = [];
    for (let i = 0; i < 100_000; i++) {
      rows.push({ id: `r${i}`, data: { i } });
    }
    const before = performance.now();
    const result = pinnedRowsPass({ rows });
    const after = performance.now();
    expect(result.regularRows).toBe(rows);
    expect(result.hasPinnedRows).toBe(false);
    // Fast-path scan should finish well under 100ms on 100k rows.
    expect(after - before).toBeLessThan(100);
  });
});

import { describe, expect, it } from 'vitest';

import { rowLayoutPass } from './row-layout-pass.js';

import type { RowSpec } from '../ir/index.js';

function row(id: string, heightHint?: number): RowSpec {
  return heightHint != null ? { id, data: {}, heightHint } : { id, data: {} };
}

describe('rowLayoutPass', () => {
  it('returns empty maps + totalBodyHeight=0 for zero rows', () => {
    const result = rowLayoutPass({ rows: [], defaultRowHeight: 28 });
    expect(result.rowYByRowId).toEqual({});
    expect(result.rowHeightByRowId).toEqual({});
    expect(result.totalBodyHeight).toBe(0);
    expect(result.visibleRows).toEqual([]);
  });

  it('places a single row at Y=0 with defaultRowHeight', () => {
    const result = rowLayoutPass({ rows: [row('r1')], defaultRowHeight: 28 });
    expect(result.rowYByRowId).toEqual({ r1: 0 });
    expect(result.rowHeightByRowId).toEqual({ r1: 28 });
    expect(result.totalBodyHeight).toBe(28);
  });

  it('stacks N rows top-to-bottom at defaultRowHeight', () => {
    const rows = [row('r1'), row('r2'), row('r3')];
    const result = rowLayoutPass({ rows, defaultRowHeight: 28 });
    expect(result.rowYByRowId).toEqual({ r1: 0, r2: 28, r3: 56 });
    expect(result.rowHeightByRowId).toEqual({ r1: 28, r2: 28, r3: 28 });
    expect(result.totalBodyHeight).toBe(84);
  });

  it('honors per-row heightHint as override', () => {
    const rows = [row('r1', 50), row('r2'), row('r3', 80)];
    const result = rowLayoutPass({ rows, defaultRowHeight: 28 });
    expect(result.rowHeightByRowId).toEqual({ r1: 50, r2: 28, r3: 80 });
    expect(result.rowYByRowId).toEqual({ r1: 0, r2: 50, r3: 78 });
    expect(result.totalBodyHeight).toBe(50 + 28 + 80);
  });

  it('mixes hinted + default rows interleaved with correct Y accumulation', () => {
    const rows = [row('a'), row('b', 60), row('c'), row('d', 12), row('e')];
    const result = rowLayoutPass({ rows, defaultRowHeight: 30 });
    // Heights: 30, 60, 30, 12, 30. Y: 0, 30, 90, 120, 132. Total: 162.
    expect(result.rowHeightByRowId).toEqual({ a: 30, b: 60, c: 30, d: 12, e: 30 });
    expect(result.rowYByRowId).toEqual({ a: 0, b: 30, c: 90, d: 120, e: 132 });
    expect(result.totalBodyHeight).toBe(162);
  });

  it('rows tile vertically — each row.y === previous row.y + previous row.height', () => {
    const rows = [row('a', 40), row('b', 25), row('c'), row('d', 17)];
    const result = rowLayoutPass({ rows, defaultRowHeight: 30 });
    for (let i = 1; i < rows.length; i += 1) {
      const prev = rows[i - 1]!;
      const curr = rows[i]!;
      expect(result.rowYByRowId[curr.id]).toBe(
        result.rowYByRowId[prev.id]! + result.rowHeightByRowId[prev.id]!,
      );
    }
  });

  it('totalBodyHeight equals the sum of all resolved heights', () => {
    const rows = [row('a', 40), row('b'), row('c', 17), row('d')];
    const result = rowLayoutPass({ rows, defaultRowHeight: 28 });
    const sum = Object.values(result.rowHeightByRowId).reduce((s, h) => s + h, 0);
    expect(result.totalBodyHeight).toBe(sum);
  });

  it('visibleRows preserves input array identity (returns the same reference)', () => {
    const rows: readonly RowSpec[] = [row('r1'), row('r2')];
    const result = rowLayoutPass({ rows, defaultRowHeight: 28 });
    expect(result.visibleRows).toBe(rows);
  });

  // Phase 46-C (2026-05-30): row-height override map for auto-height.
  it('rowHeightOverridesByRowId wins over heightHint AND defaultRowHeight', () => {
    const rows = [row('r1', 50), row('r2'), row('r3', 80)];
    const result = rowLayoutPass({
      rows,
      defaultRowHeight: 28,
      rowHeightOverridesByRowId: { r1: 120, r2: 75, r3: 200 },
    });
    expect(result.rowHeightByRowId).toEqual({ r1: 120, r2: 75, r3: 200 });
    expect(result.rowYByRowId).toEqual({ r1: 0, r2: 120, r3: 195 });
    expect(result.totalBodyHeight).toBe(120 + 75 + 200);
  });

  it('rowHeightOverridesByRowId partial map falls back to heightHint / defaultRowHeight per row', () => {
    const rows = [row('r1', 50), row('r2'), row('r3', 80)];
    const result = rowLayoutPass({
      rows,
      defaultRowHeight: 28,
      // Only r2 has an override.
      rowHeightOverridesByRowId: { r2: 90 },
    });
    expect(result.rowHeightByRowId).toEqual({ r1: 50, r2: 90, r3: 80 });
    expect(result.rowYByRowId).toEqual({ r1: 0, r2: 50, r3: 140 });
    expect(result.totalBodyHeight).toBe(50 + 90 + 80);
  });

  it('rowHeightOverridesByRowId non-finite values fall through to heightHint / defaultRowHeight', () => {
    const rows = [row('r1', 50), row('r2'), row('r3')];
    const result = rowLayoutPass({
      rows,
      defaultRowHeight: 28,
      rowHeightOverridesByRowId: {
        r1: Number.NaN,
        r2: Number.POSITIVE_INFINITY,
        r3: Number.NEGATIVE_INFINITY,
      },
    });
    expect(result.rowHeightByRowId).toEqual({ r1: 50, r2: 28, r3: 28 });
    expect(result.rowYByRowId).toEqual({ r1: 0, r2: 50, r3: 78 });
  });
});

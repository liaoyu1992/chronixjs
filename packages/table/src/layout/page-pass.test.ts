import { describe, expect, it } from 'vitest';

import { pagePass } from './page-pass.js';

import type { RowSpec } from '../ir/index.js';

function makeRows(n: number): readonly RowSpec[] {
  return Array.from({ length: n }, (_, i) => ({ id: `r${i + 1}`, data: { idx: i + 1 } }));
}

describe('pagePass', () => {
  it('returns {pagedRows: [], totalPages: 0, currentPage: 0} for an empty rows array', () => {
    const rows: readonly RowSpec[] = [];
    const out = pagePass({ rows, page: 0, pageSize: 10 });
    expect(out.pagedRows).toEqual([]);
    expect(out.currentPage).toBe(0);
    expect(out.totalPages).toBe(0);
    expect(out.totalRowsAcrossPages).toBe(0);
  });

  it('returns identity (rows by reference, totalPages: 1) when pageSize <= 0 (no-pagination passthrough)', () => {
    const rows = makeRows(25);
    const out = pagePass({ rows, page: 0, pageSize: 0 });
    // Identity contract: same reference is returned (consumers can identity-check).
    expect(out.pagedRows).toBe(rows);
    expect(out.currentPage).toBe(0);
    expect(out.totalPages).toBe(1);
    expect(out.totalRowsAcrossPages).toBe(25);

    // Negative pageSize is also degenerate-passthrough.
    const out2 = pagePass({ rows, page: 0, pageSize: -5 });
    expect(out2.pagedRows).toBe(rows);
    expect(out2.totalPages).toBe(1);
  });

  it('slices first page when page=0, pageSize=10, over 25 rows', () => {
    const rows = makeRows(25);
    const out = pagePass({ rows, page: 0, pageSize: 10 });
    expect(out.pagedRows.map((r) => r.id)).toEqual([
      'r1',
      'r2',
      'r3',
      'r4',
      'r5',
      'r6',
      'r7',
      'r8',
      'r9',
      'r10',
    ]);
    expect(out.currentPage).toBe(0);
    expect(out.totalPages).toBe(3);
    expect(out.totalRowsAcrossPages).toBe(25);
  });

  it('returns the partial last page when page=2, pageSize=10 over 25 rows (5 rows in tail)', () => {
    const rows = makeRows(25);
    const out = pagePass({ rows, page: 2, pageSize: 10 });
    expect(out.pagedRows.map((r) => r.id)).toEqual(['r21', 'r22', 'r23', 'r24', 'r25']);
    expect(out.currentPage).toBe(2);
    expect(out.totalPages).toBe(3);
  });

  it('clamps oversize page index to the last valid page (page=99 → 2 over 25/10 rows)', () => {
    const rows = makeRows(25);
    const out = pagePass({ rows, page: 99, pageSize: 10 });
    expect(out.currentPage).toBe(2);
    // Slice matches the last partial page.
    expect(out.pagedRows.map((r) => r.id)).toEqual(['r21', 'r22', 'r23', 'r24', 'r25']);
  });

  it('clamps negative page index to 0', () => {
    const rows = makeRows(25);
    const out = pagePass({ rows, page: -3, pageSize: 10 });
    expect(out.currentPage).toBe(0);
    expect(out.pagedRows.map((r) => r.id)).toEqual([
      'r1',
      'r2',
      'r3',
      'r4',
      'r5',
      'r6',
      'r7',
      'r8',
      'r9',
      'r10',
    ]);
  });

  it('returns all rows in one page when pageSize >= totalRows', () => {
    const rows = makeRows(8);
    const out = pagePass({ rows, page: 0, pageSize: 50 });
    expect(out.pagedRows.map((r) => r.id)).toEqual([
      'r1',
      'r2',
      'r3',
      'r4',
      'r5',
      'r6',
      'r7',
      'r8',
    ]);
    expect(out.currentPage).toBe(0);
    expect(out.totalPages).toBe(1);
    expect(out.totalRowsAcrossPages).toBe(8);
  });
});

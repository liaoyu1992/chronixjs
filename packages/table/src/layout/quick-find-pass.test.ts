import { describe, expect, it } from 'vitest';

import { quickFindPass } from './quick-find-pass.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

const columns: readonly ColumnSpec[] = [
  { id: 'name', field: 'name' },
  { id: 'status', field: 'status' },
  { id: 'note', field: 'note' },
  { id: 'qty', field: 'qty' },
  { id: 'frozen', field: 'frozen', filterable: false },
];

function row(id: string, data: Record<string, unknown>, children?: readonly RowSpec[]): RowSpec {
  return children == null ? { id, data } : { id, data, children };
}

describe('quickFindPass', () => {
  it('returns identity when quickFindText is null', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'a' }), row('r2', { name: 'b' })];
    const out = quickFindPass({ rows, quickFindText: null, columns });
    expect(out.filteredRows).toBe(rows);
    expect(out.quickFindForceExpandedRowIds).toEqual([]);
    expect(out.matchCount).toBe(2);
  });

  it('returns identity when quickFindText is undefined', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'a' })];
    const out = quickFindPass({ rows, quickFindText: undefined, columns });
    expect(out.filteredRows).toBe(rows);
    expect(out.matchCount).toBe(1);
  });

  it('returns identity when quickFindText is empty string', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'a' }), row('r2', { name: 'b' })];
    const out = quickFindPass({ rows, quickFindText: '', columns });
    expect(out.filteredRows).toBe(rows);
    expect(out.matchCount).toBe(2);
  });

  it('returns identity when quickFindText is whitespace only', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'a' }), row('r2', { name: 'b' })];
    const out = quickFindPass({ rows, quickFindText: '   ', columns });
    expect(out.filteredRows).toBe(rows);
    expect(out.matchCount).toBe(2);
  });

  it('single-column substring match is case-insensitive', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'Alpha needs review', status: '', note: '', qty: 0 }),
      row('r2', { name: 'Beta complete', status: '', note: '', qty: 0 }),
      row('r3', { name: 'ALPHA-2 in progress', status: '', note: '', qty: 0 }),
      row('r4', { name: 'gamma kickoff', status: '', note: '', qty: 0 }),
    ];
    const out = quickFindPass({ rows, quickFindText: 'alpha', columns });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r3']);
    expect(out.matchCount).toBe(2);
  });

  it('cross-column OR — match in ANY column retains the row', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'item A', status: 'OK', note: 'has needle', qty: 1 }),
      row('r2', { name: 'NEEDLE in name', status: 'OK', note: 'unrelated', qty: 2 }),
      row('r3', { name: 'item C', status: 'needle status', note: 'unrelated', qty: 3 }),
      row('r4', { name: 'item D', status: 'OK', note: 'unrelated', qty: 4 }),
    ];
    const out = quickFindPass({ rows, quickFindText: 'needle', columns });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
    expect(out.matchCount).toBe(3);
  });

  it('skips columns with filterable: false (does not contribute to OR)', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'A', status: '', note: '', qty: 0, frozen: 'needle here' }),
      row('r2', { name: 'B', status: '', note: '', qty: 0, frozen: 'other' }),
    ];
    const out = quickFindPass({ rows, quickFindText: 'needle', columns });
    // r1 would match by `frozen` column ONLY, but frozen has
    // filterable: false so it's skipped — no row matches.
    expect(out.filteredRows).toEqual([]);
    expect(out.matchCount).toBe(0);
  });

  it('honors column.valueGetter', () => {
    const cols: readonly ColumnSpec[] = [
      {
        id: 'derived',
        valueGetter: ({ row: r }) => {
          const n = r.data['n'];
          return typeof n === 'number' ? `prefix-${n * 2}` : '';
        },
      },
    ];
    const rows: readonly RowSpec[] = [
      row('r1', { n: 5 }),
      row('r2', { n: 21 }),
      row('r3', { n: 7 }),
    ];
    // valueGetter outputs: prefix-10 / prefix-42 / prefix-14.
    const out = quickFindPass({ rows, quickFindText: '42', columns: cols });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r2']);
  });

  it('non-stringifiable cell values (object / function / symbol) do not contribute', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'obj', field: 'obj' },
      { id: 'fn', field: 'fn' },
      { id: 'sym', field: 'sym' },
    ];
    const rows: readonly RowSpec[] = [
      // Object stringifies to `[object Object]` — but our coerceToText
      // returns null for objects so even if "object" appears in the
      // string form it shouldn't match.
      row('r1', { obj: { needle: true }, fn: () => 'needle', sym: Symbol('needle') }),
    ];
    const out = quickFindPass({ rows, quickFindText: 'needle', columns: cols });
    expect(out.filteredRows).toEqual([]);
  });

  it('numeric / boolean / bigint / Date cells stringify for matching', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'n', field: 'n' },
      { id: 'b', field: 'b' },
      { id: 'big', field: 'big' },
      { id: 'd', field: 'd' },
    ];
    const rows: readonly RowSpec[] = [
      row('r1', { n: 42, b: false, big: 100n, d: new Date('2026-05-29T00:00:00Z') }),
      row('r2', { n: 7, b: true, big: 200n, d: new Date('2026-05-30T00:00:00Z') }),
    ];
    expect(
      quickFindPass({ rows, quickFindText: '42', columns: cols }).filteredRows.map((r) => r.id),
    ).toEqual(['r1']);
    expect(
      quickFindPass({ rows, quickFindText: 'true', columns: cols }).filteredRows.map((r) => r.id),
    ).toEqual(['r2']);
    expect(
      quickFindPass({ rows, quickFindText: '100', columns: cols }).filteredRows.map((r) => r.id),
    ).toEqual(['r1']);
    expect(
      quickFindPass({ rows, quickFindText: '2026-05-29', columns: cols }).filteredRows.map(
        (r) => r.id,
      ),
    ).toEqual(['r1']);
  });

  it('returns empty when every column has filterable: false', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'a', field: 'a', filterable: false },
      { id: 'b', field: 'b', filterable: false },
    ];
    const rows: readonly RowSpec[] = [row('r1', { a: 'needle', b: 'needle' })];
    const out = quickFindPass({ rows, quickFindText: 'needle', columns: cols });
    expect(out.filteredRows).toEqual([]);
    expect(out.matchCount).toBe(0);
  });

  it('trims surrounding whitespace from the needle', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'alpha', status: '', note: '', qty: 0 }),
      row('r2', { name: 'beta', status: '', note: '', qty: 0 }),
    ];
    const out = quickFindPass({ rows, quickFindText: '  alpha  ', columns });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1']);
  });

  describe('tree-aware behavior', () => {
    it('descendant match retains ancestor + populates quickFindForceExpandedRowIds', () => {
      const rows: readonly RowSpec[] = [
        row('parent', { name: 'parent A', status: '', note: '', qty: 0 }, [
          row('child1', { name: 'child needle', status: '', note: '', qty: 0 }),
          row('child2', { name: 'child without', status: '', note: '', qty: 0 }),
        ]),
        row('other', { name: 'other', status: '', note: '', qty: 0 }),
      ];
      const out = quickFindPass({ rows, quickFindText: 'needle', columns });
      expect(out.filteredRows.length).toBe(1);
      expect(out.filteredRows[0]?.id).toBe('parent');
      expect(out.filteredRows[0]?.children?.map((c) => c.id)).toEqual(['child1']);
      // Parent did NOT match itself but was retained because of descendant.
      expect(out.quickFindForceExpandedRowIds).toEqual(['parent']);
    });

    it('ancestor match retains entire subtree without force-expand', () => {
      const rows: readonly RowSpec[] = [
        row('parent', { name: 'parent needle here', status: '', note: '', qty: 0 }, [
          row('child1', { name: 'child A', status: '', note: '', qty: 0 }),
          row('child2', { name: 'child B', status: '', note: '', qty: 0 }),
        ]),
      ];
      const out = quickFindPass({ rows, quickFindText: 'needle', columns });
      expect(out.filteredRows.length).toBe(1);
      // Parent matches itself; children are pruned (none of them match
      // the needle, and the parent's self-match doesn't auto-include
      // descendants). This is the mirror behavior of filter-pass.
      expect(out.filteredRows[0]?.children).toEqual([]);
      // Parent matched itself — no force-expand needed.
      expect(out.quickFindForceExpandedRowIds).toEqual([]);
    });

    it('no match in subtree → entire subtree pruned', () => {
      const rows: readonly RowSpec[] = [
        row('parent1', { name: 'parent', status: '', note: '', qty: 0 }, [
          row('child1', { name: 'child A', status: '', note: '', qty: 0 }),
        ]),
        row('parent2', { name: 'needle here', status: '', note: '', qty: 0 }, [
          row('child2', { name: 'child B', status: '', note: '', qty: 0 }),
        ]),
      ];
      const out = quickFindPass({ rows, quickFindText: 'needle', columns });
      expect(out.filteredRows.length).toBe(1);
      expect(out.filteredRows[0]?.id).toBe('parent2');
    });

    it('nested descendant match force-expands all intermediate ancestors', () => {
      const rows: readonly RowSpec[] = [
        row('grand', { name: 'grand', status: '', note: '', qty: 0 }, [
          row('parent', { name: 'parent', status: '', note: '', qty: 0 }, [
            row('child', { name: 'needle deep', status: '', note: '', qty: 0 }),
          ]),
        ]),
      ];
      const out = quickFindPass({ rows, quickFindText: 'needle', columns });
      expect(out.filteredRows.length).toBe(1);
      expect([...out.quickFindForceExpandedRowIds].sort()).toEqual(['grand', 'parent']);
    });
  });
});

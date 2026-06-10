import { describe, expect, it } from 'vitest';

import { sortPass } from './sort-pass.js';

import type { ColumnSpec, RowSpec, SortSpec } from '../ir/index.js';

const columns: readonly ColumnSpec[] = [
  { id: 'name', field: 'name' },
  { id: 'qty', field: 'qty' },
  { id: 'when', field: 'when' },
  { id: 'flag', field: 'flag' },
  { id: 'frozen', field: 'frozen', sortable: false },
];

function row(id: string, data: Record<string, unknown>): RowSpec {
  return { id, data };
}

describe('sortPass', () => {
  it('returns identity {sortedRows: rows, rejected: false} when sortSpec is null', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'b' }), row('r2', { name: 'a' })];
    const out = sortPass({ rows, sortSpec: null, columns });
    expect(out.rejected).toBe(false);
    // Identity contract: same reference is returned (consumers can identity-check).
    expect(out.sortedRows).toBe(rows);
  });

  it('returns identity when sortSpec is undefined', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'b' })];
    const out = sortPass({ rows, sortSpec: undefined, columns });
    expect(out.rejected).toBe(false);
    expect(out.sortedRows).toBe(rows);
  });

  it('sorts strings ASC locale-aware', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'charlie' }),
      row('r2', { name: 'alpha' }),
      row('r3', { name: 'bravo' }),
    ];
    const spec: SortSpec = { colId: 'name', direction: 'asc' };
    const out = sortPass({ rows, sortSpec: [spec], columns });
    expect(out.rejected).toBe(false);
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r2', 'r3', 'r1']);
  });

  it('sorts strings DESC = reverse of ASC', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'charlie' }),
      row('r2', { name: 'alpha' }),
      row('r3', { name: 'bravo' }),
    ];
    const spec: SortSpec = { colId: 'name', direction: 'desc' };
    const out = sortPass({ rows, sortSpec: [spec], columns });
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r1', 'r3', 'r2']);
  });

  it('sorts numbers numerically — 9 < 10 (not lexicographic)', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { qty: 10 }),
      row('r2', { qty: 2 }),
      row('r3', { qty: 9 }),
    ];
    const spec: SortSpec = { colId: 'qty', direction: 'asc' };
    const out = sortPass({ rows, sortSpec: [spec], columns });
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r2', 'r3', 'r1']);
  });

  it('sorts Date by epoch milliseconds', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { when: new Date('2026-03-15') }),
      row('r2', { when: new Date('2026-01-01') }),
      row('r3', { when: new Date('2026-02-10') }),
    ];
    const spec: SortSpec = { colId: 'when', direction: 'asc' };
    const out = sortPass({ rows, sortSpec: [spec], columns });
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r2', 'r3', 'r1']);
  });

  it('sorts booleans — false < true ASC', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { flag: true }),
      row('r2', { flag: false }),
      row('r3', { flag: true }),
    ];
    const spec: SortSpec = { colId: 'flag', direction: 'asc' };
    const out = sortPass({ rows, sortSpec: [spec], columns });
    // Only first element fixed by sort key; stability puts r1 before r3 within true-group.
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r2', 'r1', 'r3']);
  });

  it('null-last is direction-independent — ASC + DESC both put nulls at the end', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'b' }),
      row('r2', { name: null }),
      row('r3', { name: 'a' }),
      row('r4', { name: undefined }),
      row('r5', { name: 'c' }),
    ];
    const asc = sortPass({
      rows,
      sortSpec: [{ colId: 'name', direction: 'asc' }],
      columns,
    });
    expect(asc.sortedRows.map((r) => r.id)).toEqual(['r3', 'r1', 'r5', 'r2', 'r4']);
    const desc = sortPass({
      rows,
      sortSpec: [{ colId: 'name', direction: 'desc' }],
      columns,
    });
    expect(desc.sortedRows.map((r) => r.id)).toEqual(['r5', 'r1', 'r3', 'r2', 'r4']);
  });

  it('custom column.comparator overrides the generic comparator', () => {
    // Sort by reverse string length (longest first); generic comparator
    // would sort alphabetically.
    const customColumns: readonly ColumnSpec[] = [
      {
        id: 'name',
        field: 'name',
        comparator: (a, b) => String(b).length - String(a).length,
      },
    ];
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'aa' }),
      row('r2', { name: 'aaaa' }),
      row('r3', { name: 'a' }),
      row('r4', { name: 'aaa' }),
    ];
    const out = sortPass({
      rows,
      sortSpec: [{ colId: 'name', direction: 'asc' }],
      columns: customColumns,
    });
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r2', 'r4', 'r1', 'r3']);
  });

  it('rejects when column.sortable === false (returns input rows + rejected:true)', () => {
    const rows: readonly RowSpec[] = [row('r1', { frozen: 'b' }), row('r2', { frozen: 'a' })];
    const out = sortPass({
      rows,
      sortSpec: [{ colId: 'frozen', direction: 'asc' }],
      columns,
    });
    expect(out.rejected).toBe(true);
    expect(out.sortedRows).toBe(rows);
  });

  it('rejects when colId references an unknown column', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'a' })];
    const out = sortPass({
      rows,
      sortSpec: [{ colId: 'does-not-exist', direction: 'asc' }],
      columns,
    });
    expect(out.rejected).toBe(true);
    expect(out.sortedRows).toBe(rows);
  });

  it('stable secondary order — rows with equal sort keys preserve input order', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'a' }),
      row('r2', { name: 'a' }),
      row('r3', { name: 'b' }),
      row('r4', { name: 'a' }),
      row('r5', { name: 'b' }),
    ];
    const out = sortPass({
      rows,
      sortSpec: [{ colId: 'name', direction: 'asc' }],
      columns,
    });
    // All 'a' rows precede 'b' rows; within each group input order
    // (r1, r2, r4 / r3, r5) preserved by the secondary idx comparator.
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r1', 'r2', 'r4', 'r3', 'r5']);
  });

  it('honors column.valueGetter when computing sort key', () => {
    // valueGetter returns the inverse of the raw field — the sort
    // order should follow the valueGetter output, not row.data.qty.
    const computedColumns: readonly ColumnSpec[] = [
      {
        id: 'inv',
        valueGetter: ({ row: r }) => -(r.data['qty'] as number),
      },
    ];
    const rows: readonly RowSpec[] = [
      row('r1', { qty: 10 }),
      row('r2', { qty: 2 }),
      row('r3', { qty: 9 }),
    ];
    const out = sortPass({
      rows,
      sortSpec: [{ colId: 'inv', direction: 'asc' }],
      columns: computedColumns,
    });
    // valueGetter yields -10, -2, -9; ASC order is -10, -9, -2 → r1, r3, r2.
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r1', 'r3', 'r2']);
  });

  it('does not mutate the input rows array', () => {
    const rows: readonly RowSpec[] = Object.freeze([
      row('r1', { qty: 3 }),
      row('r2', { qty: 1 }),
      row('r3', { qty: 2 }),
    ]);
    // Freezing the array would throw if sortPass mutated it.
    expect(() => {
      sortPass({ rows, sortSpec: [{ colId: 'qty', direction: 'asc' }], columns });
    }).not.toThrow();
    expect(rows.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
  });

  // ============================================================
  // Phase 8.1 (2026-05-24): multi-column lex-order sort
  // ============================================================

  it('Phase 8.1: empty SortSpec[] → identity (returns input rows by reference)', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'b' }), row('r2', { name: 'a' })];
    const out = sortPass({ rows, sortSpec: [], columns });
    expect(out.rejected).toBe(false);
    expect(out.sortedRows).toBe(rows);
  });

  it('Phase 8.1: 2-key ASC+ASC — first key orders, ties broken by second key', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'region', field: 'region' },
      { id: 'qty', field: 'qty' },
    ];
    const rows: readonly RowSpec[] = [
      row('r1', { region: 'B', qty: 30 }),
      row('r2', { region: 'A', qty: 20 }),
      row('r3', { region: 'B', qty: 10 }),
      row('r4', { region: 'A', qty: 50 }),
      row('r5', { region: 'A', qty: 10 }),
    ];
    const out = sortPass({
      rows,
      sortSpec: [
        { colId: 'region', direction: 'asc' },
        { colId: 'qty', direction: 'asc' },
      ],
      columns: cols,
    });
    // Region ASC = A...A...A..B..B; within each region qty ASC.
    // A-group qtys: 20 (r2), 50 (r4), 10 (r5) → 10, 20, 50 = r5, r2, r4.
    // B-group qtys: 30 (r1), 10 (r3) → 10, 30 = r3, r1.
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r5', 'r2', 'r4', 'r3', 'r1']);
  });

  it('Phase 8.1: 2-key ASC+DESC — mixed-direction tie-break', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'region', field: 'region' },
      { id: 'qty', field: 'qty' },
    ];
    const rows: readonly RowSpec[] = [
      row('r1', { region: 'B', qty: 30 }),
      row('r2', { region: 'A', qty: 20 }),
      row('r3', { region: 'B', qty: 10 }),
      row('r4', { region: 'A', qty: 50 }),
      row('r5', { region: 'A', qty: 10 }),
    ];
    const out = sortPass({
      rows,
      sortSpec: [
        { colId: 'region', direction: 'asc' },
        { colId: 'qty', direction: 'desc' },
      ],
      columns: cols,
    });
    // Region ASC; within each region qty DESC.
    // A: 50, 20, 10 → r4, r2, r5. B: 30, 10 → r1, r3.
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r4', 'r2', 'r5', 'r1', 'r3']);
  });

  it('Phase 8.1: first key uniquely orders → second key never consulted (regression)', () => {
    // If we accidentally cross-compared, a custom 2nd-key comparator
    // that always throws would still be hit. By making it throw, we
    // verify the lex-order short-circuit.
    let secondKeyCallCount = 0;
    const cols: readonly ColumnSpec[] = [
      { id: 'region', field: 'region' },
      {
        id: 'audit',
        field: 'audit',
        comparator: (a, b) => {
          secondKeyCallCount += 1;
          return String(a).localeCompare(String(b));
        },
      },
    ];
    const rows: readonly RowSpec[] = [
      row('r1', { region: 'C', audit: 'x' }),
      row('r2', { region: 'A', audit: 'y' }),
      row('r3', { region: 'B', audit: 'z' }),
    ];
    sortPass({
      rows,
      sortSpec: [
        { colId: 'region', direction: 'asc' },
        { colId: 'audit', direction: 'asc' },
      ],
      columns: cols,
    });
    // All region values unique → first-key compare always returns non-zero
    // → second key never consulted.
    expect(secondKeyCallCount).toBe(0);
  });

  it('Phase 8.1: all keys equal → tie-break by original index (stable)', () => {
    const cols: readonly ColumnSpec[] = [
      { id: 'region', field: 'region' },
      { id: 'qty', field: 'qty' },
    ];
    const rows: readonly RowSpec[] = [
      row('r1', { region: 'A', qty: 5 }),
      row('r2', { region: 'A', qty: 5 }),
      row('r3', { region: 'A', qty: 5 }),
    ];
    const out = sortPass({
      rows,
      sortSpec: [
        { colId: 'region', direction: 'asc' },
        { colId: 'qty', direction: 'desc' },
      ],
      columns: cols,
    });
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);
  });

  it('Phase 8.1: rejection cascade — invalid colId anywhere in the array rejects the whole sort', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'b', qty: 30 }),
      row('r2', { name: 'a', qty: 20 }),
    ];
    // Valid first entry, invalid second entry: still rejects atomically.
    const out1 = sortPass({
      rows,
      sortSpec: [
        { colId: 'name', direction: 'asc' },
        { colId: 'frozen', direction: 'asc' }, // sortable: false
      ],
      columns,
    });
    expect(out1.rejected).toBe(true);
    expect(out1.sortedRows).toBe(rows);
    // Unknown colId mid-array: same.
    const out2 = sortPass({
      rows,
      sortSpec: [
        { colId: 'name', direction: 'asc' },
        { colId: 'does-not-exist', direction: 'asc' },
      ],
      columns,
    });
    expect(out2.rejected).toBe(true);
    expect(out2.sortedRows).toBe(rows);
  });

  // Phase 30.1.2 (2026-05-28): tree-aware sort recurses into `children`.

  it('Phase 30.1.2: sorts siblings within each parent (recursive descent)', () => {
    const rows: readonly RowSpec[] = [
      {
        id: 'p',
        data: { name: 'parent' },
        children: [
          row('p-c', { name: 'gamma' }),
          row('p-a', { name: 'alpha' }),
          row('p-b', { name: 'beta' }),
        ],
      },
    ];
    const spec: SortSpec = { colId: 'name', direction: 'asc' };
    const out = sortPass({ rows, sortSpec: [spec], columns });
    expect(out.rejected).toBe(false);
    expect(out.sortedRows).toHaveLength(1);
    const parent = out.sortedRows[0]!;
    expect(parent.children?.map((r) => r.id)).toEqual(['p-a', 'p-b', 'p-c']);
  });

  it('Phase 30.1.2: sorts top-level AND nested levels with the same spec', () => {
    const rows: readonly RowSpec[] = [
      {
        id: 'p-b',
        data: { name: 'beta-parent' },
        children: [row('p-b-2', { name: 'cherry' }), row('p-b-1', { name: 'apple' })],
      },
      {
        id: 'p-a',
        data: { name: 'alpha-parent' },
        children: [row('p-a-2', { name: 'banana' }), row('p-a-1', { name: 'apple' })],
      },
    ];
    const spec: SortSpec = { colId: 'name', direction: 'asc' };
    const out = sortPass({ rows, sortSpec: [spec], columns });
    expect(out.sortedRows.map((r) => r.id)).toEqual(['p-a', 'p-b']);
    expect(out.sortedRows[0]!.children?.map((r) => r.id)).toEqual(['p-a-1', 'p-a-2']);
    expect(out.sortedRows[1]!.children?.map((r) => r.id)).toEqual(['p-b-1', 'p-b-2']);
  });

  it('Phase 30.1.2: descending direction propagates to children', () => {
    const rows: readonly RowSpec[] = [
      {
        id: 'p',
        data: { name: 'parent' },
        children: [row('c-a', { name: 'alpha' }), row('c-b', { name: 'beta' })],
      },
    ];
    const spec: SortSpec = { colId: 'name', direction: 'desc' };
    const out = sortPass({ rows, sortSpec: [spec], columns });
    expect(out.sortedRows[0]!.children?.map((r) => r.id)).toEqual(['c-b', 'c-a']);
  });

  it('Phase 30.1.2: identity-preserves when children already in sorted order', () => {
    const sortedChild1 = row('c-a', { name: 'alpha' });
    const sortedChild2 = row('c-b', { name: 'beta' });
    const parent: RowSpec = {
      id: 'p',
      data: { name: 'parent' },
      children: [sortedChild1, sortedChild2],
    };
    const rows: readonly RowSpec[] = [parent];
    const spec: SortSpec = { colId: 'name', direction: 'asc' };
    const out = sortPass({ rows, sortSpec: [spec], columns });
    // The parent's children should be the SAME array reference because
    // they were already in sort order — the recursive walker should
    // detect anySwap=false and return the input reference.
    expect(out.sortedRows[0]!.children).toBe(parent.children);
  });

  it('Phase 30.1.2: flat input keeps existing fast-path (no children anywhere)', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'b' }), row('r2', { name: 'a' })];
    const spec: SortSpec = { colId: 'name', direction: 'asc' };
    const out = sortPass({ rows, sortSpec: [spec], columns });
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r2', 'r1']);
    // No tree-recursion overhead; result is the flat-sort indexed.map().
  });
});

import { describe, expect, it } from 'vitest';

import { filterPass } from './filter-pass.js';
import { sortPass } from './sort-pass.js';

import type { ColumnSpec, FilterSpec, RowSpec, SortSpec } from '../ir/index.js';

const columns: readonly ColumnSpec[] = [
  { id: 'name', field: 'name' },
  { id: 'status', field: 'status' },
  { id: 'note', field: 'note' },
  { id: 'qty', field: 'qty' },
  { id: 'frozen', field: 'frozen', filterable: false },
];

function row(id: string, data: Record<string, unknown>): RowSpec {
  return { id, data };
}

describe('filterPass', () => {
  it('returns identity {filteredRows: rows, rejected: false} when filterSpec is null', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'a' }), row('r2', { name: 'b' })];
    const out = filterPass({ rows, filterSpec: null, columns });
    expect(out.rejected).toBe(false);
    expect(out.filteredRows).toBe(rows);
  });

  it('returns identity when filterSpec is an empty array', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'a' })];
    const out = filterPass({ rows, filterSpec: [], columns });
    expect(out.rejected).toBe(false);
    expect(out.filteredRows).toBe(rows);
  });

  it('contains operator (default case-insensitive) matches substrings', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'Alpha needs review' }),
      row('r2', { name: 'Beta complete' }),
      row('r3', { name: 'ALPHA-2 in progress' }),
      row('r4', { name: 'gamma kickoff' }),
    ];
    const spec: FilterSpec = { type: 'text', colId: 'name', operator: 'contains', value: 'alpha' };
    const out = filterPass({ rows, filterSpec: [spec], columns });
    expect(out.rejected).toBe(false);
    // r1 and r3 both contain 'alpha' case-insensitively.
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r3']);
  });

  it('equals operator matches exact whole-cell strings (case-insensitive default)', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { status: 'OK' }),
      row('r2', { status: 'ok' }),
      row('r3', { status: 'OK with caveats' }),
      row('r4', { status: 'WIP' }),
    ];
    const spec: FilterSpec = { type: 'text', colId: 'status', operator: 'equals', value: 'ok' };
    const out = filterPass({ rows, filterSpec: [spec], columns });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r2']);
  });

  it('startsWith / endsWith operators are anchored', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'alpha-prefix' }),
      row('r2', { name: 'mid-alpha-mid' }),
      row('r3', { name: 'suffix-alpha' }),
    ];
    const starts = filterPass({
      rows,
      filterSpec: [{ type: 'text', colId: 'name', operator: 'startsWith', value: 'alpha' }],
      columns,
    });
    expect(starts.filteredRows.map((r) => r.id)).toEqual(['r1']);
    const ends = filterPass({
      rows,
      filterSpec: [{ type: 'text', colId: 'name', operator: 'endsWith', value: 'alpha' }],
      columns,
    });
    expect(ends.filteredRows.map((r) => r.id)).toEqual(['r3']);
  });

  it('caseSensitive: true requires exact-case match for contains', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'Alpha bar' }),
      row('r2', { name: 'ALPHA-2' }),
      row('r3', { name: 'alpha quick' }),
    ];
    const spec: FilterSpec = {
      type: 'text',
      colId: 'name',
      operator: 'contains',
      value: 'Alpha',
      caseSensitive: true,
    };
    const out = filterPass({ rows, filterSpec: [spec], columns });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1']);
  });

  it('multi-spec AND: row must pass every filter to be included', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'alpha', status: 'OK', note: 'ok' }),
      row('r2', { name: 'alpha', status: 'WIP', note: 'late' }),
      row('r3', { name: 'beta', status: 'OK', note: 'ok' }),
      row('r4', { name: 'alpha', status: 'OK', note: 'late' }),
    ];
    const out = filterPass({
      rows,
      filterSpec: [
        { type: 'text', colId: 'name', operator: 'contains', value: 'alpha' },
        { type: 'text', colId: 'status', operator: 'equals', value: 'OK' },
      ],
      columns,
    });
    // r1 + r4 match both; r2 fails status; r3 fails name.
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r4']);
  });

  it('empty value (value: "") is a no-op — does NOT exclude any row', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'a' }), row('r2', { name: 'b' })];
    const out = filterPass({
      rows,
      filterSpec: [{ type: 'text', colId: 'name', operator: 'contains', value: '' }],
      columns,
    });
    // Identity short-circuit: all-empty values returns input by reference.
    expect(out.filteredRows).toBe(rows);
    expect(out.rejected).toBe(false);
  });

  it('null / undefined cell value never matches a non-empty text filter (excluded)', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'alpha' }),
      row('r2', { name: null }),
      row('r3', { name: undefined }),
      row('r4', { name: 'alpha-2' }),
    ];
    const out = filterPass({
      rows,
      filterSpec: [{ type: 'text', colId: 'name', operator: 'contains', value: 'alpha' }],
      columns,
    });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r4']);
  });

  it('rejects atomically when colId references a column with filterable === false', () => {
    const rows: readonly RowSpec[] = [row('r1', { frozen: 'a' }), row('r2', { frozen: 'b' })];
    const out = filterPass({
      rows,
      filterSpec: [{ type: 'text', colId: 'frozen', operator: 'contains', value: 'a' }],
      columns,
    });
    expect(out.rejected).toBe(true);
    expect(out.filteredRows).toBe(rows);
  });

  it('rejects when any colId in the array is unknown', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'a' })];
    const out = filterPass({
      rows,
      filterSpec: [
        { type: 'text', colId: 'name', operator: 'contains', value: 'a' },
        { type: 'text', colId: 'does-not-exist', operator: 'contains', value: 'x' },
      ],
      columns,
    });
    expect(out.rejected).toBe(true);
    expect(out.filteredRows).toBe(rows);
  });

  it('honors column.valueGetter when computing the filter value', () => {
    const customCols: readonly ColumnSpec[] = [
      {
        id: 'fullname',
        valueGetter: ({ row: r }) => {
          const first = (r.data['first'] as string | undefined) ?? '';
          const last = (r.data['last'] as string | undefined) ?? '';
          return `${first} ${last}`.trim();
        },
      },
    ];
    const rows: readonly RowSpec[] = [
      row('r1', { first: 'Ada', last: 'Lovelace' }),
      row('r2', { first: 'Grace', last: 'Hopper' }),
      row('r3', { first: 'Linus', last: 'Torvalds' }),
    ];
    const out = filterPass({
      rows,
      filterSpec: [{ type: 'text', colId: 'fullname', operator: 'contains', value: 'lov' }],
      columns: customCols,
    });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1']);
  });

  it('compose filterPass then sortPass — subset filtered first, then ordered', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'alpha', qty: 30 }),
      row('r2', { name: 'beta', qty: 50 }),
      row('r3', { name: 'alpha-2', qty: 10 }),
      row('r4', { name: 'alpha-3', qty: 20 }),
      row('r5', { name: 'gamma', qty: 5 }),
    ];
    const filtered = filterPass({
      rows,
      filterSpec: [{ type: 'text', colId: 'name', operator: 'contains', value: 'alpha' }],
      columns,
    });
    // 3 rows pass filter; subsequent sortPass orders by qty ASC.
    const sorted: SortSpec[] = [{ colId: 'qty', direction: 'asc' }];
    const out = sortPass({ rows: filtered.filteredRows, sortSpec: sorted, columns });
    expect(out.sortedRows.map((r) => r.id)).toEqual(['r3', 'r4', 'r1']);
  });

  it('returns input array by reference when no spec has a non-empty value', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'a' }), row('r2', { name: 'b' })];
    const out = filterPass({
      rows,
      filterSpec: [
        { type: 'text', colId: 'name', operator: 'contains', value: '' },
        { type: 'text', colId: 'note', operator: 'contains', value: '' },
      ],
      columns,
    });
    expect(out.filteredRows).toBe(rows);
  });

  // ============================================================
  // Phase 9.1 (2026-05-24): number filter variant
  // ============================================================

  it('Phase 9.1: NumberFilterSpec "=" matches exact numeric value', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { qty: 10 }),
      row('r2', { qty: 20 }),
      row('r3', { qty: 10 }),
      row('r4', { qty: 5 }),
    ];
    const out = filterPass({
      rows,
      filterSpec: [{ type: 'number', colId: 'qty', operator: '=', value: 10 }],
      columns,
    });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r3']);
  });

  it('Phase 9.1: "!=" excludes only the exact value', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { qty: 10 }),
      row('r2', { qty: 20 }),
      row('r3', { qty: 10 }),
    ];
    const out = filterPass({
      rows,
      filterSpec: [{ type: 'number', colId: 'qty', operator: '!=', value: 10 }],
      columns,
    });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r2']);
  });

  it('Phase 9.1: ">" and "<" are half-open exclusive', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { qty: 5 }),
      row('r2', { qty: 10 }),
      row('r3', { qty: 15 }),
      row('r4', { qty: 20 }),
    ];
    const gt = filterPass({
      rows,
      filterSpec: [{ type: 'number', colId: 'qty', operator: '>', value: 10 }],
      columns,
    });
    expect(gt.filteredRows.map((r) => r.id)).toEqual(['r3', 'r4']);
    const lt = filterPass({
      rows,
      filterSpec: [{ type: 'number', colId: 'qty', operator: '<', value: 10 }],
      columns,
    });
    expect(lt.filteredRows.map((r) => r.id)).toEqual(['r1']);
  });

  it('Phase 9.1: ">=" and "<=" are half-open inclusive', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { qty: 5 }),
      row('r2', { qty: 10 }),
      row('r3', { qty: 15 }),
    ];
    const gte = filterPass({
      rows,
      filterSpec: [{ type: 'number', colId: 'qty', operator: '>=', value: 10 }],
      columns,
    });
    expect(gte.filteredRows.map((r) => r.id)).toEqual(['r2', 'r3']);
    const lte = filterPass({
      rows,
      filterSpec: [{ type: 'number', colId: 'qty', operator: '<=', value: 10 }],
      columns,
    });
    expect(lte.filteredRows.map((r) => r.id)).toEqual(['r1', 'r2']);
  });

  it('Phase 9.1: "inRange" includes both endpoints', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { qty: 5 }),
      row('r2', { qty: 10 }),
      row('r3', { qty: 20 }),
      row('r4', { qty: 30 }),
      row('r5', { qty: 35 }),
    ];
    const out = filterPass({
      rows,
      filterSpec: [{ type: 'number', colId: 'qty', operator: 'inRange', value: 10, valueTo: 30 }],
      columns,
    });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r2', 'r3', 'r4']);
  });

  it('Phase 9.1: "inRange" auto-normalizes swapped endpoints (value > valueTo)', () => {
    // Defensive: consumer passing { value: 30, valueTo: 10 } should
    // be treated the same as { value: 10, valueTo: 30 }.
    const rows: readonly RowSpec[] = [row('r1', { qty: 15 }), row('r2', { qty: 100 })];
    const out = filterPass({
      rows,
      filterSpec: [{ type: 'number', colId: 'qty', operator: 'inRange', value: 30, valueTo: 10 }],
      columns,
    });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1']);
  });

  it('Phase 9.1: cell value of "10" (string) does NOT match number filter (type-strict)', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { qty: 10 }),
      row('r2', { qty: '10' }),
      row('r3', { qty: '15' }),
    ];
    const out = filterPass({
      rows,
      filterSpec: [{ type: 'number', colId: 'qty', operator: '=', value: 10 }],
      columns,
    });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1']);
  });

  it('Phase 9.1: NaN / Infinity / null / undefined cell values never match', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { qty: 10 }),
      row('r2', { qty: NaN }),
      row('r3', { qty: Infinity }),
      row('r4', { qty: null }),
      row('r5', { qty: undefined }),
    ];
    const out = filterPass({
      rows,
      filterSpec: [{ type: 'number', colId: 'qty', operator: '>', value: 0 }],
      columns,
    });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r1']);
  });

  it('Phase 9.1: mixed text + number multi-spec AND across types', () => {
    const rows: readonly RowSpec[] = [
      row('r1', { name: 'alpha', qty: 10 }),
      row('r2', { name: 'alpha', qty: 50 }),
      row('r3', { name: 'beta', qty: 10 }),
      row('r4', { name: 'alpha', qty: 30 }),
    ];
    const out = filterPass({
      rows,
      filterSpec: [
        { type: 'text', colId: 'name', operator: 'contains', value: 'alpha' },
        { type: 'number', colId: 'qty', operator: '>=', value: 20 },
      ],
      columns,
    });
    // r1 fails qty (10 < 20); r2 passes both; r3 fails name; r4 passes both.
    expect(out.filteredRows.map((r) => r.id)).toEqual(['r2', 'r4']);
  });

  // Phase 30 (2026-05-28): tree-recursive filter walks `children` and
  // preserves ancestors of matching descendants per Decision F.1.

  it('returns empty filterForceExpandedRowIds when no filter active', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'a' }), row('r2', { name: 'b' })];
    const out = filterPass({ rows, filterSpec: null, columns });
    expect(out.filterForceExpandedRowIds).toEqual([]);
  });

  it('returns empty filterForceExpandedRowIds for flat input even with active filter', () => {
    const rows: readonly RowSpec[] = [row('r1', { name: 'alpha' }), row('r2', { name: 'beta' })];
    const spec: FilterSpec = { type: 'text', colId: 'name', operator: 'contains', value: 'alpha' };
    const out = filterPass({ rows, filterSpec: [spec], columns });
    expect(out.filterForceExpandedRowIds).toEqual([]);
  });

  it('preserves ancestor when descendant matches (force-expand emitted)', () => {
    const child: RowSpec = { id: 'c1', data: { name: 'matchme' } };
    const parent: RowSpec = { id: 'p', data: { name: 'parent' }, children: [child] };
    const rows: readonly RowSpec[] = [parent, row('other', { name: 'other' })];
    const spec: FilterSpec = {
      type: 'text',
      colId: 'name',
      operator: 'contains',
      value: 'matchme',
    };
    const out = filterPass({ rows, filterSpec: [spec], columns });
    // Parent is preserved + flagged for auto-expand; `other` is dropped.
    expect(out.filteredRows.map((r) => r.id)).toEqual(['p']);
    expect(out.filterForceExpandedRowIds).toEqual(['p']);
    expect(out.filteredRows[0]?.children?.map((c) => c.id)).toEqual(['c1']);
  });

  it('does NOT force-expand a parent that matches itself', () => {
    const child: RowSpec = { id: 'c1', data: { name: 'alpha-child' } };
    const parent: RowSpec = { id: 'p', data: { name: 'alpha-parent' }, children: [child] };
    const rows: readonly RowSpec[] = [parent];
    const spec: FilterSpec = { type: 'text', colId: 'name', operator: 'contains', value: 'alpha' };
    const out = filterPass({ rows, filterSpec: [spec], columns });
    // Parent matches itself, so it's not force-expanded; descendant also
    // matches → both visible.
    expect(out.filteredRows.map((r) => r.id)).toEqual(['p']);
    expect(out.filterForceExpandedRowIds).toEqual([]);
  });

  it('multi-level: deep descendant match force-expands the whole ancestor chain', () => {
    const grandchild: RowSpec = { id: 'gc', data: { name: 'matchme' } };
    const child: RowSpec = { id: 'c', data: { name: 'child' }, children: [grandchild] };
    const parent: RowSpec = { id: 'p', data: { name: 'parent' }, children: [child] };
    const rows: readonly RowSpec[] = [parent];
    const spec: FilterSpec = {
      type: 'text',
      colId: 'name',
      operator: 'contains',
      value: 'matchme',
    };
    const out = filterPass({ rows, filterSpec: [spec], columns });
    expect(out.filteredRows.map((r) => r.id)).toEqual(['p']);
    // Both `p` and `c` are ancestors-only; both force-expand.
    expect(new Set(out.filterForceExpandedRowIds)).toEqual(new Set(['p', 'c']));
  });

  it('parent with all-pruned descendants is dropped unless self matches', () => {
    const child: RowSpec = { id: 'c', data: { name: 'no-match' } };
    const parent: RowSpec = { id: 'p', data: { name: 'no-match' }, children: [child] };
    const rows: readonly RowSpec[] = [parent];
    const spec: FilterSpec = {
      type: 'text',
      colId: 'name',
      operator: 'contains',
      value: 'matchme',
    };
    const out = filterPass({ rows, filterSpec: [spec], columns });
    expect(out.filteredRows).toEqual([]);
    expect(out.filterForceExpandedRowIds).toEqual([]);
  });

  describe('Phase 42 ExpressionFilterSpec variant', () => {
    it('matches a single retained row via expression spec', () => {
      const rows: readonly RowSpec[] = [
        row('r1', { qty: 5 }),
        row('r2', { qty: 15 }),
        row('r3', { qty: 100 }),
      ];
      const spec: FilterSpec = {
        type: 'expression',
        expression: {
          kind: 'compare',
          colId: 'qty',
          operator: '>',
          value: 10,
        },
      };
      const out = filterPass({ rows, filterSpec: [spec], columns });
      expect(out.rejected).toBe(false);
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r2', 'r3']);
    });

    it('coexists with TextFilterSpec (both predicates AND in per-row walk)', () => {
      const rows: readonly RowSpec[] = [
        row('r1', { name: 'alpha', qty: 5 }),
        row('r2', { name: 'alpha', qty: 15 }),
        row('r3', { name: 'beta', qty: 20 }),
      ];
      const textSpec: FilterSpec = {
        type: 'text',
        colId: 'name',
        operator: 'contains',
        value: 'alpha',
      };
      const exprSpec: FilterSpec = {
        type: 'expression',
        expression: {
          kind: 'compare',
          colId: 'qty',
          operator: '>',
          value: 10,
        },
      };
      const out = filterPass({ rows, filterSpec: [textSpec, exprSpec], columns });
      expect(out.rejected).toBe(false);
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r2']);
    });

    it('coexists with NumberFilterSpec', () => {
      const rows: readonly RowSpec[] = [
        row('r1', { qty: 5, name: 'alpha' }),
        row('r2', { qty: 15, name: 'beta' }),
        row('r3', { qty: 25, name: 'beta' }),
      ];
      const numSpec: FilterSpec = {
        type: 'number',
        colId: 'qty',
        operator: '>',
        value: 10,
      };
      const exprSpec: FilterSpec = {
        type: 'expression',
        expression: {
          kind: 'compare',
          colId: 'name',
          operator: '=',
          value: 'beta',
        },
      };
      const out = filterPass({ rows, filterSpec: [numSpec, exprSpec], columns });
      expect(out.rejected).toBe(false);
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r2', 'r3']);
    });

    it('atomic rejection when expression references unknown colId', () => {
      const rows: readonly RowSpec[] = [row('r1', { qty: 5 })];
      const spec: FilterSpec = {
        type: 'expression',
        expression: {
          kind: 'compare',
          colId: 'notAColumn',
          operator: '=',
          value: 1,
        },
      };
      const out = filterPass({ rows, filterSpec: [spec], columns });
      expect(out.rejected).toBe(true);
      expect(out.filteredRows).toBe(rows);
    });

    it('atomic rejection when expression references filterable:false column', () => {
      const rows: readonly RowSpec[] = [row('r1', { frozen: 'x' })];
      const spec: FilterSpec = {
        type: 'expression',
        expression: {
          kind: 'compare',
          colId: 'frozen',
          operator: '=',
          value: 'x',
        },
      };
      const out = filterPass({ rows, filterSpec: [spec], columns });
      expect(out.rejected).toBe(true);
    });

    it('tree-aware: descendant expression match retains ancestor + force-expand', () => {
      const grandchild: RowSpec = { id: 'g', data: { qty: 100 } };
      const child: RowSpec = { id: 'c', data: { qty: 1 }, children: [grandchild] };
      const parent: RowSpec = { id: 'p', data: { qty: 1 }, children: [child] };
      const rows: readonly RowSpec[] = [parent];
      const spec: FilterSpec = {
        type: 'expression',
        expression: {
          kind: 'compare',
          colId: 'qty',
          operator: '>',
          value: 50,
        },
      };
      const out = filterPass({ rows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['p']);
      expect(new Set(out.filterForceExpandedRowIds)).toEqual(new Set(['p', 'c']));
    });
  });

  describe('Phase 43 SetFilterSpec variant', () => {
    it('selectedValues: null → identity (no filter applied)', () => {
      const rows: readonly RowSpec[] = [
        row('r1', { status: 'done' }),
        row('r2', { status: 'wip' }),
      ];
      const spec: FilterSpec = { type: 'set', colId: 'status', selectedValues: null };
      const out = filterPass({ rows, filterSpec: [spec], columns });
      expect(out.rejected).toBe(false);
      // null is identity → predicate factory returns null → spec
      // contributes no exclusion. Output array MUST equal input.
      expect(out.filteredRows).toEqual(rows);
    });

    it('selectedValues: [] → vacuous false (no rows pass)', () => {
      const rows: readonly RowSpec[] = [
        row('r1', { status: 'done' }),
        row('r2', { status: 'wip' }),
      ];
      const spec: FilterSpec = { type: 'set', colId: 'status', selectedValues: [] };
      const out = filterPass({ rows, filterSpec: [spec], columns });
      expect(out.rejected).toBe(false);
      expect(out.filteredRows).toEqual([]);
    });

    it("selectedValues: ['done'] → only rows with matching value retained", () => {
      const rows: readonly RowSpec[] = [
        row('r1', { status: 'done' }),
        row('r2', { status: 'wip' }),
        row('r3', { status: 'done' }),
      ];
      const spec: FilterSpec = {
        type: 'set',
        colId: 'status',
        selectedValues: ['done'],
      };
      const out = filterPass({ rows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r3']);
    });

    it('selectedValues: [null] → only null/undefined/missing cells retained', () => {
      const rows: readonly RowSpec[] = [
        row('r1', { status: null }),
        row('r2', { status: 'done' }),
        row('r3', { status: undefined }),
        row('r4', {}),
      ];
      const spec: FilterSpec = {
        type: 'set',
        colId: 'status',
        selectedValues: [null],
      };
      const out = filterPass({ rows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r3', 'r4']);
    });

    it("selectedValues: ['done', null] → both string and null cells retained", () => {
      const rows: readonly RowSpec[] = [
        row('r1', { status: 'done' }),
        row('r2', { status: 'wip' }),
        row('r3', { status: null }),
      ];
      const spec: FilterSpec = {
        type: 'set',
        colId: 'status',
        selectedValues: ['done', null],
      };
      const out = filterPass({ rows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r3']);
    });

    it('atomic rejection on unknown colId / filterable:false column', () => {
      const rows: readonly RowSpec[] = [row('r1', { status: 'done' })];
      const unknownSpec: FilterSpec = {
        type: 'set',
        colId: 'notAColumn',
        selectedValues: ['done'],
      };
      const out1 = filterPass({ rows, filterSpec: [unknownSpec], columns });
      expect(out1.rejected).toBe(true);

      const frozenSpec: FilterSpec = {
        type: 'set',
        colId: 'frozen',
        selectedValues: ['x'],
      };
      const out2 = filterPass({ rows, filterSpec: [frozenSpec], columns });
      expect(out2.rejected).toBe(true);
    });

    it('coexists with TextFilterSpec in multi-spec AND walk', () => {
      const rows: readonly RowSpec[] = [
        row('r1', { status: 'done', name: 'alpha task' }),
        row('r2', { status: 'done', name: 'beta task' }),
        row('r3', { status: 'wip', name: 'alpha task' }),
      ];
      const setSpec: FilterSpec = {
        type: 'set',
        colId: 'status',
        selectedValues: ['done'],
      };
      const textSpec: FilterSpec = {
        type: 'text',
        colId: 'name',
        operator: 'contains',
        value: 'alpha',
      };
      const out = filterPass({ rows, filterSpec: [setSpec, textSpec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r1']);
    });
  });

  describe('Phase 102 MultiFilterSpec variant', () => {
    const phaseRows: readonly RowSpec[] = [
      row('r1', { status: 'pending-urgent', qty: 10 }),
      row('r2', { status: 'pending-blocked', qty: 50 }),
      row('r3', { status: 'pending-normal', qty: 30 }),
      row('r4', { status: 'complete', qty: 60 }),
    ];

    it('Phase 102: empty filters array → identity (returns input by reference)', () => {
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.rejected).toBe(false);
      expect(out.filteredRows).toBe(phaseRows);
    });

    it('Phase 102: single child reduces to that child predicate', () => {
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [{ type: 'text', operator: 'contains', value: 'urgent' }],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r1']);
    });

    it('Phase 102: 2-child AND mode requires both predicates to match', () => {
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [
          { type: 'text', operator: 'startsWith', value: 'pending' },
          { type: 'text', operator: 'contains', value: 'blocked' },
        ],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r2']);
    });

    it('Phase 102: 2-child OR mode passes rows matching either predicate', () => {
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'OR',
        filters: [
          { type: 'text', operator: 'contains', value: 'urgent' },
          { type: 'text', operator: 'contains', value: 'blocked' },
        ],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r2']);
    });

    it('Phase 102: mixed-type children (text + number) compose correctly under AND', () => {
      // status contains "pending" AND qty > 20 → r2 + r3 (not r1's qty=10).
      // r1 qty=10 fails number predicate; r4 'complete' fails text predicate.
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'qty',
        mode: 'AND',
        filters: [{ type: 'number', operator: '>', value: 20 }],
      };
      const textSpec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [{ type: 'text', operator: 'contains', value: 'pending' }],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec, textSpec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r2', 'r3']);
    });

    // Phase 116 (2026-06-02): set-child variant.
    it('Phase 116: set-child with selectedValues includes matching rows', () => {
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [{ type: 'set', selectedValues: ['pending-urgent', 'complete'] }],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r4']);
    });

    it('Phase 116: set-child with selectedValues: [] is vacuous-false (no rows pass)', () => {
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [{ type: 'set', selectedValues: [] }],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.filteredRows).toHaveLength(0);
    });

    it('Phase 116: set-child with selectedValues: null is identity (slot inactive)', () => {
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [{ type: 'set', selectedValues: null }],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.rejected).toBe(false);
      expect(out.filteredRows).toBe(phaseRows);
    });

    it('Phase 116: set-child composes with text-child under AND (set narrows, text filters)', () => {
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [
          { type: 'set', selectedValues: ['pending-urgent', 'pending-blocked', 'pending-normal'] },
          { type: 'text', operator: 'contains', value: 'urgent' },
        ],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r1']);
    });

    // Phase 117 (2026-06-02): nested groups.
    it('Phase 117: depth-1 group inside multi-filter behaves like a sub-predicate', () => {
      // (status contains "urgent" OR status contains "blocked") — same as flat
      // 2-child OR, but here wrapped in a group at root.
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [
          {
            type: 'group',
            mode: 'OR',
            filters: [
              { type: 'text', operator: 'contains', value: 'urgent' },
              { type: 'text', operator: 'contains', value: 'blocked' },
            ],
          },
        ],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r1', 'r2']);
    });

    it('Phase 117: AND-of-OR vs OR-of-AND yield distinct results', () => {
      // AND-of-OR: (contains "pending") AND (contains "urgent" OR contains "blocked")
      // → r1 (pending-urgent) + r2 (pending-blocked); not r3 (pending-normal), not r4
      const andOfOr: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [
          { type: 'text', operator: 'contains', value: 'pending' },
          {
            type: 'group',
            mode: 'OR',
            filters: [
              { type: 'text', operator: 'contains', value: 'urgent' },
              { type: 'text', operator: 'contains', value: 'blocked' },
            ],
          },
        ],
      };
      const out1 = filterPass({ rows: phaseRows, filterSpec: [andOfOr], columns });
      expect(out1.filteredRows.map((r) => r.id)).toEqual(['r1', 'r2']);
      // OR-of-AND: (contains "pending" AND contains "urgent")
      //         OR (contains "complete") → r1 + r4
      const orOfAnd: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'OR',
        filters: [
          {
            type: 'group',
            mode: 'AND',
            filters: [
              { type: 'text', operator: 'contains', value: 'pending' },
              { type: 'text', operator: 'contains', value: 'urgent' },
            ],
          },
          { type: 'text', operator: 'contains', value: 'complete' },
        ],
      };
      const out2 = filterPass({ rows: phaseRows, filterSpec: [orOfAnd], columns });
      expect(out2.filteredRows.map((r) => r.id)).toEqual(['r1', 'r4']);
    });

    it('Phase 117: depth-2 nested groups compose correctly', () => {
      // status contains "pending" AND (qty > 20 OR (status contains "urgent"))
      // → r1 (urgent, qty=10 fails > 20 but inner OR catches via urgent)
      //   r2 (blocked, qty=50 > 20)
      //   r3 (normal, qty=30 > 20)
      const numericSpec: FilterSpec = {
        type: 'multi',
        colId: 'qty',
        mode: 'AND',
        filters: [
          {
            type: 'group',
            mode: 'AND',
            filters: [{ type: 'number', operator: '>', value: 20 }],
          },
        ],
      };
      const textSpec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [{ type: 'text', operator: 'contains', value: 'pending' }],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [numericSpec, textSpec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r2', 'r3']);
    });

    it('Phase 117: empty group is identity (does not exclude any rows)', () => {
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [{ type: 'group', mode: 'AND', filters: [] }],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.rejected).toBe(false);
      expect(out.filteredRows).toBe(phaseRows);
    });

    it('Phase 117: all-empty-children group propagates identity', () => {
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [
          {
            type: 'group',
            mode: 'AND',
            filters: [
              { type: 'text', operator: 'contains', value: '' },
              { type: 'set', selectedValues: null },
            ],
          },
        ],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.rejected).toBe(false);
      expect(out.filteredRows).toBe(phaseRows);
    });

    it('Phase 117: deeply-nested group (depth-3) still evaluates correctly', () => {
      // status contains "urgent" wrapped 3 levels deep.
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'status',
        mode: 'AND',
        filters: [
          {
            type: 'group',
            mode: 'AND',
            filters: [
              {
                type: 'group',
                mode: 'AND',
                filters: [
                  {
                    type: 'group',
                    mode: 'AND',
                    filters: [{ type: 'text', operator: 'contains', value: 'urgent' }],
                  },
                ],
              },
            ],
          },
        ],
      };
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r1']);
    });

    it('Phase 117: mixed leaf + group at same level under AND combine', () => {
      // status contains "pending" AND (qty > 0 OR qty < 0)  — group OR matches all positives.
      const spec: FilterSpec = {
        type: 'multi',
        colId: 'qty',
        mode: 'AND',
        filters: [
          { type: 'number', operator: '>', value: 25 },
          {
            type: 'group',
            mode: 'OR',
            filters: [
              { type: 'number', operator: '<', value: 0 },
              { type: 'number', operator: '>', value: 35 },
            ],
          },
        ],
      };
      // qty > 25 AND (qty < 0 OR qty > 35) → r2 (qty=50) + r4 (qty=60).
      const out = filterPass({ rows: phaseRows, filterSpec: [spec], columns });
      expect(out.filteredRows.map((r) => r.id)).toEqual(['r2', 'r4']);
    });
  });
});

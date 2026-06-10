import { describe, expect, it } from 'vitest';

import { applyTableView, serializeTableView, type TableViewState } from './saved-table-view.js';

import type { ColumnSpec, FilterSpec, SortSpec } from '../ir/index.js';

const baseColumns: readonly ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID' },
  { id: 'name', field: 'name', headerName: 'Name', width: 200 },
  { id: 'qty', field: 'qty', headerName: 'Qty', type: 'number' },
  { id: 'price', field: 'price', headerName: 'Price', type: 'number', pinned: 'right' },
];

describe('serializeTableView', () => {
  it('pins version: 1 and round-trips an empty view', () => {
    const state = serializeTableView({
      columns: [],
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    });
    expect(state.version).toBe(1);
    expect(state.columns).toEqual([]);
    expect(state.sort).toEqual([]);
    expect(state.filter).toEqual([]);
    expect(state.page).toBe(0);
    expect(state.pageSize).toBe(20);

    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });

  it('projects only id when no drift fields are present', () => {
    const state = serializeTableView({
      columns: [baseColumns[0]!],
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    });
    expect(state.columns).toEqual([{ id: 'id' }]);
  });

  it('captures width / pinned / hide when present and omits absent fields', () => {
    const state = serializeTableView({
      columns: baseColumns,
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    });
    expect(state.columns).toEqual([
      { id: 'id' },
      { id: 'name', width: 200 },
      { id: 'qty' },
      { id: 'price', pinned: 'right' },
    ]);
  });

  it('passes sort / filter through verbatim', () => {
    const sort: readonly SortSpec[] = [{ colId: 'qty', direction: 'desc' }];
    const filter: readonly FilterSpec[] = [
      { type: 'text', colId: 'name', operator: 'contains', value: 'a' },
    ];
    const state = serializeTableView({
      columns: baseColumns,
      sort,
      filter,
      page: 2,
      pageSize: 10,
    });
    expect(state.sort).toEqual(sort);
    expect(state.filter).toEqual(filter);
    expect(state.page).toBe(2);
    expect(state.pageSize).toBe(10);
  });
});

describe('applyTableView', () => {
  it('round-trips serialize → apply unchanged when columns + state match', () => {
    const initialSort: readonly SortSpec[] = [{ colId: 'qty', direction: 'asc' }];
    const initialFilter: readonly FilterSpec[] = [
      { type: 'text', colId: 'name', operator: 'startsWith', value: 'A' },
    ];
    const saved = serializeTableView({
      columns: baseColumns,
      sort: initialSort,
      filter: initialFilter,
      page: 1,
      pageSize: 25,
    });
    const result = applyTableView(saved, baseColumns, [], [], 0, 20);

    expect(result.columns.map((c) => c.id)).toEqual(['id', 'name', 'qty', 'price']);
    expect(result.columns[1]!.width).toBe(200);
    expect(result.columns[3]!.pinned).toBe('right');
    expect(result.sort).toEqual(initialSort);
    expect(result.filter).toEqual(initialFilter);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
  });

  it('silently drops saved entries whose colId is missing from current columns', () => {
    const saved: TableViewState = {
      version: 1,
      columns: [{ id: 'gone' }, { id: 'name', width: 320 }, { id: 'id' }],
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    };
    const result = applyTableView(saved, baseColumns, [], [], 0, 20);
    expect(result.columns.map((c) => c.id)).toEqual(['name', 'id', 'qty', 'price']);
    expect(result.columns[0]!.width).toBe(320);
  });

  it('appends current columns absent from snapshot at the end in declared order', () => {
    const saved: TableViewState = {
      version: 1,
      columns: [{ id: 'qty' }, { id: 'id' }],
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    };
    const result = applyTableView(saved, baseColumns, [], [], 0, 20);
    expect(result.columns.map((c) => c.id)).toEqual(['qty', 'id', 'name', 'price']);
  });

  it('preserves saved width / hide / pinned over declared spec', () => {
    const saved: TableViewState = {
      version: 1,
      columns: [
        { id: 'id', hide: true },
        { id: 'name', width: 999 },
        { id: 'qty', pinned: 'left' },
        { id: 'price', pinned: null },
      ],
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    };
    const result = applyTableView(saved, baseColumns, [], [], 0, 20);
    expect(result.columns[0]!.hide).toBe(true);
    expect(result.columns[1]!.width).toBe(999);
    expect(result.columns[2]!.pinned).toBe('left');
    expect(result.columns[3]!.pinned).toBeNull();
  });

  it('drops sort entries referencing removed columns', () => {
    const saved: TableViewState = {
      version: 1,
      columns: [{ id: 'id' }, { id: 'name' }],
      sort: [
        { colId: 'gone', direction: 'asc' },
        { colId: 'name', direction: 'desc' },
      ],
      filter: [],
      page: 0,
      pageSize: 20,
    };
    const result = applyTableView(saved, baseColumns, [], [], 0, 20);
    expect(result.sort).toEqual([{ colId: 'name', direction: 'desc' }]);
  });

  it('drops filter entries referencing removed columns', () => {
    const saved: TableViewState = {
      version: 1,
      columns: [{ id: 'id' }, { id: 'qty' }],
      filter: [
        { type: 'text', colId: 'gone', operator: 'contains', value: 'x' },
        { type: 'number', colId: 'qty', operator: '>', value: 10 },
      ],
      sort: [],
      page: 0,
      pageSize: 20,
    };
    const result = applyTableView(saved, baseColumns, [], [], 0, 20);
    expect(result.filter).toEqual([{ type: 'number', colId: 'qty', operator: '>', value: 10 }]);
  });

  it('returns current state unchanged on unknown version', () => {
    const foreign = {
      version: 2,
      columns: [{ id: 'id' }],
      sort: [],
      filter: [],
      page: 5,
      pageSize: 5,
    } as unknown as TableViewState;
    const sort: readonly SortSpec[] = [{ colId: 'qty', direction: 'asc' }];
    const filter: readonly FilterSpec[] = [];
    const result = applyTableView(foreign, baseColumns, sort, filter, 3, 50);
    expect(result.columns).toBe(baseColumns);
    expect(result.sort).toBe(sort);
    expect(result.filter).toBe(filter);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it('handles empty snapshot columns by treating all current columns as newly added', () => {
    const saved: TableViewState = {
      version: 1,
      columns: [],
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    };
    const result = applyTableView(saved, baseColumns, [], [], 0, 20);
    expect(result.columns.map((c) => c.id)).toEqual(['id', 'name', 'qty', 'price']);
    expect(result.columns[3]!.pinned).toBe('right');
  });

  it('does not mutate the input columns array', () => {
    const saved = serializeTableView({
      columns: baseColumns,
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    });
    const beforeIds = baseColumns.map((c) => c.id);
    applyTableView(saved, baseColumns, [], [], 0, 20);
    expect(baseColumns.map((c) => c.id)).toEqual(beforeIds);
  });

  it('produces a fresh columns array (referentially distinct from input)', () => {
    const saved = serializeTableView({
      columns: baseColumns,
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    });
    const result = applyTableView(saved, baseColumns, [], [], 0, 20);
    expect(result.columns).not.toBe(baseColumns);
  });

  it('JSON-round-trips a non-trivial state without loss', () => {
    const original = serializeTableView({
      columns: baseColumns,
      sort: [{ colId: 'qty', direction: 'desc' }],
      filter: [{ type: 'number', colId: 'price', operator: '>=', value: 100 }],
      page: 3,
      pageSize: 50,
    });
    const round = JSON.parse(JSON.stringify(original)) as TableViewState;
    expect(round).toEqual(original);
    const result = applyTableView(round, baseColumns, [], [], 0, 20);
    expect(result.sort).toEqual(original.sort);
    expect(result.filter).toEqual(original.filter);
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it('merges saved fields on top of column-declared defaults without overwriting other fields', () => {
    const saved: TableViewState = {
      version: 1,
      columns: [{ id: 'name', width: 400 }],
      sort: [],
      filter: [],
      page: 0,
      pageSize: 20,
    };
    const result = applyTableView(saved, baseColumns, [], [], 0, 20);
    const nameCol = result.columns.find((c) => c.id === 'name')!;
    expect(nameCol.field).toBe('name');
    expect(nameCol.headerName).toBe('Name');
    expect(nameCol.width).toBe(400);
  });
});

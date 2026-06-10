import { describe, expect, it } from 'vitest';

import { formatColumnHeaderDescription } from './format-column-header-description.js';

import type { ColumnSpec, FilterSpec, SortSpec } from '../ir/index.js';

const nameCol: ColumnSpec = { id: 'name', field: 'name' };
const qtyCol: ColumnSpec = { id: 'qty', field: 'qty' };
const statusCol: ColumnSpec = { id: 'status', field: 'status' };

describe('formatColumnHeaderDescription', () => {
  it('empty string when neither sort nor filter applies', () => {
    expect(formatColumnHeaderDescription({ column: nameCol, sortSpec: [], filterSpec: [] })).toBe(
      '',
    );
  });

  it('single-column sort ascending — no position label', () => {
    const sortSpec: readonly SortSpec[] = [{ colId: 'name', direction: 'asc' }];
    expect(formatColumnHeaderDescription({ column: nameCol, sortSpec, filterSpec: [] })).toBe(
      'sorted ascending',
    );
  });

  it('single-column sort descending', () => {
    const sortSpec: readonly SortSpec[] = [{ colId: 'name', direction: 'desc' }];
    expect(formatColumnHeaderDescription({ column: nameCol, sortSpec, filterSpec: [] })).toBe(
      'sorted descending',
    );
  });

  it('multi-column sort — first column gets position 1', () => {
    const sortSpec: readonly SortSpec[] = [
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'desc' },
    ];
    expect(formatColumnHeaderDescription({ column: nameCol, sortSpec, filterSpec: [] })).toBe(
      'sorted ascending, position 1',
    );
  });

  it('multi-column sort — second column gets position 2', () => {
    const sortSpec: readonly SortSpec[] = [
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'desc' },
    ];
    expect(formatColumnHeaderDescription({ column: qtyCol, sortSpec, filterSpec: [] })).toBe(
      'sorted descending, position 2',
    );
  });

  it('multi-column sort — column not in spec returns no sort part', () => {
    const sortSpec: readonly SortSpec[] = [
      { colId: 'name', direction: 'asc' },
      { colId: 'qty', direction: 'desc' },
    ];
    expect(formatColumnHeaderDescription({ column: statusCol, sortSpec, filterSpec: [] })).toBe('');
  });

  it('text filter contains uses quoted value', () => {
    const filterSpec: readonly FilterSpec[] = [
      { type: 'text', colId: 'name', operator: 'contains', value: 'Alpha' },
    ];
    expect(formatColumnHeaderDescription({ column: nameCol, sortSpec: [], filterSpec })).toBe(
      'filter contains "Alpha"',
    );
  });

  it('text filter equals / startsWith / endsWith use friendly operator labels', () => {
    expect(
      formatColumnHeaderDescription({
        column: nameCol,
        sortSpec: [],
        filterSpec: [{ type: 'text', colId: 'name', operator: 'equals', value: 'X' }],
      }),
    ).toBe('filter equals "X"');
    expect(
      formatColumnHeaderDescription({
        column: nameCol,
        sortSpec: [],
        filterSpec: [{ type: 'text', colId: 'name', operator: 'startsWith', value: 'X' }],
      }),
    ).toBe('filter starts with "X"');
    expect(
      formatColumnHeaderDescription({
        column: nameCol,
        sortSpec: [],
        filterSpec: [{ type: 'text', colId: 'name', operator: 'endsWith', value: 'X' }],
      }),
    ).toBe('filter ends with "X"');
  });

  it('empty text filter value counts as no filter (matches filterPass semantics)', () => {
    const filterSpec: readonly FilterSpec[] = [
      { type: 'text', colId: 'name', operator: 'contains', value: '' },
    ];
    expect(formatColumnHeaderDescription({ column: nameCol, sortSpec: [], filterSpec })).toBe('');
  });

  it('number filter operators map to their symbol labels', () => {
    expect(
      formatColumnHeaderDescription({
        column: qtyCol,
        sortSpec: [],
        filterSpec: [{ type: 'number', colId: 'qty', operator: '=', value: 10 }],
      }),
    ).toBe('filter = 10');
    expect(
      formatColumnHeaderDescription({
        column: qtyCol,
        sortSpec: [],
        filterSpec: [{ type: 'number', colId: 'qty', operator: '>', value: 10 }],
      }),
    ).toBe('filter > 10');
    expect(
      formatColumnHeaderDescription({
        column: qtyCol,
        sortSpec: [],
        filterSpec: [{ type: 'number', colId: 'qty', operator: '<=', value: 10 }],
      }),
    ).toBe('filter <= 10');
  });

  it('number filter inRange formats with "to" between endpoints', () => {
    const filterSpec: readonly FilterSpec[] = [
      { type: 'number', colId: 'qty', operator: 'inRange', value: 10, valueTo: 30 },
    ];
    expect(formatColumnHeaderDescription({ column: qtyCol, sortSpec: [], filterSpec })).toBe(
      'filter in range 10 to 30',
    );
  });

  it('both sort + filter active → semicolon-joined parts', () => {
    const sortSpec: readonly SortSpec[] = [{ colId: 'name', direction: 'asc' }];
    const filterSpec: readonly FilterSpec[] = [
      { type: 'text', colId: 'name', operator: 'contains', value: 'Alpha' },
    ];
    expect(formatColumnHeaderDescription({ column: nameCol, sortSpec, filterSpec })).toBe(
      'sorted ascending; filter contains "Alpha"',
    );
  });

  it('filter on a column without sort entry still surfaces filter part alone', () => {
    const sortSpec: readonly SortSpec[] = [{ colId: 'qty', direction: 'asc' }];
    const filterSpec: readonly FilterSpec[] = [
      { type: 'text', colId: 'name', operator: 'contains', value: 'Alpha' },
    ];
    expect(formatColumnHeaderDescription({ column: nameCol, sortSpec, filterSpec })).toBe(
      'filter contains "Alpha"',
    );
  });
});

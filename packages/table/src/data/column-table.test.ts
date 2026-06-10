import { describe, expect, it } from 'vitest';

import { createColumnTable } from './column-table.js';

import type { ColumnSpec } from '../ir/index.js';

function col(id: string, field?: string): ColumnSpec {
  return field === undefined ? { id } : { id, field };
}

describe('createColumnTable', () => {
  it('returns an empty table when given no columns', () => {
    const table = createColumnTable([]);
    expect(table.columns).toEqual([]);
    expect(table.getById('any')).toBeUndefined();
  });

  it('getById returns the column for a registered id', () => {
    const c1 = col('c1', 'name');
    const c2 = col('c2', 'age');
    const table = createColumnTable([c1, c2]);
    expect(table.getById('c1')).toBe(c1);
    expect(table.getById('c2')).toBe(c2);
  });

  it('getById returns undefined for an unregistered id', () => {
    const table = createColumnTable([col('c1'), col('c2')]);
    expect(table.getById('c3')).toBeUndefined();
    expect(table.getById('')).toBeUndefined();
  });

  it('preserves the input order in `columns`', () => {
    const order = [col('c3'), col('c1'), col('c2')];
    const table = createColumnTable(order);
    expect(table.columns.map((c) => c.id)).toEqual(['c3', 'c1', 'c2']);
  });

  it('returns the original column object reference (no defensive copy)', () => {
    const original: ColumnSpec = { id: 'c1', field: 'name', width: 120 };
    const table = createColumnTable([original]);
    expect(table.getById('c1')).toBe(original);
  });
});

import { describe, expect, it } from 'vitest';

import { createClientSideRowSource } from './row-data-source.js';

import type { RowSpec } from '../ir/index.js';

function row(id: string, data: Record<string, unknown> = {}): RowSpec {
  return { id, data };
}

describe('createClientSideRowSource', () => {
  it('returns an empty source when given no rows', () => {
    const source = createClientSideRowSource([]);
    expect(source.rows).toEqual([]);
    expect(source.getById('any')).toBeUndefined();
  });

  it('getById returns the row for a registered id', () => {
    const r1 = row('r1', { name: 'Alice' });
    const r2 = row('r2', { name: 'Bob' });
    const source = createClientSideRowSource([r1, r2]);
    expect(source.getById('r1')).toBe(r1);
    expect(source.getById('r2')).toBe(r2);
  });

  it('getById returns undefined for an unregistered id', () => {
    const source = createClientSideRowSource([row('r1'), row('r2')]);
    expect(source.getById('r3')).toBeUndefined();
    expect(source.getById('')).toBeUndefined();
  });

  it('preserves the input order in `rows`', () => {
    const order = [row('r3'), row('r1'), row('r2')];
    const source = createClientSideRowSource(order);
    expect(source.rows.map((r) => r.id)).toEqual(['r3', 'r1', 'r2']);
  });
});

import { describe, expect, it } from 'vitest';

import { resolveCellTooltip } from './resolve-cell-tooltip.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

function mkRow(data: Record<string, unknown>): RowSpec {
  return { id: 'r1', data };
}

describe('resolveCellTooltip', () => {
  it('returns null when neither getter nor field is set', () => {
    const col: ColumnSpec = { id: 'c1', field: 'name' };
    const result = resolveCellTooltip({ row: mkRow({ name: 'Alice' }), column: col });
    expect(result).toBeNull();
  });

  it('returns the result of tooltipValueGetter when set', () => {
    const col: ColumnSpec = {
      id: 'c1',
      tooltipValueGetter: ({ row }) => `name=${String(row.data['name'])}`,
    };
    const result = resolveCellTooltip({ row: mkRow({ name: 'Alice' }), column: col });
    expect(result).toBe('name=Alice');
  });

  it('treats null / undefined / empty-string tooltipValueGetter return as no-tooltip', () => {
    const colNull: ColumnSpec = { id: 'c1', tooltipValueGetter: () => null };
    expect(resolveCellTooltip({ row: mkRow({}), column: colNull })).toBeNull();

    const colUndef: ColumnSpec = { id: 'c1', tooltipValueGetter: () => undefined };
    expect(resolveCellTooltip({ row: mkRow({}), column: colUndef })).toBeNull();

    const colEmpty: ColumnSpec = { id: 'c1', tooltipValueGetter: () => '' };
    expect(resolveCellTooltip({ row: mkRow({}), column: colEmpty })).toBeNull();
  });

  it('reads tooltipField from row.data when no getter is set', () => {
    const col: ColumnSpec = { id: 'c1', tooltipField: 'fullName' };
    const result = resolveCellTooltip({
      row: mkRow({ name: 'Alice', fullName: 'Alice Wonderland' }),
      column: col,
    });
    expect(result).toBe('Alice Wonderland');
  });

  it('coerces number / boolean / bigint field values to string', () => {
    const colNum: ColumnSpec = { id: 'c1', tooltipField: 'count' };
    expect(resolveCellTooltip({ row: mkRow({ count: 42 }), column: colNum })).toBe('42');

    const colBool: ColumnSpec = { id: 'c1', tooltipField: 'active' };
    expect(resolveCellTooltip({ row: mkRow({ active: true }), column: colBool })).toBe('true');

    const colBig: ColumnSpec = { id: 'c1', tooltipField: 'big' };
    expect(
      resolveCellTooltip({ row: mkRow({ big: BigInt('9007199254740993') }), column: colBig }),
    ).toBe('9007199254740993');
  });

  it('returns null for object / array values (rich content out of scope v1)', () => {
    const col: ColumnSpec = { id: 'c1', tooltipField: 'obj' };
    expect(resolveCellTooltip({ row: mkRow({ obj: { foo: 'bar' } }), column: col })).toBeNull();

    expect(resolveCellTooltip({ row: mkRow({ obj: [1, 2, 3] }), column: col })).toBeNull();
  });

  it('returns null for nullish or empty-string field values', () => {
    const col: ColumnSpec = { id: 'c1', tooltipField: 'desc' };
    expect(resolveCellTooltip({ row: mkRow({ desc: null }), column: col })).toBeNull();
    expect(resolveCellTooltip({ row: mkRow({ desc: undefined }), column: col })).toBeNull();
    expect(resolveCellTooltip({ row: mkRow({ desc: '' }), column: col })).toBeNull();
  });

  it('tooltipValueGetter takes precedence over tooltipField when both are set', () => {
    const col: ColumnSpec = {
      id: 'c1',
      tooltipField: 'name',
      tooltipValueGetter: () => 'override',
    };
    const result = resolveCellTooltip({ row: mkRow({ name: 'Alice' }), column: col });
    expect(result).toBe('override');
  });
});

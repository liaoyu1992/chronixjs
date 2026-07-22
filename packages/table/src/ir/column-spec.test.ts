import { describe, expect, it } from 'vitest';

import { normalizeColumnSpec } from './column-spec.js';

import type { ColumnSpec, RowAction } from './column-spec.js';

const noop = (): void => {};

const action: RowAction = { id: 'edit', label: 'Edit', onClick: noop };

describe('normalizeColumnSpec', () => {
  it('returns non-action columns by reference (no allocation)', () => {
    const col: ColumnSpec = { id: 'name', field: 'name' };
    expect(normalizeColumnSpec(col)).toBe(col);
  });

  it('returns columns with an empty actions array by reference', () => {
    const col: ColumnSpec = { id: 'name', field: 'name', actions: [] };
    expect(normalizeColumnSpec(col)).toBe(col);
  });

  it('forces sortable:false + filterable:false on action columns', () => {
    const col: ColumnSpec = {
      id: 'ops',
      field: 'ops',
      headerName: 'Actions',
      actions: [action],
    };
    const out = normalizeColumnSpec(col);
    expect(out).not.toBe(col);
    expect(out.sortable).toBe(false);
    expect(out.filterable).toBe(false);
  });

  it('overrides explicit sortable:true / filterable:true on action columns', () => {
    const col: ColumnSpec = {
      id: 'ops',
      field: 'ops',
      actions: [action],
      sortable: true,
      filterable: true,
    };
    const out = normalizeColumnSpec(col);
    expect(out.sortable).toBe(false);
    expect(out.filterable).toBe(false);
  });

  it('returns already-normalized action columns by reference', () => {
    const col: ColumnSpec = {
      id: 'ops',
      field: 'ops',
      actions: [action],
      sortable: false,
      filterable: false,
    };
    expect(normalizeColumnSpec(col)).toBe(col);
  });

  it('preserves all other fields on the normalized column', () => {
    const col: ColumnSpec = {
      id: 'ops',
      field: 'ops',
      headerName: 'Actions',
      width: 120,
      actions: [action],
    };
    const out = normalizeColumnSpec(col);
    expect(out.id).toBe('ops');
    expect(out.field).toBe('ops');
    expect(out.headerName).toBe('Actions');
    expect(out.width).toBe(120);
    expect(out.actions).toBe(col.actions);
  });
});

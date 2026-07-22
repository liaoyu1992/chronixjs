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

import { computeColumnHeaderMinWidth, withHeaderMinWidth } from './column-spec.js';
import type { HeaderMinWidthOptions } from './column-spec.js';

describe('computeColumnHeaderMinWidth', () => {
  const opts: HeaderMinWidthOptions = {
    cellPaddingX: 8,
    showColumnHeaderMenu: true,
  };

  it('includes padding + label + sort indicator + menu button for a sortable column', () => {
    const col: ColumnSpec = { id: 'name', field: 'name' };
    // 8*2 + 24 + 17 + 24 = 81
    expect(computeColumnHeaderMinWidth(col, opts)).toBe(81);
  });

  it('omits sort indicator width for non-sortable columns', () => {
    const col: ColumnSpec = { id: 'name', field: 'name', sortable: false };
    // 8*2 + 24 + 24 = 64
    expect(computeColumnHeaderMinWidth(col, opts)).toBe(64);
  });

  it('omits menu button width when showColumnHeaderMenu is false', () => {
    const col: ColumnSpec = { id: 'name', field: 'name' };
    const noMenuOpts: HeaderMinWidthOptions = {
      cellPaddingX: 8,
      showColumnHeaderMenu: false,
    };
    // 8*2 + 24 + 17 = 57
    expect(computeColumnHeaderMinWidth(col, noMenuOpts)).toBe(57);
  });

  it('omits both sort indicator and menu button for a non-sortable column without menu', () => {
    const col: ColumnSpec = { id: 'name', field: 'name', sortable: false };
    const noMenuOpts: HeaderMinWidthOptions = {
      cellPaddingX: 8,
      showColumnHeaderMenu: false,
    };
    // 8*2 + 24 = 40
    expect(computeColumnHeaderMinWidth(col, noMenuOpts)).toBe(40);
  });

  it('respects custom cellPaddingX', () => {
    const col: ColumnSpec = { id: 'name', field: 'name' };
    const wideOpts: HeaderMinWidthOptions = {
      cellPaddingX: 12,
      showColumnHeaderMenu: true,
    };
    // 12*2 + 24 + 17 + 24 = 89
    expect(computeColumnHeaderMinWidth(col, wideOpts)).toBe(89);
  });
});

describe('withHeaderMinWidth', () => {
  const opts: HeaderMinWidthOptions = {
    cellPaddingX: 8,
    showColumnHeaderMenu: true,
  };

  it('returns action columns by reference (no modification)', () => {
    const col: ColumnSpec = {
      id: 'ops',
      field: 'ops',
      actions: [action],
      minWidth: 32,
    };
    expect(withHeaderMinWidth(col, opts)).toBe(col);
  });

  it('returns columns whose minWidth already meets the header floor by reference', () => {
    const col: ColumnSpec = { id: 'name', field: 'name', minWidth: 100 };
    expect(withHeaderMinWidth(col, opts)).toBe(col);
  });

  it('returns columns whose minWidth equals the header floor by reference', () => {
    const col: ColumnSpec = { id: 'name', field: 'name', minWidth: 81 };
    expect(withHeaderMinWidth(col, opts)).toBe(col);
  });

  it('bumps minWidth to the header floor when it is too small', () => {
    const col: ColumnSpec = { id: 'name', field: 'name', minWidth: 40 };
    const out = withHeaderMinWidth(col, opts);
    expect(out).not.toBe(col);
    expect(out.minWidth).toBe(81);
  });

  it('sets minWidth when the column has none', () => {
    const col: ColumnSpec = { id: 'name', field: 'name' };
    const out = withHeaderMinWidth(col, opts);
    expect(out).not.toBe(col);
    expect(out.minWidth).toBe(81);
  });

  it('preserves all other fields when bumping minWidth', () => {
    const col: ColumnSpec = {
      id: 'name',
      field: 'name',
      headerName: 'Name',
      width: 120,
      sortable: true,
    };
    const out = withHeaderMinWidth(col, opts);
    expect(out.id).toBe('name');
    expect(out.field).toBe('name');
    expect(out.headerName).toBe('Name');
    expect(out.width).toBe(120);
    expect(out.sortable).toBe(true);
    expect(out.minWidth).toBe(81);
  });

  it('computes a lower floor for non-sortable columns', () => {
    const col: ColumnSpec = { id: 'name', field: 'name', sortable: false };
    const out = withHeaderMinWidth(col, opts);
    expect(out.minWidth).toBe(64);
  });
});

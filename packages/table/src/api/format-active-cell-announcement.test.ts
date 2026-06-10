import { describe, expect, it } from 'vitest';

import { formatActiveCellAnnouncement } from './format-active-cell-announcement.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

const baseColumn: ColumnSpec = { id: 'name', field: 'name', headerName: 'Name' };
const baseRow: RowSpec = { id: 'r1', data: { name: 'Alpha', qty: 10 } };

describe('formatActiveCellAnnouncement', () => {
  it('produces the canonical Column X (col i of N), Row j of M: value sentence', () => {
    const text = formatActiveCellAnnouncement({
      row: baseRow,
      column: baseColumn,
      rowIndex: 2,
      rowCount: 50,
      colIndex: 3,
      colCount: 6,
    });
    expect(text).toBe('Column Name (col 3 of 6), Row 2 of 50: Alpha');
  });

  it('falls back to field then id for the column label when headerName is unset', () => {
    const text1 = formatActiveCellAnnouncement({
      row: baseRow,
      column: { id: 'qty', field: 'qty' },
      rowIndex: 1,
      rowCount: 1,
      colIndex: 1,
      colCount: 1,
    });
    expect(text1).toContain('Column qty');

    const text2 = formatActiveCellAnnouncement({
      row: baseRow,
      column: { id: 'free-form-id' },
      rowIndex: 1,
      rowCount: 1,
      colIndex: 1,
      colCount: 1,
    });
    expect(text2).toContain('Column free-form-id');
  });

  it('renders "empty" when the resolved cell value is null', () => {
    const text = formatActiveCellAnnouncement({
      row: { id: 'r1', data: { name: null } },
      column: baseColumn,
      rowIndex: 1,
      rowCount: 1,
      colIndex: 1,
      colCount: 1,
    });
    expect(text).toContain(': empty');
  });

  it('renders "empty" when the resolved cell value is an empty string', () => {
    const text = formatActiveCellAnnouncement({
      row: { id: 'r1', data: { name: '' } },
      column: baseColumn,
      rowIndex: 1,
      rowCount: 1,
      colIndex: 1,
      colCount: 1,
    });
    expect(text).toContain(': empty');
  });

  it('respects valueFormatter for non-string cell values', () => {
    const column: ColumnSpec = {
      id: 'qty',
      field: 'qty',
      headerName: 'Quantity',
      valueFormatter: ({ value }) => `${typeof value === 'number' ? value : 0} 件`,
    };
    const text = formatActiveCellAnnouncement({
      row: { id: 'r1', data: { qty: 42 } },
      column,
      rowIndex: 1,
      rowCount: 1,
      colIndex: 1,
      colCount: 1,
    });
    expect(text).toBe('Column Quantity (col 1 of 1), Row 1 of 1: 42 件');
  });

  it('handles unicode column names and cell text without mangling', () => {
    const text = formatActiveCellAnnouncement({
      row: { id: 'r1', data: { 名称: '甲' } },
      column: { id: '名称', field: '名称', headerName: '名称' },
      rowIndex: 1,
      rowCount: 1,
      colIndex: 1,
      colCount: 1,
    });
    expect(text).toBe('Column 名称 (col 1 of 1), Row 1 of 1: 甲');
  });

  it('handles colIndex 1 (selection column position) + colCount including the selection column', () => {
    // Adapter wiring: when showSelectionColumn = true, colCount = N + 1
    // and the selection column itself sits at colIndex 1. The
    // announcement helper trusts the caller's indices verbatim — no
    // special handling needed.
    const text = formatActiveCellAnnouncement({
      row: baseRow,
      column: baseColumn,
      rowIndex: 2,
      rowCount: 5,
      colIndex: 2,
      colCount: 4,
    });
    expect(text).toContain('col 2 of 4');
  });
});

import { describe, expect, it } from 'vitest';

import { buildXlsxSheetData } from './build-xlsx-sheet-data.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

const numberColumn: ColumnSpec = {
  id: 'qty',
  field: 'qty',
  headerName: 'Qty',
  width: 120,
  type: 'number',
};
const stringColumn: ColumnSpec = {
  id: 'name',
  field: 'name',
  headerName: 'Name',
  width: 200,
};
const dateColumn: ColumnSpec = {
  id: 'createdAt',
  field: 'createdAt',
  headerName: 'Created',
  width: 160,
  type: 'date',
};
const booleanColumn: ColumnSpec = {
  id: 'active',
  field: 'active',
  headerName: 'Active',
  width: 80,
  type: 'boolean',
};
const formattedColumn: ColumnSpec = {
  id: 'price',
  field: 'price',
  headerName: 'Price',
  valueFormatter: ({ value }) => `$${typeof value === 'number' ? value.toFixed(2) : '?'}`,
};

const baseColumns: readonly ColumnSpec[] = [
  stringColumn,
  numberColumn,
  dateColumn,
  booleanColumn,
  formattedColumn,
];

const sampleDate = new Date('2026-05-29T10:00:00Z');

const baseRows: readonly RowSpec[] = [
  {
    id: 'r1',
    data: { name: 'Alpha', qty: 10, createdAt: sampleDate, active: true, price: 99.5 },
  },
  {
    id: 'r2',
    data: { name: 'Beta', qty: 20, createdAt: sampleDate, active: false, price: 100 },
  },
];

describe('buildXlsxSheetData', () => {
  it('defaults sheetName to "Sheet1" and includes headers by default', () => {
    const result = buildXlsxSheetData({ rows: baseRows, columns: baseColumns });
    expect(result.sheetName).toBe('Sheet1');
    expect(result.headers).toEqual(['Name', 'Qty', 'Created', 'Active', 'Price']);
  });

  it('overrides sheetName via options', () => {
    const result = buildXlsxSheetData({
      rows: baseRows,
      columns: baseColumns,
      options: { sheetName: 'Inventory' },
    });
    expect(result.sheetName).toBe('Inventory');
  });

  it('omits header row when includeHeaders === false', () => {
    const result = buildXlsxSheetData({
      rows: baseRows,
      columns: baseColumns,
      options: { includeHeaders: false },
    });
    expect(result.headers).toEqual([]);
  });

  it('header cascade prefers headerName then field then id', () => {
    const columns: readonly ColumnSpec[] = [
      { id: 'a', headerName: 'Alpha' },
      { id: 'b', field: 'bField' },
      { id: 'c' },
    ];
    const result = buildXlsxSheetData({ rows: [], columns });
    expect(result.headers).toEqual(['Alpha', 'bField', 'c']);
  });

  it('filters + reorders columns via options.columnIds and silently skips missing ids', () => {
    const result = buildXlsxSheetData({
      rows: baseRows,
      columns: baseColumns,
      options: { columnIds: ['qty', 'unknown', 'name'] },
    });
    expect(result.headers).toEqual(['Qty', 'Name']);
    expect(result.cells[0]).toHaveLength(2);
    expect(result.cells[0]![0]).toEqual({ type: 'number', value: 10 });
    expect(result.cells[0]![1]).toEqual({ type: 'string', value: 'Alpha' });
  });

  it('projects number-typed cells as native number variant', () => {
    const result = buildXlsxSheetData({ rows: baseRows, columns: [numberColumn] });
    expect(result.cells[0]![0]).toEqual({ type: 'number', value: 10 });
    expect(result.cells[1]![0]).toEqual({ type: 'number', value: 20 });
  });

  it('coerces non-finite + non-number qty values to null', () => {
    const rows: readonly RowSpec[] = [
      { id: 'r1', data: { qty: Number.NaN } },
      { id: 'r2', data: { qty: Number.POSITIVE_INFINITY } },
      { id: 'r3', data: { qty: 'not-a-number' } },
      { id: 'r4', data: { qty: null } },
    ];
    const result = buildXlsxSheetData({ rows, columns: [numberColumn] });
    for (const row of result.cells) {
      expect(row[0]).toEqual({ type: 'null', value: null });
    }
  });

  it('projects date-typed cells as native date variant when value is a Date instance', () => {
    const result = buildXlsxSheetData({ rows: baseRows, columns: [dateColumn] });
    expect(result.cells[0]![0]).toEqual({ type: 'date', value: sampleDate });
  });

  it('coerces date column non-Date values to null', () => {
    const rows: readonly RowSpec[] = [
      { id: 'r1', data: { createdAt: '2026-01-01' } },
      { id: 'r2', data: { createdAt: 1234567890 } },
      { id: 'r3', data: { createdAt: null } },
      { id: 'r4', data: { createdAt: new Date('invalid') } },
    ];
    const result = buildXlsxSheetData({ rows, columns: [dateColumn] });
    for (const row of result.cells) {
      expect(row[0]).toEqual({ type: 'null', value: null });
    }
  });

  it('projects boolean-typed cells as native boolean variant', () => {
    const result = buildXlsxSheetData({ rows: baseRows, columns: [booleanColumn] });
    expect(result.cells[0]![0]).toEqual({ type: 'boolean', value: true });
    expect(result.cells[1]![0]).toEqual({ type: 'boolean', value: false });
  });

  it('coerces non-boolean values in boolean column to null', () => {
    const rows: readonly RowSpec[] = [
      { id: 'r1', data: { active: 1 } },
      { id: 'r2', data: { active: 'true' } },
      { id: 'r3', data: { active: null } },
    ];
    const result = buildXlsxSheetData({ rows, columns: [booleanColumn] });
    for (const row of result.cells) {
      expect(row[0]).toEqual({ type: 'null', value: null });
    }
  });

  it('default-typed columns use valueFormatter via formatCellValue (string variant)', () => {
    const result = buildXlsxSheetData({ rows: baseRows, columns: [formattedColumn] });
    expect(result.cells[0]![0]).toEqual({ type: 'string', value: '$99.50' });
    expect(result.cells[1]![0]).toEqual({ type: 'string', value: '$100.00' });
  });

  it('preserves column widths from ColumnSpec.width and defaults to 100 when unset', () => {
    const columns: readonly ColumnSpec[] = [
      { id: 'a', width: 80 },
      { id: 'b' },
      { id: 'c', width: 200 },
    ];
    const result = buildXlsxSheetData({ rows: [], columns });
    expect(result.columnWidths).toEqual([80, 100, 200]);
  });

  it('respects valueGetter on number columns when extracting raw value', () => {
    const computedColumn: ColumnSpec = {
      id: 'doubled',
      field: 'qty',
      headerName: 'Doubled',
      type: 'number',
      valueGetter: ({ row }) => {
        const v = row.data['qty'];
        return typeof v === 'number' ? v * 2 : null;
      },
    };
    const result = buildXlsxSheetData({ rows: baseRows, columns: [computedColumn] });
    expect(result.cells[0]![0]).toEqual({ type: 'number', value: 20 });
    expect(result.cells[1]![0]).toEqual({ type: 'number', value: 40 });
  });

  it('returns an empty cells array when rows is empty', () => {
    const result = buildXlsxSheetData({ rows: [], columns: baseColumns });
    expect(result.cells).toEqual([]);
    expect(result.headers).toEqual(['Name', 'Qty', 'Created', 'Active', 'Price']);
    expect(result.columnWidths).toEqual([200, 120, 160, 80, 100]);
  });

  // ────────────────────── Phase 39.4 (2026-05-29) ──────────────────────

  it('Phase 39.4: columnExportStyles is array of undefined when no column has exportStyle', () => {
    const result = buildXlsxSheetData({ rows: baseRows, columns: baseColumns });
    expect(result.columnExportStyles).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it('Phase 39.4: columnExportStyles populates from ColumnSpec.exportStyle in input order', () => {
    const styledQty: ColumnSpec = {
      ...numberColumn,
      exportStyle: {
        font: { color: '#FF0000', bold: true },
        numberFormat: '#,##0.00',
      },
    };
    const styledPrice: ColumnSpec = {
      ...formattedColumn,
      exportStyle: { alignment: { horizontal: 'right' } },
    };
    const result = buildXlsxSheetData({
      rows: baseRows,
      columns: [stringColumn, styledQty, dateColumn, booleanColumn, styledPrice],
    });
    expect(result.columnExportStyles[0]).toBeUndefined();
    expect(result.columnExportStyles[1]).toEqual({
      font: { color: '#FF0000', bold: true },
      numberFormat: '#,##0.00',
    });
    expect(result.columnExportStyles[4]).toEqual({ alignment: { horizontal: 'right' } });
  });

  it('Phase 39.4: columnExportStyles respects options.columnIds subset + reorder', () => {
    const styledQty: ColumnSpec = {
      ...numberColumn,
      exportStyle: { font: { bold: true } },
    };
    const result = buildXlsxSheetData({
      rows: baseRows,
      columns: [stringColumn, styledQty, dateColumn],
      options: { columnIds: ['qty', 'name'] },
    });
    // Subset is [qty, name] (reordered); styles must match the new
    // position of each column, not the input order.
    expect(result.columnExportStyles).toEqual([{ font: { bold: true } }, undefined]);
  });

  it('Phase 39.4: columnExportStyles preserves structural identity of the style object', () => {
    const sharedStyle = { font: { italic: true } };
    const styled: ColumnSpec = { ...numberColumn, exportStyle: sharedStyle };
    const result = buildXlsxSheetData({
      rows: baseRows,
      columns: [styled],
    });
    expect(result.columnExportStyles[0]).toBe(sharedStyle);
  });
});

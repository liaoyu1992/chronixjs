import { describe, expect, it } from 'vitest';

import { exportToCsv } from './export-to-csv.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

function row(id: string, data: Readonly<Record<string, unknown>>): RowSpec {
  return { id, data };
}

const SIMPLE_COLUMNS: readonly ColumnSpec[] = [
  { id: 'name', field: 'name', headerName: 'Name' },
  { id: 'qty', field: 'qty', headerName: 'Quantity' },
];

describe('exportToCsv', () => {
  it('serializes a simple rows + columns into CSV with header + CRLF EOL by default', () => {
    const csv = exportToCsv({
      rows: [row('r1', { name: 'Alice', qty: 12 }), row('r2', { name: 'Bob', qty: 7 })],
      columns: SIMPLE_COLUMNS,
    });
    expect(csv).toBe('Name,Quantity\r\nAlice,12\r\nBob,7');
  });

  it('omits the header row when includeHeaders is false', () => {
    const csv = exportToCsv({
      rows: [row('r1', { name: 'Alice', qty: 12 })],
      columns: SIMPLE_COLUMNS,
      options: { includeHeaders: false },
    });
    expect(csv).toBe('Alice,12');
  });

  it('quotes cells containing the separator', () => {
    const csv = exportToCsv({
      rows: [row('r1', { name: 'Alice, the great', qty: 12 })],
      columns: SIMPLE_COLUMNS,
      options: { includeHeaders: false },
    });
    expect(csv).toBe('"Alice, the great",12');
  });

  it('quotes + doubles embedded double-quotes', () => {
    const csv = exportToCsv({
      rows: [row('r1', { name: 'She said "hi"', qty: 12 })],
      columns: SIMPLE_COLUMNS,
      options: { includeHeaders: false },
    });
    expect(csv).toBe('"She said ""hi""",12');
  });

  it('quotes cells with CR or LF', () => {
    const csv = exportToCsv({
      rows: [row('r1', { name: 'line1\nline2', qty: 12 })],
      columns: SIMPLE_COLUMNS,
      options: { includeHeaders: false },
    });
    expect(csv).toBe('"line1\nline2",12');
  });

  it('uses tab separator when separator: "\\t"', () => {
    const csv = exportToCsv({
      rows: [row('r1', { name: 'Alice', qty: 12 })],
      columns: SIMPLE_COLUMNS,
      options: { separator: '\t', includeHeaders: true },
    });
    expect(csv).toBe('Name\tQuantity\r\nAlice\t12');
  });

  it('renders null / undefined cells as empty strings', () => {
    const csv = exportToCsv({
      rows: [row('r1', { name: null, qty: undefined })],
      columns: SIMPLE_COLUMNS,
      options: { includeHeaders: false },
    });
    expect(csv).toBe(',');
  });

  it('honors columnIds to filter + reorder columns', () => {
    const csv = exportToCsv({
      rows: [row('r1', { name: 'Alice', qty: 12 })],
      columns: SIMPLE_COLUMNS,
      options: { columnIds: ['qty', 'name'], includeHeaders: true },
    });
    expect(csv).toBe('Quantity,Name\r\n12,Alice');
  });

  it('runs consumer valueFormatter for each cell', () => {
    const cols: readonly ColumnSpec[] = [
      {
        id: 'qty',
        field: 'qty',
        headerName: 'Qty',
        valueFormatter: ({ value }) => `${String(value)} units`,
      },
    ];
    const csv = exportToCsv({
      rows: [row('r1', { qty: 12 })],
      columns: cols,
      options: { includeHeaders: false },
    });
    // No separator / quotes in value, so no escaping needed.
    expect(csv).toBe('12 units');
  });

  it('falls back to field then id when headerName is missing', () => {
    const cols: readonly ColumnSpec[] = [{ id: 'name', field: 'name' }, { id: 'col-x' }];
    const csv = exportToCsv({
      rows: [],
      columns: cols,
    });
    expect(csv).toBe('name,col-x');
  });

  it('produces a stable empty-string output for empty rows + includeHeaders=false', () => {
    const csv = exportToCsv({
      rows: [],
      columns: SIMPLE_COLUMNS,
      options: { includeHeaders: false },
    });
    expect(csv).toBe('');
  });
});

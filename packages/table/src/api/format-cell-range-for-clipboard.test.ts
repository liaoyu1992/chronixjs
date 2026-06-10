import { describe, expect, it } from 'vitest';

import { formatCellRangeForClipboard } from './format-cell-range-for-clipboard.js';

import type { CellRangeEnvelope } from './compute-cell-range-envelope.js';
import type { ColumnSpec } from '../ir/column-spec.js';
import type { RowSpec } from '../ir/row-spec.js';

const rows: readonly RowSpec[] = [
  { id: 'r1', data: { name: 'Alice', qty: 50, price: 12.5 } },
  { id: 'r2', data: { name: 'Bob', qty: 7, price: 99 } },
  { id: 'r3', data: { name: 'Carol', qty: null, price: 0 } },
  { id: 'r4', data: { name: 'Dave', qty: 1000, price: 1.25 } },
];

const columns: readonly ColumnSpec[] = [
  { id: 'name', field: 'name' },
  { id: 'qty', field: 'qty' },
  { id: 'price', field: 'price' },
];

describe('formatCellRangeForClipboard', () => {
  it('single-cell envelope → just the formatted value (no tab or newline)', () => {
    const envelope: CellRangeEnvelope = {
      rowIds: ['r2'],
      colIds: ['name'],
    };
    expect(formatCellRangeForClipboard(envelope, rows, columns)).toBe('Bob');
  });

  it('single-row N-col envelope → N values joined by tab, no trailing newline', () => {
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1'],
      colIds: ['name', 'qty', 'price'],
    };
    expect(formatCellRangeForClipboard(envelope, rows, columns)).toBe('Alice\t50\t12.5');
  });

  it('N-row single-col envelope → N values joined by newline, no trailing newline', () => {
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1', 'r2', 'r4'],
      colIds: ['name'],
    };
    expect(formatCellRangeForClipboard(envelope, rows, columns)).toBe('Alice\nBob\nDave');
  });

  it('N×M rectangle → N lines of M tab-separated values', () => {
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1', 'r2', 'r3'],
      colIds: ['name', 'qty', 'price'],
    };
    expect(formatCellRangeForClipboard(envelope, rows, columns)).toBe(
      'Alice\t50\t12.5\nBob\t7\t99\nCarol\t\t0',
    );
  });

  it('valueFormatter applied → formatted strings appear in the TSV', () => {
    const columnsWithFormatter: readonly ColumnSpec[] = [
      { id: 'name', field: 'name' },
      {
        id: 'qty',
        field: 'qty',
        valueFormatter: ({ value }) => {
          if (value == null) return '— 件';
          if (typeof value === 'number') return `${value} 件`;
          return '? 件';
        },
      },
    ];
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1', 'r3'],
      colIds: ['name', 'qty'],
    };
    expect(formatCellRangeForClipboard(envelope, rows, columnsWithFormatter)).toBe(
      'Alice\t50 件\nCarol\t— 件',
    );
  });

  it('valueGetter applied → derived values pipe through formatCellValue', () => {
    const columnsWithGetter: readonly ColumnSpec[] = [
      { id: 'name', field: 'name' },
      {
        id: 'subtotal',
        valueGetter: ({ row }) => {
          const qty = row.data['qty'];
          const price = row.data['price'];
          if (typeof qty !== 'number' || typeof price !== 'number') return null;
          return qty * price;
        },
      },
    ];
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1', 'r2'],
      colIds: ['name', 'subtotal'],
    };
    expect(formatCellRangeForClipboard(envelope, rows, columnsWithGetter)).toBe(
      'Alice\t625\nBob\t693',
    );
  });

  it("options.lineSeparator: '\\r\\n' → lines joined by CRLF", () => {
    const envelope: CellRangeEnvelope = {
      rowIds: ['r1', 'r2'],
      colIds: ['name', 'qty'],
    };
    expect(formatCellRangeForClipboard(envelope, rows, columns, { lineSeparator: '\r\n' })).toBe(
      'Alice\t50\r\nBob\t7',
    );
  });

  it('empty envelope (rowIds or colIds empty) → empty string', () => {
    expect(formatCellRangeForClipboard({ rowIds: [], colIds: ['name'] }, rows, columns)).toBe('');
    expect(formatCellRangeForClipboard({ rowIds: ['r1'], colIds: [] }, rows, columns)).toBe('');
    expect(formatCellRangeForClipboard({ rowIds: [], colIds: [] }, rows, columns)).toBe('');
  });
});

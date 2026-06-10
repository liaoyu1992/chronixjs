import { describe, expect, it } from 'vitest';

import { defaultFormatCellValue, formatCellValue, getCellValue } from './format-cell-value.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

const baseRow: RowSpec = {
  id: 'r1',
  data: { price: 42, name: 'Alpha', dueDate: new Date('2026-05-23T00:00:00Z'), extra: null },
};

function col(partial: Partial<ColumnSpec>): ColumnSpec {
  return { id: partial.id ?? 'c', ...partial };
}

describe('defaultFormatCellValue', () => {
  it('narrows nullish → empty, primitives via String(), Date → ISO, plain objects → [object]', () => {
    expect(defaultFormatCellValue(null)).toBe('');
    expect(defaultFormatCellValue(undefined)).toBe('');
    expect(defaultFormatCellValue('hi')).toBe('hi');
    expect(defaultFormatCellValue(42)).toBe('42');
    expect(defaultFormatCellValue(true)).toBe('true');
    expect(defaultFormatCellValue(BigInt(7))).toBe('7');
    expect(defaultFormatCellValue(new Date('2026-05-23T00:00:00Z'))).toBe(
      '2026-05-23T00:00:00.000Z',
    );
    expect(defaultFormatCellValue({ a: 1 })).toBe('[object]');
    expect(defaultFormatCellValue([1, 2])).toBe('[object]');
  });
});

describe('getCellValue', () => {
  it('default path: returns row.data[col.field]', () => {
    const c = col({ id: 'price', field: 'price' });
    expect(getCellValue({ row: baseRow, column: c })).toBe(42);
  });

  it('col.field defaults to col.id when omitted', () => {
    const c = col({ id: 'price' });
    expect(getCellValue({ row: baseRow, column: c })).toBe(42);
  });

  it('valueGetter overrides default extraction', () => {
    const c = col({
      id: 'derived',
      valueGetter: ({ row }) => `${row.id}-${String(row.data['name'])}`,
    });
    expect(getCellValue({ row: baseRow, column: c })).toBe('r1-Alpha');
  });

  it('valueGetter receives the same row + column references (identity check)', () => {
    let capturedRow: RowSpec | null = null;
    let capturedColumn: ColumnSpec | null = null;
    const c = col({
      id: 'identity',
      valueGetter: ({ row, column }) => {
        capturedRow = row;
        capturedColumn = column;
        return 'x';
      },
    });
    getCellValue({ row: baseRow, column: c });
    expect(capturedRow).toBe(baseRow);
    expect(capturedColumn).toBe(c);
  });
});

describe('formatCellValue', () => {
  it('default path: returns defaultFormatCellValue(row.data[col.field])', () => {
    const c = col({ id: 'price', field: 'price' });
    expect(formatCellValue({ row: baseRow, column: c })).toBe('42');
  });

  it('valueFormatter overrides default stringification', () => {
    const c = col({
      id: 'price',
      field: 'price',
      valueFormatter: ({ value }) => `$${String(value)}.00`,
    });
    expect(formatCellValue({ row: baseRow, column: c })).toBe('$42.00');
  });

  it('valueGetter + valueFormatter pipeline: getter runs first; formatter sees its output', () => {
    const c = col({
      id: 'tagged',
      valueGetter: ({ row }) => row.data['name'],
      valueFormatter: ({ value }) => `[${String(value).toUpperCase()}]`,
    });
    expect(formatCellValue({ row: baseRow, column: c })).toBe('[ALPHA]');
  });

  it('valueFormatter args object has value from original getter', () => {
    let capturedValue: unknown = null;
    const c = col({
      id: 'spy',
      valueGetter: () => 'sentinel',
      valueFormatter: ({ value }) => {
        capturedValue = value;
        return String(value);
      },
    });
    formatCellValue({ row: baseRow, column: c });
    expect(capturedValue).toBe('sentinel');
  });
});

import { describe, expect, it } from 'vitest';

import { resolveCellClassNames } from './resolve-cell-class-names.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

const baseRow: RowSpec = { id: 'r1', data: { status: 'done' } };

function col(partial: Partial<ColumnSpec>): ColumnSpec {
  return { id: partial.id ?? 'c', ...partial };
}

describe('resolveCellClassNames', () => {
  it('no cellClass → empty array', () => {
    const c = col({});
    expect(resolveCellClassNames({ value: undefined, row: baseRow, column: c })).toEqual([]);
  });

  it('static string → single-element array', () => {
    const c = col({ cellClass: 'currency' });
    expect(resolveCellClassNames({ value: 0, row: baseRow, column: c })).toEqual(['currency']);
  });

  it('empty string → empty array', () => {
    const c = col({ cellClass: '' });
    expect(resolveCellClassNames({ value: 0, row: baseRow, column: c })).toEqual([]);
  });

  it('static array → returned as-is', () => {
    const c = col({ cellClass: ['a', 'b'] });
    expect(resolveCellClassNames({ value: 0, row: baseRow, column: c })).toEqual(['a', 'b']);
  });

  it('function returning string → wrapped to array', () => {
    const c = col({
      cellClass: ({ value }) => `status-${String(value)}`,
    });
    expect(resolveCellClassNames({ value: 'done', row: baseRow, column: c })).toEqual([
      'status-done',
    ]);
  });

  it('function returning array → returned as-is', () => {
    const c = col({
      cellClass: ({ value }) => (value === 'done' ? ['ok', 'green'] : ['pending']),
    });
    expect(resolveCellClassNames({ value: 'done', row: baseRow, column: c })).toEqual([
      'ok',
      'green',
    ]);
  });

  it('cellClass function receives value + row + column args', () => {
    let capturedArgs: { value?: unknown; row?: RowSpec; column?: ColumnSpec } = {};
    const c = col({
      cellClass: (args) => {
        capturedArgs = args;
        return 'x';
      },
    });
    resolveCellClassNames({ value: 'sentinel', row: baseRow, column: c });
    expect(capturedArgs.value).toBe('sentinel');
    expect(capturedArgs.row).toBe(baseRow);
    expect(capturedArgs.column).toBe(c);
  });
});

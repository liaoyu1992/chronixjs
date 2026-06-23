import { describe, expect, it, vi } from 'vitest';

import { runCellValidator } from './run-cell-validator.js';

import type { ColumnSpec, EditValidationError, RowSpec } from '../ir/index.js';

const baseRow: RowSpec = { id: 'r1', data: { price: 10 } };

const baseColumn: ColumnSpec = { id: 'price', field: 'price', type: 'number' };

describe('runCellValidator', () => {
  it('returns null when column has no validator (backwards-compat)', () => {
    expect(runCellValidator({ value: 42, row: baseRow, column: baseColumn })).toBeNull();
  });

  it('returns null when validator returns null', () => {
    const column: ColumnSpec = { ...baseColumn, validator: () => null };
    expect(runCellValidator({ value: 42, row: baseRow, column })).toBeNull();
  });

  it('normalises a bare string return into { reason }', () => {
    const column: ColumnSpec = { ...baseColumn, validator: () => 'must be positive' };
    const result = runCellValidator({ value: -1, row: baseRow, column });
    expect(result).toEqual({ reason: 'must be positive' });
  });

  it('returns a full EditValidationError verbatim (including code)', () => {
    const error: EditValidationError = { reason: 'too small', code: 'min' };
    const column: ColumnSpec = { ...baseColumn, validator: () => error };
    const result = runCellValidator({ value: 0, row: baseRow, column });
    expect(result).toEqual({ reason: 'too small', code: 'min' });
  });

  it('passes the coerced value + row through to the validator', () => {
    const spy = vi.fn<(value: unknown, row: RowSpec) => null>(() => null);
    const column: ColumnSpec = { ...baseColumn, validator: spy };
    runCellValidator({ value: 99, row: baseRow, column });
    expect(spy).toHaveBeenCalledWith(99, baseRow);
  });
});

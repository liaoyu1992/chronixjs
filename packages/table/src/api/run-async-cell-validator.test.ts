import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { runAsyncCellValidator } from './run-async-cell-validator.js';

import type { ColumnSpec, RowSpec } from '../ir/index.js';

const baseColumn: ColumnSpec = { id: 'name', field: 'name' };
const baseRow: RowSpec = { id: 'r1', data: { name: 'alice' } };

describe('runAsyncCellValidator', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn<any, any>>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns null when column has no validatorAsync', async () => {
    const result = await runAsyncCellValidator({ value: 'a', row: baseRow, column: baseColumn });
    expect(result).toBeNull();
  });

  it('returns null when validatorAsync resolves to null', async () => {
    const column: ColumnSpec = {
      ...baseColumn,
      validatorAsync: () => Promise.resolve(null),
    };
    const result = await runAsyncCellValidator({ value: 'a', row: baseRow, column });
    expect(result).toBeNull();
  });

  it('normalises bare-string resolve to { reason }', async () => {
    const column: ColumnSpec = {
      ...baseColumn,
      validatorAsync: () => Promise.resolve('taken'),
    };
    const result = await runAsyncCellValidator({ value: 'a', row: baseRow, column });
    expect(result).toEqual({ reason: 'taken' });
  });

  it('passes through structured EditValidationError verbatim', async () => {
    const column: ColumnSpec = {
      ...baseColumn,
      validatorAsync: () => Promise.resolve({ reason: 'taken', code: 'unique-violation' }),
    };
    const result = await runAsyncCellValidator({ value: 'a', row: baseRow, column });
    expect(result).toEqual({ reason: 'taken', code: 'unique-violation' });
  });

  it('synthesizes async-error code when Promise rejects with an Error', async () => {
    const column: ColumnSpec = {
      ...baseColumn,
      validatorAsync: () => Promise.reject(new Error('HTTP 500')),
    };
    const result = await runAsyncCellValidator({ value: 'a', row: baseRow, column });
    expect(result).toEqual({ reason: 'HTTP 500', code: 'async-error' });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('coerces non-Error rejection reason to String', async () => {
    const column: ColumnSpec = {
      ...baseColumn,
      validatorAsync: () => Promise.reject(new Error('plain-string-reason')),
    };
    const result = await runAsyncCellValidator({ value: 'a', row: baseRow, column });
    expect(result).toEqual({ reason: 'plain-string-reason', code: 'async-error' });
  });
});

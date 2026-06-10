import { describe, expect, it, vi } from 'vitest';

import type { RowSpec, RowValidator, RowValidationViolation } from '../ir/index.js';
import { runRowValidators } from './run-row-validators.js';

const baseRow: RowSpec = {
  id: 'r1',
  data: { startDate: '2026-06-01', endDate: '2026-05-30', priority: 5 },
};

describe('runRowValidators', () => {
  it('returns empty array when no validators registered', () => {
    expect(runRowValidators({ row: baseRow, rowValidators: [] })).toEqual([]);
  });

  it('returns empty array when validator yields no violations', () => {
    const validators: RowValidator[] = [{ id: 'noop', validate: () => [] }];
    expect(runRowValidators({ row: baseRow, rowValidators: validators })).toEqual([]);
  });

  it('forwards a single violation with full shape', () => {
    const violation: RowValidationViolation = {
      colId: 'endDate',
      reason: 'endDate must be after startDate',
      code: 'date-order',
    };
    const validators: RowValidator[] = [
      {
        id: 'date-order',
        validate: () => [violation],
      },
    ];
    expect(runRowValidators({ row: baseRow, rowValidators: validators })).toEqual([violation]);
  });

  it('concatenates violations across multiple validators preserving order', () => {
    const validators: RowValidator[] = [
      {
        id: 'first',
        validate: () => [
          { colId: 'a', reason: 'first-1' },
          { colId: 'b', reason: 'first-2' },
        ],
      },
      {
        id: 'second',
        validate: () => [{ colId: 'c', reason: 'second-1' }],
      },
    ];
    const result = runRowValidators({ row: baseRow, rowValidators: validators });
    expect(result.map((v) => v.reason)).toEqual(['first-1', 'first-2', 'second-1']);
  });

  it('defensively skips a validator returning a non-array', () => {
    const validators: RowValidator[] = [
      {
        id: 'misbehaving',
        validate: () => null as unknown as readonly RowValidationViolation[],
      },
      {
        id: 'wellbehaved',
        validate: () => [{ colId: 'x', reason: 'ok' }],
      },
    ];
    const result = runRowValidators({ row: baseRow, rowValidators: validators });
    expect(result).toEqual([{ colId: 'x', reason: 'ok' }]);
  });

  it('passes the row reference through to each validator', () => {
    const spy = vi.fn<(row: RowSpec) => readonly RowValidationViolation[]>(() => []);
    runRowValidators({ row: baseRow, rowValidators: [{ id: 's', validate: spy }] });
    expect(spy).toHaveBeenCalledWith(baseRow);
  });
});

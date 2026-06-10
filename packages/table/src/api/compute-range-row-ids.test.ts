import { describe, expect, it } from 'vitest';

import { computeRangeRowIds } from './compute-range-row-ids.js';

describe('computeRangeRowIds', () => {
  it('returns [id] when anchor and clicked are the same id', () => {
    const displayed = ['r1', 'r2', 'r3', 'r4', 'r5'];
    expect(computeRangeRowIds('r3', 'r3', displayed)).toEqual(['r3']);
  });

  it('returns forward inclusive range when anchor is before clicked in display order', () => {
    const displayed = ['r1', 'r2', 'r3', 'r4', 'r5'];
    expect(computeRangeRowIds('r2', 'r4', displayed)).toEqual(['r2', 'r3', 'r4']);
  });

  it('returns inclusive range top-down even when anchor is AFTER clicked in display order', () => {
    const displayed = ['r1', 'r2', 'r3', 'r4', 'r5'];
    // Anchor r4 + clicked r2 → result still reads r2..r4 in display order.
    expect(computeRangeRowIds('r4', 'r2', displayed)).toEqual(['r2', 'r3', 'r4']);
  });

  it('returns empty array when anchor is not in displayed list (defensive: stale anchor)', () => {
    const displayed = ['r1', 'r2', 'r3'];
    expect(computeRangeRowIds('r99', 'r2', displayed)).toEqual([]);
  });

  it('returns empty array when clicked is not in displayed list', () => {
    const displayed = ['r1', 'r2', 'r3'];
    expect(computeRangeRowIds('r1', 'r99', displayed)).toEqual([]);
  });

  it('returns empty array when display order is empty', () => {
    expect(computeRangeRowIds('r1', 'r2', [])).toEqual([]);
  });

  it('returns full range when anchor is the first row and clicked is the last', () => {
    const displayed = ['r1', 'r2', 'r3', 'r4', 'r5'];
    expect(computeRangeRowIds('r1', 'r5', displayed)).toEqual(['r1', 'r2', 'r3', 'r4', 'r5']);
  });
});

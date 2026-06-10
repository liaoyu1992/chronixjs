import { describe, expect, it } from 'vitest';

import { defaultRateProps, resolveRateStarState, type RateStarState } from './rate-spec.js';

describe('defaultRateProps', () => {
  it('matches defaults', () => {
    expect(defaultRateProps).toEqual({
      value: 0,
      count: 5,
      allowHalf: false,
      disabled: false,
      readonly: false,
      error: undefined,
    });
  });
});

describe('resolveRateStarState', () => {
  const cases: readonly [number, number, boolean, RateStarState][] = [
    // index, value, allowHalf, expected
    [0, 0, false, 'empty'],
    [0, 1, false, 'full'],
    [0, 3, false, 'full'],
    [2, 3, false, 'full'],
    [3, 3, false, 'empty'],
    [4, 3, false, 'empty'],
    // half cases
    [2, 2.5, true, 'half'],
    [2, 2.5, false, 'empty'], // allowHalf=false → round-down semantics
    [1, 2.5, true, 'full'],
    [3, 2.5, true, 'empty'],
    [0, 0.4, true, 'empty'], // <0.5 → empty
    [0, 0.5, true, 'half'],
  ];

  for (const [index, value, allowHalf, expected] of cases) {
    it(`index=${index} value=${value} allowHalf=${allowHalf} → ${expected}`, () => {
      expect(resolveRateStarState(index, value, allowHalf)).toBe(expected);
    });
  }
});

import { describe, expect, it } from 'vitest';

import { matchOptionPattern } from './match-option-pattern.js';

describe('matchOptionPattern', () => {
  it('returns empty for empty query or empty label', () => {
    expect(matchOptionPattern('Apple', '')).toEqual([]);
    expect(matchOptionPattern('', 'foo')).toEqual([]);
  });

  it('returns spans for case-insensitive matches', () => {
    const spans = matchOptionPattern('Apple Pie', 'a');
    // 'Apple Pie' lowercase = 'apple pie'; matches 'a' at index 0.
    expect(spans).toEqual([[0, 1]]);
  });

  it('returns multiple non-overlapping spans', () => {
    // 'banana banana' has 'an' at positions 1-3 / 3-5 in word 1 +
    // 8-10 / 10-12 in word 2 — non-overlapping but boundary-adjacent.
    const spans = matchOptionPattern('banana banana', 'an');
    expect(spans).toEqual([
      [1, 3],
      [3, 5],
      [8, 10],
      [10, 12],
    ]);
  });

  it('handles uppercase query against lowercase label', () => {
    expect(matchOptionPattern('apple', 'APP')).toEqual([[0, 3]]);
  });
});

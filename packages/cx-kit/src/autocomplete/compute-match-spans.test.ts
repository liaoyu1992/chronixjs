import { describe, expect, it } from 'vitest';

import { computeMatchSpans } from './compute-match-spans.js';

describe('computeMatchSpans — Phase 100', () => {
  it('empty query returns []', () => {
    expect(computeMatchSpans('hello', '')).toEqual([]);
  });

  it('prefix match returns one span starting at 0', () => {
    expect(computeMatchSpans('JavaScript', 'Java', 'prefix')).toEqual([{ start: 0, end: 4 }]);
  });

  it('prefix mode excludes mid-string match', () => {
    expect(computeMatchSpans('mojave', 'java', 'prefix')).toEqual([]);
  });

  it('substring match returns one span at first occurrence', () => {
    expect(computeMatchSpans('HelloWorld', 'World')).toEqual([{ start: 5, end: 10 }]);
  });

  it('substring mode at index 0 (matches prefix-style)', () => {
    expect(computeMatchSpans('JavaScript', 'Java')).toEqual([{ start: 0, end: 4 }]);
  });

  it('no match returns []', () => {
    expect(computeMatchSpans('hello', 'xyz')).toEqual([]);
  });

  it('case-insensitive prefix', () => {
    expect(computeMatchSpans('Apple', 'app', 'prefix')).toEqual([{ start: 0, end: 3 }]);
  });

  it('case-insensitive substring', () => {
    expect(computeMatchSpans('Cocktail', 'TAIL')).toEqual([{ start: 4, end: 8 }]);
  });

  it('default match mode is substring', () => {
    // No mode passed; 'World' in 'HelloWorld' is at index 5.
    expect(computeMatchSpans('HelloWorld', 'World')).toEqual([{ start: 5, end: 10 }]);
  });
});

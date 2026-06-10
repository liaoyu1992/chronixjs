import { describe, expect, it } from 'vitest';

import { normalizeSelectValue } from './resolve-select-value.js';

describe('normalizeSelectValue', () => {
  it('returns [] for undefined value', () => {
    expect(normalizeSelectValue(undefined, false)).toEqual([]);
    expect(normalizeSelectValue(undefined, true)).toEqual([]);
  });

  it('single-select: wraps string into [string]', () => {
    expect(normalizeSelectValue('foo', false)).toEqual(['foo']);
  });

  it('single-select: extracts first from array', () => {
    expect(normalizeSelectValue(['a', 'b'], false)).toEqual(['a']);
  });

  it('single-select: empty array returns []', () => {
    expect(normalizeSelectValue([], false)).toEqual([]);
  });

  it('multi-select: spreads array', () => {
    expect(normalizeSelectValue(['a', 'b'], true)).toEqual(['a', 'b']);
  });

  it('multi-select: wraps single string into array', () => {
    expect(normalizeSelectValue('foo', true)).toEqual(['foo']);
  });

  it('multi-select: preserves single element', () => {
    expect(normalizeSelectValue(['x'], true)).toEqual(['x']);
  });
});

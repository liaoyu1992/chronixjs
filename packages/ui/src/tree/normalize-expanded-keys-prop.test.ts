import { describe, expect, it } from 'vitest';

import { normalizeExpandedKeysProp } from './normalize-expanded-keys-prop.js';

describe('normalizeExpandedKeysProp', () => {
  it('returns empty Set for undefined', () => {
    const result = normalizeExpandedKeysProp(undefined);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('returns the same Set when input is a Set', () => {
    const set = new Set(['a', 'b']);
    const result = normalizeExpandedKeysProp(set);
    expect(result).toBe(set);
  });

  it('converts an array to a new Set', () => {
    const result = normalizeExpandedKeysProp(['x', 'y', 'z']);
    expect(result).toBeInstanceOf(Set);
    expect(result).toEqual(new Set(['x', 'y', 'z']));
  });

  it('returns empty Set for empty array', () => {
    const result = normalizeExpandedKeysProp([]);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });
});

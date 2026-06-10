import { describe, expect, it } from 'vitest';

import { getNestedValue } from './get-nested-value.js';

describe('getNestedValue', () => {
  it('returns undefined for empty path', () => {
    expect(getNestedValue({ a: 1 }, '')).toBeUndefined();
  });

  it('returns top-level value', () => {
    expect(getNestedValue({ name: 'alice' }, 'name')).toBe('alice');
  });

  it('returns undefined for missing key', () => {
    expect(getNestedValue({ name: 'alice' }, 'age')).toBeUndefined();
  });

  it('returns nested value via dot path', () => {
    const model = { user: { email: 'alice@example.com' } };
    expect(getNestedValue(model, 'user.email')).toBe('alice@example.com');
  });

  it('returns undefined for partially missing path', () => {
    const model = { user: { name: 'alice' } };
    expect(getNestedValue(model, 'user.email')).toBeUndefined();
  });

  it('returns undefined when intermediate is null', () => {
    const model = { user: null as unknown };
    expect(getNestedValue(model as Record<string, unknown>, 'user.email')).toBeUndefined();
  });

  it('returns undefined when intermediate is a primitive', () => {
    const model = { user: 'string' };
    expect(getNestedValue(model as Record<string, unknown>, 'user.email')).toBeUndefined();
  });

  it('handles 3-level nesting', () => {
    const model = { a: { b: { c: 42 } } };
    expect(getNestedValue(model, 'a.b.c')).toBe(42);
  });

  it('returns the whole model for single-segment path', () => {
    const model = { a: { b: 1 } };
    expect(getNestedValue(model, 'a')).toEqual({ b: 1 });
  });

  it('returns falsey values correctly (0, empty string, false)', () => {
    const model = { count: 0, name: '', active: false };
    expect(getNestedValue(model, 'count')).toBe(0);
    expect(getNestedValue(model, 'name')).toBe('');
    expect(getNestedValue(model, 'active')).toBe(false);
  });
});

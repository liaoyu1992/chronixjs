import { describe, expect, it } from 'vitest';

import { isOptionGroup } from './option-spec.js';

import type { OptionSpec, OptionGroupSpec } from './option-spec.js';

describe('isOptionGroup', () => {
  it('returns true for OptionGroupSpec', () => {
    const group: OptionGroupSpec = { key: 'g1', label: 'Group', children: [] };
    expect(isOptionGroup(group)).toBe(true);
  });

  it('returns false for OptionSpec', () => {
    const leaf: OptionSpec = { key: 'a', label: 'A', value: 'a' };
    expect(isOptionGroup(leaf)).toBe(false);
  });

  it('returns false for OptionSpec with disabled', () => {
    const leaf: OptionSpec = { key: 'a', label: 'A', value: 'a', disabled: true };
    expect(isOptionGroup(leaf)).toBe(false);
  });

  it('returns false for OptionSpec with children=undefined', () => {
    const leaf: OptionSpec = { key: 'a', label: 'A', value: 'a', children: undefined };
    expect(isOptionGroup(leaf)).toBe(false);
  });
});

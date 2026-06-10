import { describe, expect, it } from 'vitest';

import { findOptionByKey, findOptionByValue } from './find-option-by-key.js';

import type { OptionListItem } from './option-spec.js';

const ITEMS: readonly OptionListItem[] = [
  { key: 'a', label: 'A', value: 'a' },
  {
    kind: 'group',
    key: 'g',
    label: 'Group',
    children: [
      { key: 'b', label: 'B', value: 'b' },
      { key: 'c', label: 'C', value: 'c' },
    ],
  },
];

describe('findOptionByKey', () => {
  it('finds a top-level flat option', () => {
    expect(findOptionByKey(ITEMS, 'a')?.value).toBe('a');
  });

  it('finds a leaf nested inside a group', () => {
    expect(findOptionByKey(ITEMS, 'c')?.value).toBe('c');
  });

  it('returns null for a missing key', () => {
    expect(findOptionByKey(ITEMS, 'nope')).toBeNull();
  });

  it('returns null when called with null key', () => {
    expect(findOptionByKey(ITEMS, null)).toBeNull();
  });
});

describe('findOptionByValue', () => {
  it('looks up by value (used for trigger-label resolution)', () => {
    expect(findOptionByValue(ITEMS, 'b')?.label).toBe('B');
  });

  it('returns null for undefined / null', () => {
    expect(findOptionByValue(ITEMS, undefined)).toBeNull();
    expect(findOptionByValue(ITEMS, null)).toBeNull();
  });
});

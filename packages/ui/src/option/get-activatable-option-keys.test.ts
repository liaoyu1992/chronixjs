import { describe, expect, it } from 'vitest';

import { getActivatableOptionKeys } from './get-activatable-option-keys.js';

import type { OptionListItem } from './option-spec.js';

const ITEMS: readonly OptionListItem[] = [
  { key: 'a', label: 'A', value: 'a' },
  { key: 'b', label: 'B', value: 'b', disabled: true },
  {
    kind: 'group',
    key: 'g',
    label: 'Group',
    children: [
      { key: 'c', label: 'C', value: 'c' },
      { key: 'd', label: 'D', value: 'd', disabled: true },
      { key: 'e', label: 'E', value: 'e' },
    ],
  },
];

describe('getActivatableOptionKeys', () => {
  it('skips disabled flat options', () => {
    expect(getActivatableOptionKeys(ITEMS)).toEqual(['a', 'c', 'e']);
  });

  it('walks groups but does NOT include the group key itself', () => {
    expect(getActivatableOptionKeys(ITEMS)).not.toContain('g');
  });

  it('returns empty for empty input', () => {
    expect(getActivatableOptionKeys([])).toEqual([]);
  });
});

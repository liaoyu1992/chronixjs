import { describe, expect, it } from 'vitest';

import { filterOptions } from './filter-options.js';

import type { OptionListItem } from './option-spec.js';

const ITEMS: readonly OptionListItem[] = [
  { key: 'apple', label: 'Apple', value: 'apple' },
  { key: 'banana', label: 'Banana', value: 'banana' },
  {
    kind: 'group',
    key: 'g1',
    label: 'Citrus',
    children: [
      { key: 'orange', label: 'Orange', value: 'orange' },
      { key: 'lemon', label: 'Lemon', value: 'lemon' },
    ],
  },
];

describe('filterOptions', () => {
  it('empty query returns input by reference (fast-path)', () => {
    expect(filterOptions(ITEMS, '')).toBe(ITEMS);
  });

  it('filters flat options case-insensitively', () => {
    const out = filterOptions(ITEMS, 'an');
    const keys = out.map((it) => it.key);
    expect(keys).toContain('banana');
    expect(keys).not.toContain('apple');
  });

  it('preserves group when one child matches; drops unmatched children', () => {
    const out = filterOptions(ITEMS, 'orange');
    expect(out.length).toBe(1);
    const grp = out[0] as { kind: 'group'; children: readonly { key: string }[] };
    expect(grp.kind).toBe('group');
    expect(grp.children.length).toBe(1);
    expect(grp.children[0]?.key).toBe('orange');
  });

  it('drops a group entirely when no child matches', () => {
    const out = filterOptions(ITEMS, 'apple');
    expect(out.length).toBe(1);
    expect(out[0]?.key).toBe('apple');
  });
});

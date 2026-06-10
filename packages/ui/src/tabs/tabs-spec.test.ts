import { describe, expect, it } from 'vitest';

import {
  defaultTabsProps,
  findTabItemByKey,
  getActivatableTabKeys,
  reorderTabItems,
  tabsUsesVerticalKeyboardNav,
  type TabItem,
} from './tabs-spec.js';

const items: readonly TabItem[] = [
  { key: 'a', label: 'A', disabled: false, content: 'first' },
  { key: 'b', label: 'B', disabled: true, content: 'second' },
  { key: 'c', label: 'C', disabled: false, content: undefined },
];

describe('defaultTabsProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultTabsProps).toEqual({
      value: undefined,
      items: [],
      type: 'line',
      placement: 'top',
      size: 'medium',
      disabled: false,
      addable: false,
      draggable: false,
    });
  });
});

describe('getActivatableTabKeys', () => {
  it('returns only non-disabled tab keys in order', () => {
    expect(getActivatableTabKeys(items)).toEqual(['a', 'c']);
  });

  it('returns empty array for empty items', () => {
    expect(getActivatableTabKeys([])).toEqual([]);
  });
});

describe('findTabItemByKey', () => {
  it('returns the matching item', () => {
    expect(findTabItemByKey(items, 'b')?.label).toBe('B');
  });

  it('returns undefined when not found', () => {
    expect(findTabItemByKey(items, 'z')).toBeUndefined();
  });
});

describe('tabsUsesVerticalKeyboardNav', () => {
  it('returns true for left + right placements', () => {
    expect(tabsUsesVerticalKeyboardNav('left')).toBe(true);
    expect(tabsUsesVerticalKeyboardNav('right')).toBe(true);
  });

  it('returns false for top + bottom placements', () => {
    expect(tabsUsesVerticalKeyboardNav('top')).toBe(false);
    expect(tabsUsesVerticalKeyboardNav('bottom')).toBe(false);
  });
});

describe('reorderTabItems', () => {
  const reorderItems: readonly TabItem[] = [
    { key: 'a', label: 'A', disabled: false, content: 'first' },
    { key: 'b', label: 'B', disabled: false, content: 'second' },
    { key: 'c', label: 'C', disabled: false, content: 'third' },
  ];

  it('moves a middle item to after the last item', () => {
    const result = reorderTabItems(reorderItems, 'b', 'c');
    expect(result.map((i) => i.key)).toEqual(['a', 'c', 'b']);
  });

  it('moves the last item to after the first item', () => {
    const result = reorderTabItems(reorderItems, 'c', 'a');
    expect(result.map((i) => i.key)).toEqual(['a', 'c', 'b']);
  });

  it('returns same array when sourceKey === targetKey', () => {
    const result = reorderTabItems(reorderItems, 'a', 'a');
    expect(result).toBe(reorderItems);
  });

  it('returns same array when sourceKey is missing', () => {
    const result = reorderTabItems(reorderItems, 'z', 'a');
    expect(result).toBe(reorderItems);
  });

  it('returns same array when targetKey is missing', () => {
    const result = reorderTabItems(reorderItems, 'a', 'z');
    expect(result).toBe(reorderItems);
  });
});

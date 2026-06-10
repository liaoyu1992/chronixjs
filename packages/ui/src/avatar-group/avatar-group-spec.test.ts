import { describe, expect, it } from 'vitest';

import {
  defaultAvatarGroupProps,
  splitAvatarGroupItems,
  type AvatarItem,
} from './avatar-group-spec.js';

const ITEMS: readonly AvatarItem[] = [
  { key: 'a', src: undefined, text: 'A' },
  { key: 'b', src: undefined, text: 'B' },
  { key: 'c', src: undefined, text: 'C' },
  { key: 'd', src: undefined, text: 'D' },
  { key: 'e', src: undefined, text: 'E' },
  { key: 'f', src: undefined, text: 'F' },
  { key: 'g', src: undefined, text: 'G' },
];

describe('defaultAvatarGroupProps', () => {
  it('matches defaults', () => {
    expect(defaultAvatarGroupProps).toEqual({
      items: [],
      max: 5,
      size: 32,
      shape: 'circle',
    });
  });
});

describe('splitAvatarGroupItems', () => {
  it('returns all items when length <= max', () => {
    expect(splitAvatarGroupItems(ITEMS.slice(0, 3), 5)).toEqual({
      visible: ITEMS.slice(0, 3),
      hiddenCount: 0,
    });
  });

  it('returns first max-1 + overflow count when length > max', () => {
    const split = splitAvatarGroupItems(ITEMS, 5);
    expect(split.visible.length).toBe(4);
    expect(split.hiddenCount).toBe(3);
  });

  it('handles max=0 → everything hidden', () => {
    expect(splitAvatarGroupItems(ITEMS, 0)).toEqual({
      visible: [],
      hiddenCount: ITEMS.length,
    });
  });

  it('handles empty items array', () => {
    expect(splitAvatarGroupItems([], 5)).toEqual({ visible: [], hiddenCount: 0 });
  });
});

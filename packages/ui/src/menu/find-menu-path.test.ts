import { describe, expect, it } from 'vitest';

import { findMenuItemByKey, findMenuParentKey, findMenuPath } from './find-menu-path.js';

import type { MenuItem } from './menu-spec.js';

const FIXTURE: readonly MenuItem[] = [
  {
    key: 'root',
    label: 'Root',
    icon: undefined,
    disabled: false,
    children: [
      {
        key: 'mid',
        label: 'Mid',
        icon: undefined,
        disabled: false,
        children: [
          {
            key: 'leaf',
            label: 'Leaf',
            icon: undefined,
            disabled: false,
            children: undefined,
          },
        ],
      },
    ],
  },
];

describe('findMenuPath', () => {
  it('returns root-to-target chain including the target itself', () => {
    expect(findMenuPath(FIXTURE, 'leaf')).toEqual(['root', 'mid', 'leaf']);
  });

  it('returns single-element path for a root-level match', () => {
    expect(findMenuPath(FIXTURE, 'root')).toEqual(['root']);
  });

  it('returns empty array when the key is missing', () => {
    expect(findMenuPath(FIXTURE, 'zzz')).toEqual([]);
  });
});

describe('findMenuParentKey', () => {
  it('returns the immediate parent for a nested item', () => {
    expect(findMenuParentKey(FIXTURE, 'leaf')).toBe('mid');
    expect(findMenuParentKey(FIXTURE, 'mid')).toBe('root');
  });

  it('returns null for a root-level item', () => {
    expect(findMenuParentKey(FIXTURE, 'root')).toBeNull();
  });

  it('returns null when the key is missing', () => {
    expect(findMenuParentKey(FIXTURE, 'zzz')).toBeNull();
  });
});

describe('findMenuItemByKey', () => {
  it('finds nested items', () => {
    expect(findMenuItemByKey(FIXTURE, 'leaf')?.label).toBe('Leaf');
  });
  it('returns null when missing', () => {
    expect(findMenuItemByKey(FIXTURE, 'zzz')).toBeNull();
  });
});

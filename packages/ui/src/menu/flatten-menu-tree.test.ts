import { describe, expect, it } from 'vitest';

import { flattenMenuTree, flattenMenuTreeKeys } from './flatten-menu-tree.js';

import type { MenuItem } from './menu-spec.js';

const FIXTURE: readonly MenuItem[] = [
  {
    key: 'a',
    label: 'A',
    icon: undefined,
    disabled: false,
    children: [
      {
        key: 'a.1',
        label: 'A.1',
        icon: undefined,
        disabled: false,
        children: undefined,
      },
      {
        key: 'a.2',
        label: 'A.2',
        icon: undefined,
        disabled: false,
        children: [
          {
            key: 'a.2.x',
            label: 'A.2.x',
            icon: undefined,
            disabled: false,
            children: undefined,
          },
        ],
      },
    ],
  },
  { key: 'b', label: 'B', icon: undefined, disabled: false, children: undefined },
];

describe('flattenMenuTree', () => {
  it('pre-order flattens through nested children', () => {
    const flat = flattenMenuTree(FIXTURE);
    expect(flat.map((i) => i.key)).toEqual(['a', 'a.1', 'a.2', 'a.2.x', 'b']);
  });

  it('returns empty for empty input', () => {
    expect(flattenMenuTree([])).toEqual([]);
  });
});

describe('flattenMenuTreeKeys', () => {
  it('returns only the key strings in pre-order', () => {
    expect(flattenMenuTreeKeys(FIXTURE)).toEqual(['a', 'a.1', 'a.2', 'a.2.x', 'b']);
  });
});

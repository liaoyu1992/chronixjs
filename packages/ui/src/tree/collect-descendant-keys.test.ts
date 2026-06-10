import { describe, expect, it } from 'vitest';

import { collectDescendantKeys } from './collect-descendant-keys.js';

import type { TreeNodeSpec } from './tree-spec.js';

const TREE: TreeNodeSpec<string> = {
  key: 'root',
  data: 'R',
  children: [
    { key: 'c1', data: 'C1' },
    {
      key: 'c2',
      data: 'C2',
      children: [
        { key: 'c2a', data: 'C2A' },
        { key: 'c2b', data: 'C2B', children: [{ key: 'c2b1', data: 'C2B1' }] },
      ],
    },
    { key: 'c3', data: 'C3' },
  ],
};

describe('collectDescendantKeys', () => {
  it('returns all descendant keys in pre-order (excludes self by default)', () => {
    expect(collectDescendantKeys(TREE)).toEqual(['c1', 'c2', 'c2a', 'c2b', 'c2b1', 'c3']);
  });

  it('includeSelf: true prepends the node key', () => {
    expect(collectDescendantKeys(TREE, { includeSelf: true })).toEqual([
      'root',
      'c1',
      'c2',
      'c2a',
      'c2b',
      'c2b1',
      'c3',
    ]);
  });

  it('leaf node: returns empty array', () => {
    expect(collectDescendantKeys({ key: 'leaf' })).toEqual([]);
  });

  it('leaf node with includeSelf: returns [leaf]', () => {
    expect(collectDescendantKeys({ key: 'leaf' }, { includeSelf: true })).toEqual(['leaf']);
  });

  it('intermediate node: collects only its own subtree', () => {
    const c2 = TREE.children![1]!;
    expect(collectDescendantKeys(c2)).toEqual(['c2a', 'c2b', 'c2b1']);
  });

  it('handles numeric keys correctly', () => {
    const numTree: TreeNodeSpec<unknown> = {
      key: 0,
      children: [{ key: 1 }, { key: 2, children: [{ key: 3 }] }],
    };
    expect(collectDescendantKeys(numTree)).toEqual([1, 2, 3]);
  });
});

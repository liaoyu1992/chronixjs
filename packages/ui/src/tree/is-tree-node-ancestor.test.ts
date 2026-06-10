import { describe, expect, it } from 'vitest';

import { isTreeNodeAncestor } from './is-tree-node-ancestor.js';

import type { TreeNodeData } from './tree-component-spec.js';
import type { TreeNodeSpec } from './tree-spec.js';

const tree: TreeNodeSpec<TreeNodeData>[] = [
  {
    key: 'a',
    data: { label: 'A' },
    children: [
      { key: 'a1', data: { label: 'A1' } },
      {
        key: 'a2',
        data: { label: 'A2' },
        children: [{ key: 'a2x', data: { label: 'A2x' } }],
      },
    ],
  },
  { key: 'b', data: { label: 'B' } },
];

describe('isTreeNodeAncestor', () => {
  it('a is ancestor of a1', () => {
    expect(isTreeNodeAncestor(tree, 'a', 'a1')).toBe(true);
  });

  it('a is ancestor of a2x', () => {
    expect(isTreeNodeAncestor(tree, 'a', 'a2x')).toBe(true);
  });

  it('a1 is NOT ancestor of a', () => {
    expect(isTreeNodeAncestor(tree, 'a1', 'a')).toBe(false);
  });

  it('a is NOT ancestor of a (self)', () => {
    expect(isTreeNodeAncestor(tree, 'a', 'a')).toBe(false);
  });

  it('b is NOT ancestor of a1', () => {
    expect(isTreeNodeAncestor(tree, 'b', 'a1')).toBe(false);
  });
});

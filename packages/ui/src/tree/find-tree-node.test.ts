import { describe, expect, it } from 'vitest';

import { findTreeNode } from './find-tree-node.js';

import type { TreeNodeSpec } from './tree-spec.js';

const SAMPLE_TREE: readonly TreeNodeSpec<string>[] = [
  {
    key: 'a',
    data: 'A',
    children: [
      { key: 'a1', data: 'A1' },
      {
        key: 'a2',
        data: 'A2',
        children: [
          { key: 'a2x', data: 'A2X' },
          { key: 'a2y', data: 'A2Y' },
        ],
      },
    ],
  },
  { key: 'b', data: 'B' },
];

describe('findTreeNode', () => {
  it('finds a root node', () => {
    const found = findTreeNode(SAMPLE_TREE, 'a');
    expect(found).toBeDefined();
    expect(found!.node.key).toBe('a');
    expect(found!.depth).toBe(0);
    expect(found!.parentKeyPath).toEqual([]);
  });

  it('finds a leaf node at any depth', () => {
    const found = findTreeNode(SAMPLE_TREE, 'a2x');
    expect(found).toBeDefined();
    expect(found!.node.key).toBe('a2x');
    expect(found!.node.data).toBe('A2X');
    expect(found!.depth).toBe(2);
    expect(found!.parentKeyPath).toEqual(['a', 'a2']);
  });

  it('finds an intermediate node', () => {
    const found = findTreeNode(SAMPLE_TREE, 'a2');
    expect(found!.depth).toBe(1);
    expect(found!.parentKeyPath).toEqual(['a']);
    expect(found!.node.children).toHaveLength(2);
  });

  it('returns undefined for unknown key', () => {
    expect(findTreeNode(SAMPLE_TREE, 'unknown')).toBeUndefined();
  });

  it('returns undefined for empty roots', () => {
    expect(findTreeNode([], 'a')).toBeUndefined();
  });

  it('result.node is the actual tree node object (no defensive copy)', () => {
    const found = findTreeNode(SAMPLE_TREE, 'a2');
    expect(found!.node).toBe(SAMPLE_TREE[0]!.children![1]);
  });

  it('handles numeric keys', () => {
    const numTree: readonly TreeNodeSpec<string>[] = [
      { key: 1, data: 'one', children: [{ key: 2, data: 'two' }] },
    ];
    const found = findTreeNode(numTree, 2);
    expect(found!.node.key).toBe(2);
    expect(found!.parentKeyPath).toEqual([1]);
  });

  it('first-match-wins in pre-order if keys are duplicated (which violates the tree spec)', () => {
    // Duplicate 'x' at two depths. Per docs, first pre-order match wins.
    const dupTree: readonly TreeNodeSpec<string>[] = [
      { key: 'x', data: 'shallow', children: [{ key: 'x', data: 'deep' }] },
    ];
    const found = findTreeNode(dupTree, 'x');
    expect(found!.node.data).toBe('shallow');
    expect(found!.depth).toBe(0);
  });
});

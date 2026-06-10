import { describe, expect, it } from 'vitest';

import { traverseTreePostOrder, traverseTreePreOrder } from './traverse-tree.js';

import type { TreeNodeSpec } from './tree-spec.js';

/**
 * Sample tree used across all tree tests. Structure:
 *
 *   a (data 'A')
 *     a1 (data 'A1')
 *     a2 (data 'A2')
 *       a2x (data 'A2X')
 *       a2y (data 'A2Y')
 *   b (data 'B')
 *     b1 (data 'B1')
 *   c (data 'C')   // leaf
 *
 * Pre-order keys: a, a1, a2, a2x, a2y, b, b1, c
 * Post-order keys: a1, a2x, a2y, a2, a, b1, b, c
 */
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
  {
    key: 'b',
    data: 'B',
    children: [{ key: 'b1', data: 'B1' }],
  },
  { key: 'c', data: 'C' },
];

describe('traverseTreePreOrder', () => {
  it('visits all 8 nodes in pre-order', () => {
    const visited: string[] = [];
    traverseTreePreOrder(SAMPLE_TREE, (node) => {
      visited.push(String(node.key));
    });
    expect(visited).toEqual(['a', 'a1', 'a2', 'a2x', 'a2y', 'b', 'b1', 'c']);
  });

  it('depth values reflect tree hierarchy', () => {
    const depths: { key: string; depth: number }[] = [];
    traverseTreePreOrder(SAMPLE_TREE, (node, depth) => {
      depths.push({ key: String(node.key), depth });
    });
    expect(depths).toEqual([
      { key: 'a', depth: 0 },
      { key: 'a1', depth: 1 },
      { key: 'a2', depth: 1 },
      { key: 'a2x', depth: 2 },
      { key: 'a2y', depth: 2 },
      { key: 'b', depth: 0 },
      { key: 'b1', depth: 1 },
      { key: 'c', depth: 0 },
    ]);
  });

  it('parentKeyPath reflects ancestor keys (exclusive of current node)', () => {
    const lookups = new Map<string, readonly (string | number)[]>();
    traverseTreePreOrder(SAMPLE_TREE, (node, _depth, parentKeyPath) => {
      lookups.set(String(node.key), parentKeyPath);
    });
    expect(lookups.get('a')).toEqual([]);
    expect(lookups.get('a1')).toEqual(['a']);
    expect(lookups.get('a2x')).toEqual(['a', 'a2']);
    expect(lookups.get('b1')).toEqual(['b']);
    expect(lookups.get('c')).toEqual([]);
  });

  it('returning false from visitor short-circuits traversal', () => {
    const visited: string[] = [];
    const completed = traverseTreePreOrder(SAMPLE_TREE, (node) => {
      visited.push(String(node.key));
      if (node.key === 'a2') return false;
    });
    expect(completed).toBe(false);
    expect(visited).toEqual(['a', 'a1', 'a2']);
  });

  it('returning undefined or true continues traversal', () => {
    const visitedUndef: string[] = [];
    traverseTreePreOrder(SAMPLE_TREE, (node) => {
      visitedUndef.push(String(node.key));
      return undefined;
    });
    expect(visitedUndef).toHaveLength(8);
  });

  it('handles empty roots array', () => {
    let calls = 0;
    const completed = traverseTreePreOrder([], () => {
      calls += 1;
    });
    expect(calls).toBe(0);
    expect(completed).toBe(true);
  });

  it('handles leaf-only tree (no children)', () => {
    const visited: (string | number)[] = [];
    traverseTreePreOrder([{ key: 'x' }, { key: 'y' }], (node) => {
      visited.push(node.key);
    });
    expect(visited).toEqual(['x', 'y']);
  });

  it('treats children: [] same as no children', () => {
    const visited: (string | number)[] = [];
    traverseTreePreOrder([{ key: 'x', children: [] }], (node, depth) => {
      visited.push(`${String(node.key)}@${depth}`);
    });
    expect(visited).toEqual(['x@0']);
  });
});

describe('traverseTreePostOrder', () => {
  it('visits all 8 nodes in post-order', () => {
    const visited: string[] = [];
    traverseTreePostOrder(SAMPLE_TREE, (node) => {
      visited.push(String(node.key));
    });
    expect(visited).toEqual(['a1', 'a2x', 'a2y', 'a2', 'a', 'b1', 'b', 'c']);
  });

  it('depth + parentKeyPath identical to pre-order (only visit order differs)', () => {
    const postEntries: { key: string; depth: number; path: readonly (string | number)[] }[] = [];
    traverseTreePostOrder(SAMPLE_TREE, (node, depth, parentKeyPath) => {
      postEntries.push({ key: String(node.key), depth, path: parentKeyPath });
    });
    const a2x = postEntries.find((e) => e.key === 'a2x')!;
    expect(a2x.depth).toBe(2);
    expect(a2x.path).toEqual(['a', 'a2']);
  });

  it('short-circuits when visitor returns false', () => {
    const visited: string[] = [];
    const completed = traverseTreePostOrder(SAMPLE_TREE, (node) => {
      visited.push(String(node.key));
      if (node.key === 'a2') return false;
    });
    expect(completed).toBe(false);
    // Children of a2 visited before a2; then a2 stops traversal.
    expect(visited).toEqual(['a1', 'a2x', 'a2y', 'a2']);
  });
});

import { describe, expect, it } from 'vitest';

import { flattenTree } from './flatten-tree.js';

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

describe('flattenTree', () => {
  it('produces a flat array in pre-order with one entry per node', () => {
    const flat = flattenTree(SAMPLE_TREE);
    expect(flat).toHaveLength(6);
    expect(flat.map((e) => e.node.key)).toEqual(['a', 'a1', 'a2', 'a2x', 'a2y', 'b']);
  });

  it('carries depth on each entry', () => {
    const flat = flattenTree(SAMPLE_TREE);
    expect(flat.map((e) => `${String(e.node.key)}@${e.depth}`)).toEqual([
      'a@0',
      'a1@1',
      'a2@1',
      'a2x@2',
      'a2y@2',
      'b@0',
    ]);
  });

  it('carries parentKeyPath on each entry', () => {
    const flat = flattenTree(SAMPLE_TREE);
    const a2x = flat.find((e) => e.node.key === 'a2x')!;
    expect(a2x.parentKeyPath).toEqual(['a', 'a2']);
    const a = flat.find((e) => e.node.key === 'a')!;
    expect(a.parentKeyPath).toEqual([]);
  });

  it('entries reference the original node objects (no defensive copy)', () => {
    const flat = flattenTree(SAMPLE_TREE);
    expect(flat[0]!.node).toBe(SAMPLE_TREE[0]);
  });

  it('handles empty input', () => {
    expect(flattenTree([])).toEqual([]);
  });

  it('handles a single leaf', () => {
    const flat = flattenTree([{ key: 'only' }]);
    expect(flat).toEqual([{ node: { key: 'only' }, depth: 0, parentKeyPath: [] }]);
  });
});

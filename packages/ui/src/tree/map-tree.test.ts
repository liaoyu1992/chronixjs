import { describe, expect, it } from 'vitest';

import { mapTree } from './map-tree.js';

import type { TreeNodeSpec } from './tree-spec.js';

const SAMPLE_TREE: readonly TreeNodeSpec<string>[] = [
  {
    key: 'a',
    data: 'apple',
    children: [
      { key: 'a1', data: 'apricot' },
      { key: 'a2', data: 'avocado', children: [{ key: 'a2x', data: 'almond' }] },
    ],
  },
  { key: 'b', data: 'banana' },
];

describe('mapTree', () => {
  it('transforms payload while preserving keys + structure', () => {
    const result = mapTree(SAMPLE_TREE, (node) => (node.data ?? '').toUpperCase());
    expect(result).toHaveLength(2);
    expect(result[0]!.key).toBe('a');
    expect(result[0]!.data).toBe('APPLE');
    expect(result[0]!.children![0]!.data).toBe('APRICOT');
    expect(result[0]!.children![1]!.children![0]!.data).toBe('ALMOND');
    expect(result[1]!.data).toBe('BANANA');
  });

  it('changes the payload generic type T → U', () => {
    // Map string → number (string length).
    const result: readonly TreeNodeSpec<number>[] = mapTree(
      SAMPLE_TREE,
      (node) => (node.data ?? '').length,
    );
    expect(result[0]!.data).toBe(5); // 'apple'
    expect(result[0]!.children![0]!.data).toBe(7); // 'apricot'
    expect(result[1]!.data).toBe(6); // 'banana'
  });

  it('preserves keys exactly (no rekeying)', () => {
    const result = mapTree(SAMPLE_TREE, () => undefined);
    expect(result[0]!.key).toBe('a');
    expect(result[0]!.children![0]!.key).toBe('a1');
    expect(result[0]!.children![1]!.children![0]!.key).toBe('a2x');
  });

  it('passes depth + parentKeyPath to the mapping fn', () => {
    interface Annotated {
      depth: number;
      path: readonly (string | number)[];
    }
    const result = mapTree<string, Annotated>(SAMPLE_TREE, (_node, depth, parentKeyPath) => ({
      depth,
      path: parentKeyPath,
    }));
    expect(result[0]!.data).toEqual({ depth: 0, path: [] });
    expect(result[0]!.children![1]!.children![0]!.data).toEqual({
      depth: 2,
      path: ['a', 'a2'],
    });
  });

  it('returns fresh node objects (never reference-equal to input)', () => {
    const result = mapTree(SAMPLE_TREE, (node) => node.data);
    expect(result[0]).not.toBe(SAMPLE_TREE[0]);
    expect(result[1]).not.toBe(SAMPLE_TREE[1]);
  });

  it('handles empty input', () => {
    expect(mapTree([], (n) => n.data)).toEqual([]);
  });

  it('handles leaf-only nodes (no children field on output)', () => {
    const result = mapTree([{ key: 'x', data: 'X' }], (node) => (node.data ?? '').toLowerCase());
    expect(result).toEqual([{ key: 'x', data: 'x' }]);
    expect(result[0]!.children).toBeUndefined();
  });

  it('does not mutate the input tree', () => {
    const snapshot = JSON.stringify(SAMPLE_TREE);
    mapTree(SAMPLE_TREE, (node) => (node.data ?? '').toUpperCase());
    expect(JSON.stringify(SAMPLE_TREE)).toBe(snapshot);
  });
});

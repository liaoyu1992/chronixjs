import { describe, expect, it } from 'vitest';

import { filterTree } from './filter-tree.js';

import type { TreeNodeSpec } from './tree-spec.js';

const SAMPLE_TREE: readonly TreeNodeSpec<string>[] = [
  {
    key: 'a',
    data: 'apple',
    children: [
      { key: 'a1', data: 'apricot' },
      {
        key: 'a2',
        data: 'avocado',
        children: [
          { key: 'a2x', data: 'almond' },
          { key: 'a2y', data: 'asparagus' },
        ],
      },
    ],
  },
  {
    key: 'b',
    data: 'banana',
    children: [{ key: 'b1', data: 'blueberry' }],
  },
  { key: 'c', data: 'cherry' },
];

describe('filterTree — ancestry-preserving semantics', () => {
  it('returns matching leaf nodes plus their ancestor chain', () => {
    // Predicate matches only 'a2x' (data = 'almond'). Result: a → a2 → a2x preserved.
    const result = filterTree(SAMPLE_TREE, (node) => node.data === 'almond');
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('a');
    expect(result[0]!.children).toHaveLength(1);
    expect(result[0]!.children![0]!.key).toBe('a2');
    expect(result[0]!.children![0]!.children).toHaveLength(1);
    expect(result[0]!.children![0]!.children![0]!.key).toBe('a2x');
  });

  it('siblings not matching are pruned even when their parent is preserved for another match', () => {
    // Only 'a2x' matches. Sibling 'a2y' is not included; sibling 'a1' is not included.
    const result = filterTree(SAMPLE_TREE, (node) => node.data === 'almond');
    expect(result[0]!.children).toHaveLength(1); // a1 dropped
    expect(result[0]!.children![0]!.children).toHaveLength(1); // a2y dropped
  });

  it('returns empty array when nothing matches', () => {
    expect(filterTree(SAMPLE_TREE, () => false)).toEqual([]);
  });

  it('returns the full tree when predicate matches everything (reference-equal subtrees)', () => {
    const result = filterTree(SAMPLE_TREE, () => true);
    // Every node "matches", and all children survive — output mirrors input.
    expect(result.map((n) => n.key)).toEqual(['a', 'b', 'c']);
    expect(result[0]!.children).toHaveLength(2);
  });

  it('matches at root level still include their descendants when children also match', () => {
    // Predicate matches all nodes starting with 'a'.
    const result = filterTree(SAMPLE_TREE, (node) => String(node.key).startsWith('a'));
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('a');
    // All descendants of 'a' also match → preserved.
    expect(result[0]!.children!.map((c) => c.key)).toEqual(['a1', 'a2']);
    expect(result[0]!.children![1]!.children!.map((c) => c.key)).toEqual(['a2x', 'a2y']);
  });

  it('leaf node match: included without children', () => {
    // Predicate matches only 'c'.
    const result = filterTree(SAMPLE_TREE, (node) => node.key === 'c');
    expect(result).toEqual([{ key: 'c', data: 'cherry' }]);
  });

  it('matches at multiple branches: each branch preserved independently', () => {
    // Matches 'a2y' AND 'b1'. Both branches preserved.
    const result = filterTree(SAMPLE_TREE, (node) => node.key === 'a2y' || node.key === 'b1');
    expect(result.map((n) => n.key)).toEqual(['a', 'b']);
    // 'a' kept for a2y; only a2 → a2y survives.
    expect(result[0]!.children![0]!.children!.map((c) => c.key)).toEqual(['a2y']);
    // 'b' kept for b1.
    expect(result[1]!.children!.map((c) => c.key)).toEqual(['b1']);
  });

  it('depth + parentKeyPath passed to predicate', () => {
    const calls: { key: string; depth: number; path: readonly (string | number)[] }[] = [];
    filterTree(SAMPLE_TREE, (node, depth, parentKeyPath) => {
      calls.push({ key: String(node.key), depth, path: parentKeyPath });
      return false;
    });
    const a2x = calls.find((c) => c.key === 'a2x')!;
    expect(a2x.depth).toBe(2);
    expect(a2x.path).toEqual(['a', 'a2']);
  });

  it('non-matching parent + matching children: parent included via descendant', () => {
    // 'a' itself doesn't match (predicate matches only 'a1'). But a1 is
    // a descendant → 'a' is included as the ancestry path.
    const result = filterTree(SAMPLE_TREE, (node) => node.key === 'a1');
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('a');
    expect(result[0]!.children!.map((c) => c.key)).toEqual(['a1']);
  });

  it('matching parent with no matching children: parent included with empty children', () => {
    // 'a' itself matches via predicate; its children don't match.
    const result = filterTree(SAMPLE_TREE, (node) => node.key === 'a');
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('a');
    expect(result[0]!.children).toEqual([]);
  });

  it('does not mutate the input tree', () => {
    const snapshot = JSON.stringify(SAMPLE_TREE);
    filterTree(SAMPLE_TREE, (node) => node.key === 'a2x');
    expect(JSON.stringify(SAMPLE_TREE)).toBe(snapshot);
  });
});

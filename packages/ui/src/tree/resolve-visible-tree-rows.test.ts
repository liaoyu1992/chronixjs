import { describe, expect, it } from 'vitest';

import { resolveVisibleTreeRows } from './resolve-visible-tree-rows.js';

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

describe('resolveVisibleTreeRows', () => {
  it('empty expandedKeys returns only root rows', () => {
    const rows = resolveVisibleTreeRows({ items: tree, expandedKeys: new Set() });
    const keys = rows.map((r) => String(r.node.key));
    expect(keys).toEqual(['a', 'b']);
  });

  it('expandedKeys={a} shows a, a1, a2, b but NOT a2x', () => {
    const rows = resolveVisibleTreeRows({ items: tree, expandedKeys: new Set(['a']) });
    const keys = rows.map((r) => String(r.node.key));
    expect(keys).toEqual(['a', 'a1', 'a2', 'b']);
  });

  it('expandedKeys={a,a2} shows all 5 rows', () => {
    const rows = resolveVisibleTreeRows({ items: tree, expandedKeys: new Set(['a', 'a2']) });
    const keys = rows.map((r) => String(r.node.key));
    expect(keys).toEqual(['a', 'a1', 'a2', 'a2x', 'b']);
  });

  it('empty items returns empty array', () => {
    const rows = resolveVisibleTreeRows({ items: [], expandedKeys: new Set() });
    expect(rows).toEqual([]);
  });
});

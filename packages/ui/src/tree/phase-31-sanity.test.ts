import { describe, expect, it } from 'vitest';

import { composeTreeKeyboardSelection } from './compose-tree-keyboard-selection.js';
import { flattenTree } from './flatten-tree.js';
import { normalizeExpandedKeysProp } from './normalize-expanded-keys-prop.js';
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
  { key: 'b', data: { label: 'B', isLeaf: true } },
];

describe('sanity checks', () => {
  it('resolveVisibleTreeRows with empty expandedKeys returns only root rows', () => {
    const rows = resolveVisibleTreeRows({ items: tree, expandedKeys: new Set() });
    const keys = rows.map((r) => String(r.node.key));
    expect(keys).toEqual(['a', 'b']);
  });

  it('resolveVisibleTreeRows with all expanded matches flattenTree length', () => {
    const allExpanded = new Set(['a', 'a2']);
    const rows = resolveVisibleTreeRows({ items: tree, expandedKeys: allExpanded });
    const flat = flattenTree(tree);
    expect(rows).toHaveLength(flat.length);
  });

  it('composeTreeKeyboardSelection down from null returns first visible key', () => {
    const visibleRows = resolveVisibleTreeRows({ items: tree, expandedKeys: new Set(['a', 'a2']) });
    const result = composeTreeKeyboardSelection({
      items: tree,
      visibleRows,
      currentKey: null,
      expandedKeys: new Set(['a', 'a2']),
      direction: 'down',
    });
    expect(result.nextKey).toBe('a');
  });

  it('composeTreeKeyboardSelection select on leaf returns selectNext=true', () => {
    const visibleRows = resolveVisibleTreeRows({ items: tree, expandedKeys: new Set(['a', 'a2']) });
    const result = composeTreeKeyboardSelection({
      items: tree,
      visibleRows,
      currentKey: 'b',
      expandedKeys: new Set(['a', 'a2']),
      direction: 'select',
    });
    expect(result.selectNext).toBe(true);
  });

  it('normalizeExpandedKeysProp round-trips array/Set/undefined', () => {
    const fromUndef = normalizeExpandedKeysProp(undefined);
    expect(fromUndef).toBeInstanceOf(Set);
    expect(fromUndef.size).toBe(0);

    const arr = ['a', 'b'];
    const fromArr = normalizeExpandedKeysProp(arr);
    expect(fromArr).toEqual(new Set(arr));

    const set = new Set(['x', 'y']);
    const fromSet = normalizeExpandedKeysProp(set);
    expect(fromSet).toBe(set);
  });
});

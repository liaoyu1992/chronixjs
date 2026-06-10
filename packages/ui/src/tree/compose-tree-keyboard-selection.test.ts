import { describe, expect, it } from 'vitest';

import { composeTreeKeyboardSelection } from './compose-tree-keyboard-selection.js';
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

const expandedKeys = new Set(['a', 'a2']);
const visibleRows = resolveVisibleTreeRows({ items: tree, expandedKeys });

describe('composeTreeKeyboardSelection', () => {
  it('down from null returns first visible key', () => {
    const result = composeTreeKeyboardSelection({
      items: tree,
      visibleRows,
      currentKey: null,
      expandedKeys,
      direction: 'down',
    });
    expect(result.nextKey).toBe('a');
  });

  it('down from a returns a1', () => {
    const result = composeTreeKeyboardSelection({
      items: tree,
      visibleRows,
      currentKey: 'a',
      expandedKeys,
      direction: 'down',
    });
    expect(result.nextKey).toBe('a1');
  });

  it('up from a1 returns a', () => {
    const result = composeTreeKeyboardSelection({
      items: tree,
      visibleRows,
      currentKey: 'a1',
      expandedKeys,
      direction: 'up',
    });
    expect(result.nextKey).toBe('a');
  });

  it('home returns first key', () => {
    const result = composeTreeKeyboardSelection({
      items: tree,
      visibleRows,
      currentKey: 'a2x',
      expandedKeys,
      direction: 'home',
    });
    expect(result.nextKey).toBe('a');
  });

  it('end returns last key', () => {
    const result = composeTreeKeyboardSelection({
      items: tree,
      visibleRows,
      currentKey: 'a',
      expandedKeys,
      direction: 'end',
    });
    expect(result.nextKey).toBe('b');
  });

  it('left on expanded a returns collapse', () => {
    const result = composeTreeKeyboardSelection({
      items: tree,
      visibleRows,
      currentKey: 'a',
      expandedKeys,
      direction: 'left',
    });
    expect(result.nextKey).toBe('a');
    expect(result.toggleExpand).toBe('collapse');
  });

  it('right on collapsed node returns expand', () => {
    const collapsedKeys = new Set(['a']);
    const collapsedVisible = resolveVisibleTreeRows({ items: tree, expandedKeys: collapsedKeys });
    const result = composeTreeKeyboardSelection({
      items: tree,
      visibleRows: collapsedVisible,
      currentKey: 'a2',
      expandedKeys: collapsedKeys,
      direction: 'right',
    });
    expect(result.nextKey).toBe('a2');
    expect(result.toggleExpand).toBe('expand');
  });

  it('select on leaf (b) returns selectNext=true', () => {
    const result = composeTreeKeyboardSelection({
      items: tree,
      visibleRows,
      currentKey: 'b',
      expandedKeys,
      direction: 'select',
    });
    expect(result.nextKey).toBe('b');
    expect(result.selectNext).toBe(true);
  });

  it('select on branch (a) returns selectNext=false', () => {
    const result = composeTreeKeyboardSelection({
      items: tree,
      visibleRows,
      currentKey: 'a',
      expandedKeys,
      direction: 'select',
    });
    expect(result.selectNext).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';

import { computeTreeReorderTransaction } from './compute-tree-reorder-transaction.js';

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
  { key: 'c', data: { label: 'C' } },
];

describe('computeTreeReorderTransaction', () => {
  it('sourceKey === hoverKey => cancelled with cancelReason=self', () => {
    const result = computeTreeReorderTransaction({
      sourceKey: 'a',
      hoverKey: 'a',
      hoverPosition: 'before',
      items: tree,
    });
    expect(result.cancelled).toBe(true);
    expect(result.cancelReason).toBe('self');
  });

  it('source is ancestor of hover => cancelled with cancelReason=cycle', () => {
    const result = computeTreeReorderTransaction({
      sourceKey: 'a',
      hoverKey: 'a1',
      hoverPosition: 'before',
      items: tree,
    });
    expect(result.cancelled).toBe(true);
    expect(result.cancelReason).toBe('cycle');
  });

  it('valid before drop moves root-level source before root-level hover', () => {
    const result = computeTreeReorderTransaction({
      sourceKey: 'c',
      hoverKey: 'b',
      hoverPosition: 'before',
      items: tree,
    });
    expect(result.cancelled).toBe(false);
    const rootKeys = result.nextItems.map((n) => String(n.key));
    expect(rootKeys).toEqual(['a', 'c', 'b']);
  });

  it('valid after drop moves root-level source after root-level hover', () => {
    const result = computeTreeReorderTransaction({
      sourceKey: 'b',
      hoverKey: 'a',
      hoverPosition: 'after',
      items: tree,
    });
    expect(result.cancelled).toBe(false);
    const rootKeys = result.nextItems.map((n) => String(n.key));
    expect(rootKeys).toEqual(['a', 'b', 'c']);
  });

  it('valid inside drop makes root-level source a child of root-level hover', () => {
    const result = computeTreeReorderTransaction({
      sourceKey: 'b',
      hoverKey: 'a',
      hoverPosition: 'inside',
      items: tree,
    });
    expect(result.cancelled).toBe(false);
    const rootKeys = result.nextItems.map((n) => String(n.key));
    expect(rootKeys).toEqual(['a', 'c']);
    const aNode = result.nextItems.find((n) => String(n.key) === 'a')!;
    const childKeys = aNode.children!.map((c) => String(c.key));
    expect(childKeys).toContain('b');
  });

  it('missing key => cancelled with cancelReason=missing', () => {
    const result = computeTreeReorderTransaction({
      sourceKey: 'nonexistent',
      hoverKey: 'a',
      hoverPosition: 'before',
      items: tree,
    });
    expect(result.cancelled).toBe(true);
    expect(result.cancelReason).toBe('missing');
  });
});

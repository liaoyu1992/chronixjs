import { describe, expect, it } from 'vitest';

import { mergeAsyncLoadedChildren } from './merge-async-loaded-children.js';

import type { TreeNodeData } from './tree-component-spec.js';
import type { TreeNodeSpec } from './tree-spec.js';

const tree: TreeNodeSpec<TreeNodeData>[] = [
  {
    key: 'a',
    data: { label: 'A' },
    children: [{ key: 'a1', data: { label: 'A1' } }],
  },
  { key: 'b', data: { label: 'B' } },
];

describe('mergeAsyncLoadedChildren', () => {
  it('replaces children of the target node', () => {
    const newChildren: TreeNodeSpec<TreeNodeData>[] = [
      { key: 'a1', data: { label: 'A1-updated' } },
      { key: 'a3', data: { label: 'A3' } },
    ];
    const result = mergeAsyncLoadedChildren({
      items: tree,
      parentKey: 'a',
      loadedChildren: newChildren,
    });
    const aNode = result.find((n) => String(n.key) === 'a')!;
    expect(aNode.children).toEqual(newChildren);
  });

  it('preserves sibling subtrees by reference', () => {
    const newChildren: TreeNodeSpec<TreeNodeData>[] = [{ key: 'ax', data: { label: 'AX' } }];
    const result = mergeAsyncLoadedChildren({
      items: tree,
      parentKey: 'a',
      loadedChildren: newChildren,
    });
    const bNode = result.find((n) => String(n.key) === 'b')!;
    expect(bNode).toBe(tree[1]);
  });

  it('deep merge sets children on a nested node', () => {
    const deepTree: TreeNodeSpec<TreeNodeData>[] = [
      {
        key: 'root',
        data: { label: 'Root' },
        children: [
          {
            key: 'a',
            data: { label: 'A' },
            children: [{ key: 'a1', data: { label: 'A1' } }],
          },
        ],
      },
    ];
    const newChildren: TreeNodeSpec<TreeNodeData>[] = [
      { key: 'a2', data: { label: 'A2' } },
      { key: 'a3', data: { label: 'A3' } },
    ];
    const result = mergeAsyncLoadedChildren({
      items: deepTree,
      parentKey: 'a',
      loadedChildren: newChildren,
    });
    const aNode = result[0]!.children![0]!;
    expect(aNode.children!.map((c) => String(c.key))).toEqual(['a2', 'a3']);
  });
});

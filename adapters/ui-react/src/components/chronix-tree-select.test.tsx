import { resetPopupZIndexForTests, type TreeNodeData, type TreeNodeSpec } from '@chronixjs/ui';
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixTreeSelect } from './chronix-tree-select.js';

const TREE_DATA: readonly TreeNodeSpec<TreeNodeData>[] = [
  {
    key: 'node-1',
    data: { label: 'Node 1' },
    children: [{ key: 'node-1-1', data: { label: 'Node 1-1' } }],
  },
  { key: 'node-2', data: { label: 'Node 2' } },
];

describe('ChronixTreeSelect (react)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    cleanup();
  });

  it('renders root with data-testid tree-select-root', () => {
    render(<ChronixTreeSelect data={TREE_DATA} />);
    expect(document.querySelector('[data-testid="tree-select-root"]')).not.toBeNull();
  });

  it('shows tree rows when show=true with expanded keys', () => {
    render(<ChronixTreeSelect data={TREE_DATA} show expandedKeys={['node-1']} />);
    const rows = document.querySelectorAll('[data-testid^="tree-select-row-"]');
    expect(rows).toHaveLength(3);
  });

  it('injects the chronix-tree-select stylesheet', () => {
    render(<ChronixTreeSelect data={TREE_DATA} />);
    expect(document.head.querySelector('style[data-chronix-ui="tree-select"]')).not.toBeNull();
  });
});

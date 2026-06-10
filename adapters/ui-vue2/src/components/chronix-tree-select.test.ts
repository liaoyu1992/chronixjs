import { resetPopupZIndexForTests, type TreeNodeData, type TreeNodeSpec } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixTreeSelect } from './chronix-tree-select.js';

import type { VueConstructor } from 'vue';

const C = ChronixTreeSelect as unknown as VueConstructor;

const TREE_DATA: readonly TreeNodeSpec<TreeNodeData>[] = [
  {
    key: 'node-1',
    data: { label: 'Node 1' },
    children: [{ key: 'node-1-1', data: { label: 'Node 1-1' } }],
  },
  { key: 'node-2', data: { label: 'Node 2' } },
];

describe('ChronixTreeSelect (vue2)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root with data-testid tree-select-root', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { data: TREE_DATA },
    });
    expect(wrapper.find('[data-testid="tree-select-root"]').exists()).toBe(true);
    wrapper.destroy();
  });

  it('shows tree rows when show=true with expanded keys', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { data: TREE_DATA, show: true, expandedKeys: ['node-1'] },
    });
    const rows = document.querySelectorAll('[data-testid^="tree-select-row-"]');
    expect(rows).toHaveLength(3); // node-1, node-1-1, node-2
    wrapper.destroy();
  });

  it('injects the chronix-tree-select stylesheet', () => {
    const wrapper = mount(C, {
      attachTo: document.body,
      propsData: { data: TREE_DATA },
    });
    expect(document.head.querySelector('style[data-chronix-ui="tree-select"]')).not.toBeNull();
    wrapper.destroy();
  });
});

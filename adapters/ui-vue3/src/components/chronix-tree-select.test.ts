import { resetPopupZIndexForTests, type TreeNodeData, type TreeNodeSpec } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChronixTreeSelect } from './chronix-tree-select.js';

const TREE_DATA: readonly TreeNodeSpec<TreeNodeData>[] = [
  {
    key: 'node-1',
    data: { label: 'Node 1' },
    children: [
      { key: 'node-1-1', data: { label: 'Node 1-1' } },
      { key: 'node-1-2', data: { label: 'Node 1-2' } },
    ],
  },
  { key: 'node-2', data: { label: 'Node 2' } },
];

describe('ChronixTreeSelect (vue3)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root with data-testid tree-select-root', () => {
    const wrapper = mount(ChronixTreeSelect, {
      attachTo: document.body,
      props: { data: TREE_DATA },
    });
    expect(wrapper.find('[data-testid="tree-select-root"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('shows tree rows when show=true with expanded keys', () => {
    const wrapper = mount(ChronixTreeSelect, {
      attachTo: document.body,
      props: { data: TREE_DATA, show: true, expandedKeys: ['node-1'] },
    });
    const rows = document.querySelectorAll('[data-testid^="tree-select-row-"]');
    // node-1, node-1-1, node-1-2, node-2 = 4
    expect(rows).toHaveLength(4);
    wrapper.unmount();
  });

  it('shows only root nodes without expanded keys', () => {
    const wrapper = mount(ChronixTreeSelect, {
      attachTo: document.body,
      props: { data: TREE_DATA, show: true, expandedKeys: [] },
    });
    const rows = document.querySelectorAll('[data-testid^="tree-select-row-"]');
    expect(rows).toHaveLength(2);
    wrapper.unmount();
  });

  it('emits update:value on row click', async () => {
    const wrapper = mount(ChronixTreeSelect, {
      attachTo: document.body,
      props: { data: TREE_DATA, show: true, expandedKeys: [] },
    });
    const row = document.querySelector<HTMLElement>('[data-testid="tree-select-row-node-2"]')!;
    expect(row).not.toBeNull();
    row.click();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:value')).toBeTruthy();
    expect(wrapper.emitted('update:value')![0]![0]).toBe('node-2');
    wrapper.unmount();
  });

  it('injects the chronix-tree-select stylesheet', () => {
    const wrapper = mount(ChronixTreeSelect, {
      attachTo: document.body,
      props: { data: TREE_DATA },
    });
    expect(document.head.querySelector('style[data-chronix-ui="tree-select"]')).not.toBeNull();
    wrapper.unmount();
  });
});

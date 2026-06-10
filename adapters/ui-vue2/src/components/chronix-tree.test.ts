import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixTree } from './chronix-tree.js';

import type { TreeNodeData, TreeNodeSpec } from '@chronixjs/ui';

const C = ChronixTree as unknown as VueConstructor;

type TestNode = TreeNodeSpec<TreeNodeData>;

const LEAF_B: TestNode = { key: 'b', data: { label: 'B', isLeaf: true } };
const ITEMS: readonly TestNode[] = [
  {
    key: 'a',
    data: { label: 'A' },
    children: [{ key: 'a.1', data: { label: 'A.1', isLeaf: true } }],
  },
  LEAF_B,
];

describe('ChronixTree (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root div with role=tree', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items: ITEMS } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.element.getAttribute('role')).toBe('tree');
    expect(wrapper.classes()).toContain('cx-ui-tree');
  });

  it('renders visible rows matching items + expanded state', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { items: ITEMS, expandedKeys: new Set(['a']) },
        });
      },
    });
    const wrapper = mount(Wrapper);
    const rows = wrapper.findAll('[role="treeitem"]');
    expect(rows.length).toBe(3);
  });

  it('selects a leaf and emits update:value', async () => {
    const wrapper = mount(C, { propsData: { items: ITEMS } });
    const rows = wrapper.findAll('[role="treeitem"]');
    await rows.at(-1).trigger('click');
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['b']);
  });

  it('toggles expand on branch click', async () => {
    const wrapper = mount(C, { propsData: { items: ITEMS } });
    let rows = wrapper.findAll('[role="treeitem"]');
    expect(rows.length).toBe(2);
    await rows.at(0).trigger('click');
    rows = wrapper.findAll('[role="treeitem"]');
    expect(rows.length).toBe(3);
    expect(wrapper.emitted('update:expandedKeys')).toBeTruthy();
  });

  it('sets draggable attribute on rows when draggable=true', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items: ITEMS, draggable: true } });
      },
    });
    const wrapper = mount(Wrapper);
    const rows = wrapper.findAll('[role="treeitem"]');
    expect(rows.length).toBe(2);
    expect(rows.at(0).attributes('draggable')).toBe('true');
    expect(rows.at(1).attributes('draggable')).toBe('true');
  });

  it('renders virtual viewport when virtual=true', () => {
    const wrapper = mount(C, {
      propsData: {
        items: ITEMS,
        virtual: true,
        height: 100,
        expandedKeys: new Set(['a']),
      },
    });
    expect(wrapper.find('.cx-ui-tree__viewport').exists()).toBe(true);
  });

  it('injects the chronix-tree stylesheet', () => {
    mount(C, { propsData: { items: ITEMS } });
    expect(document.head.querySelector('style[data-chronix-ui="tree"]')).not.toBeNull();
  });
});

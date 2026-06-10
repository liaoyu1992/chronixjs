import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixTree } from './chronix-tree.js';

import type { TreeNodeData, TreeNodeSpec } from '@chronixjs/ui';

type TestNode = TreeNodeSpec<TreeNodeData>;

const LEAF_B: TestNode = { key: 'b', data: { label: 'B', isLeaf: true } };
const ITEMS: readonly TestNode[] = [
  {
    key: 'a',
    data: { label: 'A' },
    children: [
      {
        key: 'a.1',
        data: { label: 'A.1', isLeaf: true },
      },
    ],
  },
  LEAF_B,
];

describe('ChronixTree (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root div with role=tree', () => {
    const wrapper = mount(ChronixTree, {
      attachTo: document.body,
      props: { items: ITEMS },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect((wrapper.element as HTMLElement).getAttribute('role')).toBe('tree');
    expect(wrapper.classes()).toContain('cx-ui-tree');
  });

  it('renders visible rows matching items + expanded state', () => {
    const wrapper = mount(ChronixTree, {
      attachTo: document.body,
      props: { items: ITEMS, expandedKeys: new Set(['a']) },
    });
    const rows = wrapper.findAll('[role="treeitem"]');
    expect(rows.length).toBe(3); // a, a.1, b
  });

  it('selects a leaf and emits update:value + select', async () => {
    const wrapper = mount(ChronixTree, {
      attachTo: document.body,
      props: { items: ITEMS },
    });
    // b is root-level leaf
    const rows = wrapper.findAll('[role="treeitem"]');
    const bRow = rows.at(-1)!;
    await bRow.trigger('click');
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['b']);
    expect(wrapper.emitted('select')?.[0]?.[0]).toBe('b');
  });

  it('toggles expand on branch click', async () => {
    const wrapper = mount(ChronixTree, {
      attachTo: document.body,
      props: { items: ITEMS },
    });
    // initially only 2 root rows visible
    let rows = wrapper.findAll('[role="treeitem"]');
    expect(rows.length).toBe(2);
    // click branch 'a' to expand
    await rows[0]!.trigger('click');
    rows = wrapper.findAll('[role="treeitem"]');
    expect(rows.length).toBe(3);
    expect(wrapper.emitted('update:expandedKeys')).toBeTruthy();
  });

  it('supports drag-and-drop reorder', async () => {
    const wrapper = mount(ChronixTree, {
      attachTo: document.body,
      props: { items: ITEMS, draggable: true },
    });
    const rows = wrapper.findAll('[role="treeitem"]');
    // drag b onto a, dropping in the bottom zone (after)
    await rows[1]!.trigger('dragstart', {
      dataTransfer: {
        setData: () => {
          /* noop mock */
        },
        effectAllowed: 'move',
      },
    });
    const aRect = rows[0]!.element.getBoundingClientRect();
    await rows[0]!.trigger('dragover', {
      dataTransfer: { dropEffect: 'move' },
      clientY: aRect.bottom - 1,
      preventDefault: () => {
        /* noop mock */
      },
    });
    await rows[0]!.trigger('drop', {
      preventDefault: () => {
        /* noop mock */
      },
    });
    expect(wrapper.emitted('reorder')).toBeTruthy();
  });

  it('renders virtual viewport when virtual=true', () => {
    const wrapper = mount(ChronixTree, {
      attachTo: document.body,
      props: {
        items: ITEMS,
        virtual: true,
        height: 100,
        expandedKeys: new Set(['a']),
      },
    });
    const viewport = wrapper.find('.cx-ui-tree__viewport');
    expect(viewport.exists()).toBe(true);
  });

  it('injects the chronix-tree stylesheet', () => {
    mount(ChronixTree, {
      attachTo: document.body,
      props: { items: ITEMS },
    });
    expect(document.head.querySelector('style[data-chronix-ui="tree"]')).not.toBeNull();
  });
});

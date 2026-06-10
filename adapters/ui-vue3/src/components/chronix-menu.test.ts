import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixMenu } from './chronix-menu.js';

import type { MenuItem } from '@chronixjs/ui';

const ITEMS: readonly MenuItem[] = [
  {
    key: 'a',
    label: 'A',
    icon: undefined,
    disabled: false,
    children: [
      {
        key: 'a.1',
        label: 'A.1',
        icon: undefined,
        disabled: false,
        children: undefined,
      },
    ],
  },
  { key: 'b', label: 'B', icon: undefined, disabled: false, children: undefined },
];

describe('ChronixMenu (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root <ul> with --mode-vertical by default', () => {
    const wrapper = mount(ChronixMenu, {
      attachTo: document.body,
      props: { items: ITEMS },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('UL');
    expect(wrapper.classes()).toContain('cx-ui-menu');
    expect(wrapper.classes()).toContain('cx-ui-menu--mode-vertical');
  });

  it('renders root-level items + pre-expands ancestors of initial value', () => {
    const wrapper = mount(ChronixMenu, {
      attachTo: document.body,
      props: { items: ITEMS, value: 'a.1' },
    });
    const rootItems = wrapper.findAll('.cx-ui-menu > .cx-ui-menu__item');
    expect(rootItems.length).toBe(2);
    // 'a' should be pre-expanded (parent of value='a.1')
    expect(
      wrapper
        .findAll('.cx-ui-menu__item--expanded')
        .some((w) => w.attributes('class')?.includes('cx-ui-menu__item')),
    ).toBe(true);
    expect(document.querySelector('.cx-ui-menu__submenu')).not.toBeNull();
  });

  it('emits update:value + select on leaf click', async () => {
    const wrapper = mount(ChronixMenu, {
      attachTo: document.body,
      props: { items: ITEMS },
    });
    const bRow = wrapper.findAll('.cx-ui-menu__item-row').at(-1);
    await bRow!.trigger('click');
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['b']);
    expect(wrapper.emitted('select')?.[0]?.[0]).toMatchObject({ key: 'b' });
  });

  it('injects the chronix-menu stylesheet', () => {
    mount(ChronixMenu, { attachTo: document.body, props: { items: ITEMS } });
    expect(document.head.querySelector('style[data-chronix-ui="menu"]')).not.toBeNull();
  });
});

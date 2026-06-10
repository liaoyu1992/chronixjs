import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixMenu } from './chronix-menu.js';

import type { MenuItem } from '@chronixjs/ui';

const C = ChronixMenu as unknown as VueConstructor;

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

describe('ChronixMenu (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders root <ul> with --mode-vertical default', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items: ITEMS } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.element.tagName).toBe('UL');
    expect(wrapper.classes()).toContain('cx-ui-menu');
    expect(wrapper.classes()).toContain('cx-ui-menu--mode-vertical');
  });

  it('pre-expands ancestor when initial value is a nested leaf', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items: ITEMS, value: 'a.1' } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-menu__submenu').exists()).toBe(true);
  });

  it('injects the chronix-menu stylesheet', () => {
    mount(C, { propsData: { items: ITEMS } });
    expect(document.head.querySelector('style[data-chronix-ui="menu"]')).not.toBeNull();
  });
});

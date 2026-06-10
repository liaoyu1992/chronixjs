import { resetPopupZIndexForTests, type DropdownOption } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixDropdown } from './chronix-dropdown.js';

const C = ChronixDropdown as unknown as VueConstructor;

const OPTIONS: readonly DropdownOption[] = [
  { key: 'a', label: 'Alpha', value: 'a', disabled: false, icon: undefined },
  { key: 'b', label: 'Beta', value: 'b', disabled: false, icon: undefined },
  { key: 'c', label: 'Gamma', value: 'c', disabled: true, icon: undefined },
];

describe('ChronixDropdown (vue2)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders trigger span without panel when show=false manual', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: false, trigger: 'manual', options: OPTIONS },
          scopedSlots: { default: () => h('button', 'menu') },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.find('.cx-ui-dropdown').exists()).toBe(false);
  });

  it('renders panel inline when show=true', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: {
            show: true,
            trigger: 'manual',
            options: OPTIONS,
            flip: false,
          },
          scopedSlots: { default: () => h('button', 'menu') },
        });
      },
    });
    const wrapper = mount(Wrapper);
    const panel = wrapper.find('.cx-ui-dropdown');
    expect(panel.exists()).toBe(true);
    expect(panel.classes()).toContain('cx-ui-dropdown--open');
    expect(panel.findAll('.cx-ui-dropdown__option').length).toBe(3);
  });

  it('injects the chronix-dropdown stylesheet', () => {
    mount(C, { propsData: { options: OPTIONS } });
    expect(document.head.querySelector('style[data-chronix-ui="dropdown"]')).not.toBeNull();
  });
});

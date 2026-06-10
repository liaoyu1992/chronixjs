import { resetPopupZIndexForTests, type PopSelectOption } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixPopSelect } from './chronix-pop-select.js';

const C = ChronixPopSelect as unknown as VueConstructor;

const OPTS: readonly PopSelectOption[] = [
  { key: 'a', label: 'Apple', value: 'a', disabled: false },
  { key: 'b', label: 'Banana', value: 'b', disabled: false },
  { key: 'c', label: 'Cherry', value: 'c', disabled: true },
];

describe('ChronixPopSelect (vue2)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders 3 option items when show=true', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, trigger: 'manual', options: OPTS },
          scopedSlots: { default: () => h('button', 'select') },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-pop-select__list').exists()).toBe(true);
    expect(wrapper.findAll('.cx-ui-pop-select__option')).toHaveLength(3);
  });

  it('marks selected option with --active', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, trigger: 'manual', options: OPTS, value: 'b' },
          scopedSlots: { default: () => h('button') },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.findAll('.cx-ui-pop-select__option').at(1).classes()).toContain(
      'cx-ui-pop-select__option--active',
    );
  });

  it('marks disabled option with --disabled', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, trigger: 'manual', options: OPTS },
          scopedSlots: { default: () => h('button') },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.findAll('.cx-ui-pop-select__option').at(2).classes()).toContain(
      'cx-ui-pop-select__option--disabled',
    );
  });

  it('injects the chronix-pop-select stylesheet', () => {
    mount(C, { propsData: { options: OPTS } });
    expect(document.head.querySelector('style[data-chronix-ui="pop-select"]')).not.toBeNull();
  });
});

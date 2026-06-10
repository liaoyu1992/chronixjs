import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixCheckbox } from './chronix-checkbox.js';

const C = ChronixCheckbox as unknown as VueConstructor;

describe('ChronixCheckbox (vue2)', () => {
  it('renders <label> with base class', () => {
    const wrapper = mount(C);
    expect(wrapper.element.tagName).toBe('LABEL');
    expect(wrapper.classes()).toContain('cx-ui-checkbox');
  });

  it('emits update:checked on click', async () => {
    const wrapper = mount(C);
    await wrapper.trigger('click');
    expect(wrapper.emitted('update:checked')?.[0]).toEqual([true]);
  });

  it('renders svg check icon when checked=true', () => {
    const wrapper = mount(C, { propsData: { checked: true } });
    expect(wrapper.classes()).toContain('cx-ui-checkbox--checked');
    expect(wrapper.find('svg.cx-ui-checkbox__icon').exists()).toBe(true);
  });

  it('prefers indeterminate over checked icon', () => {
    const wrapper = mount(C, {
      propsData: { checked: true, indeterminate: true },
    });
    expect(wrapper.classes()).toContain('cx-ui-checkbox--indeterminate');
    expect(wrapper.find('span.cx-ui-checkbox__icon').exists()).toBe(true);
  });

  it('injects the chronix-checkbox stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="checkbox"]')).not.toBeNull();
  });
});

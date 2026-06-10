import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixCheckbox } from './chronix-checkbox.js';

describe('ChronixCheckbox (vue3)', () => {
  it('renders <label> with base class', () => {
    const wrapper = mount(ChronixCheckbox);
    expect((wrapper.element as HTMLElement).tagName).toBe('LABEL');
    expect(wrapper.classes()).toContain('cx-ui-checkbox');
  });

  it('emits update:checked on click', async () => {
    const wrapper = mount(ChronixCheckbox);
    await wrapper.trigger('click');
    expect(wrapper.emitted('update:checked')?.[0]).toEqual([true]);
  });

  it('renders --checked + svg icon when checked=true', () => {
    const wrapper = mount(ChronixCheckbox, { props: { checked: true } });
    expect(wrapper.classes()).toContain('cx-ui-checkbox--checked');
    expect(wrapper.find('svg.cx-ui-checkbox__icon').exists()).toBe(true);
  });

  it('prefers indeterminate over checked icon', () => {
    const wrapper = mount(ChronixCheckbox, {
      props: { checked: true, indeterminate: true },
    });
    expect(wrapper.classes()).toContain('cx-ui-checkbox--indeterminate');
    expect(wrapper.find('span.cx-ui-checkbox__icon').exists()).toBe(true);
  });

  it('renders label text when label prop set', () => {
    const wrapper = mount(ChronixCheckbox, { props: { label: 'Accept' } });
    expect(wrapper.find('.cx-ui-checkbox__label').text()).toBe('Accept');
  });

  it('injects the chronix-checkbox stylesheet', () => {
    mount(ChronixCheckbox);
    expect(document.head.querySelector('style[data-chronix-ui="checkbox"]')).not.toBeNull();
  });
});

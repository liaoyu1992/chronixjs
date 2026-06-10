import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixSwitch } from './chronix-switch.js';

const C = ChronixSwitch as unknown as VueConstructor;

describe('ChronixSwitch (vue2)', () => {
  it('renders <button role="switch"> with base + --medium', () => {
    const wrapper = mount(C);
    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.attributes('role')).toBe('switch');
    expect(wrapper.attributes('aria-checked')).toBe('false');
    expect(wrapper.classes()).toContain('cx-ui-switch--medium');
  });

  it('has type=button', () => {
    const wrapper = mount(C);
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('flips aria-checked + --checked when checked=true', () => {
    const wrapper = mount(C, { propsData: { checked: true } });
    expect(wrapper.attributes('aria-checked')).toBe('true');
    expect(wrapper.classes()).toContain('cx-ui-switch--checked');
  });

  it('emits update:checked on click', async () => {
    const wrapper = mount(C);
    await wrapper.trigger('click');
    expect(wrapper.emitted('update:checked')?.[0]).toEqual([true]);
  });

  it('injects the chronix-switch stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="switch"]')).not.toBeNull();
  });
});

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixSwitch } from './chronix-switch.js';

describe('ChronixSwitch (vue3)', () => {
  it('renders <button role="switch"> with base + --medium for defaults', () => {
    const wrapper = mount(ChronixSwitch);
    expect((wrapper.element as HTMLElement).tagName).toBe('BUTTON');
    expect(wrapper.attributes('role')).toBe('switch');
    expect(wrapper.attributes('aria-checked')).toBe('false');
    expect(wrapper.classes()).toContain('cx-ui-switch');
    expect(wrapper.classes()).toContain('cx-ui-switch--medium');
  });

  it('has type=button to prevent form submit', () => {
    const wrapper = mount(ChronixSwitch);
    expect(wrapper.attributes('type')).toBe('button');
  });

  it('flips aria-checked + --checked when checked=true', () => {
    const wrapper = mount(ChronixSwitch, { props: { checked: true } });
    expect(wrapper.attributes('aria-checked')).toBe('true');
    expect(wrapper.classes()).toContain('cx-ui-switch--checked');
  });

  it('emits update:checked on click', async () => {
    const wrapper = mount(ChronixSwitch);
    await wrapper.trigger('click');
    expect(wrapper.emitted('update:checked')?.[0]).toEqual([true]);
  });

  it('injects the chronix-switch stylesheet', () => {
    mount(ChronixSwitch);
    expect(document.head.querySelector('style[data-chronix-ui="switch"]')).not.toBeNull();
  });
});

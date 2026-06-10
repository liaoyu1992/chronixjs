import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixFloatButton } from './chronix-float-button.js';

describe('ChronixFloatButton (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a fixed-position circle button (default)', () => {
    const wrapper = mount(ChronixFloatButton);
    const btn = wrapper.find('button.cx-ui-float-button');
    expect(btn.exists()).toBe(true);
    expect(btn.classes()).toContain('cx-ui-float-button--shape-circle');
    expect(btn.classes()).toContain('cx-ui-float-button--type-default');
    expect((btn.element as HTMLElement).style.position).toBe('fixed');
    expect((btn.element as HTMLElement).style.right).toBe('24px');
    expect((btn.element as HTMLElement).style.bottom).toBe('24px');
  });

  it('switches to primary + square modifiers when configured', () => {
    const wrapper = mount(ChronixFloatButton, {
      props: { shape: 'square', type: 'primary' },
    });
    const btn = wrapper.find('button.cx-ui-float-button');
    expect(btn.classes()).toContain('cx-ui-float-button--shape-square');
    expect(btn.classes()).toContain('cx-ui-float-button--type-primary');
  });

  it('emits click event on button click', async () => {
    const wrapper = mount(ChronixFloatButton);
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')?.length).toBe(1);
  });

  it('renders description text inside the button when provided', () => {
    const wrapper = mount(ChronixFloatButton, { props: { description: 'Help' } });
    expect(wrapper.find('.cx-ui-float-button__description').text()).toBe('Help');
  });

  it('injects the chronix-float-button stylesheet', () => {
    mount(ChronixFloatButton);
    expect(document.head.querySelector('style[data-chronix-ui="float-button"]')).not.toBeNull();
  });
});

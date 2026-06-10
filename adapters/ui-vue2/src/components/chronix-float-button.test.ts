import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixFloatButton } from './chronix-float-button.js';

const C = ChronixFloatButton as unknown as VueConstructor;

describe('ChronixFloatButton (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a fixed-position circle button (default)', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C);
      },
    });
    const wrapper = mount(Wrapper);
    const btn = wrapper.find('button.cx-ui-float-button');
    expect(btn.exists()).toBe(true);
    expect(btn.classes()).toContain('cx-ui-float-button--shape-circle');
    expect((btn.element as HTMLElement).style.position).toBe('fixed');
    expect((btn.element as HTMLElement).style.right).toBe('24px');
    expect((btn.element as HTMLElement).style.bottom).toBe('24px');
  });

  it('switches to primary + square modifiers when configured', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { shape: 'square', type: 'primary' } });
      },
    });
    const wrapper = mount(Wrapper);
    const btn = wrapper.find('button.cx-ui-float-button');
    expect(btn.classes()).toContain('cx-ui-float-button--shape-square');
    expect(btn.classes()).toContain('cx-ui-float-button--type-primary');
  });

  it('renders description text inside the button when provided', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { description: 'Help' } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-float-button__description').text()).toBe('Help');
  });

  it('injects the chronix-float-button stylesheet', () => {
    mount(C, { propsData: {} });
    expect(document.head.querySelector('style[data-chronix-ui="float-button"]')).not.toBeNull();
  });
});

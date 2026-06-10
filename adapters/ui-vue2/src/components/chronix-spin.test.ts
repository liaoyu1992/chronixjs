import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixSpin } from './chronix-spin.js';

const Spin = ChronixSpin as unknown as VueConstructor;

describe('ChronixSpin (vue2) — default rendering', () => {
  it('renders a <div> with base + medium', () => {
    const wrapper = mount(Spin);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-spin');
    expect(wrapper.classes()).toContain('cx-ui-spin--medium');
  });

  it('renders __indicator with role="status"', () => {
    const wrapper = mount(Spin);
    const indicator = wrapper.find('.cx-ui-spin__indicator');
    expect(indicator.exists()).toBe(true);
    expect(indicator.attributes('role')).toBe('status');
    expect(indicator.attributes('aria-label')).toBe('loading');
  });

  it('omits __description by default (undefined description)', () => {
    const wrapper = mount(Spin);
    expect(wrapper.find('.cx-ui-spin__description').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('cx-ui-spin--with-description');
  });
});

describe('ChronixSpin (vue2) — description prop', () => {
  it('renders __description and adds --with-description when description is supplied', () => {
    const wrapper = mount(Spin, { propsData: { description: 'Loading' } });
    expect(wrapper.classes()).toContain('cx-ui-spin--with-description');
    expect(wrapper.find('.cx-ui-spin__description').text()).toBe('Loading');
  });

  it('uses description as the indicator aria-label when supplied', () => {
    const wrapper = mount(Spin, { propsData: { description: 'Loading data' } });
    expect(wrapper.find('.cx-ui-spin__indicator').attributes('aria-label')).toBe('Loading data');
  });
});

describe('ChronixSpin (vue2) — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)('size="%s" adds the matching modifier', (s) => {
    const wrapper = mount(Spin, { propsData: { size: s } });
    expect(wrapper.classes()).toContain(`cx-ui-spin--${s}`);
  });
});

describe('ChronixSpin (vue2) — show prop', () => {
  it('adds --hidden when show=false', () => {
    const wrapper = mount(Spin, { propsData: { show: false } });
    expect(wrapper.classes()).toContain('cx-ui-spin--hidden');
  });

  it('omits --hidden when show=true (default)', () => {
    const wrapper = mount(Spin);
    expect(wrapper.classes()).not.toContain('cx-ui-spin--hidden');
  });
});

describe('ChronixSpin (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-spin stylesheet is in document.head', () => {
    mount(Spin);
    expect(document.head.querySelector('style[data-chronix-ui="spin"]')).not.toBeNull();
  });
});

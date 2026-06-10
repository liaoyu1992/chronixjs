import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixSpin } from './chronix-spin.js';

describe('ChronixSpin — default rendering', () => {
  it('renders a <div> with base + medium', () => {
    const wrapper = mount(ChronixSpin);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-spin');
    expect(wrapper.classes()).toContain('cx-ui-spin--medium');
  });

  it('renders __indicator with role="status"', () => {
    const wrapper = mount(ChronixSpin);
    const indicator = wrapper.find('.cx-ui-spin__indicator');
    expect(indicator.exists()).toBe(true);
    expect(indicator.attributes('role')).toBe('status');
    expect(indicator.attributes('aria-label')).toBe('loading');
  });

  it('omits __description by default (undefined description)', () => {
    const wrapper = mount(ChronixSpin);
    expect(wrapper.find('.cx-ui-spin__description').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('cx-ui-spin--with-description');
  });
});

describe('ChronixSpin — description prop', () => {
  it('renders __description and adds --with-description when description is supplied', () => {
    const wrapper = mount(ChronixSpin, { props: { description: 'Loading' } });
    expect(wrapper.classes()).toContain('cx-ui-spin--with-description');
    expect(wrapper.find('.cx-ui-spin__description').text()).toBe('Loading');
  });

  it('uses description as the indicator aria-label when supplied', () => {
    const wrapper = mount(ChronixSpin, { props: { description: 'Loading data' } });
    expect(wrapper.find('.cx-ui-spin__indicator').attributes('aria-label')).toBe('Loading data');
  });
});

describe('ChronixSpin — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)('size="%s" adds the matching modifier', (s) => {
    const wrapper = mount(ChronixSpin, { props: { size: s } });
    expect(wrapper.classes()).toContain(`cx-ui-spin--${s}`);
  });
});

describe('ChronixSpin — show prop', () => {
  it('adds --hidden when show=false', () => {
    const wrapper = mount(ChronixSpin, { props: { show: false } });
    expect(wrapper.classes()).toContain('cx-ui-spin--hidden');
  });

  it('omits --hidden when show=true (default)', () => {
    const wrapper = mount(ChronixSpin);
    expect(wrapper.classes()).not.toContain('cx-ui-spin--hidden');
  });
});

describe('ChronixSpin — CSS injection', () => {
  it('mounting ensures the chronix-spin stylesheet is in document.head', () => {
    mount(ChronixSpin);
    expect(document.head.querySelector('style[data-chronix-ui="spin"]')).not.toBeNull();
  });
});

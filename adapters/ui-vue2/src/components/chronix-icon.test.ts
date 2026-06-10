import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixIcon } from './chronix-icon.js';

const C = ChronixIcon as unknown as VueConstructor;

describe('ChronixIcon (vue2)', () => {
  it('renders <svg> for registered icon', () => {
    const wrapper = mount(C, { propsData: { name: 'check' } });
    expect(wrapper.element.tagName.toLowerCase()).toBe('svg');
    expect(wrapper.classes()).toContain('cx-ui-icon');
    expect(wrapper.findAll('path').length).toBeGreaterThan(0);
  });

  it('renders missing placeholder for unknown name', () => {
    const wrapper = mount(C, { propsData: { name: 'nope' } });
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-icon--missing');
    expect(wrapper.text()).toBe('?');
  });

  it('honors size prop', () => {
    const wrapper = mount(C, { propsData: { name: 'check', size: 32 } });
    expect(wrapper.attributes('width')).toBe('32');
    expect(wrapper.attributes('height')).toBe('32');
  });

  it('injects the stylesheet', () => {
    mount(C, { propsData: { name: 'check' } });
    expect(document.head.querySelector('style[data-chronix-ui="icon"]')).not.toBeNull();
  });
});

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixAvatar } from './chronix-avatar.js';

const C = ChronixAvatar as unknown as VueConstructor;

describe('ChronixAvatar (vue2)', () => {
  it('renders <span> + base + --circle by default', () => {
    const wrapper = mount(C, { propsData: { text: 'AB' } });
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-avatar');
    expect(wrapper.classes()).toContain('cx-ui-avatar--circle');
  });

  it('renders text content when src is undefined', () => {
    const wrapper = mount(C, { propsData: { text: 'CD' } });
    expect(wrapper.text()).toBe('CD');
    expect(wrapper.find('img').exists()).toBe(false);
  });

  it('renders <img> when src is set', () => {
    const wrapper = mount(C, { propsData: { src: '/a.png', text: 'X' } });
    expect(wrapper.find('img').attributes('src')).toBe('/a.png');
  });

  it('honors shape modifier', () => {
    const wrapper = mount(C, { propsData: { shape: 'square', text: 'X' } });
    expect(wrapper.classes()).toContain('cx-ui-avatar--square');
  });

  it('injects the stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="avatar"]')).not.toBeNull();
  });
});

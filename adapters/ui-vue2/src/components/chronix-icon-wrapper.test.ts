import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixIconWrapper } from './chronix-icon-wrapper.js';

const C = ChronixIconWrapper as unknown as VueConstructor;

describe('ChronixIconWrapper (vue2)', () => {
  it('renders <span> base + width/height inline style', () => {
    const wrapper = mount(C, { propsData: { size: 32 } });
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-icon-wrapper');
    const el = wrapper.element as HTMLElement;
    expect(el.style.width).toBe('32px');
    expect(el.style.height).toBe('32px');
  });

  it('renders default slot children', () => {
    const wrapper = mount(C, { slots: { default: '<svg class="x"></svg>' } });
    expect(wrapper.find('.x').exists()).toBe(true);
  });

  it('injects the stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="icon-wrapper"]')).not.toBeNull();
  });
});

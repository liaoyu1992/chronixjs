import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixGradientText } from './chronix-gradient-text.js';

const C = ChronixGradientText as unknown as VueConstructor;

describe('ChronixGradientText (vue2)', () => {
  it('renders <span> base + linear-gradient background', () => {
    const wrapper = mount(C, { propsData: { value: 'g' } });
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-gradient-text');
    const bg = (wrapper.element as HTMLElement).style.background;
    expect(bg).toContain('linear-gradient');
  });

  it('renders the value text', () => {
    const wrapper = mount(C, { propsData: { value: 'rainbow' } });
    expect(wrapper.text()).toBe('rainbow');
  });

  it('injects the stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="gradient-text"]')).not.toBeNull();
  });
});

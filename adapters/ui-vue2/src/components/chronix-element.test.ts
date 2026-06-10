import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixElement } from './chronix-element.js';

const C = ChronixElement as unknown as VueConstructor;

describe('ChronixElement (vue2)', () => {
  it('renders <span> by default', () => {
    const wrapper = mount(C);
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-element');
  });

  it('honors custom tag prop', () => {
    const wrapper = mount(C, { propsData: { tag: 'section' } });
    expect(wrapper.element.tagName).toBe('SECTION');
  });

  it('emits --inline when inline=true', () => {
    const wrapper = mount(C, { propsData: { inline: true } });
    expect(wrapper.classes()).toContain('cx-ui-element--inline');
  });

  it('injects the stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="element"]')).not.toBeNull();
  });
});

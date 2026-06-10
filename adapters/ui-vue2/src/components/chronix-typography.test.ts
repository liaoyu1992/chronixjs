import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixTypography } from './chronix-typography.js';

const C = ChronixTypography as unknown as VueConstructor;

describe('ChronixTypography (vue2)', () => {
  it('renders <span> + --text for default', () => {
    const wrapper = mount(C);
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-typography--text');
  });

  it('renders <h3> + --level-3 for variant=title level=3', () => {
    const wrapper = mount(C, { propsData: { variant: 'title', level: 3 } });
    expect(wrapper.element.tagName).toBe('H3');
    expect(wrapper.classes()).toContain('cx-ui-typography--level-3');
  });

  it('renders <hr> for variant=hr', () => {
    const wrapper = mount(C, { propsData: { variant: 'hr' } });
    expect(wrapper.element.tagName).toBe('HR');
  });

  it('emits --italic + --underline modifiers', () => {
    const wrapper = mount(C, { propsData: { italic: true, underline: true } });
    expect(wrapper.classes()).toContain('cx-ui-typography--italic');
    expect(wrapper.classes()).toContain('cx-ui-typography--underline');
  });

  it('injects the stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="typography"]')).not.toBeNull();
  });
});

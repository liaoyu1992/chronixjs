import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixCode } from './chronix-code.js';

const C = ChronixCode as unknown as VueConstructor;

describe('ChronixCode (vue2)', () => {
  it('renders <pre><code> for block mode', () => {
    const wrapper = mount(C, { propsData: { value: 'foo' } });
    expect(wrapper.element.tagName).toBe('PRE');
    expect(wrapper.find('code').exists()).toBe(true);
    expect(wrapper.text()).toBe('foo');
  });

  it('renders <code> for inline mode', () => {
    const wrapper = mount(C, { propsData: { value: 'x', inline: true } });
    expect(wrapper.element.tagName).toBe('CODE');
    expect(wrapper.classes()).toContain('cx-ui-code--inline');
  });

  it('injects the stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="code"]')).not.toBeNull();
  });
});

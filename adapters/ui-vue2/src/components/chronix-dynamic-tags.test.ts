// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixDynamicTags } from './chronix-dynamic-tags.js';

const DynamicTags = ChronixDynamicTags as unknown as VueConstructor;

describe('ChronixDynamicTags (vue2)', () => {
  it('renders a <div> with base cx-ui-dynamic-tags class', () => {
    const wrapper = mount(DynamicTags, {
      propsData: { value: ['alpha', 'beta'] },
    });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-dynamic-tags');
    expect(wrapper.findAll('.cx-ui-dynamic-tags__tag')).toHaveLength(2);
  });

  it('injects the chronix-dynamic-tags stylesheet into document.head', () => {
    mount(DynamicTags, { propsData: { value: [] } });
    expect(document.head.querySelector('style[data-chronix-ui="dynamic-tags"]')).not.toBeNull();
  });
});

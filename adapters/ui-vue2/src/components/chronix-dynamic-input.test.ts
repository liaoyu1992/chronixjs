// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixDynamicInput } from './chronix-dynamic-input.js';

const DynamicInput = ChronixDynamicInput as unknown as VueConstructor;

describe('ChronixDynamicInput (vue2)', () => {
  it('renders a <div> with base cx-ui-dynamic-input class', () => {
    const wrapper = mount(DynamicInput, {
      propsData: { value: ['a', 'b'] },
    });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-dynamic-input');
    expect(wrapper.find('[data-testid="dynamic-input-root"]').exists()).toBe(true);
  });

  it('injects the chronix-dynamic-input stylesheet into document.head', () => {
    mount(DynamicInput, { propsData: { value: [] } });
    expect(document.head.querySelector('style[data-chronix-ui="dynamic-input"]')).not.toBeNull();
  });
});

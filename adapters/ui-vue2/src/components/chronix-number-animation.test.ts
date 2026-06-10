// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixNumberAnimation } from './chronix-number-animation.js';

const NumberAnimation = ChronixNumberAnimation as unknown as VueConstructor;

describe('ChronixNumberAnimation (vue2)', () => {
  it('renders a <span> with base cx-ui-number-animation class', () => {
    const wrapper = mount(NumberAnimation, {
      propsData: { from: 0, to: 100, active: false },
    });
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-number-animation');
  });

  it('injects the chronix-number-animation stylesheet into document.head', () => {
    mount(NumberAnimation, { propsData: { active: false } });
    expect(document.head.querySelector('style[data-chronix-ui="number-animation"]')).not.toBeNull();
  });
});

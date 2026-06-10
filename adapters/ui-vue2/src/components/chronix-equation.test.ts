import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixEquation } from './chronix-equation.js';

const C = ChronixEquation as unknown as VueConstructor;

describe('ChronixEquation (vue2)', () => {
  it('renders <math> with --inline default', () => {
    const wrapper = mount(C, { propsData: { value: '<mrow><mi>x</mi></mrow>' } });
    expect(wrapper.element.tagName.toLowerCase()).toBe('math');
    expect(wrapper.classes()).toContain('cx-ui-equation--inline');
    expect(wrapper.attributes('display')).toBe('inline');
  });

  it('renders --block for display=block', () => {
    const wrapper = mount(C, { propsData: { value: '<mrow></mrow>', display: 'block' } });
    expect(wrapper.classes()).toContain('cx-ui-equation--block');
  });

  it('injects MathML via innerHTML', () => {
    const wrapper = mount(C, { propsData: { value: '<mrow><mi>x</mi></mrow>' } });
    expect(wrapper.element.innerHTML.toLowerCase()).toContain('mi');
  });

  it('injects the stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="equation"]')).not.toBeNull();
  });
});

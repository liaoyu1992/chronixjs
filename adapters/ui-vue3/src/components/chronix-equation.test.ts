import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixEquation } from './chronix-equation.js';

describe('ChronixEquation (vue3)', () => {
  it('renders a <math> root with --inline by default', () => {
    const wrapper = mount(ChronixEquation, {
      props: { value: '<mrow><mi>x</mi></mrow>' },
    });
    expect((wrapper.element as HTMLElement).tagName.toLowerCase()).toBe('math');
    expect(wrapper.classes()).toContain('cx-ui-equation--inline');
    expect(wrapper.attributes('display')).toBe('inline');
  });

  it('renders --block when display=block', () => {
    const wrapper = mount(ChronixEquation, {
      props: { value: '<mrow></mrow>', display: 'block' },
    });
    expect(wrapper.classes()).toContain('cx-ui-equation--block');
    expect(wrapper.attributes('display')).toBe('block');
  });

  it('injects MathML markup via innerHTML', () => {
    const wrapper = mount(ChronixEquation, {
      props: { value: '<mrow><mi>x</mi></mrow>' },
    });
    expect((wrapper.element as HTMLElement).innerHTML.toLowerCase()).toContain('mi');
  });

  it('injects the chronix-equation stylesheet', () => {
    mount(ChronixEquation);
    expect(document.head.querySelector('style[data-chronix-ui="equation"]')).not.toBeNull();
  });
});

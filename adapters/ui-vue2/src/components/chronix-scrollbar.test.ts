// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixScrollbar } from './chronix-scrollbar.js';

const Scrollbar = ChronixScrollbar as unknown as VueConstructor;

describe('ChronixScrollbar (vue2)', () => {
  it('renders a <div> with base cx-ui-scrollbar class and container', () => {
    const wrapper = mount(Scrollbar, {
      slots: { default: '<p>Scrollable content</p>' },
    });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-scrollbar');
    expect(wrapper.find('.cx-ui-scrollbar__container').exists()).toBe(true);
  });

  it('injects the chronix-scrollbar stylesheet into document.head', () => {
    mount(Scrollbar);
    expect(document.head.querySelector('style[data-chronix-ui="scrollbar"]')).not.toBeNull();
  });
});

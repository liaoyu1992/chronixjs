import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixFocusDetector } from './chronix-focus-detector.js';

const C = ChronixFocusDetector as unknown as VueConstructor;

describe('ChronixFocusDetector (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a span wrapper with base class', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { scopedSlots: { default: () => 'inner' } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-focus-detector').exists()).toBe(true);
  });

  it('adds --disabled modifier when disabled=true', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { disabled: true },
          scopedSlots: { default: () => 'x' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-focus-detector--disabled').exists()).toBe(true);
  });

  it('injects the chronix-focus-detector stylesheet', () => {
    mount(C, { propsData: {} });
    expect(document.head.querySelector('style[data-chronix-ui="focus-detector"]')).not.toBeNull();
  });
});

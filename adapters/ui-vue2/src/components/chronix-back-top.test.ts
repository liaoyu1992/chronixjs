import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixBackTop } from './chronix-back-top.js';

const C = ChronixBackTop as unknown as VueConstructor;

describe('ChronixBackTop (vue2)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders hidden span when scrollY below threshold', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { visibilityThreshold: 100 } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.element.tagName).toBe('SPAN');
  });

  it('renders button when scrollY >= threshold', async () => {
    (window as unknown as { scrollY: number }).scrollY = 500;
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { visibilityThreshold: 100 } });
      },
    });
    const wrapper = mount(Wrapper);
    await wrapper.vm.$nextTick();
    expect(wrapper.element.tagName).toBe('BUTTON');
    expect(wrapper.classes()).toContain('cx-ui-back-top');
  });

  it('injects the chronix-back-top stylesheet', () => {
    mount(C, { propsData: {} });
    expect(document.head.querySelector('style[data-chronix-ui="back-top"]')).not.toBeNull();
  });
});

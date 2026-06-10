import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixWave } from './chronix-wave.js';

const C = ChronixWave as unknown as VueConstructor;

describe('ChronixWave (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a wrapper span with base class', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { scopedSlots: { default: () => 'inner' } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-wave').exists()).toBe(true);
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
    expect(wrapper.find('.cx-ui-wave--disabled').exists()).toBe(true);
  });

  it('applies the custom CSS color via inline style', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { color: 'red' },
          scopedSlots: { default: () => 'x' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    const wave = wrapper.find('.cx-ui-wave').element as HTMLElement;
    expect(wave.style.getPropertyValue('--cx-ui-wave-color')).toBe('red');
  });

  it('injects the chronix-wave stylesheet', () => {
    mount(C, { propsData: {} });
    expect(document.head.querySelector('style[data-chronix-ui="wave"]')).not.toBeNull();
  });
});

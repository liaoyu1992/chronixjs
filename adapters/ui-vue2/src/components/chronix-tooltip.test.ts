import { resetPopupZIndexForTests } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixTooltip } from './chronix-tooltip.js';

const C = ChronixTooltip as unknown as VueConstructor;

describe('ChronixTooltip (vue2)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders trigger span without tooltip when show=false', () => {
    const wrapper = mount(C, {
      propsData: { show: false, trigger: 'manual', content: 'hint' },
      slots: { default: '<button>x</button>' },
    });
    expect(wrapper.find('.cx-ui-tooltip').exists()).toBe(false);
  });

  it('renders tooltip with text content when show=true', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, trigger: 'manual', content: 'hint text' },
          scopedSlots: { default: () => h('button', 'x') },
        });
      },
    });
    const wrapper = mount(Wrapper);
    const tooltip = wrapper.find('.cx-ui-tooltip');
    expect(tooltip.exists()).toBe(true);
    expect(tooltip.text()).toBe('hint text');
  });

  it('default placement is top → --top modifier', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, trigger: 'manual', content: 'x' },
          scopedSlots: { default: () => h('button') },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-tooltip').classes()).toContain('cx-ui-tooltip--top');
  });

  it('injects the chronix-tooltip stylesheet', () => {
    mount(C, { propsData: { content: '' } });
    expect(document.head.querySelector('style[data-chronix-ui="tooltip"]')).not.toBeNull();
  });
});

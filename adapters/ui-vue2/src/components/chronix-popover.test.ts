import { resetPopupZIndexForTests } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixPopover } from './chronix-popover.js';

const C = ChronixPopover as unknown as VueConstructor;

describe('ChronixPopover (vue2)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders trigger span without popup when show=false', () => {
    const wrapper = mount(C, {
      propsData: { show: false, trigger: 'manual' },
      slots: { default: '<button>trigger</button>' },
    });
    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-popover__trigger');
    expect(wrapper.find('.cx-ui-popover').exists()).toBe(false);
  });

  it('renders popup inline (sibling of trigger) when show=true', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, trigger: 'manual' },
          scopedSlots: {
            default: () => h('button', 'trigger'),
            content: () => 'Popover body',
          },
        });
      },
    });
    const wrapper = mount(Wrapper);
    const popup = wrapper.find('.cx-ui-popover');
    expect(popup.exists()).toBe(true);
    expect(popup.classes()).toContain('cx-ui-popover--open');
    expect(popup.text()).toContain('Popover body');
  });

  it('applies --top-start placement modifier', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, trigger: 'manual', placement: 'top-start' },
          scopedSlots: {
            default: () => h('button'),
            content: () => 'x',
          },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-popover').classes()).toContain('cx-ui-popover--top-start');
  });

  it('injects the chronix-popover stylesheet', () => {
    mount(C);
    expect(document.head.querySelector('style[data-chronix-ui="popover"]')).not.toBeNull();
  });
});

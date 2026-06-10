import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixSplit } from './chronix-split.js';

const C = ChronixSplit as unknown as VueConstructor;

describe('ChronixSplit (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders 2 panes + 1 bar in horizontal mode by default', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          scopedSlots: {
            first: () => 'L',
            second: () => 'R',
          },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-split--direction-horizontal').exists()).toBe(true);
    expect(wrapper.find('.cx-ui-split__pane--first').text()).toContain('L');
    expect(wrapper.find('.cx-ui-split__pane--second').text()).toContain('R');
    expect(wrapper.findAll('.cx-ui-split__bar').length).toBe(1);
  });

  it('vertical direction modifier is applied', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { direction: 'vertical' },
          scopedSlots: {
            first: () => 'T',
            second: () => 'B',
          },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-split--direction-vertical').exists()).toBe(true);
  });

  it('bar carries role="separator" + aria-orientation', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          scopedSlots: {
            first: () => 'a',
            second: () => 'b',
          },
        });
      },
    });
    const wrapper = mount(Wrapper);
    const bar = wrapper.find('.cx-ui-split__bar');
    expect(bar.attributes('role')).toBe('separator');
    expect(bar.attributes('aria-orientation')).toBe('vertical');
  });

  it('injects the chronix-split stylesheet', () => {
    mount(C, { propsData: {} });
    expect(document.head.querySelector('style[data-chronix-ui="split"]')).not.toBeNull();
  });
});

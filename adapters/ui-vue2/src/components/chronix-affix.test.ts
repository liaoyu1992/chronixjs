import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixAffix } from './chronix-affix.js';

const C = ChronixAffix as unknown as VueConstructor;

describe('ChronixAffix (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders placeholder + inner content', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { top: 0 },
          scopedSlots: { default: () => 'pinned content' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-affix-placeholder').exists()).toBe(true);
    const inner = wrapper.find('.cx-ui-affix');
    expect(inner.exists()).toBe(true);
    expect(inner.text()).toContain('pinned content');
  });

  it('injects the chronix-affix stylesheet', () => {
    mount(C, { propsData: {} });
    expect(document.head.querySelector('style[data-chronix-ui="affix"]')).not.toBeNull();
  });
});

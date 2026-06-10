import { resetBodyScrollLockForTests, resetPopupZIndexForTests } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixModal } from './chronix-modal.js';

const C = ChronixModal as unknown as VueConstructor;

describe('ChronixModal (vue2)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
    resetBodyScrollLockForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders hidden span when show=false', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: false },
          scopedSlots: { default: () => 'Body' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.element.tagName).toBe('SPAN');
    expect((wrapper.element as HTMLElement).style.display).toBe('none');
  });

  it('renders wrapper + panel inline when show=true', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, title: 'Hi' },
          scopedSlots: { default: () => 'Body content' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-modal-wrapper').exists()).toBe(true);
    expect(wrapper.find('.cx-ui-modal-wrapper').classes()).toContain(
      'cx-ui-modal-wrapper--with-mask',
    );
    expect(wrapper.find('.cx-ui-modal__title').text()).toBe('Hi');
  });

  it('omits mask when mask=false', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, mask: false },
          scopedSlots: { default: () => 'x' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-modal__mask').exists()).toBe(false);
  });

  it('applies width via inline style', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, width: 640 },
          scopedSlots: { default: () => 'x' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    const panel = wrapper.find('.cx-ui-modal').element as HTMLElement;
    expect(panel.style.width).toBe('640px');
  });

  it('injects the chronix-modal stylesheet', () => {
    mount(C, { propsData: { show: false } });
    expect(document.head.querySelector('style[data-chronix-ui="modal"]')).not.toBeNull();
  });
});

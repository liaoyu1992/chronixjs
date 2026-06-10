import { resetBodyScrollLockForTests, resetPopupZIndexForTests } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixDrawer } from './chronix-drawer.js';

const C = ChronixDrawer as unknown as VueConstructor;

describe('ChronixDrawer (vue2)', () => {
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
          scopedSlots: { default: () => 'x' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.element.tagName).toBe('SPAN');
  });

  it('renders panel with default --placement-right', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true },
          scopedSlots: { default: () => 'x' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-drawer-wrapper').classes()).toContain(
      'cx-ui-drawer-wrapper--placement-right',
    );
    expect(wrapper.find('.cx-ui-drawer').classes()).toContain('cx-ui-drawer--placement-right');
  });

  it('applies height via inline style for placement=bottom', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, placement: 'bottom', height: 240 },
          scopedSlots: { default: () => 'x' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    const panel = wrapper.find('.cx-ui-drawer').element as HTMLElement;
    expect(panel.style.height).toBe('240px');
  });

  it('injects the chronix-drawer stylesheet', () => {
    mount(C, { propsData: { show: false } });
    expect(document.head.querySelector('style[data-chronix-ui="drawer"]')).not.toBeNull();
  });
});

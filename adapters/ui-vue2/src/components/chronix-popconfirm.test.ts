import { resetPopupZIndexForTests } from '@chronixjs/ui';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixPopconfirm } from './chronix-popconfirm.js';

const C = ChronixPopconfirm as unknown as VueConstructor;

describe('ChronixPopconfirm (vue2)', () => {
  beforeEach(() => {
    resetPopupZIndexForTests();
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders title + positive/negative buttons when show=true', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: {
            show: true,
            trigger: 'manual',
            title: 'Delete?',
            positiveText: 'Yes',
            negativeText: 'No',
          },
          scopedSlots: { default: () => h('button', 'delete') },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-popconfirm__title').text()).toBe('Delete?');
    const actions = wrapper.findAll('.cx-ui-popconfirm__action');
    expect(actions).toHaveLength(2);
    expect(actions.at(0).text()).toBe('No');
    expect(actions.at(1).text()).toBe('Yes');
    expect(actions.at(1).classes()).toContain('cx-ui-popconfirm__action--positive');
  });

  it('action buttons have type=button', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, trigger: 'manual', title: 't' },
          scopedSlots: { default: () => h('button') },
        });
      },
    });
    const wrapper = mount(Wrapper);
    wrapper.findAll('.cx-ui-popconfirm__action').wrappers.forEach((b) => {
      expect(b.attributes('type')).toBe('button');
    });
  });

  it('renders SVG warning icon in header', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { show: true, trigger: 'manual', title: 't' },
          scopedSlots: { default: () => h('button') },
        });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('svg.cx-ui-popconfirm__icon').exists()).toBe(true);
  });

  it('injects the chronix-popconfirm stylesheet', () => {
    mount(C, { propsData: { title: '' } });
    expect(document.head.querySelector('style[data-chronix-ui="popconfirm"]')).not.toBeNull();
  });
});

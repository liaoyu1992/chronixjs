import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixTabs } from './chronix-tabs.js';

const C = ChronixTabs as unknown as VueConstructor;

const items = [
  { key: 'a', label: 'A', disabled: false, content: 'first body' },
  { key: 'b', label: 'B', disabled: false, content: 'second body' },
  { key: 'c', label: 'C', disabled: true, content: 'third body' },
] as const;

describe('ChronixTabs (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders 3 tab buttons + the active tab panel', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items, value: 'a' } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.findAll('[role="tab"]').length).toBe(3);
    expect(wrapper.find('[role="tabpanel"]').text()).toContain('first body');
  });

  it('marks the active tab with aria-selected + --active modifier', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, { props: { items, value: 'b' } });
      },
    });
    const wrapper = mount(Wrapper);
    const activeTab = wrapper.find('[data-tab-key="b"]');
    expect(activeTab.attributes('aria-selected')).toBe('true');
    expect(activeTab.classes()).toContain('cx-ui-tabs__tab--active');
  });

  it('drives all 3 modifier classes (type + placement + size)', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(C, {
          props: { items, value: 'a', type: 'segment', placement: 'left', size: 'small' },
        });
      },
    });
    const wrapper = mount(Wrapper);
    const root = wrapper.find('.cx-ui-tabs');
    expect(root.classes()).toContain('cx-ui-tabs--type-segment');
    expect(root.classes()).toContain('cx-ui-tabs--placement-left');
    expect(root.classes()).toContain('cx-ui-tabs--size-small');
  });

  it('injects the chronix-tabs stylesheet', () => {
    mount(C, { propsData: { items: [], value: undefined } });
    expect(document.head.querySelector('style[data-chronix-ui="tabs"]')).not.toBeNull();
  });
});

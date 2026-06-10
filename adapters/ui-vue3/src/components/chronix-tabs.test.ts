import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixTabs } from './chronix-tabs.js';

const items = [
  { key: 'a', label: 'A', disabled: false, content: 'first body' },
  { key: 'b', label: 'B', disabled: false, content: 'second body' },
  { key: 'c', label: 'C', disabled: true, content: 'third body' },
] as const;

describe('ChronixTabs (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders 3 tab buttons + the active tab panel', () => {
    const wrapper = mount(ChronixTabs, {
      props: { items, value: 'a' },
    });
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs.length).toBe(3);
    expect(wrapper.find('[role="tabpanel"]').text()).toContain('first body');
  });

  it('marks the active tab with aria-selected + --active modifier', () => {
    const wrapper = mount(ChronixTabs, {
      props: { items, value: 'b' },
    });
    const activeTab = wrapper.find('[data-tab-key="b"]');
    expect(activeTab.attributes('aria-selected')).toBe('true');
    expect(activeTab.classes()).toContain('cx-ui-tabs__tab--active');
  });

  it('emits update:value on tab click', async () => {
    const wrapper = mount(ChronixTabs, { props: { items, value: 'a' } });
    await wrapper.find('[data-tab-key="b"]').trigger('click');
    expect(wrapper.emitted('update:value')?.[0]).toEqual(['b']);
  });

  it('does NOT emit on disabled-tab click', async () => {
    const wrapper = mount(ChronixTabs, { props: { items, value: 'a' } });
    await wrapper.find('[data-tab-key="c"]').trigger('click');
    expect(wrapper.emitted('update:value')).toBeUndefined();
  });

  it('drives all 3 modifier classes (type + placement + size)', () => {
    const wrapper = mount(ChronixTabs, {
      props: { items, value: 'a', type: 'segment', placement: 'left', size: 'small' },
    });
    const root = wrapper.find('.cx-ui-tabs');
    expect(root.classes()).toContain('cx-ui-tabs--type-segment');
    expect(root.classes()).toContain('cx-ui-tabs--placement-left');
    expect(root.classes()).toContain('cx-ui-tabs--size-small');
  });

  it('injects the chronix-tabs stylesheet', () => {
    mount(ChronixTabs, { props: { items: [], value: undefined } });
    expect(document.head.querySelector('style[data-chronix-ui="tabs"]')).not.toBeNull();
  });
});

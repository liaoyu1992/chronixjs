import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixSteps } from './chronix-steps.js';

import type { StepItem } from '@chronixjs/ui';

const Steps = ChronixSteps as unknown as VueConstructor;

const SAMPLE_ITEMS: StepItem[] = [
  { key: 'setup', title: 'Setup', description: 'Initial config', status: undefined },
  { key: 'deploy', title: 'Deploy', description: undefined, status: undefined },
  { key: 'verify', title: 'Verify', description: undefined, status: undefined },
];

describe('ChronixSteps (vue2) — root rendering', () => {
  it('renders a <div> with the base + direction=horizontal classes', () => {
    const wrapper = mount(Steps, { propsData: { items: SAMPLE_ITEMS } });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-steps');
    expect(wrapper.classes()).toContain('cx-ui-steps--horizontal');
  });

  it('renders empty <div> when items is empty', () => {
    const wrapper = mount(Steps);
    expect(wrapper.findAll('.cx-ui-steps__item')).toHaveLength(0);
  });

  it('uses --vertical when direction prop is vertical', () => {
    const wrapper = mount(Steps, {
      propsData: { items: SAMPLE_ITEMS, direction: 'vertical' },
    });
    expect(wrapper.classes()).toContain('cx-ui-steps--vertical');
  });
});

describe('ChronixSteps (vue2) — items + separators', () => {
  it('renders one item per StepItem', () => {
    const wrapper = mount(Steps, { propsData: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-steps__item')).toHaveLength(SAMPLE_ITEMS.length);
  });

  it('renders items.length - 1 separators', () => {
    const wrapper = mount(Steps, { propsData: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-steps__separator')).toHaveLength(2);
  });

  it('renders 0 separators when items has only 1 entry', () => {
    const wrapper = mount(Steps, { propsData: { items: [SAMPLE_ITEMS[0]!] } });
    expect(wrapper.findAll('.cx-ui-steps__separator')).toHaveLength(0);
  });
});

describe('ChronixSteps (vue2) — derived per-item status', () => {
  it('current=1 yields finish / process / wait derived statuses', () => {
    const wrapper = mount(Steps, { propsData: { items: SAMPLE_ITEMS, current: 1 } });
    const items = wrapper.findAll('.cx-ui-steps__item');
    expect(items.at(0).classes()).toContain('cx-ui-steps__item--finish');
    expect(items.at(1).classes()).toContain('cx-ui-steps__item--process');
    expect(items.at(1).classes()).toContain('cx-ui-steps__item--current');
    expect(items.at(2).classes()).toContain('cx-ui-steps__item--wait');
  });

  it('per-step status override beats current-based auto-derive', () => {
    const items: StepItem[] = [
      { key: 'a', title: 'A', description: undefined, status: undefined },
      { key: 'b', title: 'B', description: undefined, status: 'error' },
    ];
    const wrapper = mount(Steps, { propsData: { items, current: 0 } });
    expect(wrapper.findAll('.cx-ui-steps__item').at(1).classes()).toContain(
      'cx-ui-steps__item--error',
    );
  });
});

describe('ChronixSteps (vue2) — indicator content', () => {
  it('wait/process status renders 1-based numeric index', () => {
    const wrapper = mount(Steps, { propsData: { items: SAMPLE_ITEMS, current: 0 } });
    const indices = wrapper.findAll('.cx-ui-steps__index');
    expect(indices.at(0).text()).toBe('1');
    expect(indices.at(1).text()).toBe('2');
    expect(indices.at(2).text()).toBe('3');
  });

  it('finish status renders the ✓ unicode placeholder', () => {
    const wrapper = mount(Steps, {
      propsData: { items: SAMPLE_ITEMS, current: SAMPLE_ITEMS.length },
    });
    expect(wrapper.findAll('.cx-ui-steps__index').at(0).text()).toBe('✓');
  });

  it('error status renders the ✕ unicode placeholder', () => {
    const items: StepItem[] = [{ key: 'a', title: 'A', description: undefined, status: 'error' }];
    const wrapper = mount(Steps, { propsData: { items } });
    expect(wrapper.find('.cx-ui-steps__index').text()).toBe('✕');
  });

  it('indicator has aria-hidden="true" for screen readers', () => {
    const wrapper = mount(Steps, { propsData: { items: SAMPLE_ITEMS } });
    expect(wrapper.find('.cx-ui-steps__index').attributes('aria-hidden')).toBe('true');
  });
});

describe('ChronixSteps (vue2) — title + description', () => {
  it('renders __title with the item title text', () => {
    const wrapper = mount(Steps, { propsData: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-steps__title').at(0).text()).toBe('Setup');
  });

  it('renders __description only when description is defined', () => {
    const wrapper = mount(Steps, { propsData: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-steps__description')).toHaveLength(1);
    expect(wrapper.find('.cx-ui-steps__description').text()).toBe('Initial config');
  });
});

describe('ChronixSteps (vue2) — has-error aggregate', () => {
  it('--has-error appears on root when any item is error', () => {
    const items: StepItem[] = [
      { key: 'a', title: 'A', description: undefined, status: undefined },
      { key: 'b', title: 'B', description: undefined, status: 'error' },
    ];
    const wrapper = mount(Steps, { propsData: { items, current: 0 } });
    expect(wrapper.classes()).toContain('cx-ui-steps--has-error');
  });
});

describe('ChronixSteps (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-steps stylesheet is in document.head', () => {
    mount(Steps, { propsData: { items: SAMPLE_ITEMS } });
    expect(document.head.querySelector('style[data-chronix-ui="steps"]')).not.toBeNull();
  });
});

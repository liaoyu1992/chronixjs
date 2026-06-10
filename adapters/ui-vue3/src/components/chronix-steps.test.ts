import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixSteps } from './chronix-steps.js';

import type { StepItem } from '@chronixjs/ui';

const SAMPLE_ITEMS: StepItem[] = [
  { key: 'setup', title: 'Setup', description: 'Initial config', status: undefined },
  { key: 'deploy', title: 'Deploy', description: undefined, status: undefined },
  { key: 'verify', title: 'Verify', description: undefined, status: undefined },
];

describe('ChronixSteps — root rendering', () => {
  it('renders a <div> with the base + direction=horizontal classes', () => {
    const wrapper = mount(ChronixSteps, { props: { items: SAMPLE_ITEMS } });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-steps');
    expect(wrapper.classes()).toContain('cx-ui-steps--horizontal');
  });

  it('renders empty <div> when items is empty', () => {
    const wrapper = mount(ChronixSteps);
    expect(wrapper.findAll('.cx-ui-steps__item')).toHaveLength(0);
    expect(wrapper.findAll('.cx-ui-steps__separator')).toHaveLength(0);
  });

  it('uses --vertical when direction prop is vertical', () => {
    const wrapper = mount(ChronixSteps, {
      props: { items: SAMPLE_ITEMS, direction: 'vertical' },
    });
    expect(wrapper.classes()).toContain('cx-ui-steps--vertical');
    expect(wrapper.classes()).not.toContain('cx-ui-steps--horizontal');
  });
});

describe('ChronixSteps — items + separators', () => {
  it('renders one item per StepItem', () => {
    const wrapper = mount(ChronixSteps, { props: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-steps__item')).toHaveLength(SAMPLE_ITEMS.length);
  });

  it('renders items.length - 1 separators', () => {
    const wrapper = mount(ChronixSteps, { props: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-steps__separator')).toHaveLength(2);
  });

  it('renders 0 separators when items has only 1 entry', () => {
    const wrapper = mount(ChronixSteps, {
      props: {
        items: [SAMPLE_ITEMS[0]!],
      },
    });
    expect(wrapper.findAll('.cx-ui-steps__separator')).toHaveLength(0);
  });
});

describe('ChronixSteps — derived per-item status', () => {
  it('current=1 yields finish / process / wait derived statuses', () => {
    const wrapper = mount(ChronixSteps, {
      props: { items: SAMPLE_ITEMS, current: 1 },
    });
    const items = wrapper.findAll('.cx-ui-steps__item');
    expect(items[0]!.classes()).toContain('cx-ui-steps__item--finish');
    expect(items[1]!.classes()).toContain('cx-ui-steps__item--process');
    expect(items[1]!.classes()).toContain('cx-ui-steps__item--current');
    expect(items[2]!.classes()).toContain('cx-ui-steps__item--wait');
  });

  it('per-step status override beats current-based auto-derive', () => {
    const items: StepItem[] = [
      { key: 'a', title: 'A', description: undefined, status: undefined },
      { key: 'b', title: 'B', description: undefined, status: 'error' },
      { key: 'c', title: 'C', description: undefined, status: undefined },
    ];
    const wrapper = mount(ChronixSteps, { props: { items, current: 0 } });
    const itemEls = wrapper.findAll('.cx-ui-steps__item');
    expect(itemEls[1]!.classes()).toContain('cx-ui-steps__item--error');
  });

  it('items with current=items.length all derive to finish', () => {
    const wrapper = mount(ChronixSteps, {
      props: { items: SAMPLE_ITEMS, current: SAMPLE_ITEMS.length },
    });
    for (const item of wrapper.findAll('.cx-ui-steps__item')) {
      expect(item.classes()).toContain('cx-ui-steps__item--finish');
    }
  });
});

describe('ChronixSteps — indicator content', () => {
  it('wait/process status renders 1-based numeric index', () => {
    const wrapper = mount(ChronixSteps, {
      props: { items: SAMPLE_ITEMS, current: 0 },
    });
    const indices = wrapper.findAll('.cx-ui-steps__index');
    expect(indices[0]!.text()).toBe('1');
    expect(indices[1]!.text()).toBe('2');
    expect(indices[2]!.text()).toBe('3');
  });

  it('finish status renders the ✓ unicode placeholder', () => {
    const wrapper = mount(ChronixSteps, {
      props: { items: SAMPLE_ITEMS, current: SAMPLE_ITEMS.length },
    });
    const indices = wrapper.findAll('.cx-ui-steps__index');
    for (const index of indices) {
      expect(index.text()).toBe('✓');
    }
  });

  it('error status renders the ✕ unicode placeholder', () => {
    const items: StepItem[] = [{ key: 'a', title: 'A', description: undefined, status: 'error' }];
    const wrapper = mount(ChronixSteps, { props: { items } });
    expect(wrapper.find('.cx-ui-steps__index').text()).toBe('✕');
  });

  it('indicator has aria-hidden="true" for screen readers', () => {
    const wrapper = mount(ChronixSteps, { props: { items: SAMPLE_ITEMS } });
    expect(wrapper.find('.cx-ui-steps__index').attributes('aria-hidden')).toBe('true');
  });
});

describe('ChronixSteps — title + description', () => {
  it('renders __title with the item title text', () => {
    const wrapper = mount(ChronixSteps, { props: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-steps__title').at(0)!.text()).toBe('Setup');
  });

  it('renders __description only when description is defined', () => {
    const wrapper = mount(ChronixSteps, { props: { items: SAMPLE_ITEMS } });
    const descriptions = wrapper.findAll('.cx-ui-steps__description');
    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]!.text()).toBe('Initial config');
  });
});

describe('ChronixSteps — has-error aggregate', () => {
  it('--has-error appears on root when any item is error', () => {
    const items: StepItem[] = [
      { key: 'a', title: 'A', description: undefined, status: undefined },
      { key: 'b', title: 'B', description: undefined, status: 'error' },
    ];
    const wrapper = mount(ChronixSteps, { props: { items, current: 0 } });
    expect(wrapper.classes()).toContain('cx-ui-steps--has-error');
  });
});

describe('ChronixSteps — CSS injection', () => {
  it('mounting ensures the chronix-steps stylesheet is in document.head', () => {
    mount(ChronixSteps, { props: { items: SAMPLE_ITEMS } });
    expect(document.head.querySelector('style[data-chronix-ui="steps"]')).not.toBeNull();
  });
});

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixTimeline } from './chronix-timeline.js';

import type { TimelineItem } from '@chronixjs/ui';

const SAMPLE_ITEMS: TimelineItem[] = [
  {
    key: 'create',
    title: 'Created',
    description: 'Initial commit',
    timestamp: '2026-06-01',
    color: 'success',
    lineType: 'default',
  },
  {
    key: 'deploy',
    title: 'Deployed',
    description: undefined,
    timestamp: '2026-06-02',
    color: 'info',
    lineType: 'dashed',
  },
  {
    key: 'verified',
    title: 'Verified',
    description: undefined,
    timestamp: undefined,
    color: 'default',
    lineType: 'default',
  },
];

describe('ChronixTimeline — root rendering', () => {
  it('renders a <div> with the base class', () => {
    const wrapper = mount(ChronixTimeline, { props: { items: SAMPLE_ITEMS } });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-timeline');
  });

  it('renders empty <div> when items is empty', () => {
    const wrapper = mount(ChronixTimeline);
    expect(wrapper.findAll('.cx-ui-timeline__item')).toHaveLength(0);
  });
});

describe('ChronixTimeline — items', () => {
  it('renders one item per TimelineItem', () => {
    const wrapper = mount(ChronixTimeline, { props: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-timeline__item')).toHaveLength(SAMPLE_ITEMS.length);
  });

  it('applies color modifier per item', () => {
    const wrapper = mount(ChronixTimeline, { props: { items: SAMPLE_ITEMS } });
    const items = wrapper.findAll('.cx-ui-timeline__item');
    expect(items[0]!.classes()).toContain('cx-ui-timeline__item--color-success');
    expect(items[1]!.classes()).toContain('cx-ui-timeline__item--color-info');
    expect(items[2]!.classes()).toContain('cx-ui-timeline__item--color-default');
  });

  it('applies lineType modifier per item', () => {
    const wrapper = mount(ChronixTimeline, { props: { items: SAMPLE_ITEMS } });
    const items = wrapper.findAll('.cx-ui-timeline__item');
    expect(items[0]!.classes()).toContain('cx-ui-timeline__item--line-default');
    expect(items[1]!.classes()).toContain('cx-ui-timeline__item--line-dashed');
  });
});

describe('ChronixTimeline — last-item special case', () => {
  it('only the last item carries the --last modifier', () => {
    const wrapper = mount(ChronixTimeline, { props: { items: SAMPLE_ITEMS } });
    const items = wrapper.findAll('.cx-ui-timeline__item');
    expect(items[0]!.classes()).not.toContain('cx-ui-timeline__item--last');
    expect(items[1]!.classes()).not.toContain('cx-ui-timeline__item--last');
    expect(items[2]!.classes()).toContain('cx-ui-timeline__item--last');
  });

  it('only the last item omits the __line element', () => {
    const wrapper = mount(ChronixTimeline, { props: { items: SAMPLE_ITEMS } });
    const items = wrapper.findAll('.cx-ui-timeline__item');
    expect(items[0]!.find('.cx-ui-timeline__line').exists()).toBe(true);
    expect(items[1]!.find('.cx-ui-timeline__line').exists()).toBe(true);
    expect(items[2]!.find('.cx-ui-timeline__line').exists()).toBe(false);
  });

  it('every item still has a __dot element', () => {
    const wrapper = mount(ChronixTimeline, { props: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-timeline__dot')).toHaveLength(SAMPLE_ITEMS.length);
  });
});

describe('ChronixTimeline — title / description / timestamp', () => {
  it('renders __title with item title text', () => {
    const wrapper = mount(ChronixTimeline, { props: { items: SAMPLE_ITEMS } });
    const titles = wrapper.findAll('.cx-ui-timeline__title');
    expect(titles[0]!.text()).toBe('Created');
    expect(titles[1]!.text()).toBe('Deployed');
  });

  it('renders __description only when description is defined', () => {
    const wrapper = mount(ChronixTimeline, { props: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-timeline__description')).toHaveLength(1);
    expect(wrapper.find('.cx-ui-timeline__description').text()).toBe('Initial commit');
  });

  it('renders __timestamp only when timestamp is defined', () => {
    const wrapper = mount(ChronixTimeline, { props: { items: SAMPLE_ITEMS } });
    const timestamps = wrapper.findAll('.cx-ui-timeline__timestamp');
    expect(timestamps).toHaveLength(2);
    expect(timestamps[0]!.text()).toBe('2026-06-01');
    expect(timestamps[1]!.text()).toBe('2026-06-02');
  });
});

describe('ChronixTimeline — CSS injection', () => {
  it('mounting ensures the chronix-timeline stylesheet is in document.head', () => {
    mount(ChronixTimeline, { props: { items: SAMPLE_ITEMS } });
    expect(document.head.querySelector('style[data-chronix-ui="timeline"]')).not.toBeNull();
  });
});

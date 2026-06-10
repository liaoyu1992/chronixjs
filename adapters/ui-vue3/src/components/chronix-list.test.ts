import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixList } from './chronix-list.js';

import type { ListItem } from '@chronixjs/ui';

const RICH_ITEMS: ListItem[] = [
  {
    key: 'docs',
    title: 'Documents',
    description: '14 items',
    prefix: '📁',
    suffix: '→',
  },
  {
    key: 'photos',
    title: 'Photos',
    description: undefined,
    prefix: '📷',
    suffix: undefined,
  },
  {
    key: 'plain',
    title: 'Plain row',
    description: undefined,
    prefix: undefined,
    suffix: undefined,
  },
];

describe('ChronixList — root rendering', () => {
  it('renders a <ul> with the base class + size + with-divider modifiers', () => {
    const wrapper = mount(ChronixList, { props: { items: RICH_ITEMS } });
    expect((wrapper.element as HTMLElement).tagName).toBe('UL');
    expect(wrapper.classes()).toContain('cx-ui-list');
    expect(wrapper.classes()).toContain('cx-ui-list--medium');
    expect(wrapper.classes()).toContain('cx-ui-list--with-divider');
  });

  it('renders empty <ul> when items is empty', () => {
    const wrapper = mount(ChronixList);
    expect(wrapper.findAll('.cx-ui-list__item')).toHaveLength(0);
  });

  it('adds --bordered when bordered=true', () => {
    const wrapper = mount(ChronixList, {
      props: { items: RICH_ITEMS, bordered: true },
    });
    expect(wrapper.classes()).toContain('cx-ui-list--bordered');
  });

  it('adds --hoverable when hoverable=true', () => {
    const wrapper = mount(ChronixList, {
      props: { items: RICH_ITEMS, hoverable: true },
    });
    expect(wrapper.classes()).toContain('cx-ui-list--hoverable');
  });

  it('omits --with-divider when showDivider=false', () => {
    const wrapper = mount(ChronixList, {
      props: { items: RICH_ITEMS, showDivider: false },
    });
    expect(wrapper.classes()).not.toContain('cx-ui-list--with-divider');
  });
});

describe('ChronixList — items', () => {
  it('renders one <li> per ListItem', () => {
    const wrapper = mount(ChronixList, { props: { items: RICH_ITEMS } });
    expect(wrapper.findAll('.cx-ui-list__item')).toHaveLength(RICH_ITEMS.length);
  });

  it('renders __prefix only when item.prefix is defined', () => {
    const wrapper = mount(ChronixList, { props: { items: RICH_ITEMS } });
    const items = wrapper.findAll('.cx-ui-list__item');
    expect(items[0]!.find('.cx-ui-list__prefix').exists()).toBe(true);
    expect(items[0]!.find('.cx-ui-list__prefix').text()).toBe('📁');
    expect(items[1]!.find('.cx-ui-list__prefix').exists()).toBe(true);
    expect(items[2]!.find('.cx-ui-list__prefix').exists()).toBe(false);
  });

  it('renders __suffix only when item.suffix is defined', () => {
    const wrapper = mount(ChronixList, { props: { items: RICH_ITEMS } });
    const items = wrapper.findAll('.cx-ui-list__item');
    expect(items[0]!.find('.cx-ui-list__suffix').exists()).toBe(true);
    expect(items[0]!.find('.cx-ui-list__suffix').text()).toBe('→');
    expect(items[1]!.find('.cx-ui-list__suffix').exists()).toBe(false);
    expect(items[2]!.find('.cx-ui-list__suffix').exists()).toBe(false);
  });

  it('renders __description only when item.description is defined', () => {
    const wrapper = mount(ChronixList, { props: { items: RICH_ITEMS } });
    const items = wrapper.findAll('.cx-ui-list__item');
    expect(items[0]!.find('.cx-ui-list__description').text()).toBe('14 items');
    expect(items[1]!.find('.cx-ui-list__description').exists()).toBe(false);
    expect(items[2]!.find('.cx-ui-list__description').exists()).toBe(false);
  });

  it('renders __title text for every item', () => {
    const wrapper = mount(ChronixList, { props: { items: RICH_ITEMS } });
    const titles = wrapper.findAll('.cx-ui-list__title');
    expect(titles[0]!.text()).toBe('Documents');
    expect(titles[1]!.text()).toBe('Photos');
    expect(titles[2]!.text()).toBe('Plain row');
  });
});

describe('ChronixList — per-item modifiers', () => {
  it('item with prefix carries --with-prefix modifier', () => {
    const wrapper = mount(ChronixList, { props: { items: RICH_ITEMS } });
    const items = wrapper.findAll('.cx-ui-list__item');
    expect(items[0]!.classes()).toContain('cx-ui-list__item--with-prefix');
    expect(items[2]!.classes()).not.toContain('cx-ui-list__item--with-prefix');
  });

  it('item with suffix carries --with-suffix modifier', () => {
    const wrapper = mount(ChronixList, { props: { items: RICH_ITEMS } });
    const items = wrapper.findAll('.cx-ui-list__item');
    expect(items[0]!.classes()).toContain('cx-ui-list__item--with-suffix');
    expect(items[1]!.classes()).not.toContain('cx-ui-list__item--with-suffix');
  });

  it('item with description carries --with-description modifier', () => {
    const wrapper = mount(ChronixList, { props: { items: RICH_ITEMS } });
    const items = wrapper.findAll('.cx-ui-list__item');
    expect(items[0]!.classes()).toContain('cx-ui-list__item--with-description');
    expect(items[2]!.classes()).not.toContain('cx-ui-list__item--with-description');
  });
});

describe('ChronixList — CSS injection', () => {
  it('mounting ensures the chronix-list stylesheet is in document.head', () => {
    mount(ChronixList, { props: { items: RICH_ITEMS } });
    expect(document.head.querySelector('style[data-chronix-ui="list"]')).not.toBeNull();
  });
});

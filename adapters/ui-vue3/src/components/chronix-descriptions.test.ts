import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixDescriptions } from './chronix-descriptions.js';

import type { DescriptionItem } from '@chronixjs/ui';

const PROFILE_ITEMS: DescriptionItem[] = [
  { key: 'name', label: 'Name', value: 'Liao Yu', span: 1 },
  { key: 'email', label: 'Email', value: 'liao@chronix.dev', span: 1 },
  { key: 'role', label: 'Role', value: 'Engineer', span: 1 },
  { key: 'bio', label: 'Bio', value: 'Spans the full row.', span: 3 },
];

describe('ChronixDescriptions — root rendering', () => {
  it('renders a <div> with the base class + size + placement modifiers', () => {
    const wrapper = mount(ChronixDescriptions, {
      props: { items: PROFILE_ITEMS, columns: 3 },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-descriptions');
    expect(wrapper.classes()).toContain('cx-ui-descriptions--medium');
    expect(wrapper.classes()).toContain('cx-ui-descriptions--placement-left');
  });

  it('adds --bordered when bordered=true', () => {
    const wrapper = mount(ChronixDescriptions, {
      props: { items: PROFILE_ITEMS, bordered: true },
    });
    expect(wrapper.classes()).toContain('cx-ui-descriptions--bordered');
  });

  it('adds --placement-top when labelPlacement="top"', () => {
    const wrapper = mount(ChronixDescriptions, {
      props: { items: PROFILE_ITEMS, labelPlacement: 'top' },
    });
    expect(wrapper.classes()).toContain('cx-ui-descriptions--placement-top');
  });

  it('renders empty grid when items is empty', () => {
    const wrapper = mount(ChronixDescriptions);
    expect(wrapper.findAll('.cx-ui-descriptions__item')).toHaveLength(0);
  });
});

describe('ChronixDescriptions — title', () => {
  it('renders __title with prop string', () => {
    const wrapper = mount(ChronixDescriptions, {
      props: { items: PROFILE_ITEMS, title: 'Profile' },
    });
    expect(wrapper.find('.cx-ui-descriptions__title').text()).toBe('Profile');
    expect(wrapper.classes()).toContain('cx-ui-descriptions--with-title');
  });

  it('omits __title when no title prop + no slot', () => {
    const wrapper = mount(ChronixDescriptions, {
      props: { items: PROFILE_ITEMS },
    });
    expect(wrapper.find('.cx-ui-descriptions__title').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('cx-ui-descriptions--with-title');
  });

  it('renders __title from title slot when supplied', () => {
    const wrapper = mount(ChronixDescriptions, {
      props: { items: PROFILE_ITEMS },
      slots: { title: '<strong>Slot title</strong>' },
    });
    expect(wrapper.find('.cx-ui-descriptions__title').text()).toBe('Slot title');
    expect(wrapper.classes()).toContain('cx-ui-descriptions--with-title');
  });
});

describe('ChronixDescriptions — items', () => {
  it('renders one __item per DescriptionItem', () => {
    const wrapper = mount(ChronixDescriptions, {
      props: { items: PROFILE_ITEMS, columns: 3 },
    });
    expect(wrapper.findAll('.cx-ui-descriptions__item')).toHaveLength(PROFILE_ITEMS.length);
  });

  it('renders __label and __value text for every item', () => {
    const wrapper = mount(ChronixDescriptions, {
      props: { items: PROFILE_ITEMS, columns: 3 },
    });
    const labels = wrapper.findAll('.cx-ui-descriptions__label');
    const values = wrapper.findAll('.cx-ui-descriptions__value');
    expect(labels[0]!.text()).toBe('Name');
    expect(values[0]!.text()).toBe('Liao Yu');
    expect(labels[3]!.text()).toBe('Bio');
    expect(values[3]!.text()).toBe('Spans the full row.');
  });

  it('renders the __grid with grid-template-columns inline style', () => {
    const wrapper = mount(ChronixDescriptions, {
      props: { items: PROFILE_ITEMS, columns: 3 },
    });
    const grid = wrapper.find('.cx-ui-descriptions__grid');
    const style = grid.attributes('style') ?? '';
    expect(style).toContain('grid-template-columns');
    expect(style).toContain('repeat(3,');
  });
});

describe('ChronixDescriptions — per-item span', () => {
  it('emits grid-column inline style for items with span > 1', () => {
    const wrapper = mount(ChronixDescriptions, {
      props: { items: PROFILE_ITEMS, columns: 3 },
    });
    const items = wrapper.findAll('.cx-ui-descriptions__item');
    // 4th item: span=3
    const lastStyle = items[3]!.attributes('style') ?? '';
    expect(lastStyle).toContain('grid-column');
    expect(lastStyle).toContain('span 3');
  });

  it('omits grid-column inline style for items with span === 1', () => {
    const wrapper = mount(ChronixDescriptions, {
      props: { items: PROFILE_ITEMS, columns: 3 },
    });
    const items = wrapper.findAll('.cx-ui-descriptions__item');
    const firstStyle = items[0]!.attributes('style') ?? '';
    expect(firstStyle).not.toContain('grid-column');
  });

  it('omits grid-column inline style when item.span > columns (silent ignore)', () => {
    const items: DescriptionItem[] = [{ key: 'a', label: 'A', value: 'A', span: 99 }];
    const wrapper = mount(ChronixDescriptions, { props: { items, columns: 3 } });
    const style = wrapper.find('.cx-ui-descriptions__item').attributes('style') ?? '';
    expect(style).not.toContain('grid-column');
  });
});

describe('ChronixDescriptions — CSS injection', () => {
  it('mounting ensures the chronix-descriptions stylesheet is in document.head', () => {
    mount(ChronixDescriptions, { props: { items: PROFILE_ITEMS } });
    expect(document.head.querySelector('style[data-chronix-ui="descriptions"]')).not.toBeNull();
  });
});

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixDescriptions } from './chronix-descriptions.js';

import type { DescriptionItem } from '@chronixjs/ui';

const Descriptions = ChronixDescriptions as unknown as VueConstructor;

const PROFILE_ITEMS: DescriptionItem[] = [
  { key: 'name', label: 'Name', value: 'Liao Yu', span: 1 },
  { key: 'email', label: 'Email', value: 'liao@chronix.dev', span: 1 },
  { key: 'role', label: 'Role', value: 'Engineer', span: 1 },
  { key: 'bio', label: 'Bio', value: 'Spans the full row.', span: 3 },
];

describe('ChronixDescriptions (vue2) — root rendering', () => {
  it('renders a <div> with the base class + size + placement modifiers', () => {
    const wrapper = mount(Descriptions, {
      propsData: { items: PROFILE_ITEMS, columns: 3 },
    });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-descriptions');
    expect(wrapper.classes()).toContain('cx-ui-descriptions--medium');
    expect(wrapper.classes()).toContain('cx-ui-descriptions--placement-left');
  });

  it('adds --bordered when bordered=true', () => {
    const wrapper = mount(Descriptions, {
      propsData: { items: PROFILE_ITEMS, bordered: true },
    });
    expect(wrapper.classes()).toContain('cx-ui-descriptions--bordered');
  });

  it('adds --placement-top when labelPlacement="top"', () => {
    const wrapper = mount(Descriptions, {
      propsData: { items: PROFILE_ITEMS, labelPlacement: 'top' },
    });
    expect(wrapper.classes()).toContain('cx-ui-descriptions--placement-top');
  });

  it('renders empty grid when items is empty', () => {
    const wrapper = mount(Descriptions);
    expect(wrapper.findAll('.cx-ui-descriptions__item')).toHaveLength(0);
  });
});

describe('ChronixDescriptions (vue2) — title', () => {
  it('renders __title with prop string', () => {
    const wrapper = mount(Descriptions, {
      propsData: { items: PROFILE_ITEMS, title: 'Profile' },
    });
    expect(wrapper.find('.cx-ui-descriptions__title').text()).toBe('Profile');
    expect(wrapper.classes()).toContain('cx-ui-descriptions--with-title');
  });

  it('omits __title when no title prop + no slot', () => {
    const wrapper = mount(Descriptions, {
      propsData: { items: PROFILE_ITEMS },
    });
    expect(wrapper.find('.cx-ui-descriptions__title').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('cx-ui-descriptions--with-title');
  });

  it('renders __title from title slot when supplied', () => {
    const wrapper = mount(Descriptions, {
      propsData: { items: PROFILE_ITEMS },
      slots: { title: '<strong>Slot title</strong>' },
    });
    expect(wrapper.find('.cx-ui-descriptions__title').text()).toBe('Slot title');
    expect(wrapper.classes()).toContain('cx-ui-descriptions--with-title');
  });
});

describe('ChronixDescriptions (vue2) — items', () => {
  it('renders one __item per DescriptionItem', () => {
    const wrapper = mount(Descriptions, {
      propsData: { items: PROFILE_ITEMS, columns: 3 },
    });
    expect(wrapper.findAll('.cx-ui-descriptions__item')).toHaveLength(PROFILE_ITEMS.length);
  });

  it('renders __label and __value text for every item', () => {
    const wrapper = mount(Descriptions, {
      propsData: { items: PROFILE_ITEMS, columns: 3 },
    });
    const labels = wrapper.findAll('.cx-ui-descriptions__label');
    const values = wrapper.findAll('.cx-ui-descriptions__value');
    expect(labels.at(0).text()).toBe('Name');
    expect(values.at(0).text()).toBe('Liao Yu');
    expect(labels.at(3).text()).toBe('Bio');
    expect(values.at(3).text()).toBe('Spans the full row.');
  });

  it('renders the __grid with grid-template-columns inline style', () => {
    const wrapper = mount(Descriptions, {
      propsData: { items: PROFILE_ITEMS, columns: 3 },
    });
    const grid = wrapper.find('.cx-ui-descriptions__grid');
    const style = grid.attributes('style') ?? '';
    expect(style).toContain('grid-template-columns');
    expect(style).toContain('repeat(3,');
  });
});

describe('ChronixDescriptions (vue2) — per-item span', () => {
  it('emits grid-column inline style for items with span > 1', () => {
    const wrapper = mount(Descriptions, {
      propsData: { items: PROFILE_ITEMS, columns: 3 },
    });
    const items = wrapper.findAll('.cx-ui-descriptions__item');
    const lastStyle = items.at(3).attributes('style') ?? '';
    expect(lastStyle).toContain('grid-column');
    expect(lastStyle).toContain('span 3');
  });

  it('omits grid-column inline style for items with span === 1', () => {
    const wrapper = mount(Descriptions, {
      propsData: { items: PROFILE_ITEMS, columns: 3 },
    });
    const items = wrapper.findAll('.cx-ui-descriptions__item');
    const firstStyle = items.at(0).attributes('style') ?? '';
    expect(firstStyle).not.toContain('grid-column');
  });

  it('omits grid-column inline style when item.span > columns (silent ignore)', () => {
    const items: DescriptionItem[] = [{ key: 'a', label: 'A', value: 'A', span: 99 }];
    const wrapper = mount(Descriptions, {
      propsData: { items, columns: 3 },
    });
    const style = wrapper.find('.cx-ui-descriptions__item').attributes('style') ?? '';
    expect(style).not.toContain('grid-column');
  });
});

describe('ChronixDescriptions (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-descriptions stylesheet is in document.head', () => {
    mount(Descriptions, { propsData: { items: PROFILE_ITEMS } });
    expect(document.head.querySelector('style[data-chronix-ui="descriptions"]')).not.toBeNull();
  });
});

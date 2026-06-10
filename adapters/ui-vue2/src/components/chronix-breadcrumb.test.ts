import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixBreadcrumb } from './chronix-breadcrumb.js';

import type { BreadcrumbItem } from '@chronixjs/ui';

const Breadcrumb = ChronixBreadcrumb as unknown as VueConstructor;

const SAMPLE_ITEMS: BreadcrumbItem[] = [
  { key: 'home', label: 'Home', href: '/', clickable: false },
  { key: 'docs', label: 'Docs', href: '/docs', clickable: false },
  { key: 'current', label: 'Phase 19', href: undefined, clickable: false },
];

describe('ChronixBreadcrumb (vue2) — root rendering', () => {
  it('renders a <nav> with the base class + aria-label', () => {
    const wrapper = mount(Breadcrumb, { propsData: { items: SAMPLE_ITEMS } });
    expect(wrapper.element.tagName).toBe('NAV');
    expect(wrapper.classes()).toContain('cx-ui-breadcrumb');
    expect(wrapper.attributes('aria-label')).toBe('Breadcrumb');
  });

  it('renders empty <nav> when items is empty', () => {
    const wrapper = mount(Breadcrumb);
    expect(wrapper.findAll('.cx-ui-breadcrumb__item')).toHaveLength(0);
  });
});

describe('ChronixBreadcrumb (vue2) — items rendering', () => {
  it('renders one element per item', () => {
    const wrapper = mount(Breadcrumb, { propsData: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-breadcrumb__item')).toHaveLength(SAMPLE_ITEMS.length);
  });

  it('renders <a href=...> when item has href', () => {
    const wrapper = mount(Breadcrumb, { propsData: { items: SAMPLE_ITEMS } });
    const homeItem = wrapper.findAll('.cx-ui-breadcrumb__item').at(0);
    expect(homeItem.element.tagName).toBe('A');
    expect(homeItem.attributes('href')).toBe('/');
    expect(homeItem.classes()).toContain('cx-ui-breadcrumb__item--clickable');
  });

  it('renders <span> for non-clickable items', () => {
    const wrapper = mount(Breadcrumb, { propsData: { items: SAMPLE_ITEMS } });
    const currentItem = wrapper.findAll('.cx-ui-breadcrumb__item').at(2);
    expect(currentItem.element.tagName).toBe('SPAN');
    expect(currentItem.classes()).not.toContain('cx-ui-breadcrumb__item--clickable');
    expect(currentItem.classes()).toContain('cx-ui-breadcrumb__item--current');
  });

  it('renders <span role="link"> for clickable items without href', () => {
    const items: BreadcrumbItem[] = [
      { key: 'spa', label: 'SPA', href: undefined, clickable: true },
      { key: 'last', label: 'Last', href: undefined, clickable: false },
    ];
    const wrapper = mount(Breadcrumb, { propsData: { items } });
    const spa = wrapper.findAll('.cx-ui-breadcrumb__item').at(0);
    expect(spa.element.tagName).toBe('SPAN');
    expect(spa.attributes('role')).toBe('link');
    expect(spa.attributes('tabindex')).toBe('0');
    expect(spa.classes()).toContain('cx-ui-breadcrumb__item--clickable');
  });

  it('item label text matches', () => {
    const wrapper = mount(Breadcrumb, { propsData: { items: SAMPLE_ITEMS } });
    const items = wrapper.findAll('.cx-ui-breadcrumb__item');
    expect(items.at(0).text()).toBe('Home');
    expect(items.at(1).text()).toBe('Docs');
    expect(items.at(2).text()).toBe('Phase 19');
  });
});

describe('ChronixBreadcrumb (vue2) — separators', () => {
  it('renders items.length - 1 separators', () => {
    const wrapper = mount(Breadcrumb, { propsData: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-breadcrumb__separator')).toHaveLength(2);
  });

  it('renders 0 separators when items has only 1 entry', () => {
    const items: BreadcrumbItem[] = [
      { key: 'one', label: 'Only', href: undefined, clickable: false },
    ];
    const wrapper = mount(Breadcrumb, { propsData: { items } });
    expect(wrapper.findAll('.cx-ui-breadcrumb__separator')).toHaveLength(0);
  });

  it('separator text matches default "/"', () => {
    const wrapper = mount(Breadcrumb, { propsData: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-breadcrumb__separator').at(0).text()).toBe('/');
  });

  it('custom separator string overrides default', () => {
    const wrapper = mount(Breadcrumb, {
      propsData: { items: SAMPLE_ITEMS, separator: '>' },
    });
    expect(wrapper.findAll('.cx-ui-breadcrumb__separator').at(0).text()).toBe('>');
    expect(wrapper.classes()).toContain('cx-ui-breadcrumb--custom-separator');
  });

  it('separator slot overrides separator string and suppresses --custom-separator class', () => {
    const wrapper = mount(Breadcrumb, {
      propsData: { items: SAMPLE_ITEMS, separator: '>' },
      slots: { separator: '<svg class="custom-sep"></svg>' },
    });
    expect(wrapper.findAll('.cx-ui-breadcrumb__separator .custom-sep')).toHaveLength(2);
    expect(wrapper.classes()).not.toContain('cx-ui-breadcrumb--custom-separator');
  });
});

describe('ChronixBreadcrumb (vue2) — item-click event', () => {
  it('emits item-click for href items', async () => {
    const wrapper = mount(Breadcrumb, { propsData: { items: SAMPLE_ITEMS } });
    await wrapper.findAll('.cx-ui-breadcrumb__item').at(0).trigger('click');
    const emitted = wrapper.emitted('item-click') as BreadcrumbItem[][] | undefined;
    expect(emitted).toBeTruthy();
    expect(emitted![0]![0]!.key).toBe('home');
  });

  it('emits item-click for clickable-without-href items', async () => {
    const items: BreadcrumbItem[] = [
      { key: 'spa', label: 'SPA', href: undefined, clickable: true },
      { key: 'last', label: 'Last', href: undefined, clickable: false },
    ];
    const wrapper = mount(Breadcrumb, { propsData: { items } });
    await wrapper.findAll('.cx-ui-breadcrumb__item').at(0).trigger('click');
    const emitted = wrapper.emitted('item-click') as BreadcrumbItem[][] | undefined;
    expect(emitted).toBeTruthy();
    expect(emitted![0]![0]!.key).toBe('spa');
  });

  it('does NOT emit item-click for non-clickable items', async () => {
    const wrapper = mount(Breadcrumb, { propsData: { items: SAMPLE_ITEMS } });
    await wrapper.findAll('.cx-ui-breadcrumb__item').at(2).trigger('click');
    expect(wrapper.emitted('item-click')).toBeFalsy();
  });
});

describe('ChronixBreadcrumb (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-breadcrumb stylesheet is in document.head', () => {
    mount(Breadcrumb, { propsData: { items: SAMPLE_ITEMS } });
    expect(document.head.querySelector('style[data-chronix-ui="breadcrumb"]')).not.toBeNull();
  });
});

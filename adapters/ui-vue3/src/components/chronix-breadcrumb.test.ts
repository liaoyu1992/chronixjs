import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixBreadcrumb } from './chronix-breadcrumb.js';

import type { BreadcrumbItem } from '@chronixjs/ui';

const SAMPLE_ITEMS: BreadcrumbItem[] = [
  { key: 'home', label: 'Home', href: '/', clickable: false },
  { key: 'docs', label: 'Docs', href: '/docs', clickable: false },
  { key: 'current', label: 'Phase 19', href: undefined, clickable: false },
];

describe('ChronixBreadcrumb — root rendering', () => {
  it('renders a <nav> with the base class + aria-label', () => {
    const wrapper = mount(ChronixBreadcrumb, { props: { items: SAMPLE_ITEMS } });
    expect((wrapper.element as HTMLElement).tagName).toBe('NAV');
    expect(wrapper.classes()).toContain('cx-ui-breadcrumb');
    expect(wrapper.attributes('aria-label')).toBe('Breadcrumb');
  });

  it('renders empty <nav> when items is empty', () => {
    const wrapper = mount(ChronixBreadcrumb);
    expect(wrapper.findAll('.cx-ui-breadcrumb__item')).toHaveLength(0);
    expect(wrapper.findAll('.cx-ui-breadcrumb__separator')).toHaveLength(0);
  });
});

describe('ChronixBreadcrumb — items rendering', () => {
  it('renders one element per item', () => {
    const wrapper = mount(ChronixBreadcrumb, { props: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-breadcrumb__item')).toHaveLength(SAMPLE_ITEMS.length);
  });

  it('renders <a href=...> when item has href', () => {
    const wrapper = mount(ChronixBreadcrumb, { props: { items: SAMPLE_ITEMS } });
    const homeItem = wrapper.findAll('.cx-ui-breadcrumb__item')[0]!;
    expect(homeItem.element.tagName).toBe('A');
    expect(homeItem.attributes('href')).toBe('/');
    expect(homeItem.classes()).toContain('cx-ui-breadcrumb__item--clickable');
  });

  it('renders <span> for non-clickable items', () => {
    const wrapper = mount(ChronixBreadcrumb, { props: { items: SAMPLE_ITEMS } });
    const currentItem = wrapper.findAll('.cx-ui-breadcrumb__item')[2]!;
    expect(currentItem.element.tagName).toBe('SPAN');
    expect(currentItem.classes()).not.toContain('cx-ui-breadcrumb__item--clickable');
    expect(currentItem.classes()).toContain('cx-ui-breadcrumb__item--current');
  });

  it('renders <span role="link"> for clickable items without href', () => {
    const items: BreadcrumbItem[] = [
      { key: 'spa', label: 'SPA', href: undefined, clickable: true },
      { key: 'last', label: 'Last', href: undefined, clickable: false },
    ];
    const wrapper = mount(ChronixBreadcrumb, { props: { items } });
    const spa = wrapper.findAll('.cx-ui-breadcrumb__item')[0]!;
    expect(spa.element.tagName).toBe('SPAN');
    expect(spa.attributes('role')).toBe('link');
    expect(spa.attributes('tabindex')).toBe('0');
    expect(spa.classes()).toContain('cx-ui-breadcrumb__item--clickable');
  });

  it('item label text matches', () => {
    const wrapper = mount(ChronixBreadcrumb, { props: { items: SAMPLE_ITEMS } });
    const items = wrapper.findAll('.cx-ui-breadcrumb__item');
    expect(items[0]!.text()).toBe('Home');
    expect(items[1]!.text()).toBe('Docs');
    expect(items[2]!.text()).toBe('Phase 19');
  });
});

describe('ChronixBreadcrumb — separators', () => {
  it('renders items.length - 1 separators', () => {
    const wrapper = mount(ChronixBreadcrumb, { props: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-breadcrumb__separator')).toHaveLength(2);
  });

  it('renders 0 separators when items has only 1 entry', () => {
    const items: BreadcrumbItem[] = [
      { key: 'one', label: 'Only', href: undefined, clickable: false },
    ];
    const wrapper = mount(ChronixBreadcrumb, { props: { items } });
    expect(wrapper.findAll('.cx-ui-breadcrumb__separator')).toHaveLength(0);
  });

  it('separator text matches default "/"', () => {
    const wrapper = mount(ChronixBreadcrumb, { props: { items: SAMPLE_ITEMS } });
    expect(wrapper.findAll('.cx-ui-breadcrumb__separator')[0]!.text()).toBe('/');
  });

  it('custom separator string overrides default', () => {
    const wrapper = mount(ChronixBreadcrumb, {
      props: { items: SAMPLE_ITEMS, separator: '>' },
    });
    expect(wrapper.findAll('.cx-ui-breadcrumb__separator')[0]!.text()).toBe('>');
    expect(wrapper.classes()).toContain('cx-ui-breadcrumb--custom-separator');
  });

  it('separator slot overrides separator string and suppresses --custom-separator class', () => {
    const wrapper = mount(ChronixBreadcrumb, {
      props: { items: SAMPLE_ITEMS, separator: '>' },
      slots: { separator: '<svg class="custom-sep"></svg>' },
    });
    expect(wrapper.findAll('.cx-ui-breadcrumb__separator .custom-sep')).toHaveLength(2);
    expect(wrapper.classes()).not.toContain('cx-ui-breadcrumb--custom-separator');
  });
});

describe('ChronixBreadcrumb — item-click event', () => {
  it('emits item-click for href items', async () => {
    const wrapper = mount(ChronixBreadcrumb, { props: { items: SAMPLE_ITEMS } });
    const homeItem = wrapper.findAll('.cx-ui-breadcrumb__item')[0]!;
    await homeItem.trigger('click');
    const emitted = wrapper.emitted('item-click');
    expect(emitted).toBeTruthy();
    expect(emitted!.length).toBe(1);
    expect((emitted![0]![0] as BreadcrumbItem).key).toBe('home');
  });

  it('emits item-click for clickable-without-href items', async () => {
    const items: BreadcrumbItem[] = [
      { key: 'spa', label: 'SPA', href: undefined, clickable: true },
      { key: 'last', label: 'Last', href: undefined, clickable: false },
    ];
    const wrapper = mount(ChronixBreadcrumb, { props: { items } });
    const spa = wrapper.findAll('.cx-ui-breadcrumb__item')[0]!;
    await spa.trigger('click');
    const emitted = wrapper.emitted('item-click');
    expect(emitted).toBeTruthy();
    expect((emitted![0]![0] as BreadcrumbItem).key).toBe('spa');
  });

  it('does NOT emit item-click for non-clickable items', async () => {
    const wrapper = mount(ChronixBreadcrumb, { props: { items: SAMPLE_ITEMS } });
    const currentItem = wrapper.findAll('.cx-ui-breadcrumb__item')[2]!;
    await currentItem.trigger('click');
    expect(wrapper.emitted('item-click')).toBeFalsy();
  });
});

describe('ChronixBreadcrumb — CSS injection', () => {
  it('mounting ensures the chronix-breadcrumb stylesheet is in document.head', () => {
    mount(ChronixBreadcrumb, { props: { items: SAMPLE_ITEMS } });
    expect(document.head.querySelector('style[data-chronix-ui="breadcrumb"]')).not.toBeNull();
  });
});

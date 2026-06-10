import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';

import { ChronixLayoutContent } from './chronix-layout-content.js';
import { ChronixLayoutFooter } from './chronix-layout-footer.js';
import { ChronixLayoutHeader } from './chronix-layout-header.js';
import { ChronixLayoutSider } from './chronix-layout-sider.js';
import { ChronixLayout } from './chronix-layout.js';

describe('ChronixLayout (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the layout container with base class', () => {
    const wrapper = mount(ChronixLayout, {
      slots: { default: () => h(ChronixLayoutContent, {}, () => 'body') },
    });
    expect((wrapper.element as HTMLElement).classList.contains('cx-ui-layout')).toBe(true);
  });

  it('auto-detects --has-sider when a ChronixLayoutSider child is present', () => {
    const Wrapper = defineComponent({
      render() {
        return h(ChronixLayout, {}, () => [
          h(ChronixLayoutSider, {}, () => 'sider'),
          h(ChronixLayoutContent, {}, () => 'body'),
        ]);
      },
    });
    const wrapper = mount(Wrapper);
    const root = wrapper.find('.cx-ui-layout');
    expect(root.classes()).toContain('cx-ui-layout--has-sider');
  });

  it('does NOT add --has-sider modifier when no sider is in the slot', () => {
    const Wrapper = defineComponent({
      render() {
        return h(ChronixLayout, {}, () => [
          h(ChronixLayoutHeader, {}, () => 'h'),
          h(ChronixLayoutContent, {}, () => 'body'),
          h(ChronixLayoutFooter, {}, () => 'f'),
        ]);
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-layout--has-sider').exists()).toBe(false);
  });

  it('respects explicit hasSider prop override', () => {
    const wrapper = mount(ChronixLayout, {
      props: { hasSider: true },
      slots: { default: () => h(ChronixLayoutContent, {}, () => 'body') },
    });
    expect((wrapper.element as HTMLElement).classList.contains('cx-ui-layout--has-sider')).toBe(
      true,
    );
  });

  it('injects the chronix-layout stylesheet', () => {
    mount(ChronixLayout, { slots: { default: () => 'x' } });
    expect(document.head.querySelector('style[data-chronix-ui="layout"]')).not.toBeNull();
  });
});

describe('ChronixLayoutSider (vue3)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a sider with width inline style', () => {
    const wrapper = mount(ChronixLayoutSider, { props: { width: 240 } });
    expect((wrapper.element as HTMLElement).style.width).toBe('240px');
    expect((wrapper.element as HTMLElement).classList.contains('cx-ui-layout__sider')).toBe(true);
  });

  it('switches to collapsedWidth when collapsed', () => {
    const wrapper = mount(ChronixLayoutSider, {
      props: { width: 200, collapsedWidth: 64, collapsed: true },
    });
    expect((wrapper.element as HTMLElement).style.width).toBe('64px');
    expect(
      (wrapper.element as HTMLElement).classList.contains('cx-ui-layout__sider--collapsed'),
    ).toBe(true);
  });

  it('renders trigger button when collapsible=true', () => {
    const wrapper = mount(ChronixLayoutSider, { props: { collapsible: true } });
    expect(wrapper.find('.cx-ui-layout__sider-trigger').exists()).toBe(true);
  });

  it('does NOT render trigger when collapsible=false', () => {
    const wrapper = mount(ChronixLayoutSider);
    expect(wrapper.find('.cx-ui-layout__sider-trigger').exists()).toBe(false);
  });
});

describe('ChronixLayout sub-components (vue3)', () => {
  it('header / content / footer carry their respective BEM class', () => {
    const headerWrap = mount(ChronixLayoutHeader, {
      slots: { default: () => 'h' },
    });
    expect((headerWrap.element as HTMLElement).classList.contains('cx-ui-layout__header')).toBe(
      true,
    );
    const contentWrap = mount(ChronixLayoutContent, {
      slots: { default: () => 'c' },
    });
    expect((contentWrap.element as HTMLElement).classList.contains('cx-ui-layout__content')).toBe(
      true,
    );
    const footerWrap = mount(ChronixLayoutFooter, {
      slots: { default: () => 'f' },
    });
    expect((footerWrap.element as HTMLElement).classList.contains('cx-ui-layout__footer')).toBe(
      true,
    );
  });
});

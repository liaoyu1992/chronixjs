import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import Vue, { type VueConstructor } from 'vue';

import { ChronixLayoutContent } from './chronix-layout-content.js';
import { ChronixLayoutFooter } from './chronix-layout-footer.js';
import { ChronixLayoutHeader } from './chronix-layout-header.js';
import { ChronixLayoutSider } from './chronix-layout-sider.js';
import { ChronixLayout } from './chronix-layout.js';

const Layout = ChronixLayout as unknown as VueConstructor;
const Sider = ChronixLayoutSider as unknown as VueConstructor;
const Header = ChronixLayoutHeader as unknown as VueConstructor;
const Content = ChronixLayoutContent as unknown as VueConstructor;
const Footer = ChronixLayoutFooter as unknown as VueConstructor;

describe('ChronixLayout (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the layout container with base class', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(Layout, [h(Content, ['body'])]);
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-layout').exists()).toBe(true);
  });

  it('auto-detects --has-sider when a ChronixLayoutSider child is present', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(Layout, [h(Sider, ['sider']), h(Content, ['body'])]);
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-layout--has-sider').exists()).toBe(true);
  });

  it('does NOT add --has-sider modifier when no sider in slot', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(Layout, [h(Header, ['h']), h(Content, ['body']), h(Footer, ['f'])]);
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-layout--has-sider').exists()).toBe(false);
  });

  it('injects the chronix-layout stylesheet', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(Layout, [h(Content, ['x'])]);
      },
    });
    mount(Wrapper);
    expect(document.head.querySelector('style[data-chronix-ui="layout"]')).not.toBeNull();
  });
});

describe('ChronixLayoutSider (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders sider with width inline style', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(Sider, { props: { width: 240 } });
      },
    });
    const wrapper = mount(Wrapper);
    const aside = wrapper.find('.cx-ui-layout__sider');
    expect((aside.element as HTMLElement).style.width).toBe('240px');
  });

  it('switches to collapsedWidth when collapsed', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(Sider, { props: { collapsed: true, width: 200, collapsedWidth: 64 } });
      },
    });
    const wrapper = mount(Wrapper);
    const aside = wrapper.find('.cx-ui-layout__sider');
    expect((aside.element as HTMLElement).style.width).toBe('64px');
    expect(aside.classes()).toContain('cx-ui-layout__sider--collapsed');
  });

  it('renders trigger button when collapsible=true', () => {
    const Wrapper = Vue.extend({
      render(h) {
        return h(Sider, { props: { collapsible: true } });
      },
    });
    const wrapper = mount(Wrapper);
    expect(wrapper.find('.cx-ui-layout__sider-trigger').exists()).toBe(true);
  });
});

describe('ChronixLayout sub-components (vue2)', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('header / content / footer carry their respective BEM class', () => {
    const HWrap = Vue.extend({
      render(h) {
        return h(Header, ['h']);
      },
    });
    const CWrap = Vue.extend({
      render(h) {
        return h(Content, ['c']);
      },
    });
    const FWrap = Vue.extend({
      render(h) {
        return h(Footer, ['f']);
      },
    });
    expect(mount(HWrap).find('.cx-ui-layout__header').exists()).toBe(true);
    expect(mount(CWrap).find('.cx-ui-layout__content').exists()).toBe(true);
    expect(mount(FWrap).find('.cx-ui-layout__footer').exists()).toBe(true);
  });
});

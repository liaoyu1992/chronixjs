import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixThing } from './chronix-thing.js';

describe('ChronixThing — root rendering', () => {
  it('renders a <div> with only the base class when no slots/props supplied', () => {
    const wrapper = mount(ChronixThing);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toEqual(['cx-ui-thing']);
  });

  it('renders the __main container even when no slots resolve to content', () => {
    const wrapper = mount(ChronixThing);
    expect(wrapper.find('.cx-ui-thing__main').exists()).toBe(true);
  });
});

describe('ChronixThing — string-prop driven header / description', () => {
  it('adds --with-header + __header-content text from title prop', () => {
    const wrapper = mount(ChronixThing, { props: { title: 'Project A' } });
    expect(wrapper.classes()).toContain('cx-ui-thing--with-header');
    expect(wrapper.find('.cx-ui-thing__header-content').text()).toBe('Project A');
  });

  it('adds --with-description + __description text from description prop', () => {
    const wrapper = mount(ChronixThing, {
      props: { description: 'Sub-text' },
    });
    expect(wrapper.classes()).toContain('cx-ui-thing--with-description');
    expect(wrapper.find('.cx-ui-thing__description').text()).toBe('Sub-text');
  });

  it('omits header/description elements when neither prop nor slot provided', () => {
    const wrapper = mount(ChronixThing);
    expect(wrapper.find('.cx-ui-thing__header').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-thing__description').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('cx-ui-thing--with-header');
    expect(wrapper.classes()).not.toContain('cx-ui-thing--with-description');
  });
});

describe('ChronixThing — slot driven sections', () => {
  it('adds --with-avatar + __avatar element when avatar slot is provided', () => {
    const wrapper = mount(ChronixThing, {
      slots: { avatar: '<div class="my-avatar">A</div>' },
    });
    expect(wrapper.classes()).toContain('cx-ui-thing--with-avatar');
    expect(wrapper.find('.cx-ui-thing__avatar .my-avatar').exists()).toBe(true);
  });

  it('adds --with-header-extra + __header-extra element when header-extra slot is provided', () => {
    const wrapper = mount(ChronixThing, {
      props: { title: 'Heading' },
      slots: { 'header-extra': '<span class="ext">extra</span>' },
    });
    expect(wrapper.classes()).toContain('cx-ui-thing--with-header-extra');
    expect(wrapper.find('.cx-ui-thing__header-extra .ext').exists()).toBe(true);
  });

  it('adds --with-content + __content element when default slot is provided', () => {
    const wrapper = mount(ChronixThing, {
      slots: { default: '<p class="body">body</p>' },
    });
    expect(wrapper.classes()).toContain('cx-ui-thing--with-content');
    expect(wrapper.find('.cx-ui-thing__content .body').exists()).toBe(true);
  });

  it('adds --with-action + __action element when action slot is provided', () => {
    const wrapper = mount(ChronixThing, {
      slots: { action: '<button class="ok">OK</button>' },
    });
    expect(wrapper.classes()).toContain('cx-ui-thing--with-action');
    expect(wrapper.find('.cx-ui-thing__action .ok').exists()).toBe(true);
  });

  it('adds --with-footer + __footer element when footer slot is provided', () => {
    const wrapper = mount(ChronixThing, {
      slots: { footer: '<small class="foot">foot</small>' },
    });
    expect(wrapper.classes()).toContain('cx-ui-thing--with-footer');
    expect(wrapper.find('.cx-ui-thing__footer .foot').exists()).toBe(true);
  });

  it('overrides title with header slot content when both supplied', () => {
    const wrapper = mount(ChronixThing, {
      props: { title: 'Prop title' },
      slots: { header: '<span class="rich">Rich heading</span>' },
    });
    expect(wrapper.find('.cx-ui-thing__header-content .rich').exists()).toBe(true);
    expect(wrapper.find('.cx-ui-thing__header-content').text()).toBe('Rich heading');
  });
});

describe('ChronixThing — content-indented modifier', () => {
  it('adds --content-indented modifier when contentIndented=true', () => {
    const wrapper = mount(ChronixThing, {
      props: { contentIndented: true, title: 'A' },
    });
    expect(wrapper.classes()).toContain('cx-ui-thing--content-indented');
  });

  it('omits --content-indented modifier when contentIndented=false', () => {
    const wrapper = mount(ChronixThing, { props: { title: 'A' } });
    expect(wrapper.classes()).not.toContain('cx-ui-thing--content-indented');
  });
});

describe('ChronixThing — CSS injection', () => {
  it('mounting ensures the chronix-thing stylesheet is in document.head', () => {
    mount(ChronixThing);
    expect(document.head.querySelector('style[data-chronix-ui="thing"]')).not.toBeNull();
  });
});

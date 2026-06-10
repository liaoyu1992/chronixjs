import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixPageHeader } from './chronix-page-header.js';

describe('ChronixPageHeader — default rendering', () => {
  it('renders a <div> with the base class', () => {
    const wrapper = mount(ChronixPageHeader);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-page-header');
  });

  it('omits __title / __subtitle / __back-button / __extra / __footer / __content by default', () => {
    const wrapper = mount(ChronixPageHeader);
    expect(wrapper.find('.cx-ui-page-header__title').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-page-header__subtitle').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-page-header__back-button').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-page-header__extra').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-page-header__footer').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-page-header__content').exists()).toBe(false);
  });
});

describe('ChronixPageHeader — title / subtitle props', () => {
  it('renders __title + --with-title when title prop is supplied', () => {
    const wrapper = mount(ChronixPageHeader, { props: { title: 'Project A' } });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-title');
    expect(wrapper.find('.cx-ui-page-header__title').text()).toBe('Project A');
  });

  it('renders __subtitle + --with-subtitle when subtitle prop is supplied', () => {
    const wrapper = mount(ChronixPageHeader, { props: { subtitle: 'Owned by you' } });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-subtitle');
    expect(wrapper.find('.cx-ui-page-header__subtitle').text()).toBe('Owned by you');
  });

  it('title slot overrides title prop', () => {
    const wrapper = mount(ChronixPageHeader, {
      props: { title: 'Plain' },
      slots: { title: '<span class="rich">Rich title</span>' },
    });
    expect(wrapper.find('.cx-ui-page-header__title .rich').text()).toBe('Rich title');
    expect(wrapper.find('.cx-ui-page-header__title').text()).not.toBe('Plain');
  });

  it('subtitle slot overrides subtitle prop', () => {
    const wrapper = mount(ChronixPageHeader, {
      props: { subtitle: 'Plain' },
      slots: { subtitle: '<span class="rich">Rich</span>' },
    });
    expect(wrapper.find('.cx-ui-page-header__subtitle .rich').exists()).toBe(true);
  });
});

describe('ChronixPageHeader — back affordance', () => {
  it('renders __back-button + --with-back when back=true', () => {
    const wrapper = mount(ChronixPageHeader, { props: { back: true } });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-back');
    const button = wrapper.find('.cx-ui-page-header__back-button');
    expect(button.exists()).toBe(true);
    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-label')).toBe('Back');
    expect(button.text()).toBe('←');
  });

  it('emits "back" event when the back button is clicked', async () => {
    const wrapper = mount(ChronixPageHeader, { props: { back: true } });
    await wrapper.find('.cx-ui-page-header__back-button').trigger('click');
    expect(wrapper.emitted('back')).toBeTruthy();
    expect(wrapper.emitted('back')!.length).toBe(1);
  });

  it('back slot overrides the unicode placeholder', () => {
    const wrapper = mount(ChronixPageHeader, {
      props: { back: true },
      slots: { back: '<span class="custom-back">⟵</span>' },
    });
    expect(wrapper.find('.cx-ui-page-header__back-button .custom-back').text()).toBe('⟵');
  });
});

describe('ChronixPageHeader — avatar / extra / footer / default slots', () => {
  it('renders __avatar + --with-avatar when avatar slot has content', () => {
    const wrapper = mount(ChronixPageHeader, {
      slots: { avatar: '<img class="ava" alt="" />' },
    });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-avatar');
    expect(wrapper.find('.cx-ui-page-header__avatar .ava').exists()).toBe(true);
  });

  it('renders __extra + --with-extra when extra slot has content', () => {
    const wrapper = mount(ChronixPageHeader, {
      slots: { extra: '<button class="act">Save</button>' },
    });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-extra');
    expect(wrapper.find('.cx-ui-page-header__extra .act').text()).toBe('Save');
  });

  it('renders __footer + --with-footer when footer slot has content', () => {
    const wrapper = mount(ChronixPageHeader, {
      slots: { footer: 'Tabs row' },
    });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-footer');
    expect(wrapper.find('.cx-ui-page-header__footer').text()).toBe('Tabs row');
  });

  it('renders __content + --with-content when default slot has content', () => {
    const wrapper = mount(ChronixPageHeader, {
      slots: { default: 'Body' },
    });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-content');
    expect(wrapper.find('.cx-ui-page-header__content').text()).toBe('Body');
  });
});

describe('ChronixPageHeader — inverted modifier', () => {
  it('applies --inverted class when inverted=true', () => {
    const wrapper = mount(ChronixPageHeader, { props: { inverted: true } });
    expect(wrapper.classes()).toContain('cx-ui-page-header--inverted');
  });
});

describe('ChronixPageHeader — CSS injection', () => {
  it('mounting ensures the chronix-page-header stylesheet is in document.head', () => {
    mount(ChronixPageHeader);
    expect(document.head.querySelector('style[data-chronix-ui="page-header"]')).not.toBeNull();
  });
});

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixPageHeader } from './chronix-page-header.js';

const PageHeader = ChronixPageHeader as unknown as VueConstructor;

describe('ChronixPageHeader (vue2) — default rendering', () => {
  it('renders a <div> with the base class', () => {
    const wrapper = mount(PageHeader);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-page-header');
  });

  it('omits __title / __subtitle / __back-button / __extra / __footer / __content by default', () => {
    const wrapper = mount(PageHeader);
    expect(wrapper.find('.cx-ui-page-header__title').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-page-header__subtitle').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-page-header__back-button').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-page-header__extra').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-page-header__footer').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-page-header__content').exists()).toBe(false);
  });
});

describe('ChronixPageHeader (vue2) — title / subtitle props', () => {
  it('renders __title + --with-title when title prop is supplied', () => {
    const wrapper = mount(PageHeader, { propsData: { title: 'Project A' } });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-title');
    expect(wrapper.find('.cx-ui-page-header__title').text()).toBe('Project A');
  });

  it('renders __subtitle + --with-subtitle when subtitle prop is supplied', () => {
    const wrapper = mount(PageHeader, { propsData: { subtitle: 'Owned by you' } });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-subtitle');
    expect(wrapper.find('.cx-ui-page-header__subtitle').text()).toBe('Owned by you');
  });

  it('title slot overrides title prop', () => {
    const wrapper = mount(PageHeader, {
      propsData: { title: 'Plain' },
      slots: { title: '<span class="rich">Rich title</span>' },
    });
    expect(wrapper.find('.cx-ui-page-header__title .rich').text()).toBe('Rich title');
  });

  it('subtitle slot overrides subtitle prop', () => {
    const wrapper = mount(PageHeader, {
      propsData: { subtitle: 'Plain' },
      slots: { subtitle: '<span class="rich">Rich</span>' },
    });
    expect(wrapper.find('.cx-ui-page-header__subtitle .rich').exists()).toBe(true);
  });
});

describe('ChronixPageHeader (vue2) — back affordance', () => {
  it('renders __back-button + --with-back when back=true', () => {
    const wrapper = mount(PageHeader, { propsData: { back: true } });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-back');
    const button = wrapper.find('.cx-ui-page-header__back-button');
    expect(button.exists()).toBe(true);
    expect(button.attributes('type')).toBe('button');
    expect(button.attributes('aria-label')).toBe('Back');
    expect(button.text()).toBe('←');
  });

  it('emits "back" event when the back button is clicked', async () => {
    const wrapper = mount(PageHeader, { propsData: { back: true } });
    await wrapper.find('.cx-ui-page-header__back-button').trigger('click');
    expect(wrapper.emitted('back')).toBeTruthy();
    expect(wrapper.emitted('back')!.length).toBe(1);
  });

  it('back slot overrides the unicode placeholder', () => {
    const wrapper = mount(PageHeader, {
      propsData: { back: true },
      slots: { back: '<span class="custom-back">⟵</span>' },
    });
    expect(wrapper.find('.cx-ui-page-header__back-button .custom-back').text()).toBe('⟵');
  });
});

describe('ChronixPageHeader (vue2) — avatar / extra / footer / default slots', () => {
  it('renders __avatar + --with-avatar when avatar slot has content', () => {
    const wrapper = mount(PageHeader, {
      slots: { avatar: '<img class="ava" alt="" />' },
    });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-avatar');
    expect(wrapper.find('.cx-ui-page-header__avatar .ava').exists()).toBe(true);
  });

  it('renders __extra + --with-extra when extra slot has content', () => {
    const wrapper = mount(PageHeader, {
      slots: { extra: '<button class="act">Save</button>' },
    });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-extra');
    expect(wrapper.find('.cx-ui-page-header__extra .act').text()).toBe('Save');
  });

  it('renders __footer + --with-footer when footer slot has content', () => {
    const wrapper = mount(PageHeader, { slots: { footer: 'Tabs row' } });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-footer');
    expect(wrapper.find('.cx-ui-page-header__footer').text()).toBe('Tabs row');
  });

  it('renders __content + --with-content when default slot has content', () => {
    const wrapper = mount(PageHeader, { slots: { default: 'Body' } });
    expect(wrapper.classes()).toContain('cx-ui-page-header--with-content');
    expect(wrapper.find('.cx-ui-page-header__content').text()).toBe('Body');
  });
});

describe('ChronixPageHeader (vue2) — inverted modifier', () => {
  it('applies --inverted class when inverted=true', () => {
    const wrapper = mount(PageHeader, { propsData: { inverted: true } });
    expect(wrapper.classes()).toContain('cx-ui-page-header--inverted');
  });
});

describe('ChronixPageHeader (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-page-header stylesheet is in document.head', () => {
    mount(PageHeader);
    expect(document.head.querySelector('style[data-chronix-ui="page-header"]')).not.toBeNull();
  });
});

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixEmpty } from './chronix-empty.js';

const Empty = ChronixEmpty as unknown as VueConstructor;

describe('ChronixEmpty (vue2) — default rendering', () => {
  it('renders a <div> with base + medium + with-description', () => {
    const wrapper = mount(Empty);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-empty');
    expect(wrapper.classes()).toContain('cx-ui-empty--medium');
    expect(wrapper.classes()).toContain('cx-ui-empty--with-description');
  });

  it('renders __icon + __description with default text', () => {
    const wrapper = mount(Empty);
    expect(wrapper.find('.cx-ui-empty__icon').exists()).toBe(true);
    expect(wrapper.find('.cx-ui-empty__description').text()).toBe('No data');
  });

  it('description prop overrides the default text', () => {
    const wrapper = mount(Empty, { propsData: { description: 'Nothing yet' } });
    expect(wrapper.find('.cx-ui-empty__description').text()).toBe('Nothing yet');
  });
});

describe('ChronixEmpty (vue2) — extra slot', () => {
  it('renders __extra and adds --with-extra when default slot has content', () => {
    const wrapper = mount(Empty, { slots: { default: 'Try again' } });
    expect(wrapper.classes()).toContain('cx-ui-empty--with-extra');
    expect(wrapper.find('.cx-ui-empty__extra').text()).toBe('Try again');
  });

  it('omits __extra and --with-extra when default slot is empty', () => {
    const wrapper = mount(Empty);
    expect(wrapper.classes()).not.toContain('cx-ui-empty--with-extra');
    expect(wrapper.find('.cx-ui-empty__extra').exists()).toBe(false);
  });
});

describe('ChronixEmpty (vue2) — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)('size="%s" adds the matching modifier', (s) => {
    const wrapper = mount(Empty, { propsData: { size: s } });
    expect(wrapper.classes()).toContain(`cx-ui-empty--${s}`);
  });
});

describe('ChronixEmpty (vue2) — CSS injection', () => {
  it('mounting an empty ensures the chronix-empty stylesheet is in document.head', () => {
    mount(Empty);
    expect(document.head.querySelector('style[data-chronix-ui="empty"]')).not.toBeNull();
  });
});

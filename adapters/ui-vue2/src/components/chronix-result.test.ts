import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixResult } from './chronix-result.js';

const Result = ChronixResult as unknown as VueConstructor;

describe('ChronixResult (vue2) — default rendering', () => {
  it('renders a <div> with base + status-info', () => {
    const wrapper = mount(Result);
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-result');
    expect(wrapper.classes()).toContain('cx-ui-result--status-info');
  });

  it('renders __icon with the default-status unicode placeholder', () => {
    const wrapper = mount(Result);
    const icon = wrapper.find('.cx-ui-result__icon');
    expect(icon.exists()).toBe(true);
    expect(icon.attributes('aria-hidden')).toBe('true');
    expect(icon.text()).toBe('ℹ️');
  });

  it('omits __title and __description by default', () => {
    const wrapper = mount(Result);
    expect(wrapper.find('.cx-ui-result__title').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-result__description').exists()).toBe(false);
  });
});

describe('ChronixResult (vue2) — status prop', () => {
  it.each([
    ['default', '📋'],
    ['info', 'ℹ️'],
    ['success', '✅'],
    ['warning', '⚠️'],
    ['error', '❌'],
    ['404', '🔍'],
    ['403', '🔒'],
    ['500', '💥'],
    ['418', '☕'],
  ] as const)('status="%s" applies the matching modifier + icon', (status, expectedIcon) => {
    const wrapper = mount(Result, { propsData: { status } });
    expect(wrapper.classes()).toContain(`cx-ui-result--status-${status}`);
    expect(wrapper.find('.cx-ui-result__icon').text()).toBe(expectedIcon);
  });
});

describe('ChronixResult (vue2) — title / description / extra', () => {
  it('renders __title + --with-title when title is supplied', () => {
    const wrapper = mount(Result, { propsData: { title: 'All set' } });
    expect(wrapper.classes()).toContain('cx-ui-result--with-title');
    expect(wrapper.find('.cx-ui-result__title').text()).toBe('All set');
  });

  it('renders __description + --with-description when description is supplied', () => {
    const wrapper = mount(Result, { propsData: { description: 'You can close.' } });
    expect(wrapper.classes()).toContain('cx-ui-result--with-description');
    expect(wrapper.find('.cx-ui-result__description').text()).toBe('You can close.');
  });

  it('renders __extra + --with-extra when default slot has content', () => {
    const wrapper = mount(Result, { slots: { default: 'Continue' } });
    expect(wrapper.classes()).toContain('cx-ui-result--with-extra');
    expect(wrapper.find('.cx-ui-result__extra').text()).toBe('Continue');
  });
});

describe('ChronixResult (vue2) — CSS injection', () => {
  it('mounting ensures the chronix-result stylesheet is in document.head', () => {
    mount(Result);
    expect(document.head.querySelector('style[data-chronix-ui="result"]')).not.toBeNull();
  });
});

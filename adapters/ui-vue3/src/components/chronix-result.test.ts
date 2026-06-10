import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixResult } from './chronix-result.js';

describe('ChronixResult — default rendering', () => {
  it('renders a <div> with base + status-info classes', () => {
    const wrapper = mount(ChronixResult);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-result');
    expect(wrapper.classes()).toContain('cx-ui-result--status-info');
  });

  it('renders __icon with the default-status unicode placeholder', () => {
    const wrapper = mount(ChronixResult);
    const icon = wrapper.find('.cx-ui-result__icon');
    expect(icon.exists()).toBe(true);
    expect(icon.attributes('aria-hidden')).toBe('true');
    expect(icon.text()).toBe('ℹ️');
  });

  it('omits __title and __description by default (undefined)', () => {
    const wrapper = mount(ChronixResult);
    expect(wrapper.find('.cx-ui-result__title').exists()).toBe(false);
    expect(wrapper.find('.cx-ui-result__description').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('cx-ui-result--with-title');
    expect(wrapper.classes()).not.toContain('cx-ui-result--with-description');
  });
});

describe('ChronixResult — status prop', () => {
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
    const wrapper = mount(ChronixResult, { props: { status } });
    expect(wrapper.classes()).toContain(`cx-ui-result--status-${status}`);
    expect(wrapper.find('.cx-ui-result__icon').text()).toBe(expectedIcon);
  });
});

describe('ChronixResult — title / description / extra', () => {
  it('renders __title + --with-title when title is supplied', () => {
    const wrapper = mount(ChronixResult, { props: { title: 'All set' } });
    expect(wrapper.classes()).toContain('cx-ui-result--with-title');
    expect(wrapper.find('.cx-ui-result__title').text()).toBe('All set');
  });

  it('renders __description + --with-description when description is supplied', () => {
    const wrapper = mount(ChronixResult, { props: { description: 'You can close this tab.' } });
    expect(wrapper.classes()).toContain('cx-ui-result--with-description');
    expect(wrapper.find('.cx-ui-result__description').text()).toBe('You can close this tab.');
  });

  it('renders __extra + --with-extra when default slot has content', () => {
    const wrapper = mount(ChronixResult, { slots: { default: 'Continue' } });
    expect(wrapper.classes()).toContain('cx-ui-result--with-extra');
    expect(wrapper.find('.cx-ui-result__extra').text()).toBe('Continue');
  });

  it('icon slot overrides the default unicode character', () => {
    const wrapper = mount(ChronixResult, { slots: { icon: '<span class="custom">★</span>' } });
    expect(wrapper.find('.cx-ui-result__icon .custom').text()).toBe('★');
  });
});

describe('ChronixResult — CSS injection', () => {
  it('mounting ensures the chronix-result stylesheet is in document.head', () => {
    mount(ChronixResult);
    expect(document.head.querySelector('style[data-chronix-ui="result"]')).not.toBeNull();
  });
});

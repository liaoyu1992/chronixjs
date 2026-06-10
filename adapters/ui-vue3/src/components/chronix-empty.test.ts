import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixEmpty } from './chronix-empty.js';

/**
 * Phase 15 (2026-06-02) — Empty mount tests (vue3).
 */

describe('ChronixEmpty — default rendering', () => {
  it('renders a <div> with base + medium + with-description', () => {
    const wrapper = mount(ChronixEmpty);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-empty');
    expect(wrapper.classes()).toContain('cx-ui-empty--medium');
    expect(wrapper.classes()).toContain('cx-ui-empty--with-description');
  });

  it('renders __icon + __description with default text', () => {
    const wrapper = mount(ChronixEmpty);
    expect(wrapper.find('.cx-ui-empty__icon').exists()).toBe(true);
    expect(wrapper.find('.cx-ui-empty__description').text()).toBe('No data');
  });

  // Description=undefined opt-out is verified at the core
  // `resolveEmptyClassList` level (pure-fn test). Re-asserting it at
  // the Vue adapter level isn't possible because Vue's prop machinery
  // substitutes the declared default ('No data') when consumers
  // explicitly pass `undefined`. Custom descriptions DO work — covered
  // below.
  it('description prop overrides the default text', () => {
    const wrapper = mount(ChronixEmpty, { props: { description: 'Nothing yet' } });
    expect(wrapper.find('.cx-ui-empty__description').text()).toBe('Nothing yet');
  });
});

describe('ChronixEmpty — extra slot', () => {
  it('renders __extra and adds --with-extra when default slot has content', () => {
    const wrapper = mount(ChronixEmpty, { slots: { default: 'Try again' } });
    expect(wrapper.classes()).toContain('cx-ui-empty--with-extra');
    expect(wrapper.find('.cx-ui-empty__extra').text()).toBe('Try again');
  });

  it('omits __extra and --with-extra when default slot is empty', () => {
    const wrapper = mount(ChronixEmpty);
    expect(wrapper.classes()).not.toContain('cx-ui-empty--with-extra');
    expect(wrapper.find('.cx-ui-empty__extra').exists()).toBe(false);
  });
});

describe('ChronixEmpty — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)('size="%s" adds the matching modifier', (s) => {
    const wrapper = mount(ChronixEmpty, { props: { size: s } });
    expect(wrapper.classes()).toContain(`cx-ui-empty--${s}`);
  });
});

describe('ChronixEmpty — CSS injection', () => {
  it('mounting an empty ensures the chronix-empty stylesheet is in document.head', () => {
    mount(ChronixEmpty);
    expect(document.head.querySelector('style[data-chronix-ui="empty"]')).not.toBeNull();
  });
});

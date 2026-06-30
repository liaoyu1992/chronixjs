import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixAlert } from './chronix-alert.js';

/**
 * — Alert mount tests (vue3).
 */

describe('ChronixAlert — default rendering', () => {
  it('renders a <div role="alert"> with base + default + bordered classes', () => {
    const wrapper = mount(ChronixAlert, { slots: { default: 'Body' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.classes()).toContain('cx-ui-alert');
    expect(wrapper.classes()).toContain('cx-ui-alert--default');
    expect(wrapper.classes()).toContain('cx-ui-alert--bordered');
  });

  it('renders default slot inside __content', () => {
    const wrapper = mount(ChronixAlert, { slots: { default: 'Hello' } });
    expect(wrapper.find('.cx-ui-alert__content').text()).toBe('Hello');
  });

  it('omits __content when no default slot supplied', () => {
    const wrapper = mount(ChronixAlert);
    expect(wrapper.find('.cx-ui-alert__content').exists()).toBe(false);
  });
});

describe('ChronixAlert — type prop', () => {
  it.each(['default', 'info', 'success', 'warning', 'error'] as const)(
    'type="%s" adds the matching modifier',
    (t) => {
      const wrapper = mount(ChronixAlert, { props: { type: t } });
      expect(wrapper.classes()).toContain(`cx-ui-alert--${t}`);
    },
  );
});

describe('ChronixAlert — title prop', () => {
  it('renders __title when title is set', () => {
    const wrapper = mount(ChronixAlert, { props: { title: 'Heads up' } });
    expect(wrapper.classes()).toContain('cx-ui-alert--with-title');
    expect(wrapper.find('.cx-ui-alert__title').text()).toBe('Heads up');
  });

  it('omits __title when title is undefined', () => {
    const wrapper = mount(ChronixAlert);
    expect(wrapper.classes()).not.toContain('cx-ui-alert--with-title');
    expect(wrapper.find('.cx-ui-alert__title').exists()).toBe(false);
  });
});

describe('ChronixAlert — closable prop + close event', () => {
  it('closable=true renders __close button + emits close on click', async () => {
    const wrapper = mount(ChronixAlert, { props: { closable: true } });
    expect(wrapper.classes()).toContain('cx-ui-alert--closable');
    const close = wrapper.find('.cx-ui-alert__close');
    expect(close.exists()).toBe(true);
    await close.trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('closable=false (default) omits the close button', () => {
    const wrapper = mount(ChronixAlert);
    expect(wrapper.find('.cx-ui-alert__close').exists()).toBe(false);
  });
});

describe('ChronixAlert — bordered prop', () => {
  it('bordered=false removes --bordered modifier', () => {
    const wrapper = mount(ChronixAlert, { props: { bordered: false } });
    expect(wrapper.classes()).not.toContain('cx-ui-alert--bordered');
  });
});

describe('ChronixAlert — CSS injection', () => {
  it('mounting an alert ensures the chronix-alert stylesheet is in document.head', () => {
    mount(ChronixAlert);
    expect(document.head.querySelector('style[data-chronix-ui="alert"]')).not.toBeNull();
  });
});

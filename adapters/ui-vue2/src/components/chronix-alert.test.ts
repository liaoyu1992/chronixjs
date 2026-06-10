import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { type VueConstructor } from 'vue';

import { ChronixAlert } from './chronix-alert.js';

const Alert = ChronixAlert as unknown as VueConstructor;

describe('ChronixAlert (vue2) — default rendering', () => {
  it('renders a <div role="alert"> with base + default + bordered classes', () => {
    const wrapper = mount(Alert, { slots: { default: 'Body' } });
    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.attributes('role')).toBe('alert');
    expect(wrapper.classes()).toContain('cx-ui-alert');
    expect(wrapper.classes()).toContain('cx-ui-alert--default');
    expect(wrapper.classes()).toContain('cx-ui-alert--bordered');
  });

  it('renders default slot inside __content', () => {
    const wrapper = mount(Alert, { slots: { default: 'Hello' } });
    expect(wrapper.find('.cx-ui-alert__content').text()).toBe('Hello');
  });

  it('omits __content when no default slot supplied', () => {
    const wrapper = mount(Alert);
    expect(wrapper.find('.cx-ui-alert__content').exists()).toBe(false);
  });
});

describe('ChronixAlert (vue2) — type prop', () => {
  it.each(['default', 'info', 'success', 'warning', 'error'] as const)(
    'type="%s" adds the matching modifier',
    (t) => {
      const wrapper = mount(Alert, { propsData: { type: t } });
      expect(wrapper.classes()).toContain(`cx-ui-alert--${t}`);
    },
  );
});

describe('ChronixAlert (vue2) — title prop', () => {
  it('renders __title when title is set', () => {
    const wrapper = mount(Alert, { propsData: { title: 'Heads up' } });
    expect(wrapper.classes()).toContain('cx-ui-alert--with-title');
    expect(wrapper.find('.cx-ui-alert__title').text()).toBe('Heads up');
  });

  it('omits __title when title is undefined', () => {
    const wrapper = mount(Alert);
    expect(wrapper.classes()).not.toContain('cx-ui-alert--with-title');
    expect(wrapper.find('.cx-ui-alert__title').exists()).toBe(false);
  });
});

describe('ChronixAlert (vue2) — closable prop + close event', () => {
  it('closable=true renders __close button + emits close on click', async () => {
    const wrapper = mount(Alert, { propsData: { closable: true } });
    expect(wrapper.classes()).toContain('cx-ui-alert--closable');
    const close = wrapper.find('.cx-ui-alert__close');
    expect(close.exists()).toBe(true);
    await close.trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('closable=false (default) omits the close button', () => {
    const wrapper = mount(Alert);
    expect(wrapper.find('.cx-ui-alert__close').exists()).toBe(false);
  });
});

describe('ChronixAlert (vue2) — bordered prop', () => {
  it('bordered=false removes --bordered modifier', () => {
    const wrapper = mount(Alert, { propsData: { bordered: false } });
    expect(wrapper.classes()).not.toContain('cx-ui-alert--bordered');
  });
});

describe('ChronixAlert (vue2) — CSS injection', () => {
  it('mounting an alert ensures the chronix-alert stylesheet is in document.head', () => {
    mount(Alert);
    expect(document.head.querySelector('style[data-chronix-ui="alert"]')).not.toBeNull();
  });
});

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import { ChronixBadge } from './chronix-badge.js';

/**
 * Phase 14 (2026-06-02) — Badge mount tests (vue3). Covers the
 * "wrap-a-child" pattern + standalone mode + dot / processing / show
 * modifiers + numeric truncation.
 */

describe('ChronixBadge — standalone mode (no child)', () => {
  it('renders root + __sup with --standalone modifier when no slot is supplied', () => {
    const wrapper = mount(ChronixBadge, { props: { value: 5 } });
    const root = wrapper.find('.cx-ui-badge');
    expect(root.element.tagName).toBe('SPAN');
    expect(root.classes()).toContain('cx-ui-badge--standalone');
    const sup = wrapper.find('.cx-ui-badge__sup');
    expect(sup.exists()).toBe(true);
    expect(sup.text()).toBe('5');
  });
});

describe('ChronixBadge — wrapped mode (child slot)', () => {
  it('renders the slot content + __sup overlay, NO --standalone modifier', () => {
    const wrapper = mount(ChronixBadge, {
      props: { value: 3 },
      slots: { default: () => h('span', { class: 'avatar' }, 'A') },
    });
    expect(wrapper.find('.cx-ui-badge').classes()).not.toContain('cx-ui-badge--standalone');
    expect(wrapper.find('.avatar').exists()).toBe(true);
    expect(wrapper.find('.cx-ui-badge__sup').text()).toBe('3');
  });
});

describe('ChronixBadge — value + max truncation', () => {
  it('renders numeric value verbatim when below max', () => {
    const wrapper = mount(ChronixBadge, { props: { value: 5, max: 99 } });
    expect(wrapper.find('.cx-ui-badge__sup').text()).toBe('5');
  });

  it('truncates numeric value above max to `${max}+`', () => {
    const wrapper = mount(ChronixBadge, { props: { value: 999, max: 99 } });
    expect(wrapper.find('.cx-ui-badge__sup').text()).toBe('99+');
  });

  it('passes string values through verbatim regardless of max', () => {
    const wrapper = mount(ChronixBadge, { props: { value: 'NEW', max: 5 } });
    expect(wrapper.find('.cx-ui-badge__sup').text()).toBe('NEW');
  });

  it('renders empty sup when value is undefined and dot is false', () => {
    const wrapper = mount(ChronixBadge);
    expect(wrapper.find('.cx-ui-badge__sup').text()).toBe('');
  });
});

describe('ChronixBadge — dot mode', () => {
  it('dot=true adds --dot modifier and suppresses displayed value', () => {
    const wrapper = mount(ChronixBadge, { props: { dot: true, value: 42 } });
    const sup = wrapper.find('.cx-ui-badge__sup');
    expect(sup.classes()).toContain('cx-ui-badge__sup--dot');
    expect(sup.text()).toBe('');
  });
});

describe('ChronixBadge — type prop', () => {
  it.each(['default', 'success', 'warning', 'error', 'info'] as const)(
    'type="%s" adds the matching modifier on __sup',
    (t) => {
      const wrapper = mount(ChronixBadge, { props: { type: t } });
      expect(wrapper.find('.cx-ui-badge__sup').classes()).toContain(`cx-ui-badge__sup--${t}`);
    },
  );
});

describe('ChronixBadge — processing + show modifiers', () => {
  it('processing=true adds --processing modifier on __sup', () => {
    const wrapper = mount(ChronixBadge, { props: { processing: true } });
    expect(wrapper.find('.cx-ui-badge__sup').classes()).toContain('cx-ui-badge__sup--processing');
  });

  it('show=false adds --hidden modifier on __sup', () => {
    const wrapper = mount(ChronixBadge, { props: { show: false } });
    expect(wrapper.find('.cx-ui-badge__sup').classes()).toContain('cx-ui-badge__sup--hidden');
  });
});

describe('ChronixBadge — CSS injection', () => {
  it('mounting any badge ensures the chronix-badge stylesheet is in document.head', () => {
    mount(ChronixBadge);
    const style = document.head.querySelector('style[data-chronix-ui="badge"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-badge');
  });

  it('multiple mounts inject only one stylesheet (idempotent)', () => {
    mount(ChronixBadge);
    mount(ChronixBadge);
    mount(ChronixBadge);
    const styles = document.head.querySelectorAll('style[data-chronix-ui="badge"]');
    expect(styles.length).toBe(1);
  });
});

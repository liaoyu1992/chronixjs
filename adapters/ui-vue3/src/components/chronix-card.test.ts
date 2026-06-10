import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixCard } from './chronix-card.js';

/**
 * Phase 15 (2026-06-02) — Card mount tests (vue3).
 */

describe('ChronixCard — default rendering', () => {
  it('renders a <div> with base + medium + bordered classes', () => {
    const wrapper = mount(ChronixCard);
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-card');
    expect(wrapper.classes()).toContain('cx-ui-card--medium');
    expect(wrapper.classes()).toContain('cx-ui-card--bordered');
  });

  it('renders default slot inside __content', () => {
    const wrapper = mount(ChronixCard, { slots: { default: 'Body' } });
    expect(wrapper.find('.cx-ui-card__content').text()).toBe('Body');
  });
});

describe('ChronixCard — title prop + footer slot', () => {
  it('renders __header when title is set + adds --with-title', () => {
    const wrapper = mount(ChronixCard, { props: { title: 'Stats' } });
    expect(wrapper.classes()).toContain('cx-ui-card--with-title');
    expect(wrapper.find('.cx-ui-card__header').text()).toBe('Stats');
  });

  it('renders __footer when footer slot supplied + adds --with-footer', () => {
    const wrapper = mount(ChronixCard, { slots: { footer: 'Footer content' } });
    expect(wrapper.classes()).toContain('cx-ui-card--with-footer');
    expect(wrapper.find('.cx-ui-card__footer').text()).toBe('Footer content');
  });

  it('omits __footer + --with-footer when footer slot is empty', () => {
    const wrapper = mount(ChronixCard);
    expect(wrapper.find('.cx-ui-card__footer').exists()).toBe(false);
    expect(wrapper.classes()).not.toContain('cx-ui-card--with-footer');
  });
});

describe('ChronixCard — size + modifiers', () => {
  it.each(['small', 'medium', 'large'] as const)('size="%s" adds the matching modifier', (s) => {
    const wrapper = mount(ChronixCard, { props: { size: s } });
    expect(wrapper.classes()).toContain(`cx-ui-card--${s}`);
  });

  it('bordered=false removes --bordered', () => {
    const wrapper = mount(ChronixCard, { props: { bordered: false } });
    expect(wrapper.classes()).not.toContain('cx-ui-card--bordered');
  });

  it('hoverable + embedded add their modifiers', () => {
    const wrapper = mount(ChronixCard, { props: { hoverable: true, embedded: true } });
    expect(wrapper.classes()).toContain('cx-ui-card--hoverable');
    expect(wrapper.classes()).toContain('cx-ui-card--embedded');
  });
});

describe('ChronixCard — CSS injection', () => {
  it('mounting a card ensures the chronix-card stylesheet is in document.head', () => {
    mount(ChronixCard);
    expect(document.head.querySelector('style[data-chronix-ui="card"]')).not.toBeNull();
  });
});

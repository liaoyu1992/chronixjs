import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixElement } from './chronix-element.js';

describe('ChronixElement (vue3)', () => {
  it('renders a <span> by default', () => {
    const wrapper = mount(ChronixElement, { slots: { default: 'hi' } });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-element');
  });

  it('honors a custom tag prop', () => {
    const wrapper = mount(ChronixElement, {
      props: { tag: 'section' },
      slots: { default: 'body' },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('SECTION');
  });

  it('adds --inline when inline=true', () => {
    const wrapper = mount(ChronixElement, { props: { inline: true } });
    expect(wrapper.classes()).toContain('cx-ui-element--inline');
  });

  it('injects the chronix-element stylesheet', () => {
    mount(ChronixElement);
    expect(document.head.querySelector('style[data-chronix-ui="element"]')).not.toBeNull();
  });
});

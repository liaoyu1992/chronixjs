// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixScrollbar } from './chronix-scrollbar.js';

/**
 * — Scrollbar mount tests (vue3).
 */
describe('ChronixScrollbar', () => {
  it('renders a div with base class and data-testid', () => {
    const wrapper = mount(ChronixScrollbar, {
      slots: { default: 'Scrollable content' },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-scrollbar');
    expect(wrapper.attributes('data-testid')).toBe('scrollbar-root');
  });

  it('injects the chronix-scrollbar stylesheet', () => {
    mount(ChronixScrollbar);
    expect(document.head.querySelector('style[data-chronix-ui="scrollbar"]')).not.toBeNull();
  });
});

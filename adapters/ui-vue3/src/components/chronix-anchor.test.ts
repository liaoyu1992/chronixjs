// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixAnchor } from './chronix-anchor.js';

/**
 * Phase 35 (2026-06-05) — Anchor mount tests (vue3).
 */
describe('ChronixAnchor', () => {
  it('renders a nav with base class and data-testid', () => {
    const wrapper = mount(ChronixAnchor, {
      props: {
        items: [
          { key: 'a', label: 'Section A', href: '#a' },
          { key: 'b', label: 'Section B', href: '#b' },
        ],
      },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('NAV');
    expect(wrapper.classes()).toContain('cx-ui-anchor');
    expect(wrapper.attributes('data-testid')).toBe('anchor-root');
  });

  it('injects the chronix-anchor stylesheet', () => {
    mount(ChronixAnchor);
    expect(document.head.querySelector('style[data-chronix-ui="anchor"]')).not.toBeNull();
  });
});

// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixNumberAnimation } from './chronix-number-animation.js';

/**
 * Phase 35 (2026-06-05) — NumberAnimation mount tests (vue3).
 */
describe('ChronixNumberAnimation', () => {
  it('renders a span with base class and data-testid', () => {
    const wrapper = mount(ChronixNumberAnimation, {
      props: { from: 0, to: 100 },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('SPAN');
    expect(wrapper.classes()).toContain('cx-ui-number-animation');
    expect(wrapper.attributes('data-testid')).toBe('number-animation-root');
  });

  it('injects the chronix-number-animation stylesheet', () => {
    mount(ChronixNumberAnimation);
    expect(document.head.querySelector('style[data-chronix-ui="number-animation"]')).not.toBeNull();
  });
});

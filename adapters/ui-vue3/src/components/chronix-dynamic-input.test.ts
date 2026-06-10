// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixDynamicInput } from './chronix-dynamic-input.js';

/**
 * Phase 35 (2026-06-05) — DynamicInput mount tests (vue3).
 */
describe('ChronixDynamicInput', () => {
  it('renders a div with base class and data-testid', () => {
    const wrapper = mount(ChronixDynamicInput, {
      props: { value: ['a', 'b'] },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-dynamic-input');
    expect(wrapper.attributes('data-testid')).toBe('dynamic-input-root');
  });

  it('injects the chronix-dynamic-input stylesheet', () => {
    mount(ChronixDynamicInput);
    expect(document.head.querySelector('style[data-chronix-ui="dynamic-input"]')).not.toBeNull();
  });
});

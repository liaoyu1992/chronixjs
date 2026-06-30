// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixDynamicTags } from './chronix-dynamic-tags.js';

/**
 * — DynamicTags mount tests (vue3).
 */
describe('ChronixDynamicTags', () => {
  it('renders a div with base class and data-testid', () => {
    const wrapper = mount(ChronixDynamicTags, {
      props: { value: ['vue', 'react'] },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-dynamic-tags');
    expect(wrapper.attributes('data-testid')).toBe('dynamic-tags-root');
  });

  it('injects the chronix-dynamic-tags stylesheet', () => {
    mount(ChronixDynamicTags);
    expect(document.head.querySelector('style[data-chronix-ui="dynamic-tags"]')).not.toBeNull();
  });
});

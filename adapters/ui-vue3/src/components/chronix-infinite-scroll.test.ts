// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixInfiniteScroll } from './chronix-infinite-scroll.js';

/**
 * — InfiniteScroll mount tests (vue3).
 */
describe('ChronixInfiniteScroll', () => {
  it('renders a div with base class and data-testid', () => {
    const wrapper = mount(ChronixInfiniteScroll, {
      slots: { default: 'Content here' },
    });
    expect((wrapper.element as HTMLElement).tagName).toBe('DIV');
    expect(wrapper.classes()).toContain('cx-ui-infinite-scroll');
    expect(wrapper.attributes('data-testid')).toBe('infinite-scroll-root');
  });

  it('injects the chronix-infinite-scroll stylesheet', () => {
    mount(ChronixInfiniteScroll);
    expect(document.head.querySelector('style[data-chronix-ui="infinite-scroll"]')).not.toBeNull();
  });
});

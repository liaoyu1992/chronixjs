// @vitest-environment happy-dom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixPagination } from './chronix-pagination.js';

describe('ChronixPagination (vue3)', () => {
  it('renders root element with correct class', () => {
    const wrapper = mount(ChronixPagination, { props: { page: 1, pageCount: 10 } });
    expect(wrapper.find('[data-testid="pagination-root"]').classes()).toContain('cx-ui-pagination');
  });

  it('renders page buttons', () => {
    const wrapper = mount(ChronixPagination, { props: { page: 1, pageCount: 5 } });
    expect(wrapper.find('[data-testid="pagination-page-1"]').exists()).toBe(true);
  });

  it('renders prev and next buttons', () => {
    const wrapper = mount(ChronixPagination, { props: { page: 1, pageCount: 10 } });
    expect(wrapper.find('[data-testid="pagination-prev"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="pagination-next"]').exists()).toBe(true);
  });

  it('injects the chronix-pagination stylesheet', () => {
    mount(ChronixPagination, { props: { page: 1, pageCount: 10 } });
    const style = document.head.querySelector('style[data-chronix-ui="pagination"]');
    expect(style).not.toBeNull();
  });
});

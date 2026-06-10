import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { ChronixPagination } from './chronix-pagination.js';

import type { VueConstructor } from 'vue';

const PaginationCtor = ChronixPagination as unknown as VueConstructor;

describe('ChronixPagination (Vue 2)', () => {
  it('renders root element with correct class', () => {
    const wrapper = mount(PaginationCtor, { propsData: { page: 1, pageCount: 5 } });
    expect(wrapper.find('.cx-ui-pagination').exists()).toBe(true);
    expect(wrapper.find('[data-testid="pagination-root"]').exists()).toBe(true);
  });

  it('renders page buttons', () => {
    const wrapper = mount(PaginationCtor, { propsData: { page: 1, pageCount: 5 } });
    expect(wrapper.find('[data-testid="pagination-page-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="pagination-page-5"]').exists()).toBe(true);
  });

  it('renders prev and next buttons', () => {
    const wrapper = mount(PaginationCtor, { propsData: { page: 3, pageCount: 5 } });
    expect(wrapper.find('[data-testid="pagination-prev"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="pagination-next"]').exists()).toBe(true);
  });

  it('injects the chronix-pagination stylesheet', () => {
    mount(PaginationCtor, { propsData: { page: 1, pageCount: 5 } });
    const style = document.head.querySelector('style[data-chronix-ui="pagination"]');
    expect(style).not.toBeNull();
  });
});

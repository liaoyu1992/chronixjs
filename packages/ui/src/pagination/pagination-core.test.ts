// @vitest-environment happy-dom

/**
 * Pagination core tests — Phase 33 (2026-06-05).
 */

import { describe, expect, it } from 'vitest';

import {
  defaultPaginationProps,
  computePageCount,
  computePaginationPages,
  resolvePaginationRootClassList,
  resolvePaginationItemClassList,
  resolvePaginationButtonClassList,
  CHRONIX_PAGINATION_CSS,
  ensureChronixPaginationStyles,
} from './index.js';

describe('defaultPaginationProps', () => {
  it('has correct defaults', () => {
    expect(defaultPaginationProps.page).toBe(1);
    expect(defaultPaginationProps.pageCount).toBe(1);
    expect(defaultPaginationProps.itemCount).toBe(0);
    expect(defaultPaginationProps.pageSize).toBe(10);
    expect(defaultPaginationProps.pageSizes).toEqual([10]);
    expect(defaultPaginationProps.showSizePicker).toBe(false);
    expect(defaultPaginationProps.showQuickJumper).toBe(false);
    expect(defaultPaginationProps.pageSlot).toBe(9);
    expect(defaultPaginationProps.disabled).toBe(false);
  });
});

describe('computePageCount', () => {
  it('computes pages from items and page size', () => {
    expect(computePageCount(100, 10)).toBe(10);
  });

  it('rounds up partial pages', () => {
    expect(computePageCount(95, 10)).toBe(10);
  });

  it('returns 1 for empty items', () => {
    expect(computePageCount(0, 10)).toBe(1);
  });

  it('returns 1 for zero page size', () => {
    expect(computePageCount(100, 0)).toBe(1);
  });

  it('handles single item', () => {
    expect(computePageCount(1, 10)).toBe(1);
  });
});

describe('computePaginationPages', () => {
  it('shows all pages when within pageSlot', () => {
    const result = computePaginationPages(1, 5, 9);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('shows first + ellipsis + window + ellipsis + last for large pageCount', () => {
    const result = computePaginationPages(50, 100, 9);
    // With pageSlot=9, middleSlots = 9-2 = 7 pages for middle
    // Should start with [1, ..., middle window, ..., 100]
    expect(result[0]).toBe(1);
    expect(result[result.length - 1]).toBe(100);
    // Should contain null for ellipsis
    expect(result).toContain(null);
    // Should contain page 50
    expect(result).toContain(50);
  });

  it('shows first page without ellipsis when near start', () => {
    const result = computePaginationPages(2, 20, 9);
    expect(result[0]).toBe(1);
    expect(result).toContain(2);
    expect(result[result.length - 1]).toBe(20);
  });

  it('shows last page without ellipsis when near end', () => {
    const result = computePaginationPages(19, 20, 9);
    expect(result[result.length - 1]).toBe(20);
    expect(result).toContain(19);
  });

  it('handles page 1 with many pages', () => {
    const result = computePaginationPages(1, 50, 9);
    expect(result[0]).toBe(1);
    expect(result[result.length - 1]).toBe(50);
    expect(result).toContain(1);
    // Should contain consecutive pages near start
    expect(result).toContain(2);
  });

  it('returns [1] for zero pageCount', () => {
    expect(computePaginationPages(1, 0, 9)).toEqual([1]);
  });

  it('returns [1] for negative pageCount', () => {
    expect(computePaginationPages(1, -5, 9)).toEqual([1]);
  });

  it('clamps page to valid range', () => {
    const result = computePaginationPages(200, 50, 9);
    // page 200 clamped to 50
    expect(result).toContain(50);
  });

  it('single page returns [1]', () => {
    expect(computePaginationPages(1, 1, 9)).toEqual([1]);
  });

  it('two pages returns [1, 2]', () => {
    expect(computePaginationPages(1, 2, 9)).toEqual([1, 2]);
  });
});

describe('resolvePaginationRootClassList', () => {
  it('returns base class', () => {
    expect(resolvePaginationRootClassList({ disabled: false })).toEqual(['cx-ui-pagination']);
  });

  it('adds disabled modifier', () => {
    expect(resolvePaginationRootClassList({ disabled: true })).toContain(
      'cx-ui-pagination--disabled',
    );
  });
});

describe('resolvePaginationItemClassList', () => {
  it('returns base class', () => {
    expect(resolvePaginationItemClassList({ active: false, disabled: false })).toEqual([
      'cx-ui-pagination__item',
    ]);
  });

  it('adds active modifier', () => {
    expect(resolvePaginationItemClassList({ active: true, disabled: false })).toContain(
      'cx-ui-pagination__item--active',
    );
  });

  it('adds disabled modifier', () => {
    expect(resolvePaginationItemClassList({ active: false, disabled: true })).toContain(
      'cx-ui-pagination__item--disabled',
    );
  });
});

describe('resolvePaginationButtonClassList', () => {
  it('adds disabled modifier', () => {
    expect(resolvePaginationButtonClassList({ disabled: true })).toContain(
      'cx-ui-pagination__btn--disabled',
    );
  });
});

describe('CHRONIX_PAGINATION_CSS', () => {
  it('declares root BEM class', () => {
    expect(CHRONIX_PAGINATION_CSS).toContain('.cx-ui-pagination');
  });

  it('declares item element', () => {
    expect(CHRONIX_PAGINATION_CSS).toContain('.cx-ui-pagination__item');
  });

  it('declares button element', () => {
    expect(CHRONIX_PAGINATION_CSS).toContain('.cx-ui-pagination__btn');
  });

  it('declares ellipsis element', () => {
    expect(CHRONIX_PAGINATION_CSS).toContain('.cx-ui-pagination__ellipsis');
  });

  it('declares jumper element', () => {
    expect(CHRONIX_PAGINATION_CSS).toContain('.cx-ui-pagination__jumper');
  });

  it('declares active modifier', () => {
    expect(CHRONIX_PAGINATION_CSS).toContain('.cx-ui-pagination__item--active');
  });

  it('declares disabled modifier', () => {
    expect(CHRONIX_PAGINATION_CSS).toContain('.cx-ui-pagination--disabled');
  });
});

describe('ensureChronixPaginationStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixPaginationStyles();
    ensureChronixPaginationStyles();
    ensureChronixPaginationStyles();
    const styles = document.head.querySelectorAll('style[data-chronix-ui="pagination"]');
    expect(styles.length).toBe(1);
  });
});

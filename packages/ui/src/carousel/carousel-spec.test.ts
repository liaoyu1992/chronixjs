import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CAROUSEL_INTERVAL_MS,
  computeLazyVisibleRange,
  computeNextCarouselIndex,
  computePrevCarouselIndex,
  defaultCarouselProps,
  findCarouselItemByIndex,
  resolveCarouselSlideDirection,
  type CarouselItem,
} from './carousel-spec.js';

const items: readonly CarouselItem[] = [
  { key: 'a', content: 'A' },
  { key: 'b', content: 'B' },
  { key: 'c', content: 'C' },
];

describe('defaultCarouselProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultCarouselProps).toEqual({
      value: 0,
      items: [],
      autoplay: false,
      intervalMs: DEFAULT_CAROUSEL_INTERVAL_MS,
      showDots: true,
      showArrows: true,
      loop: true,
      direction: 'horizontal',
      lazy: false,
      thumbnails: false,
    });
  });

  it('DEFAULT_CAROUSEL_INTERVAL_MS is 3000', () => {
    expect(DEFAULT_CAROUSEL_INTERVAL_MS).toBe(3000);
  });
});

describe('computeNextCarouselIndex', () => {
  it('increments within bounds', () => {
    expect(computeNextCarouselIndex({ currentIndex: 0, totalCount: 3, loop: false })).toBe(1);
    expect(computeNextCarouselIndex({ currentIndex: 1, totalCount: 3, loop: false })).toBe(2);
  });

  it('wraps to 0 at last index when loop=true', () => {
    expect(computeNextCarouselIndex({ currentIndex: 2, totalCount: 3, loop: true })).toBe(0);
  });

  it('stays at last index when loop=false', () => {
    expect(computeNextCarouselIndex({ currentIndex: 2, totalCount: 3, loop: false })).toBe(2);
  });

  it('returns 0 for empty/zero count', () => {
    expect(computeNextCarouselIndex({ currentIndex: 0, totalCount: 0, loop: true })).toBe(0);
  });
});

describe('computePrevCarouselIndex', () => {
  it('decrements within bounds', () => {
    expect(computePrevCarouselIndex({ currentIndex: 2, totalCount: 3, loop: false })).toBe(1);
    expect(computePrevCarouselIndex({ currentIndex: 1, totalCount: 3, loop: false })).toBe(0);
  });

  it('wraps to last at 0 when loop=true', () => {
    expect(computePrevCarouselIndex({ currentIndex: 0, totalCount: 3, loop: true })).toBe(2);
  });

  it('stays at 0 when loop=false', () => {
    expect(computePrevCarouselIndex({ currentIndex: 0, totalCount: 3, loop: false })).toBe(0);
  });
});

describe('findCarouselItemByIndex', () => {
  it('returns the matching item', () => {
    expect(findCarouselItemByIndex(items, 1)?.key).toBe('b');
  });

  it('returns undefined for negative index', () => {
    expect(findCarouselItemByIndex(items, -1)).toBeUndefined();
  });

  it('returns undefined for out-of-range index', () => {
    expect(findCarouselItemByIndex(items, 5)).toBeUndefined();
  });
});

describe('resolveCarouselSlideDirection', () => {
  it('horizontal forward → from-right', () => {
    expect(
      resolveCarouselSlideDirection({
        prevIndex: 0,
        nextIndex: 1,
        direction: 'horizontal',
      }),
    ).toBe('from-right');
  });

  it('horizontal backward → from-left', () => {
    expect(
      resolveCarouselSlideDirection({
        prevIndex: 2,
        nextIndex: 1,
        direction: 'horizontal',
      }),
    ).toBe('from-left');
  });

  it('vertical forward → from-bottom', () => {
    expect(
      resolveCarouselSlideDirection({
        prevIndex: 0,
        nextIndex: 1,
        direction: 'vertical',
      }),
    ).toBe('from-bottom');
  });

  it('vertical backward → from-top', () => {
    expect(
      resolveCarouselSlideDirection({
        prevIndex: 2,
        nextIndex: 1,
        direction: 'vertical',
      }),
    ).toBe('from-top');
  });
});

describe('computeLazyVisibleRange', () => {
  it('returns all indices when lazy=false', () => {
    expect(computeLazyVisibleRange({ activeIndex: 2, totalCount: 5, lazy: false })).toEqual([
      0, 1, 2, 3, 4,
    ]);
  });

  it('returns active ± 1 when lazy=true (middle)', () => {
    expect(computeLazyVisibleRange({ activeIndex: 2, totalCount: 5, lazy: true })).toEqual([
      1, 2, 3,
    ]);
  });

  it('clamps at 0 for first slide', () => {
    expect(computeLazyVisibleRange({ activeIndex: 0, totalCount: 5, lazy: true })).toEqual([0, 1]);
  });

  it('clamps at last index for last slide', () => {
    expect(computeLazyVisibleRange({ activeIndex: 4, totalCount: 5, lazy: true })).toEqual([3, 4]);
  });

  it('returns single index for 1-item carousel', () => {
    expect(computeLazyVisibleRange({ activeIndex: 0, totalCount: 1, lazy: true })).toEqual([0]);
  });

  it('returns empty for 0 items', () => {
    expect(computeLazyVisibleRange({ activeIndex: 0, totalCount: 0, lazy: true })).toEqual([]);
  });
});

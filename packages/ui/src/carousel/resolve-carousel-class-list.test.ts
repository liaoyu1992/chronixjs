import { describe, expect, it } from 'vitest';

import {
  resolveCarouselClassList,
  resolveCarouselDotClassList,
  resolveCarouselSlideClassList,
  resolveCarouselThumbnailClassList,
} from './resolve-carousel-class-list.js';

describe('resolveCarouselClassList', () => {
  it('horizontal direction', () => {
    expect(resolveCarouselClassList({ direction: 'horizontal' })).toEqual([
      'cx-ui-carousel',
      'cx-ui-carousel--direction-horizontal',
    ]);
  });

  it('vertical direction', () => {
    expect(resolveCarouselClassList({ direction: 'vertical' })).toContain(
      'cx-ui-carousel--direction-vertical',
    );
  });
});

describe('resolveCarouselDotClassList', () => {
  it('inactive → base only', () => {
    expect(resolveCarouselDotClassList({ active: false })).toEqual(['cx-ui-carousel__dot']);
  });

  it('active → appends --active', () => {
    expect(resolveCarouselDotClassList({ active: true })).toContain('cx-ui-carousel__dot--active');
  });
});

describe('resolveCarouselSlideClassList', () => {
  it('inactive → base only', () => {
    expect(resolveCarouselSlideClassList({ active: false })).toEqual(['cx-ui-carousel__slide']);
  });

  it('active → appends --active', () => {
    expect(resolveCarouselSlideClassList({ active: true })).toContain(
      'cx-ui-carousel__slide--active',
    );
  });
});

describe('resolveCarouselThumbnailClassList', () => {
  it('inactive → base only', () => {
    expect(resolveCarouselThumbnailClassList({ active: false })).toEqual([
      'cx-ui-carousel__thumbnail',
    ]);
  });

  it('active → appends --active', () => {
    expect(resolveCarouselThumbnailClassList({ active: true })).toContain(
      'cx-ui-carousel__thumbnail--active',
    );
  });
});

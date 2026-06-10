// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';

import { CHRONIX_CAROUSEL_CSS, ensureChronixCarouselStyles } from './carousel-styles.js';

describe('CHRONIX_CAROUSEL_CSS', () => {
  it('declares root + slide + dot + arrow BEM', () => {
    expect(CHRONIX_CAROUSEL_CSS).toContain('.cx-ui-carousel');
    expect(CHRONIX_CAROUSEL_CSS).toContain('.cx-ui-carousel--direction-horizontal');
    expect(CHRONIX_CAROUSEL_CSS).toContain('.cx-ui-carousel--direction-vertical');
    expect(CHRONIX_CAROUSEL_CSS).toContain('.cx-ui-carousel__viewport');
    expect(CHRONIX_CAROUSEL_CSS).toContain('.cx-ui-carousel__slide');
    expect(CHRONIX_CAROUSEL_CSS).toContain('.cx-ui-carousel__slide--active');
    expect(CHRONIX_CAROUSEL_CSS).toContain('.cx-ui-carousel__dot');
    expect(CHRONIX_CAROUSEL_CSS).toContain('.cx-ui-carousel__arrow');
  });
});

describe('ensureChronixCarouselStyles', () => {
  it('injects exactly one stylesheet across repeated calls', () => {
    ensureChronixCarouselStyles();
    ensureChronixCarouselStyles();
    expect(document.head.querySelectorAll('style[data-chronix-ui="carousel"]').length).toBe(1);
  });
});

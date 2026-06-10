export type { CarouselDirection, CarouselItem, CarouselProps } from './carousel-spec.js';
export {
  DEFAULT_CAROUSEL_INTERVAL_MS,
  computeLazyVisibleRange,
  computeNextCarouselIndex,
  computePrevCarouselIndex,
  defaultCarouselProps,
  findCarouselItemByIndex,
  resolveCarouselSlideDirection,
} from './carousel-spec.js';
export type {
  ResolveCarouselClassListInput,
  ResolveCarouselDotClassListInput,
  ResolveCarouselSlideClassListInput,
  ResolveCarouselThumbnailClassListInput,
} from './resolve-carousel-class-list.js';
export {
  resolveCarouselClassList,
  resolveCarouselDotClassList,
  resolveCarouselSlideClassList,
  resolveCarouselThumbnailClassList,
} from './resolve-carousel-class-list.js';
export { CHRONIX_CAROUSEL_CSS, ensureChronixCarouselStyles } from './carousel-styles.js';

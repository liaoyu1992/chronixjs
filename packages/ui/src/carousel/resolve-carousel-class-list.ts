import type { CarouselDirection } from './carousel-spec.js';

export interface ResolveCarouselClassListInput {
  readonly direction: CarouselDirection;
}

export function resolveCarouselClassList(input: ResolveCarouselClassListInput): string[] {
  return ['cx-ui-carousel', `cx-ui-carousel--direction-${input.direction}`];
}

export interface ResolveCarouselDotClassListInput {
  readonly active: boolean;
}

export function resolveCarouselDotClassList(input: ResolveCarouselDotClassListInput): string[] {
  const classes = ['cx-ui-carousel__dot'];
  if (input.active) classes.push('cx-ui-carousel__dot--active');
  return classes;
}

export interface ResolveCarouselSlideClassListInput {
  readonly active: boolean;
}

export function resolveCarouselSlideClassList(input: ResolveCarouselSlideClassListInput): string[] {
  const classes = ['cx-ui-carousel__slide'];
  if (input.active) classes.push('cx-ui-carousel__slide--active');
  return classes;
}

export interface ResolveCarouselThumbnailClassListInput {
  readonly active: boolean;
}

export function resolveCarouselThumbnailClassList(
  input: ResolveCarouselThumbnailClassListInput,
): string[] {
  const classes = ['cx-ui-carousel__thumbnail'];
  if (input.active) classes.push('cx-ui-carousel__thumbnail--active');
  return classes;
}

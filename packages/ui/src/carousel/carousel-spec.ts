/**
 * Carousel component IR — Phase 29 (2026-06-04). Tier B items-array
 * slide carousel with optional autoplay + indicator dots + prev/next
 * arrows.
 *
 * First real component-level consumer of Phase 8
 * `buildSlideTransitionStyles` for slide-from-left/right transitions
 * (Phase 28 shipped `buildHeightCollapseTransitionStyles`; Phase 29
 * ships slide animation to a real component).
 *
 * Out-of-scope (v0.2):
 * - Auto-resize on container resize.
 * - Touch/swipe drag.
 * - Variable per-slide duration.
 * - Keyboard nav (ArrowLeft/Right on focused viewport).
 * - Pause autoplay on hover.
 */

import type { SlideDirection } from '../transition/transition-phase-styles.js';

export type CarouselDirection = 'horizontal' | 'vertical';

export interface CarouselItem {
  readonly key: string;
  /** Plain-text panel content. Rich content deferred to v0.2. */
  readonly content: string;
  /** Optional short label for the thumbnail strip. */
  readonly thumbnailLabel?: string;
}

export interface CarouselProps {
  /** Currently active slide index (0-based). */
  readonly value: number;
  readonly items: readonly CarouselItem[];
  readonly autoplay: boolean;
  /** Autoplay interval in ms. Honored only when `autoplay: true`. */
  readonly intervalMs: number;
  readonly showDots: boolean;
  readonly showArrows: boolean;
  /** When `true`, wrap from last → first (and first → last on prev). */
  readonly loop: boolean;
  readonly direction: CarouselDirection;
  /** When true, render only active slide + adjacent slides (±1). */
  readonly lazy: boolean;
  /** When true, render a thumbnail strip below the viewport. */
  readonly thumbnails: boolean;
}

export const DEFAULT_CAROUSEL_INTERVAL_MS = 3000;

export const defaultCarouselProps: CarouselProps = {
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
};

/**
 * Compute the next slide index. When `loop: true`, wraps from
 * last → 0; when `loop: false` AND already at last, returns
 * `currentIndex` unchanged.
 *
 * Returns `0` for empty / zero-count item lists (boundary safe).
 */
export function computeNextCarouselIndex(input: {
  readonly currentIndex: number;
  readonly totalCount: number;
  readonly loop: boolean;
}): number {
  const { currentIndex, totalCount, loop } = input;
  if (totalCount <= 0) return 0;
  if (currentIndex >= totalCount - 1) {
    return loop ? 0 : currentIndex;
  }
  return currentIndex + 1;
}

/**
 * Compute the previous slide index. When `loop: true`, wraps from
 * 0 → last; when `loop: false` AND already at 0, returns `0`.
 */
export function computePrevCarouselIndex(input: {
  readonly currentIndex: number;
  readonly totalCount: number;
  readonly loop: boolean;
}): number {
  const { currentIndex, totalCount, loop } = input;
  if (totalCount <= 0) return 0;
  if (currentIndex <= 0) {
    return loop ? totalCount - 1 : 0;
  }
  return currentIndex - 1;
}

/**
 * Find a slide item by index. Returns `undefined` when out of range.
 */
export function findCarouselItemByIndex(
  items: readonly CarouselItem[],
  index: number,
): CarouselItem | undefined {
  if (index < 0 || index >= items.length) return undefined;
  return items[index];
}

/**
 * Resolve the Phase 8 `SlideDirection` for a transition from
 * `prevIndex` to `nextIndex`. Forward index movement → slide enters
 * from the trailing edge (right / bottom); backward movement → from
 * the leading edge (left / top).
 *
 * Wrap-around (last → 0 with `loop: true`) is treated as forward.
 */
export function resolveCarouselSlideDirection(input: {
  readonly prevIndex: number;
  readonly nextIndex: number;
  readonly direction: CarouselDirection;
}): SlideDirection {
  const forward = input.nextIndex > input.prevIndex;
  if (input.direction === 'horizontal') {
    return forward ? 'from-right' : 'from-left';
  }
  return forward ? 'from-bottom' : 'from-top';
}

/**
 * Compute which slide indices should be rendered when `lazy: true`.
 * Returns active + adjacent (±1, clamped to bounds).
 * When `lazy: false`, returns the full range `[0, totalCount)`.
 */
export function computeLazyVisibleRange(input: {
  readonly activeIndex: number;
  readonly totalCount: number;
  readonly lazy: boolean;
}): readonly number[] {
  const { activeIndex, totalCount, lazy } = input;
  if (totalCount <= 0) return [];
  if (!lazy) return Array.from({ length: totalCount }, (_, i) => i);
  const lo = Math.max(0, activeIndex - 1);
  const hi = Math.min(totalCount - 1, activeIndex + 1);
  const indices: number[] = [];
  for (let i = lo; i <= hi; i++) indices.push(i);
  return indices;
}

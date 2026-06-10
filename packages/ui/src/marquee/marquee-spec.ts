/**
 * Marquee IR — Phase 22 (2026-06-03). Tier A auto-scrolling
 * content strip for stock-tickers, sports scores, promo
 * announcements.
 *
 * Per Phase 22 Decision D.1 the scrolling animation runs as a
 * pure CSS `@keyframes` rule (no JS RAF loop). The adapter
 * duplicates the slot content TWICE within an inner `__track`
 * element so the `transform: translate(-50%)` end-state visually
 * matches the `translate(0)` start-state for a seamless loop. The
 * browser composites on the GPU; CPU cost ≈ 0.
 *
 * Public surface:
 *
 * - **`MarqueeDirection`** — closed union of 4 values.
 * - **`MarqueeProps`** + **`defaultMarqueeProps`**.
 */

/** Scrolling direction. */
export type MarqueeDirection = 'left' | 'right' | 'up' | 'down';

export interface MarqueeProps {
  /** Direction the content scrolls. */
  readonly direction: MarqueeDirection;
  /**
   * Scrolling speed in pixels per second. `0` (or negative)
   * effectively pauses (animation-duration becomes 0; the
   * keyframes don't play). Adapter computes
   * `animationDuration = (contentWidth * 2) / speed`.
   */
  readonly speed: number;
  /**
   * When `true`, the CSS rule
   * `.cx-ui-marquee--pause-on-hover:hover .cx-ui-marquee__track {
   * animation-play-state: paused; }` pauses the animation while
   * the pointer is over the marquee. Pure CSS — no JS handler.
   */
  readonly pauseOnHover: boolean;
}

export const defaultMarqueeProps: MarqueeProps = {
  direction: 'left',
  speed: 50,
  pauseOnHover: false,
};

import type { MarqueeProps } from './marquee-spec.js';

/**
 * Compute class set for the Marquee root element.
 *
 * Phase 22 (2026-06-03).
 *
 * Class structure:
 *
 * - `'cx-ui-marquee'` — always present.
 * - `'cx-ui-marquee--direction-{value}'` — one of `'left' |
 *   'right' | 'up' | 'down'`. Drives the inner `__track`'s
 *   `flex-direction` (horizontal for left/right, vertical for
 *   up/down).
 * - `'cx-ui-marquee--pause-on-hover'` — only when
 *   `props.pauseOnHover`. The companion CSS rule
 *   `.cx-ui-marquee--pause-on-hover:hover .cx-ui-marquee__track {
 *   animation-play-state: paused }` does the actual pause.
 */
export function resolveMarqueeClassList(props: MarqueeProps): string[] {
  const classes = ['cx-ui-marquee', `cx-ui-marquee--direction-${props.direction}`];
  if (props.pauseOnHover) classes.push('cx-ui-marquee--pause-on-hover');
  return classes;
}

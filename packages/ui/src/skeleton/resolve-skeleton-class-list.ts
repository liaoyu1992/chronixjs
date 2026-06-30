import type { SkeletonProps } from './skeleton-spec.js';

/**
 * Compute class set for the Skeleton root element.
 *
 * .
 *
 * Class structure:
 *
 * - `'cx-ui-skeleton'` — always present.
 * - `'cx-ui-skeleton--{shape}'` — `text` / `rect` / `circle`. Drives
 *   base width / height / border-radius defaults.
 * - `'cx-ui-skeleton--animated'` — present iff `props.animated`
 *   true. Drives shimmer keyframes.
 * - `'cx-ui-skeleton--round'` — present iff `props.round` true.
 *   Drives `border-radius: 999px` (pill ends).
 */
export function resolveSkeletonClassList(props: SkeletonProps): string[] {
  const classes = ['cx-ui-skeleton', `cx-ui-skeleton--${props.shape}`];
  if (props.animated) classes.push('cx-ui-skeleton--animated');
  if (props.round) classes.push('cx-ui-skeleton--round');
  return classes;
}

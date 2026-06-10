import type { TimelineItem } from './timeline-spec.js';

/**
 * Compute class set for a single Timeline item element.
 *
 * Phase 20 (2026-06-03).
 *
 * Class structure:
 *
 * - `'cx-ui-timeline__item'` — always present.
 * - `'cx-ui-timeline__item--color-{color}'` — drives dot color
 *   tokens. One of 5 values.
 * - `'cx-ui-timeline__item--line-{lineType}'` — drives line style.
 *   `'default'` (solid) or `'dashed'`.
 * - `'cx-ui-timeline__item--last'` — present iff this is the last
 *   item in the iteration. The adapter ALSO skips rendering the
 *   `__line` element for the last item; the class lets consumers
 *   style the last item independently (e.g. larger dot).
 */
export function resolveTimelineItemClassList(item: TimelineItem, isLast: boolean): string[] {
  const classes = [
    'cx-ui-timeline__item',
    `cx-ui-timeline__item--color-${item.color}`,
    `cx-ui-timeline__item--line-${item.lineType}`,
  ];
  if (isLast) classes.push('cx-ui-timeline__item--last');
  return classes;
}

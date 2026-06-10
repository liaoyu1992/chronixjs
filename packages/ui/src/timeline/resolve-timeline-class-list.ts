import type { TimelineProps } from './timeline-spec.js';

/**
 * Compute class set for the Timeline root element.
 *
 * Phase 20 (2026-06-03).
 *
 * Class structure: `'cx-ui-timeline'` only — Timeline currently has
 * no root-level modifiers (every variant axis is per-item per
 * Phase 20 D.1). The signature is kept consistent with the
 * `resolveXxxClassList(props, ...)` cookbook so a future root-level
 * modifier (e.g. `--reversed` if Phase 20.x adds `reverse`
 * support) can be added without breaking the helper shape.
 */
export function resolveTimelineClassList(_props: TimelineProps): string[] {
  return ['cx-ui-timeline'];
}

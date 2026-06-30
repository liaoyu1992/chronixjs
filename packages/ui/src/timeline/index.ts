/**
 * chronix-ui timeline module — .
 */

export type {
  TimelineItem,
  TimelineItemColor,
  TimelineItemLineType,
  TimelineProps,
} from './timeline-spec.js';
export { defaultTimelineProps } from './timeline-spec.js';
export { resolveTimelineClassList } from './resolve-timeline-class-list.js';
export { resolveTimelineItemClassList } from './resolve-timeline-item-class-list.js';
export { CHRONIX_TIMELINE_CSS, ensureChronixTimelineStyles } from './timeline-styles.js';

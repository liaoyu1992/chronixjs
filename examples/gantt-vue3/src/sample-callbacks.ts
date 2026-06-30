import { todayLocalMidnight } from './sample-data.js';

import type {
  BarColorFunc,
  EventAllowFunc,
  EventConstraint,
  EventOverlapFunc,
  SelectAllowFunc,
} from '@chronixjs/gantt';

/**
 * **sample predicate / callback domain code.**
 *
 * Extracted from `App.vue` so the component file holds plumbing
 * (config / template / event handlers) and this file holds the
 * domain predicates that the demo's toggles + parity-mode wiring
 * reference by name. Each export is a stable callback or
 * configuration object that downstream code wires via `:bar-*` or
 * `:event-*` props.
 *
 * None of these are chronix-internal — they exist to demonstrate
 * the public callback surface in the demo. A consumer using
 * `<ChronixGantt>` in their own project would write their own
 * predicates with their own domain rules.
 */

/**
 * Sample `eventOverlap`: reject any cross-row time-intersecting bar.
 * The boolean `false` form (vs a function) is the simplest case —
 * `<ChronixGantt :event-overlap="false">` denies all cross-row
 * intersects without per-pair logic.
 */
export const sampleEventOverlap: EventOverlapFunc | boolean = false;

/**
 * Sample `eventConstraint`: today only, 08:00..20:00 window. Drag /
 * resize destinations outside that range are rejected with
 * `reason: 'constraint'`.
 */
export const sampleEventConstraint: EventConstraint = {
  range: {
    start: (() => {
      const d = todayLocalMidnight();
      d.setHours(8, 0, 0, 0);
      return d;
    })(),
    end: (() => {
      const d = todayLocalMidnight();
      d.setHours(20, 0, 0, 0);
      return d;
    })(),
  },
};

/** Sample `eventAllow`: only allow drops / resizes whose start is at 08:00 or later. */
export const sampleEventAllow: EventAllowFunc = (proposal) => proposal.range.start.getHours() >= 8;

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

/** Sample `selectAllow`: only allow range-selects up to 4 hours wide. */
export const sampleSelectAllow: SelectAllowFunc = (proposal) =>
  proposal.range.end.getTime() - proposal.range.start.getTime() <= FOUR_HOURS_MS;

/** Priority → bar background color. Keys mirror the demo's sample data. */
export const PRIORITY_BACKGROUND: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#84cc16',
};

/**
 * Sample `barBackgroundColorCallback`: looks up `extendedProps.priority`
 * on the bar and returns the matching color from `PRIORITY_BACKGROUND`.
 * Returning `undefined` defers to the cascaded default (theme → prop →
 * spec.style) for bars without `priority` metadata.
 */
export const samplePriorityCallback: BarColorFunc = (arg) => {
  const priority = (arg.bar.extendedProps as { priority?: string } | undefined)?.priority;
  return priority ? PRIORITY_BACKGROUND[priority] : undefined;
};

/** Themed-bars colors (component-prop layer override). */
export const THEMED_BAR_BACKGROUND = '#10b981';
export const THEMED_BAR_BORDER = '#047857';

/** Umbrella `barColor` value the demo toggles between default and overridden. */
export const UMBRELLA_BAR_COLOR = '#8b5cf6';

/** Parity-mode reference color — matches the original demo's `eventBorderColor` default. */
export const PARITY_REFERENCE_COLOR = '#3788d8';

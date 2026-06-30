/**
 * Timeline IR — . Tier A chronological event
 * sequence display.
 *
 * Renders an iterated sequence of `(indicator + content)` items.
 * Each item has a colored dot + a connecting line to the next item
 * (omitted on the last item per the same `isLast` convention Phase
 * 19 Breadcrumb established). Content is a string-only triple
 * (`title` + optional `description` + optional `timestamp`) — rich
 * per-item custom rendering is parked per Decision E.1.
 *
 * Per Decision D.1, items come EXCLUSIVELY from the
 * `items: readonly TimelineItem[]` array prop (parallel
 * Breadcrumb C.1). No `<ChronixTimelineItem>` sub-component.
 *
 * Public surface:
 *
 * - **`TimelineItemColor`** — closed union (5 semantic colors).
 * - **`TimelineItemLineType`** — closed union (`'default' | 'dashed'`).
 * - **`TimelineItem`** — exported interface; consumer-supplied
 *   array entry.
 * - **`TimelineProps`** + **`defaultTimelineProps`**.
 */

/** Per-item dot color. */
export type TimelineItemColor = 'default' | 'success' | 'warning' | 'error' | 'info';

/** Per-item line style. */
export type TimelineItemLineType = 'default' | 'dashed';

export interface TimelineItem {
  /** Unique key for `v-for` / `Children.map`. */
  readonly key: string;
  /** Displayed title. */
  readonly title: string;
  /** Optional sub-text body. `undefined` omits the row. */
  readonly description: string | undefined;
  /**
   * Optional timestamp string. `undefined` omits the row.
   * Consumer pre-formats (e.g. `'2026-06-01 12:34'` /
   * `'2 hours ago'`); chronix-ui does NOT format dates here.
   */
  readonly timestamp: string | undefined;
  /** Semantic dot color. */
  readonly color: TimelineItemColor;
  /** Connecting-line style. */
  readonly lineType: TimelineItemLineType;
}

export interface TimelineProps {
  /** Ordered item list. Empty array renders an empty Timeline. */
  readonly items: readonly TimelineItem[];
}

export const defaultTimelineProps: TimelineProps = {
  items: [],
};

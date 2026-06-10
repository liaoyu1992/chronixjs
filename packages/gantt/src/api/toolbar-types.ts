import type { ViewId } from '../layout/types.js';

/**
 * The `headerToolbar` / `footerToolbar` prop shape. Each section's
 * string follows a two-level grammar:
 *
 *  - Space-separated **widget groups** within a section.
 *  - Comma-separated **widgets** within a group.
 *
 * Example: `'prev,next today'` declares one 2-button group
 * (`prev` + `next`) followed by a 1-button group (`today`).
 *
 * Widget names accepted by v0:
 *
 *  - `'title'` — renders the current axis-range title.
 *  - A `ViewId` (`'day'` / `'week'` / `'month'` / `'season'` /
 *    `'halfYear'` / `'year'`) — clicking emits `update:axisInput`
 *    with the matching `viewId` swapped in.
 *  - `'prev'` / `'next'` / `'today'` — nav widgets that advance,
 *    retreat, or reset the `anchorDate`.
 *
 * `left` / `right` force LTR ordering regardless of consumer
 * direction; `start` / `end` would respect RTL (currently identical
 * since chronix is LTR-only — global RTL is Defer-indefinite per
 * the disposition register).
 */
export interface ToolbarInput {
  readonly left?: string;
  readonly center?: string;
  readonly right?: string;
  readonly start?: string;
  readonly end?: string;
}

/** Discriminated kinds a parsed widget can take. */
export type ToolbarWidgetKind = 'title' | 'view' | 'nav';

/** One parsed widget. Either a title, a view button, or a nav button. */
export interface ToolbarWidget {
  /** Raw widget name as it appeared in the input string. */
  readonly buttonName: string;
  readonly kind: ToolbarWidgetKind;
  /** Display label. Empty for icon-only widgets (prev / next). */
  readonly labelText: string;
  /** Which built-in SVG icon to render. `null` means render `labelText`. */
  readonly iconSvg: 'prev' | 'next' | null;
  /** True when the widget represents the currently active view. */
  readonly isPressed: boolean;
}

/**
 * Output of `parseToolbar`. Three sections (start / center / end);
 * each section is an array of widget groups; each group is an array
 * of widgets. The render layer maps the outer array to one
 * `.cx-gantt-toolbar-chunk` per section and the middle array to one
 * `.cx-gantt-button-group` per multi-widget group.
 */
export interface ToolbarModel {
  readonly sectionWidgets: {
    readonly start: readonly (readonly ToolbarWidget[])[];
    readonly center: readonly (readonly ToolbarWidget[])[];
    readonly end: readonly (readonly ToolbarWidget[])[];
  };
}

/** Inputs `parseToolbar` needs beyond the raw string DSL. */
export interface ParseToolbarOptions {
  /** Which view ids are addressable by name in the DSL. */
  readonly viewIds: readonly ViewId[];
  /** The current active view; pressed-state flag follows this. */
  readonly activeViewId: ViewId;
}

/**
 * The full set of built-in view ids the `headerToolbar` DSL recognizes
 * as view-button widgets. Pass to `parseToolbar` as
 * `ParseToolbarOptions.viewIds` so an unknown view-id token throws
 * with a helpful "expected ..." message instead of silently rendering
 * an unlabeled button.
 *
 * Stays in sync with the `ViewId` union in `layout/types.ts` — adding
 * a new view requires updating both the union and this list.
 */
export const ALL_VIEW_IDS: readonly ViewId[] = [
  'day',
  'week',
  'month',
  'season',
  'halfYear',
  'year',
];

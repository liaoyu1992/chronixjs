/**
 * **The boundary between chronix and the parity-oracle DOM.**
 *
 * This file is the ONE place chronix-side test code is allowed to name
 * the upstream-reference demo's CSS class names and `data-*` attribute
 * names. Everywhere else in chronix code, refer to these by the named
 * constants exported here.
 *
 * Why: chronix is an R2 rewrite — the upstream demo is the parity
 * oracle, and the parity tests have to query its rendered DOM. The
 * DOM contract (class names, data-attrs) is upstream-owned and not
 * chronix-native. Sprinkling `.gantt-event` literals across chronix
 * test code would leak the R2 lineage into chronix's published
 * surface; keeping them in this single allow-listed module makes the
 * dependency explicit and local. The enforcement hook
 * (`scripts/check-no-external-repo-refs.mjs`) blocks the literal
 * forms in every other file.
 *
 * Adding a new selector: put it here as a named constant or factory,
 * then `import { ... } from '../src/reference-dom-map.js'` from the
 * caller. Do NOT inline the literal in a test file.
 */

// ─── Chart root / scroll containers ────────────────────────────────

/** The demo app's outer chart container — bounds the gantt+sidebar group. */
export const CHART_ROOT = '.demo-app-main';

/** Inner timeline body wrapper — the scrollable surface, full content width. */
export const TIMELINE_BODY_WRAPPER = '.gantt-timeline-body-wrapper';

/** Header wrapper — pixel-mirror of body wrapper, mounted above for tick labels. */
export const TIMELINE_HEADER_WRAPPER = '.gantt-timeline-header-wrapper';

/** Visible right pane of the body — the viewport-clipped content after the sidebar. */
export const TIMELINE_BODY_RIGHT = '.gantt-timeline-body-right';

// ─── Resource panel rows ───────────────────────────────────────────

/** `<tr>` per leaf resource in the left resource panel. */
export const RESOURCE_ROW = 'tr[data-resource-id]';

/** Specific resource row by id. */
export const resourceRowBy = (resourceId: string): string => `tr[data-resource-id="${resourceId}"]`;

// ─── Attribute names ───────────────────────────────────────────────

/**
 * Upstream `data-*` attribute names. Use these inside `chart.evaluate`
 * browser callbacks (where imported symbols don't reach across the
 * page boundary) by passing the value via the evaluate-args channel.
 */
export const REF_ATTR_NAMES = {
  eventId: 'data-event-id',
  instanceId: 'data-instance-id',
  resourceId: 'data-resource-id',
} as const;

// ─── Event bars + their parts ──────────────────────────────────────

/** Event bar group element. Carries `data-event-id` and `data-instance-id`. */
export const EVENT_BAR = '.gantt-event';

/** Event bar lookup by upstream's source-event id (e.g. "event-7"). */
export const eventBarBySource = (eventId: string): string => `[data-event-id="${eventId}"]`;

/**
 * Event bar lookup by upstream's instance id. Distinct from source id:
 * one source event can have multiple instances (e.g. recurring events).
 */
export const eventBarByInstance = (instanceId: string): string =>
  `[data-instance-id="${instanceId}"]`;

/** Progress drag triangle — rendered in a separate SVG overlay layer. */
export const PROGRESS_TRIANGLE = '.gantt-event-progress-drag-triangle';

/** Progress drag triangle restricted to a specific event instance. */
export const progressTriangleByInstance = (instanceId: string): string =>
  `${PROGRESS_TRIANGLE}[data-instance-id="${instanceId}"]`;

/**
 * Today-line root element in the upstream demo (Phase 21 parity). The
 * upstream renders ONE `<div class="gantt-timeline-today-line">` in
 * the body wrapper at `left: <todayX>` absolute. Chronix's equivalent
 * is `<line.cx-gantt-today-line data-today-line-side='body'>` in the
 * body SVG with `x1=todayX`. Compare via getBoundingClientRect on the
 * upstream div vs. `x1` attribute on the chronix line.
 */
export const TODAY_LINE = '.gantt-timeline-today-line';

/**
 * Phase 22.2: today-column background tint (parity-reference's
 * `todayBgColor` / `--gantt-today-bg-color` CSS variable). The
 * reference emits TWO distinct elements (different render passes):
 *
 * - **Body-side**: `<rect class="gantt-today-highlight">` inside the
 *   timeline body SVG layer (`GanttView.tsx:952-961`). One rect per
 *   visible slot row when `options.fillTodaySlotHighlight` is true.
 *   Position: `(x, y, slotWidth, segmentHeight)` per slot.
 * - **Header-side**: `<rect class="gantt-timeline-header-cell-today">`
 *   inside the header SVG layer (`GanttView.tsx:527-535`). One per
 *   today-spanning header cell across all header rows.
 *
 * Chronix's equivalent is a single `<rect class="cx-gantt-today-cell"
 * data-today-cell-side='body|header'>` rect per side spanning today's
 * full one-day slot (vs k-ui's per-row stack). The cross-demo parity
 * assertion compares the FIRST body-side rect on each side for x +
 * width.
 *
 * NOT to be confused with `.gantt-day-today`, which is a different
 * CSS class for month-view day cells (`date-rendering.ts:40`); not
 * present in timeline views the chronix demo exercises.
 */
export const TODAY_CELL_BODY = '.gantt-today-highlight';
export const TODAY_CELL_HEADER = '.gantt-timeline-header-cell-today';

/** Start-edge resize handle (drags the bar's left edge). */
export const RESIZER_START = '.gantt-event-resizer-start';

/** End-edge resize handle (drags the bar's right edge). */
export const RESIZER_END = '.gantt-event-resizer-end';

/**
 * CSS override that forces the upstream's resize handles to display:block
 * regardless of `:hover` / `.gantt-event-selected` state. The handles are
 * hidden by default and headless Playwright doesn't reliably trigger the
 * SVG `:hover` pseudo-class on every page, which leaves the handle's
 * underlying 8×8 rect unhittable. Inject via `page.addStyleTag({ content
 * })` once per page load before driving a resize recording.
 *
 * The override only changes visibility — the resize-zone geometry, hit
 * targets, mousedown handlers, and resulting commit math are all
 * untouched. So a recording captured with the override active produces
 * the same pointer→bbox trace the upstream would emit in a real user
 * hover; chronix's recording-replay parity is unaffected.
 */
export const RESIZER_ALWAYS_VISIBLE_CSS = '.gantt-event-resizer { display: block !important; }';

// ─── Toolbar (Phase 22) ─────────────────────────────────────────────

/**
 * Header toolbar root in the upstream demo. Chronix equivalent:
 * `.cx-gantt-toolbar` (above the chart wrapper inside `.cx-gantt-root`).
 * Both sides render the same 9-button + 1-title widget set when wired
 * with the canonical `headerToolbar: { left: 'prev,next today',
 * center: 'title', right: 'day,week,month,season,halfYear,year' }`
 * shape.
 */
export const TOOLBAR_ROOT = '.gantt-toolbar';

/** Toolbar title widget (`<h2.gantt-toolbar-title>`). */
export const TOOLBAR_TITLE = '.gantt-toolbar-title';

/**
 * Per-button selector pattern. The upstream renders one
 * `<button class="gantt-<buttonName>-button">` per widget. Captured
 * via this regex to reverse-derive `buttonName` from the class list
 * inside `extractToolbarSnapshot`.
 */
export const TOOLBAR_BUTTON_CLASS_PATTERN = /(?:^|\s)gantt-(\w+)-button(?:\s|$)/;

// ─── Grid lines (Phase 26) ─────────────────────────────────────────

/**
 * Phase 26: vertical grid lines emitted by the upstream demo per axis
 * tick. The reference's `GanttView.appendVerticalSlotSeparators` emits:
 *
 * - **Cell-boundary slot** (e.g. day boundary in week view, month
 *   boundary in season view): solid `<rect class="gantt-grid-vline">`.
 *   When the boundary also falls on a Monday-00:00 (ISO week start),
 *   the rect picks up `gantt-grid-vline-week` and a darker fill.
 * - **Non-cell-boundary slot** (sub-slot dividers, e.g. each hour
 *   within a day in week view): dashed `<line class="gantt-grid-vline
 *   gantt-grid-vline-dashed">` with `stroke-dasharray="2,2"`.
 *
 * Chronix equivalents prefixed with `cx-`. Counts must match across
 * the two demos at the same view / `weekendsVisible` setting — that's
 * the load-bearing parity check, since per-tick x-parity is already
 * covered by `extractTicksSnapshot` (Phase 20.5).
 */
export const GRID_VLINE = '.gantt-grid-vline';
export const GRID_VLINE_DASHED = '.gantt-grid-vline-dashed';
export const GRID_VLINE_WEEK = '.gantt-grid-vline-week';

/**
 * Phase 26: horizontal row-bottom line emitted by the upstream demo's
 * `GanttView.renderGridLines`. One `<line class="gantt-grid-hline">`
 * per row's bottom edge, y snapped to the device pixel grid via
 * `snapHorizontalGridLineY` (ported into chronix verbatim).
 */
export const GRID_HLINE = '.gantt-grid-hline';

// ─── Continuation indicators (Phase 27) ─────────────────────────────

/**
 * Phase 27: per-bar continuation triangle indicators emitted by the
 * upstream demo's `TimelineEvent.tsx` when a bar's calendar range
 * extends past the axis bounds. Left-pointing triangle for bars
 * whose start sits before the axis start (`!isEventStart`);
 * right-pointing for bars whose end sits past the axis end
 * (`!isEventEnd`).
 *
 * Chronix equivalents prefixed with `cx-` (`cx-gantt-bar-continuation-left`
 * / `-right`). Counts must match across the two demos at the same
 * view + parity-mode setting — the load-bearing parity check.
 */
export const CONTINUATION_LEFT = '.gantt-event-continuation-left';
export const CONTINUATION_RIGHT = '.gantt-event-continuation-right';

// ─── Bar title text (Phase 28.2) ────────────────────────────────────

/**
 * Phase 28.2: auto-rendered bar title text emitted by the upstream
 * demo's `TimelineEvent.tsx:543-656`. One `<text class="gantt-event-text">`
 * per event wide enough to show its title (the parity reference's
 * `showText && finalWidth > 30 && availableWidth >= 10` gate).
 *
 * Chronix equivalent: `.cx-gantt-bar-text`. Both sides emit the
 * same per-bar count when given the same axis + bar data and
 * apply the same truncation algorithm. Cross-demo content parity
 * (Set of truncated strings) is the load-bearing check.
 */
export const BAR_TEXT = '.gantt-event-text';

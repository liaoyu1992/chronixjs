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

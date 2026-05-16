/**
 * Visual customization tokens for `<ChronixGantt>`'s chrome. Bar fills
 * are NOT covered here — those live in consumer CSS via
 * `.cx-gantt-bar { fill: ...; stroke: ... }`. The theme covers every
 * inline color / font / stroke value the render function consumes for
 * the header band, axis ticks, progress overlay, sidebar chrome, and
 * dependency-line defaults.
 *
 * All fields are required on `ChronixTheme` proper; pass a
 * `Partial<ChronixTheme>` to the adapter's `theme` prop to override
 * individual tokens. The adapter merges
 * `{ ...defaultChronixTheme, ...props.theme }` at render time — undefined
 * fields fall back to defaults automatically.
 *
 * The interface is flat (no nested groups) so partial-override
 * ergonomics stay trivial: `:theme="{ headerCellFill: '#fef3c7' }"`.
 * A nested shape would require a recursive merge helper and more
 * verbose override syntax.
 */
export interface ChronixTheme {
  // ----- Chart -----
  /** Body SVG background. Currently visible only when content height < wrapper. */
  readonly chartBackground: string;

  // ----- Header band -----
  /** Header SVG background; opaque so bars don't bleed through during scroll. */
  readonly headerBackground: string;
  /** Cell fill for outer header rows (e.g. month bands above day ticks). */
  readonly headerCellFill: string;
  /** Cell border stroke for outer header rows. */
  readonly headerCellStroke: string;
  /** Text color for header-row cell labels. */
  readonly headerCellLabel: string;
  /** Tick stroke color (vertical lines between hours / days). */
  readonly headerTickStroke: string;
  /** Text color for tick labels (e.g. `'0时'`). */
  readonly headerTickLabel: string;
  /** Stroke color for the divider between tick row and bar area. */
  readonly headerDivider: string;

  // ----- Progress overlay -----
  /** Fill color for the translucent progress overlay rect. */
  readonly progressFill: string;
  /** Fill-opacity for the progress overlay (`0..1`). */
  readonly progressFillOpacity: number;
  /** Fill color for the progress handle's grab rect. */
  readonly progressHandleFill: string;
  /** Stroke color for the progress handle (typically white for contrast). */
  readonly progressHandleStroke: string;
  /** Stroke width (px) for the progress handle. */
  readonly progressHandleStrokeWidth: number;
  /** Text color for the progress label centered on the bar. */
  readonly progressLabel: string;

  // ----- Sidebar -----
  /** Background for both sidebar panes (top-left + bottom-left). */
  readonly sidebarBackground: string;
  /** Text color for sidebar header cells (column labels). */
  readonly sidebarHeaderCellLabel: string;
  /** Vertical-divider stroke between sidebar header cells. */
  readonly sidebarHeaderCellBorder: string;
  /** Horizontal divider stroke at the bottom of the sidebar header. */
  readonly sidebarHeaderDivider: string;
  /** Text color for sidebar body cells (row values). */
  readonly sidebarBodyCellLabel: string;
  /** Border stroke for sidebar body cells (vertical + horizontal dividers). */
  readonly sidebarBodyCellBorder: string;

  // ----- Links -----
  /** Default stroke color for dependency lines. Each link can override via `LinkSpec.colorOverride`. */
  readonly linkDefaultColor: string;
  /** Stroke width (px) for dependency-line paths. */
  readonly linkStrokeWidth: number;

  // ----- Typography -----
  /** Font size (px) for axis tick labels (e.g. `'0时'`). */
  readonly tickLabelFontSize: number;
  /** Font size (px) for outer header-row labels (e.g. month names). */
  readonly headerCellLabelFontSize: number;
  /** Font size (px) for sidebar header cells. */
  readonly sidebarHeaderFontSize: number;
  /** Font weight for sidebar header cells. */
  readonly sidebarHeaderFontWeight: number;
  /** Font size (px) for sidebar body cells. */
  readonly sidebarBodyFontSize: number;
  /** Font size (px) for the progress label. */
  readonly progressLabelFontSize: number;
  /** Font weight for the progress label. */
  readonly progressLabelFontWeight: number;

  // ----- Bar fill / stroke (Phase 20) -----
  /**
   * Bar fill color when no component prop, `BarSpec.style`, or
   * callback override resolves. Phase 20 moves bar fills from CSS
   * (`.cx-gantt-bar { fill }`) to this theme token so the bar-color
   * pipeline can override the value at runtime via the cascade.
   */
  readonly barBackgroundColor: string;
  /** Bar stroke color (same cascade as `barBackgroundColor`). */
  readonly barBorderColor: string;
  /**
   * Bar text color — applied to the progress label and surfaced to
   * custom slot renderers via `BarSlotArgs.resolvedTextColor`. The
   * default `<rect>` render has no `<text>` child of its own, so
   * this token's visible effect is on progress text + custom slot
   * output.
   */
  readonly barTextColor: string;

  // ----- Today line (Phase 21) -----
  /**
   * Default stroke color for the `todayLine` line element. Used when
   * the per-prop `TodayLineOption.color` is unset. Adapter applies as
   * the `<line stroke=...>` attribute on both body + header SVG.
   */
  readonly todayLineColor: string;
  /**
   * Default fill for the today-line's header tooltip rect. Used when
   * the per-prop `TodayLineOption.color` is unset; when `color` IS
   * set, it overrides BOTH the line stroke AND the tooltip background
   * (matches parity-reference behavior where one color drives both).
   */
  readonly todayLineTooltipBg: string;

  // ----- Today cell background (Phase 22.2) -----
  /**
   * Fill color for the today-column background tint. A translucent
   * rect spans the full chart height at today's day-slot position,
   * rendered behind the bars + tick labels. Used when the per-prop
   * `TodayCellBgOption.color` is unset. Default
   * `'rgba(255, 220, 40, .15)'` matches the parity-reference's
   * `--gantt-today-bg-color` CSS variable byte-for-byte.
   */
  readonly todayCellBgColor: string;

  // ----- Toolbar (Phase 22) -----
  /** `.cx-gantt-toolbar` background fill. */
  readonly toolbarBg: string;
  /** Resting `.cx-gantt-*-button` background. */
  readonly toolbarButtonBg: string;
  /** Active / pressed button background (`aria-pressed='true'`). */
  readonly toolbarButtonBgActive: string;
  /** Button border / divider color. */
  readonly toolbarButtonBorder: string;
  /** Button text + icon color. */
  readonly toolbarButtonColor: string;
  /** `.cx-gantt-toolbar-title` text color. */
  readonly toolbarTitleColor: string;

  // ----- Bar text (Phase 28.2) -----
  /**
   * Font size (px) for auto-rendered bar title text
   * (`.cx-gantt-bar-text`). Default 12 — matches the parity
   * reference's `<text fontSize='12px'>` default. The font-size
   * cascade allows per-bar override via `barFontSizeCallback`.
   */
  readonly barFontSize: number;
  /**
   * Font weight for auto-rendered bar title text. Numeric (400 =
   * normal, 600 = semibold, 700 = bold) to mirror chronix's
   * existing `progressLabelFontWeight` / `sidebarHeaderFontWeight`
   * tokens. Default 400 — matches the parity reference's `'normal'`
   * fontWeight default. Per-bar override via `barFontWeightCallback`.
   */
  readonly barFontWeight: number;

  // ----- Grid lines (Phase 26) -----
  /**
   * Stroke / fill color for body grid lines: vertical cell-boundary
   * (`.cx-gantt-grid-vline` solid 1-px rect) AND vertical sub-slot
   * (`.cx-gantt-grid-vline-dashed` 1-px line with `stroke-dasharray=2,2`).
   * Default `'#ddd'` matches the parity reference's `--gantt-border-color`
   * fallback.
   */
  readonly gridLineColor: string;
  /**
   * Fill color for vertical cell-boundary lines that coincide with the
   * start of an ISO week (Monday at 00:00) — emitted on
   * `.cx-gantt-grid-vline.cx-gantt-grid-vline-week`. Default `'#bbb'`
   * matches the parity reference's week-emphasis fallback. Unlike the
   * parity reference (where one CSS var with two fallbacks means
   * setting it collapses the two branches), chronix exposes the
   * regular and week-start colors as independent tokens so consumers
   * can customize week-start emphasis without flattening it.
   */
  readonly gridLineWeekStartColor: string;
  /**
   * Stroke color for horizontal row-bottom lines emitted on
   * `.cx-gantt-grid-hline`. Default `'#ddd'` matches the parity
   * reference's `--gantt-grid-row-rule-color` (which itself falls back
   * to `--gantt-border-color`). Independent from `gridLineColor` so
   * consumers can give vertical and horizontal grid lines different
   * intensities.
   */
  readonly gridLineRowRuleColor: string;
}

/**
 * The chronix-default theme. Every value matches the corresponding
 * literal that was previously hard-coded in `<ChronixGantt>`'s render
 * function — passing `theme={}` (the default) reproduces today's
 * pixel-identical rendering.
 */
export const defaultChronixTheme: ChronixTheme = {
  // Chart
  chartBackground: '#ffffff',

  // Header band
  headerBackground: '#ffffff',
  headerCellFill: '#f9fafb',
  headerCellStroke: '#d1d5db',
  headerCellLabel: '#374151',
  headerTickStroke: '#d1d5db',
  headerTickLabel: '#6b7280',
  headerDivider: '#9ca3af',

  // Progress overlay
  progressFill: '#10b981',
  progressFillOpacity: 0.35,
  progressHandleFill: '#059669',
  progressHandleStroke: '#ffffff',
  progressHandleStrokeWidth: 1,
  progressLabel: '#064e3b',

  // Sidebar
  sidebarBackground: '#ffffff',
  sidebarHeaderCellLabel: '#374151',
  sidebarHeaderCellBorder: '#d1d5db',
  sidebarHeaderDivider: '#9ca3af',
  sidebarBodyCellLabel: '#1f2937',
  sidebarBodyCellBorder: '#e5e7eb',

  // Links
  linkDefaultColor: '#3788d8',
  linkStrokeWidth: 1.5,

  // Typography
  tickLabelFontSize: 10,
  headerCellLabelFontSize: 11,
  sidebarHeaderFontSize: 11,
  sidebarHeaderFontWeight: 600,
  sidebarBodyFontSize: 12,
  progressLabelFontSize: 11,
  progressLabelFontWeight: 600,

  // Bar fill / stroke — match the prior `.cx-gantt-bar` CSS literals
  // byte-for-byte so the no-override render is pixel-identical.
  barBackgroundColor: '#3b82f6',
  barBorderColor: '#1e40af',
  barTextColor: '#ffffff',

  // Today line — Phase 21. Both default to the parity-reference's
  // tomato red so the no-prop-override render matches.
  todayLineColor: '#ff6b6b',
  todayLineTooltipBg: '#ff6b6b',

  // Today cell bg — Phase 22.2. Soft yellow matching the parity-
  // reference's `--gantt-today-bg-color` so the no-prop render is
  // pixel-identical to the upstream demo's today-column tint.
  todayCellBgColor: 'rgba(255, 220, 40, .15)',

  // Toolbar — Phase 22. Match the neutral grayscale palette the
  // surrounding chrome (sidebar, header band) already uses; active
  // button picks up the bar-blue accent so the pressed view is
  // discoverable at a glance.
  toolbarBg: '#ffffff',
  toolbarButtonBg: '#f9fafb',
  toolbarButtonBgActive: '#3b82f6',
  toolbarButtonBorder: '#d1d5db',
  toolbarButtonColor: '#374151',
  toolbarTitleColor: '#111827',

  // Bar text — Phase 28.2. 12px / 400 mirror the parity reference's
  // `<text fontSize='12px' fontWeight='normal'>` defaults on the
  // `.gantt-event-text` element. Per-bar overrides via the font
  // callbacks (no per-prop layer in v0 — theme + callback cover
  // the common cases without inflating the API).
  barFontSize: 12,
  barFontWeight: 400,

  // Grid lines — Phase 26. `#ddd` is the parity reference's
  // `--gantt-border-color` fallback used for both vertical solid cell
  // boundaries and vertical dashed sub-slot dividers + horizontal
  // row-bottom lines; `#bbb` is the week-start emphasis fallback.
  // Independent tokens so consumers can customize each branch
  // without the parity reference's "one var, two fallbacks" quirk.
  gridLineColor: '#ddd',
  gridLineWeekStartColor: '#bbb',
  gridLineRowRuleColor: '#ddd',
};

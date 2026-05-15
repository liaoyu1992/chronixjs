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
};

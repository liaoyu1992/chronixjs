import type { BarSpec, LinkSpec, RowSpec, TimeRange } from '../ir/index.js';
import type { SlotTemplate } from '../render/index.js';
import type { AxisRangePlanInput } from '../layout/types.js';

/** Payload for the `bar-drop` event — fired after a `BarDragTransaction` commits. */
export interface BarDropPayload {
  readonly barId: string;
  readonly oldRange: TimeRange;
  readonly newRange: TimeRange;
  readonly oldRowId: string;
  readonly newRowId: string;
}

/** Payload for the `bar-resize` event — fired after a `BarResizeTransaction` commits. */
export interface BarResizePayload {
  readonly barId: string;
  readonly edge: 'start' | 'end';
  readonly oldRange: TimeRange;
  readonly newRange: TimeRange;
}

/** Payload for the `progress-change` event — fired after a `ProgressHandleTransaction` commits. */
export interface ProgressChangePayload {
  readonly barId: string;
  readonly oldProgress: number;
  readonly newProgress: number;
}

/** Payload for the `bar-click` event. */
export interface BarClickPayload {
  readonly barId: string;
  readonly nativeEvent: MouseEvent;
}

/** Payload for the `select` event — fired after a `CalendarRangeSelectTransaction` commits. */
export interface SelectPayload {
  readonly rowId: string;
  readonly range: TimeRange;
}

/** Payload for the `view-change` event. */
export interface ViewChangePayload {
  readonly view: string;
  readonly date: Date;
}

/** Payload for the `bars-set` event — fired whenever the bar set is replaced or mutated. */
export interface BarsSetPayload {
  readonly bars: readonly BarSpec[];
}

/**
 * Map of event name → payload type. Used by `GanttHandle.subscribe` for
 * type-safe per-event listener signatures.
 */
export interface GanttEventMap {
  'bar-drop': BarDropPayload;
  'bar-resize': BarResizePayload;
  'progress-change': ProgressChangePayload;
  'bar-click': BarClickPayload;
  select: SelectPayload;
  'view-change': ViewChangePayload;
  'bars-set': BarsSetPayload;
  /**
   * Phase 22 toolbar + Phase 24 imperative handle: the canonical
   * controlled-prop emit. Toolbar widget clicks AND
   * `handle.{prev,next,today,gotoDate,incrementDate,changeView,zoomTo}`
   * all funnel through this channel. Consumer wires `v-model:axis-input`
   * to round-trip into a new render. Subscribers via `handle.subscribe`
   * receive the same payload the prop binding does.
   */
  'update:axisInput': AxisRangePlanInput;
}

/**
 * Phase 21: configuration for the vertical "today" line drawn over the
 * timeline. The line renders at the same x-coordinate as a bar whose
 * range started at `Date.now()` — adapter uses the same `pxPerMs` math
 * as `BarPlacementPass` so the line is pixel-aligned with bars starting
 * today.
 *
 * Defaults match the parity reference: red (`#ff6b6b`), 2 px wide,
 * dashed pattern, `'今日'` header tooltip. Every field is optional;
 * supply `todayLine: true` to use all defaults, `todayLine: {...}` for
 * per-field override, `todayLine: false` or omit to hide.
 *
 * "Today" is sampled at adapter render time (no `setTimeout` /
 * visibility-change listener); a chart staying mounted across midnight
 * will not auto-advance the line until the next reactive re-render.
 * Live "now" updates + sub-second indicator markers are deferred —
 * see `audit/PHASE_21_TODAY_LINE_DESIGN.md`.
 */
export interface TodayLineOption {
  /**
   * Stroke color for the body + header `<line>`. Also used as the
   * tooltip background (matching parity-reference behavior where one
   * color drives both). When omitted, falls back to the theme tokens
   * `todayLineColor` (line stroke) and `todayLineTooltipBg` (tooltip
   * fill).
   */
  readonly color?: string;
  /** SVG `stroke-width` in px. Default 2. */
  readonly width?: number;
  /**
   * Stroke pattern. Maps to SVG `stroke-dasharray`:
   * - `'solid'`  → no dasharray
   * - `'dashed'` → `'6 4'`
   * - `'dotted'` → `'2 3'`
   *
   * Default `'dashed'`. Parity reference's `'double'` and `'dashed-dot'`
   * are parked v0 (no clean SVG translation).
   */
  readonly style?: 'solid' | 'dashed' | 'dotted';
  /**
   * Header-band tooltip label text. Default `'今日'`. Pass `''` to
   * suppress the tooltip widget without disabling the line itself.
   */
  readonly tooltip?: string;
}

/**
 * Phase 22.2: configuration for the today-column background tint
 * (parity-reference's `todayBgColor`). Paints a translucent rect
 * spanning the full chart height at today's one-day-slot position
 * — behind the bars, above the chart background. Same x-coordinate
 * math as `TodayLineOption` for pixel-aligned co-rendering with
 * the line.
 *
 * Defaults match the parity-reference: `rgba(255, 220, 40, .15)`
 * (soft yellow). When omitted, falls back to
 * `theme.todayCellBgColor`. Pass `todayCellBg: true` to use all
 * defaults, `todayCellBg: { color: '#abc' }` for a per-mount
 * override, `todayCellBg: false` or omit to hide.
 *
 * Hidden-weekend handling: when `axisInput.weekendsVisible` is false
 * and today falls on a hidden weekend day, the cell tint is
 * suppressed (today's slot position is filtered out of the axis).
 * Matches the same behavior as `TodayLineOption`.
 */
export interface TodayCellBgOption {
  /**
   * Fill color for the today-cell rect. Use an `rgba()` value with
   * low alpha so bars + tick labels remain readable on top. Default
   * `rgba(255, 220, 40, .15)` matches the parity-reference. When
   * omitted, falls back to `theme.todayCellBgColor`.
   */
  readonly color?: string;
}

/**
 * External configuration surface. Users supply this once at mount; adapters
 * forward it into the core. Shape is intentionally similar to common
 * scheduler-library option conventions so existing call sites can migrate
 * with renaming-only changes.
 *
 * v0 surface is minimal. Demo-specific options (`themeOverrides`,
 * `eventStyleCallbacks`, `markerType`, `lineStyle`, `resourceAreaColumns`,
 * etc.) land in v1 when adapter MVPs need them.
 */
export interface GanttOptions {
  /** Initial bar set. Identifier collisions are caller's responsibility. */
  readonly bars: readonly BarSpec[];
  /** Initial row set. */
  readonly rows: readonly RowSpec[];
  /** Initial link set. Empty array if no dependencies. */
  readonly links?: readonly LinkSpec[];

  /** View id to load with. Adapter must register a matching view preset. */
  readonly initialView?: string;
  /** Anchor date for the initial view. ISO 8601 string or Date instance. */
  readonly initialDate?: Date | string;

  /** Allow drag / resize / progress interactions. Default false. */
  readonly editable?: boolean;
  /** Allow calendar range-select to create new bars. Default false. */
  readonly selectable?: boolean;

  /** BCP-47 locale code; affects date formatting and weekday start. */
  readonly locale?: string;

  /** Slot templates, keyed by slot name. Adapter merges with adapter-supplied defaults. */
  readonly slots?: Readonly<Record<string, SlotTemplate>>;

  /**
   * Phase 21: vertical line marking "today" on the timeline. Pass
   * `false` or omit to hide; `true` to enable with all defaults
   * (`#ff6b6b` × 2 px × dashed × `'今日'` tooltip); an object literal
   * for per-field override. See `TodayLineOption` for the resolution
   * cascade with theme tokens.
   */
  readonly todayLine?: TodayLineOption | boolean;

  /** Event callbacks. Equivalent to `GanttHandle.subscribe`, given as options for ergonomic call sites. */
  readonly onBarDrop?: (payload: BarDropPayload) => void;
  readonly onBarResize?: (payload: BarResizePayload) => void;
  readonly onProgressChange?: (payload: ProgressChangePayload) => void;
  readonly onBarClick?: (payload: BarClickPayload) => void;
  readonly onSelect?: (payload: SelectPayload) => void;
  readonly onViewChange?: (payload: ViewChangePayload) => void;
  readonly onBarsSet?: (payload: BarsSetPayload) => void;
}

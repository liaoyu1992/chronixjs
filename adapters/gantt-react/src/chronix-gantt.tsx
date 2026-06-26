import {
  ALL_VIEW_IDS,
  applyIncrement,
  BAR_SLOT_NAME,
  SIDEBAR_DIVIDER_WIDTH,
  clampSidebarWidth,
  computeCellStateMeta,
  computeRowSpans,
  defaultChronixTheme,
  defaultLinkRouter,
  DependencyLineAlgorithm,
  deriveEdgePaddedX,
  deriveViewportClipping,
  formatToolbarTitle,
  getDayClassNames,
  getSlotClassNames,
  HEADER_CELL_SLOT_NAME,
  hitTestFromClient,
  LINK_SLOT_NAME,
  nextAnchor,
  parseToolbar,
  predecessorAnchor,
  prevAnchor,
  resolveBarStyle,
  snapHorizontalGridLineY,
  snapVerticalGridLineX,
  successorAnchor,
  todayAnchor,
  truncateBarText,
  xToTime,
  type AxisHeaderCell,
  type AxisRangePlanInput,
  type AxisTick,
  type BarClassNamesFunc,
  type BarColorFunc,
  type BarFontSizeFunc,
  type BarFontWeightFunc,
  type BarSlotArgs,
  type BarSpec,
  type CellStateMeta,
  type ChronixTheme,
  type ColumnSpec,
  type CustomLinkMarker,
  type EventAllowFunc,
  type EventConstraint,
  type EventOverlapFunc,
  type HeaderCellArg,
  type HeaderCellClassNamesFunc,
  type HeaderCellSlotArgs,
  type LinkMarker,
  type LinkRenderArg,
  type LinkRenderFunc,
  type LinkRouterOutput,
  type LinkSlotArgs,
  type LinkSpec,
  type PlacedBar,
  type ResolvedBarStyle,
  type RoutedLink,
  type RowSpec,
  type SelectAllowFunc,
  type BarTable,
  type GanttEventMap,
  type GanttHandle,
  type IncrementDelta,
  type LinkTable,
  type RowDataSource,
  type SlotRegistry,
  type TimeRange,
  type TodayCellBgOption,
  type TodayLineOption,
  type ToolbarInput,
  type ToolbarModel,
  type ToolbarWidget,
  type ViewId,
} from '@chronixjs/gantt';
import {
  forwardRef,
  Fragment,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

import { useChartScrollState } from './use-chart-scroll-state.js';
import { useGanttLayout } from './use-gantt-layout.js';
import {
  useGanttPointer,
  type BarDragStartCallback,
  type BarDragStopCallback,
  type BarDropPayload,
  type BarDropRejectedPayload,
  type BarProgressPayload,
  type BarResizePayload,
  type BarResizeRejectedPayload,
  type BarResizeStartCallback,
  type BarResizeStopCallback,
  type SelectPayload,
  type SelectRejectedPayload,
} from './use-gantt-pointer.js';
import { useScrollSync } from './use-scroll-sync.js';

import type { BarClickPayload, EmptyAreaClickPayload } from './use-gantt-selection.js';

// Re-export the click payload types so existing consumers importing them
// from `./chronix-gantt.js` (Phase 32.2 surface) keep working — the
// canonical definitions now live in `./use-gantt-selection.js` since
// Phase 32.3 introduced the matching hook. Mirrors vue2's convention
// where the use-gantt-selection composable owns the payload shapes.
export type { BarClickPayload, EmptyAreaClickPayload };

const DEFAULT_HEADER_HEIGHT = 24;
const DEFAULT_HEADER_ROW_HEIGHT = 20;
const SVG_NS = 'http://www.w3.org/2000/svg';
// Phase 32.5.1 — title + dot positioning consumes `deriveEdgePaddedX`
// so the viewport-clipped sub-case (Phase 27.1) lights up alongside
// the axis-clipped sub-case (Phase 27) + default branch. The 4
// per-consumer constants below correspond to the helper's
// `defaultInset` + `consumerGap` parameters (see helper JSDoc table):
//
//   | consumer    | defaultInset       | consumerGap         |
//   | ----------- | ------------------ | ------------------- |
//   | title-left  | TITLE_LEFT_PADDING | TITLE_TRIANGLE_GAP  |
//   | title-right | TITLE_RIGHT_PADDING| TITLE_TRIANGLE_GAP  |
//   | dot-left    | DOT_EDGE_INSET     | DOT_TRIANGLE_GAP    |
//   | dot-right   | DOT_EDGE_INSET     | DOT_TRIANGLE_GAP    |
//
// `DOT_EDGE_INSET = 1` matches the original 1-px inset from
// the bar's geometric edge. `DOT_TRIANGLE_GAP = 2` is the dot-specific
// clearance past the triangle base (vs `TITLE_TRIANGLE_GAP = 4` for
// text); the dot is a 1-px-inset shape not 8-px-inset text so it sits
// 2 px tighter to the triangle than the title.
const DOT_EDGE_INSET = 1;
const DOT_TRIANGLE_GAP = 2;
// `TRIANGLE_SIZE` is the half-base, so total base height is 12 px and
// apex-to-base distance is 6 px. `TRIANGLE_MARGIN` insets the apex from
// the bar's edge by 1 px so the indicator doesn't visually merge with
// the bar's border stroke. Default title pads: `bar.x + TITLE_LEFT_PADDING
// = bar.x + 8` (left) / `bar.x + width - TITLE_RIGHT_PADDING = bar.x +
// width - 4` (right). Axis-clipped + viewport-clipped formulas live in
// `deriveEdgePaddedX`.
const TRIANGLE_SIZE = 6;
const TRIANGLE_MARGIN = 1;
const TITLE_LEFT_PADDING = 8;
const TITLE_RIGHT_PADDING = 4;
const TITLE_TRIANGLE_GAP = 4;

// Phase 49 — `ColumnSpec` interface + `computeRowSpans` helper moved
// to `@chronixjs/gantt` core (Decision B.2). Imported at the top of
// this module from `@chronixjs/gantt`; re-exported from
// `adapters/gantt-react/src/index.ts` so consumer-facing
// `import { ColumnSpec } from '@chronixjs/gantt-react'` continues to
// resolve via the Phase 38 re-export idiom.

/**
 * Phase 32.4.1 (Phase 28.3 in chronix-vue3 / Phase 31.4.1 in chronix-vue2):
 * encode a color string into the suffix used in marker ids. Strips
 * non-alphanumeric so `'#3788d8'` → `'3788d8'`, `'rgb(255, 0, 0)'` →
 * `'rgb25500'`. Matches vue2/vue3 encoding so cross-adapter consumers
 * keyed on the marker id format see the same scheme.
 */
function markerColorId(color: string): string {
  return color.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Phase 32.4.1: the 7 built-in marker shapes. Excludes `'none'` (which
 * suppresses the marker-end attribute entirely rather than emitting a
 * def). Ordering matches vue2/vue3 verbatim so the defs aggregator
 * emits markers in identical order.
 */
const BUILTIN_MARKER_TYPES = [
  'arrow',
  'diamond',
  'diamond-hollow',
  'circle',
  'circle-hollow',
  'pointer',
  'plus',
] as const;

type BuiltinMarkerType = (typeof BUILTIN_MARKER_TYPES)[number];

/**
 * Phase 32.4.1: render one built-in `<marker>` def as a React element.
 * Geometry ports verbatim from vue2/vue3 (which themselves port verbatim
 * from the original spec); width / height fixed at 4.5;
 * `markerUnits="strokeWidth"` scales with stroke; `overflow="visible"`
 * keeps the shape from being clipped at its bounding box.
 */
function renderBuiltinMarker(
  type: BuiltinMarkerType,
  color: string,
  colorId: string,
): ReactElement {
  const id = `cx-marker-${type}-${colorId}`;
  switch (type) {
    case 'arrow':
      return (
        <marker
          key={id}
          id={id}
          markerWidth={4.5}
          markerHeight={4.5}
          markerUnits="strokeWidth"
          overflow="visible"
          refX={4}
          refY={2.25}
          orient="auto"
        >
          <polygon points="0 0, 4.5 2.25, 0 4.5" fill={color} />
        </marker>
      );
    case 'diamond':
      return (
        <marker
          key={id}
          id={id}
          markerWidth={4.5}
          markerHeight={4.5}
          markerUnits="strokeWidth"
          overflow="visible"
          refX={4.5}
          refY={2.5}
          orient="auto"
        >
          <polygon points="0 2.5, 2.5 0, 5 2.5, 2.5 5" fill={color} />
        </marker>
      );
    case 'diamond-hollow':
      return (
        <marker
          key={id}
          id={id}
          markerWidth={4.5}
          markerHeight={4.5}
          markerUnits="strokeWidth"
          overflow="visible"
          refX={4.5}
          refY={2.5}
          orient="auto"
        >
          <polygon
            points="0 2.5, 2.5 0, 5 2.5, 2.5 5"
            fill="white"
            stroke={color}
            strokeWidth={1.0}
          />
        </marker>
      );
    case 'circle':
      return (
        <marker
          key={id}
          id={id}
          markerWidth={4.5}
          markerHeight={4.5}
          markerUnits="strokeWidth"
          overflow="visible"
          refX={5}
          refY={3}
        >
          <circle cx={3} cy={3} r={2.0} fill={color} />
        </marker>
      );
    case 'circle-hollow':
      return (
        <marker
          key={id}
          id={id}
          markerWidth={4.5}
          markerHeight={4.5}
          markerUnits="strokeWidth"
          overflow="visible"
          refX={5.75}
          refY={3}
        >
          <circle cx={3} cy={3} r={2.0} fill="white" stroke={color} strokeWidth={1.5} />
        </marker>
      );
    case 'pointer':
      return (
        <marker
          key={id}
          id={id}
          markerWidth={4.5}
          markerHeight={4.5}
          markerUnits="strokeWidth"
          overflow="visible"
          refX={5}
          refY={2.5}
          orient="auto"
        >
          <polygon points="0 0, 6 2.5, 0 5, 1.5 2.5" fill={color} />
        </marker>
      );
    case 'plus':
      return (
        <marker
          key={id}
          id={id}
          markerWidth={4.5}
          markerHeight={4.5}
          markerUnits="strokeWidth"
          overflow="visible"
          refX={4}
          refY={2.5}
          orient="auto"
        >
          <path
            d="M 2.5 0.5 L 2.5 2 L 4 2 L 4 3 L 2.5 3 L 2.5 4.5 L 1.5 4.5 L 1.5 3 L 0 3 L 0 2 L 1.5 2 L 1.5 0.5 Z"
            fill={color}
          />
        </marker>
      );
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown built-in marker type: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Phase 32.4.1: render a user-defined `<marker>` def. The custom marker is
 * positioned at its viewBox origin and emits one child per `paths` entry.
 * v0 uses the same `refX=4`, `refY=2.25`, `orient='auto'` as the built-in
 * arrow — consumers who need a different refX can wrap the custom marker's
 * paths to embed offsets. Marker id matches the built-in scheme so
 * `marker-end` URL resolution is uniform.
 */
function renderCustomMarker(
  marker: CustomLinkMarker,
  color: string,
  colorId: string,
): ReactElement {
  const id = `cx-marker-${marker.id}-${colorId}`;
  return (
    <marker
      key={id}
      id={id}
      viewBox={marker.viewBox}
      markerWidth={4.5}
      markerHeight={4.5}
      markerUnits="strokeWidth"
      overflow="visible"
      refX={4}
      refY={2.25}
      orient="auto"
    >
      {marker.paths.map((p, i) => (
        <path
          key={`${id}-p${i}`}
          d={p.d}
          fill={p.fill ?? color}
          stroke={p.stroke ?? 'none'}
          {...(p.strokeWidth !== undefined ? { strokeWidth: p.strokeWidth } : {})}
        />
      ))}
    </marker>
  );
}

/**
 * Phase 32.4.1: resolve a link's `marker-end` URL for a given color.
 * Returns `null` for `'none'` so the caller omits the `marker-end`
 * attribute entirely (an empty `url(...)` reference would suppress
 * strokes in some browsers).
 */
function markerEndUrl(marker: LinkMarker | CustomLinkMarker, color: string): string | null {
  if (marker === 'none') return null;
  const colorId = markerColorId(color);
  const markerKey = typeof marker === 'string' ? marker : marker.id;
  return `url(#cx-marker-${markerKey}-${colorId})`;
}

export interface ChronixGanttProps {
  readonly bars: readonly BarSpec[];
  readonly rows: readonly RowSpec[];
  readonly axisInput: AxisRangePlanInput;
  // Phase 52 — geometry prop surface alignment with chronix-vue3 +
  // chronix-vue2. 4 layout props threaded through to `useGanttLayout`
  // + 2 pointer props threaded through to `useGanttPointer`. Defaults
  // match the core hook defaults so omitting them is bit-for-bit
  // identical to the pre-Phase-52 behavior.
  /** Fixed bar height in pixels. Default 30. */
  readonly barHeight?: number;
  /** Top padding between strip top and bar top. Default 4. */
  readonly barVerticalPadding?: number;
  /** Inter-row gap in pixels (CSS row-divider border). Default 1. */
  readonly rowSpacing?: number;
  /** Default row height for rows whose computed height-hint is undefined. Default 38. */
  readonly defaultRowHeight?: number;
  /** Hit-rect size for the progress handle in pixels. Default 12. */
  readonly progressHandleSize?: number;
  /** Snap drag/resize/select time-delta to this multiple of ms. Default 0 (no snap). */
  readonly snapDurationMs?: number;
  /**
   * Phase 48 — sidebar column descriptors. Supplying a non-empty
   * `columns` array switches the wrapper from the 1-column (chart-
   * only) layout to a 2-column grid (sidebar + chart) matching
   * chronix-vue3. Each column contributes additively to the
   * sidebar's pixel width; columns flagged `group: true` collapse
   * consecutive same-value rows into one cell via the
   * `computeRowSpans` rowspan matrix. Omit (or pass an empty
   * array) to keep the pre-Phase-48 2-pane DOM shape.
   */
  readonly columns?: readonly ColumnSpec[];
  /** Tick row height in pixels. Default 24. */
  readonly headerHeight?: number;
  /** Each outer header band row height in pixels. Default 20. */
  readonly headerRowHeight?: number;
  /** Allow bar drag + edge resize. Default false. */
  readonly editable?: boolean;
  /**
   * Phase 54 — fine-grained drag gate. When `editable` is true, setting
   * this to `false` disables the bar-drag transaction while keeping
   * edge-resize available. Default `true`. Mirrors the parity
   * reference's `eventStartEditable`.
   */
  readonly eventStartEditable?: boolean;
  /**
   * Phase 54 — fine-grained resize gate. When `editable` is true,
   * setting this to `false` disables the edge-resize transaction while
   * keeping bar-drag available. Default `true`. Mirrors the parity
   * reference's `eventDurationEditable`.
   */
  readonly eventDurationEditable?: boolean;
  /** Allow calendar range-select on empty rows. Default false. */
  readonly selectable?: boolean;
  // Phase 32.3 — theme prop. Partial override merged on top of
  // `defaultChronixTheme`; threaded through every inline attribute read.
  readonly theme?: Partial<ChronixTheme>;
  // Phase 32.3 — slot registry. Consulted at BAR_SLOT_NAME +
  // HEADER_CELL_SLOT_NAME render sites; LINK_SLOT_NAME defers to Phase 32.4.
  readonly slotRegistry?: SlotRegistry;
  // Phase 32.3 — controlled selection state. Drives `cx-gantt-bar--selected`
  // class, selection-border rect, resizer zones (when editable), and white
  // dot handles (when selected && editable). State management is
  // consumer-owned; use `useGanttSelection` for the standard pattern.
  readonly selectedBarIds?: readonly string[];
  // Phase 32.4 — Phase 20 bar-color cascade. 4 component-prop overrides
  // + 5 per-bar callbacks running through `resolveBarStyle` (theme →
  // component prop → `BarSpec.style` → callback) per render pass.
  // `barColor` is the umbrella supplying both background + border at the
  // prop layer; specific overrides (`barBackgroundColor` / `barBorderColor`)
  // win when also set. Callbacks run AFTER theme + prop + spec layers.
  // The default bar `<rect>` and `BarSlotArgs.resolved*` slot fields both
  // read the cascade output.
  readonly barColor?: string;
  readonly barBackgroundColor?: string;
  readonly barBorderColor?: string;
  readonly barTextColor?: string;
  readonly barBackgroundColorCallback?: BarColorFunc;
  readonly barBorderColorCallback?: BarColorFunc;
  readonly barTextColorCallback?: BarColorFunc;
  readonly barFontSizeCallback?: BarFontSizeFunc;
  readonly barFontWeightCallback?: BarFontWeightFunc;
  readonly barClassNamesCallback?: BarClassNamesFunc;
  // Phase 32.4.1 — dependency-link rendering. `links` provides the
  // chart-level link list (router runs over them + `placedBars`).
  // `useLineEventColor: true` makes each link inherit its source bar's
  // resolved background color (Phase 20 cascade output) via the
  // render-pass-local `barColorByBarId` map. `onLineCallback` is the
  // Phase 28.3 per-link override hook running AFTER the cascade.
  // `onLinkOrphan` fires per occurrence when a link references a
  // missing bar (callback always; console.warn once per id per
  // component-instance lifetime).
  readonly links?: readonly LinkSpec[];
  readonly useLineEventColor?: boolean;
  readonly onLineCallback?: LinkRenderFunc;
  readonly onLinkOrphan?: (orphanLinkId: string) => void;
  // Phase 32.4.2 — today line. `false` / omitted hides the line.
  // `true` enables with all theme-token defaults. Object literal
  // overrides per-field. Cascade per knob:
  //   - stroke color: `config.color ?? theme.todayLineColor`
  //   - tooltip bg: `config.color ?? theme.todayLineTooltipBg`
  //     (single-knob — `config.color` overrides BOTH; theme tokens
  //     stay independent defaults)
  //   - stroke style: `config.style ?? 'dashed'` → dasharray
  //     mapping (`'solid'` → undefined; `'dashed'` → `'6 4'`;
  //     `'dotted'` → `'2 3'`)
  //   - stroke width: `config.width ?? 2`
  //   - tooltip label: `config.tooltip ?? '今日'` (empty string
  //     suppresses tooltip widget without disabling the line)
  // `Date.now()` sampled at render time — no setInterval keeps it
  // live across midnight.
  readonly todayLine?: TodayLineOption | boolean;
  // Phase 32.5 — dual-scrollport `maxBodyHeight`. Passes through to the
  // `cx-gantt-chart-pane` div's `style.maxHeight`. When undefined
  // (default), grid-row 2 = CSS `auto` → row grows to content height →
  // no vertical scrollbar engages → pre-32.5 consumers see identical
  // visual output. When set (e.g. `'400px'`), row 2 caps + vertical
  // scrollbar engages on overflow.
  readonly maxBodyHeight?: string;
  // Phase 41 — Phase 22.2 todayCellBg parity prop. `false` or omitted =
  // hide (default); `true` = enable with theme default
  // (`theme.todayCellBgColor`); an object literal with `color` overrides
  // the default. Renders a `<rect class="cx-gantt-today-cell">` in body
  // + header SVGs spanning today's one-day slot. Pixel-aligned with the
  // bars (reuses the same `(t - axisStart) × pxPerMs` math).
  readonly todayCellBg?: TodayCellBgOption | boolean;
  // Phase 41 — Phase 29 headerCellClassNamesCallback parity prop.
  // Fires once per rendered header cell (outer band cells AND tick-row
  // labels); returned classes append to the cell's primary element. Use
  // for state-driven CSS hooks (weekend tinting, holiday markers, etc.).
  // For full cell-content replacement, register a template under the
  // `'header-cell'` slot via `slotRegistry`.
  readonly headerCellClassNamesCallback?: HeaderCellClassNamesFunc;
  // Phase 41 — Phase 25 pointerMinDistance parity prop. Pythagorean
  // pixel threshold the pointer must travel from pointerdown before a
  // bar-drag / resize / progress-handle / range-select transaction
  // commits. Default 5 px (matches vue3 + vue2 default). Pass 0 to
  // disable the gate so any non-zero delta commits immediately.
  readonly pointerMinDistance?: number;
  // Commit callbacks
  readonly onBarDrop?: (payload: BarDropPayload) => void;
  readonly onBarResize?: (payload: BarResizePayload) => void;
  readonly onBarProgress?: (payload: BarProgressPayload) => void;
  readonly onSelect?: (payload: SelectPayload) => void;
  // Phase 16 lifecycle callbacks
  readonly onBarDragStart?: (payload: BarDragStartCallback) => void;
  readonly onBarDragStop?: (payload: BarDragStopCallback) => void;
  readonly onBarResizeStart?: (payload: BarResizeStartCallback) => void;
  readonly onBarResizeStop?: (payload: BarResizeStopCallback) => void;
  // Phase 12 click callbacks
  readonly onBarClick?: (payload: BarClickPayload) => void;
  readonly onEmptyAreaClick?: (payload: EmptyAreaClickPayload) => void;
  // Phase 54 — bar hover callbacks (delegated handlers on the cx-gantt-
  // bars group). Suppress during an active transaction. Mirror the
  // original `eventMouseEnter` / `eventMouseLeave` options.
  readonly onBarMouseenter?: (payload: BarClickPayload) => void;
  readonly onBarMouseleave?: (payload: BarClickPayload) => void;
  // Phase 19 validator predicates (drag / resize / select commits run
  // through these before firing the success callback; returning `false`
  // veto-aborts and fires the rejection callback instead).
  readonly eventAllow?: EventAllowFunc;
  readonly selectAllow?: SelectAllowFunc;
  readonly eventOverlap?: boolean | EventOverlapFunc;
  readonly eventConstraint?: EventConstraint;
  // Phase 55: independent select-side overlap / constraint (fall back
  // to event* siblings when unset).
  readonly selectOverlap?: boolean | EventOverlapFunc;
  readonly selectConstraint?: EventConstraint;
  // Phase 19 rejection callbacks
  readonly onBarDropRejected?: (payload: BarDropRejectedPayload) => void;
  readonly onBarResizeRejected?: (payload: BarResizeRejectedPayload) => void;
  readonly onSelectRejected?: (payload: SelectRejectedPayload) => void;

  /**
   * Phase 33 — controlled-prop round-trip channel for the imperative
   * `GanttHandle`'s axis-mutating methods (`changeView` / `prev` /
   * `next` / `today` / `gotoDate` / `incrementDate` / `zoomTo`). The
   * handle method computes the new `AxisRangePlanInput` and fires
   * this callback; the consumer is expected to feed the value back
   * via the `axisInput` prop on the next render. Mirrors vue3's
   * `update:axisInput` emit + vue2's `update:axis-input` v-model
   * semantics in React's controlled-prop idiom.
   *
   * Also fired by Phase 34's header-toolbar view/nav buttons —
   * clicking a view button or `prev` / `next` / `today` dispatches
   * through the same `emit('update:axisInput', ...)` pathway so a
   * single consumer-side handler closes the loop for both imperative
   * and declarative drivers.
   */
  readonly onAxisInputChange?: (next: AxisRangePlanInput) => void;

  /**
   * Phase 34 — header toolbar configuration. Accepts the chronix
   * 3-section string DSL (`{ left, center, right }` or
   * `{ start, center, end }`) or `false` (default-omit) to hide the
   * toolbar. Widget names: `'title'`, any of the six `ViewId`s, and
   * `'prev'` / `'next'` / `'today'`. View buttons fire
   * `onAxisInputChange` with a new `viewId`; nav buttons fire with a
   * new `anchorDate`. Wire the controlled-prop loop via `axisInput`
   * + `onAxisInputChange` to pick up both.
   *
   * When omitted or `false`, no toolbar renders and the
   * `<div className="cx-gantt-wrapper">` stays the immediate render
   * root (pre-Phase-34 DOM-shape preserved). When configured, the
   * wrapper is nested inside a `<div className="cx-gantt-root">`
   * alongside the toolbar.
   */
  readonly headerToolbar?: ToolbarInput | false;
}

/**
 * Phase 32.3 `<ChronixGantt>` for React 18: composes the `useGanttLayout`
 * hook (Phase 32.1) + `useGanttPointer` hook (Phase 32.2) and wires
 * 4 pointer event handlers on the body SVG with native
 * `setPointerCapture` lifecycle. Emits 11 callback props (4 commit +
 * 4 lifecycle + 2 click + handle) + 7 Phase 19 props (4 validator + 3
 * rejection callbacks). Phase 32.3 adds three customization surfaces:
 * `theme` (Partial<ChronixTheme> merged onto defaults), `slotRegistry`
 * (BAR + HEADER_CELL templates), and controlled `selectedBarIds` with
 * selection-border + resizer-zone + dot-handle visual feedback.
 *
 * Deferred to Phase 32.4+: Phase 20 bar-color cascade / continuation
 * triangles / bar text / LINK_SLOT_NAME / dual-scrollport /
 * viewport-aware lighting / toolbar / handle.
 */
export const ChronixGantt = forwardRef<GanttHandle, ChronixGanttProps>(function ChronixGanttRender(
  {
    bars,
    rows,
    axisInput,
    columns,
    headerHeight = DEFAULT_HEADER_HEIGHT,
    headerRowHeight = DEFAULT_HEADER_ROW_HEIGHT,
    editable = false,
    selectable = false,
    theme: themeProp,
    slotRegistry,
    selectedBarIds,
    barColor,
    barBackgroundColor,
    barBorderColor,
    barTextColor,
    barBackgroundColorCallback,
    barBorderColorCallback,
    barTextColorCallback,
    barFontSizeCallback,
    barFontWeightCallback,
    barClassNamesCallback,
    links,
    useLineEventColor,
    onLineCallback,
    onLinkOrphan,
    todayLine,
    maxBodyHeight,
    todayCellBg,
    headerCellClassNamesCallback,
    pointerMinDistance,
    // Phase 52 — geometry prop surface alignment with chronix-vue3 +
    // chronix-vue2. Defaults preserved at the hook layer; the props
    // are pure pass-throughs.
    barHeight,
    barVerticalPadding,
    rowSpacing,
    defaultRowHeight,
    progressHandleSize,
    snapDurationMs,
    // Phase 54 — fine-grained drag/resize gates + hover callbacks.
    eventStartEditable,
    eventDurationEditable,
    onBarMouseenter,
    onBarMouseleave,
    onBarDrop,
    onBarResize,
    onBarProgress,
    onSelect,
    onBarDragStart,
    onBarDragStop,
    onBarResizeStart,
    onBarResizeStop,
    onBarClick,
    onEmptyAreaClick,
    eventAllow,
    selectAllow,
    eventOverlap,
    eventConstraint,
    selectOverlap,
    selectConstraint,
    onBarDropRejected,
    onBarResizeRejected,
    onSelectRejected,
    onAxisInputChange,
    headerToolbar,
  },
  ref,
) {
  // Phase 33 — listener registry for `handle.subscribe()`. Per-FC-
  // instance Map<event-name, Set<Listener>> stored in useRef so it
  // outlives renders without triggering re-renders. The internal
  // `emit()` closure below fires BOTH the matching callback prop
  // AND iterates registered listeners (callback ALWAYS fires;
  // subscribers ALSO fire if registered). Mirrors vue3's
  // `emitToBoth` pattern translated to React idiom.
  type EmitListener = (payload: unknown) => void;
  const listenerRegistry = useRef<Map<string, Set<EmitListener>>>(new Map());
  // Use a ref to expose the latest callback props to `emit()` without
  // having to thread them through closures — emit() is constructed
  // once per render but the matching prop reference may change between
  // renders (especially inline arrow consumers).
  const propsRef = useRef({
    onBarDrop,
    onBarResize,
    onBarProgress,
    onSelect,
    onBarDragStart,
    onBarDragStop,
    onBarResizeStart,
    onBarResizeStop,
    onBarClick,
    onEmptyAreaClick,
    onBarMouseenter,
    onBarMouseleave,
    onBarDropRejected,
    onBarResizeRejected,
    onSelectRejected,
    onLinkOrphan,
    onAxisInputChange,
  });
  propsRef.current = {
    onBarDrop,
    onBarResize,
    onBarProgress,
    onSelect,
    onBarDragStart,
    onBarDragStop,
    onBarResizeStart,
    onBarResizeStop,
    onBarClick,
    onEmptyAreaClick,
    onBarMouseenter,
    onBarMouseleave,
    onBarDropRejected,
    onBarResizeRejected,
    onSelectRejected,
    onLinkOrphan,
    onAxisInputChange,
  };
  function emit<K extends string>(event: K, payload: unknown): void {
    // Fire the matching prop callback (typed dispatch table — explicit
    // mapping keeps the surface auditable + preserves payload-type
    // narrowing at each call site).
    const p = propsRef.current;
    switch (event) {
      case 'bar-drop':
        p.onBarDrop?.(payload as BarDropPayload);
        break;
      case 'bar-resize':
        p.onBarResize?.(payload as BarResizePayload);
        break;
      case 'bar-progress':
        p.onBarProgress?.(payload as BarProgressPayload);
        break;
      case 'select':
        p.onSelect?.(payload as SelectPayload);
        break;
      case 'bar-dragstart':
        p.onBarDragStart?.(payload as BarDragStartCallback);
        break;
      case 'bar-dragstop':
        p.onBarDragStop?.(payload as BarDragStopCallback);
        break;
      case 'bar-resizestart':
        p.onBarResizeStart?.(payload as BarResizeStartCallback);
        break;
      case 'bar-resizestop':
        p.onBarResizeStop?.(payload as BarResizeStopCallback);
        break;
      case 'bar-click':
        p.onBarClick?.(payload as BarClickPayload);
        break;
      case 'empty-area-click':
        p.onEmptyAreaClick?.(payload as EmptyAreaClickPayload);
        break;
      // Phase 54 — bar hover dispatch.
      case 'bar-mouseenter':
        p.onBarMouseenter?.(payload as BarClickPayload);
        break;
      case 'bar-mouseleave':
        p.onBarMouseleave?.(payload as BarClickPayload);
        break;
      case 'bar-drop-rejected':
        p.onBarDropRejected?.(payload as BarDropRejectedPayload);
        break;
      case 'bar-resize-rejected':
        p.onBarResizeRejected?.(payload as BarResizeRejectedPayload);
        break;
      case 'select-rejected':
        p.onSelectRejected?.(payload as SelectRejectedPayload);
        break;
      case 'link-orphan':
        p.onLinkOrphan?.(payload as string);
        break;
      case 'update:axisInput':
        p.onAxisInputChange?.(payload as AxisRangePlanInput);
        break;
      default:
        break;
    }
    // Dispatch to any registered subscribers.
    const set = listenerRegistry.current.get(event);
    if (set) {
      for (const listener of set) {
        listener(payload);
      }
    }
  }

  const { axis, strips, placedBars, contentSize } = useGanttLayout({
    bars,
    rows,
    axisInput,
    // Phase 52 — geometry prop surface alignment. Conditional-spread
    // each optional prop so `exactOptionalPropertyTypes` doesn't reject
    // explicit-undefined; the layout hook falls back to its own defaults
    // when the prop is omitted (omitted ≡ undefined ≡ unspecified).
    ...(barHeight !== undefined ? { barHeight } : {}),
    ...(barVerticalPadding !== undefined ? { barVerticalPadding } : {}),
    ...(rowSpacing !== undefined ? { rowSpacing } : {}),
    ...(defaultRowHeight !== undefined ? { defaultRowHeight } : {}),
  });

  // Phase 32.3 — merged theme. `useMemo` keys on the `theme` prop's
  // identity so consumers who stabilize their theme (via their own
  // `useMemo`) get a stable merged object across re-renders. Inline
  // `theme={{ ... }}` literals still work (new identity per render → new
  // merge) but downstream `BarSlotArgs.theme` then churns per render.
  const t = useMemo<ChronixTheme>(
    () => ({ ...defaultChronixTheme, ...(themeProp ?? {}) }),
    [themeProp],
  );

  // Phase 32.3 — O(1) per-bar selected-lookup. Rebuilt only when the
  // `selectedBarIds` prop identity changes; the per-bar render loop reads
  // `.has(bar.barId)` once per iteration.
  const selectedBarSet = useMemo(() => new Set(selectedBarIds ?? []), [selectedBarIds]);

  // Phase 32.4.1 — route dependency links through the layout pass.
  // Re-derives when `links` or `placedBars` change (drag / resize /
  // view-switch). Orphans (a link referencing a bar id not in
  // `placedBars`) drop from the rendered output here — keeps the
  // render function pure. Orphan-id callback + console.warn live in a
  // separate `useEffect` below so side-effects run AFTER commit, not
  // during render (Phase 32.2 ratified — no side-effects in render).
  const routerOutput = useMemo<LinkRouterOutput>(
    () => defaultLinkRouter.route({ links: links ?? [], placedBars }),
    [links, placedBars],
  );

  // Phase 32.4.2 — today line resolved state. Returns `null` when prop
  // is `false`/`undefined`, when axis has 0 ticks (degenerate empty
  // fixture), or when today's x-coordinate falls outside the axis
  // range (anchorDate well before/after today). Otherwise returns the
  // rendered config carrying x / color / tooltipBg / width / dasharray /
  // tooltip. Single-knob cascade: `config.color` overrides BOTH stroke
  // and tooltip background (Decision A.1).
  const resolvedTodayLine = useMemo<{
    x: number;
    color: string;
    tooltipBg: string;
    width: number;
    dasharray: string | undefined;
    tooltip: string;
  } | null>(() => {
    if (todayLine === false || todayLine === undefined) return null;
    const config: TodayLineOption = todayLine === true ? {} : todayLine;
    if (axis.ticks.length === 0) return null;
    const axisStartMs = axis.ticks[0]!.time.getTime();
    const pxPerMs = axis.slotWidth / axis.slotDurationMs;
    const todayX = (Date.now() - axisStartMs) * pxPerMs;
    if (todayX < 0 || todayX > axis.totalWidth) return null;
    const color = config.color ?? t.todayLineColor;
    const tooltipBg = config.color ?? t.todayLineTooltipBg;
    const styleName = config.style ?? 'dashed';
    const dasharray: string | undefined =
      styleName === 'solid' ? undefined : styleName === 'dashed' ? '6 4' : '2 3';
    return {
      x: todayX,
      color,
      tooltipBg,
      width: config.width ?? 2,
      dasharray,
      tooltip: config.tooltip ?? '今日',
    };
  }, [todayLine, axis, t]);

  // Phase 41 — Phase 22.2 todayCellBg geometry. Same shape as vue3
  // resolvedTodayCellBg: derive today-cell x/width from axis-start +
  // today-midnight + slotDurationMs math; clip to axis bounds.
  // Returns null when the prop is off OR today is outside the visible
  // axis range.
  const resolvedTodayCellBg = useMemo<{
    x: number;
    width: number;
    color: string;
  } | null>(() => {
    if (todayCellBg === false || todayCellBg === undefined) return null;
    const config: TodayCellBgOption = todayCellBg === true ? {} : todayCellBg;
    if (axis.ticks.length === 0) return null;
    const axisStartMs = axis.ticks[0]!.time.getTime();
    const pxPerMs = axis.slotWidth / axis.slotDurationMs;
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const tm = new Date();
    tm.setHours(0, 0, 0, 0);
    const todayMidnightMs = tm.getTime();
    const cellStartX = (todayMidnightMs - axisStartMs) * pxPerMs;
    const cellWidth = MS_PER_DAY * pxPerMs;
    if (cellStartX + cellWidth <= 0 || cellStartX >= axis.totalWidth) return null;
    const x = Math.max(0, cellStartX);
    const width = Math.min(cellStartX + cellWidth, axis.totalWidth) - x;
    const color = config.color ?? t.todayCellBgColor;
    return { x, width, color };
  }, [todayCellBg, axis, t]);

  // Phase 41 — Phase 29 headerCellClassNamesCallback normalizer.
  // Returns a stable empty array when the callback is unset or returns
  // undefined. Returned string is wrapped to array; arrays pass
  // through. Caller concatenates onto the cell's primary className.
  const callHeaderCellClassNames = (arg: HeaderCellArg): readonly string[] => {
    if (!headerCellClassNamesCallback) return [];
    const raw = headerCellClassNamesCallback(arg);
    if (raw === undefined) return [];
    return typeof raw === 'string' ? [raw] : raw;
  };

  // Phase 41 — Phase 29 per-cell day-meta derivation helpers. Mirror
  // vue3 lines 1525-1564. `todayStart` is sampled once per render so
  // all classes agree on which calendar day is "today". The band-cell
  // helper checks if the cell spans EXACTLY ONE calendar day via
  // floating-point-tolerant equality on `cellSpanMs ≈ MS_PER_DAY`; the
  // tick-cell helper short-circuits on whether the view's
  // `slotDurationMs ≥ MS_PER_DAY` (true for month/season/halfYear/year
  // views; false for day/week).
  const HEADER_MS_PER_DAY = 24 * 60 * 60 * 1000;
  const headerTodayStart = new Date();
  headerTodayStart.setHours(0, 0, 0, 0);
  const headerAxisStartMs = axis.ticks[0]?.time.getTime() ?? 0;
  const headerMsPerCellX = axis.slotWidth > 0 ? axis.slotDurationMs / axis.slotWidth : 0;
  const tickIsDayEligible = axis.slotDurationMs >= HEADER_MS_PER_DAY;
  const deriveBandCellMeta = (
    cell: AxisHeaderCell,
  ): {
    date: Date | undefined;
    dayMeta: CellStateMeta | undefined;
  } => {
    if (headerMsPerCellX === 0) return { date: undefined, dayMeta: undefined };
    const date = new Date(headerAxisStartMs + cell.x * headerMsPerCellX);
    const cellSpanMs = cell.width * headerMsPerCellX;
    const isOneDay = Math.abs(cellSpanMs - HEADER_MS_PER_DAY) < 1;
    const dayMeta = isOneDay ? computeCellStateMeta(date, headerTodayStart) : undefined;
    return { date, dayMeta };
  };
  const deriveTickMeta = (tick: AxisTick): CellStateMeta | undefined => {
    return tickIsDayEligible ? computeCellStateMeta(tick.time, headerTodayStart) : undefined;
  };

  // Phase 32.4.1 — orphan tracking. Ref-stable across renders so the
  // warn-once semantic holds for the component instance lifetime. The
  // callback fires for every orphan in every router pass (mirrors
  // vue2/vue3 emit semantics); console.warn fires once per id (mirrors
  // vue3's dedup) so drag-induced re-derives don't spam.
  const warnedOrphanIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const orphanId of routerOutput.orphanLinkIds) {
      emit('link-orphan', orphanId);
      if (!warnedOrphanIdsRef.current.has(orphanId)) {
        warnedOrphanIdsRef.current.add(orphanId);

        console.warn(
          `[chronix] Link "${orphanId}" references unknown bar(s); dropped from render.`,
        );
      }
    }
  }, [routerOutput, onLinkOrphan]);

  // Derive bar lookup maps for the pointer hook. Rebuilt only when
  // `bars` prop identity changes; pointer hook uses them as the
  // commit-time `originalRange` source + cross-row drag's `oldRowId`.
  const barRanges = useMemo<ReadonlyMap<string, TimeRange>>(
    () => new Map(bars.map((bar) => [bar.id, bar.range])),
    [bars],
  );
  const barRowIds = useMemo<ReadonlyMap<string, string>>(
    () => new Map(bars.map((bar) => [bar.id, bar.rowId])),
    [bars],
  );
  // Phase 53: progress maps for the pointer hook's progress-handle
  // hit-test + the per-bar progress overlay render below. `barProgressById`
  // captures the persisted progress value per bar (used as the displayed
  // value when no active progress-handle drag is in flight). `overlayIdByBarId`
  // captures the bar's `pointerOverlayId` (gates progress-handle render +
  // hit-test together). Both maps rebuild only on `bars` identity change;
  // bars without `progress.value` or `pointerOverlayId` are absent from
  // the corresponding map.
  const barProgressById = useMemo<ReadonlyMap<string, number>>(() => {
    const m = new Map<string, number>();
    for (const b of bars) {
      if (b.progress?.value !== undefined) m.set(b.id, b.progress.value);
    }
    return m;
  }, [bars]);
  const overlayIdByBarId = useMemo<ReadonlyMap<string, string>>(() => {
    const m = new Map<string, string>();
    for (const b of bars) {
      if (b.pointerOverlayId !== undefined) m.set(b.id, b.pointerOverlayId);
    }
    return m;
  }, [bars]);

  const pointer = useGanttPointer({
    placedBars,
    strips,
    axis,
    barRanges,
    barRowIds,
    editable,
    selectable,
    // Phase 41 — thread the prop so consumers can override the 5px
    // default (e.g. `pointerMinDistance={0}` disables the gate for
    // tests / touch-friendly UIs). Conditional-spread because
    // exactOptionalPropertyTypes rejects an explicit `undefined`.
    ...(pointerMinDistance !== undefined ? { pointerMinDistance } : {}),
    // Phase 52 — geometry prop surface alignment with chronix-vue3 +
    // chronix-vue2. Conditional-spread per `exactOptionalPropertyTypes`.
    ...(progressHandleSize !== undefined ? { progressHandleSize } : {}),
    ...(snapDurationMs !== undefined ? { snapDurationMs } : {}),
    // Phase 54 — fine-grained drag/resize gates. Defaults preserved
    // at the hook layer; the props are pure pass-throughs.
    ...(eventStartEditable !== undefined ? { eventStartEditable } : {}),
    ...(eventDurationEditable !== undefined ? { eventDurationEditable } : {}),
    // Phase 53 — thread progress maps so the hook's progress-handle
    // hit-test can resolve a bar's persisted progress + emit
    // `bar-progress` events on commit. Maps built above via useMemo;
    // empty when no bars opted in.
    barProgressById,
    overlayIdByBarId,
    // Phase 32.2.1: thread the bars list into the composable so its
    // validator gate has a `movingBar` to resolve against
    // (`runDropValidation` short-circuits to null when bars is empty).
    bars,
    // Phase 32.3 — edge-zone hit-test width tracks the visible cursor cue
    // (resizer-zone rect width below). Single-token discipline keeps
    // theme overrides aligned with hit-test geometry.
    edgeZoneWidth: t.barResizerThickness,
    // Phase 33 — always pass wrappers through `emit()` so subscribers
    // registered via `handle.subscribe(...)` fire alongside the
    // corresponding callback prop. emit() is a no-op when the prop
    // is undefined AND the listener set is empty.
    onBarDrop: (p) => emit('bar-drop', p),
    onBarResize: (p) => emit('bar-resize', p),
    onBarProgress: (p) => emit('bar-progress', p),
    onSelect: (p) => emit('select', p),
    onBarDragStart: (p) => emit('bar-dragstart', p),
    onBarDragStop: (p) => emit('bar-dragstop', p),
    onBarResizeStart: (p) => emit('bar-resizestart', p),
    onBarResizeStop: (p) => emit('bar-resizestop', p),
    // Phase 32.2.1: Phase 19 validator inputs.
    ...(eventAllow !== undefined ? { eventAllow } : {}),
    ...(selectAllow !== undefined ? { selectAllow } : {}),
    ...(eventOverlap !== undefined ? { eventOverlap } : {}),
    ...(eventConstraint !== undefined ? { eventConstraint } : {}),
    ...(selectOverlap !== undefined ? { selectOverlap } : {}),
    ...(selectConstraint !== undefined ? { selectConstraint } : {}),
    onBarDropRejected: (p) => emit('bar-drop-rejected', p),
    onBarResizeRejected: (p) => emit('bar-resize-rejected', p),
    onSelectRejected: (p) => emit('select-rejected', p),
  });

  // Body-SVG ref for setPointerCapture / releasePointerCapture +
  // content-coord translation. content-x / -y = clientX/Y − bounding rect
  // origin; matches vue2's `toContentXY` math.
  const bodySvgRef = useRef<SVGSVGElement | null>(null);

  // Phase 32.5 — dual-scrollport refs. `chartPaneRef` wraps the body SVG
  // and owns the scroll container. `chartHeaderInnerRef` wraps the
  // header SVG inside `cx-gantt-chart-header-pane` (overflow:hidden);
  // its transform is updated by the header-sync useEffect on every
  // chart-pane scroll so the header tick labels stay horizontally
  // aligned with body content.
  const chartPaneRef = useRef<HTMLDivElement | null>(null);
  const chartHeaderInnerRef = useRef<HTMLDivElement | null>(null);

  // Phase 48 — sidebar pane refs (active when `columns` is non-empty).
  // `sidebarPaneRef` owns the sidebar's vertical scroll container;
  // `sidebarHeaderInnerRef` wraps the sidebar's header `<table>` inside
  // `cx-gantt-sidebar-header-pane` (overflow:hidden) and takes a
  // translateX on horizontal sidebar scroll, mirroring how the chart-
  // header pane tracks its body. Refs stay null in no-sidebar mode —
  // `useScrollSync` no-ops, and the sidebar-header useEffect short-
  // circuits at the null guard.
  const sidebarPaneRef = useRef<HTMLDivElement | null>(null);
  const sidebarHeaderInnerRef = useRef<HTMLDivElement | null>(null);

  // Phase 50 — sidebar-divider drag-to-resize refs + state. Mirror
  // of `adapters/gantt-vue3/src/chronix-gantt.ts:1134-1202` with React
  // idiom: `sidebarWidthOverride` is `useState` (triggers re-render
  // so the wrapper's gridTemplateColumns + sidebar <col> widths
  // reflect the new width). `dividerDragStart{Width,ClientX}Ref` are
  // `useRef` (intentionally non-rendering — drag-internal snapshots
  // that shouldn't cause re-render mid-pointermove).
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const dividerRef = useRef<HTMLDivElement | null>(null);
  const [sidebarWidthOverride, setSidebarWidthOverride] = useState<number | null>(null);
  const dividerDragStartWidthRef = useRef<number | null>(null);
  const dividerDragStartClientXRef = useRef<number | null>(null);

  // Phase 32.5 — scroll state. `chartScroll.scrollLeft` +
  // `chartScroll.clientWidth` are reactive; Phase 32.5.1 viewport-clip
  // lighting will consume them. This phase only wires the source
  // plumbing + header horizontal sync.
  const chartScroll = useChartScrollState(chartPaneRef);

  // Phase 48 — sidebar pane scroll state. Same hook (read-only horizontal
  // + width reader); we only consume `scrollLeft` so the sidebar header
  // tracks horizontal sidebar scroll independently of the chart pane.
  const sidebarScroll = useChartScrollState(sidebarPaneRef);

  // Phase 48 — bidirectional vertical scroll sync between sidebar +
  // chart panes (rAF-source-tracking lockstep). When sidebar isn't
  // rendered, sidebarPaneRef.current === null and the hook silently
  // no-ops.
  useScrollSync(sidebarPaneRef, chartPaneRef);

  // Phase 50 — sidebar-divider pointer handlers. Mirror of
  // chronix-vue3:1165-1202 with React event-type signatures. The
  // handlers read sidebarWidthOverride via React closure on each
  // render (state never goes stale because every setState triggers
  // a re-render); the dragStart{Width,ClientX}Ref are useRef so
  // mid-drag updates don't trigger re-renders themselves.
  function onDividerPointerDown(e: ReactPointerEvent<HTMLDivElement>): void {
    if (e.button !== 0) return;
    const base = (columns ?? []).reduce((sum, c) => sum + c.width, 0);
    const effective = sidebarWidthOverride ?? base;
    dividerDragStartWidthRef.current = effective;
    dividerDragStartClientXRef.current = e.clientX;
    dividerRef.current?.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  }

  function onDividerPointerMove(e: ReactPointerEvent<HTMLDivElement>): void {
    if (dividerDragStartWidthRef.current === null) return;
    if (dividerDragStartClientXRef.current === null) return;
    const wrapperWidth = wrapperRef.current?.getBoundingClientRect().width ?? 0;
    const proposed =
      dividerDragStartWidthRef.current + (e.clientX - dividerDragStartClientXRef.current);
    setSidebarWidthOverride(clampSidebarWidth(proposed, wrapperWidth));
  }

  function onDividerPointerUp(e: ReactPointerEvent<HTMLDivElement>): void {
    if (dividerDragStartWidthRef.current === null) return;
    dividerDragStartWidthRef.current = null;
    dividerDragStartClientXRef.current = null;
    dividerRef.current?.releasePointerCapture?.(e.pointerId);
  }

  function onDividerPointerCancel(e: ReactPointerEvent<HTMLDivElement>): void {
    // Browser-initiated cancel preserves the in-flight override —
    // reverting would lose progress the user already expressed.
    dividerDragStartWidthRef.current = null;
    dividerDragStartClientXRef.current = null;
    dividerRef.current?.releasePointerCapture?.(e.pointerId);
  }

  // Phase 32.5 — chart-header horizontal sync. Inline useEffect keyed on
  // `chartScroll.scrollLeft`. When user scrolls the chart pane
  // horizontally, the chart-header-inner div's transform updates so the
  // header band visually follows body content.
  useEffect(() => {
    const inner = chartHeaderInnerRef.current;
    if (!inner) return;
    inner.style.transform = `translateX(${-chartScroll.scrollLeft}px)`;
  }, [chartScroll.scrollLeft]);

  // Phase 48 — sidebar-header horizontal sync. Sibling of the chart
  // useEffect above; reads `sidebarScroll.scrollLeft` and pushes a
  // translateX onto `sidebarHeaderInnerRef`. Independent from chart
  // horizontal scroll (per Phase 23 contract: each pane owns its own
  // horizontal scrollport). Null-guard skips no-sidebar mode.
  useEffect(() => {
    const inner = sidebarHeaderInnerRef.current;
    if (!inner) return;
    inner.style.transform = `translateX(${-sidebarScroll.scrollLeft}px)`;
  }, [sidebarScroll.scrollLeft]);

  // Phase 33 — imperative `GanttHandle` facade. 16 methods covering
  // view/navigation, scroll, read-only bar/row/link lookup, and
  // event subscription. Mirrors vue3 Phase 24 + vue2 Phase 31.5
  // implementations; the `GanttHandle` interface itself lives in
  // core (`packages/gantt/src/api/gantt-handle.ts`) and is shared
  // across all 3 adapters.
  //
  // The 7 axis-mutating methods (changeView / prev / next / today /
  // gotoDate / incrementDate / zoomTo) fire `onAxisInputChange` so the
  // consumer's controlled-prop loop round-trips into a new render.
  // `scrollToDate` writes `chartPaneRef.current.scrollLeft` directly
  // (pure DOM side-effect; no callback fires). `subscribe` registers
  // into `listenerRegistry` and returns an unsubscribe function.
  // Per-render table wrappers — cheap inline objects, not memoized.
  // The `pointer` reference is unstable per Phase 32.2's getter
  // pattern (rebuilt each render) so memoization would just-recreate
  // anyway; inline construction is simpler.
  const barTable: BarTable = {
    get bars() {
      return bars;
    },
    get inFlightTransaction() {
      return pointer.activeTransaction;
    },
    getById: (id: string): BarSpec | undefined => bars.find((b) => b.id === id),
    listByRow: (rowId: string): readonly BarSpec[] =>
      bars
        .filter((b) => b.rowId === rowId)
        .slice()
        .sort((a, b) => a.range.start.getTime() - b.range.start.getTime()),
    listInRange: (range: TimeRange): readonly BarSpec[] =>
      bars
        .filter(
          (b) =>
            b.range.start.getTime() < range.end.getTime() &&
            b.range.end.getTime() > range.start.getTime(),
        )
        .slice()
        .sort((a, b) => a.range.start.getTime() - b.range.start.getTime()),
  };
  const rowDataSource: RowDataSource = {
    get rows() {
      return rows;
    },
    getById: (id: string): RowSpec | undefined => rows.find((r) => r.id === id),
    listChildren: (parentId: string | null): readonly RowSpec[] =>
      rows.filter((r) => (r.parentId ?? null) === parentId),
    // No expand/collapse state in v0 — every row is always
    // expanded. When tree-collapse lands, this becomes reactive.
    isExpanded: (): boolean => true,
  };
  const linkTable: LinkTable = {
    get links() {
      return links ?? [];
    },
    getById: (id: string): LinkSpec | undefined => (links ?? []).find((l) => l.id === id),
    listFrom: (fromBarId: string): readonly LinkSpec[] =>
      (links ?? []).filter((l) => l.fromBarId === fromBarId),
    listTo: (toBarId: string): readonly LinkSpec[] =>
      (links ?? []).filter((l) => l.toBarId === toBarId),
  };

  function scrollToDateImpl(date: Date): void {
    const axisStartMs = axis.ticks[0]?.time.getTime() ?? 0;
    const pxPerMs = axis.slotWidth / axis.slotDurationMs;
    const x = pxPerMs * (date.getTime() - axisStartMs);
    const pane = chartPaneRef.current;
    if (pane) pane.scrollLeft = x;
  }

  useImperativeHandle(
    ref,
    (): GanttHandle => ({
      changeView(viewId: ViewId): void {
        emit('update:axisInput', { ...axisInput, viewId });
      },
      prev(): void {
        emit('update:axisInput', {
          ...axisInput,
          anchorDate: prevAnchor(axisInput.viewId, axisInput.anchorDate),
        });
      },
      next(): void {
        emit('update:axisInput', {
          ...axisInput,
          anchorDate: nextAnchor(axisInput.viewId, axisInput.anchorDate),
        });
      },
      today(): void {
        emit('update:axisInput', { ...axisInput, anchorDate: todayAnchor() });
      },
      gotoDate(date: Date): void {
        emit('update:axisInput', { ...axisInput, anchorDate: date });
      },
      incrementDate(delta: IncrementDelta): void {
        emit('update:axisInput', {
          ...axisInput,
          anchorDate: applyIncrement(axisInput.anchorDate, delta),
        });
      },
      getDate(): Date {
        return axisInput.anchorDate;
      },
      zoomTo(date: Date, viewId?: ViewId): void {
        emit('update:axisInput', {
          ...axisInput,
          anchorDate: date,
          viewId: viewId ?? axisInput.viewId,
        });
      },
      scrollToDate(date: Date): void {
        scrollToDateImpl(date);
      },
      getBarById(id: string): BarSpec | undefined {
        return bars.find((b) => b.id === id);
      },
      getBars(): readonly BarSpec[] {
        return bars;
      },
      getBarTable(): BarTable {
        return barTable;
      },
      getRowDataSource(): RowDataSource {
        return rowDataSource;
      },
      getLinkTable(): LinkTable {
        return linkTable;
      },
      subscribe<K extends keyof GanttEventMap>(
        event: K,
        listener: (payload: GanttEventMap[K]) => void,
      ): () => void {
        const key = String(event);
        const existing = listenerRegistry.current.get(key);
        const set = existing ?? new Set<EmitListener>();
        if (!existing) listenerRegistry.current.set(key, set);
        const typedListener = listener as EmitListener;
        set.add(typedListener);
        return () => {
          set.delete(typedListener);
          if (set.size === 0) listenerRegistry.current.delete(key);
        };
      },
      hitTestFromClient(clientX, clientY) {
        const svg = bodySvgRef.current;
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        const scrollTop = chartPaneRef.current?.scrollTop ?? 0;
        return hitTestFromClient({
          clientX,
          clientY,
          bodyRect: { left: rect.left, top: rect.top },
          scrollLeft: chartScroll.scrollLeft,
          scrollTop,
          axis,
          strips,
        });
      },
    }),
    // No deps — the factory runs every render so the handle methods
    // always close over the latest props/refs. Cheap (just a ref
    // write); avoids the cost of stale-handle bugs from forgetting
    // a dep when props evolve.
  );

  // Phase 34 — toolbar widget model + title text. `parseToolbar()` is
  // a pure function in core; useMemo keyed on the inputs prevents
  // re-parse on unrelated re-renders. `null` shape covers both
  // omitted (default) and explicit `false` to keep the JSX-return
  // guard a single null-check.
  const toolbarModel = useMemo<ToolbarModel | null>(() => {
    if (headerToolbar === false || headerToolbar === undefined) return null;
    return parseToolbar(headerToolbar, {
      viewIds: ALL_VIEW_IDS,
      activeViewId: axisInput.viewId,
    });
  }, [headerToolbar, axisInput.viewId]);
  const toolbarTitleText = useMemo(() => formatToolbarTitle(axisInput), [axisInput]);

  // Phase 34 — toolbar widget click dispatcher. View / nav clicks
  // route through Phase 33's `emit('update:axisInput', ...)` helper
  // (Decision A.1: inline math; mirrors vue3:859-881). Fires the
  // `onAxisInputChange` callback prop AND iterates any
  // `update:axisInput` subscribers registered via
  // `handle.subscribe()`. Title-kind widgets are non-interactive.
  function onToolbarWidgetClick(widget: ToolbarWidget): void {
    if (widget.kind === 'view') {
      emit('update:axisInput', {
        ...axisInput,
        viewId: widget.buttonName as ViewId,
      });
      return;
    }
    if (widget.kind === 'nav') {
      let nextDate: Date;
      if (widget.buttonName === 'prev') {
        nextDate = prevAnchor(axisInput.viewId, axisInput.anchorDate);
      } else if (widget.buttonName === 'next') {
        nextDate = nextAnchor(axisInput.viewId, axisInput.anchorDate);
      } else {
        // 'today'
        nextDate = todayAnchor();
      }
      emit('update:axisInput', { ...axisInput, anchorDate: nextDate });
    }
    // kind === 'title' — non-interactive
  }

  function toContentXY(e: ReactPointerEvent): { x: number; y: number } | null {
    const svg = bodySvgRef.current;
    if (!svg) {
      console.warn('[ChronixGantt] toContentXY: bodySvgRef is null');
      return null;
    }
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn('[ChronixGantt] toContentXY: SVG has zero dimensions', rect);
      return null;
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: ReactPointerEvent<SVGSVGElement>): void {
    if (e.button !== 0) return; // primary mouse / touch only
    const pos = toContentXY(e);
    if (!pos) return;
    if (pos.y < 0) return;
    pointer.begin(pos.x, pos.y);
    // If a transaction actually started, capture the pointer so move /
    // up events keep flowing even if the cursor leaves the SVG.
    // Use `hasActiveTransaction()` for synchronous check for
    // cross-framework consistency.
    if (pointer.hasActiveTransaction() && bodySvgRef.current) {
      try {
        bodySvgRef.current.setPointerCapture(e.pointerId);
      } catch (err) {
        console.warn('[ChronixGantt] setPointerCapture failed:', err);
      }
    }
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>): void {
    if (pointer.activeTransaction) {
      const pos = toContentXY(e);
      if (!pos) return;
      pointer.advance(pos.x, pos.y);
      return;
    }
    // Detect if mouse is near progress handle position (proximity detection)
    const pos = toContentXY(e);
    if (!pos) return;
    const PROXITY_THRESHOLD = 15; // px
    const TRIANGLE_SIZE = 6;
    const nearHandleIds = new Set<string>();
    for (const bar of placedBars) {
      const sourceProgress = barProgressById.get(bar.barId);
      const overlayId = overlayIdByBarId.get(bar.barId);
      if (sourceProgress === undefined || overlayId === undefined) continue;
      const handleX = bar.x + (sourceProgress / 100) * bar.width;
      const handleY = bar.y + bar.height;
      // Check if mouse is near the progress position (within threshold)
      // and within vertical range (bar y to bar bottom + triangle size)
      const dx = Math.abs(pos.x - handleX);
      const isInVerticalRange = pos.y >= bar.y && pos.y <= handleY + TRIANGLE_SIZE;
      if (dx <= PROXITY_THRESHOLD && isInVerticalRange) {
        nearHandleIds.add(bar.barId);
      }
    }
    setHoveredProgressHandleIds(nearHandleIds);
  }

  function onPointerUp(e: ReactPointerEvent<SVGSVGElement>): void {
    // Phase 12 click-vs-drag discrimination. Snapshot the active
    // transaction + lastHit BEFORE commit/abort clears them — the
    // post-resolution click decision still needs `lastHit` to know
    // which bar would have been clicked.
    const txn = pointer.activeTransaction;
    const hit = pointer.lastHit;
    if (txn) {
      const isSubThresholdGesture =
        !pointer.dragDistanceSurpassed && txn.kind !== 'progress-handle';
      if (isSubThresholdGesture) {
        pointer.abort();
      } else {
        pointer.commit();
      }
    }
    // Click callback only fires when no transaction committed — a real
    // drag never doubles as a click. For sub-threshold aborts the flag
    // stays false so the click does fire.
    if (!pointer.wasDragCommit && hit) {
      if (hit.kind === 'bar-body') {
        const sourceBar = bars.find((b) => b.id === hit.barId);
        if (sourceBar) {
          emit('bar-click', { barId: hit.barId, sourceBar, jsEvent: e });
        }
      } else if (hit.kind === 'empty-row') {
        // Phase 54 — surface the calendar time via `xToTime`.
        const pos = toContentXY(e);
        const clickTime = pos ? xToTime(pos.x, axis) : new Date(NaN);
        emit('empty-area-click', {
          rowId: hit.rowId,
          jsEvent: e,
          time: clickTime,
        });
      }
    }
    // Release pointer capture after transaction is resolved.
    if (bodySvgRef.current) {
      try {
        bodySvgRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {
        console.warn('[ChronixGantt] releasePointerCapture failed:', err);
      }
    }
  }

  function onPointerCancel(e: ReactPointerEvent<SVGSVGElement>): void {
    if (!pointer.activeTransaction) return;
    // Browser-initiated cancellation (touch interruption, focus stolen,
    // OS gesture). Drop the in-flight transaction without firing a
    // commit callback.
    pointer.abort();
    if (bodySvgRef.current) {
      try {
        bodySvgRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {
        console.warn('[ChronixGantt] releasePointerCapture (cancel) failed:', err);
      }
    }
  }

  // Phase 54 — bar hover events (delegated). Same shape as vue3 + vue2.
  const lastHoveredBarIdRef = useRef<string | null>(null);
  // Track hovered bar IDs for progress handle visibility (intentionally unused for now)
  const [_hoveredBarIds, _setHoveredBarIds] = useState<Set<string>>(new Set());
  // Track hovered progress handle IDs (separate from bar hover)
  const [hoveredProgressHandleIds, setHoveredProgressHandleIds] = useState<Set<string>>(new Set());
  function onBarsPointerOver(e: ReactPointerEvent<SVGGElement>): void {
    if (pointer.activeTransaction) return;
    const target = e.target as Element | null;
    const barEl = target?.closest<SVGElement>('[data-bar-id]');
    const barId = barEl?.getAttribute('data-bar-id') ?? null;
    if (!barId || barId === lastHoveredBarIdRef.current) return;
    if (lastHoveredBarIdRef.current !== null) {
      const prevBar = bars.find((b) => b.id === lastHoveredBarIdRef.current);
      if (prevBar) {
        emit('bar-mouseleave', {
          barId: lastHoveredBarIdRef.current,
          sourceBar: prevBar,
          jsEvent: e,
        });
      }
      // Remove from hovered set
      _setHoveredBarIds((prev) => {
        const next = new Set(prev);
        next.delete(lastHoveredBarIdRef.current!);
        return next;
      });
    }
    const sourceBar = bars.find((b) => b.id === barId);
    if (sourceBar) {
      lastHoveredBarIdRef.current = barId;
      emit('bar-mouseenter', { barId, sourceBar, jsEvent: e });
      // Add to hovered set
      _setHoveredBarIds((prev) => new Set(prev).add(barId));
    }
  }
  function onBarsPointerOut(e: ReactPointerEvent<SVGGElement>): void {
    if (pointer.activeTransaction) return;
    if (lastHoveredBarIdRef.current === null) return;
    const next = e.relatedTarget as Element | null;
    if (next?.closest('[data-bar-id]')) return;
    const prevBar = bars.find((b) => b.id === lastHoveredBarIdRef.current);
    if (prevBar) {
      emit('bar-mouseleave', {
        barId: lastHoveredBarIdRef.current,
        sourceBar: prevBar,
        jsEvent: e,
      });
    }
    // Remove from hovered set
    const leavingId = lastHoveredBarIdRef.current;
    _setHoveredBarIds((prev) => {
      const next = new Set(prev);
      next.delete(leavingId);
      return next;
    });
    lastHoveredBarIdRef.current = null;
  }

  const hh = headerHeight;
  const hrh = headerRowHeight;
  const headerRowsHeight = axis.headerRows.length * hrh;
  const totalHeaderBandHeight = headerRowsHeight + hh;
  const totalWidth = contentSize.width;
  const bodyHeight = contentSize.height;
  const activeTxn = pointer.activeTransaction;
  const headerCellTemplate = slotRegistry?.get(HEADER_CELL_SLOT_NAME);
  const barTemplate = slotRegistry?.get(BAR_SLOT_NAME);
  const linkSlotTemplate = slotRegistry?.get(LINK_SLOT_NAME);

  // Phase 32.4.1 — render-pass-local map populated alongside `resolvedStyle`.
  // Read by the link-render block below when `useLineEventColor: true` so
  // dependency lines inherit the source bar's resolved background color.
  // Local to this render closure — cleared and rebuilt every render, no
  // cross-render state.
  const barColorByBarId = new Map<string, string>();

  // Phase 32.4.1 — Decision B.1: extract bar render inputs to a pre-pass
  // loop so the link-render block (which reads `barColorByBarId`) sees a
  // fully populated map regardless of JSX sibling ordering. Cleaner data
  // flow than the side-effect-in-JSX-map alternative.
  interface BarRenderInput {
    readonly bar: PlacedBar;
    readonly isSelected: boolean;
    readonly sourceBar: BarSpec | undefined;
    readonly resolvedStyle: ResolvedBarStyle;
  }
  const barRenderInputs: BarRenderInput[] = placedBars.map((bar): BarRenderInput => {
    const isSelected = selectedBarSet.has(bar.barId);
    const sourceBar = bars.find((b) => b.id === bar.barId);
    const resolvedStyle: ResolvedBarStyle = sourceBar
      ? resolveBarStyle({
          bar: sourceBar,
          placedBar: bar,
          isSelected,
          activeTransaction: activeTxn,
          themeBackgroundColor: t.barBackgroundColor,
          themeBorderColor: t.barBorderColor,
          themeTextColor: t.barTextColor,
          themeFontSize: t.barFontSize,
          themeFontWeight: t.barFontWeight,
          ...(barColor !== undefined ? { barColor } : {}),
          ...(barBackgroundColor !== undefined ? { barBackgroundColor } : {}),
          ...(barBorderColor !== undefined ? { barBorderColor } : {}),
          ...(barTextColor !== undefined ? { barTextColor } : {}),
          ...(barBackgroundColorCallback ? { barBackgroundColorCallback } : {}),
          ...(barBorderColorCallback ? { barBorderColorCallback } : {}),
          ...(barTextColorCallback ? { barTextColorCallback } : {}),
          ...(barFontSizeCallback ? { barFontSizeCallback } : {}),
          ...(barFontWeightCallback ? { barFontWeightCallback } : {}),
          ...(barClassNamesCallback ? { barClassNamesCallback } : {}),
        })
      : {
          backgroundColor: t.barBackgroundColor,
          borderColor: t.barBorderColor,
          textColor: t.barTextColor,
          fontSize: t.barFontSize,
          fontWeight: t.barFontWeight,
          classNames: [],
        };
    barColorByBarId.set(bar.barId, resolvedStyle.backgroundColor);
    return { bar, isSelected, sourceBar, resolvedStyle };
  });

  // Phase 32.4.1 — link cascade + render block. Runs AFTER the bar pre-pass
  // (Decision B.1) so `barColorByBarId` is fully populated. Cascade per
  // routed link: `routed.color` (from `LinkSpec.colorOverride` if set) →
  // `useLineEventColor` source-bar lookup → `theme.linkDefaultColor`.
  // `onLineCallback` runs LAST with cascaded defaults; merges `{ color?,
  // marker? }` over them. Marker `<defs>` aggregator uses POST-callback
  // resolved colors so `marker-end` URL refs stay valid.

  // Strips keyed by rowId for O(1) lookup in cross-row snap logic.
  const stripByRowId = new Map(strips.map((s) => [s.rowId, s]));

  // Helper: compute the "live" (drag-adjusted) position of a bar.
  // Returns a PlacedBar with x/y/width adjusted by the active transaction
  // if this bar is currently being dragged or resized. Otherwise returns
  // the original position unchanged.
  function getLiveBar(bar: PlacedBar): PlacedBar {
    const activeTxn = pointer.activeTransaction;
    // Check if this is a bar-related transaction and if it's for this bar
    if (!activeTxn) return bar;
    if (
      activeTxn.kind !== 'bar-drag' &&
      activeTxn.kind !== 'bar-resize' &&
      activeTxn.kind !== 'progress-handle'
    ) {
      return bar;
    }
    if (activeTxn.barId !== bar.barId) {
      return bar;
    }

    let liveX = bar.x;
    let liveY = bar.y;
    let liveWidth = bar.width;

    if (activeTxn.kind === 'bar-drag') {
      liveX = bar.x + activeTxn.deltaX;
      // Cross-row snap: same logic as bar rendering
      const projRowId = pointer.projectedRowId;
      if (projRowId !== null) {
        const sourceBar = bars.find((b) => b.id === bar.barId);
        const sourceRowId = sourceBar?.rowId;
        if (sourceRowId !== undefined && projRowId !== sourceRowId) {
          const sourceStrip = stripByRowId.get(sourceRowId);
          const targetStrip = stripByRowId.get(projRowId);
          if (sourceStrip && targetStrip) {
            const intraStripOffset = bar.y - sourceStrip.y;
            liveY = targetStrip.y + intraStripOffset;
          } else {
            liveY = bar.y + activeTxn.deltaY;
          }
        } else {
          liveY = bar.y + activeTxn.deltaY;
        }
      } else {
        liveY = bar.y + activeTxn.deltaY;
      }
    } else if (activeTxn.kind === 'bar-resize') {
      if (activeTxn.edge === 'start') {
        liveX = bar.x + activeTxn.deltaX;
        liveWidth = Math.max(0, bar.width - activeTxn.deltaX);
      } else {
        liveWidth = Math.max(0, bar.width + activeTxn.deltaX);
      }
    }

    return { ...bar, x: liveX, y: liveY, width: liveWidth };
  }

  // Helper: recompute a link's path using live (drag-adjusted) bar positions.
  // Uses the exported DependencyLineAlgorithm class to ensure consistent
  // routing behavior during drag operations, including support for
  // extraVerticalOffset when bars overlap.
  function rerouteLinkWithPathAdjustment(
    routed: RoutedLink,
    fromBar: PlacedBar,
    toBar: PlacedBar,
    linkSpecMap: Map<string, LinkSpec>,
  ): string {
    const activeTxn = pointer.activeTransaction;
    // Only re-route if an endpoint is being dragged
    if (!activeTxn) return routed.pathD;
    if (
      activeTxn.kind !== 'bar-drag' &&
      activeTxn.kind !== 'bar-resize' &&
      activeTxn.kind !== 'progress-handle'
    ) {
      return routed.pathD;
    }
    if (activeTxn.barId !== fromBar.barId && activeTxn.barId !== toBar.barId) {
      return routed.pathD;
    }

    const liveFromBar = getLiveBar(fromBar);
    const liveToBar = getLiveBar(toBar);

    // Compute anchor points using the exported helper functions
    const from = predecessorAnchor(liveFromBar);
    const to = successorAnchor(liveToBar);

    // Get the link spec to determine routing type
    const spec = linkSpecMap.get(routed.linkId);
    if (!spec) return routed.pathD;

    // Use DependencyLineAlgorithm to compute the path with proper routing logic
    // including support for overlapping bars via extraVerticalOffset
    const smoothGap = 20; // Default smoothBeforeTargetGapPx
    const algorithm = new DependencyLineAlgorithm(spec.routing, smoothGap);
    const line = algorithm.generateDependencyLine(from.x, from.y, to.x, to.y);

    return algorithm.generateSVGPath(line);
  }

  interface ResolvedLinkRender {
    readonly routed: RoutedLink;
    readonly spec: LinkSpec;
    readonly fromBar: PlacedBar;
    readonly toBar: PlacedBar;
    readonly color: string;
    readonly marker: LinkMarker | CustomLinkMarker;
    readonly livePathD: string; // Path adjusted for drag
  }
  const linksList = links ?? [];
  const linkSpecById = new Map<string, LinkSpec>(linksList.map((l) => [l.id, l]));
  const placedBarById = new Map<string, PlacedBar>(placedBars.map((p) => [p.barId, p]));
  const resolvedLinks: ResolvedLinkRender[] = [];
  for (const routed of routerOutput.routedLinks) {
    const spec = linkSpecById.get(routed.linkId);
    if (!spec) continue; // Defensive — orphan should never reach here.
    const fromBar = placedBarById.get(spec.fromBarId);
    const toBar = placedBarById.get(spec.toBarId);
    if (!fromBar || !toBar) continue; // Defensive bar-resolution gap.

    // Recompute path with live positions if bars are being dragged
    const livePathD = rerouteLinkWithPathAdjustment(routed, fromBar, toBar, linkSpecById);

    let color: string;
    if (routed.color !== undefined) {
      color = routed.color;
    } else if (useLineEventColor === true) {
      color = barColorByBarId.get(spec.fromBarId) ?? t.linkDefaultColor;
    } else {
      color = t.linkDefaultColor;
    }

    let marker: LinkMarker | CustomLinkMarker = spec.marker;

    if (onLineCallback) {
      const arg: LinkRenderArg = {
        routedLink: routed,
        linkSpec: spec,
        fromBar,
        toBar,
        defaultColor: color,
        currentMarker: marker,
      };
      const override = onLineCallback(arg);
      if (override !== undefined) {
        if (override.color !== undefined) color = override.color;
        if (override.marker !== undefined) marker = override.marker;
      }
    }

    resolvedLinks.push({ routed, spec, fromBar, toBar, color, marker, livePathD });
  }

  const linkPathNodes: ReactNode[] = resolvedLinks.map((r) => {
    if (linkSlotTemplate) {
      const slotArgs: LinkSlotArgs = {
        routedLink: r.routed,
        linkSpec: r.spec,
        fromBar: r.fromBar,
        toBar: r.toBar,
        color: r.color,
        marker: r.marker,
        theme: t,
      };
      return (
        <Fragment key={r.routed.linkId}>
          {
            linkSlotTemplate({
              slot: LINK_SLOT_NAME,
              args: slotArgs as unknown as Readonly<Record<string, unknown>>,
            }) as ReactNode
          }
        </Fragment>
      );
    }
    const markerEnd = markerEndUrl(r.marker, r.color);
    return (
      <path
        key={r.routed.linkId}
        className="cx-gantt-link"
        data-link-id={r.routed.linkId}
        d={r.livePathD} // Use live (drag-adjusted) path
        stroke={r.color}
        strokeWidth={t.linkStrokeWidth}
        fill="none"
        {...(markerEnd !== null ? { markerEnd } : {})}
      />
    );
  });

  // Phase 32.4.1 — marker `<defs>` aggregator. One `<marker>` per
  // (color × built-in type) + one per (color × custom marker). Color set
  // includes the theme default plus POST-callback resolved colors so any
  // callback color swap still has its marker-end ref resolve to a real
  // def. Custom markers from callbacks ALSO contribute to the def set
  // (the override's marker may be a `CustomLinkMarker` object not in
  // `links`).
  const usedColors = new Set<string>();
  usedColors.add(t.linkDefaultColor);
  for (const r of resolvedLinks) usedColors.add(r.color);

  const customMarkerById = new Map<string, CustomLinkMarker>();
  for (const link of linksList) {
    if (typeof link.marker === 'object') {
      customMarkerById.set(link.marker.id, link.marker);
    }
  }
  for (const r of resolvedLinks) {
    if (typeof r.marker === 'object') {
      customMarkerById.set(r.marker.id, r.marker);
    }
  }

  const defsChildren: ReactElement[] = [];
  for (const color of usedColors) {
    const colorId = markerColorId(color);
    for (const type of BUILTIN_MARKER_TYPES) {
      defsChildren.push(renderBuiltinMarker(type, color, colorId));
    }
    for (const customMarker of customMarkerById.values()) {
      defsChildren.push(renderCustomMarker(customMarker, color, colorId));
    }
  }

  // Phase 32.4.2 — body-side grid lines. Three line types:
  //   - vertical 1-px `<rect class="cx-gantt-grid-vline">` per axis
  //     tick (cell boundary; matches vue2/vue3 + original spec).
  //     When the tick falls on Monday at 00:00 (ISO week start), the
  //     rect picks up the additional class `cx-gantt-grid-vline-week`
  //     and the darker `theme.gridLineWeekStartColor` fill.
  //   - right-edge closing `<rect>` at `x: axis.totalWidth - 1` so the
  //     rightmost cell visually closes (skipped when totalWidth is 0
  //     to avoid stray `x = -1` line in degenerate fixtures).
  //   - horizontal 1-px `<line class="cx-gantt-grid-hline">` per strip's
  //     bottom edge. Y snapped to device pixel grid via
  //     `snapHorizontalGridLineY` so 1-px strokes stay single-weight
  //     under fractional row heights AND non-1 DPR.
  //     `vector-effect="non-scaling-stroke"` preserves 1-px weight under
  //     future viewport zoom transforms.
  // Wrapping `<g class="cx-gantt-grid" pointer-events="none">` skipped
  // entirely when `gridChildren.length === 0` (degenerate empty fixture).
  //
  // Week-start derivation inline (`tick.time.getDay() === 1 && tick.
  // time.getHours() === 0`) — matches vue2/vue3 + original spec; no
  // `AxisTick.isWeekStart` field added to keep zero fixture churn.
  const gridChildren: ReactElement[] = [];
  for (const tick of axis.ticks) {
    const isWeekStart = tick.time.getDay() === 1 && tick.time.getHours() === 0;
    // X shared with the header tick line via `snapVerticalGridLineX` so the
    // body vline overlays the header separator pixel-for-pixel at any DPR
    // (vertical twin of the snapped horizontal grid lines).
    const xCrisp = snapVerticalGridLineX(tick.x, axis.totalWidth);
    gridChildren.push(
      <line
        key={`grid-vline-${tick.x}`}
        className={
          isWeekStart ? 'cx-gantt-grid-vline cx-gantt-grid-vline-week' : 'cx-gantt-grid-vline'
        }
        x1={xCrisp}
        y1={0}
        x2={xCrisp}
        y2={bodyHeight}
        stroke={isWeekStart ? t.gridLineWeekStartColor : t.gridLineColor}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />,
    );
  }
  if (axis.totalWidth > 0) {
    const xCrisp = snapVerticalGridLineX(axis.totalWidth, axis.totalWidth);
    gridChildren.push(
      <line
        key="grid-vline-right-edge"
        className="cx-gantt-grid-vline"
        x1={xCrisp}
        y1={0}
        x2={xCrisp}
        y2={bodyHeight}
        stroke={t.gridLineColor}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />,
    );
  }
  for (let i = 0; i < strips.length; i += 1) {
    const strip = strips[i]!;
    const lineY = strip.y + strip.height;
    const yCrisp = snapHorizontalGridLineY(lineY, bodyHeight);
    gridChildren.push(
      <line
        key={`grid-hline-${i}`}
        className="cx-gantt-grid-hline"
        x1={0}
        y1={yCrisp}
        x2={axis.totalWidth}
        y2={yCrisp}
        stroke={t.gridLineRowRuleColor}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        pointerEvents="none"
      />,
    );
  }
  const gridGroupNode: ReactNode =
    gridChildren.length > 0 ? (
      <g className="cx-gantt-grid" pointerEvents="none">
        {gridChildren}
      </g>
    ) : null;

  // Phase 53 — body slot rects: one transparent `<rect class="cx-gantt-slot
  // ...">` per axis tick — pure CSS hook for consumer styling (weekend
  // tinting, today-column emphasis, past/future fade). Sits BEHIND grid
  // lines + bars + links so consumer fills paint visibly without
  // obscuring chart chrome. `fill="transparent"` keeps the default render
  // pixel-identical to pre-Phase-53; classes alone let consumer CSS
  // opt-in to backgrounds via `.cx-gantt-slot-sat { background: ... }`
  // selectors. Mirrors chronix-vue3 Phase 29 + chronix-vue2 lines 2645-2660.
  const bodySlotChildren: ReactNode[] = [];
  for (const tick of axis.ticks) {
    const slotMeta = computeCellStateMeta(tick.time, headerTodayStart);
    const slotClasses = getSlotClassNames(slotMeta).join(' ');
    bodySlotChildren.push(
      <rect
        key={`body-slot-${tick.x}`}
        className={slotClasses}
        x={tick.x}
        y={0}
        width={axis.slotWidth}
        height={bodyHeight}
        fill="transparent"
        pointerEvents="none"
      />,
    );
  }
  const bodySlotsGroupNode: ReactNode =
    bodySlotChildren.length > 0 ? (
      <g className="cx-gantt-slots" pointerEvents="none">
        {bodySlotChildren}
      </g>
    ) : null;

  // Phase 32.4.2 — body-side today line. Renders BEFORE the bars group
  // so bars paint on top (matches vue2/vue3 + original spec layering
  // — the line acts as a vertical guide UNDER the bars). Stroke / dash
  // / width all driven by `resolvedTodayLine`. `pointer-events: none`
  // keeps clicks flowing through to bars / empty rows beneath.
  const todayLineBodyNode: ReactNode = resolvedTodayLine ? (
    <line
      key="today-line-body"
      className="cx-gantt-today-line"
      data-today-line-side="body"
      x1={resolvedTodayLine.x}
      x2={resolvedTodayLine.x}
      y1={0}
      y2={bodyHeight}
      stroke={resolvedTodayLine.color}
      strokeWidth={resolvedTodayLine.width}
      {...(resolvedTodayLine.dasharray ? { strokeDasharray: resolvedTodayLine.dasharray } : {})}
      pointerEvents="none"
    />
  ) : null;

  // Phase 32.4.2 — header-side today-line extras: a `<line>` spanning
  // the full header band so the line visually continues into the
  // body-side line below, plus a `<g class="cx-gantt-today-line-tooltip">`
  // widget (`<rect>` background + `<text>` label centered horizontally
  // on todayX). Tooltip rect is fixed 36 × 16 px — fits the 2-character
  // default `'今日'` label at 11 px font; consumers passing a wider
  // custom tooltip via `TodayLineOption.tooltip` will overflow (same
  // v0 trade-off as vue2/vue3 + original spec). Both line + tooltip
  // carry `pointer-events: none` so they never intercept clicks on
  // underlying tick labels.
  const headerExtras: ReactElement[] = [];
  if (resolvedTodayLine !== null) {
    const tl = resolvedTodayLine;
    headerExtras.push(
      <line
        key="today-line-header"
        className="cx-gantt-today-line"
        data-today-line-side="header"
        x1={tl.x}
        x2={tl.x}
        y1={0}
        y2={totalHeaderBandHeight}
        stroke={tl.color}
        strokeWidth={tl.width}
        {...(tl.dasharray ? { strokeDasharray: tl.dasharray } : {})}
        pointerEvents="none"
      />,
    );
    if (tl.tooltip !== '') {
      // Phase 44 D.7 — pre-measure tooltip width so long custom
      // tooltips don't overflow the historical 36-px fixed rect.
      // Formula approximates mixed ASCII/CJK at a 0.7 width factor
      // against the 11-px font size + 8-px horizontal padding;
      // floored at 36 so the default '今日' tooltip keeps its
      // original look.
      const tooltipFontSize = 11;
      const tooltipWidth = Math.max(36, Math.ceil(tl.tooltip.length * tooltipFontSize * 0.7) + 8);
      const tooltipHeight = 16;
      const tooltipX = tl.x - tooltipWidth / 2;
      const tooltipY = 0;
      headerExtras.push(
        <g key="today-line-tooltip" className="cx-gantt-today-line-tooltip" pointerEvents="none">
          <rect
            x={tooltipX}
            y={tooltipY}
            width={tooltipWidth}
            height={tooltipHeight}
            fill={tl.tooltipBg}
            rx={2}
          />
          <text
            x={tl.x}
            y={tooltipY + tooltipHeight / 2 + 4}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={11}
          >
            {tl.tooltip}
          </text>
        </g>,
      );
    }
  }

  // Phase 48 + Phase 50 — sidebar geometry (active when `columns`
  // prop is non-empty). `sidebarBaseWidth` is the natural sum of
  // per-column widths and sizes the sidebar *table*; `effectiveSidebarWidth`
  // swaps in the user-dragged override if set and drives the grid track
  // (sidebar pane width). Dragging narrower than the columns overflows
  // the pane and reveals a horizontal scrollbar instead of compressing
  // the columns. `spansMatrix` resolves the per-cell rowspan number per
  // column up-front so the JSX builder can read it without recomputing
  // per cell.
  const hasSidebar = (columns?.length ?? 0) > 0;
  const sidebarColumns: readonly ColumnSpec[] = columns ?? [];
  const sidebarBaseWidth = sidebarColumns.reduce((acc, c) => acc + c.width, 0);
  const effectiveSidebarWidth = sidebarWidthOverride ?? sidebarBaseWidth;
  const sidebarWidth = effectiveSidebarWidth;
  const rowsById = new Map(rows.map((r) => [r.id, r]));
  const rowsForSpans = strips
    .map((strip) => rowsById.get(strip.rowId))
    .filter((r): r is RowSpec => r !== undefined);
  const sidebarSpansMatrix = hasSidebar
    ? computeRowSpans(rowsForSpans, sidebarColumns)
    : ([] as readonly number[][]);

  // Sidebar header table — one row of <th> cells matching column
  // order + a <colgroup> sharing per-column widths so vertical
  // borders align with the body table below.
  const sidebarHeaderTable: ReactElement | null = hasSidebar ? (
    <table
      style={{
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        width: `${sidebarBaseWidth}px`,
        height: `${totalHeaderBandHeight}px`,
      }}
      cellPadding={0}
      cellSpacing={0}
    >
      <colgroup>
        {sidebarColumns.map((c) => (
          <col key={c.key} style={{ width: `${c.width}px` }} />
        ))}
      </colgroup>
      <thead>
        <tr style={{ height: `${totalHeaderBandHeight}px` }}>
          {sidebarColumns.map((col) => (
            <th
              key={col.key}
              className="cx-gantt-sidebar-header-cell"
              data-column-key={col.key}
              style={{
                padding: '0 8px',
                fontSize: `${t.sidebarHeaderFontSize}px`,
                fontWeight: t.sidebarHeaderFontWeight,
                color: t.sidebarHeaderCellLabel,
                borderRight: `1px solid ${t.sidebarHeaderCellBorder}`,
                textAlign: 'center',
                boxSizing: 'border-box',
                overflow: 'hidden',
              }}
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>
    </table>
  ) : null;

  // Sidebar body table — one <tr> per swimlane strip. Each row's
  // height matches the strip's body Y range (strip.height plus any
  // inter-strip gap derived from `nextStrip.y - thisStrip.bottom`)
  // so a `rowspan=N` cell spans exactly the same vertical range as
  // the corresponding N body strips + the (N-1) gaps between them.
  // Cells absorbed by an earlier row's rowspan (`span === 0`) emit
  // nothing.
  const sidebarBodyTable: ReactElement | null = hasSidebar ? (
    <table
      style={{
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
        width: `${sidebarBaseWidth}px`,
      }}
      cellPadding={0}
      cellSpacing={0}
    >
      <colgroup>
        {sidebarColumns.map((c) => (
          <col key={c.key} style={{ width: `${c.width}px` }} />
        ))}
      </colgroup>
      <tbody>
        {strips.map((strip, rowIdx) => {
          const row = rowsById.get(strip.rowId);
          const nextStrip = strips[rowIdx + 1];
          const gap = nextStrip !== undefined ? nextStrip.y - (strip.y + strip.height) : 0;
          const trHeight = strip.height + Math.max(0, gap);
          return (
            <tr
              key={strip.rowId}
              className="cx-gantt-sidebar-row"
              data-row-id={strip.rowId}
              style={{ height: `${trHeight}px` }}
            >
              {sidebarColumns.flatMap((col, colIdx) => {
                const span = sidebarSpansMatrix[colIdx]?.[rowIdx] ?? 1;
                if (span === 0) return [];
                const value = row?.columns[col.key];
                const isMerged = span > 1;
                return [
                  <td
                    key={col.key}
                    className="cx-gantt-sidebar-cell"
                    data-row-id={strip.rowId}
                    data-column-key={col.key}
                    {...(isMerged ? { rowSpan: span } : {})}
                    style={{
                      padding: '0 8px',
                      fontSize: `${t.sidebarBodyFontSize}px`,
                      fontWeight: isMerged ? 600 : 400,
                      color: t.sidebarBodyCellLabel,
                      borderRight: `1px solid ${t.sidebarBodyCellBorder}`,
                      borderBottom: `1px solid ${t.sidebarBodyCellBorder}`,
                      verticalAlign: 'middle',
                      textAlign: isMerged ? 'center' : 'left',
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {value === undefined ? '' : String(value)}
                  </td>,
                ];
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  ) : null;

  // Wrapper grid template — single column when no sidebar (existing
  // pre-Phase-48 shape preserved), 3-column when sidebar is rendered
  // (column 1 = sidebar at its current effective width, column 2 =
  // sidebar-divider drag handle at fixed SIDEBAR_DIVIDER_WIDTH,
  // column 3 = chart at `auto` so horizontal overflow scrolls inside
  // the chart pane). Phase 50 adds the divider column.
  // Pin row 1 to the canonical header-band height so the sidebar header's
  // 1px bottom-divider border (and any table-content slack) is absorbed
  // inside the fixed track instead of leaking into an `auto` row — matches
  // gantt-vue3 / gantt-vue2 (`gridTemplateRows: `${totalHeaderBandHeight}px ...``),
  // which previously made the React header band render ~1px taller (45 vs 44).
  const headerBandRow = `${totalHeaderBandHeight}px ${maxBodyHeight ?? 'auto'}`;
  const wrapperGridStyle: CSSProperties = hasSidebar
    ? {
        display: 'grid',
        gridTemplateColumns: `${sidebarWidth}px ${SIDEBAR_DIVIDER_WIDTH}px auto`,
        gridTemplateRows: headerBandRow,
      }
    : { display: 'grid', gridTemplateColumns: '1fr', gridTemplateRows: headerBandRow };

  const chartWrapperNode: ReactElement = (
    <div ref={wrapperRef} className="cx-gantt-wrapper" style={wrapperGridStyle}>
      {hasSidebar ? (
        <div
          className="cx-gantt-sidebar-header-pane"
          style={{
            overflow: 'hidden',
            minWidth: 0,
            gridColumn: 1,
            gridRow: 1,
            // Divider lives on the pane (a grid item whose height = the
            // header-band row), not on the inner header element: the inner
            // header's own height is driven by its table content, so a
            // border on it is clipped by this pane's `overflow: hidden`
            // whenever the chart header is shorter, and floats mid-band
            // whenever it is taller. On the pane the line always sits at
            // the band's bottom edge, aligned with the chart header.
            borderBottom: `1px solid ${t.sidebarHeaderDivider}`,
            boxSizing: 'border-box',
          }}
        >
          <div
            ref={sidebarHeaderInnerRef}
            className="cx-gantt-sidebar-header-inner"
            style={{ willChange: 'transform' }}
          >
            <div
              className="cx-gantt-sidebar-header"
              style={{
                background: t.sidebarBackground,
                boxSizing: 'border-box',
              }}
            >
              {sidebarHeaderTable}
            </div>
          </div>
        </div>
      ) : null}
      {hasSidebar ? (
        <div
          ref={dividerRef}
          className="cx-gantt-sidebar-divider"
          data-cx-divider="sidebar"
          style={{
            gridColumn: 2,
            gridRow: '1 / 3',
            cursor: 'col-resize',
            zIndex: 4,
            background: 'transparent',
            userSelect: 'none',
            touchAction: 'none',
          }}
          onPointerDown={onDividerPointerDown}
          onPointerMove={onDividerPointerMove}
          onPointerUp={onDividerPointerUp}
          onPointerCancel={onDividerPointerCancel}
        />
      ) : null}
      <div
        className="cx-gantt-chart-header-pane"
        style={{
          overflow: 'hidden',
          gridColumn: hasSidebar ? 3 : 1,
          gridRow: 1,
        }}
      >
        <div
          ref={chartHeaderInnerRef}
          className="cx-gantt-chart-header-inner"
          style={{ willChange: 'transform' }}
        >
          <svg
            className="cx-gantt-header"
            width={totalWidth}
            height={totalHeaderBandHeight}
            xmlns={SVG_NS}
            style={{ display: 'block', background: t.headerBackground }}
          >
            <g className="cx-gantt-header-rows">
              {axis.headerRows.map((row, rowIdx) => {
                const rowY = rowIdx * hrh;
                const bandIndex = rowIdx + 1;
                return row.cells.map((cell, cellIdx) => {
                  // Phase 41 — derive per-cell day meta + invoke
                  // headerCellClassNamesCallback so extras can append
                  // onto the rect className (or slot args).
                  const { date, dayMeta } = deriveBandCellMeta(cell);
                  const extraClasses = callHeaderCellClassNames({
                    bandIndex,
                    cellIndex: cellIdx,
                    date,
                    label: cell.label,
                    dayMeta,
                    viewId: axisInput.viewId,
                  });
                  if (headerCellTemplate) {
                    const args: HeaderCellSlotArgs = {
                      bandIndex,
                      cellIndex: cellIdx,
                      x: cell.x,
                      y: rowY,
                      width: cell.width,
                      height: hrh,
                      label: cell.label,
                      date,
                      dayMeta,
                      theme: t,
                      cell,
                      extraClasses,
                    };
                    return (
                      <Fragment key={`band-${rowIdx}-${cellIdx}`}>
                        {
                          headerCellTemplate({
                            slot: HEADER_CELL_SLOT_NAME,
                            args: args as unknown as Readonly<Record<string, unknown>>,
                          }) as ReactNode
                        }
                      </Fragment>
                    );
                  }
                  const dayClasses = dayMeta ? getDayClassNames(dayMeta) : [];
                  const cellClassName = ['cx-gantt-header-cell', ...dayClasses, ...extraClasses]
                    .filter(Boolean)
                    .join(' ');
                  // Snap both vertical edges to the device pixel grid so the
                  // band cell border overlays the tick line at the same
                  // boundary (same helper as the tick + body grid vlines).
                  const cellXLeft = snapVerticalGridLineX(cell.x, axis.totalWidth);
                  const cellXRight = snapVerticalGridLineX(cell.x + cell.width, axis.totalWidth);
                  const cellW = cellXRight - cellXLeft;
                  return (
                    <g key={`band-${rowIdx}-${cellIdx}`}>
                      <rect
                        className={cellClassName}
                        x={cellXLeft}
                        y={rowY}
                        width={cellW}
                        height={hrh}
                        fill={t.headerCellFill}
                        stroke={t.headerCellStroke}
                        vectorEffect="non-scaling-stroke"
                      />
                      <text
                        className="cx-gantt-header-cell-label"
                        x={cellXLeft + cellW / 2}
                        y={rowY + hrh / 2 + 4}
                        textAnchor="middle"
                        fill={t.headerCellLabel}
                        fontSize={t.headerCellLabelFontSize}
                      >
                        {cell.label}
                      </text>
                    </g>
                  );
                });
              })}
            </g>
            {resolvedTodayCellBg !== null ? (
              <rect
                className="cx-gantt-today-cell"
                data-today-cell-side="header"
                x={resolvedTodayCellBg.x}
                y={0}
                width={resolvedTodayCellBg.width}
                height={totalHeaderBandHeight}
                fill={resolvedTodayCellBg.color}
                pointerEvents="none"
              />
            ) : null}
            <g className="cx-gantt-axis" transform={`translate(0, ${headerRowsHeight})`}>
              {axis.ticks.map((tick, tickIdx) => {
                // Phase 41 — derive per-tick day meta + invoke the
                // headerCellClassNamesCallback so extras append onto
                // the tick label className (or slot args). Tick row
                // uses bandIndex = 0 by convention.
                const tickDayMeta = deriveTickMeta(tick);
                const extraClasses = callHeaderCellClassNames({
                  bandIndex: 0,
                  cellIndex: tickIdx,
                  date: tick.time,
                  label: tick.label,
                  dayMeta: tickDayMeta,
                  viewId: axisInput.viewId,
                });
                if (headerCellTemplate) {
                  // Tick-row slot variant: `bandIndex = 0` (innermost row),
                  // `tick` populated, `cell` undefined. width/height are the
                  // approximate bbox of the default `<line>+<text>` pair —
                  // slot templates needing precise label geometry recompute
                  // from `tick.x` + `axis.ticks[tickIdx + 1]?.x ?? totalWidth`.
                  const nextTickX = axis.ticks[tickIdx + 1]?.x ?? axis.totalWidth;
                  const args: HeaderCellSlotArgs = {
                    bandIndex: 0,
                    cellIndex: tickIdx,
                    x: tick.x,
                    y: 0,
                    width: Math.max(0, nextTickX - tick.x),
                    height: hh,
                    label: tick.label,
                    date: tick.time,
                    dayMeta: tickDayMeta,
                    theme: t,
                    tick,
                    extraClasses,
                  };
                  return (
                    <Fragment key={`tick-${tick.x}`}>
                      {
                        headerCellTemplate({
                          slot: HEADER_CELL_SLOT_NAME,
                          args: args as unknown as Readonly<Record<string, unknown>>,
                        }) as ReactNode
                      }
                    </Fragment>
                  );
                }
                const dayClasses = tickDayMeta ? getDayClassNames(tickDayMeta) : [];
                const tickLabelClassName = ['cx-gantt-tick-label', ...dayClasses, ...extraClasses]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <g key={`tick-${tick.x}`}>
                    <line
                      className="cx-gantt-tick-line"
                      x1={snapVerticalGridLineX(tick.x, axis.totalWidth)}
                      y1={0}
                      x2={snapVerticalGridLineX(tick.x, axis.totalWidth)}
                      y2={hh}
                      stroke={t.headerTickStroke}
                      strokeWidth={1}
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      className={tickLabelClassName}
                      x={tick.x + 2}
                      y={hh - 6}
                      fill={t.headerTickLabel}
                      fontSize={t.tickLabelFontSize}
                    >
                      {tick.label}
                    </text>
                  </g>
                );
              })}
              {hh > 0 && (
                <line
                  className="cx-gantt-axis-divider"
                  x1={0}
                  y1={hh}
                  x2={axis.totalWidth}
                  y2={hh}
                  stroke={t.headerDivider}
                />
              )}
            </g>
            {headerExtras}
          </svg>
        </div>
      </div>
      {hasSidebar ? (
        <div
          ref={sidebarPaneRef}
          className="cx-gantt-sidebar-pane"
          style={{
            overflow: 'auto',
            minWidth: 0,
            gridColumn: 1,
            gridRow: 2,
            ...(maxBodyHeight !== undefined ? { maxHeight: maxBodyHeight } : {}),
          }}
        >
          <div className="cx-gantt-sidebar-body" style={{ background: t.sidebarBackground }}>
            {sidebarBodyTable}
          </div>
        </div>
      ) : null}
      <div
        ref={chartPaneRef}
        className="cx-gantt-chart-pane"
        style={{
          overflow: 'auto',
          gridColumn: hasSidebar ? 3 : 1,
          gridRow: 2,
          ...(maxBodyHeight !== undefined ? { maxHeight: maxBodyHeight } : {}),
        }}
      >
        <svg
          ref={bodySvgRef}
          className="cx-gantt-body"
          width={totalWidth}
          height={bodyHeight}
          xmlns={SVG_NS}
          style={{ display: 'block', touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <defs className="cx-gantt-defs">{defsChildren}</defs>
          {resolvedTodayCellBg !== null ? (
            <rect
              className="cx-gantt-today-cell"
              data-today-cell-side="body"
              x={resolvedTodayCellBg.x}
              y={0}
              width={resolvedTodayCellBg.width}
              height={bodyHeight}
              fill={resolvedTodayCellBg.color}
              pointerEvents="none"
            />
          ) : null}
          {bodySlotsGroupNode}
          {gridGroupNode}
          {todayLineBodyNode}
          <g className="cx-gantt-links" pointerEvents="none">
            {linkPathNodes}
          </g>
          <g
            className="cx-gantt-bars"
            onPointerOver={onBarsPointerOver}
            onPointerOut={onBarsPointerOut}
          >
            {barRenderInputs.map(({ bar, isSelected, sourceBar, resolvedStyle }) => {
              // Live geometry: when a `bar-drag` or `bar-resize` transaction
              // is active on THIS bar, shift the rendered rect by the
              // transaction's `deltaX` / `deltaY`. The progress fill + handle
              // below read from the same render geometry so the overlay stays
              // anchored to the bar's visible body during the drag.
              // Mirrors chronix-vue3 lines 2057-2102.
              let renderX = bar.x;
              let renderY = bar.y;
              let renderWidth = bar.width;
              if (activeTxn && 'barId' in activeTxn && activeTxn.barId === bar.barId) {
                if (activeTxn.kind === 'bar-drag') {
                  renderX = bar.x + activeTxn.deltaX;
                  // Cross-row snap: when the pointer is over a strip that
                  // differs from the source row, position the bar at the
                  // target strip's Y plus the same intra-strip offset the
                  // bar had at drag-start. When projection is null (gap or
                  // out-of-content) or matches the source row, free-fall
                  // by deltaY so the bar follows the pointer smoothly.
                  const projectedRowId = pointer.projectedRowId;
                  const sourceBarLocal = bars.find((b) => b.id === bar.barId);
                  const sourceRowId = sourceBarLocal?.rowId;
                  if (
                    projectedRowId !== null &&
                    sourceRowId !== undefined &&
                    projectedRowId !== sourceRowId
                  ) {
                    const sourceStrip = stripByRowId.get(sourceRowId);
                    const targetStrip = stripByRowId.get(projectedRowId);
                    if (sourceStrip && targetStrip) {
                      const intraStripOffset = bar.y - sourceStrip.y;
                      renderY = targetStrip.y + intraStripOffset;
                    } else {
                      renderY = bar.y + activeTxn.deltaY;
                    }
                  } else {
                    renderY = bar.y + activeTxn.deltaY;
                  }
                } else if (activeTxn.kind === 'bar-resize') {
                  if (activeTxn.edge === 'start') {
                    renderX = bar.x + activeTxn.deltaX;
                    renderWidth = Math.max(0, bar.width - activeTxn.deltaX);
                  } else {
                    renderWidth = Math.max(0, bar.width + activeTxn.deltaX);
                  }
                }
              }

              const selectionHasAxisOverlap =
                renderX < axis.totalWidth && renderX + renderWidth > 0;
              const resizerThickness = t.barResizerThickness;
              const dotSize = t.barResizerDotSize;
              const dotY = renderY + (bar.height - dotSize) / 2;

              // Phase 32.4 + Phase 44 D.6 — base classes + state-modifier
              // classes + callback-supplied class names. Order matters:
              // built-in + modifiers + callback classes — consumer CSS
              // can use `.priority-high.cx-gantt-bar { ... }` descendants
              // without specificity surprises.
              //
              // Phase 44 state-modifier classes mirror the parity
              // reference's wrapper-group classes so consumer CSS hooks
              // like `.cx-gantt-bar--dragging { opacity: 0.8 }` work.
              // `--dragging` / `--resizing` fire when the active txn's
              // kind + barId match this bar. `--start` / `--end` come
              // from `bar.isStart` / `bar.isEnd`. `--draggable` /
              // `--resizable` follow the single-knob `editable` prop.
              // Phase 54 — split gating so consumers can style drag-only
              // / resize-only bars distinctly.
              const startGate = eventStartEditable !== false; // default true
              const durationGate = eventDurationEditable !== false;
              const modifierClasses: string[] = [];
              if (editable && startGate) {
                modifierClasses.push('cx-gantt-bar--draggable');
              }
              if (editable && durationGate) {
                modifierClasses.push('cx-gantt-bar--resizable');
              }
              if (activeTxn?.kind === 'bar-drag' && activeTxn.barId === bar.barId) {
                modifierClasses.push('cx-gantt-bar--dragging');
              }
              if (activeTxn?.kind === 'bar-resize' && activeTxn.barId === bar.barId) {
                modifierClasses.push('cx-gantt-bar--resizing');
              }
              if (bar.isStart) modifierClasses.push('cx-gantt-bar--start');
              if (bar.isEnd) modifierClasses.push('cx-gantt-bar--end');
              if (isSelected) modifierClasses.push('cx-gantt-bar--selected');
              const barClass = [
                'cx-gantt-bar',
                ...modifierClasses,
                ...resolvedStyle.classNames,
              ].join(' ');

              // Default-render bar `<rect>` OR slot template's ReactNode. Slot
              // templates take the same `BarSlotArgs` shape as vue3 — Phase 20
              // cascade fields (`resolvedBackgroundColor` etc.) now flow from
              // the cascade resolver output (Phase 32.3 had theme defaults).
              let barNode: ReactNode;
              if (barTemplate && sourceBar) {
                const slotArgs: BarSlotArgs = {
                  placedBar: bar,
                  sourceBar,
                  renderX,
                  renderY,
                  renderWidth,
                  renderHeight: bar.height,
                  theme: t,
                  activeTransaction: activeTxn,
                  isSelected,
                  resolvedBackgroundColor: resolvedStyle.backgroundColor,
                  resolvedBorderColor: resolvedStyle.borderColor,
                  resolvedTextColor: resolvedStyle.textColor,
                };
                barNode = barTemplate({
                  slot: BAR_SLOT_NAME,
                  args: slotArgs as unknown as Readonly<Record<string, unknown>>,
                }) as ReactNode;
              } else {
                barNode = (
                  <rect
                    className={barClass}
                    data-bar-id={bar.barId}
                    x={renderX}
                    y={renderY}
                    width={renderWidth}
                    height={bar.height}
                    fill={resolvedStyle.backgroundColor}
                    stroke={resolvedStyle.borderColor}
                  />
                );
              }

              // Phase 53 — progress-fill overlay (early-paint, BEFORE
              // continuation triangles + title text so the translucent
              // overlay doesn't wash them out). Mirrors chronix-vue3
              // Phase 44 D.5 paint-order verbatim. Bar must declare both
              // `progress.value` + `pointerOverlayId`; the fill spans 0..
              // value% of bar.width. During a progress-handle drag on
              // THIS bar, the displayed value follows the in-flight
              // `activeTxn.projectedProgress` so the handle visibly tracks
              // the pointer; on commit the demo writes back to
              // `bar.progress.value` and the render falls through to the
              // persisted path.
              const sourceProgressEarly = barProgressById.get(bar.barId);
              const overlayIdEarly = overlayIdByBarId.get(bar.barId);
              let progressFillNode: ReactNode = null;
              if (sourceProgressEarly !== undefined && overlayIdEarly !== undefined) {
                const displayedProgressEarly =
                  activeTxn?.kind === 'progress-handle' && activeTxn.barId === bar.barId
                    ? Math.max(0, Math.min(100, activeTxn.projectedProgress))
                    : sourceProgressEarly;
                const clampedEarly = Math.max(0, Math.min(100, displayedProgressEarly));
                const fillWidthEarly = (clampedEarly / 100) * renderWidth;
                progressFillNode = (
                  <rect
                    key={`${bar.barId}-progress-fill`}
                    className="cx-gantt-progress-fill"
                    data-progress-bar-id={bar.barId}
                    x={renderX}
                    y={renderY}
                    width={fillWidthEarly}
                    height={bar.height}
                    fill={t.progressFill}
                    fillOpacity={t.progressFillOpacity}
                    pointerEvents="none"
                  />
                );
              }

              // Phase 32.5.1 — viewport-clipping derivation. Pure helper
              // returns per-edge clip flags + viewport-locked apex coords
              // in content-coord space. Both flags short-circuit to false
              // when `clientWidth === 0` (pre-mount frame) so existing
              // SFC tests stay pixel-identical to Phase 32.4 output.
              const viewportClip = deriveViewportClipping(
                renderX,
                renderWidth,
                chartScroll.scrollLeft,
                chartScroll.clientWidth,
                TRIANGLE_MARGIN,
              );

              // Phase 32.4 / 32.5.1 — continuation triangles. Apex 1 px
              // inside the bar edge for axis-clipped (Phase 27); 1 px
              // inside the viewport edge for viewport-clipped (Phase 27.1)
              // — viewport-clipped wins precedence. `data-axis-clipped` +
              // `data-viewport-clipped` data attrs record which sub-case
              // fired so cross-demo parity assertions can distinguish.
              // Fire-gate is OR: viewport-clipped fires even when the
              // bar's axis edge is in-bounds (`bar.isStart === true`).
              const centerY = renderY + bar.height / 2;
              const fireLeftTriangle = !bar.isStart || viewportClip.isViewportClippedStart;
              const fireRightTriangle = !bar.isEnd || viewportClip.isViewportClippedEnd;
              const leftTriangleApexX = viewportClip.isViewportClippedStart
                ? viewportClip.viewportLockedLeftApexX
                : renderX + TRIANGLE_MARGIN;
              const rightTriangleApexX = viewportClip.isViewportClippedEnd
                ? viewportClip.viewportLockedRightApexX
                : renderX + renderWidth - TRIANGLE_MARGIN;
              const leftTriangleNode = fireLeftTriangle ? (
                <polygon
                  key={`${bar.barId}-continuation-left`}
                  className="cx-gantt-bar-continuation-indicator cx-gantt-bar-continuation-left"
                  data-bar-id={bar.barId}
                  data-axis-clipped={!bar.isStart ? 'true' : 'false'}
                  data-viewport-clipped={viewportClip.isViewportClippedStart ? 'true' : 'false'}
                  points={`${leftTriangleApexX},${centerY} ${leftTriangleApexX + TRIANGLE_SIZE},${centerY - TRIANGLE_SIZE} ${leftTriangleApexX + TRIANGLE_SIZE},${centerY + TRIANGLE_SIZE}`}
                  fill="#000"
                  opacity={0.8}
                  pointerEvents="none"
                />
              ) : null;
              const rightTriangleNode = fireRightTriangle ? (
                <polygon
                  key={`${bar.barId}-continuation-right`}
                  className="cx-gantt-bar-continuation-indicator cx-gantt-bar-continuation-right"
                  data-bar-id={bar.barId}
                  data-axis-clipped={!bar.isEnd ? 'true' : 'false'}
                  data-viewport-clipped={viewportClip.isViewportClippedEnd ? 'true' : 'false'}
                  points={`${rightTriangleApexX},${centerY} ${rightTriangleApexX - TRIANGLE_SIZE},${centerY - TRIANGLE_SIZE} ${rightTriangleApexX - TRIANGLE_SIZE},${centerY + TRIANGLE_SIZE}`}
                  fill="#000"
                  opacity={0.8}
                  pointerEvents="none"
                />
              ) : null;

              // Phase 32.4 / 32.5.1 — bar title auto-render. Char-count
              // truncation via `truncateBarText`; empty truncation output
              // suppresses the node. Title-start / -end x via
              // `deriveEdgePaddedX` 3-branch (viewport-clipped wins over
              // axis-clipped wins over default).
              //
              // Phase 47.3 — title-side viewport-locking fires ONLY on the
              // left side (when the bar's left edge is past the viewport's
              // left boundary). The right side keeps default positioning
              // so the title naturally appears at the bar's left edge,
              // improving readability while triangles + progress-dots keep
              // their per-side viewport-lock semantics (those are continuation
              // indicators that should appear at the viewport edge whenever
              // the bar extends past it). This simplified behavior avoids
              // the negative `availableWidth` (titleEndX < titleStartX) issue
              // from Phase 47.2's bilateral span check.
              const titleHasAxisOverlap = renderX < axis.totalWidth && renderX + renderWidth > 0;
              const title = sourceBar?.title;
              let titleNode: ReactNode = null;
              if (titleHasAxisOverlap && title && title.length > 0 && renderWidth > 30) {
                const titleStartX = deriveEdgePaddedX(
                  'start',
                  renderX,
                  viewportClip.viewportLockedLeftApexX,
                  !bar.isStart,
                  viewportClip.isViewportClippedStart,
                  TITLE_LEFT_PADDING,
                  TRIANGLE_MARGIN,
                  TRIANGLE_SIZE,
                  TITLE_TRIANGLE_GAP,
                );
                const titleEndX = deriveEdgePaddedX(
                  'end',
                  renderX + renderWidth,
                  viewportClip.viewportLockedRightApexX,
                  !bar.isEnd,
                  false,
                  TITLE_RIGHT_PADDING,
                  TRIANGLE_MARGIN,
                  TRIANGLE_SIZE,
                  TITLE_TRIANGLE_GAP,
                );
                const availableWidth = Math.max(0, titleEndX - titleStartX);
                if (availableWidth >= 10) {
                  // Get progress for title display
                  const sourceProgressForTitle = barProgressById.get(bar.barId);
                  const displayedProgressForTitle =
                    activeTxn?.kind === 'progress-handle' && activeTxn.barId === bar.barId
                      ? Math.max(0, Math.min(100, activeTxn.projectedProgress))
                      : (sourceProgressForTitle ?? 0);
                  const clampedProgressForTitle = Math.max(
                    0,
                    Math.min(100, displayedProgressForTitle),
                  );
                  const progressSuffix =
                    sourceProgressForTitle !== undefined
                      ? ` (${Math.round(clampedProgressForTitle)}%)`
                      : '';
                  const titleWithProgress = title + progressSuffix;
                  const truncated = truncateBarText(
                    titleWithProgress,
                    availableWidth,
                    resolvedStyle.fontSize,
                  );
                  if (truncated.length > 0) {
                    titleNode = (
                      <text
                        key={`${bar.barId}-title`}
                        className="cx-gantt-bar-text"
                        data-bar-id={bar.barId}
                        x={titleStartX}
                        y={renderY + bar.height / 2}
                        fill={resolvedStyle.textColor}
                        fontSize={resolvedStyle.fontSize}
                        fontWeight={resolvedStyle.fontWeight}
                        fontFamily="inherit"
                        textAnchor="start"
                        dominantBaseline="middle"
                        pointerEvents="none"
                        style={{ userSelect: 'none' }}
                      >
                        {truncated}
                      </text>
                    );
                  }
                }
              }

              // Phase 53 — progress-handle (LATE-paint — after continuation
              // triangles + title text so the handle remains on top).
              // Upward-pointing triangle below bar edge (tip touching bar bottom),
              // only visible when the handle itself is hovered or during active drag.
              let progressHandleNode: ReactNode = null;
              const sourceProgress = barProgressById.get(bar.barId);
              const overlayId = overlayIdByBarId.get(bar.barId);
              const isHandleHovered = hoveredProgressHandleIds.has(bar.barId);
              const isDraggingProgress =
                activeTxn?.kind === 'progress-handle' && activeTxn.barId === bar.barId;
              if (
                sourceProgress !== undefined &&
                overlayId !== undefined &&
                (isHandleHovered || isDraggingProgress)
              ) {
                const displayedProgress =
                  activeTxn?.kind === 'progress-handle' && activeTxn.barId === bar.barId
                    ? Math.max(0, Math.min(100, activeTxn.projectedProgress))
                    : sourceProgress;
                const clamped = Math.max(0, Math.min(100, displayedProgress));
                const fillWidth = (clamped / 100) * renderWidth;
                const handleX = renderX + fillWidth;
                const handleY = renderY + bar.height;
                const TRIANGLE_SIZE = 6;
                progressHandleNode = (
                  <polygon
                    key={`${bar.barId}-progress-handle`}
                    className="cx-gantt-progress-handle"
                    data-progress-bar-id={bar.barId}
                    data-overlay-id={overlayId}
                    points={`${handleX - TRIANGLE_SIZE},${handleY + TRIANGLE_SIZE} ${handleX + TRIANGLE_SIZE},${handleY + TRIANGLE_SIZE} ${handleX},${handleY}`}
                    fill={t.progressHandleFill}
                    stroke={t.progressHandleStroke}
                    strokeWidth={t.progressHandleStrokeWidth}
                    style={{ cursor: 'ew-resize', pointerEvents: 'auto' }}
                  />
                );
              }

              return (
                <Fragment key={bar.barId}>
                  {barNode}
                  {progressFillNode}
                  {titleNode}
                  {leftTriangleNode}
                  {rightTriangleNode}
                  {progressHandleNode}
                  {selectionHasAxisOverlap && isSelected && (
                    <rect
                      className="cx-gantt-bar-selection-border"
                      data-bar-id={bar.barId}
                      x={renderX - 1}
                      y={renderY - 1}
                      width={renderWidth + 2}
                      height={bar.height + 2}
                      fill="none"
                      stroke={t.barSelectedBorderColor}
                      strokeWidth={t.barSelectedBorderWidth}
                      pointerEvents="none"
                    />
                  )}
                  {/* Phase 54 — gate resizer rects on eventDurationEditable. */}
                  {selectionHasAxisOverlap && editable && durationGate && (
                    <>
                      <rect
                        className="cx-gantt-bar-resizer-start"
                        data-bar-id={bar.barId}
                        x={renderX}
                        y={renderY}
                        width={resizerThickness}
                        height={bar.height}
                        fill="transparent"
                        style={{ cursor: 'ew-resize' }}
                      />
                      <rect
                        className="cx-gantt-bar-resizer-end"
                        data-bar-id={bar.barId}
                        x={renderX + renderWidth - resizerThickness}
                        y={renderY}
                        width={resizerThickness}
                        height={bar.height}
                        fill="transparent"
                        style={{ cursor: 'ew-resize' }}
                      />
                    </>
                  )}
                  {selectionHasAxisOverlap && isSelected && editable && durationGate && (
                    <>
                      <rect
                        className="cx-gantt-bar-resizer-dot-start"
                        data-bar-id={bar.barId}
                        x={deriveEdgePaddedX(
                          'start',
                          renderX,
                          viewportClip.viewportLockedLeftApexX,
                          !bar.isStart,
                          viewportClip.isViewportClippedStart,
                          DOT_EDGE_INSET,
                          TRIANGLE_MARGIN,
                          TRIANGLE_SIZE,
                          DOT_TRIANGLE_GAP,
                        )}
                        y={dotY}
                        width={dotSize}
                        height={dotSize}
                        fill="#ffffff"
                        stroke={t.barBorderColor}
                        pointerEvents="none"
                      />
                      <rect
                        className="cx-gantt-bar-resizer-dot-end"
                        data-bar-id={bar.barId}
                        x={
                          deriveEdgePaddedX(
                            'end',
                            renderX + renderWidth,
                            viewportClip.viewportLockedRightApexX,
                            !bar.isEnd,
                            viewportClip.isViewportClippedEnd,
                            DOT_EDGE_INSET,
                            TRIANGLE_MARGIN,
                            TRIANGLE_SIZE,
                            DOT_TRIANGLE_GAP,
                          ) - dotSize
                        }
                        y={dotY}
                        width={dotSize}
                        height={dotSize}
                        fill="#ffffff"
                        stroke={t.barBorderColor}
                        pointerEvents="none"
                      />
                    </>
                  )}
                </Fragment>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );

  // Phase 34 — conditional root wrapper. When a toolbar model is
  // present, prepend the toolbar inside a `cx-gantt-root` wrapper;
  // otherwise return the chart wrapper directly (pre-Phase-34
  // DOM-shape preserved). Mirrors vue3:3237-3246.
  if (toolbarModel === null) {
    return chartWrapperNode;
  }
  return (
    <div className="cx-gantt-root">
      {renderToolbar(toolbarModel, toolbarTitleText, t, onToolbarWidgetClick)}
      {chartWrapperNode}
    </div>
  );
});

// =====================================================================
// Phase 34 — header toolbar render helpers (module-scope per Decision B.1).
// Ported from vue3 chronix-gantt.ts:3253-3393 with `h()` → JSX idiom
// translation. 5 helpers: icon → button → widget-group → section →
// toolbar. Click delegates back to the FC body's `onToolbarWidgetClick`
// which routes through Phase 33's `emit('update:axisInput', ...)`
// helper so view/nav clicks fire `onAxisInputChange` + iterate
// `update:axisInput` subscribers (mirrors vue3's `emitToBoth`).
// =====================================================================

/**
 * Inline SVG icon for `prev` / `next` toolbar nav buttons. Matches
 * the original `Toolbar.tsx` polyline shape so visual
 * parity holds across all 3 adapters.
 */
function renderToolbarIcon(kind: 'prev' | 'next'): ReactElement {
  const points = kind === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6';
  return (
    <svg
      viewBox="0 0 24 24"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points={points} />
    </svg>
  );
}

function renderToolbarButton(
  widget: ToolbarWidget,
  themeTokens: ChronixTheme,
  onClick: (widget: ToolbarWidget) => void,
): ReactElement {
  const style: CSSProperties = {
    background: widget.isPressed ? themeTokens.toolbarButtonBgActive : themeTokens.toolbarButtonBg,
    color: widget.isPressed ? '#ffffff' : themeTokens.toolbarButtonColor,
    border: `1px solid ${themeTokens.toolbarButtonBorder}`,
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: '12px',
    lineHeight: '1.4',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px',
  };
  return (
    <button
      key={widget.buttonName}
      type="button"
      className={`cx-gantt-${widget.buttonName}-button`}
      data-button-name={widget.buttonName}
      data-button-kind={widget.kind}
      aria-pressed={widget.isPressed ? ('true' as const) : ('false' as const)}
      style={style}
      onClick={() => onClick(widget)}
    >
      {widget.iconSvg ? renderToolbarIcon(widget.iconSvg) : widget.labelText}
    </button>
  );
}

function renderToolbarWidgetGroup(
  group: readonly ToolbarWidget[],
  titleText: string,
  themeTokens: ChronixTheme,
  onClick: (widget: ToolbarWidget) => void,
  groupKey: string,
): ReactElement | null {
  if (group.length === 0) return null;
  const children: ReactElement[] = group.map((widget) => {
    if (widget.kind === 'title') {
      return (
        <h2
          key="title"
          className="cx-gantt-toolbar-title"
          data-button-name="title"
          data-button-kind="title"
          style={{
            margin: '0',
            fontSize: '14px',
            fontWeight: '600',
            color: themeTokens.toolbarTitleColor,
          }}
        >
          {titleText}
        </h2>
      );
    }
    return renderToolbarButton(widget, themeTokens, onClick);
  });
  if (children.length === 1) {
    // Single-widget groups render flat (no extra wrapper div).
    // Re-key so siblings in the section can stay unique.
    return <Fragment key={groupKey}>{children[0]!}</Fragment>;
  }
  return (
    <div
      key={groupKey}
      className="cx-gantt-button-group"
      style={{ display: 'inline-flex', gap: '0', alignItems: 'center' }}
    >
      {children}
    </div>
  );
}

function renderToolbarSection(
  section: readonly (readonly ToolbarWidget[])[],
  titleText: string,
  themeTokens: ChronixTheme,
  onClick: (widget: ToolbarWidget) => void,
  sectionKey: string,
): ReactElement {
  const groups = section
    .map((g, idx) =>
      renderToolbarWidgetGroup(g, titleText, themeTokens, onClick, `${sectionKey}-g${idx}`),
    )
    .filter((node): node is ReactElement => node !== null);
  return (
    <div
      key={sectionKey}
      className="cx-gantt-toolbar-chunk"
      style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}
    >
      {groups}
    </div>
  );
}

/**
 * Render the Phase 22 / Phase 34 toolbar above the chart. Three
 * sections (`start`, `center`, `end`); chronix `cx-*` class names so
 * the parity extractor can pair them across vue3/vue2/react. Click
 * delegates back to `onClick` — the FC body's `onToolbarWidgetClick`
 * translates each widget to an emit through Phase 33's
 * `emit('update:axisInput', ...)` helper via
 * `prev/next/today/changeView` math.
 */
function renderToolbar(
  model: ToolbarModel,
  titleText: string,
  themeTokens: ChronixTheme,
  onClick: (widget: ToolbarWidget) => void,
): ReactElement {
  return (
    <div
      className="cx-gantt-toolbar"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: themeTokens.toolbarBg,
        borderBottom: `1px solid ${themeTokens.toolbarButtonBorder}`,
      }}
    >
      {renderToolbarSection(model.sectionWidgets.start, titleText, themeTokens, onClick, 'start')}
      {renderToolbarSection(model.sectionWidgets.center, titleText, themeTokens, onClick, 'center')}
      {renderToolbarSection(model.sectionWidgets.end, titleText, themeTokens, onClick, 'end')}
    </div>
  );
}

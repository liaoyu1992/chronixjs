import {
  ALL_VIEW_IDS,
  BAR_SLOT_NAME,
  HEADER_CELL_SLOT_NAME,
  LINK_SLOT_NAME,
  SIDEBAR_DIVIDER_WIDTH,
  applyIncrement,
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
  hitTestFromClient,
  nextAnchor,
  parseToolbar,
  predecessorAnchor,
  prevAnchor,
  resolveBarStyle,
  snapHorizontalGridLineY,
  successorAnchor,
  todayAnchor,
  truncateBarText,
  xToTime,
} from '@chronixjs/gantt';
import {
  computed,
  defineComponent,
  h,
  onMounted,
  onUnmounted,
  ref,
  watchEffect,
  type PropType,
  type Ref,
  type VNode,
} from 'vue';

import { useChartScrollState } from './use-chart-scroll-state.js';
import { useGanttLayout } from './use-gantt-layout.js';
import {
  useGanttPointer,
  type BarDropPayload,
  type BarDropRejectedPayload,
  type BarProgressPayload,
  type BarResizePayload,
  type BarResizeRejectedPayload,
  type SelectPayload,
  type SelectRejectedPayload,
} from './use-gantt-pointer.js';
import { useScrollSync } from './use-scroll-sync.js';

import type { BarClickPayload, EmptyAreaClickPayload } from './use-gantt-selection.js';
import type {
  AxisHeaderCell,
  AxisRangePlanInput,
  AxisTick,
  BarClassNamesFunc,
  BarColorFunc,
  BarFontSizeFunc,
  BarFontWeightFunc,
  BarSlotArgs,
  BarSpec,
  BarTable,
  CellStateMeta,
  ChronixTheme,
  ColumnSpec,
  CustomLinkMarker,
  EventAllowFunc,
  EventConstraint,
  EventOverlapFunc,
  GanttEventMap,
  GanttHandle,
  HeaderCellArg,
  HeaderCellClassNamesFunc,
  HeaderCellSlotArgs,
  IncrementDelta,
  LinkMarker,
  LinkRenderArg,
  LinkRenderFunc,
  LinkSlotArgs,
  LinkSpec,
  LinkTable,
  PlacedBar,
  RoutedLink,
  RowDataSource,
  RowSpec,
  SelectAllowFunc,
  SlotRegistry,
  TimeRange,
  TodayCellBgOption,
  TodayLineOption,
  ToolbarInput,
  ToolbarModel,
  ToolbarWidget,
  ViewId,
} from '@chronixjs/gantt';

/**
 * Public payload for the `'bar-dragstart'` emit. Fires the first time
 * a `bar-drag` transaction's pointer delta becomes non-zero after
 * pointerdown — pure clicks (0-delta abort) leave it unfired so a
 * click on a draggable bar emits `'bar-click'` only.
 */
export interface BarDragStartPayload {
  readonly barId: string;
  readonly sourceBar: BarSpec;
  readonly jsEvent: PointerEvent;
}

/**
 * Public payload for the `'bar-dragstop'` emit. Fires at pointerup
 * (commit path, immediately BEFORE `'bar-drop'`) or pointercancel
 * (abort path, with no following `'bar-drop'`). Only fires if
 * `'bar-dragstart'` fired for the same transaction.
 */
export interface BarDragStopPayload {
  readonly barId: string;
  readonly sourceBar: BarSpec;
  readonly jsEvent: PointerEvent;
}

/** Symmetric to `BarDragStartPayload` for the `bar-resize` lifecycle. */
export interface BarResizeStartPayload {
  readonly barId: string;
  readonly sourceBar: BarSpec;
  readonly edge: 'start' | 'end';
  readonly jsEvent: PointerEvent;
}

/** Symmetric to `BarDragStopPayload` for the `bar-resize` lifecycle. */
export interface BarResizeStopPayload {
  readonly barId: string;
  readonly sourceBar: BarSpec;
  readonly edge: 'start' | 'end';
  readonly jsEvent: PointerEvent;
}

// Phase 50: `MIN_SIDEBAR_AREA_WIDTH` + `SIDEBAR_DIVIDER_WIDTH` moved
// to `@chronixjs/gantt` core (Decision B.1). Imported at the top of
// this module from `@chronixjs/gantt`; the inline clamp math at the
// pointermove handler now calls `clampSidebarWidth(proposed,
// wrapperWidth)` for the same Phase 38 / Phase 49 re-export idiom.

/**
 * Encode a color string into the suffix used in marker ids. Strips
 * non-alphanumeric (e.g. `'#3788d8'` → `'3788d8'`, `'rgb(255, 0, 0)'`
 * → `'rgb25500'`). Matches the original encoding.
 */
function markerColorId(color: string): string {
  return color.replace(/[^a-zA-Z0-9]/g, '');
}

/** The 7 built-in marker shapes (excludes `'none'` which has no def). */
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
 * One built-in `<marker>` def. Geometry ports verbatim from the
 * original `renderMarker` (horizontal direction only;
 * chronix v0 emits forward-only paths, so all markers point right).
 * Width / height fixed at 4.5; `markerUnits="strokeWidth"` scales with
 * stroke; `overflow="visible"` keeps the shape from being clipped at
 * its bounding box.
 */
function renderBuiltinMarker(
  type: BuiltinMarkerType,
  color: string,
  colorId: string,
): ReturnType<typeof h> {
  const id = `cx-marker-${type}-${colorId}`;
  const baseProps = {
    id,
    markerWidth: 4.5,
    markerHeight: 4.5,
    markerUnits: 'strokeWidth',
    overflow: 'visible',
  };
  switch (type) {
    case 'arrow':
      return h('marker', { key: id, ...baseProps, refX: 4, refY: 2.25, orient: 'auto' }, [
        h('polygon', { points: '0 0, 4.5 2.25, 0 4.5', fill: color }),
      ]);
    case 'diamond':
      return h('marker', { key: id, ...baseProps, refX: 4.5, refY: 2.5, orient: 'auto' }, [
        h('polygon', { points: '0 2.5, 2.5 0, 5 2.5, 2.5 5', fill: color }),
      ]);
    case 'diamond-hollow':
      return h('marker', { key: id, ...baseProps, refX: 4.5, refY: 2.5, orient: 'auto' }, [
        h('polygon', {
          points: '0 2.5, 2.5 0, 5 2.5, 2.5 5',
          fill: 'white',
          stroke: color,
          'stroke-width': 1.0,
        }),
      ]);
    case 'circle':
      return h('marker', { key: id, ...baseProps, refX: 5, refY: 3 }, [
        h('circle', { cx: 3, cy: 3, r: 2.0, fill: color }),
      ]);
    case 'circle-hollow':
      return h('marker', { key: id, ...baseProps, refX: 5.75, refY: 3 }, [
        h('circle', {
          cx: 3,
          cy: 3,
          r: 2.0,
          fill: 'white',
          stroke: color,
          'stroke-width': 1.5,
        }),
      ]);
    case 'pointer':
      return h('marker', { key: id, ...baseProps, refX: 5, refY: 2.5, orient: 'auto' }, [
        h('polygon', { points: '0 0, 6 2.5, 0 5, 1.5 2.5', fill: color }),
      ]);
    case 'plus':
      return h('marker', { key: id, ...baseProps, refX: 4, refY: 2.5, orient: 'auto' }, [
        h('path', {
          d: 'M 2.5 0.5 L 2.5 2 L 4 2 L 4 3 L 2.5 3 L 2.5 4.5 L 1.5 4.5 L 1.5 3 L 0 3 L 0 2 L 1.5 2 L 1.5 0.5 Z',
          fill: color,
        }),
      ]);
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown built-in marker type: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Render a user-defined marker shape. The custom marker is positioned
 * at its viewBox origin and emits one child per `paths` entry. v0 uses
 * the same `refX=4`, `refY=2.25`, `orient='auto'` as the built-in
 * arrow — consumers who need a different refX can wrap the custom
 * marker's paths to embed offsets. Marker id matches the built-in
 * scheme: `cx-marker-${customMarker.id}-${colorId}` so `marker-end`
 * URL resolution is uniform.
 */
function renderCustomMarker(
  marker: CustomLinkMarker,
  color: string,
  colorId: string,
): ReturnType<typeof h> {
  const id = `cx-marker-${marker.id}-${colorId}`;
  const baseProps = {
    id,
    viewBox: marker.viewBox,
    markerWidth: 4.5,
    markerHeight: 4.5,
    markerUnits: 'strokeWidth',
    overflow: 'visible',
    refX: 4,
    refY: 2.25,
    orient: 'auto',
  };
  return h(
    'marker',
    { key: id, ...baseProps },
    marker.paths.map((p, i) =>
      h('path', {
        key: `${id}-p${i}`,
        d: p.d,
        fill: p.fill ?? color,
        stroke: p.stroke ?? 'none',
        ...(p.strokeWidth !== undefined ? { 'stroke-width': p.strokeWidth } : {}),
      }),
    ),
  );
}

/**
 * Resolve a link's `marker-end` URL for a given color. Returns `null`
 * for `'none'` so the caller omits the `marker-end` attribute entirely
 * (an empty `url(...)` reference would suppress strokes in some browsers).
 */
function markerEndUrl(marker: LinkMarker | CustomLinkMarker, color: string): string | null {
  if (marker === 'none') return null;
  const colorId = markerColorId(color);
  const markerKey = typeof marker === 'string' ? marker : marker.id;
  return `url(#cx-marker-${markerKey}-${colorId})`;
}

/**
 * Phase 27: continuation triangle geometry. `TRIANGLE_SIZE` is the
 * half-base (so total base height is 12px; apex-to-base distance is
 * 6px). `TRIANGLE_MARGIN` insets the apex from the bar's edge so the
 * triangle sits inside the bar body rather than flush with the edge.
 * Match the original geometry verbatim for visual parity.
 */
const TRIANGLE_SIZE = 6;
const TRIANGLE_MARGIN = 1;

/**
 * Phase 28.2: bar title text positioning. Default left padding
 * pushes the title 8 px right of the bar's left edge; default right
 * padding leaves 4 px clear on the trailing edge. When a continuation
 * triangle is present on either side, the title shifts inward by
 * `TRIANGLE_MARGIN + TRIANGLE_SIZE + 4 = 11 px` to clear the
 * triangle. Both numbers ported verbatim from the original spec.
 */
const TITLE_LEFT_PADDING = 8;
const TITLE_RIGHT_PADDING = 4;
const TITLE_TRIANGLE_GAP = 4;

/**
 * Phase 28.1: visible resize-dot geometry. `DOT_EDGE_INSET` matches
 * the original `x + 1` / `x + finalWidth - handleWidth - 1`
 * 1-px inset from each bar edge. `DOT_TRIANGLE_GAP` keeps a small
 * cushion between a continuation triangle's base and the dot when
 * both are present on the same side — `TRIANGLE_MARGIN + TRIANGLE_SIZE
 * + DOT_TRIANGLE_GAP = 9 px` of horizontal space allocated before the
 * dot starts. Triangle + dot don't typically coexist on the same bar
 * because chronix's axis-overlap gate suppresses both indicators
 * outside the visible axis range; this gap only fires for the narrow
 * case where a bar straddles the axis edge.
 */
const DOT_EDGE_INSET = 1;
const DOT_TRIANGLE_GAP = 2;

// `ColumnSpec` + `computeRowSpans` moved to `@chronixjs/gantt` core
// in Phase 49 (Decision B.2). Imported at the top of this module
// from `@chronixjs/gantt`; re-exported via `adapters/gantt-vue3/src/index.ts`
// so consumer-facing `import { ColumnSpec } from '@chronixjs/gantt-vue3'`
// continues to resolve. Same Phase 38 re-export idiom as
// `HeaderCellArg` / `HeaderCellClassNamesFunc`.

/**
 * Minimum-viable renderer over `useGanttLayout` + `useGanttPointer`.
 *
 * Without a `columns` prop the root is a `<div class="cx-gantt-wrapper">`
 * hosting two SVG children: a `<svg class="cx-gantt-header">` carrying
 * the header-row cells (e.g. month bands) stacked on top of the tick
 * row, and a `<svg class="cx-gantt-body">` carrying the bar area.
 * Pointer handlers live on the body SVG only — header clicks have no
 * handler, so they silently no-op. The wrapper is a single
 * `overflow: auto` scroll container with the header pinned via
 * `position: sticky` for vertical-scroll lock.
 *
 * With a `columns` prop the wrapper switches to a 2×2 CSS grid with
 * two additional panes on the left: `<div class="cx-gantt-sidebar-header">`
 * (top-left) carrying the column labels and `<div class="cx-gantt-sidebar-body">`
 * (bottom-left) carrying one row per swimlane strip with each row's
 * cells reading from `RowSpec.columns[colSpec.key]`. Sticky-left
 * positioning lands in the follow-up commit; this commit places the
 * sidebar in normal flow so the structural shape is reviewable
 * independently from the scroll-pinning behavior.
 *
 * When `editable=true` the bar's body becomes drag-able and its 8-px
 * edges resize-able; when `selectable=true` empty-row pointer drags
 * emit a `select` event.
 *
 * The component is intentionally a `defineComponent` with a render
 * function (no `.vue` SFC) so the package builds with just `tsup`, no
 * Vue compiler plugin. Adapters that want template-based authoring can
 * wrap this component or fork its render function.
 */
export const ChronixGantt = defineComponent({
  name: 'ChronixGantt',
  props: {
    bars: {
      type: Array as PropType<readonly BarSpec[]>,
      required: true,
    },
    rows: {
      type: Array as PropType<readonly RowSpec[]>,
      required: true,
    },
    axisInput: {
      type: Object as PropType<AxisRangePlanInput>,
      required: true,
    },
    barHeight: { type: Number, default: 30 },
    barVerticalPadding: { type: Number, default: 4 },
    rowSpacing: { type: Number, default: 1 },
    defaultRowHeight: { type: Number, default: 38 },
    /**
     * Height of the axis-tick row (the inner band carrying labels like
     * `'0时'`, `'1日一'`, etc.) in logical pixels. 0 hides the tick row.
     */
    headerHeight: { type: Number, default: 24 },
    /**
     * Height of each `axis.headerRows` row (the outer bands carrying
     * cells like month names) in logical pixels. The total header band
     * height is `axis.headerRows.length × headerRowHeight + headerHeight`
     * and becomes the header SVG's height; the body SVG sits flush below
     * it. 0 hides every header row (useful for views where only the tick
     * row matters).
     */
    headerRowHeight: { type: Number, default: 20 },
    /** Enable bar drag + edge resize. */
    editable: { type: Boolean, default: false },
    /**
     * Phase 54 — fine-grained drag gate. When `editable` is true,
     * setting this to `false` disables the bar-drag transaction (move
     * event's start time) while keeping edge-resize available. Default
     * `true`. Mirrors the original `eventStartEditable` global
     * option.
     */
    eventStartEditable: { type: Boolean, default: true },
    /**
     * Phase 54 — fine-grained resize gate. When `editable` is true,
     * setting this to `false` disables the edge-resize transaction
     * (change event's duration) while keeping bar-drag available.
     * Default `true`. Mirrors the original spec's
     * `eventDurationEditable` global option.
     */
    eventDurationEditable: { type: Boolean, default: true },
    /** Enable calendar range-select on empty rows. */
    selectable: { type: Boolean, default: false },
    /** Snap drag/resize/select time-delta to this multiple of ms. Default no snap. */
    snapDurationMs: { type: Number, default: 0 },
    /**
     * Size (px) of the progress-handle hit rect, centered horizontally on
     * the progress-x and vertically on the bar. Default 12.
     */
    progressHandleSize: { type: Number, default: 12 },
    /**
     * Resource-panel column descriptors. When set and non-empty, the
     * wrapper becomes a 2×2 CSS grid with a sidebar on the left
     * (sidebar-header + sidebar-body panes); when omitted or empty, the
     * component renders without a sidebar (back to the Phase 4.5
     * two-pane shape).
     */
    columns: {
      type: Array as PropType<readonly ColumnSpec[]>,
      default: () => [] as readonly ColumnSpec[],
    },
    /**
     * Dependency links between bars. Each link is routed by
     * `defaultLinkRouter` and rendered as an SVG `<path>` in a sibling
     * group above the bars. Links whose `fromBarId` / `toBarId` don't
     * resolve to a placed bar are silently dropped from rendering and
     * surfaced via the `link-orphan` event + a one-off `console.warn`.
     */
    links: {
      type: Array as PropType<readonly LinkSpec[]>,
      default: () => [] as readonly LinkSpec[],
    },
    /**
     * Visual customization for `<ChronixGantt>`'s chrome (header band,
     * progress overlay, sidebar borders, link default color, typography).
     * Bar fills are NOT covered — those stay in consumer CSS via
     * `.cx-gantt-bar`. Pass a `Partial<ChronixTheme>` to override
     * individual tokens; undefined fields fall back to
     * `defaultChronixTheme`.
     */
    theme: {
      type: Object as PropType<Partial<ChronixTheme>>,
      default: () => ({}),
    },
    /**
     * Optional slot registry consulted per render to look up custom
     * templates. When `registry.has('bar')` is true, the registered
     * template replaces the default `<rect class="cx-gantt-bar">` for
     * every placed bar; the template receives a `BarSlotArgs` ctx
     * including the live geometry, the effective theme, and the
     * in-flight transaction. When undefined or no `'bar'` template
     * is registered, every bar falls through to the default rect —
     * existing consumers see no behavior change.
     */
    slotRegistry: {
      type: Object as PropType<SlotRegistry | undefined>,
      default: undefined,
    },
    /**
     * Controlled selection: the bar ids the consumer considers
     * currently selected. The default `<rect>` gets a
     * `.cx-gantt-bar--selected` class for every selected bar, and
     * the `BarSlotArgs.isSelected` flag passes through to custom
     * slot renderers. The adapter never mutates this prop — listen
     * for `'bar-click'` / `'empty-area-click'` and update the array
     * original (manually or via `useGanttSelection()` helper).
     */
    selectedBarIds: {
      type: Array as PropType<readonly string[]>,
      default: () => [] as readonly string[],
    },
    /**
     * Phase 19: validation gate. When set, called on bar-drag and
     * bar-resize commit; returning `false` aborts the commit and
     * fires `'bar-drop-rejected'` / `'bar-resize-rejected'` instead
     * of `'bar-drop'` / `'bar-resize'`. The bar visually reverts.
     */
    eventAllow: {
      type: Function as PropType<EventAllowFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 19: validation gate for calendar-range-select commits.
     * Returning `false` aborts the commit; `'select-rejected'` fires.
     */
    selectAllow: {
      type: Function as PropType<SelectAllowFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 19: overlap policy. `true` (default) allows; `false`
     * rejects any cross-row time-intersecting bar; a function
     * `(stillBar, movingBar) => boolean` is called per intersecting
     * cross-row pair. Same-row overlap is always permitted (bar-stack
     * layout pass handles it).
     */
    eventOverlap: {
      type: [Boolean, Function] as PropType<boolean | EventOverlapFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 19: drag / resize destination constraint. Proposed range
     * must sit inside `range`; if `rowIds` is set, proposed row must
     * be in the whitelist. Otherwise commit is rejected.
     */
    eventConstraint: {
      type: Object as PropType<EventConstraint | undefined>,
      default: undefined,
    },
    /**
     * Phase 55: independent overlap policy for range-select. Falls back
     * to `eventOverlap` when unset. Set explicitly to override the
     * drag-side policy for select-only behavior.
     */
    selectOverlap: {
      type: [Boolean, Function] as PropType<boolean | EventOverlapFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 55: independent constraint window for range-select. Falls
     * back to `eventConstraint` when unset.
     */
    selectConstraint: {
      type: Object as PropType<EventConstraint | undefined>,
      default: undefined,
    },
    /**
     * Phase 20: umbrella bar color. When set and the specific bar
     * background/border props aren't, applies to both. Specific
     * props win when both are set.
     */
    barColor: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    /** Phase 20: bar fill at the component level. */
    barBackgroundColor: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    /** Phase 20: bar stroke at the component level. */
    barBorderColor: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    /**
     * Phase 20: bar text color at the component level. Default
     * render's `<rect>` has no text child; this token flows to
     * `BarSlotArgs.resolvedTextColor` for custom slot renderers.
     * Does NOT override `theme.progressLabel` — the progress
     * label stays styled by its dedicated theme token to keep
     * its dark-on-translucent-green default readable.
     */
    barTextColor: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    /**
     * Phase 20: per-bar background callback. Runs after theme +
     * component prop + `BarSpec.style` cascade. Receives
     * `BarStyleArg` with the cascaded defaults; returning a
     * color string overrides; returning `undefined` defers to
     * the cascaded default.
     */
    barBackgroundColorCallback: {
      type: Function as PropType<BarColorFunc | undefined>,
      default: undefined,
    },
    /** Phase 20: per-bar border callback (same cascade). */
    barBorderColorCallback: {
      type: Function as PropType<BarColorFunc | undefined>,
      default: undefined,
    },
    /** Phase 20: per-bar text callback (same cascade). */
    barTextColorCallback: {
      type: Function as PropType<BarColorFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 28.2: per-bar font-size callback. Same `BarStyleArg`
     * cascade as the 3 color callbacks. Receives the theme default
     * via `arg.defaultFontSize`; returning a number overrides;
     * returning `undefined` defers to `theme.barFontSize`.
     */
    barFontSizeCallback: {
      type: Function as PropType<BarFontSizeFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 28.2: per-bar font-weight callback. Same cascade as
     * `barFontSizeCallback`. Numeric (400 / 600 / 700) OR CSS
     * keyword string (`'normal'` / `'bold'`) both accepted.
     */
    barFontWeightCallback: {
      type: Function as PropType<BarFontWeightFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 28.3: per-bar class-names callback. Receives the same
     * `BarStyleArg` the color / font callbacks do; returns a class
     * string, an array of strings, or `undefined`. The returned
     * classes append to the bar's main `<rect class="cx-gantt-bar">`
     * — they do NOT propagate to the per-bar selection-border /
     * resize-zone / dot rects (each carries its own stable
     * `cx-gantt-bar-*` modifier class). Consumers use these for
     * semantic state (priority, overdue, warning, etc.) styled via
     * consumer CSS.
     */
    barClassNamesCallback: {
      type: Function as PropType<BarClassNamesFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 28.3: per-link render-time callback. One callback per
     * chart. Receives a `LinkRenderArg` carrying the routed link
     * geometry, the source / target `PlacedBar`s, the default line
     * color (after `colorOverride` + `useLineEventColor` lookup), and
     * the current marker. Returns `{ color?, marker? }` to override
     * one or both, or `undefined` to accept the defaults. The
     * resolved values feed the link's `<path>` stroke and the marker
     * `<defs>` collection so marker shapes get the right color.
     * Routing-type mutation NOT supported in v0 (would require re-
     * running `LinkRouter`); use per-`LinkSpec.routing` for static
     * choice.
     */
    onLineCallback: {
      type: Function as PropType<LinkRenderFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 28.3: when `true`, each dependency line's stroke inherits
     * the source bar's resolved background color (the Phase 20
     * cascade output) instead of the theme's `linkDefaultColor`.
     * `LinkSpec.colorOverride` still wins when present;
     * `onLineCallback`'s `color` return still wins over both. Defaults
     * `false` so existing consumers see no visual change.
     */
    useLineEventColor: { type: Boolean, default: false },
    /**
     * Phase 25: minimum Pythagorean distance (in CSS pixels) from
     * the pointerdown origin before a pointer gesture is treated as
     * a confirmed drag / resize / range-select. Below this threshold,
     * the pointer-up fires `'bar-click'` / `'empty-area-click'`
     * instead of the commit-time emit. Default 5 (matches the parity
     * reference's `minDistance` / `eventDragMinDistance`).
     *
     * Set to `0` to restore the pre-Phase-25 strict-zero-delta gate
     * (every non-zero delta commits). Applies uniformly to all 4
     * transaction kinds; progress-handle is exempted (reaching the
     * handle hit zone IS the intent, matching the original spec).
     */
    pointerMinDistance: { type: Number, default: 5 },
    /**
     * Phase 29: per-header-cell class-names callback. Fires once per
     * rendered header cell (outer band cells AND tick-row labels);
     * returned classes append to the cell's primary element. Use this
     * for state-driven CSS hooks (weekend tinting, holiday markers,
     * etc.). For full cell-content replacement, register a template
     * under the `'header-cell'` slot via `slotRegistry` — the slot
     * args include any callback-returned classes via `extraClasses`
     * so a slot consumer can still honor the callback's output.
     */
    headerCellClassNamesCallback: {
      type: Function as PropType<HeaderCellClassNamesFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 21: today-line config. `false` or omitted = hide (default);
     * `true` = enable with all defaults (red `#ff6b6b`, 2 px, dashed,
     * `'今日'` tooltip); an object literal overrides per-field. See
     * `TodayLineOption` for the resolution cascade with theme tokens.
     */
    todayLine: {
      type: [Boolean, Object] as PropType<TodayLineOption | boolean>,
      default: false,
    },
    /**
     * Phase 22.2: today-column background tint. `false` or omitted =
     * hide (default); `true` = enable with all defaults (parity
     * yellow `rgba(255, 220, 40, .15)` from theme); `{ color: '#abc' }`
     * for per-mount override. See `TodayCellBgOption`.
     *
     * Renders a `<rect class="cx-gantt-today-cell">` in body + header
     * SVGs spanning today's one-day slot. Pixel-aligned with the bars
     * (reuses the same `(t - axisStart) × pxPerMs` math). Behind the
     * bars + tick labels so they remain readable on top.
     */
    todayCellBg: {
      type: [Boolean, Object] as PropType<TodayCellBgOption | boolean>,
      default: false,
    },
    /**
     * Phase 23: maximum visible height for the chart + sidebar body
     * area. When set (e.g. `'70vh'`, `'600px'`), the chart-pane and
     * sidebar-pane both get this cap as their grid-row height, and
     * vertical scroll engages on each when their content exceeds it.
     * The chart-pane + sidebar-pane scrollTops are bidirectionally
     * synced via `useScrollSync` so the panes stay aligned.
     *
     * When omitted (default), both panes auto-size to their content
     * and never vertically scroll — useful for short charts embedded
     * inside a scrollable page where the host owns the scrollport.
     *
     * Accepts any CSS length / grid-row template token (`'auto'`,
     * `'1fr'`, percentages, viewport units). Pass-through string —
     * no validation.
     */
    maxBodyHeight: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    /**
     * Phase 22: toolbar config. Accepts the chronix toolbar string DSL
     * (`{ left, center, right }` / `{ start, center, end }`) or
     * `false` (default) to hide the toolbar entirely.
     *
     * Widget names: `'title'`, any of the six `ViewId`s, and
     * `'prev'` / `'next'` / `'today'`. View buttons emit
     * `update:axisInput` with a new `viewId`; nav buttons emit
     * with a new `anchorDate`. Wire `v-model:axis-input` to pick
     * up both.
     */
    headerToolbar: {
      type: [Object, Boolean] as PropType<ToolbarInput | false>,
      default: false as const,
    },
  },
  emits: {
    'bar-drop': (_payload: BarDropPayload) => true,
    'bar-resize': (_payload: BarResizePayload) => true,
    select: (_payload: SelectPayload) => true,
    'bar-progress': (_payload: BarProgressPayload) => true,
    'link-orphan': (_linkId: string) => true,
    'bar-click': (_payload: BarClickPayload) => true,
    'empty-area-click': (_payload: EmptyAreaClickPayload) => true,
    'bar-dragstart': (_payload: BarDragStartPayload) => true,
    'bar-dragstop': (_payload: BarDragStopPayload) => true,
    'bar-resizestart': (_payload: BarResizeStartPayload) => true,
    'bar-resizestop': (_payload: BarResizeStopPayload) => true,
    'bar-drop-rejected': (_payload: BarDropRejectedPayload) => true,
    'bar-resize-rejected': (_payload: BarResizeRejectedPayload) => true,
    'select-rejected': (_payload: SelectRejectedPayload) => true,
    'update:axisInput': (_next: AxisRangePlanInput) => true,
    // Phase 54 — bar hover events. Fire on pointer-enter / pointer-leave
    // of any bar's body (delegated via the cx-gantt-bars group's
    // pointerover/pointerout handlers, gated on no active transaction).
    // Payload mirrors `bar-click`. Mirrors the original spec's
    // `eventMouseEnter` / `eventMouseLeave` callbacks.
    'bar-mouseenter': (_payload: BarClickPayload) => true,
    'bar-mouseleave': (_payload: BarClickPayload) => true,
  },
  setup(props, { emit, expose }) {
    // Effective theme: merge consumer overrides over chronix defaults.
    // Reactive — a `theme` prop change triggers re-render with the new
    // tokens applied through every callsite below.
    const theme = computed<ChronixTheme>(() => ({
      ...defaultChronixTheme,
      ...props.theme,
    }));

    // Phase 24: subscribe-listener registry. Every adapter `emit(name, payload)`
    // also notifies any handle.subscribe() listeners registered for the same
    // event. Map<EventName, Set<Listener>> — listeners are weak per
    // subscription; the returned unsubscribe function removes them.
    type EmitListener = (payload: unknown) => void;
    const listenerRegistry = new Map<string, Set<EmitListener>>();
    // Vue emit's parameter type is the union of all defined emit names;
    // `string` is structurally assignable, but TS narrows via overload
    // resolution which the generic `K extends string` defeats. The
    // double-cast through `unknown` is the standard escape hatch and
    // safer than typing each callsite individually because the runtime
    // emit() accepts any string identifier without validation.
    type EmitFn = (name: string, payload: unknown) => void;
    const emitUnchecked = emit as unknown as EmitFn;
    function emitToBoth<K extends string>(name: K, payload: unknown): void {
      emitUnchecked(name, payload);
      listenerRegistry.get(name)?.forEach((listener) => listener(payload));
    }

    // Phase 22 toolbar: parse the string DSL into a widget model
    // every time `headerToolbar` or the active view changes.
    // `pressed` state flips reactively as the consumer's
    // v-model:axis-input round-trips a new viewId.
    const toolbarModel = computed<ToolbarModel | null>(() => {
      const input = props.headerToolbar;
      if (input === false || input === undefined) return null;
      return parseToolbar(input, {
        viewIds: ALL_VIEW_IDS,
        activeViewId: props.axisInput.viewId,
      });
    });
    const toolbarTitleText = computed(() => formatToolbarTitle(props.axisInput));

    function onToolbarWidgetClick(widget: ToolbarWidget): void {
      const current = props.axisInput;
      if (widget.kind === 'view') {
        emitToBoth('update:axisInput', {
          ...current,
          viewId: widget.buttonName as ViewId,
        });
        return;
      }
      if (widget.kind === 'nav') {
        let nextDate: Date;
        if (widget.buttonName === 'prev') {
          nextDate = prevAnchor(current.viewId, current.anchorDate);
        } else if (widget.buttonName === 'next') {
          nextDate = nextAnchor(current.viewId, current.anchorDate);
        } else {
          // 'today'
          nextDate = todayAnchor();
        }
        emitToBoth('update:axisInput', { ...current, anchorDate: nextDate });
      }
      // kind === 'title' — non-interactive
    }

    const { axis, strips, placedBars, contentSize } = useGanttLayout({
      bars: () => props.bars,
      rows: () => props.rows,
      axisInput: () => props.axisInput,
      barHeight: () => props.barHeight,
      barVerticalPadding: () => props.barVerticalPadding,
      rowSpacing: () => props.rowSpacing,
      defaultRowHeight: () => props.defaultRowHeight,
    });

    // Derive `barRanges` (map of barId → TimeRange) from the input bars
    // so the pointer composable can use it as `originalRange` on commit.
    const barRanges = computed<ReadonlyMap<string, TimeRange>>(
      () => new Map(props.bars.map((b) => [b.id, b.range])),
    );

    // Parallel map of barId → source rowId so the composable can
    // populate `BarDropPayload.oldRowId` on a bar-drag commit.
    const barRowIds = computed<ReadonlyMap<string, string>>(
      () => new Map(props.bars.map((b) => [b.id, b.rowId])),
    );

    // Strips keyed by rowId for O(1) lookup in the render path's
    // cross-row snap logic. Rebuilds whenever the layout passes
    // re-derive (axis switch, bar / row changes).
    const stripByRowId = computed(() => new Map(strips.value.map((s) => [s.rowId, s])));

    // Selected-bar lookup for O(1) `isSelected` checks in the render
    // path. Phase 12.
    const selectedBarSet = computed(() => new Set(props.selectedBarIds));

    // Per-bar overlay-group id (only bars that declared a
    // `pointerOverlayId`) and per-bar progress (0..100, only bars with a
    // `progress.value`). Empty maps when no bars opt in — the composable
    // safely skips the progress-handle path in that case.
    const overlayIdByBarId = computed<ReadonlyMap<string, string>>(() => {
      const m = new Map<string, string>();
      for (const b of props.bars) {
        if (b.pointerOverlayId !== undefined) m.set(b.id, b.pointerOverlayId);
      }
      return m;
    });
    const barProgressById = computed<ReadonlyMap<string, number>>(() => {
      const m = new Map<string, number>();
      for (const b of props.bars) {
        if (b.progress !== undefined) m.set(b.id, b.progress.value);
      }
      return m;
    });

    /**
     * Phase 21: resolved today-line state. Returns `null` when:
     * - `todayLine` prop is `false` / omitted
     * - axis has no ticks (degenerate input)
     * - today's x-coordinate falls outside the axis range
     *
     * x-coordinate uses the same `pxPerMs` formula as `BarPlacementPass`
     * so the line aligns pixel-exactly with bars that start today.
     * `Date.now()` is sampled at re-render time — no `setTimeout` keeps
     * it live across midnight; consumers needing live "now" updates can
     * trigger a manual re-render via a reactive ref.
     *
     * Cascade for stroke + tooltip background:
     * - `props.todayLine.color` explicitly set → drives BOTH (parity-
     *   reference behavior where one color knob controls both)
     * - else → `theme.todayLineColor` (stroke) +
     *   `theme.todayLineTooltipBg` (tooltip bg) independently
     */
    const resolvedTodayLine = computed<{
      x: number;
      color: string;
      tooltipBg: string;
      width: number;
      dasharray: string | undefined;
      tooltip: string;
    } | null>(() => {
      const opt = props.todayLine;
      if (opt === false || opt === undefined) return null;
      const config: TodayLineOption = opt === true ? {} : opt;

      const a = axis.value;
      if (a.ticks.length === 0) return null;
      const axisStartMs = a.ticks[0]!.time.getTime();
      const pxPerMs = a.slotWidth / a.slotDurationMs;
      const todayX = (Date.now() - axisStartMs) * pxPerMs;
      if (todayX < 0 || todayX > a.totalWidth) return null;

      const t = theme.value;
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
    });

    /**
     * Phase 22.2: resolved today-cell background tint state. Returns
     * `null` when the prop is `false` / omitted, or when today's
     * day-slot doesn't intersect the axis range (week showing a
     * different week, today filtered by `weekendsVisible=false`, etc).
     *
     * Cell start is today's local midnight (NOT `Date.now()` — the
     * tint spans the entire calendar day regardless of the current
     * minute). Width is `MS_PER_DAY × pxPerMs` so it covers exactly
     * one day-slot in every view (day-view = full chart width;
     * week/month/season/halfYear/year = one slot).
     *
     * Clamped to axis bounds (`x ∈ [0, totalWidth]`) so the rect
     * never bleeds outside the chart edges even when today straddles
     * the visible-range boundary.
     */
    const resolvedTodayCellBg = computed<{
      x: number;
      width: number;
      color: string;
    } | null>(() => {
      const opt = props.todayCellBg;
      if (opt === false || opt === undefined) return null;
      const config: TodayCellBgOption = opt === true ? {} : opt;

      const a = axis.value;
      if (a.ticks.length === 0) return null;
      const axisStartMs = a.ticks[0]!.time.getTime();
      const pxPerMs = a.slotWidth / a.slotDurationMs;
      const MS_PER_DAY = 24 * 60 * 60 * 1000;

      const tm = new Date();
      tm.setHours(0, 0, 0, 0);
      const todayMidnightMs = tm.getTime();
      const cellStartX = (todayMidnightMs - axisStartMs) * pxPerMs;
      const cellWidth = MS_PER_DAY * pxPerMs;

      if (cellStartX + cellWidth <= 0 || cellStartX >= a.totalWidth) return null;

      const x = Math.max(0, cellStartX);
      const width = Math.min(cellStartX + cellWidth, a.totalWidth) - x;

      const t = theme.value;
      const color = config.color ?? t.todayCellBgColor;
      return { x, width, color };
    });

    // Route dependency links through the layout pass. Re-derives when
    // `links` or `placedBars` change (drag/resize/view-switch). Orphans
    // (a link referencing a bar id not in `placedBars`) drop from the
    // rendered output here, NOT later in render — keeps the render
    // function pure of side effects. Orphan emission is wired through a
    // separate watch so the side effect happens once per layout pass.
    const routerOutput = computed(() =>
      defaultLinkRouter.route({
        links: props.links,
        placedBars: placedBars.value,
      }),
    );

    // Track orphan ids we've already warned about so console.warn fires
    // at most once per id per component instance. The set lives across
    // re-derivations — if a link transitions from resolved to orphan
    // (because the user deleted the target bar), we want to warn once.
    const warnedOrphanIds = new Set<string>();
    watchEffect(() => {
      for (const orphanId of routerOutput.value.orphanLinkIds) {
        emitToBoth('link-orphan', orphanId);
        if (!warnedOrphanIds.has(orphanId)) {
          warnedOrphanIds.add(orphanId);
          console.warn(
            `[chronix] Link "${orphanId}" references unknown bar(s); dropped from render.`,
          );
        }
      }
    });

    const routedLinks = computed(() => routerOutput.value.routedLinks);

    // Phase 16: most recent pointer event the body SVG saw. The pointer
    // composable's lifecycle callbacks (onBarDragStart / onBarDragStop /
    // onBarResize{Start,Stop}) don't carry a PointerEvent — they live
    // in content-space — so the adapter captures it here at pointerdown
    // / pointermove time and enriches the public emit payload at the
    // callback site. setPointerCapture keeps the event stream pinned to
    // the body SVG even when the cursor leaves it, so the captured
    // event is always the most recent for the active gesture.
    const lastJsEvent = ref<PointerEvent | null>(null);

    // Helper: build the public payload at lifecycle-callback time. Looks
    // up `sourceBar` from the live props and falls back to the previously
    // captured `lastJsEvent`. Returns `null` if either piece is unavailable
    // — the callback then silently skips the emit (defensive; production
    // calls should always have both since the composable fires only from
    // inside a real pointer gesture).
    function buildDragPayload(
      barId: string,
    ): { barId: string; sourceBar: BarSpec; jsEvent: PointerEvent } | null {
      const sourceBar = props.bars.find((b) => b.id === barId);
      const jsEvent = lastJsEvent.value;
      if (!sourceBar || !jsEvent) return null;
      return { barId, sourceBar, jsEvent };
    }

    const pointer = useGanttPointer({
      placedBars,
      strips,
      axis,
      barRanges,
      barRowIds,
      overlayIdByBarId,
      barProgressById,
      editable: () => props.editable,
      // Phase 54 — thread the fine-grained drag/resize gates.
      eventStartEditable: () => props.eventStartEditable,
      eventDurationEditable: () => props.eventDurationEditable,
      selectable: () => props.selectable,
      progressHandleSize: () => props.progressHandleSize,
      // 0 is treated as "no snap" by the commit layer — pass through verbatim.
      snapDurationMs: () => props.snapDurationMs,
      // Phase 28.1: thread the bar-resizer-thickness theme token
      // through to the hit-test edge-zone width. One token drives both
      // the visible `cursor: ew-resize` cue (DOM rect in the body SVG
      // render) and the geometric resize-edge detection — consumers
      // who widen the cue grow both halves simultaneously.
      edgeZoneWidth: () => theme.value.barResizerThickness,
      // Phase 25: Pythagorean distance threshold (in px) below which
      // a pointer gesture aborts as a click instead of committing.
      // Default 5; 0 disables the gate (chronix pre-Phase-25 behavior).
      pointerMinDistance: () => props.pointerMinDistance,
      // Phase 19: validation gate inputs.
      bars: () => props.bars,
      eventAllow: () => props.eventAllow,
      selectAllow: () => props.selectAllow,
      eventOverlap: () => props.eventOverlap,
      eventConstraint: () => props.eventConstraint,
      selectOverlap: () => props.selectOverlap,
      selectConstraint: () => props.selectConstraint,
      onBarDrop: (p) => emitToBoth('bar-drop', p),
      onBarResize: (p) => emitToBoth('bar-resize', p),
      onSelect: (p) => emitToBoth('select', p),
      onBarProgress: (p) => emitToBoth('bar-progress', p),
      onBarDropRejected: (p) => emitToBoth('bar-drop-rejected', p),
      onBarResizeRejected: (p) => emitToBoth('bar-resize-rejected', p),
      onSelectRejected: (p) => emitToBoth('select-rejected', p),
      onBarDragStart: ({ barId }) => {
        const payload = buildDragPayload(barId);
        if (payload) emitToBoth('bar-dragstart', payload);
      },
      onBarDragStop: ({ barId }) => {
        const payload = buildDragPayload(barId);
        if (payload) emitToBoth('bar-dragstop', payload);
      },
      onBarResizeStart: ({ barId, edge }) => {
        const payload = buildDragPayload(barId);
        if (payload) emitToBoth('bar-resizestart', { ...payload, edge });
      },
      onBarResizeStop: ({ barId, edge }) => {
        const payload = buildDragPayload(barId);
        if (payload) emitToBoth('bar-resizestop', { ...payload, edge });
      },
    });

    // The body SVG owns pointer interactions. The header SVG has no
    // handlers — axis-row clicks reach no listener and silently no-op.
    const bodySvgRef = ref<SVGSVGElement | null>(null);

    // Phase 23: dual-scrollport refs. Each scroll pane has an outer
    // wrapper (`overflow: auto`) + an inner translateX-tracked
    // wrapper above it (`overflow: hidden`) for the header. The 4
    // refs name those 4 boundaries; their lifecycle is bound to
    // mount/unmount of the wrapper grid.
    const chartPaneRef = ref<HTMLElement | null>(null);
    const chartHeaderInnerRef = ref<HTMLElement | null>(null);
    const sidebarPaneRef = ref<HTMLElement | null>(null);
    const sidebarHeaderInnerRef = ref<HTMLElement | null>(null);

    // Phase 23: vertical scroll sync between sidebar-pane and chart-
    // pane. No-op when either ref is null (no-sidebar mode keeps
    // sidebarPaneRef null since the pane isn't rendered).
    useScrollSync(sidebarPaneRef, chartPaneRef);

    // Phase 23: chart-pane viewport state, reactive across the whole
    // setup scope. Phase 27.1 is the first consumer (per-bar viewport-
    // clipping check inside the flatMap closure that emits continuation
    // triangles); Phase 28.2.1 will follow with the title + progress-dot
    // viewport-aware positioning.
    const chartScroll = useChartScrollState(chartPaneRef);

    /**
     * Phase 23: horizontal scroll → header-inner `translateX` sync.
     * The header pane sits ABOVE its body pane in the grid with
     * `overflow: hidden`; the inner wrapper carrying the actual
     * header content gets a `translateX(-${pane.scrollLeft}px)` update
     * on every body-pane scroll so the header tracks horizontal scroll
     * without needing its own scroll container. Matches the parity
     * reference's `transform: translateX` idiom verbatim.
     *
     * Inlined here (not exposed) because it's tightly bound to
     * `<ChronixGantt>`'s pane structure — not a reusable composable.
     */
    function useHeaderHorizontalSync(
      paneRef: Ref<HTMLElement | null>,
      headerInnerRef: Ref<HTMLElement | null>,
    ): void {
      function onScroll(): void {
        const pane = paneRef.value;
        const inner = headerInnerRef.value;
        if (!pane || !inner) return;
        inner.style.transform = `translateX(-${pane.scrollLeft}px)`;
      }
      // Captured ref for cleanup — Vue clears template refs before
      // `onUnmounted` fires, so the cleanup must reference the
      // element directly, not via the ref.
      let captured: HTMLElement | null = null;
      onMounted(() => {
        captured = paneRef.value;
        captured?.addEventListener('scroll', onScroll, { passive: true });
      });
      onUnmounted(() => {
        captured?.removeEventListener('scroll', onScroll);
        captured = null;
      });
    }
    useHeaderHorizontalSync(chartPaneRef, chartHeaderInnerRef);
    useHeaderHorizontalSync(sidebarPaneRef, sidebarHeaderInnerRef);

    // Wrapper + divider refs power the Phase 14 sidebar-resize affordance.
    // The wrapper's bounding-rect width caps the divider drag at the
    // right edge; the divider's own ref receives pointer capture so a
    // drag keeps tracking the cursor even when it leaves the 8-px hit
    // zone. Both stay null until the corresponding DOM nodes mount.
    const wrapperRef = ref<HTMLDivElement | null>(null);
    const dividerRef = ref<HTMLDivElement | null>(null);

    // Sidebar resize state. `sidebarWidthOverride` is null until the user
    // grabs the divider; once set, it takes precedence over the natural
    // sum of `ColumnSpec.width`. Prop changes don't reset the override —
    // consumer-driven width changes are absorbed into the base, the
    // user's drag offset stays additive across the session.
    const sidebarWidthOverride = ref<number | null>(null);
    // Snapshots taken at pointerdown so pointermove can compute the
    // delta against a stable baseline — reading `effectiveSidebarWidth`
    // mid-drag would double-count the in-flight override mutation.
    const dividerDragStartWidth = ref<number | null>(null);
    const dividerDragStartClientX = ref<number | null>(null);

    const sidebarBaseWidth = computed<number>(() =>
      props.columns.reduce((sum, c) => sum + c.width, 0),
    );
    const effectiveSidebarWidth = computed<number>(
      () => sidebarWidthOverride.value ?? sidebarBaseWidth.value,
    );
    // Per-column scale factor: each col's render width = colSpec.width *
    // sidebarScale so the user-supplied column ratios are preserved
    // across drags. Falls back to 1 when there are no columns (the
    // no-sidebar branch never reads this, but keep the computed safe).
    const sidebarScale = computed<number>(() => {
      const base = sidebarBaseWidth.value;
      if (base === 0) return 1;
      return effectiveSidebarWidth.value / base;
    });

    function onDividerPointerdown(e: PointerEvent): void {
      if (e.button !== 0) return;
      dividerDragStartWidth.value = effectiveSidebarWidth.value;
      dividerDragStartClientX.value = e.clientX;
      dividerRef.value?.setPointerCapture?.(e.pointerId);
      // Suppress the browser's default text-selection / drag-image so
      // the drag feels native. Pointerdown is the safest place to call
      // preventDefault — pointermove preventDefault is too late to stop
      // the initial selection.
      e.preventDefault();
    }

    function onDividerPointermove(e: PointerEvent): void {
      if (dividerDragStartWidth.value === null) return;
      if (dividerDragStartClientX.value === null) return;
      const wrapperWidth = wrapperRef.value?.getBoundingClientRect().width ?? 0;
      const proposed = dividerDragStartWidth.value + (e.clientX - dividerDragStartClientX.value);
      sidebarWidthOverride.value = clampSidebarWidth(proposed, wrapperWidth);
    }

    function onDividerPointerup(e: PointerEvent): void {
      if (dividerDragStartWidth.value === null) return;
      dividerDragStartWidth.value = null;
      dividerDragStartClientX.value = null;
      dividerRef.value?.releasePointerCapture?.(e.pointerId);
    }

    function onDividerPointercancel(e: PointerEvent): void {
      // Browser-initiated cancel (touch interruption, OS gesture). The
      // current override stays — a cancel doesn't revert the in-flight
      // width; reverting would lose progress that the user expressed.
      // Just reset the drag-snapshot refs so the next pointerdown starts
      // clean.
      dividerDragStartWidth.value = null;
      dividerDragStartClientX.value = null;
      dividerRef.value?.releasePointerCapture?.(e.pointerId);
    }

    // Body SVG's origin (y=0) is content-y 0: the bar group sits directly
    // inside the body SVG with no translate, so `e.clientY - bodyRect.top`
    // already lives in content-space. The header band is a separate SVG
    // original in the wrapper and contributes nothing to the body's rect.
    function toContentXY(e: PointerEvent): { x: number; y: number } | null {
      const svg = bodySvgRef.value;
      if (!svg) {
        // Body SVG not mounted - this shouldn't happen during normal interaction
        console.warn('[ChronixGantt] toContentXY: bodySvgRef is null');
        return null;
      }
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // SVG has no dimensions - may be hidden or not yet rendered
        console.warn('[ChronixGantt] toContentXY: SVG has zero dimensions', rect);
        return null;
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    function onPointerdown(e: PointerEvent): void {
      if (e.button !== 0) return; // primary mouse / touch only
      const pos = toContentXY(e);
      if (!pos) return;
      // Safety net: the body SVG should never receive an event with
      // negative content-y in a real browser (the header sits in its own
      // SVG, geometrically above), but synthetic events from tests or
      // future layouts could violate that — keep the early-return.
      if (pos.y < 0) return;
      // Phase 16: stash the event so the composable's lifecycle
      // callbacks (which don't carry a PointerEvent) can attach it to
      // their public emit payload.
      lastJsEvent.value = e;
      pointer.begin(pos.x, pos.y);
      // If a transaction actually started, capture the pointer so move /
      // up events keep flowing even if the cursor leaves the SVG bounds.
      // Use `hasActiveTransaction()` for synchronous check instead of
      // `activeTransaction` computed ref to avoid reactivity timing issues.
      if (pointer.hasActiveTransaction() && bodySvgRef.value) {
        try {
          bodySvgRef.value.setPointerCapture(e.pointerId);
        } catch (err) {
          // setPointerCapture can fail in certain edge cases (e.g., already captured)
          console.warn('[ChronixGantt] setPointerCapture failed:', err);
        }
      }
    }

    function onPointermove(e: PointerEvent): void {
      // Use `hasActiveTransaction()` for synchronous check to avoid
      // reactivity timing issues. Mirrors the fix in onPointerdown.
      if (pointer.hasActiveTransaction()) {
        const pos = toContentXY(e);
        if (!pos) return;
        // Phase 16: refresh lastJsEvent so lazy-fire `'bar-dragstart'` —
        // which happens during this `advance()` call — sees the live
        // PointerEvent rather than the stale pointerdown one.
        lastJsEvent.value = e;
        pointer.advance(pos.x, pos.y);
        return;
      }
      // Detect if mouse is near progress handle position (proximity detection)
      const pos = toContentXY(e);
      if (!pos) return;
      const PROXITY_THRESHOLD = 15; // px
      const TRIANGLE_SIZE = 6;
      const nearHandleIds = new Set<string>();
      for (const bar of placedBars.value) {
        const sourceProgress = barProgressById.value.get(bar.barId);
        const overlayId = overlayIdByBarId.value.get(bar.barId);
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
      hoveredProgressHandleIds.value = nearHandleIds;
    }

    // Phase 54 — bar hover events. Delegated handlers on the cx-gantt-
    // bars group. Walk up the event target chain to find the [data-
    // bar-id] element; emit `bar-mouseenter` / `bar-mouseleave` on
    // transitions. Suppress during an active transaction (drag /
    // resize / progress) so hover events don't fire mid-gesture.
    const lastHoveredBarId = ref<string | null>(null);
    // Track hovered bar IDs for progress handle visibility
    const hoveredBarIds = ref<Set<string>>(new Set());
    // Track hovered progress handle IDs (separate from bar hover)
    const hoveredProgressHandleIds = ref<Set<string>>(new Set());
    function onBarsPointerover(e: PointerEvent): void {
      // Use `hasActiveTransaction()` for synchronous check to avoid
      // reactivity timing issues.
      if (pointer.hasActiveTransaction()) return;
      const target = e.target as Element | null;
      const barEl = target?.closest<SVGElement>('[data-bar-id]');
      const barId = barEl?.getAttribute('data-bar-id') ?? null;
      if (!barId || barId === lastHoveredBarId.value) return;
      // Bar-to-bar transition: leave previous + enter new.
      if (lastHoveredBarId.value !== null) {
        const prevBar = props.bars.find((b) => b.id === lastHoveredBarId.value);
        if (prevBar) {
          emitToBoth('bar-mouseleave', {
            barId: lastHoveredBarId.value,
            sourceBar: prevBar,
            jsEvent: e,
          });
        }
        // Remove from hovered set
        hoveredBarIds.value.delete(lastHoveredBarId.value);
      }
      const sourceBar = props.bars.find((b) => b.id === barId);
      if (sourceBar) {
        lastHoveredBarId.value = barId;
        emitToBoth('bar-mouseenter', { barId, sourceBar, jsEvent: e });
        // Add to hovered set
        hoveredBarIds.value.add(barId);
      }
    }
    function onBarsPointerout(e: PointerEvent): void {
      // Use `hasActiveTransaction()` for synchronous check to avoid
      // reactivity timing issues.
      if (pointer.hasActiveTransaction()) return;
      if (lastHoveredBarId.value === null) return;
      // pointerout fires when leaving a child element too. Use
      // relatedTarget to detect ACTUAL exit from any bar.
      const next = e.relatedTarget as Element | null;
      if (next?.closest('[data-bar-id]')) return;
      const prevBar = props.bars.find((b) => b.id === lastHoveredBarId.value);
      if (prevBar) {
        emitToBoth('bar-mouseleave', {
          barId: lastHoveredBarId.value,
          sourceBar: prevBar,
          jsEvent: e,
        });
      }
      // Remove from hovered set
      const leavingId = lastHoveredBarId.value;
      hoveredBarIds.value.delete(leavingId);
      lastHoveredBarId.value = null;
    }

    function onPointerup(e: PointerEvent): void {
      // Phase 12 click-vs-drag discrimination:
      //
      // 1. If an active transaction exists, decide whether it's a real
      //    drag/resize/progress/range-select or just a zero-delta pointerdown
      //    that should be treated as a click. 0-delta `bar-drag` /
      //    `bar-resize` / `calendar-range-select` aborts (no onBarDrop /
      //    onBarResize / onSelect fires); `progress-handle` always commits
      //    since reaching the handle hit zone is itself the intent.
      // 2. After the transaction lifecycle resolves, check `wasDragCommit`
      //    + the preserved `lastHit` to fire `'bar-click'` / `'empty-area-click'`.
      const txn = pointer.activeTransaction.value;
      const hit = pointer.lastHit.value;
      // Phase 16: refresh lastJsEvent so the imminent `commit()` /
      // `abort()` — which fires `'bar-dragstop'` / `'bar-resizestop'` —
      // emits with this pointerup event, not the most recent pointermove.
      lastJsEvent.value = e;
      if (txn) {
        // Phase 25: sub-threshold Pythagorean distance aborts the
        // gesture as a click — replaces chronix's pre-Phase-25
        // strict-zero-delta gate. The composable's
        // `dragDistanceSurpassed` is sticky-true once the pointer has
        // ever moved past `pointerMinDistance` (default 5 px) from
        // the pointerdown origin. Progress-handle stays exempted:
        // reaching the handle hit zone IS the intent, so it commits
        // regardless of distance (matches the original spec's same
        // exemption + chronix's pre-Phase-25 progress-handle
        // behavior).
        const isSubThresholdGesture =
          !pointer.dragDistanceSurpassed.value && txn.kind !== 'progress-handle';
        if (isSubThresholdGesture) {
          pointer.abort();
        } else {
          pointer.commit();
        }
      }
      // Click emit only fires when no transaction committed (so a real
      // drag never doubles as a click). For 0-delta aborts the flag
      // stays false so the click does fire — that's the intended path.
      if (!pointer.wasDragCommit.value && hit) {
        if (hit.kind === 'bar-body') {
          const sourceBar = props.bars.find((b) => b.id === hit.barId);
          if (sourceBar) {
            emitToBoth('bar-click', { barId: hit.barId, sourceBar, jsEvent: e });
          }
        } else if (hit.kind === 'empty-row') {
          // Phase 54 — surface the calendar time at the click via the
          // core `xToTime` helper. Mirrors reference's `dateClick` payload's
          // `.date` field. `toContentXY` returns body-SVG-local x; the
          // pointer hit-test ran on the same coord system so the value
          // matches what useGanttPointer saw.
          const pos = toContentXY(e);
          const clickTime = pos ? xToTime(pos.x, axis.value) : new Date(NaN);
          emitToBoth('empty-area-click', {
            rowId: hit.rowId,
            jsEvent: e,
            time: clickTime,
          });
        }
      }
      // Release pointer capture after transaction is resolved.
      // This should always be called to match the setPointerCapture in onPointerdown.
      if (bodySvgRef.value) {
        try {
          bodySvgRef.value.releasePointerCapture(e.pointerId);
        } catch (err) {
          // releasePointerCapture can fail if pointer wasn't captured
          // Don't let this break the rest of the flow
          console.warn('[ChronixGantt] releasePointerCapture failed:', err);
        }
      }
    }

    function onPointercancel(e: PointerEvent): void {
      // Use `hasActiveTransaction()` for synchronous check to avoid
      // reactivity timing issues.
      if (!pointer.hasActiveTransaction()) return;
      // Browser-initiated cancellation (touch interruption, focus stolen,
      // OS gesture). Drop the in-flight transaction without firing a
      // commit callback — the user's intent is lost, not finalized.
      // Phase 16: refresh lastJsEvent so any `'bar-dragstop'` /
      // `'bar-resizestop'` fired by `abort()` references the cancel
      // event rather than the stale pointermove one.
      lastJsEvent.value = e;
      pointer.abort();
      if (bodySvgRef.value) {
        try {
          bodySvgRef.value.releasePointerCapture(e.pointerId);
        } catch (err) {
          console.warn('[ChronixGantt] releasePointerCapture (cancel) failed:', err);
        }
      }
    }

    // Phase 24: imperative handle. Compute-and-emit pathway — `next()` /
    // `prev()` / `changeView()` / etc. all emit `update:axisInput` with
    // the new shape so the consumer's `v-model:axis-input` round-trips.
    // Same channel as the Phase 22 toolbar; no internal state.
    //
    // `scrollToDate` is the documented exception: writes
    // `wrapperRef.scrollLeft` directly using the current axis to map
    // `date` → x. Pure DOM side-effect.
    //
    // `subscribe` registers into `listenerRegistry`; `emitToBoth` (defined
    // at the top of setup) notifies every listener registered for that
    // event alongside Vue's emit. Returns an unsubscribe function.
    //
    // `getBarTable` / `getRowDataSource` / `getLinkTable` are typed-only
    // since Phase 4 but were never wired by any adapter. Phase 24 ships
    // minimal wrappers around the reactive props so the handle interface
    // is honored. Tables read live from `props.{bars,rows,links}` —
    // values reflect the latest reactive snapshot each call.
    const barTable: BarTable = {
      get bars() {
        return props.bars;
      },
      get inFlightTransaction() {
        return pointer.activeTransaction.value;
      },
      getById: (id: string): BarSpec | undefined => props.bars.find((b) => b.id === id),
      listByRow: (rowId: string): readonly BarSpec[] =>
        props.bars
          .filter((b) => b.rowId === rowId)
          .slice()
          .sort((a, b) => a.range.start.getTime() - b.range.start.getTime()),
      listInRange: (range: TimeRange): readonly BarSpec[] =>
        props.bars
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
        return props.rows;
      },
      getById: (id: string): RowSpec | undefined => props.rows.find((r) => r.id === id),
      listChildren: (parentId: string | null): readonly RowSpec[] =>
        props.rows.filter((r) => (r.parentId ?? null) === parentId),
      // No expand/collapse state in v0 — every row is always expanded.
      // When tree-collapse lands (deferred per PARITY_RECHECK), this
      // becomes reactive.
      isExpanded: (): boolean => true,
    };
    const linkTable: LinkTable = {
      get links() {
        return props.links;
      },
      getById: (id: string): LinkSpec | undefined => props.links.find((l) => l.id === id),
      listFrom: (fromBarId: string): readonly LinkSpec[] =>
        props.links.filter((l) => l.fromBarId === fromBarId),
      listTo: (toBarId: string): readonly LinkSpec[] =>
        props.links.filter((l) => l.toBarId === toBarId),
    };

    function scrollToDateImpl(date: Date): void {
      const a = axis.value;
      const axisStartMs = a.ticks[0]?.time.getTime() ?? 0;
      const pxPerMs = a.slotWidth / a.slotDurationMs;
      const x = pxPerMs * (date.getTime() - axisStartMs);
      // Phase 23: chart-pane owns horizontal scroll now (was wrapper
      // pre-Phase-23). The chart-header's translateX listener fires
      // automatically on the chart-pane's scroll event so the header
      // tracks the new x position without an extra write here.
      const pane = chartPaneRef.value;
      if (pane) pane.scrollLeft = x;
    }

    const handle: GanttHandle = {
      changeView(viewId: ViewId): void {
        emitToBoth('update:axisInput', { ...props.axisInput, viewId });
      },
      prev(): void {
        const current = props.axisInput;
        emitToBoth('update:axisInput', {
          ...current,
          anchorDate: prevAnchor(current.viewId, current.anchorDate),
        });
      },
      next(): void {
        const current = props.axisInput;
        emitToBoth('update:axisInput', {
          ...current,
          anchorDate: nextAnchor(current.viewId, current.anchorDate),
        });
      },
      today(): void {
        emitToBoth('update:axisInput', { ...props.axisInput, anchorDate: todayAnchor() });
      },
      gotoDate(date: Date): void {
        emitToBoth('update:axisInput', { ...props.axisInput, anchorDate: date });
      },
      incrementDate(delta: IncrementDelta): void {
        const current = props.axisInput;
        emitToBoth('update:axisInput', {
          ...current,
          anchorDate: applyIncrement(current.anchorDate, delta),
        });
      },
      getDate(): Date {
        return props.axisInput.anchorDate;
      },
      zoomTo(date: Date, viewId?: ViewId): void {
        emitToBoth('update:axisInput', {
          ...props.axisInput,
          anchorDate: date,
          viewId: viewId ?? props.axisInput.viewId,
        });
      },
      scrollToDate(date: Date): void {
        scrollToDateImpl(date);
      },
      getBarById(id: string): BarSpec | undefined {
        return props.bars.find((b) => b.id === id);
      },
      getBars(): readonly BarSpec[] {
        return props.bars;
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
        const existing = listenerRegistry.get(key);
        const set = existing ?? new Set<EmitListener>();
        if (!existing) listenerRegistry.set(key, set);
        const typedListener = listener as EmitListener;
        set.add(typedListener);
        return () => {
          set.delete(typedListener);
          if (set.size === 0) listenerRegistry.delete(key);
        };
      },
      hitTestFromClient(clientX, clientY) {
        const svg = bodySvgRef.value;
        if (!svg) return null;
        const rect = svg.getBoundingClientRect();
        // Read scrollTop directly from the chart pane at call time —
        // `useChartScrollState` only tracks scrollLeft. The hit-test
        // fires on consumer-driven drag-end, so a single DOM read is
        // negligible vs adding another reactive ref.
        const scrollTop = chartPaneRef.value?.scrollTop ?? 0;
        return hitTestFromClient({
          clientX,
          clientY,
          bodyRect: { left: rect.left, top: rect.top },
          scrollLeft: chartScroll.scrollLeft.value,
          scrollTop,
          axis: axis.value,
          strips: strips.value,
        });
      },
    };
    expose(handle);

    return () => {
      const a = axis.value;
      const hh = props.headerHeight;
      const hrh = props.headerRowHeight;
      const headerRowsHeight = a.headerRows.length * hrh;
      const totalHeaderBandHeight = headerRowsHeight + hh;
      const totalWidth = contentSize.value.width;
      const bodyHeight = contentSize.value.height;
      const t = theme.value;
      // Hoisted so headerSvg / bodySvg can stamp explicit gridColumn /
      // gridRow when the wrapper is a 3-column grid (Phase 14). The
      // sidebar render block below redeclares `cols`/`hasSidebar` from
      // the same props; both point at the same evaluation.
      const hasSidebar = props.columns.length > 0;

      // Phase 29: start-of-today reference shared by day/slot class
      // derivation across the header + body. Sampled once per render
      // so all classes agree on which calendar day is "today".
      const MS_PER_DAY = 24 * 60 * 60 * 1000;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Phase 29: derive per-header-cell date + dayMeta. Outer band
      // cells (e.g. week view's 7 day-header cells, month view's
      // month-name bands) carry a `date` derived from `cell.x` against
      // the axis's start time + per-slot duration. `dayMeta` is
      // populated only when the cell represents EXACTLY ONE calendar
      // day — `(cell.width / slotWidth) × slotDurationMs === MS_PER_DAY`.
      // The eligibility check filters out month-name bands (multi-day
      // spans) while preserving the day-cell hook for day/week views.
      const axisStartMs = a.ticks[0]?.time.getTime() ?? 0;
      const msPerCellX = a.slotWidth > 0 ? a.slotDurationMs / a.slotWidth : 0;
      function deriveBandCellMeta(cell: AxisHeaderCell): {
        date: Date | undefined;
        dayMeta: CellStateMeta | undefined;
      } {
        if (msPerCellX === 0) return { date: undefined, dayMeta: undefined };
        const date = new Date(axisStartMs + cell.x * msPerCellX);
        const cellSpanMs = cell.width * msPerCellX;
        // Floating-point tolerance for the equality check — pxPerMs
        // arithmetic can lose half a millisecond on long axes.
        const isOneDay = Math.abs(cellSpanMs - MS_PER_DAY) < 1;
        const dayMeta = isOneDay ? computeCellStateMeta(date, todayStart) : undefined;
        return { date, dayMeta };
      }

      // Phase 29: for tick row labels, day classes apply when the
      // axis's slotDurationMs >= MS_PER_DAY (i.e. month / season /
      // halfYear / year views, where one tick = one day). For hourly
      // views (day / week) the tick label is one hour, not a day, so
      // no day classes attach to the tick text.
      const tickIsDayEligible = a.slotDurationMs >= MS_PER_DAY;
      function deriveTickMeta(tick: AxisTick): CellStateMeta | undefined {
        return tickIsDayEligible ? computeCellStateMeta(tick.time, todayStart) : undefined;
      }

      // Phase 29: normalize the optional `headerCellClassNamesCallback`
      // return into a `readonly string[]`. Empty array when no
      // callback is set OR the callback returned `undefined`.
      function callHeaderCellClassNames(arg: HeaderCellArg): readonly string[] {
        const cb = props.headerCellClassNamesCallback;
        if (!cb) return [];
        const raw = cb(arg);
        if (raw === undefined) return [];
        return typeof raw === 'string' ? [raw] : raw;
      }

      const headerCellTemplate = props.slotRegistry?.get(HEADER_CELL_SLOT_NAME);

      // Outer header rows (e.g. month bands above day ticks). One <rect>
      // per cell as the band background + a centered <text> for the label.
      // Rendered first so the tick row draws on top of cell strokes at
      // shared edges.
      //
      // Phase 29: per-cell day classes append onto the `<rect>` class
      // attribute when the cell is day-eligible (week view's 7 day
      // cells; day view's single anchor cell). The class callback
      // fires for ALL outer band cells regardless of eligibility. When
      // a `'header-cell'` slot template is registered, it replaces the
      // default `<rect>+<text>` pair for that cell — args include
      // pre-resolved day meta + any callback-returned extra classes.
      const headerRowChildren: VNode[] = [];
      if (hrh > 0) {
        for (let rowIdx = 0; rowIdx < a.headerRows.length; rowIdx += 1) {
          const row = a.headerRows[rowIdx]!;
          const rowY = rowIdx * hrh;
          // bandIndex 0 is reserved for the tick row; outer bands
          // index from 1 upward — chronix's "tick = innermost" axis
          // convention, contracted in the HeaderCellArg JSDoc.
          const bandIndex = rowIdx + 1;
          for (let cellIdx = 0; cellIdx < row.cells.length; cellIdx += 1) {
            const cell = row.cells[cellIdx]!;
            const { date, dayMeta } = deriveBandCellMeta(cell);
            const extraClasses = callHeaderCellClassNames({
              bandIndex,
              cellIndex: cellIdx,
              date,
              label: cell.label,
              dayMeta,
              viewId: props.axisInput.viewId,
            });
            if (headerCellTemplate) {
              const slotArgs: HeaderCellSlotArgs = {
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
              const raw = headerCellTemplate({
                slot: HEADER_CELL_SLOT_NAME,
                args: slotArgs as unknown as Readonly<Record<string, unknown>>,
              });
              const customVNodes: VNode[] = Array.isArray(raw) ? (raw as VNode[]) : [raw as VNode];
              headerRowChildren.push(...customVNodes);
              continue;
            }
            const dayClasses = dayMeta ? getDayClassNames(dayMeta) : [];
            const classAttr = ['cx-gantt-header-cell', ...dayClasses, ...extraClasses].join(' ');
            headerRowChildren.push(
              h('rect', {
                key: `header-cell-${rowIdx}-${cellIdx}`,
                class: classAttr,
                x: cell.x,
                y: rowY,
                width: cell.width,
                height: hrh,
                fill: t.headerCellFill,
                stroke: t.headerCellStroke,
              }),
              h(
                'text',
                {
                  key: `header-cell-label-${rowIdx}-${cellIdx}`,
                  class: 'cx-gantt-header-cell-label',
                  x: cell.x + cell.width / 2,
                  y: rowY + hrh / 2 + 4,
                  'text-anchor': 'middle',
                  fill: t.headerCellLabel,
                  'font-size': t.headerCellLabelFontSize,
                },
                cell.label,
              ),
            );
          }
        }
      }

      // Tick row: one <line> + <text> per axis.ticks entry. Group is
      // translated down past the outer header rows so the tick group's
      // own coordinate space matches what it was before headerRows landed.
      //
      // Phase 29: tick labels carry day classes only when each tick
      // resolves to exactly one calendar day (month / season /
      // halfYear / year views). Hourly tick views (day / week) keep
      // the label unstyled — the day grouping lives on the outer band
      // for those. The class callback fires for every tick. When a
      // `'header-cell'` slot template is registered, it replaces the
      // `<text>` label for that tick (the `<line>` separator is
      // structural and always renders).
      const tickChildren: VNode[] = [];
      for (let tickIdx = 0; tickIdx < a.ticks.length; tickIdx += 1) {
        const tick = a.ticks[tickIdx]!;
        const tickDayMeta = deriveTickMeta(tick);
        const extraClasses = callHeaderCellClassNames({
          bandIndex: 0,
          cellIndex: tickIdx,
          date: tick.time,
          label: tick.label,
          dayMeta: tickDayMeta,
          viewId: props.axisInput.viewId,
        });
        // Structural separator always renders — slot templates own
        // label replacement only, not the boundary line.
        tickChildren.push(
          h('line', {
            key: `tick-line-${tick.x}`,
            class: 'cx-gantt-tick-line',
            x1: tick.x,
            y1: 0,
            x2: tick.x,
            y2: hh,
            stroke: t.headerTickStroke,
          }),
        );
        if (headerCellTemplate) {
          const slotArgs: HeaderCellSlotArgs = {
            bandIndex: 0,
            cellIndex: tickIdx,
            x: tick.x,
            y: 0,
            width: a.slotWidth,
            height: hh,
            label: tick.label,
            date: tick.time,
            dayMeta: tickDayMeta,
            theme: t,
            tick,
            extraClasses,
          };
          const raw = headerCellTemplate({
            slot: HEADER_CELL_SLOT_NAME,
            args: slotArgs as unknown as Readonly<Record<string, unknown>>,
          });
          const customVNodes: VNode[] = Array.isArray(raw) ? (raw as VNode[]) : [raw as VNode];
          tickChildren.push(...customVNodes);
          continue;
        }
        const dayClasses = tickDayMeta ? getDayClassNames(tickDayMeta) : [];
        const classAttr = ['cx-gantt-tick-label', ...dayClasses, ...extraClasses].join(' ');
        tickChildren.push(
          h(
            'text',
            {
              key: `tick-label-${tick.x}`,
              class: classAttr,
              x: tick.x + 2,
              y: hh - 6,
              fill: t.headerTickLabel,
              'font-size': t.tickLabelFontSize,
            },
            tick.label,
          ),
        );
      }
      if (hh > 0) {
        tickChildren.push(
          h('line', {
            key: 'axis-divider',
            class: 'cx-gantt-axis-divider',
            x1: 0,
            y1: hh,
            x2: a.totalWidth,
            y2: hh,
            stroke: t.headerDivider,
          }),
        );
      }

      // Header is pinned to the top of the wrapper's scrollport so the
      // tick row + outer header bands stay visible while the body scrolls
      // vertically. `background` is opaque so bars don't bleed through
      // while sliding under the band. `z-index: 2` slots it between the
      // sidebar-header (3, top-left corner) above and the sidebar-body
      // (1) below — when both axes scroll, the chart-header passes
      // BEHIND the sidebar-header at the corner and AHEAD of the
      // sidebar-body at the time-row strip.
      // Phase 21: header-side today-line + tooltip widget. The line
      // spans the full header band (y=0 to totalHeaderBandHeight) so it
      // visually continues into the body-side line below. The tooltip
      // group renders LAST so its rect + text paint on top of any
      // overlapping header content. Tooltip is centered horizontally on
      // todayX with a fixed 36 px width — that fits the 2-character
      // default '今日' label at 11 px font; users passing a wider
      // custom tooltip via `TodayLineOption.tooltip` will overflow —
      // a deliberate v0 trade-off (CSS-driven; no text-measurement
      // step). `pointer-events: none` on both line
      // and tooltip so they don't intercept clicks on header tick
      // labels underneath.
      // Phase 22.2: today-cell tint also paints across the header
      // band so the column reads as a single tinted strip through
      // both header and body. Same x/width as the body-side rect;
      // height covers the entire header band (header rows + axis
      // tick row). Inserted into the header SVG AFTER `headerRows`
      // (so cell-band backgrounds for outer months / weeks paint
      // first) but BEFORE the axis tick labels (so labels render
      // legibly on top of the tint).
      const todayCellHeaderNode =
        resolvedTodayCellBg.value !== null
          ? h('rect', {
              class: 'cx-gantt-today-cell',
              'data-today-cell-side': 'header',
              x: resolvedTodayCellBg.value.x,
              y: 0,
              width: resolvedTodayCellBg.value.width,
              height: totalHeaderBandHeight,
              fill: resolvedTodayCellBg.value.color,
              'pointer-events': 'none',
            })
          : null;

      const headerExtras: ReturnType<typeof h>[] = [];
      if (resolvedTodayLine.value !== null) {
        const tl = resolvedTodayLine.value;
        headerExtras.push(
          h('line', {
            key: 'today-line',
            class: 'cx-gantt-today-line',
            'data-today-line-side': 'header',
            x1: tl.x,
            x2: tl.x,
            y1: 0,
            y2: totalHeaderBandHeight,
            stroke: tl.color,
            'stroke-width': tl.width,
            ...(tl.dasharray ? { 'stroke-dasharray': tl.dasharray } : {}),
            'pointer-events': 'none',
          }),
        );
        if (tl.tooltip !== '') {
          // Phase 44 D.7 — pre-measure tooltip width so long custom
          // tooltips ('Now: 14:32 上海' etc.) don't overflow the
          // historical 36-px fixed rect. Formula approximates mixed
          // ASCII/CJK at a 0.7 width factor against the 11-px font
          // size + 8-px horizontal padding; floored at 36 so the
          // default '今日' tooltip keeps its original look.
          const tooltipFontSize = 11;
          const tooltipWidth = Math.max(
            36,
            Math.ceil(tl.tooltip.length * tooltipFontSize * 0.7) + 8,
          );
          const tooltipHeight = 16;
          const tooltipX = tl.x - tooltipWidth / 2;
          const tooltipY = 0;
          headerExtras.push(
            h(
              'g',
              {
                key: 'today-line-tooltip',
                class: 'cx-gantt-today-line-tooltip',
                'pointer-events': 'none',
              },
              [
                h('rect', {
                  x: tooltipX,
                  y: tooltipY,
                  width: tooltipWidth,
                  height: tooltipHeight,
                  fill: tl.tooltipBg,
                  rx: 2,
                }),
                h(
                  'text',
                  {
                    x: tl.x,
                    y: tooltipY + tooltipHeight / 2 + 4,
                    'text-anchor': 'middle',
                    fill: '#ffffff',
                    'font-size': 11,
                  },
                  tl.tooltip,
                ),
              ],
            ),
          );
        }
      }

      // Phase 23: dual-scrollport. The chart-header SVG no longer
      // needs sticky positioning — it lives inside `cx-gantt-chart-
      // header-pane` (overflow: hidden), siblinged ABOVE the chart-
      // pane in the grid. Horizontal scroll is delivered via
      // `translateX` on the inner wrapper (`useHeaderHorizontalSync`)
      // rather than the SVG scrolling itself.
      const headerSvg = h(
        'svg',
        {
          class: 'cx-gantt-header',
          width: totalWidth,
          height: totalHeaderBandHeight,
          style: {
            display: 'block',
            background: t.headerBackground,
          },
        },
        [
          h('g', { class: 'cx-gantt-header-rows' }, headerRowChildren),
          ...(todayCellHeaderNode ? [todayCellHeaderNode] : []),
          h(
            'g',
            {
              class: 'cx-gantt-axis',
              transform: `translate(0, ${headerRowsHeight})`,
            },
            tickChildren,
          ),
          ...headerExtras,
        ],
      );

      // Phase 28.3: populated during the per-bar flatMap below so the
      // link-render block can look up each bar's resolved background
      // color (`useLineEventColor: true` lets each dependency line
      // inherit its source bar's color). Cleared and rebuilt every
      // render — no cross-render state.
      const barColorByBarId = new Map<string, string>();
      // Capture the active transaction once at the start of the render pass
      // to ensure all bars see the same transaction state. This prevents
      // potential reactivity timing issues where the transaction might
      // change mid-render.
      const activeTxn = pointer.activeTransaction.value;
      const barChildren = placedBars.value.flatMap((bar) => {
        // Live geometry: when a `bar-drag` or `bar-resize` transaction
        // is active on THIS bar, shift the rendered rect by the
        // transaction's `deltaX` / `deltaY`. The progress fill + handle
        // below read from the same render geometry so the overlay stays
        // anchored to the bar's visible body during the drag.
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
            const projectedRowId = pointer.projectedRowId.value;
            const sourceBar = props.bars.find((b) => b.id === bar.barId);
            const sourceRowId = sourceBar?.rowId;
            if (
              projectedRowId !== null &&
              sourceRowId !== undefined &&
              projectedRowId !== sourceRowId
            ) {
              const sourceStrip = stripByRowId.value.get(sourceRowId);
              const targetStrip = stripByRowId.value.get(projectedRowId);
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

        // Phase 27.1: viewport-clipping derivation. Reads chartScroll's
        // reactive refs so the per-bar render reacts to user scroll +
        // chart-pane resize. Pure helper — see `derive-viewport-clipping.ts`
        // for the formula + boundary semantics (strict `<` / `>`,
        // `clientWidth === 0` short-circuit for the pre-mount frame).
        const viewportClip = deriveViewportClipping(
          renderX,
          renderWidth,
          chartScroll.scrollLeft.value,
          chartScroll.clientWidth.value,
          TRIANGLE_MARGIN,
        );

        // Bar render: prefer a registered `'bar'` slot template when
        // present; fall back to the default `<rect class="cx-gantt-bar">`.
        // The slot template receives the same live geometry the default
        // would use, plus the effective theme + in-flight transaction +
        // selection state + Phase 20 resolved colors.
        const isSelected = selectedBarSet.value.has(bar.barId);
        const barTemplate = props.slotRegistry?.get(BAR_SLOT_NAME);
        const sourceBar = props.bars.find((b) => b.id === bar.barId);
        // Phase 20: resolve bar colors through the cascade. When no
        // source bar exists (placed-bar orphan, defensive), fall back
        // to theme defaults so the inline `fill=` always has a value.
        const resolvedStyle = sourceBar
          ? resolveBarStyle({
              bar: sourceBar,
              placedBar: bar,
              isSelected,
              activeTransaction: activeTxn,
              themeBackgroundColor: t.barBackgroundColor,
              themeBorderColor: t.barBorderColor,
              themeTextColor: t.barTextColor,
              // Phase 28.2: thread font cascade theme defaults.
              themeFontSize: t.barFontSize,
              themeFontWeight: t.barFontWeight,
              ...(props.barColor !== undefined ? { barColor: props.barColor } : {}),
              ...(props.barBackgroundColor !== undefined
                ? { barBackgroundColor: props.barBackgroundColor }
                : {}),
              ...(props.barBorderColor !== undefined
                ? { barBorderColor: props.barBorderColor }
                : {}),
              ...(props.barTextColor !== undefined ? { barTextColor: props.barTextColor } : {}),
              ...(props.barBackgroundColorCallback
                ? { barBackgroundColorCallback: props.barBackgroundColorCallback }
                : {}),
              ...(props.barBorderColorCallback
                ? { barBorderColorCallback: props.barBorderColorCallback }
                : {}),
              ...(props.barTextColorCallback
                ? { barTextColorCallback: props.barTextColorCallback }
                : {}),
              // Phase 28.2: font callback props.
              ...(props.barFontSizeCallback
                ? { barFontSizeCallback: props.barFontSizeCallback }
                : {}),
              ...(props.barFontWeightCallback
                ? { barFontWeightCallback: props.barFontWeightCallback }
                : {}),
              // Phase 28.3: class-names callback.
              ...(props.barClassNamesCallback
                ? { barClassNamesCallback: props.barClassNamesCallback }
                : {}),
            })
          : {
              backgroundColor: t.barBackgroundColor,
              borderColor: t.barBorderColor,
              textColor: t.barTextColor,
              fontSize: t.barFontSize,
              fontWeight: t.barFontWeight,
              // Phase 28.3: orphan bars take no callback-supplied
              // classes — by definition, no source bar means no
              // callback target. Empty array keeps the contract.
              classNames: [],
            };
        // Phase 28.3: record the bar's resolved background color so
        // the link-render block can look it up when
        // `useLineEventColor: true`. Map cleared at the top of every
        // render pass; only bars present in `placedBars` populate the
        // map. Orphan-bar resolution (no source bar found) still
        // captures the theme fallback color since `resolvedStyle`
        // carries it.
        barColorByBarId.set(bar.barId, resolvedStyle.backgroundColor);
        const nodes: ReturnType<typeof h>[] = [];
        if (barTemplate) {
          if (sourceBar) {
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
            // `SlotContext.args` is typed `Readonly<Record<string, unknown>>`
            // because core can't know per-slot shapes — cast through
            // `unknown` here; the `BarSlotArgs` interface is the
            // documented contract the consumer reads from. The template
            // return is `unknown` per IR (cross-framework) — narrow at
            // the boundary to Vue's VNode shape.
            const raw = barTemplate({
              slot: BAR_SLOT_NAME,
              args: slotArgs as unknown as Readonly<Record<string, unknown>>,
            });
            const customVNodes: ReturnType<typeof h>[] = Array.isArray(raw)
              ? (raw as ReturnType<typeof h>[])
              : [raw as ReturnType<typeof h>];
            nodes.push(...customVNodes);
          }
        } else {
          // Phase 28.3 + Phase 44: append callback-returned class
          // names + bar state-modifier classes (--draggable /
          // --resizable / --dragging / --resizing / --start / --end /
          // --selected) to the bar's main `<rect>` class list. The
          // callback classes come AFTER all built-in classes so
          // consumer CSS can use
          // `.priority-high.cx-gantt-bar { ... }` descendants without
          // specificity surprises. Empty array means the callback
          // wasn't set OR returned undefined — either way, no extra
          // classes get appended.
          //
          // Phase 44 state-modifier classes mirror the parity
          // reference's wrapper-group classes so consumer CSS hooks
          // like `.cx-gantt-bar--dragging { opacity: 0.8 }` work.
          // `--dragging` / `--resizing` fire when the active txn's
          // kind + barId match this bar. `--start` / `--end` come
          // from `bar.isStart` / `bar.isEnd` (axis-clipping flags).
          // `--draggable` / `--resizable` follow `editable` since
          // chronix uses a single-knob editability prop.
          // Phase 54 — `--draggable` follows `editable && eventStartEditable`;
          // `--resizable` follows `editable && eventDurationEditable`. The
          // two CSS hooks can now fire independently so consumers can
          // style "drag-only" / "resize-only" bars distinctly.
          const modifierClasses: string[] = [];
          if (props.editable && props.eventStartEditable) {
            modifierClasses.push('cx-gantt-bar--draggable');
          }
          if (props.editable && props.eventDurationEditable) {
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
          const barClass = ['cx-gantt-bar', ...modifierClasses, ...resolvedStyle.classNames].join(
            ' ',
          );
          nodes.push(
            h('rect', {
              key: bar.barId,
              'data-bar-id': bar.barId,
              class: barClass,
              x: renderX,
              y: renderY,
              width: renderWidth,
              height: bar.height,
              // Phase 20: bar fill / stroke flow from the resolver,
              // not from CSS. Default render's fill / stroke override
              // the `.cx-gantt-bar` CSS class via inline-attribute
              // precedence (inline > class).
              fill: resolvedStyle.backgroundColor,
              stroke: resolvedStyle.borderColor,
            }),
          );

          // Phase 44 D.5: progress fill paints HERE (before triangles
          // + text) so the apex + title leading edge aren't washed by
          // the translucent green overlay. Mirrors the parity
          // reference's paint order. Handle + label still paint AFTER
          // text below (so the white handle square + percent label
          // remain on top of everything).
          const sourceProgressEarly = barProgressById.value.get(bar.barId);
          const overlayIdEarly = overlayIdByBarId.value.get(bar.barId);
          if (sourceProgressEarly !== undefined && overlayIdEarly !== undefined) {
            const displayedProgressEarly =
              activeTxn?.kind === 'progress-handle' && activeTxn.barId === bar.barId
                ? Math.max(0, Math.min(100, activeTxn.projectedProgress))
                : sourceProgressEarly;
            const clampedEarly = Math.max(0, Math.min(100, displayedProgressEarly));
            const fillWidthEarly = (clampedEarly / 100) * renderWidth;
            nodes.push(
              h('rect', {
                key: `${bar.barId}-progress-fill`,
                'data-progress-bar-id': bar.barId,
                class: 'cx-gantt-progress-fill',
                x: renderX,
                y: renderY,
                width: fillWidthEarly,
                height: bar.height,
                fill: t.progressFill,
                'fill-opacity': t.progressFillOpacity,
                'pointer-events': 'none',
              }),
            );
          }
        }

        // Phase 27 + 27.1: continuation indicators. A left-pointing
        // triangle fires on EITHER axis-clipped (`!bar.isStart` —
        // bar's `range.start` falls before the axis range; Phase 27)
        // OR viewport-clipped (`isViewportClippedStart` — bar's left
        // edge is to the left of the visible chart-pane viewport;
        // Phase 27.1). Right-pointing symmetric.
        //
        // Apex position depends on WHICH case fired. When the
        // viewport-clipped sub-case fires, the apex locks to the
        // visible viewport edge in content-coords (`scrollLeft +
        // TRIANGLE_MARGIN` for left, `scrollLeft + clientWidth -
        // TRIANGLE_MARGIN` for right). The chart-pane's native
        // scroll then translates this into the user's viewport
        // coordinates at paint time, so the apex stays visible at
        // the viewport edge regardless of how far the bar has
        // scrolled offscreen. When only the axis-clipped sub-case
        // fires (Phase 27's existing branch), the apex is anchored
        // inside the bar's content-x edge — same as before Phase 27.1.
        //
        // Precedence (viewport over bar-edge) matches the parity
        // reference's first-branch-wins logic at TimelineEvent.tsx:314-320.
        //
        // `data-viewport-clipped` records which sub-case fired so
        // tests + consumer CSS can distinguish viewport-locked from
        // bar-edge-locked triangles without re-running the math.
        //
        // Inserted between the bar's main rect (default or custom-slot
        // output) and the progress fill/handle so paint order reads
        // rect → triangles → progress fill → progress handle →
        // progress label, matching the original spec.
        //
        // Geometry: `pointer-events: none` so triangles never intercept
        // clicks on the bar body underneath. `opacity: 0.8` + `fill:#000`
        // match the original translucent-black indicator
        // convention.
        // `data-axis-clipped` reflects the Phase 27 sub-case independently
        // of viewport-clipping. `data-viewport-clipped` reflects the
        // Phase 27.1 sub-case. Both are independent booleans on the same
        // polygon — a bar in a narrow viewport may be axis-clipped AND
        // viewport-clipped on the same side (apex precedence is
        // viewport-locked, but both flags remain visible to consumers
        // + cross-demo parity tests). The Phase 27 parity assertion
        // filters on `[data-axis-clipped="true"]` to isolate the
        // axis-clipped triangle set from viewport-clipped triangles.
        const fireLeftTriangle = !bar.isStart || viewportClip.isViewportClippedStart;
        if (fireLeftTriangle) {
          const apexX = viewportClip.isViewportClippedStart
            ? viewportClip.viewportLockedLeftApexX
            : renderX + TRIANGLE_MARGIN;
          const baseX = apexX + TRIANGLE_SIZE;
          const centerY = renderY + bar.height / 2;
          nodes.push(
            h('polygon', {
              key: `${bar.barId}-continuation-left`,
              'data-bar-id': bar.barId,
              'data-axis-clipped': bar.isStart ? 'false' : 'true',
              'data-viewport-clipped': viewportClip.isViewportClippedStart ? 'true' : 'false',
              class: 'cx-gantt-bar-continuation-indicator cx-gantt-bar-continuation-left',
              points: `${apexX},${centerY} ${baseX},${centerY - TRIANGLE_SIZE} ${baseX},${centerY + TRIANGLE_SIZE}`,
              fill: '#000',
              opacity: 0.8,
              'pointer-events': 'none',
            }),
          );
        }
        const fireRightTriangle = !bar.isEnd || viewportClip.isViewportClippedEnd;
        if (fireRightTriangle) {
          const apexX = viewportClip.isViewportClippedEnd
            ? viewportClip.viewportLockedRightApexX
            : renderX + renderWidth - TRIANGLE_MARGIN;
          const baseX = apexX - TRIANGLE_SIZE;
          const centerY = renderY + bar.height / 2;
          nodes.push(
            h('polygon', {
              key: `${bar.barId}-continuation-right`,
              'data-bar-id': bar.barId,
              'data-axis-clipped': bar.isEnd ? 'false' : 'true',
              'data-viewport-clipped': viewportClip.isViewportClippedEnd ? 'true' : 'false',
              class: 'cx-gantt-bar-continuation-indicator cx-gantt-bar-continuation-right',
              points: `${apexX},${centerY} ${baseX},${centerY - TRIANGLE_SIZE} ${baseX},${centerY + TRIANGLE_SIZE}`,
              fill: '#000',
              opacity: 0.8,
              'pointer-events': 'none',
            }),
          );
        }

        // Phase 28.2: bar title auto-render. Emits a `<text class=
        // "cx-gantt-bar-text">` per bar with a non-empty `title`,
        // positioned inside the bar body. Inserted AFTER continuation
        // triangles (Phase 27) and BEFORE the progress fill so the
        // title paints below the translucent progress overlay —
        // matches the original paint order (rect →
        // triangles → title → progress → label → handle).
        //
        // Gates: outer (`renderWidth > 30`) skips title rendering for
        // very narrow bars (a 30-px minimum so a single character isn't
        // squeezed into an unreadable strip); inner (`availableWidth
        // >= 10`) skips when continuation triangles eat most of the
        // title's space.
        //
        // Title position adapts to continuation triangles via the
        // pure helper `deriveEdgePaddedX` (Phase 28.2.1). Three-way
        // branch per side:
        //   - viewport-clipped (Phase 27.1 sub-case): title-start
        //     locks past the viewport-locked triangle's base at
        //     `viewportLockedApex + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP`.
        //   - axis-clipped (Phase 27 sub-case): title-start at
        //     `renderX + TRIANGLE_MARGIN + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP
        //     = renderX + 11 px`.
        //   - default: title-start at `renderX + TITLE_LEFT_PADDING
        //     = renderX + 8 px`.
        // Symmetric on the right. Precedence (viewport-clipped wins
        // when both fire on same side) matches Phase 27.1's apex
        // precedence — title stays user-visible at the viewport edge.
        //
        // Phase 28.2.2: title-side viewport-locking fires ONLY when
        // the bar SPANS the entire viewport (both edges past their
        // respective viewport boundaries). Partial-overlap cases
        // (e.g. bar's left in viewport, right offscreen-right) keep
        // default positioning so the title naturally appears at the
        // bar's edge — matches the original scroll-invariant
        // title behavior + restores cross-demo bar-text count parity.
        // Triangles + progress-dots keep their per-side viewport-lock
        // semantics (those are continuation indicators that should
        // appear at the viewport edge whenever the bar extends past it).
        const titleViewportSpan =
          viewportClip.isViewportClippedStart && viewportClip.isViewportClippedEnd;
        //
        // Truncation via `truncateBarText` (char-count + ellipsis,
        // ported verbatim from the original spec). `<text>` uses
        // `text-anchor="start"` + `dominant-baseline="middle"` so
        // the title anchors at `(titleStartX, bar mid-line)`.
        // `pointer-events: none` + `user-select: none` so the title
        // never intercepts clicks on the bar body.
        // Phase 28.2: also gate on axis-overlap. The original spec's
        // `TimelineEvent` doesn't mount for bars whose calendar range
        // falls outside the visible axis, so its text count is bars-
        // overlapping-axis only. Chronix's `BarPlacementPass` produces
        // a `PlacedBar` for every bar (off-axis bars get x < 0 or
        // x > totalWidth) so the title-gate has to do the same check
        // the placement pass did. Equivalent to `hasAxisOverlap`:
        // `bar.x < a.totalWidth && bar.x + bar.width > 0`.
        // (Same pattern as Phase 27's axis-overlap gate on continuation
        // flags. Bar rects still mount off-screen — only text is
        // suppressed — keeping the off-axis bar geometry intact while
        // suppressing the per-bar text decoration.)
        const titleHasAxisOverlap = bar.x < a.totalWidth && bar.x + bar.width > 0;
        const title = sourceBar?.title;
        if (titleHasAxisOverlap && title && title.length > 0 && renderWidth > 30) {
          const titleStartX = deriveEdgePaddedX(
            'start',
            renderX,
            viewportClip.viewportLockedLeftApexX,
            !bar.isStart,
            titleViewportSpan,
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
            titleViewportSpan,
            TITLE_RIGHT_PADDING,
            TRIANGLE_MARGIN,
            TRIANGLE_SIZE,
            TITLE_TRIANGLE_GAP,
          );
          const availableWidth = Math.max(0, titleEndX - titleStartX);
          if (availableWidth >= 10) {
            // Get progress for title display
            const sourceProgressForTitle = barProgressById.value.get(bar.barId);
            const displayedProgressForTitle =
              activeTxn?.kind === 'progress-handle' && activeTxn.barId === bar.barId
                ? Math.max(0, Math.min(100, activeTxn.projectedProgress))
                : (sourceProgressForTitle ?? 0);
            const clampedProgressForTitle = Math.max(0, Math.min(100, displayedProgressForTitle));
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
              nodes.push(
                h(
                  'text',
                  {
                    key: `${bar.barId}-title`,
                    'data-bar-id': bar.barId,
                    class: 'cx-gantt-bar-text',
                    x: titleStartX,
                    y: renderY + bar.height / 2,
                    fill: resolvedStyle.textColor,
                    'font-size': resolvedStyle.fontSize,
                    'font-weight': resolvedStyle.fontWeight,
                    'font-family': 'inherit',
                    'text-anchor': 'start',
                    'dominant-baseline': 'middle',
                    'pointer-events': 'none',
                    style: { userSelect: 'none' },
                  },
                  truncated,
                ),
              );
            }
          }
        }

        // Progress handle: only for bars that declared BOTH
        // `progress` AND `pointerOverlayId`. Changed to downward-pointing
        // triangle below bar edge, only visible when the handle itself is
        // hovered or during active drag. Progress is shown in the title
        // as "title (progress%)".
        const sourceProgress = barProgressById.value.get(bar.barId);
        const overlayId = overlayIdByBarId.value.get(bar.barId);
        if (sourceProgress !== undefined && overlayId !== undefined) {
          const displayedProgress =
            activeTxn?.kind === 'progress-handle' && activeTxn.barId === bar.barId
              ? Math.max(0, Math.min(100, activeTxn.projectedProgress))
              : sourceProgress;
          const clamped = Math.max(0, Math.min(100, displayedProgress));
          const fillWidth = (clamped / 100) * renderWidth;
          const handleX = renderX + fillWidth;
          const effectiveHandleSize = props.progressHandleSize ?? 12;
          nodes.push(
            h('rect', {
              key: `${bar.barId}-progress-handle`,
              'data-progress-bar-id': bar.barId,
              'data-overlay-id': overlayId,
              class: 'cx-gantt-progress-handle',
              x: handleX - effectiveHandleSize / 2,
              y: renderY + bar.height / 2 - effectiveHandleSize / 2,
              width: effectiveHandleSize,
              height: effectiveHandleSize,
              fill: t.progressHandleFill,
              stroke: t.progressHandleStroke,
              'stroke-width': t.progressHandleStrokeWidth,
            }),
          );
          const progressMeta = sourceBar?.progress;
          if (progressMeta?.showText !== false) {
            const rounded = Math.round(clamped);
            const template = progressMeta?.textFormat ?? '{value}%';
            const labelText = template.replace('{value}', String(rounded));
            nodes.push(
              h(
                'text',
                {
                  key: `${bar.barId}-progress-label`,
                  'data-progress-bar-id': bar.barId,
                  class: 'cx-gantt-progress-label',
                  x: renderX + renderWidth / 2,
                  y: renderY + bar.height / 2 + 4,
                  'text-anchor': 'middle',
                  fill: t.progressLabel,
                  'font-size': t.progressLabelFontSize,
                  'font-weight': t.progressLabelFontWeight,
                  'pointer-events': 'none',
                },
                labelText,
              ),
            );
          }
        }

        // Phase 28.1: selection visual + resize-handle render. Three
        // independent emissions, each gated on `selectionHasAxisOverlap`
        // so off-axis bars get no visual feedback (matches the parity
        // reference's mount-vs-no-mount semantics for `TimelineEvent`).
        // Same axis-overlap gate pattern as Phase 27 (continuation
        // triangles) and Phase 28.2 (bar title) — adopted proactively
        // at design time per the third-consecutive-phase finding.
        //
        // Z-order: selection-border → edge-zone rects → dot rects.
        // Selection-border paints on top of bar fill + progress overlay
        // so the outline is always visible; edge-zone rects come next
        // (transparent — `pointer-events: auto` + `cursor: ew-resize`
        // for cursor styling at the hit-test boundary); dot rects last
        // so the visible white dots paint above the transparent edge
        // zones.
        //
        // Dot rects use `pointer-events: none` so they don't intercept
        // events that should reach the edge-zone underneath. Selection-
        // border uses `pointer-events: none` for the same reason — the
        // outline is decorative, not interactive.
        const selectionHasAxisOverlap = bar.x < a.totalWidth && bar.x + bar.width > 0;
        if (selectionHasAxisOverlap) {
          // Selection border: one rect when the bar is selected.
          if (isSelected) {
            nodes.push(
              h('rect', {
                key: `${bar.barId}-selection-border`,
                'data-bar-id': bar.barId,
                class: 'cx-gantt-bar-selection-border',
                x: renderX,
                y: renderY,
                width: renderWidth,
                height: bar.height,
                fill: 'none',
                stroke: t.barSelectedBorderColor,
                'stroke-width': t.barSelectedBorderWidth,
                'pointer-events': 'none',
              }),
            );
          }
          // Edge resize zones: always when bar is editable AND has
          // axis-overlap. Transparent rects for cursor cue only — the
          // hit-test layer (Phase 3 + 9 + 19) still owns the actual
          // resize detection by geometry; one shared
          // `barResizerThickness` token drives both, threaded into
          // `useGanttPointer`'s `edgeZoneWidth` above.
          // Phase 54 — gate on `eventDurationEditable` so consumers
          // can disable resize while keeping drag enabled.
          if (props.editable && props.eventDurationEditable) {
            const resizerThickness = t.barResizerThickness;
            nodes.push(
              h('rect', {
                key: `${bar.barId}-resizer-start`,
                'data-bar-id': bar.barId,
                class: 'cx-gantt-bar-resizer-start',
                x: renderX,
                y: renderY,
                width: resizerThickness,
                height: bar.height,
                fill: 'transparent',
                'pointer-events': 'auto',
                style: { cursor: 'ew-resize' },
              }),
              h('rect', {
                key: `${bar.barId}-resizer-end`,
                'data-bar-id': bar.barId,
                class: 'cx-gantt-bar-resizer-end',
                x: renderX + renderWidth - resizerThickness,
                y: renderY,
                width: resizerThickness,
                height: bar.height,
                fill: 'transparent',
                'pointer-events': 'auto',
                style: { cursor: 'ew-resize' },
              }),
            );
          }
          // Visible dot handles: 2 rects when bar is selected AND
          // editable AND has axis-overlap. White fill + bar's resolved
          // border color stroke, 8 × 8 px, 1-px inset from each edge
          // (or shifted inward past a continuation triangle when one
          // is present on the same side). Phase 28.2.1: viewport-
          // clipped sub-case via `deriveEdgePaddedX` shifts the visible
          // dot to viewport edge; underlying edge-zone hit-test rect
          // (above) stays at the bar's actual geometric edge, so
          // resize gestures still target the bar's real boundary.
          // Phase 54 — dots gated on `eventDurationEditable`: a
          // selected bar in eventDurationEditable=false mode shows
          // selection border but no resize dots.
          if (isSelected && props.editable && props.eventDurationEditable) {
            const dotSize = t.barResizerDotSize;
            const dotY = renderY + (bar.height - dotSize) / 2;
            const leftDotX = deriveEdgePaddedX(
              'start',
              renderX,
              viewportClip.viewportLockedLeftApexX,
              !bar.isStart,
              viewportClip.isViewportClippedStart,
              DOT_EDGE_INSET,
              TRIANGLE_MARGIN,
              TRIANGLE_SIZE,
              DOT_TRIANGLE_GAP,
            );
            const rightDotX =
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
              ) - dotSize;
            nodes.push(
              h('rect', {
                key: `${bar.barId}-resizer-dot-start`,
                'data-bar-id': bar.barId,
                class: 'cx-gantt-bar-resizer-dot-start',
                x: leftDotX,
                y: dotY,
                width: dotSize,
                height: dotSize,
                fill: '#ffffff',
                stroke: resolvedStyle.borderColor,
                'stroke-width': 1,
                'pointer-events': 'none',
              }),
              h('rect', {
                key: `${bar.barId}-resizer-dot-end`,
                'data-bar-id': bar.barId,
                class: 'cx-gantt-bar-resizer-dot-end',
                x: rightDotX,
                y: dotY,
                width: dotSize,
                height: dotSize,
                fill: '#ffffff',
                stroke: resolvedStyle.borderColor,
                'stroke-width': 1,
                'pointer-events': 'none',
              }),
            );
          }
        }

        return nodes;
      });

      // Link paths render in a sibling group AFTER the bars group so
      // SVG paint order puts them on top. `pointer-events: none` keeps
      // bar drag / resize / progress-handle pointer events flowing
      // through to the bars layer. Markers attach via `marker-end`
      // referencing a `<defs>` entry built below.
      //
      // Phase 28.3 layering for each routed link:
      //   1. Resolve base color via `LinkSpec.colorOverride` →
      //      (useLineEventColor: true) source-bar resolved bg →
      //      `theme.linkDefaultColor`.
      //   2. Resolve base marker from `LinkSpec.marker`.
      //   3. If `onLineCallback` set, invoke with the resolved
      //      defaults; merge any returned `{ color?, marker? }`.
      //   4. If the slot registry has a `'link'` template, invoke it
      //      with `LinkSlotArgs` carrying the final color + marker;
      //      consumer template owns the entire link output (path +
      //      marker selection). Else emit default `<path
      //      class="cx-gantt-link">`.
      //
      // The marker `<defs>` collection uses POST-callback resolved
      // colors so `marker-end="url(#cx-marker-...)"` references stay
      // valid for the override.
      const linkSpecById = new Map<string, LinkSpec>(props.links.map((l) => [l.id, l]));
      const placedBarById = new Map<string, PlacedBar>(placedBars.value.map((p) => [p.barId, p]));
      const linkSlotTemplate = props.slotRegistry?.get(LINK_SLOT_NAME);

      // Helper: compute the "live" (drag-adjusted) position of a bar.
      // Returns a PlacedBar with x/y/width adjusted by the active transaction
      // if this bar is currently being dragged or resized. Otherwise returns
      // the original position unchanged.
      function getLiveBar(bar: PlacedBar): PlacedBar {
        const activeTxn = pointer.activeTransaction.value;
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
          // Cross-row snap: same logic as bar rendering (lines 1986-2012)
          const projectedRowId = pointer.projectedRowId.value;
          const sourceBar = props.bars.find((b) => b.id === bar.barId);
          const sourceRowId = sourceBar?.rowId;
          if (
            projectedRowId !== null &&
            sourceRowId !== undefined &&
            projectedRowId !== sourceRowId
          ) {
            const sourceStrip = stripByRowId.value.get(sourceRowId);
            const targetStrip = stripByRowId.value.get(projectedRowId);
            if (sourceStrip && targetStrip) {
              const intraStripOffset = bar.y - sourceStrip.y;
              liveY = targetStrip.y + intraStripOffset;
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
      ): string {
        const activeTxn = pointer.activeTransaction.value;
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
        const spec = linkSpecById.get(routed.linkId);
        if (!spec) return routed.pathD;

        // Use DependencyLineAlgorithm to compute the path with proper routing logic
        // including support for overlapping bars via extraVerticalOffset
        const smoothGap = 20; // Default smoothBeforeTargetGapPx
        const algorithm = new DependencyLineAlgorithm(spec.routing, smoothGap);
        const line = algorithm.generateDependencyLine(from.x, from.y, to.x, to.y);

        return algorithm.generateSVGPath(line);
      }

      // Per-link resolved color + marker built once + reused for both
      // the path render and the marker defs.
      interface ResolvedLinkRender {
        readonly routed: RoutedLink;
        readonly spec: LinkSpec;
        readonly fromBar: PlacedBar;
        readonly toBar: PlacedBar;
        readonly color: string;
        readonly marker: LinkMarker | CustomLinkMarker;
        readonly livePathD: string; // Path adjusted for drag
      }
      const resolvedLinks: ResolvedLinkRender[] = [];
      for (const routed of routedLinks.value) {
        const spec = linkSpecById.get(routed.linkId);
        if (!spec) continue; // Orphan; never reaches here in practice.
        const fromBar = placedBarById.get(spec.fromBarId);
        const toBar = placedBarById.get(spec.toBarId);
        if (!fromBar || !toBar) continue; // Bar resolution gap — defensive.

        // Recompute path with live positions if bars are being dragged
        const livePathD = rerouteLinkWithPathAdjustment(routed, fromBar, toBar);

        // Color cascade:
        //   colorOverride > useLineEventColor source bar > theme default.
        let color: string;
        if (routed.color !== undefined) {
          color = routed.color;
        } else if (props.useLineEventColor) {
          const sourceBarColor = barColorByBarId.get(spec.fromBarId);
          color = sourceBarColor ?? t.linkDefaultColor;
        } else {
          color = t.linkDefaultColor;
        }

        let marker: LinkMarker | CustomLinkMarker = spec.marker;

        // `onLineCallback` runs LAST so the host can override either
        // channel. Callback sees the resolved defaults (post cascade)
        // and returns only what it wants to override.
        if (props.onLineCallback) {
          const arg: LinkRenderArg = {
            routedLink: routed,
            linkSpec: spec,
            fromBar,
            toBar,
            defaultColor: color,
            currentMarker: marker,
          };
          const override = props.onLineCallback(arg);
          if (override !== undefined) {
            if (override.color !== undefined) color = override.color;
            if (override.marker !== undefined) marker = override.marker;
          }
        }

        resolvedLinks.push({ routed, spec, fromBar, toBar, color, marker, livePathD });
      }

      const linkPathNodes: ReturnType<typeof h>[] = [];
      for (const r of resolvedLinks) {
        if (linkSlotTemplate) {
          // Slot owns the entire rendered output. Build the args bag,
          // invoke, normalize VNode | VNode[] | null returns.
          const slotArgs: LinkSlotArgs = {
            routedLink: r.routed,
            linkSpec: r.spec,
            fromBar: r.fromBar,
            toBar: r.toBar,
            color: r.color,
            marker: r.marker,
            theme: t,
          };
          const raw = linkSlotTemplate({
            slot: LINK_SLOT_NAME,
            args: slotArgs as unknown as Readonly<Record<string, unknown>>,
          });
          const customVNodes: ReturnType<typeof h>[] = Array.isArray(raw)
            ? (raw as ReturnType<typeof h>[])
            : raw === null
              ? []
              : [raw as ReturnType<typeof h>];
          linkPathNodes.push(...customVNodes);
        } else {
          const markerEnd = markerEndUrl(r.marker, r.color);
          linkPathNodes.push(
            h('path', {
              key: r.routed.linkId,
              'data-link-id': r.routed.linkId,
              class: 'cx-gantt-link',
              d: r.livePathD, // Use live (drag-adjusted) path
              stroke: r.color,
              'stroke-width': t.linkStrokeWidth,
              fill: 'none',
              ...(markerEnd !== null ? { 'marker-end': markerEnd } : {}),
            }),
          );
        }
      }

      // Build `<defs>` containing one `<marker>` per (markerType × color)
      // pair plus one `<marker>` per (customMarkerId × color). Phase 28.3:
      // the color set now includes POST-callback resolved colors so a
      // line whose `onLineCallback` returned a new color still resolves
      // its marker-end ref to a valid def. Custom markers from
      // callbacks ALSO contribute new defs (the override's marker may
      // be a `CustomLinkMarker` object that wasn't in `props.links`).
      const usedColors = new Set<string>();
      usedColors.add(t.linkDefaultColor);
      for (const r of resolvedLinks) {
        usedColors.add(r.color);
      }
      const customMarkerById = new Map<string, CustomLinkMarker>();
      for (const link of props.links) {
        if (typeof link.marker === 'object') {
          customMarkerById.set(link.marker.id, link.marker);
        }
      }
      for (const r of resolvedLinks) {
        if (typeof r.marker === 'object') {
          customMarkerById.set(r.marker.id, r.marker);
        }
      }
      const defsChildren: ReturnType<typeof h>[] = [];
      for (const color of usedColors) {
        const colorId = markerColorId(color);
        for (const type of BUILTIN_MARKER_TYPES) {
          defsChildren.push(renderBuiltinMarker(type, color, colorId));
        }
        for (const customMarker of customMarkerById.values()) {
          defsChildren.push(renderCustomMarker(customMarker, color, colorId));
        }
      }

      // Phase 22.2: today-cell background tint, deepest layer in the
      // body SVG (z-order behind everything except the chart bg fill).
      // Bars + links + today-line all paint on top so visual contrast
      // is preserved.
      const todayCellBodyNode =
        resolvedTodayCellBg.value !== null
          ? h('rect', {
              class: 'cx-gantt-today-cell',
              'data-today-cell-side': 'body',
              x: resolvedTodayCellBg.value.x,
              y: 0,
              width: resolvedTodayCellBg.value.width,
              height: bodyHeight,
              fill: resolvedTodayCellBg.value.color,
              'pointer-events': 'none',
            })
          : null;

      // Phase 29: one transparent `<rect class="cx-gantt-slot ...">`
      // per axis tick — pure CSS hook for consumer styling (weekend
      // tinting, today-column emphasis, past/future fade). Sits BEHIND
      // grid lines + bars + links so consumer fills paint visibly
      // without obscuring chart chrome. `fill: transparent` keeps the
      // default render pixel-identical to pre-Phase-29; classes alone
      // let consumer CSS opt-in to backgrounds via
      // `.cx-gantt-slot-sat { background: ... }` selectors.
      const bodySlotChildren: VNode[] = [];
      for (const tick of a.ticks) {
        const slotMeta = computeCellStateMeta(tick.time, todayStart);
        const slotClasses = getSlotClassNames(slotMeta);
        bodySlotChildren.push(
          h('rect', {
            key: `body-slot-${tick.x}`,
            class: slotClasses.join(' '),
            x: tick.x,
            y: 0,
            width: a.slotWidth,
            height: bodyHeight,
            fill: 'transparent',
            'pointer-events': 'none',
          }),
        );
      }

      // Phase 26: body grid lines. Renders BETWEEN today-cell tint and
      // today-line so the SVG paint order reads tint → grid → today-line
      // → bars → links — matches the original layering.
      //
      // Vertical lines: one solid 1-px <rect class="cx-gantt-grid-vline">
      // per axis tick. Every tick is treated as a cell-boundary because
      // chronix's `PlannedAxis.ticks` IS the innermost cell row — there
      // are no sub-tick subdivisions in the v0 view set. (The parity
      // reference also emits one solid boundary per tick in its default
      // demo for the same reason; its `gantt-grid-vline-dashed` branch
      // is dead code unless a host configures `slotDuration < cell
      // duration`, which neither side exposes today.) When the tick
      // falls on Monday at 00:00 (ISO week start), the rect picks up
      // the additional class `cx-gantt-grid-vline-week` and the darker
      // `gridLineWeekStartColor` fill. Plus one closing solid vline at
      // `axis.totalWidth - 1` so the rightmost cell visually closes
      // its right edge.
      //
      // Horizontal lines: one per strip's bottom edge. Y is snapped to
      // the device pixel grid via `snapHorizontalGridLineY` so 1-px
      // strokes stay single-weight under fractional row heights and
      // non-1 device pixel ratios.
      //
      // Week-start derivation is inline (`tick.time.getDay() === 1 && tick.time.getHours() === 0`)
      // — see Phase 26 design doc for why no `AxisTick.isWeekStart`
      // field was added.
      const gridChildren: VNode[] = [];
      for (const tick of a.ticks) {
        const isWeekStart = tick.time.getDay() === 1 && tick.time.getHours() === 0;
        gridChildren.push(
          h('rect', {
            key: `grid-vline-${tick.x}`,
            class: isWeekStart
              ? 'cx-gantt-grid-vline cx-gantt-grid-vline-week'
              : 'cx-gantt-grid-vline',
            x: tick.x - 1,
            y: 0,
            width: 1,
            height: bodyHeight,
            fill: isWeekStart ? t.gridLineWeekStartColor : t.gridLineColor,
            'pointer-events': 'none',
          }),
        );
      }
      // Right-edge closing vline — matches the original spec's
      // `includeRightEdge` branch so the rightmost cell visually closes.
      // Skipped when the axis is empty (totalWidth 0) to avoid a stray
      // line at x=-1 in degenerate fixtures.
      if (a.totalWidth > 0) {
        gridChildren.push(
          h('rect', {
            key: 'grid-vline-right-edge',
            class: 'cx-gantt-grid-vline',
            x: a.totalWidth - 1,
            y: 0,
            width: 1,
            height: bodyHeight,
            fill: t.gridLineColor,
            'pointer-events': 'none',
          }),
        );
      }
      for (let i = 0; i < strips.value.length; i += 1) {
        const strip = strips.value[i]!;
        const lineY = strip.y + strip.height;
        const yCrisp = snapHorizontalGridLineY(lineY, bodyHeight);
        gridChildren.push(
          h('line', {
            key: `grid-hline-${i}`,
            class: 'cx-gantt-grid-hline',
            x1: 0,
            y1: yCrisp,
            x2: a.totalWidth,
            y2: yCrisp,
            stroke: t.gridLineRowRuleColor,
            'stroke-width': 1,
            'vector-effect': 'non-scaling-stroke',
            'pointer-events': 'none',
          }),
        );
      }
      const gridGroupNode =
        gridChildren.length > 0
          ? h('g', { class: 'cx-gantt-grid', 'pointer-events': 'none' }, gridChildren)
          : null;

      // Phase 21: today-line under bars. Drawn BEFORE the bars group so
      // bars paint on top (matches original spec behavior where the
      // line sits below bar bodies but above the bg). Tooltip widget
      // is in the header SVG, not here — body only carries the stroke.
      const todayLineBodyNode =
        resolvedTodayLine.value !== null
          ? h('line', {
              class: 'cx-gantt-today-line',
              'data-today-line-side': 'body',
              x1: resolvedTodayLine.value.x,
              x2: resolvedTodayLine.value.x,
              y1: 0,
              y2: bodyHeight,
              stroke: resolvedTodayLine.value.color,
              'stroke-width': resolvedTodayLine.value.width,
              ...(resolvedTodayLine.value.dasharray
                ? { 'stroke-dasharray': resolvedTodayLine.value.dasharray }
                : {}),
              'pointer-events': 'none',
            })
          : null;

      const bodySvg = h(
        'svg',
        {
          ref: bodySvgRef,
          class: 'cx-gantt-body',
          width: totalWidth,
          height: bodyHeight,
          style: {
            display: 'block',
            background: t.chartBackground,
            // Phase 14: explicit grid placement skips the divider track.
            ...(hasSidebar ? { gridColumn: '3', gridRow: '2' } : {}),
            // Disable default browser touch actions (scroll/zoom) so
            // pointer events fire consistently for drag/resize gestures.
            touchAction: 'none',
          },
          onPointerdown,
          onPointermove,
          onPointerup,
          onPointercancel,
        },
        [
          h('defs', { class: 'cx-gantt-defs' }, defsChildren),
          ...(todayCellBodyNode ? [todayCellBodyNode] : []),
          // Phase 29: body slot rects (one transparent <rect> per
          // axis tick, carrying `cx-gantt-slot` + `cx-gantt-slot-{dayId}`
          // + state-modifier classes). Layered BEFORE grid lines so
          // grid strokes paint over them, and BEFORE bars / links so
          // consumer-CSS backgrounds don't obscure chart chrome.
          h('g', { class: 'cx-gantt-slots', 'pointer-events': 'none' }, bodySlotChildren),
          ...(gridGroupNode ? [gridGroupNode] : []),
          ...(todayLineBodyNode ? [todayLineBodyNode] : []),
          h(
            'g',
            {
              class: 'cx-gantt-bars',
              // Phase 54 — bar hover events via delegated handlers.
              onPointerover: onBarsPointerover,
              onPointerout: onBarsPointerout,
            },
            barChildren,
          ),
          h('g', { class: 'cx-gantt-links', 'pointer-events': 'none' }, linkPathNodes),
        ],
      );

      // Sidebar (top-left + bottom-left panes) — only when `columns` is
      // populated. The inner DOM is an HTML `<table>` so any column
      // flagged `group: true` can use the native `rowspan` attribute to
      // merge consecutive rows that share the same column value into
      // one cell. `<colgroup>` shares per-column widths between header
      // and body tables so vertical borders align across the panes.
      const cols = props.columns;
      let sidebarHeader: ReturnType<typeof h> | null = null;
      let sidebarBody: ReturnType<typeof h> | null = null;
      let divider: ReturnType<typeof h> | null = null;
      let sidebarWidth = 0;
      if (hasSidebar) {
        // Effective area width = user override (if drag has happened)
        // or the natural sum of `ColumnSpec.width`. The col-width
        // scale factor (effective / base) is applied uniformly to
        // every <col> so border alignment stays exact at any width.
        sidebarWidth = effectiveSidebarWidth.value;
        const scale = sidebarScale.value;

        // Build two distinct `<colgroup>` vnodes — one per sidebar
        // table. Reusing a single vnode in two tree positions triggers
        // Vue's "same vnode reference" patch short-circuit, so a state-
        // change rerender ends up patching only one DOM location and
        // the other stays stale (e.g. col widths reactive to the
        // Phase 14 divider drag wouldn't propagate to both tables).
        const buildColGroup = () =>
          h(
            'colgroup',
            null,
            cols.map((c) => h('col', { key: c.key, style: { width: `${c.width * scale}px` } })),
          );
        const tableStyle = {
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          width: `${sidebarWidth}px`,
        } as const;

        // sidebar-header pins to both top and left so the top-left
        // corner stays visible during any combination of horizontal +
        // vertical scroll. `z-index: 3` keeps it above the chart-header
        // (z-index 2) and the sidebar-body (z-index 1) at the corner
        // where they geometrically intersect during a diagonal scroll.
        // Phase 23: sticky-top + sticky-left positioning removed —
        // sidebar-header now lives inside `cx-gantt-sidebar-header-
        // pane` (overflow: hidden) in the grid row above the
        // sidebar-pane. Background + border-bottom stay so the
        // visual chrome is preserved.
        sidebarHeader = h(
          'div',
          {
            class: 'cx-gantt-sidebar-header',
            style: {
              background: t.sidebarBackground,
              borderBottom: `1px solid ${t.sidebarHeaderDivider}`,
              boxSizing: 'border-box',
            },
          },
          [
            h(
              'table',
              {
                style: { ...tableStyle, height: `${totalHeaderBandHeight}px` },
                cellpadding: 0,
                cellspacing: 0,
              },
              [
                buildColGroup(),
                h('thead', null, [
                  h(
                    'tr',
                    { style: { height: `${totalHeaderBandHeight}px` } },
                    cols.map((col) =>
                      h(
                        'th',
                        {
                          key: col.key,
                          class: 'cx-gantt-sidebar-header-cell',
                          'data-column-key': col.key,
                          style: {
                            padding: '0 8px',
                            fontSize: `${t.sidebarHeaderFontSize}px`,
                            fontWeight: t.sidebarHeaderFontWeight,
                            color: t.sidebarHeaderCellLabel,
                            borderRight: `1px solid ${t.sidebarHeaderCellBorder}`,
                            textAlign: 'center',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                          },
                        },
                        col.label,
                      ),
                    ),
                  ),
                ]),
              ],
            ),
          ],
        );

        // Body rows: one `<tr>` per swimlane strip. Each row's height
        // bakes in `rowSpacing` (except the last) so the total table
        // height equals the body's content height — a rowspan=N cell
        // then spans exactly the same y-range as the corresponding N
        // body strips + the (N-1) gaps between them.
        // sidebar-body pins to the left so it stays visible during
        // horizontal scroll; vertical scroll moves it together with the
        // body SVG (both share the wrapper's vertical scroll). `z-index: 1`
        // keeps it above the chart-body during paint without competing
        // with the headers.
        const rowsById = new Map(props.rows.map((r) => [r.id, r]));
        const rowsForSpans = strips.value
          .map((strip) => rowsById.get(strip.rowId))
          .filter((r): r is RowSpec => r !== undefined);
        const spansMatrix = computeRowSpans(rowsForSpans, cols);
        // Phase 23: sticky-left positioning removed — sidebar-body
        // now lives inside `cx-gantt-sidebar-pane` (overflow: auto)
        // whose own scroll container manages horizontal scroll
        // independently of the chart-pane. Background stays for
        // visual chrome.
        sidebarBody = h(
          'div',
          {
            class: 'cx-gantt-sidebar-body',
            style: {
              background: t.sidebarBackground,
            },
          },
          [
            h('table', { style: tableStyle, cellpadding: 0, cellspacing: 0 }, [
              buildColGroup(),
              h(
                'tbody',
                null,
                strips.value.map((strip, rowIdx) => {
                  const row = rowsById.get(strip.rowId);
                  const isLast = rowIdx === strips.value.length - 1;
                  const trHeight = strip.height + (isLast ? 0 : props.rowSpacing);
                  const cells = cols.flatMap((col, colIdx) => {
                    const span = spansMatrix[colIdx]?.[rowIdx] ?? 1;
                    // Absorbed cells emit nothing — the earlier row's
                    // rowspan covers this column-row position.
                    if (span === 0) return [];
                    const value = row?.columns[col.key];
                    const isMerged = span > 1;
                    return [
                      h(
                        'td',
                        {
                          key: col.key,
                          class: 'cx-gantt-sidebar-cell',
                          'data-row-id': strip.rowId,
                          'data-column-key': col.key,
                          ...(isMerged ? { rowspan: span } : {}),
                          style: {
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
                          },
                        },
                        value === undefined ? '' : String(value),
                      ),
                    ];
                  });
                  return h(
                    'tr',
                    {
                      key: strip.rowId,
                      class: 'cx-gantt-sidebar-row',
                      'data-row-id': strip.rowId,
                      style: { height: `${trHeight}px` },
                    },
                    cells,
                  );
                }),
              ),
            ]),
          ],
        );
      }

      // Wrapper geometry depends on whether the sidebar is rendered.
      // Without a sidebar: a block div with one child column (header +
      // body stacked) — same as Phase 4.5. With a sidebar: a 2×3 CSS
      // grid (sidebar | divider | chart) so the user can grab the
      // boundary between sidebar and chart and drag it to resize. The
      // divider track is a fixed SIDEBAR_DIVIDER_WIDTH px column that
      // spans both header + body rows; the right column track is
      // `auto` (NOT `1fr`) so the grid's intrinsic width = sidebar +
      // divider + max(content), preserving the existing
      // overflow-driven horizontal scroll behavior.
      // Phase 23: divider grid placement unchanged (column 2, spanning
      // both header + body rows) but sticky-left removed — under
      // dual-scrollport, the divider sits naturally between the
      // sidebar-pane and chart-pane grid tracks and stays visible
      // automatically.
      if (hasSidebar) {
        divider = h('div', {
          ref: dividerRef,
          class: 'cx-gantt-sidebar-divider',
          'data-cx-divider': 'sidebar',
          style: {
            gridColumn: '2',
            gridRow: '1 / 3',
            cursor: 'col-resize',
            // Divider sits above the panes so the cursor change wins
            // over the sidebar / chart background hover styling.
            zIndex: 4,
            background: 'transparent',
            userSelect: 'none',
            touchAction: 'none',
          },
          onPointerdown: onDividerPointerdown,
          onPointermove: onDividerPointermove,
          onPointerup: onDividerPointerup,
          onPointercancel: onDividerPointercancel,
        });
      }
      // Phase 23: dual-scrollport wrapper. The wrapper itself NO
      // longer has `overflow: auto` — each pane owns its scroll. The
      // grid template defines the header band height (row 1) +
      // `maxBodyHeight` (row 2; defaults to `auto` = grow to content,
      // no scroll engages). When `maxBodyHeight` is set, both panes
      // in row 2 (sidebar-pane + chart-pane) get the same cap, and
      // their vertical scrollTops sync via `useScrollSync`.
      const wrapperStyle: Record<string, string> = {
        display: 'grid',
        gridTemplateColumns: hasSidebar
          ? `${sidebarWidth}px ${SIDEBAR_DIVIDER_WIDTH}px auto`
          : 'auto',
        gridTemplateRows: `${totalHeaderBandHeight}px ${props.maxBodyHeight ?? 'auto'}`,
      };

      // Phase 23: per-pane wrappers. Each pane is a grid cell with
      // its own `overflow` behavior:
      //   - sidebar-header-pane + chart-header-pane: overflow: hidden
      //     (the inner wrapper takes a `translateX` to track its body
      //     pane's horizontal scroll without showing a scrollbar)
      //   - sidebar-pane + chart-pane: overflow: auto (the actual
      //     scroll containers; user-visible scrollbars when content
      //     exceeds the pane size)
      const chartHeaderPane = h(
        'div',
        {
          class: 'cx-gantt-chart-header-pane',
          style: {
            overflow: 'hidden',
            gridColumn: hasSidebar ? '3' : '1',
            gridRow: '1',
          },
        },
        [
          h(
            'div',
            {
              ref: chartHeaderInnerRef,
              class: 'cx-gantt-chart-header-inner',
              style: { willChange: 'transform' },
            },
            [headerSvg],
          ),
        ],
      );

      const chartPane = h(
        'div',
        {
          ref: chartPaneRef,
          class: 'cx-gantt-chart-pane',
          style: {
            overflow: 'auto',
            gridColumn: hasSidebar ? '3' : '1',
            gridRow: '2',
          },
        },
        [bodySvg],
      );

      let sidebarHeaderPane: ReturnType<typeof h> | null = null;
      let sidebarPane: ReturnType<typeof h> | null = null;
      if (hasSidebar) {
        sidebarHeaderPane = h(
          'div',
          {
            class: 'cx-gantt-sidebar-header-pane',
            style: {
              overflow: 'hidden',
              gridColumn: '1',
              gridRow: '1',
            },
          },
          [
            h(
              'div',
              {
                ref: sidebarHeaderInnerRef,
                class: 'cx-gantt-sidebar-header-inner',
                style: { willChange: 'transform' },
              },
              [sidebarHeader],
            ),
          ],
        );
        sidebarPane = h(
          'div',
          {
            ref: sidebarPaneRef,
            class: 'cx-gantt-sidebar-pane',
            style: {
              overflow: 'auto',
              gridColumn: '1',
              gridRow: '2',
            },
          },
          [sidebarBody],
        );
      }

      const chartWrapper = h(
        'div',
        {
          ref: wrapperRef,
          class: 'cx-gantt-wrapper',
          'data-axis-view': a.viewId,
          style: wrapperStyle,
        },
        hasSidebar
          ? [sidebarHeaderPane!, chartHeaderPane, sidebarPane!, chartPane, divider]
          : [chartHeaderPane, chartPane],
      );

      // Phase 22: when `headerToolbar` is configured, prepend the
      // toolbar above the chart wrapper inside a parent root. When
      // disabled (default), return the chart wrapper directly — keeps
      // existing consumers' DOM-shape stable.
      const tm = toolbarModel.value;
      if (!tm) return chartWrapper;
      return h('div', { class: 'cx-gantt-root' }, [
        renderToolbar(tm, toolbarTitleText.value, t, onToolbarWidgetClick),
        chartWrapper,
      ]);
    };
  },
});

/** Inline SVG icon for `prev` / `next` toolbar nav buttons. Matches
 * the original `Toolbar.tsx` polyline shape so visual parity holds. */
function renderToolbarIcon(kind: 'prev' | 'next'): VNode {
  const points = kind === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6';
  return h(
    'svg',
    {
      viewBox: '0 0 24 24',
      width: 14,
      height: 14,
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'aria-hidden': 'true',
    },
    [h('polyline', { points })],
  );
}

function renderToolbarButton(
  widget: ToolbarWidget,
  themeTokens: ChronixTheme,
  onClick: (widget: ToolbarWidget) => void,
): VNode {
  const style: Record<string, string> = {
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
  return h(
    'button',
    {
      type: 'button',
      class: `cx-gantt-${widget.buttonName}-button`,
      'data-button-name': widget.buttonName,
      'data-button-kind': widget.kind,
      'aria-pressed': widget.isPressed ? 'true' : 'false',
      style,
      onClick: () => onClick(widget),
    },
    widget.iconSvg ? [renderToolbarIcon(widget.iconSvg)] : widget.labelText,
  );
}

function renderToolbarWidgetGroup(
  group: readonly ToolbarWidget[],
  titleText: string,
  themeTokens: ChronixTheme,
  onClick: (widget: ToolbarWidget) => void,
): VNode | null {
  if (group.length === 0) return null;
  const children: VNode[] = group.map((widget) => {
    if (widget.kind === 'title') {
      return h(
        'h2',
        {
          class: 'cx-gantt-toolbar-title',
          'data-button-name': 'title',
          'data-button-kind': 'title',
          style: {
            margin: '0',
            fontSize: '14px',
            fontWeight: '600',
            color: themeTokens.toolbarTitleColor,
          },
        },
        titleText,
      );
    }
    return renderToolbarButton(widget, themeTokens, onClick);
  });
  if (children.length === 1) return children[0]!;
  return h(
    'div',
    {
      class: 'cx-gantt-button-group',
      style: { display: 'inline-flex', gap: '0', alignItems: 'center' },
    },
    children,
  );
}

function renderToolbarSection(
  section: readonly (readonly ToolbarWidget[])[],
  titleText: string,
  themeTokens: ChronixTheme,
  onClick: (widget: ToolbarWidget) => void,
): VNode {
  const groups = section
    .map((g) => renderToolbarWidgetGroup(g, titleText, themeTokens, onClick))
    .filter((node): node is VNode => node !== null);
  return h(
    'div',
    {
      class: 'cx-gantt-toolbar-chunk',
      style: { display: 'inline-flex', gap: '8px', alignItems: 'center' },
    },
    groups,
  );
}

/**
 * Render the Phase 22 toolbar above the chart. Three sections
 * (`start`, `center`, `end`); chronix `cx-*` class names so the
 * parity extractor can pair them with the original DOM. Click
 * delegates back to `onClick` — `setup()` translates each widget to
 * an `update:axisInput` emit via `prev/next/today/changeView` math.
 */
function renderToolbar(
  model: ToolbarModel,
  titleText: string,
  themeTokens: ChronixTheme,
  onClick: (widget: ToolbarWidget) => void,
): VNode {
  return h(
    'div',
    {
      class: 'cx-gantt-toolbar',
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 12px',
        background: themeTokens.toolbarBg,
        borderBottom: `1px solid ${themeTokens.toolbarButtonBorder}`,
      },
    },
    [
      renderToolbarSection(model.sectionWidgets.start, titleText, themeTokens, onClick),
      renderToolbarSection(model.sectionWidgets.center, titleText, themeTokens, onClick),
      renderToolbarSection(model.sectionWidgets.end, titleText, themeTokens, onClick),
    ],
  );
}

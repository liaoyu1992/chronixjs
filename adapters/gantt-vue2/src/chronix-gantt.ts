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
  type AxisHeaderCell,
  type AxisRangePlanInput,
  type AxisTick,
  type BarClassNamesFunc,
  type BarColorFunc,
  type BarFontSizeFunc,
  type BarFontWeightFunc,
  type BarSlotArgs,
  type BarSpec,
  type BarTable,
  type CellStateMeta,
  type ChronixTheme,
  type ColumnSpec,
  type CustomLinkMarker,
  type EventAllowFunc,
  type EventConstraint,
  type EventOverlapFunc,
  type GanttEventMap,
  type GanttHandle,
  type HeaderCellArg,
  type HeaderCellClassNamesFunc,
  type HeaderCellSlotArgs,
  type IncrementDelta,
  type LinkMarker,
  type LinkRenderArg,
  type LinkRenderFunc,
  type LinkSlotArgs,
  type LinkSpec,
  type LinkTable,
  type PlacedBar,
  type ResolvedBarStyle,
  type RoutedLink,
  type RowDataSource,
  type RowSpec,
  type SelectAllowFunc,
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
import { useGanttPointer } from './use-gantt-pointer.js';
import { useScrollSync } from './use-scroll-sync.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Phase 31.4 (Phase 27 in chronix-vue3): continuation triangle geometry.
 * `TRIANGLE_SIZE` is the half-base, so total base height is 12 px and
 * apex-to-base distance is 6 px. `TRIANGLE_MARGIN` insets the apex from
 * the bar's edge so the indicator sits inside the bar body rather than
 * flush with the edge. Match the original spec geometry verbatim for
 * visual parity.
 */
const TRIANGLE_SIZE = 6;
const TRIANGLE_MARGIN = 1;

/**
 * Phase 31.4 (Phase 28.2 in chronix-vue3): bar title text positioning.
 * Default left padding pushes the title 8 px right of the bar's left
 * edge; default right padding leaves 4 px clear on the trailing edge.
 * When an axis-clipped continuation triangle is present on a side, the
 * title shifts inward by `TRIANGLE_MARGIN + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP
 * = 11 px` to clear it. All three numbers ported verbatim from the
 * chronix-vue3 adapter (which itself ports verbatim from the parity
 * reference).
 *
 * Phase 31.5.2.1: title positioning consumes `deriveEdgePaddedX` so the
 * Phase 27.1 viewport-clipped sub-case (title-start locks past the
 * viewport-edge triangle's base when the bar is scrolled offscreen)
 * fires alongside the default + axis-clipped branches. Phase 31.4's
 * inline ternary (`bar.isStart ? TITLE_LEFT_PADDING : ...`) is replaced
 * by the 8-arg helper call at the title-render site.
 */
const TITLE_LEFT_PADDING = 8;
const TITLE_RIGHT_PADDING = 4;
const TITLE_TRIANGLE_GAP = 4;

/**
 * Phase 31.5.2.1 (Phase 28.2.1 in chronix-vue3): progress-dot edge inset
 * + triangle-clearance gap. `DOT_EDGE_INSET = 1` matches the parity
 * reference's 1-px inset from the bar's geometric edge. `DOT_TRIANGLE_GAP
 * = 2` is the dot's clearance past a continuation triangle's base — 2 px
 * tighter than the title's 4-px `TITLE_TRIANGLE_GAP` because the dot is
 * a 1-px-inset rect not 8-px-inset text. Both constants are consumed by
 * the dot-render site's `deriveEdgePaddedX` call (the helper's per-call
 * `defaultInset` + `consumerGap` args).
 */
const DOT_EDGE_INSET = 1;
const DOT_TRIANGLE_GAP = 2;

/**
 * Phase 31.4.1 (Phase 28.3 in chronix-vue3): encode a color string into the
 * suffix used in marker ids. Strips non-alphanumeric so `'#3788d8'` →
 * `'3788d8'`, `'rgb(255, 0, 0)'` → `'rgb25500'`. Matches chronix-vue3's
 * encoding so a future shared core marker helper can swap in without
 * breaking selectors keyed on the id format.
 */
function markerColorId(color: string): string {
  return color.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Phase 31.4.1 (Phase 28.3 in chronix-vue3): the 7 built-in marker shapes.
 * Excludes `'none'` (which suppresses the marker-end attribute entirely
 * rather than emitting a def). Ordering matches chronix-vue3 verbatim so
 * the defs aggregator emits markers in identical order.
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
 * Phase 31.4.1: render one built-in `<marker>` def. Geometry ports verbatim
 * from chronix-vue3 (which itself ports verbatim from the original spec);
 * width / height fixed at 4.5; `markerUnits="strokeWidth"` scales with
 * stroke; `overflow="visible"` keeps the shape from being clipped at its
 * bounding box.
 *
 * Vue 2 data shape: every SVG attribute key wraps in an `attrs: {...}`
 * object so it lands on the actual DOM element rather than being parsed
 * as a Vue component prop. Differs from chronix-vue3's flat `h(tag, {key,
 * ...attrs}, children)` data shape. The Vue 2 vs Vue 3 difference is the
 * reason Phase 31.4.1 Decision A.1 keeps marker helpers per-adapter local
 * rather than relocating them to core today.
 */
function renderBuiltinMarker(type: BuiltinMarkerType, color: string, colorId: string): VNode {
  const id = `cx-marker-${type}-${colorId}`;
  const baseAttrs = {
    id,
    markerWidth: 4.5,
    markerHeight: 4.5,
    markerUnits: 'strokeWidth',
    overflow: 'visible',
  };
  switch (type) {
    case 'arrow':
      return h(
        'marker',
        { key: id, attrs: { ...baseAttrs, refX: 4, refY: 2.25, orient: 'auto' } },
        [h('polygon', { attrs: { points: '0 0, 4.5 2.25, 0 4.5', fill: color } })],
      );
    case 'diamond':
      return h(
        'marker',
        { key: id, attrs: { ...baseAttrs, refX: 4.5, refY: 2.5, orient: 'auto' } },
        [h('polygon', { attrs: { points: '0 2.5, 2.5 0, 5 2.5, 2.5 5', fill: color } })],
      );
    case 'diamond-hollow':
      return h(
        'marker',
        { key: id, attrs: { ...baseAttrs, refX: 4.5, refY: 2.5, orient: 'auto' } },
        [
          h('polygon', {
            attrs: {
              points: '0 2.5, 2.5 0, 5 2.5, 2.5 5',
              fill: 'white',
              stroke: color,
              'stroke-width': 1.0,
            },
          }),
        ],
      );
    case 'circle':
      return h('marker', { key: id, attrs: { ...baseAttrs, refX: 5, refY: 3 } }, [
        h('circle', { attrs: { cx: 3, cy: 3, r: 2.0, fill: color } }),
      ]);
    case 'circle-hollow':
      return h('marker', { key: id, attrs: { ...baseAttrs, refX: 5.75, refY: 3 } }, [
        h('circle', {
          attrs: { cx: 3, cy: 3, r: 2.0, fill: 'white', stroke: color, 'stroke-width': 1.5 },
        }),
      ]);
    case 'pointer':
      return h('marker', { key: id, attrs: { ...baseAttrs, refX: 5, refY: 2.5, orient: 'auto' } }, [
        h('polygon', { attrs: { points: '0 0, 6 2.5, 0 5, 1.5 2.5', fill: color } }),
      ]);
    case 'plus':
      return h('marker', { key: id, attrs: { ...baseAttrs, refX: 4, refY: 2.5, orient: 'auto' } }, [
        h('path', {
          attrs: {
            d: 'M 2.5 0.5 L 2.5 2 L 4 2 L 4 3 L 2.5 3 L 2.5 4.5 L 1.5 4.5 L 1.5 3 L 0 3 L 0 2 L 1.5 2 L 1.5 0.5 Z',
            fill: color,
          },
        }),
      ]);
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown built-in marker type: ${String(_exhaustive)}`);
    }
  }
}

/**
 * Phase 31.4.1: render a user-defined `<marker>` def. The custom marker is
 * positioned at its viewBox origin and emits one child per `paths` entry.
 * v0 uses the same `refX=4`, `refY=2.25`, `orient='auto'` as the built-in
 * arrow — consumers who need a different refX can wrap the custom marker's
 * paths to embed offsets. Marker id matches the built-in scheme so
 * `marker-end` URL resolution is uniform.
 */
function renderCustomMarker(marker: CustomLinkMarker, color: string, colorId: string): VNode {
  const id = `cx-marker-${marker.id}-${colorId}`;
  const baseAttrs = {
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
    { key: id, attrs: baseAttrs },
    marker.paths.map((p, i) =>
      h('path', {
        key: `${id}-p${i}`,
        attrs: {
          d: p.d,
          fill: p.fill ?? color,
          stroke: p.stroke ?? 'none',
          ...(p.strokeWidth !== undefined ? { 'stroke-width': p.strokeWidth } : {}),
        },
      }),
    ),
  );
}

/**
 * Phase 31.4.1: resolve a link's `marker-end` URL for a given color. Returns
 * `null` for `'none'` so the caller omits the `marker-end` attribute entirely
 * (an empty `url(...)` reference would suppress strokes in some browsers).
 */
function markerEndUrl(marker: LinkMarker | CustomLinkMarker, color: string): string | null {
  if (marker === 'none') return null;
  const colorId = markerColorId(color);
  const markerKey = typeof marker === 'string' ? marker : marker.id;
  return `url(#cx-marker-${markerKey}-${colorId})`;
}

/**
 * Phase 31 → 31.4 `<ChronixGantt>` for Vue 2.7+. Pipes (bars, rows,
 * axisInput) through `useGanttLayout` and renders a wrapper `<div>`
 * hosting a header SVG (outer band rows + tick row + axis divider)
 * above a body SVG carrying placed bar `<rect>`s. Phase 31.2 added
 * pointer interaction via `useGanttPointer` wired to body-SVG pointer
 * events with native `setPointerCapture` lifecycle. Phase 31.2.1
 * exposes the Phase 19 validator gate props (`eventAllow`,
 * `selectAllow`, `eventOverlap`, `eventConstraint`) + the 3 rejection
 * emits (`bar-drop-rejected`, `bar-resize-rejected`, `select-rejected`).
 * Consumers without validators still get pre-Phase-19 behavior (every
 * drag / resize / select commits unconditionally).
 *
 * Phase 31.3 adds three customization-surface props:
 *
 * 1. `theme: Partial<ChronixTheme>` — merged over `defaultChronixTheme`
 *    at render time. All inline chrome colors / strokes / font-sizes
 *    + the default bar `<rect>` fill/stroke flow from the merged
 *    result. Phase 20 bar-color cascade (per-prop / per-spec /
 *    callback) defers to Phase 31.4.
 * 2. `slotRegistry: SlotRegistry` — consulted at two render sites:
 *    `BAR_SLOT_NAME` (per placed bar) + `HEADER_CELL_SLOT_NAME` (per
 *    band cell + per tick label). When a template is registered, it
 *    replaces the default render entirely. `LINK_SLOT_NAME` defers to
 *    Phase 31.4 alongside the link `<path>` render.
 * 3. `selectedBarIds: readonly string[]` — controlled selection state.
 *    Drives `.cx-gantt-bar--selected` class on the default bar render,
 *    a separate selection-border `<rect>` overlay using
 *    `theme.barSelectedBorderColor` + `barSelectedBorderWidth`, and
 *    the `BarSlotArgs.isSelected` flag for custom slot renderers. Also
 *    gates the 2 white dot resize handles (along with `editable`).
 *
 * The body SVG also gains 2 transparent edge-resize zones per bar when
 * `editable` is true — cursor cue (`ew-resize`) that visually matches
 * the geometric edge-zone width used by `useGanttPointer`'s hit-test.
 * Both visual cue + hit-test geometry are threaded through the single
 * `theme.barResizerThickness` token.
 *
 * Phase 31.4 lights up three bar-bound surfaces sharing the
 * `BarSlotArgs.resolved*` cascade through-line:
 *
 * (a) Phase 20 bar-color cascade — 10 props (`barColor` umbrella +
 *     `bar{Background,Border,Text}Color` specifics + 3 color callbacks +
 *     2 font callbacks + 1 class-names callback). Per placed bar, the
 *     render loop calls `resolveBarStyle({...})` with the theme floor +
 *     each override layer's value; the resolved `{ backgroundColor,
 *     borderColor, textColor, fontSize, fontWeight, classNames }` feeds
 *     the default `<rect>` fill/stroke + the slot args + the bar text.
 * (b) Bar text auto-render — one `<text class="cx-gantt-bar-text">` per
 *     bar with a non-empty `BarSpec.title`, positioned inside the bar
 *     body (8 px left padding by default; 11 px when an axis-clipped
 *     continuation triangle is present on that side), truncated to fit
 *     via `truncateBarText` (char-count + ellipsis using `0.6 × fontSize`
 *     avg glyph width). Gates: outer (`bar.width > 30`) + inner
 *     (`availableWidth >= 10`) + axis-overlap. Consumes
 *     `resolvedStyle.{textColor,fontSize,fontWeight}` from the cascade.
 * (c) Continuation triangles — axis-clipped sub-case (Phase 27). Per
 *     bar, emit a left-pointing `<polygon class="cx-gantt-bar-continuation
 *     -left">` when `!bar.isStart` (bar's range starts before the axis
 *     range) and a symmetric right-pointing one when `!bar.isEnd`.
 *     Fixed `fill: '#000' opacity: 0.8` translucent black indicator,
 *     `pointer-events: 'none'`. `data-axis-clipped="true"` records the
 *     Phase 27 sub-case; `data-viewport-clipped="true"` records the
 *     Phase 27.1 sub-case (apex locks to visible viewport edge in
 *     content-coords via `deriveViewportClipping(bar.x, bar.width,
 *     chartScroll.scrollLeft, chartScroll.clientWidth, TRIANGLE_MARGIN)`).
 *     Both attributes are independent booleans on the same polygon — a
 *     bar in a narrow viewport may be axis-clipped AND viewport-clipped
 *     on the same side.
 *
 * Render-function shape uses Vue 2's `h(tag, data, children)` signature
 * where `data = { class, attrs, on, props, key, ref, style, ... }`.
 * Differs from Vue 3's flat `{ class, ...attrs, ...events }` data shape.
 */
export const ChronixGantt = defineComponent({
  name: 'ChronixGantt',
  props: {
    bars: { type: Array as PropType<readonly BarSpec[]>, required: true },
    rows: { type: Array as PropType<readonly RowSpec[]>, required: true },
    axisInput: { type: Object as PropType<AxisRangePlanInput>, required: true },
    // Phase 52 — geometry prop surface alignment with chronix-vue3.
    // 4 props threaded through to `useGanttLayout`; defaults match
    // both chronix-vue3 + the core layout pass defaults.
    /** Fixed bar height in pixels. Default 30 matching the original spec. */
    barHeight: { type: Number, default: 30 },
    /** Top padding between strip top and bar top. Default 4 (matches `firstBarTopPadding` core default for symmetric 4+4 padding). */
    barVerticalPadding: { type: Number, default: 4 },
    /** Inter-row gap in pixels (CSS row-divider border). Default 1. */
    rowSpacing: { type: Number, default: 1 },
    /** Default row height for rows whose computed height-hint is undefined. Default 38. */
    defaultRowHeight: { type: Number, default: 38 },
    /**
     * Phase 49 — sidebar resource-panel columns. When non-empty the
     * wrapper switches from the single-column (chart-only) layout to a
     * 2-column grid (`{sidebarWidth}px auto`) and renders
     * `cx-gantt-sidebar-header-pane` + `cx-gantt-sidebar-pane` carrying
     * a `<colgroup>`-driven `<table>` with per-cell `rowspan` (vGrouping
     * for columns flagged `group: true`). Empty / omitted preserves the
     * pre-Phase-49 2-pane DOM. Mirrors chronix-vue3:425-431.
     */
    columns: {
      type: Array as PropType<readonly ColumnSpec[]>,
      default: () => [] as readonly ColumnSpec[],
    },
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
     * it. 0 hides every header row.
     */
    headerRowHeight: { type: Number, default: 20 },
    /**
     * Allow bar drag + edge resize + progress-handle drag. Default false
     * — pointer events still register hits but no transaction starts,
     * mirrors chronix-vue3's behavior.
     */
    editable: { type: Boolean, default: false },
    /**
     * Phase 54 — fine-grained drag gate. When `editable` is true, setting
     * this to `false` disables the bar-drag transaction (move event's
     * start time) while keeping edge-resize available. Default `true`.
     */
    eventStartEditable: { type: Boolean, default: true },
    /**
     * Phase 54 — fine-grained resize gate. When `editable` is true,
     * setting this to `false` disables the edge-resize transaction
     * (change event's duration) while keeping bar-drag available.
     * Default `true`.
     */
    eventDurationEditable: { type: Boolean, default: true },
    /**
     * Allow calendar range-select on empty rows. Default false — the
     * pointer hit-test still resolves to `kind: 'empty-row'` but no
     * transaction starts when this is off.
     */
    selectable: { type: Boolean, default: false },
    /**
     * Snap drag-time deltas to this multiple in milliseconds. Default
     * 0 = no snap (the commit layer treats 0 as a sentinel for "skip
     * snapping"). Forwarded to `commitBarDrag` / `commitBarResize`
     * from the framework-agnostic core.
     */
    snapDurationMs: { type: Number, default: 0 },
    /**
     * Phase 25 Pythagorean drag-distance gate threshold (in CSS pixels).
     * Below this distance from pointerdown, the pointer-up emits
     * `bar-click` / `empty-area-click` instead of committing the
     * transaction. Default 5; 0 disables.
     */
    pointerMinDistance: { type: Number, default: 5 },
    /**
     * Phase 28.1 progress-handle hit zone size (square footprint). Used
     * when a bar declares both `pointerOverlayId` AND has a progress
     * entry — composable builds a handle rect centered on the
     * progress-x with this width × height. Default 12.
     */
    progressHandleSize: { type: Number, default: 12 },
    /**
     * Phase 19 validation gate. When set, called on bar-drag and
     * bar-resize commit; returning `false` aborts the commit and
     * fires `'bar-drop-rejected'` / `'bar-resize-rejected'` instead
     * of `'bar-drop'` / `'bar-resize'`. The bar visually reverts.
     */
    eventAllow: {
      type: Function as PropType<EventAllowFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 19 validation gate for calendar-range-select commits.
     * Returning `false` aborts the commit; `'select-rejected'` fires.
     */
    selectAllow: {
      type: Function as PropType<SelectAllowFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 19 overlap policy. `true` (default) allows; `false` rejects
     * any cross-row time-intersecting bar; a function `(stillBar,
     * movingBar) => boolean` is called per intersecting cross-row pair.
     * Same-row overlap is always permitted (bar-stack layout pass
     * handles it).
     */
    eventOverlap: {
      type: [Boolean, Function] as PropType<boolean | EventOverlapFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 19 drag / resize destination constraint. Proposed range
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
     * Phase 31.3 theme prop. Merged over `defaultChronixTheme` at
     * render time via spread: `{ ...defaultChronixTheme, ...props.theme }`.
     * Pass a `Partial<ChronixTheme>` — undefined fields fall back to
     * defaults automatically. Reactive: a theme change triggers a
     * re-render with the new tokens applied to every inline color /
     * stroke / font-size attribute + the default bar `<rect>` fill /
     * stroke.
     */
    theme: {
      type: Object as PropType<Partial<ChronixTheme>>,
      default: () => ({}),
    },
    /**
     * Phase 31.3 slot registry. Consulted per render at the bar +
     * header-cell render sites. When `registry.has('bar')` is true,
     * the registered template replaces the default `<rect>` for every
     * placed bar; the template receives a `BarSlotArgs` ctx including
     * live geometry, the effective theme, and the in-flight transaction.
     * Same pattern for `'header-cell'` — applies to both outer band
     * cells AND tick-row labels. When undefined or no matching template
     * is registered, every site falls through to its default render.
     */
    slotRegistry: {
      type: Object as PropType<SlotRegistry | undefined>,
      default: undefined,
    },
    /**
     * Phase 31.3 controlled selection. The bar ids the consumer
     * considers currently selected. The default `<rect>` gets a
     * `.cx-gantt-bar--selected` class for every selected bar, a
     * separate selection-border `<rect>` overlay is rendered using
     * `theme.barSelectedBorderColor` + `barSelectedBorderWidth`, and
     * the `BarSlotArgs.isSelected` flag passes through to custom slot
     * renderers. The adapter never mutates this prop — listen for
     * `'bar-click'` / `'empty-area-click'` and update the array
     * original (manually or via `useGanttSelection()` helper).
     */
    selectedBarIds: {
      type: Array as PropType<readonly string[]>,
      default: () => [] as readonly string[],
    },
    /**
     * Phase 20 (vue2 port at Phase 31.4): umbrella bar color. When
     * set AND the specific `barBackgroundColor` / `barBorderColor`
     * props aren't set, applies to both fill and stroke at the
     * component-prop cascade layer. Specific props win when both are
     * set. Per-bar `BarSpec.style.{background,border}Color` (Layer 3)
     * and per-bar callbacks (Layer 4) still override.
     */
    barColor: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    /**
     * Phase 20: bar fill at the component-prop cascade layer. Overrides
     * `theme.barBackgroundColor` (Layer 1) and `barColor` (umbrella).
     */
    barBackgroundColor: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    /**
     * Phase 20: bar stroke at the component-prop cascade layer.
     * Overrides `theme.barBorderColor` and `barColor`.
     */
    barBorderColor: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    /**
     * Phase 20: bar text color at the component-prop layer. Flows to
     * the auto-rendered `<text class="cx-gantt-bar-text">` (Phase 28.2)
     * and to `BarSlotArgs.resolvedTextColor` for custom slot renderers.
     * Does NOT override `theme.progressLabel` — the progress label keeps
     * its dedicated theme token for legibility on the translucent green
     * overlay.
     */
    barTextColor: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    /**
     * Phase 20: per-bar background callback. Runs at Layer 4, after the
     * theme + component-prop + `BarSpec.style` cascade. Receives a
     * `BarStyleArg` with the cascaded defaults; returning a color string
     * overrides; returning `undefined` defers to the cascaded default.
     */
    barBackgroundColorCallback: {
      type: Function as PropType<BarColorFunc | undefined>,
      default: undefined,
    },
    /** Phase 20: per-bar border callback (same cascade slot). */
    barBorderColorCallback: {
      type: Function as PropType<BarColorFunc | undefined>,
      default: undefined,
    },
    /** Phase 20: per-bar text-color callback (same cascade slot). */
    barTextColorCallback: {
      type: Function as PropType<BarColorFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 28.2: per-bar font-size callback. Same `BarStyleArg` cascade
     * slot as the 3 color callbacks. Receives the theme default via
     * `arg.defaultFontSize`; returning a number overrides; returning
     * `undefined` defers to `theme.barFontSize`. No per-prop / per-spec
     * font layers in v0 — only theme floor and callback override.
     */
    barFontSizeCallback: {
      type: Function as PropType<BarFontSizeFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 28.2: per-bar font-weight callback. Same cascade as
     * `barFontSizeCallback`. Numeric (400 / 600 / 700) OR CSS keyword
     * string (`'normal'` / `'bold'`) both accepted; the adapter casts
     * the resolved value to a string at the `<text font-weight=...>`
     * attribute.
     */
    barFontWeightCallback: {
      type: Function as PropType<BarFontWeightFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 28.3: per-bar CSS class-names callback. Receives the same
     * `BarStyleArg` the color / font callbacks do; returns a class
     * string, an array of class strings, or `undefined`. Returned
     * classes append to the bar's main `<rect class="cx-gantt-bar">` —
     * they do NOT propagate to the per-bar selection-border / resize-
     * zone / dot rects (each carries its own stable `cx-gantt-bar-*`
     * modifier class). Consumers use these for semantic state (priority,
     * overdue, warning, etc.) styled via consumer CSS.
     */
    barClassNamesCallback: {
      type: Function as PropType<BarClassNamesFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 31.4.1 (Phase 7+28.3 in chronix-vue3): chart-level dependency
     * list. Each `LinkSpec` declares a `fromBarId` → `toBarId` directed
     * edge plus a routing variant (`'square'` 3-segment elbow vs
     * `'smooth'` cubic-Bézier forward-only) + a marker-end shape +
     * optional per-link `colorOverride`. Routed through
     * `defaultLinkRouter` reactively on every change to this array or
     * to `placedBars`. Links referencing a bar id not in `placedBars`
     * emit `'link-orphan'` once + log `console.warn` once per id.
     */
    links: {
      type: Array as PropType<readonly LinkSpec[]>,
      default: () => [] as readonly LinkSpec[],
    },
    /**
     * Phase 31.4.1 (Phase 28.3): per-link render-time callback. Runs
     * AFTER the cascade resolution (`LinkSpec.colorOverride` →
     * `useLineEventColor` source-bar color → `theme.linkDefaultColor`)
     * with a `LinkRenderArg` carrying the resolved defaults + the
     * routed geometry + the resolved endpoints. Returns
     * `{ color?, marker? }` to override either channel; `undefined`
     * (or omitting either field) accepts the cascaded default. The
     * `<defs>` aggregator uses POST-callback resolved colors so the
     * `marker-end="url(...)"` URL reference stays valid for the
     * override. Routing-type mutation NOT supported (would require
     * re-running `LinkRouter`); use `LinkSpec.routing` for that.
     */
    onLineCallback: {
      type: Function as PropType<LinkRenderFunc | undefined>,
      default: undefined,
    },
    /**
     * Phase 31.4.1 (Phase 28.3): when `true`, each routed link's stroke
     * inherits the source bar's resolved background color (the Phase 20
     * cascade output captured in the render-local `barColorByBarId` map).
     * `LinkSpec.colorOverride` still wins when present;
     * `onLineCallback`'s `color` return still wins over both. Defaults
     * `false` so existing consumers see no visual change.
     */
    useLineEventColor: { type: Boolean, default: false },
    /**
     * Phase 31.4.2 (Phase 21 in chronix-vue3): today-line config. `false`
     * or omitted = hide (default); `true` = enable with all defaults (red
     * `theme.todayLineColor`, 2 px, dashed, `'今日'` tooltip); an object
     * literal overrides per-field. See `TodayLineOption` for the
     * resolution cascade with theme tokens (`config.color` overrides BOTH
     * stroke + tooltip-bg when set — single-knob; otherwise
     * `theme.todayLineColor` drives stroke + `theme.todayLineTooltipBg`
     * drives tooltip-bg independently).
     */
    /**
     * Phase 31.x (Phase 22.2 in chronix-vue3): today-cell background tint.
     * `false` (default) hides the tint; `true` enables with theme default
     * color (`theme.todayCellBgColor`); an object `{ color: '#abc' }` for
     * per-mount override.
     *
     * Renders a `<rect class="cx-gantt-today-cell">` in body + header SVGs
     * spanning today's one-day slot. Pixel-aligned with the bars (reuses
     * the same `(t - axisStart) × pxPerMs` math). Behind the bars + tick
     * labels so they remain readable on top.
     */
    todayCellBg: {
      type: [Boolean, Object] as PropType<TodayCellBgOption | boolean>,
      default: false,
    },
    /**
     * Phase 31.x (Phase 29 in chronix-vue3): per-header-cell class-names
     * callback. Fires once per outer-band cell (e.g. month-name cell in
     * month/season/halfYear/year view) and once per tick-row label.
     * Returned classes append to the cell's primary `<rect>` (outer band)
     * or `<text>` (tick row label) class attribute. `bandIndex === 0` is
     * the tick row; `bandIndex >= 1` indexes into `axis.headerRows[]`
     * (1 = innermost outer band).
     *
     * Returns `string` (single class), `readonly string[]` (multiple),
     * or `undefined` (no extras).
     */
    headerCellClassNamesCallback: {
      type: Function as PropType<HeaderCellClassNamesFunc | undefined>,
      default: undefined,
    },
    todayLine: {
      type: [Boolean, Object] as PropType<TodayLineOption | boolean>,
      default: false,
    },
    /**
     * Phase 31.5.1 (Phase 22 in chronix-vue3): declarative header
     * toolbar above the chart. `ToolbarInput` is a 3-section string
     * DSL — `{ left: 'prev,next today', center: 'title', right: 'day,week,month' }`
     * — describing nav / title / view widgets. `false` (default) hides
     * the toolbar entirely; existing consumers' DOM stays pixel-identical.
     *
     * Widget grammar:
     *  - Sections are space-separated **widget groups**; each group is
     *    comma-separated **widgets** rendered inside a `cx-gantt-button-group`.
     *  - `'title'` renders the current axis-range title formatted via
     *    `formatToolbarTitle` (locale-fixed Chinese calendar v0).
     *  - A `ViewId` (`'day'` / `'week'` / `'month'` / `'season'` /
     *    `'halfYear'` / `'year'`) emits `update:axisInput` with the
     *    matching `viewId` swapped in; the active view's button is
     *    marked `aria-pressed="true"`.
     *  - `'prev'` / `'next'` / `'today'` advance / retreat / reset the
     *    `anchorDate` via the Phase 31.5 handle methods (so
     *    `handle.subscribe('update:axisInput', ...)` listeners fire too).
     *
     * `left` / `right` map to `start` / `end` (LTR-locked v0). When
     * the prop is configured, the chart wrapper is wrapped in a
     * `cx-gantt-root` parent so toolbar + chart sit as siblings;
     * default-path consumers (no toolbar) see `cx-gantt-wrapper` as
     * the immediate render root just like pre-31.5.1.
     *
     * Wire `v-model:axis-input` (or `:axis-input` + `@update:axis-input`)
     * to pick up nav / view-change emits — this is a controlled prop.
     */
    headerToolbar: {
      type: [Object, Boolean] as PropType<ToolbarInput | false>,
      default: false as const,
    },
    /**
     * Phase 31.5.2 (Phase 23 in chronix-vue3): maximum visible height
     * for the chart body pane. When set (e.g. `'400px'` / `'70vh'`),
     * the chart-pane grid cell gets this as its `grid-row` height +
     * `overflow: auto` engages a vertical scrollbar when content
     * exceeds the cap. When omitted (default `undefined`), the row
     * defaults to CSS `auto` — the pane grows to content height + no
     * scrollbar engages, preserving pre-31.5.2 consumers' visual
     * baseline pixel-identically.
     *
     * Horizontal scroll always engages when the chart content width
     * (`axis.totalWidth`) exceeds the pane's container width, regardless
     * of `maxBodyHeight`. The header pane (`cx-gantt-chart-header-pane`)
     * has `overflow: hidden` + its inner wrapper takes a
     * `transform: translateX(-${scrollLeft}px)` so the header tracks
     * horizontal body-pane scroll without showing a duplicate scrollbar.
     */
    maxBodyHeight: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
  },
  emits: [
    'bar-drop',
    'bar-resize',
    'select',
    'bar-progress',
    'bar-click',
    'empty-area-click',
    // Phase 54 — bar hover events (delegated handlers below).
    'bar-mouseenter',
    'bar-mouseleave',
    'bar-dragstart',
    'bar-dragstop',
    'bar-resizestart',
    'bar-resizestop',
    'bar-drop-rejected',
    'bar-resize-rejected',
    'select-rejected',
    'link-orphan',
    'update:axisInput',
  ],
  setup(props, ctx) {
    // Vue 2.7 setup context. We destructure `emit` but call `expose` via
    // `ctx.expose(...)` at the bottom of setup to avoid the
    // @typescript-eslint/unbound-method false-positive that fires on
    // destructured Vue setup-context methods (Vue's setup context is
    // designed to be destructured; the rule's unintended-`this` warning
    // doesn't apply here).
    const { emit } = ctx;
    const { axis, strips, placedBars, contentSize } = useGanttLayout({
      bars: () => props.bars,
      rows: () => props.rows,
      axisInput: () => props.axisInput,
      // Phase 52 — geometry prop surface alignment with chronix-vue3.
      barHeight: () => props.barHeight,
      barVerticalPadding: () => props.barVerticalPadding,
      rowSpacing: () => props.rowSpacing,
      defaultRowHeight: () => props.defaultRowHeight,
    });

    // Phase 31.5: subscribe-listener registry. Every adapter `emit(name,
    // payload)` also notifies any handle.subscribe() listeners registered
    // for the same event. Map<EventName, Set<Listener>> — listeners are
    // removed via the returned unsubscribe function. Ported verbatim from
    // chronix-vue3:880-897.
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

    // Reactive computed maps derived from props.bars. These are the
    // composable's commit-time lookups for old-range / old-rowId and
    // for the progress-handle / overlay routing.
    const barRanges = computed(() => {
      const m = new Map<string, TimeRange>();
      for (const b of props.bars) m.set(b.id, b.range);
      return m;
    });
    const barRowIds = computed(() => {
      const m = new Map<string, string>();
      for (const b of props.bars) m.set(b.id, b.rowId);
      return m;
    });
    const overlayIdByBarId = computed(() => {
      const m = new Map<string, string>();
      for (const b of props.bars) {
        if (b.pointerOverlayId !== undefined) m.set(b.id, b.pointerOverlayId);
      }
      return m;
    });
    const barProgressById = computed(() => {
      const m = new Map<string, number>();
      for (const b of props.bars) {
        if (b.progress?.value !== undefined) m.set(b.id, b.progress.value);
      }
      return m;
    });

    // Phase 31.3: effective theme = chronix defaults merged with consumer
    // overrides. Reactive — a `theme` prop change triggers re-render with
    // the new tokens applied across every chrome attribute + the bar
    // default fill / stroke + the selection-border + the resizer-dot stroke.
    const theme = computed<ChronixTheme>(() => ({
      ...defaultChronixTheme,
      ...props.theme,
    }));

    // Phase 31.3: selected-bar lookup for O(1) `isSelected` per render.
    // Derived from the controlled `selectedBarIds` prop; the adapter
    // never mutates the source array.
    const selectedBarSet = computed(() => new Set(props.selectedBarIds));

    // Phase 31.4.1: route dependency links through the layout pass.
    // Re-derives reactively when `links` or `placedBars` change (drag
    // / resize / view-switch). Orphans (a link referencing a bar id
    // not in `placedBars`) drop from the rendered output here — keeps
    // the render function pure. Orphan-id emit + console.warn live
    // in a separate watch below.
    const routerOutput = computed(() =>
      defaultLinkRouter.route({
        links: props.links,
        placedBars: placedBars.value,
      }),
    );

    // Phase 31.4.1: orphan-id observability. `watchEffect` fires once
    // on mount (so consumers see orphans the chart starts with) and
    // again on every re-derivation. `warnedOrphanIds` Set lives across
    // re-derivations — when a link transitions from resolved to orphan
    // (consumer deletes the target bar at runtime), we still emit each
    // time but only warn once per id per component instance to avoid
    // console spam during drag-induced re-derives. Ports chronix-vue3's
    // `watchEffect` pattern verbatim.
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

    // Phase 31.4.2: today-line resolved state. Returns `null` when the
    // prop is `false` / omitted, when the axis has 0 ticks (degenerate
    // empty fixture), or when today's x-coordinate falls outside the
    // axis range (anchorDate well before / after today). Otherwise
    // returns the rendered config carrying:
    //   - `x` content-coord computed via `(Date.now() - axisStartMs) * pxPerMs`
    //     where `pxPerMs = a.slotWidth / a.slotDurationMs`, matching
    //     `BarPlacementPass` math so the line aligns pixel-exactly with
    //     bars that start today.
    //   - `color` driving the body + header `<line>` stroke; cascade
    //     `config.color ?? theme.todayLineColor`.
    //   - `tooltipBg` driving the header tooltip `<rect>` background;
    //     cascade `config.color ?? theme.todayLineTooltipBg` — when
    //     `config.color` IS set it overrides BOTH (single-knob parity
    //     reference behavior); otherwise the 2 theme tokens drive
    //     independently.
    //   - `width` stroke width (default 2).
    //   - `dasharray` SVG stroke-dasharray string from `config.style`
    //     mapping: `'solid'` → undefined; `'dashed'` (default) → `'6 4'`;
    //     anything else → `'2 3'` (dotted).
    //   - `tooltip` label text (default `'今日'`). Empty string
    //     suppresses the tooltip widget.
    // `Date.now()` is sampled at render time — no `setInterval` keeps
    // the line live across midnight; consumers needing live "now"
    // updates can trigger a manual re-render via a reactive ref.
    // Ported verbatim from chronix-vue3:1005-1039.
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

    // Phase 31.x (Phase 22.2 in chronix-vue3): today-cell background
    // rectangle geometry. Null when prop is false/undefined or axis is
    // empty or today falls fully outside `[0, totalWidth]`. When today
    // partially overlaps the axis, clipped to the visible range so the
    // rect never paints negative x or extends past `totalWidth`. Color
    // cascade: `config.color ?? theme.todayCellBgColor`. Ported verbatim
    // from chronix-vue3:1058-1086.
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

    const pointer = useGanttPointer({
      placedBars,
      strips,
      axis,
      barRanges,
      barRowIds,
      overlayIdByBarId,
      barProgressById,
      editable: () => props.editable,
      // Phase 54 — fine-grained drag/resize gates.
      eventStartEditable: () => props.eventStartEditable,
      eventDurationEditable: () => props.eventDurationEditable,
      selectable: () => props.selectable,
      progressHandleSize: () => props.progressHandleSize,
      snapDurationMs: () => props.snapDurationMs,
      pointerMinDistance: () => props.pointerMinDistance,
      // Phase 31.3: thread the bar-resizer-thickness theme token into
      // the pointer composable's geometric edge-zone hit-test so the
      // visible cursor cue rects (rendered in the bar render block) stay
      // aligned with where edge-resize transactions actually start.
      // Single source of truth — consumers who widen the cue grow both.
      edgeZoneWidth: () => theme.value.barResizerThickness,
      // Phase 19 validation inputs. The `bars` getter activates the
      // validator path inside `useGanttPointer` — when omitted, the
      // composable's `runDropValidation` / `runResizeValidation`
      // short-circuit to null because there's no `movingBar` to find.
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

    // Pointer-event state. The body SVG owns the gesture lifecycle.
    const bodySvgRef = ref<SVGSVGElement | null>(null);
    // Most recent pointer event the body SVG saw — used by lifecycle
    // callback payload enrichment (the composable's lifecycle callbacks
    // don't carry a PointerEvent so the adapter captures one at
    // pointerdown / pointermove time).
    const lastJsEvent = ref<PointerEvent | null>(null);

    function buildDragPayload(
      barId: string,
    ): { barId: string; sourceBar: BarSpec; jsEvent: PointerEvent } | null {
      const sourceBar = props.bars.find((b) => b.id === barId);
      const jsEvent = lastJsEvent.value;
      if (!sourceBar || !jsEvent) return null;
      return { barId, sourceBar, jsEvent };
    }

    function toContentXY(e: PointerEvent): { x: number; y: number } | null {
      const svg = bodySvgRef.value;
      if (!svg) {
        console.warn('[ChronixGantt] toContentXY: bodySvgRef is null');
        return null;
      }
      const rect = svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
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
      // Body-SVG origin lives at content-y 0 (no header in this SVG;
      // the header sits in a separate SVG original).
      if (pos.y < 0) return;
      lastJsEvent.value = e;
      pointer.begin(pos.x, pos.y);
      // If a transaction actually started, capture the pointer so move
      // / up events keep flowing even if the cursor leaves the SVG.
      // Use `hasActiveTransaction()` for synchronous check.
      if (pointer.hasActiveTransaction() && bodySvgRef.value) {
        try {
          bodySvgRef.value.setPointerCapture(e.pointerId);
        } catch (err) {
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
        // Refresh lastJsEvent so the imminent `bar-dragstart` lazy-fire
        // sees the live PointerEvent rather than the stale pointerdown.
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
      for (const bar of props.bars) {
        const sourceProgress = barProgressById.value.get(bar.id);
        const overlayId = overlayIdByBarId.value.get(bar.id);
        if (sourceProgress === undefined || overlayId === undefined) continue;
        const placed = placedBars.value.find((pb) => pb.barId === bar.id);
        if (!placed) continue;
        const handleX = placed.x + (sourceProgress / 100) * placed.width;
        const handleY = placed.y + placed.height;
        // Check if mouse is near the progress position (within threshold)
        // and within vertical range (bar y to bar bottom + triangle size)
        const dx = Math.abs(pos.x - handleX);
        const isInVerticalRange = pos.y >= placed.y && pos.y <= handleY + TRIANGLE_SIZE;
        if (dx <= PROXITY_THRESHOLD && isInVerticalRange) {
          nearHandleIds.add(bar.id);
        }
      }
      hoveredProgressHandleIds.value = nearHandleIds;
    }

    // Phase 54 — bar hover events (delegated). Same shape as vue3.
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
      //    drag/resize/progress/range-select or just a sub-threshold
      //    pointerdown that should be treated as a click. Phase 25's
      //    sub-threshold gate aborts the gesture as a click instead of
      //    committing. Progress-handle stays exempted: reaching the
      //    handle hit zone IS the intent.
      // 2. After the transaction lifecycle resolves, check
      //    `wasDragCommit` + the preserved `lastHit` to fire
      //    `bar-click` / `empty-area-click`.
      const txn = pointer.activeTransaction.value;
      const hit = pointer.lastHit.value;
      lastJsEvent.value = e;
      if (txn) {
        const isSubThresholdGesture =
          !pointer.dragDistanceSurpassed.value && txn.kind !== 'progress-handle';
        if (isSubThresholdGesture) {
          pointer.abort();
        } else {
          pointer.commit();
        }
      }
      // Click emit only fires when no transaction committed (so a real
      // drag never doubles as a click). For sub-threshold aborts the
      // flag stays false so the click does fire — that's the intended
      // path.
      if (!pointer.wasDragCommit.value && hit) {
        if (hit.kind === 'bar-body') {
          const sourceBar = props.bars.find((b) => b.id === hit.barId);
          if (sourceBar) {
            emitToBoth('bar-click', { barId: hit.barId, sourceBar, jsEvent: e });
          }
        } else if (hit.kind === 'empty-row') {
          // Phase 54 — surface the calendar time via `xToTime`.
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
      if (bodySvgRef.value) {
        try {
          bodySvgRef.value.releasePointerCapture(e.pointerId);
        } catch (err) {
          console.warn('[ChronixGantt] releasePointerCapture failed:', err);
        }
      }
    }

    function onPointercancel(e: PointerEvent): void {
      // Use `hasActiveTransaction()` for synchronous check to avoid
      // reactivity timing issues.
      if (!pointer.hasActiveTransaction()) return;
      // Browser-initiated cancellation (touch interruption, focus
      // stolen, OS gesture). Drop the in-flight transaction without
      // firing a commit callback.
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

    // Phase 31.5: imperative handle data tables. Inline-constructed
    // BarTable / RowDataSource / LinkTable wrappers exposing live `get`
    // accessors + indexed lookups derived from props. Live tables
    // reflect the latest reactive snapshot per call (the `get bars`
    // accessor re-reads `props.bars` each time; `getById` iterates
    // the current snapshot). Ported verbatim from chronix-vue3:1467-1511.
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

    // Phase 31.5.2: dual-scrollport template refs + composable wires.
    // `chartPaneRef` is the overflow:auto pane that owns horizontal +
    // vertical scroll for the chart body; `chartHeaderInnerRef` is the
    // willChange:transform wrapper inside the header pane that takes
    // a `translateX` per chart-pane scroll. `useChartScrollState`
    // exposes `scrollLeft` + `clientWidth` reactive refs derived from
    // chart-pane's scroll listener + ResizeObserver. Phase 31.5.2.1
    // consumes these refs at the per-bar `deriveViewportClipping` call
    // site (triangles + bar text + progress dots reposition reactively
    // when the user scrolls the chart-pane).
    const chartPaneRef: Ref<HTMLElement | null> = ref<HTMLElement | null>(null);
    const chartHeaderInnerRef: Ref<HTMLElement | null> = ref<HTMLElement | null>(null);
    const chartScroll = useChartScrollState(chartPaneRef);

    // Phase 49: sidebar dual-scrollport refs (active when `columns` is
    // non-empty). `sidebarPaneRef` owns the sidebar's vertical scroll
    // container; `sidebarHeaderInnerRef` wraps the sidebar header
    // `<table>` inside `cx-gantt-sidebar-header-pane` (overflow:hidden)
    // and takes a translateX on horizontal sidebar scroll. Refs stay
    // null in no-sidebar mode — `useScrollSync` no-ops and the
    // `useHeaderHorizontalSync` invocation short-circuits at the null
    // guard inside the helper.
    const sidebarPaneRef: Ref<HTMLElement | null> = ref<HTMLElement | null>(null);
    const sidebarHeaderInnerRef: Ref<HTMLElement | null> = ref<HTMLElement | null>(null);
    // Bidirectional vertical scroll lockstep between sidebar + chart.
    // rAF source-tracking idiom (see `./use-scroll-sync.ts`). Null-ref
    // safe.
    useScrollSync(sidebarPaneRef, chartPaneRef);

    // Phase 50: sidebar-divider drag-to-resize state machine.
    // Verbatim port of chronix-vue3:1134-1202 (Vue 2.7 Composition
    // API is API-compatible for `ref` + `computed`). Active only
    // when `columns` is non-empty.
    //
    // `wrapperRef` is needed for the pointermove handler to read the
    // wrapper's bounding-rect width and clamp the proposed sidebar
    // width to `[MIN_SIDEBAR_AREA_WIDTH, wrapperWidth -
    // MIN_SIDEBAR_AREA_WIDTH]` so neither pane shrinks below 40 px.
    //
    // `sidebarWidthOverride` is null until the user grabs the
    // divider; once set, `effectiveSidebarWidth` returns the
    // override instead of the natural `ColumnSpec.width` sum. Prop
    // changes to `columns` don't reset the override — consumer-
    // driven base changes are absorbed; the user's drag offset
    // stays additive across the session.
    //
    // The `dividerDragStart{Width,ClientX}` snapshots are taken at
    // pointerdown so pointermove can compute the delta against a
    // stable baseline — reading the live `effectiveSidebarWidth`
    // mid-drag would double-count the in-flight override mutation.
    const wrapperRef: Ref<HTMLElement | null> = ref<HTMLElement | null>(null);
    const dividerRef: Ref<HTMLElement | null> = ref<HTMLElement | null>(null);
    const sidebarWidthOverride = ref<number | null>(null);
    const dividerDragStartWidth = ref<number | null>(null);
    const dividerDragStartClientX = ref<number | null>(null);

    const sidebarBaseWidth = computed<number>(() =>
      props.columns.reduce((sum, c) => sum + c.width, 0),
    );
    const effectiveSidebarWidth = computed<number>(
      () => sidebarWidthOverride.value ?? sidebarBaseWidth.value,
    );
    // Per-column scale factor: each col's render width = colSpec.width
    // * sidebarScale so the user-supplied column ratios are preserved
    // across drags. Falls back to 1 when there are no columns.
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
      // the drag feels native. Pointerdown is the safest place — by
      // pointermove the selection has already started.
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
      // Browser-initiated cancel (touch interruption, OS gesture).
      // The current override stays — a cancel doesn't revert the
      // in-flight width; reverting would lose progress the user
      // expressed. Just reset the drag-snapshot refs so the next
      // pointerdown starts clean.
      dividerDragStartWidth.value = null;
      dividerDragStartClientX.value = null;
      dividerRef.value?.releasePointerCapture?.(e.pointerId);
    }

    // Phase 31.5.2: inline header horizontal scroll sync. Listens on
    // chart-pane's `scroll` event + writes `transform: translateX(-${scrollLeft}px)`
    // onto the header-inner wrapper so the header tracks horizontal
    // body-pane scroll without needing its own scroll container.
    // Matches the original `transform: translateX` idiom
    // verbatim. Inlined here (not exposed as a standalone composable)
    // because it's tightly bound to `<ChronixGantt>`'s pane structure.
    //
    // Verbatim port of chronix-vue3:1237-1259.
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
      // element directly, not via the ref. Same pattern as the
      // composables above (and as Phase 23 established for vue3).
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
    // Phase 49: sidebar pane horizontal scroll → sidebar-header-inner
    // translateX. Independent from chart-pane per Phase 23 contract
    // (each pane owns its own horizontal scrollport). Null-safe — the
    // helper short-circuits when sidebar refs are unresolved.
    useHeaderHorizontalSync(sidebarPaneRef, sidebarHeaderInnerRef);

    // Phase 31.5.2: real `handle.scrollToDate` implementation.
    // Replaces the Phase 31.5 console.warn stub with the same px math
    // chronix-vue3 uses (chronix-vue3:1513-1524): map `date` to an
    // x-coordinate in axis content-space via `pxPerMs × (date - axisStart)`
    // and write `chartPaneRef.value.scrollLeft = x`. The chart-pane's
    // scroll listener (registered by `useHeaderHorizontalSync` below)
    // then auto-syncs the header `transform: translateX(-${scrollLeft}px)`
    // so the header stays aligned with the body. `useChartScrollState`'s
    // `readState` also fires so `scrollLeft` / `clientWidth` refs stay
    // current (for future Phase 27.1 / 28.2.x viewport-clipped features).
    //
    // No emit fires — scrollToDate writes scroll state directly, which
    // is the one documented exception to the controlled-prop contract
    // every other handle nav/view method follows.
    function scrollToDateImpl(date: Date): void {
      const a = axis.value;
      const axisStartMs = a.ticks[0]?.time.getTime() ?? 0;
      const pxPerMs = a.slotWidth / a.slotDurationMs;
      const x = pxPerMs * (date.getTime() - axisStartMs);
      if (chartPaneRef.value) chartPaneRef.value.scrollLeft = x;
    }

    // Phase 31.5: imperative GanttHandle facade. 16 methods covering
    // view / nav / scroll / bar-lookup / data-tables / subscribe. The
    // view / nav methods all emit `update:axisInput` with the new
    // shape (controlled-prop contract — consumers must wire
    // `v-model:axis-input` for visible effect); `getDate` is read-only.
    // `scrollToDate` is the documented exception that writes scroll
    // state directly (Phase 31.5 stub; real impl Phase 31.5.2).
    // `subscribe` registers into `listenerRegistry`; `emitToBoth`
    // (defined at the top of setup) notifies every registered listener
    // alongside Vue's emit. Returns an unsubscribe function.
    //
    // Ported verbatim from chronix-vue3:1526-1600.
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

    // Phase 31.5.1: header toolbar parser + title formatter. `toolbarModel`
    // is null whenever the prop is disabled (false / undefined) so the
    // render closure can short-circuit to the bare chart wrapper without
    // any toolbar branching state. `toolbarTitleText` re-derives on every
    // `axisInput` change so the title widget stays in sync with handle-
    // driven nav as well as direct prop changes. `parseToolbar` throws on
    // unknown widget names — surfaces typos at render time rather than
    // rendering an unlabeled button.
    const toolbarModel = computed<ToolbarModel | null>(() => {
      const input = props.headerToolbar;
      if (input === false || input === undefined) return null;
      return parseToolbar(input, {
        viewIds: ALL_VIEW_IDS,
        activeViewId: props.axisInput.viewId,
      });
    });
    const toolbarTitleText = computed(() => formatToolbarTitle(props.axisInput));

    // Phase 31.5.1: widget-click dispatcher. Delegates to Phase 31.5
    // `handle` methods (Decision A.1) instead of duplicating the
    // `emitToBoth('update:axisInput', { ...current, anchorDate: prevAnchor(...) })`
    // shape inline. Three wins: (1) saves ~20 LOC of duplicated emit
    // payload construction; (2) if a future phase changes `handle.prev()`
    // semantics (e.g. Phase 31.5.2 adds a scroll side-effect), toolbar
    // follows automatically; (3) `handle.subscribe()` listeners still
    // fire because the handle methods route through `emitToBoth`.
    // chronix-vue3:913-935 inlines the math because that adapter was
    // written before its handle existed — vue2 lands handle-first and
    // reuses it. `title` is non-interactive (no handle method needed).
    function onToolbarWidgetClick(widget: ToolbarWidget): void {
      if (widget.kind === 'view') {
        handle.changeView(widget.buttonName as ViewId);
        return;
      }
      if (widget.kind === 'nav') {
        if (widget.buttonName === 'prev') handle.prev();
        else if (widget.buttonName === 'next') handle.next();
        else if (widget.buttonName === 'today') handle.today();
      }
    }

    ctx.expose(handle);

    return () => {
      const a = axis.value;
      const hh = props.headerHeight;
      const hrh = props.headerRowHeight;
      const headerRowsHeight = a.headerRows.length * hrh;
      const totalHeaderBandHeight = headerRowsHeight + hh;
      const totalWidth = a.totalWidth;
      const bodyHeight = contentSize.value.height;
      // Phase 31.3: read the merged theme (defaults + consumer overrides)
      // instead of the raw default — all `t.*` reads below thread the
      // override automatically. Same identifier name as Phase 31.2 so
      // existing render lines stay textually unchanged.
      const t = theme.value;
      const headerCellTemplate = props.slotRegistry?.get(HEADER_CELL_SLOT_NAME);

      // Outer header rows (e.g. month bands above day ticks). One <rect>
      // per cell as the band background + a centered <text> for the
      // label. Rendered first so the tick row draws on top of cell
      // strokes at shared edges. Phase 31.3: consults the slot registry
      // — when a `'header-cell'` template is registered, its returned
      // VNodes REPLACE the default `<rect>+<text>` pair entirely.
      //
      // Phase 31.x (Phase 29 in chronix-vue3): per-header-cell day
      // classes append onto the outer-band `<rect>` class when the cell
      // represents exactly one calendar day (week view's 7 day-cells;
      // day view's anchor cell). `headerCellClassNamesCallback` (if set)
      // fires for every cell regardless of day-eligibility — its
      // returned classes append after the day classes.

      // Phase 31.x: start-of-today reference shared by day/slot class
      // derivation across header + body. Sampled once per render so all
      // classes agree on which calendar day is "today".
      const MS_PER_DAY_HEADER = 24 * 60 * 60 * 1000;
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Phase 31.x: derive per-header-cell date + dayMeta. Outer band
      // cells (e.g. week view's 7 day-header cells, month view's
      // month-name bands) carry a `date` derived from `cell.x` against
      // the axis's start time + per-slot duration. `dayMeta` is populated
      // only when the cell represents EXACTLY ONE calendar day. Filters
      // out multi-day month-name bands while preserving the day-cell
      // hook for day/week views.
      const headerAxisStartMs = a.ticks[0]?.time.getTime() ?? 0;
      const msPerCellX = a.slotWidth > 0 ? a.slotDurationMs / a.slotWidth : 0;
      function deriveBandCellMeta(cell: AxisHeaderCell): {
        date: Date | undefined;
        dayMeta: CellStateMeta | undefined;
      } {
        if (msPerCellX === 0) return { date: undefined, dayMeta: undefined };
        const date = new Date(headerAxisStartMs + cell.x * msPerCellX);
        const cellSpanMs = cell.width * msPerCellX;
        // Floating-point tolerance for the equality check — pxPerMs
        // arithmetic can lose half a millisecond on long axes.
        const isOneDay = Math.abs(cellSpanMs - MS_PER_DAY_HEADER) < 1;
        const dayMeta = isOneDay ? computeCellStateMeta(date, todayStart) : undefined;
        return { date, dayMeta };
      }

      // Phase 31.x: for tick row labels, day classes apply when the
      // axis's slotDurationMs >= MS_PER_DAY (month / season / halfYear /
      // year views; one tick = one day). Hourly views (day / week) keep
      // tick label unstyled — day grouping lives on the outer band there.
      const tickIsDayEligible = a.slotDurationMs >= MS_PER_DAY_HEADER;
      function deriveTickMeta(tick: AxisTick): CellStateMeta | undefined {
        return tickIsDayEligible ? computeCellStateMeta(tick.time, todayStart) : undefined;
      }

      // Phase 31.x: normalize the optional `headerCellClassNamesCallback`
      // return into a `readonly string[]`. Empty array when no callback
      // is set OR callback returned `undefined`.
      function callHeaderCellClassNames(arg: HeaderCellArg): readonly string[] {
        const cb = props.headerCellClassNamesCallback;
        if (!cb) return [];
        const raw = cb(arg);
        if (raw === undefined) return [];
        return typeof raw === 'string' ? [raw] : raw;
      }

      const headerRowChildren: VNode[] = [];
      if (hrh > 0) {
        for (let rowIdx = 0; rowIdx < a.headerRows.length; rowIdx += 1) {
          const row = a.headerRows[rowIdx]!;
          const rowY = rowIdx * hrh;
          // `bandIndex` matches vue3's convention: outer band rows are
          // bandIndex 1+ (1 = innermost band directly above ticks).
          // bandIndex 0 reserved for the tick row (rendered below).
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
              };
              const raw = headerCellTemplate({
                slot: HEADER_CELL_SLOT_NAME,
                args: slotArgs as unknown as Readonly<Record<string, unknown>>,
              });
              const custom = Array.isArray(raw) ? (raw as VNode[]) : [raw as VNode];
              headerRowChildren.push(...custom);
            } else {
              const dayClasses = dayMeta ? getDayClassNames(dayMeta) : [];
              const classAttr = ['cx-gantt-header-cell', ...dayClasses, ...extraClasses].join(' ');
              headerRowChildren.push(
                h('rect', {
                  key: `header-cell-${rowIdx}-${cellIdx}`,
                  class: classAttr,
                  attrs: {
                    x: cell.x,
                    y: rowY,
                    width: cell.width,
                    height: hrh,
                    fill: t.headerCellFill,
                    stroke: t.headerCellStroke,
                  },
                }),
                h(
                  'text',
                  {
                    key: `header-cell-label-${rowIdx}-${cellIdx}`,
                    class: 'cx-gantt-header-cell-label',
                    attrs: {
                      x: cell.x + cell.width / 2,
                      y: rowY + hrh / 2 + 4,
                      'text-anchor': 'middle',
                      fill: t.headerCellLabel,
                      'font-size': t.headerCellLabelFontSize,
                    },
                  },
                  cell.label,
                ),
              );
            }
          }
        }
      }

      // Tick row: one <line> + <text> per axis.ticks entry. Group is
      // translated down past the outer header rows so the tick group's
      // own coordinate space matches what it was before headerRows
      // landed. A final <line class="cx-gantt-axis-divider"> caps the
      // tick row at y=headerHeight when the row is visible. Phase 31.3:
      // tick-LABEL render consults the same `'header-cell'` slot with
      // `bandIndex=0`, `tick` populated (instead of `cell`); the tick
      // <line> itself is not slottable (it's chrome, not a label).
      const tickChildren: VNode[] = [];
      for (let tickIdx = 0; tickIdx < a.ticks.length; tickIdx += 1) {
        const tick = a.ticks[tickIdx]!;
        const tickDayMeta = deriveTickMeta(tick);
        const tickExtraClasses = callHeaderCellClassNames({
          bandIndex: 0,
          cellIndex: tickIdx,
          date: tick.time,
          label: tick.label,
          dayMeta: tickDayMeta,
          viewId: props.axisInput.viewId,
        });
        tickChildren.push(
          h('line', {
            key: `tick-line-${tick.x}`,
            class: 'cx-gantt-tick-line',
            attrs: {
              x1: tick.x,
              y1: 0,
              x2: tick.x,
              y2: hh,
              stroke: t.headerTickStroke,
            },
          }),
        );
        if (headerCellTemplate) {
          const slotArgs: HeaderCellSlotArgs = {
            bandIndex: 0,
            cellIndex: tickIdx,
            x: tick.x,
            y: 0,
            width: 0,
            height: hh,
            label: tick.label,
            date: tick.time,
            dayMeta: tickDayMeta,
            theme: t,
            tick,
          };
          const raw = headerCellTemplate({
            slot: HEADER_CELL_SLOT_NAME,
            args: slotArgs as unknown as Readonly<Record<string, unknown>>,
          });
          const custom = Array.isArray(raw) ? (raw as VNode[]) : [raw as VNode];
          tickChildren.push(...custom);
        } else {
          const tickDayClasses = tickDayMeta ? getDayClassNames(tickDayMeta) : [];
          const tickClassAttr = [
            'cx-gantt-tick-label',
            ...tickDayClasses,
            ...tickExtraClasses,
          ].join(' ');
          tickChildren.push(
            h(
              'text',
              {
                key: `tick-label-${tick.x}`,
                class: tickClassAttr,
                attrs: {
                  x: tick.x + 2,
                  y: hh - 6,
                  fill: t.headerTickLabel,
                  'font-size': t.tickLabelFontSize,
                },
              },
              tick.label,
            ),
          );
        }
      }
      if (hh > 0) {
        tickChildren.push(
          h('line', {
            key: 'axis-divider',
            class: 'cx-gantt-axis-divider',
            attrs: {
              x1: 0,
              y1: hh,
              x2: a.totalWidth,
              y2: hh,
              stroke: t.headerDivider,
            },
          }),
        );
      }

      // Phase 31.4.2 header-side today-line extras: a `<line>` spanning
      // the full header band so the line visually continues into the
      // body-side line below, plus a `<g class="cx-gantt-today-line-tooltip">`
      // widget (`<rect>` background + `<text>` label centered horizontally
      // on todayX). The tooltip rect is fixed 36 × 16 px — fits the
      // 2-character default `'今日'` label at 11 px font; consumers passing
      // a wider custom tooltip via `TodayLineOption.tooltip` will overflow
      // (same v0 trade-off as chronix-vue3 + original spec). Both
      // line + tooltip carry `pointer-events: 'none'` so they never
      // intercept clicks on the underlying tick labels.
      const headerExtras: VNode[] = [];
      if (resolvedTodayLine.value !== null) {
        const tl = resolvedTodayLine.value;
        headerExtras.push(
          h('line', {
            key: 'today-line-header',
            class: 'cx-gantt-today-line',
            attrs: {
              'data-today-line-side': 'header',
              x1: tl.x,
              x2: tl.x,
              y1: 0,
              y2: totalHeaderBandHeight,
              stroke: tl.color,
              'stroke-width': tl.width,
              ...(tl.dasharray ? { 'stroke-dasharray': tl.dasharray } : {}),
              'pointer-events': 'none',
            },
          }),
        );
        if (tl.tooltip !== '') {
          // Phase 44 D.7 — pre-measure tooltip width so long custom
          // tooltips don't overflow the historical 36-px fixed rect.
          // Formula approximates mixed ASCII/CJK at a 0.7 width
          // factor against the 11-px font size + 8-px horizontal
          // padding; floored at 36 so the default '今日' tooltip
          // keeps its original look.
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
                attrs: { 'pointer-events': 'none' },
              },
              [
                h('rect', {
                  attrs: {
                    x: tooltipX,
                    y: tooltipY,
                    width: tooltipWidth,
                    height: tooltipHeight,
                    fill: tl.tooltipBg,
                    rx: 2,
                  },
                }),
                h(
                  'text',
                  {
                    attrs: {
                      x: tl.x,
                      y: tooltipY + tooltipHeight / 2 + 4,
                      'text-anchor': 'middle',
                      fill: '#ffffff',
                      'font-size': 11,
                    },
                  },
                  tl.tooltip,
                ),
              ],
            ),
          );
        }
      }

      // Phase 31.x (Phase 22.2 in chronix-vue3): header-side today-cell
      // background tint. Rendered FIRST among header children so it
      // sits behind header rows + tick labels + today-line. Spans the
      // full header band height.
      const todayCellHeaderNode =
        resolvedTodayCellBg.value !== null
          ? h('rect', {
              key: 'today-cell-header',
              class: 'cx-gantt-today-cell',
              attrs: {
                'data-today-cell-side': 'header',
                x: resolvedTodayCellBg.value.x,
                y: 0,
                width: resolvedTodayCellBg.value.width,
                height: totalHeaderBandHeight,
                fill: resolvedTodayCellBg.value.color,
                'pointer-events': 'none',
              },
            })
          : null;

      const headerSvg = h(
        'svg',
        {
          class: 'cx-gantt-header',
          attrs: {
            width: totalWidth,
            height: totalHeaderBandHeight,
            xmlns: SVG_NS,
          },
          style: {
            display: 'block',
            background: t.headerBackground,
          },
        },
        [
          // Phase 31.x: today-cell tint paints first so header rows +
          // tick labels sit on top.
          ...(todayCellHeaderNode ? [todayCellHeaderNode] : []),
          h('g', { class: 'cx-gantt-header-rows' }, headerRowChildren),
          h(
            'g',
            {
              class: 'cx-gantt-axis',
              attrs: { transform: `translate(0, ${headerRowsHeight})` },
            },
            tickChildren,
          ),
          // Phase 31.4.2: today-line + tooltip rendered LAST so they
          // paint ON TOP of any overlapping tick labels / header
          // backgrounds.
          ...headerExtras,
        ],
      );

      // Phase 31.3 → 31.4: bar render. Per placed bar, the render produces
      // 1-N VNodes:
      //   1. (Phase 31.4) Run the Phase 20 cascade — `resolveBarStyle` with
      //      theme floor + each component-prop / spec / callback layer.
      //      Result drives both the slot args and the default <rect>.
      //   2. Either the consumer's `'bar'` slot template output (when
      //      registered) — receives cascade output via `BarSlotArgs.resolved*`
      //      — or the default `<rect>` with cascade-driven fill + stroke +
      //      consumer class names appended.
      //   3. (Phase 31.3) Selection-border, edge-resize transparent zones
      //      (when `editable`), and white dot handles (when `editable &&
      //      selected`) as separate sibling rects gated by axis-overlap.
      const barTemplate = props.slotRegistry?.get(BAR_SLOT_NAME);
      const activeTxn = pointer.activeTransaction.value;
      const barChildren: VNode[] = [];

      // Phase 31.4.1: per-render-pass map from barId → resolved background
      // color. Populated inside the bar-render loop (single line below the
      // `resolvedStyle` resolution) and read by the link-render block when
      // `useLineEventColor: true`. Local to the render closure so the map
      // is cleared and rebuilt every render — no cross-render state.
      // Mirrors chronix-vue3:1983 (`Cleared and rebuilt every render — no
      // cross-render state.`) verbatim per Phase 31.4.1 Decision B.1.
      const barColorByBarId = new Map<string, string>();

      for (const bar of placedBars.value) {
        const isSelected = selectedBarSet.value.has(bar.barId);
        const sourceBar = props.bars.find((b) => b.id === bar.barId);
        // Phase 31.4: Phase 20 cascade resolution. When `sourceBar` exists,
        // run the full theme → component-prop → `BarSpec.style` → callback
        // cascade via `resolveBarStyle`. When the bar is an orphan (placed-
        // bar without a matching `sourceBar`; defensive — happens during
        // prop transitions / async fetches), fall back to theme tokens
        // directly so the inline `fill=` / `stroke=` always have a value.
        // Conditional spreads (`...(props.barColor !== undefined ? {...} : {})`)
        // omit absent props rather than passing `undefined` through, which
        // matches the `ResolveBarStyleInput` shape's optional-field
        // semantics — the resolver only enters a cascade layer when the
        // field is present.
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
              ...(props.barFontSizeCallback
                ? { barFontSizeCallback: props.barFontSizeCallback }
                : {}),
              ...(props.barFontWeightCallback
                ? { barFontWeightCallback: props.barFontWeightCallback }
                : {}),
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
              classNames: [],
            };
        // Phase 31.4.1: record the bar's resolved background color so the
        // link-render block can look it up when `useLineEventColor: true`.
        // Map is render-pass-local (declared at the top of the render
        // closure); only bars present in `placedBars` populate it. Orphan-
        // bar resolution (no source bar found) still captures the theme
        // fallback color since `resolvedStyle` carries it.
        barColorByBarId.set(bar.barId, resolvedStyle.backgroundColor);
        if (barTemplate && sourceBar) {
          // Phase 31.4: slot args now carry cascade output, not raw theme
          // tokens — slot consumers see the same resolved colors / fonts
          // the default <rect> would have used.
          const slotArgs: BarSlotArgs = {
            placedBar: bar,
            sourceBar,
            renderX: bar.x,
            renderY: bar.y,
            renderWidth: bar.width,
            renderHeight: bar.height,
            theme: t,
            activeTransaction: activeTxn,
            isSelected,
            resolvedBackgroundColor: resolvedStyle.backgroundColor,
            resolvedBorderColor: resolvedStyle.borderColor,
            resolvedTextColor: resolvedStyle.textColor,
          };
          const raw = barTemplate({
            slot: BAR_SLOT_NAME,
            args: slotArgs as unknown as Readonly<Record<string, unknown>>,
          });
          const custom = Array.isArray(raw) ? (raw as VNode[]) : [raw as VNode];
          barChildren.push(...custom);
        } else {
          // Phase 31.4 + Phase 44 D.6: base classes + cascade-supplied
          // class names + bar state-modifier classes. Order matters:
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
          const modifierClasses: string[] = [];
          // Phase 54 — split into 2 gates so consumers can style
          // drag-only / resize-only bars distinctly.
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
          barChildren.push(
            h('rect', {
              key: bar.barId,
              class: barClass,
              attrs: {
                'data-bar-id': bar.barId,
                x: bar.x,
                y: bar.y,
                width: bar.width,
                height: bar.height,
                // Phase 31.4: fill / stroke flow from the Phase 20 cascade
                // (was raw theme tokens at Phase 31.3). When no overrides
                // are set, output == theme defaults — pixel-identical to
                // the Phase 31.3 baseline.
                fill: resolvedStyle.backgroundColor,
                stroke: resolvedStyle.borderColor,
              },
            }),
          );
        }

        // Phase 53: progress-fill overlay (early-paint, BEFORE continuation
        // triangles + title text so the translucent overlay doesn't wash
        // them out). Mirrors chronix-vue3 Phase 44 D.5 paint-order. When
        // the bar declares both `progress.value` + `pointerOverlayId`, the
        // fill spans 0..value% of bar.width. During a progress-handle
        // drag on THIS bar, the displayed value follows the in-flight
        // `activeTxn.projectedProgress` so the handle visibly tracks the
        // pointer; on commit the demo writes back to `bar.progress.value`
        // and the render falls through to the persisted path.
        const sourceProgressEarly = barProgressById.value.get(bar.barId);
        const overlayIdEarly = overlayIdByBarId.value.get(bar.barId);
        if (sourceProgressEarly !== undefined && overlayIdEarly !== undefined) {
          const displayedProgressEarly =
            activeTxn?.kind === 'progress-handle' && activeTxn.barId === bar.barId
              ? Math.max(0, Math.min(100, activeTxn.projectedProgress))
              : sourceProgressEarly;
          const clampedEarly = Math.max(0, Math.min(100, displayedProgressEarly));
          const fillWidthEarly = (clampedEarly / 100) * bar.width;
          barChildren.push(
            h('rect', {
              key: `${bar.barId}-progress-fill`,
              class: 'cx-gantt-progress-fill',
              attrs: {
                'data-progress-bar-id': bar.barId,
                x: bar.x,
                y: bar.y,
                width: fillWidthEarly,
                height: bar.height,
                fill: t.progressFill,
                'fill-opacity': t.progressFillOpacity,
                'pointer-events': 'none',
              },
            }),
          );
        }

        // Phase 31.5.2.1 (Phase 27.1 in chronix-vue3): viewport-clipping
        // derivation per bar. Reads `chartScroll`'s reactive refs so the
        // per-bar render reacts to user scroll + chart-pane resize. Pure
        // helper — see `derive-viewport-clipping.ts` for the formula +
        // boundary semantics (strict `<` / `>`, Phase 28.2.2 overlap
        // guard, `clientWidth === 0` pre-mount short-circuit).
        const viewportClip = deriveViewportClipping(
          bar.x,
          bar.width,
          chartScroll.scrollLeft.value,
          chartScroll.clientWidth.value,
          TRIANGLE_MARGIN,
        );

        // Phase 31.4 (Phase 27 in chronix-vue3): continuation triangles —
        // axis-clipped sub-case. A left-pointing polygon fires when
        // `!bar.isStart` (bar's calendar range starts before the axis
        // range), symmetric right-pointing when `!bar.isEnd`. Apex 1 px
        // inside the bar edge; base 6 px further in. Fixed translucent
        // black (`fill: #000 opacity: 0.8`) matches the original spec
        // indicator convention — NOT a theme token (the indicator color
        // is functional, not stylistic). `pointer-events: none` keeps
        // the triangle from intercepting clicks on the bar body underneath.
        //
        // Phase 31.5.2.1 (Phase 27.1 in chronix-vue3): viewport-clipped
        // sub-case lights up — apex locks to the visible viewport edge in
        // content-coords (`scrollLeft + TRIANGLE_MARGIN` left;
        // `scrollLeft + clientWidth - TRIANGLE_MARGIN` right) when
        // `viewportClip.isViewportClipped{Start,End}` fires. The chart-pane's
        // native scroll translates content-coords to viewport coords at
        // paint time, so the user sees the triangle 1 px inside the visible
        // viewport edge regardless of how far the bar has scrolled offscreen.
        //
        // `data-axis-clipped` records the Phase 27 sub-case; `data-viewport-clipped`
        // records the Phase 27.1 sub-case. Both are independent booleans on
        // the same polygon — a bar in a narrow viewport may be axis-clipped
        // AND viewport-clipped on the same side.
        //
        // Inserted BEFORE the bar title block so paint order reads
        // rect → triangles → title (matches original spec).
        const fireLeftTriangle = !bar.isStart || viewportClip.isViewportClippedStart;
        if (fireLeftTriangle) {
          const apexX = viewportClip.isViewportClippedStart
            ? viewportClip.viewportLockedLeftApexX
            : bar.x + TRIANGLE_MARGIN;
          const baseX = apexX + TRIANGLE_SIZE;
          const centerY = bar.y + bar.height / 2;
          barChildren.push(
            h('polygon', {
              key: `${bar.barId}-continuation-left`,
              class: 'cx-gantt-bar-continuation-indicator cx-gantt-bar-continuation-left',
              attrs: {
                'data-bar-id': bar.barId,
                'data-axis-clipped': bar.isStart ? 'false' : 'true',
                'data-viewport-clipped': viewportClip.isViewportClippedStart ? 'true' : 'false',
                points: `${apexX},${centerY} ${baseX},${centerY - TRIANGLE_SIZE} ${baseX},${centerY + TRIANGLE_SIZE}`,
                fill: '#000',
                opacity: 0.8,
                'pointer-events': 'none',
              },
            }),
          );
        }
        const fireRightTriangle = !bar.isEnd || viewportClip.isViewportClippedEnd;
        if (fireRightTriangle) {
          const apexX = viewportClip.isViewportClippedEnd
            ? viewportClip.viewportLockedRightApexX
            : bar.x + bar.width - TRIANGLE_MARGIN;
          const baseX = apexX - TRIANGLE_SIZE;
          const centerY = bar.y + bar.height / 2;
          barChildren.push(
            h('polygon', {
              key: `${bar.barId}-continuation-right`,
              class: 'cx-gantt-bar-continuation-indicator cx-gantt-bar-continuation-right',
              attrs: {
                'data-bar-id': bar.barId,
                'data-axis-clipped': bar.isEnd ? 'false' : 'true',
                'data-viewport-clipped': viewportClip.isViewportClippedEnd ? 'true' : 'false',
                points: `${apexX},${centerY} ${baseX},${centerY - TRIANGLE_SIZE} ${baseX},${centerY + TRIANGLE_SIZE}`,
                fill: '#000',
                opacity: 0.8,
                'pointer-events': 'none',
              },
            }),
          );
        }

        // Phase 31.4 (Phase 28.2 in chronix-vue3): bar title auto-render.
        // One `<text class="cx-gantt-bar-text">` per bar with a non-empty
        // `BarSpec.title`. Inner text is the result of `truncateBarText`
        // (char-count truncation with ellipsis); empty truncation output
        // suppresses the node.
        //
        // Gates:
        //   - axis-overlap (bar.x < totalWidth && bar.x + width > 0):
        //     chronix suppresses per-bar text decoration for bars entirely
        //     outside the visible axis. Bar `<rect>`s still render
        //     off-screen (placement-pass produces them); only the text is
        //     suppressed so the off-axis geometry stays intact.
        //   - title non-empty + bar wider than 30 px (the chart's outer
        //     title-visibility gate; below 30 px a label squeezes into an
        //     unreadable strip).
        //   - `availableWidth >= 10` inner gate: when continuation
        //     triangles eat most of the title's space.
        //
        // Padding (Phase 31.5.2.1: `deriveEdgePaddedX` 3-way branch):
        //   - viewport-clipped (Phase 27.1 sub-case): title-start locks
        //     past the viewport-locked triangle's base (`viewportLockedLeftApexX
        //     + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP`); symmetric on right.
        //   - axis-clipped (Phase 27 sub-case): `bar.x + TRIANGLE_MARGIN
        //     + TRIANGLE_SIZE + TITLE_TRIANGLE_GAP = bar.x + 11`.
        //   - default: `bar.x + TITLE_LEFT_PADDING = bar.x + 8`.
        //   Right edge symmetric using `bar.x + bar.width` as renderEdge,
        //   `TITLE_RIGHT_PADDING` as defaultInset.
        //   Precedence: viewport-clipped wins when both fire on same side.
        //
        // `text-anchor: 'start'` + `dominant-baseline: 'middle'` anchor at
        // `(titleStartX, bar mid-line)`. `pointer-events: 'none'` +
        // `user-select: 'none'` so the title never intercepts clicks +
        // can't be text-selected. Font cascade: `resolvedStyle.{fontSize,
        // fontWeight, textColor}` from the Phase 20 cascade (Commit 1).
        // Phase 47.2 — title-side viewport-locking fires ONLY when the
        // bar SPANS the entire viewport (both edges past their respective
        // viewport boundaries). Partial-overlap cases (e.g. bar's left in
        // viewport, right offscreen-right) keep default positioning so
        // the title naturally appears at the bar's edge — matches the
        // original scroll-invariant title behavior + restores
        // cross-demo bar-text count parity. Triangles + progress-dots
        // keep their per-side viewport-lock semantics (those are
        // continuation indicators that should appear at the viewport
        // edge whenever the bar extends past it). Reconciles to
        // chronix-gantt-vue3's Phase 28.2.2 canonical logic; previously
        // this site used per-side viewport-clip flags which produced
        // negative `availableWidth` (titleEndX < titleStartX) for bars
        // whose left edge is inside the viewport but whose right edge
        // is far offscreen, silently suppressing the title.
        const titleViewportSpan =
          viewportClip.isViewportClippedStart && viewportClip.isViewportClippedEnd;
        const titleHasAxisOverlap = bar.x < a.totalWidth && bar.x + bar.width > 0;
        const title = sourceBar?.title;
        if (titleHasAxisOverlap && title && title.length > 0 && bar.width > 30) {
          const titleStartX = deriveEdgePaddedX(
            'start',
            bar.x,
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
            bar.x + bar.width,
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
              barChildren.push(
                h(
                  'text',
                  {
                    key: `${bar.barId}-title`,
                    class: 'cx-gantt-bar-text',
                    attrs: {
                      'data-bar-id': bar.barId,
                      x: titleStartX,
                      y: bar.y + bar.height / 2,
                      fill: resolvedStyle.textColor,
                      'font-size': resolvedStyle.fontSize,
                      'font-weight': resolvedStyle.fontWeight,
                      'font-family': 'inherit',
                      'text-anchor': 'start',
                      'dominant-baseline': 'middle',
                      'pointer-events': 'none',
                    },
                    style: { userSelect: 'none' },
                  },
                  truncated,
                ),
              );
            }
          }
        }

        // Phase 53: progress-handle (LATE-paint — after continuation
        // triangles + title text so the handle remains on top). Changed
        // to downward-pointing triangle below bar edge, only visible when
        // the handle itself is hovered or during active drag. Progress is
        // shown in the title as "title (progress%)".
        const sourceProgress = barProgressById.value.get(bar.barId);
        const overlayId = overlayIdByBarId.value.get(bar.barId);
        const isHandleHovered = hoveredProgressHandleIds.value.has(bar.barId);
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
          const fillWidth = (clamped / 100) * bar.width;
          const handleX = bar.x + fillWidth;
          const handleY = bar.y + bar.height;
          const TRIANGLE_SIZE = 6;
          barChildren.push(
            h('polygon', {
              key: `${bar.barId}-progress-handle`,
              class: 'cx-gantt-progress-handle',
              attrs: {
                'data-progress-bar-id': bar.barId,
                'data-overlay-id': overlayId,
                points: `${handleX - TRIANGLE_SIZE},${handleY + TRIANGLE_SIZE} ${handleX + TRIANGLE_SIZE},${handleY + TRIANGLE_SIZE} ${handleX},${handleY}`,
                fill: t.progressHandleFill,
                stroke: t.progressHandleStroke,
                'stroke-width': t.progressHandleStrokeWidth,
                style: 'cursor: ew-resize; pointer-events: auto;',
              },
            }),
          );
        }

        // Phase 28.1: selection-border + edge-resize zones + dot handles.
        // Phase 31.5.2.1 (Phase 28.2.1 in chronix-vue3): dot positioning
        // consumes `deriveEdgePaddedX` so viewport-clipped + axis-clipped
        // + default branches fire alongside the 1-px inset default. Only
        // the visible dot shifts; the underlying edge-zone hit-test rect
        // (cx-gantt-bar-resizer-{start,end}) stays at the bar's geometric
        // edge so resize gestures operate on the bar's real boundary.
        // The axis-overlap gate keeps off-axis bars from painting chrome
        // they'd visually trail off into nothing.
        const selectionHasAxisOverlap = bar.x < a.totalWidth && bar.x + bar.width > 0;
        if (selectionHasAxisOverlap) {
          if (isSelected) {
            barChildren.push(
              h('rect', {
                key: `${bar.barId}-selection-border`,
                class: 'cx-gantt-bar-selection-border',
                attrs: {
                  'data-bar-id': bar.barId,
                  x: bar.x,
                  y: bar.y,
                  width: bar.width,
                  height: bar.height,
                  fill: 'none',
                  stroke: t.barSelectedBorderColor,
                  'stroke-width': t.barSelectedBorderWidth,
                  'pointer-events': 'none',
                },
              }),
            );
          }
          // Phase 54 — gate on `eventDurationEditable` so resize can
          // be disabled while drag stays enabled.
          if (props.editable && props.eventDurationEditable) {
            // Edge-resize transparent zones. Width threaded through
            // `theme.barResizerThickness` so the visible cursor cue stays
            // aligned with the geometric edge-zone width the pointer
            // composable's hit-test uses (same token wired into
            // `useGanttPointer.edgeZoneWidth` above).
            const resizerThickness = t.barResizerThickness;
            barChildren.push(
              h('rect', {
                key: `${bar.barId}-resizer-start`,
                class: 'cx-gantt-bar-resizer-start',
                attrs: {
                  'data-bar-id': bar.barId,
                  x: bar.x,
                  y: bar.y,
                  width: resizerThickness,
                  height: bar.height,
                  fill: 'transparent',
                  'pointer-events': 'auto',
                },
                style: { cursor: 'ew-resize' },
              }),
              h('rect', {
                key: `${bar.barId}-resizer-end`,
                class: 'cx-gantt-bar-resizer-end',
                attrs: {
                  'data-bar-id': bar.barId,
                  x: bar.x + bar.width - resizerThickness,
                  y: bar.y,
                  width: resizerThickness,
                  height: bar.height,
                  fill: 'transparent',
                  'pointer-events': 'auto',
                },
                style: { cursor: 'ew-resize' },
              }),
            );
          }
          if (isSelected && props.editable && props.eventDurationEditable) {
            const dotSize = t.barResizerDotSize;
            const dotY = bar.y + (bar.height - dotSize) / 2;
            const leftDotX = deriveEdgePaddedX(
              'start',
              bar.x,
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
                bar.x + bar.width,
                viewportClip.viewportLockedRightApexX,
                !bar.isEnd,
                viewportClip.isViewportClippedEnd,
                DOT_EDGE_INSET,
                TRIANGLE_MARGIN,
                TRIANGLE_SIZE,
                DOT_TRIANGLE_GAP,
              ) - dotSize;
            barChildren.push(
              h('rect', {
                key: `${bar.barId}-resizer-dot-start`,
                class: 'cx-gantt-bar-resizer-dot-start',
                attrs: {
                  'data-bar-id': bar.barId,
                  x: leftDotX,
                  y: dotY,
                  width: dotSize,
                  height: dotSize,
                  fill: '#ffffff',
                  stroke: t.barBorderColor,
                  'stroke-width': 1,
                  'pointer-events': 'none',
                },
              }),
              h('rect', {
                key: `${bar.barId}-resizer-dot-end`,
                class: 'cx-gantt-bar-resizer-dot-end',
                attrs: {
                  'data-bar-id': bar.barId,
                  x: rightDotX,
                  y: dotY,
                  width: dotSize,
                  height: dotSize,
                  fill: '#ffffff',
                  stroke: t.barBorderColor,
                  'stroke-width': 1,
                  'pointer-events': 'none',
                },
              }),
            );
          }
        }
      }

      // Phase 31.4.1 link render — runs AFTER the bar-render loop so paint
      // order reads bars → links and so `barColorByBarId` is populated by
      // the time the `useLineEventColor: true` branch reads it. Cascade per
      // routed link:
      //   1. `LinkSpec.colorOverride` (carried on `routed.color` by the
      //      router) → wins outright.
      //   2. else if `useLineEventColor: true` → `barColorByBarId.get(
      //      spec.fromBarId)` → fallback `theme.linkDefaultColor` when the
      //      source bar isn't in the rendered set.
      //   3. else → `theme.linkDefaultColor`.
      // `onLineCallback` runs LAST with the cascaded defaults; merges
      // `{ color?, marker? }` over them. The marker `<defs>` aggregator
      // uses POST-callback resolved colors so a callback color swap still
      // has its `<marker>` def reachable by `marker-end="url(...)"`.
      const linkSpecById = new Map<string, LinkSpec>(props.links.map((l) => [l.id, l]));
      const placedBarById = new Map<string, PlacedBar>(placedBars.value.map((p) => [p.barId, p]));
      const linkSlotTemplate = props.slotRegistry?.get(LINK_SLOT_NAME);
      // Strips keyed by rowId for O(1) lookup in cross-row snap logic.
      const stripByRowId = new Map(strips.value.map((s) => [s.rowId, s]));

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
          // Cross-row snap: same logic as bar rendering
          const projectedRowId = pointer.projectedRowId.value;
          const sourceBar = props.bars.find((b) => b.id === bar.barId);
          const sourceRowId = sourceBar?.rowId;
          if (
            projectedRowId !== null &&
            sourceRowId !== undefined &&
            projectedRowId !== sourceRowId
          ) {
            const sourceStrip = stripByRowId.get(sourceRowId);
            const targetStrip = stripByRowId.get(projectedRowId);
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
        if (!spec) continue; // Defensive — orphan should never reach here.
        const fromBar = placedBarById.get(spec.fromBarId);
        const toBar = placedBarById.get(spec.toBarId);
        if (!fromBar || !toBar) continue; // Defensive bar-resolution gap.

        // Recompute path with live positions if bars are being dragged
        const livePathD = rerouteLinkWithPathAdjustment(routed, fromBar, toBar);

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

      const linkPathNodes: VNode[] = [];
      for (const r of resolvedLinks) {
        if (linkSlotTemplate) {
          // Slot owns the entire link's rendered output. Slot args carry
          // post-cascade + post-callback color + marker; a consumer can
          // pass them through to chronix's marker defs (via `markerEndUrl`
          // re-derived from `args.color` + `args.marker` original) or
          // ignore them and render its own marker shape inline.
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
          const customVNodes: VNode[] = Array.isArray(raw)
            ? (raw as VNode[])
            : raw === null
              ? []
              : [raw as VNode];
          linkPathNodes.push(...customVNodes);
        } else {
          const markerEnd = markerEndUrl(r.marker, r.color);
          linkPathNodes.push(
            h('path', {
              key: r.routed.linkId,
              class: 'cx-gantt-link',
              attrs: {
                'data-link-id': r.routed.linkId,
                d: r.livePathD, // Use live (drag-adjusted) path
                stroke: r.color,
                'stroke-width': t.linkStrokeWidth,
                fill: 'none',
                ...(markerEnd !== null ? { 'marker-end': markerEnd } : {}),
              },
            }),
          );
        }
      }

      // Marker `<defs>` aggregator: one `<marker>` per (color × built-in
      // type) + one per (color × custom marker). Color set includes the
      // theme default plus POST-callback resolved colors so any callback
      // color swap still has its marker-end ref resolve to a real def.
      // Custom markers from callbacks ALSO contribute to the def set
      // (the override's marker may be a `CustomLinkMarker` object not in
      // `props.links`).
      const usedColors = new Set<string>();
      usedColors.add(t.linkDefaultColor);
      for (const r of resolvedLinks) usedColors.add(r.color);

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

      const defsChildren: VNode[] = [];
      for (const color of usedColors) {
        const colorId = markerColorId(color);
        for (const type of BUILTIN_MARKER_TYPES) {
          defsChildren.push(renderBuiltinMarker(type, color, colorId));
        }
        for (const customMarker of customMarkerById.values()) {
          defsChildren.push(renderCustomMarker(customMarker, color, colorId));
        }
      }

      // Phase 31.4.2 body-side grid lines. Three line types:
      //   - vertical 1-px `<rect class="cx-gantt-grid-vline">` per axis
      //     tick (cell boundary; matches chronix-vue3 + original spec).
      //     When the tick falls on Monday at 00:00 (ISO week start), the
      //     rect picks up the additional class `cx-gantt-grid-vline-week`
      //     and the darker `theme.gridLineWeekStartColor` fill.
      //   - one right-edge closing `<rect>` at `x: a.totalWidth - 1` so
      //     the rightmost cell visually closes (skipped when totalWidth
      //     is 0 to avoid a stray line at `x = -1` in degenerate
      //     fixtures).
      //   - horizontal 1-px `<line class="cx-gantt-grid-hline">` per
      //     strip's bottom edge. Y is snapped to the device pixel grid
      //     via `snapHorizontalGridLineY` so 1-px strokes stay
      //     single-weight under fractional row heights AND non-1 device
      //     pixel ratios. `vector-effect="non-scaling-stroke"` preserves
      //     1-px weight under any future viewport zoom transform.
      // All wrapped in `<g class="cx-gantt-grid" pointer-events="none">`
      // — single CSS selector for theming + the wrapper carries
      // pointer-events once instead of per element. Skipped when
      // `gridChildren.length === 0` (no ticks AND no strips, degenerate).
      //
      // Week-start derivation is inline (`tick.time.getDay() === 1 &&
      // tick.time.getHours() === 0`) — matches chronix-vue3 + parity
      // reference; no `AxisTick.isWeekStart` field added to keep zero
      // fixture churn.
      const gridChildren: VNode[] = [];
      for (const tick of a.ticks) {
        const isWeekStart = tick.time.getDay() === 1 && tick.time.getHours() === 0;
        gridChildren.push(
          h('rect', {
            key: `grid-vline-${tick.x}`,
            class: isWeekStart
              ? 'cx-gantt-grid-vline cx-gantt-grid-vline-week'
              : 'cx-gantt-grid-vline',
            attrs: {
              x: tick.x - 1,
              y: 0,
              width: 1,
              height: bodyHeight,
              fill: isWeekStart ? t.gridLineWeekStartColor : t.gridLineColor,
              'pointer-events': 'none',
            },
          }),
        );
      }
      if (a.totalWidth > 0) {
        gridChildren.push(
          h('rect', {
            key: 'grid-vline-right-edge',
            class: 'cx-gantt-grid-vline',
            attrs: {
              x: a.totalWidth - 1,
              y: 0,
              width: 1,
              height: bodyHeight,
              fill: t.gridLineColor,
              'pointer-events': 'none',
            },
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
            attrs: {
              x1: 0,
              y1: yCrisp,
              x2: a.totalWidth,
              y2: yCrisp,
              stroke: t.gridLineRowRuleColor,
              'stroke-width': 1,
              'vector-effect': 'non-scaling-stroke',
              'pointer-events': 'none',
            },
          }),
        );
      }
      const gridGroupNode =
        gridChildren.length > 0
          ? h('g', { class: 'cx-gantt-grid', attrs: { 'pointer-events': 'none' } }, gridChildren)
          : null;

      // Phase 31.x (Phase 22.2 in chronix-vue3): body-side today-cell
      // background tint. Paints as the deepest layer in the body SVG
      // (behind everything except the chart bg fill). Bars + links +
      // today-line all paint on top so visual contrast is preserved.
      const todayCellBodyNode =
        resolvedTodayCellBg.value !== null
          ? h('rect', {
              key: 'today-cell-body',
              class: 'cx-gantt-today-cell',
              attrs: {
                'data-today-cell-side': 'body',
                x: resolvedTodayCellBg.value.x,
                y: 0,
                width: resolvedTodayCellBg.value.width,
                height: bodyHeight,
                fill: resolvedTodayCellBg.value.color,
                'pointer-events': 'none',
              },
            })
          : null;

      // Phase 31.x (Phase 29 in chronix-vue3): per-tick slot rects —
      // one transparent `<rect class="cx-gantt-slot cx-gantt-slot-{dayId}
      // {state-classes}">` per axis tick. Pure CSS hook for consumer
      // styling (weekend tinting, today-column emphasis, past/future
      // fade). Sits BEHIND grid lines + bars + links so consumer fills
      // paint visibly without obscuring chart chrome. `fill: transparent`
      // keeps the default render pixel-identical to pre-Phase-29; classes
      // alone let consumer CSS opt-in to backgrounds via selectors like
      // `.cx-gantt-slot-sat { background: ... }`.
      const bodySlotChildren: VNode[] = [];
      for (const tick of a.ticks) {
        const slotMeta = computeCellStateMeta(tick.time, todayStart);
        const slotClasses = getSlotClassNames(slotMeta);
        bodySlotChildren.push(
          h('rect', {
            key: `body-slot-${tick.x}`,
            class: slotClasses.join(' '),
            attrs: {
              x: tick.x,
              y: 0,
              width: a.slotWidth,
              height: bodyHeight,
              fill: 'transparent',
              'pointer-events': 'none',
            },
          }),
        );
      }

      // Phase 31.4.2 body-side today-line `<line>`. Renders BEFORE the
      // bars group so bars paint on top (matches chronix-vue3 + parity
      // reference layering — the line acts as a vertical guide UNDER
      // the bars). Stroke / dash / width all driven by
      // `resolvedTodayLine`. `pointer-events: none` keeps clicks
      // flowing through to bars / empty rows beneath.
      const todayLineBodyNode =
        resolvedTodayLine.value !== null
          ? h('line', {
              key: 'today-line-body',
              class: 'cx-gantt-today-line',
              attrs: {
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
              },
            })
          : null;

      const bodySvg = h(
        'svg',
        {
          class: 'cx-gantt-body',
          // Callback ref keeps the bodySvgRef Composition-API ref in
          // sync with the rendered DOM node. Vue 2's vnode-data `ref`
          // field accepts a callback signature; the function fires on
          // mount + on every re-render with the resolved element (or
          // null on unmount). Stays correct across reactive re-renders.
          // The `as never` cast bridges the Vue 2 vnode-data type for
          // `ref` (typed for the wider Component/Element union) and
          // our narrower SVGSVGElement signature without leaking a
          // larger type-error surface to consumers.
          ref: ((el: SVGSVGElement | null) => {
            bodySvgRef.value = el;
          }) as never,
          attrs: {
            width: totalWidth,
            height: bodyHeight,
            xmlns: SVG_NS,
          },
          style: { display: 'block', touchAction: 'none' },
          on: {
            pointerdown: onPointerdown,
            pointermove: onPointermove,
            pointerup: onPointerup,
            pointercancel: onPointercancel,
          },
        },
        [
          // Phase 31.4.1: <defs> sits first so marker-end="url(...)" refs
          // on link paths below resolve at first paint. cx-gantt-bars group
          // wraps the existing bar children (paint order unchanged for
          // charts with no links). cx-gantt-links group renders LAST so
          // links paint on top of bars; `pointer-events: none` lets pointer
          // events on overlapping bars still flow through to the bar layer.
          h('defs', { class: 'cx-gantt-defs' }, defsChildren),
          // Phase 31.x: today-cell-bg sits deepest (behind slots + grid
          // + today-line + bars + links). Phase 29 slots layered next
          // (behind grid so consumer fills paint visibly without
          // obscuring chart chrome). Phase 31.4.2 grid + today-line
          // paint BEFORE bars so bars sit on top.
          ...(todayCellBodyNode ? [todayCellBodyNode] : []),
          h(
            'g',
            { class: 'cx-gantt-slots', attrs: { 'pointer-events': 'none' } },
            bodySlotChildren,
          ),
          ...(gridGroupNode ? [gridGroupNode] : []),
          ...(todayLineBodyNode ? [todayLineBodyNode] : []),
          h(
            'g',
            {
              class: 'cx-gantt-bars',
              // Phase 54 — delegated hover handlers (Vue 2 vnode-data `on:`).
              on: { pointerover: onBarsPointerover, pointerout: onBarsPointerout },
            },
            barChildren,
          ),
          h('g', { class: 'cx-gantt-links', attrs: { 'pointer-events': 'none' } }, linkPathNodes),
        ],
      );

      // Phase 31.5.2 + Phase 49: dual-scrollport restructure. The chart
      // wrapper is a CSS grid. Pre-Phase-49 (chart-only): 1 column ×
      // 2 rows. Phase 49 (sidebar enabled via `columns` prop):
      // 2 columns × 2 rows (sidebar | chart × header / body). Each pane
      // owns its own `overflow` behavior:
      //   - sidebar-header-pane + chart-header-pane: overflow:hidden
      //     (inner wrapper takes a translateX to track its body pane's
      //     horizontal scroll without showing a scrollbar)
      //   - sidebar-pane + chart-pane: overflow:auto (real scroll
      //     containers; vertical scrollbars when content exceeds the
      //     pane size; `useScrollSync` keeps the two in lockstep)
      //
      // When `maxBodyHeight` is undefined (default), grid-row 2 = CSS
      // `auto` → row grows to content height → no vertical scrollbar
      // engages → pre-31.5.2 consumers see identical visual output.
      // When set, row 2 caps to the given height + vertical scrollbar
      // engages on whichever pane(s) have content overflowing.
      //
      // Phase 49: matches chronix-vue3:3185-3289 directly, including
      // the `hasSidebar ? [sidebarHeaderPane, chartHeaderPane,
      // sidebarPane, chartPane] : [chartHeaderPane, chartPane]`
      // children-array selection.

      // Phase 49 — sidebar geometry. `sidebarWidth` is the natural sum
      // of per-column widths (no Phase 14 user-resize scale factor in
      // this phase — Phase 50 follow-up). `spansMatrix` resolves the
      // per-cell rowspan number per column up-front so the JSX builder
      // can read it without recomputing per cell.
      const hasSidebar = props.columns.length > 0;
      const sidebarColumns: readonly ColumnSpec[] = props.columns;
      // Phase 50: `effectiveSidebarWidth` returns the user-dragged
      // override (if any) or falls back to the natural sum of per-
      // column widths. `scale` (effective / base) multiplies each
      // `<col>` rendered width so the user-supplied column ratios
      // survive the drag.
      const sidebarWidth = effectiveSidebarWidth.value;
      const scale = sidebarScale.value;
      const rowsById = new Map(props.rows.map((r) => [r.id, r]));
      const rowsForSpans = strips.value
        .map((strip) => rowsById.get(strip.rowId))
        .filter((r): r is RowSpec => r !== undefined);
      const sidebarSpansMatrix = hasSidebar
        ? computeRowSpans(rowsForSpans, sidebarColumns)
        : ([] as readonly number[][]);

      // Sidebar header table — single `<tr>` of `<th>` cells + matching
      // `<colgroup>` so vertical borders align with the body table.
      const sidebarHeaderTable: VNode | null = hasSidebar
        ? h(
            'table',
            {
              style: {
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                width: `${sidebarWidth}px`,
                height: `${totalHeaderBandHeight}px`,
              },
              attrs: { cellpadding: 0, cellspacing: 0 },
            },
            [
              h(
                'colgroup',
                {},
                sidebarColumns.map((c) =>
                  h('col', { key: c.key, style: { width: `${c.width * scale}px` } }),
                ),
              ),
              h('thead', {}, [
                h(
                  'tr',
                  { style: { height: `${totalHeaderBandHeight}px` } },
                  sidebarColumns.map((col) =>
                    h(
                      'th',
                      {
                        key: col.key,
                        class: 'cx-gantt-sidebar-header-cell',
                        attrs: { 'data-column-key': col.key },
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
          )
        : null;

      // Sidebar body table — one `<tr>` per swimlane strip. Per-row TR
      // height = strip.height + max(0, nextStrip.y - strip.bottom) so a
      // rowspan=N cell covers exactly N strips + (N-1) gaps. Cells
      // absorbed by an earlier row's rowspan (span === 0) emit nothing.
      const sidebarBodyTable: VNode | null = hasSidebar
        ? h(
            'table',
            {
              style: {
                borderCollapse: 'collapse',
                tableLayout: 'fixed',
                width: `${sidebarWidth}px`,
              },
              attrs: { cellpadding: 0, cellspacing: 0 },
            },
            [
              h(
                'colgroup',
                {},
                sidebarColumns.map((c) =>
                  h('col', { key: c.key, style: { width: `${c.width * scale}px` } }),
                ),
              ),
              h(
                'tbody',
                {},
                strips.value.map((strip, rowIdx) => {
                  const row = rowsById.get(strip.rowId);
                  const nextStrip = strips.value[rowIdx + 1];
                  const gap = nextStrip !== undefined ? nextStrip.y - (strip.y + strip.height) : 0;
                  const trHeight = strip.height + Math.max(0, gap);
                  return h(
                    'tr',
                    {
                      key: strip.rowId,
                      class: 'cx-gantt-sidebar-row',
                      attrs: { 'data-row-id': strip.rowId },
                      style: { height: `${trHeight}px` },
                    },
                    sidebarColumns.flatMap((col, colIdx) => {
                      const span = sidebarSpansMatrix[colIdx]?.[rowIdx] ?? 1;
                      if (span === 0) return [];
                      const value = row?.columns[col.key];
                      const isMerged = span > 1;
                      return [
                        h(
                          'td',
                          {
                            key: col.key,
                            class: 'cx-gantt-sidebar-cell',
                            attrs: {
                              'data-row-id': strip.rowId,
                              'data-column-key': col.key,
                              ...(isMerged ? { rowspan: span } : {}),
                            },
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
                    }),
                  );
                }),
              ),
            ],
          )
        : null;

      const sidebarHeaderPane: VNode | null = hasSidebar
        ? h(
            'div',
            {
              class: 'cx-gantt-sidebar-header-pane',
              style: { overflow: 'hidden', gridColumn: '1', gridRow: '1' },
            },
            [
              h(
                'div',
                {
                  ref: ((el: HTMLElement | null) => {
                    sidebarHeaderInnerRef.value = el;
                  }) as never,
                  class: 'cx-gantt-sidebar-header-inner',
                  style: { willChange: 'transform' },
                },
                [
                  h(
                    'div',
                    {
                      class: 'cx-gantt-sidebar-header',
                      style: {
                        background: t.sidebarBackground,
                        borderBottom: `1px solid ${t.sidebarHeaderDivider}`,
                        boxSizing: 'border-box',
                      },
                    },
                    [sidebarHeaderTable],
                  ),
                ],
              ),
            ],
          )
        : null;

      const sidebarPane: VNode | null = hasSidebar
        ? h(
            'div',
            {
              ref: ((el: HTMLElement | null) => {
                sidebarPaneRef.value = el;
              }) as never,
              class: 'cx-gantt-sidebar-pane',
              style: {
                overflow: 'auto',
                gridColumn: '1',
                gridRow: '2',
              },
            },
            [
              h(
                'div',
                { class: 'cx-gantt-sidebar-body', style: { background: t.sidebarBackground } },
                [sidebarBodyTable],
              ),
            ],
          )
        : null;

      // Phase 50: sidebar-divider grid track at column 2 (between
      // sidebar pane in column 1 and chart panes in column 3).
      // Spans both header + body grid rows. Pointer handlers drive
      // `sidebarWidthOverride` via the state machine wired above.
      const dividerNode = hasSidebar
        ? h('div', {
            ref: ((el: HTMLElement | null) => {
              dividerRef.value = el;
            }) as never,
            class: 'cx-gantt-sidebar-divider',
            attrs: { 'data-cx-divider': 'sidebar' },
            style: {
              gridColumn: '2',
              gridRow: '1 / 3',
              cursor: 'col-resize',
              zIndex: 4,
              background: 'transparent',
              userSelect: 'none',
              touchAction: 'none',
            },
            on: {
              pointerdown: onDividerPointerdown,
              pointermove: onDividerPointermove,
              pointerup: onDividerPointerup,
              pointercancel: onDividerPointercancel,
            },
          })
        : null;

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
              ref: ((el: HTMLElement | null) => {
                chartHeaderInnerRef.value = el;
              }) as never,
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
          ref: ((el: HTMLElement | null) => {
            chartPaneRef.value = el;
          }) as never,
          class: 'cx-gantt-chart-pane',
          style: {
            overflow: 'auto',
            gridColumn: hasSidebar ? '3' : '1',
            gridRow: '2',
          },
        },
        [bodySvg],
      );

      const chartWrapper = h(
        'div',
        {
          ref: ((el: HTMLElement | null) => {
            wrapperRef.value = el;
          }) as never,
          class: 'cx-gantt-wrapper',
          attrs: { 'data-cx-gantt': 'wrapper' },
          style: {
            display: 'grid',
            gridTemplateColumns: hasSidebar
              ? `${sidebarWidth}px ${SIDEBAR_DIVIDER_WIDTH}px auto`
              : 'auto',
            gridTemplateRows: `${totalHeaderBandHeight}px ${props.maxBodyHeight ?? 'auto'}`,
          },
        },
        hasSidebar
          ? [sidebarHeaderPane!, chartHeaderPane, sidebarPane!, chartPane, dividerNode!]
          : [chartHeaderPane, chartPane],
      );

      // Phase 31.5.1: when `headerToolbar` is configured, wrap the chart
      // wrapper in a `cx-gantt-root` parent and prepend the toolbar.
      // When disabled (default), return the chart wrapper directly —
      // pre-31.5.1 consumers see no DOM shape change. Matches
      // chronix-vue3:3291-3300 exactly (Decision B.1).
      const tm = toolbarModel.value;
      if (!tm) return chartWrapper;
      return h('div', { class: 'cx-gantt-root' }, [
        renderToolbar(tm, toolbarTitleText.value, t, onToolbarWidgetClick),
        chartWrapper,
      ]);
    };
  },
});

/**
 * Phase 31.5.1: inline SVG icon for `prev` / `next` toolbar nav buttons.
 * Polyline shape matches chronix-vue3:3305-3324 verbatim so visual parity
 * holds. Vue 2 keeps DOM attributes under `attrs:` (props vs attrs are
 * separate channels in Vue 2's h() API).
 */
function renderToolbarIcon(kind: 'prev' | 'next'): VNode {
  const points = kind === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6';
  return h(
    'svg',
    {
      attrs: {
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
    },
    [h('polyline', { attrs: { points } })],
  );
}

/**
 * Phase 31.5.1: render one toolbar widget as a `<button>`. Class follows
 * the `cx-gantt-{buttonName}-button` convention so per-widget styling +
 * Playwright selectors share a stable naming contract. `aria-pressed`
 * reflects the active-view state for view buttons; nav / title widgets
 * always report `false`. Inline style cascade reads from the resolved
 * theme (chronix defaults merged with consumer override).
 */
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
      class: `cx-gantt-${widget.buttonName}-button`,
      attrs: {
        type: 'button',
        'data-button-name': widget.buttonName,
        'data-button-kind': widget.kind,
        'aria-pressed': widget.isPressed ? 'true' : 'false',
      },
      style,
      on: {
        click: () => onClick(widget),
      },
    },
    widget.iconSvg ? [renderToolbarIcon(widget.iconSvg)] : widget.labelText,
  );
}

/**
 * Phase 31.5.1: render one widget-group inside a section. A single-widget
 * group renders as the bare widget (no wrapper); multi-widget groups wrap
 * in `cx-gantt-button-group` for visual cohesion. Empty groups return
 * null so the section-level filter can drop them. Title widgets render
 * as `<h2 class="cx-gantt-toolbar-title">` — non-interactive (no click
 * handler attached, so test #9 sees no emit).
 */
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
          attrs: {
            'data-button-name': 'title',
            'data-button-kind': 'title',
          },
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

/**
 * Phase 31.5.1: render one toolbar section (start / center / end). Wraps
 * filtered group VNodes in `cx-gantt-toolbar-chunk` with inline flex.
 * Empty sections still render the chunk div so the toolbar's
 * `space-between` alignment stays stable even when only one section
 * has widgets.
 */
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
 * Phase 31.5.1: render the toolbar above the chart wrapper. Three
 * sections (`start` / `center` / `end`) laid out with `space-between`
 * so center stays centered when start + end are balanced. Chronix
 * `cx-*` class names so the parity extractor can pair them with the
 * original DOM. Click delegates back to `setup()`'s
 * `onToolbarWidgetClick` which routes through the Phase 31.5 handle
 * methods.
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

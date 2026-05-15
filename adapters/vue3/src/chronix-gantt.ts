import {
  BAR_SLOT_NAME,
  defaultChronixTheme,
  defaultLinkRouter,
  resolveBarStyle,
} from '@chronixjs/gantt';
import { computed, defineComponent, h, ref, watchEffect, type PropType } from 'vue';

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
import type { BarClickPayload, EmptyAreaClickPayload } from './use-gantt-selection.js';
import type {
  AxisRangePlanInput,
  BarColorFunc,
  BarSlotArgs,
  BarSpec,
  ChronixTheme,
  CustomLinkMarker,
  EventAllowFunc,
  EventConstraint,
  EventOverlapFunc,
  LinkMarker,
  LinkSpec,
  RowSpec,
  SelectAllowFunc,
  SlotRegistry,
  TimeRange,
  TodayLineOption,
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

/**
 * Minimum width (px) the sidebar area can shrink to during a divider
 * drag. Also serves as the maximum-end clamp: the sidebar can't grow
 * past `wrapperWidth − MIN_SIDEBAR_AREA_WIDTH` so the chart side
 * keeps at least the same slack visible. Chosen to leave ~24px of
 * text-width budget after the cell's ~16px horizontal padding so a
 * minimum-width column still renders one character.
 */
const MIN_SIDEBAR_AREA_WIDTH = 40;

/**
 * Width (px) of the divider grid track. The visible 1px line is
 * centered inside this track via CSS, so the hit zone is a few px
 * wider on either side of the line — easier to grab without pixel
 * precision. 8 matches mainstream window-manager divider sizing.
 */
const SIDEBAR_DIVIDER_WIDTH = 8;

/**
 * Encode a color string into the suffix used in marker ids. Strips
 * non-alphanumeric (e.g. `'#3788d8'` → `'3788d8'`, `'rgb(255, 0, 0)'`
 * → `'rgb25500'`). Matches the parity reference's encoding.
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
 * parity-reference's `renderMarker` (horizontal direction only;
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
 * One sidebar column in the resource panel. The `key` indexes into
 * `RowSpec.columns` to read each row's cell value; `label` paints the
 * column header in the top-left pane; `width` is in CSS pixels and
 * contributes additively to the sidebar's total track width.
 *
 * When `group: true`, consecutive rows that share the same value in
 * this column merge into a single cell with `rowspan=N` (vGrouping
 * mode). Rows must be adjacent in the input order; rows with the same
 * value but separated by a different-valued row don't merge. Columns
 * without `group: true` always render one cell per row.
 */
export interface ColumnSpec {
  readonly key: string;
  readonly label: string;
  readonly width: number;
  readonly group?: boolean;
}

/**
 * For each (column × row) position, decide whether the cell should
 * render with a rowspan (N > 1, this is the first of a merged group),
 * be skipped entirely (0, absorbed by an earlier row's rowspan), or
 * render individually (1).
 *
 * Pure function — exported for unit testing the matrix shape
 * independently of the render path.
 */
export function computeRowSpans(
  rows: readonly RowSpec[],
  columns: readonly ColumnSpec[],
): number[][] {
  return columns.map((col) => {
    const spans = new Array<number>(rows.length).fill(1);
    if (!col.group) return spans;
    let r = 0;
    while (r < rows.length) {
      const value = rows[r]!.columns[col.key];
      let endR = r;
      while (endR + 1 < rows.length && rows[endR + 1]!.columns[col.key] === value) {
        spans[endR + 1] = 0;
        endR += 1;
      }
      spans[r] = endR - r + 1;
      r = endR + 1;
    }
    return spans;
  });
}

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
    barVerticalPadding: { type: Number, default: 8 },
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
     * upstream (manually or via `useGanttSelection()` helper).
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
     * Phase 21: today-line config. `false` or omitted = hide (default);
     * `true` = enable with all defaults (red `#ff6b6b`, 2 px, dashed,
     * `'今日'` tooltip); an object literal overrides per-field. See
     * `TodayLineOption` for the resolution cascade with theme tokens.
     */
    todayLine: {
      type: [Boolean, Object] as PropType<TodayLineOption | boolean>,
      default: false,
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
  },
  setup(props, { emit }) {
    // Effective theme: merge consumer overrides over chronix defaults.
    // Reactive — a `theme` prop change triggers re-render with the new
    // tokens applied through every callsite below.
    const theme = computed<ChronixTheme>(() => ({
      ...defaultChronixTheme,
      ...props.theme,
    }));

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
        emit('link-orphan', orphanId);
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
      selectable: () => props.selectable,
      progressHandleSize: () => props.progressHandleSize,
      // 0 is treated as "no snap" by the commit layer — pass through verbatim.
      snapDurationMs: () => props.snapDurationMs,
      // Phase 19: validation gate inputs.
      bars: () => props.bars,
      eventAllow: () => props.eventAllow,
      selectAllow: () => props.selectAllow,
      eventOverlap: () => props.eventOverlap,
      eventConstraint: () => props.eventConstraint,
      onBarDrop: (p) => emit('bar-drop', p),
      onBarResize: (p) => emit('bar-resize', p),
      onSelect: (p) => emit('select', p),
      onBarProgress: (p) => emit('bar-progress', p),
      onBarDropRejected: (p) => emit('bar-drop-rejected', p),
      onBarResizeRejected: (p) => emit('bar-resize-rejected', p),
      onSelectRejected: (p) => emit('select-rejected', p),
      onBarDragStart: ({ barId }) => {
        const payload = buildDragPayload(barId);
        if (payload) emit('bar-dragstart', payload);
      },
      onBarDragStop: ({ barId }) => {
        const payload = buildDragPayload(barId);
        if (payload) emit('bar-dragstop', payload);
      },
      onBarResizeStart: ({ barId, edge }) => {
        const payload = buildDragPayload(barId);
        if (payload) emit('bar-resizestart', { ...payload, edge });
      },
      onBarResizeStop: ({ barId, edge }) => {
        const payload = buildDragPayload(barId);
        if (payload) emit('bar-resizestop', { ...payload, edge });
      },
    });

    // The body SVG owns pointer interactions. The header SVG has no
    // handlers — axis-row clicks reach no listener and silently no-op.
    const bodySvgRef = ref<SVGSVGElement | null>(null);

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
      const maxWidth = Math.max(MIN_SIDEBAR_AREA_WIDTH, wrapperWidth - MIN_SIDEBAR_AREA_WIDTH);
      const proposed = dividerDragStartWidth.value + (e.clientX - dividerDragStartClientX.value);
      sidebarWidthOverride.value = Math.max(MIN_SIDEBAR_AREA_WIDTH, Math.min(maxWidth, proposed));
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
    // upstream in the wrapper and contributes nothing to the body's rect.
    function toContentXY(e: PointerEvent): { x: number; y: number } | null {
      const svg = bodySvgRef.value;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
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
      if (pointer.activeTransaction.value && bodySvgRef.value) {
        bodySvgRef.value.setPointerCapture?.(e.pointerId);
      }
    }

    function onPointermove(e: PointerEvent): void {
      if (!pointer.activeTransaction.value) return;
      const pos = toContentXY(e);
      if (!pos) return;
      // Phase 16: refresh lastJsEvent so lazy-fire `'bar-dragstart'` —
      // which happens during this `advance()` call — sees the live
      // PointerEvent rather than the stale pointerdown one.
      lastJsEvent.value = e;
      pointer.advance(pos.x, pos.y);
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
        const isNoOpDrag =
          (txn.kind === 'bar-drag' && txn.deltaX === 0 && txn.deltaY === 0) ||
          (txn.kind === 'bar-resize' && txn.deltaX === 0) ||
          (txn.kind === 'calendar-range-select' &&
            txn.currentTime.getTime() === txn.anchorTime.getTime());
        if (isNoOpDrag) {
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
            emit('bar-click', { barId: hit.barId, sourceBar, jsEvent: e });
          }
        } else if (hit.kind === 'empty-row') {
          emit('empty-area-click', { rowId: hit.rowId, jsEvent: e });
        }
      }
      bodySvgRef.value?.releasePointerCapture?.(e.pointerId);
    }

    function onPointercancel(e: PointerEvent): void {
      if (!pointer.activeTransaction.value) return;
      // Browser-initiated cancellation (touch interruption, focus stolen,
      // OS gesture). Drop the in-flight transaction without firing a
      // commit callback — the user's intent is lost, not finalized.
      // Phase 16: refresh lastJsEvent so any `'bar-dragstop'` /
      // `'bar-resizestop'` fired by `abort()` references the cancel
      // event rather than the stale pointermove one.
      lastJsEvent.value = e;
      pointer.abort();
      bodySvgRef.value?.releasePointerCapture?.(e.pointerId);
    }

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

      // Outer header rows (e.g. month bands above day ticks). One <rect>
      // per cell as the band background + a centered <text> for the label.
      // Rendered first so the tick row draws on top of cell strokes at
      // shared edges.
      const headerRowChildren = [];
      if (hrh > 0) {
        for (let rowIdx = 0; rowIdx < a.headerRows.length; rowIdx += 1) {
          const row = a.headerRows[rowIdx]!;
          const rowY = rowIdx * hrh;
          for (let cellIdx = 0; cellIdx < row.cells.length; cellIdx += 1) {
            const cell = row.cells[cellIdx]!;
            headerRowChildren.push(
              h('rect', {
                key: `header-cell-${rowIdx}-${cellIdx}`,
                class: 'cx-gantt-header-cell',
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
      const tickChildren = [];
      for (const tick of a.ticks) {
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
          h(
            'text',
            {
              key: `tick-label-${tick.x}`,
              class: 'cx-gantt-tick-label',
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
      // custom tooltip via `TodayLineOption.tooltip` will overflow,
      // which is the same v0 trade-off k-ui makes (CSS-driven; no
      // text-measurement step). `pointer-events: none` on both line
      // and tooltip so they don't intercept clicks on header tick
      // labels underneath.
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
          const tooltipWidth = 36;
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

      const headerSvg = h(
        'svg',
        {
          class: 'cx-gantt-header',
          width: totalWidth,
          height: totalHeaderBandHeight,
          style: {
            display: 'block',
            position: 'sticky',
            top: '0',
            zIndex: 2,
            background: t.headerBackground,
            // Phase 14: explicit grid placement so the divider track
            // (gridColumn 2) doesn't displace this pane to column 2 via
            // auto-placement. No-op when the wrapper isn't a grid.
            ...(hasSidebar ? { gridColumn: '3', gridRow: '1' } : {}),
          },
        },
        [
          h('g', { class: 'cx-gantt-header-rows' }, headerRowChildren),
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

      const barChildren = placedBars.value.flatMap((bar) => {
        // Live geometry: when a `bar-drag` or `bar-resize` transaction
        // is active on THIS bar, shift the rendered rect by the
        // transaction's `deltaX` / `deltaY`. The progress fill + handle
        // below read from the same render geometry so the overlay stays
        // anchored to the bar's visible body during the drag.
        const activeTxn = pointer.activeTransaction.value;
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
            })
          : {
              backgroundColor: t.barBackgroundColor,
              borderColor: t.barBorderColor,
              textColor: t.barTextColor,
            };
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
          nodes.push(
            h('rect', {
              key: bar.barId,
              'data-bar-id': bar.barId,
              class: isSelected ? 'cx-gantt-bar cx-gantt-bar--selected' : 'cx-gantt-bar',
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
        }
        // Progress fill + handle: only for bars that declared BOTH
        // `progress` AND `pointerOverlayId`. Progress fill is a
        // translucent overlay from bar start to the progress-x; the
        // handle is a small square the user can grab.
        //
        // While a progress-handle drag is active on THIS bar, the
        // displayed progress follows the transaction's live
        // `projectedProgress` (clamped) instead of the bar's persisted
        // `progress.value`. This lets the handle visibly track the
        // pointer mid-drag; on commit the demo writes the new value
        // back and the render falls through to the persisted path.
        const sourceProgress = barProgressById.value.get(bar.barId);
        const overlayId = overlayIdByBarId.value.get(bar.barId);
        // sourceBar lookup moved up (Phase 20) for the bar-color
        // resolver; reuse it here.
        if (sourceProgress !== undefined && overlayId !== undefined) {
          const displayedProgress =
            activeTxn?.kind === 'progress-handle' && activeTxn.barId === bar.barId
              ? Math.max(0, Math.min(100, activeTxn.projectedProgress))
              : sourceProgress;
          const clamped = Math.max(0, Math.min(100, displayedProgress));
          const fillWidth = (clamped / 100) * renderWidth;
          const handleX = renderX + fillWidth;
          const handleSize = props.progressHandleSize;
          nodes.push(
            h('rect', {
              key: `${bar.barId}-progress-fill`,
              'data-progress-bar-id': bar.barId,
              class: 'cx-gantt-progress-fill',
              x: renderX,
              y: renderY,
              width: fillWidth,
              height: bar.height,
              fill: t.progressFill,
              'fill-opacity': t.progressFillOpacity,
              'pointer-events': 'none',
            }),
            h('rect', {
              key: `${bar.barId}-progress-handle`,
              'data-progress-bar-id': bar.barId,
              'data-overlay-id': overlayId,
              class: 'cx-gantt-progress-handle',
              x: handleX - handleSize / 2,
              y: renderY + bar.height / 2 - handleSize / 2,
              width: handleSize,
              height: handleSize,
              fill: t.progressHandleFill,
              stroke: t.progressHandleStroke,
              'stroke-width': t.progressHandleStrokeWidth,
              // The hit-tester drives this off the bar-rect map; we keep
              // DOM pointer-events off so the SVG's pointerdown handler
              // resolves through the parent group (matches the
              // separate-layer pattern).
              'pointer-events': 'none',
            }),
          );

          // Progress text label: `BarProgress.textFormat` template with
          // `{value}` substituted by the rounded displayed progress.
          // Suppressed when `BarProgress.showText === false`. Live-updates
          // because `displayedProgress` already does.
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
        return nodes;
      });

      // Link paths render in a sibling group AFTER the bars group so
      // SVG paint order puts them on top. `pointer-events: none` keeps
      // bar drag / resize / progress-handle pointer events flowing
      // through to the bars layer. Markers attach via `marker-end`
      // referencing a `<defs>` entry built below.
      //
      // Build the marker spec lookup keyed by link id so the path
      // render step can pair `routed.color ?? defaultLinkColor` with
      // the link's `marker` to form the marker-end URL.
      const linkSpecById = new Map<string, LinkSpec>(props.links.map((l) => [l.id, l]));
      const linkPathNodes = routedLinks.value.map((routed) => {
        const color = routed.color ?? t.linkDefaultColor;
        const spec = linkSpecById.get(routed.linkId);
        // `spec` always exists for non-orphan routed links — orphans
        // never make it into routedLinks. Defensive lookup keeps the
        // type checker happy without a non-null assertion.
        const markerEnd = spec ? markerEndUrl(spec.marker, color) : null;
        return h('path', {
          key: routed.linkId,
          'data-link-id': routed.linkId,
          class: 'cx-gantt-link',
          d: routed.pathD,
          stroke: color,
          'stroke-width': t.linkStrokeWidth,
          fill: 'none',
          ...(markerEnd !== null ? { 'marker-end': markerEnd } : {}),
        });
      });

      // Build `<defs>` containing one `<marker>` per (markerType × color)
      // pair plus one `<marker>` per (customMarkerId × color). Colors
      // come from the chart-level default plus any per-link override
      // present in routedLinks; built-in marker types are emitted in
      // full so a `LinkSpec.marker` of any kind resolves to a def even
      // if the demo currently uses only one. Custom markers in `links`
      // get their own defs.
      const usedColors = new Set<string>();
      usedColors.add(t.linkDefaultColor);
      for (const routed of routedLinks.value) {
        if (routed.color !== undefined) usedColors.add(routed.color);
      }
      const customMarkerById = new Map<string, CustomLinkMarker>();
      for (const link of props.links) {
        if (typeof link.marker === 'object') {
          customMarkerById.set(link.marker.id, link.marker);
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

      // Phase 21: today-line under bars. Drawn BEFORE the bars group so
      // bars paint on top (matches parity-reference behavior where the
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
          },
          onPointerdown,
          onPointermove,
          onPointerup,
          onPointercancel,
        },
        [
          h('defs', { class: 'cx-gantt-defs' }, defsChildren),
          ...(todayLineBodyNode ? [todayLineBodyNode] : []),
          h('g', { class: 'cx-gantt-bars' }, barChildren),
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
        sidebarHeader = h(
          'div',
          {
            class: 'cx-gantt-sidebar-header',
            style: {
              position: 'sticky',
              top: '0',
              left: '0',
              zIndex: 3,
              background: t.sidebarBackground,
              borderBottom: `1px solid ${t.sidebarHeaderDivider}`,
              boxSizing: 'border-box',
              // Phase 14: explicit grid placement (column 1 of 3,
              // header row).
              gridColumn: '1',
              gridRow: '1',
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
        sidebarBody = h(
          'div',
          {
            class: 'cx-gantt-sidebar-body',
            style: {
              position: 'sticky',
              left: '0',
              zIndex: 1,
              background: t.sidebarBackground,
              // Phase 14: explicit grid placement (column 1 of 3,
              // body row).
              gridColumn: '1',
              gridRow: '2',
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
            // Sticky-left so the divider stays visible during horizontal
            // scroll of the chart area — matches the sidebar-body's
            // sticky-left plane.
            position: 'sticky',
            left: `${sidebarWidth}px`,
            top: '0',
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
      const wrapperStyle: Record<string, string> = hasSidebar
        ? {
            overflow: 'auto',
            display: 'grid',
            gridTemplateColumns: `${sidebarWidth}px ${SIDEBAR_DIVIDER_WIDTH}px auto`,
          }
        : { overflow: 'auto' };
      return h(
        'div',
        {
          ref: wrapperRef,
          class: 'cx-gantt-wrapper',
          'data-axis-view': a.viewId,
          style: wrapperStyle,
        },
        hasSidebar
          ? [sidebarHeader, headerSvg, sidebarBody, bodySvg, divider]
          : [headerSvg, bodySvg],
      );
    };
  },
});

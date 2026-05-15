import { defaultLinkRouter } from '@chronixjs/gantt';
import { computed, defineComponent, h, ref, watchEffect, type PropType } from 'vue';

import { useGanttLayout } from './use-gantt-layout.js';
import {
  useGanttPointer,
  type BarDropPayload,
  type BarProgressPayload,
  type BarResizePayload,
  type SelectPayload,
} from './use-gantt-pointer.js';

import type {
  AxisRangePlanInput,
  BarSpec,
  CustomLinkMarker,
  LinkMarker,
  LinkSpec,
  RowSpec,
  TimeRange,
} from '@chronixjs/gantt';

/**
 * Stroke width for dependency-line paths. Matches the parity-reference
 * verbatim. Not a prop in v0 — consumers who need a different width can
 * add it when there's a concrete use case.
 */
const LINK_STROKE_WIDTH = 1.5;

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
     * Chart-level default stroke color for dependency lines. Each link
     * can override via `LinkSpec.colorOverride`. Default `'#3788d8'`
     * matches the parity reference's `dependencyLineColor`.
     */
    defaultLinkColor: { type: String, default: '#3788d8' },
  },
  emits: {
    'bar-drop': (_payload: BarDropPayload) => true,
    'bar-resize': (_payload: BarResizePayload) => true,
    select: (_payload: SelectPayload) => true,
    'bar-progress': (_payload: BarProgressPayload) => true,
    'link-orphan': (_linkId: string) => true,
  },
  setup(props, { emit }) {
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
      onBarDrop: (p) => emit('bar-drop', p),
      onBarResize: (p) => emit('bar-resize', p),
      onSelect: (p) => emit('select', p),
      onBarProgress: (p) => emit('bar-progress', p),
    });

    // The body SVG owns pointer interactions. The header SVG has no
    // handlers — axis-row clicks reach no listener and silently no-op.
    const bodySvgRef = ref<SVGSVGElement | null>(null);

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
      pointer.advance(pos.x, pos.y);
    }

    function onPointerup(e: PointerEvent): void {
      if (!pointer.activeTransaction.value) return;
      pointer.commit();
      bodySvgRef.value?.releasePointerCapture?.(e.pointerId);
    }

    function onPointercancel(e: PointerEvent): void {
      if (!pointer.activeTransaction.value) return;
      // Browser-initiated cancellation (touch interruption, focus stolen,
      // OS gesture). Drop the in-flight transaction without firing a
      // commit callback — the user's intent is lost, not finalized.
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
                fill: '#f9fafb',
                stroke: '#d1d5db',
              }),
              h(
                'text',
                {
                  key: `header-cell-label-${rowIdx}-${cellIdx}`,
                  class: 'cx-gantt-header-cell-label',
                  x: cell.x + cell.width / 2,
                  y: rowY + hrh / 2 + 4,
                  'text-anchor': 'middle',
                  fill: '#374151',
                  'font-size': 11,
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
            stroke: '#d1d5db',
          }),
          h(
            'text',
            {
              key: `tick-label-${tick.x}`,
              class: 'cx-gantt-tick-label',
              x: tick.x + 2,
              y: hh - 6,
              fill: '#6b7280',
              'font-size': 10,
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
            stroke: '#9ca3af',
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
            background: '#ffffff',
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

        const nodes: ReturnType<typeof h>[] = [
          h('rect', {
            key: bar.barId,
            'data-bar-id': bar.barId,
            class: 'cx-gantt-bar',
            x: renderX,
            y: renderY,
            width: renderWidth,
            height: bar.height,
          }),
        ];
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
        const sourceBar = props.bars.find((b) => b.id === bar.barId);
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
              fill: '#10b981',
              'fill-opacity': 0.35,
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
              fill: '#059669',
              stroke: '#ffffff',
              'stroke-width': 1,
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
                  fill: '#064e3b',
                  'font-size': 11,
                  'font-weight': 600,
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
        const color = routed.color ?? props.defaultLinkColor;
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
          'stroke-width': LINK_STROKE_WIDTH,
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
      usedColors.add(props.defaultLinkColor);
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

      const bodySvg = h(
        'svg',
        {
          ref: bodySvgRef,
          class: 'cx-gantt-body',
          width: totalWidth,
          height: bodyHeight,
          style: { display: 'block' },
          onPointerdown,
          onPointermove,
          onPointerup,
          onPointercancel,
        },
        [
          h('defs', { class: 'cx-gantt-defs' }, defsChildren),
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
      const hasSidebar = cols.length > 0;
      let sidebarHeader: ReturnType<typeof h> | null = null;
      let sidebarBody: ReturnType<typeof h> | null = null;
      let sidebarWidth = 0;
      if (hasSidebar) {
        sidebarWidth = cols.reduce((sum, c) => sum + c.width, 0);

        const colGroup = h(
          'colgroup',
          null,
          cols.map((c) => h('col', { key: c.key, style: { width: `${c.width}px` } })),
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
              background: '#ffffff',
              borderBottom: '1px solid #9ca3af',
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
                colGroup,
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
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#374151',
                            borderRight: '1px solid #d1d5db',
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
              background: '#ffffff',
            },
          },
          [
            h('table', { style: tableStyle, cellpadding: 0, cellspacing: 0 }, [
              colGroup,
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
                            fontSize: '12px',
                            fontWeight: isMerged ? 600 : 400,
                            color: '#1f2937',
                            borderRight: '1px solid #e5e7eb',
                            borderBottom: '1px solid #e5e7eb',
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
      // Without a sidebar: a block div with one child column (header + body
      // stacked) — same as Phase 4.5. With a sidebar: a 2×2 CSS grid
      // (sidebar-header | chart-header / sidebar-body | chart-body). The
      // right column track is `auto` (NOT `1fr`) so the grid's intrinsic
      // width = sidebarWidth + max(content) — the wrapper's `overflow: auto`
      // then sees the chart's natural width and engages horizontal scroll
      // exactly as it did pre-sidebar. Consumers cap the wrapper's height
      // (e.g. `max-height: 70vh`) to engage the vertical scroll for sticky.
      const wrapperStyle: Record<string, string> = hasSidebar
        ? {
            overflow: 'auto',
            display: 'grid',
            gridTemplateColumns: `${sidebarWidth}px auto`,
          }
        : { overflow: 'auto' };
      return h(
        'div',
        {
          class: 'cx-gantt-wrapper',
          'data-axis-view': a.viewId,
          style: wrapperStyle,
        },
        hasSidebar ? [sidebarHeader, headerSvg, sidebarBody, bodySvg] : [headerSvg, bodySvg],
      );
    };
  },
});

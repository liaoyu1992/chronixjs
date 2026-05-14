import { computed, defineComponent, h, ref, type PropType } from 'vue';

import { useGanttLayout } from './use-gantt-layout.js';
import {
  useGanttPointer,
  type BarDropPayload,
  type BarProgressPayload,
  type BarResizePayload,
  type SelectPayload,
} from './use-gantt-pointer.js';

import type { AxisRangePlanInput, BarSpec, RowSpec, TimeRange } from '@chronixjs/gantt';

/**
 * Minimum-viable renderer over `useGanttLayout` + `useGanttPointer`.
 *
 * The root is a `<div class="cx-gantt-wrapper">` hosting two SVG
 * children: a `<svg class="cx-gantt-header">` carrying the header-row
 * cells (e.g. month bands) stacked on top of the tick row, and a
 * `<svg class="cx-gantt-body">` carrying the bar area. Pointer handlers
 * live on the body SVG only — header clicks have no handler, so they
 * silently no-op. The split surfaces let the wrapper become a single
 * `overflow:auto` scroll container with the header pinned via
 * `position: sticky` (landed in the follow-up commit).
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
  },
  emits: {
    'bar-drop': (_payload: BarDropPayload) => true,
    'bar-resize': (_payload: BarResizePayload) => true,
    select: (_payload: SelectPayload) => true,
    'bar-progress': (_payload: BarProgressPayload) => true,
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

    const pointer = useGanttPointer({
      placedBars,
      strips,
      axis,
      barRanges,
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
      // while sliding under the band. `z-index: 1` keeps the header
      // painted above the body in the (very unlikely) case that the body
      // SVG overflows its own box upward.
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
            zIndex: 1,
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
            renderY = bar.y + activeTxn.deltaY;
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
        [h('g', { class: 'cx-gantt-bars' }, barChildren)],
      );

      // The wrapper is the scroll container that anchors the sticky
      // header. Consumers constrain its height (e.g. `max-height: 70vh`
      // via class CSS) to actually engage the scroll; with no height
      // cap the wrapper grows to fit the body and no scroll engages.
      return h(
        'div',
        {
          class: 'cx-gantt-wrapper',
          'data-axis-view': a.viewId,
          style: { overflow: 'auto' },
        },
        [headerSvg, bodySvg],
      );
    };
  },
});

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
 * Minimum-viable SVG renderer over `useGanttLayout` + `useGanttPointer`.
 *
 * Renders, in this order: zero or more `headerRows` (each row's cells
 * span their `cell.x .. cell.x + cell.width` range, e.g. month names
 * for season/halfYear/year views); the tick row (one line + label per
 * `axis.ticks` entry); and the bar area (`<rect class="cx-gantt-bar"
 * data-bar-id>` per placed bar). Bars are translated down by the total
 * header-band height so their layout y matches `BarPlacementPass`
 * output. When `editable=true` the bar's body becomes drag-able and its
 * 8-px edges resize-able; when `selectable=true` empty-row pointer
 * drags emit a `select` event.
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
     * height is `axis.headerRows.length × headerRowHeight + headerHeight`;
     * bars are translated down by that. 0 hides every header row (useful
     * for views where only the tick row matters).
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

    const svgRef = ref<SVGSVGElement | null>(null);

    // Total header-band height: outer header rows (e.g. month bands)
    // stacked on top of the inner tick row. Bars are rendered inside a
    // `<g transform="translate(0, headerBandHeight)">`, so SVG-y
    // `headerBandHeight` corresponds to content-y `0`. Pointer math
    // subtracts the same amount to keep the hit-tester operating in the
    // bar group's coordinate space, unchanged from before the band.
    const headerBandHeight = computed(
      () => axis.value.headerRows.length * props.headerRowHeight + props.headerHeight,
    );

    function toContentXY(e: PointerEvent): { x: number; y: number } | null {
      const svg = svgRef.value;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - headerBandHeight.value,
      };
    }

    function onPointerdown(e: PointerEvent): void {
      if (e.button !== 0) return; // primary mouse / touch only
      const pos = toContentXY(e);
      if (!pos) return;
      // Clicks on the axis-tick band have content-y < 0; they never start
      // a transaction. Without this guard the hit-tester would test
      // against negative y and (incidentally) miss everything, but the
      // explicit early-return makes the contract obvious.
      if (pos.y < 0) return;
      pointer.begin(pos.x, pos.y);
      // If a transaction actually started, capture the pointer so move /
      // up events keep flowing even if the cursor leaves the SVG bounds.
      if (pointer.activeTransaction.value && svgRef.value) {
        svgRef.value.setPointerCapture?.(e.pointerId);
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
      svgRef.value?.releasePointerCapture?.(e.pointerId);
    }

    return () => {
      const a = axis.value;
      const hh = props.headerHeight;
      const hrh = props.headerRowHeight;
      const headerRowsHeight = a.headerRows.length * hrh;
      const totalHeaderBandHeight = headerRowsHeight + hh;

      // Outer header rows (e.g. month bands above day ticks). One <rect>
      // per cell as the band background + a centered <text> for the label.
      // Rendered first so the tick row + bars draw on top of cell strokes
      // at shared edges.
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

      return h(
        'svg',
        {
          ref: svgRef,
          class: 'cx-gantt',
          width: contentSize.value.width,
          height: contentSize.value.height + totalHeaderBandHeight,
          'data-axis-view': a.viewId,
          onPointerdown,
          onPointermove,
          onPointerup,
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
          h(
            'g',
            {
              class: 'cx-gantt-bars',
              transform: `translate(0, ${totalHeaderBandHeight})`,
            },
            placedBars.value.flatMap((bar) => {
              const nodes: ReturnType<typeof h>[] = [
                h('rect', {
                  key: bar.barId,
                  'data-bar-id': bar.barId,
                  class: 'cx-gantt-bar',
                  x: bar.x,
                  y: bar.y,
                  width: bar.width,
                  height: bar.height,
                }),
              ];
              // Progress fill + handle: only for bars that declared
              // BOTH `progress` AND `pointerOverlayId`. Progress fill is
              // a translucent overlay from bar start to the progress-x;
              // the handle is a small square the user can grab.
              const progress = barProgressById.value.get(bar.barId);
              const overlayId = overlayIdByBarId.value.get(bar.barId);
              if (progress !== undefined && overlayId !== undefined) {
                const clamped = Math.max(0, Math.min(100, progress));
                const fillWidth = (clamped / 100) * bar.width;
                const handleX = bar.x + fillWidth;
                const handleSize = props.progressHandleSize;
                nodes.push(
                  h('rect', {
                    key: `${bar.barId}-progress-fill`,
                    'data-progress-bar-id': bar.barId,
                    class: 'cx-gantt-progress-fill',
                    x: bar.x,
                    y: bar.y,
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
                    y: bar.y + bar.height / 2 - handleSize / 2,
                    width: handleSize,
                    height: handleSize,
                    fill: '#059669',
                    stroke: '#ffffff',
                    'stroke-width': 1,
                    // The hit-tester drives this off the bar-rect map;
                    // we keep DOM pointer-events off so the SVG's
                    // pointerdown handler resolves through the parent
                    // group (matches the separate-layer pattern).
                    'pointer-events': 'none',
                  }),
                );
              }
              return nodes;
            }),
          ),
        ],
      );
    };
  },
});

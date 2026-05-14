import { computed, defineComponent, h, ref, type PropType } from 'vue';

import { useGanttLayout } from './use-gantt-layout.js';
import {
  useGanttPointer,
  type BarDropPayload,
  type BarResizePayload,
  type SelectPayload,
} from './use-gantt-pointer.js';

import type { AxisRangePlanInput, BarSpec, RowSpec, TimeRange } from '@chronixjs/gantt';

/**
 * Minimum-viable SVG renderer over `useGanttLayout` + `useGanttPointer`.
 *
 * Renders a top axis-tick header band followed by one
 * `<rect class="cx-gantt-bar" data-bar-id>` per placed bar inside a
 * single `<svg class="cx-gantt">` root. When `editable=true` the bar's
 * body becomes drag-able and its 8-px edges resize-able; when
 * `selectable=true` empty-row pointer drags emit a `select` event.
 * Commit results surface through the three component events.
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
     * Height of the axis-tick header band at the top of the SVG, in
     * logical pixels. Bars are translated down by this amount; the SVG
     * itself grows by this amount so the bar area's content space is
     * unchanged. 0 hides the band entirely.
     */
    headerHeight: { type: Number, default: 24 },
    /** Enable bar drag + edge resize. */
    editable: { type: Boolean, default: false },
    /** Enable calendar range-select on empty rows. */
    selectable: { type: Boolean, default: false },
    /** Snap drag/resize/select time-delta to this multiple of ms. Default no snap. */
    snapDurationMs: { type: Number, default: 0 },
  },
  emits: {
    'bar-drop': (_payload: BarDropPayload) => true,
    'bar-resize': (_payload: BarResizePayload) => true,
    select: (_payload: SelectPayload) => true,
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

    const pointer = useGanttPointer({
      placedBars,
      strips,
      axis,
      barRanges,
      editable: () => props.editable,
      selectable: () => props.selectable,
      // 0 is treated as "no snap" by the commit layer — pass through verbatim.
      snapDurationMs: () => props.snapDurationMs,
      onBarDrop: (p) => emit('bar-drop', p),
      onBarResize: (p) => emit('bar-resize', p),
      onSelect: (p) => emit('select', p),
    });

    const svgRef = ref<SVGSVGElement | null>(null);

    // Bars are rendered inside a `<g transform="translate(0, headerHeight)">`,
    // so SVG-y `headerHeight` corresponds to content-y `0`. Pointer math
    // subtracts `headerHeight` to keep the hit-tester operating in the
    // bar group's content space, unchanged from before the axis band.
    function toContentXY(e: PointerEvent): { x: number; y: number } | null {
      const svg = svgRef.value;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - props.headerHeight,
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
      const axisChildren = [];
      for (const tick of a.ticks) {
        axisChildren.push(
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
        axisChildren.push(
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
          height: contentSize.value.height + hh,
          'data-axis-view': a.viewId,
          onPointerdown,
          onPointermove,
          onPointerup,
        },
        [
          h('g', { class: 'cx-gantt-axis' }, axisChildren),
          h(
            'g',
            {
              class: 'cx-gantt-bars',
              transform: `translate(0, ${hh})`,
            },
            placedBars.value.map((bar) =>
              h('rect', {
                key: bar.barId,
                'data-bar-id': bar.barId,
                class: 'cx-gantt-bar',
                x: bar.x,
                y: bar.y,
                width: bar.width,
                height: bar.height,
              }),
            ),
          ),
        ],
      );
    };
  },
});

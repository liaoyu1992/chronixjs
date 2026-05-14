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
 * Renders one `<rect class="cx-gantt-bar" data-bar-id>` per placed bar
 * inside a single `<svg class="cx-gantt">` root, sized from
 * `contentSize`. When `editable=true` the bar's body becomes drag-able
 * and its 8-px edges resize-able; when `selectable=true` empty-row
 * pointer drags emit a `select` event. Commit results surface through
 * the three component events.
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

    function toContentXY(e: PointerEvent): { x: number; y: number } | null {
      const svg = svgRef.value;
      if (!svg) return null;
      const rect = svg.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onPointerdown(e: PointerEvent): void {
      if (e.button !== 0) return; // primary mouse / touch only
      const pos = toContentXY(e);
      if (!pos) return;
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

    return () =>
      h(
        'svg',
        {
          ref: svgRef,
          class: 'cx-gantt',
          width: contentSize.value.width,
          height: contentSize.value.height,
          'data-axis-view': axis.value.viewId,
          onPointerdown,
          onPointermove,
          onPointerup,
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
      );
  },
});

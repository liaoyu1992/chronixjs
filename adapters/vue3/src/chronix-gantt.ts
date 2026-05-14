import { defineComponent, h, type PropType } from 'vue';

import { useGanttLayout } from './use-gantt-layout.js';

import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';

/**
 * Minimum-viable SVG renderer over `useGanttLayout`. Renders one
 * `<rect class="cx-gantt-bar">` per placed bar, sized to the layout's
 * `{ x, y, width, height }`. No interactions, no scroll virtualization,
 * no progress overlay yet — those land in Phase 4.x adapter commits.
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
  },
  setup(props) {
    const { axis, placedBars, contentSize } = useGanttLayout({
      bars: () => props.bars,
      rows: () => props.rows,
      axisInput: () => props.axisInput,
      barHeight: () => props.barHeight,
      barVerticalPadding: () => props.barVerticalPadding,
      rowSpacing: () => props.rowSpacing,
      defaultRowHeight: () => props.defaultRowHeight,
    });

    return () =>
      h(
        'svg',
        {
          class: 'cx-gantt',
          width: contentSize.value.width,
          height: contentSize.value.height,
          'data-axis-view': axis.value.viewId,
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

import {
  defaultHeatmapProps,
  ensureChronixHeatmapStyles,
  findHeatmapValueRange,
  interpolateHeatmapColor,
  resolveHeatmapClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

export const ChronixHeatmap = defineComponent({
  name: 'ChronixHeatmap',
  props: {
    cells: {
      type: Array as PropType<readonly (readonly number[])[]>,
      default: (): readonly (readonly number[])[] => defaultHeatmapProps.cells,
    },
    cellSize: { type: Number, default: defaultHeatmapProps.cellSize },
    colorLow: { type: String, default: defaultHeatmapProps.colorLow },
    colorHigh: { type: String, default: defaultHeatmapProps.colorHigh },
  },
  setup(props) {
    ensureChronixHeatmapStyles();
    const resolvedProps = computed(() => ({
      cells: props.cells,
      cellSize: props.cellSize,
      colorLow: props.colorLow,
      colorHigh: props.colorHigh,
    }));
    return () => {
      const classList = resolveHeatmapClassList(resolvedProps.value);
      const cells = resolvedProps.value.cells;
      const cols = cells.length > 0 ? Math.max(...cells.map((r) => r.length)) : 0;
      const rows = cells.length;
      const { min, max } = findHeatmapValueRange(cells);
      const rects: VNode[] = [];
      for (let r = 0; r < rows; r += 1) {
        const row = cells[r]!;
        for (let c = 0; c < row.length; c += 1) {
          const v = row[c]!;
          const fill = interpolateHeatmapColor(
            v,
            min,
            max,
            resolvedProps.value.colorLow,
            resolvedProps.value.colorHigh,
          );
          rects.push(
            h('rect', {
              key: `${r}-${c}`,
              class: 'cx-ui-heatmap__cell',
              x: c * resolvedProps.value.cellSize,
              y: r * resolvedProps.value.cellSize,
              width: resolvedProps.value.cellSize,
              height: resolvedProps.value.cellSize,
              fill,
            }),
          );
        }
      }
      return h(
        'svg',
        {
          class: classList,
          width: cols * resolvedProps.value.cellSize,
          height: rows * resolvedProps.value.cellSize,
        },
        rects,
      );
    };
  },
});

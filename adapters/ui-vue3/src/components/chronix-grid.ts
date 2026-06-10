import {
  defaultGridProps,
  ensureChronixGridStyles,
  resolveGridClassList,
  resolveGridGap,
  resolveGridTracks,
  type GridProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type CSSProperties, type PropType } from 'vue';

/**
 * `<ChronixGrid>` — Vue 3 SFC wrapping the core `GridProps` IR.
 *
 * Phase 17 (2026-06-02). CSS Grid 2D layout container. Numeric
 * `cols` maps to `repeat(N, minmax(0, 1fr))`; string `cols` passes
 * verbatim to `grid-template-columns`. Per-axis gap via `xGap` /
 * `yGap` numeric pixel props.
 */
export const ChronixGrid = defineComponent({
  name: 'ChronixGrid',
  props: {
    cols: {
      type: [Number, String] as PropType<number | string | undefined>,
      default: defaultGridProps.cols,
    },
    xGap: {
      type: Number as PropType<number | undefined>,
      default: defaultGridProps.xGap,
    },
    yGap: {
      type: Number as PropType<number | undefined>,
      default: defaultGridProps.yGap,
    },
    inline: {
      type: Boolean,
      default: defaultGridProps.inline,
    },
  },
  setup(props, { slots }) {
    ensureChronixGridStyles();

    const resolvedProps = computed<GridProps>(() => ({
      cols: props.cols,
      xGap: props.xGap,
      yGap: props.yGap,
      inline: props.inline,
    }));

    return () => {
      const classList = resolveGridClassList(resolvedProps.value);
      const style: CSSProperties = {};
      const tracks = resolveGridTracks(resolvedProps.value.cols);
      if (tracks !== undefined) style.gridTemplateColumns = tracks;
      const { columnGap, rowGap } = resolveGridGap(
        resolvedProps.value.xGap,
        resolvedProps.value.yGap,
      );
      if (columnGap !== undefined) style.columnGap = columnGap;
      if (rowGap !== undefined) style.rowGap = rowGap;
      const defaultSlot = slots['default'];
      return h('div', { class: classList, style }, defaultSlot ? defaultSlot() : []);
    };
  },
});

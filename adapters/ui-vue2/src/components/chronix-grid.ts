import {
  defaultGridProps,
  ensureChronixGridStyles,
  resolveGridClassList,
  resolveGridGap,
  resolveGridTracks,
  type GridProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType } from 'vue';

/**
 * `<ChronixGrid>` — Vue 2.7 port of the Phase 17 Grid.
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
      const style: Record<string, string> = {};
      const tracks = resolveGridTracks(resolvedProps.value.cols);
      if (tracks !== undefined) style['grid-template-columns'] = tracks;
      const { columnGap, rowGap } = resolveGridGap(
        resolvedProps.value.xGap,
        resolvedProps.value.yGap,
      );
      if (columnGap !== undefined) style['column-gap'] = columnGap;
      if (rowGap !== undefined) style['row-gap'] = rowGap;
      const defaultSlot = slots['default'];
      return h('div', { class: classList, style }, defaultSlot ? defaultSlot() : []);
    };
  },
});

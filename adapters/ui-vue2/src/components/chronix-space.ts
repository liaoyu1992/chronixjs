import {
  defaultSpaceProps,
  ensureChronixSpaceStyles,
  resolveSpaceClassList,
  resolveSpaceGap,
  type SpaceAlign,
  type SpaceJustify,
  type SpaceProps,
  type SpaceSize,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType } from 'vue';

/**
 * `<ChronixSpace>` — Vue 2.7 port of the Phase 17 Space.
 */
export const ChronixSpace = defineComponent({
  name: 'ChronixSpace',
  props: {
    size: {
      type: [String, Number] as PropType<SpaceSize | number>,
      default: defaultSpaceProps.size,
    },
    vertical: {
      type: Boolean,
      default: defaultSpaceProps.vertical,
    },
    wrap: {
      type: Boolean,
      default: defaultSpaceProps.wrap,
    },
    align: {
      type: String as PropType<SpaceAlign | undefined>,
      default: defaultSpaceProps.align,
    },
    justify: {
      type: String as PropType<SpaceJustify | undefined>,
      default: defaultSpaceProps.justify,
    },
    inline: {
      type: Boolean,
      default: defaultSpaceProps.inline,
    },
  },
  setup(props, { slots }) {
    ensureChronixSpaceStyles();

    const resolvedProps = computed<SpaceProps>(() => ({
      size: props.size,
      vertical: props.vertical,
      wrap: props.wrap,
      align: props.align,
      justify: props.justify,
      inline: props.inline,
    }));

    return () => {
      const classList = resolveSpaceClassList(resolvedProps.value);
      const style: Record<string, string> = {
        gap: resolveSpaceGap(resolvedProps.value.size),
      };
      const defaultSlot = slots['default'];
      return h('div', { class: classList, style }, defaultSlot ? defaultSlot() : []);
    };
  },
});

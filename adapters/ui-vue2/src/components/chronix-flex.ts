import {
  defaultFlexProps,
  ensureChronixFlexStyles,
  resolveFlexClassList,
  resolveFlexGap,
  type FlexAlign,
  type FlexDirection,
  type FlexGap,
  type FlexJustify,
  type FlexProps,
  type FlexWrap,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType } from 'vue';

/**
 * `<ChronixFlex>` — Vue 2.7 port of the Flex.
 */
export const ChronixFlex = defineComponent({
  name: 'ChronixFlex',
  props: {
    direction: {
      type: String as PropType<FlexDirection>,
      default: defaultFlexProps.direction,
    },
    wrap: {
      type: String as PropType<FlexWrap>,
      default: defaultFlexProps.wrap,
    },
    align: {
      type: String as PropType<FlexAlign | undefined>,
      default: defaultFlexProps.align,
    },
    justify: {
      type: String as PropType<FlexJustify | undefined>,
      default: defaultFlexProps.justify,
    },
    gap: {
      type: [String, Number] as PropType<FlexGap | undefined>,
      default: defaultFlexProps.gap,
    },
    inline: {
      type: Boolean,
      default: defaultFlexProps.inline,
    },
  },
  setup(props, { slots }) {
    ensureChronixFlexStyles();

    const resolvedProps = computed<FlexProps>(() => ({
      direction: props.direction,
      wrap: props.wrap,
      align: props.align,
      justify: props.justify,
      gap: props.gap,
      inline: props.inline,
    }));

    return () => {
      const classList = resolveFlexClassList(resolvedProps.value);
      const style: Record<string, string> = {};
      const gap = resolveFlexGap(resolvedProps.value.gap);
      if (gap !== undefined) style['gap'] = gap;
      const defaultSlot = slots['default'];
      return h('div', { class: classList, style }, defaultSlot ? defaultSlot() : []);
    };
  },
});

import {
  buildGradientTextBackground,
  defaultGradientTextProps,
  ensureChronixGradientTextStyles,
  resolveGradientTextClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType } from 'vue';

export const ChronixGradientText = defineComponent({
  name: 'ChronixGradientText',
  props: {
    value: { type: String, default: defaultGradientTextProps.value },
    colors: {
      type: Array as unknown as PropType<readonly [string, string]>,
      default: () => defaultGradientTextProps.colors,
    },
    direction: { type: Number, default: defaultGradientTextProps.direction },
  },
  setup(props) {
    ensureChronixGradientTextStyles();
    const resolvedProps = computed(() => ({
      value: props.value,
      colors: props.colors,
      direction: props.direction,
    }));
    return () => {
      const classList = resolveGradientTextClassList(resolvedProps.value);
      const style = { background: buildGradientTextBackground(resolvedProps.value) };
      return h('span', { class: classList, style }, resolvedProps.value.value);
    };
  },
});

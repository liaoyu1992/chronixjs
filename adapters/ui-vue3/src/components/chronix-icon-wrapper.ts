import {
  defaultIconWrapperProps,
  ensureChronixIconWrapperStyles,
  resolveIconWrapperClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type StyleValue, type VNode } from 'vue';

export const ChronixIconWrapper = defineComponent({
  name: 'ChronixIconWrapper',
  props: {
    size: { type: Number, default: defaultIconWrapperProps.size },
    color: {
      type: String as PropType<string | undefined>,
      default: defaultIconWrapperProps.color,
    },
  },
  setup(props, { slots }) {
    ensureChronixIconWrapperStyles();
    const resolvedProps = computed(() => ({ size: props.size, color: props.color }));
    return () => {
      const classList = resolveIconWrapperClassList(resolvedProps.value);
      const style: StyleValue = {
        width: `${resolvedProps.value.size}px`,
        height: `${resolvedProps.value.size}px`,
      };
      if (resolvedProps.value.color !== undefined) {
        (style as Record<string, string>)['color'] = resolvedProps.value.color;
      }
      const defaultSlot = slots['default'];
      const children: VNode[] = defaultSlot ? defaultSlot() : [];
      return h('span', { class: classList, style }, children);
    };
  },
});

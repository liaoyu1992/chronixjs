import {
  defaultButtonGroupProps,
  ensureChronixButtonGroupStyles,
  resolveButtonGroupClassList,
  type ButtonSize,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

export const ChronixButtonGroup = defineComponent({
  name: 'ChronixButtonGroup',
  props: {
    vertical: { type: Boolean, default: defaultButtonGroupProps.vertical },
    size: {
      type: String as PropType<ButtonSize | undefined>,
      default: defaultButtonGroupProps.size,
    },
  },
  setup(props, { slots }) {
    ensureChronixButtonGroupStyles();
    const resolvedProps = computed(() => ({ vertical: props.vertical, size: props.size }));
    return () => {
      const classList = resolveButtonGroupClassList(resolvedProps.value);
      const defaultSlot = slots['default'];
      const children: VNode[] = defaultSlot ? defaultSlot() : [];
      return h('div', { class: classList, role: 'group' }, children);
    };
  },
});

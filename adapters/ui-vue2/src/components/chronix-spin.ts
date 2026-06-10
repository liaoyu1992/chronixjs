import {
  defaultSpinProps,
  ensureChronixSpinStyles,
  resolveSpinClassList,
  type SpinProps,
  type SpinSize,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

import { useUIContext } from '../composables/use-ui-context.js';

/**
 * `<ChronixSpin>` — Vue 2.7 port of the Phase 16 Spin. Verbatim
 * surface mirror of vue3 sibling; runtime difference is the `attrs:`
 * data-object for the indicator's `role` + `aria-label`.
 */
export const ChronixSpin = defineComponent({
  name: 'ChronixSpin',
  props: {
    size: {
      type: String as PropType<SpinSize | undefined>,
      default: undefined,
    },
    show: {
      type: Boolean,
      default: defaultSpinProps.show,
    },
    description: {
      type: String as PropType<string | undefined>,
      default: defaultSpinProps.description,
    },
  },
  setup(props) {
    ensureChronixSpinStyles();
    const ctx = useUIContext();

    const resolvedProps = computed<SpinProps>(() => ({
      size: props.size ?? ctx.value.size,
      show: props.show,
      description: props.description,
    }));

    return () => {
      const classList = resolveSpinClassList(resolvedProps.value);
      const children: VNode[] = [
        h('div', {
          class: 'cx-ui-spin__indicator',
          attrs: {
            role: 'status',
            'aria-label': resolvedProps.value.description ?? 'loading',
          },
        }),
      ];
      if (resolvedProps.value.description !== undefined) {
        children.push(
          h('div', { class: 'cx-ui-spin__description' }, resolvedProps.value.description),
        );
      }
      return h('div', { class: classList }, children);
    };
  },
});

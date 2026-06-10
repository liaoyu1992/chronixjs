import {
  defaultEquationProps,
  ensureChronixEquationStyles,
  resolveEquationClassList,
  type EquationDisplay,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType } from 'vue';

export const ChronixEquation = defineComponent({
  name: 'ChronixEquation',
  props: {
    value: { type: String, default: defaultEquationProps.value },
    display: {
      type: String as PropType<EquationDisplay>,
      default: defaultEquationProps.display,
    },
  },
  setup(props) {
    ensureChronixEquationStyles();
    const resolvedProps = computed(() => ({ value: props.value, display: props.display }));
    return () => {
      const classList = resolveEquationClassList(resolvedProps.value);
      return h('math', {
        class: classList,
        display: resolvedProps.value.display,
        innerHTML: resolvedProps.value.value,
      });
    };
  },
});

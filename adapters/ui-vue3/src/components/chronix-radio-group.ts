import {
  defaultRadioGroupProps,
  ensureChronixRadioStyles,
  resolveRadioGroupClassList,
  type RadioOption,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

import { ChronixRadio } from './chronix-radio.js';

export const ChronixRadioGroup = defineComponent({
  name: 'ChronixRadioGroup',
  props: {
    value: { type: String, default: defaultRadioGroupProps.value },
    options: {
      type: Array as PropType<readonly RadioOption[]>,
      default: () => defaultRadioGroupProps.options,
    },
    disabled: { type: Boolean, default: defaultRadioGroupProps.disabled },
    error: {
      type: String as PropType<string | undefined>,
      default: defaultRadioGroupProps.error,
    },
  },
  emits: {
    'update:value': (_value: string) => true,
  },
  setup(props, { emit }) {
    ensureChronixRadioStyles();
    const classList = computed(() =>
      resolveRadioGroupClassList({
        value: props.value,
        options: props.options,
        disabled: props.disabled,
        error: props.error,
      }),
    );

    function onChange(value: string) {
      emit('update:value', value);
    }

    return () => {
      const children: VNode[] = props.options.map((opt) =>
        h(ChronixRadio, {
          key: opt.key,
          checked: opt.value === props.value,
          value: opt.value,
          label: opt.label,
          disabled: opt.disabled || props.disabled,
          onChange,
        }),
      );
      if (props.error !== undefined) {
        children.push(h('span', { class: 'cx-ui-radio-group__error' }, props.error));
      }
      return h('div', { class: classList.value, role: 'radiogroup' }, children);
    };
  },
});

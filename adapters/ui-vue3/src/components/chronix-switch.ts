import {
  defaultSwitchProps,
  ensureChronixSwitchStyles,
  resolveSwitchClassList,
  type SwitchSize,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType } from 'vue';

export const ChronixSwitch = defineComponent({
  name: 'ChronixSwitch',
  props: {
    checked: { type: Boolean, default: defaultSwitchProps.checked },
    disabled: { type: Boolean, default: defaultSwitchProps.disabled },
    size: {
      type: String as PropType<SwitchSize>,
      default: defaultSwitchProps.size,
    },
    error: {
      type: String as PropType<string | undefined>,
      default: defaultSwitchProps.error,
    },
  },
  emits: {
    'update:checked': (_checked: boolean) => true,
  },
  setup(props, { emit }) {
    ensureChronixSwitchStyles();
    const classList = computed(() =>
      resolveSwitchClassList({
        checked: props.checked,
        disabled: props.disabled,
        size: props.size,
        error: props.error,
      }),
    );

    function onClick() {
      if (props.disabled) return;
      emit('update:checked', !props.checked);
    }

    return () =>
      h(
        'button',
        {
          type: 'button',
          role: 'switch',
          'aria-checked': props.checked ? 'true' : 'false',
          'aria-disabled': props.disabled ? 'true' : undefined,
          disabled: props.disabled,
          class: classList.value,
          onClick,
        },
        [h('span', { class: 'cx-ui-switch__handle' })],
      );
  },
});

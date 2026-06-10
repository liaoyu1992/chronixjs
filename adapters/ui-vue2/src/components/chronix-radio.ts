import { defaultRadioProps, ensureChronixRadioStyles, resolveRadioClassList } from '@chronixjs/ui';
import { computed, defineComponent, h } from 'vue';

export const ChronixRadio = defineComponent({
  name: 'ChronixRadio',
  props: {
    checked: { type: Boolean, default: defaultRadioProps.checked },
    value: { type: String, default: defaultRadioProps.value },
    label: { type: String, default: defaultRadioProps.label },
    disabled: { type: Boolean, default: defaultRadioProps.disabled },
  },
  emits: {
    change: (_value: string) => true,
  },
  setup(props, { emit }) {
    ensureChronixRadioStyles();
    const classList = computed(() =>
      resolveRadioClassList({
        checked: props.checked,
        value: props.value,
        label: props.label,
        disabled: props.disabled,
      }),
    );

    function onClick() {
      if (props.disabled) return;
      emit('change', props.value);
    }

    return () =>
      h('label', { class: classList.value, on: { click: onClick } }, [
        h('span', { class: 'cx-ui-radio__circle' }),
        h('span', { class: 'cx-ui-radio__label' }, props.label),
      ]);
  },
});

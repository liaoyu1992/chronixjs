import {
  buildOtpCells,
  defaultInputOtpProps,
  ensureChronixInputOtpStyles,
  resolveInputOtpClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

export const ChronixInputOtp = defineComponent({
  name: 'ChronixInputOtp',
  props: {
    value: { type: String, default: defaultInputOtpProps.value },
    length: { type: Number, default: defaultInputOtpProps.length },
    disabled: { type: Boolean, default: defaultInputOtpProps.disabled },
    error: {
      type: String as PropType<string | undefined>,
      default: defaultInputOtpProps.error,
    },
  },
  emits: {
    'update:value': (_value: string) => true,
    complete: (_value: string) => true,
  },
  setup(props, { emit }) {
    ensureChronixInputOtpStyles();
    const classList = computed(() =>
      resolveInputOtpClassList({
        value: props.value,
        length: props.length,
        disabled: props.disabled,
        error: props.error,
      }),
    );
    const cells = computed(() => buildOtpCells(props.value, props.length));

    function commit(next: string) {
      const clamped = next.slice(0, props.length);
      emit('update:value', clamped);
      if (clamped.length === props.length) emit('complete', clamped);
    }

    function onCellInput(index: number, event: Event) {
      const target = event.target as HTMLInputElement;
      const incoming = target.value;
      const char = incoming.slice(-1);
      const arr = cells.value.slice();
      arr[index] = char;
      commit(arr.join('').replace(/\s/g, ''));
    }

    function onCellKeydown(index: number, event: KeyboardEvent) {
      if (event.key === 'Backspace' && cells.value[index] === '' && index > 0) {
        const arr = cells.value.slice();
        arr[index - 1] = '';
        commit(arr.join('').replace(/\s/g, ''));
      }
    }

    return () => {
      const children: VNode[] = cells.value.map((cell, index) =>
        h('input', {
          class: 'cx-ui-otp__cell',
          maxlength: 1,
          value: cell,
          disabled: props.disabled,
          'data-cell-index': index,
          onInput: (e: Event) => onCellInput(index, e),
          onKeydown: (e: KeyboardEvent) => onCellKeydown(index, e),
        }),
      );
      if (props.error !== undefined) {
        children.push(h('span', { class: 'cx-ui-otp__error' }, props.error));
      }
      return h('div', { class: classList.value }, children);
    };
  },
});

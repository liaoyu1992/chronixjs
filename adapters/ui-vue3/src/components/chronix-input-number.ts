import {
  clampNumberInput,
  defaultInputNumberProps,
  ensureChronixInputNumberStyles,
  formatNumberInput,
  parseNumberInput,
  resolveInputNumberClassList,
  type InputNumberSize,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

export const ChronixInputNumber = defineComponent({
  name: 'ChronixInputNumber',
  props: {
    value: {
      type: Number as PropType<number | null>,
      default: defaultInputNumberProps.value,
    },
    min: {
      type: Number as PropType<number | undefined>,
      default: defaultInputNumberProps.min,
    },
    max: {
      type: Number as PropType<number | undefined>,
      default: defaultInputNumberProps.max,
    },
    step: { type: Number, default: defaultInputNumberProps.step },
    disabled: { type: Boolean, default: defaultInputNumberProps.disabled },
    size: {
      type: String as PropType<InputNumberSize>,
      default: defaultInputNumberProps.size,
    },
    error: {
      type: String as PropType<string | undefined>,
      default: defaultInputNumberProps.error,
    },
  },
  emits: {
    'update:value': (_value: number | null) => true,
  },
  setup(props, { emit }) {
    ensureChronixInputNumberStyles();
    const classList = computed(() =>
      resolveInputNumberClassList({
        value: props.value,
        min: props.min,
        max: props.max,
        step: props.step,
        disabled: props.disabled,
        size: props.size,
        error: props.error,
      }),
    );
    const displayValue = computed(() =>
      props.value === null ? '' : formatNumberInput(props.value),
    );

    function clampCommit(next: number | null): number | null {
      if (next === null) return null;
      return clampNumberInput(next, {
        ...(props.min !== undefined ? { min: props.min } : {}),
        ...(props.max !== undefined ? { max: props.max } : {}),
        step: props.step,
      });
    }

    function step(direction: 1 | -1) {
      if (props.disabled) return;
      const base = props.value ?? 0;
      let next = base + direction * props.step;
      if (props.min !== undefined && next < props.min) next = props.min;
      if (props.max !== undefined && next > props.max) next = props.max;
      emit('update:value', next);
    }

    function onInput(event: Event) {
      const target = event.target as HTMLInputElement;
      const parsed = parseNumberInput(target.value);
      emit('update:value', parsed);
    }

    function onKeydown(event: KeyboardEvent) {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        step(-1);
      } else if (event.key === 'Enter') {
        const target = event.target as HTMLInputElement;
        const parsed = parseNumberInput(target.value);
        emit('update:value', clampCommit(parsed));
      }
    }

    return () => {
      const children: VNode[] = [
        h(
          'button',
          {
            type: 'button',
            class: 'cx-ui-input-number__decrement',
            disabled: props.disabled,
            'aria-label': 'decrement',
            onClick: () => step(-1),
          },
          '−',
        ),
        h('input', {
          class: 'cx-ui-input-number__input',
          type: 'text',
          inputmode: 'decimal',
          value: displayValue.value,
          disabled: props.disabled,
          onInput,
          onKeydown,
        }),
        h(
          'button',
          {
            type: 'button',
            class: 'cx-ui-input-number__increment',
            disabled: props.disabled,
            'aria-label': 'increment',
            onClick: () => step(1),
          },
          '+',
        ),
      ];
      if (props.error !== undefined) {
        children.push(h('span', { class: 'cx-ui-input-number__error' }, props.error));
      }
      return h('div', { class: classList.value }, children);
    };
  },
});

import {
  createDynamicInputItem,
  defaultDynamicInputProps,
  ensureChronixDynamicInputStyles,
  resolveDynamicInputClassList,
  type DynamicInputProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type VNode } from 'vue';

/**
 * `<ChronixDynamicInput>` — Vue 3 dynamic value-list component.
 * .
 *
 * Props:
 *
 * - `value` — array of values (strings by default).
 * - `min` — minimum number of items (default 0).
 * - `max` — maximum number of items (default undefined = unlimited).
 * - `disabled` — non-interactive state.
 *
 * Emits:
 *
 * - `update:value` — emitted when items are added, removed, or changed.
 */
export const ChronixDynamicInput = defineComponent({
  name: 'ChronixDynamicInput',
  inheritAttrs: false,
  props: {
    value: {
      type: Array as () => readonly unknown[],
      default: () => defaultDynamicInputProps.value,
    },
    min: {
      type: Number as () => number | undefined,
      default: defaultDynamicInputProps.min,
    },
    max: {
      type: Number as () => number | undefined,
      default: defaultDynamicInputProps.max,
    },
    disabled: {
      type: Boolean,
      default: defaultDynamicInputProps.disabled,
    },
  },
  emits: {
    'update:value': (_value: unknown[]) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixDynamicInputStyles();

    const resolvedProps = computed<DynamicInputProps>(() => ({
      value: props.value,
      min: props.min,
      max: props.max,
      disabled: props.disabled,
    }));

    const classList = computed(() =>
      resolveDynamicInputClassList({ disabled: resolvedProps.value.disabled }),
    );

    function onItemInput(index: number, event: Event): void {
      const target = event.target as HTMLInputElement;
      const next = [...props.value];
      next[index] = target.value;
      emit('update:value', next);
    }

    function onRemoveItem(index: number): void {
      const next = [...props.value];
      next.splice(index, 1);
      emit('update:value', next);
    }

    function onAddItem(): void {
      const next = [...props.value, createDynamicInputItem(props.value.length)];
      emit('update:value', next);
    }

    return () => {
      const children: VNode[] = [];

      // Render each item row
      props.value.forEach((item, index) => {
        const itemChildren: VNode[] = [
          h('input', {
            class: 'cx-ui-dynamic-input__input',
            value: String(item),
            disabled: props.disabled,
            onInput: (e: Event) => onItemInput(index, e),
          }),
        ];

        if (props.value.length > (props.min ?? 0)) {
          itemChildren.push(
            h(
              'button',
              {
                type: 'button',
                class: 'cx-ui-dynamic-input__remove',
                disabled: props.disabled,
                onClick: () => onRemoveItem(index),
              },
              '×',
            ),
          );
        }

        children.push(h('div', { class: 'cx-ui-dynamic-input__item', key: index }, itemChildren));
      });

      // Add button (if under max)
      const canAdd = props.max === undefined || props.value.length < props.max;
      if (canAdd) {
        children.push(
          h(
            'button',
            {
              type: 'button',
              class: 'cx-ui-dynamic-input__add',
              disabled: props.disabled,
              onClick: onAddItem,
            },
            '+',
          ),
        );
      }

      return h(
        'div',
        {
          class: classList.value,
          'data-testid': 'dynamic-input-root',
          ...attrs,
        },
        children,
      );
    };
  },
});

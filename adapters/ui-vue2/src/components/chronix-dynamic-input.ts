import {
  createDynamicInputItem,
  defaultDynamicInputProps,
  ensureChronixDynamicInputStyles,
  resolveDynamicInputClassList,
  type DynamicInputProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixDynamicInput>` — Vue 2.7 port of the Phase 35 DynamicInput.
 * Verbatim surface mirror of the vue3 sibling; runtime differences are
 * Vue 2's `attrs:` data-object for HTML attributes and `on:` for events.
 */
export const ChronixDynamicInput = defineComponent({
  name: 'ChronixDynamicInput',
  props: {
    value: {
      type: Array as PropType<readonly unknown[]>,
      default: () => defaultDynamicInputProps.value,
    },
    min: {
      type: Number,
      default: defaultDynamicInputProps.min,
    },
    max: {
      type: Number as PropType<number | undefined>,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: defaultDynamicInputProps.disabled,
    },
    placeholder: {
      type: String,
      default: defaultDynamicInputProps.placeholder,
    },
  },
  emits: {
    'update:value': (_value: unknown[]) => true,
    add: () => true,
    remove: (_index: number) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixDynamicInputStyles();

    const resolvedProps = computed<DynamicInputProps>(() => ({
      value: props.value,
      min: props.min,
      max: props.max,
      disabled: props.disabled,
      placeholder: props.placeholder,
    }));

    const classList = computed(() =>
      resolveDynamicInputClassList({ disabled: resolvedProps.value.disabled }),
    );

    function onInput(index: number, event: Event): void {
      const target = event.target as HTMLInputElement;
      const next = [...props.value];
      next[index] = target.value;
      emit('update:value', next);
    }

    function onRemove(index: number): void {
      const next = [...props.value];
      next.splice(index, 1);
      emit('update:value', next);
      emit('remove', index);
    }

    function onAdd(): void {
      const next = [...props.value, createDynamicInputItem(props.value.length)];
      emit('update:value', next);
      emit('add');
    }

    return () => {
      const children: VNode[] = [];
      const items = resolvedProps.value.value;
      for (let i = 0; i < items.length; i++) {
        const rowChildren: VNode[] = [
          h('input', {
            class: 'cx-ui-dynamic-input__item-input',
            attrs: {
              type: 'text',
              placeholder: resolvedProps.value.placeholder,
              disabled: resolvedProps.value.disabled,
              'data-index': i,
            },
            domProps: { value: items[i] as string },
            on: { input: (e: Event) => onInput(i, e) },
          }),
        ];
        if (items.length > (resolvedProps.value.min ?? 0)) {
          rowChildren.push(
            h(
              'button',
              {
                class: 'cx-ui-dynamic-input__remove-btn',
                attrs: { type: 'button', disabled: resolvedProps.value.disabled },
                on: { click: () => onRemove(i) },
              },
              '−',
            ),
          );
        }
        children.push(h('div', { class: 'cx-ui-dynamic-input__item-row' }, rowChildren));
      }
      if (resolvedProps.value.max === undefined || items.length < resolvedProps.value.max) {
        children.push(
          h(
            'button',
            {
              class: 'cx-ui-dynamic-input__add-btn',
              attrs: {
                type: 'button',
                disabled: resolvedProps.value.disabled,
                'data-testid': 'dynamic-input-add',
              },
              on: { click: onAdd },
            },
            '+',
          ),
        );
      }

      return h(
        'div',
        {
          class: classList.value,
          attrs: { 'data-testid': 'dynamic-input-root', ...attrs },
        },
        children,
      );
    };
  },
});

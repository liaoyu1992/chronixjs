import {
  defaultDynamicTagsProps,
  ensureChronixDynamicTagsStyles,
  resolveDynamicTagsClassList,
  type DynamicTagsProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type PropType, type VNode } from 'vue';

/**
 * `<ChronixDynamicTags>` — Vue 2.7 port of the DynamicTags.
 * Verbatim surface mirror of the vue3 sibling; runtime differences are
 * Vue 2's `attrs:` data-object for HTML attributes and `on:` for events.
 */
export const ChronixDynamicTags = defineComponent({
  name: 'ChronixDynamicTags',
  props: {
    value: {
      type: Array as PropType<readonly string[]>,
      default: () => defaultDynamicTagsProps.value,
    },
    max: {
      type: Number as PropType<number | undefined>,
      default: undefined,
    },
    closable: {
      type: Boolean,
      default: defaultDynamicTagsProps.closable,
    },
    disabled: {
      type: Boolean,
      default: defaultDynamicTagsProps.disabled,
    },
  },
  emits: {
    'update:value': (_value: string[]) => true,
    add: (_value: string) => true,
    remove: (_index: number) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixDynamicTagsStyles();

    const inputValue = ref('');

    const resolvedProps = computed<DynamicTagsProps>(() => ({
      value: props.value,
      max: props.max,
      closable: props.closable,
      disabled: props.disabled,
    }));

    const classList = computed(() =>
      resolveDynamicTagsClassList({ disabled: resolvedProps.value.disabled }),
    );

    function onRemove(index: number): void {
      const next = [...props.value];
      next.splice(index, 1);
      emit('update:value', next);
      emit('remove', index);
    }

    function onInputKeydown(event: KeyboardEvent): void {
      if (event.key !== 'Enter') return;
      const val = inputValue.value.trim();
      if (!val) return;
      if (resolvedProps.value.max !== undefined && props.value.length >= resolvedProps.value.max) {
        return;
      }
      const next = [...props.value, val];
      emit('update:value', next);
      emit('add', val);
      inputValue.value = '';
    }

    return () => {
      const children: VNode[] = [];

      for (let i = 0; i < props.value.length; i++) {
        const tagChildren: VNode[] = [
          h('span', { class: 'cx-ui-dynamic-tags__tag-text' }, props.value[i]),
        ];
        if (resolvedProps.value.closable) {
          tagChildren.push(
            h(
              'button',
              {
                class: 'cx-ui-dynamic-tags__close',
                attrs: {
                  type: 'button',
                  'aria-label': 'Remove',
                  disabled: resolvedProps.value.disabled,
                },
                on: { click: () => onRemove(i) },
              },
              '×',
            ),
          );
        }
        children.push(h('span', { class: 'cx-ui-dynamic-tags__tag' }, tagChildren));
      }

      children.push(
        h('input', {
          class: 'cx-ui-dynamic-tags__input',
          attrs: {
            type: 'text',
            disabled: resolvedProps.value.disabled,
            placeholder: 'Press Enter to add',
          },
          domProps: { value: inputValue.value },
          on: {
            input: (e: Event) => {
              inputValue.value = (e.target as HTMLInputElement).value;
            },
            keydown: onInputKeydown,
          },
        }),
      );

      return h('div', { class: classList.value, attrs: { ...attrs } }, children);
    };
  },
});

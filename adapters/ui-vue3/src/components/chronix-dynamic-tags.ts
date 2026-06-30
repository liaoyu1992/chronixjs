import {
  defaultDynamicTagsProps,
  ensureChronixDynamicTagsStyles,
  resolveDynamicTagsClassList,
  type DynamicTagsProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type VNode } from 'vue';

/**
 * `<ChronixDynamicTags>` — Vue 3 inline tag editor component.
 * .
 *
 * Props:
 *
 * - `value` — array of tag strings.
 * - `max` — maximum number of tags (default undefined = unlimited).
 * - `closable` — show close button on each tag (default true).
 * - `disabled` — non-interactive state.
 *
 * Emits:
 *
 * - `update:value` — emitted when tags are added or removed.
 */
export const ChronixDynamicTags = defineComponent({
  name: 'ChronixDynamicTags',
  inheritAttrs: false,
  props: {
    value: {
      type: Array as () => readonly string[],
      default: () => defaultDynamicTagsProps.value,
    },
    max: {
      type: Number as () => number | undefined,
      default: defaultDynamicTagsProps.max,
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

    function onRemoveTag(index: number): void {
      const next = [...props.value];
      next.splice(index, 1);
      emit('update:value', next);
    }

    function onInputKeydown(event: KeyboardEvent): void {
      if (event.key === 'Enter') {
        event.preventDefault();
        const tag = inputValue.value.trim();
        if (tag.length === 0) return;
        if (props.max !== undefined && props.value.length >= props.max) return;
        emit('update:value', [...props.value, tag]);
        inputValue.value = '';
      }
    }

    return () => {
      const children: VNode[] = [];

      // Render tags
      props.value.forEach((tag, index) => {
        const tagChildren: (string | VNode)[] = [tag];
        if (props.closable) {
          tagChildren.push(
            h(
              'button',
              {
                type: 'button',
                class: 'cx-ui-dynamic-tags__tag-close',
                disabled: props.disabled,
                onClick: () => onRemoveTag(index),
              },
              '×',
            ),
          );
        }
        children.push(h('span', { class: 'cx-ui-dynamic-tags__tag', key: index }, tagChildren));
      });

      // Input trigger
      children.push(
        h('input', {
          class: 'cx-ui-dynamic-tags__input',
          value: inputValue.value,
          disabled: props.disabled,
          placeholder: 'Add tag',
          onInput: (e: Event) => {
            inputValue.value = (e.target as HTMLInputElement).value;
          },
          onKeydown: onInputKeydown,
        }),
      );

      return h(
        'div',
        {
          class: classList.value,
          'data-testid': 'dynamic-tags-root',
          ...attrs,
        },
        children,
      );
    };
  },
});

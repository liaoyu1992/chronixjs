import {
  defaultTagProps,
  ensureChronixTagStyles,
  resolveTagClassList,
  type TagProps,
  type TagSize,
  type TagType,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

import { useUIContext } from '../composables/use-ui-context.js';

/**
 * `<ChronixTag>` — Vue 2.7 port of the Tag pilot. Verbatim
 * surface mirror of `adapters/ui-vue3`'s `ChronixTag`; runtime
 * differences are Vue 2's nested data-object render syntax (`attrs:`
 * + `on:`) and the `defineComponent`-backs-`Vue.extend` shim.
 */
export const ChronixTag = defineComponent({
  name: 'ChronixTag',
  props: {
    type: {
      type: String as PropType<TagType>,
      default: defaultTagProps.type,
    },
    size: {
      type: String as PropType<TagSize | undefined>,
      default: undefined,
    },
    bordered: {
      type: Boolean,
      default: defaultTagProps.bordered,
    },
    round: {
      type: Boolean,
      default: defaultTagProps.round,
    },
    closable: {
      type: Boolean,
      default: defaultTagProps.closable,
    },
    disabled: {
      type: Boolean,
      default: undefined,
    },
  },
  emits: {
    close: (_event: MouseEvent) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixTagStyles();
    const ctx = useUIContext();

    const resolvedProps = computed<TagProps>(() => ({
      type: props.type,
      size: props.size ?? ctx.value.size,
      bordered: props.bordered,
      round: props.round,
      closable: props.closable,
      disabled: props.disabled ?? ctx.value.disabled,
    }));

    const classList = computed(() => resolveTagClassList(resolvedProps.value));

    function onCloseClick(event: MouseEvent) {
      if (resolvedProps.value.disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      emit('close', event);
    }

    return () => {
      const defaultSlot = slots['default'];
      const children: VNode[] = defaultSlot ? defaultSlot() : [];
      if (resolvedProps.value.closable) {
        children.push(
          h(
            'button',
            {
              class: 'cx-ui-tag__close',
              attrs: { type: 'button', 'aria-label': 'Close' },
              on: { click: onCloseClick },
            },
            '×',
          ),
        );
      }
      return h('span', { class: classList.value }, children);
    };
  },
});

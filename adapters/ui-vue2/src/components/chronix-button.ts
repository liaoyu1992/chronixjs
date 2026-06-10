import {
  defaultButtonProps,
  ensureChronixButtonStyles,
  resolveButtonClassList,
  type ButtonHtmlType,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType } from 'vue';

import { useUIContext } from '../composables/use-ui-context.js';

/**
 * `<ChronixButton>` — Vue 2.7 component wrapping the core `ButtonProps`
 * IR. Verbatim port of `adapters/ui-vue3`'s `ChronixButton`; same
 * resolved props, same class list, same DOM shape.
 *
 * Phase 12 (2026-06-02). The runtime differences from the Vue 3 sibling:
 *
 * - The render function uses Vue 2's nested data-object syntax:
 *   `attrs` for HTML attributes (`type`, `disabled`, `aria-disabled`)
 *   and `on` for events (`click`).
 * - `defineComponent` is `Vue.extend` under the hood; behavior identical
 *   for the surface we use.
 *
 * Props mirror the Vue 3 adapter; behavior follows Phase 0.3 Decision
 * A.1 default-merge precedence (own prop strict → context → interface
 * default).
 */
export const ChronixButton = defineComponent({
  name: 'ChronixButton',
  props: {
    variant: {
      type: String as PropType<ButtonVariant>,
      default: defaultButtonProps.variant,
    },
    size: {
      type: String as PropType<ButtonSize | undefined>,
      default: undefined,
    },
    disabled: {
      type: Boolean,
      default: undefined,
    },
    block: {
      type: Boolean,
      default: defaultButtonProps.block,
    },
    htmlType: {
      type: String as PropType<ButtonHtmlType>,
      default: defaultButtonProps.htmlType,
    },
  },
  // Vue 2.7 + `defineComponent` accepts an `emits` option (mirrors
  // Vue 3); the runtime ignores it but it documents the surface +
  // satisfies the Vue 3-style typed `emit` signature.
  emits: {
    click: (_event: MouseEvent) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixButtonStyles();
    const ctx = useUIContext();

    const resolvedProps = computed<ButtonProps>(() => ({
      variant: props.variant,
      size: props.size ?? ctx.value.size,
      disabled: props.disabled ?? ctx.value.disabled,
      block: props.block,
      htmlType: props.htmlType,
    }));

    const classList = computed(() => resolveButtonClassList(resolvedProps.value));

    function onClick(event: MouseEvent) {
      if (resolvedProps.value.disabled) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      emit('click', event);
    }

    return () => {
      const defaultSlot = slots['default'];
      const resolved = resolvedProps.value;
      const attrs: Record<string, unknown> = { type: resolved.htmlType };
      if (resolved.disabled) {
        attrs['disabled'] = 'disabled';
        attrs['aria-disabled'] = 'true';
      }
      return h(
        'button',
        {
          class: classList.value,
          attrs,
          on: { click: onClick },
        },
        defaultSlot ? defaultSlot() : [],
      );
    };
  },
});

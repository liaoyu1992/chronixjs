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
 * `<ChronixButton>` — Vue 3 SFC wrapping the core `ButtonProps` IR.
 *
 * . First Tier A component through the full
 * pipeline: core IR → adapter SFC → CSS injection → mount test.
 *
 * Props:
 *
 * - `variant` (`'default' | 'primary'`) — visual variant; default `'default'`.
 * - `size` (`'small' | 'medium' | 'large'`) — sizing token; defaults
 *   to the active `ChronixUIContext.size` (which itself defaults to
 *   `'medium'` when no provider is mounted).
 * - `disabled` (`boolean`) — non-interactive + muted. Either an own
 *   prop OR the context's `disabled: true` causes the button to render
 *   as disabled (per Decision A.1 default-merge precedence:
 *   own-prop is strict, falls back to context, falls back to interface
 *   default).
 * - `block` (`boolean`) — full-width display.
 * - `htmlType` (`'button' | 'submit' | 'reset'`) — HTML `<button type>`;
 *   default `'button'` (not browser-default `'submit'` to prevent
 *   accidental form-submit on click).
 *
 * Emits:
 *
 * - `click` — native `MouseEvent`; suppressed when the resolved
 *   disabled state is true.
 *
 * Slots:
 *
 * - `default` — button label content.
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
      return h(
        'button',
        {
          type: resolvedProps.value.htmlType,
          class: classList.value,
          disabled: resolvedProps.value.disabled,
          'aria-disabled': resolvedProps.value.disabled ? 'true' : undefined,
          onClick,
        },
        defaultSlot ? defaultSlot() : [],
      );
    };
  },
});

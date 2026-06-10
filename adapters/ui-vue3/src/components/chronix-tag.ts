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
 * `<ChronixTag>` — Vue 3 SFC wrapping the core `TagProps` IR.
 *
 * Phase 13 (2026-06-02). Second Tier A component through the full
 * pipeline; mirrors `<ChronixButton>` at the wiring level. Theme
 * tokens applied via CSS-var fallback in the core's
 * `CHRONIX_TAG_CSS`.
 *
 * Props:
 *
 * - `type` (`'default' | 'primary' | 'info' | 'success' | 'warning'
 *   | 'error'`) — semantic visual variant. Default `'default'`.
 * - `size` (`'small' | 'medium' | 'large'`) — sizing token; defaults
 *   to the active `ChronixUIContext.size` (Phase 0.3 Decision A.1
 *   default-merge precedence).
 * - `bordered` (`boolean`) — visible border. Default `true`.
 * - `round` (`boolean`) — full-pill border-radius. Default `false`.
 * - `closable` (`boolean`) — renders a `×` close button inside the
 *   tag. Default `false`.
 * - `disabled` (`boolean`) — non-interactive + muted. Inherits from
 *   `ChronixUIContext.disabled` when not explicitly set.
 *
 * Emits:
 *
 * - `close` — fires when the close button is clicked. Suppressed when
 *   the resolved disabled state is true.
 *
 * Slots:
 *
 * - `default` — tag label content.
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
              type: 'button',
              class: 'cx-ui-tag__close',
              'aria-label': 'Close',
              onClick: onCloseClick,
            },
            '×',
          ),
        );
      }
      return h('span', { class: classList.value }, children);
    };
  },
});

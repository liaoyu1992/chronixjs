import {
  defaultScrollbarProps,
  ensureChronixScrollbarStyles,
  resolveScrollbarClassList,
  type ScrollbarProps,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type VNode } from 'vue';

/**
 * `<ChronixScrollbar>` — Vue 3 custom scrollbar container.
 * Phase 35 (2026-06-05).
 *
 * Props:
 *
 * - `trigger` — when to show the scrollbar: `'hover'` or `'none'`
 *   (default `'hover'`).
 * - `xScrollable` — enable horizontal scrolling (default false).
 *
 * Wraps the default slot with overflow styling.
 */
export const ChronixScrollbar = defineComponent({
  name: 'ChronixScrollbar',
  inheritAttrs: false,
  props: {
    trigger: {
      type: String as () => 'hover' | 'none',
      default: defaultScrollbarProps.trigger,
    },
    xScrollable: {
      type: Boolean,
      default: defaultScrollbarProps.xScrollable,
    },
  },
  setup(props, { slots, attrs }) {
    ensureChronixScrollbarStyles();

    const resolvedProps = computed<ScrollbarProps>(() => ({
      trigger: props.trigger,
      xScrollable: props.xScrollable,
    }));

    const classList = computed(() =>
      resolveScrollbarClassList({ trigger: resolvedProps.value.trigger }),
    );

    const overflowStyle = computed(() => ({
      overflowY: 'auto',
      overflowX: props.xScrollable ? 'auto' : 'hidden',
    }));

    return () => {
      const defaultSlot = slots['default'];
      const children: VNode[] = [];
      if (defaultSlot) {
        const slotNodes = defaultSlot();
        if (Array.isArray(slotNodes)) {
          children.push(...slotNodes);
        } else {
          children.push(slotNodes);
        }
      }

      return h(
        'div',
        {
          class: classList.value,
          'data-testid': 'scrollbar-root',
          style: overflowStyle.value,
          ...attrs,
        },
        children,
      );
    };
  },
});

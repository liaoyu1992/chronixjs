import {
  defaultAlertProps,
  ensureChronixAlertStyles,
  resolveAlertClassList,
  type AlertProps,
  type AlertType,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixAlert>` — Vue 3 SFC wrapping the core `AlertProps` IR.
 *
 * Phase 15 (2026-06-02).
 *
 * Props:
 *
 * - `type` — `'default' | 'info' | 'success' | 'warning' | 'error'`.
 * - `title` — optional title text. Renders an `__title` row when set.
 * - `closable` — renders a `×` close button. Emits `close` on click.
 * - `bordered` — visible border in matching type color (default true).
 *
 * Slots:
 *
 * - `default` — content body rendered inside `__content`.
 */
export const ChronixAlert = defineComponent({
  name: 'ChronixAlert',
  props: {
    type: {
      type: String as PropType<AlertType>,
      default: defaultAlertProps.type,
    },
    title: {
      type: String as PropType<string | undefined>,
      default: defaultAlertProps.title,
    },
    closable: {
      type: Boolean,
      default: defaultAlertProps.closable,
    },
    bordered: {
      type: Boolean,
      default: defaultAlertProps.bordered,
    },
  },
  emits: {
    close: (_event: MouseEvent) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixAlertStyles();

    const resolvedProps = computed<AlertProps>(() => ({
      type: props.type,
      title: props.title,
      closable: props.closable,
      bordered: props.bordered,
    }));

    const classList = computed(() => resolveAlertClassList(resolvedProps.value));

    function onCloseClick(event: MouseEvent) {
      emit('close', event);
    }

    return () => {
      const defaultSlot = slots['default'];
      const children: VNode[] = [];
      if (resolvedProps.value.title !== undefined) {
        children.push(h('div', { class: 'cx-ui-alert__title' }, resolvedProps.value.title));
      }
      const slotNodes = defaultSlot ? defaultSlot() : [];
      if (slotNodes.length > 0) {
        children.push(h('div', { class: 'cx-ui-alert__content' }, slotNodes));
      }
      if (resolvedProps.value.closable) {
        children.push(
          h(
            'button',
            {
              type: 'button',
              class: 'cx-ui-alert__close',
              'aria-label': 'Close',
              onClick: onCloseClick,
            },
            '×',
          ),
        );
      }
      return h('div', { class: classList.value, role: 'alert' }, children);
    };
  },
});

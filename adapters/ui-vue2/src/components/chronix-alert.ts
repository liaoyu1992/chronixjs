import {
  defaultAlertProps,
  ensureChronixAlertStyles,
  resolveAlertClassList,
  type AlertProps,
  type AlertType,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

/**
 * `<ChronixAlert>` — Vue 2.7 port of the Alert. Verbatim
 * surface mirror of vue3 sibling; runtime differences are Vue 2's
 * `attrs:` data-object for `role` + `aria-label` HTML attributes and
 * `on:` for `click`.
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
              class: 'cx-ui-alert__close',
              attrs: { type: 'button', 'aria-label': 'Close' },
              on: { click: onCloseClick },
            },
            '×',
          ),
        );
      }
      return h('div', { class: classList.value, attrs: { role: 'alert' } }, children);
    };
  },
});

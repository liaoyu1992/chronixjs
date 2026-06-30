import {
  defaultModalProps,
  ensureChronixModalStyles,
  resolveModalWidthStyle,
  resolveModalWrapperClassList,
} from '@chronixjs/ui';
import {
  Teleport,
  computed,
  defineComponent,
  h,
  toRef,
  useAttrs,
  type PropType,
  type VNode,
} from 'vue';

import { useModalLifecycle, type ModalCloseReason } from '../composables/use-modal-lifecycle.js';

/**
 * `<ChronixModal>` — Vue 3 portal-mounted centered modal.
 * (2026-06-03). Consumes `useModalLifecycle` for focus trap + body
 * scroll lock + Escape close + mask click close.
 *
 * Slots:
 * - `default` — modal body content.
 * - `header` — replaces the default title row when present.
 * - `footer` — bottom row (typically action buttons).
 *
 * Emits:
 * - `update:show(show: boolean)` — visibility transitions.
 * - `close(reason: 'mask' | 'esc' | 'close-button')` — close cause.
 */
export const ChronixModal = defineComponent({
  name: 'ChronixModal',
  inheritAttrs: false,
  props: {
    show: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    title: { type: String as PropType<string | undefined>, default: undefined },
    mask: { type: Boolean, default: defaultModalProps.mask },
    maskClosable: { type: Boolean, default: defaultModalProps.maskClosable },
    escClosable: { type: Boolean, default: defaultModalProps.escClosable },
    width: {
      type: [Number, String] as PropType<number | string>,
      default: defaultModalProps.width,
    },
    disabled: { type: Boolean, default: defaultModalProps.disabled },
  },
  emits: {
    'update:show': (_show: boolean) => true,
    close: (_reason: ModalCloseReason) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixModalStyles();
    const attrs = useAttrs();
    const lifecycle = useModalLifecycle({
      show: toRef(props, 'show'),
      maskClosable: toRef(props, 'maskClosable'),
      escClosable: toRef(props, 'escClosable'),
      disabled: toRef(props, 'disabled'),
      onVisibilityChange: (next) => emit('update:show', next),
      onClose: (reason) => emit('close', reason),
    });

    const wrapperClass = computed(() =>
      resolveModalWrapperClassList({
        open: lifecycle.visible.value,
        mask: props.mask,
      }),
    );

    const panelStyle = computed(() => ({
      width: resolveModalWidthStyle(props.width),
    }));

    return () => {
      if (!lifecycle.visible.value) {
        return h(Teleport, { to: lifecycle.portalTarget.value }, []);
      }

      const headerSlot = slots['header'];
      const footerSlot = slots['footer'];
      const headerNodes: VNode[] = headerSlot
        ? headerSlot()
        : [
            h('span', { class: 'cx-ui-modal__title' }, props.title ?? ''),
            h(
              'button',
              {
                type: 'button',
                class: 'cx-ui-modal__close',
                'aria-label': 'Close',
                onClick: lifecycle.onCloseButtonClick,
              },
              '×',
            ),
          ];

      const children: VNode[] = [];
      if (props.mask) {
        children.push(
          h('div', {
            class: 'cx-ui-modal__mask',
            onClick: lifecycle.onMaskClick,
          }),
        );
      }
      const panelChildren: VNode[] = [
        h('div', { class: 'cx-ui-modal__header' }, headerNodes),
        h('div', { class: 'cx-ui-modal__body' }, slots['default'] ? slots['default']() : []),
      ];
      if (footerSlot) {
        panelChildren.push(h('div', { class: 'cx-ui-modal__footer' }, footerSlot()));
      }
      children.push(
        h(
          'div',
          {
            ref: lifecycle.panelRef,
            class: 'cx-ui-modal',
            tabindex: '-1',
            style: panelStyle.value,
          },
          panelChildren,
        ),
      );

      return h(Teleport, { to: lifecycle.portalTarget.value }, [
        h(
          'div',
          {
            ...attrs,
            class: wrapperClass.value,
            style: lifecycle.wrapperStyle.value,
          },
          children,
        ),
      ]);
    };
  },
});

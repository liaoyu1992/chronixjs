import {
  defaultModalProps,
  ensureChronixModalStyles,
  resolveModalWidthStyle,
  resolveModalWrapperClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, toRef, type PropType, type VNode } from 'vue';

import { useModalLifecycle, type ModalCloseReason } from '../composables/use-modal-lifecycle.js';

/**
 * `<ChronixModal>` — Vue 2 inline-rendered centered modal.
 * (2026-06-03). v0.1.0-alpha tradeoff per 27-vue2-fr1: rendered
 * inline next to consumer site; mask + panel use `position: fixed`
 * which provides viewport coverage in the vast majority of layouts.
 */
export const ChronixModal = defineComponent({
  name: 'ChronixModal',
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
        return h('span', { style: { display: 'none' } });
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
                class: 'cx-ui-modal__close',
                attrs: { type: 'button', 'aria-label': 'Close' },
                on: { click: lifecycle.onCloseButtonClick },
              },
              '×',
            ),
          ];

      const children: VNode[] = [];
      if (props.mask) {
        children.push(
          h('div', {
            class: 'cx-ui-modal__mask',
            on: { click: lifecycle.onMaskClick },
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
            attrs: { tabindex: '-1' },
            style: panelStyle.value,
          },
          panelChildren,
        ),
      );

      return h(
        'div',
        {
          class: wrapperClass.value,
          style: lifecycle.wrapperStyle.value,
        },
        children,
      );
    };
  },
});

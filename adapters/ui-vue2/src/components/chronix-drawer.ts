import {
  defaultDrawerProps,
  ensureChronixDrawerStyles,
  resolveDrawerDimensionStyle,
  resolveDrawerPanelClassList,
  resolveDrawerWrapperClassList,
  type DrawerPlacement,
} from '@chronixjs/ui';
import { computed, defineComponent, h, toRef, type PropType, type VNode } from 'vue';

import { useModalLifecycle, type ModalCloseReason } from '../composables/use-modal-lifecycle.js';

export const ChronixDrawer = defineComponent({
  name: 'ChronixDrawer',
  props: {
    show: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    placement: {
      type: String as PropType<DrawerPlacement>,
      default: defaultDrawerProps.placement,
    },
    title: { type: String as PropType<string | undefined>, default: undefined },
    mask: { type: Boolean, default: defaultDrawerProps.mask },
    maskClosable: { type: Boolean, default: defaultDrawerProps.maskClosable },
    escClosable: { type: Boolean, default: defaultDrawerProps.escClosable },
    width: {
      type: [Number, String] as PropType<number | string>,
      default: defaultDrawerProps.width,
    },
    height: {
      type: [Number, String] as PropType<number | string>,
      default: defaultDrawerProps.height,
    },
    disabled: { type: Boolean, default: defaultDrawerProps.disabled },
  },
  emits: {
    'update:show': (_show: boolean) => true,
    close: (_reason: ModalCloseReason) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixDrawerStyles();
    const lifecycle = useModalLifecycle({
      show: toRef(props, 'show'),
      maskClosable: toRef(props, 'maskClosable'),
      escClosable: toRef(props, 'escClosable'),
      disabled: toRef(props, 'disabled'),
      onVisibilityChange: (next) => emit('update:show', next),
      onClose: (reason) => emit('close', reason),
    });

    const wrapperClass = computed(() =>
      resolveDrawerWrapperClassList({
        open: lifecycle.visible.value,
        mask: props.mask,
        placement: props.placement,
      }),
    );

    const panelClass = computed(() => resolveDrawerPanelClassList({ placement: props.placement }));

    const panelStyle = computed(() =>
      resolveDrawerDimensionStyle({
        placement: props.placement,
        width: props.width,
        height: props.height,
      }),
    );

    return () => {
      if (!lifecycle.visible.value) {
        return h('span', { style: { display: 'none' } });
      }

      const children: VNode[] = [];
      if (props.mask) {
        children.push(
          h('div', {
            class: 'cx-ui-drawer__mask',
            on: { click: lifecycle.onMaskClick },
          }),
        );
      }
      const panelChildren: VNode[] = [
        h('div', { class: 'cx-ui-drawer__header' }, [
          h('span', { class: 'cx-ui-drawer__title' }, props.title ?? ''),
          h(
            'button',
            {
              class: 'cx-ui-drawer__close',
              attrs: { type: 'button', 'aria-label': 'Close' },
              on: { click: lifecycle.onCloseButtonClick },
            },
            '×',
          ),
        ]),
        h('div', { class: 'cx-ui-drawer__body' }, slots['default'] ? slots['default']() : []),
      ];
      const footerSlot = slots['footer'];
      if (footerSlot) {
        panelChildren.push(h('div', { class: 'cx-ui-drawer__footer' }, footerSlot()));
      }
      children.push(
        h(
          'div',
          {
            ref: lifecycle.panelRef,
            class: panelClass.value,
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

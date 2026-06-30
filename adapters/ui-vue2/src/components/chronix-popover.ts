import {
  defaultPopoverProps,
  ensureChronixPopoverStyles,
  resolvePopoverClassList,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import { computed, defineComponent, h, toRef, type PropType, type VNode } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

/**
 * `<ChronixPopover>` — Vue 2 inline-rendered popup (no `<Teleport>` in
 * Vue 2; popup is rendered as sibling of trigger with `position: fixed`).
 * .
 */
export const ChronixPopover = defineComponent({
  name: 'ChronixPopover',
  props: {
    show: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    trigger: {
      type: String as PropType<PopupTrigger>,
      default: defaultPopoverProps.trigger,
    },
    placement: {
      type: String as PropType<PopupPlacement>,
      default: defaultPopoverProps.placement,
    },
    offset: { type: Number, default: defaultPopoverProps.offset },
    flip: { type: Boolean, default: defaultPopoverProps.flip },
    widthMatch: { type: Boolean, default: defaultPopoverProps.widthMatch },
    disabled: { type: Boolean, default: defaultPopoverProps.disabled },
  },
  emits: {
    'update:show': (_show: boolean) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixPopoverStyles();
    const lifecycle = usePopupLifecycle({
      show: toRef(props, 'show'),
      trigger: toRef(props, 'trigger'),
      placement: toRef(props, 'placement'),
      offset: toRef(props, 'offset'),
      flip: toRef(props, 'flip'),
      widthMatch: toRef(props, 'widthMatch'),
      disabled: toRef(props, 'disabled'),
      onVisibilityChange: (next) => emit('update:show', next),
    });

    const popoverClass = computed(() =>
      resolvePopoverClassList({
        actualPlacement: lifecycle.actualPlacement.value,
        open: lifecycle.visible.value,
      }),
    );

    return () => {
      const triggerSlot = slots['default'];
      const contentSlot = slots['content'];
      const triggerNodes: VNode[] = triggerSlot ? triggerSlot() : [];
      const contentNodes: VNode[] = contentSlot ? contentSlot() : [];

      const children: (VNode | null)[] = [...triggerNodes];
      if (lifecycle.visible.value) {
        children.push(
          h(
            'div',
            {
              ref: lifecycle.popupRef,
              class: popoverClass.value,
              style: lifecycle.popupStyle.value,
              on: lifecycle.popupHandlers,
            },
            contentNodes,
          ),
        );
      }

      return h(
        'span',
        {
          ref: lifecycle.triggerRef,
          class: 'cx-ui-popover__trigger',
          on: lifecycle.triggerHandlers,
        },
        children,
      );
    };
  },
});

import {
  defaultPopoverProps,
  ensureChronixPopoverStyles,
  resolvePopoverClassList,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import { Teleport, computed, defineComponent, h, toRef, type PropType, type VNode } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

/**
 * `<ChronixPopover>` — Vue 3 portal-mounted popup. .
 *
 * Slots:
 * - `default` — trigger element(s).
 * - `content` — popover body, rendered into the portal target when open.
 *
 * Emits `update:show(value: boolean)` on every visibility transition,
 * whether trigger-driven or close-driven.
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

      return h(
        'span',
        {
          ref: lifecycle.triggerRef,
          class: 'cx-ui-popover__trigger',
          ...lifecycle.triggerHandlers,
        },
        [
          ...triggerNodes,
          h(Teleport, { to: lifecycle.portalTarget.value }, [
            lifecycle.visible.value
              ? h(
                  'div',
                  {
                    ref: lifecycle.popupRef,
                    class: popoverClass.value,
                    style: lifecycle.popupStyle.value,
                    ...lifecycle.popupHandlers,
                  },
                  contentNodes,
                )
              : null,
          ]),
        ],
      );
    };
  },
});

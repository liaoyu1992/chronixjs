import {
  defaultTooltipProps,
  ensureChronixTooltipStyles,
  resolveTooltipClassList,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import { Teleport, computed, defineComponent, h, toRef, type PropType, type VNode } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

/**
 * `<ChronixTooltip>` — Vue 3 thin-styled text-only popup variant.
 * Phase 26 (2026-06-03). Wraps the same portal + lifecycle as
 * `<ChronixPopover>` but renders `props.content` (NOT a slot) inside a
 * dark `cx-ui-tooltip` surface with smaller padding.
 */
export const ChronixTooltip = defineComponent({
  name: 'ChronixTooltip',
  props: {
    content: { type: String, default: defaultTooltipProps.content },
    show: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    trigger: {
      type: String as PropType<PopupTrigger>,
      default: defaultTooltipProps.trigger,
    },
    placement: {
      type: String as PropType<PopupPlacement>,
      default: defaultTooltipProps.placement,
    },
    offset: { type: Number, default: defaultTooltipProps.offset },
    flip: { type: Boolean, default: defaultTooltipProps.flip },
    disabled: { type: Boolean, default: defaultTooltipProps.disabled },
  },
  emits: {
    'update:show': (_show: boolean) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixTooltipStyles();
    const widthMatchRef = toRef(() => false);
    const lifecycle = usePopupLifecycle({
      show: toRef(props, 'show'),
      trigger: toRef(props, 'trigger'),
      placement: toRef(props, 'placement'),
      offset: toRef(props, 'offset'),
      flip: toRef(props, 'flip'),
      widthMatch: widthMatchRef,
      disabled: toRef(props, 'disabled'),
      onVisibilityChange: (next) => emit('update:show', next),
    });

    const tooltipClass = computed(() =>
      resolveTooltipClassList({
        actualPlacement: lifecycle.actualPlacement.value,
        open: lifecycle.visible.value,
      }),
    );

    return () => {
      const triggerSlot = slots['default'];
      const triggerNodes: VNode[] = triggerSlot ? triggerSlot() : [];

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
                    class: tooltipClass.value,
                    style: lifecycle.popupStyle.value,
                    ...lifecycle.popupHandlers,
                  },
                  props.content,
                )
              : null,
          ]),
        ],
      );
    };
  },
});

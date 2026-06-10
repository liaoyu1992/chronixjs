import {
  defaultTooltipProps,
  ensureChronixTooltipStyles,
  resolveTooltipClassList,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, toRef, type PropType, type VNode } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

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
    const widthMatchRef = ref(false);
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

      const children: (VNode | null)[] = [...triggerNodes];
      if (lifecycle.visible.value) {
        children.push(
          h(
            'div',
            {
              ref: lifecycle.popupRef,
              class: tooltipClass.value,
              style: lifecycle.popupStyle.value,
              on: lifecycle.popupHandlers,
            },
            props.content,
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

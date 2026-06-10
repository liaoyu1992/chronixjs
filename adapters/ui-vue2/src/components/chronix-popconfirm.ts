import {
  defaultPopconfirmProps,
  ensureChronixPopconfirmStyles,
  resolvePopconfirmClassList,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, toRef, type PropType, type VNode } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

export const ChronixPopconfirm = defineComponent({
  name: 'ChronixPopconfirm',
  props: {
    title: { type: String, default: defaultPopconfirmProps.title },
    positiveText: {
      type: String,
      default: defaultPopconfirmProps.positiveText,
    },
    negativeText: {
      type: String,
      default: defaultPopconfirmProps.negativeText,
    },
    show: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    trigger: {
      type: String as PropType<PopupTrigger>,
      default: defaultPopconfirmProps.trigger,
    },
    placement: {
      type: String as PropType<PopupPlacement>,
      default: defaultPopconfirmProps.placement,
    },
    offset: { type: Number, default: defaultPopconfirmProps.offset },
    flip: { type: Boolean, default: defaultPopconfirmProps.flip },
    disabled: { type: Boolean, default: defaultPopconfirmProps.disabled },
  },
  emits: {
    'update:show': (_show: boolean) => true,
    'positive-click': (_event: MouseEvent) => true,
    'negative-click': (_event: MouseEvent) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixPopconfirmStyles();
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

    const popconfirmClass = computed(() =>
      resolvePopconfirmClassList({
        actualPlacement: lifecycle.actualPlacement.value,
        open: lifecycle.visible.value,
      }),
    );

    function onPositive(event: MouseEvent): void {
      emit('positive-click', event);
      emit('update:show', false);
    }
    function onNegative(event: MouseEvent): void {
      emit('negative-click', event);
      emit('update:show', false);
    }

    return () => {
      const triggerSlot = slots['default'];
      const triggerNodes: VNode[] = triggerSlot ? triggerSlot() : [];

      const popconfirmBody: VNode = h(
        'div',
        {
          ref: lifecycle.popupRef,
          class: popconfirmClass.value,
          style: lifecycle.popupStyle.value,
          on: lifecycle.popupHandlers,
        },
        [
          h('div', { class: 'cx-ui-popconfirm__header' }, [
            h(
              'svg',
              {
                class: 'cx-ui-popconfirm__icon',
                attrs: {
                  viewBox: '0 0 16 16',
                  'aria-hidden': 'true',
                },
              },
              [
                h('path', {
                  attrs: {
                    d: 'M8 1.5L0.5 14.5h15L8 1.5zm0 5v3m0 2v0.5',
                    fill: 'none',
                    stroke: 'currentColor',
                    'stroke-width': '1.5',
                    'stroke-linecap': 'round',
                    'stroke-linejoin': 'round',
                  },
                }),
              ],
            ),
            h('span', { class: 'cx-ui-popconfirm__title' }, props.title),
          ]),
          h('div', { class: 'cx-ui-popconfirm__actions' }, [
            h(
              'button',
              {
                class: 'cx-ui-popconfirm__action',
                attrs: { type: 'button' },
                on: { click: onNegative },
              },
              props.negativeText,
            ),
            h(
              'button',
              {
                class: 'cx-ui-popconfirm__action cx-ui-popconfirm__action--positive',
                attrs: { type: 'button' },
                on: { click: onPositive },
              },
              props.positiveText,
            ),
          ]),
        ],
      );

      const children: (VNode | null)[] = [...triggerNodes];
      if (lifecycle.visible.value) children.push(popconfirmBody);

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

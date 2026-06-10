import {
  defaultPopconfirmProps,
  ensureChronixPopconfirmStyles,
  resolvePopconfirmClassList,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import { Teleport, computed, defineComponent, h, toRef, type PropType, type VNode } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

/**
 * `<ChronixPopconfirm>` — Vue 3 confirm-before-action popup. Phase 26
 * (2026-06-03). Click-driven by default (consumer wants explicit user
 * confirmation; hover would surface destructive prompts accidentally).
 *
 * Emits:
 * - `update:show(show: boolean)` — visibility transitions.
 * - `positive-click(event: MouseEvent)` — positive button clicked.
 * - `negative-click(event: MouseEvent)` — negative button clicked.
 *
 * Auto-closes after positive / negative click.
 */
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
          ...lifecycle.popupHandlers,
        },
        [
          h('div', { class: 'cx-ui-popconfirm__header' }, [
            h(
              'svg',
              {
                class: 'cx-ui-popconfirm__icon',
                viewBox: '0 0 16 16',
                'aria-hidden': 'true',
              },
              [
                h('path', {
                  d: 'M8 1.5L0.5 14.5h15L8 1.5zm0 5v3m0 2v0.5',
                  fill: 'none',
                  stroke: 'currentColor',
                  'stroke-width': 1.5,
                  'stroke-linecap': 'round',
                  'stroke-linejoin': 'round',
                }),
              ],
            ),
            h('span', { class: 'cx-ui-popconfirm__title' }, props.title),
          ]),
          h('div', { class: 'cx-ui-popconfirm__actions' }, [
            h(
              'button',
              {
                type: 'button',
                class: 'cx-ui-popconfirm__action',
                onClick: onNegative,
              },
              props.negativeText,
            ),
            h(
              'button',
              {
                type: 'button',
                class: 'cx-ui-popconfirm__action cx-ui-popconfirm__action--positive',
                onClick: onPositive,
              },
              props.positiveText,
            ),
          ]),
        ],
      );

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
            lifecycle.visible.value ? popconfirmBody : null,
          ]),
        ],
      );
    };
  },
});

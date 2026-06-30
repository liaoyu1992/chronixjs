import {
  defaultPopSelectProps,
  ensureChronixPopSelectStyles,
  resolvePopSelectClassList,
  type PopSelectOption,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import { Teleport, computed, defineComponent, h, toRef, type PropType, type VNode } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

/**
 * `<ChronixPopSelect>` — Vue 3 option-list popup. .
 * Click-driven by default; renders option list inside the portal. NO
 * search/filter/multi/virtual/async in v0.1.0-alpha — use AutoComplete
 * for filter, or wait Select.
 *
 * Emits:
 * - `update:show(show: boolean)` — visibility transitions.
 * - `update:value(value: string)` — selected option's `value`.
 *
 * Auto-closes after option click.
 */
export const ChronixPopSelect = defineComponent({
  name: 'ChronixPopSelect',
  props: {
    value: {
      type: String as PropType<string | undefined>,
      default: defaultPopSelectProps.value,
    },
    options: {
      type: Array as PropType<readonly PopSelectOption[]>,
      default: () => defaultPopSelectProps.options,
    },
    show: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    trigger: {
      type: String as PropType<PopupTrigger>,
      default: defaultPopSelectProps.trigger,
    },
    placement: {
      type: String as PropType<PopupPlacement>,
      default: defaultPopSelectProps.placement,
    },
    offset: { type: Number, default: defaultPopSelectProps.offset },
    flip: { type: Boolean, default: defaultPopSelectProps.flip },
    widthMatch: { type: Boolean, default: defaultPopSelectProps.widthMatch },
    disabled: { type: Boolean, default: defaultPopSelectProps.disabled },
  },
  emits: {
    'update:show': (_show: boolean) => true,
    'update:value': (_value: string) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixPopSelectStyles();
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

    const popSelectClass = computed(() =>
      resolvePopSelectClassList({
        actualPlacement: lifecycle.actualPlacement.value,
        open: lifecycle.visible.value,
      }),
    );

    function onOptionClick(opt: PopSelectOption): void {
      if (opt.disabled) return;
      emit('update:value', opt.value);
      emit('update:show', false);
    }

    return () => {
      const triggerSlot = slots['default'];
      const triggerNodes: VNode[] = triggerSlot ? triggerSlot() : [];

      const optionItems: VNode[] = props.options.map((opt) =>
        h(
          'li',
          {
            key: opt.key,
            class: [
              'cx-ui-pop-select__option',
              opt.value === props.value ? 'cx-ui-pop-select__option--active' : '',
              opt.disabled ? 'cx-ui-pop-select__option--disabled' : '',
            ],
            onMousedown: (e: MouseEvent) => {
              e.preventDefault();
              onOptionClick(opt);
            },
          },
          opt.label,
        ),
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
            lifecycle.visible.value
              ? h(
                  'div',
                  {
                    ref: lifecycle.popupRef,
                    class: popSelectClass.value,
                    style: lifecycle.popupStyle.value,
                    ...lifecycle.popupHandlers,
                  },
                  [h('ul', { class: 'cx-ui-pop-select__list' }, optionItems)],
                )
              : null,
          ]),
        ],
      );
    };
  },
});

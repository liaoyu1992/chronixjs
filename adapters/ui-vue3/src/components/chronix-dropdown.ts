import {
  composeKeyboardSelection,
  defaultDropdownProps,
  ensureChronixDropdownStyles,
  findDropdownOptionByKey,
  getDropdownActivatableKeys,
  resolveDropdownClassList,
  resolveDropdownOptionClassList,
  type DropdownOption,
  type PopupPlacement,
  type PopupTrigger,
} from '@chronixjs/ui';
import {
  Teleport,
  computed,
  defineComponent,
  h,
  ref,
  toRef,
  watch,
  type PropType,
  type VNode,
} from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

/**
 * `<ChronixDropdown>` — Vue 3 popup-style dropdown with flat options
 * + ArrowUp/Down/Enter keyboard navigation. Phase 27 (2026-06-03).
 *
 * Composes Phase 26 `usePopupLifecycle` (anchor + portal + trigger +
 * click-outside + Escape) with Phase 7 `composeKeyboardSelection`.
 *
 * Emits:
 * - `update:show(show: boolean)`.
 * - `select(option: DropdownOption)` — clicked or Entered an option.
 */
export const ChronixDropdown = defineComponent({
  name: 'ChronixDropdown',
  props: {
    show: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
    trigger: {
      type: String as PropType<PopupTrigger>,
      default: defaultDropdownProps.trigger,
    },
    placement: {
      type: String as PropType<PopupPlacement>,
      default: defaultDropdownProps.placement,
    },
    options: {
      type: Array as PropType<readonly DropdownOption[]>,
      default: () => defaultDropdownProps.options,
    },
    disabled: { type: Boolean, default: defaultDropdownProps.disabled },
  },
  emits: {
    'update:show': (_show: boolean) => true,
    select: (_option: DropdownOption) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixDropdownStyles();
    const flipRef = ref(true);
    const widthMatchRef = ref(false);
    const offsetRef = ref(4);
    const lifecycle = usePopupLifecycle({
      show: toRef(props, 'show'),
      trigger: toRef(props, 'trigger'),
      placement: toRef(props, 'placement'),
      offset: offsetRef,
      flip: flipRef,
      widthMatch: widthMatchRef,
      disabled: toRef(props, 'disabled'),
      onVisibilityChange: (next) => emit('update:show', next),
    });

    const activeKey = ref<string | null>(null);

    watch(
      () => lifecycle.visible.value,
      (next) => {
        if (!next) activeKey.value = null;
      },
    );

    function onKeyDown(event: KeyboardEvent): void {
      if (!lifecycle.visible.value) return;
      const keys = getDropdownActivatableKeys(props.options);
      if (keys.length === 0) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const next = composeKeyboardSelection({
          currentKey: activeKey.value,
          availableKeys: keys,
          direction: event.key === 'ArrowDown' ? 'down' : 'up',
          wrap: true,
        });
        activeKey.value = next;
      } else if (event.key === 'Enter') {
        const opt = findDropdownOptionByKey(props.options, activeKey.value);
        if (opt !== null) {
          emit('select', opt);
          emit('update:show', false);
        }
      }
    }

    watch(
      () => lifecycle.visible.value,
      (next) => {
        if (typeof document === 'undefined') return;
        if (next) {
          document.addEventListener('keydown', onKeyDown);
        } else {
          document.removeEventListener('keydown', onKeyDown);
        }
      },
    );

    const dropdownClass = computed(() =>
      resolveDropdownClassList({
        actualPlacement: lifecycle.actualPlacement.value,
        open: lifecycle.visible.value,
      }),
    );

    function onOptionClick(opt: DropdownOption): void {
      if (opt.disabled) return;
      emit('select', opt);
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
            class: resolveDropdownOptionClassList({
              active: activeKey.value === opt.key,
              disabled: opt.disabled,
            }),
            onMousedown: (e: MouseEvent) => {
              e.preventDefault();
              onOptionClick(opt);
            },
          },
          [
            opt.icon !== undefined
              ? h('span', { class: 'cx-ui-dropdown__option-icon' }, opt.icon)
              : null,
            h('span', { class: 'cx-ui-dropdown__option-label' }, opt.label),
          ],
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
                    class: dropdownClass.value,
                    style: lifecycle.popupStyle.value,
                    ...lifecycle.popupHandlers,
                  },
                  [h('ul', { class: 'cx-ui-dropdown__list' }, optionItems)],
                )
              : null,
          ]),
        ],
      );
    };
  },
});

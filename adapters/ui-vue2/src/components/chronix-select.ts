import {
  composeKeyboardSelection,
  defaultSelectProps,
  ensureChronixSelectStyles,
  filterSelectOptions,
  flattenSelectOptions,
  normalizeSelectValue,
  resolveSelectArrowClassList,
  resolveSelectDropdownClassList,
  resolveSelectEmptyClassList,
  resolveSelectFilterInputClassList,
  resolveSelectOptionClassList,
  resolveSelectRootClassList,
  resolveSelectTagClassList,
  resolveSelectTagCloseClassList,
  resolveSelectTriggerClassList,
  type FlatOptionEntry,
  type PopupPlacement,
  type SelectOption,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, toRef, type PropType, type VNode } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

/**
 * `<ChronixSelect>` — Vue 2 full-featured select. Phase 31 (2026-06-04).
 * Vue 2: no Teleport → inline render with position: fixed.
 */
export const ChronixSelect = defineComponent({
  name: 'ChronixSelect',
  inheritAttrs: false,
  props: {
    value: {
      type: [String, Array] as PropType<string | readonly string[] | undefined>,
      default: defaultSelectProps.value,
    },
    options: {
      type: Array as PropType<readonly SelectOption[]>,
      default: () => defaultSelectProps.options,
    },
    multiple: { type: Boolean, default: defaultSelectProps.multiple },
    filterable: { type: Boolean, default: defaultSelectProps.filterable },
    clearable: { type: Boolean, default: defaultSelectProps.clearable },
    placeholder: { type: String, default: defaultSelectProps.placeholder },
    disabled: { type: Boolean, default: defaultSelectProps.disabled },
    loading: { type: Boolean, default: defaultSelectProps.loading },
    virtual: { type: Boolean, default: defaultSelectProps.virtual },
    virtualItemHeight: { type: Number, default: defaultSelectProps.virtualItemHeight },
    placement: {
      type: String as PropType<PopupPlacement>,
      default: defaultSelectProps.placement,
    },
    show: {
      type: Boolean as PropType<boolean | undefined>,
      default: undefined,
    },
  },
  emits: {
    'update:show': (_show: boolean) => true,
    'update:value': (_value: string | string[]) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixSelectStyles();

    const filterQuery = ref('');
    const focusedKey = ref<string | null>(null);

    const lifecycle = usePopupLifecycle({
      show: toRef(props, 'show'),
      trigger: ref('click'),
      placement: toRef(props, 'placement'),
      offset: ref(4),
      flip: ref(true),
      widthMatch: ref(true),
      disabled: toRef(props, 'disabled'),
      onVisibilityChange: (next) => {
        emit('update:show', next);
        if (!next) {
          filterQuery.value = '';
          focusedKey.value = null;
        }
      },
    });

    const normalizedValue = computed(() => normalizeSelectValue(props.value, props.multiple));

    const filteredOptions = computed(() => filterSelectOptions(props.options, filterQuery.value));

    const flatEntries = computed(() => flattenSelectOptions(filteredOptions.value));

    const activatableKeys = computed(() =>
      flatEntries.value
        .filter((e) => !e.isGroup && !(e.option as { disabled?: boolean }).disabled)
        .map((e) => e.option.key),
    );

    const selectedLabels = computed(() => {
      const labels: string[] = [];
      for (const val of normalizedValue.value) {
        const entry = flatEntries.value.find(
          (e) => !e.isGroup && (e.option as { value: string }).value === val,
        );
        if (entry) labels.push(entry.option.label);
      }
      return labels;
    });

    const rootClass = computed(() =>
      resolveSelectRootClassList({
        multiple: props.multiple,
        disabled: props.disabled,
        filterable: props.filterable,
        open: lifecycle.visible.value,
      }).join(' '),
    );

    const triggerClass = computed(() =>
      resolveSelectTriggerClassList({
        hasValue: normalizedValue.value.length > 0,
        active: lifecycle.visible.value,
        placeholder: normalizedValue.value.length === 0 && !filterQuery.value,
      }).join(' '),
    );

    const arrowClass = computed(() =>
      resolveSelectArrowClassList(lifecycle.visible.value).join(' '),
    );

    const dropdownClass = computed(() =>
      resolveSelectDropdownClassList({ virtual: props.virtual }).join(' '),
    );

    function selectOption(key: string): void {
      const entry = flatEntries.value.find((e) => e.option.key === key);
      if (!entry || entry.isGroup) return;
      const leaf = entry.option as { value: string; disabled?: boolean };
      if (leaf.disabled) return;

      if (props.multiple) {
        const current = [...normalizedValue.value];
        const idx = current.indexOf(leaf.value);
        if (idx >= 0) {
          current.splice(idx, 1);
        } else {
          current.push(leaf.value);
        }
        emit('update:value', current);
      } else {
        emit('update:value', leaf.value);
        emit('update:show', false);
      }
    }

    function removeTag(value: string): void {
      if (!props.multiple) return;
      const current = normalizedValue.value.filter((v) => v !== value);
      emit('update:value', current);
    }

    function clearSelection(e: MouseEvent): void {
      e.stopPropagation();
      emit('update:value', props.multiple ? [] : '');
    }

    function onTriggerClick(): void {
      if (props.disabled) return;
      if (lifecycle.visible.value) {
        emit('update:show', false);
      } else {
        emit('update:show', true);
      }
    }

    function onFilterInput(e: Event): void {
      const target = e.target as HTMLInputElement;
      filterQuery.value = target.value;
    }

    function onDropdownKeydown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        emit('update:show', false);
        return;
      }
      if (e.key === 'Enter' && focusedKey.value !== null) {
        e.preventDefault();
        selectOption(focusedKey.value);
        return;
      }
      let direction: 'up' | 'down' | 'home' | 'end' | null = null;
      if (e.key === 'ArrowDown') direction = 'down';
      else if (e.key === 'ArrowUp') direction = 'up';
      else if (e.key === 'Home') direction = 'home';
      else if (e.key === 'End') direction = 'end';
      if (direction) {
        e.preventDefault();
        const next = composeKeyboardSelection({
          currentKey: focusedKey.value,
          availableKeys: activatableKeys.value,
          direction,
          wrap: true,
        });
        if (next !== null) focusedKey.value = next;
      }
    }

    return () => {
      // ── trigger content ──
      const triggerChildren: (VNode | string)[] = [];

      if (props.multiple && normalizedValue.value.length > 0) {
        for (let i = 0; i < normalizedValue.value.length; i++) {
          const val = normalizedValue.value[i]!;
          const label = selectedLabels.value[i] ?? val;
          triggerChildren.push(
            h('span', { class: resolveSelectTagClassList().join(' '), key: `tag-${val}` }, [
              h('span', undefined, label),
              h(
                'span',
                {
                  class: resolveSelectTagCloseClassList().join(' '),
                  on: {
                    mousedown: (e: MouseEvent) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeTag(val);
                    },
                  },
                },
                '×',
              ),
            ]),
          );
        }
      } else if (normalizedValue.value.length === 1 && !props.multiple) {
        triggerChildren.push(
          h(
            'span',
            { class: 'cx-ui-select__value-text' },
            selectedLabels.value[0] ?? normalizedValue.value[0],
          ),
        );
      } else {
        triggerChildren.push(h('span', { class: 'cx-ui-select__value-text' }, props.placeholder));
      }

      triggerChildren.push(h('span', { class: arrowClass.value }, '▾'));

      if (props.clearable && normalizedValue.value.length > 0) {
        triggerChildren.push(
          h(
            'span',
            {
              class: 'cx-ui-select__clear',
              on: { mousedown: clearSelection },
              style:
                'position:absolute;right:24px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:12px;color:#999;',
            },
            '✕',
          ),
        );
      }

      // ── dropdown content ──
      const dropdownChildren: VNode[] = [];

      if (props.filterable) {
        dropdownChildren.push(
          h('input', {
            class: resolveSelectFilterInputClassList().join(' '),
            attrs: {
              value: filterQuery.value,
              placeholder: 'Search...',
              'data-testid': 'select-filter-input',
            },
            on: { input: onFilterInput },
          }),
        );
      }

      if (props.loading) {
        dropdownChildren.push(h('div', { class: 'cx-ui-select__loading' }, 'Loading...'));
      } else if (flatEntries.value.length === 0) {
        dropdownChildren.push(
          h('div', { class: resolveSelectEmptyClassList().join(' ') }, 'No results'),
        );
      } else {
        const optionNodes = flatEntries.value.map((entry: FlatOptionEntry) => {
          const opt = entry.option;
          const isGrp = entry.isGroup;
          const leafValue = !isGrp ? (opt as { value: string }).value : undefined;
          const isSelected = leafValue !== undefined && normalizedValue.value.includes(leafValue);
          const isDisabled = !!(opt as { disabled?: boolean }).disabled;
          const isFocused = focusedKey.value === opt.key;

          const classes = resolveSelectOptionClassList({
            selected: isSelected,
            disabled: isDisabled,
            groupLabel: isGrp,
            focused: isFocused,
          }).join(' ');

          const paddingStyle =
            entry.depth > 0 ? `padding-left: ${8 + entry.depth * 16}px` : undefined;

          const optionData: Record<string, unknown> = {
            key: opt.key,
            class: classes,
            attrs: {
              role: isGrp ? 'group' : 'option',
              'aria-selected': isSelected || undefined,
              'aria-disabled': isDisabled || undefined,
              'data-testid': isGrp ? undefined : `select-option-${opt.key}`,
            },
            on: {
              mousedown: (e: MouseEvent) => {
                e.preventDefault();
                if (!isGrp) selectOption(opt.key);
              },
              mouseenter: () => {
                if (!isGrp) focusedKey.value = opt.key;
              },
            },
          };
          if (paddingStyle !== undefined) {
            optionData['style'] = paddingStyle;
          }

          return h('div', optionData, opt.label);
        });

        dropdownChildren.push(...optionNodes);
      }

      // Vue 2: no Teleport → inline popup render with position: fixed
      const children: (VNode | null)[] = [h('div', { class: triggerClass.value }, triggerChildren)];

      if (lifecycle.visible.value) {
        children.push(
          h(
            'div',
            {
              ref: lifecycle.popupRef,
              class: dropdownClass.value,
              style: lifecycle.popupStyle.value,
              on: { keydown: onDropdownKeydown, ...lifecycle.popupHandlers },
              attrs: { 'data-testid': 'select-dropdown-popup' },
            },
            dropdownChildren,
          ),
        );
      }

      return h(
        'div',
        {
          ref: lifecycle.triggerRef,
          class: rootClass.value,
          attrs: {
            'data-testid':
              ((attrs as Record<string, unknown>)['data-testid'] as string) ?? 'select-root',
          },
          on: { ...lifecycle.triggerHandlers, click: onTriggerClick },
        },
        children,
      );
    };
  },
});

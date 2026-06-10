import {
  composeKeyboardSelection,
  defaultMentionProps,
  detectMultiMentionTrigger,
  ensureChronixMentionStyles,
  filterSelectOptions,
  flattenSelectOptions,
  resolveMentionDropdownClassList,
  resolveMentionEmptyClassList,
  resolveMentionOptionClassList,
  resolveMentionRootClassList,
  resolveMentionTextareaClassList,
  type MentionFilterFn,
  type MentionSource,
  type SelectOption,
  type PopupPlacement,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, toRef, type PropType, type VNode } from 'vue';

import { usePopupLifecycle } from '../composables/use-popup-lifecycle.js';

export const ChronixMention = defineComponent({
  name: 'ChronixMention',
  inheritAttrs: false,
  props: {
    value: { type: String, default: defaultMentionProps.value },
    options: {
      type: Array as PropType<readonly SelectOption[]>,
      default: () => defaultMentionProps.options,
    },
    trigger: { type: String, default: defaultMentionProps.trigger },
    placement: { type: String as PropType<PopupPlacement>, default: defaultMentionProps.placement },
    disabled: { type: Boolean, default: defaultMentionProps.disabled },
    placeholder: { type: String, default: defaultMentionProps.placeholder },
    sources: {
      type: Array as PropType<readonly MentionSource[]>,
      default: () => [],
    },
    filter: {
      type: Function as PropType<MentionFilterFn | undefined>,
      default: undefined,
    },
  },
  emits: { 'update:value': (_value: string) => true },
  setup(props, { emit, attrs }) {
    ensureChronixMentionStyles();
    const focusedKey = ref<string | null>(null);
    const mentionQuery = ref('');
    const mentionStartIndex = ref(0);
    const showDropdown = ref(false);
    const activeTrigger = ref<string>(props.trigger);

    // Effective triggers: from sources if provided, else single trigger
    const effectiveTriggers = computed(() =>
      props.sources.length > 0 ? props.sources.map((s) => s.trigger) : [props.trigger],
    );

    // Active options: from matching source if sources provided, else props.options
    const activeOptions = computed(() => {
      if (props.sources.length > 0) {
        const src = props.sources.find((s) => s.trigger === activeTrigger.value);
        return src ? src.options : [];
      }
      return props.options;
    });

    const lifecycle = usePopupLifecycle({
      show: showDropdown,
      trigger: ref('manual'),
      placement: toRef(props, 'placement'),
      offset: ref(4),
      flip: ref(true),
      widthMatch: ref(false),
      disabled: toRef(props, 'disabled'),
      onVisibilityChange: (next) => {
        showDropdown.value = next;
        if (!next) focusedKey.value = null;
      },
    });

    const filteredOptions = computed(() =>
      props.filter
        ? props.filter(mentionQuery.value, activeOptions.value)
        : filterSelectOptions(activeOptions.value, mentionQuery.value),
    );
    const flatEntries = computed(() => flattenSelectOptions(filteredOptions.value));
    const activatableKeys = computed(() =>
      flatEntries.value
        .filter((e) => !e.isGroup && !(e.option as { disabled?: boolean }).disabled)
        .map((e) => e.option.key),
    );
    const rootClass = computed(() =>
      resolveMentionRootClassList({ disabled: props.disabled, open: lifecycle.visible.value }).join(
        ' ',
      ),
    );

    function onTextareaInput(e: Event): void {
      const textarea = e.target as HTMLTextAreaElement;
      const newValue = textarea.value;
      const cursorIndex = textarea.selectionStart ?? 0;
      emit('update:value', newValue);
      const result = detectMultiMentionTrigger(newValue, cursorIndex, effectiveTriggers.value);
      if (result !== null) {
        mentionQuery.value = result.query;
        mentionStartIndex.value = result.triggerStart;
        activeTrigger.value = result.matchedTrigger;
        showDropdown.value = true;
      } else showDropdown.value = false;
    }
    function insertMention(opt: SelectOption): void {
      const leaf = opt as { value: string };
      if (!leaf.value) return;
      const current = props.value;
      const before = current.substring(0, mentionStartIndex.value);
      const after = current.substring(
        before.length + activeTrigger.value.length + mentionQuery.value.length,
      );
      emit('update:value', `${before}${activeTrigger.value}${leaf.value} ${after}`);
      showDropdown.value = false;
    }
    function onDropdownKeydown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        showDropdown.value = false;
        return;
      }
      if (e.key === 'Enter' && focusedKey.value !== null) {
        e.preventDefault();
        const entry = flatEntries.value.find((e) => e.option.key === focusedKey.value);
        if (entry && !entry.isGroup) insertMention(entry.option);
        return;
      }
      let direction: 'up' | 'down' | null = null;
      if (e.key === 'ArrowDown') direction = 'down';
      else if (e.key === 'ArrowUp') direction = 'up';
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
      const children: (VNode | null)[] = [
        h('textarea', {
          class: resolveMentionTextareaClassList().join(' '),
          attrs: {
            value: props.value,
            placeholder: props.placeholder,
            disabled: props.disabled,
            'data-testid': 'mention-textarea',
          },
          on: {
            input: onTextareaInput,
            keydown: (e: KeyboardEvent) => {
              if (lifecycle.visible.value) onDropdownKeydown(e);
            },
          },
        }),
      ];

      if (lifecycle.visible.value) {
        const optionNodes: VNode[] = [];
        if (flatEntries.value.length === 0) {
          optionNodes.push(
            h('div', { class: resolveMentionEmptyClassList().join(' ') }, 'No results'),
          );
        } else {
          for (const entry of flatEntries.value) {
            if (entry.isGroup) continue;
            const opt = entry.option;
            const isFocused = focusedKey.value === opt.key;
            const isDisabled = !!(opt as { disabled?: boolean }).disabled;
            optionNodes.push(
              h(
                'div',
                {
                  key: opt.key,
                  class: resolveMentionOptionClassList(false, isFocused, isDisabled).join(' '),
                  attrs: { 'data-testid': `mention-option-${opt.key}` },
                  on: {
                    mousedown: (e: MouseEvent) => {
                      e.preventDefault();
                      if (!isDisabled) insertMention(opt);
                    },
                    mouseenter: () => {
                      focusedKey.value = opt.key;
                    },
                  },
                },
                opt.label,
              ),
            );
          }
        }
        children.push(
          h(
            'div',
            {
              ref: lifecycle.popupRef,
              class: resolveMentionDropdownClassList().join(' '),
              style: lifecycle.popupStyle.value,
              on: lifecycle.popupHandlers,
              attrs: { 'data-testid': 'mention-dropdown-popup' },
            },
            optionNodes,
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
              ((attrs as Record<string, unknown>)['data-testid'] as string) ?? 'mention-root',
          },
        },
        children,
      );
    };
  },
});

import {
  defaultAutoCompleteProps,
  ensureChronixAutoCompleteStyles,
  filterAutoCompleteOptions,
  resolveAutoCompleteClassList,
  type AutoCompleteOption,
  type AutoCompleteSize,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type PropType, type VNode } from 'vue';

export const ChronixAutoComplete = defineComponent({
  name: 'ChronixAutoComplete',
  props: {
    value: { type: String, default: defaultAutoCompleteProps.value },
    options: {
      type: Array as PropType<readonly AutoCompleteOption[]>,
      default: () => defaultAutoCompleteProps.options,
    },
    placeholder: {
      type: String as PropType<string | undefined>,
      default: defaultAutoCompleteProps.placeholder,
    },
    disabled: { type: Boolean, default: defaultAutoCompleteProps.disabled },
    size: {
      type: String as PropType<AutoCompleteSize>,
      default: defaultAutoCompleteProps.size,
    },
    error: {
      type: String as PropType<string | undefined>,
      default: defaultAutoCompleteProps.error,
    },
  },
  emits: {
    'update:value': (_value: string) => true,
    select: (_option: AutoCompleteOption) => true,
  },
  setup(props, { emit }) {
    ensureChronixAutoCompleteStyles();

    const open = ref(false);
    const activeIndex = ref(0);

    const filtered = computed(() => filterAutoCompleteOptions(props.options, props.value));
    const classList = computed(() =>
      resolveAutoCompleteClassList({
        props: {
          value: props.value,
          options: props.options,
          placeholder: props.placeholder,
          disabled: props.disabled,
          size: props.size,
          error: props.error,
        },
        open: open.value && filtered.value.length > 0,
      }),
    );

    function selectOption(option: AutoCompleteOption) {
      emit('update:value', option.value);
      emit('select', option);
      open.value = false;
    }

    function onInput(event: Event) {
      const target = event.target as HTMLInputElement;
      emit('update:value', target.value);
      open.value = true;
      activeIndex.value = 0;
    }

    function onFocus() {
      open.value = true;
    }

    function onBlur() {
      setTimeout(() => {
        open.value = false;
      }, 100);
    }

    function onKeydown(event: KeyboardEvent) {
      const list = filtered.value;
      if (list.length === 0) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        activeIndex.value = (activeIndex.value + 1) % list.length;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        activeIndex.value = (activeIndex.value - 1 + list.length) % list.length;
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const opt = list[activeIndex.value];
        if (opt) selectOption(opt);
      } else if (event.key === 'Escape') {
        open.value = false;
      }
    }

    return () => {
      const children: VNode[] = [
        h('input', {
          class: 'cx-ui-autocomplete__input',
          value: props.value,
          placeholder: props.placeholder,
          disabled: props.disabled,
          onInput,
          onFocus,
          onBlur,
          onKeydown,
        }),
      ];
      if (open.value && filtered.value.length > 0) {
        const items: VNode[] = filtered.value.map((opt, i) =>
          h(
            'li',
            {
              key: opt.key,
              class: [
                'cx-ui-autocomplete__option',
                i === activeIndex.value ? 'cx-ui-autocomplete__option--active' : '',
              ],
              onMousedown: (e: MouseEvent) => {
                e.preventDefault();
                selectOption(opt);
              },
            },
            opt.label,
          ),
        );
        children.push(h('ul', { class: 'cx-ui-autocomplete__list' }, items));
      }
      if (props.error !== undefined) {
        children.push(h('span', { class: 'cx-ui-autocomplete__error' }, props.error));
      }
      return h('div', { class: classList.value }, children);
    };
  },
});

import {
  defaultInputProps,
  ensureChronixInputStyles,
  getInputInnerTag,
  resolveInputClassList,
  type InputProps,
  type InputSize,
  type InputType,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

export const ChronixInput = defineComponent({
  name: 'ChronixInput',
  props: {
    value: { type: String, default: defaultInputProps.value },
    type: {
      type: String as PropType<InputType>,
      default: defaultInputProps.type,
    },
    placeholder: {
      type: String as PropType<string | undefined>,
      default: defaultInputProps.placeholder,
    },
    disabled: { type: Boolean, default: defaultInputProps.disabled },
    clearable: { type: Boolean, default: defaultInputProps.clearable },
    size: {
      type: String as PropType<InputSize>,
      default: defaultInputProps.size,
    },
    rows: { type: Number, default: defaultInputProps.rows },
    error: {
      type: String as PropType<string | undefined>,
      default: defaultInputProps.error,
    },
  },
  emits: {
    'update:value': (_value: string) => true,
    focus: (_event: FocusEvent) => true,
    blur: (_event: FocusEvent) => true,
    clear: () => true,
  },
  setup(props, { emit }) {
    ensureChronixInputStyles();
    const resolvedProps = computed<InputProps>(() => ({
      value: props.value,
      type: props.type,
      placeholder: props.placeholder,
      disabled: props.disabled,
      clearable: props.clearable,
      size: props.size,
      rows: props.rows,
      error: props.error,
    }));
    const classList = computed(() => resolveInputClassList(resolvedProps.value));

    function onInput(event: Event) {
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      emit('update:value', target.value);
    }
    function onFocus(event: FocusEvent) {
      emit('focus', event);
    }
    function onBlur(event: FocusEvent) {
      emit('blur', event);
    }
    function onClear() {
      emit('update:value', '');
      emit('clear');
    }

    return () => {
      const innerTag = getInputInnerTag(resolvedProps.value);
      const innerAttrs: Record<string, unknown> = {
        placeholder: props.placeholder,
      };
      if (props.disabled) innerAttrs['disabled'] = 'disabled';
      if (innerTag === 'textarea') innerAttrs['rows'] = props.rows;
      const children: VNode[] = [
        h(innerTag, {
          class: 'cx-ui-input__inner',
          attrs: innerAttrs,
          domProps: { value: props.value },
          on: { input: onInput, focus: onFocus, blur: onBlur },
        }),
      ];
      if (props.clearable && props.value !== '' && !props.disabled) {
        children.push(
          h(
            'button',
            {
              class: 'cx-ui-input__clear',
              attrs: { type: 'button' },
              on: { click: onClear },
            },
            '×',
          ),
        );
      }
      if (props.error !== undefined) {
        children.push(h('span', { class: 'cx-ui-input__error' }, props.error));
      }
      return h('div', { class: classList.value }, children);
    };
  },
});

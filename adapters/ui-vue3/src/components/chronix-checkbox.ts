import {
  defaultCheckboxProps,
  ensureChronixCheckboxStyles,
  resolveCheckboxClassList,
  resolveCheckboxIconState,
} from '@chronixjs/ui';
import { computed, defineComponent, h, type PropType, type VNode } from 'vue';

export const ChronixCheckbox = defineComponent({
  name: 'ChronixCheckbox',
  props: {
    checked: { type: Boolean, default: defaultCheckboxProps.checked },
    indeterminate: {
      type: Boolean,
      default: defaultCheckboxProps.indeterminate,
    },
    disabled: { type: Boolean, default: defaultCheckboxProps.disabled },
    label: {
      type: String as PropType<string | undefined>,
      default: defaultCheckboxProps.label,
    },
    error: {
      type: String as PropType<string | undefined>,
      default: defaultCheckboxProps.error,
    },
  },
  emits: {
    'update:checked': (_checked: boolean) => true,
  },
  setup(props, { slots, emit }) {
    ensureChronixCheckboxStyles();
    const classList = computed(() =>
      resolveCheckboxClassList({
        checked: props.checked,
        indeterminate: props.indeterminate,
        disabled: props.disabled,
        label: props.label,
        error: props.error,
      }),
    );
    const iconState = computed(() => resolveCheckboxIconState(props.checked, props.indeterminate));

    function onClick() {
      if (props.disabled) return;
      emit('update:checked', !props.checked);
    }

    return () => {
      const labelSlot = slots['default'];
      const labelChildren: VNode[] = labelSlot
        ? labelSlot()
        : props.label !== undefined
          ? [h('span', {}, props.label)]
          : [];
      const boxChildren: VNode[] = [];
      if (iconState.value === 'checked') {
        boxChildren.push(
          h(
            'svg',
            {
              class: 'cx-ui-checkbox__icon',
              viewBox: '0 0 12 12',
              'aria-hidden': 'true',
            },
            [
              h('path', {
                d: 'M2.5 6L5 8.5L9.5 4',
                fill: 'none',
                stroke: 'currentColor',
                'stroke-width': 1.5,
                'stroke-linecap': 'round',
                'stroke-linejoin': 'round',
              }),
            ],
          ),
        );
      } else if (iconState.value === 'indeterminate') {
        boxChildren.push(h('span', { class: 'cx-ui-checkbox__icon' }));
      }
      const rootChildren: VNode[] = [h('span', { class: 'cx-ui-checkbox__box' }, boxChildren)];
      if (labelChildren.length > 0) {
        rootChildren.push(h('span', { class: 'cx-ui-checkbox__label' }, labelChildren));
      }
      if (props.error !== undefined) {
        rootChildren.push(h('span', { class: 'cx-ui-checkbox__error' }, props.error));
      }
      return h('label', { class: classList.value, onClick }, rootChildren);
    };
  },
});

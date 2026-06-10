import {
  defaultColorPickerProps,
  ensureChronixColorPickerStyles,
  resolveColorPickerRootClassList,
  resolveColorPickerTriggerClassList,
  resolveColorPickerPanelClassList,
  resolveColorPickerSwatchClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type PropType } from 'vue';

export const ChronixColorPicker = defineComponent({
  name: 'ChronixColorPicker',
  inheritAttrs: false,
  props: {
    value: { type: String as PropType<string | null>, default: defaultColorPickerProps.value },
    swatches: {
      type: Array as PropType<readonly string[]>,
      default: () => defaultColorPickerProps.swatches,
    },
    showAlpha: { type: Boolean, default: defaultColorPickerProps.showAlpha },
    disabled: { type: Boolean, default: defaultColorPickerProps.disabled },
    clearable: { type: Boolean, default: defaultColorPickerProps.clearable },
  },
  emits: {
    'update:value': (_value: string | null) => true,
  },
  setup(props, { emit, attrs }) {
    ensureChronixColorPickerStyles();
    const open = ref(false);

    const rootClass = computed(() =>
      resolveColorPickerRootClassList({ disabled: props.disabled, open: open.value }).join(' '),
    );

    function togglePanel(): void {
      if (!props.disabled) open.value = !open.value;
    }

    function selectSwatch(color: string): void {
      emit('update:value', color);
    }

    function clearValue(): void {
      emit('update:value', null);
    }

    return () =>
      h('div', { class: rootClass.value, ...attrs, 'data-testid': 'color-picker-root' }, [
        // Trigger - color preview swatch
        h(
          'div',
          {
            class: resolveColorPickerTriggerClassList({ hasValue: props.value != null }).join(' '),
            'data-testid': 'color-picker-trigger',
            onClick: togglePanel,
          },
          [
            h('div', {
              class: 'cx-ui-color-picker__color-preview',
              style: props.value ? { background: props.value } : undefined,
            }),
          ],
        ),
        // Panel
        h(
          'div',
          {
            class: resolveColorPickerPanelClassList({ open: open.value }).join(' '),
            'data-testid': 'color-picker-panel',
          },
          [
            // SV Square placeholder
            h('div', { class: 'cx-ui-color-picker__square' }),
            // Hue strip placeholder
            h('div', { class: 'cx-ui-color-picker__hue-strip' }),
            // Hex input
            h('div', { class: 'cx-ui-color-picker__hex-input' }, [
              h('input', {
                class: 'cx-ui-color-picker__hex-field',
                value: props.value ?? '',
                'data-testid': 'color-picker-hex',
              }),
            ]),
            // Swatches
            props.swatches.length > 0
              ? h(
                  'div',
                  { class: 'cx-ui-color-picker__swatches' },
                  props.swatches.map((color, i) =>
                    h('div', {
                      key: i,
                      class: resolveColorPickerSwatchClassList({
                        active: props.value === color,
                      }).join(' '),
                      style: { background: color },
                      'data-testid': `color-picker-swatch-${i}`,
                      onClick: () => selectSwatch(color),
                    }),
                  ),
                )
              : null,
            // Clear button
            props.clearable
              ? h(
                  'button',
                  {
                    class: 'cx-ui-color-picker__clear',
                    'data-testid': 'color-picker-clear',
                    onClick: clearValue,
                  },
                  'Clear',
                )
              : null,
          ],
        ),
      ]);
  },
});

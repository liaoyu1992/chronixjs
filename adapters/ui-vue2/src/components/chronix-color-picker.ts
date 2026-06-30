import {
  defaultColorPickerProps,
  ensureChronixColorPickerStyles,
  resolveColorPickerRootClassList,
  resolveColorPickerTriggerClassList,
  resolveColorPickerPanelClassList,
  resolveColorPickerSwatchClassList,
} from '@chronixjs/ui';
import { computed, defineComponent, h, ref, type PropType } from 'vue';

/**
 * `<ChronixColorPicker>` — Vue 2 color picker with trigger + panel.
 * . Vue 2: no Teleport -> inline panel.
 */
export const ChronixColorPicker = defineComponent({
  name: 'ChronixColorPicker',
  inheritAttrs: false,
  props: {
    value: {
      type: String as PropType<string | null>,
      default: defaultColorPickerProps.value,
    },
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

    return () => {
      const children: ReturnType<typeof h>[] = [
        // Trigger - color preview swatch
        h(
          'div',
          {
            class: resolveColorPickerTriggerClassList({ hasValue: props.value != null }).join(' '),
            attrs: { 'data-testid': 'color-picker-trigger' },
            on: { click: togglePanel },
          },
          [
            h('div', {
              class: 'cx-ui-color-picker__color-preview',
              style: props.value ? { background: props.value } : {},
            }),
          ],
        ),
      ];

      // Panel (always rendered in DOM for Vue 2 reactivity; CSS controls visibility)
      const panelChildren: ReturnType<typeof h>[] = [
        // SV Square placeholder
        h('div', { class: 'cx-ui-color-picker__square' }),
        // Hue strip placeholder
        h('div', { class: 'cx-ui-color-picker__hue-strip' }),
        // Hex input
        h('div', { class: 'cx-ui-color-picker__hex-input' }, [
          h('input', {
            class: 'cx-ui-color-picker__hex-field',
            domProps: { value: props.value ?? '' },
            attrs: { 'data-testid': 'color-picker-hex' },
          }),
        ]),
      ];

      // Swatches
      if (props.swatches.length > 0) {
        panelChildren.push(
          h(
            'div',
            { class: 'cx-ui-color-picker__swatches' },
            props.swatches.map((color, i) =>
              h('div', {
                key: i,
                class: resolveColorPickerSwatchClassList({ active: props.value === color }).join(
                  ' ',
                ),
                style: { background: color },
                attrs: { 'data-testid': `color-picker-swatch-${i}` },
                on: { click: () => selectSwatch(color) },
              }),
            ),
          ),
        );
      }

      // Clear button
      if (props.clearable) {
        panelChildren.push(
          h(
            'button',
            {
              class: 'cx-ui-color-picker__clear',
              attrs: { 'data-testid': 'color-picker-clear' },
              on: { click: clearValue },
            },
            'Clear',
          ),
        );
      }

      children.push(
        h(
          'div',
          {
            class: resolveColorPickerPanelClassList({ open: open.value }).join(' '),
            attrs: { 'data-testid': 'color-picker-panel' },
          },
          panelChildren,
        ),
      );

      return h(
        'div',
        {
          class: rootClass.value,
          attrs: {
            ...((attrs as Record<string, unknown>)['data-testid'] != null
              ? { 'data-testid': (attrs as Record<string, unknown>)['data-testid'] as string }
              : { 'data-testid': 'color-picker-root' }),
          },
        },
        children,
      );
    };
  },
});

/**
 * ColorPicker component IR — .
 *
 * Color picker with HSV square + hue strip + hex input + swatches.
 * Uses cx-kit `@chronixjs/cx-kit/color-picker` for all color math.
 * Value is `string | null` in `#rrggbb` hex format.
 */

export interface ColorPickerProps {
  /** Current color value as hex string (`#rrggbb`). `null` = no selection. */
  readonly value: string | null;
  /** Predefined swatch colors for quick selection. */
  readonly swatches: readonly string[];
  /** Show alpha slider for transparency. Default false. */
  readonly showAlpha: boolean;
  /** Alpha value 0-1. Only used when showAlpha is true. */
  readonly alpha: number;
  /** Disable the entire picker. */
  readonly disabled: boolean;
  /** Show clear button to reset value. */
  readonly clearable: boolean;
}

export const defaultColorPickerProps: ColorPickerProps = {
  value: null,
  swatches: [],
  showAlpha: false,
  alpha: 1,
  disabled: false,
  clearable: false,
};

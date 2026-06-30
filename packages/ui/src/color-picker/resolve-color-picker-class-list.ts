/**
 * ColorPicker BEM class-list resolvers — .
 */

export interface ResolveColorPickerRootClassListInput {
  readonly disabled: boolean;
  readonly open: boolean;
}

export function resolveColorPickerRootClassList(
  input: ResolveColorPickerRootClassListInput,
): string[] {
  const cls = ['cx-ui-color-picker'];
  if (input.disabled) cls.push('cx-ui-color-picker--disabled');
  if (input.open) cls.push('cx-ui-color-picker--open');
  return cls;
}

export interface ResolveColorPickerTriggerClassListInput {
  readonly hasValue: boolean;
}

export function resolveColorPickerTriggerClassList(
  input: ResolveColorPickerTriggerClassListInput,
): string[] {
  const cls = ['cx-ui-color-picker__trigger'];
  if (!input.hasValue) cls.push('cx-ui-color-picker__trigger--empty');
  return cls;
}

export interface ResolveColorPickerPanelClassListInput {
  readonly open: boolean;
}

export function resolveColorPickerPanelClassList(
  input: ResolveColorPickerPanelClassListInput,
): string[] {
  const cls = ['cx-ui-color-picker__panel'];
  if (!input.open) cls.push('cx-ui-color-picker__panel--hidden');
  return cls;
}

export function resolveColorPickerSquareClassList(): string[] {
  return ['cx-ui-color-picker__square'];
}

export function resolveColorPickerHueStripClassList(): string[] {
  return ['cx-ui-color-picker__hue-strip'];
}

export function resolveColorPickerAlphaStripClassList(): string[] {
  return ['cx-ui-color-picker__alpha-strip'];
}

export interface ResolveColorPickerSwatchClassListInput {
  readonly active: boolean;
}

export function resolveColorPickerSwatchClassList(
  input: ResolveColorPickerSwatchClassListInput,
): string[] {
  const cls = ['cx-ui-color-picker__swatch'];
  if (input.active) cls.push('cx-ui-color-picker__swatch--active');
  return cls;
}

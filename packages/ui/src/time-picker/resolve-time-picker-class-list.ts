/**
 * TimePicker BEM class-list resolvers — .
 */

export interface ResolveTimePickerRootClassListInput {
  readonly disabled: boolean;
  readonly open: boolean;
}

export function resolveTimePickerRootClassList(
  input: ResolveTimePickerRootClassListInput,
): string[] {
  const cls = ['cx-ui-time-picker'];
  if (input.disabled) cls.push('cx-ui-time-picker--disabled');
  if (input.open) cls.push('cx-ui-time-picker--open');
  return cls;
}

export interface ResolveTimePickerTriggerClassListInput {
  readonly hasValue: boolean;
  readonly active: boolean;
  readonly placeholder: boolean;
}

export function resolveTimePickerTriggerClassList(
  input: ResolveTimePickerTriggerClassListInput,
): string[] {
  const cls = ['cx-ui-time-picker__trigger'];
  if (input.active) cls.push('cx-ui-time-picker__trigger--active');
  if (input.placeholder) cls.push('cx-ui-time-picker__trigger--placeholder');
  return cls;
}

export interface ResolveTimePickerPanelClassListInput {
  readonly open: boolean;
}

export function resolveTimePickerPanelClassList(
  input: ResolveTimePickerPanelClassListInput,
): string[] {
  const cls = ['cx-ui-time-picker__panel'];
  if (!input.open) cls.push('cx-ui-time-picker__panel--hidden');
  return cls;
}

export interface ResolveTimePickerColumnItemClassListInput {
  readonly isSelected: boolean;
  readonly isDisabled: boolean;
}

export function resolveTimePickerColumnItemClassList(
  input: ResolveTimePickerColumnItemClassListInput,
): string[] {
  const cls = ['cx-ui-time-picker__item'];
  if (input.isSelected) cls.push('cx-ui-time-picker__item--selected');
  if (input.isDisabled) cls.push('cx-ui-time-picker__item--disabled');
  return cls;
}

export function resolveTimePickerColumnClassList(): string[] {
  return ['cx-ui-time-picker__column'];
}

/**
 * DatePicker BEM class-list resolvers — Phase 32 (2026-06-05).
 */

export interface ResolveDatePickerRootClassListInput {
  readonly disabled: boolean;
  readonly open: boolean;
}

export function resolveDatePickerRootClassList(
  input: ResolveDatePickerRootClassListInput,
): string[] {
  const cls = ['cx-ui-date-picker'];
  if (input.disabled) cls.push('cx-ui-date-picker--disabled');
  if (input.open) cls.push('cx-ui-date-picker--open');
  return cls;
}

export interface ResolveDatePickerTriggerClassListInput {
  readonly hasValue: boolean;
  readonly active: boolean;
  readonly placeholder: boolean;
}

export function resolveDatePickerTriggerClassList(
  input: ResolveDatePickerTriggerClassListInput,
): string[] {
  const cls = ['cx-ui-date-picker__trigger'];
  if (input.active) cls.push('cx-ui-date-picker__trigger--active');
  if (input.placeholder) cls.push('cx-ui-date-picker__trigger--placeholder');
  return cls;
}

export interface ResolveDatePickerPanelClassListInput {
  readonly open: boolean;
}

export function resolveDatePickerPanelClassList(
  input: ResolveDatePickerPanelClassListInput,
): string[] {
  const cls = ['cx-ui-date-picker__panel'];
  if (!input.open) cls.push('cx-ui-date-picker__panel--hidden');
  return cls;
}

export interface ResolveDatePickerDayClassListInput {
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly isDisabled: boolean;
}

export function resolveDatePickerDayClassList(input: ResolveDatePickerDayClassListInput): string[] {
  const cls = ['cx-ui-date-picker__day'];
  if (!input.isCurrentMonth) cls.push('cx-ui-date-picker__day--other-month');
  if (input.isToday) cls.push('cx-ui-date-picker__day--today');
  if (input.isSelected) cls.push('cx-ui-date-picker__day--selected');
  if (input.isDisabled) cls.push('cx-ui-date-picker__day--disabled');
  return cls;
}

export function resolveDatePickerHeaderClassList(): string[] {
  return ['cx-ui-date-picker__header'];
}

export function resolveDatePickerWeekdayClassList(): string[] {
  return ['cx-ui-date-picker__weekday'];
}

/**
 * Calendar BEM class-list resolvers — Phase 32 (2026-06-05).
 */

export interface ResolveCalendarRootClassListInput {
  readonly disabled: boolean;
}

export function resolveCalendarRootClassList(input: ResolveCalendarRootClassListInput): string[] {
  const cls = ['cx-ui-calendar'];
  if (input.disabled) cls.push('cx-ui-calendar--disabled');
  return cls;
}

export function resolveCalendarHeaderClassList(): string[] {
  return ['cx-ui-calendar__header'];
}

export interface ResolveCalendarDayClassListInput {
  readonly isCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isSelected: boolean;
  readonly isDisabled: boolean;
}

export function resolveCalendarDayClassList(input: ResolveCalendarDayClassListInput): string[] {
  const cls = ['cx-ui-calendar__day'];
  if (!input.isCurrentMonth) cls.push('cx-ui-calendar__day--other-month');
  if (input.isToday) cls.push('cx-ui-calendar__day--today');
  if (input.isSelected) cls.push('cx-ui-calendar__day--selected');
  if (input.isDisabled) cls.push('cx-ui-calendar__day--disabled');
  return cls;
}

export function resolveCalendarWeekdayClassList(): string[] {
  return ['cx-ui-calendar__weekday'];
}

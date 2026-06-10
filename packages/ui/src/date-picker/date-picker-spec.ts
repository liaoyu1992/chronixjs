/**
 * DatePicker component IR — Phase 32 (2026-06-05).
 *
 * Single-date picker with calendar popup panel. Uses date-fns for
 * all date math (format, parse, navigation). Value is `Date | undefined`.
 */

import type { PopupPlacement } from '../popup/popup-spec.js';

export interface DatePickerProps {
  /** Current value as a Date object. `undefined` = no selection. */
  readonly value: Date | undefined;
  /** date-fns format string for display. Default `'yyyy-MM-dd'`. */
  readonly format: string;
  /** Placeholder text when no value selected. */
  readonly placeholder: string;
  /** Disable the entire picker. */
  readonly disabled: boolean;
  /** Show clear icon to reset value. */
  readonly clearable: boolean;
  /** Calendar panel placement. Default `'bottom-start'`. */
  readonly placement: PopupPlacement;
  /** First day of week: 0=Sunday, 1=Monday, … 6=Saturday. Default 0. */
  readonly firstDayOfWeek: number;
  /** Callback to disable specific dates. */
  readonly isDateDisabled: ((date: Date) => boolean) | undefined;
}

export const defaultDatePickerProps: DatePickerProps = {
  value: undefined,
  format: 'yyyy-MM-dd',
  placeholder: '',
  disabled: false,
  clearable: false,
  placement: 'bottom-start',
  firstDayOfWeek: 0,
  isDateDisabled: undefined,
};

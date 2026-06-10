/**
 * TimePicker component IR — Phase 32 (2026-06-05).
 *
 * Single time picker with scrollable hour/minute/second columns.
 * Uses date-fns for time formatting/parsing. Value is `Date | undefined`.
 */

import type { PopupPlacement } from '../popup/popup-spec.js';

export interface TimePickerProps {
  /** Current value as a Date object. `undefined` = no selection. */
  readonly value: Date | undefined;
  /** date-fns format string for display. Default `'HH:mm:ss'`. */
  readonly format: string;
  /** Placeholder text when no value selected. */
  readonly placeholder: string;
  /** Disable the entire picker. */
  readonly disabled: boolean;
  /** Show clear icon to reset value. */
  readonly clearable: boolean;
  /** Step for hour values. Default 1. */
  readonly hourStep: number;
  /** Step for minute values. Default 1. */
  readonly minuteStep: number;
  /** Step for second values. Default 1. */
  readonly secondStep: number;
  /** Use 12-hour format with AM/PM column. Default false. */
  readonly use12Hours: boolean;
  /** Panel placement. Default `'bottom-start'`. */
  readonly placement: PopupPlacement;
  /** Callback to disable specific hours. */
  readonly isHourDisabled: ((hour: number) => boolean) | undefined;
  /** Callback to disable specific minutes. */
  readonly isMinuteDisabled: ((minute: number) => boolean) | undefined;
  /** Callback to disable specific seconds. */
  readonly isSecondDisabled: ((second: number) => boolean) | undefined;
}

export const defaultTimePickerProps: TimePickerProps = {
  value: undefined,
  format: 'HH:mm:ss',
  placeholder: '',
  disabled: false,
  clearable: false,
  hourStep: 1,
  minuteStep: 1,
  secondStep: 1,
  use12Hours: false,
  placement: 'bottom-start',
  isHourDisabled: undefined,
  isMinuteDisabled: undefined,
  isSecondDisabled: undefined,
};

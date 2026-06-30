/**
 * Calendar component IR — .
 *
 * Standalone calendar (always visible, no popup).
 * Reuses `generateCalendarGrid` from the DatePicker module.
 */

export interface CalendarProps {
  /** Current value as a Date object. `undefined` = no selection. */
  readonly value: Date | undefined;
  /** Disable the entire calendar. */
  readonly disabled: boolean;
  /** Callback to disable specific dates. */
  readonly isDateDisabled: ((date: Date) => boolean) | undefined;
}

export const defaultCalendarProps: CalendarProps = {
  value: undefined,
  disabled: false,
  isDateDisabled: undefined,
};

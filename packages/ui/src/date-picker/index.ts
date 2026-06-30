/**
 * DatePicker module — .
 *
 * Framework-agnostic date picker IR: calendar grid generation,
 * date formatting/parsing, navigation, BEM class resolvers, CSS.
 * Consumed by ui-vue3 / ui-vue2 / ui-react adapters.
 */

export type { DatePickerProps } from './date-picker-spec.js';
export { defaultDatePickerProps } from './date-picker-spec.js';

export type { CalendarGridCell, GenerateCalendarGridOptions } from './generate-calendar-grid.js';
export { generateCalendarGrid } from './generate-calendar-grid.js';

export { formatDateValue } from './format-date-value.js';
export { parseDateString } from './parse-date-string.js';

export type { CalendarViewMonth } from './navigate-calendar.js';
export {
  calendarMonthLabel,
  deriveCalendarViewMonth,
  nextCalendarMonth,
  prevCalendarMonth,
} from './navigate-calendar.js';

export type {
  ResolveDatePickerDayClassListInput,
  ResolveDatePickerRootClassListInput,
  ResolveDatePickerTriggerClassListInput,
} from './resolve-date-picker-class-list.js';
export {
  resolveDatePickerDayClassList,
  resolveDatePickerHeaderClassList,
  resolveDatePickerPanelClassList,
  resolveDatePickerRootClassList,
  resolveDatePickerTriggerClassList,
  resolveDatePickerWeekdayClassList,
} from './resolve-date-picker-class-list.js';

export { CHRONIX_DATE_PICKER_CSS, ensureChronixDatePickerStyles } from './date-picker-styles.js';

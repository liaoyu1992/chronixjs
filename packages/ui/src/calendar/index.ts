/**
 * Calendar module — .
 *
 * Framework-agnostic standalone calendar IR. Reuses
 * `generateCalendarGrid` from the DatePicker module.
 */

export type { CalendarProps } from './calendar-spec.js';
export { defaultCalendarProps } from './calendar-spec.js';

export type { ResolveCalendarDayClassListInput } from './resolve-calendar-class-list.js';
export {
  resolveCalendarDayClassList,
  resolveCalendarHeaderClassList,
  resolveCalendarRootClassList,
  resolveCalendarWeekdayClassList,
} from './resolve-calendar-class-list.js';

export { CHRONIX_CALENDAR_CSS, ensureChronixCalendarStyles } from './calendar-styles.js';

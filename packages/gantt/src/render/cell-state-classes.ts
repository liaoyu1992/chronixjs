/**
 * Phase 29 — per-day / per-slot CSS class derivation.
 *
 * Pure render-time helpers; no axis-shape extension. Adapter callers
 * pass a `Date` (from `AxisTick.time` or `AxisHeaderCell` derived
 * date) plus the same start-of-today reference Phase 21 / 22.2 already
 * derive, and read back the class set to attach to header / body
 * cells.
 *
 * Class names mirror the original spec convention with the chronix
 * `cx-` prefix:
 *
 *   `cx-gantt-day` + `cx-gantt-day-{dayId}` + state modifiers (day cells)
 *   `cx-gantt-slot` + `cx-gantt-slot-{dayId}` + state modifiers (body slots)
 *
 * State modifiers in scope: `-today` / `-past` / `-future`. The
 * `-disabled` modifier is parked until chronix grows a
 * `disabledDateRange` prop (the IR has no active-range concept today).
 * The `-other` modifier (out-of-current-month padding day) is
 * deliberately not emitted — chronix's month view is a continuous
 * timeline of in-range days, not a 7×6 calendar grid; there are no
 * "other-month" cells to mark.
 */

/**
 * Sun-anchored weekday ids matching the original spec `DAY_IDS`
 * literal exactly. The Sun=0 anchor means `tick.time.getDay()` indexes
 * straight into this array. Consumers porting CSS like
 * `.gantt-day-sat { background: ... }` map 1:1 to `.cx-gantt-day-sat`.
 */
export const DAY_IDS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type DayId = (typeof DAY_IDS)[number];

/**
 * Per-cell state derived from a date + today reference. Computed by
 * `computeCellStateMeta`; consumed by `getDayClassNames` and
 * `getSlotClassNames`. Kept as a separate value so adapter code can
 * compute it once per tick and reuse across the body slot rect, the
 * header cell rect, and the optional `headerCellClassNamesCallback`
 * arg.
 */
export interface CellStateMeta {
  readonly dayId: DayId;
  readonly isToday: boolean;
  readonly isPast: boolean;
  readonly isFuture: boolean;
}

/**
 * Compute meta for a date against a today reference. `today` MUST be
 * normalized to start-of-day in the same timezone as `date` so the
 * `isToday` comparison reads same-calendar-day regardless of time-of-
 * day. Adapter callers use `startOfDay(props.now ?? new Date())` and
 * pass the result here.
 *
 * `isPast` / `isFuture` are mutually exclusive with `isToday`: a date
 * that falls within today's calendar day is `isToday: true` and both
 * past/future are false. Dates before today's start are past; on or
 * after tomorrow's start are future. The dayId always reflects the
 * date's own weekday (independent of today).
 */
export function computeCellStateMeta(date: Date, today: Date): CellStateMeta {
  const dayId = DAY_IDS[date.getDay()]!;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isToday = date >= today && date < tomorrow;
  const isPast = !isToday && date < today;
  const isFuture = !isToday && date >= tomorrow;
  return { dayId, isToday, isPast, isFuture };
}

/**
 * Class list for a day cell — header day cells (week view's 7 day-
 * header cells, month/season/halfYear/year tick-row day labels) AND
 * any future per-day body cell. Returns at minimum
 * `['cx-gantt-day', 'cx-gantt-day-{dayId}']`; state modifiers append
 * when applicable. Never emits `-other` (architectural rejection —
 * chronix month view is continuous timeline, not calendar grid).
 */
export function getDayClassNames(meta: CellStateMeta): readonly string[] {
  const out: string[] = ['cx-gantt-day', `cx-gantt-day-${meta.dayId}`];
  if (meta.isToday) out.push('cx-gantt-day-today');
  if (meta.isPast) out.push('cx-gantt-day-past');
  if (meta.isFuture) out.push('cx-gantt-day-future');
  return out;
}

/**
 * Class list for a body slot rect — one per axis tick regardless of
 * view. Returns at minimum `['cx-gantt-slot', 'cx-gantt-slot-{dayId}']`;
 * state modifiers append when applicable. Matches the original spec
 * by omitting `-other` (the original `getSlotClassNames`
 * also omits it).
 */
export function getSlotClassNames(meta: CellStateMeta): readonly string[] {
  const out: string[] = ['cx-gantt-slot', `cx-gantt-slot-${meta.dayId}`];
  if (meta.isToday) out.push('cx-gantt-slot-today');
  if (meta.isPast) out.push('cx-gantt-slot-past');
  if (meta.isFuture) out.push('cx-gantt-slot-future');
  return out;
}

import type {
  AxisHeaderCell,
  AxisHeaderRow,
  AxisRangePlanInput,
  AxisTick,
  PlannedAxis,
  ViewId,
} from './types.js';

/**
 * Plans the time axis for a view: tick positions, slot width, header rows.
 * One of the five layout passes; first to run because everything downstream
 * (BarPlacementPass, LinkRouter) needs slot widths.
 */
export interface AxisRangePlanner {
  plan(input: AxisRangePlanInput): PlannedAxis;
}

/**
 * Whether each view's bottom-row label is a clock time ("0时", "13时") vs.
 * a calendar date ("13日三"). Time labels are shorter (max ~3 Han chars), so
 * the min-cell-width floor is smaller than for date labels.
 */
const IS_TIME_SCALE: Record<ViewId, boolean> = {
  day: true,
  week: true,
  month: false,
  season: false,
  halfYear: false,
  year: false,
};

/**
 * Slot width derivation matched to the parity reference's rendered geometry.
 * See `audit/journal/2026-05-13.md` (Phase 2 / slot-width parity) for the
 * empirical reverse-engineering of this formula.
 *
 * The floor is `minChars × fontSize`:
 *   - fontSize=13, minChars=4 → 52px for time-scale views (day/week)
 *   - fontSize=13, minChars=5 → 65px for date-scale views (month/.../year)
 *
 * If the viewport is wide enough that one slot fits more than the floor,
 * slots stretch to fill (`viewportWidth / slotCount`); otherwise the floor
 * holds and the axis becomes wider than the viewport (horizontal scroll).
 */
const LABEL_FONT_PX = 13;
const MIN_CHARS_TIME_SCALE = 4;
const MIN_CHARS_DATE_SCALE = 5;

function deriveSlotWidth(viewportWidth: number, slotCount: number, isTimeScale: boolean): number {
  const minChars = isTimeScale ? MIN_CHARS_TIME_SCALE : MIN_CHARS_DATE_SCALE;
  const floor = minChars * LABEL_FONT_PX;
  const stretched = viewportWidth / slotCount;
  return Math.max(stretched, floor);
}

const MS_PER_HOUR = 60 * 60 * 1000;
const MS_PER_DAY = 24 * MS_PER_HOUR;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Monday-anchored start of the week containing `d`. zh-CN, ISO-8601 and most
 * European locales start the week on Monday; en-US starts on Sunday. v0
 * hardcodes Monday — the locale-driven first-day-of-week resolution lands
 * when Intl.Locale.getWeekInfo() ships everywhere.
 */
function startOfWeekMonday(d: Date): Date {
  const x = startOfDay(d);
  // getDay(): 0=Sun..6=Sat. Map to 0=Mon..6=Sun via (day + 6) % 7.
  const offsetFromMonday = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - offsetFromMonday);
  return x;
}

/**
 * Whether the given date is a hidden weekend day under the current
 * `weekendsVisible` setting. When the option is off, day-of-week 0
 * (Sunday) and 6 (Saturday) are filtered out of the slot loop.
 *
 * Day view (single anchor day) never consults this — its filter
 * scope is _"week-and-wider views"_; see `planDayView` for the
 * rationale and `types.ts` for the public-API docstring.
 */
function isHiddenWeekendDay(d: Date, weekendsVisible: boolean): boolean {
  if (weekendsVisible) return false;
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

function planDayView(input: AxisRangePlanInput): PlannedAxis {
  // `input.weekendsVisible` is intentionally ignored for day view:
  // a day view renders 24 hourly ticks on the anchor calendar day,
  // even if that day is Saturday or Sunday. The filter's scope is
  // "week-and-wider views" (see types.ts JSDoc); day view always
  // shows the anchor day so a host can still drill into a Saturday
  // without the view going blank.
  const start = startOfDay(input.anchorDate);
  const slotCount = 24;
  const slotWidth = deriveSlotWidth(input.viewportWidth, slotCount, IS_TIME_SCALE.day);
  const totalWidth = slotWidth * slotCount;

  const hourFmt = new Intl.DateTimeFormat(input.locale, { hour: 'numeric', hour12: false });
  const dayFmt = new Intl.DateTimeFormat(input.locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const ticks: AxisTick[] = [];
  for (let i = 0; i < slotCount; i += 1) {
    const t = new Date(start);
    t.setHours(i);
    ticks.push({ x: i * slotWidth, time: t, label: hourFmt.format(t) });
  }

  const headerRows: AxisHeaderRow[] = [
    { cells: [{ x: 0, width: totalWidth, label: dayFmt.format(start) }] },
  ];

  return {
    viewId: 'day',
    slotWidth,
    slotDurationMs: MS_PER_HOUR,
    totalWidth,
    slotCount,
    ticks,
    headerRows,
  };
}

function startOfMonth(d: Date): Date {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function startOfYear(d: Date): Date {
  const x = startOfMonth(d);
  x.setMonth(0); // January
  return x;
}

/**
 * Counts how many _visible_ days fall in the `monthCount` months
 * starting at `start`, honoring the `weekendsVisible` filter. When
 * `weekendsVisible` is true, this equals the total day count of the
 * range (i.e. the original `countDaysAcrossMonths` behavior). When
 * false, Saturday + Sunday days are subtracted.
 *
 * Used to derive slot width up-front (the per-month iteration in
 * `planMonthBandedAxis` would otherwise need a two-pass structure).
 */
function countVisibleDaysAcrossMonths(
  start: Date,
  monthCount: number,
  weekendsVisible: boolean,
): number {
  let total = 0;
  const cursor = new Date(start);
  for (let m = 0; m < monthCount; m += 1) {
    const monthIndex = cursor.getMonth();
    while (cursor.getMonth() === monthIndex) {
      if (!isHiddenWeekendDay(cursor, weekendsVisible)) total += 1;
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return total;
}

function planMonthView(input: AxisRangePlanInput): PlannedAxis {
  const start = startOfMonth(input.anchorDate);
  const monthIndex = start.getMonth();
  const slotCount = countVisibleDaysAcrossMonths(start, 1, input.weekendsVisible);
  const slotWidth = deriveSlotWidth(input.viewportWidth, slotCount, IS_TIME_SCALE.month);

  // `weekday: 'narrow'` emits a one-char weekday in zh-CN ("一" … "六" / "日"),
  // matching the reference DOM's `"DD日<wd>"` tick-label format. The previous
  // `'short'` value emitted `"周X"` which is wider and looks wrong above
  // narrow day slots. See `audit/journal/2026-05-13.md` Phase 4.7.
  const dayFmt = new Intl.DateTimeFormat(input.locale, {
    day: 'numeric',
    weekday: 'narrow',
  });
  const monthFmt = new Intl.DateTimeFormat(input.locale, {
    year: 'numeric',
    month: 'long',
  });

  const ticks: AxisTick[] = [];
  const cursor = new Date(start);
  // Iterate via setDate until the month rolls over — robust to month length
  // and to any DST transition that might shorten or lengthen a single day.
  // Tick X uses the dense post-filter index (`ticks.length × slotWidth`) so
  // weekends-off views have no visual gaps where Sat/Sun would be.
  while (cursor.getMonth() === monthIndex) {
    if (!isHiddenWeekendDay(cursor, input.weekendsVisible)) {
      ticks.push({
        x: ticks.length * slotWidth,
        time: new Date(cursor),
        label: dayFmt.format(cursor),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  const totalWidth = slotWidth * slotCount;

  return {
    viewId: 'month',
    slotWidth,
    slotDurationMs: MS_PER_DAY,
    totalWidth,
    slotCount,
    ticks,
    headerRows: [{ cells: [{ x: 0, width: totalWidth, label: monthFmt.format(start) }] }],
  };
}

/**
 * Generic N-month axis with day-resolution ticks and a single month-cell
 * header row. Used by:
 * - season (3 months, anchored to start-of-anchor-month)
 * - halfYear (6 months, anchored to start-of-anchor-month)
 * - year (12 months, anchored to start-of-anchor-year)
 *
 * Caller decides where the axis starts; this function does the iteration.
 */
function planMonthBandedAxis(
  input: AxisRangePlanInput,
  start: Date,
  monthCount: number,
): PlannedAxis {
  const slotCount = countVisibleDaysAcrossMonths(start, monthCount, input.weekendsVisible);
  const slotWidth = deriveSlotWidth(input.viewportWidth, slotCount, IS_TIME_SCALE[input.viewId]);

  // `weekday: 'narrow'` — see `planMonthView` for the rationale.
  const dayFmt = new Intl.DateTimeFormat(input.locale, {
    day: 'numeric',
    weekday: 'narrow',
  });
  // Season / half-year / year views render each month band with the
  // short month name only (`"五月"`, `"六月"`, …) — no year, no leading
  // numeric. The reference DOM uses `{ month: 'long' }` so the band
  // stays compact across N parallel months. `planMonthView` (single
  // month) keeps `{ year: 'numeric', month: 'long' }` since the band
  // spans the entire axis and the year context is meaningful. See
  // `audit/journal/2026-05-13.md` Phase 4.9.
  const monthFmt = new Intl.DateTimeFormat(input.locale, {
    month: 'long',
  });

  const ticks: AxisTick[] = [];
  const monthCells: AxisHeaderCell[] = [];

  const cursor = new Date(start);
  for (let m = 0; m < monthCount; m += 1) {
    const monthStart = new Date(cursor);
    const monthIndex = cursor.getMonth();
    const firstSlotIdx = ticks.length;

    while (cursor.getMonth() === monthIndex) {
      if (!isHiddenWeekendDay(cursor, input.weekendsVisible)) {
        ticks.push({
          x: ticks.length * slotWidth,
          time: new Date(cursor),
          label: dayFmt.format(cursor),
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    const visibleDaysInMonth = ticks.length - firstSlotIdx;
    monthCells.push({
      x: firstSlotIdx * slotWidth,
      width: visibleDaysInMonth * slotWidth,
      label: monthFmt.format(monthStart),
    });
  }

  const totalWidth = slotCount * slotWidth;

  return {
    viewId: input.viewId,
    slotWidth,
    slotDurationMs: MS_PER_DAY,
    totalWidth,
    slotCount,
    ticks,
    headerRows: [{ cells: monthCells }],
  };
}

function planWeekView(input: AxisRangePlanInput): PlannedAxis {
  const monday = startOfWeekMonday(input.anchorDate);
  const hoursPerDay = 24;
  const daysInWeek = 7;

  // Pre-resolve the visible days (Mon..Fri when `weekendsVisible` is off,
  // Mon..Sun when on). Walking via setDate is robust to DST transitions
  // that could shorten/lengthen a single calendar day.
  const visibleDays: Date[] = [];
  for (let d = 0; d < daysInWeek; d += 1) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + d);
    if (!isHiddenWeekendDay(day, input.weekendsVisible)) visibleDays.push(day);
  }
  const visibleDayCount = visibleDays.length;
  const slotCount = hoursPerDay * visibleDayCount;
  const slotWidth = deriveSlotWidth(input.viewportWidth, slotCount, IS_TIME_SCALE.week);
  const totalWidth = slotWidth * slotCount;

  const hourFmt = new Intl.DateTimeFormat(input.locale, { hour: 'numeric', hour12: false });
  const dayFmt = new Intl.DateTimeFormat(input.locale, {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
  });

  const ticks: AxisTick[] = [];
  const dayCells: AxisHeaderCell[] = [];
  for (let d = 0; d < visibleDayCount; d += 1) {
    const dayStart = visibleDays[d]!;
    for (let h = 0; h < hoursPerDay; h += 1) {
      const t = new Date(dayStart);
      t.setHours(h);
      ticks.push({ x: ticks.length * slotWidth, time: t, label: hourFmt.format(t) });
    }
    dayCells.push({
      x: d * hoursPerDay * slotWidth,
      width: hoursPerDay * slotWidth,
      label: dayFmt.format(dayStart),
    });
  }

  return {
    viewId: 'week',
    slotWidth,
    slotDurationMs: MS_PER_HOUR,
    totalWidth,
    slotCount,
    ticks,
    headerRows: [{ cells: dayCells }],
  };
}

/**
 * Default planner. All six views implemented. day + week have hourly
 * ticks; month / season / halfYear / year have day-resolution ticks
 * banded by month. The last three differ only in anchor (month-start
 * vs year-start) and span (3 / 6 / 12 months).
 */
export const defaultAxisRangePlanner: AxisRangePlanner = {
  plan(input) {
    if (input.viewId === 'day') return planDayView(input);
    if (input.viewId === 'week') return planWeekView(input);
    if (input.viewId === 'month') return planMonthView(input);
    if (input.viewId === 'season') {
      return planMonthBandedAxis(input, startOfMonth(input.anchorDate), 3);
    }
    if (input.viewId === 'halfYear') {
      return planMonthBandedAxis(input, startOfMonth(input.anchorDate), 6);
    }
    if (input.viewId === 'year') {
      return planMonthBandedAxis(input, startOfYear(input.anchorDate), 12);
    }
    // Exhaustive against `ViewId`. If a new view is added to the union
    // without a branch above, the never-cast below becomes a compile error
    // — strictly better than a runtime "not implemented" fallback.
    const _exhaustive: never = input.viewId;
    throw new Error(`AxisRangePlanner: unhandled view '${String(_exhaustive)}'`);
  },
};

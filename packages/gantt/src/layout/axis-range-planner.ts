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

/** Default per-view slot widths in logical pixels. Tuned to match demo screenshots. */
const SLOT_WIDTH_BY_VIEW: Record<ViewId, number> = {
  day: 60,
  week: 60,
  month: 60,
  season: 60,
  halfYear: 30,
  year: 30,
};

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

function planDayView(input: AxisRangePlanInput): PlannedAxis {
  const start = startOfDay(input.anchorDate);
  const slotCount = 24;
  const slotWidth = SLOT_WIDTH_BY_VIEW.day;
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

function planMonthView(input: AxisRangePlanInput): PlannedAxis {
  const start = startOfMonth(input.anchorDate);
  const slotWidth = SLOT_WIDTH_BY_VIEW.month;
  const monthIndex = start.getMonth();

  const dayFmt = new Intl.DateTimeFormat(input.locale, {
    day: 'numeric',
    weekday: 'short',
  });
  const monthFmt = new Intl.DateTimeFormat(input.locale, {
    year: 'numeric',
    month: 'long',
  });

  // Iterate via setDate until the month rolls over — robust to month length
  // and to any DST transition that might shorten or lengthen a single day.
  const ticks: AxisTick[] = [];
  const cursor = new Date(start);
  let i = 0;
  while (cursor.getMonth() === monthIndex) {
    ticks.push({
      x: i * slotWidth,
      time: new Date(cursor),
      label: dayFmt.format(cursor),
    });
    i += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  const slotCount = i;
  const totalWidth = slotWidth * slotCount;

  return {
    viewId: 'month',
    slotWidth,
    totalWidth,
    slotCount,
    ticks,
    headerRows: [{ cells: [{ x: 0, width: totalWidth, label: monthFmt.format(start) }] }],
  };
}

/**
 * Generic N-month axis with day-resolution ticks and a single month-cell
 * header row. Used by season (3 months) and halfYear (6 months). Both
 * views anchor at start-of-anchor-month (rolling, not calendar-quarter
 * aligned) to match the demo's `duration: { months: N }` semantics.
 */
function planMultiMonthView(input: AxisRangePlanInput, monthCount: number): PlannedAxis {
  const start = startOfMonth(input.anchorDate);
  const slotWidth = SLOT_WIDTH_BY_VIEW[input.viewId];

  const dayFmt = new Intl.DateTimeFormat(input.locale, {
    day: 'numeric',
    weekday: 'short',
  });
  const monthFmt = new Intl.DateTimeFormat(input.locale, {
    year: 'numeric',
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
      ticks.push({
        x: ticks.length * slotWidth,
        time: new Date(cursor),
        label: dayFmt.format(cursor),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    const daysInMonth = ticks.length - firstSlotIdx;
    monthCells.push({
      x: firstSlotIdx * slotWidth,
      width: daysInMonth * slotWidth,
      label: monthFmt.format(monthStart),
    });
  }

  const slotCount = ticks.length;
  const totalWidth = slotCount * slotWidth;

  return {
    viewId: input.viewId,
    slotWidth,
    totalWidth,
    slotCount,
    ticks,
    headerRows: [{ cells: monthCells }],
  };
}

function planWeekView(input: AxisRangePlanInput): PlannedAxis {
  const monday = startOfWeekMonday(input.anchorDate);
  const slotWidth = SLOT_WIDTH_BY_VIEW.week;
  const hoursPerDay = 24;
  const days = 7;
  const slotCount = hoursPerDay * days;
  const totalWidth = slotWidth * slotCount;

  const hourFmt = new Intl.DateTimeFormat(input.locale, { hour: 'numeric', hour12: false });
  const dayFmt = new Intl.DateTimeFormat(input.locale, {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric',
  });

  const ticks: AxisTick[] = [];
  for (let i = 0; i < slotCount; i += 1) {
    const t = new Date(monday);
    t.setHours(i); // setHours auto-overflows into the next day
    ticks.push({ x: i * slotWidth, time: t, label: hourFmt.format(t) });
  }

  const dayCells: AxisHeaderCell[] = [];
  for (let d = 0; d < days; d += 1) {
    const dayStart = new Date(monday);
    dayStart.setDate(monday.getDate() + d);
    dayCells.push({
      x: d * hoursPerDay * slotWidth,
      width: hoursPerDay * slotWidth,
      label: dayFmt.format(dayStart),
    });
  }

  return {
    viewId: 'week',
    slotWidth,
    totalWidth,
    slotCount,
    ticks,
    headerRows: [{ cells: dayCells }],
  };
}

/**
 * Default planner. Day, week, month, season, halfYear views are
 * implemented; only year throws "not yet implemented" (it anchors at
 * year-boundary rather than month-boundary, so it lives in its own
 * branch — landing in a follow-up).
 */
export const defaultAxisRangePlanner: AxisRangePlanner = {
  plan(input) {
    if (input.viewId === 'day') return planDayView(input);
    if (input.viewId === 'week') return planWeekView(input);
    if (input.viewId === 'month') return planMonthView(input);
    if (input.viewId === 'season') return planMultiMonthView(input, 3);
    if (input.viewId === 'halfYear') return planMultiMonthView(input, 6);
    throw new Error(`AxisRangePlanner: view '${input.viewId}' not yet implemented`);
  },
};

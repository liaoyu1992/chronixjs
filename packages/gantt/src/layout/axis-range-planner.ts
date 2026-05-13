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
 * Default planner. Day + week views are implemented; the other four throw
 * with a clear "not yet implemented" message so callers can wire the
 * contract now and fill in views as they come online.
 */
export const defaultAxisRangePlanner: AxisRangePlanner = {
  plan(input) {
    if (input.viewId === 'day') return planDayView(input);
    if (input.viewId === 'week') return planWeekView(input);
    throw new Error(`AxisRangePlanner: view '${input.viewId}' not yet implemented`);
  },
};

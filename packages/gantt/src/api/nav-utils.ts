import type { AxisRangePlanInput, ViewId } from '../layout/types.js';

/**
 * Return the new anchor date one period earlier than `current` for
 * the given `viewId`. "Period" is per-view: day = ±1 day, week = ±7
 * days, month = ±1 calendar month, season = ±3 calendar months,
 * halfYear = ±6 calendar months, year = ±1 calendar year.
 *
 * Calendar-month arithmetic uses `Date.setMonth` semantics, which
 * rolls over month-end (Jan 31 + 1mo → Mar 3 in a non-leap February).
 * Callers that need strict end-of-month clamping should normalize
 * upstream; v0 matches the JS-native rollover so behavior is
 * predictable from `Date` alone.
 */
export function prevAnchor(viewId: ViewId, current: Date): Date {
  return shiftAnchor(viewId, current, -1);
}

/** Return the anchor date one period later than `current`. */
export function nextAnchor(viewId: ViewId, current: Date): Date {
  return shiftAnchor(viewId, current, +1);
}

/**
 * Return the local-midnight `Date` for today. Matches
 * `examples/gantt-vue3/src/sample-data.ts`'s `todayLocalMidnight`
 * shape so toolbar `today` navigation aligns with Phase 21
 * todayLine's cross-demo x-coordinate.
 */
export function todayAnchor(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function shiftAnchor(viewId: ViewId, current: Date, direction: -1 | 1): Date {
  const next = new Date(current.getTime());
  switch (viewId) {
    case 'day':
      next.setDate(next.getDate() + direction);
      return next;
    case 'week':
      next.setDate(next.getDate() + direction * 7);
      return next;
    case 'month':
      next.setMonth(next.getMonth() + direction);
      return next;
    case 'season':
      next.setMonth(next.getMonth() + direction * 3);
      return next;
    case 'halfYear':
      next.setMonth(next.getMonth() + direction * 6);
      return next;
    case 'year':
      next.setFullYear(next.getFullYear() + direction);
      return next;
  }
}

/**
 * Format the toolbar title for a given axis-range. Locale-fixed v0
 * — Chinese calendar conventions matching the demo's existing
 * `VIEW_LABELS`. Locale-driven formatting via `Intl.DateTimeFormat`
 * is a follow-up phase (lands when the `locale` field of
 * `AxisRangePlanInput` actually flows through to user-visible chrome).
 */
export function formatToolbarTitle(axisInput: AxisRangePlanInput): string {
  const d = axisInput.anchorDate;
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-based for display
  switch (axisInput.viewId) {
    case 'day':
      return `${year}-${pad2(month)}-${pad2(d.getDate())}`;
    case 'week':
      return `${year} 第${weekOfYear(d)}周`;
    case 'month':
      return `${year}年${month}月`;
    case 'season':
      return `${year} Q${Math.floor((month - 1) / 3) + 1}`;
    case 'halfYear':
      return `${year} H${month <= 6 ? 1 : 2}`;
    case 'year':
      return `${year}年`;
  }
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * ISO-style week-of-year (Monday as the first day of the week).
 * Returns 1-53. v0 inline implementation; if a second consumer
 * needs it, promote to a shared date util.
 */
function weekOfYear(d: Date): number {
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Move to Thursday in current week. ISO 8601 anchors weeks to Thursday.
  const day = (target.getDay() + 6) % 7; // 0 = Monday … 6 = Sunday
  target.setDate(target.getDate() - day + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstThursdayDay = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDay + 3);
  const diffDays = Math.round((target.getTime() - firstThursday.getTime()) / 86_400_000);
  return 1 + Math.floor(diffDays / 7);
}

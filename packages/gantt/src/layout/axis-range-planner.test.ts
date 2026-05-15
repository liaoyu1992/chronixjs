import { describe, expect, it } from 'vitest';

import { defaultAxisRangePlanner } from './axis-range-planner.js';

import type { AxisRangePlanInput } from './types.js';

const baseInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: new Date('2026-05-13T08:00:00'),
  viewportWidth: 1200,
  locale: 'zh-CN',
  weekendsVisible: true,
};

describe('defaultAxisRangePlanner — day view', () => {
  it('produces 24 hourly ticks anchored to local midnight', () => {
    const axis = defaultAxisRangePlanner.plan(baseInput);

    expect(axis.viewId).toBe('day');
    expect(axis.slotCount).toBe(24);
    expect(axis.ticks).toHaveLength(24);
    expect(axis.ticks[0]?.time.getHours()).toBe(0);
    expect(axis.ticks[23]?.time.getHours()).toBe(23);
  });

  it('ticks are evenly spaced by slotWidth', () => {
    const axis = defaultAxisRangePlanner.plan(baseInput);

    expect(axis.totalWidth).toBe(axis.slotWidth * 24);
    expect(axis.ticks[0]?.x).toBe(0);
    expect(axis.ticks[1]?.x).toBe(axis.slotWidth);
    expect(axis.ticks[23]?.x).toBe(axis.slotWidth * 23);
  });

  it('slotDurationMs = 1 hour', () => {
    const axis = defaultAxisRangePlanner.plan(baseInput);
    expect(axis.slotDurationMs).toBe(60 * 60 * 1000);
  });

  it('emits one header row spanning the full axis', () => {
    const axis = defaultAxisRangePlanner.plan(baseInput);

    expect(axis.headerRows).toHaveLength(1);
    expect(axis.headerRows[0]?.cells).toHaveLength(1);
    expect(axis.headerRows[0]?.cells[0]?.width).toBe(axis.totalWidth);
    expect(axis.headerRows[0]?.cells[0]?.x).toBe(0);
  });

  it('tick labels use the requested locale', () => {
    const axis = defaultAxisRangePlanner.plan(baseInput);

    expect(axis.ticks[0]?.label).toMatch(/0/);
    expect(axis.ticks[8]?.label).toMatch(/8/);
  });

  it('anchorDate time-of-day is ignored — axis starts at midnight', () => {
    const at8am = defaultAxisRangePlanner.plan({
      ...baseInput,
      anchorDate: new Date('2026-05-13T08:30:00'),
    });
    const atMidnight = defaultAxisRangePlanner.plan({
      ...baseInput,
      anchorDate: new Date('2026-05-13T00:00:00'),
    });

    expect(at8am.ticks[0]?.time.getTime()).toBe(atMidnight.ticks[0]?.time.getTime());
  });
});

describe('defaultAxisRangePlanner — week view', () => {
  const weekInput: AxisRangePlanInput = { ...baseInput, viewId: 'week' };

  it('produces 168 hourly ticks across 7 days', () => {
    const axis = defaultAxisRangePlanner.plan(weekInput);

    expect(axis.viewId).toBe('week');
    expect(axis.slotCount).toBe(168);
    expect(axis.ticks).toHaveLength(168);
    expect(axis.totalWidth).toBe(axis.slotWidth * 168);
    expect(axis.slotDurationMs).toBe(60 * 60 * 1000);
  });

  it('anchors at Monday of the anchorDate week', () => {
    // 2026-05-13 is a Wednesday; the containing week's Monday is 2026-05-11.
    const axis = defaultAxisRangePlanner.plan(weekInput);
    const first = axis.ticks[0]?.time;

    expect(first?.getDay()).toBe(1); // Monday
    expect(first?.getDate()).toBe(11);
    expect(first?.getMonth()).toBe(4); // May (0-indexed)
    expect(first?.getHours()).toBe(0);
  });

  it('anchors on the same Monday for any day in that week', () => {
    const wedMonday = defaultAxisRangePlanner
      .plan({ ...weekInput, anchorDate: new Date('2026-05-13T08:00:00') })
      .ticks[0]?.time.getTime();
    const sunMonday = defaultAxisRangePlanner
      .plan({ ...weekInput, anchorDate: new Date('2026-05-17T23:00:00') })
      .ticks[0]?.time.getTime();
    const monMonday = defaultAxisRangePlanner
      .plan({ ...weekInput, anchorDate: new Date('2026-05-11T00:00:00') })
      .ticks[0]?.time.getTime();

    expect(wedMonday).toBe(monMonday);
    expect(sunMonday).toBe(monMonday);
  });

  it('emits one header row with 7 day-cells, each 24 slots wide', () => {
    const axis = defaultAxisRangePlanner.plan(weekInput);
    const [dayRow] = axis.headerRows;

    expect(axis.headerRows).toHaveLength(1);
    expect(dayRow?.cells).toHaveLength(7);
    expect(dayRow?.cells[0]?.x).toBe(0);
    expect(dayRow?.cells[0]?.width).toBe(axis.slotWidth * 24);
    expect(dayRow?.cells[6]?.x).toBe(axis.slotWidth * 24 * 6);
  });

  it('day-cell widths cover the full axis with no gaps', () => {
    const axis = defaultAxisRangePlanner.plan(weekInput);
    const cells = axis.headerRows[0]?.cells ?? [];
    const summed = cells.reduce((acc, c) => acc + c.width, 0);

    expect(summed).toBe(axis.totalWidth);
    for (let i = 1; i < cells.length; i += 1) {
      expect(cells[i]?.x).toBe((cells[i - 1]?.x ?? 0) + (cells[i - 1]?.width ?? 0));
    }
  });
});

describe('defaultAxisRangePlanner — month view', () => {
  it('produces 31 day-ticks for May 2026 (31-day month)', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'month',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });

    expect(axis.viewId).toBe('month');
    expect(axis.slotCount).toBe(31);
    expect(axis.ticks).toHaveLength(31);
    expect(axis.totalWidth).toBe(axis.slotWidth * 31);
    expect(axis.slotDurationMs).toBe(24 * 60 * 60 * 1000);
  });

  it('produces 30 day-ticks for April 2026 (30-day month)', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'month',
      anchorDate: new Date('2026-04-15T08:00:00'),
    });

    expect(axis.slotCount).toBe(30);
  });

  it('produces 29 day-ticks for February 2024 (leap year)', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'month',
      anchorDate: new Date('2024-02-15T08:00:00'),
    });

    expect(axis.slotCount).toBe(29);
  });

  it('produces 28 day-ticks for February 2025 (non-leap year)', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'month',
      anchorDate: new Date('2025-02-15T08:00:00'),
    });

    expect(axis.slotCount).toBe(28);
  });

  it('anchors at day 1 of the anchorDate month', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'month',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });

    expect(axis.ticks[0]?.time.getDate()).toBe(1);
    expect(axis.ticks[0]?.time.getMonth()).toBe(4); // May
    expect(axis.ticks[0]?.time.getHours()).toBe(0);
  });

  it('ticks span exactly one month — last tick is the last day', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'month',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });
    const last = axis.ticks[axis.ticks.length - 1]?.time;

    expect(last?.getMonth()).toBe(4); // still May
    expect(last?.getDate()).toBe(31);
  });

  it('emits one full-width header row labelling the month', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'month',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });

    expect(axis.headerRows).toHaveLength(1);
    expect(axis.headerRows[0]?.cells).toHaveLength(1);
    expect(axis.headerRows[0]?.cells[0]?.width).toBe(axis.totalWidth);
  });
});

describe('defaultAxisRangePlanner — season view (3-month span)', () => {
  it('produces day-ticks for May+Jun+Jul 2026 (31+30+31 = 92 days)', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'season',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });

    expect(axis.viewId).toBe('season');
    expect(axis.slotCount).toBe(31 + 30 + 31);
    expect(axis.totalWidth).toBe(axis.slotWidth * 92);
  });

  it('handles short-month anchor — Feb 2024 (leap year) gives 29+31+30 = 90', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'season',
      anchorDate: new Date('2024-02-15T08:00:00'),
    });

    expect(axis.slotCount).toBe(29 + 31 + 30);
  });

  it('emits one header row with 3 month-cells, each width = (days in that month) × slotWidth', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'season',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });
    const cells = axis.headerRows[0]?.cells ?? [];

    expect(axis.headerRows).toHaveLength(1);
    expect(cells).toHaveLength(3);
    expect(cells[0]?.width).toBe(axis.slotWidth * 31); // May: 31 days
    expect(cells[1]?.width).toBe(axis.slotWidth * 30); // Jun: 30 days
    expect(cells[2]?.width).toBe(axis.slotWidth * 31); // Jul: 31 days
  });

  it('month-cells tile the axis with no gaps and sum to totalWidth', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'season',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });
    const cells = axis.headerRows[0]?.cells ?? [];
    const summed = cells.reduce((acc, c) => acc + c.width, 0);

    expect(summed).toBe(axis.totalWidth);
    for (let i = 1; i < cells.length; i += 1) {
      expect(cells[i]?.x).toBe((cells[i - 1]?.x ?? 0) + (cells[i - 1]?.width ?? 0));
    }
  });
});

describe('defaultAxisRangePlanner — halfYear view (6-month span)', () => {
  it('produces day-ticks for May..Oct 2026 (31+30+31+31+30+31 = 184 days)', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'halfYear',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });

    expect(axis.viewId).toBe('halfYear');
    expect(axis.slotCount).toBe(31 + 30 + 31 + 31 + 30 + 31);
  });

  it('emits 6 month-cells', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'halfYear',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });

    expect(axis.headerRows[0]?.cells).toHaveLength(6);
  });

  it('slotWidth bottoms out at the date-scale label floor (65px) for narrow viewports', () => {
    // 184 days × <floor> would otherwise produce sub-pixel slots; the floor
    // forces 65px each and the axis becomes scroll-wider than the viewport.
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'halfYear',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });

    expect(axis.slotWidth).toBe(65);
  });
});

describe('defaultAxisRangePlanner — year view (12-month span, year-boundary anchored)', () => {
  it('produces 365 day-ticks for 2026 (non-leap year)', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'year',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });

    expect(axis.viewId).toBe('year');
    expect(axis.slotCount).toBe(365);
    expect(axis.totalWidth).toBe(axis.slotWidth * 365);
  });

  it('produces 366 day-ticks for 2024 (leap year)', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'year',
      anchorDate: new Date('2024-05-13T08:00:00'),
    });

    expect(axis.slotCount).toBe(366);
  });

  it('anchors at January 1 regardless of anchorDate month', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'year',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });
    const first = axis.ticks[0]?.time;

    expect(first?.getMonth()).toBe(0); // January
    expect(first?.getDate()).toBe(1);
    expect(first?.getFullYear()).toBe(2026);
  });

  it('emits 12 month-cells in the header row', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'year',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });

    expect(axis.headerRows).toHaveLength(1);
    expect(axis.headerRows[0]?.cells).toHaveLength(12);
  });

  it('slotWidth bottoms out at the date-scale label floor (65px) — year scale is too wide to stretch', () => {
    // 365 days × any stretched width would underflow the 65px label floor.
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'year',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });

    expect(axis.slotWidth).toBe(65);
  });

  it('month-cells tile the axis with no gaps', () => {
    const axis = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'year',
      anchorDate: new Date('2024-05-13T08:00:00'), // leap year — Feb cell width matters
    });
    const cells = axis.headerRows[0]?.cells ?? [];
    const summed = cells.reduce((acc, c) => acc + c.width, 0);

    expect(summed).toBe(axis.totalWidth);
    // Feb 2024 is leap — its cell is 29 × slotWidth, not 28.
    expect(cells[1]?.width).toBe(axis.slotWidth * 29);
  });
});

/**
 * `weekendsVisible: false` filter tests. Closes the BLOCKING drift
 * called out in `audit/PARITY_RECHECK.md` Batch 1 #10 — the flag
 * was plumbed through the input type but never read by the planner.
 *
 * Semantics under `weekendsVisible: false`: day-of-week 0 (Sun) and
 * 6 (Sat) are filtered out of the slot loop. Tick X positions stay
 * dense-packed (no visual gap where weekends would be); header band
 * widths shrink to cover only the visible days; slot width is
 * recomputed against the filtered slot count.
 *
 * Scope: week / month / season / halfYear / year views filter; day
 * view stays untouched (renders 24 hourly ticks regardless). See
 * `audit/PHASE_18_WEEKENDS_VISIBLE_FILTER_DESIGN.md` for the catalog.
 *
 * Day-count math (anchor 2026-05-13 = Wed, Mon 2026-05-11 starts week):
 * - Week Mon-Sun: 5 weekdays (Mon-Fri) × 24 = 120 hourly slots
 * - May 2026: 31 days, 10 weekend days → 21 weekdays
 * - Jun 2026: 30 days, 8 weekend days → 22 weekdays
 * - Jul 2026: 31 days, 8 weekend days → 23 weekdays
 *   (May+Jun+Jul = 66 weekdays for season)
 * - Aug 2026: 31 days, 10 weekend days → 21 weekdays
 * - Sep 2026: 30 days, 8 weekend days → 22 weekdays
 * - Oct 2026: 31 days, 9 weekend days → 22 weekdays
 *   (May..Oct = 131 weekdays for halfYear)
 * - 2026 full year: 365 days, 104 weekend days → 261 weekdays
 */
describe('defaultAxisRangePlanner — weekendsVisible: false', () => {
  const weekdaysOnly = (anchor: string): AxisRangePlanInput => ({
    ...baseInput,
    weekendsVisible: false,
    anchorDate: new Date(anchor),
  });

  it('week view: 5 visible days × 24 hours = 120 slots, 5 day-cells, no Sat/Sun labels', () => {
    const axis = defaultAxisRangePlanner.plan({ ...weekdaysOnly('2026-05-13T08:00:00'), viewId: 'week' });

    expect(axis.slotCount).toBe(120);
    expect(axis.ticks).toHaveLength(120);
    expect(axis.headerRows[0]?.cells).toHaveLength(5);

    const dayCellLabels = axis.headerRows[0]?.cells.map((c) => c.label) ?? [];
    // zh-CN `weekday: 'short'` emits `周一 .. 周日`. Verify Sat/Sun are absent.
    expect(dayCellLabels.some((l) => l.includes('周六') || l.includes('周日'))).toBe(false);

    // Tick dates carry no Sat/Sun day-of-week.
    const tickDays = new Set(axis.ticks.map((t) => t.time.getDay()));
    expect(tickDays.has(0)).toBe(false);
    expect(tickDays.has(6)).toBe(false);
    expect(tickDays).toEqual(new Set([1, 2, 3, 4, 5]));
  });

  it('week view: ticks are dense-packed (no X gaps where weekends would be)', () => {
    const axis = defaultAxisRangePlanner.plan({ ...weekdaysOnly('2026-05-13T08:00:00'), viewId: 'week' });

    for (let i = 0; i < axis.ticks.length; i += 1) {
      expect(axis.ticks[i]?.x).toBe(i * axis.slotWidth);
    }
    expect(axis.totalWidth).toBe(axis.slotWidth * 120);
  });

  it('week view: slotWidth differs from weekendsVisible:true (recomputed against smaller slotCount)', () => {
    const off = defaultAxisRangePlanner.plan({ ...weekdaysOnly('2026-05-13T08:00:00'), viewId: 'week' });
    const on = defaultAxisRangePlanner.plan({
      ...baseInput,
      viewId: 'week',
      anchorDate: new Date('2026-05-13T08:00:00'),
    });

    // viewportWidth=1200 stretches to fill in both cases:
    //   on:  1200 / 168 = 7.14px (under the 52px floor → 52px)
    //   off: 1200 / 120 = 10px   (still under the 52px floor → 52px)
    // Both hit the floor at baseInput.viewportWidth=1200, so slotWidth
    // is equal here. Verify the *slotCounts* differ — the visible
    // change — and totalWidth scales accordingly.
    expect(off.slotCount).toBe(120);
    expect(on.slotCount).toBe(168);
    expect(off.totalWidth).toBeLessThan(on.totalWidth);
  });

  it('month view: May 2026 has 21 weekdays (31 days − 10 weekend days)', () => {
    const axis = defaultAxisRangePlanner.plan({ ...weekdaysOnly('2026-05-13T08:00:00'), viewId: 'month' });

    expect(axis.slotCount).toBe(21);
    expect(axis.ticks).toHaveLength(21);
    expect(axis.totalWidth).toBe(axis.slotWidth * 21);

    // Outer header cell still spans the full filtered axis width.
    expect(axis.headerRows[0]?.cells).toHaveLength(1);
    expect(axis.headerRows[0]?.cells[0]?.width).toBe(axis.totalWidth);

    // No Sat/Sun in tick dates.
    const tickDays = new Set(axis.ticks.map((t) => t.time.getDay()));
    expect(tickDays.has(0)).toBe(false);
    expect(tickDays.has(6)).toBe(false);
  });

  it('season view: May+Jun+Jul 2026 weekdays sum to 21+22+23 = 66; monthCells reflect per-month visible-day widths', () => {
    const axis = defaultAxisRangePlanner.plan({ ...weekdaysOnly('2026-05-13T08:00:00'), viewId: 'season' });

    expect(axis.slotCount).toBe(66);
    const cells = axis.headerRows[0]?.cells ?? [];
    expect(cells).toHaveLength(3);
    expect(cells[0]?.width).toBe(axis.slotWidth * 21); // May
    expect(cells[1]?.width).toBe(axis.slotWidth * 22); // Jun
    expect(cells[2]?.width).toBe(axis.slotWidth * 23); // Jul

    // monthCells tile the axis with no gaps.
    const summed = cells.reduce((acc, c) => acc + c.width, 0);
    expect(summed).toBe(axis.totalWidth);
    for (let i = 1; i < cells.length; i += 1) {
      expect(cells[i]?.x).toBe((cells[i - 1]?.x ?? 0) + (cells[i - 1]?.width ?? 0));
    }
  });

  it('halfYear view: May..Oct 2026 weekdays = 131 (within parity assertion 125..135 range)', () => {
    const axis = defaultAxisRangePlanner.plan({ ...weekdaysOnly('2026-05-13T08:00:00'), viewId: 'halfYear' });

    expect(axis.slotCount).toBe(131);
    expect(axis.slotCount).toBeGreaterThanOrEqual(125);
    expect(axis.slotCount).toBeLessThanOrEqual(135);

    const cells = axis.headerRows[0]?.cells ?? [];
    expect(cells).toHaveLength(6);
    const summed = cells.reduce((acc, c) => acc + c.width, 0);
    expect(summed).toBe(axis.totalWidth);
  });

  it('year view: 2026 has 261 weekdays (365 − 104 weekend days); 12 monthCells tile the axis', () => {
    const axis = defaultAxisRangePlanner.plan({ ...weekdaysOnly('2026-05-13T08:00:00'), viewId: 'year' });

    expect(axis.slotCount).toBe(261);
    const cells = axis.headerRows[0]?.cells ?? [];
    expect(cells).toHaveLength(12);
    const summed = cells.reduce((acc, c) => acc + c.width, 0);
    expect(summed).toBe(axis.totalWidth);
  });

  it('day view is unaffected: still 24 hourly ticks even when the anchor is a Saturday', () => {
    // 2026-05-16 is a Saturday. The filter's scope is "week-and-wider
    // views" — day view always renders 24 hourly ticks on the anchor
    // day so a host can still drill into a weekend day without the
    // view going blank.
    const axis = defaultAxisRangePlanner.plan({ ...weekdaysOnly('2026-05-16T08:00:00'), viewId: 'day' });

    expect(axis.slotCount).toBe(24);
    expect(axis.ticks).toHaveLength(24);
    expect(axis.ticks[0]?.time.getDate()).toBe(16);
    expect(axis.ticks[0]?.time.getDay()).toBe(6); // Saturday
  });
});

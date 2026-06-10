import { describe, expect, it } from 'vitest';

import { defaultAxisRangePlanner } from './axis-range-planner.js';
import { xToTime } from './x-to-time.js';

import type { AxisRangePlanInput } from './types.js';

const baseInput = (
  viewId: AxisRangePlanInput['viewId'] = 'day',
  anchorISO = '2026-05-18T00:00:00',
): AxisRangePlanInput => ({
  viewId,
  anchorDate: new Date(anchorISO),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
});

describe('xToTime', () => {
  it('maps x=0 to the first tick time on day view', () => {
    const axis = defaultAxisRangePlanner.plan(baseInput('day'));
    const time = xToTime(0, axis);
    expect(time.getTime()).toBe(axis.ticks[0]!.time.getTime());
  });

  it('maps x=slotWidth to first-tick + slotDurationMs on day view (hourly slot)', () => {
    const axis = defaultAxisRangePlanner.plan(baseInput('day'));
    const time = xToTime(axis.slotWidth, axis);
    const expectedMs = axis.ticks[0]!.time.getTime() + axis.slotDurationMs;
    expect(time.getTime()).toBe(expectedMs);
  });

  it('maps midnight click (x at slot boundary) to clean date on week view', () => {
    const axis = defaultAxisRangePlanner.plan(baseInput('week'));
    // Week view: each tick = 1 day. x=0 → Monday 00:00 of the week.
    const time = xToTime(0, axis);
    expect(time.getDay()).toBe(1); // Monday
    expect(time.getHours()).toBe(0);
    expect(time.getMinutes()).toBe(0);
  });

  it('returns Date(NaN) when axis.ticks is empty (degenerate axis)', () => {
    const degenerateAxis = {
      viewId: 'day' as const,
      slotWidth: 60,
      slotDurationMs: 3600000,
      totalWidth: 0,
      slotCount: 0,
      ticks: [],
      headerRows: [],
    };
    const time = xToTime(0, degenerateAxis);
    expect(Number.isNaN(time.getTime())).toBe(true);
  });

  it('handles x < 0 (off-axis-left) and x > totalWidth (off-axis-right)', () => {
    const axis = defaultAxisRangePlanner.plan(baseInput('day'));
    const beforeStart = xToTime(-axis.slotWidth, axis);
    const afterEnd = xToTime(axis.totalWidth + axis.slotWidth, axis);
    expect(beforeStart.getTime()).toBe(axis.ticks[0]!.time.getTime() - axis.slotDurationMs);
    const lastTickMs = axis.ticks[axis.ticks.length - 1]!.time.getTime();
    expect(afterEnd.getTime()).toBeGreaterThan(lastTickMs);
  });
});

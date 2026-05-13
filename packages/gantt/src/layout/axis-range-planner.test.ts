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

describe('defaultAxisRangePlanner — unimplemented views', () => {
  for (const viewId of ['week', 'month', 'season', 'halfYear', 'year'] as const) {
    it(`throws "not yet implemented" for ${viewId}`, () => {
      expect(() => defaultAxisRangePlanner.plan({ ...baseInput, viewId })).toThrow(
        /not yet implemented/,
      );
    });
  }
});

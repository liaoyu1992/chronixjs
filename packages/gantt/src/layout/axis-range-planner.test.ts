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

describe('defaultAxisRangePlanner — week view', () => {
  const weekInput: AxisRangePlanInput = { ...baseInput, viewId: 'week' };

  it('produces 168 hourly ticks across 7 days', () => {
    const axis = defaultAxisRangePlanner.plan(weekInput);

    expect(axis.viewId).toBe('week');
    expect(axis.slotCount).toBe(168);
    expect(axis.ticks).toHaveLength(168);
    expect(axis.totalWidth).toBe(axis.slotWidth * 168);
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

describe('defaultAxisRangePlanner — unimplemented views', () => {
  for (const viewId of ['month', 'season', 'halfYear', 'year'] as const) {
    it(`throws "not yet implemented" for ${viewId}`, () => {
      expect(() => defaultAxisRangePlanner.plan({ ...baseInput, viewId })).toThrow(
        /not yet implemented/,
      );
    });
  }
});

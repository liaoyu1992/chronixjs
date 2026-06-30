import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, RowSpec } from '@chronixjs/gantt';

const anchor = new Date('2026-05-13T00:00:00');
const rows: readonly RowSpec[] = [{ id: 'r1', columns: {} }];

const dayAxis: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

const weekAxis: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

const monthAxis: AxisRangePlanInput = {
  viewId: 'month',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

describe('<ChronixGantt> header day classes', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-13T08:00:00'));
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.useRealTimers();
  });

  it('week view: each of the 7 outer header day cells carries cx-gantt-day + cx-gantt-day-{dayId}', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: weekAxis },
    });
    const dayCells = wrapper.findAll('rect.cx-gantt-header-cell');
    // 7 day cells in the outer band.
    expect(dayCells.length).toBe(7);
    // Day order: Mon (2026-05-11), Tue (12), Wed (13 = today), Thu, Fri, Sat, Sun.
    const expectedDayIds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    for (let i = 0; i < dayCells.length; i += 1) {
      expect(dayCells[i]!.classes()).toContain('cx-gantt-day');
      expect(dayCells[i]!.classes()).toContain(`cx-gantt-day-${expectedDayIds[i]}`);
    }
  });

  it("week view: today's day-header-cell (Wed) carries cx-gantt-day-today", () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: weekAxis },
    });
    const dayCells = wrapper.findAll('rect.cx-gantt-header-cell');
    // The Wed cell (index 2) is today.
    expect(dayCells[2]!.classes()).toContain('cx-gantt-day-today');
    // Mon+Tue are past; Thu+Fri+Sat+Sun are future.
    expect(dayCells[0]!.classes()).toContain('cx-gantt-day-past');
    expect(dayCells[1]!.classes()).toContain('cx-gantt-day-past');
    expect(dayCells[3]!.classes()).toContain('cx-gantt-day-future');
    expect(dayCells[6]!.classes()).toContain('cx-gantt-day-future');
  });

  it('month view: each tick-row label carries cx-gantt-day + cx-gantt-day-{dayId} + state modifiers', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: monthAxis },
    });
    const tickLabels = wrapper.findAll('text.cx-gantt-tick-label');
    // May 2026 has 31 days → 31 tick labels.
    expect(tickLabels.length).toBe(31);
    // 2026-05-01 = Friday → first tick.
    expect(tickLabels[0]!.classes()).toContain('cx-gantt-day-fri');
    expect(tickLabels[0]!.classes()).toContain('cx-gantt-day-past');
    // 2026-05-13 = Wednesday → today, 13th tick (index 12).
    expect(tickLabels[12]!.classes()).toContain('cx-gantt-day-wed');
    expect(tickLabels[12]!.classes()).toContain('cx-gantt-day-today');
    // 2026-05-31 = Sunday → last tick, future.
    expect(tickLabels[30]!.classes()).toContain('cx-gantt-day-sun');
    expect(tickLabels[30]!.classes()).toContain('cx-gantt-day-future');
  });

  it('day view: the single outer header cell carries cx-gantt-day + day-id for the anchor day', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: dayAxis },
    });
    const dayCells = wrapper.findAll('rect.cx-gantt-header-cell');
    expect(dayCells.length).toBe(1);
    // 2026-05-13 = Wednesday → 'wed' + today.
    expect(dayCells[0]!.classes()).toContain('cx-gantt-day');
    expect(dayCells[0]!.classes()).toContain('cx-gantt-day-wed');
    expect(dayCells[0]!.classes()).toContain('cx-gantt-day-today');
  });

  it('cx-gantt-day-other is NEVER emitted on any header cell (architectural rejection guard)', () => {
    // Sweep all 6 views; no rendered header cell or tick label should
    // ever carry `-other` regardless of which day "today" is.
    const viewIds = ['day', 'week', 'month', 'season', 'halfYear', 'year'] as const;
    for (const viewId of viewIds) {
      const wrapper = mount(ChronixGantt, {
        props: {
          bars: [],
          rows,
          axisInput: {
            viewId,
            anchorDate: anchor,
            viewportWidth: 1440,
            locale: 'zh-CN',
            weekendsVisible: true,
          },
        },
      });
      const all = wrapper.findAll(
        'rect.cx-gantt-header-cell, text.cx-gantt-tick-label, rect.cx-gantt-slot',
      );
      for (const el of all) {
        expect(el.classes()).not.toContain('cx-gantt-day-other');
        expect(el.classes()).not.toContain('cx-gantt-slot-other');
      }
    }
  });
});

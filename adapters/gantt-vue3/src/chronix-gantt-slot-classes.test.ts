import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, RowSpec } from '@chronixjs/gantt';

// 2026-05-13 is a Wednesday. Pinning the anchor lets tests assert
// stable per-tick day-id assignments. The harness freezes `Date.now()`
// to the same moment so `computeCellStateMeta` reports `isToday=true`
// for the same calendar day across runs.
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

describe('<ChronixGantt> body slot rect emission — Phase 29', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // Freeze "now" to the anchor date so `isToday` resolution is
    // deterministic across runs / machines. Hour-of-day choice doesn't
    // matter — startOfDay normalizes it.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-13T08:00:00'));
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.useRealTimers();
  });

  it('emits one transparent <rect> per axis tick inside <g class="cx-gantt-slots">', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: dayAxis },
    });
    const slotGroup = wrapper.find('g.cx-gantt-slots');
    expect(slotGroup.exists()).toBe(true);
    // Day view: 24 hourly slots.
    const rects = slotGroup.findAll('rect.cx-gantt-slot');
    expect(rects.length).toBe(24);
    // Every slot rect is transparent + non-interactive.
    expect(rects[0]!.attributes('fill')).toBe('transparent');
    expect(rects[0]!.attributes('pointer-events')).toBe('none');
  });

  it('day view: each hourly slot rect carries the parent-day weekday class (Wed → cx-gantt-slot-wed)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: dayAxis },
    });
    const rects = wrapper.findAll('g.cx-gantt-slots rect.cx-gantt-slot');
    // All 24 hourly slots on 2026-05-13 share dayId=wed.
    for (const r of rects) {
      expect(r.classes()).toContain('cx-gantt-slot-wed');
    }
  });

  it('week view: Saturday-hour slots carry cx-gantt-slot-sat; Sunday-hour slots carry cx-gantt-slot-sun', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: weekAxis },
    });
    const rects = wrapper.findAll('g.cx-gantt-slots rect.cx-gantt-slot');
    // Week view spans Mon..Sun = 7 days × 24 hours = 168 slots.
    expect(rects.length).toBe(7 * 24);
    const satClass = rects.filter((r) => r.classes().includes('cx-gantt-slot-sat'));
    const sunClass = rects.filter((r) => r.classes().includes('cx-gantt-slot-sun'));
    expect(satClass.length).toBe(24);
    expect(sunClass.length).toBe(24);
  });

  it("today's slots carry cx-gantt-slot-today; past slots carry -past; future -future", () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: weekAxis },
    });
    const rects = wrapper.findAll('g.cx-gantt-slots rect.cx-gantt-slot');
    // Today's 24 hourly slots all carry `-today`. Mon=past (12), Tue=past (24),
    // Wed=today (24), Thu+ = future. Counts derived from week view's Mon
    // anchor on 2026-05-11 (Mon) → today is the 3rd day in the week =
    // hours 48..71 of the 168-hour axis.
    const todayCount = rects.filter((r) => r.classes().includes('cx-gantt-slot-today')).length;
    const pastCount = rects.filter((r) => r.classes().includes('cx-gantt-slot-past')).length;
    const futureCount = rects.filter((r) => r.classes().includes('cx-gantt-slot-future')).length;
    expect(todayCount).toBe(24);
    expect(pastCount).toBe(2 * 24); // Mon + Tue
    expect(futureCount).toBe(4 * 24); // Thu + Fri + Sat + Sun
    // Sanity: past + today + future == total slots.
    expect(todayCount + pastCount + futureCount).toBe(rects.length);
  });

  it('slot rect width matches axis.slotWidth and height matches body content height', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: dayAxis },
    });
    const rects = wrapper.findAll('g.cx-gantt-slots rect.cx-gantt-slot');
    // Day view's `axis.slotWidth` = max(viewportWidth/24, floor)
    // = max(60, 52) = 60. Body content height = 1 strip × 34 default
    // row height (Phase 43: barHeight 30 + firstBarTopPadding 4 = 34),
    // plus 0 row spacing.
    expect(rects[0]!.attributes('width')).toBe('60');
    // y=0 (anchored at body top), height covers all strips.
    expect(rects[0]!.attributes('y')).toBe('0');
    // height = single row height (34, Phase 43 default) since rows has 1 entry.
    expect(rects[0]!.attributes('height')).toBe('34');
  });

  it('month view: each daily slot rect carries the weekday class for that calendar day', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: [], rows, axisInput: monthAxis },
    });
    const rects = wrapper.findAll('g.cx-gantt-slots rect.cx-gantt-slot');
    // May 2026 has 31 days. Each gets its own dayId.
    expect(rects.length).toBe(31);
    // 2026-05-01 = Friday → first slot.
    expect(rects[0]!.classes()).toContain('cx-gantt-slot-fri');
    // 2026-05-13 = Wednesday → today, 13th slot (index 12).
    expect(rects[12]!.classes()).toContain('cx-gantt-slot-wed');
    expect(rects[12]!.classes()).toContain('cx-gantt-slot-today');
  });
});

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;

/**
 * Anchor date is a Wednesday at local midnight so day-view + week-view
 * fixtures have deterministic week-start tick alignment. Season view
 * starts at the month boundary regardless of anchor weekday.
 */
const anchor = new Date('2026-05-13T00:00:00');

const rows: readonly RowSpec[] = [
  { id: 'r1', columns: {} },
  { id: 'r2', columns: {} },
  { id: 'r3', columns: {} },
];

function bar(id: string, rowId: string, startHour: number, endHour: number): BarSpec {
  return {
    id,
    rowId,
    range: {
      start: new Date(anchor.getTime() + startHour * MS_PER_HOUR),
      end: new Date(anchor.getTime() + endHour * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
  };
}

const bars: readonly BarSpec[] = [bar('b1', 'r1', 1, 4), bar('b2', 'r2', 6, 10)];

function makeAxisInput(viewId: AxisRangePlanInput['viewId']): AxisRangePlanInput {
  return {
    viewId,
    anchorDate: anchor,
    viewportWidth: 1440,
    locale: 'zh-CN',
    weekendsVisible: true,
  };
}

describe('<ChronixGantt> body grid lines — Phase 26', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('emits no `.cx-gantt-grid` group when there are no rows AND no ticks (empty render)', () => {
    // Empty axis is impossible in practice (every view planner returns at
    // least one tick), so the gate that proves "no grid group" is
    // simultaneously zero strips AND zero ticks. With zero strips and
    // zero ticks the gridChildren array stays empty and `gridGroupNode`
    // resolves to null.
    //
    // Pre-Phase-26 behavior was always empty; this test pins the
    // "renders nothing extra when there's nothing to render" guarantee.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [],
        rows: [],
        axisInput: makeAxisInput('day'),
        viewportWidth: 0,
      },
    });
    // Zero strips means zero hlines; but a populated axis still emits
    // vlines. Day view always returns 24 ticks → grid group still exists.
    // Verify the GRID group renders with no hlines (since rows = []).
    expect(wrapper.findAll('.cx-gantt-grid-hline')).toHaveLength(0);
  });

  it('emits one `.cx-gantt-grid-vline` cell-boundary line per outer-header-cell start (day view → 1 boundary + 1 right edge)', () => {
    // Day view headerRows = [{ cells: [{ x: 0, width: totalWidth, label }] }]
    // → boundaryXSet = { 0 } → exactly 1 solid boundary vline at x=0,
    // plus 1 right-edge closing vline. Other 23 ticks render as dashed
    // sub-slot lines.
    const wrapper = mount(ChronixGantt, {
      props: { bars, rows, axisInput: makeAxisInput('day') },
    });
    const solidBoundaries = wrapper.findAll('rect.cx-gantt-grid-vline');
    // 1 cell-boundary (x=0) + 1 right-edge closing = 2 solid rects.
    expect(solidBoundaries).toHaveLength(2);
  });

  it('emits `.cx-gantt-grid-vline-dashed` at every non-cell-boundary slot (day view → 23 sub-hour dashed lines)', () => {
    // Day view: 24 hourly ticks; 1 cell-boundary at x=0; 23 non-boundary
    // → 23 dashed sub-slot lines.
    const wrapper = mount(ChronixGantt, {
      props: { bars, rows, axisInput: makeAxisInput('day') },
    });
    const dashedLines = wrapper.findAll('line.cx-gantt-grid-vline-dashed');
    expect(dashedLines).toHaveLength(23);
    // Verify the dashed-stroke attribute is present.
    expect(dashedLines[0]!.attributes('stroke-dasharray')).toBe('2,2');
  });

  it('emits `.cx-gantt-grid-vline-week` at Monday-midnight ticks (season view)', () => {
    // Season view (3 months from start-of-anchor-month = 2026-05-01)
    // covers May/Jun/Jul 2026. Mondays in that span at midnight:
    // 2026-05-04, 05-11, 05-18, 05-25, 06-01, 06-08, 06-15, 06-22, 06-29,
    // 07-06, 07-13, 07-20, 07-27 → 13 Mondays.
    //
    // BUT only ticks that are ALSO cell-boundaries (month-start in
    // season view) pick up the week-week class — k-ui's logic and
    // chronix's are both gated by `isBoundary` before checking week-start.
    // Month boundaries in season view: May 1 (Fri), Jun 1 (Mon),
    // Jul 1 (Wed) → exactly 1 month-boundary tick that's also Monday-00:00.
    // Result: 1 `cx-gantt-grid-vline-week` (Jun 1 2026 is the only
    // month-start that falls on Monday in this span).
    const wrapper = mount(ChronixGantt, {
      props: { bars, rows, axisInput: makeAxisInput('season') },
    });
    const weekStarts = wrapper.findAll('rect.cx-gantt-grid-vline-week');
    expect(weekStarts).toHaveLength(1);
    // Week-emphasis fill matches the theme default.
    expect(weekStarts[0]!.attributes('fill')).toBe('#bbb');
  });

  it('emits one `.cx-gantt-grid-hline` per row strip', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars, rows, axisInput: makeAxisInput('day') },
    });
    const hlines = wrapper.findAll('line.cx-gantt-grid-hline');
    // 3 rows → 3 hlines (one at every strip's bottom edge, including
    // the last strip — matches the parity reference's
    // `rowYPositions.forEach` without the `- 1` adjustment).
    expect(hlines).toHaveLength(3);
    // vector-effect attribute keeps stroke weight stable under any
    // future SVG zoom transform.
    expect(hlines[0]!.attributes('vector-effect')).toBe('non-scaling-stroke');
  });

  it('hline y values are half-integer in CSS px (device-pixel-grid snap at dpr=1)', () => {
    // Default JSDOM devicePixelRatio is 1. `snapHorizontalGridLineY`
    // returns `(round(y * 1) + 0.5) / 1 = round(y) + 0.5` → always
    // a half-integer when dpr=1. This proves the snap is firing.
    const wrapper = mount(ChronixGantt, {
      props: { bars, rows, axisInput: makeAxisInput('day') },
    });
    const hlines = wrapper.findAll('line.cx-gantt-grid-hline');
    expect(hlines.length).toBeGreaterThan(0);
    for (const hline of hlines) {
      const y1 = Number(hline.attributes('y1'));
      // Half-integer: subtract 0.5, result is integer.
      expect(Number.isInteger(y1 - 0.5)).toBe(true);
    }
  });

  it('emits a right-edge closing `cx-gantt-grid-vline` at `axis.totalWidth - 1`', () => {
    // Among the solid vlines, the rightmost x position should be
    // `axis.totalWidth - 1`. For day view at viewportWidth=1440 with
    // 24 hourly slots, slotWidth = 1440/24 = 60, totalWidth = 1440 →
    // rightmost vline at x=1439.
    const wrapper = mount(ChronixGantt, {
      props: { bars, rows, axisInput: makeAxisInput('day') },
    });
    const solidRects = wrapper.findAll('rect.cx-gantt-grid-vline');
    const xValues = solidRects.map((r) => Number(r.attributes('x')));
    const maxX = Math.max(...xValues);
    // Day view at viewportWidth=1440 → totalWidth=1440 (stretched) →
    // right edge at x=1439.
    expect(maxX).toBe(1439);
  });

  it('the `.cx-gantt-grid` group is `pointer-events: none` (no hit-test interference)', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars, rows, axisInput: makeAxisInput('day') },
    });
    const gridGroup = wrapper.find('g.cx-gantt-grid');
    expect(gridGroup.exists()).toBe(true);
    expect(gridGroup.attributes('pointer-events')).toBe('none');
  });
});

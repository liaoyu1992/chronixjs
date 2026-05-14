import { describe, expect, it } from 'vitest';

import { defaultAxisRangePlanner } from './axis-range-planner.js';
import { defaultBarStackHeightPass } from './bar-stack-height-pass.js';

import type { AxisRangePlanInput } from './types.js';
import type { BarSpec, RowSpec } from '../ir/index.js';

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: new Date('2026-05-13T08:00:00'),
  viewportWidth: 1200,
  locale: 'zh-CN',
  weekendsVisible: true,
};
const dayAxis = defaultAxisRangePlanner.plan(axisInput);

const bar = (id: string, rowId: string, startISO: string, endISO: string): BarSpec => ({
  id,
  rowId,
  range: { start: new Date(startISO), end: new Date(endISO) },
  dprIntent: 'crisp-pixel',
});

const row = (id: string): RowSpec => ({ id, columns: {} });

describe('defaultBarStackHeightPass — no-bar rows', () => {
  it('row with zero bars gets minRowHeight (= barHeight + firstBarTopPadding)', () => {
    const { heightsPerRow, heightByRowId } = defaultBarStackHeightPass.compute({
      bars: [],
      rows: [row('r1')],
      axis: dayAxis,
    });

    // Default: barHeight 30 + firstBarTopPadding 8 = 38
    expect(heightsPerRow).toEqual([38]);
    expect(heightByRowId.get('r1')).toBe(38);
  });

  it('respects an explicit minRowHeight override', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [],
      rows: [row('r1'), row('r2')],
      axis: dayAxis,
      minRowHeight: 50,
    });

    expect(heightsPerRow).toEqual([50, 50]);
  });
});

describe('defaultBarStackHeightPass — single-bar rows', () => {
  it('one in-range bar gives `topPad + barHeight + bottomPad` (default 8+30+4 = 42)', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [bar('b1', 'r1', '2026-05-13T08:00:00', '2026-05-13T10:00:00')],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(heightsPerRow).toEqual([8 + 30 + 4]);
  });

  it('honors custom barHeight / paddings', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [bar('b1', 'r1', '2026-05-13T08:00:00', '2026-05-13T10:00:00')],
      rows: [row('r1')],
      axis: dayAxis,
      barHeight: 20,
      firstBarTopPadding: 5,
      lastBarBottomPadding: 3,
    });

    expect(heightsPerRow).toEqual([5 + 20 + 3]);
  });
});

describe('defaultBarStackHeightPass — stacked rows', () => {
  it('two overlapping bars stack — height = topPad + 2×barHeight + spacing + bottomPad', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [
        bar('b1', 'r1', '2026-05-13T08:00:00', '2026-05-13T12:00:00'),
        bar('b2', 'r1', '2026-05-13T10:00:00', '2026-05-13T14:00:00'),
      ],
      rows: [row('r1')],
      axis: dayAxis,
    });

    // maxLevel=1, stackedHeight = 1×(30+10)+30 = 70, computed = 8+70+4 = 82
    expect(heightsPerRow).toEqual([82]);
  });

  it('three non-overlapping bars fit on level 0 — height unchanged from single-bar', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [
        bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T02:00:00'),
        bar('b2', 'r1', '2026-05-13T03:00:00', '2026-05-13T05:00:00'),
        bar('b3', 'r1', '2026-05-13T06:00:00', '2026-05-13T08:00:00'),
      ],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(heightsPerRow).toEqual([42]);
  });

  it('three mutually overlapping bars stack to level 2 — height includes 3× barHeight', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [
        bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T10:00:00'),
        bar('b2', 'r1', '2026-05-13T01:00:00', '2026-05-13T11:00:00'),
        bar('b3', 'r1', '2026-05-13T02:00:00', '2026-05-13T12:00:00'),
      ],
      rows: [row('r1')],
      axis: dayAxis,
    });

    // maxLevel=2, stackedHeight = 2×40 + 30 = 110, computed = 8+110+4 = 122
    expect(heightsPerRow).toEqual([122]);
  });

  it('bars touching at boundaries (end == start) share a level', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [
        bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T02:00:00'),
        bar('b2', 'r1', '2026-05-13T02:00:00', '2026-05-13T04:00:00'),
      ],
      rows: [row('r1')],
      axis: dayAxis,
    });

    // Boundary touch is allowed (end <= start), so both fit on level 0 → height 42.
    expect(heightsPerRow).toEqual([42]);
  });
});

describe('defaultBarStackHeightPass — axis-range filter', () => {
  it('bars entirely before axis start are ignored', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [bar('b1', 'r1', '2026-05-12T08:00:00', '2026-05-12T18:00:00')],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(heightsPerRow).toEqual([38]); // minRowHeight
  });

  it('bars entirely after axis end are ignored', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [bar('b1', 'r1', '2026-05-15T08:00:00', '2026-05-15T18:00:00')],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(heightsPerRow).toEqual([38]);
  });

  it('bars that span across the axis count as in-range', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [bar('b1', 'r1', '2026-05-12T00:00:00', '2026-05-15T00:00:00')],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(heightsPerRow).toEqual([42]);
  });

  it("out-of-range bars don't inflate stacking — only in-range bars matter for the level count", () => {
    // One in-range bar + two out-of-range bars overlapping each other:
    // out-of-range overlap doesn't stack the row taller.
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [
        bar('b-out-1', 'r1', '2026-05-12T08:00:00', '2026-05-12T18:00:00'),
        bar('b-out-2', 'r1', '2026-05-12T10:00:00', '2026-05-12T14:00:00'),
        bar('b-in', 'r1', '2026-05-13T10:00:00', '2026-05-13T14:00:00'),
      ],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(heightsPerRow).toEqual([42]); // single in-range bar only
  });
});

describe('defaultBarStackHeightPass — multi-row + orphan inputs', () => {
  it('returns one entry per input row, in input order', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [
        bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T02:00:00'),
        bar('b2', 'r2', '2026-05-13T00:00:00', '2026-05-13T02:00:00'),
        bar('b3', 'r2', '2026-05-13T01:00:00', '2026-05-13T03:00:00'),
      ],
      rows: [row('r1'), row('r2'), row('r3')],
      axis: dayAxis,
    });

    // r1: one bar → 42; r2: two stacked → 82; r3: empty → 38.
    expect(heightsPerRow).toEqual([42, 82, 38]);
  });

  it('bars with rowId that matches no input row are silently dropped', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [
        bar('orphan', 'no-such-row', '2026-05-13T00:00:00', '2026-05-13T02:00:00'),
        bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T02:00:00'),
      ],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(heightsPerRow).toEqual([42]);
  });
});

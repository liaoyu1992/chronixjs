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

    // Default (Phase 43): barHeight 30 + firstBarTopPadding 4 = 34
    expect(heightsPerRow).toEqual([34]);
    expect(heightByRowId.get('r1')).toBe(34);
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
  it('one in-range bar gives `topPad + barHeight + bottomPad` (Phase 43 defaults: 4+30+4 = 38)', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [bar('b1', 'r1', '2026-05-13T08:00:00', '2026-05-13T10:00:00')],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(heightsPerRow).toEqual([4 + 30 + 4]);
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

    // Phase 43 defaults: maxLevel=1, stackedHeight = 1×(30+5)+30 = 65, computed = 4+65+4 = 73
    expect(heightsPerRow).toEqual([73]);
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

    expect(heightsPerRow).toEqual([38]);
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

    // Phase 43 defaults: maxLevel=2, stackedHeight = 2×35 + 30 = 100, computed = 4+100+4 = 108
    expect(heightsPerRow).toEqual([108]);
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

    // Boundary touch is allowed (end <= start), so both fit on level 0 → height 38.
    expect(heightsPerRow).toEqual([38]);
  });
});

describe('defaultBarStackHeightPass — axis-range filter', () => {
  it('bars entirely before axis start are ignored', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [bar('b1', 'r1', '2026-05-12T08:00:00', '2026-05-12T18:00:00')],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(heightsPerRow).toEqual([34]); // Phase 43 minRowHeight = 30 + 4
  });

  it('bars entirely after axis end are ignored', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [bar('b1', 'r1', '2026-05-15T08:00:00', '2026-05-15T18:00:00')],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(heightsPerRow).toEqual([34]);
  });

  it('bars that span across the axis count as in-range', () => {
    const { heightsPerRow } = defaultBarStackHeightPass.compute({
      bars: [bar('b1', 'r1', '2026-05-12T00:00:00', '2026-05-15T00:00:00')],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(heightsPerRow).toEqual([38]);
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

    expect(heightsPerRow).toEqual([38]); // single in-range bar only
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

    // Phase 43 defaults: r1: one bar → 38; r2: two stacked → 73; r3: empty → 34.
    expect(heightsPerRow).toEqual([38, 73, 34]);
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

    expect(heightsPerRow).toEqual([38]);
  });
});

describe('defaultBarStackHeightPass — levelByBarId (Phase 30)', () => {
  it('assigns level 0 to a single bar on a row', () => {
    const { levelByBarId } = defaultBarStackHeightPass.compute({
      bars: [bar('b1', 'r1', '2026-05-13T00:00:00', '2026-05-13T02:00:00')],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(levelByBarId.get('b1')).toBe(0);
  });

  it('assigns distinct ascending levels to mutually-overlapping bars on the same row in sorted-by-start order', () => {
    const { levelByBarId } = defaultBarStackHeightPass.compute({
      bars: [
        bar('late', 'r1', '2026-05-13T03:00:00', '2026-05-13T07:00:00'),
        bar('early', 'r1', '2026-05-13T00:00:00', '2026-05-13T05:00:00'),
        bar('middle', 'r1', '2026-05-13T01:00:00', '2026-05-13T06:00:00'),
      ],
      rows: [row('r1')],
      axis: dayAxis,
    });

    // Sort key: (start ASC, end ASC). Order: early(0–5), middle(1–6), late(3–7).
    // All three pair-wise overlap → distinct levels 0, 1, 2.
    expect(levelByBarId.get('early')).toBe(0);
    expect(levelByBarId.get('middle')).toBe(1);
    expect(levelByBarId.get('late')).toBe(2);
  });

  it('reuses level 0 across different rows simultaneously (per-row scoping)', () => {
    const { levelByBarId } = defaultBarStackHeightPass.compute({
      bars: [
        bar('a', 'r1', '2026-05-13T00:00:00', '2026-05-13T05:00:00'),
        bar('b', 'r2', '2026-05-13T00:00:00', '2026-05-13T05:00:00'),
        bar('c', 'r3', '2026-05-13T00:00:00', '2026-05-13T05:00:00'),
      ],
      rows: [row('r1'), row('r2'), row('r3')],
      axis: dayAxis,
    });

    expect(levelByBarId.get('a')).toBe(0);
    expect(levelByBarId.get('b')).toBe(0);
    expect(levelByBarId.get('c')).toBe(0);
  });

  it('omits bars whose range falls entirely outside the axis from levelByBarId', () => {
    const { levelByBarId } = defaultBarStackHeightPass.compute({
      bars: [
        bar('in-range', 'r1', '2026-05-13T01:00:00', '2026-05-13T02:00:00'),
        // Far-future bar (way past day-view axis end at 2026-05-13T23:59:59).
        bar('out-of-range', 'r1', '2030-01-01T00:00:00', '2030-01-01T05:00:00'),
      ],
      rows: [row('r1')],
      axis: dayAxis,
    });

    expect(levelByBarId.has('in-range')).toBe(true);
    expect(levelByBarId.has('out-of-range')).toBe(false);
  });
});

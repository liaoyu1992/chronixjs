import { describe, expect, it } from 'vitest';

import { defaultAxisRangePlanner } from './axis-range-planner.js';
import { defaultRowSwimlaneLayout } from './row-swimlane-layout.js';
import { defaultVirtualizedPaneLayout } from './virtualized-pane-layout.js';

import type { AxisRangePlanInput, PlannedAxis, SwimlaneStrip } from './types.js';

const baseAxisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: new Date('2026-05-13T08:00:00'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};
const dayAxis = defaultAxisRangePlanner.plan(baseAxisInput);

const uniformStrips = (count: number, height: number): SwimlaneStrip[] => {
  const out: SwimlaneStrip[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push({ rowId: `r${i}`, y: i * height, height });
  }
  return out;
};

describe('defaultVirtualizedPaneLayout — contentSize', () => {
  it('zero strips → height 0; width matches axis.totalWidth', () => {
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips: [],
      viewport: { width: 800, height: 600 },
      scroll: { x: 0, y: 0 },
    });
    expect(out.contentSize).toEqual({ width: dayAxis.totalWidth, height: 0 });
  });

  it('strips → height = last.y + last.height', () => {
    const strips = uniformStrips(5, 40);
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips,
      viewport: { width: 800, height: 600 },
      scroll: { x: 0, y: 0 },
    });
    expect(out.contentSize).toEqual({ width: dayAxis.totalWidth, height: 200 });
  });
});

describe('defaultVirtualizedPaneLayout — vertical visible-strip range', () => {
  it('viewport contains all strips → range covers every index', () => {
    const strips = uniformStrips(5, 40);
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips,
      viewport: { width: 800, height: 600 },
      scroll: { x: 0, y: 0 },
    });
    expect(out.visibleStripRange).toEqual({ firstIndex: 0, lastIndex: 4 });
  });

  it('viewport smaller than content → only strips intersecting viewport', () => {
    const strips = uniformStrips(10, 40); // total 400
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips,
      viewport: { width: 800, height: 100 }, // shows ~2.5 rows
      scroll: { x: 0, y: 50 },
    });
    // Visible Y: [50, 150). Strip 0: [0,40) excluded (40 ≤ 50).
    // Strip 1: [40,80) — bottom 80 > 50 ✓, top 40 < 150 ✓. Included.
    // Strip 2: [80,120) — both bounds in. Included.
    // Strip 3: [120,160) — top 120 < 150 ✓. Included.
    // Strip 4: [160,200) — top 160 ≥ 150. Excluded.
    expect(out.visibleStripRange).toEqual({ firstIndex: 1, lastIndex: 3 });
  });

  it('scroll exactly at strip boundary — strip whose BOTTOM equals scrollY is excluded', () => {
    const strips = uniformStrips(5, 40);
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips,
      viewport: { width: 800, height: 100 },
      scroll: { x: 0, y: 40 }, // strip[0] bottom is exactly 40
    });
    // strip[0] [0,40): bottom 40 ≤ 40 → excluded. strip[1] [40,80): top 40 < 140 ✓.
    expect(out.visibleStripRange).toEqual({ firstIndex: 1, lastIndex: 3 });
  });

  it('scroll past content end → empty range', () => {
    const strips = uniformStrips(5, 40); // total 200
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips,
      viewport: { width: 800, height: 100 },
      scroll: { x: 0, y: 300 },
    });
    expect(out.visibleStripRange).toEqual({ firstIndex: -1, lastIndex: -1 });
  });

  it('variable strip heights → still picks correct intersection', () => {
    const strips: SwimlaneStrip[] = [
      { rowId: 'a', y: 0, height: 30 },
      { rowId: 'b', y: 30, height: 60 }, // ends at 90
      { rowId: 'c', y: 90, height: 30 }, // ends at 120
      { rowId: 'd', y: 120, height: 100 }, // ends at 220
    ];
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips,
      viewport: { width: 800, height: 80 },
      scroll: { x: 0, y: 50 },
    });
    // Visible Y: [50, 130).
    // a [0,30): out. b [30,90): bottom 90 > 50, top 30 < 130 → in.
    // c [90,120): in. d [120,220): top 120 < 130 → in.
    expect(out.visibleStripRange).toEqual({ firstIndex: 1, lastIndex: 3 });
  });

  it('overscan expands range by N on each side, clamped to bounds', () => {
    const strips = uniformStrips(10, 40);
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips,
      viewport: { width: 800, height: 80 },
      scroll: { x: 0, y: 160 },
      overscan: { rows: 2 },
    });
    // Without overscan: strips intersecting [160, 240) = strip 4,5.
    // With overscan 2: 2..7 (clamped within 0..9).
    expect(out.visibleStripRange).toEqual({ firstIndex: 2, lastIndex: 7 });
  });

  it('overscan clamps at content edges', () => {
    const strips = uniformStrips(5, 40);
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips,
      viewport: { width: 800, height: 80 },
      scroll: { x: 0, y: 0 },
      overscan: { rows: 5 }, // would extend past 5 strips, but clamps
    });
    expect(out.visibleStripRange).toEqual({ firstIndex: 0, lastIndex: 4 });
  });

  it('zero strips → empty range', () => {
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips: [],
      viewport: { width: 800, height: 600 },
      scroll: { x: 0, y: 0 },
    });
    expect(out.visibleStripRange).toEqual({ firstIndex: -1, lastIndex: -1 });
  });

  it('zero viewport height → empty range', () => {
    const strips = uniformStrips(5, 40);
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips,
      viewport: { width: 800, height: 0 },
      scroll: { x: 0, y: 0 },
    });
    expect(out.visibleStripRange).toEqual({ firstIndex: -1, lastIndex: -1 });
  });
});

describe('defaultVirtualizedPaneLayout — horizontal visible-slot range', () => {
  it('viewport contains all slots → covers every slot', () => {
    // Use the layout we just verified — day axis has 24 hours × 60px = 1440.
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips: uniformStrips(3, 40),
      viewport: { width: 2000, height: 600 }, // wider than axis
      scroll: { x: 0, y: 0 },
    });
    expect(out.visibleSlotRange).toEqual({
      firstIndex: 0,
      lastIndex: dayAxis.slotCount - 1,
    });
  });

  it('viewport smaller than axis → subset of slots', () => {
    // slotWidth=60, viewport width 200 → ceil(200/60) = 4 slots visible starting from slot 0.
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips: uniformStrips(3, 40),
      viewport: { width: 200, height: 600 },
      scroll: { x: 0, y: 0 },
    });
    expect(out.visibleSlotRange.firstIndex).toBe(0);
    expect(out.visibleSlotRange.lastIndex).toBe(3); // slots 0..3 cover [0, 240)
  });

  it('mid-axis scroll → window of slots offset by floor(scrollX / slotWidth)', () => {
    // Scroll x=180 (3 slots in), viewport 200 → covers slots 3..6.
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips: uniformStrips(3, 40),
      viewport: { width: 200, height: 600 },
      scroll: { x: 180, y: 0 },
    });
    expect(out.visibleSlotRange).toEqual({ firstIndex: 3, lastIndex: 6 });
  });

  it('scroll mid-slot uses floor for first, ceil-1 for last', () => {
    // x=190..390. floor(190/60)=3, ceil(390/60)-1 = 7-1 = 6.
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips: uniformStrips(3, 40),
      viewport: { width: 200, height: 600 },
      scroll: { x: 190, y: 0 },
    });
    expect(out.visibleSlotRange).toEqual({ firstIndex: 3, lastIndex: 6 });
  });

  it('scroll past axis end → empty', () => {
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips: uniformStrips(3, 40),
      viewport: { width: 200, height: 600 },
      scroll: { x: dayAxis.totalWidth + 100, y: 0 },
    });
    expect(out.visibleSlotRange).toEqual({ firstIndex: -1, lastIndex: -1 });
  });

  it('overscan expands slot range by N on each side, clamped', () => {
    const out = defaultVirtualizedPaneLayout.compute({
      axis: dayAxis,
      strips: uniformStrips(3, 40),
      viewport: { width: 200, height: 600 },
      scroll: { x: 360, y: 0 },
      overscan: { slots: 2 },
    });
    // Without overscan: scrollX=360 covers slots 6..9. With overscan 2: 4..11.
    expect(out.visibleSlotRange).toEqual({ firstIndex: 4, lastIndex: 11 });
  });
});

describe('defaultVirtualizedPaneLayout — integration with original passes', () => {
  it('uses real axis + swimlane outputs', () => {
    const axis: PlannedAxis = dayAxis;
    const { strips } = defaultRowSwimlaneLayout.layout({
      rows: [
        { id: 'r1', columns: {}, heightHint: 42 },
        { id: 'r2', columns: {}, heightHint: 42 },
        { id: 'r3', columns: {}, heightHint: 38 },
      ],
      defaultRowHeight: 38,
      rowSpacing: 1,
    });
    // Strips: r1 [0,42), r2 [43,85), r3 [86,124). Total content height 124.
    const out = defaultVirtualizedPaneLayout.compute({
      axis,
      strips,
      viewport: { width: 1000, height: 50 },
      scroll: { x: 0, y: 50 },
    });
    // Visible Y: [50, 100). r1 [0,42) out. r2 [43,85) in. r3 [86,124) in.
    expect(out.visibleStripRange).toEqual({ firstIndex: 1, lastIndex: 2 });
    expect(out.contentSize.height).toBe(124);
  });
});

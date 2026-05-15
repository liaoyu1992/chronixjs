import {
  defaultAxisRangePlanner,
  defaultBarPlacementPass,
  defaultBarStackHeightPass,
  defaultLinkRouter,
  defaultRowSwimlaneLayout,
} from '@chronixjs/gantt';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, LinkSpec, RowSpec } from '@chronixjs/gantt';

const MS_PER_HOUR = 60 * 60 * 1000;

const today = new Date('2026-05-13T00:00:00Z');
today.setHours(0, 0, 0, 0);
const todayMs = today.getTime();

function bar(id: string, rowId: string, startHour: number, endHour: number): BarSpec {
  return {
    id,
    rowId,
    range: {
      start: new Date(todayMs + startHour * MS_PER_HOUR),
      end: new Date(todayMs + endHour * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
  };
}

const rows: readonly RowSpec[] = [
  { id: 'r1', columns: {} },
  { id: 'r2', columns: {} },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: new Date('2026-05-13T00:00:00Z'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

// Two bars side-by-side on separate rows so the smooth-routing cross-row
// branch fires (same-row collapses to a straight L).
const twoBars: readonly BarSpec[] = [bar('b1', 'r1', 1, 4), bar('b2', 'r2', 8, 12)];

/**
 * Run the same layout pipeline `<ChronixGantt>` runs internally so a
 * test can independently compute the expected router output without
 * hand-mocking strip / bar Y. Mirrors the default prop values used by
 * the component (barHeight=30, barVerticalPadding=8, rowSpacing=1,
 * defaultRowHeight=38).
 */
function runLayout(bars: readonly BarSpec[]) {
  const axis = defaultAxisRangePlanner.plan(axisInput);
  const heightByRowId = defaultBarStackHeightPass.compute({
    bars,
    rows,
    axis,
    barHeight: 30,
  }).heightByRowId;
  const rowsWithHints = rows.map((row) => {
    const hint = heightByRowId.get(row.id);
    return hint != null ? { ...row, heightHint: hint } : row;
  });
  const swimlane = defaultRowSwimlaneLayout.layout({
    rows: rowsWithHints,
    defaultRowHeight: 38,
    rowSpacing: 1,
  });
  const placement = defaultBarPlacementPass.place({
    bars,
    axis,
    strips: swimlane.strips,
    barHeight: 30,
    barVerticalPadding: 8,
  });
  return { axis, strips: swimlane.strips, placedBars: placement.placedBars };
}

describe('<ChronixGantt> link rendering — Commit 1: paths', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('renders no <path class="cx-gantt-link"> when `links` prop is omitted (default [])', () => {
    const wrapper = mount(ChronixGantt, {
      props: { bars: twoBars, rows, axisInput },
    });
    expect(wrapper.findAll('path.cx-gantt-link')).toHaveLength(0);
  });

  it('renders one <path d=...> per resolved square link, with `d` matching defaultLinkRouter output', () => {
    const links: readonly LinkSpec[] = [
      { id: 'link-1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'arrow' },
    ];
    const wrapper = mount(ChronixGantt, {
      props: { bars: twoBars, rows, axisInput, links },
    });

    // Independently compute expected path via the public router so this
    // test pins the adapter to the router output, not to a hand-coded
    // string. If the routing algorithm changes, this assertion still
    // passes — what we're proving here is that <ChronixGantt> delegates
    // to the router instead of inlining its own geometry.
    const { placedBars } = runLayout(twoBars);
    const routerOut = defaultLinkRouter.route({ links, placedBars });
    const expectedD = routerOut.routedLinks[0]!.pathD;

    const paths = wrapper.findAll('path.cx-gantt-link');
    expect(paths).toHaveLength(1);
    expect(paths[0]!.attributes('data-link-id')).toBe('link-1');
    expect(paths[0]!.attributes('d')).toBe(expectedD);
  });

  it('renders a smooth (cross-row) link whose `d` starts with `M ... C` (cubic Bézier branch)', () => {
    const links: readonly LinkSpec[] = [
      { id: 'link-smooth', fromBarId: 'b1', toBarId: 'b2', routing: 'smooth', marker: 'arrow' },
    ];
    const wrapper = mount(ChronixGantt, {
      props: { bars: twoBars, rows, axisInput, links },
    });
    const d = wrapper.find('path.cx-gantt-link').attributes('d');
    expect(d).toMatch(/^M [\d.-]+ [\d.-]+ C /);
  });

  it('orphan link (toBarId references missing bar) → no <path>, emits link-orphan once, console.warn once', () => {
    const links: readonly LinkSpec[] = [
      { id: 'orph-1', fromBarId: 'b1', toBarId: 'ghost', routing: 'square', marker: 'arrow' },
      { id: 'link-1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'arrow' },
    ];
    const wrapper = mount(ChronixGantt, {
      props: { bars: twoBars, rows, axisInput, links },
    });

    const paths = wrapper.findAll('path.cx-gantt-link');
    expect(paths).toHaveLength(1);
    expect(paths[0]!.attributes('data-link-id')).toBe('link-1');

    const orphanEvents = wrapper.emitted('link-orphan');
    expect(orphanEvents).toBeDefined();
    expect(orphanEvents).toHaveLength(1);
    expect(orphanEvents![0]).toEqual(['orph-1']);

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]![0]).toContain('orph-1');
  });

  it('link group carries `pointer-events="none"` and renders AFTER the bars group in DOM order', () => {
    const links: readonly LinkSpec[] = [
      { id: 'link-1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'arrow' },
    ];
    const wrapper = mount(ChronixGantt, {
      props: { bars: twoBars, rows, axisInput, links },
    });
    const bodySvg = wrapper.find('svg.cx-gantt-body').element;
    // happy-dom's `:scope > g` is unreliable in some versions, and we
    // also want to be explicit about "first-level children only". Walk
    // children directly via `bodySvg.children` instead.
    const directGroups = Array.from(bodySvg.children).filter(
      (n): n is Element => n.nodeType === 1 && n.tagName.toLowerCase() === 'g',
    );
    const barsIdx = directGroups.findIndex((g) => g.classList.contains('cx-gantt-bars'));
    const linksIdx = directGroups.findIndex((g) => g.classList.contains('cx-gantt-links'));
    expect(barsIdx).toBeGreaterThanOrEqual(0);
    expect(linksIdx).toBeGreaterThan(barsIdx);

    const linksGroup = directGroups[linksIdx]!;
    expect(linksGroup.getAttribute('pointer-events')).toBe('none');
  });
});

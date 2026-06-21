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
import type Vue from 'vue';

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

const twoBars: readonly BarSpec[] = [bar('b1', 'r1', 1, 4), bar('b2', 'r2', 8, 12)];

/**
 * Run the same layout pipeline `<ChronixGantt>` runs internally so a
 * test can independently compute the expected router output. Verbatim
 * port of vue3's runLayout helper.
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
    barVerticalPadding: 4,
  });
  return { axis, strips: swimlane.strips, placedBars: placement.placedBars };
}

const GanttForTest = ChronixGantt as unknown as typeof Vue;

describe('<ChronixGantt> link rendering — paths (vue2 SFC port)', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('renders no <path class="cx-gantt-link"> when `links` prop is omitted (default [])', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput },
    });
    expect(wrapper.findAll('path.cx-gantt-link')).toHaveLength(0);
  });

  it('renders one <path d=...> per resolved square link, with `d` matching defaultLinkRouter output', () => {
    const links: readonly LinkSpec[] = [
      { id: 'link-1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'arrow' },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput, links },
    });

    const { placedBars } = runLayout(twoBars);
    const routerOut = defaultLinkRouter.route({ links, placedBars });
    const expectedD = routerOut.routedLinks[0]!.pathD;

    const paths = wrapper.findAll('path.cx-gantt-link');
    expect(paths).toHaveLength(1);
    expect(paths.at(0).attributes('data-link-id')).toBe('link-1');
    expect(paths.at(0).attributes('d')).toBe(expectedD);
  });

  it('renders a smooth (cross-row) link whose `d` starts with `M ... C` (cubic Bézier branch)', () => {
    const links: readonly LinkSpec[] = [
      { id: 'link-smooth', fromBarId: 'b1', toBarId: 'b2', routing: 'smooth', marker: 'arrow' },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput, links },
    });
    const d = wrapper.find('path.cx-gantt-link').attributes('d');
    expect(d).toMatch(/^M [\d.-]+ [\d.-]+ C /);
  });

  it('orphan link (toBarId references missing bar) → no <path>, emits link-orphan once, console.warn once', () => {
    const links: readonly LinkSpec[] = [
      { id: 'orph-1', fromBarId: 'b1', toBarId: 'ghost', routing: 'square', marker: 'arrow' },
      { id: 'link-1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'arrow' },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput, links },
    });

    const paths = wrapper.findAll('path.cx-gantt-link');
    expect(paths).toHaveLength(1);
    expect(paths.at(0).attributes('data-link-id')).toBe('link-1');

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
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput, links },
    });
    const bodySvg = wrapper.find('svg.cx-gantt-body').element;
    const directGroups = Array.from(bodySvg.children).filter(
      (n): n is Element => n.nodeType === 1 && n.tagName.toLowerCase() === 'g',
    );
    const barsIdx = directGroups.findIndex((g) => g.classList.contains('cx-gantt-bars'));
    const linksIdx = directGroups.findIndex((g) => g.classList.contains('cx-gantt-links'));
    expect(barsIdx).toBeGreaterThanOrEqual(0);
    expect(barsIdx).toBeGreaterThan(linksIdx);

    const linksGroup = directGroups[linksIdx]!;
    expect(linksGroup.getAttribute('pointer-events')).toBe('none');
  });
});

describe('<ChronixGantt> link rendering — markers + colorOverride (vue2 SFC port)', () => {
  it('emits 7 built-in <marker> defs for the default color (id `cx-marker-<type>-3788d8`)', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput },
    });
    const defs = wrapper.find('defs.cx-gantt-defs').element;
    const builtinTypes = [
      'arrow',
      'diamond',
      'diamond-hollow',
      'circle',
      'circle-hollow',
      'pointer',
      'plus',
    ];
    for (const type of builtinTypes) {
      const id = `cx-marker-${type}-3788d8`;
      expect(defs.querySelector(`marker#${CSS.escape(id)}`)).not.toBeNull();
    }
  });

  it('custom marker → one <marker> def per usedColor × customMarkerId, containing the path(s)', () => {
    const customHeart = {
      id: 'heart',
      viewBox: '0 0 10 10',
      paths: [{ d: 'M 5 8 L 1 4 L 5 0 L 9 4 Z', fill: 'red' }],
    } as const;
    const links: readonly LinkSpec[] = [
      { id: 'l-custom', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: customHeart },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput, links },
    });
    const defs = wrapper.find('defs.cx-gantt-defs').element;
    const customDef = defs.querySelector(`marker#${CSS.escape('cx-marker-heart-3788d8')}`);
    expect(customDef).not.toBeNull();
    expect(customDef!.getAttribute('viewBox')).toBe('0 0 10 10');
    const pathEl = customDef!.querySelector('path');
    expect(pathEl).not.toBeNull();
    expect(pathEl!.getAttribute('d')).toBe('M 5 8 L 1 4 L 5 0 L 9 4 Z');
    expect(pathEl!.getAttribute('fill')).toBe('red');
  });

  it('<path>.marker-end references the marker matching the link.marker type and color', () => {
    const links: readonly LinkSpec[] = [
      { id: 'l-1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'diamond' },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput, links },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('marker-end')).toBe('url(#cx-marker-diamond-3788d8)');
  });

  it('marker: "none" → <path> has no marker-end attribute', () => {
    const links: readonly LinkSpec[] = [
      { id: 'l-none', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'none' },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput, links },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('marker-end')).toBeUndefined();
  });

  it('colorOverride → <path>.stroke + marker-end both use that color, and a matching marker def exists', () => {
    const links: readonly LinkSpec[] = [
      {
        id: 'l-red',
        fromBarId: 'b1',
        toBarId: 'b2',
        routing: 'square',
        marker: 'arrow',
        colorOverride: '#ef4444',
      },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput, links },
    });
    const path = wrapper.find('path.cx-gantt-link');
    expect(path.attributes('stroke')).toBe('#ef4444');
    expect(path.attributes('marker-end')).toBe('url(#cx-marker-arrow-ef4444)');
    const defs = wrapper.find('defs.cx-gantt-defs').element;
    expect(defs.querySelector(`marker#${CSS.escape('cx-marker-arrow-ef4444')}`)).not.toBeNull();
  });

  it('no colorOverride → <path>.stroke uses theme.linkDefaultColor (default `#3788d8`)', () => {
    const links: readonly LinkSpec[] = [
      { id: 'l-1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'arrow' },
    ];
    const wrapper1 = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput, links },
    });
    expect(wrapper1.find('path.cx-gantt-link').attributes('stroke')).toBe('#3788d8');

    const wrapper2 = mount(GanttForTest, {
      propsData: {
        bars: twoBars,
        rows,
        axisInput,
        links,
        theme: { linkDefaultColor: '#10b981' },
      },
    });
    const path2 = wrapper2.find('path.cx-gantt-link');
    expect(path2.attributes('stroke')).toBe('#10b981');
    expect(path2.attributes('marker-end')).toBe('url(#cx-marker-arrow-10b981)');
  });

  it('built-in `arrow` marker has polygon points `"0 0, 4.5 2.25, 0 4.5"` (verbatim parity)', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput },
    });
    const arrowMarker = wrapper
      .find('defs.cx-gantt-defs')
      .element.querySelector(`marker#${CSS.escape('cx-marker-arrow-3788d8')}`);
    expect(arrowMarker).not.toBeNull();
    const polygon = arrowMarker!.querySelector('polygon');
    expect(polygon).not.toBeNull();
    expect(polygon!.getAttribute('points')).toBe('0 0, 4.5 2.25, 0 4.5');
    expect(polygon!.getAttribute('fill')).toBe('#3788d8');
  });

  it('built-in `diamond-hollow` marker has fill="white" + stroke=color', () => {
    const wrapper = mount(GanttForTest, {
      propsData: { bars: twoBars, rows, axisInput },
    });
    const marker = wrapper
      .find('defs.cx-gantt-defs')
      .element.querySelector(`marker#${CSS.escape('cx-marker-diamond-hollow-3788d8')}`);
    expect(marker).not.toBeNull();
    const polygon = marker!.querySelector('polygon');
    expect(polygon!.getAttribute('fill')).toBe('white');
    expect(polygon!.getAttribute('stroke')).toBe('#3788d8');
  });

  it('multiple links sharing a color → only one <marker> def per (type, color) pair (set-based dedupe)', () => {
    const bars3: readonly BarSpec[] = [
      bar('b1', 'r1', 1, 4),
      bar('b2', 'r2', 8, 12),
      bar('b3', 'r1', 15, 18),
    ];
    const links: readonly LinkSpec[] = [
      { id: 'l-1', fromBarId: 'b1', toBarId: 'b2', routing: 'square', marker: 'arrow' },
      { id: 'l-2', fromBarId: 'b2', toBarId: 'b3', routing: 'square', marker: 'arrow' },
      { id: 'l-3', fromBarId: 'b1', toBarId: 'b3', routing: 'square', marker: 'diamond' },
    ];
    const wrapper = mount(GanttForTest, {
      propsData: { bars: bars3, rows, axisInput, links },
    });
    const defs = wrapper.find('defs.cx-gantt-defs').element;
    const arrowMarkers = defs.querySelectorAll(`marker#${CSS.escape('cx-marker-arrow-3788d8')}`);
    expect(arrowMarkers).toHaveLength(1);
    expect(defs.querySelectorAll('marker')).toHaveLength(7);
  });
});

import { type AxisRangePlanInput, type BarSpec, type RowSpec } from '@chronixjs/gantt';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const anchor = new Date('2026-05-13T00:00:00');
const rows: readonly RowSpec[] = [{ id: 'r1', columns: {} }];

const axisInput: AxisRangePlanInput = {
  viewId: 'day',
  anchorDate: anchor,
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

function bar(id: string, startHourOffset: number, endHourOffset: number): BarSpec {
  return {
    id,
    rowId: 'r1',
    range: {
      start: new Date(anchor.getTime() + startHourOffset * MS_PER_HOUR),
      end: new Date(anchor.getTime() + endHourOffset * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
  };
}

/**
 * Mirror of vue2 Phase 31.5.2.1's `driveChartScroll` helper for the RTL
 * environment. Stubs `clientWidth` via `Object.defineProperty`, mutates
 * `scrollLeft` + dispatches a `scroll` event so `useChartScrollState`'s
 * scroll listener fires (jsdom doesn't auto-fire scroll on assignment).
 * Also invokes the captured `ResizeObserver` callback synchronously to
 * propagate the stubbed `clientWidth`. `act(() => { ... })` wraps both
 * so the React render flush completes before assertions.
 */
function driveChartScroll(
  container: HTMLElement,
  scrollLeft: number,
  clientWidth: number,
  resizeObserverCallback: ResizeObserverCallback | undefined,
): void {
  const paneEl = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-pane')!;
  Object.defineProperty(paneEl, 'clientWidth', { value: clientWidth, configurable: true });
  Object.defineProperty(paneEl, 'scrollLeft', { value: scrollLeft, configurable: true });
  act(() => {
    fireEvent.scroll(paneEl);
    resizeObserverCallback?.([], {} as ResizeObserver);
  });
}

describe('<ChronixGantt> viewport-clipping continuation triangles — Phase 32.5.1', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let originalResizeObserver: typeof globalThis.ResizeObserver | undefined;
  // `useChartScrollState` constructs a single ResizeObserver per pane;
  // the stub captures the callback so tests can fire it manually with
  // a stubbed `clientWidth` value.
  let roCallbackHolder: { cb: ResizeObserverCallback | undefined };

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    originalResizeObserver = globalThis.ResizeObserver;
    roCallbackHolder = { cb: undefined };
    const holder = roCallbackHolder;
    class MockResizeObserver {
      constructor(cb: ResizeObserverCallback) {
        holder.cb = cb;
      }
      observe(): void {
        // mock-only; no-op
      }
      unobserve(): void {
        // mock-only; no-op
      }
      disconnect(): void {
        // mock-only; no-op
      }
    }
    globalThis.ResizeObserver = MockResizeObserver;
  });

  afterEach(() => {
    cleanup();
    warnSpy.mockRestore();
    if (originalResizeObserver !== undefined) {
      globalThis.ResizeObserver = originalResizeObserver;
    }
  });

  it('axis-clipped bar emits triangle anchored to the bar edge with data-viewport-clipped="false"', () => {
    // Bar at hours 10..30 — ends past day-axis (24h) → !bar.isEnd →
    // axis-clipped RIGHT triangle. renderX = 600, renderWidth = 1200,
    // renderX + renderWidth = 1800. With scrollLeft=0 + clientWidth=2000
    // (viewport [0, 2000)), 1800 < 2000 → NOT viewport-clipped right.
    // Also renderX=600 >= scrollLeft=0 → NOT viewport-clipped left.
    // So the right triangle fires as axis-only-clipped, anchored at
    // `renderX + renderWidth - TRIANGLE_MARGIN = 1799`, NOT at viewport edge.
    const { container } = render(
      <ChronixGantt bars={[bar('crosses-end', 10, 30)]} rows={rows} axisInput={axisInput} />,
    );
    driveChartScroll(container, 0, 2000, roCallbackHolder.cb);

    const rightTri = container.querySelector<SVGPolygonElement>(
      'polygon.cx-gantt-bar-continuation-right',
    )!;
    expect(rightTri).not.toBeNull();
    expect(rightTri.getAttribute('data-viewport-clipped')).toBe('false');
    const apexX = Number(rightTri.getAttribute('points')!.split(' ')[0]!.split(',')[0]);
    expect(apexX).toBe(1799);
  });

  it('viewport-clipped bar (axis-inside, viewport-spanning) emits triangles at viewport edges with data-viewport-clipped="true"', () => {
    // Bar at hours 1..16 — fully inside the 24h day axis → bar.isStart=true,
    // bar.isEnd=true. renderX = 60, renderWidth = 900, renderX + renderWidth
    // = 960. After scrolling to scrollLeft=300 with clientWidth=600 (viewport
    // [300, 900)): bar spans the viewport (60 < 300 → left-clipped; 960 > 900
    // → right-clipped) → both viewport-clipped sub-cases fire.
    const { container } = render(
      <ChronixGantt bars={[bar('inside-axis', 1, 16)]} rows={rows} axisInput={axisInput} />,
    );
    driveChartScroll(container, 300, 600, roCallbackHolder.cb);

    const leftTri = container.querySelector<SVGPolygonElement>(
      'polygon.cx-gantt-bar-continuation-left',
    )!;
    const rightTri = container.querySelector<SVGPolygonElement>(
      'polygon.cx-gantt-bar-continuation-right',
    )!;
    expect(leftTri).not.toBeNull();
    expect(rightTri).not.toBeNull();
    expect(leftTri.getAttribute('data-viewport-clipped')).toBe('true');
    expect(rightTri.getAttribute('data-viewport-clipped')).toBe('true');
    // Apex locks to viewport edges: left at scrollLeft + 1 = 301; right at
    // scrollLeft + clientWidth - 1 = 899.
    const leftApex = Number(leftTri.getAttribute('points')!.split(' ')[0]!.split(',')[0]);
    const rightApex = Number(rightTri.getAttribute('points')!.split(' ')[0]!.split(',')[0]);
    expect(leftApex).toBe(301);
    expect(rightApex).toBe(899);
  });

  it('bar that is BOTH axis-clipped AND viewport-clipped on same side: viewport-locked apex wins (precedence)', () => {
    // Bar starts at hour -4 (axis-clipped left). Render: renderX = -240.
    // Scroll to 100 with clientWidth=500 → viewport [100, 600). renderX=-240
    // < scrollLeft=100 → isViewportClippedStart=true. Both sub-cases fire;
    // precedence is viewport-locked → apex at scrollLeft + 1 = 101 (NOT
    // renderX + 1 = -239).
    const { container } = render(
      <ChronixGantt bars={[bar('both-clipped-left', -4, 6)]} rows={rows} axisInput={axisInput} />,
    );
    driveChartScroll(container, 100, 500, roCallbackHolder.cb);

    const leftTri = container.querySelector<SVGPolygonElement>(
      'polygon.cx-gantt-bar-continuation-left',
    )!;
    expect(leftTri).not.toBeNull();
    expect(leftTri.getAttribute('data-viewport-clipped')).toBe('true');
    const apexX = Number(leftTri.getAttribute('points')!.split(' ')[0]!.split(',')[0]);
    expect(apexX).toBe(101);
  });

  it('scroll event re-derives triangle state reactively (count changes after scroll)', () => {
    // Bars at hours [1..3], [5..7], [10..12]. Initial render at scrollLeft=0,
    // clientWidth=500 → viewport [0, 500). All bars (right edges 180, 420,
    // 720) — bar3 right edge 720 > 500 → viewport-clipped right. After
    // scroll to scrollLeft=400 with same clientWidth → viewport [400, 900).
    // Bar1 [60, 180): both edges < 400 → no overlap → 0 triangles. Bar2
    // [300, 420): right edge 420 > 400 (overlaps), left edge 300 < 400 →
    // clip-start triangle. Bar3 [600, 720): fully in viewport → 0 triangles.
    // Triangle count must differ between scrollLeft=0 and scrollLeft=400.
    const { container } = render(
      <ChronixGantt
        bars={[bar('b1', 1, 3), bar('b2', 5, 7), bar('b3', 10, 12)]}
        rows={rows}
        axisInput={axisInput}
      />,
    );

    driveChartScroll(container, 0, 500, roCallbackHolder.cb);
    const countBefore = container.querySelectorAll(
      'polygon.cx-gantt-bar-continuation-indicator',
    ).length;

    driveChartScroll(container, 400, 500, roCallbackHolder.cb);
    const countAfter = container.querySelectorAll(
      'polygon.cx-gantt-bar-continuation-indicator',
    ).length;

    // Triangle count differs between scroll positions — proves the
    // render is reactive on chartScroll.scrollLeft.
    expect(countBefore).not.toBe(countAfter);
  });

  it('pre-mount frame (clientWidth = 0) does NOT emit phantom viewport-clipped triangles', () => {
    // Render with a fully-contained bar (no axis-clipping). On the first
    // render the ResizeObserver hasn't fired yet → clientWidth=0 → the
    // helper's short-circuit returns both flags false → zero triangles.
    // Without the guard, viewportRight = scrollLeft + 0 = 0 → bar's right
    // edge 180 > 0 → phantom right-triangle would emit.
    const { container } = render(
      <ChronixGantt bars={[bar('fully-inside', 1, 3)]} rows={rows} axisInput={axisInput} />,
    );
    // Do NOT fire the ResizeObserver — clientWidth stays at jsdom default 0.
    const triangles = container.querySelectorAll('polygon.cx-gantt-bar-continuation-indicator');
    expect(triangles).toHaveLength(0);
  });
});

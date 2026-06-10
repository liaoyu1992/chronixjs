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

function bar(id: string, startHourOffset: number, endHourOffset: number, title?: string): BarSpec {
  return {
    id,
    rowId: 'r1',
    range: {
      start: new Date(anchor.getTime() + startHourOffset * MS_PER_HOUR),
      end: new Date(anchor.getTime() + endHourOffset * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
    ...(title !== undefined ? { title } : {}),
  };
}

/**
 * Mirror of vue2 Phase 31.5.2.1's pattern adapted to RTL. Drives
 * `chartScroll.scrollLeft` + `clientWidth` by stubbing the DOM props on
 * the chart-pane + dispatching a scroll event + invoking the captured
 * ResizeObserver callback inside `act()`.
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

describe('<ChronixGantt> viewport-aware bar title + progress-dot positioning — Phase 32.5.1', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let originalResizeObserver: typeof globalThis.ResizeObserver | undefined;
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

  it('viewport-clipped bar repositions title-start to past the viewport-locked triangle', () => {
    // Bar at hours 1..16 (axis-inside). renderX = 60, renderWidth = 900.
    // Scroll to scrollLeft=300, clientWidth=600 → viewport [300, 900).
    // Bar spans viewport (60 < 300; 960 > 900) → both viewport-clipped flags
    // fire. Title-start should be at viewportLockedLeftApexX + TRIANGLE_SIZE
    // + TITLE_TRIANGLE_GAP = (300 + 1) + 6 + 4 = 311 — NOT at renderX + 8 = 68.
    const { container } = render(
      <ChronixGantt
        bars={[bar('inside-axis', 1, 16, 'long enough title for truncation tests')]}
        rows={rows}
        axisInput={axisInput}
      />,
    );
    driveChartScroll(container, 300, 600, roCallbackHolder.cb);

    const titleEl = container.querySelector<SVGTextElement>('text.cx-gantt-bar-text')!;
    expect(titleEl).not.toBeNull();
    expect(Number(titleEl.getAttribute('x'))).toBe(311);
  });

  it('viewport-clipped + selected + editable bar repositions left progress-dot to viewport-edge', () => {
    // Same bar geometry as title test: hours 1..16, viewport-clipped left.
    // Selected + editable → dot rect renders. Left dot should be at
    // viewportLockedLeftApexX + TRIANGLE_SIZE + DOT_TRIANGLE_GAP = (300 + 1)
    // + 6 + 2 = 309 — NOT at renderX + DOT_EDGE_INSET = 61.
    const { container } = render(
      <ChronixGantt
        bars={[bar('inside-axis-selected', 1, 16, 'title')]}
        rows={rows}
        axisInput={axisInput}
        editable
        selectedBarIds={['inside-axis-selected']}
      />,
    );
    driveChartScroll(container, 300, 600, roCallbackHolder.cb);

    const dotEl = container.querySelector<SVGRectElement>('rect.cx-gantt-bar-resizer-dot-start')!;
    expect(dotEl).not.toBeNull();
    expect(Number(dotEl.getAttribute('x'))).toBe(309);
  });

  it('Phase 28.2.2: partial-overlap bar (right edge offscreen-right, left edge inside viewport) keeps default title-start at bar edge', () => {
    // Bar at hours 1..16 (axis-inside). renderX = 60, renderWidth = 900.
    // Scroll to scrollLeft=0, clientWidth=200 → viewport [0, 200). Bar
    // overlaps viewport on left only (60 < 200; 960 > 200). Only
    // `isViewportClippedEnd` fires — `isViewportClippedStart` stays false
    // so titleStartX uses default math = renderX + TITLE_LEFT_PADDING =
    // 60 + 8 = 68 (NOT viewport-locked).
    const { container } = render(
      <ChronixGantt
        bars={[bar('partial-right', 1, 16, 'long enough title for truncation tests')]}
        rows={rows}
        axisInput={axisInput}
      />,
    );
    driveChartScroll(container, 0, 200, roCallbackHolder.cb);

    const titleEl = container.querySelector<SVGTextElement>('text.cx-gantt-bar-text')!;
    expect(titleEl).not.toBeNull();
    expect(Number(titleEl.getAttribute('x'))).toBe(68);
  });

  it('underlying resize edge-zone hit-test rect stays at bar geometric edge under viewport-clip (visual + hit-test diverge by design)', () => {
    // Phase 32.5.1 deliberately keeps the resize edge-zone rect
    // (cx-gantt-bar-resizer-start) at renderX regardless of viewport
    // state. Only the visible dot shifts to viewport edge. The hit-test
    // geometry must stay at the bar's real edge so resize gestures
    // operate on the bar's actual boundary, not on a phantom position
    // hundreds of pixels away.
    const { container } = render(
      <ChronixGantt
        bars={[bar('inside-axis-selected', 1, 16, 'title')]}
        rows={rows}
        axisInput={axisInput}
        editable
        selectedBarIds={['inside-axis-selected']}
      />,
    );
    driveChartScroll(container, 300, 600, roCallbackHolder.cb);

    const edgeZoneStart = container.querySelector<SVGRectElement>(
      'rect.cx-gantt-bar-resizer-start',
    )!;
    expect(edgeZoneStart).not.toBeNull();
    // Edge-zone stays at the bar's renderX = 1h × 60px = 60.
    expect(Number(edgeZoneStart.getAttribute('x'))).toBe(60);
    // Sanity: this is original of the viewport (60 < scrollLeft 300) —
    // the user can't see this edge until they scroll back left, BUT the
    // bar's actual geometric edge IS there. Resize math operates on
    // content-coord deltas, so this is the correct anchor point.
  });
});

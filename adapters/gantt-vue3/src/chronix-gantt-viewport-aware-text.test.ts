import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { ChronixGantt } from './chronix-gantt.js';

import type { AxisRangePlanInput, BarSpec, RowSpec } from '@chronixjs/gantt';

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
 * Mirror pattern: stub ResizeObserver so the SFC test
 * can deterministically fire viewport-state updates. Drive
 * `chartScroll.scrollLeft.value` + `clientWidth.value` by mutating
 * `paneEl.scrollLeft` + `Object.defineProperty(clientWidth)` and
 * invoking the captured callbacks.
 */
function driveChartScroll(
  wrapper: ReturnType<typeof mount>,
  scrollLeft: number,
  clientWidth: number,
  resizeObserverCallback: ResizeObserverCallback | undefined,
): void {
  const paneEl = wrapper.find<HTMLElement>('div.cx-gantt-chart-pane').element;
  Object.defineProperty(paneEl, 'clientWidth', { value: clientWidth, configurable: true });
  paneEl.scrollLeft = scrollLeft;
  paneEl.dispatchEvent(new Event('scroll'));
  resizeObserverCallback?.([], {} as ResizeObserver);
}

describe('<ChronixGantt> viewport-aware bar title + progress-dot positioning', () => {
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
    warnSpy.mockRestore();
    if (originalResizeObserver !== undefined) {
      globalThis.ResizeObserver = originalResizeObserver;
    }
  });

  it('viewport-clipped bar repositions title-start to past the viewport-locked triangle', async () => {
    // Bar at hours 1..16 (axis-inside). renderX = 60, renderWidth = 900.
    // Scroll to scrollLeft=300, clientWidth=600 → viewport [300, 900).
    // Bar spans viewport (60 < 300; 960 > 900) → both viewport-clipped flags
    // fire. Title-start should be at viewportLockedLeftApexX + TRIANGLE_SIZE
    // + TITLE_TRIANGLE_GAP = (300 + 1) + 6 + 4 = 311 — NOT at renderX + 8 = 68.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('inside-axis', 1, 16, 'long enough title for truncation tests')],
        rows,
        axisInput,
      },
    });
    driveChartScroll(wrapper, 300, 600, roCallbackHolder.cb);
    await nextTick();

    const titleEl = wrapper.find('text.cx-gantt-bar-text');
    expect(titleEl.exists()).toBe(true);
    // <text> uses `x` attribute for the anchor position.
    expect(Number(titleEl.attributes('x'))).toBe(311);
  });

  it('viewport-clipped + selected + editable bar repositions left progress-dot to viewport-edge', async () => {
    // Same bar geometry as title test: hours 1..16, viewport-clipped left.
    // Selected + editable → dot rect renders. Left dot should be at
    // viewportLockedLeftApexX + TRIANGLE_SIZE + DOT_TRIANGLE_GAP = (300 + 1)
    // + 6 + 2 = 309 — NOT at renderX + DOT_EDGE_INSET = 61.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('inside-axis-selected', 1, 16, 'title')],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['inside-axis-selected'],
      },
    });
    driveChartScroll(wrapper, 300, 600, roCallbackHolder.cb);
    await nextTick();

    const dotEl = wrapper.find('rect.cx-gantt-bar-resizer-dot-start');
    expect(dotEl.exists()).toBe(true);
    expect(Number(dotEl.attributes('x'))).toBe(309);
  });

  it('partial-overlap bar (right edge offscreen-right, left edge inside viewport) keeps default title-start at bar edge', async () => {
    // Bar at hours 1..16 (axis-inside). renderX = 60, renderWidth = 900.
    // Scroll to scrollLeft=0, clientWidth=200 → viewport [0, 200). Bar
    // overlaps viewport on left only (60 < 200; 960 > 200). Only
    // `isViewportClippedEnd` fires. simplified the logic:
    // titleStartX uses viewport-clip for left side only (FALSE here,
    // so defaults to renderX + 8 = 68); titleEndX NEVER uses viewport-
    // clip (always defaults to renderX + renderWidth - 4 = 956).
    // availableWidth = 956 - 68 = 888 → full title fits. This avoids
    // the negative-width regression 's bilateral span
    // check while keeping titles readable at the bar's left edge.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('partial-right', 1, 16, 'long enough title for truncation tests')],
        rows,
        axisInput,
      },
    });
    driveChartScroll(wrapper, 0, 200, roCallbackHolder.cb);
    await nextTick();

    const titleEl = wrapper.find('text.cx-gantt-bar-text');
    expect(titleEl.exists()).toBe(true);
    // Default math: titleStartX = renderX + TITLE_LEFT_PADDING = 60 + 8 = 68.
    expect(Number(titleEl.attributes('x'))).toBe(68);
  });

  it('underlying resize edge-zone hit-test rect stays at bar geometric edge under viewport-clip (visual + hit-test diverge by design)', async () => {
    // deliberately keeps the resize edge-zone rect
    // (cx-gantt-bar-resizer-start) at renderX regardless of viewport
    // state. Only the visible dot shifts to viewport edge. The hit-test
    // geometry must stay at the bar's real edge so resize gestures
    // operate on the bar's actual boundary, not on a phantom position
    // hundreds of pixels away.
    const wrapper = mount(ChronixGantt, {
      props: {
        bars: [bar('inside-axis-selected', 1, 16, 'title')],
        rows,
        axisInput,
        editable: true,
        selectedBarIds: ['inside-axis-selected'],
      },
    });
    driveChartScroll(wrapper, 300, 600, roCallbackHolder.cb);
    await nextTick();

    const edgeZoneStart = wrapper.find('rect.cx-gantt-bar-resizer-start');
    expect(edgeZoneStart.exists()).toBe(true);
    // Edge-zone stays at the bar's renderX = 1h × 60px = 60.
    expect(Number(edgeZoneStart.attributes('x'))).toBe(60);
    // Sanity: this is original of the viewport (60 < scrollLeft 300) —
    // the user can't see this edge until they scroll back left, BUT the
    // bar's actual geometric edge IS there. Resize math operates on
    // content-coord deltas, so this is the correct anchor point.
  });
});

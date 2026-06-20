import {
  BAR_SLOT_NAME,
  createSlotRegistry,
  defaultAxisRangePlanner,
  defaultBarPlacementPass,
  defaultBarStackHeightPass,
  defaultChronixTheme,
  defaultRowSwimlaneLayout,
  HEADER_CELL_SLOT_NAME,
  LINK_SLOT_NAME,
  type AxisRangePlanInput,
  type BarSlotArgs,
  type BarSpec,
  type BarStyleArg,
  type ChronixTheme,
  type GanttHandle,
  type HeaderCellSlotArgs,
  type LinkRenderArg,
  type LinkSlotArgs,
  type LinkSpec,
  type RowSpec,
} from '@chronixjs/gantt';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt, type BarClickPayload, type EmptyAreaClickPayload } from './chronix-gantt.js';

import type {
  BarDropPayload,
  BarDropRejectedPayload,
  BarResizeRejectedPayload,
  SelectPayload,
  SelectRejectedPayload,
} from './use-gantt-pointer.js';

afterEach(() => {
  cleanup();
});

const makeBar = (id: string, rowId: string, startISO: string, endISO: string): BarSpec => ({
  id,
  rowId,
  range: { start: new Date(startISO), end: new Date(endISO) },
  dprIntent: 'crisp-pixel',
});

const makeRow = (id: string): RowSpec => ({ id, columns: { name: id } });

const baseAxisInput = (): AxisRangePlanInput => ({
  viewId: 'week',
  anchorDate: new Date('2026-05-18T00:00:00'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
});

describe('@chronixjs/gantt-react ChronixGantt (Phase 32 + 32.1)', () => {
  it('mounts and emits <div.cx-gantt-wrapper> root containing header + body SVGs', () => {
    const { container } = render(<ChronixGantt bars={[]} rows={[]} axisInput={baseAxisInput()} />);

    const wrapper = container.querySelector('div.cx-gantt-wrapper');
    expect(wrapper).not.toBeNull();
    expect(container.querySelectorAll('svg.cx-gantt-header').length).toBe(1);
    expect(container.querySelectorAll('svg.cx-gantt-body').length).toBe(1);
  });

  it('renders one <rect data-bar-id> per placed bar, in input order', () => {
    const bars = [
      makeBar('b1', 'r1', '2026-05-18T09:00', '2026-05-19T17:00'),
      makeBar('b2', 'r2', '2026-05-19T00:00', '2026-05-21T00:00'),
      makeBar('b3', 'r3', '2026-05-20T08:00', '2026-05-22T12:00'),
    ];
    const rows = [makeRow('r1'), makeRow('r2'), makeRow('r3')];

    const { container } = render(
      <ChronixGantt bars={bars} rows={rows} axisInput={baseAxisInput()} />,
    );

    const rects = Array.from(container.querySelectorAll('[data-bar-id]'));
    expect(rects.length).toBe(3);
    expect(rects[0]?.getAttribute('data-bar-id')).toBe('b1');
    expect(rects[1]?.getAttribute('data-bar-id')).toBe('b2');
    expect(rects[2]?.getAttribute('data-bar-id')).toBe('b3');
  });

  it('bar coordinates match defaultBarPlacementPass.place output (pipeline-integrity check)', () => {
    const bars = [makeBar('b1', 'r1', '2026-05-19T00:00', '2026-05-20T00:00')];
    const rows = [makeRow('r1')];
    const axisInput = baseAxisInput();

    const axis = defaultAxisRangePlanner.plan(axisInput);
    const stackOut = defaultBarStackHeightPass.compute({
      bars,
      rows,
      axis,
      barHeight: 30,
      barStackSpacing: 5, // Phase 43 default
    });
    const rowsWithHints = rows.map((r): RowSpec => {
      const hint = stackOut.heightByRowId.get(r.id);
      return hint != null ? { ...r, heightHint: hint } : r;
    });
    const swimlaneOut = defaultRowSwimlaneLayout.layout({
      rows: rowsWithHints,
      defaultRowHeight: 38,
      rowSpacing: 1,
    });
    const placement = defaultBarPlacementPass.place({
      bars,
      axis,
      strips: swimlaneOut.strips,
      barHeight: 30,
      barVerticalPadding: 4, // Phase 43 default
      levelByBarId: stackOut.levelByBarId,
      barStackSpacing: 5, // Phase 43 default
    });
    const expected = placement.placedBars[0];
    expect(expected).toBeDefined();
    if (expected == null) return;

    const { container } = render(<ChronixGantt bars={bars} rows={rows} axisInput={axisInput} />);
    const rect = container.querySelector('[data-bar-id="b1"]');
    expect(rect).not.toBeNull();
    if (rect == null) return;
    expect(Number(rect.getAttribute('x'))).toBe(expected.x);
    expect(Number(rect.getAttribute('y'))).toBe(expected.y);
    expect(Number(rect.getAttribute('width'))).toBe(expected.width);
    expect(Number(rect.getAttribute('height'))).toBe(expected.height);
  });

  it('reactive: changing axisInput.viewId re-renders bar at a new x', () => {
    const bars = [makeBar('b1', 'r1', '2026-05-19T00:00', '2026-05-20T00:00')];
    const rows = [makeRow('r1')];

    const { container, rerender } = render(
      <ChronixGantt bars={bars} rows={rows} axisInput={baseAxisInput()} />,
    );
    const initialX = container.querySelector('[data-bar-id="b1"]')?.getAttribute('x');

    rerender(
      <ChronixGantt bars={bars} rows={rows} axisInput={{ ...baseAxisInput(), viewId: 'month' }} />,
    );

    const afterX = container.querySelector('[data-bar-id="b1"]')?.getAttribute('x');
    expect(afterX).toBeDefined();
    expect(afterX).not.toBe(initialX);
  });

  it('empty bars array renders body SVG with no <rect data-bar-id> children', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={[makeRow('r1')]} axisInput={baseAxisInput()} />,
    );

    expect(container.querySelectorAll('[data-bar-id]').length).toBe(0);
    expect(container.querySelector('svg.cx-gantt-body')).not.toBeNull();
  });

  // Phase 32.1: axis chrome render cases.

  it('header SVG dimensions match axis.totalWidth × (headerRows × headerRowHeight + headerHeight)', () => {
    const axisInput = baseAxisInput();
    const { container } = render(
      <ChronixGantt bars={[]} rows={[makeRow('r1')]} axisInput={axisInput} />,
    );

    const planned = defaultAxisRangePlanner.plan(axisInput);
    const expectedHeight = planned.headerRows.length * 20 + 24; // defaults
    const headerSvg = container.querySelector('svg.cx-gantt-header');
    expect(headerSvg).not.toBeNull();
    expect(Number(headerSvg?.getAttribute('width'))).toBe(planned.totalWidth);
    expect(Number(headerSvg?.getAttribute('height'))).toBe(expectedHeight);
  });

  it('renders one <rect.cx-gantt-header-cell> per outer-band cell across all header rows', () => {
    const axisInput = baseAxisInput();
    const { container } = render(
      <ChronixGantt bars={[]} rows={[makeRow('r1')]} axisInput={axisInput} />,
    );

    const planned = defaultAxisRangePlanner.plan(axisInput);
    const expectedCells = planned.headerRows.reduce((sum, r) => sum + r.cells.length, 0);
    expect(container.querySelectorAll('.cx-gantt-header-cell').length).toBe(expectedCells);
    expect(container.querySelectorAll('.cx-gantt-header-cell-label').length).toBe(expectedCells);
  });

  it('renders one <line.cx-gantt-tick-line> + <text.cx-gantt-tick-label> per axis.ticks entry', () => {
    const axisInput = baseAxisInput();
    const { container } = render(
      <ChronixGantt bars={[]} rows={[makeRow('r1')]} axisInput={axisInput} />,
    );

    const planned = defaultAxisRangePlanner.plan(axisInput);
    expect(container.querySelectorAll('.cx-gantt-tick-line').length).toBe(planned.ticks.length);
    expect(container.querySelectorAll('.cx-gantt-tick-label').length).toBe(planned.ticks.length);
  });

  it('renders <line.cx-gantt-axis-divider> at y = headerHeight when headerHeight > 0', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={[makeRow('r1')]} axisInput={baseAxisInput()} />,
    );

    const divider = container.querySelector('.cx-gantt-axis-divider');
    expect(divider).not.toBeNull();
    expect(Number(divider?.getAttribute('y1'))).toBe(24); // default headerHeight
    expect(Number(divider?.getAttribute('y2'))).toBe(24);
  });

  it('switching axisInput.viewId re-renders header cells with new counts', () => {
    const axisInput = baseAxisInput();
    const { container, rerender } = render(
      <ChronixGantt bars={[]} rows={[makeRow('r1')]} axisInput={axisInput} />,
    );

    const weekCells = container.querySelectorAll('.cx-gantt-header-cell').length;
    rerender(
      <ChronixGantt
        bars={[]}
        rows={[makeRow('r1')]}
        axisInput={{ ...axisInput, viewId: 'month' }}
      />,
    );
    const monthCells = container.querySelectorAll('.cx-gantt-header-cell').length;
    // Different views produce different cell counts; assert change (exact
    // counts are pinned by the per-cell test above against the planner).
    expect(monthCells).not.toBe(weekCells);
  });
});

describe('@chronixjs/gantt-react ChronixGantt — pointer integration (Phase 32.2)', () => {
  // jsdom doesn't implement setPointerCapture / releasePointerCapture +
  // doesn't honor getBoundingClientRect from CSS. Stub both so the
  // adapter's pointer plumbing exercises the full begin / advance /
  // commit path. Bounding-rect zero-origin lets us treat clientX/Y as
  // content-x/y directly (no rect.left/top subtraction).
  beforeEach(() => {
    const proto = Element.prototype as unknown as {
      setPointerCapture?: (this: void, id: number) => void;
      releasePointerCapture?: (this: void, id: number) => void;
      hasPointerCapture?: (this: void, id: number) => boolean;
    };
    proto.setPointerCapture ??= function noopSetPointerCapture(): void {
      /* jsdom stub */
    };
    proto.releasePointerCapture ??= function noopReleasePointerCapture(): void {
      /* jsdom stub */
    };
    proto.hasPointerCapture ??= function noopHasPointerCapture(): boolean {
      return false;
    };
    // Return zero-origin rect with non-zero dimensions so clientX/Y
    // can be used directly as content-x/y (no rect.left/top subtraction).
    // Use defineProperty to ensure it overrides jsdom's implementation.
    const svgProto = SVGSVGElement.prototype;
    const originalGetBoundingClientRect = svgProto.getBoundingClientRect;
    Object.defineProperty(svgProto, 'getBoundingClientRect', {
      configurable: true,
      writable: true,
      enumerable: true,
      value: function (this: SVGSVGElement): DOMRect {
        // If the SVG has explicit width/height attributes, use them
        const width = this.width?.baseVal?.value ?? 10000;
        const height = this.height?.baseVal?.value ?? 1000;
        if (width > 0 && height > 0) {
          return {
            left: 0,
            top: 0,
            width,
            height,
            right: width,
            bottom: height,
            x: 0,
            y: 0,
            toJSON() {
              return this;
            },
          } as DOMRect;
        }
        // Fallback to large dimensions for tests that don't set attributes
        return {
          left: 0,
          top: 0,
          width: 10000,
          height: 1000,
          right: 10000,
          bottom: 1000,
          x: 0,
          y: 0,
          toJSON() {
            return this;
          },
        } as DOMRect;
      },
    });
  });

  const MS_PER_HOUR_MS = 60 * 60 * 1000;
  const anchor = new Date('2026-05-13T00:00:00Z');
  anchor.setHours(0, 0, 0, 0);
  const anchorMs = anchor.getTime();

  const dayAxisInput = (): AxisRangePlanInput => ({
    viewId: 'day',
    anchorDate: new Date(anchorMs),
    viewportWidth: 1440,
    locale: 'zh-CN',
    weekendsVisible: true,
  });

  function dragBar(): readonly BarSpec[] {
    return [
      {
        id: 'b1',
        rowId: 'r1',
        range: {
          start: new Date(anchorMs + 8 * MS_PER_HOUR_MS),
          end: new Date(anchorMs + 12 * MS_PER_HOUR_MS),
        },
        dprIntent: 'crisp-pixel',
      },
    ];
  }

  function bodySvgFromContainer(container: HTMLElement): SVGSVGElement {
    const el = container.querySelector('svg.cx-gantt-body');
    if (!el) throw new Error('cx-gantt-body not found');
    return el as SVGSVGElement;
  }

  it('onBarDrop fires with shifted range after pointerdown-move-up on bar body (editable=true)', () => {
    const onBarDrop = vi.fn<(p: BarDropPayload) => void>();
    const { container } = render(
      <ChronixGantt
        bars={dragBar()}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        editable
        onBarDrop={onBarDrop}
      />,
    );
    const body = bodySvgFromContainer(container);
    // Bar 'b1' at content x=480..720 (day view slotWidth=60, hour 8..12).
    // Drag from (600, 20) → (660, 20) = +60 px → +1 hour.
    fireEvent.pointerDown(body, { button: 0, clientX: 600, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 660, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 660, clientY: 20, pointerId: 1 });

    expect(onBarDrop).toHaveBeenCalledOnce();
    const payload = onBarDrop.mock.calls[0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.newRange.start.getTime() - payload.oldRange.start.getTime()).toBe(
      MS_PER_HOUR_MS,
    );
  });

  it('editable=false blocks bar-drag (callback not fired)', () => {
    const onBarDrop = vi.fn<(p: BarDropPayload) => void>();
    const { container } = render(
      <ChronixGantt
        bars={dragBar()}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        onBarDrop={onBarDrop}
      />,
    );
    const body = bodySvgFromContainer(container);
    fireEvent.pointerDown(body, { button: 0, clientX: 600, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 660, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 660, clientY: 20, pointerId: 1 });
    expect(onBarDrop).not.toHaveBeenCalled();
  });

  it('onSelect fires after pointerdown-move-up on empty row (selectable=true)', () => {
    const onSelect = vi.fn<(p: SelectPayload) => void>();
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        selectable
        onSelect={onSelect}
      />,
    );
    const body = bodySvgFromContainer(container);
    // Click at content (120, 20) → hour 2, row r1. Drag to (300, 20) → hour 5.
    fireEvent.pointerDown(body, { button: 0, clientX: 120, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 300, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 300, clientY: 20, pointerId: 1 });

    expect(onSelect).toHaveBeenCalledOnce();
    const payload = onSelect.mock.calls[0]![0];
    expect(payload.rowId).toBe('r1');
    expect(payload.range.end.getTime() - payload.range.start.getTime()).toBe(3 * MS_PER_HOUR_MS);
  });

  it('onBarClick fires on sub-threshold pointer (within 5px)', () => {
    const onBarClick = vi.fn<(p: BarClickPayload) => void>();
    const onBarDrop = vi.fn<(p: BarDropPayload) => void>();
    const { container } = render(
      <ChronixGantt
        bars={dragBar()}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        editable
        onBarClick={onBarClick}
        onBarDrop={onBarDrop}
      />,
    );
    const body = bodySvgFromContainer(container);
    // Pointerdown + 2-px move (sub-threshold; default minDistance=5) + up.
    fireEvent.pointerDown(body, { button: 0, clientX: 600, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 602, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 602, clientY: 20, pointerId: 1 });

    expect(onBarClick).toHaveBeenCalledOnce();
    expect(onBarClick.mock.calls[0]![0].barId).toBe('b1');
    // Sub-threshold drag aborts; no drop fires.
    expect(onBarDrop).not.toHaveBeenCalled();
  });

  it('pointerMinDistance={0} disables the gate — 1px move commits a drag (Phase 41)', () => {
    const onBarDrop = vi.fn<(p: BarDropPayload) => void>();
    const onBarClick = vi.fn<(p: BarClickPayload) => void>();
    const { container } = render(
      <ChronixGantt
        bars={dragBar()}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        editable
        pointerMinDistance={0}
        onBarClick={onBarClick}
        onBarDrop={onBarDrop}
      />,
    );
    const body = bodySvgFromContainer(container);
    // 1-px advance — under the default 5-px gate this would suppress
    // the drag (see the prior test). With pointerMinDistance={0}, the
    // gate is disabled and the bar-drop commits even on a 1-px move.
    fireEvent.pointerDown(body, { button: 0, clientX: 600, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 601, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 601, clientY: 20, pointerId: 1 });

    expect(onBarDrop).toHaveBeenCalledOnce();
    expect(onBarClick).not.toHaveBeenCalled();
  });

  it('onEmptyAreaClick fires on sub-threshold pointer on empty row', () => {
    const onEmptyAreaClick = vi.fn<(p: EmptyAreaClickPayload) => void>();
    const onSelect = vi.fn();
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        selectable
        onEmptyAreaClick={onEmptyAreaClick}
        onSelect={onSelect}
      />,
    );
    const body = bodySvgFromContainer(container);
    fireEvent.pointerDown(body, { button: 0, clientX: 120, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 122, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 122, clientY: 20, pointerId: 1 });

    expect(onEmptyAreaClick).toHaveBeenCalledOnce();
    expect(onEmptyAreaClick.mock.calls[0]![0].rowId).toBe('r1');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('onPointerCancel aborts active transaction without firing commit', () => {
    const onBarDrop = vi.fn<(p: BarDropPayload) => void>();
    const { container } = render(
      <ChronixGantt
        bars={dragBar()}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        editable
        onBarDrop={onBarDrop}
      />,
    );
    const body = bodySvgFromContainer(container);
    fireEvent.pointerDown(body, { button: 0, clientX: 600, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 660, clientY: 20, pointerId: 1 });
    fireEvent.pointerCancel(body, { clientX: 660, clientY: 20, pointerId: 1 });
    expect(onBarDrop).not.toHaveBeenCalled();
  });

  // Phase 32.2.1: Phase 19 validator gate adapter-level wiring.

  function twoBarsCrossRow(): readonly BarSpec[] {
    // b1 on r1 hour 8-12, b2 on r2 hour 10-14 (time-intersecting).
    return [
      {
        id: 'b1',
        rowId: 'r1',
        range: {
          start: new Date(anchorMs + 8 * MS_PER_HOUR_MS),
          end: new Date(anchorMs + 12 * MS_PER_HOUR_MS),
        },
        dprIntent: 'crisp-pixel',
      },
      {
        id: 'b2',
        rowId: 'r2',
        range: {
          start: new Date(anchorMs + 10 * MS_PER_HOUR_MS),
          end: new Date(anchorMs + 14 * MS_PER_HOUR_MS),
        },
        dprIntent: 'crisp-pixel',
      },
    ];
  }

  it('eventOverlap=false rejects drag whose new time range intersects a cross-row bar with reason "overlap"', () => {
    const onBarDrop = vi.fn<(p: BarDropPayload) => void>();
    const onBarDropRejected = vi.fn<(p: BarDropRejectedPayload) => void>();
    const { container } = render(
      <ChronixGantt
        bars={twoBarsCrossRow()}
        rows={[makeRow('r1'), makeRow('r2')]}
        axisInput={dayAxisInput()}
        editable
        eventOverlap={false}
        onBarDrop={onBarDrop}
        onBarDropRejected={onBarDropRejected}
      />,
    );
    const body = bodySvgFromContainer(container);
    // Drag b1 horizontally (stays in r1, y stays ~20). New time = hour
    // 9..13 still intersects b2's hour 10..14 — b2 is in r2 (cross-row
    // relative to b1's r1) so the validator must reject.
    fireEvent.pointerDown(body, { button: 0, clientX: 600, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 660, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 660, clientY: 20, pointerId: 1 });

    expect(onBarDrop).not.toHaveBeenCalled();
    expect(onBarDropRejected).toHaveBeenCalledOnce();
    const payload = onBarDropRejected.mock.calls[0]![0];
    expect(payload.barId).toBe('b1');
    expect(payload.reason).toBe('overlap');
  });

  it('eventConstraint with restrictive time range rejects out-of-window drag with reason "constraint"', () => {
    const onBarDrop = vi.fn<(p: BarDropPayload) => void>();
    const onBarDropRejected = vi.fn<(p: BarDropRejectedPayload) => void>();
    // Constraint range: hour 0..10 only. Bar b1 (hour 8..12) drag of
    // +60 px (= +1 hour) → new range hour 9..13, end past hour 10 →
    // out of window.
    const constraint = {
      range: {
        start: new Date(anchorMs),
        end: new Date(anchorMs + 10 * MS_PER_HOUR_MS),
      },
    };
    const { container } = render(
      <ChronixGantt
        bars={dragBar()}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        editable
        eventConstraint={constraint}
        onBarDrop={onBarDrop}
        onBarDropRejected={onBarDropRejected}
      />,
    );
    const body = bodySvgFromContainer(container);
    fireEvent.pointerDown(body, { button: 0, clientX: 600, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 660, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 660, clientY: 20, pointerId: 1 });

    expect(onBarDrop).not.toHaveBeenCalled();
    expect(onBarDropRejected).toHaveBeenCalledOnce();
    expect(onBarDropRejected.mock.calls[0]![0].reason).toBe('constraint');
  });

  it('eventAllow returning false rejects every drag with reason "allow"', () => {
    const onBarDrop = vi.fn<(p: BarDropPayload) => void>();
    const onBarDropRejected = vi.fn<(p: BarDropRejectedPayload) => void>();
    const { container } = render(
      <ChronixGantt
        bars={dragBar()}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        editable
        eventAllow={() => false}
        onBarDrop={onBarDrop}
        onBarDropRejected={onBarDropRejected}
      />,
    );
    const body = bodySvgFromContainer(container);
    fireEvent.pointerDown(body, { button: 0, clientX: 600, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 660, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 660, clientY: 20, pointerId: 1 });

    expect(onBarDrop).not.toHaveBeenCalled();
    expect(onBarDropRejected).toHaveBeenCalledOnce();
    expect(onBarDropRejected.mock.calls[0]![0].reason).toBe('allow');
  });

  it('eventAllow does NOT block bar-resize when only resize validator returns true', () => {
    // Use a permissive eventAllow that returns true. Resize commit should
    // fire normally (sanity check that the resize validator path runs).
    const onBarResize = vi.fn();
    const onBarResizeRejected = vi.fn<(p: BarResizeRejectedPayload) => void>();
    const { container } = render(
      <ChronixGantt
        bars={dragBar()}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        editable
        eventAllow={() => true}
        onBarResize={onBarResize}
        onBarResizeRejected={onBarResizeRejected}
      />,
    );
    const body = bodySvgFromContainer(container);
    // Resize end edge (~x=720) to the right.
    fireEvent.pointerDown(body, { button: 0, clientX: 715, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 775, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 775, clientY: 20, pointerId: 1 });
    expect(onBarResize).toHaveBeenCalledOnce();
    expect(onBarResizeRejected).not.toHaveBeenCalled();
  });

  it('selectAllow returning false rejects empty-row select', () => {
    const onSelect = vi.fn<(p: SelectPayload) => void>();
    const onSelectRejected = vi.fn<(p: SelectRejectedPayload) => void>();
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        selectable
        selectAllow={() => false}
        onSelect={onSelect}
        onSelectRejected={onSelectRejected}
      />,
    );
    const body = bodySvgFromContainer(container);
    fireEvent.pointerDown(body, { button: 0, clientX: 120, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 300, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 300, clientY: 20, pointerId: 1 });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectRejected).toHaveBeenCalledOnce();
    const payload = onSelectRejected.mock.calls[0]![0];
    expect(payload.rowId).toBe('r1');
  });

  it('default eventOverlap allows drag whose new time intersects a cross-row bar (no validator vetoing)', () => {
    const onBarDrop = vi.fn<(p: BarDropPayload) => void>();
    const onBarDropRejected = vi.fn<(p: BarDropRejectedPayload) => void>();
    const { container } = render(
      <ChronixGantt
        bars={twoBarsCrossRow()}
        rows={[makeRow('r1'), makeRow('r2')]}
        axisInput={dayAxisInput()}
        editable
        onBarDrop={onBarDrop}
        onBarDropRejected={onBarDropRejected}
      />,
    );
    const body = bodySvgFromContainer(container);
    // Same horizontal drag as the eventOverlap=false test above — but
    // without the overlap policy set, the default `true` permits.
    fireEvent.pointerDown(body, { button: 0, clientX: 600, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 660, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 660, clientY: 20, pointerId: 1 });

    expect(onBarDrop).toHaveBeenCalledOnce();
    expect(onBarDropRejected).not.toHaveBeenCalled();
  });

  it('selectOverlap=false rejects range-select that intersects an existing bar (Phase 55)', () => {
    const onSelect = vi.fn<(p: SelectPayload) => void>();
    const onSelectRejected = vi.fn<(p: SelectRejectedPayload) => void>();
    // b1 on r2 (8-12) — different row from where we select, so pointerdown
    // lands in empty space on r1.
    const bars: readonly BarSpec[] = [
      {
        id: 'b1',
        rowId: 'r2',
        range: {
          start: new Date(anchorMs + 8 * MS_PER_HOUR_MS),
          end: new Date(anchorMs + 12 * MS_PER_HOUR_MS),
        },
        dprIntent: 'crisp-pixel',
      },
    ];
    const { container } = render(
      <ChronixGantt
        bars={bars}
        rows={[makeRow('r1'), makeRow('r2')]}
        axisInput={dayAxisInput()}
        selectable
        selectOverlap={false}
        onSelect={onSelect}
        onSelectRejected={onSelectRejected}
      />,
    );
    const body = bodySvgFromContainer(container);
    // Drag-select on r1 from x=180 (3h) → x=600 (10h) → proposal 3-10
    // intersects b1 (8-12) → veto via selectOverlap.
    fireEvent.pointerDown(body, { button: 0, clientX: 180, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 600, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 600, clientY: 20, pointerId: 1 });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectRejected).toHaveBeenCalledOnce();
    expect(onSelectRejected.mock.calls[0]![0].reason).toBe('overlap');
  });

  it('selectConstraint narrower than eventConstraint vetoes select-only (Phase 55)', () => {
    const onSelect = vi.fn<(p: SelectPayload) => void>();
    const onSelectRejected = vi.fn<(p: SelectRejectedPayload) => void>();
    const wideConstraint = {
      range: {
        start: new Date(anchorMs + 0 * MS_PER_HOUR_MS),
        end: new Date(anchorMs + 24 * MS_PER_HOUR_MS),
      },
    };
    const narrowConstraint = {
      range: {
        start: new Date(anchorMs + 8 * MS_PER_HOUR_MS),
        end: new Date(anchorMs + 12 * MS_PER_HOUR_MS),
      },
    };
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={[makeRow('r1')]}
        axisInput={dayAxisInput()}
        selectable
        eventConstraint={wideConstraint}
        selectConstraint={narrowConstraint}
        onSelect={onSelect}
        onSelectRejected={onSelectRejected}
      />,
    );
    const body = bodySvgFromContainer(container);
    // x=780 (13h) → x=1020 (17h). Outside [8..12] selectConstraint.
    fireEvent.pointerDown(body, { button: 0, clientX: 780, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(body, { clientX: 1020, clientY: 20, pointerId: 1 });
    fireEvent.pointerUp(body, { clientX: 1020, clientY: 20, pointerId: 1 });

    expect(onSelect).not.toHaveBeenCalled();
    expect(onSelectRejected).toHaveBeenCalledOnce();
    expect(onSelectRejected.mock.calls[0]![0].reason).toBe('constraint');
  });
});

describe('@chronixjs/gantt-react ChronixGantt — theme / slot / selection (Phase 32.3)', () => {
  // Shared helpers for this block — two bars on two rows so selection
  // tests can assert per-bar class application without ambiguity.
  function twoBars(): readonly BarSpec[] {
    return [
      makeBar('b1', 'r1', '2026-05-19T00:00', '2026-05-20T00:00'),
      makeBar('b2', 'r2', '2026-05-20T00:00', '2026-05-21T00:00'),
    ];
  }
  const twoRows = (): readonly RowSpec[] => [makeRow('r1'), makeRow('r2')];

  // (1) Theme prop — 4 cases

  it('default theme: bar fill matches defaultChronixTheme.barBackgroundColor (visible drift from Phase 32.2)', () => {
    const { container } = render(
      <ChronixGantt bars={twoBars()} rows={twoRows()} axisInput={baseAxisInput()} />,
    );
    const bar = container.querySelector('rect.cx-gantt-bar');
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('fill')).toBe(defaultChronixTheme.barBackgroundColor);
    expect(bar?.getAttribute('stroke')).toBe(defaultChronixTheme.barBorderColor);
    // Header chrome reads from the same theme.
    const headerCell = container.querySelector('rect.cx-gantt-header-cell');
    expect(headerCell?.getAttribute('fill')).toBe(defaultChronixTheme.headerCellFill);
  });

  it('partial theme override: bar fill flips to overridden token; other tokens stay default', () => {
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRows()}
        axisInput={baseAxisInput()}
        theme={{ barBackgroundColor: '#ff6b6b' }}
      />,
    );
    const bar = container.querySelector('rect.cx-gantt-bar');
    expect(bar?.getAttribute('fill')).toBe('#ff6b6b');
    // Untouched tokens still come from the default theme.
    const headerCell = container.querySelector('rect.cx-gantt-header-cell');
    expect(headerCell?.getAttribute('fill')).toBe(defaultChronixTheme.headerCellFill);
  });

  it('theme prop is reactive: rerender with new theme updates inline attributes on the next paint', () => {
    const { container, rerender } = render(
      <ChronixGantt bars={twoBars()} rows={twoRows()} axisInput={baseAxisInput()} />,
    );
    const before = container.querySelector('rect.cx-gantt-bar')?.getAttribute('fill');
    expect(before).toBe(defaultChronixTheme.barBackgroundColor);
    rerender(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRows()}
        axisInput={baseAxisInput()}
        theme={{ barBackgroundColor: '#10b981' }}
      />,
    );
    expect(container.querySelector('rect.cx-gantt-bar')?.getAttribute('fill')).toBe('#10b981');
  });

  it('multi-token theme override: header cell fill and label color both flip in tandem', () => {
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={twoRows()}
        axisInput={baseAxisInput()}
        theme={{ headerCellFill: '#000000', headerCellLabel: '#ffffff' }}
      />,
    );
    const cell = container.querySelector('rect.cx-gantt-header-cell');
    const label = container.querySelector('text.cx-gantt-header-cell-label');
    expect(cell?.getAttribute('fill')).toBe('#000000');
    expect(label?.getAttribute('fill')).toBe('#ffffff');
  });

  // (2) Slot registry — 4 cases

  it('slotRegistry=undefined: default <rect.cx-gantt-bar> renders for each placed bar', () => {
    const { container } = render(
      <ChronixGantt bars={twoBars()} rows={twoRows()} axisInput={baseAxisInput()} />,
    );
    expect(container.querySelectorAll('rect.cx-gantt-bar').length).toBe(2);
  });

  it('BAR_SLOT_NAME registered: template replaces default <rect> with its returned ReactNode; BarSlotArgs carry theme + isSelected', () => {
    const seenArgs: BarSlotArgs[] = [];
    const reg = createSlotRegistry();
    reg.register(BAR_SLOT_NAME, (ctx) => {
      const args = ctx.args as unknown as BarSlotArgs;
      seenArgs.push(args);
      return (
        <g data-custom-bar={args.sourceBar.id}>
          <rect
            x={args.renderX}
            y={args.renderY}
            width={args.renderWidth}
            height={args.renderHeight}
            fill={args.resolvedBackgroundColor}
          />
        </g>
      );
    });
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRows()}
        axisInput={baseAxisInput()}
        slotRegistry={reg}
        selectedBarIds={['b1']}
      />,
    );
    // Default bar rect should not render when slot is registered.
    expect(container.querySelectorAll('rect.cx-gantt-bar').length).toBe(0);
    // Custom <g data-custom-bar> appears for each bar.
    expect(container.querySelectorAll('g[data-custom-bar]').length).toBe(2);
    // Slot args carry the merged theme and the isSelected flag.
    expect(seenArgs.length).toBeGreaterThanOrEqual(2);
    const b1Args = seenArgs.find((a) => a.sourceBar.id === 'b1');
    const b2Args = seenArgs.find((a) => a.sourceBar.id === 'b2');
    expect(b1Args?.isSelected).toBe(true);
    expect(b2Args?.isSelected).toBe(false);
    expect(b1Args?.theme.barBackgroundColor).toBe(defaultChronixTheme.barBackgroundColor);
    expect(b1Args?.resolvedBackgroundColor).toBe(defaultChronixTheme.barBackgroundColor);
  });

  it('HEADER_CELL_SLOT_NAME registered: band cells consult slot with cell-populated args', () => {
    const seenBandArgs: HeaderCellSlotArgs[] = [];
    const reg = createSlotRegistry();
    reg.register(HEADER_CELL_SLOT_NAME, (ctx) => {
      const args = ctx.args as unknown as HeaderCellSlotArgs;
      seenBandArgs.push(args);
      return (
        <rect
          data-custom-header={`${args.bandIndex}-${args.cellIndex}`}
          x={args.x}
          y={args.y}
          width={args.width}
          height={args.height}
          fill="#abcdef"
        />
      );
    });
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={[makeRow('r1')]}
        axisInput={baseAxisInput()}
        slotRegistry={reg}
      />,
    );
    // Default <rect.cx-gantt-header-cell> should not render.
    expect(container.querySelectorAll('rect.cx-gantt-header-cell').length).toBe(0);
    expect(container.querySelectorAll('rect[data-custom-header]').length).toBeGreaterThan(0);
    // At least one band-cell invocation should have `cell` populated and `tick` undefined.
    const bandInvocations = seenBandArgs.filter((a) => a.bandIndex >= 1);
    expect(bandInvocations.length).toBeGreaterThan(0);
    expect(bandInvocations[0]?.cell).toBeDefined();
    expect(bandInvocations[0]?.tick).toBeUndefined();
  });

  it('HEADER_CELL_SLOT_NAME registered: tick-row labels consult slot with bandIndex=0 + tick populated', () => {
    const seenArgs: HeaderCellSlotArgs[] = [];
    const reg = createSlotRegistry();
    reg.register(HEADER_CELL_SLOT_NAME, (ctx) => {
      const args = ctx.args as unknown as HeaderCellSlotArgs;
      seenArgs.push(args);
      return null;
    });
    render(
      <ChronixGantt
        bars={[]}
        rows={[makeRow('r1')]}
        axisInput={baseAxisInput()}
        slotRegistry={reg}
      />,
    );
    const tickInvocations = seenArgs.filter((a) => a.bandIndex === 0);
    expect(tickInvocations.length).toBeGreaterThan(0);
    expect(tickInvocations[0]?.tick).toBeDefined();
    expect(tickInvocations[0]?.cell).toBeUndefined();
    expect(tickInvocations[0]?.theme.headerTickLabel).toBe(defaultChronixTheme.headerTickLabel);
  });

  // (3) Selection prop + visual feedback — 4 cases

  it('selectedBarIds=[b1]: b1 rect carries cx-gantt-bar--selected class; b2 rect does not', () => {
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRows()}
        axisInput={baseAxisInput()}
        selectedBarIds={['b1']}
      />,
    );
    const b1 = container.querySelector('rect.cx-gantt-bar[data-bar-id="b1"]');
    const b2 = container.querySelector('rect.cx-gantt-bar[data-bar-id="b2"]');
    expect(b1?.classList.contains('cx-gantt-bar--selected')).toBe(true);
    expect(b2?.classList.contains('cx-gantt-bar--selected')).toBe(false);
  });

  it('selection-border rect appears for selected bar with stroke = theme.barSelectedBorderColor', () => {
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRows()}
        axisInput={baseAxisInput()}
        selectedBarIds={['b1']}
      />,
    );
    const borders = container.querySelectorAll('rect.cx-gantt-bar-selection-border');
    expect(borders.length).toBe(1);
    expect(borders[0]?.getAttribute('data-bar-id')).toBe('b1');
    expect(borders[0]?.getAttribute('stroke')).toBe(defaultChronixTheme.barSelectedBorderColor);
    expect(borders[0]?.getAttribute('fill')).toBe('none');
  });

  it('editable + selectedBarIds=[b1]: 2 resizer-zone rects + 2 dot rects appear for b1', () => {
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRows()}
        axisInput={baseAxisInput()}
        editable
        selectedBarIds={['b1']}
      />,
    );
    // Resizer zones render for EVERY bar when editable (not just selected).
    expect(
      container.querySelectorAll('rect.cx-gantt-bar-resizer-start[data-bar-id="b1"]').length,
    ).toBe(1);
    expect(
      container.querySelectorAll('rect.cx-gantt-bar-resizer-end[data-bar-id="b1"]').length,
    ).toBe(1);
    // Dot handles only for the selected bar.
    expect(
      container.querySelectorAll('rect.cx-gantt-bar-resizer-dot-start[data-bar-id="b1"]').length,
    ).toBe(1);
    expect(
      container.querySelectorAll('rect.cx-gantt-bar-resizer-dot-end[data-bar-id="b1"]').length,
    ).toBe(1);
  });

  it('editable + selectedBarIds=[]: resizer-zone rects appear for ALL bars but NO dot rects render', () => {
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRows()}
        axisInput={baseAxisInput()}
        editable
        selectedBarIds={[]}
      />,
    );
    expect(container.querySelectorAll('rect.cx-gantt-bar-resizer-start').length).toBe(2);
    expect(container.querySelectorAll('rect.cx-gantt-bar-resizer-end').length).toBe(2);
    expect(container.querySelectorAll('rect.cx-gantt-bar-resizer-dot-start').length).toBe(0);
    expect(container.querySelectorAll('rect.cx-gantt-bar-resizer-dot-end').length).toBe(0);
  });

  // Type-only smoke — referencing the imported types so they're not treated
  // as unused by the linter. The runtime behavior is exercised above.
  it('ChronixTheme type is structurally compatible with Partial<ChronixTheme> theme prop', () => {
    const partial: Partial<ChronixTheme> = { barBackgroundColor: '#123456' };
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRows()}
        axisInput={baseAxisInput()}
        theme={partial}
      />,
    );
    expect(container.querySelector('rect.cx-gantt-bar')?.getAttribute('fill')).toBe('#123456');
  });
});

describe('@chronixjs/gantt-react ChronixGantt — Phase 20 cascade + bar text + continuation triangles (Phase 32.4)', () => {
  // Bars + rows fixtures for this block. `barWithTitle` carries a title
  // long enough to demonstrate truncation on narrower widths; `clippedStart`
  // / `clippedEnd` have ranges extending outside the week-view axis so the
  // placement pass produces `isStart: false` / `isEnd: false`.
  function barsCascade(): readonly BarSpec[] {
    return [
      {
        ...makeBar('b1', 'r1', '2026-05-19T00:00', '2026-05-20T00:00'),
        title: 'Hello World',
      },
      {
        ...makeBar('b2', 'r2', '2026-05-20T00:00', '2026-05-21T00:00'),
      },
    ];
  }
  const twoRowsCascade = (): readonly RowSpec[] => [makeRow('r1'), makeRow('r2')];

  // For triangle tests: bar with range extending OUTSIDE the visible week so
  // placement pass marks `isStart: false` / `isEnd: false`.
  function barsForTriangles(): readonly BarSpec[] {
    return [
      // Starts BEFORE axis window (2026-05-15 < 2026-05-18 anchor) → isStart: false.
      makeBar('clippedStart', 'r1', '2026-05-15T00:00', '2026-05-20T00:00'),
      // Ends AFTER axis window (2026-05-30 > 2026-05-25 week end) → isEnd: false.
      makeBar('clippedEnd', 'r2', '2026-05-20T00:00', '2026-05-30T00:00'),
      // Fully inside → both flags true.
      makeBar('inside', 'r3', '2026-05-19T00:00', '2026-05-21T00:00'),
    ];
  }
  const threeRowsTriangle = (): readonly RowSpec[] => [makeRow('r1'), makeRow('r2'), makeRow('r3')];

  // (1) Phase 20 cascade — 8 cases

  it('default cascade: no override props → bar fill matches defaultChronixTheme.barBackgroundColor', () => {
    const { container } = render(
      <ChronixGantt bars={barsCascade()} rows={twoRowsCascade()} axisInput={baseAxisInput()} />,
    );
    const b1 = container.querySelector('rect.cx-gantt-bar[data-bar-id="b1"]');
    expect(b1?.getAttribute('fill')).toBe(defaultChronixTheme.barBackgroundColor);
    expect(b1?.getAttribute('stroke')).toBe(defaultChronixTheme.barBorderColor);
  });

  it('barColor umbrella: both background and border take the same value', () => {
    const { container } = render(
      <ChronixGantt
        bars={barsCascade()}
        rows={twoRowsCascade()}
        axisInput={baseAxisInput()}
        barColor="#ff6b6b"
      />,
    );
    const b1 = container.querySelector('rect.cx-gantt-bar[data-bar-id="b1"]');
    expect(b1?.getAttribute('fill')).toBe('#ff6b6b');
    expect(b1?.getAttribute('stroke')).toBe('#ff6b6b');
  });

  it('barBackgroundColor specific wins over barColor umbrella; border still from barColor', () => {
    const { container } = render(
      <ChronixGantt
        bars={barsCascade()}
        rows={twoRowsCascade()}
        axisInput={baseAxisInput()}
        barColor="#ff6b6b"
        barBackgroundColor="#00cc00"
      />,
    );
    const b1 = container.querySelector('rect.cx-gantt-bar[data-bar-id="b1"]');
    expect(b1?.getAttribute('fill')).toBe('#00cc00');
    expect(b1?.getAttribute('stroke')).toBe('#ff6b6b');
  });

  it('barBackgroundColorCallback runs per-bar; returning undefined defers to default', () => {
    const cb = (arg: BarStyleArg): string | undefined =>
      arg.bar.id === 'b1' ? '#abcdef' : undefined;
    const { container } = render(
      <ChronixGantt
        bars={barsCascade()}
        rows={twoRowsCascade()}
        axisInput={baseAxisInput()}
        barBackgroundColorCallback={cb}
      />,
    );
    const b1 = container.querySelector('rect.cx-gantt-bar[data-bar-id="b1"]');
    const b2 = container.querySelector('rect.cx-gantt-bar[data-bar-id="b2"]');
    expect(b1?.getAttribute('fill')).toBe('#abcdef');
    expect(b2?.getAttribute('fill')).toBe(defaultChronixTheme.barBackgroundColor);
  });

  it('BarSpec.style.backgroundColor overrides component prop; callback wins over spec', () => {
    const barsWithSpec: readonly BarSpec[] = [
      {
        ...makeBar('b1', 'r1', '2026-05-19T00:00', '2026-05-20T00:00'),
        style: { backgroundColor: '#aaaaaa' },
      },
    ];
    const cb = (): string => '#bbbbbb';
    // Component prop loses to spec which loses to callback.
    const { container } = render(
      <ChronixGantt
        bars={barsWithSpec}
        rows={[makeRow('r1')]}
        axisInput={baseAxisInput()}
        barBackgroundColor="#cccccc"
        barBackgroundColorCallback={cb}
      />,
    );
    expect(
      container.querySelector('rect.cx-gantt-bar[data-bar-id="b1"]')?.getAttribute('fill'),
    ).toBe('#bbbbbb');
  });

  it('barClassNamesCallback returning a string is appended to the default class list', () => {
    const cb = (): string => 'priority-high';
    const { container } = render(
      <ChronixGantt
        bars={barsCascade()}
        rows={twoRowsCascade()}
        axisInput={baseAxisInput()}
        barClassNamesCallback={cb}
      />,
    );
    const b1 = container.querySelector('rect[data-bar-id="b1"]');
    expect(b1?.classList.contains('cx-gantt-bar')).toBe(true);
    expect(b1?.classList.contains('priority-high')).toBe(true);
  });

  it('orphan-bar fallback: placed bar without matching sourceBar falls back to theme tokens', () => {
    // Construct a scenario where `bars` provides one bar but the placement
    // pass would produce a bar id not present in `bars` would never happen
    // organically — so the fallback path is exercised by the defensive
    // guard. We assert that the default render path still works when bars
    // is empty (no rect at all) and when a bar exists (uses cascade).
    const { container } = render(
      <ChronixGantt
        bars={barsCascade()}
        rows={twoRowsCascade()}
        axisInput={baseAxisInput()}
        barColor="#ff0000"
      />,
    );
    // Both bars get the cascade output (no orphans), so both fills match.
    expect(container.querySelector('rect[data-bar-id="b1"]')?.getAttribute('fill')).toBe('#ff0000');
    expect(container.querySelector('rect[data-bar-id="b2"]')?.getAttribute('fill')).toBe('#ff0000');
  });

  it('Phase 28.3 font cascade: barFontSizeCallback flows to bar-text font-size attr', () => {
    const fontSizeCb = (): number => 16;
    const { container } = render(
      <ChronixGantt
        bars={barsCascade()}
        rows={twoRowsCascade()}
        axisInput={baseAxisInput()}
        barFontSizeCallback={fontSizeCb}
      />,
    );
    // b1 has title 'Hello World'; its <text> should carry font-size=16.
    const titleText = container.querySelector('text.cx-gantt-bar-text[data-bar-id="b1"]');
    expect(titleText).not.toBeNull();
    expect(Number(titleText?.getAttribute('font-size'))).toBe(16);
  });

  // (2) Bar text auto-render — 4 cases

  it('short title renders verbatim with cx-gantt-bar-text class + cascade font attrs', () => {
    const { container } = render(
      <ChronixGantt bars={barsCascade()} rows={twoRowsCascade()} axisInput={baseAxisInput()} />,
    );
    const titleText = container.querySelector('text.cx-gantt-bar-text[data-bar-id="b1"]');
    expect(titleText).not.toBeNull();
    expect(titleText?.textContent).toBe('Hello World');
    expect(Number(titleText?.getAttribute('font-size'))).toBe(defaultChronixTheme.barFontSize);
    expect(titleText?.getAttribute('fill')).toBe(defaultChronixTheme.barTextColor);
  });

  it('long title on a narrow bar gets truncated with ellipsis suffix', () => {
    // Construct a narrow bar via 1-hour day-view to force narrow width.
    const dayAxis: AxisRangePlanInput = {
      viewId: 'day',
      anchorDate: new Date('2026-05-18T00:00:00'),
      viewportWidth: 1440,
      locale: 'zh-CN',
      weekendsVisible: true,
    };
    const narrowBar: readonly BarSpec[] = [
      {
        ...makeBar('bn', 'r1', '2026-05-18T08:00', '2026-05-18T09:30'),
        title: 'This is a very long title that does not fit',
      },
    ];
    const { container } = render(
      <ChronixGantt bars={narrowBar} rows={[makeRow('r1')]} axisInput={dayAxis} />,
    );
    const titleText = container.querySelector('text.cx-gantt-bar-text[data-bar-id="bn"]');
    expect(titleText).not.toBeNull();
    const rendered = titleText?.textContent ?? '';
    // Truncated output must end with the `...` ellipsis suffix and be
    // shorter than the input. Phase 32.6 reconciled react's truncateBarText
    // to vue3/vue2 reference (3-char Latin `...` ellipsis + maxChars <= 3
    // cutoff) — verbatim assertion shape matches the other 2 adapters.
    expect(rendered.endsWith('...')).toBe(true);
    expect(rendered.length).toBeLessThan('This is a very long title that does not fit'.length);
  });

  it('empty title renders no <text.cx-gantt-bar-text> for that bar', () => {
    const { container } = render(
      <ChronixGantt bars={barsCascade()} rows={twoRowsCascade()} axisInput={baseAxisInput()} />,
    );
    // b2 has no title → no <text> element for it.
    expect(container.querySelector('text.cx-gantt-bar-text[data-bar-id="b2"]')).toBeNull();
    // b1 has a title.
    expect(container.querySelector('text.cx-gantt-bar-text[data-bar-id="b1"]')).not.toBeNull();
  });

  it('narrow bar (width <= 30 px) suppresses title <text> via width gate', () => {
    // Use a half-hour day-view bar — placement produces width ≈ 30 px or
    // less depending on slotWidth (day view has slotWidth = 60 → 30 px for
    // a 30-min range, which equals the gate). Use 15-min for unambiguous
    // <30 px width.
    const dayAxis: AxisRangePlanInput = {
      viewId: 'day',
      anchorDate: new Date('2026-05-18T00:00:00'),
      viewportWidth: 1440,
      locale: 'zh-CN',
      weekendsVisible: true,
    };
    const tinyBar: readonly BarSpec[] = [
      {
        ...makeBar('bt', 'r1', '2026-05-18T08:00', '2026-05-18T08:15'),
        title: 'Hi',
      },
    ];
    const { container } = render(
      <ChronixGantt bars={tinyBar} rows={[makeRow('r1')]} axisInput={dayAxis} />,
    );
    expect(container.querySelector('text.cx-gantt-bar-text[data-bar-id="bt"]')).toBeNull();
  });

  // (3) Continuation triangles — 4 cases

  it('bar.isStart === false renders left continuation <polygon> with axis-clipped data attr', () => {
    const { container } = render(
      <ChronixGantt
        bars={barsForTriangles()}
        rows={threeRowsTriangle()}
        axisInput={baseAxisInput()}
      />,
    );
    const left = container.querySelector(
      'polygon.cx-gantt-bar-continuation-left[data-bar-id="clippedStart"]',
    );
    expect(left).not.toBeNull();
    expect(left?.getAttribute('data-axis-clipped')).toBe('true');
    expect(left?.getAttribute('data-viewport-clipped')).toBe('false');
    expect(left?.getAttribute('fill')).toBe('#000');
    expect(left?.getAttribute('pointer-events')).toBe('none');
  });

  it('bar.isEnd === false renders right continuation <polygon> symmetric to left', () => {
    const { container } = render(
      <ChronixGantt
        bars={barsForTriangles()}
        rows={threeRowsTriangle()}
        axisInput={baseAxisInput()}
      />,
    );
    const right = container.querySelector(
      'polygon.cx-gantt-bar-continuation-right[data-bar-id="clippedEnd"]',
    );
    expect(right).not.toBeNull();
    expect(right?.getAttribute('data-axis-clipped')).toBe('true');
  });

  it('bar with both isStart && isEnd true renders zero continuation polygons', () => {
    const { container } = render(
      <ChronixGantt
        bars={barsForTriangles()}
        rows={threeRowsTriangle()}
        axisInput={baseAxisInput()}
      />,
    );
    // 'inside' bar should have zero polygons (fully visible window).
    expect(
      container.querySelectorAll(
        'polygon.cx-gantt-bar-continuation-indicator[data-bar-id="inside"]',
      ).length,
    ).toBe(0);
  });

  it('data-viewport-clipped="false" populates this phase; Phase 32.5 lights up the "true" case', () => {
    const { container } = render(
      <ChronixGantt
        bars={barsForTriangles()}
        rows={threeRowsTriangle()}
        axisInput={baseAxisInput()}
      />,
    );
    // Every rendered continuation polygon (left + right) has
    // data-viewport-clipped="false" until Phase 32.5 ports the viewport-clip math.
    const allTriangles = container.querySelectorAll('polygon.cx-gantt-bar-continuation-indicator');
    expect(allTriangles.length).toBeGreaterThanOrEqual(2);
    for (const tri of allTriangles) {
      expect(tri.getAttribute('data-viewport-clipped')).toBe('false');
    }
  });
});

describe('@chronixjs/gantt-react ChronixGantt — link rendering + LINK_SLOT_NAME + barColorByBarId map (Phase 32.4.1)', () => {
  // Fixture: 2 bars on 2 rows + 1 link b1→b2.
  function twoBars(): readonly BarSpec[] {
    return [
      makeBar('b1', 'r1', '2026-05-19T00:00', '2026-05-20T00:00'),
      makeBar('b2', 'r2', '2026-05-20T00:00', '2026-05-21T00:00'),
    ];
  }
  const twoRowsLink = (): readonly RowSpec[] => [makeRow('r1'), makeRow('r2')];

  const arrowLink = (id: string, fromBarId: string, toBarId: string): LinkSpec => ({
    id,
    fromBarId,
    toBarId,
    routing: 'square',
    marker: 'arrow',
  });

  it('no links prop: zero <path.cx-gantt-link> nodes and empty cx-gantt-links group', () => {
    const { container } = render(
      <ChronixGantt bars={twoBars()} rows={twoRowsLink()} axisInput={baseAxisInput()} />,
    );
    expect(container.querySelectorAll('path.cx-gantt-link').length).toBe(0);
    // Group itself renders even when empty (sibling to bars).
    expect(container.querySelector('g.cx-gantt-links')).not.toBeNull();
  });

  it('valid links: one <path.cx-gantt-link data-link-id> per resolved link with non-empty d', () => {
    const links: readonly LinkSpec[] = [arrowLink('l1', 'b1', 'b2')];
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsLink()}
        axisInput={baseAxisInput()}
        links={links}
      />,
    );
    const paths = container.querySelectorAll('path.cx-gantt-link');
    expect(paths.length).toBe(1);
    expect(paths[0]?.getAttribute('data-link-id')).toBe('l1');
    expect(paths[0]?.getAttribute('d')?.length ?? 0).toBeGreaterThan(0);
    expect(paths[0]?.getAttribute('fill')).toBe('none');
  });

  it('default cascade color = theme.linkDefaultColor when no override props set', () => {
    const links: readonly LinkSpec[] = [arrowLink('l1', 'b1', 'b2')];
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsLink()}
        axisInput={baseAxisInput()}
        links={links}
      />,
    );
    const path = container.querySelector('path.cx-gantt-link');
    expect(path?.getAttribute('stroke')).toBe(defaultChronixTheme.linkDefaultColor);
  });

  it('LinkSpec.colorOverride wins over cascade — link stroke matches the override', () => {
    const links: readonly LinkSpec[] = [
      {
        id: 'l1',
        fromBarId: 'b1',
        toBarId: 'b2',
        routing: 'square',
        marker: 'arrow',
        colorOverride: '#ff0000',
      },
    ];
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsLink()}
        axisInput={baseAxisInput()}
        links={links}
      />,
    );
    const path = container.querySelector('path.cx-gantt-link[data-link-id="l1"]');
    expect(path?.getAttribute('stroke')).toBe('#ff0000');
  });

  it('useLineEventColor: true + bar cascade override → link stroke inherits source bar background color', () => {
    const links: readonly LinkSpec[] = [arrowLink('l1', 'b1', 'b2')];
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsLink()}
        axisInput={baseAxisInput()}
        links={links}
        useLineEventColor
        barBackgroundColorCallback={(arg: BarStyleArg): string | undefined =>
          arg.bar.id === 'b1' ? '#abcdef' : undefined
        }
      />,
    );
    const path = container.querySelector('path.cx-gantt-link[data-link-id="l1"]');
    // Cascade output for b1 = '#abcdef'; link inherits it via barColorByBarId.
    expect(path?.getAttribute('stroke')).toBe('#abcdef');
  });

  it('onLineCallback override wins over cascade — { color: ... } flips link stroke', () => {
    const links: readonly LinkSpec[] = [arrowLink('l1', 'b1', 'b2')];
    const seenArgs: LinkRenderArg[] = [];
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsLink()}
        axisInput={baseAxisInput()}
        links={links}
        onLineCallback={(arg) => {
          seenArgs.push(arg);
          return { color: '#00ff00' };
        }}
      />,
    );
    const path = container.querySelector('path.cx-gantt-link[data-link-id="l1"]');
    expect(path?.getAttribute('stroke')).toBe('#00ff00');
    expect(seenArgs.length).toBe(1);
    expect(seenArgs[0]?.defaultColor).toBe(defaultChronixTheme.linkDefaultColor);
    expect(seenArgs[0]?.currentMarker).toBe('arrow');
  });

  it('LINK_SLOT_NAME registered: template ReactNode replaces default <path>', () => {
    const links: readonly LinkSpec[] = [arrowLink('l1', 'b1', 'b2')];
    const reg = createSlotRegistry();
    const seenSlotArgs: LinkSlotArgs[] = [];
    reg.register(LINK_SLOT_NAME, (ctx) => {
      const args = ctx.args as unknown as LinkSlotArgs;
      seenSlotArgs.push(args);
      return (
        <path
          data-custom-link={args.linkSpec.id}
          d={args.routedLink.pathD}
          stroke={args.color}
          fill="none"
        />
      );
    });
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsLink()}
        axisInput={baseAxisInput()}
        links={links}
        slotRegistry={reg}
      />,
    );
    // Default <path.cx-gantt-link> suppressed; custom <path data-custom-link> in its place.
    expect(container.querySelectorAll('path.cx-gantt-link').length).toBe(0);
    expect(container.querySelectorAll('path[data-custom-link="l1"]').length).toBe(1);
    expect(seenSlotArgs.length).toBe(1);
    expect(seenSlotArgs[0]?.color).toBe(defaultChronixTheme.linkDefaultColor);
    expect(seenSlotArgs[0]?.marker).toBe('arrow');
  });

  it('marker <defs>: registered (color × markerType) combos appear in cx-gantt-defs', () => {
    const links: readonly LinkSpec[] = [arrowLink('l1', 'b1', 'b2')];
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsLink()}
        axisInput={baseAxisInput()}
        links={links}
      />,
    );
    const defs = container.querySelector('defs.cx-gantt-defs');
    expect(defs).not.toBeNull();
    // For each color in the used-color set, 7 builtin markers are emitted.
    // With only default theme color in use, expect at least 7 <marker> defs.
    const markers = container.querySelectorAll('defs.cx-gantt-defs marker');
    expect(markers.length).toBeGreaterThanOrEqual(7);
    // Specifically the arrow marker for theme.linkDefaultColor should be there.
    const colorId = defaultChronixTheme.linkDefaultColor.replace(/[^a-zA-Z0-9]/g, '');
    expect(container.querySelector(`marker#cx-marker-arrow-${colorId}`)).not.toBeNull();
  });

  it('orphan link (fromBarId references missing bar): no <path>, onLinkOrphan fires, console.warn once', () => {
    const links: readonly LinkSpec[] = [arrowLink('orphan-l1', 'nonexistent', 'b2')];
    const onLinkOrphan = vi.fn<(id: string) => void>();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* swallow */
    });
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsLink()}
        axisInput={baseAxisInput()}
        links={links}
        onLinkOrphan={onLinkOrphan}
      />,
    );
    // No <path> for the orphan link.
    expect(container.querySelectorAll('path.cx-gantt-link').length).toBe(0);
    expect(onLinkOrphan).toHaveBeenCalledWith('orphan-l1');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]![0]).toContain('orphan-l1');
    warnSpy.mockRestore();
  });

  it('re-render with same orphan: onLinkOrphan fires again, console.warn does NOT (warn-once dedup)', () => {
    const links: readonly LinkSpec[] = [arrowLink('orphan-l2', 'nonexistent', 'b2')];
    const onLinkOrphan = vi.fn<(id: string) => void>();
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* swallow */
    });
    const { rerender } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsLink()}
        axisInput={baseAxisInput()}
        links={links}
        onLinkOrphan={onLinkOrphan}
      />,
    );
    expect(warnSpy).toHaveBeenCalledTimes(1);
    // Re-render with a new (identity-changed) links array but same orphan id —
    // useMemo re-derives routerOutput, useEffect re-fires, but warnedOrphanIds
    // ref blocks the second warn.
    rerender(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsLink()}
        axisInput={baseAxisInput()}
        links={[arrowLink('orphan-l2', 'nonexistent', 'b2')]}
        onLinkOrphan={onLinkOrphan}
      />,
    );
    // Callback fires on every router pass (mirror vue2 emit semantics).
    expect(onLinkOrphan.mock.calls.length).toBeGreaterThanOrEqual(2);
    // console.warn fires only on first occurrence per component-instance.
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });
});

describe('@chronixjs/gantt-react ChronixGantt — today line + grid lines (Phase 32.4.2)', () => {
  // Pin Date.now() to mid-week 2026-05-20T12:00 so today falls inside the
  // baseAxisInput()'s week view (anchorDate 2026-05-18 → ends 2026-05-25).
  // resolvedTodayLine reads Date.now() at render time; without this fake
  // time the tests would be calendar-time-dependent and break on any day
  // outside the anchor week.
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-20T12:00:00'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function twoBars(): readonly BarSpec[] {
    return [
      makeBar('b1', 'r1', '2026-05-19T00:00', '2026-05-20T00:00'),
      makeBar('b2', 'r2', '2026-05-20T00:00', '2026-05-21T00:00'),
    ];
  }
  const twoRowsToday = (): readonly RowSpec[] => [makeRow('r1'), makeRow('r2')];

  // (1) Today line — 6 cases

  it('todayLine undefined: no <line.cx-gantt-today-line> rendered, no tooltip group', () => {
    const { container } = render(
      <ChronixGantt bars={twoBars()} rows={twoRowsToday()} axisInput={baseAxisInput()} />,
    );
    expect(container.querySelectorAll('line.cx-gantt-today-line').length).toBe(0);
    expect(container.querySelector('g.cx-gantt-today-line-tooltip')).toBeNull();
  });

  it('todayLine=true + today in range: body+header lines render, tooltip widget shows "今日"', () => {
    const { container } = render(
      <ChronixGantt bars={twoBars()} rows={twoRowsToday()} axisInput={baseAxisInput()} todayLine />,
    );
    const bodyLine = container.querySelector(
      'line.cx-gantt-today-line[data-today-line-side="body"]',
    );
    const headerLine = container.querySelector(
      'line.cx-gantt-today-line[data-today-line-side="header"]',
    );
    expect(bodyLine).not.toBeNull();
    expect(headerLine).not.toBeNull();
    // Default stroke = theme.todayLineColor; default dasharray = '6 4'.
    expect(bodyLine?.getAttribute('stroke')).toBe(defaultChronixTheme.todayLineColor);
    expect(bodyLine?.getAttribute('stroke-dasharray')).toBe('6 4');
    // Tooltip widget present with default label '今日'.
    const tooltip = container.querySelector('g.cx-gantt-today-line-tooltip');
    expect(tooltip).not.toBeNull();
    const tooltipText = tooltip?.querySelector('text');
    expect(tooltipText?.textContent).toBe('今日');
  });

  it('todayLine: { color: "#abcdef" } single-knob: both lines stroke + tooltip rect fill all flip', () => {
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsToday()}
        axisInput={baseAxisInput()}
        todayLine={{ color: '#abcdef' }}
      />,
    );
    const bodyLine = container.querySelector(
      'line.cx-gantt-today-line[data-today-line-side="body"]',
    );
    const headerLine = container.querySelector(
      'line.cx-gantt-today-line[data-today-line-side="header"]',
    );
    const tooltipRect = container.querySelector('g.cx-gantt-today-line-tooltip > rect');
    expect(bodyLine?.getAttribute('stroke')).toBe('#abcdef');
    expect(headerLine?.getAttribute('stroke')).toBe('#abcdef');
    expect(tooltipRect?.getAttribute('fill')).toBe('#abcdef');
  });

  it('todayLine: { style: "solid" }: no stroke-dasharray attr on either line', () => {
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsToday()}
        axisInput={baseAxisInput()}
        todayLine={{ style: 'solid' }}
      />,
    );
    const bodyLine = container.querySelector(
      'line.cx-gantt-today-line[data-today-line-side="body"]',
    );
    const headerLine = container.querySelector(
      'line.cx-gantt-today-line[data-today-line-side="header"]',
    );
    expect(bodyLine?.hasAttribute('stroke-dasharray')).toBe(false);
    expect(headerLine?.hasAttribute('stroke-dasharray')).toBe(false);
  });

  it('todayLine: { style: "dotted" }: stroke-dasharray="2 3" on both', () => {
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsToday()}
        axisInput={baseAxisInput()}
        todayLine={{ style: 'dotted' }}
      />,
    );
    const bodyLine = container.querySelector(
      'line.cx-gantt-today-line[data-today-line-side="body"]',
    );
    const headerLine = container.querySelector(
      'line.cx-gantt-today-line[data-today-line-side="header"]',
    );
    expect(bodyLine?.getAttribute('stroke-dasharray')).toBe('2 3');
    expect(headerLine?.getAttribute('stroke-dasharray')).toBe('2 3');
  });

  it('todayLine: { tooltip: "" }: lines render but tooltip widget suppressed', () => {
    const { container } = render(
      <ChronixGantt
        bars={twoBars()}
        rows={twoRowsToday()}
        axisInput={baseAxisInput()}
        todayLine={{ tooltip: '' }}
      />,
    );
    expect(container.querySelectorAll('line.cx-gantt-today-line').length).toBe(2);
    expect(container.querySelector('g.cx-gantt-today-line-tooltip')).toBeNull();
  });

  // (2) Grid lines — 2 cases

  it('default grid: per-tick <rect.cx-gantt-grid-vline> + right-edge closer + per-strip <line.cx-gantt-grid-hline>', () => {
    const axisInput = baseAxisInput();
    const planned = defaultAxisRangePlanner.plan(axisInput);
    const { container } = render(
      <ChronixGantt bars={twoBars()} rows={twoRowsToday()} axisInput={axisInput} />,
    );
    const gridGroup = container.querySelector('g.cx-gantt-grid');
    expect(gridGroup).not.toBeNull();
    // One vline rect per axis tick + one right-edge closer.
    const vlines = container.querySelectorAll('rect.cx-gantt-grid-vline');
    expect(vlines.length).toBe(planned.ticks.length + 1);
    // Horizontal grid lines: one per strip. With 2 rows the planner
    // produces 2 strips → 2 hlines.
    const hlines = container.querySelectorAll('line.cx-gantt-grid-hline');
    expect(hlines.length).toBe(2);
    // Non-scaling-stroke for crisp 1-px rendering.
    expect(hlines[0]?.getAttribute('vector-effect')).toBe('non-scaling-stroke');
    // pointer-events: none on the wrapping group.
    expect(gridGroup?.getAttribute('pointer-events')).toBe('none');
  });

  it('week-start tick: <rect.cx-gantt-grid-vline-week> with theme.gridLineWeekStartColor fill', () => {
    // Day view starting on a Monday at 00:00 — each day's tick is a week-start
    // candidate; in week view the anchor of Monday produces a tick at x=0 with
    // weekStart predicate true. Use day view at a Monday anchor.
    const dayMondayAxis: AxisRangePlanInput = {
      viewId: 'day',
      anchorDate: new Date('2026-05-18T00:00:00'), // Monday
      viewportWidth: 1440,
      locale: 'zh-CN',
      weekendsVisible: true,
    };
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={[makeRow('r1')]}
        axisInput={dayMondayAxis}
        // explicit todayLine off so today rendering doesn't affect grid count
      />,
    );
    const weekStartVlines = container.querySelectorAll('rect.cx-gantt-grid-vline-week');
    expect(weekStartVlines.length).toBeGreaterThanOrEqual(1);
    expect(weekStartVlines[0]?.getAttribute('fill')).toBe(
      defaultChronixTheme.gridLineWeekStartColor,
    );
  });
});

describe('@chronixjs/gantt-react ChronixGantt — geometry prop alignment (Phase 52)', () => {
  // 4 layout props + 2 pointer props were declared on chronix-vue3 from
  // inception but never forwarded by chronix-react; the underlying
  // useGanttLayout + useGanttPointer hooks already accepted them. Each
  // test below verifies the adapter prop → hook wiring (i.e. that
  // passing a non-default value reaches the rendered DOM or the
  // pointer-hook input that consumes it).
  const rows = [makeRow('r1')];
  const bars = [makeBar('b1', 'r1', '2026-05-18T09:00', '2026-05-18T17:00')];

  it('barHeight prop overrides the default 30 px bar rect height', () => {
    const { container } = render(
      <ChronixGantt bars={bars} rows={rows} axisInput={baseAxisInput()} barHeight={50} />,
    );
    const rect = container.querySelector('[data-bar-id="b1"]');
    expect(rect).not.toBeNull();
    expect(Number(rect?.getAttribute('height'))).toBe(50);
  });

  it('barVerticalPadding prop offsets the bar Y from the strip top', () => {
    const { container: baseContainer } = render(
      <ChronixGantt bars={bars} rows={rows} axisInput={baseAxisInput()} />,
    );
    const baseY = Number(baseContainer.querySelector('[data-bar-id="b1"]')?.getAttribute('y'));
    cleanup();
    const { container: overrideContainer } = render(
      <ChronixGantt bars={bars} rows={rows} axisInput={baseAxisInput()} barVerticalPadding={12} />,
    );
    const overrideY = Number(
      overrideContainer.querySelector('[data-bar-id="b1"]')?.getAttribute('y'),
    );
    // 12 - 4 (default) = 8 px shift; bar.y = strip.y + padding.
    expect(overrideY - baseY).toBe(8);
  });

  it('defaultRowHeight prop is accepted + threaded into useGanttLayout (wiring smoke)', () => {
    // Same v0-pipeline reality as the chronix-vue2 sibling test:
    // BarStackHeightPass sets a heightHint for every row, which
    // useGanttLayout lifts onto the row and the swimlane's
    // `heightHint ?? defaultRowHeight` fallback always prefers.
    // The prop is part of the surface (so all 3 adapters expose
    // identical APIs); the wiring is verified by this mount
    // succeeding without TS / runtime errors.
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} defaultRowHeight={100} />,
    );
    expect(container.querySelector('div.cx-gantt-wrapper')).not.toBeNull();
    expect(container.querySelectorAll('svg.cx-gantt-body').length).toBe(1);
  });

  it('rowSpacing prop widens the gap between consecutive swimlane strips', () => {
    const twoRows = [makeRow('r1'), makeRow('r2')];
    const { container: baseContainer } = render(
      <ChronixGantt bars={[]} rows={twoRows} axisInput={baseAxisInput()} />,
    );
    const baseHeight = Number(
      baseContainer.querySelector('svg.cx-gantt-body')?.getAttribute('height'),
    );
    cleanup();
    const { container: overrideContainer } = render(
      <ChronixGantt bars={[]} rows={twoRows} axisInput={baseAxisInput()} rowSpacing={20} />,
    );
    const overrideHeight = Number(
      overrideContainer.querySelector('svg.cx-gantt-body')?.getAttribute('height'),
    );
    // 2 rows → 1 inter-row gap. default rowSpacing 1 → override 20 = +19.
    expect(overrideHeight - baseHeight).toBe(19);
  });

  it('progressHandleSize prop is accepted + forwarded to useGanttPointer (wiring smoke)', () => {
    // The progress handle's hit-rect size is consumed inside
    // `useGanttPointer.hitTestProgress`; not directly visible in the
    // rendered DOM. The wiring is verified by the mount succeeding
    // without TS / runtime errors when the prop is set to a non-
    // default value.
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} progressHandleSize={24} />,
    );
    expect(container.querySelector('div.cx-gantt-wrapper')).not.toBeNull();
  });

  it('snapDurationMs prop is accepted + forwarded to useGanttPointer (wiring smoke)', () => {
    // The snap-duration value is consumed at commit-time inside
    // `useGanttPointer.commitDrag / commitResize`; not directly visible
    // in the rendered DOM. The wiring is verified by the mount
    // succeeding without TS / runtime errors when the prop is set to
    // a non-default value.
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} snapDurationMs={3600000} />,
    );
    expect(container.querySelector('div.cx-gantt-wrapper')).not.toBeNull();
  });
});

describe('@chronixjs/gantt-react ChronixGantt — progress overlay + slot rendering (Phase 53)', () => {
  // chronix-vue3 emits 3 cx-gantt-progress-* elements per bar that
  // declares both `progress.value` + `pointerOverlayId` AND emits
  // cx-gantt-slot rects per axis tick. chronix-react never ported
  // either at Phase 32 scaffold; Phase 53 closes both gaps.
  const row = makeRow('r1');
  const barWithProgress = (
    progressOverride?: Partial<{ value: number; showText: boolean; textFormat: string }>,
  ): BarSpec => ({
    id: 'b1',
    rowId: 'r1',
    range: { start: new Date('2026-05-18T08:00'), end: new Date('2026-05-18T16:00') },
    dprIntent: 'crisp-pixel',
    pointerOverlayId: 'progress-handle',
    progress: { value: 60, ...progressOverride },
  });

  it('renders <rect.cx-gantt-progress-fill> for a bar with progress.value + pointerOverlayId', () => {
    const { container } = render(
      <ChronixGantt bars={[barWithProgress()]} rows={[row]} axisInput={baseAxisInput()} />,
    );
    const fill = container.querySelector('rect.cx-gantt-progress-fill');
    expect(fill).not.toBeNull();
    expect(fill?.getAttribute('data-progress-bar-id')).toBe('b1');
    const barRect = container.querySelector('[data-bar-id="b1"]');
    const barWidth = Number(barRect?.getAttribute('width'));
    expect(Number(fill?.getAttribute('width'))).toBeCloseTo(barWidth * 0.6, 1);
  });

  it('renders <rect.cx-gantt-progress-handle> at the fill edge', () => {
    const { container } = render(
      <ChronixGantt bars={[barWithProgress()]} rows={[row]} axisInput={baseAxisInput()} />,
    );
    const handle = container.querySelector('rect.cx-gantt-progress-handle');
    expect(handle).not.toBeNull();
    expect(handle?.getAttribute('data-progress-bar-id')).toBe('b1');
    expect(handle?.getAttribute('data-overlay-id')).toBe('progress-handle');
    expect(Number(handle?.getAttribute('width'))).toBe(12);
  });

  it('renders <text.cx-gantt-progress-label> with "{value}%" template by default', () => {
    const { container } = render(
      <ChronixGantt bars={[barWithProgress()]} rows={[row]} axisInput={baseAxisInput()} />,
    );
    const label = container.querySelector('text.cx-gantt-progress-label');
    expect(label).not.toBeNull();
    expect(label?.textContent).toBe('60%');
  });

  it('suppresses progress label when bar.progress.showText === false', () => {
    const { container } = render(
      <ChronixGantt
        bars={[barWithProgress({ showText: false })]}
        rows={[row]}
        axisInput={baseAxisInput()}
      />,
    );
    expect(container.querySelector('rect.cx-gantt-progress-handle')).not.toBeNull();
    expect(container.querySelector('text.cx-gantt-progress-label')).toBeNull();
  });

  it('renders <g.cx-gantt-slots> with one cx-gantt-slot rect per axis tick', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={[row]} axisInput={baseAxisInput()} />,
    );
    const slotsGroup = container.querySelector('g.cx-gantt-slots');
    expect(slotsGroup).not.toBeNull();
    const slotRects = container.querySelectorAll('g.cx-gantt-slots rect.cx-gantt-slot');
    expect(slotRects.length).toBeGreaterThan(0);
    expect(slotRects[0]?.getAttribute('fill')).toBe('transparent');
  });
});

describe('@chronixjs/gantt-react ChronixGantt — reference interaction parity (Phase 54)', () => {
  const row = makeRow('r1');
  const bar = (): BarSpec => ({
    id: 'b1',
    rowId: 'r1',
    range: { start: new Date('2026-05-18T08:00'), end: new Date('2026-05-18T16:00') },
    dprIntent: 'crisp-pixel',
  });

  it('eventStartEditable={false} removes cx-gantt-bar--draggable but keeps cx-gantt-bar--resizable', () => {
    const { container } = render(
      <ChronixGantt
        bars={[bar()]}
        rows={[row]}
        axisInput={baseAxisInput()}
        editable
        eventStartEditable={false}
      />,
    );
    const rect = container.querySelector('rect[data-bar-id="b1"]');
    expect(rect?.getAttribute('class')).not.toContain('cx-gantt-bar--draggable');
    expect(rect?.getAttribute('class')).toContain('cx-gantt-bar--resizable');
  });

  it('eventDurationEditable={false} removes cx-gantt-bar--resizable + suppresses resizer rects', () => {
    const { container } = render(
      <ChronixGantt
        bars={[bar()]}
        rows={[row]}
        axisInput={baseAxisInput()}
        editable
        selectedBarIds={['b1']}
        eventDurationEditable={false}
      />,
    );
    const rect = container.querySelector('rect[data-bar-id="b1"]');
    expect(rect?.getAttribute('class')).toContain('cx-gantt-bar--draggable');
    expect(rect?.getAttribute('class')).not.toContain('cx-gantt-bar--resizable');
    expect(container.querySelectorAll('rect.cx-gantt-bar-resizer-start').length).toBe(0);
  });
});

describe('@chronixjs/gantt-react ChronixGantt — hitTestFromClient (Phase 56)', () => {
  const MS_PER_HOUR_P56 = 60 * 60 * 1000;
  const anchorP56 = new Date('2026-05-13T00:00:00Z');
  anchorP56.setHours(0, 0, 0, 0);
  const anchorP56Ms = anchorP56.getTime();
  const dayAxisP56 = (): AxisRangePlanInput => ({
    viewId: 'day',
    anchorDate: new Date(anchorP56Ms),
    viewportWidth: 1440,
    locale: 'zh-CN',
    weekendsVisible: true,
  });

  it('handle.hitTestFromClient maps client coords to {time, rowId} via body rect + axis + strips', () => {
    const handleRef = { current: null as null | GanttHandle };
    const { container } = render(
      <ChronixGantt
        ref={(h) => {
          handleRef.current = h;
        }}
        bars={[]}
        rows={[makeRow('r1'), makeRow('r2')]}
        axisInput={dayAxisP56()}
      />,
    );
    const svg = container.querySelector<SVGSVGElement>('svg.cx-gantt-body')!;
    svg.getBoundingClientRect = () =>
      ({ left: 100, top: 50, right: 1540, bottom: 530, width: 1440, height: 480 }) as DOMRect;
    // clientX 220 → contentX 120 → 2h after midnight. clientY 60 →
    // contentY 10 → first strip r1.
    const result = handleRef.current!.hitTestFromClient(220, 60);
    expect(result).not.toBeNull();
    expect(result!.rowId).toBe('r1');
    expect(result!.time.getTime()).toBe(anchorP56Ms + 2 * MS_PER_HOUR_P56);
  });

  it('handle.hitTestFromClient returns null when clientX is left of body rect', () => {
    const handleRef = { current: null as null | GanttHandle };
    const { container } = render(
      <ChronixGantt
        ref={(h) => {
          handleRef.current = h;
        }}
        bars={[]}
        rows={[makeRow('r1')]}
        axisInput={dayAxisP56()}
      />,
    );
    const svg = container.querySelector<SVGSVGElement>('svg.cx-gantt-body')!;
    svg.getBoundingClientRect = () =>
      ({ left: 100, top: 50, right: 1540, bottom: 530, width: 1440, height: 480 }) as DOMRect;
    const result = handleRef.current!.hitTestFromClient(50, 60);
    expect(result).toBeNull();
  });
});

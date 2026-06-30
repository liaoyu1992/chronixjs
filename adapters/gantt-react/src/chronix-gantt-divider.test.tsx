import { type AxisRangePlanInput, type ColumnSpec, type RowSpec } from '@chronixjs/gantt';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

afterEach(() => {
  cleanup();
});

const baseAxisInput = (): AxisRangePlanInput => ({
  viewId: 'week',
  anchorDate: new Date('2026-05-18T00:00:00'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
});

const rows: readonly RowSpec[] = [
  { id: 'r1', columns: { region: '海口', base: '海口基地', name: '车间 A' } },
  { id: 'r2', columns: { region: '海口', base: '海口基地', name: '车间 B' } },
];

const columns: readonly ColumnSpec[] = [
  { key: 'region', label: '地区', width: 60, group: true },
  { key: 'base', label: '基地', width: 100, group: true },
  { key: 'name', label: '车间', width: 80 },
];

function stubWrapperWidth(container: HTMLElement, width: number): void {
  const wrapperEl = container.querySelector<HTMLDivElement>('div.cx-gantt-wrapper');
  if (wrapperEl === null) throw new Error('cx-gantt-wrapper not found in test container');
  Object.defineProperty(wrapperEl, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ width, height: 400, top: 0, left: 0, right: width, bottom: 400 }),
  });
}

describe('<ChronixGantt> sidebar-divider drag ', () => {
  it('renders cx-gantt-sidebar-divider when sidebar is enabled', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} columns={columns} />,
    );
    expect(container.querySelector('div.cx-gantt-sidebar-divider')).not.toBeNull();
  });

  it('divider sits at gridColumn 2 spanning grid rows 1-3 with col-resize cursor', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} columns={columns} />,
    );
    const divider = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-divider')!;
    expect(divider.style.gridColumn).toBe('2');
    expect(divider.style.gridRow).toBe('1 / 3');
    expect(divider.style.cursor).toBe('col-resize');
    expect(divider.style.touchAction).toBe('none');
  });

  it('divider has data-cx-divider="sidebar" attribute', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} columns={columns} />,
    );
    const divider = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-divider')!;
    expect(divider.getAttribute('data-cx-divider')).toBe('sidebar');
  });

  it('no-sidebar mode renders no divider', () => {
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={[{ id: 'r1', columns: { name: 'r1' } }]}
        axisInput={baseAxisInput()}
      />,
    );
    expect(container.querySelector('div.cx-gantt-sidebar-divider')).toBeNull();
  });

  it('pointerdown + pointermove drags the sidebar wider — wrapper grid-template-columns updates', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} columns={columns} />,
    );
    stubWrapperWidth(container, 800);
    const divider = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-divider')!;
    const wrapperEl = container.querySelector<HTMLDivElement>('div.cx-gantt-wrapper')!;
    act(() => {
      fireEvent.pointerDown(divider, { clientX: 240, button: 0, pointerId: 1 });
      fireEvent.pointerMove(divider, { clientX: 320, button: 0, pointerId: 1 });
    });
    expect(wrapperEl.style.gridTemplateColumns).toBe('320px 4px auto');
  });

  it('pointermove clamps to MIN_SIDEBAR_AREA_WIDTH (40) when proposed is below floor', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} columns={columns} />,
    );
    stubWrapperWidth(container, 800);
    const divider = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-divider')!;
    const wrapperEl = container.querySelector<HTMLDivElement>('div.cx-gantt-wrapper')!;
    act(() => {
      fireEvent.pointerDown(divider, { clientX: 240, button: 0, pointerId: 1 });
      fireEvent.pointerMove(divider, { clientX: -500, button: 0, pointerId: 1 });
    });
    expect(wrapperEl.style.gridTemplateColumns).toBe('40px 4px auto');
  });

  it('pointermove clamps to (wrapperWidth - MIN) when proposed exceeds ceiling', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} columns={columns} />,
    );
    stubWrapperWidth(container, 500);
    const divider = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-divider')!;
    const wrapperEl = container.querySelector<HTMLDivElement>('div.cx-gantt-wrapper')!;
    act(() => {
      fireEvent.pointerDown(divider, { clientX: 240, button: 0, pointerId: 1 });
      fireEvent.pointerMove(divider, { clientX: 9999, button: 0, pointerId: 1 });
    });
    expect(wrapperEl.style.gridTemplateColumns).toBe('460px 4px auto');
  });

  it('pointermove without prior pointerdown is a no-op', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} columns={columns} />,
    );
    const divider = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-divider')!;
    const wrapperEl = container.querySelector<HTMLDivElement>('div.cx-gantt-wrapper')!;
    act(() => {
      fireEvent.pointerMove(divider, { clientX: 600, button: 0, pointerId: 1 });
    });
    expect(wrapperEl.style.gridTemplateColumns).toBe('240px 4px auto');
  });

  it('pointerup clears drag-snapshot but preserves override', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} columns={columns} />,
    );
    stubWrapperWidth(container, 800);
    const divider = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-divider')!;
    const wrapperEl = container.querySelector<HTMLDivElement>('div.cx-gantt-wrapper')!;
    act(() => {
      fireEvent.pointerDown(divider, { clientX: 240, button: 0, pointerId: 1 });
      fireEvent.pointerMove(divider, { clientX: 320, button: 0, pointerId: 1 });
      fireEvent.pointerUp(divider, { clientX: 320, button: 0, pointerId: 1 });
    });
    expect(wrapperEl.style.gridTemplateColumns).toBe('320px 4px auto');
    // Subsequent pointermove without a new pointerdown is a no-op.
    act(() => {
      fireEvent.pointerMove(divider, { clientX: 600, button: 0, pointerId: 1 });
    });
    expect(wrapperEl.style.gridTemplateColumns).toBe('320px 4px auto');
  });

  it('pointercancel preserves the in-flight override + clears drag-snapshot', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} columns={columns} />,
    );
    stubWrapperWidth(container, 800);
    const divider = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-divider')!;
    const wrapperEl = container.querySelector<HTMLDivElement>('div.cx-gantt-wrapper')!;
    act(() => {
      fireEvent.pointerDown(divider, { clientX: 240, button: 0, pointerId: 1 });
      fireEvent.pointerMove(divider, { clientX: 300, button: 0, pointerId: 1 });
      fireEvent.pointerCancel(divider, { clientX: 300, button: 0, pointerId: 1 });
    });
    expect(wrapperEl.style.gridTemplateColumns).toBe('300px 4px auto');
  });

  it('non-left mouse button (right click) does NOT initiate drag', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} columns={columns} />,
    );
    stubWrapperWidth(container, 800);
    const divider = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-divider')!;
    const wrapperEl = container.querySelector<HTMLDivElement>('div.cx-gantt-wrapper')!;
    act(() => {
      fireEvent.pointerDown(divider, { clientX: 240, button: 2, pointerId: 1 });
      fireEvent.pointerMove(divider, { clientX: 320, button: 2, pointerId: 1 });
    });
    expect(wrapperEl.style.gridTemplateColumns).toBe('240px 4px auto');
  });

  it('sidebar <col> widths stay fixed during drag (columns do not scale)', () => {
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput()} columns={columns} />,
    );
    stubWrapperWidth(container, 800);
    const divider = container.querySelector<HTMLDivElement>('div.cx-gantt-sidebar-divider')!;
    const wrapperEl = container.querySelector<HTMLElement>('div.cx-gantt-wrapper')!;
    // Drag from base 240 to 480 (wider). Columns keep their declared
    // widths (60/100/80); the table now fills the pane (`width: 100%`)
    // so widening leaves no empty sidebar-background gap, while its
    // `minWidth` holds the column sum (240px) so narrowing still
    // overflows + scrolls.
    act(() => {
      fireEvent.pointerDown(divider, { clientX: 240, button: 0, pointerId: 1 });
      fireEvent.pointerMove(divider, { clientX: 480, button: 0, pointerId: 1 });
    });
    const cols = container.querySelectorAll<HTMLTableColElement>('div.cx-gantt-sidebar-body col');
    expect(cols[0]!.style.width).toBe('60px');
    expect(cols[1]!.style.width).toBe('100px');
    expect(cols[2]!.style.width).toBe('80px');
    // Table fills the pane (width:100%, no minWidth).
    const bodyTable = container.querySelector<HTMLElement>('div.cx-gantt-sidebar-body table')!;
    expect(bodyTable.style.width).toBe('100%');
    expect(bodyTable.style.minWidth).toBe('');
    // The grid track (pane width) follows the drag → wider pane.
    expect(wrapperEl.style.gridTemplateColumns).toBe('480px 4px auto');
  });
});

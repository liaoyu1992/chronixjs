import { type AxisRangePlanInput, type BarSpec, type RowSpec } from '@chronixjs/gantt';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

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

describe('@chronixjs/gantt-react ChronixGantt — dual-scrollport ', () => {
  const sampleBars = (): readonly BarSpec[] => [
    makeBar('b1', 'r1', '2026-05-19T00:00', '2026-05-20T00:00'),
  ];
  const sampleRows = (): readonly RowSpec[] => [makeRow('r1')];

  it('wrapper has CSS grid display + auto rows when maxBodyHeight is undefined', () => {
    const { container } = render(
      <ChronixGantt bars={sampleBars()} rows={sampleRows()} axisInput={baseAxisInput()} />,
    );
    const wrapper = container.querySelector<HTMLDivElement>('div.cx-gantt-wrapper')!;
    expect(wrapper.style.display).toBe('grid');
    const pane = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-pane')!;
    expect(pane.style.maxHeight).toBe('');
  });

  it('maxBodyHeight="400px" sets chart-pane style.maxHeight', () => {
    const { container } = render(
      <ChronixGantt
        bars={sampleBars()}
        rows={sampleRows()}
        axisInput={baseAxisInput()}
        maxBodyHeight="400px"
      />,
    );
    const pane = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-pane')!;
    expect(pane.style.maxHeight).toBe('400px');
  });

  it('chart-pane has overflow:auto + chart-header-pane has overflow:hidden', () => {
    const { container } = render(
      <ChronixGantt bars={sampleBars()} rows={sampleRows()} axisInput={baseAxisInput()} />,
    );
    const pane = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-pane')!;
    const headerPane = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-header-pane')!;
    expect(pane.style.overflowX).toBe('auto');
    expect(pane.style.overflowY).toBe('hidden');
    expect(headerPane.style.overflow).toBe('hidden');
  });

  it('chart-header-inner element exists with willChange: transform', () => {
    const { container } = render(
      <ChronixGantt bars={sampleBars()} rows={sampleRows()} axisInput={baseAxisInput()} />,
    );
    const inner = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-header-inner')!;
    expect(inner.style.willChange).toBe('transform');
  });

  it('initial transform is translateX(0px) before any scroll', () => {
    const { container } = render(
      <ChronixGantt bars={sampleBars()} rows={sampleRows()} axisInput={baseAxisInput()} />,
    );
    const inner = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-header-inner')!;
    // useEffect fires after mount commit, so initial value should be 0px.
    // The header-sync effect runs because scrollLeft starts at 0.
    expect(inner.style.transform).toBe('translateX(0px)');
  });

  it('scroll event updates chart-header-inner transform to match scrollLeft', () => {
    const { container } = render(
      <ChronixGantt bars={sampleBars()} rows={sampleRows()} axisInput={baseAxisInput()} />,
    );
    const pane = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-pane')!;
    const inner = container.querySelector<HTMLDivElement>('div.cx-gantt-chart-header-inner')!;
    pane.scrollLeft = 80;
    act(() => {
      fireEvent.scroll(pane);
    });
    expect(inner.style.transform).toBe('translateX(-80px)');
  });

  it('wrapper class cx-gantt-wrapper + chart-pane class cx-gantt-chart-pane still present', () => {
    const { container } = render(
      <ChronixGantt bars={sampleBars()} rows={sampleRows()} axisInput={baseAxisInput()} />,
    );
    expect(container.querySelector('div.cx-gantt-wrapper')).not.toBeNull();
    expect(container.querySelector('div.cx-gantt-chart-pane')).not.toBeNull();
    expect(container.querySelector('div.cx-gantt-chart-header-pane')).not.toBeNull();
    expect(container.querySelector('div.cx-gantt-chart-header-inner')).not.toBeNull();
  });
});

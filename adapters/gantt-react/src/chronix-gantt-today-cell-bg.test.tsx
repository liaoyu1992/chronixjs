import { type AxisRangePlanInput, type RowSpec } from '@chronixjs/gantt';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

const rows: readonly RowSpec[] = [{ id: 'r1', columns: {} }];

const baseAxisInput: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: new Date('2026-05-13T00:00:00'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

describe('<ChronixGantt> todayCellBg (mirrors vue3)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders no today-cell rect when prop is false (default)', () => {
    const { container } = render(<ChronixGantt bars={[]} rows={rows} axisInput={baseAxisInput} />);
    expect(container.querySelector('rect.cx-gantt-today-cell')).toBeNull();
  });

  it('renders today-cell rects in BOTH body + header SVG when todayCellBg is true', () => {
    const todayAxisInput: AxisRangePlanInput = { ...baseAxisInput, anchorDate: new Date() };
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={todayAxisInput} todayCellBg={true} />,
    );
    const bodyCell = container.querySelector(
      'rect.cx-gantt-today-cell[data-today-cell-side="body"]',
    );
    const headerCell = container.querySelector(
      'rect.cx-gantt-today-cell[data-today-cell-side="header"]',
    );
    expect(bodyCell).not.toBeNull();
    expect(headerCell).not.toBeNull();
  });

  it('honors TodayCellBgOption.color prop override (overrides theme default)', () => {
    const todayAxisInput: AxisRangePlanInput = { ...baseAxisInput, anchorDate: new Date() };
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={rows}
        axisInput={todayAxisInput}
        todayCellBg={{ color: 'rgba(100, 200, 50, 0.4)' }}
      />,
    );
    const bodyCell = container.querySelector(
      'rect.cx-gantt-today-cell[data-today-cell-side="body"]',
    );
    expect(bodyCell?.getAttribute('fill')).toBe('rgba(100, 200, 50, 0.4)');
  });

  it('falls back to theme.todayCellBgColor when color is unset', () => {
    const todayAxisInput: AxisRangePlanInput = { ...baseAxisInput, anchorDate: new Date() };
    const { container } = render(
      <ChronixGantt
        bars={[]}
        rows={rows}
        axisInput={todayAxisInput}
        todayCellBg={{}}
        theme={{ todayCellBgColor: 'rgba(50, 100, 200, 0.25)' }}
      />,
    );
    const bodyCell = container.querySelector(
      'rect.cx-gantt-today-cell[data-today-cell-side="body"]',
    );
    expect(bodyCell?.getAttribute('fill')).toBe('rgba(50, 100, 200, 0.25)');
  });

  it('uses default theme color rgba(255, 220, 40, .15) when no overrides set', () => {
    const todayAxisInput: AxisRangePlanInput = { ...baseAxisInput, anchorDate: new Date() };
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={todayAxisInput} todayCellBg={true} />,
    );
    const bodyCell = container.querySelector(
      'rect.cx-gantt-today-cell[data-today-cell-side="body"]',
    );
    expect(bodyCell?.getAttribute('fill')).toBe('rgba(255, 220, 40, .15)');
  });

  it('renders no rect when today is outside the axis range (far-past anchor)', () => {
    const farPastAxisInput: AxisRangePlanInput = {
      ...baseAxisInput,
      anchorDate: new Date(2020, 0, 1),
    };
    const { container } = render(
      <ChronixGantt bars={[]} rows={rows} axisInput={farPastAxisInput} todayCellBg={true} />,
    );
    expect(container.querySelector('rect.cx-gantt-today-cell')).toBeNull();
  });
});

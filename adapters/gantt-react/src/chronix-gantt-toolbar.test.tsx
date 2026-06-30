import {
  type AxisRangePlanInput,
  type BarSpec,
  type RowSpec,
  type ToolbarInput,
} from '@chronixjs/gantt';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChronixGantt } from './chronix-gantt.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const anchor = new Date('2026-05-13T00:00:00Z');

const rows: readonly RowSpec[] = [{ id: 'r1', columns: {} }];
const bars: readonly BarSpec[] = [
  {
    id: 'b1',
    rowId: 'r1',
    range: {
      start: new Date(anchor.getTime() + 1 * MS_PER_HOUR),
      end: new Date(anchor.getTime() + 5 * MS_PER_HOUR),
    },
    dprIntent: 'crisp-pixel',
  },
];

const baseAxisInput: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: new Date('2026-05-13T00:00:00Z'),
  viewportWidth: 1440,
  locale: 'zh-CN',
  weekendsVisible: true,
};

const fullToolbar: ToolbarInput = {
  left: 'prev,next today',
  center: 'title',
  right: 'day,week,month,season,halfYear,year',
};

describe('<ChronixGantt> header toolbar ', () => {
  afterEach(() => {
    cleanup();
  });

  it('headerToolbar omitted: no toolbar rendered + cx-gantt-wrapper is direct render root', () => {
    const { container } = render(
      <ChronixGantt bars={bars} rows={rows} axisInput={baseAxisInput} />,
    );
    expect(container.querySelector('.cx-gantt-toolbar')).toBeNull();
    expect(container.querySelector('.cx-gantt-root')).toBeNull();
    // The first child of the test container is the wrapper directly.
    const firstChild = container.firstElementChild;
    expect(firstChild?.classList.contains('cx-gantt-wrapper')).toBe(true);
  });

  it('headerToolbar: false explicit-disable behaves identically to omitted', () => {
    const { container } = render(
      <ChronixGantt bars={bars} rows={rows} axisInput={baseAxisInput} headerToolbar={false} />,
    );
    expect(container.querySelector('.cx-gantt-toolbar')).toBeNull();
    expect(container.querySelector('.cx-gantt-root')).toBeNull();
  });

  it('headerToolbar with DSL renders the toolbar inside cx-gantt-root above the wrapper', () => {
    const { container } = render(
      <ChronixGantt
        bars={bars}
        rows={rows}
        axisInput={baseAxisInput}
        headerToolbar={fullToolbar}
      />,
    );
    const root = container.querySelector('.cx-gantt-root');
    expect(root).not.toBeNull();
    expect(root!.children).toHaveLength(2);
    expect(root!.children[0]!.classList.contains('cx-gantt-toolbar')).toBe(true);
    expect(root!.children[1]!.classList.contains('cx-gantt-wrapper')).toBe(true);
  });

  it('toolbar renders 3 sections (start / center / end)', () => {
    const { container } = render(
      <ChronixGantt
        bars={bars}
        rows={rows}
        axisInput={baseAxisInput}
        headerToolbar={fullToolbar}
      />,
    );
    const sections = container.querySelectorAll('.cx-gantt-toolbar-chunk');
    expect(sections).toHaveLength(3);
  });

  it('view button matching active viewId has aria-pressed="true"', () => {
    const { container } = render(
      <ChronixGantt
        bars={bars}
        rows={rows}
        axisInput={baseAxisInput}
        headerToolbar={fullToolbar}
      />,
    );
    const weekBtn = container.querySelector<HTMLButtonElement>('button.cx-gantt-week-button')!;
    expect(weekBtn).not.toBeNull();
    expect(weekBtn.getAttribute('aria-pressed')).toBe('true');
    const monthBtn = container.querySelector<HTMLButtonElement>('button.cx-gantt-month-button')!;
    expect(monthBtn.getAttribute('aria-pressed')).toBe('false');
  });

  it('view button click fires onAxisInputChange with new viewId + anchorDate preserved', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ChronixGantt
        bars={bars}
        rows={rows}
        axisInput={baseAxisInput}
        headerToolbar={fullToolbar}
        onAxisInputChange={onChange}
      />,
    );
    const monthBtn = container.querySelector<HTMLButtonElement>('button.cx-gantt-month-button')!;
    fireEvent.click(monthBtn);
    expect(onChange).toHaveBeenCalledTimes(1);
    const payload = onChange.mock.calls[0]![0] as AxisRangePlanInput;
    expect(payload.viewId).toBe('month');
    expect(payload.anchorDate.getTime()).toBe(baseAxisInput.anchorDate.getTime());
  });

  it('prev nav button click fires onAxisInputChange with previous anchorDate (week view → -7 days)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ChronixGantt
        bars={bars}
        rows={rows}
        axisInput={baseAxisInput}
        headerToolbar={fullToolbar}
        onAxisInputChange={onChange}
      />,
    );
    const prevBtn = container.querySelector<HTMLButtonElement>('button.cx-gantt-prev-button')!;
    fireEvent.click(prevBtn);
    const payload = onChange.mock.calls[0]![0] as AxisRangePlanInput;
    expect(payload.viewId).toBe('week');
    expect(payload.anchorDate.getTime()).toBe(new Date('2026-05-06T00:00:00Z').getTime());
  });

  it('next nav button click fires onAxisInputChange with next anchorDate (week view → +7 days)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ChronixGantt
        bars={bars}
        rows={rows}
        axisInput={baseAxisInput}
        headerToolbar={fullToolbar}
        onAxisInputChange={onChange}
      />,
    );
    const nextBtn = container.querySelector<HTMLButtonElement>('button.cx-gantt-next-button')!;
    fireEvent.click(nextBtn);
    const payload = onChange.mock.calls[0]![0] as AxisRangePlanInput;
    expect(payload.anchorDate.getTime()).toBe(new Date('2026-05-20T00:00:00Z').getTime());
  });

  it('today nav button click fires onAxisInputChange with local-midnight anchorDate', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ChronixGantt
        bars={bars}
        rows={rows}
        axisInput={baseAxisInput}
        headerToolbar={fullToolbar}
        onAxisInputChange={onChange}
      />,
    );
    const todayBtn = container.querySelector<HTMLButtonElement>('button.cx-gantt-today-button')!;
    fireEvent.click(todayBtn);
    const payload = onChange.mock.calls[0]![0] as AxisRangePlanInput;
    expect(payload.anchorDate.getHours()).toBe(0);
    expect(payload.anchorDate.getMinutes()).toBe(0);
    expect(payload.anchorDate.getSeconds()).toBe(0);
  });

  it('title widget renders as h2.cx-gantt-toolbar-title and is non-interactive (no onClick fire)', () => {
    const onChange = vi.fn();
    const { container } = render(
      <ChronixGantt
        bars={bars}
        rows={rows}
        axisInput={baseAxisInput}
        headerToolbar={fullToolbar}
        onAxisInputChange={onChange}
      />,
    );
    const title = container.querySelector<HTMLHeadingElement>('h2.cx-gantt-toolbar-title')!;
    expect(title).not.toBeNull();
    expect(title.getAttribute('data-button-kind')).toBe('title');
    // h2 has no click handler — firing one shouldn't dispatch.
    fireEvent.click(title);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toolbar updates aria-pressed reactively when axisInput.viewId changes (controlled-prop loop)', () => {
    const { container, rerender } = render(
      <ChronixGantt
        bars={bars}
        rows={rows}
        axisInput={baseAxisInput}
        headerToolbar={fullToolbar}
      />,
    );
    let weekBtn = container.querySelector<HTMLButtonElement>('button.cx-gantt-week-button')!;
    expect(weekBtn.getAttribute('aria-pressed')).toBe('true');

    rerender(
      <ChronixGantt
        bars={bars}
        rows={rows}
        axisInput={{ ...baseAxisInput, viewId: 'month' }}
        headerToolbar={fullToolbar}
      />,
    );
    weekBtn = container.querySelector<HTMLButtonElement>('button.cx-gantt-week-button')!;
    const monthBtn = container.querySelector<HTMLButtonElement>('button.cx-gantt-month-button')!;
    expect(weekBtn.getAttribute('aria-pressed')).toBe('false');
    expect(monthBtn.getAttribute('aria-pressed')).toBe('true');
  });
});

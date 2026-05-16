import { describe, expect, it } from 'vitest';

import { parseToolbar } from './parse-toolbar.js';

import type { ViewId } from '../layout/types.js';

const ALL_VIEWS: readonly ViewId[] = ['day', 'week', 'month', 'season', 'halfYear', 'year'];

const OPTS = { viewIds: ALL_VIEWS, activeViewId: 'week' as ViewId } as const;

describe('parseToolbar', () => {
  it('parses the canonical demo wiring into start / center / end sections', () => {
    const model = parseToolbar(
      {
        left: 'prev,next today',
        center: 'title',
        right: 'day,week,month,season,halfYear,year',
      },
      OPTS,
    );

    expect(model.sectionWidgets.start).toHaveLength(2);
    expect(model.sectionWidgets.start[0]!.map((w) => w.buttonName)).toEqual(['prev', 'next']);
    expect(model.sectionWidgets.start[1]!.map((w) => w.buttonName)).toEqual(['today']);
    expect(model.sectionWidgets.center).toHaveLength(1);
    expect(model.sectionWidgets.center[0]![0]!).toMatchObject({
      buttonName: 'title',
      kind: 'title',
    });
    expect(model.sectionWidgets.end).toHaveLength(1);
    expect(model.sectionWidgets.end[0]!.map((w) => w.buttonName)).toEqual([
      'day',
      'week',
      'month',
      'season',
      'halfYear',
      'year',
    ]);
  });

  it('marks the active view button as pressed and the others as not', () => {
    const model = parseToolbar(
      { right: 'day,week,month' },
      { viewIds: ALL_VIEWS, activeViewId: 'month' },
    );
    const widgets = model.sectionWidgets.end[0]!;
    expect(widgets.find((w) => w.buttonName === 'day')!.isPressed).toBe(false);
    expect(widgets.find((w) => w.buttonName === 'week')!.isPressed).toBe(false);
    expect(widgets.find((w) => w.buttonName === 'month')!.isPressed).toBe(true);
  });

  it('classifies prev / next as nav widgets with the matching icon and no label', () => {
    const model = parseToolbar({ left: 'prev,next' }, OPTS);
    const [prev, next] = model.sectionWidgets.start[0]!;
    expect(prev).toMatchObject({ kind: 'nav', iconSvg: 'prev', labelText: '' });
    expect(next).toMatchObject({ kind: 'nav', iconSvg: 'next', labelText: '' });
  });

  it("classifies today as a nav widget with label 'Today' and no icon", () => {
    const model = parseToolbar({ left: 'today' }, OPTS);
    const widget = model.sectionWidgets.start[0]![0]!;
    expect(widget).toMatchObject({
      kind: 'nav',
      iconSvg: null,
      labelText: 'Today',
    });
  });

  it('assigns Chinese single-char labels for view widgets matching the demo', () => {
    const model = parseToolbar({ right: 'day,week,month,season,halfYear,year' }, OPTS);
    const labels = model.sectionWidgets.end[0]!.map((w) => w.labelText);
    expect(labels).toEqual(['日', '周', '月', '季', '半年', '年']);
  });

  it('honors start / end aliases when left / right are absent', () => {
    const model = parseToolbar({ start: 'today', end: 'day' }, OPTS);
    expect(model.sectionWidgets.start[0]![0]!.buttonName).toBe('today');
    expect(model.sectionWidgets.end[0]![0]!.buttonName).toBe('day');
  });

  it('prefers left over start, right over end (LTR-locked alias wins)', () => {
    const model = parseToolbar({ left: 'today', start: 'prev', right: 'day', end: 'week' }, OPTS);
    expect(model.sectionWidgets.start[0]![0]!.buttonName).toBe('today');
    expect(model.sectionWidgets.end[0]![0]!.buttonName).toBe('day');
  });

  it('emits an empty array for absent sections', () => {
    const model = parseToolbar({ center: 'title' }, OPTS);
    expect(model.sectionWidgets.start).toEqual([]);
    expect(model.sectionWidgets.end).toEqual([]);
  });

  it('splits widget groups by space and widgets-within-group by comma', () => {
    const model = parseToolbar(
      { left: 'a,b c,d' },
      {
        viewIds: ['a', 'b', 'c', 'd'] as unknown as readonly ViewId[],
        activeViewId: 'a' as ViewId,
      },
    );
    expect(model.sectionWidgets.start.map((g) => g.map((w) => w.buttonName))).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('tolerates duplicated spaces by skipping empty groups', () => {
    const model = parseToolbar({ left: 'prev  next' }, OPTS);
    expect(model.sectionWidgets.start).toHaveLength(2);
    expect(model.sectionWidgets.start[0]![0]!.buttonName).toBe('prev');
    expect(model.sectionWidgets.start[1]![0]!.buttonName).toBe('next');
  });

  it('throws on an unknown widget name with an instructive message', () => {
    expect(() => parseToolbar({ left: 'previous' }, OPTS)).toThrow(
      /Unknown toolbar widget 'previous'/,
    );
    expect(() => parseToolbar({ left: 'previous' }, OPTS)).toThrow(
      /day\/week\/month\/season\/halfYear\/year/,
    );
  });

  it('does not throw on an empty section string', () => {
    expect(() => parseToolbar({ left: '', center: '', right: '' }, OPTS)).not.toThrow();
  });
});

import { describe, expect, it } from 'vitest';

import { resolveTimelineItemClassList } from './resolve-timeline-item-class-list.js';

import type { TimelineItem } from './timeline-spec.js';

function item(over: Partial<TimelineItem> = {}): TimelineItem {
  return {
    key: 'k',
    title: 'T',
    description: undefined,
    timestamp: undefined,
    color: 'default',
    lineType: 'default',
    ...over,
  };
}

describe('resolveTimelineItemClassList', () => {
  it('returns base + default color + default line for default item', () => {
    expect(resolveTimelineItemClassList(item(), false)).toEqual([
      'cx-ui-timeline__item',
      'cx-ui-timeline__item--color-default',
      'cx-ui-timeline__item--line-default',
    ]);
  });

  it.each(['default', 'success', 'warning', 'error', 'info'] as const)(
    'reflects color="%s" via the --color-{value} modifier',
    (color) => {
      const classes = resolveTimelineItemClassList(item({ color }), false);
      expect(classes).toContain(`cx-ui-timeline__item--color-${color}`);
    },
  );

  it.each(['default', 'dashed'] as const)(
    'reflects lineType="%s" via the --line-{value} modifier',
    (lineType) => {
      const classes = resolveTimelineItemClassList(item({ lineType }), false);
      expect(classes).toContain(`cx-ui-timeline__item--line-${lineType}`);
    },
  );

  it('adds --last when isLast is true', () => {
    expect(resolveTimelineItemClassList(item(), true)).toContain('cx-ui-timeline__item--last');
  });

  it('combines color + lineType + last when all apply', () => {
    const classes = resolveTimelineItemClassList(
      item({ color: 'success', lineType: 'dashed' }),
      true,
    );
    expect(classes).toEqual([
      'cx-ui-timeline__item',
      'cx-ui-timeline__item--color-success',
      'cx-ui-timeline__item--line-dashed',
      'cx-ui-timeline__item--last',
    ]);
  });

  it('returns a fresh array per call', () => {
    const a = resolveTimelineItemClassList(item(), false);
    const b = resolveTimelineItemClassList(item(), false);
    expect(a).not.toBe(b);
  });
});

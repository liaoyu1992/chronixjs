import { describe, expect, it } from 'vitest';

import { defaultTimelineProps, type TimelineItem, type TimelineProps } from './timeline-spec.js';

describe('defaultTimelineProps', () => {
  it('matches the documented defaults (empty items)', () => {
    expect(defaultTimelineProps).toEqual({ items: [] });
  });

  it('is a TimelineProps-shape that adapters can spread', () => {
    const items: TimelineItem[] = [
      {
        key: 'create',
        title: 'Created project',
        description: 'Initial commit on master',
        timestamp: '2026-06-01',
        color: 'success',
        lineType: 'default',
      },
      {
        key: 'deploy',
        title: 'Deployed v0.1.0',
        description: undefined,
        timestamp: undefined,
        color: 'info',
        lineType: 'dashed',
      },
    ];
    const override: TimelineProps = { ...defaultTimelineProps, items };
    expect(override.items).toHaveLength(2);
    expect(override.items[0]!.color).toBe('success');
    expect(override.items[1]!.lineType).toBe('dashed');
  });
});

describe('TimelineItem shape', () => {
  it('accepts all 5 color variants', () => {
    for (const color of ['default', 'success', 'warning', 'error', 'info'] as const) {
      const item: TimelineItem = {
        key: 'k',
        title: 'T',
        description: undefined,
        timestamp: undefined,
        color,
        lineType: 'default',
      };
      expect(item.color).toBe(color);
    }
  });

  it('accepts both line type variants', () => {
    for (const lineType of ['default', 'dashed'] as const) {
      const item: TimelineItem = {
        key: 'k',
        title: 'T',
        description: undefined,
        timestamp: undefined,
        color: 'default',
        lineType,
      };
      expect(item.lineType).toBe(lineType);
    }
  });
});

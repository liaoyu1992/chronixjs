import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixTimeline } from './chronix-timeline.js';

import type { TimelineItem } from '@chronixjs/ui';

const SAMPLE_ITEMS: TimelineItem[] = [
  {
    key: 'create',
    title: 'Created',
    description: 'Initial commit',
    timestamp: '2026-06-01',
    color: 'success',
    lineType: 'default',
  },
  {
    key: 'deploy',
    title: 'Deployed',
    description: undefined,
    timestamp: '2026-06-02',
    color: 'info',
    lineType: 'dashed',
  },
  {
    key: 'verified',
    title: 'Verified',
    description: undefined,
    timestamp: undefined,
    color: 'default',
    lineType: 'default',
  },
];

describe('ChronixTimeline (react) — root rendering', () => {
  it('renders a <div> with the base class', () => {
    const { container } = render(<ChronixTimeline items={SAMPLE_ITEMS} />);
    const root = container.querySelector('div.cx-ui-timeline')!;
    expect(root.tagName).toBe('DIV');
  });

  it('renders empty <div> when items is empty', () => {
    const { container } = render(<ChronixTimeline />);
    expect(container.querySelectorAll('.cx-ui-timeline__item')).toHaveLength(0);
  });
});

describe('ChronixTimeline (react) — items', () => {
  it('renders one item per TimelineItem', () => {
    const { container } = render(<ChronixTimeline items={SAMPLE_ITEMS} />);
    expect(container.querySelectorAll('.cx-ui-timeline__item')).toHaveLength(SAMPLE_ITEMS.length);
  });

  it('applies color modifier per item', () => {
    const { container } = render(<ChronixTimeline items={SAMPLE_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-timeline__item');
    expect(items[0]!.classList.contains('cx-ui-timeline__item--color-success')).toBe(true);
    expect(items[1]!.classList.contains('cx-ui-timeline__item--color-info')).toBe(true);
  });

  it('applies lineType modifier per item', () => {
    const { container } = render(<ChronixTimeline items={SAMPLE_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-timeline__item');
    expect(items[1]!.classList.contains('cx-ui-timeline__item--line-dashed')).toBe(true);
  });
});

describe('ChronixTimeline (react) — last-item special case', () => {
  it('only the last item carries the --last modifier', () => {
    const { container } = render(<ChronixTimeline items={SAMPLE_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-timeline__item');
    expect(items[0]!.classList.contains('cx-ui-timeline__item--last')).toBe(false);
    expect(items[2]!.classList.contains('cx-ui-timeline__item--last')).toBe(true);
  });

  it('only the last item omits the __line element', () => {
    const { container } = render(<ChronixTimeline items={SAMPLE_ITEMS} />);
    const items = container.querySelectorAll('.cx-ui-timeline__item');
    expect(items[0]!.querySelector('.cx-ui-timeline__line')).not.toBeNull();
    expect(items[2]!.querySelector('.cx-ui-timeline__line')).toBeNull();
  });

  it('every item still has a __dot element', () => {
    const { container } = render(<ChronixTimeline items={SAMPLE_ITEMS} />);
    expect(container.querySelectorAll('.cx-ui-timeline__dot')).toHaveLength(SAMPLE_ITEMS.length);
  });
});

describe('ChronixTimeline (react) — title / description / timestamp', () => {
  it('renders __title with item title text', () => {
    const { container } = render(<ChronixTimeline items={SAMPLE_ITEMS} />);
    expect(container.querySelectorAll('.cx-ui-timeline__title')[0]!.textContent).toBe('Created');
  });

  it('renders __description only when description is defined', () => {
    const { container } = render(<ChronixTimeline items={SAMPLE_ITEMS} />);
    const descs = container.querySelectorAll('.cx-ui-timeline__description');
    expect(descs).toHaveLength(1);
    expect(descs[0]!.textContent).toBe('Initial commit');
  });

  it('renders __timestamp only when timestamp is defined', () => {
    const { container } = render(<ChronixTimeline items={SAMPLE_ITEMS} />);
    const timestamps = container.querySelectorAll('.cx-ui-timeline__timestamp');
    expect(timestamps).toHaveLength(2);
  });
});

describe('ChronixTimeline (react) — CSS injection', () => {
  it('mounting ensures the chronix-timeline stylesheet is in document.head', () => {
    render(<ChronixTimeline items={SAMPLE_ITEMS} />);
    expect(document.head.querySelector('style[data-chronix-ui="timeline"]')).not.toBeNull();
  });
});

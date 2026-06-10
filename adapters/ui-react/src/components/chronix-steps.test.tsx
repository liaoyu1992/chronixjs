import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixSteps } from './chronix-steps.js';

import type { StepItem } from '@chronixjs/ui';

const SAMPLE_ITEMS: StepItem[] = [
  { key: 'setup', title: 'Setup', description: 'Initial config', status: undefined },
  { key: 'deploy', title: 'Deploy', description: undefined, status: undefined },
  { key: 'verify', title: 'Verify', description: undefined, status: undefined },
];

describe('ChronixSteps (react) — root rendering', () => {
  it('renders a <div> with the base + direction=horizontal classes', () => {
    const { container } = render(<ChronixSteps items={SAMPLE_ITEMS} />);
    const root = container.querySelector('div.cx-ui-steps')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-steps--horizontal')).toBe(true);
  });

  it('renders empty <div> when items is empty', () => {
    const { container } = render(<ChronixSteps />);
    expect(container.querySelectorAll('.cx-ui-steps__item')).toHaveLength(0);
  });

  it('uses --vertical when direction prop is vertical', () => {
    const { container } = render(<ChronixSteps items={SAMPLE_ITEMS} direction="vertical" />);
    expect(
      container.querySelector('div.cx-ui-steps')!.classList.contains('cx-ui-steps--vertical'),
    ).toBe(true);
  });
});

describe('ChronixSteps (react) — items + separators', () => {
  it('renders one item per StepItem', () => {
    const { container } = render(<ChronixSteps items={SAMPLE_ITEMS} />);
    expect(container.querySelectorAll('.cx-ui-steps__item')).toHaveLength(SAMPLE_ITEMS.length);
  });

  it('renders items.length - 1 separators', () => {
    const { container } = render(<ChronixSteps items={SAMPLE_ITEMS} />);
    expect(container.querySelectorAll('.cx-ui-steps__separator')).toHaveLength(2);
  });

  it('renders 0 separators when items has only 1 entry', () => {
    const { container } = render(<ChronixSteps items={[SAMPLE_ITEMS[0]!]} />);
    expect(container.querySelectorAll('.cx-ui-steps__separator')).toHaveLength(0);
  });
});

describe('ChronixSteps (react) — derived per-item status', () => {
  it('current=1 yields finish / process / wait derived statuses', () => {
    const { container } = render(<ChronixSteps items={SAMPLE_ITEMS} current={1} />);
    const items = container.querySelectorAll('.cx-ui-steps__item');
    expect(items[0]!.classList.contains('cx-ui-steps__item--finish')).toBe(true);
    expect(items[1]!.classList.contains('cx-ui-steps__item--process')).toBe(true);
    expect(items[1]!.classList.contains('cx-ui-steps__item--current')).toBe(true);
    expect(items[2]!.classList.contains('cx-ui-steps__item--wait')).toBe(true);
  });

  it('per-step status override beats current-based auto-derive', () => {
    const items: StepItem[] = [
      { key: 'a', title: 'A', description: undefined, status: undefined },
      { key: 'b', title: 'B', description: undefined, status: 'error' },
    ];
    const { container } = render(<ChronixSteps items={items} current={0} />);
    expect(
      container
        .querySelectorAll('.cx-ui-steps__item')[1]!
        .classList.contains('cx-ui-steps__item--error'),
    ).toBe(true);
  });
});

describe('ChronixSteps (react) — indicator content', () => {
  it('wait/process status renders 1-based numeric index', () => {
    const { container } = render(<ChronixSteps items={SAMPLE_ITEMS} current={0} />);
    const indices = container.querySelectorAll('.cx-ui-steps__index');
    expect(indices[0]!.textContent).toBe('1');
    expect(indices[1]!.textContent).toBe('2');
    expect(indices[2]!.textContent).toBe('3');
  });

  it('finish status renders the ✓ unicode placeholder', () => {
    const { container } = render(
      <ChronixSteps items={SAMPLE_ITEMS} current={SAMPLE_ITEMS.length} />,
    );
    expect(container.querySelectorAll('.cx-ui-steps__index')[0]!.textContent).toBe('✓');
  });

  it('error status renders the ✕ unicode placeholder', () => {
    const items: StepItem[] = [{ key: 'a', title: 'A', description: undefined, status: 'error' }];
    const { container } = render(<ChronixSteps items={items} />);
    expect(container.querySelector('.cx-ui-steps__index')!.textContent).toBe('✕');
  });

  it('indicator has aria-hidden="true" for screen readers', () => {
    const { container } = render(<ChronixSteps items={SAMPLE_ITEMS} />);
    expect(container.querySelector('.cx-ui-steps__index')!.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });
});

describe('ChronixSteps (react) — title + description', () => {
  it('renders __title with the item title text', () => {
    const { container } = render(<ChronixSteps items={SAMPLE_ITEMS} />);
    expect(container.querySelectorAll('.cx-ui-steps__title')[0]!.textContent).toBe('Setup');
  });

  it('renders __description only when description is defined', () => {
    const { container } = render(<ChronixSteps items={SAMPLE_ITEMS} />);
    const descs = container.querySelectorAll('.cx-ui-steps__description');
    expect(descs).toHaveLength(1);
    expect(descs[0]!.textContent).toBe('Initial config');
  });
});

describe('ChronixSteps (react) — has-error aggregate', () => {
  it('--has-error appears on root when any item is error', () => {
    const items: StepItem[] = [
      { key: 'a', title: 'A', description: undefined, status: undefined },
      { key: 'b', title: 'B', description: undefined, status: 'error' },
    ];
    const { container } = render(<ChronixSteps items={items} current={0} />);
    expect(
      container.querySelector('div.cx-ui-steps')!.classList.contains('cx-ui-steps--has-error'),
    ).toBe(true);
  });
});

describe('ChronixSteps (react) — CSS injection', () => {
  it('mounting ensures the chronix-steps stylesheet is in document.head', () => {
    render(<ChronixSteps items={SAMPLE_ITEMS} />);
    expect(document.head.querySelector('style[data-chronix-ui="steps"]')).not.toBeNull();
  });
});

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixSkeleton } from './chronix-skeleton.js';

describe('ChronixSkeleton (react) — default rendering', () => {
  it('renders a <div> with base + text + animated', () => {
    const { container } = render(<ChronixSkeleton />);
    const root = container.querySelector('div.cx-ui-skeleton')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-skeleton--text')).toBe(true);
    expect(root.classList.contains('cx-ui-skeleton--animated')).toBe(true);
  });

  it('emits no inline width/height when undefined', () => {
    const { container } = render(<ChronixSkeleton />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-skeleton')!;
    expect(root.style.width).toBe('');
    expect(root.style.height).toBe('');
  });
});

describe('ChronixSkeleton (react) — shape prop', () => {
  it.each(['text', 'rect', 'circle'] as const)('shape="%s" adds the matching modifier', (s) => {
    const { container } = render(<ChronixSkeleton shape={s} />);
    expect(
      container.querySelector('div.cx-ui-skeleton')!.classList.contains(`cx-ui-skeleton--${s}`),
    ).toBe(true);
  });
});

describe('ChronixSkeleton (react) — width/height props', () => {
  it('numeric width becomes Npx', () => {
    const { container } = render(<ChronixSkeleton width={200} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-skeleton')!;
    expect(root.style.width).toBe('200px');
  });

  it('numeric height becomes Npx', () => {
    const { container } = render(<ChronixSkeleton height={60} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-skeleton')!;
    expect(root.style.height).toBe('60px');
  });

  it('string width passes through verbatim', () => {
    const { container } = render(<ChronixSkeleton width="50%" />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-skeleton')!;
    expect(root.style.width).toBe('50%');
  });

  it('both width + height render together', () => {
    const { container } = render(<ChronixSkeleton width={100} height={40} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-skeleton')!;
    expect(root.style.width).toBe('100px');
    expect(root.style.height).toBe('40px');
  });
});

describe('ChronixSkeleton (react) — animated + round modifiers', () => {
  it('omits --animated when animated=false', () => {
    const { container } = render(<ChronixSkeleton animated={false} />);
    expect(
      container.querySelector('div.cx-ui-skeleton')!.classList.contains('cx-ui-skeleton--animated'),
    ).toBe(false);
  });

  it('adds --round when round=true', () => {
    const { container } = render(<ChronixSkeleton round />);
    expect(
      container.querySelector('div.cx-ui-skeleton')!.classList.contains('cx-ui-skeleton--round'),
    ).toBe(true);
  });
});

describe('ChronixSkeleton (react) — CSS injection', () => {
  it('mounting ensures the chronix-skeleton stylesheet is in document.head', () => {
    render(<ChronixSkeleton />);
    expect(document.head.querySelector('style[data-chronix-ui="skeleton"]')).not.toBeNull();
  });
});

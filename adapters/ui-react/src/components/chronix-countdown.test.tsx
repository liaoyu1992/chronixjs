import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixCountdown } from './chronix-countdown.js';

describe('ChronixCountdown (react)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-02T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a <div> with base + tabular-nums', () => {
    const { container } = render(<ChronixCountdown />);
    const root = container.querySelector('div.cx-ui-countdown')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-countdown--tabular-nums')).toBe(true);
  });

  it('renders __value at 00:00:00 with no duration', () => {
    const { container } = render(<ChronixCountdown />);
    expect(container.querySelector('.cx-ui-countdown__value')!.textContent).toBe('00:00:00');
  });

  it('renders __value with the duration formatted at precision=0', () => {
    const { container } = render(<ChronixCountdown duration={65_000} />);
    expect(container.querySelector('.cx-ui-countdown__value')!.textContent).toBe('00:01:05');
  });

  it('ticks down as time advances', () => {
    const { container } = render(<ChronixCountdown duration={5_000} />);
    expect(container.querySelector('.cx-ui-countdown__value')!.textContent).toBe('00:00:05');
    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(container.querySelector('.cx-ui-countdown__value')!.textContent).toBe('00:00:03');
  });

  it('calls onFinish when the countdown reaches 0', () => {
    const onFinish = vi.fn();
    render(<ChronixCountdown duration={1_000} onFinish={onFinish} />);
    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('does NOT tick when active=false', () => {
    const { container } = render(<ChronixCountdown duration={10_000} active={false} />);
    expect(container.querySelector('.cx-ui-countdown__value')!.textContent).toBe('00:00:10');
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(container.querySelector('.cx-ui-countdown__value')!.textContent).toBe('00:00:10');
  });

  it('adds --paused modifier when active=false', () => {
    const { container } = render(<ChronixCountdown active={false} />);
    expect(
      container.querySelector('div.cx-ui-countdown')!.classList.contains('cx-ui-countdown--paused'),
    ).toBe(true);
  });

  it('renders __label and prefix/suffix slots', () => {
    const { container } = render(
      <ChronixCountdown label="Sale ends in" duration={1_000} prefix="⏳" suffix="left" />,
    );
    expect(container.querySelector('.cx-ui-countdown__label')!.textContent).toBe('Sale ends in');
    expect(container.querySelector('.cx-ui-countdown__prefix')!.textContent).toBe('⏳');
    expect(container.querySelector('.cx-ui-countdown__suffix')!.textContent).toBe('left');
  });

  it('mounting ensures the chronix-countdown stylesheet is in document.head', () => {
    render(<ChronixCountdown />);
    expect(document.head.querySelector('style[data-chronix-ui="countdown"]')).not.toBeNull();
  });
});

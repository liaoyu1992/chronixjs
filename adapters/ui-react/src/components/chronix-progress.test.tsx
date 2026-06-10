import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixProgress } from './chronix-progress.js';

describe('ChronixProgress (react) — default rendering', () => {
  it('renders a <div> with base + default + with-info + info-outside', () => {
    const { container } = render(<ChronixProgress />);
    const root = container.querySelector('div.cx-ui-progress')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-progress--default')).toBe(true);
    expect(root.classList.contains('cx-ui-progress--with-info')).toBe(true);
    expect(root.classList.contains('cx-ui-progress--info-outside')).toBe(true);
  });

  it('renders __rail + __fill (zero-width) + __info (0%) at default percentage', () => {
    const { container } = render(<ChronixProgress />);
    expect(container.querySelector('.cx-ui-progress__rail')).not.toBeNull();
    const fill = container.querySelector<HTMLElement>('.cx-ui-progress__fill')!;
    expect(fill).not.toBeNull();
    expect(fill.style.width).toBe('0%');
    expect(container.querySelector('.cx-ui-progress__info')!.textContent).toBe('0%');
  });
});

describe('ChronixProgress (react) — percentage prop', () => {
  it.each([
    [25, '25%'],
    [50, '50%'],
    [42, '42%'],
    [100, '100%'],
  ])('percentage=%i renders __fill width + __info text "%s"', (pct, label) => {
    const { container } = render(<ChronixProgress percentage={pct} />);
    const fill = container.querySelector<HTMLElement>('.cx-ui-progress__fill')!;
    expect(fill.style.width).toBe(`${pct}%`);
    expect(container.querySelector('.cx-ui-progress__info')!.textContent).toBe(label);
  });

  it('clamps over-100% percentages to 100% on both fill and info', () => {
    const { container } = render(<ChronixProgress percentage={150} />);
    const fill = container.querySelector<HTMLElement>('.cx-ui-progress__fill')!;
    expect(fill.style.width).toBe('100%');
    expect(container.querySelector('.cx-ui-progress__info')!.textContent).toBe('100%');
  });
});

describe('ChronixProgress (react) — type prop', () => {
  it.each(['default', 'success', 'warning', 'error', 'info'] as const)(
    'type="%s" adds the matching modifier',
    (t) => {
      const { container } = render(<ChronixProgress type={t} />);
      expect(
        container.querySelector('div.cx-ui-progress')!.classList.contains(`cx-ui-progress--${t}`),
      ).toBe(true);
    },
  );
});

describe('ChronixProgress (react) — showInfo + placement', () => {
  it('omits __info element + classes when showInfo=false', () => {
    const { container } = render(<ChronixProgress showInfo={false} />);
    expect(container.querySelector('.cx-ui-progress__info')).toBeNull();
    expect(
      container
        .querySelector('div.cx-ui-progress')!
        .classList.contains('cx-ui-progress--with-info'),
    ).toBe(false);
  });

  it('renders __info inside __rail when placement=inside', () => {
    const { container } = render(<ChronixProgress percentage={60} indicatorPlacement="inside" />);
    expect(
      container
        .querySelector('div.cx-ui-progress')!
        .classList.contains('cx-ui-progress--info-inside'),
    ).toBe(true);
    const info = container.querySelector('.cx-ui-progress__rail .cx-ui-progress__info');
    expect(info).not.toBeNull();
    expect(info!.textContent).toBe('60%');
  });
});

describe('ChronixProgress (react) — height prop', () => {
  it('applies inline style height when supplied', () => {
    const { container } = render(<ChronixProgress height={12} />);
    const rail = container.querySelector<HTMLElement>('.cx-ui-progress__rail')!;
    expect(rail.style.height).toBe('12px');
  });
});

describe('ChronixProgress (react) — CSS injection', () => {
  it('mounting ensures the chronix-progress stylesheet is in document.head', () => {
    render(<ChronixProgress />);
    expect(document.head.querySelector('style[data-chronix-ui="progress"]')).not.toBeNull();
  });
});

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixStatistic } from './chronix-statistic.js';

describe('ChronixStatistic (react) — default rendering', () => {
  it('renders a <div> with base + tabular-nums', () => {
    const { container } = render(<ChronixStatistic />);
    const root = container.querySelector('div.cx-ui-statistic')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-statistic--tabular-nums')).toBe(true);
  });

  it('renders __value with "-" placeholder when value undefined', () => {
    const { container } = render(<ChronixStatistic />);
    expect(container.querySelector('.cx-ui-statistic__value')!.textContent).toBe('-');
  });

  it('omits __label by default', () => {
    const { container } = render(<ChronixStatistic />);
    expect(container.querySelector('.cx-ui-statistic__label')).toBeNull();
  });
});

describe('ChronixStatistic (react) — value formatting', () => {
  it('numeric + precision applies toFixed', () => {
    const { container } = render(<ChronixStatistic value={1234.5678} precision={2} />);
    expect(container.querySelector('.cx-ui-statistic__value')!.textContent).toBe('1234.57');
  });

  it('string value passes through verbatim', () => {
    const { container } = render(<ChronixStatistic value="1.2K" />);
    expect(container.querySelector('.cx-ui-statistic__value')!.textContent).toBe('1.2K');
  });

  it('non-finite numeric renders "-"', () => {
    const { container } = render(<ChronixStatistic value={Number.NaN} />);
    expect(container.querySelector('.cx-ui-statistic__value')!.textContent).toBe('-');
  });
});

describe('ChronixStatistic (react) — label + prefix/suffix', () => {
  it('renders __label + --with-label when supplied', () => {
    const { container } = render(<ChronixStatistic label="Revenue" />);
    expect(
      container
        .querySelector('div.cx-ui-statistic')!
        .classList.contains('cx-ui-statistic--with-label'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-statistic__label')!.textContent).toBe('Revenue');
  });

  it('renders prefix + suffix from props', () => {
    const { container } = render(<ChronixStatistic value={1234} prefix="$" suffix="USD" />);
    expect(container.querySelector('.cx-ui-statistic__prefix')!.textContent).toBe('$');
    expect(container.querySelector('.cx-ui-statistic__suffix')!.textContent).toBe('USD');
    expect(
      container
        .querySelector('div.cx-ui-statistic')!
        .classList.contains('cx-ui-statistic--with-prefix'),
    ).toBe(true);
    expect(
      container
        .querySelector('div.cx-ui-statistic')!
        .classList.contains('cx-ui-statistic--with-suffix'),
    ).toBe(true);
  });
});

describe('ChronixStatistic (react) — tabular-nums', () => {
  it('omits --tabular-nums when tabularNums=false', () => {
    const { container } = render(<ChronixStatistic tabularNums={false} />);
    expect(
      container
        .querySelector('div.cx-ui-statistic')!
        .classList.contains('cx-ui-statistic--tabular-nums'),
    ).toBe(false);
  });
});

describe('ChronixStatistic (react) — CSS injection', () => {
  it('mounting ensures the chronix-statistic stylesheet is in document.head', () => {
    render(<ChronixStatistic />);
    expect(document.head.querySelector('style[data-chronix-ui="statistic"]')).not.toBeNull();
  });
});

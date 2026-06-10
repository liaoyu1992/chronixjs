import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixResult } from './chronix-result.js';

describe('ChronixResult (react) — default rendering', () => {
  it('renders a <div> with base + status-info', () => {
    const { container } = render(<ChronixResult />);
    const root = container.querySelector('div.cx-ui-result')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-result--status-info')).toBe(true);
  });

  it('renders __icon with the default-status unicode placeholder', () => {
    const { container } = render(<ChronixResult />);
    const icon = container.querySelector('.cx-ui-result__icon')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.textContent).toBe('ℹ️');
  });

  it('omits __title + __description by default', () => {
    const { container } = render(<ChronixResult />);
    expect(container.querySelector('.cx-ui-result__title')).toBeNull();
    expect(container.querySelector('.cx-ui-result__description')).toBeNull();
  });
});

describe('ChronixResult (react) — status prop', () => {
  it.each([
    ['default', '📋'],
    ['info', 'ℹ️'],
    ['success', '✅'],
    ['warning', '⚠️'],
    ['error', '❌'],
    ['404', '🔍'],
    ['403', '🔒'],
    ['500', '💥'],
    ['418', '☕'],
  ] as const)('status="%s" applies the matching modifier + icon', (status, expectedIcon) => {
    const { container } = render(<ChronixResult status={status} />);
    expect(
      container
        .querySelector('div.cx-ui-result')!
        .classList.contains(`cx-ui-result--status-${status}`),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-result__icon')!.textContent).toBe(expectedIcon);
  });
});

describe('ChronixResult (react) — title / description / extra', () => {
  it('renders __title when title is supplied', () => {
    const { container } = render(<ChronixResult title="All set" />);
    expect(
      container.querySelector('div.cx-ui-result')!.classList.contains('cx-ui-result--with-title'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-result__title')!.textContent).toBe('All set');
  });

  it('renders __description when description is supplied', () => {
    const { container } = render(<ChronixResult description="Done." />);
    expect(container.querySelector('.cx-ui-result__description')!.textContent).toBe('Done.');
  });

  it('renders __extra + --with-extra when children supplied', () => {
    const { container } = render(
      <ChronixResult>
        <button type="button">Continue</button>
      </ChronixResult>,
    );
    expect(
      container.querySelector('div.cx-ui-result')!.classList.contains('cx-ui-result--with-extra'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-result__extra')!.textContent).toBe('Continue');
  });

  it('icon prop overrides the default unicode character', () => {
    const { container } = render(<ChronixResult icon={<span className="custom">★</span>} />);
    expect(container.querySelector('.cx-ui-result__icon .custom')!.textContent).toBe('★');
  });
});

describe('ChronixResult (react) — CSS injection', () => {
  it('mounting ensures the chronix-result stylesheet is in document.head', () => {
    render(<ChronixResult />);
    expect(document.head.querySelector('style[data-chronix-ui="result"]')).not.toBeNull();
  });
});

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixSpin } from './chronix-spin.js';

describe('ChronixSpin (react) — default rendering', () => {
  it('renders a <div> with base + medium', () => {
    const { container } = render(<ChronixSpin />);
    const root = container.querySelector('div.cx-ui-spin')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-spin--medium')).toBe(true);
  });

  it('renders __indicator with role="status"', () => {
    const { container } = render(<ChronixSpin />);
    const indicator = container.querySelector('.cx-ui-spin__indicator')!;
    expect(indicator).not.toBeNull();
    expect(indicator.getAttribute('role')).toBe('status');
    expect(indicator.getAttribute('aria-label')).toBe('loading');
  });

  it('omits __description by default (undefined description)', () => {
    const { container } = render(<ChronixSpin />);
    expect(container.querySelector('.cx-ui-spin__description')).toBeNull();
    expect(
      container.querySelector('div.cx-ui-spin')!.classList.contains('cx-ui-spin--with-description'),
    ).toBe(false);
  });
});

describe('ChronixSpin (react) — description prop', () => {
  it('renders __description and adds --with-description when description is supplied', () => {
    const { container } = render(<ChronixSpin description="Loading" />);
    const root = container.querySelector('div.cx-ui-spin')!;
    expect(root.classList.contains('cx-ui-spin--with-description')).toBe(true);
    expect(container.querySelector('.cx-ui-spin__description')!.textContent).toBe('Loading');
  });

  it('uses description as the indicator aria-label when supplied', () => {
    const { container } = render(<ChronixSpin description="Loading data" />);
    expect(container.querySelector('.cx-ui-spin__indicator')!.getAttribute('aria-label')).toBe(
      'Loading data',
    );
  });
});

describe('ChronixSpin (react) — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)('size="%s" adds the matching modifier', (s) => {
    const { container } = render(<ChronixSpin size={s} />);
    expect(container.querySelector('div.cx-ui-spin')!.classList.contains(`cx-ui-spin--${s}`)).toBe(
      true,
    );
  });
});

describe('ChronixSpin (react) — show prop', () => {
  it('adds --hidden when show=false', () => {
    const { container } = render(<ChronixSpin show={false} />);
    expect(
      container.querySelector('div.cx-ui-spin')!.classList.contains('cx-ui-spin--hidden'),
    ).toBe(true);
  });

  it('omits --hidden when show=true (default)', () => {
    const { container } = render(<ChronixSpin />);
    expect(
      container.querySelector('div.cx-ui-spin')!.classList.contains('cx-ui-spin--hidden'),
    ).toBe(false);
  });
});

describe('ChronixSpin (react) — CSS injection', () => {
  it('mounting ensures the chronix-spin stylesheet is in document.head', () => {
    render(<ChronixSpin />);
    expect(document.head.querySelector('style[data-chronix-ui="spin"]')).not.toBeNull();
  });
});

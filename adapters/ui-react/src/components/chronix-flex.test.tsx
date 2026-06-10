import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixFlex } from './chronix-flex.js';

describe('ChronixFlex (react) — default rendering', () => {
  it('renders a <div> with base + direction-row + wrap-nowrap', () => {
    const { container } = render(<ChronixFlex />);
    const root = container.querySelector('div.cx-ui-flex')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-flex--direction-row')).toBe(true);
    expect(root.classList.contains('cx-ui-flex--wrap-nowrap')).toBe(true);
  });

  it('omits inline-style gap when gap prop is undefined', () => {
    const { container } = render(<ChronixFlex />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-flex')!;
    expect(root.style.gap).toBe('');
  });

  it('renders children', () => {
    const { container } = render(
      <ChronixFlex>
        <span className="child">child</span>
      </ChronixFlex>,
    );
    expect(container.querySelector('.child')!.textContent).toBe('child');
  });
});

describe('ChronixFlex (react) — direction prop', () => {
  it.each(['row', 'column', 'row-reverse', 'column-reverse'] as const)(
    'direction="%s" adds the matching modifier',
    (d) => {
      const { container } = render(<ChronixFlex direction={d} />);
      expect(
        container.querySelector('div.cx-ui-flex')!.classList.contains(`cx-ui-flex--direction-${d}`),
      ).toBe(true);
    },
  );
});

describe('ChronixFlex (react) — wrap prop', () => {
  it.each(['nowrap', 'wrap', 'wrap-reverse'] as const)(
    'wrap="%s" adds the matching modifier',
    (w) => {
      const { container } = render(<ChronixFlex wrap={w} />);
      expect(
        container.querySelector('div.cx-ui-flex')!.classList.contains(`cx-ui-flex--wrap-${w}`),
      ).toBe(true);
    },
  );
});

describe('ChronixFlex (react) — gap prop', () => {
  it.each(['small', 'medium', 'large'] as const)('gap="%s" applies token-fallback CSS-var', (g) => {
    const { container } = render(<ChronixFlex gap={g} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-flex')!;
    expect(root.style.gap).toContain(`--cx-ui-space-gap-${g}`);
  });

  it('numeric gap applies inline style "gap: Npx"', () => {
    const { container } = render(<ChronixFlex gap={16} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-flex')!;
    expect(root.style.gap).toBe('16px');
  });
});

describe('ChronixFlex (react) — align + justify + inline', () => {
  it('align="center" adds the matching modifier', () => {
    const { container } = render(<ChronixFlex align="center" />);
    expect(
      container.querySelector('div.cx-ui-flex')!.classList.contains('cx-ui-flex--align-center'),
    ).toBe(true);
  });

  it('justify="space-around" adds the matching modifier', () => {
    const { container } = render(<ChronixFlex justify="space-around" />);
    expect(
      container
        .querySelector('div.cx-ui-flex')!
        .classList.contains('cx-ui-flex--justify-space-around'),
    ).toBe(true);
  });

  it('adds --inline when inline=true', () => {
    const { container } = render(<ChronixFlex inline />);
    expect(
      container.querySelector('div.cx-ui-flex')!.classList.contains('cx-ui-flex--inline'),
    ).toBe(true);
  });
});

describe('ChronixFlex (react) — CSS injection', () => {
  it('mounting ensures the chronix-flex stylesheet is in document.head', () => {
    render(<ChronixFlex />);
    expect(document.head.querySelector('style[data-chronix-ui="flex"]')).not.toBeNull();
  });
});

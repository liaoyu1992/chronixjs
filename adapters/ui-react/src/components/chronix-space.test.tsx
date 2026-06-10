import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixSpace } from './chronix-space.js';

describe('ChronixSpace (react) — default rendering', () => {
  it('renders a <div> with base + wrap class', () => {
    const { container } = render(<ChronixSpace />);
    const root = container.querySelector('div.cx-ui-space')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-space--wrap')).toBe(true);
  });

  it('applies inline style gap from the medium token default', () => {
    const { container } = render(<ChronixSpace />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-space')!;
    expect(root.style.gap).toBe('var(--cx-ui-space-gap-medium, 12px)');
  });

  it('renders children', () => {
    const { container } = render(
      <ChronixSpace>
        <span className="child">child</span>
      </ChronixSpace>,
    );
    expect(container.querySelector('.child')!.textContent).toBe('child');
  });
});

describe('ChronixSpace (react) — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)('size="%s" produces token-fallback gap', (s) => {
    const { container } = render(<ChronixSpace size={s} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-space')!;
    expect(root.style.gap).toContain(`--cx-ui-space-gap-${s}`);
  });

  it('numeric size applies inline style "gap: Npx"', () => {
    const { container } = render(<ChronixSpace size={20} />);
    const root = container.querySelector<HTMLElement>('div.cx-ui-space')!;
    expect(root.style.gap).toBe('20px');
  });
});

describe('ChronixSpace (react) — modifiers', () => {
  it('adds --vertical when vertical=true', () => {
    const { container } = render(<ChronixSpace vertical />);
    expect(
      container.querySelector('div.cx-ui-space')!.classList.contains('cx-ui-space--vertical'),
    ).toBe(true);
  });

  it('omits --wrap when wrap=false', () => {
    const { container } = render(<ChronixSpace wrap={false} />);
    expect(
      container.querySelector('div.cx-ui-space')!.classList.contains('cx-ui-space--wrap'),
    ).toBe(false);
  });

  it('adds --inline when inline=true', () => {
    const { container } = render(<ChronixSpace inline />);
    expect(
      container.querySelector('div.cx-ui-space')!.classList.contains('cx-ui-space--inline'),
    ).toBe(true);
  });

  it.each(['start', 'center', 'end', 'baseline', 'stretch'] as const)(
    'align="%s" adds the matching modifier',
    (a) => {
      const { container } = render(<ChronixSpace align={a} />);
      expect(
        container.querySelector('div.cx-ui-space')!.classList.contains(`cx-ui-space--align-${a}`),
      ).toBe(true);
    },
  );

  it('justify="space-between" adds the matching modifier', () => {
    const { container } = render(<ChronixSpace justify="space-between" />);
    expect(
      container
        .querySelector('div.cx-ui-space')!
        .classList.contains('cx-ui-space--justify-space-between'),
    ).toBe(true);
  });
});

describe('ChronixSpace (react) — CSS injection', () => {
  it('mounting ensures the chronix-space stylesheet is in document.head', () => {
    render(<ChronixSpace />);
    expect(document.head.querySelector('style[data-chronix-ui="space"]')).not.toBeNull();
  });
});

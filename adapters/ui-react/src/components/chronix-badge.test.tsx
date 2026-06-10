import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixBadge } from './chronix-badge.js';

/**
 * Phase 14 (2026-06-02) — Badge mount tests (react). Verbatim port
 * of the vue3 Badge suite to `@testing-library/react`.
 */

describe('ChronixBadge (react) — standalone mode (no child)', () => {
  it('renders root + __sup with --standalone modifier when no children supplied', () => {
    const { container } = render(<ChronixBadge value={5} />);
    const root = container.querySelector('span.cx-ui-badge')!;
    expect(root.tagName).toBe('SPAN');
    expect(root.classList.contains('cx-ui-badge--standalone')).toBe(true);
    const sup = container.querySelector('.cx-ui-badge__sup')!;
    expect(sup).not.toBeNull();
    expect(sup.textContent).toBe('5');
  });
});

describe('ChronixBadge (react) — wrapped mode (children)', () => {
  it('renders children + __sup overlay, NO --standalone modifier', () => {
    const { container } = render(
      <ChronixBadge value={3}>
        <span className="avatar">A</span>
      </ChronixBadge>,
    );
    expect(
      container.querySelector('span.cx-ui-badge')!.classList.contains('cx-ui-badge--standalone'),
    ).toBe(false);
    expect(container.querySelector('.avatar')).not.toBeNull();
    expect(container.querySelector('.cx-ui-badge__sup')!.textContent).toBe('3');
  });
});

describe('ChronixBadge (react) — value + max truncation', () => {
  it('renders numeric value verbatim when below max', () => {
    const { container } = render(<ChronixBadge value={5} max={99} />);
    expect(container.querySelector('.cx-ui-badge__sup')!.textContent).toBe('5');
  });

  it('truncates numeric value above max to `${max}+`', () => {
    const { container } = render(<ChronixBadge value={999} max={99} />);
    expect(container.querySelector('.cx-ui-badge__sup')!.textContent).toBe('99+');
  });

  it('passes string values through verbatim regardless of max', () => {
    const { container } = render(<ChronixBadge value="NEW" max={5} />);
    expect(container.querySelector('.cx-ui-badge__sup')!.textContent).toBe('NEW');
  });

  it('renders empty sup when value is undefined and dot is false', () => {
    const { container } = render(<ChronixBadge />);
    expect(container.querySelector('.cx-ui-badge__sup')!.textContent).toBe('');
  });
});

describe('ChronixBadge (react) — dot mode', () => {
  it('dot={true} adds --dot modifier and suppresses displayed value', () => {
    const { container } = render(<ChronixBadge dot value={42} />);
    const sup = container.querySelector('.cx-ui-badge__sup')!;
    expect(sup.classList.contains('cx-ui-badge__sup--dot')).toBe(true);
    expect(sup.textContent).toBe('');
  });
});

describe('ChronixBadge (react) — type prop', () => {
  it.each(['default', 'success', 'warning', 'error', 'info'] as const)(
    'type="%s" adds the matching modifier on __sup',
    (t) => {
      const { container } = render(<ChronixBadge type={t} />);
      expect(
        container.querySelector('.cx-ui-badge__sup')!.classList.contains(`cx-ui-badge__sup--${t}`),
      ).toBe(true);
    },
  );
});

describe('ChronixBadge (react) — processing + show modifiers', () => {
  it('processing={true} adds --processing modifier on __sup', () => {
    const { container } = render(<ChronixBadge processing />);
    expect(
      container
        .querySelector('.cx-ui-badge__sup')!
        .classList.contains('cx-ui-badge__sup--processing'),
    ).toBe(true);
  });

  it('show={false} adds --hidden modifier on __sup', () => {
    const { container } = render(<ChronixBadge show={false} />);
    expect(
      container.querySelector('.cx-ui-badge__sup')!.classList.contains('cx-ui-badge__sup--hidden'),
    ).toBe(true);
  });
});

describe('ChronixBadge (react) — CSS injection', () => {
  it('mounting any badge ensures the chronix-badge stylesheet is in document.head', () => {
    render(<ChronixBadge />);
    const style = document.head.querySelector('style[data-chronix-ui="badge"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-badge');
  });

  it('multiple mounts inject only one stylesheet (idempotent)', () => {
    render(<ChronixBadge />);
    render(<ChronixBadge />);
    render(<ChronixBadge />);
    const styles = document.head.querySelectorAll('style[data-chronix-ui="badge"]');
    expect(styles.length).toBe(1);
  });
});

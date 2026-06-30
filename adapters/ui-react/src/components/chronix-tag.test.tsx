import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChronixUIProvider } from '../providers/chronix-ui-provider.js';

import { ChronixTag } from './chronix-tag.js';

/**
 * — Tag mount tests (react). Verbatim port of
 * the vue3 Tag suite to `@testing-library/react`.
 */

describe('ChronixTag (react) — default rendering', () => {
  it('renders a <span> with base + default-type + bordered + medium classes', () => {
    const { container } = render(<ChronixTag>Hello</ChronixTag>);
    const span = container.querySelector('span.cx-ui-tag')!;
    expect(span.tagName).toBe('SPAN');
    expect(span.classList.contains('cx-ui-tag--default')).toBe(true);
    expect(span.classList.contains('cx-ui-tag--medium')).toBe(true);
    expect(span.classList.contains('cx-ui-tag--bordered')).toBe(true);
  });

  it('renders children content as tag label', () => {
    const { container } = render(<ChronixTag>New</ChronixTag>);
    expect(container.querySelector('span.cx-ui-tag')!.textContent).toBe('New');
  });
});

describe('ChronixTag (react) — type prop', () => {
  it.each(['default', 'primary', 'info', 'success', 'warning', 'error'] as const)(
    'type="%s" adds the corresponding modifier class',
    (t) => {
      const { container } = render(<ChronixTag type={t} />);
      expect(container.querySelector('span.cx-ui-tag')!.classList.contains(`cx-ui-tag--${t}`)).toBe(
        true,
      );
    },
  );
});

describe('ChronixTag (react) — size prop', () => {
  it.each(['small', 'medium', 'large'] as const)(
    'size="%s" adds the corresponding modifier',
    (s) => {
      const { container } = render(<ChronixTag size={s} />);
      expect(container.querySelector('span.cx-ui-tag')!.classList.contains(`cx-ui-tag--${s}`)).toBe(
        true,
      );
    },
  );

  it('falls back to context size when size prop is omitted', () => {
    const { container } = render(<ChronixTag />);
    expect(container.querySelector('span.cx-ui-tag')!.classList.contains('cx-ui-tag--medium')).toBe(
      true,
    );
  });
});

describe('ChronixTag (react) — bordered / round / closable modifiers', () => {
  it('bordered={false} removes --bordered class', () => {
    const { container } = render(<ChronixTag bordered={false} />);
    expect(
      container.querySelector('span.cx-ui-tag')!.classList.contains('cx-ui-tag--bordered'),
    ).toBe(false);
  });

  it('round={true} adds --round class', () => {
    const { container } = render(<ChronixTag round />);
    expect(container.querySelector('span.cx-ui-tag')!.classList.contains('cx-ui-tag--round')).toBe(
      true,
    );
  });

  it('closable={true} renders the __close button + adds --closable modifier', () => {
    const { container } = render(<ChronixTag closable />);
    expect(
      container.querySelector('span.cx-ui-tag')!.classList.contains('cx-ui-tag--closable'),
    ).toBe(true);
    const close = container.querySelector('.cx-ui-tag__close')!;
    expect(close).not.toBeNull();
    expect(close.getAttribute('aria-label')).toBe('Close');
  });
});

describe('ChronixTag (react) — disabled prop', () => {
  it('disabled={true} adds --disabled class', () => {
    const { container } = render(<ChronixTag disabled />);
    expect(
      container.querySelector('span.cx-ui-tag')!.classList.contains('cx-ui-tag--disabled'),
    ).toBe(true);
  });

  it('inherits disabled from <ChronixUIProvider disabled>', () => {
    const { container } = render(
      <ChronixUIProvider disabled>
        <ChronixTag />
      </ChronixUIProvider>,
    );
    expect(
      container.querySelector('span.cx-ui-tag')!.classList.contains('cx-ui-tag--disabled'),
    ).toBe(true);
  });
});

describe('ChronixTag (react) — close event', () => {
  it('invokes onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    const { container } = render(<ChronixTag closable onClose={onClose} />);
    fireEvent.click(container.querySelector('.cx-ui-tag__close')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('suppresses onClose when disabled', () => {
    const onClose = vi.fn();
    const { container } = render(<ChronixTag closable disabled onClose={onClose} />);
    fireEvent.click(container.querySelector('.cx-ui-tag__close')!);
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('ChronixTag (react) — CSS injection', () => {
  it('mounting any tag ensures the chronix-tag stylesheet is in document.head', () => {
    render(<ChronixTag />);
    const style = document.head.querySelector('style[data-chronix-ui="tag"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-tag');
  });

  it('multiple mounts inject only one stylesheet (idempotent)', () => {
    render(<ChronixTag />);
    render(<ChronixTag />);
    render(<ChronixTag />);
    const styles = document.head.querySelectorAll('style[data-chronix-ui="tag"]');
    expect(styles.length).toBe(1);
  });
});

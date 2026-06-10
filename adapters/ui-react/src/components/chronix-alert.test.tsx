import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChronixAlert } from './chronix-alert.js';

describe('ChronixAlert (react) — default rendering', () => {
  it('renders a <div role="alert"> with base + default + bordered classes', () => {
    const { container } = render(<ChronixAlert>Body</ChronixAlert>);
    const root = container.querySelector('div.cx-ui-alert')!;
    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('role')).toBe('alert');
    expect(root.classList.contains('cx-ui-alert--default')).toBe(true);
    expect(root.classList.contains('cx-ui-alert--bordered')).toBe(true);
  });

  it('renders children inside __content', () => {
    const { container } = render(<ChronixAlert>Hello</ChronixAlert>);
    expect(container.querySelector('.cx-ui-alert__content')!.textContent).toBe('Hello');
  });

  it('omits __content when no children supplied', () => {
    const { container } = render(<ChronixAlert />);
    expect(container.querySelector('.cx-ui-alert__content')).toBeNull();
  });
});

describe('ChronixAlert (react) — type prop', () => {
  it.each(['default', 'info', 'success', 'warning', 'error'] as const)(
    'type="%s" adds the matching modifier',
    (t) => {
      const { container } = render(<ChronixAlert type={t} />);
      expect(
        container.querySelector('div.cx-ui-alert')!.classList.contains(`cx-ui-alert--${t}`),
      ).toBe(true);
    },
  );
});

describe('ChronixAlert (react) — title prop', () => {
  it('renders __title when title is set', () => {
    const { container } = render(<ChronixAlert title="Heads up" />);
    expect(
      container.querySelector('div.cx-ui-alert')!.classList.contains('cx-ui-alert--with-title'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-alert__title')!.textContent).toBe('Heads up');
  });

  it('omits __title when title is undefined', () => {
    const { container } = render(<ChronixAlert />);
    expect(
      container.querySelector('div.cx-ui-alert')!.classList.contains('cx-ui-alert--with-title'),
    ).toBe(false);
    expect(container.querySelector('.cx-ui-alert__title')).toBeNull();
  });
});

describe('ChronixAlert (react) — closable + close event', () => {
  it('closable={true} renders __close button + invokes onClose on click', () => {
    const onClose = vi.fn();
    const { container } = render(<ChronixAlert closable onClose={onClose} />);
    expect(
      container.querySelector('div.cx-ui-alert')!.classList.contains('cx-ui-alert--closable'),
    ).toBe(true);
    const close = container.querySelector('.cx-ui-alert__close')!;
    expect(close).not.toBeNull();
    fireEvent.click(close);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closable={false} (default) omits the close button', () => {
    const { container } = render(<ChronixAlert />);
    expect(container.querySelector('.cx-ui-alert__close')).toBeNull();
  });
});

describe('ChronixAlert (react) — bordered prop', () => {
  it('bordered={false} removes --bordered modifier', () => {
    const { container } = render(<ChronixAlert bordered={false} />);
    expect(
      container.querySelector('div.cx-ui-alert')!.classList.contains('cx-ui-alert--bordered'),
    ).toBe(false);
  });
});

describe('ChronixAlert (react) — CSS injection', () => {
  it('mounting an alert ensures the chronix-alert stylesheet is in document.head', () => {
    render(<ChronixAlert />);
    expect(document.head.querySelector('style[data-chronix-ui="alert"]')).not.toBeNull();
  });
});

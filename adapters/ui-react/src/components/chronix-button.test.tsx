import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChronixUIProvider } from '../providers/chronix-ui-provider.js';

import { ChronixButton } from './chronix-button.js';

/**
 * — react port of the 21-case vue3 mount
 * test suite. Same assertions on DOM shape + class set + ARIA + event
 * suppression; the only differences are React idioms (`onClick`
 * callback prop vs `@click` emit; `children` vs default slot;
 * `@testing-library/react`'s API vs `@vue/test-utils`'s). Parity-by-
 * port: any divergence here is a chronix-ui regression, not a React-
 * isms artifact.
 */

describe('ChronixButton (react) — default rendering', () => {
  it('renders a <button> element with the base class', () => {
    const { container } = render(<ChronixButton>Click me</ChronixButton>);
    const btn = container.querySelector('button')!;
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.classList.contains('cx-ui-button')).toBe(true);
  });

  it('renders the default variant + medium size + button htmlType', () => {
    const { container } = render(<ChronixButton />);
    const btn = container.querySelector('button')!;
    expect(btn.classList.contains('cx-ui-button--default')).toBe(true);
    expect(btn.classList.contains('cx-ui-button--medium')).toBe(true);
    expect(btn.getAttribute('type')).toBe('button');
  });

  it('renders children content as button label', () => {
    const { container } = render(<ChronixButton>Submit</ChronixButton>);
    expect(container.querySelector('button')!.textContent).toBe('Submit');
  });

  it('renders complex children content (multiple nodes)', () => {
    const { container } = render(
      <ChronixButton>
        <span>A</span>
        <span>B</span>
      </ChronixButton>,
    );
    expect(container.querySelector('button')!.textContent).toBe('AB');
  });
});

describe('ChronixButton (react) — variant prop', () => {
  it('primary variant adds --primary class', () => {
    const { container } = render(<ChronixButton variant="primary" />);
    const btn = container.querySelector('button')!;
    expect(btn.classList.contains('cx-ui-button--primary')).toBe(true);
    expect(btn.classList.contains('cx-ui-button--default')).toBe(false);
  });
});

describe('ChronixButton (react) — size prop', () => {
  it('size="small" applies --small class', () => {
    const { container } = render(<ChronixButton size="small" />);
    expect(container.querySelector('button')!.classList.contains('cx-ui-button--small')).toBe(true);
  });

  it('size="large" applies --large class', () => {
    const { container } = render(<ChronixButton size="large" />);
    expect(container.querySelector('button')!.classList.contains('cx-ui-button--large')).toBe(true);
  });

  it('size unspecified falls back to context size (default medium)', () => {
    const { container } = render(<ChronixButton />);
    expect(container.querySelector('button')!.classList.contains('cx-ui-button--medium')).toBe(
      true,
    );
  });
});

describe('ChronixButton (react) — disabled prop', () => {
  it('disabled={true} adds --disabled class + disabled attribute', () => {
    const { container } = render(<ChronixButton disabled />);
    const btn = container.querySelector('button')!;
    expect(btn.classList.contains('cx-ui-button--disabled')).toBe(true);
    expect(btn.hasAttribute('disabled')).toBe(true);
    expect(btn.getAttribute('aria-disabled')).toBe('true');
  });

  it('disabled={false} (default) does not add --disabled class', () => {
    const { container } = render(<ChronixButton />);
    const btn = container.querySelector('button')!;
    expect(btn.classList.contains('cx-ui-button--disabled')).toBe(false);
    expect(btn.getAttribute('aria-disabled')).toBeNull();
  });
});

describe('ChronixButton (react) — block prop', () => {
  it('block={true} adds --block class', () => {
    const { container } = render(<ChronixButton block />);
    expect(container.querySelector('button')!.classList.contains('cx-ui-button--block')).toBe(true);
  });
});

describe('ChronixButton (react) — htmlType prop', () => {
  it('htmlType="submit" sets type attribute', () => {
    const { container } = render(<ChronixButton htmlType="submit" />);
    expect(container.querySelector('button')!.getAttribute('type')).toBe('submit');
  });

  it('htmlType="reset" sets type attribute', () => {
    const { container } = render(<ChronixButton htmlType="reset" />);
    expect(container.querySelector('button')!.getAttribute('type')).toBe('reset');
  });
});

describe('ChronixButton (react) — click event', () => {
  it('invokes onClick on user click', () => {
    const onClick = vi.fn();
    const { container } = render(<ChronixButton onClick={onClick} />);
    fireEvent.click(container.querySelector('button')!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('suppresses onClick when disabled', () => {
    const onClick = vi.fn();
    const { container } = render(<ChronixButton disabled onClick={onClick} />);
    fireEvent.click(container.querySelector('button')!);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('ChronixButton (react) — context integration (ChronixUIProvider)', () => {
  it('inherits size from <ChronixUIProvider size="large">', () => {
    const { container } = render(
      <ChronixUIProvider size="large">
        <ChronixButton />
      </ChronixUIProvider>,
    );
    expect(container.querySelector('button')!.classList.contains('cx-ui-button--large')).toBe(true);
  });

  it('own size prop overrides provider size', () => {
    const { container } = render(
      <ChronixUIProvider size="large">
        <ChronixButton size="small" />
      </ChronixUIProvider>,
    );
    expect(container.querySelector('button')!.classList.contains('cx-ui-button--small')).toBe(true);
  });

  it('inherits disabled from <ChronixUIProvider disabled>', () => {
    const { container } = render(
      <ChronixUIProvider disabled>
        <ChronixButton />
      </ChronixUIProvider>,
    );
    expect(container.querySelector('button')!.classList.contains('cx-ui-button--disabled')).toBe(
      true,
    );
  });

  it('provider root carries CSS-var inline styles for theme tokens', () => {
    const { container } = render(
      <ChronixUIProvider>
        <ChronixButton />
      </ChronixUIProvider>,
    );
    const providerRoot = container.querySelector('.cx-ui-provider')!;
    expect(providerRoot).not.toBeNull();
    const styleAttr = providerRoot.getAttribute('style') ?? '';
    expect(styleAttr).toContain('--cx-ui-primary-color');
    expect(styleAttr).toContain('--cx-ui-button-bg-color');
  });
});

describe('ChronixButton (react) — CSS injection', () => {
  it('mounting any button ensures the chronix-button stylesheet is in document.head', () => {
    render(<ChronixButton />);
    const style = document.head.querySelector('style[data-chronix-ui="button"]');
    expect(style).not.toBeNull();
    expect(style!.textContent).toContain('.cx-ui-button');
  });

  it('multiple mounts inject only one stylesheet (idempotent)', () => {
    render(<ChronixButton />);
    render(<ChronixButton />);
    render(<ChronixButton />);
    const styles = document.head.querySelectorAll('style[data-chronix-ui="button"]');
    expect(styles.length).toBe(1);
  });
});

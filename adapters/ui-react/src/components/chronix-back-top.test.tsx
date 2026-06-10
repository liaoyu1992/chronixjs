import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ChronixBackTop } from './chronix-back-top.js';

describe('ChronixBackTop (react)', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });
  });
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when scrollY below threshold', () => {
    const { container } = render(<ChronixBackTop visibilityThreshold={100} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders <button> when scrollY >= threshold', () => {
    (window as unknown as { scrollY: number }).scrollY = 500;
    const { container } = render(<ChronixBackTop visibilityThreshold={100} />);
    const btn = container.firstElementChild as HTMLButtonElement;
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.classList.contains('cx-ui-back-top')).toBe(true);
    expect(btn.type).toBe('button');
  });

  it('applies right + bottom inline styles', () => {
    (window as unknown as { scrollY: number }).scrollY = 500;
    const { container } = render(
      <ChronixBackTop visibilityThreshold={100} right={24} bottom={24} />,
    );
    const btn = container.firstElementChild as HTMLButtonElement;
    expect(btn.style.right).toBe('24px');
    expect(btn.style.bottom).toBe('24px');
  });

  it('emits onClick when button clicked', () => {
    (window as unknown as { scrollY: number }).scrollY = 500;
    const onClick = vi.fn();
    const { container } = render(<ChronixBackTop visibilityThreshold={100} onClick={onClick} />);
    fireEvent.click(container.firstElementChild!);
    expect(onClick).toHaveBeenCalled();
  });

  it('injects the chronix-back-top stylesheet', () => {
    render(<ChronixBackTop />);
    expect(document.head.querySelector('style[data-chronix-ui="back-top"]')).not.toBeNull();
  });
});

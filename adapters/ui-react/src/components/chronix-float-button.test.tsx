import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ChronixFloatButton } from './chronix-float-button.js';

describe('ChronixFloatButton (react)', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a fixed-position circle button (default)', () => {
    const { container } = render(<ChronixFloatButton />);
    const btn = container.querySelector<HTMLElement>('button.cx-ui-float-button')!;
    expect(btn).not.toBeNull();
    expect(btn.classList.contains('cx-ui-float-button--shape-circle')).toBe(true);
    expect(btn.style.position).toBe('fixed');
    expect(btn.style.right).toBe('24px');
    expect(btn.style.bottom).toBe('24px');
  });

  it('switches to primary + square modifiers when configured', () => {
    const { container } = render(<ChronixFloatButton shape="square" type="primary" />);
    const btn = container.querySelector('button.cx-ui-float-button')!;
    expect(btn.classList.contains('cx-ui-float-button--shape-square')).toBe(true);
    expect(btn.classList.contains('cx-ui-float-button--type-primary')).toBe(true);
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<ChronixFloatButton onClick={onClick} />);
    fireEvent.click(container.querySelector('button')!);
    expect(onClick).toHaveBeenCalled();
  });

  it('renders description text inside the button when provided', () => {
    const { container } = render(<ChronixFloatButton description="Help" />);
    expect(container.querySelector('.cx-ui-float-button__description')?.textContent).toBe('Help');
  });

  it('injects the chronix-float-button stylesheet', () => {
    render(<ChronixFloatButton />);
    expect(document.head.querySelector('style[data-chronix-ui="float-button"]')).not.toBeNull();
  });
});

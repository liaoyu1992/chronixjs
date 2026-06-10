import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChronixSwitch } from './chronix-switch.js';

describe('ChronixSwitch (react)', () => {
  it('renders <button role="switch"> with base + --medium', () => {
    const { container } = render(<ChronixSwitch />);
    const root = container.querySelector('.cx-ui-switch')!;
    expect(root.tagName).toBe('BUTTON');
    expect(root.getAttribute('role')).toBe('switch');
    expect(root.getAttribute('aria-checked')).toBe('false');
    expect(root.classList.contains('cx-ui-switch--medium')).toBe(true);
  });

  it('has type=button', () => {
    const { container } = render(<ChronixSwitch />);
    expect(container.querySelector('button')!.getAttribute('type')).toBe('button');
  });

  it('flips aria-checked when checked=true', () => {
    const { container } = render(<ChronixSwitch checked />);
    expect(container.querySelector('button')!.getAttribute('aria-checked')).toBe('true');
    expect(container.querySelector('button')!.classList.contains('cx-ui-switch--checked')).toBe(
      true,
    );
  });

  it('emits onChange on click', () => {
    const onChange = vi.fn();
    const { container } = render(<ChronixSwitch onChange={onChange} />);
    fireEvent.click(container.querySelector('button')!);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('injects the chronix-switch stylesheet', () => {
    render(<ChronixSwitch />);
    expect(document.head.querySelector('style[data-chronix-ui="switch"]')).not.toBeNull();
  });
});

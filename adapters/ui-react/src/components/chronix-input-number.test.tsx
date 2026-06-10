import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChronixInputNumber } from './chronix-input-number.js';

describe('ChronixInputNumber (react)', () => {
  it('renders <div> root with decrement + input + increment', () => {
    const { container } = render(<ChronixInputNumber />);
    expect(container.querySelector('.cx-ui-input-number')!.tagName).toBe('DIV');
    expect(container.querySelector('.cx-ui-input-number__decrement')).not.toBeNull();
    expect(container.querySelector('.cx-ui-input-number__input')).not.toBeNull();
    expect(container.querySelector('.cx-ui-input-number__increment')).not.toBeNull();
  });

  it('stepper buttons are type=button', () => {
    const { container } = render(<ChronixInputNumber />);
    expect(
      container.querySelector('button.cx-ui-input-number__decrement')!.getAttribute('type'),
    ).toBe('button');
  });

  it('emits onChange on increment click with step', () => {
    const onChange = vi.fn();
    const { container } = render(<ChronixInputNumber value={5} step={2} onChange={onChange} />);
    fireEvent.click(container.querySelector('button.cx-ui-input-number__increment')!);
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('renders error row + --invalid', () => {
    const { container } = render(<ChronixInputNumber error="too big" />);
    expect(
      container
        .querySelector('.cx-ui-input-number')!
        .classList.contains('cx-ui-input-number--invalid'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-input-number__error')!.textContent).toBe('too big');
  });

  it('injects the chronix-input-number stylesheet', () => {
    render(<ChronixInputNumber />);
    expect(document.head.querySelector('style[data-chronix-ui="input-number"]')).not.toBeNull();
  });
});

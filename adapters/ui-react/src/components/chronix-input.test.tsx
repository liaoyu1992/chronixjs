import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChronixInput } from './chronix-input.js';

describe('ChronixInput (react)', () => {
  it('renders <div> root with base + --text + --medium', () => {
    const { container } = render(<ChronixInput />);
    const root = container.querySelector('.cx-ui-input')!;
    expect(root.tagName).toBe('DIV');
    expect(root.classList.contains('cx-ui-input--text')).toBe(true);
    expect(root.classList.contains('cx-ui-input--medium')).toBe(true);
  });

  it('renders <textarea> inner when type=textarea', () => {
    const { container } = render(<ChronixInput type="textarea" />);
    expect(container.querySelector('textarea.cx-ui-input__inner')).not.toBeNull();
  });

  it('shows clear button when clearable + value non-empty', () => {
    const { container } = render(
      <ChronixInput
        clearable
        value="hi"
        onChange={() => {
          /* track */
        }}
      />,
    );
    expect(container.querySelector('button.cx-ui-input__clear')).not.toBeNull();
  });

  it('emits onChange with the new value', () => {
    const onChange = vi.fn();
    const { container } = render(<ChronixInput onChange={onChange} />);
    fireEvent.change(container.querySelector('input')!, {
      target: { value: 'typed' },
    });
    expect(onChange).toHaveBeenCalledWith('typed');
  });

  it('renders error row + --invalid', () => {
    const { container } = render(<ChronixInput error="oops" />);
    expect(
      container.querySelector('.cx-ui-input')!.classList.contains('cx-ui-input--invalid'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-input__error')!.textContent).toBe('oops');
  });

  it('injects the chronix-input stylesheet', () => {
    render(<ChronixInput />);
    expect(document.head.querySelector('style[data-chronix-ui="input"]')).not.toBeNull();
  });
});

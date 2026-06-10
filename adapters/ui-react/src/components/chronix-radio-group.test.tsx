import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChronixRadioGroup } from './chronix-radio-group.js';

import type { RadioOption } from '@chronixjs/ui';

const OPTIONS: readonly RadioOption[] = [
  { key: 'a', label: 'Apple', value: 'a', disabled: false },
  { key: 'b', label: 'Banana', value: 'b', disabled: false },
];

describe('ChronixRadioGroup (react)', () => {
  it('renders <div role=radiogroup> with one radio per option', () => {
    const { container } = render(<ChronixRadioGroup options={OPTIONS} />);
    const root = container.querySelector('.cx-ui-radio-group')!;
    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('role')).toBe('radiogroup');
    expect(container.querySelectorAll('label.cx-ui-radio')).toHaveLength(2);
  });

  it('marks selected radio with --checked', () => {
    const { container } = render(<ChronixRadioGroup options={OPTIONS} value="b" />);
    const radios = container.querySelectorAll('label.cx-ui-radio');
    expect(radios[1]!.classList.contains('cx-ui-radio--checked')).toBe(true);
  });

  it('emits onChange when a radio is clicked', () => {
    const onChange = vi.fn();
    const { container } = render(<ChronixRadioGroup options={OPTIONS} onChange={onChange} />);
    fireEvent.click(container.querySelectorAll('label.cx-ui-radio')[1]!);
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('renders error row + --invalid', () => {
    const { container } = render(<ChronixRadioGroup options={OPTIONS} error="pick one" />);
    expect(
      container
        .querySelector('.cx-ui-radio-group')!
        .classList.contains('cx-ui-radio-group--invalid'),
    ).toBe(true);
    expect(container.querySelector('.cx-ui-radio-group__error')!.textContent).toBe('pick one');
  });

  it('injects the chronix-radio stylesheet', () => {
    render(<ChronixRadioGroup options={OPTIONS} />);
    expect(document.head.querySelector('style[data-chronix-ui="radio"]')).not.toBeNull();
  });
});

import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChronixCheckbox } from './chronix-checkbox.js';

describe('ChronixCheckbox (react)', () => {
  it('renders <label> with base class', () => {
    const { container } = render(<ChronixCheckbox />);
    const root = container.querySelector('.cx-ui-checkbox')!;
    expect(root.tagName).toBe('LABEL');
  });

  it('emits onChange on click', () => {
    const onChange = vi.fn();
    const { container } = render(<ChronixCheckbox onChange={onChange} />);
    fireEvent.click(container.querySelector('label')!);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders svg check when checked=true', () => {
    const { container } = render(<ChronixCheckbox checked />);
    expect(container.querySelector('svg.cx-ui-checkbox__icon')).not.toBeNull();
    expect(
      container.querySelector('.cx-ui-checkbox')!.classList.contains('cx-ui-checkbox--checked'),
    ).toBe(true);
  });

  it('prefers indeterminate over checked icon', () => {
    const { container } = render(<ChronixCheckbox checked indeterminate />);
    expect(
      container
        .querySelector('.cx-ui-checkbox')!
        .classList.contains('cx-ui-checkbox--indeterminate'),
    ).toBe(true);
    expect(container.querySelector('span.cx-ui-checkbox__icon')).not.toBeNull();
  });

  it('injects the chronix-checkbox stylesheet', () => {
    render(<ChronixCheckbox />);
    expect(document.head.querySelector('style[data-chronix-ui="checkbox"]')).not.toBeNull();
  });
});

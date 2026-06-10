import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixInputOtp } from './chronix-input-otp.js';

describe('ChronixInputOtp (react)', () => {
  it('renders <div> root with default 6 cells', () => {
    const { container } = render(<ChronixInputOtp />);
    expect(container.querySelector('.cx-ui-otp')!.tagName).toBe('DIV');
    expect(container.querySelectorAll('input.cx-ui-otp__cell')).toHaveLength(6);
  });

  it('renders custom length cells', () => {
    const { container } = render(<ChronixInputOtp length={4} />);
    expect(container.querySelectorAll('input.cx-ui-otp__cell')).toHaveLength(4);
  });

  it('populates cells from value', () => {
    const { container } = render(
      <ChronixInputOtp
        value="12"
        length={4}
        onChange={() => {
          /* track */
        }}
      />,
    );
    const cells = container.querySelectorAll<HTMLInputElement>('input.cx-ui-otp__cell');
    expect(cells[0]!.value).toBe('1');
    expect(cells[1]!.value).toBe('2');
    expect(cells[2]!.value).toBe('');
  });

  it('renders error row + --invalid', () => {
    const { container } = render(<ChronixInputOtp error="bad" />);
    expect(container.querySelector('.cx-ui-otp')!.classList.contains('cx-ui-otp--invalid')).toBe(
      true,
    );
    expect(container.querySelector('.cx-ui-otp__error')!.textContent).toBe('bad');
  });

  it('injects the chronix-input-otp stylesheet', () => {
    render(<ChronixInputOtp />);
    expect(document.head.querySelector('style[data-chronix-ui="input-otp"]')).not.toBeNull();
  });
});

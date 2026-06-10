import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixRate } from './chronix-rate.js';

describe('ChronixRate (react)', () => {
  it('renders <div> + 5 default stars', () => {
    const { container } = render(<ChronixRate />);
    expect(container.querySelector('.cx-ui-rate')!.tagName).toBe('DIV');
    expect(container.querySelectorAll('button.cx-ui-rate__star')).toHaveLength(5);
  });

  it('respects count prop', () => {
    const { container } = render(<ChronixRate count={7} />);
    expect(container.querySelectorAll('button.cx-ui-rate__star')).toHaveLength(7);
  });

  it('marks --full / --empty per value=3', () => {
    const { container } = render(<ChronixRate value={3} />);
    const stars = container.querySelectorAll('button.cx-ui-rate__star');
    expect(stars[0]!.classList.contains('cx-ui-rate__star--full')).toBe(true);
    expect(stars[3]!.classList.contains('cx-ui-rate__star--empty')).toBe(true);
  });

  it('shows --half when allowHalf + value=2.5', () => {
    const { container } = render(<ChronixRate value={2.5} allowHalf />);
    expect(
      container
        .querySelectorAll('button.cx-ui-rate__star')[2]!
        .classList.contains('cx-ui-rate__star--half'),
    ).toBe(true);
  });

  it('star buttons have type=button', () => {
    const { container } = render(<ChronixRate />);
    container.querySelectorAll('button.cx-ui-rate__star').forEach((b) => {
      expect(b.getAttribute('type')).toBe('button');
    });
  });

  it('injects the chronix-rate stylesheet', () => {
    render(<ChronixRate />);
    expect(document.head.querySelector('style[data-chronix-ui="rate"]')).not.toBeNull();
  });
});

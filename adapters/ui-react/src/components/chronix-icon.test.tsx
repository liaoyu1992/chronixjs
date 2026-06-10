import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixIcon } from './chronix-icon.js';

describe('ChronixIcon (react)', () => {
  it('renders <svg> for registered icon', () => {
    const { container } = render(<ChronixIcon name="check" />);
    const svg = container.querySelector('svg.cx-ui-icon')!;
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('renders missing placeholder for unknown name', () => {
    const { container } = render(<ChronixIcon name="nope" />);
    const root = container.querySelector('.cx-ui-icon')!;
    expect(root.tagName).toBe('SPAN');
    expect(root.classList.contains('cx-ui-icon--missing')).toBe(true);
    expect(root.textContent).toBe('?');
  });

  it('honors size prop', () => {
    const { container } = render(<ChronixIcon name="check" size={32} />);
    const svg = container.querySelector('svg.cx-ui-icon')!;
    expect(svg.getAttribute('width')).toBe('32');
    expect(svg.getAttribute('height')).toBe('32');
  });

  it('injects the stylesheet', () => {
    render(<ChronixIcon name="check" />);
    expect(document.head.querySelector('style[data-chronix-ui="icon"]')).not.toBeNull();
  });
});

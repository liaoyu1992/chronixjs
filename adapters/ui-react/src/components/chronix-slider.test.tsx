import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixSlider } from './chronix-slider.js';

describe('ChronixSlider (React)', () => {
  it('renders root element with correct class', () => {
    render(<ChronixSlider />);
    const root = screen.getByTestId('slider-root');
    expect(root).toBeTruthy();
    expect(root.classList.contains('cx-ui-slider')).toBe(true);
  });

  it('renders track and thumb elements', () => {
    render(<ChronixSlider />);
    expect(screen.getByTestId('slider-track')).toBeTruthy();
    expect(screen.getByTestId('slider-thumb')).toBeTruthy();
  });

  it('renders marks when provided', () => {
    render(
      <ChronixSlider
        marks={{ 0: { label: 'Start' }, 50: { label: 'Mid' }, 100: { label: 'End' } }}
      />,
    );
    expect(screen.getByTestId('slider-mark-0')).toBeTruthy();
    expect(screen.getByTestId('slider-mark-50')).toBeTruthy();
    expect(screen.getByTestId('slider-mark-100')).toBeTruthy();
  });

  it('adds disabled class when disabled', () => {
    render(<ChronixSlider disabled />);
    const root = screen.getByTestId('slider-root');
    expect(root.classList.contains('cx-ui-slider--disabled')).toBe(true);
  });
});

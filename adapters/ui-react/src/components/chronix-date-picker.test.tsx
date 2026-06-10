import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixDatePicker } from './chronix-date-picker.js';

describe('ChronixDatePicker (React)', () => {
  it('renders root element with correct class', () => {
    render(<ChronixDatePicker />);
    const root = screen.getByTestId('date-picker-root');
    expect(root).toBeTruthy();
    expect(root.classList.contains('cx-ui-date-picker')).toBe(true);
  });

  it('shows placeholder when no value', () => {
    render(<ChronixDatePicker placeholder="Pick a date" />);
    expect(screen.getByText('Pick a date')).toBeTruthy();
  });

  it('shows formatted value when value is set', () => {
    const date = new Date(2026, 5, 15);
    render(<ChronixDatePicker value={date} format="yyyy-MM-dd" />);
    expect(screen.getByText('2026-06-15')).toBeTruthy();
  });

  it('adds disabled class when disabled', () => {
    render(<ChronixDatePicker disabled />);
    const root = screen.getByTestId('date-picker-root');
    expect(root.classList.contains('cx-ui-date-picker--disabled')).toBe(true);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixTimePicker } from './chronix-time-picker.js';

describe('ChronixTimePicker (React)', () => {
  it('renders root element with correct class', () => {
    render(<ChronixTimePicker />);
    const root = screen.getByTestId('time-picker-root');
    expect(root).toBeTruthy();
    expect(root.classList.contains('cx-ui-time-picker')).toBe(true);
  });

  it('shows placeholder when no value', () => {
    render(<ChronixTimePicker placeholder="Pick time" />);
    expect(screen.getByText('Pick time')).toBeTruthy();
  });

  it('shows formatted value when value is set', () => {
    const date = new Date(2026, 5, 15, 14, 30, 0);
    render(<ChronixTimePicker value={date} format="HH:mm:ss" />);
    expect(screen.getByText('14:30:00')).toBeTruthy();
  });

  it('adds disabled class when disabled', () => {
    render(<ChronixTimePicker disabled />);
    const root = screen.getByTestId('time-picker-root');
    expect(root.classList.contains('cx-ui-time-picker--disabled')).toBe(true);
  });
});

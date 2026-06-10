import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ChronixCalendar } from './chronix-calendar.js';

describe('ChronixCalendar (React)', () => {
  it('renders root element with correct class', () => {
    render(<ChronixCalendar />);
    const root = screen.getByTestId('calendar-root');
    expect(root).toBeTruthy();
    expect(root.classList.contains('cx-ui-calendar')).toBe(true);
  });

  it('renders weekday headers', () => {
    render(<ChronixCalendar />);
    const weekdays = document.querySelectorAll('.cx-ui-calendar__weekday');
    expect(weekdays).toHaveLength(7);
  });

  it('renders day cells (42 in grid)', () => {
    render(<ChronixCalendar />);
    const days = document.querySelectorAll('.cx-ui-calendar__day');
    expect(days).toHaveLength(42);
  });
});

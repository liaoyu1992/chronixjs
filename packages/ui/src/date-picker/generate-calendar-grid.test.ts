import { describe, expect, it } from 'vitest';

import { generateCalendarGrid } from './generate-calendar-grid.js';

describe('generateCalendarGrid', () => {
  it('produces exactly 42 cells', () => {
    const grid = generateCalendarGrid({ year: 2026, month: 0, firstDayOfWeek: 0 });
    expect(grid).toHaveLength(42);
  });

  it('marks cells outside the target month as isCurrentMonth=false', () => {
    // January 2026, starts on Thursday (day 4)
    const grid = generateCalendarGrid({ year: 2026, month: 0, firstDayOfWeek: 0 });
    // First cell should be Dec 28, 2025 (Sunday before Jan 1)
    expect(grid[0]!.isCurrentMonth).toBe(false);
    expect(grid[0]!.dayOfMonth).toBe(28);
  });

  it('marks today correctly', () => {
    const today = new Date(2026, 5, 5); // June 5, 2026
    const grid = generateCalendarGrid({ year: 2026, month: 5, firstDayOfWeek: 0, today });
    const todayCells = grid.filter((c) => c.isToday);
    expect(todayCells).toHaveLength(1);
    expect(todayCells[0]!.dayOfMonth).toBe(5);
  });

  it('respects firstDayOfWeek=1 (Monday start)', () => {
    // January 2026: Jan 1 is Thursday
    // With firstDayOfWeek=1 (Monday), grid starts Mon Dec 29
    const grid = generateCalendarGrid({ year: 2026, month: 0, firstDayOfWeek: 1 });
    expect(grid[0]!.dayOfMonth).toBe(29);
    expect(grid[0]!.isCurrentMonth).toBe(false);
  });

  it('fills all days of the target month', () => {
    // June 2026 has 30 days
    const grid = generateCalendarGrid({ year: 2026, month: 5, firstDayOfWeek: 0 });
    const juneDays = grid.filter((c) => c.isCurrentMonth);
    expect(juneDays).toHaveLength(30);
    expect(juneDays[0]!.dayOfMonth).toBe(1);
    expect(juneDays[juneDays.length - 1]!.dayOfMonth).toBe(30);
  });

  it('handles February in a non-leap year', () => {
    // Feb 2025 has 28 days
    const grid = generateCalendarGrid({ year: 2025, month: 1, firstDayOfWeek: 0 });
    const febDays = grid.filter((c) => c.isCurrentMonth);
    expect(febDays).toHaveLength(28);
  });

  it('handles February in a leap year', () => {
    // Feb 2024 has 29 days
    const grid = generateCalendarGrid({ year: 2024, month: 1, firstDayOfWeek: 0 });
    const febDays = grid.filter((c) => c.isCurrentMonth);
    expect(febDays).toHaveLength(29);
  });
});

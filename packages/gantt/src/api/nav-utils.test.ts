import { describe, expect, it } from 'vitest';

import { formatToolbarTitle, nextAnchor, prevAnchor, todayAnchor } from './nav-utils.js';

import type { AxisRangePlanInput } from '../layout/types.js';

const baseAxisInput = (override: Partial<AxisRangePlanInput>): AxisRangePlanInput => ({
  viewId: 'week',
  anchorDate: new Date(2026, 4, 16),
  viewportWidth: 1200,
  locale: 'zh-CN',
  weekendsVisible: true,
  ...override,
});

describe('prevAnchor / nextAnchor', () => {
  it('shifts day by ±1 day', () => {
    const start = new Date(2026, 4, 16);
    expect(nextAnchor('day', start).toDateString()).toBe(new Date(2026, 4, 17).toDateString());
    expect(prevAnchor('day', start).toDateString()).toBe(new Date(2026, 4, 15).toDateString());
  });

  it('shifts week by ±7 days', () => {
    const start = new Date(2026, 4, 16);
    expect(nextAnchor('week', start).toDateString()).toBe(new Date(2026, 4, 23).toDateString());
    expect(prevAnchor('week', start).toDateString()).toBe(new Date(2026, 4, 9).toDateString());
  });

  it('shifts month by ±1 calendar month', () => {
    expect(nextAnchor('month', new Date(2026, 0, 15)).toDateString()).toBe(
      new Date(2026, 1, 15).toDateString(),
    );
    expect(prevAnchor('month', new Date(2026, 5, 15)).toDateString()).toBe(
      new Date(2026, 4, 15).toDateString(),
    );
  });

  it('rolls month-end through the JS-native setMonth behavior (Jan 31 + 1mo)', () => {
    // Jan 31 + 1 month = Feb 31 → Mar 3 (non-leap) or Mar 2 (leap). 2026 is non-leap.
    const result = nextAnchor('month', new Date(2026, 0, 31));
    expect(result.getMonth()).toBe(2); // March
    expect(result.getDate()).toBeGreaterThanOrEqual(2);
    expect(result.getDate()).toBeLessThanOrEqual(3);
  });

  it('shifts season by ±3 calendar months', () => {
    expect(nextAnchor('season', new Date(2026, 0, 15)).toDateString()).toBe(
      new Date(2026, 3, 15).toDateString(),
    );
    expect(prevAnchor('season', new Date(2026, 9, 15)).toDateString()).toBe(
      new Date(2026, 6, 15).toDateString(),
    );
  });

  it('shifts halfYear by ±6 calendar months', () => {
    expect(nextAnchor('halfYear', new Date(2026, 0, 15)).toDateString()).toBe(
      new Date(2026, 6, 15).toDateString(),
    );
    expect(prevAnchor('halfYear', new Date(2026, 9, 15)).toDateString()).toBe(
      new Date(2026, 3, 15).toDateString(),
    );
  });

  it('shifts year by ±1 calendar year (preserving Feb 29 → Feb 28 on non-leap)', () => {
    expect(nextAnchor('year', new Date(2024, 1, 29)).toDateString()).toBe(
      // Feb 29 2024 + 1y → Feb 29 → rolls to Mar 1 2025 (non-leap)
      new Date(2025, 2, 1).toDateString(),
    );
    expect(prevAnchor('year', new Date(2026, 4, 16)).toDateString()).toBe(
      new Date(2025, 4, 16).toDateString(),
    );
  });

  it('does not mutate the input date', () => {
    const input = new Date(2026, 4, 16);
    const before = input.getTime();
    nextAnchor('week', input);
    prevAnchor('month', input);
    expect(input.getTime()).toBe(before);
  });
});

describe('todayAnchor', () => {
  it('returns a Date at local midnight (00:00:00.000)', () => {
    const today = todayAnchor();
    expect(today.getHours()).toBe(0);
    expect(today.getMinutes()).toBe(0);
    expect(today.getSeconds()).toBe(0);
    expect(today.getMilliseconds()).toBe(0);
  });
});

describe('formatToolbarTitle', () => {
  it('formats day view as YYYY-MM-DD', () => {
    expect(
      formatToolbarTitle(baseAxisInput({ viewId: 'day', anchorDate: new Date(2026, 4, 16) })),
    ).toBe('2026-05-16');
  });

  it('formats month view as YYYY年M月', () => {
    expect(
      formatToolbarTitle(baseAxisInput({ viewId: 'month', anchorDate: new Date(2026, 4, 16) })),
    ).toBe('2026年5月');
  });

  it('formats season view as YYYY Q1–Q4', () => {
    expect(
      formatToolbarTitle(baseAxisInput({ viewId: 'season', anchorDate: new Date(2026, 0, 16) })),
    ).toBe('2026 Q1');
    expect(
      formatToolbarTitle(baseAxisInput({ viewId: 'season', anchorDate: new Date(2026, 9, 16) })),
    ).toBe('2026 Q4');
  });

  it('formats halfYear view as YYYY H1 / H2 based on month', () => {
    expect(
      formatToolbarTitle(baseAxisInput({ viewId: 'halfYear', anchorDate: new Date(2026, 5, 30) })),
    ).toBe('2026 H1');
    expect(
      formatToolbarTitle(baseAxisInput({ viewId: 'halfYear', anchorDate: new Date(2026, 6, 1) })),
    ).toBe('2026 H2');
  });

  it('formats year view as YYYY年', () => {
    expect(
      formatToolbarTitle(baseAxisInput({ viewId: 'year', anchorDate: new Date(2026, 4, 16) })),
    ).toBe('2026年');
  });

  it('formats week view with an ISO-style week number', () => {
    // 2026-01-05 is a Monday in week 2 (Jan 1-4 fall in week 1).
    expect(
      formatToolbarTitle(baseAxisInput({ viewId: 'week', anchorDate: new Date(2026, 0, 5) })),
    ).toMatch(/^2026 第\d+周$/);
  });
});

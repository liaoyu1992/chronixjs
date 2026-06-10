import { describe, expect, it } from 'vitest';

import { generateTimeUnits, findNearestTimeValue } from './generate-time-units.js';

describe('generateTimeUnits', () => {
  it('generates 24 hours by default', () => {
    const units = generateTimeUnits({
      hourStep: 1,
      minuteStep: 1,
      secondStep: 1,
      use12Hours: false,
    });
    expect(units.hours).toHaveLength(24);
    expect(units.hours[0]).toBe(0);
    expect(units.hours[23]).toBe(23);
  });

  it('generates 1..12 hours when use12Hours=true', () => {
    const units = generateTimeUnits({
      hourStep: 1,
      minuteStep: 1,
      secondStep: 1,
      use12Hours: true,
    });
    expect(units.hours).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('generates 60 minutes by default', () => {
    const units = generateTimeUnits({
      hourStep: 1,
      minuteStep: 1,
      secondStep: 1,
      use12Hours: false,
    });
    expect(units.minutes).toHaveLength(60);
  });

  it('respects minuteStep', () => {
    const units = generateTimeUnits({
      hourStep: 1,
      minuteStep: 15,
      secondStep: 1,
      use12Hours: false,
    });
    expect(units.minutes).toEqual([0, 15, 30, 45]);
  });

  it('respects hourStep', () => {
    const units = generateTimeUnits({
      hourStep: 6,
      minuteStep: 1,
      secondStep: 1,
      use12Hours: false,
    });
    expect(units.hours).toEqual([0, 6, 12, 18]);
  });

  it('respects secondStep', () => {
    const units = generateTimeUnits({
      hourStep: 1,
      minuteStep: 1,
      secondStep: 30,
      use12Hours: false,
    });
    expect(units.seconds).toEqual([0, 30]);
  });
});

describe('findNearestTimeValue', () => {
  it('finds exact match', () => {
    expect(findNearestTimeValue(15, [0, 15, 30, 45])).toBe(15);
  });

  it('snaps to nearest value', () => {
    expect(findNearestTimeValue(7, [0, 15, 30, 45])).toBe(0);
    expect(findNearestTimeValue(8, [0, 15, 30, 45])).toBe(15);
  });

  it('returns first value for empty array edge case', () => {
    // edge: single element
    expect(findNearestTimeValue(5, [10])).toBe(10);
  });
});

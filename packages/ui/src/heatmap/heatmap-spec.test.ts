import { describe, expect, it } from 'vitest';

import {
  defaultHeatmapProps,
  findHeatmapValueRange,
  interpolateHeatmapColor,
} from './heatmap-spec.js';

describe('defaultHeatmapProps', () => {
  it('matches defaults', () => {
    expect(defaultHeatmapProps).toEqual({
      cells: [],
      cellSize: 20,
      colorLow: '#dbeafe',
      colorHigh: '#1e3a8a',
    });
  });
});

describe('findHeatmapValueRange', () => {
  it('returns {0, 0} for empty cells', () => {
    expect(findHeatmapValueRange([])).toEqual({ min: 0, max: 0 });
  });

  it('returns {0, 0} for rows with no entries', () => {
    expect(findHeatmapValueRange([[], []])).toEqual({ min: 0, max: 0 });
  });

  it('returns min/max for populated cells', () => {
    expect(
      findHeatmapValueRange([
        [1, 2, 3],
        [4, 5, 6],
      ]),
    ).toEqual({ min: 1, max: 6 });
  });

  it('handles negative numbers', () => {
    expect(findHeatmapValueRange([[-5, 0, 10]])).toEqual({ min: -5, max: 10 });
  });
});

describe('interpolateHeatmapColor', () => {
  it('returns colorLow when value <= min', () => {
    expect(interpolateHeatmapColor(0, 0, 100, '#000000', '#ffffff')).toBe('#000000');
    expect(interpolateHeatmapColor(-1, 0, 100, '#000000', '#ffffff')).toBe('#000000');
  });

  it('returns colorHigh when value >= max', () => {
    expect(interpolateHeatmapColor(100, 0, 100, '#000000', '#ffffff')).toBe('#ffffff');
    expect(interpolateHeatmapColor(200, 0, 100, '#000000', '#ffffff')).toBe('#ffffff');
  });

  it('interpolates linearly between endpoints', () => {
    expect(interpolateHeatmapColor(50, 0, 100, '#000000', '#ffffff')).toBe('#808080');
  });

  it('handles min === max by returning colorLow', () => {
    expect(interpolateHeatmapColor(5, 5, 5, '#abc123', '#fedcba')).toBe('#abc123');
  });

  it('falls back to colorLow for non-hex input', () => {
    expect(interpolateHeatmapColor(50, 0, 100, 'red', 'blue')).toBe('red');
  });
});

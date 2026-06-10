/**
 * Slider marks computation — Phase 33 (2026-06-05).
 *
 * Normalizes mark input into a sorted array for rendering.
 */

import type { SliderMark } from './slider-spec.js';

export interface ComputedSliderMark {
  /** Mark position value. */
  readonly value: number;
  /** Display label. */
  readonly label: string;
  /** Position as percentage (0-100) relative to [min, max]. */
  readonly percent: number;
}

/**
 * Compute sorted marks with percentage positions.
 * Filters out marks outside [min, max] range.
 */
export function computeSliderMarks(
  marks: Readonly<Record<number, SliderMark>>,
  min: number,
  max: number,
): ComputedSliderMark[] {
  if (max <= min) return [];
  const range = max - min;
  const result: ComputedSliderMark[] = [];
  for (const [valueStr, mark] of Object.entries(marks)) {
    const value = Number(valueStr);
    if (value < min || value > max) continue;
    result.push({
      value,
      label: mark.label,
      percent: ((value - min) / range) * 100,
    });
  }
  return result.sort((a, b) => a.value - b.value);
}

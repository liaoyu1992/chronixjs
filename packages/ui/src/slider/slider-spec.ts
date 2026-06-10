/**
 * Slider component IR — Phase 33 (2026-06-05).
 *
 * Single/range slider with marks. Uses cx-kit `@chronixjs/cx-kit/slider`
 * for value/position math and `@chronixjs/cx-kit/input-range` for range.
 * Value is `number` (single) or `[number, number]` (range).
 */

export interface SliderMark {
  /** Display label for the mark. */
  readonly label: string;
}

export interface SliderProps {
  /** Current value. `number` for single, `[number, number]` for range. */
  readonly value: number | readonly [number, number];
  /** Range mode (dual handles). Default false. */
  readonly range: boolean;
  /** Minimum value. Default 0. */
  readonly min: number;
  /** Maximum value. Default 100. */
  readonly max: number;
  /** Step between values. Default 1. */
  readonly step: number;
  /** Labeled marks at specific values. */
  readonly marks: Readonly<Record<number, SliderMark>>;
  /** Disable the slider. */
  readonly disabled: boolean;
  /** Show tooltip on hover. Default true. */
  readonly tooltip: boolean;
  /** Vertical orientation. Default false. */
  readonly vertical: boolean;
}

export const defaultSliderProps: SliderProps = {
  value: 0,
  range: false,
  min: 0,
  max: 100,
  step: 1,
  marks: {},
  disabled: false,
  tooltip: true,
  vertical: false,
};

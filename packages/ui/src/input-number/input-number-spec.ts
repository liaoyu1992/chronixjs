/**
 * InputNumber component IR — Phase 25 (2026-06-03). Tier B numeric
 * input + stepper surface. Reuses Phase 7 number-input helpers
 * (`parseNumberInput` / `clampNumberInput` / `formatNumberInput`) for
 * keystroke parsing, bound + step snapping, and display formatting.
 *
 * `value: number | null` — `null` represents the empty input state
 * (NOT `undefined`, which conflicts with `exactOptionalPropertyTypes`).
 */

export type InputNumberSize = 'small' | 'medium' | 'large';

export interface InputNumberProps {
  readonly value: number | null;
  readonly min: number | undefined;
  readonly max: number | undefined;
  readonly step: number;
  readonly disabled: boolean;
  readonly size: InputNumberSize;
  readonly error: string | undefined;
}

export const defaultInputNumberProps: InputNumberProps = {
  value: null,
  min: undefined,
  max: undefined,
  step: 1,
  disabled: false,
  size: 'medium',
  error: undefined,
};

import type { FieldError } from './form-spec.js';

/**
 * Per-field reactive state managed by the adapter `<ChronixFormItem>`.
 * Pure-data; mutations happen via the transaction helpers below
 * (`withFieldValue`, `withFieldTouched`, etc.) which return new
 * `FieldState` objects.
 *
 * Phase 6 (2026-06-02).
 *
 * Fields:
 *
 * - **`value`** — current value. `undefined` when the field is unset.
 * - **`initialValue`** — snapshot of the value at field creation /
 *   reset. Used to compute `dirty`.
 * - **`touched`** — `true` once the user has interacted with the field
 *   (focused + blurred, in most adapter wirings). Drives "show errors
 *   only after touch" behavior.
 * - **`dirty`** — `true` when `value !== initialValue` (reference
 *   inequality via `Object.is`). Drives "show only after edit" behavior
 *   and "unsaved changes" indicators.
 * - **`validating`** — `true` while an async validation is in flight.
 *   Adapter can show a spinner.
 * - **`errors`** — current validation errors. Empty array when the
 *   field is either valid or hasn't been validated yet.
 */
export interface FieldState<T = unknown> {
  readonly name: string;
  readonly value: T | undefined;
  readonly initialValue: T | undefined;
  readonly touched: boolean;
  readonly dirty: boolean;
  readonly validating: boolean;
  readonly errors: readonly FieldError[];
}

/**
 * Construct a fresh `FieldState`. The field starts untouched, clean
 * (not dirty), not validating, with no errors.
 */
export function createFieldState<T>(name: string, initialValue?: T): FieldState<T> {
  return {
    name,
    value: initialValue,
    initialValue,
    touched: false,
    dirty: false,
    validating: false,
    errors: [],
  };
}

/**
 * Set the field's value and recompute `dirty` based on
 * `Object.is(value, state.initialValue)`. Returns a new `FieldState`;
 * the input is not mutated.
 */
export function withFieldValue<T>(state: FieldState<T>, value: T): FieldState<T> {
  return { ...state, value, dirty: !Object.is(value, state.initialValue) };
}

/**
 * Mark the field as touched (or explicitly untouched). Most adapter
 * wirings call this on blur; passing `false` reverts to the untouched
 * state (rare; useful for "discard and reset" UX flows).
 */
export function withFieldTouched<T>(state: FieldState<T>, touched = true): FieldState<T> {
  if (state.touched === touched) return state;
  return { ...state, touched };
}

/**
 * Replace the field's errors with a new error list. Pass `[]` to clear
 * errors. Returns the same `state` reference when the error list is
 * empty AND already empty (cheap fast-path).
 */
export function withFieldErrors<T>(
  state: FieldState<T>,
  errors: readonly FieldError[],
): FieldState<T> {
  if (errors.length === 0 && state.errors.length === 0) return state;
  return { ...state, errors };
}

/**
 * Set the `validating` flag — `true` while an async validation is in
 * flight, `false` when it completes.
 */
export function withFieldValidating<T>(state: FieldState<T>, validating: boolean): FieldState<T> {
  if (state.validating === validating) return state;
  return { ...state, validating };
}

/**
 * Reset the field to its original initial value, clearing touched /
 * dirty / validating / errors. Returns a fresh `FieldState`.
 *
 * To reset to a NEW initial value (not the original), construct a
 * fresh field via `createFieldState(state.name, newInitial)` instead —
 * keeps the reset semantics unambiguous.
 */
export function resetFieldState<T>(state: FieldState<T>): FieldState<T> {
  return {
    name: state.name,
    value: state.initialValue,
    initialValue: state.initialValue,
    touched: false,
    dirty: false,
    validating: false,
    errors: [],
  };
}

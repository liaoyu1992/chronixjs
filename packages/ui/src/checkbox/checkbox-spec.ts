/**
 * Checkbox component IR — . Tier B boolean
 * surface with optional indeterminate state.
 *
 * Precedence: when both `indeterminate: true` and `checked: true`,
 * render the indeterminate glyph (horizontal bar). Adapters consult
 * `resolveCheckboxIconState` to decide.
 *
 * Group container (`<ChronixCheckboxGroup>`) is intentionally deferred
 * to v0.2 — consumer composes multiple `<ChronixCheckbox>` with own
 * array-state in v0.1.0-alpha.
 */

export interface CheckboxProps {
  readonly checked: boolean;
  readonly indeterminate: boolean;
  readonly disabled: boolean;
  readonly label: string | undefined;
  readonly error: string | undefined;
}

export const defaultCheckboxProps: CheckboxProps = {
  checked: false,
  indeterminate: false,
  disabled: false,
  label: undefined,
  error: undefined,
};

export type CheckboxIconState = 'unchecked' | 'checked' | 'indeterminate';

/**
 * Pure helper: given the controlled props, return which glyph the
 * adapter should render inside the box.
 *
 * Indeterminate takes priority — a parent-of-tree checkbox typically
 * sits in both states simultaneously (some children checked → both
 * `indeterminate` and a logically-truthy parent value).
 */
export function resolveCheckboxIconState(
  checked: boolean,
  indeterminate: boolean,
): CheckboxIconState {
  if (indeterminate) return 'indeterminate';
  if (checked) return 'checked';
  return 'unchecked';
}

/**
 * chronix-ui form module — Phase 6 (2026-06-02), extended Phase 34 (2026-06-05).
 *
 * Framework-agnostic form validation IR. Wraps `async-validator` (peer
 * dependency, optional — consumers using Form must install it) with
 * a chronix-NEW pure-function surface; adapters (`@chronixjs/ui-vue3`,
 * `@chronixjs/ui-vue2`, `@chronixjs/ui-react`) layer reactivity + DOM
 * rendering on top.
 *
 * Public surface:
 *
 * Phase 6 — validation foundation:
 * - `ValidationRule` — re-export of `async-validator`'s `RuleItem`.
 * - `FieldSpec<T>` / `FormSpec` — declarative field + form definitions.
 * - `FieldError` / `FormValidationResult` — validation output shapes.
 * - `FieldState<T>` + transactions — reactive per-field state model.
 * - `validateField` — single-field async validation.
 * - `validateForm` — full-form async validation.
 *
 * Phase 34 — component-level IR:
 * - `FormProps` / `FormItemProps` — component prop interfaces.
 * - `defaultFormProps` / `defaultFormItemProps` — default prop values.
 * - `getNestedValue` — dot-path model accessor.
 * - `isFieldRequired` — detect required from rules.
 * - BEM class resolvers (form / form-item / label / blank / feedback).
 * - `CHRONIX_FORM_CSS` + `ensureChronixFormStyles`.
 */

// Phase 6 — validation foundation
export type { ValidationRule } from './validation-rule.js';
export type { FieldError, FieldSpec, FormSpec, FormValidationResult } from './form-spec.js';
export type { FieldState } from './field-state.js';
export {
  createFieldState,
  resetFieldState,
  withFieldErrors,
  withFieldTouched,
  withFieldValidating,
  withFieldValue,
} from './field-state.js';
export { validateField } from './validate-field.js';
export { validateForm } from './validate-form.js';

// Phase 34 — component-level IR
export type {
  FormItemProps,
  FormLabelAlign,
  FormLabelPlacement,
  FormProps,
  FormSize,
} from './form-component-spec.js';
export { defaultFormProps, defaultFormItemProps } from './form-component-spec.js';
export { getNestedValue } from './get-nested-value.js';
export { isFieldRequired } from './is-field-required.js';
export {
  resolveFormBlankClassList,
  resolveFormClassList,
  resolveFormFeedbackClassList,
  resolveFormItemClassList,
  resolveFormLabelClassList,
} from './resolve-form-class-list.js';
export { CHRONIX_FORM_CSS, ensureChronixFormStyles } from './form-styles.js';

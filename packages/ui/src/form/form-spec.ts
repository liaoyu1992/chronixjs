import type { ValidationRule } from './validation-rule.js';

/**
 * Declarative spec for a single form field. Generic over the field's
 * value type `T`; consumers may use `FieldSpec` (= `FieldSpec<unknown>`)
 * for heterogeneous-field forms.
 *
 * Phase 6 (2026-06-02). The spec is consumed by:
 *
 * - `validateField` — runs the field's rules against a candidate value.
 * - `validateForm` — collects all field specs to build a form-level descriptor.
 * - Adapter `<ChronixForm>` SFC — registers the field for reactive validation.
 *
 * Conventions:
 *
 * - `name` is the field's identity within the form; must be unique.
 *   Maps to a key in the form's `values` record.
 * - `label` is the human-readable name used by error-message templates
 *   that interpolate the field name. Optional; defaults to `name`.
 * - `rules` is an ordered array of `ValidationRule`s; async-validator
 *   runs them in order and aggregates errors. Empty / missing rules
 *   means the field has no constraints.
 * - `initialValue` is the starting value (used by `createFieldState`).
 *   Optional; absent fields start as `undefined`.
 */
export interface FieldSpec<T = unknown> {
  readonly name: string;
  readonly label?: string;
  readonly rules?: readonly ValidationRule[];
  readonly initialValue?: T;
}

/**
 * Declarative spec for an entire form — currently just a collection of
 * `FieldSpec`s. Future phases may add form-level rules (cross-field
 * validation), submission handlers, and layout hints; the wrapping
 * object exists to make those extensions non-breaking.
 */
export interface FormSpec {
  readonly fields: readonly FieldSpec<unknown>[];
}

/**
 * A single validation error for a field. Shape kept minimal so the
 * adapter can display it directly (no message-template engine in
 * Phase 6 — the rule's own `message` is the source of truth).
 */
export interface FieldError {
  /** The field's `name`; useful when bubbling errors up to the form level. */
  readonly fieldName: string;
  /** Human-readable error message, as produced by the rule's `message` field. */
  readonly message: string;
}

/**
 * Result of validating an entire form. `valid` is `true` only when
 * every field passed all rules; otherwise `fieldErrors` maps each
 * failing field's name to its error list.
 *
 * Fields with no errors are NOT present as keys in `fieldErrors` (no
 * empty arrays) — readers should use
 * `fieldErrors[name] ?? []` to safely access a field's errors.
 */
export interface FormValidationResult {
  readonly valid: boolean;
  readonly fieldErrors: Readonly<Record<string, readonly FieldError[]>>;
}

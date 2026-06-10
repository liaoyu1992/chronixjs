import Schema from 'async-validator';

import type { FieldError, FormSpec, FormValidationResult } from './form-spec.js';

/**
 * Validate an entire form's values against its declared field rules.
 * Pure-async helper — no DOM access, no state mutation.
 *
 * Phase 6 (2026-06-02). Aggregates per-field results into a single
 * `FormValidationResult`:
 *
 * - `valid: true` + `fieldErrors: {}` when every field passes (or has
 *   no rules).
 * - `valid: false` + `fieldErrors: { fieldName: [...] }` when one or
 *   more fields fail; failing fields are keys in the map, passing
 *   fields are absent (not empty arrays).
 *
 * Fields with no rules are skipped at the descriptor level — they
 * never produce errors. Fields not present in `values` are passed as
 * `undefined` to async-validator, which handles missing values via the
 * `required` rule's semantics.
 */
export async function validateForm(
  spec: FormSpec,
  values: Readonly<Record<string, unknown>>,
): Promise<FormValidationResult> {
  const descriptor: Record<string, unknown> = {};
  let hasRules = false;
  for (const field of spec.fields) {
    if (!field.rules || field.rules.length === 0) continue;
    descriptor[field.name] = field.rules.length === 1 ? field.rules[0]! : [...field.rules];
    hasRules = true;
  }
  if (!hasRules) return { valid: true, fieldErrors: {} };

  // Build values record covering every field (undefined for missing
  // values — async-validator's required rule treats undefined as "missing").
  const fullValues: Record<string, unknown> = {};
  for (const field of spec.fields) {
    fullValues[field.name] = Object.prototype.hasOwnProperty.call(values, field.name)
      ? (values as Record<string, unknown>)[field.name]
      : undefined;
  }

  const schema = new Schema(descriptor as never);
  try {
    await schema.validate(fullValues);
    return { valid: true, fieldErrors: {} };
  } catch (raw: unknown) {
    return extractFormErrors(raw);
  }
}

interface AsyncValidatorFormReject {
  readonly errors: readonly unknown[];
  readonly fields: Readonly<Record<string, readonly { message?: string }[]>>;
}

function isAsyncValidatorFormReject(raw: unknown): raw is AsyncValidatorFormReject {
  if (typeof raw !== 'object' || raw === null) return false;
  const r = raw as { errors?: unknown; fields?: unknown };
  return Array.isArray(r.errors) && typeof r.fields === 'object' && r.fields !== null;
}

function extractFormErrors(raw: unknown): FormValidationResult {
  if (!isAsyncValidatorFormReject(raw)) {
    throw raw;
  }
  const fieldErrors: Record<string, readonly FieldError[]> = {};
  for (const [fieldName, errs] of Object.entries(raw.fields)) {
    fieldErrors[fieldName] = errs.map((e) => ({ fieldName, message: e.message ?? '' }));
  }
  return { valid: false, fieldErrors };
}

import Schema from 'async-validator';

import type { FieldError, FieldSpec } from './form-spec.js';

/**
 * Validate a single field's value against its rules. Pure-async helper —
 * no DOM access, no state mutation; just rules + value → errors.
 *
 * wraps the async-validator `Schema` class behind
 * a chronix-NEW Promise-returning function. Returns `[]` when the field
 * has no rules, or when all rules pass; returns one or more `FieldError`s
 * when any rule fails.
 *
 * Behavior:
 *
 * - Rules that throw synchronously or return rejected promises produce
 *   one `FieldError` per failing rule.
 * - The rule's own `message` field is the error message; chronix-ui
 *   does not template or transform messages (a future
 *   locale-aware message-template layer can be added by reading
 *   `ctx.locale.form` and substituting placeholders).
 * - Unexpected throws from the validator (not from rules — from
 *   bug in async-validator or its dependents) propagate untouched so
 *   consumers can surface them.
 *
 * Performance: creates a fresh `Schema` per call. For high-frequency
 * validation (per-keystroke), the adapter should debounce calls — not
 * cache the schema, since rules may be reactive in the spec.
 */
export async function validateField<T>(
  spec: FieldSpec<T>,
  value: T | undefined,
): Promise<readonly FieldError[]> {
  if (!spec.rules || spec.rules.length === 0) return [];
  const rules = spec.rules.length === 1 ? spec.rules[0]! : [...spec.rules];
  const schema = new Schema({ [spec.name]: rules });
  try {
    await schema.validate({ [spec.name]: value });
    return [];
  } catch (raw: unknown) {
    return extractFieldErrors(spec.name, raw);
  }
}

interface AsyncValidatorReject {
  readonly errors: readonly { message?: string }[];
}

function isAsyncValidatorReject(raw: unknown): raw is AsyncValidatorReject {
  if (typeof raw !== 'object' || raw === null) return false;
  const errs = (raw as { errors?: unknown }).errors;
  return Array.isArray(errs);
}

function extractFieldErrors(fieldName: string, raw: unknown): readonly FieldError[] {
  if (!isAsyncValidatorReject(raw)) {
    throw raw;
  }
  return raw.errors.map((e) => ({ fieldName, message: e.message ?? '' }));
}

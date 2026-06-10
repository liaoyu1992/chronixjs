/**
 * chronix-ui `isFieldRequired` — Phase 34 (2026-06-05).
 *
 * Pure helper that returns `true` when any rule in the array has
 * `required: true`. Used by FormItem to decide whether to show the
 * asterisk mark.
 *
 * Handles both single rule and array of rules. Returns `false` for
 * empty / undefined input.
 */

import type { ValidationRule } from './validation-rule.js';

export function isFieldRequired(
  rules: ValidationRule | readonly ValidationRule[] | undefined,
): boolean {
  if (rules === undefined) return false;
  const arr = Array.isArray(rules) ? rules : [rules];
  return arr.some((r: ValidationRule) => (r as { required?: boolean }).required === true);
}

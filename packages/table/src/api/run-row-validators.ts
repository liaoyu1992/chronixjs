import type { RowSpec } from '../ir/row-spec.js';
import type { RowValidator, RowValidationViolation } from '../ir/row-validator.js';

/**
 * Phase 115 (2026-06-02): run all `rowValidators` against a row +
 * concatenate the returned violation arrays.
 *
 * Iterates the validators array in order; flattens each validator's
 * return into the result. Empty input → empty output. A validator
 * returning a non-array (e.g. a misbehaving consumer impl) is
 * defensively coerced to empty — the adapter never crashes on bad
 * data, and the consumer's bug surfaces as "validator silently did
 * nothing" rather than a runtime exception on every commit.
 *
 * Throws from inside `validator.validate` are NOT caught — same
 * posture as `runCellValidator` (Phase 101). A throwing validator
 * surfaces to the consumer's error boundary; defensive try/catch
 * would hide consumer bugs.
 *
 * Pure function. No DOM access; safe to call from any synchronous
 * context (commit pipeline + paste/drag-fill loop + tests).
 *
 * Adapter call site:
 *
 *   const postCommitRow = applyCommitToRow(row, mutation);
 *   const violations = runRowValidators({
 *     row: postCommitRow,
 *     rowValidators: props.rowValidators ?? [],
 *   });
 *   reconcileInvalidCellsForRow(postCommitRow.id, violations);
 */
export interface RunRowValidatorsArgs {
  readonly row: RowSpec;
  readonly rowValidators: readonly RowValidator[];
}

export function runRowValidators(args: RunRowValidatorsArgs): readonly RowValidationViolation[] {
  const { row, rowValidators } = args;
  if (rowValidators.length === 0) return [];
  const violations: RowValidationViolation[] = [];
  for (const validator of rowValidators) {
    const raw = validator.validate(row);
    if (!Array.isArray(raw)) continue;
    for (const violation of raw as readonly RowValidationViolation[]) {
      violations.push(violation);
    }
  }
  return violations;
}

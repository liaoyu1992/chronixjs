import type { ColumnSpec, EditValidationError, RowSpec } from '../ir/index.js';

/**
 * Phase 101 (2026-06-01): run a `ColumnSpec.validator` against a
 * post-coerce typed value and normalise the result into a
 * `EditValidationError | null` shape the adapter can dispatch on.
 *
 * The adapter calls this helper between `coerceEditDraftValue` and
 * the `cell-value-change` emit inside `applyEditCommit`:
 *
 *   const coerced = coerceEditDraftValue(column, draftValue);
 *   if (!coerced.ok) { ... reject on coerce ... return; }
 *   const validationError = runCellValidator({
 *     value: coerced.value,
 *     row,
 *     column,
 *   });
 *   if (validationError != null) { ... reject on validator ... return; }
 *   // commit success
 *
 * Return shape normalisation matches the design Decision A.1 +
 * B.1 contract:
 *
 * - `column.validator` is `undefined` → return `null` (backwards-
 *   compatible: no validator means every value is valid).
 * - validator returns `null` → return `null`.
 * - validator returns `string` → return `{ reason: <string> }`
 *   (shorthand form; the optional `code` is omitted).
 * - validator returns `EditValidationError` → return verbatim.
 *
 * Throws are NOT caught here. A throwing validator surfaces to the
 * adapter, which lets it bubble through the SFC to the consumer's
 * error boundary — matching the design Decision posture that
 * validators are a business-logic surface.
 *
 * Pure function. No DOM access; safe to call from any synchronous
 * context (commit pipeline + future tests + future paste-pipeline
 * extension when that lifts validation out of Bundle 8a's
 * out-of-scope list).
 */
export interface RunCellValidatorArgs {
  readonly value: unknown;
  readonly row: RowSpec;
  readonly column: ColumnSpec;
}

export function runCellValidator(args: RunCellValidatorArgs): EditValidationError | null {
  const { value, row, column } = args;
  if (column.validator == null) return null;
  const raw = column.validator(value, row);
  if (raw == null) return null;
  if (typeof raw === 'string') return { reason: raw };
  return raw;
}

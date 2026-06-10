import type { ColumnSpec, EditValidationError, RowSpec } from '../ir/index.js';

/**
 * Phase 111 (2026-06-01): run a `ColumnSpec.validatorAsync` against a
 * post-coerce typed value and normalise the resolved or rejected
 * promise into a `Promise<EditValidationError | null>` shape the
 * adapter can dispatch on.
 *
 * Extends Phase 101 `runCellValidator` (sync) with the async tier
 * that Phase 101 Decision B.2 explicitly parked. The execution order
 * remains locked at the adapter layer (`coerceEditDraftValue` →
 * `validator` (sync) → `validatorAsync` (async)); this helper is a
 * single-stage normaliser, not a pipeline runner.
 *
 * Return shape normalisation (resolved Promise):
 *
 * - `column.validatorAsync` is `undefined` → return `null`
 *   (backwards-compatible: no async validator means every value
 *   is async-valid).
 * - Promise resolves to `null` → return `null`.
 * - Promise resolves to `string` → return `{ reason: <string> }`.
 * - Promise resolves to `EditValidationError` → return verbatim.
 *
 * Promise REJECTION handling (per Phase 111 Decision E.1):
 * synthesize `{ reason: error.message ?? String(error), code:
 * 'async-error' }` AND `console.error(error)` so the original error
 * chain stays visible to consumer devtools / Sentry hooks. The
 * adapter UI state recovers (cell goes from `validating` back to
 * `invalid` with the synthetic reason); the consumer's error
 * boundary still sees the underlying error via the `console.error`
 * surface.
 *
 * Pure async function. No DOM access; safe to call from any
 * context (commit pipeline + future tests).
 */
export interface RunAsyncCellValidatorArgs {
  readonly value: unknown;
  readonly row: RowSpec;
  readonly column: ColumnSpec;
}

export async function runAsyncCellValidator(
  args: RunAsyncCellValidatorArgs,
): Promise<EditValidationError | null> {
  const { value, row, column } = args;
  if (column.validatorAsync == null) return null;
  try {
    const raw = await column.validatorAsync(value, row);
    if (raw == null) return null;
    if (typeof raw === 'string') return { reason: raw };
    return raw;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error('[chronix-table] validatorAsync rejected:', error);
    return { reason, code: 'async-error' };
  }
}

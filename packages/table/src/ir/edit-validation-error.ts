/**
 * IR primitive: cell-edit validation error.
 *
 * Phase 101 (2026-06-01): structured payload returned from a
 * `ColumnSpec.validator` to reject an in-flight edit commit. The
 * adapter surfaces this object on the `cell-edit-stop` event's
 * payload when the validator rejected the commit, leaves the editor
 * open, and paints the cell with the invalid-cell marker classes
 * until the next successful commit / cancel.
 *
 * `reason` is the human-readable string the consumer rendered in
 * their own inline-error UI / tooltip / toast. Chronix itself never
 * renders `reason`; the SFC is unopinionated about how a consumer
 * shows the rejection text.
 *
 * `code` is optional + consumer-controlled. Use it to drive i18n
 * branching (`code === 'too-short'` → translated message) or
 * error-class routing on the consumer side. Chronix does not
 * interpret `code`.
 *
 * Adding `details?: unknown` was rejected in design Decision A.3
 * — escape-hatch free-form payloads belong in a future minor's
 * interface widening rather than the initial shape.
 */
export interface EditValidationError {
  readonly reason: string;
  readonly code?: string;
}

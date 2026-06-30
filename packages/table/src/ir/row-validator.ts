import type { RowSpec } from './row-spec.js';

/**
 * IR primitive: per-row validator descriptor.
 *
 * cross-cell / cross-row validation. Consumer
 * registers an array of `RowValidator` entries on the SFC's
 * `rowValidators` prop. After each commit lands (inline edit OR
 * paste OR drag-fill batch), the adapter runs each validator against
 * the post-commit row and aggregates the returned violations into
 * the cell-anchored invalid-state map (`invalidCellsRef`).
 *
 * `id` is a diagnostic key — surfaces in the `invalid-cells-change`
 * emit payload so consumer-side summary panels can show "which
 * validator failed" without string-matching `reason`.
 *
 * `validate` is SYNC + PURE — receives a row, returns 0..N
 * `RowValidationViolation` entries each carrying a `colId` that
 * anchors which cell paints invalid. Empty array = row is valid.
 *
 * Async row-level validators are parked per design Decision A.3 —
 * trigger: consumer ask for server-side cross-row constraints.
 */
export interface RowValidator {
  readonly id: string;
  readonly validate: (row: RowSpec) => readonly RowValidationViolation[];
}

/**
 * IR primitive: single cross-cell violation anchored to one cell.
 *
 * returned from `RowValidator.validate`. The `colId`
 * picks which cell on the row paints `cx-table-cell--invalid`;
 * `reason` + `code` mirror `EditValidationError`'s shape so the
 * summary surface (Decision C.1) treats per-cell and
 * row-level violations uniformly.
 */
export interface RowValidationViolation {
  readonly colId: string;
  readonly reason: string;
  readonly code?: string;
}

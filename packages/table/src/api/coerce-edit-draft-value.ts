import type { ColumnSpec } from '../ir/index.js';

/**
 * editor-string → typed-value coercion for
 * the `<input>` cell editor's commit path.
 *
 * The vue3 adapter's `applyEditCommit` calls this helper with the
 * column and the editor's raw draft value BEFORE emitting
 * `cell-value-change`. The result is one of:
 *
 * - `{ ok: true, value }` — coercion succeeded; the commit proceeds
 *   using `value` as the `newValue` payload. May equal `raw` for
 *   passthrough columns or be a transformed typed value.
 * - `{ ok: false }` — coercion rejected; the adapter aborts the
 *   commit, leaves the editor open with the bad draft visible, and
 *   emits `cell-edit-stop {committed: false}`.
 *
 * Dispatch by `column.type`:
 *
 * | column.type     | empty string  | finite number     | non-numeric / NaN string | typed `null`/`undefined`/etc |
 * | --------------- | ------------- | ----------------- | ------------------------ | ---------------------------- |
 * | `'number'`      | `{ok:true, value: null}` | `{ok:true, value: n}` | `{ok:false}`        | `{ok:false}` (defensive)     |
 * | other / absent  | passthrough — `{ok:true, value: raw}` for any input          |                      |                              |
 *
 * The `'number'` branch accepts an already-finite numeric `raw` (the
 * re-commit / programmatic-set path) so consumers calling
 * `commitEditingCell()` after a draft round-trip don't double-coerce.
 *
 * Date / boolean coercion remains passthrough at; Phase
 * 12.3+ adds proper specialisations alongside the date / checkbox
 * editor branches.
 *
 * Pure function. No DOM / no side effects.
 */
export interface CoerceEditDraftValueOk {
  readonly ok: true;
  readonly value: unknown;
}

export interface CoerceEditDraftValueRejected {
  readonly ok: false;
}

export type CoerceEditDraftValueResult = CoerceEditDraftValueOk | CoerceEditDraftValueRejected;

export function coerceEditDraftValue(column: ColumnSpec, raw: unknown): CoerceEditDraftValueResult {
  if (column.type !== 'number') {
    return { ok: true, value: raw };
  }
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? { ok: true, value: raw } : { ok: false };
  }
  if (typeof raw !== 'string') {
    return { ok: false };
  }
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { ok: true, value: null };
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? { ok: true, value: parsed } : { ok: false };
}

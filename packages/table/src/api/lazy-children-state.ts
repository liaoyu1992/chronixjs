import type { RowSpec } from '../ir/index.js';

/**
 * Phase 34 (2026-05-28): args object passed to the consumer-provided
 * `childrenLoader`. The adapter SFC invokes the loader the first time
 * a lazy-eligible parent (`hasChildren: true && children === undefined`)
 * is expanded.
 *
 * **Why an args object instead of positional `(parent, signal)`**:
 * mirrors `valueGetter({row, column})` + `cellClass({value, row,
 * column})` + `aggregator(rows)` — all chronix function-shape
 * callbacks use args objects so future fields can land without
 * breaking signatures.
 *
 * **`signal: AbortSignal`**: always provided (never null). Consumers
 * who want true cancellation (HTTP abort, IndexedDB cursor close) can
 * plumb the signal through to fetch / their query layer. Consumers
 * who don't care can ignore it — chronix still uses the signal
 * internally to drop state updates from stale resolutions.
 */
export interface ChildrenLoaderArgs {
  /** The parent row being expanded. Carries the consumer's `data` + `id`. */
  readonly parent: RowSpec;

  /**
   * Abort signal that fires when the user collapses the row mid-load
   * (Decision D.1). Consumers passing this through to `fetch` will see
   * their network request cancelled automatically.
   */
  readonly signal: AbortSignal;
}

/**
 * Phase 34 (2026-05-28): lazy-load lifecycle status for a single row.
 *
 * Rows not present in the SFC's `lazyChildrenStateRef` Map are in
 * implicit `'idle'` state — there is no `LazyChildrenStatus = 'idle'`
 * variant because the Map's absence-as-default semantics encode it.
 */
export type LazyChildrenStatus = 'loading' | 'loaded' | 'error';

/**
 * Phase 34 (2026-05-28): per-row lazy state stored in the adapter
 * SFC's `lazyChildrenStateRef` Map.
 *
 * Invariants:
 *
 * - `status === 'loading'`: `abort` is present; `children` + `error`
 *   are absent. Subsequent clicks dedup (Decision D.1).
 * - `status === 'loaded'`: `children` is present (`readonly RowSpec[]`);
 *   `abort` + `error` are absent.
 * - `status === 'error'`: `error` is present (verbatim rejection
 *   value); `abort` + `children` are absent. Subsequent clicks retry
 *   (state → 'loading').
 *
 * The fields are encoded as separate optionals (not a discriminated
 * union) so TypeScript-narrowing on `status` doesn't force runtime
 * shape changes — the same Map entry shape works for all 3 states.
 * Consumers reading via `getLazyChildrenState(rowId)` get the typed
 * status enum; the full shape is mainly for the SFC's render branch.
 */
export interface LazyChildrenState {
  readonly status: LazyChildrenStatus;

  /** Present iff `status === 'loaded'`. Cached children from `childrenLoader`. */
  readonly children?: readonly RowSpec[];

  /** Present iff `status === 'error'`. Verbatim rejection value. */
  readonly error?: unknown;

  /** Present iff `status === 'loading'`. Aborted on collapse-during-load. */
  readonly abort?: AbortController;
}

import type { PasteMutation } from './compute-paste-mutations.js';

/**
 * canonical mutation-batch shape recorded in
 * the undo / redo history. Wraps an arbitrary list of `PasteMutation`s
 * (the unifying contract cell-edit / paste /
 * fill) with metadata for consumer-side telemetry.
 *
 * - `id` — monotonic identifier produced by the adapter (e.g.,
 *   `'mb-{counter}'`). Stable across replays; lets consumers correlate
 *   `history-replay` events with the originally-recorded batch.
 * - `source` — gesture provenance. Informational; the apply path is
 *   identical regardless of source (consumer's Map-keyed batch write-
 *   back works for all 4 values).
 * - `mutations` — the same shape paste/fill mutations use.
 *   Empty arrays are legal (the gesture's batch slot is preserved even
 *   when no cells actually changed — e.g., a paste where every cell
 *   was no-op-deduped).
 * - `recordedAt` — `Date.now()` snapshot. Lets consumers display
 *   "Undid 5 edits from 30 seconds ago" UI without their own
 *   timestamping.
 */
export interface MutationBatch {
  readonly id: string;
  readonly source: 'cell-edit' | 'cell-range-paste' | 'cell-range-fill' | 'custom';
  readonly mutations: readonly PasteMutation[];
  readonly recordedAt: number;
}

/**
 * history stack shape. `past` holds undoable batches in
 * insertion order (newest at end); `future` holds undone batches
 * available for redo (also newest at end). Both arrays are read-only;
 * mutators return a new state object.
 */
export interface MutationHistoryState {
  readonly past: readonly MutationBatch[];
  readonly future: readonly MutationBatch[];
}

/**
 * identity-stable empty history. Initial state for the SFC's
 * `mutationHistoryRef` + the value returned from `clearHistory()`.
 * Identity stability lets downstream `computed` derivations skip
 * re-render when history is empty.
 */
export const EMPTY_MUTATION_HISTORY: MutationHistoryState = {
  past: [],
  future: [],
};

/**
 * (Decision C.1): append a freshly-recorded batch to the
 * history stack.
 *
 * Semantics:
 *
 * 1. Push `batch` to the end of `past` (newest-at-end).
 * 2. If `past.length > maxDepth` AFTER push, drop the OLDEST entry
 *    (slice from index 1). Bounded depth prevents long-running tables
 *    from accumulating gigabytes of history.
 * 3. Clear `future` — Excel / Sheets / Notion / any text editor's
 *    convention: a new edit invalidates the redo stack.
 *
 * Defensive: if `maxDepth <= 0`, returns the input state unchanged
 * (recording is fully suppressed; lets consumers temporarily disable
 * recording without removing the call site).
 *
 * **Pure function.** No mutation of input state.
 */
export function appendMutationBatch(
  state: MutationHistoryState,
  batch: MutationBatch,
  maxDepth: number,
): MutationHistoryState {
  if (maxDepth <= 0) return state;
  const nextPast = [...state.past, batch];
  // Drop oldest entries when over cap. Use slice from offset to keep
  // the newest `maxDepth` entries.
  const dropCount = nextPast.length - maxDepth;
  const cappedPast = dropCount > 0 ? nextPast.slice(dropCount) : nextPast;
  return {
    past: cappedPast,
    future: state.future.length === 0 ? state.future : [],
  };
}

/**
 * (Decision C.1): pop the newest entry from `past` for undo.
 *
 * - Returns `null` when `past` is empty (caller's `undo()` becomes a
 *   no-op).
 * - Otherwise returns `{state, batch}` where `state` has the popped
 *   batch MOVED to `future` (newest-at-end) and `past` shrunk by 1,
 *   and `batch` is the ORIGINAL (un-reversed) recorded entry. The
 *   adapter is responsible for reversing the batch via
 *   `reverseMutationBatch` before firing the `history-replay` emit.
 *
 * **Pure function.** No mutation of input state.
 */
export function popUndoBatch(
  state: MutationHistoryState,
): { state: MutationHistoryState; batch: MutationBatch } | null {
  if (state.past.length === 0) return null;
  const newestIdx = state.past.length - 1;
  const batch = state.past[newestIdx]!;
  const nextPast = state.past.slice(0, newestIdx);
  const nextFuture = [...state.future, batch];
  return {
    state: { past: nextPast, future: nextFuture },
    batch,
  };
}

/**
 * (Decision C.1): pop the newest entry from `future` for redo.
 *
 * - Returns `null` when `future` is empty (caller's `redo()` becomes a
 *   no-op).
 * - Otherwise returns `{state, batch}` where `state` has the popped
 *   batch moved back to `past` (newest-at-end), and `batch` is the
 *   original recorded entry — redo replays the ORIGINAL gesture's
 *   effect (no reversal needed; consumer applies the unswapped
 *   mutations).
 *
 * **Pure function.** No mutation of input state.
 */
export function popRedoBatch(
  state: MutationHistoryState,
): { state: MutationHistoryState; batch: MutationBatch } | null {
  if (state.future.length === 0) return null;
  const newestIdx = state.future.length - 1;
  const batch = state.future[newestIdx]!;
  const nextFuture = state.future.slice(0, newestIdx);
  const nextPast = [...state.past, batch];
  return {
    state: { past: nextPast, future: nextFuture },
    batch,
  };
}

/**
 * (Decision B.1): swap `oldValue` ↔ `newValue` for every
 * mutation in the batch, preserving `rowId` / `colId` / metadata.
 * Used by the adapter's `undo()` path to produce the payload for the
 * `history-replay` emit — consumer applies the swapped mutations via
 * the same Map-keyed batch-write code they use for paste / fill, and
 * the cell visually reverts to its pre-gesture value.
 *
 * Identity-stable: calling twice on the same input produces the same
 * output (the mutations array is rebuilt each call, but values are
 * deterministic).
 *
 * **Pure function.** No mutation of input batch.
 */
export function reverseMutationBatch(batch: MutationBatch): MutationBatch {
  const reversed: PasteMutation[] = batch.mutations.map((m) => ({
    rowId: m.rowId,
    colId: m.colId,
    oldValue: m.newValue,
    newValue: m.oldValue,
  }));
  return {
    id: batch.id,
    source: batch.source,
    mutations: reversed,
    recordedAt: batch.recordedAt,
  };
}

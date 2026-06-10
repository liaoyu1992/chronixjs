import { describe, expect, it } from 'vitest';

import {
  appendMutationBatch,
  EMPTY_MUTATION_HISTORY,
  popRedoBatch,
  popUndoBatch,
  reverseMutationBatch,
  type MutationBatch,
  type MutationHistoryState,
} from './mutation-history.js';

import type { PasteMutation } from './compute-paste-mutations.js';

function makeBatch(id: string, mutations: readonly PasteMutation[] = []): MutationBatch {
  return {
    id,
    source: 'cell-edit',
    mutations,
    recordedAt: 1_000_000,
  };
}

describe('appendMutationBatch', () => {
  it('push first batch → past.length === 1, future empty', () => {
    const next = appendMutationBatch(EMPTY_MUTATION_HISTORY, makeBatch('mb-1'), 100);
    expect(next.past).toHaveLength(1);
    expect(next.past[0]!.id).toBe('mb-1');
    expect(next.future).toEqual([]);
  });

  it('push N batches → past keeps insertion order (newest at end)', () => {
    let state: MutationHistoryState = EMPTY_MUTATION_HISTORY;
    state = appendMutationBatch(state, makeBatch('mb-1'), 100);
    state = appendMutationBatch(state, makeBatch('mb-2'), 100);
    state = appendMutationBatch(state, makeBatch('mb-3'), 100);
    expect(state.past.map((b) => b.id)).toEqual(['mb-1', 'mb-2', 'mb-3']);
  });

  it('push when past.length === maxDepth → drop oldest, length stays at maxDepth', () => {
    let state: MutationHistoryState = EMPTY_MUTATION_HISTORY;
    state = appendMutationBatch(state, makeBatch('mb-1'), 3);
    state = appendMutationBatch(state, makeBatch('mb-2'), 3);
    state = appendMutationBatch(state, makeBatch('mb-3'), 3);
    state = appendMutationBatch(state, makeBatch('mb-4'), 3);
    expect(state.past).toHaveLength(3);
    expect(state.past.map((b) => b.id)).toEqual(['mb-2', 'mb-3', 'mb-4']);
  });

  it('push when future has entries → future cleared (new mutation invalidates redo stack)', () => {
    const stateWithFuture: MutationHistoryState = {
      past: [makeBatch('mb-1')],
      future: [makeBatch('mb-2-future')],
    };
    const next = appendMutationBatch(stateWithFuture, makeBatch('mb-3'), 100);
    expect(next.future).toEqual([]);
    expect(next.past).toHaveLength(2);
  });

  it('maxDepth: 0 → returns state unchanged (recording suppressed)', () => {
    const next = appendMutationBatch(EMPTY_MUTATION_HISTORY, makeBatch('mb-1'), 0);
    expect(next).toBe(EMPTY_MUTATION_HISTORY);
  });

  it('batch with empty mutations array → still pushed (preserves gesture slot in history)', () => {
    const next = appendMutationBatch(EMPTY_MUTATION_HISTORY, makeBatch('mb-1', []), 100);
    expect(next.past).toHaveLength(1);
    expect(next.past[0]!.mutations).toEqual([]);
  });
});

describe('popUndoBatch', () => {
  it('past.length === 0 → returns null', () => {
    expect(popUndoBatch(EMPTY_MUTATION_HISTORY)).toBeNull();
  });

  it('past.length > 0 → returns popped batch + state with batch moved to future', () => {
    let state: MutationHistoryState = EMPTY_MUTATION_HISTORY;
    state = appendMutationBatch(state, makeBatch('mb-1'), 100);
    state = appendMutationBatch(state, makeBatch('mb-2'), 100);
    const popped = popUndoBatch(state);
    expect(popped).not.toBeNull();
    expect(popped!.batch.id).toBe('mb-2');
    expect(popped!.state.past.map((b) => b.id)).toEqual(['mb-1']);
    expect(popped!.state.future.map((b) => b.id)).toEqual(['mb-2']);
  });

  it('multiple consecutive pops → past shrinks, future grows in LIFO order', () => {
    let state: MutationHistoryState = EMPTY_MUTATION_HISTORY;
    state = appendMutationBatch(state, makeBatch('mb-1'), 100);
    state = appendMutationBatch(state, makeBatch('mb-2'), 100);
    state = appendMutationBatch(state, makeBatch('mb-3'), 100);
    const pop1 = popUndoBatch(state)!;
    expect(pop1.batch.id).toBe('mb-3');
    const pop2 = popUndoBatch(pop1.state)!;
    expect(pop2.batch.id).toBe('mb-2');
    // After 2 pops: past = [mb-1], future = [mb-3, mb-2] (insertion order, newest = mb-2 at end).
    expect(pop2.state.past.map((b) => b.id)).toEqual(['mb-1']);
    expect(pop2.state.future.map((b) => b.id)).toEqual(['mb-3', 'mb-2']);
  });

  it('popped batch is the original (NOT reversed; reversal is the adapter responsibility)', () => {
    const original = makeBatch('mb-1', [{ rowId: 'r1', colId: 'qty', oldValue: 5, newValue: 9 }]);
    const state = appendMutationBatch(EMPTY_MUTATION_HISTORY, original, 100);
    const popped = popUndoBatch(state)!;
    expect(popped.batch).toBe(original);
    expect(popped.batch.mutations[0]!.oldValue).toBe(5);
    expect(popped.batch.mutations[0]!.newValue).toBe(9);
  });
});

describe('popRedoBatch', () => {
  it('future.length === 0 → returns null', () => {
    expect(popRedoBatch(EMPTY_MUTATION_HISTORY)).toBeNull();
  });

  it('future.length > 0 → returns popped batch + state with batch moved to past', () => {
    const state: MutationHistoryState = {
      past: [makeBatch('mb-1')],
      future: [makeBatch('mb-2'), makeBatch('mb-3')],
    };
    const popped = popRedoBatch(state);
    expect(popped).not.toBeNull();
    expect(popped!.batch.id).toBe('mb-3');
    expect(popped!.state.past.map((b) => b.id)).toEqual(['mb-1', 'mb-3']);
    expect(popped!.state.future.map((b) => b.id)).toEqual(['mb-2']);
  });

  it('multiple consecutive pops → future shrinks, past grows (newest moves back first)', () => {
    const state: MutationHistoryState = {
      past: [],
      future: [makeBatch('mb-1'), makeBatch('mb-2'), makeBatch('mb-3')],
    };
    const pop1 = popRedoBatch(state)!;
    expect(pop1.batch.id).toBe('mb-3');
    const pop2 = popRedoBatch(pop1.state)!;
    expect(pop2.batch.id).toBe('mb-2');
    expect(pop2.state.past.map((b) => b.id)).toEqual(['mb-3', 'mb-2']);
    expect(pop2.state.future.map((b) => b.id)).toEqual(['mb-1']);
  });

  it('round-trip: append → undo → redo restores original state (identity-wise)', () => {
    const batch = makeBatch('mb-1');
    const s1 = appendMutationBatch(EMPTY_MUTATION_HISTORY, batch, 100);
    const undone = popUndoBatch(s1)!;
    const redone = popRedoBatch(undone.state)!;
    expect(redone.batch).toBe(batch);
    expect(redone.state.past.map((b) => b.id)).toEqual(['mb-1']);
    expect(redone.state.future).toEqual([]);
  });
});

describe('reverseMutationBatch', () => {
  it('empty mutations array → empty reversed array', () => {
    const batch = makeBatch('mb-1', []);
    const reversed = reverseMutationBatch(batch);
    expect(reversed.mutations).toEqual([]);
    expect(reversed.id).toBe('mb-1');
    expect(reversed.source).toBe('cell-edit');
  });

  it('single mutation → newValue / oldValue swapped; rowId + colId preserved', () => {
    const batch = makeBatch('mb-1', [{ rowId: 'r1', colId: 'qty', oldValue: 5, newValue: 9 }]);
    const reversed = reverseMutationBatch(batch);
    expect(reversed.mutations).toEqual([{ rowId: 'r1', colId: 'qty', oldValue: 9, newValue: 5 }]);
  });

  it('N mutations → all swapped, order preserved', () => {
    const batch = makeBatch('mb-1', [
      { rowId: 'r1', colId: 'qty', oldValue: 5, newValue: 9 },
      { rowId: 'r2', colId: 'qty', oldValue: 7, newValue: 11 },
      { rowId: 'r3', colId: 'name', oldValue: 'Alice', newValue: 'Bob' },
    ]);
    const reversed = reverseMutationBatch(batch);
    expect(reversed.mutations).toHaveLength(3);
    expect(reversed.mutations[0]).toEqual({
      rowId: 'r1',
      colId: 'qty',
      oldValue: 9,
      newValue: 5,
    });
    expect(reversed.mutations[1]).toEqual({
      rowId: 'r2',
      colId: 'qty',
      oldValue: 11,
      newValue: 7,
    });
    expect(reversed.mutations[2]).toEqual({
      rowId: 'r3',
      colId: 'name',
      oldValue: 'Bob',
      newValue: 'Alice',
    });
  });

  it('deterministic: same input twice → same output values', () => {
    const batch = makeBatch('mb-1', [{ rowId: 'r1', colId: 'qty', oldValue: 5, newValue: 9 }]);
    const r1 = reverseMutationBatch(batch);
    const r2 = reverseMutationBatch(batch);
    expect(r1.mutations).toEqual(r2.mutations);
  });
});

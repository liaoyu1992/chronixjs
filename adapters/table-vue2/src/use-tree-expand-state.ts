import { computed, ref, watch, type ComputedRef, type Ref } from 'vue';

import type { RowSpec } from '@chronixjs/table';

/**
 * vue2 composable for tree-data expand state.
 * Verbatim port of vue3's `use-tree-expand-state.ts` —
 * Vue 2.7's Composition API has the same `Ref` / `computed` / `watch`
 * shape so the port is mechanical.
 *
 * Hybrid controlled / uncontrolled per Decision B.1 (matches
 * `useActiveCell` + `useCellRange` precedents):
 *
 * - When `controlled.value` is non-undefined → controlled mode. Source
 *   of truth is the prop; toggle / expand / collapse emit `change`
 *   without mutating local state. The consumer must update its prop
 *   binding to see the change reflected.
 * - When `controlled.value` is undefined → uncontrolled mode. Internal
 *   `Set<string>` mutates on toggle / expand / collapse. `change`
 *   emits each time as a notification.
 *
 * Initial state in uncontrolled mode:
 *
 * 1. If `defaultExpandedRowIds.value` is set → use it verbatim.
 * 2. Else if `defaultExpandedDepth.value` is set → walk `rows` once at
 *    composable mount, collecting every parent row's `id` up to that
 *    depth (inclusive). `defaultExpandedDepth === 0` = "only top-level
 *    visible" = no parents collected (empty set).
 *
 * The depth-walk uses the consumer's input row shape (with `children`),
 * NOT the post-flatten output. It runs ONCE at mount; subsequent
 * changes to `defaultExpandedDepth` or `defaultExpandedRowIds` are
 * IGNORED (otherwise they would fight with the user's toggle gestures).
 * To re-seed expand state at runtime, the consumer flips to controlled
 * mode + sets `controlled.value` directly.
 */
export interface UseTreeExpandStateInput {
  /** Controlled prop binding. `undefined` = uncontrolled mode. */
  readonly controlled: Readonly<Ref<readonly string[] | undefined>>;
  /** Initial expanded IDs in uncontrolled mode. */
  readonly defaultExpandedRowIds: Readonly<Ref<readonly string[] | undefined>>;
  /** Initial expand depth in uncontrolled mode (default `0`). */
  readonly defaultExpandedDepth: Readonly<Ref<number | undefined>>;
  /** Tree-shaped consumer rows (for depth-walk seeding). */
  readonly rows: Readonly<Ref<readonly RowSpec[]>>;
  /** Callback fired on every expand-state change. */
  readonly emit: (next: readonly string[]) => void;
}

export interface UseTreeExpandStateApi {
  /** Current expanded ID set; `O(1)` membership lookup for the flatten pass. */
  readonly expandedRowIdsSet: ComputedRef<ReadonlySet<string>>;
  /** Current expanded IDs as a stable array (for emit payload + persistence). */
  readonly expandedRowIds: ComputedRef<readonly string[]>;
  /** Toggle the row's expand state (no-op when the row id is unknown — the next render exposes it). */
  toggle(rowId: string): void;
  /** Force-expand the row. No-op when already expanded. */
  expand(rowId: string): void;
  /** Force-collapse the row. No-op when already collapsed. */
  collapse(rowId: string): void;
}

export function useTreeExpandState(input: UseTreeExpandStateInput): UseTreeExpandStateApi {
  const internalSet = ref(new Set<string>(seedInitialIds(input)));

  // Detect mode switches: if the controlled binding becomes non-
  // undefined after mounting, freeze internal state (it's irrelevant
  // for derivations). If it becomes undefined again, internal state
  // resumes as the source of truth — keep the last-seen-controlled
  // ids so the user doesn't lose context on toggle.
  watch(
    () => input.controlled.value,
    (next, prev) => {
      if (prev != null && next == null) {
        internalSet.value = new Set(prev);
      }
    },
  );

  const expandedRowIdsSet = computed<ReadonlySet<string>>(() => {
    const controlledIds = input.controlled.value;
    if (controlledIds != null) {
      return new Set(controlledIds);
    }
    return internalSet.value;
  });

  const expandedRowIds = computed<readonly string[]>(() => Array.from(expandedRowIdsSet.value));

  const applyNext = (next: ReadonlySet<string>): void => {
    const payload = Array.from(next);
    if (input.controlled.value == null) {
      internalSet.value = new Set(next);
    }
    input.emit(payload);
  };

  const toggle = (rowId: string): void => {
    const current = expandedRowIdsSet.value;
    const next = new Set(current);
    if (next.has(rowId)) {
      next.delete(rowId);
    } else {
      next.add(rowId);
    }
    applyNext(next);
  };

  const expand = (rowId: string): void => {
    const current = expandedRowIdsSet.value;
    if (current.has(rowId)) return;
    const next = new Set(current);
    next.add(rowId);
    applyNext(next);
  };

  const collapse = (rowId: string): void => {
    const current = expandedRowIdsSet.value;
    if (!current.has(rowId)) return;
    const next = new Set(current);
    next.delete(rowId);
    applyNext(next);
  };

  return { expandedRowIdsSet, expandedRowIds, toggle, expand, collapse };
}

/**
 * Compute the initial expanded IDs once at composable mount. In
 * uncontrolled mode, `defaultExpandedRowIds` (when set) wins over
 * `defaultExpandedDepth`. In controlled mode, the seed is irrelevant
 * (`expandedRowIdsSet` derives from `controlled`) — but we still
 * compute it so toggling controlled → uncontrolled mid-life has a
 * sensible fallback.
 */
function seedInitialIds(input: UseTreeExpandStateInput): readonly string[] {
  const explicit = input.defaultExpandedRowIds.value;
  if (explicit != null) return explicit;
  const depth = input.defaultExpandedDepth.value ?? 0;
  if (depth <= 0) return [];
  const out: string[] = [];
  const walk = (rows: readonly RowSpec[], currentDepth: number): void => {
    for (const row of rows) {
      if (row.children != null && row.children.length > 0) {
        out.push(row.id);
        if (currentDepth + 1 < depth) {
          walk(row.children, currentDepth + 1);
        }
      }
    }
  };
  walk(input.rows.value, 0);
  return out;
}

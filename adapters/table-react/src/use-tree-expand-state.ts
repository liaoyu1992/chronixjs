import { useCallback, useMemo, useRef, useState } from 'react';

import type { RowSpec } from '@chronixjs/table';

/**
 * (react port, 2026-05-28): React hook for tree-data
 * expand state. Mirrors the vue3 `useTreeExpandState` composable's
 * hybrid controlled / uncontrolled posture (Decision B.1).
 *
 * - When `controlled` is non-undefined → controlled mode. Source of
 *   truth is the prop; toggle / expand / collapse fire `onChange`
 *   without mutating local state.
 * - When `controlled` is undefined → uncontrolled mode. Internal
 *   `Set<string>` mutates on toggle / expand / collapse. `onChange`
 *   emits as a notification.
 *
 * Initial state in uncontrolled mode: prefers `defaultExpandedRowIds`
 * (verbatim list); falls back to a depth walk of `rows` collecting
 * every parent's id up to `defaultExpandedDepth` (inclusive).
 *
 * The depth-walk runs ONCE at hook mount via `useRef`-stored seed;
 * subsequent changes to `defaultExpandedRowIds` or
 * `defaultExpandedDepth` are IGNORED (otherwise they would fight the
 * user's toggle gestures).
 */
export interface UseTreeExpandStateOptions {
  /** Controlled prop binding. `undefined` = uncontrolled mode. */
  readonly controlled: readonly string[] | undefined;
  /** Initial expanded IDs in uncontrolled mode. */
  readonly defaultExpandedRowIds: readonly string[] | undefined;
  /** Initial expand depth in uncontrolled mode (default `0`). */
  readonly defaultExpandedDepth: number | undefined;
  /** Tree-shaped consumer rows (for depth-walk seeding). */
  readonly rows: readonly RowSpec[];
  /** Callback fired on every expand-state change. */
  readonly onChange: (next: readonly string[]) => void;
}

export interface UseTreeExpandStateApi {
  readonly expandedRowIdsSet: ReadonlySet<string>;
  readonly expandedRowIds: readonly string[];
  toggle(rowId: string): void;
  expand(rowId: string): void;
  collapse(rowId: string): void;
}

export function useTreeExpandState(options: UseTreeExpandStateOptions): UseTreeExpandStateApi {
  const { controlled, defaultExpandedRowIds, defaultExpandedDepth, rows, onChange } = options;

  // Seed once at mount. `useRef` mounts the seed exactly once; the
  // initial-state callback to `useState` runs once and stores the
  // resulting Set.
  const seedRef = useRef<readonly string[] | null>(null);
  seedRef.current ??= computeSeedIds(defaultExpandedRowIds, defaultExpandedDepth, rows);
  const [internalSet, setInternalSet] = useState<ReadonlySet<string>>(
    () => new Set(seedRef.current ?? []),
  );

  const expandedRowIdsSet = useMemo<ReadonlySet<string>>(() => {
    if (controlled != null) return new Set(controlled);
    return internalSet;
  }, [controlled, internalSet]);

  const expandedRowIds = useMemo<readonly string[]>(
    () => Array.from(expandedRowIdsSet),
    [expandedRowIdsSet],
  );

  const applyNext = useCallback(
    (next: ReadonlySet<string>): void => {
      const payload = Array.from(next);
      if (controlled == null) {
        setInternalSet(new Set(next));
      }
      onChange(payload);
    },
    [controlled, onChange],
  );

  const toggle = useCallback(
    (rowId: string): void => {
      const next = new Set(expandedRowIdsSet);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      applyNext(next);
    },
    [expandedRowIdsSet, applyNext],
  );

  const expand = useCallback(
    (rowId: string): void => {
      if (expandedRowIdsSet.has(rowId)) return;
      const next = new Set(expandedRowIdsSet);
      next.add(rowId);
      applyNext(next);
    },
    [expandedRowIdsSet, applyNext],
  );

  const collapse = useCallback(
    (rowId: string): void => {
      if (!expandedRowIdsSet.has(rowId)) return;
      const next = new Set(expandedRowIdsSet);
      next.delete(rowId);
      applyNext(next);
    },
    [expandedRowIdsSet, applyNext],
  );

  return { expandedRowIdsSet, expandedRowIds, toggle, expand, collapse };
}

/**
 * Compute the initial expanded-IDs seed at hook mount. Prefers an
 * explicit `defaultExpandedRowIds` list; falls back to a depth walk
 * of `rows`. Identical to the vue3 composable's seed logic.
 */
function computeSeedIds(
  explicit: readonly string[] | undefined,
  depth: number | undefined,
  rows: readonly RowSpec[],
): readonly string[] {
  if (explicit != null) return explicit;
  const d = depth ?? 0;
  if (d <= 0) return [];
  const out: string[] = [];
  const walk = (rs: readonly RowSpec[], currentDepth: number): void => {
    for (const row of rs) {
      if (row.children != null && row.children.length > 0) {
        out.push(row.id);
        if (currentDepth + 1 < d) {
          walk(row.children, currentDepth + 1);
        }
      }
    }
  };
  walk(rows, 0);
  return out;
}

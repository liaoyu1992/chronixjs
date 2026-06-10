import { useReducer, useRef, type PointerEvent as ReactPointerEvent } from 'react';

import type { BarSpec } from '@chronixjs/gantt';

/**
 * Payload emitted by `<ChronixGantt onBarClick={...}>`. Fires on a
 * plain (no-drag) pointerup that landed on a bar body. Bar-edge hits
 * (resize zones) and progress-handle hits do NOT fire `onBarClick` —
 * they have their own transaction lifecycles.
 *
 * `jsEvent.shiftKey` is the cue for multi-select / toggle behavior —
 * consumers can read it directly or rely on
 * `useGanttSelection.handleBarClick` to apply the standard rules.
 */
export interface BarClickPayload {
  readonly barId: string;
  readonly sourceBar: BarSpec;
  readonly jsEvent: ReactPointerEvent<SVGSVGElement>;
}

/**
 * Payload emitted by `<ChronixGantt onEmptyAreaClick={...}>`. Fires on a
 * plain pointerup that landed on an empty row (no bar at the position)
 * when no transaction committed. Useful for "click outside to clear
 * selection" handling via `useGanttSelection`.
 */
export interface EmptyAreaClickPayload {
  readonly rowId: string | null;
  readonly jsEvent: ReactPointerEvent<SVGSVGElement>;
  /**
   * Phase 54 — calendar time at the click position in chart content-
   * coord space. Computed by the adapter via `xToTime(x, axis)`. Mirrors
   * the original `dateClick(DatePointApi)` `.date` field.
   * Approximate during DST transitions (matches the original spec's mapping).
   */
  readonly time: Date;
}

/**
 * Payload describing a selection delta — surfaces what changed across
 * a single state mutation so downstream observers (logging, URL state,
 * external stores) don't have to diff the array themselves.
 */
export interface SelectionChangePayload {
  readonly selectedBarIds: readonly string[];
  readonly addedBarIds: readonly string[];
  readonly removedBarIds: readonly string[];
}

export interface UseGanttSelectionConfig {
  /**
   * When true (default), an `empty-area-click` event clears the current
   * selection. Set to `false` to keep the selection regardless of clicks
   * outside any bar — useful when consumers manage selection-clear via
   * their own UI (e.g. an "x" button).
   */
  readonly unselectAuto?: boolean;
}

export interface UseGanttSelectionOutput {
  /** Current selected bar ids in insertion order. */
  readonly selectedBarIds: readonly string[];
  isSelected(barId: string): boolean;
  /** Add a bar id to the selection (no-op if already selected). */
  select(barId: string): void;
  /** Remove a bar id from the selection (no-op if not selected). */
  deselect(barId: string): void;
  /** Toggle a bar id's selection state. */
  toggle(barId: string): void;
  /** Clear all selected bar ids. */
  clear(): void;
  /**
   * Drop-in handler for `<ChronixGantt onBarClick={handleBarClick}>`.
   * Plain click → REPLACE selection (becomes just the clicked bar).
   * Shift-click → TOGGLE the clicked bar's selection state.
   */
  handleBarClick(payload: BarClickPayload): void;
  /**
   * Drop-in handler for
   * `<ChronixGantt onEmptyAreaClick={handleEmptyAreaClick}>`. When
   * `unselectAuto: true` (default), clears the selection. When `false`,
   * this is a no-op.
   */
  handleEmptyAreaClick(payload: EmptyAreaClickPayload): void;
}

/**
 * Stateful selection helper for chronix-gantt-react. Wraps the standard
 * "controlled `selectedBarIds`" pattern with single-click-replaces +
 * shift-click-toggles + auto-clear-on-empty-click semantics so the
 * common case is one line: `const sel = useGanttSelection()`.
 *
 * Consumers who want full control bypass this and manage `selectedBarIds`
 * themselves (e.g. shared with an external store / URL state).
 *
 * State pattern: a `useRef<Set<string>>` holds live insertion-order
 * state; a `useReducer` counter forces re-render on mutation. The
 * output's `selectedBarIds` is a getter that reads a cached
 * `Array.from(set)` snapshot updated atomically with each write. This
 * matches the Phase 32.2 `useGanttPointer` pattern so consumers can
 * `sel.select('b1'); console.log(sel.selectedBarIds);` inside the same
 * handler and observe the just-written state.
 */
export function useGanttSelection(config: UseGanttSelectionConfig = {}): UseGanttSelectionOutput {
  const unselectAuto = config.unselectAuto ?? true;

  // Live state — read by getter every access; Set-backed for O(1)
  // add/remove/has + insertion-order iteration semantics.
  const setRef = useRef<Set<string>>(new Set());
  // Cached array snapshot — rebuilt on every mutation so the getter is
  // O(1) and the returned array identity is stable until the next write
  // (consumers can use it as a `useMemo` dependency).
  const arrayRef = useRef<readonly string[]>([]);
  // Force-render counter — bumped on every state mutation so React
  // schedules a re-render of consumers reading the getter at render time.
  const [, forceRender] = useReducer((n: number) => n + 1, 0);

  function commitSet(next: Set<string>): void {
    setRef.current = next;
    arrayRef.current = Array.from(next);
    forceRender();
  }

  function isSelected(barId: string): boolean {
    return setRef.current.has(barId);
  }

  function select(barId: string): void {
    if (setRef.current.has(barId)) return;
    const next = new Set(setRef.current);
    next.add(barId);
    commitSet(next);
  }

  function deselect(barId: string): void {
    if (!setRef.current.has(barId)) return;
    const next = new Set(setRef.current);
    next.delete(barId);
    commitSet(next);
  }

  function toggle(barId: string): void {
    if (setRef.current.has(barId)) deselect(barId);
    else select(barId);
  }

  function clear(): void {
    if (setRef.current.size === 0) return;
    commitSet(new Set());
  }

  function replaceWith(next: ReadonlySet<string>): void {
    commitSet(new Set(next));
  }

  function handleBarClick(payload: BarClickPayload): void {
    if (payload.jsEvent.shiftKey) {
      toggle(payload.barId);
    } else {
      // Plain click → REPLACE selection with just this bar.
      replaceWith(new Set([payload.barId]));
    }
  }

  function handleEmptyAreaClick(_payload: EmptyAreaClickPayload): void {
    if (unselectAuto) clear();
  }

  return {
    get selectedBarIds() {
      return arrayRef.current;
    },
    isSelected,
    select,
    deselect,
    toggle,
    clear,
    handleBarClick,
    handleEmptyAreaClick,
  };
}

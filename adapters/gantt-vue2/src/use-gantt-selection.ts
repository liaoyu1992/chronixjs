import { computed, ref, type ComputedRef } from 'vue';

import type { BarSpec } from '@chronixjs/gantt';

/**
 * Payload emitted by `<ChronixGantt @bar-click="...">`. Fires on a
 * plain (no-drag) pointerup that landed on a bar body. Bar-edge hits
 * (resize zones) and progress-handle hits do NOT fire `'bar-click'`
 * — they have their own transaction lifecycles.
 *
 * `jsEvent.shiftKey` is the cue for multi-select / toggle behavior
 * — consumers can read it directly or rely on
 * `useGanttSelection.handleBarClick` to apply the standard rules.
 */
export interface BarClickPayload {
  readonly barId: string;
  readonly sourceBar: BarSpec;
  readonly jsEvent: PointerEvent;
}

/**
 * Payload emitted by `<ChronixGantt @empty-area-click="...">`. Fires
 * on a plain pointerup that landed on an empty row (no bar at the
 * position) when no transaction committed. Useful for "click outside
 * to clear selection" handling via `useGanttSelection`.
 */
export interface EmptyAreaClickPayload {
  readonly rowId: string | null;
  readonly jsEvent: PointerEvent;
  /**
   * Phase 54 — calendar time at the click position in chart content-
   * coord space. Computed by the adapter via `xToTime(x, axis)`. Mirrors
   * the original `dateClick(DatePointApi)` `.date` field.
   * Approximate during DST transitions (matches the original spec's mapping).
   */
  readonly time: Date;
}

/**
 * Payload describing a selection delta. Emitted by
 * `useGanttSelection`'s internal state changes; can also be wired
 * back to `<ChronixGantt @selection-change="...">` when the consumer
 * wants the adapter to participate (e.g. for logging).
 */
export interface SelectionChangePayload {
  readonly selectedBarIds: readonly string[];
  readonly addedBarIds: readonly string[];
  readonly removedBarIds: readonly string[];
}

export interface UseGanttSelectionConfig {
  /**
   * When true (default), an `empty-area-click` event clears the
   * current selection. Set to `false` to keep the selection
   * regardless of clicks outside any bar — useful when consumers
   * manage selection-clear via their own UI (e.g. an "x" button).
   */
  readonly unselectAuto?: boolean;
}

export interface UseGanttSelectionOutput {
  /** Current selected bar ids in insertion order. */
  readonly selectedBarIds: ComputedRef<readonly string[]>;
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
   * Drop-in handler for `<ChronixGantt @bar-click="handleBarClick">`.
   * Plain click → REPLACE selection (becomes just the clicked bar).
   * Shift-click → TOGGLE the clicked bar's selection state.
   */
  handleBarClick(payload: BarClickPayload): void;
  /**
   * Drop-in handler for
   * `<ChronixGantt @empty-area-click="handleEmptyAreaClick">`.
   * When `unselectAuto: true` (default), clears the selection. When
   * `false`, this is a no-op.
   */
  handleEmptyAreaClick(payload: EmptyAreaClickPayload): void;
}

/**
 * Stateful selection helper. Wraps the standard "controlled
 * `selectedBarIds`" pattern with single-click-replaces +
 * shift-click-toggles + auto-clear-on-empty-click semantics so the
 * common case is one line: `const sel = useGanttSelection()`.
 *
 * Consumers who want full control bypass this and manage
 * `selectedBarIds` themselves (e.g. shared with an external store /
 * URL state).
 */
export function useGanttSelection(config: UseGanttSelectionConfig = {}): UseGanttSelectionOutput {
  const unselectAuto = config.unselectAuto ?? true;

  // Set-backed for O(1) add/remove/has + ordered iteration via
  // insertion order (JS Map / Set iteration is insertion-ordered
  // since ES2015).
  const selected = ref(new Set<string>());

  const selectedBarIds = computed<readonly string[]>(() => Array.from(selected.value));

  function isSelected(barId: string): boolean {
    return selected.value.has(barId);
  }

  function replaceWith(next: ReadonlySet<string>): void {
    // Replace the ref with a new Set instance so Vue's reactivity
    // detects the change. Mutating the existing Set wouldn't trigger
    // re-render of computed `selectedBarIds`.
    selected.value = new Set(next);
  }

  function select(barId: string): void {
    if (selected.value.has(barId)) return;
    const next = new Set(selected.value);
    next.add(barId);
    replaceWith(next);
  }

  function deselect(barId: string): void {
    if (!selected.value.has(barId)) return;
    const next = new Set(selected.value);
    next.delete(barId);
    replaceWith(next);
  }

  function toggle(barId: string): void {
    if (selected.value.has(barId)) deselect(barId);
    else select(barId);
  }

  function clear(): void {
    if (selected.value.size === 0) return;
    selected.value = new Set();
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
    selectedBarIds,
    isSelected,
    select,
    deselect,
    toggle,
    clear,
    handleBarClick,
    handleEmptyAreaClick,
  };
}

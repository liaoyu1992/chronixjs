import type { GanttEventMap } from './gantt-options.js';
import type { IncrementDelta } from './nav-utils.js';
import type { BarTable, LinkTable, RowDataSource } from '../data/index.js';
import type { BarSpec } from '../ir/index.js';
import type { ViewId } from '../layout/types.js';

/**
 * Imperative facade returned by the core mount. Adapters expose it to
 * users as a component ref or hook return value.
 *
 * All mutating methods are fire-and-forget; observers learn about the
 * effect through `subscribe`. Returned data collections are live — keep
 * the reference and re-read on demand rather than re-calling the getter
 * in a hot path.
 *
 * **Controlled-prop contract for view / navigation methods** (Phase 24):
 * `changeView` / `prev` / `next` / `today` / `gotoDate` / `incrementDate`
 * / `zoomTo` all emit `update:axisInput` with the new shape. They have
 * **no effect** unless the consumer wires `v-model:axis-input` (or the
 * equivalent prop+listener pair). Same channel as the toolbar widgets
 * (Phase 22) — single pathway, no internal-state hybrid.
 *
 * `scrollToDate` is the documented exception: it writes the chart
 * wrapper's `scrollLeft` directly. No emit; no consumer wiring required.
 */
export interface GanttHandle {
  // --- View / navigation (Phase 24) ----------------------------------

  /** Switch to a different view preset. Emits `update:axisInput` with `viewId`. */
  changeView(viewId: ViewId): void;

  /** Shift the anchor one period earlier per the current view. */
  prev(): void;

  /** Shift the anchor one period later per the current view. */
  next(): void;

  /** Reset the anchor to today (local midnight). */
  today(): void;

  /** Re-center the visible range on `date`. */
  gotoDate(date: Date): void;

  /** Apply a calendar-unit delta (days / weeks / months / years) to the anchor. */
  incrementDate(delta: IncrementDelta): void;

  /** Read the current anchor date. */
  getDate(): Date;

  /**
   * Recenter on `date` AND optionally switch view. Default `viewId` is
   * the current view — `zoomTo(d)` reads as "gotoDate but in one call,
   * preserving viewId". Pass an explicit `viewId` to also switch.
   */
  zoomTo(date: Date, viewId?: ViewId): void;

  // --- Scroll (Phase 24) ---------------------------------------------

  /**
   * Scroll the chart wrapper horizontally so that `date` is visible.
   * Maps the moment to its x-coordinate via the active axis (px-per-ms
   * × elapsed-ms-from-window-start) and writes
   * `wrapperRef.scrollLeft`. The browser clamps to
   * `[0, scrollWidth - clientWidth]`.
   *
   * Pure DOM side-effect — no emit. Safe to call before / after any
   * `update:axisInput` round-trip; the scroll write happens on the
   * current axis as the consumer sees it.
   */
  scrollToDate(date: Date): void;

  // --- Read-only bar lookup (Phase 24) -------------------------------

  /** Look up a bar by its stable id. Returns `undefined` when absent. */
  getBarById(id: string): BarSpec | undefined;

  /** Live bar collection. Includes any in-flight transaction overlay. */
  getBars(): readonly BarSpec[];

  // --- Existing data accessors (Phase 4+) ----------------------------

  /** Live bar collection wrapped in `BarTable` for indexed lookups. */
  getBarTable(): BarTable;

  /** Live row collection. */
  getRowDataSource(): RowDataSource;

  /** Live link collection. */
  getLinkTable(): LinkTable;

  /**
   * Register a listener for an event. Returns an unsubscribe function;
   * call it to detach.
   *
   * ```ts
   * const off = handle.subscribe('bar-drop', (p) => {
   *   // p: BarDropPayload (type-narrowed)
   * });
   * // later: off();
   * ```
   */
  subscribe<K extends keyof GanttEventMap>(
    event: K,
    listener: (payload: GanttEventMap[K]) => void,
  ): () => void;
}

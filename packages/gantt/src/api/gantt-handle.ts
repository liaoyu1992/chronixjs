import type { GanttEventMap } from './gantt-options.js';
import type { BarTable, LinkTable, RowDataSource } from '../data/index.js';

/**
 * Imperative facade returned by the core mount. Adapters expose it to
 * users as a component ref or hook return value.
 *
 * All mutating methods are fire-and-forget; observers learn about the
 * effect through `subscribe`. Returned data collections are live — keep
 * the reference and re-read on demand rather than re-calling the getter
 * in a hot path.
 */
export interface GanttHandle {
  /** Switch to a different view preset. No-op if `view` is already current. */
  changeView(view: string): void;

  /** Re-center the visible range on `date`. ISO 8601 string or Date instance. */
  gotoDate(date: Date | string): void;

  /** Live bar collection. Includes any in-flight transaction overlay. */
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

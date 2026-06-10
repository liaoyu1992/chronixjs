/**
 * Minimal marker for an in-flight pointer transaction. The `interaction/`
 * layer extends this with kind-specific overlays (drag deltas, resize edge
 * anchors, progress-handle drag values, calendar range bounds).
 *
 * Anti-regression hook #3: every collection in `data/` carries one of
 * these (or null) as `inFlightTransaction`, so drag-in-progress state is
 * representable inside the data layer — not a side car on the interaction
 * machine.
 */
export interface PendingTransaction {
  readonly kind: string;
  /** `performance.now()` snapshot captured at pointerdown. */
  readonly startedAt: number;
}

/**
 * Configuration for a `PointerCaptureSession`. Captured once at the
 * subject-registration site; the session itself is a runtime construct
 * implemented in Phase 3.
 */
export interface PointerCaptureConfig {
  /**
   * Anti-regression hook #4. When `false`, the session is willing to start
   * even if the initial `pointerdown` did NOT land on the registered subject
   * element. Necessary when the subject lives inside a `PointerOverlayGroup`
   * that may not be the topmost layer at the pointerdown location — the
   * canonical case being the progress triangle, which renders in a separate
   * SVG layer above the otherwise pointer-events:none timeline body.
   *
   * The reference-codebase analog (see `audit/R2_MAPPING.md`) is an
   * undocumented escape-hatch boolean; chronix promotes it to a first-class,
   * documented config field with a name that states the semantic intent.
   *
   * Default: `true`. Set to `false` for progress-handle and other overlay
   * subjects whose hit zones may be obscured at pointerdown time.
   */
  readonly requireInitialHit: boolean;
}

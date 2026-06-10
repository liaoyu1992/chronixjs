/**
 * Transition IR — Phase 8 (2026-06-02).
 *
 * Declarative spec for component enter/leave animations consumed by
 * Modal, Drawer, Popover, Tooltip, Tabs, Collapse, and any future
 * component with appearance/disappearance choreography.
 *
 * Scope: chronix-ui ships **CSS-property** transitions (opacity,
 * transform) whose initial + final states are statically derivable.
 * Height-based animations like `collapse` need DOM measurement
 * (`element.scrollHeight`) which is adapter-specific; those land in
 * each adapter's `useTransition` composable rather than the core IR.
 */

/**
 * Standard duration in milliseconds for chronix-ui transitions.
 * Phase 8 ships 200ms as the default — fast enough to feel responsive,
 * slow enough that users can register the motion.
 */
export const DEFAULT_TRANSITION_DURATION_MS = 200;

/**
 * Standard easing curve for chronix-ui transitions. Matches Material
 * Design's "standard" curve and the `transition-timing-function`
 * preset Tailwind ships as `transition-default`.
 */
export const DEFAULT_TRANSITION_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * A transition's timing parameters. Consumed by `buildFadeTransitionStyles`,
 * `buildZoomTransitionStyles`, `buildSlideTransitionStyles`, and
 * `formatCssTransitionShorthand`. Adapters typically construct one of
 * these from theme tokens + per-component overrides.
 */
export interface TransitionSpec {
  /** Total duration in ms. `0` produces an instant (no-animation) transition. */
  readonly durationMs: number;
  /**
   * CSS easing function string — any value accepted by the
   * `transition-timing-function` property (`'ease-in'`, `'linear'`,
   * `'cubic-bezier(...)'`, `'steps(...)'`, etc.).
   */
  readonly easing: string;
  /** Optional pre-animation delay in ms. `0` for no delay. */
  readonly delayMs: number;
}

/**
 * Default spec instantiating the two `DEFAULT_*` constants with zero
 * delay. Consumers omit `spec` in builders to get these defaults.
 */
export const defaultTransitionSpec: TransitionSpec = {
  durationMs: DEFAULT_TRANSITION_DURATION_MS,
  easing: DEFAULT_TRANSITION_EASING,
  delayMs: 0,
};

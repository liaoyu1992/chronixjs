/**
 * chronix-ui transition module — Phase 8 (2026-06-02).
 *
 * Declarative IR for component enter/leave animations. Pure-data spec +
 * pure-function builders for CSS-property transitions; adapters handle
 * DOM mutation (apply inline styles, listen for `transitionend`).
 *
 * Public surface:
 *
 * - **`TransitionSpec`** — timing params (`durationMs`, `easing`, `delayMs`).
 * - **`defaultTransitionSpec`** — 200ms / Material standard easing / no delay.
 * - **`DEFAULT_TRANSITION_DURATION_MS`** + **`DEFAULT_TRANSITION_EASING`**
 *   — reusable constants.
 * - **`TransitionPhaseStyles`** — 6-phase inline-style snapshot bag.
 * - **`buildFadeTransitionStyles`** — opacity-only transition.
 * - **`buildZoomTransitionStyles`** — opacity + `scale()` transform.
 * - **`buildSlideTransitionStyles`** — opacity + directional `translate()`.
 * - **`SlideDirection`** — `'from-top' | 'from-bottom' | 'from-left' | 'from-right'`.
 * - **`formatCssTransitionShorthand`** — `'opacity 200ms cubic-bezier(...)'` builder.
 *
 * NOT shipped in Phase 8 (deferred):
 *
 * - `collapse` (height animation) — needs DOM measurement, lives in
 *   adapter composables.
 * - `slot-machine` (digit-roll animation) — used by Statistic /
 *   NumberAnimation, lands with those components.
 * - `rotate` — typically inlined in component CSS (chevron, spinner),
 *   not a general-purpose transition.
 */

export {
  DEFAULT_TRANSITION_DURATION_MS,
  DEFAULT_TRANSITION_EASING,
  defaultTransitionSpec,
} from './transition-spec.js';
export type { TransitionSpec } from './transition-spec.js';
export { formatCssTransitionShorthand } from './format-css-transition.js';
export {
  buildFadeTransitionStyles,
  buildHeightCollapseTransitionStyles,
  buildSlideTransitionStyles,
  buildZoomTransitionStyles,
} from './transition-phase-styles.js';
export type { SlideDirection, TransitionPhaseStyles } from './transition-phase-styles.js';

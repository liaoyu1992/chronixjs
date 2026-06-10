/**
 * Spin IR — Phase 16 (2026-06-02). Tier A loading-state primitive.
 *
 * Renders an indeterminate rotating indicator with an optional
 * description below it. Inline / standalone form only — the
 * "wrap-children with overlay spinner" form is deferred (see
 * audit/UI_PHASE_16_LOADING_STATES_DESIGN.md § Out-of-scope).
 *
 * Public surface:
 *
 * - **`SpinSize`** — `'small' | 'medium' | 'large'`. Drives indicator
 *   diameter + stroke width.
 * - **`SpinProps`** + **`defaultSpinProps`**.
 * - **`resolveSpinClassList`** pure helper.
 *
 * Theme tokens read via CSS-var fallback in `spin-styles.ts`. Per
 * Phase 0.3 Decision A.1 the adapter's `size` default is `undefined`
 * so it falls back to `ctx.size`; `description` opts out of the
 * description row when `undefined` (testable only at the pure-fn
 * level — see Phase 15 Empty.description friction note).
 */

/** Sizing token. */
export type SpinSize = 'small' | 'medium' | 'large';

/**
 * Declarative props consumed by `ChronixSpin` adapters.
 */
export interface SpinProps {
  /** Sizing token — drives indicator diameter + stroke width. */
  readonly size: SpinSize;
  /**
   * When `false`, the spin is hidden (CSS `display: none` via
   * `--hidden` modifier). Lets consumers toggle visibility without
   * unmounting (preserves animation state).
   */
  readonly show: boolean;
  /**
   * Optional description text rendered below the indicator. When
   * `undefined`, the description row is omitted entirely. Adapters'
   * Vue prop machinery substitutes the declared default when
   * consumers pass `undefined`; the opt-out semantics are testable
   * only at the pure-fn level.
   */
  readonly description: string | undefined;
}

/**
 * Sensible defaults.
 */
export const defaultSpinProps: SpinProps = {
  size: 'medium',
  show: true,
  description: undefined,
};

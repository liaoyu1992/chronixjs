/**
 * Progress IR — . Tier A loading-state primitive,
 * line variant only. Circle / dashboard / segmented variants are
 * deferred (see audit/UI_PHASE_16_LOADING_STATES_DESIGN.md
 * § Out-of-scope + Decision B.1).
 *
 * Public surface:
 *
 * - **`ProgressType`** — `'default' | 'success' | 'warning' | 'error' |
 *   'info'`. Drives `__fill` bg color via CSS-var fallback.
 * - **`ProgressIndicatorPlacement`** — `'inside' | 'outside'`. `inside`
 *   overlays the percentage text inside the filled bar; `outside`
 *   appends it after the rail.
 * - **`ProgressProps`** + **`defaultProgressProps`**.
 * - **`resolveProgressClassList`** pure helper.
 * - **`formatProgressPercentage`** pure helper (see
 *   `./format-progress-percentage.ts`).
 *
 * Theme tokens read via CSS-var fallback in `progress-styles.ts`.
 */

/** Semantic color of the filled bar. */
export type ProgressType = 'default' | 'success' | 'warning' | 'error' | 'info';

/** Where the percentage text renders relative to the rail. */
export type ProgressIndicatorPlacement = 'inside' | 'outside';

/**
 * Declarative props consumed by `ChronixProgress` adapters.
 *
 * Numeric `percentage` is clamped to [0, 100] by `formatProgressPercentage`
 * — adapters compute the formatted value once and apply both the
 * inline `width:NN%` style on `__fill` AND the display string on
 * `__info`, so the rendered fill width always matches the displayed
 * percentage.
 */
export interface ProgressProps {
  /** Semantic color — drives `__fill` bg color. */
  readonly type: ProgressType;
  /**
   * Numeric percentage (0-100, but the helper clamps gracefully for
   * out-of-range values). Default 0.
   */
  readonly percentage: number;
  /**
   * When `true`, the `__info` element is rendered with the formatted
   * percentage text. When `false`, only the rail + fill render.
   */
  readonly showInfo: boolean;
  /**
   * Optional explicit rail height in pixels. When `undefined`, falls
   * back to the CSS-var token `--cx-ui-progress-rail-height` (default
   * 8px). Numeric so consumers can set per-instance height without
   * theme override.
   */
  readonly height: number | undefined;
  /**
   * Where the percentage text renders relative to the rail.
   * `'outside'` (default) appends the text after the rail; `'inside'`
   * overlays it on top of the filled portion.
   */
  readonly indicatorPlacement: ProgressIndicatorPlacement;
}

/**
 * Sensible defaults.
 */
export const defaultProgressProps: ProgressProps = {
  type: 'default',
  percentage: 0,
  showInfo: true,
  height: undefined,
  indicatorPlacement: 'outside',
};

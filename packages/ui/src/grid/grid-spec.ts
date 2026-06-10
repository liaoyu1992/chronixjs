/**
 * Grid IR — Phase 17 (2026-06-02). Tier A 2D layout primitive.
 *
 * CSS Grid container with simplified prop bag: `cols` (uniform N
 * via `repeat(N, 1fr)` OR verbatim string for arbitrary track
 * templates) + `xGap` + `yGap` (numeric, separate axes). Named
 * areas / auto-flow / `<ChronixGridItem>` wrapper are out of scope
 * for Phase 17 (see audit/UI_PHASE_17_LAYOUT_DESIGN.md
 * § Out-of-scope).
 *
 * Public surface:
 *
 * - **`GridProps`** + **`defaultGridProps`**.
 * - **`resolveGridClassList`** pure helper.
 * - **`resolveGridTracks`** + **`resolveGridGap`** pure helpers.
 */

/**
 * Declarative props consumed by `ChronixGrid` adapters.
 *
 * `cols` accepts either:
 * - `number` (e.g. `12`) → maps to `repeat(12, minmax(0, 1fr))`.
 * - `string` (e.g. `'120px 1fr 120px'`) → passed verbatim to
 *   `grid-template-columns`.
 * - `undefined` → no inline `grid-template-columns` (consumer
 *   provides via own CSS / inline style).
 *
 * `xGap` + `yGap` accept numeric pixel values; `undefined` omits
 * the inline declaration (CSS default gap is 0).
 */
export interface GridProps {
  /** Column track template — see field doc. */
  readonly cols: number | string | undefined;
  /** Column gap in pixels (CSS `column-gap`). */
  readonly xGap: number | undefined;
  /** Row gap in pixels (CSS `row-gap`). */
  readonly yGap: number | undefined;
  /**
   * When `true`, renders as `inline-grid` instead of `grid`. Useful
   * when the Grid itself flows inline with surrounding text.
   */
  readonly inline: boolean;
}

/**
 * Sensible defaults.
 */
export const defaultGridProps: GridProps = {
  cols: undefined,
  xGap: undefined,
  yGap: undefined,
  inline: false,
};

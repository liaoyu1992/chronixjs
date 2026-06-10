/**
 * Pure helper — convert Grid `xGap` + `yGap` numeric values into a
 * record of optional CSS-Grid-gap inline-style declarations
 * (`column-gap` + `row-gap`). Phase 17 (2026-06-02).
 *
 * Contract:
 *
 * - `undefined` axis → `undefined` in the result record; caller
 *   omits the corresponding `style` declaration.
 * - Numeric axis → `${n}px`. `0` returns `'0px'` (CSS length, not
 *   bare `0`).
 * - Negative values are passed through verbatim with `px` suffix
 *   (CSS will clamp at zero); no warning. Matches the precedent
 *   from `formatBadgeValue` / `formatSkeletonSize`.
 */
export interface GridGapStyle {
  readonly columnGap: string | undefined;
  readonly rowGap: string | undefined;
}

export function resolveGridGap(xGap: number | undefined, yGap: number | undefined): GridGapStyle {
  return {
    columnGap: xGap !== undefined ? `${xGap}px` : undefined,
    rowGap: yGap !== undefined ? `${yGap}px` : undefined,
  };
}

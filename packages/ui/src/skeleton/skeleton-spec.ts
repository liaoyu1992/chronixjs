/**
 * Skeleton IR — . Tier A placeholder primitive.
 *
 * Renders a single shimmering placeholder block (text line / rect /
 * circle). Consumers stack multiple `<ChronixSkeleton />` to produce
 * multi-line placeholders — the compound `lines: number` prop is out
 * of scope (see audit/UI_PHASE_16_LOADING_STATES_DESIGN.md
 * § Out-of-scope).
 *
 * Public surface:
 *
 * - **`SkeletonShape`** — `'text' | 'rect' | 'circle'`. Drives base
 *   width / height / border-radius defaults.
 * - **`SkeletonProps`** + **`defaultSkeletonProps`**.
 * - **`resolveSkeletonClassList`** pure helper.
 * - **`formatSkeletonSize`** pure helper (see
 *   `./format-skeleton-size.ts`).
 */

/** Visual shape token. */
export type SkeletonShape = 'text' | 'rect' | 'circle';

/**
 * Declarative props consumed by `ChronixSkeleton` adapters.
 *
 * `width` and `height` accept either a number (pixels — formatter
 * stringifies as `"NNpx"`) or a CSS-length string (e.g. `"100%"`,
 * `"3em"`) passed through verbatim. `undefined` falls back to the
 * shape's CSS default.
 */
export interface SkeletonProps {
  /** Visual shape — drives base sizing defaults. */
  readonly shape: SkeletonShape;
  /** Explicit width (px number or CSS-length string). */
  readonly width: string | number | undefined;
  /** Explicit height (px number or CSS-length string). */
  readonly height: string | number | undefined;
  /**
   * When `true`, applies the shimmer keyframes animation. When
   * `false`, the placeholder renders as a flat block (useful for
   * static "data unavailable" presentations or when motion is
   * undesirable).
   */
  readonly animated: boolean;
  /**
   * When `true`, applies fully-rounded ends (`border-radius: 999px`).
   * Useful for pill-shaped text placeholders. `circle` shape already
   * implies `border-radius: 50%` regardless of this modifier.
   */
  readonly round: boolean;
}

/**
 * Sensible defaults.
 */
export const defaultSkeletonProps: SkeletonProps = {
  shape: 'text',
  width: undefined,
  height: undefined,
  animated: true,
  round: false,
};

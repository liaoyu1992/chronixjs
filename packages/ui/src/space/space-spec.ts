/**
 * Space IR — Phase 17 (2026-06-02). Tier A 1D layout primitive.
 *
 * Convenience flexbox wrapper that stacks children with a consistent
 * gap. Same DOM shape as Flex (single `<div>`) but with a slimmer
 * prop bag that maps to common consumer mental models (`vertical` +
 * `size` token + `wrap`). When consumers need full flexbox control
 * (named direction / wrap-reverse / arbitrary gap values), they use
 * `ChronixFlex` instead. Both ship; the split is consumer-facing
 * only — see audit/UI_PHASE_17_LAYOUT_DESIGN.md Decision B.1.
 *
 * Public surface:
 *
 * - **`SpaceSize`** — `'small' | 'medium' | 'large'`. Discrete gap
 *   tokens mapped to CSS-var fallback chain via `resolveSpaceGap`.
 * - **`SpaceAlign`** / **`SpaceJustify`** — string unions covering
 *   the common flex-align / flex-justify values, normalized to
 *   CSS-native names (`start` not `flex-start`).
 * - **`SpaceProps`** + **`defaultSpaceProps`**.
 * - **`resolveSpaceClassList`** + **`resolveSpaceGap`** pure helpers.
 */

/** Discrete gap token. */
export type SpaceSize = 'small' | 'medium' | 'large';

/** Flexbox align-items value (CSS-native, sans `flex-` prefix). */
export type SpaceAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';

/** Flexbox justify-content value (CSS-native, sans `flex-` prefix). */
export type SpaceJustify =
  | 'start'
  | 'center'
  | 'end'
  | 'space-around'
  | 'space-between'
  | 'space-evenly';

/**
 * Declarative props consumed by `ChronixSpace` adapters.
 */
export interface SpaceProps {
  /**
   * Gap size. Discrete token (`'small' | 'medium' | 'large'`) maps
   * to a CSS-var with px fallback; numeric value applies as inline
   * `style.gap = ${n}px`.
   */
  readonly size: SpaceSize | number;
  /**
   * When `true`, children stack vertically (`flex-direction: column`).
   * When `false` (default), children stack horizontally.
   */
  readonly vertical: boolean;
  /**
   * When `true` (default), children wrap to a new line when the
   * container fills (`flex-wrap: wrap`). When `false`, children
   * overflow.
   */
  readonly wrap: boolean;
  /**
   * Cross-axis alignment. `undefined` (default) omits the
   * `align-items` declaration so consumers can override via CSS.
   */
  readonly align: SpaceAlign | undefined;
  /**
   * Main-axis justification. `undefined` (default) omits the
   * `justify-content` declaration.
   */
  readonly justify: SpaceJustify | undefined;
  /**
   * When `true`, renders as `inline-flex` instead of `flex`. Useful
   * when the Space itself flows inline with surrounding text.
   */
  readonly inline: boolean;
}

/**
 * Sensible defaults.
 */
export const defaultSpaceProps: SpaceProps = {
  size: 'medium',
  vertical: false,
  wrap: true,
  align: undefined,
  justify: undefined,
  inline: false,
};

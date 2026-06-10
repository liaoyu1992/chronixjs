/**
 * Flex IR — Phase 17 (2026-06-02). Tier A 1D layout primitive.
 *
 * Idiomatic flexbox container with explicit CSS-aligned prop names
 * (`direction` / `wrap` / `align` / `justify` / `gap`). Same DOM
 * shape as Space but with full flexbox vocabulary (including
 * `*-reverse` directions and `wrap-reverse`). See
 * audit/UI_PHASE_17_LAYOUT_DESIGN.md Decision B.1 — both Space and
 * Flex ship; the split is consumer-facing only.
 *
 * Public surface:
 *
 * - **`FlexDirection`** / **`FlexWrap`** / **`FlexAlign`** /
 *   **`FlexJustify`** — string unions covering the CSS flex
 *   vocabulary (CSS-native sans `flex-` prefix).
 * - **`FlexGap`** — `'small' | 'medium' | 'large' | number`.
 * - **`FlexProps`** + **`defaultFlexProps`**.
 * - **`resolveFlexClassList`** + **`resolveFlexGap`** pure helpers.
 */

/** Flexbox direction value (CSS-native). */
export type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';

/** Flexbox wrap value (CSS-native). */
export type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';

/** Flexbox align-items value (CSS-native, sans `flex-` prefix). */
export type FlexAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';

/** Flexbox justify-content value (CSS-native, sans `flex-` prefix). */
export type FlexJustify =
  | 'start'
  | 'center'
  | 'end'
  | 'space-around'
  | 'space-between'
  | 'space-evenly';

/** Gap value — discrete token or numeric px. */
export type FlexGap = 'small' | 'medium' | 'large' | number;

/**
 * Declarative props consumed by `ChronixFlex` adapters.
 */
export interface FlexProps {
  /** Flexbox direction. Default `'row'`. */
  readonly direction: FlexDirection;
  /** Flexbox wrap. Default `'nowrap'`. */
  readonly wrap: FlexWrap;
  /**
   * Cross-axis alignment. `undefined` (default) omits the
   * `align-items` declaration.
   */
  readonly align: FlexAlign | undefined;
  /**
   * Main-axis justification. `undefined` (default) omits the
   * `justify-content` declaration.
   */
  readonly justify: FlexJustify | undefined;
  /**
   * Gap between children. Token (`'small' | 'medium' | 'large'`) →
   * CSS-var; numeric → `${n}px`; `undefined` omits the inline-style
   * `gap` (default browser flexbox: 0).
   */
  readonly gap: FlexGap | undefined;
  /**
   * When `true`, renders as `inline-flex` instead of `flex`.
   */
  readonly inline: boolean;
}

/**
 * Sensible defaults.
 */
export const defaultFlexProps: FlexProps = {
  direction: 'row',
  wrap: 'nowrap',
  align: undefined,
  justify: undefined,
  gap: undefined,
  inline: false,
};

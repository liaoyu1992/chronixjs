import type { AnyTransaction } from '../interaction/index.js';
import type { BarSpec } from '../ir/index.js';
import type { PlacedBar } from '../layout/types.js';

/**
 * The bar-color cascade implemented here matches the reference's
 * `getEventStyles` pipeline (constraint-free order theme → component
 * prop → per-bar spec → callback). Each layer's `undefined` falls
 * through to the next; deepest non-undefined value wins.
 *
 * Two umbrella rules carry across from the reference:
 *
 * 1. **Component-level `barColor`** — when set, supplies both
 *    `backgroundColor` and `borderColor` defaults at the prop
 *    layer. Specific props (`barBackgroundColor` / `barBorderColor`)
 *    still win when present.
 * 2. **Background-overrides-border** — if `backgroundColor`
 *    resolves through ANY override path (prop / spec.style /
 *    callback) but `borderColor` stays at the theme default, the
 *    resolved background becomes the border too. The visible
 *    consequence is that recoloring "the bar" with a single
 *    layer (e.g. a callback returning a per-priority background)
 *    automatically recolors the stroke as well.
 *
 * The resolver is pure: given the same inputs, returns the same
 * `ResolvedBarStyle`. No DOM, no Vue reactivity. The Vue adapter
 * is responsible for re-running per render pass.
 */

/**
 * Argument bag passed to each `bar*ColorCallback`. Chronix-native
 * shape — does NOT mirror the reference's `EventContentArg`
 * verbatim: 12 of its 16 fields depend on infrastructure chronix
 * doesn't have yet (multi-segment bars for past/future split,
 * nowTimer for today, full event-api wrapper, dragging/resizing
 * lifecycle flags). The 4 essential identity fields (bar,
 * placedBar, isSelected, activeTransaction) + 3 cascaded defaults
 * are present.
 */
export interface BarStyleArg {
  readonly bar: BarSpec;
  readonly placedBar: PlacedBar;
  readonly isSelected: boolean;
  readonly activeTransaction: AnyTransaction | null;
  /**
   * Resolved background after layers 1-3 (theme → component prop
   * → `BarSpec.style`). Callbacks can return this verbatim to
   * accept the cascade or override.
   */
  readonly defaultBackgroundColor: string;
  /** Resolved border after layers 1-3. */
  readonly defaultBorderColor: string;
  /** Resolved text color after layers 1-3. */
  readonly defaultTextColor: string;
  /**
   * Phase 28.2: resolved font size (px) after the theme layer. No
   * per-prop / per-spec font layers in v0 — only theme default and
   * callback override; this field carries the theme floor that the
   * callback can compare against.
   */
  readonly defaultFontSize: number;
  /**
   * Phase 28.2: resolved font weight (numeric: 400 / 600 / etc.)
   * after the theme layer. Same v0 cascade scope as
   * `defaultFontSize`.
   */
  readonly defaultFontWeight: number;
}

/**
 * Style callback shape — returns a color string or `undefined` to
 * defer to the resolved default. Defining all 3 callbacks (bg /
 * border / text) lets the host fully customize per-bar styling.
 */
export type BarColorFunc = (arg: BarStyleArg) => string | undefined;

/**
 * Phase 28.2: per-bar font-size callback. Returns a pixel number or
 * `undefined` to defer to the theme default. Same `BarStyleArg`
 * shape as the color callbacks; same cascade-slot semantics.
 */
export type BarFontSizeFunc = (arg: BarStyleArg) => number | undefined;

/**
 * Phase 28.2: per-bar font-weight callback. Returns a numeric
 * weight (400 / 600 / 700) OR a CSS keyword string (`'normal'` /
 * `'bold'`) OR `undefined` to defer to the theme default. The
 * adapter casts the resolved value to a string at the `<text>`
 * attribute so either form is acceptable.
 */
export type BarFontWeightFunc = (arg: BarStyleArg) => number | string | undefined;

/**
 * The final resolved per-bar style. Consumed by the default `<rect>`
 * render (inline `fill=` / `stroke=`) and by custom slot renderers
 * via `BarSlotArgs.resolvedXxx`.
 */
export interface ResolvedBarStyle {
  readonly backgroundColor: string;
  readonly borderColor: string;
  readonly textColor: string;
  /**
   * Phase 28.2: resolved font size in pixels for bar-title rendering.
   * Theme default OR callback override.
   */
  readonly fontSize: number;
  /**
   * Phase 28.2: resolved font weight for bar-title rendering. Either
   * numeric (`400`) or a CSS keyword string (`'normal'`); the adapter
   * casts to string when setting the SVG attribute.
   */
  readonly fontWeight: number | string;
}

/**
 * Input to `resolveBarStyle`. Bundles the bar + its placement, the
 * theme defaults (always present), and each override layer's value
 * (each optional — omitting means "no override at that layer").
 */
export interface ResolveBarStyleInput {
  readonly bar: BarSpec;
  readonly placedBar: PlacedBar;
  readonly isSelected: boolean;
  readonly activeTransaction: AnyTransaction | null;
  // Layer 1: theme defaults — always present (the floor).
  readonly themeBackgroundColor: string;
  readonly themeBorderColor: string;
  readonly themeTextColor: string;
  // Layer 2: component-prop layer.
  readonly barColor?: string;
  readonly barBackgroundColor?: string;
  readonly barBorderColor?: string;
  readonly barTextColor?: string;
  // Layer 3: BarSpec.style (read from `bar.style`, not passed
  // explicitly — but the field is part of `bar`).
  // Layer 4: callbacks.
  readonly barBackgroundColorCallback?: BarColorFunc;
  readonly barBorderColorCallback?: BarColorFunc;
  readonly barTextColorCallback?: BarColorFunc;
  // Phase 28.2: font cascade (theme + callback only; no prop / spec
  // layer in v0 — add when a consumer asks).
  readonly themeFontSize: number;
  readonly themeFontWeight: number;
  readonly barFontSizeCallback?: BarFontSizeFunc;
  readonly barFontWeightCallback?: BarFontWeightFunc;
}

export function resolveBarStyle(input: ResolveBarStyleInput): ResolvedBarStyle {
  // Layer 1: theme defaults are the floor.
  let backgroundColor = input.themeBackgroundColor;
  let borderColor = input.themeBorderColor;
  let textColor = input.themeTextColor;

  // Track whether each channel was overridden by a non-theme layer.
  // The background-overrides-border umbrella consults these flags
  // so it doesn't fire when only the theme drives both values.
  let backgroundFromOverride = false;
  let borderFromOverride = false;

  // Layer 2: component-prop layer. `barColor` is the umbrella;
  // specific props win when also set.
  if (input.barColor !== undefined) {
    backgroundColor = input.barColor;
    borderColor = input.barColor;
    backgroundFromOverride = true;
    borderFromOverride = true;
  }
  if (input.barBackgroundColor !== undefined) {
    backgroundColor = input.barBackgroundColor;
    backgroundFromOverride = true;
  }
  if (input.barBorderColor !== undefined) {
    borderColor = input.barBorderColor;
    borderFromOverride = true;
  }
  if (input.barTextColor !== undefined) {
    textColor = input.barTextColor;
  }

  // Layer 3: BarSpec.style per-bar override.
  const style = input.bar.style;
  if (style?.backgroundColor !== undefined) {
    backgroundColor = style.backgroundColor;
    backgroundFromOverride = true;
  }
  if (style?.borderColor !== undefined) {
    borderColor = style.borderColor;
    borderFromOverride = true;
  }
  if (style?.textColor !== undefined) {
    textColor = style.textColor;
  }

  // Phase 28.2: font cascade. Theme floor; callback override.
  let fontSize = input.themeFontSize;
  let fontWeight: number | string = input.themeFontWeight;

  // Layer 4: callbacks. Build the arg AFTER layers 1-3 so the
  // callback can compare against the cascaded defaults via
  // `arg.defaultXxxColor` / `arg.defaultFontSize` / `arg.defaultFontWeight`.
  // The arg also carries the theme floor for the font fields since
  // chronix doesn't have prop / spec layers for fonts in v0.
  const hasAnyCallback =
    input.barBackgroundColorCallback ||
    input.barBorderColorCallback ||
    input.barTextColorCallback ||
    input.barFontSizeCallback ||
    input.barFontWeightCallback;
  if (hasAnyCallback) {
    const arg: BarStyleArg = {
      bar: input.bar,
      placedBar: input.placedBar,
      isSelected: input.isSelected,
      activeTransaction: input.activeTransaction,
      defaultBackgroundColor: backgroundColor,
      defaultBorderColor: borderColor,
      defaultTextColor: textColor,
      defaultFontSize: fontSize,
      defaultFontWeight: input.themeFontWeight,
    };
    if (input.barBackgroundColorCallback) {
      const result = input.barBackgroundColorCallback(arg);
      if (result !== undefined) {
        backgroundColor = result;
        backgroundFromOverride = true;
      }
    }
    if (input.barBorderColorCallback) {
      const result = input.barBorderColorCallback(arg);
      if (result !== undefined) {
        borderColor = result;
        borderFromOverride = true;
      }
    }
    if (input.barTextColorCallback) {
      const result = input.barTextColorCallback(arg);
      if (result !== undefined) {
        textColor = result;
      }
    }
    if (input.barFontSizeCallback) {
      const result = input.barFontSizeCallback(arg);
      if (result !== undefined) fontSize = result;
    }
    if (input.barFontWeightCallback) {
      const result = input.barFontWeightCallback(arg);
      if (result !== undefined) fontWeight = result;
    }
  }

  // Background-overrides-border umbrella: if background was
  // overridden through any layer above the theme but border was
  // not, use background as border. Lets the host recolor an
  // entire bar with a single layer (callback returning per-
  // priority background, etc.).
  if (backgroundFromOverride && !borderFromOverride) {
    borderColor = backgroundColor;
  }

  return { backgroundColor, borderColor, textColor, fontSize, fontWeight };
}

/**
 * chronix-ui theme tokens.
 *
 * Top-level `ChronixUITheme` is a nested object: a shared `common`
 * slice (primitives like primaryColor / borderRadius / fontFamily)
 * plus per-component slices (Phase 1 ships `button` as the example;
 * future phases add `tree`, `select`, `dialog`, …, one per component).
 *
 * The adapter writes the resolved theme as CSS custom properties on
 * the `<ChronixUIProvider>` root element via `cssVarsForUITheme`:
 *
 * - `theme.common.primaryColor: '#18a058'` → `--cx-ui-primary-color: '#18a058'`
 * - `theme.button.textColor: '#fff'` → `--cx-ui-button-text-color: '#fff'`
 *
 * Component CSS modules read tokens via `var(--cx-ui-..., fallback)`,
 * so components also work when no provider is mounted (fallback applies).
 *
 * Per Phase 0.1 Decision A.1: CSS-var distribution (no runtime CSS-in-JS).
 * Per Phase 0.1 Decision B.1: nested per-component slices over flat bag.
 * Per Phase 0.1 Decision C.1: light + dark presets + deep-merge composition.
 *
 * Value-typing convention: length-bearing tokens are STRINGS with explicit
 * units (`'8px'`, `'0.5rem'`), not bare numbers — this keeps the converter
 * trivial and lets consumers freely use any length unit (px / rem / em /
 * vw). Truly unitless quantities (font weights, line heights) are numbers.
 */

/**
 * Shared theme primitives consumed by every component slice.
 * Per Phase 0.1 Decision B.1, this slice exists so consumers can change
 * one token (e.g. `primaryColor`) and have it propagate across every
 * component instead of overriding 50 per-component fields.
 */
export interface ChronixUIThemeCommon {
  /** Brand primary color — buttons, links, focus rings, selection. */
  readonly primaryColor: string;
  /** Primary color shifted lighter for hover states. */
  readonly primaryColorHover: string;
  /** Primary color shifted darker for active/pressed states. */
  readonly primaryColorPressed: string;
  /** Primary color used for sustained background tints (e.g. soft button). */
  readonly primaryColorSuppl: string;

  /** Success / positive feedback color. */
  readonly successColor: string;
  /** Warning / caution color. */
  readonly warningColor: string;
  /** Error / destructive color. */
  readonly errorColor: string;
  /** Informational / neutral-prominent color. */
  readonly infoColor: string;

  /** Primary text color on a default surface. */
  readonly textColor: string;
  /** De-emphasized text (captions, descriptions). */
  readonly textColorSecondary: string;
  /** Disabled-state text. */
  readonly textColorDisabled: string;
  /** Text on top of a primary-colored surface (e.g. button label on primary bg). */
  readonly textColorInverse: string;

  /** Default surface background. */
  readonly bgColor: string;
  /** Hover-state surface background. */
  readonly bgColorHover: string;
  /** Pressed-state surface background. */
  readonly bgColorPressed: string;
  /** Disabled-state surface background. */
  readonly bgColorDisabled: string;

  /** Default border color. */
  readonly borderColor: string;
  /** Hover-state border color. */
  readonly borderColorHover: string;
  /** Focus-state border color (typically the primary color). */
  readonly borderColorFocus: string;
  /** Disabled-state border color. */
  readonly borderColorDisabled: string;

  /** Default border radius — applies to buttons, inputs, cards. String with unit. */
  readonly borderRadius: string;
  /** Smaller border radius — tags, badges. */
  readonly borderRadiusSmall: string;

  /** Default font stack. */
  readonly fontFamily: string;
  /** Monospace font stack — for code / numeric tabular. */
  readonly fontFamilyMono: string;

  /** Base font size. String with unit. */
  readonly fontSize: string;
  /** Smaller font size — captions, footnotes. */
  readonly fontSizeSmall: string;
  /** Larger font size — section titles. */
  readonly fontSizeLarge: string;

  /** Default text weight. Unitless number. */
  readonly fontWeight: number;
  /** Emphasized text weight (semibold). */
  readonly fontWeightStrong: number;

  /** Unitless line height multiplier. */
  readonly lineHeight: number;

  /** Spacing scale — extra-small (used for tight inline gaps). */
  readonly spaceXs: string;
  /** Small spacing (default cell padding, tag inner). */
  readonly spaceSm: string;
  /** Medium spacing (button + input padding). */
  readonly spaceMd: string;
  /** Large spacing (card padding). */
  readonly spaceLg: string;
  /** Extra-large spacing (section breaks). */
  readonly spaceXl: string;

  /** Standard component height — small variant. */
  readonly heightSmall: string;
  /** Standard component height — medium (default). */
  readonly heightMedium: string;
  /** Standard component height — large. */
  readonly heightLarge: string;

  /** Fast transition duration (button hover, focus ring). */
  readonly durationFast: string;
  /** Medium transition duration (popover enter, drawer slide). */
  readonly durationMedium: string;
  /** Slow transition duration (modal entrance, page-level). */
  readonly durationSlow: string;

  /** Default easing curve for component motion. */
  readonly cubicBezierEaseInOut: string;
}

/**
 * Button-specific theme tokens. Phase 1 ships this slice as the example
 * pattern; consumers override via `theme.button` to restyle buttons
 * without touching other components.
 *
 * Tokens follow the shape: per-variant background / border / text colors
 * + per-size paddings/heights + a few component-only knobs (iconMargin,
 * fontWeight).
 */
export interface ChronixButtonTheme {
  /** Default-variant button text color. */
  readonly textColor: string;
  /** Primary-variant button text color (typically white on colored bg). */
  readonly textColorPrimary: string;
  /** Text-style (no-border) button text color when hovered. */
  readonly textColorHover: string;

  /** Default-variant background color. */
  readonly bgColor: string;
  /** Default-variant hover background. */
  readonly bgColorHover: string;
  /** Default-variant pressed background. */
  readonly bgColorPressed: string;

  /** Primary-variant background (overrides common.primaryColor if set). */
  readonly bgColorPrimary: string;
  /** Primary-variant hover background. */
  readonly bgColorPrimaryHover: string;
  /** Primary-variant pressed background. */
  readonly bgColorPrimaryPressed: string;

  /** Default-variant border color. */
  readonly borderColor: string;
  /** Default-variant border color on hover. */
  readonly borderColorHover: string;

  /** Border radius — usually inherits from common.borderRadius. */
  readonly borderRadius: string;

  /** Inner horizontal padding for small-size button. */
  readonly paddingXSmall: string;
  /** Inner horizontal padding for medium-size button. */
  readonly paddingX: string;
  /** Inner horizontal padding for large-size button. */
  readonly paddingXLarge: string;

  /** Gap between leading/trailing icon and label text. */
  readonly iconMargin: string;

  /** Button text font weight. */
  readonly fontWeight: number;
}

/**
 * Top-level chronix-ui theme. Phase 1 ships `common` + `button`; each
 * subsequent component phase appends its slice (`tree`, `select`,
 * `dialog`, …).
 *
 * Consumers apply a theme via the adapter's `<ChronixUIProvider theme={...}>`.
 * Nested providers compose via `mergeChronixUITheme`.
 */
export interface ChronixUITheme {
  readonly common: ChronixUIThemeCommon;
  readonly button: ChronixButtonTheme;
}

/**
 * Partial overlay applied on top of a `ChronixUITheme` via
 * `mergeChronixUITheme`. Every slice is optional; within each slice,
 * every field is optional.
 */
export interface ChronixUIThemeOverrides {
  readonly common?: Partial<ChronixUIThemeCommon>;
  readonly button?: Partial<ChronixButtonTheme>;
}

/**
 * Light-mode preset. Default theme applied when no `theme` prop is
 * passed to `<ChronixUIProvider>`. Values chosen for readable contrast
 * + neutral aesthetic; consumers can deep-merge to apply brand colors.
 */
export const defaultChronixUITheme: ChronixUITheme = {
  common: {
    primaryColor: '#18a058',
    primaryColorHover: '#36ad6a',
    primaryColorPressed: '#0c7a43',
    primaryColorSuppl: '#36ad6a',

    successColor: '#18a058',
    warningColor: '#f0a020',
    errorColor: '#d03050',
    infoColor: '#2080f0',

    textColor: '#1f2937',
    textColorSecondary: '#6b7280',
    textColorDisabled: '#9ca3af',
    textColorInverse: '#ffffff',

    bgColor: '#ffffff',
    bgColorHover: '#f3f4f6',
    bgColorPressed: '#e5e7eb',
    bgColorDisabled: '#f9fafb',

    borderColor: '#e5e7eb',
    borderColorHover: '#d1d5db',
    borderColorFocus: '#18a058',
    borderColorDisabled: '#f3f4f6',

    borderRadius: '3px',
    borderRadiusSmall: '2px',

    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontFamilyMono:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',

    fontSize: '14px',
    fontSizeSmall: '12px',
    fontSizeLarge: '16px',

    fontWeight: 400,
    fontWeightStrong: 600,

    lineHeight: 1.5,

    spaceXs: '4px',
    spaceSm: '8px',
    spaceMd: '12px',
    spaceLg: '16px',
    spaceXl: '24px',

    heightSmall: '28px',
    heightMedium: '34px',
    heightLarge: '40px',

    durationFast: '150ms',
    durationMedium: '300ms',
    durationSlow: '500ms',

    cubicBezierEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  button: {
    textColor: '#1f2937',
    textColorPrimary: '#ffffff',
    textColorHover: '#36ad6a',

    bgColor: '#ffffff',
    bgColorHover: '#f3f4f6',
    bgColorPressed: '#e5e7eb',

    bgColorPrimary: '#18a058',
    bgColorPrimaryHover: '#36ad6a',
    bgColorPrimaryPressed: '#0c7a43',

    borderColor: '#e5e7eb',
    borderColorHover: '#36ad6a',

    borderRadius: '3px',

    paddingXSmall: '10px',
    paddingX: '14px',
    paddingXLarge: '18px',

    iconMargin: '6px',

    fontWeight: 400,
  },
};

/**
 * Dark-mode preset. Composes the same `ChronixUITheme` shape with
 * dark-surface color choices. Consumers apply via
 * `<ChronixUIProvider theme={defaultChronixUIThemeDark}>` and may further
 * override via `mergeChronixUITheme(defaultChronixUIThemeDark, { ... })`.
 */
export const defaultChronixUIThemeDark: ChronixUITheme = {
  common: {
    primaryColor: '#63e2b7',
    primaryColorHover: '#7fe7c4',
    primaryColorPressed: '#48a784',
    primaryColorSuppl: '#7fe7c4',

    successColor: '#63e2b7',
    warningColor: '#f2c97d',
    errorColor: '#e88080',
    infoColor: '#70c0e8',

    textColor: '#e5e7eb',
    textColorSecondary: '#9ca3af',
    textColorDisabled: '#4b5563',
    textColorInverse: '#1f2937',

    bgColor: '#18181c',
    bgColorHover: '#27272d',
    bgColorPressed: '#34343c',
    bgColorDisabled: '#1f1f23',

    borderColor: '#33333a',
    borderColorHover: '#46464f',
    borderColorFocus: '#63e2b7',
    borderColorDisabled: '#27272d',

    borderRadius: '3px',
    borderRadiusSmall: '2px',

    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    fontFamilyMono:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',

    fontSize: '14px',
    fontSizeSmall: '12px',
    fontSizeLarge: '16px',

    fontWeight: 400,
    fontWeightStrong: 600,

    lineHeight: 1.5,

    spaceXs: '4px',
    spaceSm: '8px',
    spaceMd: '12px',
    spaceLg: '16px',
    spaceXl: '24px',

    heightSmall: '28px',
    heightMedium: '34px',
    heightLarge: '40px',

    durationFast: '150ms',
    durationMedium: '300ms',
    durationSlow: '500ms',

    cubicBezierEaseInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  button: {
    textColor: '#e5e7eb',
    textColorPrimary: '#1f2937',
    textColorHover: '#7fe7c4',

    bgColor: '#18181c',
    bgColorHover: '#27272d',
    bgColorPressed: '#34343c',

    bgColorPrimary: '#63e2b7',
    bgColorPrimaryHover: '#7fe7c4',
    bgColorPrimaryPressed: '#48a784',

    borderColor: '#33333a',
    borderColorHover: '#7fe7c4',

    borderRadius: '3px',

    paddingXSmall: '10px',
    paddingX: '14px',
    paddingXLarge: '18px',

    iconMargin: '6px',

    fontWeight: 400,
  },
};

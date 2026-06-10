import { describe, expect, it } from 'vitest';

import {
  defaultChronixUITheme,
  defaultChronixUIThemeDark,
  type ChronixUITheme,
} from './chronix-ui-theme.js';

describe('defaultChronixUITheme', () => {
  it('exposes a `common` slice and a `button` slice', () => {
    expect(Object.keys(defaultChronixUITheme).sort()).toEqual(['button', 'common']);
  });

  it('common slice has the expected token surface (Phase 1 baseline)', () => {
    const keys = Object.keys(defaultChronixUITheme.common).sort();
    expect(keys).toEqual(
      [
        'bgColor',
        'bgColorDisabled',
        'bgColorHover',
        'bgColorPressed',
        'borderColor',
        'borderColorDisabled',
        'borderColorFocus',
        'borderColorHover',
        'borderRadius',
        'borderRadiusSmall',
        'cubicBezierEaseInOut',
        'durationFast',
        'durationMedium',
        'durationSlow',
        'errorColor',
        'fontFamily',
        'fontFamilyMono',
        'fontSize',
        'fontSizeLarge',
        'fontSizeSmall',
        'fontWeight',
        'fontWeightStrong',
        'heightLarge',
        'heightMedium',
        'heightSmall',
        'infoColor',
        'lineHeight',
        'primaryColor',
        'primaryColorHover',
        'primaryColorPressed',
        'primaryColorSuppl',
        'spaceLg',
        'spaceMd',
        'spaceSm',
        'spaceXl',
        'spaceXs',
        'successColor',
        'textColor',
        'textColorDisabled',
        'textColorInverse',
        'textColorSecondary',
        'warningColor',
      ].sort(),
    );
  });

  it('button slice has the expected token surface (Phase 1 example)', () => {
    const keys = Object.keys(defaultChronixUITheme.button).sort();
    expect(keys).toEqual(
      [
        'bgColor',
        'bgColorHover',
        'bgColorPressed',
        'bgColorPrimary',
        'bgColorPrimaryHover',
        'bgColorPrimaryPressed',
        'borderColor',
        'borderColorHover',
        'borderRadius',
        'fontWeight',
        'iconMargin',
        'paddingX',
        'paddingXLarge',
        'paddingXSmall',
        'textColor',
        'textColorHover',
        'textColorPrimary',
      ].sort(),
    );
  });

  it('length-bearing tokens are strings with explicit units', () => {
    expect(typeof defaultChronixUITheme.common.borderRadius).toBe('string');
    expect(defaultChronixUITheme.common.borderRadius).toMatch(/^\d+(\.\d+)?(px|rem|em)$/);
    expect(defaultChronixUITheme.common.fontSize).toMatch(/^\d+(\.\d+)?(px|rem|em)$/);
    expect(defaultChronixUITheme.common.spaceSm).toMatch(/^\d+(\.\d+)?(px|rem|em)$/);
    expect(defaultChronixUITheme.common.heightMedium).toMatch(/^\d+(\.\d+)?(px|rem|em)$/);
  });

  it('duration tokens are strings with `ms` units', () => {
    expect(defaultChronixUITheme.common.durationFast).toMatch(/^\d+ms$/);
    expect(defaultChronixUITheme.common.durationMedium).toMatch(/^\d+ms$/);
    expect(defaultChronixUITheme.common.durationSlow).toMatch(/^\d+ms$/);
  });

  it('unitless tokens are typed as numbers (font weights + line height)', () => {
    expect(typeof defaultChronixUITheme.common.fontWeight).toBe('number');
    expect(typeof defaultChronixUITheme.common.fontWeightStrong).toBe('number');
    expect(typeof defaultChronixUITheme.common.lineHeight).toBe('number');
    expect(typeof defaultChronixUITheme.button.fontWeight).toBe('number');
  });

  it('color tokens are non-empty strings', () => {
    expect(defaultChronixUITheme.common.primaryColor).toMatch(/\S/);
    expect(defaultChronixUITheme.common.textColor).toMatch(/\S/);
    expect(defaultChronixUITheme.common.bgColor).toMatch(/\S/);
    expect(defaultChronixUITheme.common.errorColor).toMatch(/\S/);
  });

  it('the readonly type allows immutable consumption', () => {
    // Compile-time check: `ChronixUITheme` is fully readonly, so the
    // following would be a TS error if uncommented:
    //   defaultChronixUITheme.common.primaryColor = 'foo';
    // Runtime check: the theme is still a plain object (TS readonly is
    // structural, not runtime — we don't Object.freeze the preset).
    expect(defaultChronixUITheme.common).toBeInstanceOf(Object);
  });
});

describe('defaultChronixUIThemeDark', () => {
  it('has the same slice + token surface as the light preset', () => {
    expect(Object.keys(defaultChronixUIThemeDark).sort()).toEqual(
      Object.keys(defaultChronixUITheme).sort(),
    );
    expect(Object.keys(defaultChronixUIThemeDark.common).sort()).toEqual(
      Object.keys(defaultChronixUITheme.common).sort(),
    );
    expect(Object.keys(defaultChronixUIThemeDark.button).sort()).toEqual(
      Object.keys(defaultChronixUITheme.button).sort(),
    );
  });

  it('uses darker surface bg and lighter primary than the light preset', () => {
    // Don't pin exact hex (consumers may shift the palette); assert the
    // contrast direction: dark.bgColor is "darker" than light.bgColor in
    // a naive lexicographic sense (#18 < #ff), and dark.primaryColor is
    // "lighter" than light.primaryColor (#63 > #18).
    expect(defaultChronixUIThemeDark.common.bgColor < defaultChronixUITheme.common.bgColor).toBe(
      true,
    );
    expect(
      defaultChronixUIThemeDark.common.primaryColor > defaultChronixUITheme.common.primaryColor,
    ).toBe(true);
  });

  it('shares unitless and dimensional tokens with the light preset', () => {
    // Geometry + motion should be theme-mode-invariant (only colors change
    // between light + dark).
    expect(defaultChronixUIThemeDark.common.borderRadius).toBe(
      defaultChronixUITheme.common.borderRadius,
    );
    expect(defaultChronixUIThemeDark.common.fontSize).toBe(defaultChronixUITheme.common.fontSize);
    expect(defaultChronixUIThemeDark.common.spaceSm).toBe(defaultChronixUITheme.common.spaceSm);
    expect(defaultChronixUIThemeDark.common.heightMedium).toBe(
      defaultChronixUITheme.common.heightMedium,
    );
    expect(defaultChronixUIThemeDark.common.durationFast).toBe(
      defaultChronixUITheme.common.durationFast,
    );
    expect(defaultChronixUIThemeDark.common.fontWeight).toBe(
      defaultChronixUITheme.common.fontWeight,
    );
    expect(defaultChronixUIThemeDark.common.lineHeight).toBe(
      defaultChronixUITheme.common.lineHeight,
    );
  });
});

describe('ChronixUITheme type ergonomics', () => {
  it('can be assigned + spread without losing typing', () => {
    const theme: ChronixUITheme = defaultChronixUITheme;
    expect(theme.common.primaryColor).toBe(defaultChronixUITheme.common.primaryColor);
  });
});

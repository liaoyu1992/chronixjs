import { describe, expect, it } from 'vitest';

import {
  defaultChronixUITheme,
  defaultChronixUIThemeDark,
  type ChronixUITheme,
} from './chronix-ui-theme.js';
import { cssVarsForUITheme } from './css-vars-for-ui-theme.js';

describe('cssVarsForUITheme', () => {
  it('common slice keys emit without slice-name prefix', () => {
    const vars = cssVarsForUITheme(defaultChronixUITheme);
    // Common tokens become --cx-ui-{kebab(key)} (no `-common-` infix).
    expect(vars['--cx-ui-primary-color']).toBe(defaultChronixUITheme.common.primaryColor);
    expect(vars['--cx-ui-border-radius']).toBe(defaultChronixUITheme.common.borderRadius);
    expect(vars['--cx-ui-font-size']).toBe(defaultChronixUITheme.common.fontSize);
    expect(vars['--cx-ui-space-sm']).toBe(defaultChronixUITheme.common.spaceSm);
    expect(vars['--cx-ui-cubic-bezier-ease-in-out']).toBe(
      defaultChronixUITheme.common.cubicBezierEaseInOut,
    );
  });

  it('per-component slice keys emit with `{slice}-` prefix', () => {
    const vars = cssVarsForUITheme(defaultChronixUITheme);
    expect(vars['--cx-ui-button-text-color']).toBe(defaultChronixUITheme.button.textColor);
    expect(vars['--cx-ui-button-bg-color']).toBe(defaultChronixUITheme.button.bgColor);
    expect(vars['--cx-ui-button-bg-color-primary']).toBe(
      defaultChronixUITheme.button.bgColorPrimary,
    );
    expect(vars['--cx-ui-button-padding-x']).toBe(defaultChronixUITheme.button.paddingX);
    expect(vars['--cx-ui-button-padding-x-large']).toBe(defaultChronixUITheme.button.paddingXLarge);
  });

  it('camelCase token names convert to kebab-case correctly', () => {
    const vars = cssVarsForUITheme(defaultChronixUITheme);
    // primaryColorHover → primary-color-hover (no double-hyphens, no
    // dropped letters).
    expect(vars['--cx-ui-primary-color-hover']).toBe(
      defaultChronixUITheme.common.primaryColorHover,
    );
    expect(vars['--cx-ui-primary-color-pressed']).toBe(
      defaultChronixUITheme.common.primaryColorPressed,
    );
    expect(vars['--cx-ui-border-color-focus']).toBe(defaultChronixUITheme.common.borderColorFocus);
    expect(vars['--cx-ui-text-color-secondary']).toBe(
      defaultChronixUITheme.common.textColorSecondary,
    );
  });

  it('numeric tokens stringify to their numeric form (no unit added)', () => {
    const vars = cssVarsForUITheme(defaultChronixUITheme);
    expect(vars['--cx-ui-font-weight']).toBe(String(defaultChronixUITheme.common.fontWeight));
    expect(vars['--cx-ui-font-weight-strong']).toBe(
      String(defaultChronixUITheme.common.fontWeightStrong),
    );
    expect(vars['--cx-ui-line-height']).toBe(String(defaultChronixUITheme.common.lineHeight));
    expect(vars['--cx-ui-button-font-weight']).toBe(
      String(defaultChronixUITheme.button.fontWeight),
    );
  });

  it('length-bearing string tokens pass through verbatim (no unit munging)', () => {
    const vars = cssVarsForUITheme(defaultChronixUITheme);
    // The converter is unit-agnostic: a theme that uses `'1rem'` would
    // emit `'1rem'`, not `'1px'`.
    expect(vars['--cx-ui-font-size']).toBe('14px');
    expect(vars['--cx-ui-duration-fast']).toBe('150ms');
    expect(vars['--cx-ui-cubic-bezier-ease-in-out']).toMatch(/^cubic-bezier\(/);
  });

  it('emits exactly one var per (slice, token) pair', () => {
    const vars = cssVarsForUITheme(defaultChronixUITheme);
    const expectedCount =
      Object.keys(defaultChronixUITheme.common).length +
      Object.keys(defaultChronixUITheme.button).length;
    expect(Object.keys(vars)).toHaveLength(expectedCount);
  });

  it('all returned values are strings (safe to inline as style attribute)', () => {
    const vars = cssVarsForUITheme(defaultChronixUITheme);
    for (const value of Object.values(vars)) {
      expect(typeof value).toBe('string');
    }
  });

  it('dark preset produces same key surface as light preset (different values)', () => {
    const lightVars = cssVarsForUITheme(defaultChronixUITheme);
    const darkVars = cssVarsForUITheme(defaultChronixUIThemeDark);
    expect(Object.keys(darkVars).sort()).toEqual(Object.keys(lightVars).sort());
    // Color tokens differ between modes.
    expect(darkVars['--cx-ui-primary-color']).not.toBe(lightVars['--cx-ui-primary-color']);
    expect(darkVars['--cx-ui-bg-color']).not.toBe(lightVars['--cx-ui-bg-color']);
    expect(darkVars['--cx-ui-text-color']).not.toBe(lightVars['--cx-ui-text-color']);
    // Geometry tokens match.
    expect(darkVars['--cx-ui-border-radius']).toBe(lightVars['--cx-ui-border-radius']);
    expect(darkVars['--cx-ui-space-sm']).toBe(lightVars['--cx-ui-space-sm']);
  });

  it('round-trips: emitted var keys all begin with the expected prefixes', () => {
    const vars = cssVarsForUITheme(defaultChronixUITheme);
    for (const key of Object.keys(vars)) {
      const ok = key.startsWith('--cx-ui-button-') || key.startsWith('--cx-ui-');
      expect(ok, `unexpected CSS var key: ${key}`).toBe(true);
    }
  });

  it('handles a custom-shaped theme with overridden tokens', () => {
    // Construct a theme with non-default values and verify they propagate.
    // We narrow the spread to ChronixUITheme so TS is happy.
    const custom: ChronixUITheme = {
      common: { ...defaultChronixUITheme.common, primaryColor: '#ff6b00' },
      button: { ...defaultChronixUITheme.button, borderRadius: '8px' },
    };
    const vars = cssVarsForUITheme(custom);
    expect(vars['--cx-ui-primary-color']).toBe('#ff6b00');
    expect(vars['--cx-ui-button-border-radius']).toBe('8px');
    // Untouched tokens still resolve.
    expect(vars['--cx-ui-text-color']).toBe(defaultChronixUITheme.common.textColor);
    expect(vars['--cx-ui-button-text-color']).toBe(defaultChronixUITheme.button.textColor);
  });
});

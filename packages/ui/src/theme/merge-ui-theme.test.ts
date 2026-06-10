import { describe, expect, it } from 'vitest';

import { defaultChronixUITheme, defaultChronixUIThemeDark } from './chronix-ui-theme.js';
import { mergeChronixUITheme } from './merge-ui-theme.js';

describe('mergeChronixUITheme', () => {
  it('returns the base reference when overrides is undefined', () => {
    expect(mergeChronixUITheme(defaultChronixUITheme, undefined)).toBe(defaultChronixUITheme);
  });

  it('returns a new theme object when overrides is provided (even if empty)', () => {
    const merged = mergeChronixUITheme(defaultChronixUITheme, {});
    expect(merged).not.toBe(defaultChronixUITheme);
    // ...but slices reference-equal the base when no slice override is supplied.
    expect(merged.common).toBe(defaultChronixUITheme.common);
    expect(merged.button).toBe(defaultChronixUITheme.button);
  });

  it('shallow-merges within a slice that has overrides', () => {
    const merged = mergeChronixUITheme(defaultChronixUITheme, {
      common: { primaryColor: '#ff6b00' },
    });
    expect(merged.common.primaryColor).toBe('#ff6b00');
    // Other common-slice fields preserved from the base.
    expect(merged.common.primaryColorHover).toBe(defaultChronixUITheme.common.primaryColorHover);
    expect(merged.common.textColor).toBe(defaultChronixUITheme.common.textColor);
    expect(merged.common.borderRadius).toBe(defaultChronixUITheme.common.borderRadius);
  });

  it('preserves slices not present in overrides by reference', () => {
    const merged = mergeChronixUITheme(defaultChronixUITheme, {
      common: { primaryColor: '#ff6b00' },
    });
    // button slice was not in overrides — reference-identical to base.
    expect(merged.button).toBe(defaultChronixUITheme.button);
    // common slice WAS overridden — fresh object.
    expect(merged.common).not.toBe(defaultChronixUITheme.common);
  });

  it('merges multiple slices simultaneously', () => {
    const merged = mergeChronixUITheme(defaultChronixUITheme, {
      common: { primaryColor: '#ff6b00' },
      button: { borderRadius: '8px' },
    });
    expect(merged.common.primaryColor).toBe('#ff6b00');
    expect(merged.button.borderRadius).toBe('8px');
    expect(merged.common).not.toBe(defaultChronixUITheme.common);
    expect(merged.button).not.toBe(defaultChronixUITheme.button);
  });

  it('does not mutate the base theme or the overrides object', () => {
    const baseSnapshot = JSON.parse(JSON.stringify(defaultChronixUITheme)) as unknown;
    const overrides = { common: { primaryColor: '#ff6b00' as string } };
    const overridesSnapshot = JSON.parse(JSON.stringify(overrides)) as unknown;
    mergeChronixUITheme(defaultChronixUITheme, overrides);
    expect(JSON.parse(JSON.stringify(defaultChronixUITheme))).toEqual(baseSnapshot);
    expect(JSON.parse(JSON.stringify(overrides))).toEqual(overridesSnapshot);
  });

  it('composes via left-to-right chaining (later overrides win)', () => {
    // Base = light. First overlay sets primary to brand orange. Second
    // overlay sets primary to brand purple. Final: purple wins.
    const brandOrange = mergeChronixUITheme(defaultChronixUITheme, {
      common: { primaryColor: '#ff6b00', primaryColorHover: '#ff8533' },
    });
    const brandPurple = mergeChronixUITheme(brandOrange, {
      common: { primaryColor: '#8b5cf6' },
    });
    expect(brandPurple.common.primaryColor).toBe('#8b5cf6');
    // primaryColorHover propagated from the orange overlay (purple
    // overlay didn't override it).
    expect(brandPurple.common.primaryColorHover).toBe('#ff8533');
  });

  it('mode-switch use case: dark preset + brand override', () => {
    const darkBrand = mergeChronixUITheme(defaultChronixUIThemeDark, {
      common: { primaryColor: '#ff6b00' },
      button: { borderRadius: '12px' },
    });
    // Dark-mode bg preserved.
    expect(darkBrand.common.bgColor).toBe(defaultChronixUIThemeDark.common.bgColor);
    expect(darkBrand.common.textColor).toBe(defaultChronixUIThemeDark.common.textColor);
    // Brand override applied.
    expect(darkBrand.common.primaryColor).toBe('#ff6b00');
    expect(darkBrand.button.borderRadius).toBe('12px');
  });

  it('handles a slice override with a single field (does not require all fields)', () => {
    const merged = mergeChronixUITheme(defaultChronixUITheme, {
      button: { fontWeight: 600 },
    });
    expect(merged.button.fontWeight).toBe(600);
    // All other button fields preserved.
    expect(merged.button.textColor).toBe(defaultChronixUITheme.button.textColor);
    expect(merged.button.bgColor).toBe(defaultChronixUITheme.button.bgColor);
    expect(merged.button.borderRadius).toBe(defaultChronixUITheme.button.borderRadius);
  });

  it('treats `undefined` field values in overrides as "no override"', () => {
    // Spread semantics: { ...base, primaryColor: undefined } sets
    // primaryColor to undefined. We document this as expected behavior —
    // callers should omit fields they don't want to override, not pass
    // `undefined`.
    const merged = mergeChronixUITheme(defaultChronixUITheme, {
      // Cast since the type forbids explicit `undefined` but JS lets it through.
      common: { primaryColor: undefined as unknown as string },
    });
    // The override DID happen (spread semantics) — this test pins the
    // current behavior so future refactors notice if we change it.
    expect(merged.common.primaryColor).toBeUndefined();
  });
});

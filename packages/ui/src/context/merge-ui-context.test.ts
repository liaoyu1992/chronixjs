import { describe, expect, it } from 'vitest';

import { defaultJaJPLocale, defaultZhCNLocale } from '../locale/chronix-locale.js';
import { defaultChronixUITheme, defaultChronixUIThemeDark } from '../theme/chronix-ui-theme.js';

import { createDefaultUIContext } from './create-default-ui-context.js';
import { mergeUIContext } from './merge-ui-context.js';

describe('mergeUIContext', () => {
  it('returns the parent reference when overrides is undefined', () => {
    const parent = createDefaultUIContext();
    expect(mergeUIContext(parent, undefined)).toBe(parent);
  });

  it('returns a new context when overrides is provided (even if empty)', () => {
    const parent = createDefaultUIContext();
    const merged = mergeUIContext(parent, {});
    expect(merged).not.toBe(parent);
    // But every field reference-equal to parent (no spurious copies).
    expect(merged.theme).toBe(parent.theme);
    expect(merged.locale).toBe(parent.locale);
    expect(merged.componentOverrides).toBe(parent.componentOverrides);
  });

  it('scalar override: `size` flows through', () => {
    const parent = createDefaultUIContext();
    const merged = mergeUIContext(parent, { size: 'large' });
    expect(merged.size).toBe('large');
    expect(merged.theme).toBe(parent.theme);
    expect(merged.disabled).toBe(parent.disabled);
  });

  it('scalar override: `disabled` flows through', () => {
    const merged = mergeUIContext(createDefaultUIContext(), { disabled: true });
    expect(merged.disabled).toBe(true);
  });

  it('scalar override: `rtl` flows through', () => {
    const merged = mergeUIContext(createDefaultUIContext(), { rtl: true });
    expect(merged.rtl).toBe(true);
  });

  it('scalar override: `portalContainer` function form flows through', () => {
    const portalFn = () => document.body;
    const merged = mergeUIContext(createDefaultUIContext(), { portalContainer: portalFn });
    expect(merged.portalContainer).toBe(portalFn);
  });

  it('locale replace-merge: overlay fully replaces parent locale', () => {
    const merged = mergeUIContext(createDefaultUIContext(), { locale: defaultZhCNLocale });
    expect(merged.locale).toBe(defaultZhCNLocale);
  });

  it('theme full-replace: overlay is a complete ChronixUITheme → replaces outright', () => {
    const parent = createDefaultUIContext(); // light
    const merged = mergeUIContext(parent, { theme: defaultChronixUIThemeDark });
    expect(merged.theme).toBe(defaultChronixUIThemeDark);
    expect(merged.theme.common.bgColor).toBe(defaultChronixUIThemeDark.common.bgColor);
  });

  it('theme partial-overrides: overlay is a slice partial → deep-merges via mergeChronixUITheme', () => {
    const parent = createDefaultUIContext();
    const merged = mergeUIContext(parent, {
      theme: { common: { primaryColor: '#ff6b00' } },
    });
    expect(merged.theme.common.primaryColor).toBe('#ff6b00');
    // Other common fields preserved from parent.
    expect(merged.theme.common.textColor).toBe(defaultChronixUITheme.common.textColor);
    // Button slice preserved by reference.
    expect(merged.theme.button).toBe(defaultChronixUITheme.button);
  });

  it('theme is unchanged when overlay omits theme', () => {
    const parent = createDefaultUIContext();
    const merged = mergeUIContext(parent, { size: 'large' });
    expect(merged.theme).toBe(parent.theme);
  });

  it('componentOverrides: adds a new component slice', () => {
    const parent = createDefaultUIContext();
    const merged = mergeUIContext(parent, {
      componentOverrides: { button: { size: 'large' } },
    });
    expect(merged.componentOverrides['button']).toEqual({ size: 'large' });
  });

  it('componentOverrides: deep-merges within a slice (parent + overlay combined)', () => {
    const parent = mergeUIContext(createDefaultUIContext(), {
      componentOverrides: { button: { size: 'small', disabled: true } },
    });
    const child = mergeUIContext(parent, {
      componentOverrides: { button: { size: 'large' } },
    });
    // size overridden; disabled preserved from parent layer.
    expect(child.componentOverrides['button']).toEqual({ size: 'large', disabled: true });
  });

  it('componentOverrides: leaves untouched component slices alone', () => {
    const parent = mergeUIContext(createDefaultUIContext(), {
      componentOverrides: {
        button: { size: 'small' },
        tree: { showLine: true },
      },
    });
    const child = mergeUIContext(parent, {
      componentOverrides: { button: { size: 'large' } },
    });
    expect(child.componentOverrides['button']).toEqual({ size: 'large' });
    // Tree slice preserved.
    expect(child.componentOverrides['tree']).toEqual({ showLine: true });
  });

  it('chained merges compose left-to-right (later overrides win)', () => {
    const base = createDefaultUIContext();
    const sessionA = mergeUIContext(base, {
      size: 'small',
      theme: { common: { primaryColor: '#ff6b00' } },
    });
    const sessionB = mergeUIContext(sessionA, { size: 'large' });
    expect(sessionB.size).toBe('large');
    // theme.common.primaryColor carried from session A (session B didn't touch theme).
    expect(sessionB.theme.common.primaryColor).toBe('#ff6b00');
  });

  it('multi-field override: every field can be overridden in one call', () => {
    const parent = createDefaultUIContext();
    const portalFn = () => document.body;
    const merged = mergeUIContext(parent, {
      theme: { button: { borderRadius: '8px' } },
      locale: defaultJaJPLocale,
      size: 'small',
      clsPrefix: 'my-ui',
      disabled: true,
      portalContainer: portalFn,
      rtl: true,
      componentOverrides: { button: { bordered: false } },
    });
    expect(merged.theme.button.borderRadius).toBe('8px');
    expect(merged.locale.name).toBe('ja-JP');
    expect(merged.size).toBe('small');
    expect(merged.clsPrefix).toBe('my-ui');
    expect(merged.disabled).toBe(true);
    expect(merged.portalContainer).toBe(portalFn);
    expect(merged.rtl).toBe(true);
    expect(merged.componentOverrides['button']).toEqual({ bordered: false });
  });

  it('does not mutate parent or overrides', () => {
    const parent = createDefaultUIContext();
    const parentSnapshot = JSON.stringify(parent);
    const overrides = { size: 'large' as const, disabled: true };
    const overridesSnapshot = JSON.stringify(overrides);
    mergeUIContext(parent, overrides);
    expect(JSON.stringify(parent)).toBe(parentSnapshot);
    expect(JSON.stringify(overrides)).toBe(overridesSnapshot);
  });
});

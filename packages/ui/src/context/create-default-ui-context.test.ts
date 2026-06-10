import { describe, expect, it } from 'vitest';

import { defaultEnUSLocale } from '../locale/chronix-locale.js';
import { defaultChronixUITheme } from '../theme/chronix-ui-theme.js';

import { createDefaultUIContext } from './create-default-ui-context.js';

describe('createDefaultUIContext', () => {
  it('returns a context with all 8 fields populated', () => {
    const ctx = createDefaultUIContext();
    expect(Object.keys(ctx).sort()).toEqual(
      [
        'clsPrefix',
        'componentOverrides',
        'disabled',
        'locale',
        'portalContainer',
        'rtl',
        'size',
        'theme',
      ].sort(),
    );
  });

  it('default theme is the light preset (referenced, not cloned)', () => {
    expect(createDefaultUIContext().theme).toBe(defaultChronixUITheme);
  });

  it('default locale is the en-US stub', () => {
    expect(createDefaultUIContext().locale).toBe(defaultEnUSLocale);
  });

  it('default size is `medium`', () => {
    expect(createDefaultUIContext().size).toBe('medium');
  });

  it('default clsPrefix is `cx-ui`', () => {
    expect(createDefaultUIContext().clsPrefix).toBe('cx-ui');
  });

  it('default disabled is false', () => {
    expect(createDefaultUIContext().disabled).toBe(false);
  });

  it('default portalContainer is `body` (CSS selector form)', () => {
    expect(createDefaultUIContext().portalContainer).toBe('body');
  });

  it('default rtl is false', () => {
    expect(createDefaultUIContext().rtl).toBe(false);
  });

  it('default componentOverrides is an empty object', () => {
    expect(createDefaultUIContext().componentOverrides).toEqual({});
  });

  it('returns a fresh top-level object on each call', () => {
    expect(createDefaultUIContext()).not.toBe(createDefaultUIContext());
  });

  it('but theme + locale references are shared (callers should not mutate)', () => {
    expect(createDefaultUIContext().theme).toBe(createDefaultUIContext().theme);
    expect(createDefaultUIContext().locale).toBe(createDefaultUIContext().locale);
  });

  it('componentOverrides is a fresh object on each call (consumer mutation is safe)', () => {
    expect(createDefaultUIContext().componentOverrides).not.toBe(
      createDefaultUIContext().componentOverrides,
    );
  });
});

import { describe, expect, it } from 'vitest';

import { defaultEnUSLocale, defaultZhCNLocale } from './chronix-locale.js';
import { mergeLocales } from './merge-locales.js';

describe('mergeLocales', () => {
  it('returns the base reference when overrides is undefined', () => {
    expect(mergeLocales(defaultEnUSLocale, undefined)).toBe(defaultEnUSLocale);
  });

  it('returns a new locale when overrides is provided (even if empty)', () => {
    const merged = mergeLocales(defaultEnUSLocale, {});
    expect(merged).not.toBe(defaultEnUSLocale);
    // common slice reference-equal when no override.
    expect(merged.common).toBe(defaultEnUSLocale.common);
    expect(merged.name).toBe(defaultEnUSLocale.name);
  });

  it('shallow-merges within the common slice', () => {
    const merged = mergeLocales(defaultEnUSLocale, {
      common: { ok: 'Got it' },
    });
    expect(merged.common.ok).toBe('Got it');
    // Other common fields preserved.
    expect(merged.common.cancel).toBe(defaultEnUSLocale.common.cancel);
    expect(merged.common.loading).toBe(defaultEnUSLocale.common.loading);
    expect(merged.common.noData).toBe(defaultEnUSLocale.common.noData);
  });

  it('common slice becomes a fresh object when overridden', () => {
    const merged = mergeLocales(defaultEnUSLocale, {
      common: { ok: 'Got it' },
    });
    expect(merged.common).not.toBe(defaultEnUSLocale.common);
  });

  it('name override flows through', () => {
    const merged = mergeLocales(defaultEnUSLocale, { name: 'en-GB' });
    expect(merged.name).toBe('en-GB');
    expect(merged.common).toBe(defaultEnUSLocale.common);
  });

  it('multi-key common override propagates all keys', () => {
    const merged = mergeLocales(defaultEnUSLocale, {
      common: { ok: 'Accept', cancel: 'Dismiss', loading: 'Working...' },
    });
    expect(merged.common.ok).toBe('Accept');
    expect(merged.common.cancel).toBe('Dismiss');
    expect(merged.common.loading).toBe('Working...');
    expect(merged.common.confirm).toBe(defaultEnUSLocale.common.confirm);
  });

  it('chained merges compose left-to-right (later wins)', () => {
    const sessionA = mergeLocales(defaultEnUSLocale, {
      common: { ok: 'Accept', cancel: 'Dismiss' },
    });
    const sessionB = mergeLocales(sessionA, {
      common: { ok: 'Yes' },
    });
    expect(sessionB.common.ok).toBe('Yes');
    // cancel propagated from session A (session B didn't touch it).
    expect(sessionB.common.cancel).toBe('Dismiss');
    // confirm propagated from base en-US (untouched in either session).
    expect(sessionB.common.confirm).toBe(defaultEnUSLocale.common.confirm);
  });

  it('building en-GB variant from en-US', () => {
    const enGB = mergeLocales(defaultEnUSLocale, {
      name: 'en-GB',
      common: {
        /* future: British-spelling overrides */
      },
    });
    expect(enGB.name).toBe('en-GB');
    expect(enGB.common.ok).toBe(defaultEnUSLocale.common.ok);
  });

  it('does not mutate the base locale or overrides', () => {
    const baseSnapshot = JSON.stringify(defaultEnUSLocale);
    const overrides = { common: { ok: 'Got it' } };
    const overridesSnapshot = JSON.stringify(overrides);
    mergeLocales(defaultEnUSLocale, overrides);
    expect(JSON.stringify(defaultEnUSLocale)).toBe(baseSnapshot);
    expect(JSON.stringify(overrides)).toBe(overridesSnapshot);
  });

  it('switch base locale: zh-CN with one Chinese label tweaked', () => {
    const customZh = mergeLocales(defaultZhCNLocale, {
      common: { ok: '好的' },
    });
    expect(customZh.name).toBe('zh-CN');
    expect(customZh.common.ok).toBe('好的');
    // Other Chinese labels preserved.
    expect(customZh.common.cancel).toBe(defaultZhCNLocale.common.cancel);
    expect(customZh.common.loading).toBe(defaultZhCNLocale.common.loading);
  });
});

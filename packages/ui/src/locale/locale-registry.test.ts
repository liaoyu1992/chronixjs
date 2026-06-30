import { describe, expect, it } from 'vitest';

import {
  defaultEnUSLocale,
  defaultJaJPLocale,
  defaultZhCNLocale,
  type ChronixLocale,
} from './chronix-locale.js';
import { getLocale, hasLocale, listLocaleNames, registerLocale } from './locale-registry.js';

// The registry is process-global by design (deliberately omits
// a delete API to encourage immutable registration). To avoid cross-test
// state leakage WITHOUT introducing a teardown API, each test that
// registers a custom locale uses a UNIQUE name via this counter.
let testLocaleCounter = 0;
function nextTestLocaleName(): string {
  testLocaleCounter += 1;
  return `xx-TEST-${testLocaleCounter}`;
}

function buildTestLocale(name: string, label: string): ChronixLocale {
  return {
    name,
    common: {
      ok: `${label}-OK`,
      cancel: `${label}-Cancel`,
      confirm: `${label}-Confirm`,
      clear: `${label}-Clear`,
      reset: `${label}-Reset`,
      apply: `${label}-Apply`,
      save: `${label}-Save`,
      del: `${label}-Delete`,
      remove: `${label}-Remove`,
      add: `${label}-Add`,
      edit: `${label}-Edit`,
      search: `${label}-Search`,
      close: `${label}-Close`,
      loading: `${label}-Loading`,
      noData: `${label}-NoData`,
      error: `${label}-Error`,
      success: `${label}-Success`,
      warning: `${label}-Warning`,
      info: `${label}-Info`,
    },
  };
}

describe('localeRegistry — pre-registered presets', () => {
  it('en-US is pre-registered at module load', () => {
    expect(getLocale('en-US')).toBe(defaultEnUSLocale);
    expect(hasLocale('en-US')).toBe(true);
  });

  it('zh-CN is pre-registered at module load', () => {
    expect(getLocale('zh-CN')).toBe(defaultZhCNLocale);
    expect(hasLocale('zh-CN')).toBe(true);
  });

  it('ja-JP is pre-registered at module load', () => {
    expect(getLocale('ja-JP')).toBe(defaultJaJPLocale);
    expect(hasLocale('ja-JP')).toBe(true);
  });

  it('listLocaleNames returns the 3 presets sorted alphabetically', () => {
    // Note: includes any locales registered by other test files. Filter
    // to the 3 expected presets + assert relative order.
    const names = listLocaleNames();
    const presets = names.filter((n) => n === 'en-US' || n === 'zh-CN' || n === 'ja-JP');
    expect(presets).toEqual(['en-US', 'ja-JP', 'zh-CN']);
  });
});

describe('localeRegistry — custom registration', () => {
  it('registerLocale adds a new locale and returns the registered instance', () => {
    const name = nextTestLocaleName();
    const custom = buildTestLocale(name, 'first');
    const result = registerLocale(custom);
    expect(result).toBe(custom);
    expect(hasLocale(name)).toBe(true);
    expect(getLocale(name)).toBe(custom);
  });

  it('getLocale returns undefined for unknown names', () => {
    expect(getLocale('xx-XX-nonexistent')).toBeUndefined();
    expect(hasLocale('xx-XX-nonexistent')).toBe(false);
  });

  it('re-registering the same name replaces (latest wins)', () => {
    const name = nextTestLocaleName();
    const first = buildTestLocale(name, 'first');
    const second = buildTestLocale(name, 'second');
    registerLocale(first);
    registerLocale(second);
    expect(getLocale(name)).toBe(second);
    expect(getLocale(name)).not.toBe(first);
  });

  it('listLocaleNames includes custom registrations + stays sorted', () => {
    const name = nextTestLocaleName();
    registerLocale(buildTestLocale(name, 'first'));
    const names = listLocaleNames();
    expect(names).toContain(name);
    // Sorted property holds (each adjacent pair is in order).
    for (let i = 1; i < names.length; i++) {
      expect(names[i - 1]!.localeCompare(names[i]!)).toBeLessThanOrEqual(0);
    }
  });

  it('registry returns by reference (not a defensive copy)', () => {
    const name = nextTestLocaleName();
    const custom = buildTestLocale(name, 'first');
    registerLocale(custom);
    const fetched1 = getLocale(name);
    const fetched2 = getLocale(name);
    expect(fetched1).toBe(custom);
    expect(fetched1).toBe(fetched2);
  });
});

describe('localeRegistry — listLocaleNames stability', () => {
  it('returns a fresh array on each call (caller can mutate safely)', () => {
    const list1 = listLocaleNames();
    const list2 = listLocaleNames();
    expect(list1).toEqual(list2);
    expect(list1).not.toBe(list2);
  });
});

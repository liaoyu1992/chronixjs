import { describe, expect, it } from 'vitest';

import {
  defaultEnUSLocale,
  defaultJaJPLocale,
  defaultZhCNLocale,
  type ChronixLocale,
  type ChronixLocaleCommon,
} from './chronix-locale.js';

const ALL_PRESETS: readonly { name: string; locale: ChronixLocale }[] = [
  { name: 'en-US', locale: defaultEnUSLocale },
  { name: 'zh-CN', locale: defaultZhCNLocale },
  { name: 'ja-JP', locale: defaultJaJPLocale },
];

const COMMON_KEYS: readonly (keyof ChronixLocaleCommon)[] = [
  'ok',
  'cancel',
  'confirm',
  'clear',
  'reset',
  'apply',
  'save',
  'del',
  'remove',
  'add',
  'edit',
  'search',
  'close',
  'loading',
  'noData',
  'error',
  'success',
  'warning',
  'info',
];

describe('ChronixLocale presets', () => {
  it('all 3 presets have `name` + `common` slice (Phase 3 baseline shape)', () => {
    for (const { name, locale } of ALL_PRESETS) {
      expect(locale.name, name).toBe(name);
      expect(locale.common, `${name}.common`).toBeDefined();
      expect(typeof locale.common, `${name}.common`).toBe('object');
    }
  });

  it('all 3 presets carry the same 19 common-slice keys', () => {
    for (const { name, locale } of ALL_PRESETS) {
      const keys = Object.keys(locale.common).sort();
      expect(keys, `${name}.common.keys`).toEqual([...COMMON_KEYS].sort());
    }
  });

  it('every common-slice value is a non-empty string in every preset', () => {
    for (const { name, locale } of ALL_PRESETS) {
      for (const key of COMMON_KEYS) {
        const value = locale.common[key];
        expect(typeof value, `${name}.common.${key} type`).toBe('string');
        expect(value, `${name}.common.${key} non-empty`).toMatch(/\S/);
      }
    }
  });

  it('en-US uses standard English labels', () => {
    expect(defaultEnUSLocale.common.ok).toBe('OK');
    expect(defaultEnUSLocale.common.cancel).toBe('Cancel');
    expect(defaultEnUSLocale.common.loading).toBe('Loading...');
    expect(defaultEnUSLocale.common.noData).toBe('No data');
  });

  it('zh-CN uses simplified Chinese labels', () => {
    expect(defaultZhCNLocale.common.ok).toBe('确定');
    expect(defaultZhCNLocale.common.cancel).toBe('取消');
    expect(defaultZhCNLocale.common.loading).toBe('加载中...');
    expect(defaultZhCNLocale.common.noData).toBe('暂无数据');
  });

  it('ja-JP uses Japanese labels', () => {
    expect(defaultJaJPLocale.common.cancel).toBe('キャンセル');
    expect(defaultJaJPLocale.common.loading).toBe('読み込み中...');
    expect(defaultJaJPLocale.common.noData).toBe('データなし');
  });

  it('presets differ in common-slice content (no accidental copy-paste)', () => {
    // Sanity: each preset should have at least one common-slice value
    // that differs from the en-US baseline (otherwise we may have
    // copy-pasted en-US over the localized presets by mistake).
    const zhDiffers = COMMON_KEYS.some(
      (key) => defaultZhCNLocale.common[key] !== defaultEnUSLocale.common[key],
    );
    const jaDiffers = COMMON_KEYS.some(
      (key) => defaultJaJPLocale.common[key] !== defaultEnUSLocale.common[key],
    );
    expect(zhDiffers).toBe(true);
    expect(jaDiffers).toBe(true);
  });
});

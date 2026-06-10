/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createLocalStorageRecentStorage,
  createMemoryRecentStorage,
  DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX,
} from './typeahead-recent-storage.js';

describe('createMemoryRecentStorage', () => {
  it('always reads empty', () => {
    const s = createMemoryRecentStorage();
    expect(s.read('value')).toEqual([]);
    s.write('value', ['a', 'b']);
    expect(s.read('value')).toEqual([]);
  });
});

describe('createLocalStorageRecentStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a per-slot ring through localStorage', () => {
    const s = createLocalStorageRecentStorage(DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX);
    s.write('value', ['apple', 'banana']);
    expect(s.read('value')).toEqual(['apple', 'banana']);
  });

  it('returns empty ring for unseen slot', () => {
    const s = createLocalStorageRecentStorage(DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX);
    expect(s.read('column')).toEqual([]);
  });

  it('partitions rings by slot', () => {
    const s = createLocalStorageRecentStorage(DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX);
    s.write('column', ['a', 'b']);
    s.write('value', ['x', 'y']);
    expect(s.read('column')).toEqual(['a', 'b']);
    expect(s.read('value')).toEqual(['x', 'y']);
  });

  it('uses keyPrefix for namespacing', () => {
    const s = createLocalStorageRecentStorage('custom-prefix');
    s.write('value', ['z']);
    expect(window.localStorage.getItem('custom-prefix::value')).toBe('["z"]');
    expect(
      window.localStorage.getItem(`${DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX}::value`),
    ).toBeNull();
  });

  it('returns empty ring when stored payload is not an array', () => {
    const s = createLocalStorageRecentStorage(DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX);
    window.localStorage.setItem(
      `${DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX}::value`,
      '"not-an-array"',
    );
    expect(s.read('value')).toEqual([]);
  });

  it('returns empty ring when stored payload is malformed JSON', () => {
    const s = createLocalStorageRecentStorage(DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX);
    window.localStorage.setItem(`${DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX}::value`, '{');
    expect(s.read('value')).toEqual([]);
  });

  it('drops non-string array elements during read', () => {
    const s = createLocalStorageRecentStorage(DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX);
    window.localStorage.setItem(
      `${DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX}::value`,
      JSON.stringify(['a', 1, null, 'b', { foo: 'bar' }]),
    );
    expect(s.read('value')).toEqual(['a', 'b']);
  });

  it('swallows write errors silently', () => {
    const s = createLocalStorageRecentStorage(DEFAULT_TYPEAHEAD_RECENT_STORAGE_KEY_PREFIX);
    const originalSetItem = window.localStorage.setItem.bind(window.localStorage);
    window.localStorage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    expect(() => s.write('value', ['a'])).not.toThrow();
    window.localStorage.setItem = originalSetItem;
  });
});

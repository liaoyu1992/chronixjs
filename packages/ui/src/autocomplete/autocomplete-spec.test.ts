import { describe, expect, it } from 'vitest';

import {
  defaultAutoCompleteProps,
  filterAutoCompleteOptions,
  type AutoCompleteOption,
} from './autocomplete-spec.js';

const OPTS: readonly AutoCompleteOption[] = [
  { key: 'a', label: 'Apple', value: 'apple' },
  { key: 'b', label: 'Banana', value: 'banana' },
  { key: 'c', label: 'apricot', value: 'apricot' },
];

describe('defaultAutoCompleteProps', () => {
  it('matches defaults', () => {
    expect(defaultAutoCompleteProps).toEqual({
      value: '',
      options: [],
      placeholder: undefined,
      disabled: false,
      size: 'medium',
      error: undefined,
    });
  });
});

describe('filterAutoCompleteOptions', () => {
  it('returns the same reference for empty query (fast-path)', () => {
    expect(filterAutoCompleteOptions(OPTS, '')).toBe(OPTS);
  });

  it('case-insensitive substring matches', () => {
    expect(filterAutoCompleteOptions(OPTS, 'ap').map((o) => o.key)).toEqual(['a', 'c']);
  });

  it('returns empty array when nothing matches', () => {
    expect(filterAutoCompleteOptions(OPTS, 'xyz')).toEqual([]);
  });

  it('matches inside the label, not just prefix', () => {
    expect(filterAutoCompleteOptions(OPTS, 'nan').map((o) => o.key)).toEqual(['b']);
  });
});

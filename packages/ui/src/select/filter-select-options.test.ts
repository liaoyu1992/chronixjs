import { describe, expect, it } from 'vitest';

import { filterSelectOptions } from './filter-select-options.js';

import type { SelectOption } from './option-spec.js';

describe('filterSelectOptions', () => {
  const options: SelectOption[] = [
    { key: 'apple', label: 'Apple', value: 'apple' },
    { key: 'banana', label: 'Banana', value: 'banana' },
    { key: 'cherry', label: 'Cherry', value: 'cherry' },
  ];

  it('returns all options for empty query', () => {
    expect(filterSelectOptions(options, '')).toHaveLength(3);
  });

  it('filters by label case-insensitively', () => {
    const result = filterSelectOptions(options, 'app');
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('apple');
  });

  it('returns empty for no matches', () => {
    expect(filterSelectOptions(options, 'zzz')).toEqual([]);
  });

  it('preserves group with matching children', () => {
    const grouped: SelectOption[] = [
      {
        key: 'g1',
        label: 'Fruits',
        children: [
          { key: 'apple', label: 'Apple', value: 'apple' },
          { key: 'banana', label: 'Banana', value: 'banana' },
        ],
      },
      { key: 'dog', label: 'Dog', value: 'dog' },
    ];
    const result = filterSelectOptions(grouped, 'app');
    // Group should be preserved with Apple inside
    expect(result).toHaveLength(1);
    expect(result[0]!.key).toBe('g1');
  });

  it('removes group with no matching children', () => {
    const grouped: SelectOption[] = [
      {
        key: 'g1',
        label: 'Fruits',
        children: [{ key: 'apple', label: 'Apple', value: 'apple' }],
      },
    ];
    const result = filterSelectOptions(grouped, 'zzz');
    expect(result).toHaveLength(0);
  });

  it('keeps disabled matching options', () => {
    const opts: SelectOption[] = [{ key: 'a', label: 'Alpha', value: 'a', disabled: true }];
    const result = filterSelectOptions(opts, 'alpha');
    expect(result).toHaveLength(1);
  });
});

import { describe, expect, it } from 'vitest';

import { flattenSelectOptions } from './flatten-select-options.js';

import type { SelectOption } from './option-spec.js';

describe('flattenSelectOptions', () => {
  it('returns empty for empty array', () => {
    expect(flattenSelectOptions([])).toEqual([]);
  });

  it('flattens flat leaf options at depth 0', () => {
    const options: SelectOption[] = [
      { key: 'a', label: 'A', value: 'a' },
      { key: 'b', label: 'B', value: 'b' },
    ];
    const result = flattenSelectOptions(options);
    expect(result).toHaveLength(2);
    expect(result[0]!.depth).toBe(0);
    expect(result[0]!.isGroup).toBe(false);
    expect(result[1]!.depth).toBe(0);
    expect(result[1]!.isGroup).toBe(false);
  });

  it('flattens grouped options with correct depth', () => {
    const options: SelectOption[] = [
      {
        key: 'g1',
        label: 'Group 1',
        children: [
          { key: 'a', label: 'A', value: 'a' },
          { key: 'b', label: 'B', value: 'b' },
        ],
      },
    ];
    const result = flattenSelectOptions(options);
    // group entry + 2 leaf entries
    expect(result).toHaveLength(3);
    expect(result[0]!.isGroup).toBe(true);
    expect(result[0]!.depth).toBe(0);
    expect(result[1]!.isGroup).toBe(false);
    expect(result[1]!.depth).toBe(1);
    expect(result[2]!.isGroup).toBe(false);
    expect(result[2]!.depth).toBe(1);
  });

  it('flattens nested groups', () => {
    const options: SelectOption[] = [
      {
        key: 'g1',
        label: 'G1',
        children: [
          {
            key: 'g2',
            label: 'G2',
            children: [{ key: 'a', label: 'A', value: 'a' }],
          },
        ],
      },
    ];
    const result = flattenSelectOptions(options);
    // g1 (depth 0) + g2 (depth 1) + a (depth 2)
    expect(result).toHaveLength(3);
    expect(result[0]!.depth).toBe(0);
    expect(result[1]!.depth).toBe(1);
    expect(result[2]!.depth).toBe(2);
    expect(result[2]!.isGroup).toBe(false);
  });

  it('preserves disabled flag', () => {
    const options: SelectOption[] = [{ key: 'a', label: 'A', value: 'a', disabled: true }];
    const result = flattenSelectOptions(options);
    expect(result[0]!.option.disabled).toBe(true);
  });

  it('mixed flat and grouped', () => {
    const options: SelectOption[] = [
      { key: 'a', label: 'A', value: 'a' },
      {
        key: 'g1',
        label: 'G1',
        children: [{ key: 'b', label: 'B', value: 'b' }],
      },
      { key: 'c', label: 'C', value: 'c' },
    ];
    const result = flattenSelectOptions(options);
    expect(result).toHaveLength(4);
    expect(result.map((r) => r.option.key)).toEqual(['a', 'g1', 'b', 'c']);
  });
});

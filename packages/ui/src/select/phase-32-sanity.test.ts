/**
 * Phase 32 sanity check — verifies Select IR ready for DatePicker.
 * Phase 31 (2026-06-04).
 */
import { describe, expect, it } from 'vitest';

import {
  flattenSelectOptions,
  filterSelectOptions,
  normalizeSelectValue,
  isOptionGroup,
} from './index.js';

import type { SelectOption } from './option-spec.js';

describe('Phase 32 sanity checks', () => {
  it('flattenSelectOptions handles DatePicker-style year/month groups', () => {
    const options: SelectOption[] = [
      {
        key: '2026',
        label: '2026',
        children: [
          { key: '2026-01', label: 'January', value: '2026-01' },
          { key: '2026-02', label: 'February', value: '2026-02' },
        ],
      },
    ];
    const flat = flattenSelectOptions(options);
    expect(flat).toHaveLength(3);
    expect(flat[0]!.isGroup).toBe(true);
    expect(flat[1]!.option.key).toBe('2026-01');
  });

  it('normalizeSelectValue returns empty for undefined', () => {
    expect(normalizeSelectValue(undefined, false)).toEqual([]);
  });

  it('filterSelectOptions returns all for empty query', () => {
    const opts: SelectOption[] = [{ key: 'a', label: 'A', value: 'a' }];
    expect(filterSelectOptions(opts, '')).toHaveLength(1);
  });

  it('isOptionGroup distinguishes leaf from group', () => {
    expect(isOptionGroup({ key: 'x', label: 'X', value: 'x' })).toBe(false);
    expect(isOptionGroup({ key: 'g', label: 'G', children: [] })).toBe(true);
  });
});

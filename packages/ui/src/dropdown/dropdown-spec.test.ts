import { describe, expect, it } from 'vitest';

import {
  defaultDropdownProps,
  findDropdownOptionByKey,
  getDropdownActivatableKeys,
  type DropdownOption,
} from './dropdown-spec.js';

describe('defaultDropdownProps', () => {
  it('matches defaults (uncontrolled / click / bottom-start / empty options)', () => {
    expect(defaultDropdownProps).toEqual({
      show: undefined,
      trigger: 'click',
      placement: 'bottom-start',
      options: [],
      disabled: false,
    });
  });
});

const FIXTURES: readonly DropdownOption[] = [
  { key: 'a', label: 'Alpha', value: 'a', disabled: false, icon: undefined },
  { key: 'b', label: 'Beta', value: 'b', disabled: true, icon: 'check' },
  { key: 'c', label: 'Gamma', value: 'c', disabled: false, icon: undefined },
];

describe('getDropdownActivatableKeys', () => {
  it('returns non-disabled keys in input order', () => {
    expect(getDropdownActivatableKeys(FIXTURES)).toEqual(['a', 'c']);
  });

  it('returns empty array when every option is disabled', () => {
    expect(
      getDropdownActivatableKeys([
        { key: 'a', label: 'A', value: 'a', disabled: true, icon: undefined },
      ]),
    ).toEqual([]);
  });
});

describe('findDropdownOptionByKey', () => {
  it('returns the matching option', () => {
    expect(findDropdownOptionByKey(FIXTURES, 'b')?.label).toBe('Beta');
  });

  it('returns null when no match exists', () => {
    expect(findDropdownOptionByKey(FIXTURES, 'zzz')).toBeNull();
  });

  it('returns null when key is null', () => {
    expect(findDropdownOptionByKey(FIXTURES, null)).toBeNull();
  });
});

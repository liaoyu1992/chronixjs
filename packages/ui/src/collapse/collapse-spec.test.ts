import { describe, expect, it } from 'vitest';

import {
  defaultCollapseProps,
  isCollapseItemExpanded,
  normalizeCollapseValue,
  toggleCollapseValue,
  type CollapseItem,
} from './collapse-spec.js';

const items: readonly CollapseItem[] = [
  { key: 'a', title: 'A', content: 'first', disabled: false },
  { key: 'b', title: 'B', content: 'second', disabled: false },
  { key: 'c', title: 'C', content: undefined, disabled: true },
];

describe('defaultCollapseProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultCollapseProps).toEqual({
      value: undefined,
      items: [],
      accordion: false,
      arrowPlacement: 'left',
    });
  });
});

describe('normalizeCollapseValue', () => {
  it('returns empty set for undefined', () => {
    expect(Array.from(normalizeCollapseValue(undefined, false))).toEqual([]);
  });

  it('returns singleton set for string', () => {
    expect(Array.from(normalizeCollapseValue('a', true))).toEqual(['a']);
  });

  it('returns set of all keys for array', () => {
    expect(Array.from(normalizeCollapseValue(['a', 'b'], false))).toEqual(['a', 'b']);
  });
});

describe('isCollapseItemExpanded', () => {
  it('false for undefined value', () => {
    expect(isCollapseItemExpanded({ value: undefined, itemKey: 'a' })).toBe(false);
  });

  it('true for matching string', () => {
    expect(isCollapseItemExpanded({ value: 'a', itemKey: 'a' })).toBe(true);
  });

  it('false for non-matching string', () => {
    expect(isCollapseItemExpanded({ value: 'a', itemKey: 'b' })).toBe(false);
  });

  it('true when array contains key', () => {
    expect(isCollapseItemExpanded({ value: ['a', 'b'], itemKey: 'a' })).toBe(true);
  });

  it('false when array does not contain key', () => {
    expect(isCollapseItemExpanded({ value: ['a'], itemKey: 'b' })).toBe(false);
  });
});

describe('toggleCollapseValue — accordion mode', () => {
  it('expands a previously-collapsed key by replacing the value', () => {
    expect(
      toggleCollapseValue({
        currentExpanded: new Set(['a']),
        toggleKey: 'b',
        accordion: true,
        items,
      }),
    ).toBe('b');
  });

  it('collapses the currently-expanded key by clearing the value', () => {
    expect(
      toggleCollapseValue({
        currentExpanded: new Set(['a']),
        toggleKey: 'a',
        accordion: true,
        items,
      }),
    ).toBeUndefined();
  });
});

describe('toggleCollapseValue — multi mode', () => {
  it('adds a key to the expanded array, sorted by item order', () => {
    expect(
      toggleCollapseValue({
        currentExpanded: new Set(['b']),
        toggleKey: 'a',
        accordion: false,
        items,
      }),
    ).toEqual(['a', 'b']);
  });

  it('removes a key from the expanded array', () => {
    expect(
      toggleCollapseValue({
        currentExpanded: new Set(['a', 'b']),
        toggleKey: 'b',
        accordion: false,
        items,
      }),
    ).toEqual(['a']);
  });

  it('returns an empty array (not undefined) when removing the last expanded key', () => {
    expect(
      toggleCollapseValue({
        currentExpanded: new Set(['a']),
        toggleKey: 'a',
        accordion: false,
        items,
      }),
    ).toEqual([]);
  });
});

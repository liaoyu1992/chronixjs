import { describe, expect, it } from 'vitest';

import { formatPrefixNumberFilter, parsePrefixNumberFilter } from './parse-prefix-number-filter.js';

describe('parsePrefixNumberFilter', () => {
  it('returns null for empty / whitespace-only input', () => {
    expect(parsePrefixNumberFilter('', 'qty')).toBeNull();
    expect(parsePrefixNumberFilter('   ', 'qty')).toBeNull();
  });

  it('bare number → {operator: "=", value}', () => {
    expect(parsePrefixNumberFilter('5', 'qty')).toEqual({
      type: 'number',
      colId: 'qty',
      operator: '=',
      value: 5,
    });
    expect(parsePrefixNumberFilter('  42  ', 'qty')).toEqual({
      type: 'number',
      colId: 'qty',
      operator: '=',
      value: 42,
    });
  });

  it('explicit `=` prefix is accepted', () => {
    expect(parsePrefixNumberFilter('=10', 'qty')).toEqual({
      type: 'number',
      colId: 'qty',
      operator: '=',
      value: 10,
    });
  });

  it('parses each comparison operator prefix', () => {
    expect(parsePrefixNumberFilter('>10', 'qty')).toMatchObject({ operator: '>', value: 10 });
    expect(parsePrefixNumberFilter('<10', 'qty')).toMatchObject({ operator: '<', value: 10 });
    expect(parsePrefixNumberFilter('>=10', 'qty')).toMatchObject({ operator: '>=', value: 10 });
    expect(parsePrefixNumberFilter('<=10', 'qty')).toMatchObject({ operator: '<=', value: 10 });
    expect(parsePrefixNumberFilter('!=10', 'qty')).toMatchObject({ operator: '!=', value: 10 });
  });

  it('2-char operators take precedence over 1-char (>=10 ≠ > with value =10)', () => {
    const spec = parsePrefixNumberFilter('>=10', 'qty');
    expect(spec?.operator).toBe('>=');
    expect(spec?.value).toBe(10);
  });

  it('parses `inRange` syntax with `..` separator', () => {
    expect(parsePrefixNumberFilter('5..50', 'qty')).toEqual({
      type: 'number',
      colId: 'qty',
      operator: 'inRange',
      value: 5,
      valueTo: 50,
    });
  });

  it('range with negative numbers + decimals', () => {
    expect(parsePrefixNumberFilter('-3..-1', 'qty')).toEqual({
      type: 'number',
      colId: 'qty',
      operator: 'inRange',
      value: -3,
      valueTo: -1,
    });
    expect(parsePrefixNumberFilter('1.5..2.5', 'qty')).toEqual({
      type: 'number',
      colId: 'qty',
      operator: 'inRange',
      value: 1.5,
      valueTo: 2.5,
    });
  });

  it('single-value with negative + decimal', () => {
    expect(parsePrefixNumberFilter('-5', 'qty')).toMatchObject({ operator: '=', value: -5 });
    expect(parsePrefixNumberFilter('>-2.5', 'qty')).toMatchObject({ operator: '>', value: -2.5 });
  });

  it('invalid input → null', () => {
    expect(parsePrefixNumberFilter('abc', 'qty')).toBeNull();
    expect(parsePrefixNumberFilter('>>5', 'qty')).toBeNull();
    expect(parsePrefixNumberFilter('5..', 'qty')).toBeNull();
    expect(parsePrefixNumberFilter('..5', 'qty')).toBeNull();
    expect(parsePrefixNumberFilter('5..abc', 'qty')).toBeNull();
    expect(parsePrefixNumberFilter('5 10', 'qty')).toBeNull();
  });

  it('colId is propagated into the parsed spec', () => {
    expect(parsePrefixNumberFilter('5', 'my-column-id')).toMatchObject({ colId: 'my-column-id' });
  });
});

describe('formatPrefixNumberFilter', () => {
  it('= operator omits the prefix (bare number)', () => {
    expect(
      formatPrefixNumberFilter({ type: 'number', colId: 'qty', operator: '=', value: 5 }),
    ).toBe('5');
  });

  it('non-= operators include the prefix', () => {
    expect(
      formatPrefixNumberFilter({ type: 'number', colId: 'qty', operator: '>', value: 10 }),
    ).toBe('>10');
    expect(
      formatPrefixNumberFilter({ type: 'number', colId: 'qty', operator: '>=', value: 5 }),
    ).toBe('>=5');
    expect(
      formatPrefixNumberFilter({ type: 'number', colId: 'qty', operator: '!=', value: 3 }),
    ).toBe('!=3');
  });

  it('inRange formats as `value..valueTo`', () => {
    expect(
      formatPrefixNumberFilter({
        type: 'number',
        colId: 'qty',
        operator: 'inRange',
        value: 10,
        valueTo: 30,
      }),
    ).toBe('10..30');
  });

  it('round-trip: parse(format(spec)) ≡ spec', () => {
    const specs = [
      { type: 'number' as const, colId: 'qty', operator: '=' as const, value: 5 },
      { type: 'number' as const, colId: 'qty', operator: '>' as const, value: 10 },
      { type: 'number' as const, colId: 'qty', operator: '<' as const, value: 20 },
      { type: 'number' as const, colId: 'qty', operator: '>=' as const, value: 5 },
      { type: 'number' as const, colId: 'qty', operator: '<=' as const, value: 10 },
      { type: 'number' as const, colId: 'qty', operator: '!=' as const, value: 3 },
      {
        type: 'number' as const,
        colId: 'qty',
        operator: 'inRange' as const,
        value: 10,
        valueTo: 30,
      },
    ];
    for (const spec of specs) {
      const parsed = parsePrefixNumberFilter(formatPrefixNumberFilter(spec), 'qty');
      expect(parsed).toEqual(spec);
    }
  });
});

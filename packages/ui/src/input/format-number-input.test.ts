import { describe, expect, it } from 'vitest';

import { formatNumberInput } from './format-number-input.js';

describe('formatNumberInput — basic', () => {
  it('formats integer with default options', () => {
    expect(formatNumberInput(42)).toBe('42');
  });

  it('formats negative integer', () => {
    expect(formatNumberInput(-42)).toBe('-42');
  });

  it('formats decimal with default options', () => {
    expect(formatNumberInput(3.14)).toBe('3.14');
  });

  it('formats zero', () => {
    expect(formatNumberInput(0)).toBe('0');
  });
});

describe('formatNumberInput — non-finite', () => {
  it('NaN → empty string', () => {
    expect(formatNumberInput(Number.NaN)).toBe('');
  });

  it('Infinity → empty string', () => {
    expect(formatNumberInput(Number.POSITIVE_INFINITY)).toBe('');
    expect(formatNumberInput(Number.NEGATIVE_INFINITY)).toBe('');
  });
});

describe('formatNumberInput — precision', () => {
  it('precision: 2 rounds to 2 decimals', () => {
    expect(formatNumberInput(3.14159, { precision: 2 })).toBe('3.14');
  });

  it('precision: 0 rounds to integer', () => {
    expect(formatNumberInput(3.7, { precision: 0 })).toBe('4');
  });

  it('precision: 4 pads decimals', () => {
    expect(formatNumberInput(3.1, { precision: 4 })).toBe('3.1000');
  });

  it('precision applied to negative', () => {
    expect(formatNumberInput(-3.14159, { precision: 2 })).toBe('-3.14');
  });
});

describe('formatNumberInput — thousand separator', () => {
  it('inserts commas in positive number', () => {
    expect(formatNumberInput(1234567, { thousandSeparator: ',' })).toBe('1,234,567');
  });

  it('inserts commas in negative number (no separator next to sign)', () => {
    expect(formatNumberInput(-1234567, { thousandSeparator: ',' })).toBe('-1,234,567');
  });

  it('handles small number (no separator)', () => {
    expect(formatNumberInput(123, { thousandSeparator: ',' })).toBe('123');
  });

  it('inserts separator only in integer part, leaves decimals intact', () => {
    expect(formatNumberInput(1234567.89, { thousandSeparator: ',', precision: 2 })).toBe(
      '1,234,567.89',
    );
  });

  it('uses space separator', () => {
    expect(formatNumberInput(1234567, { thousandSeparator: ' ' })).toBe('1 234 567');
  });

  it('uses dot separator (European thousand)', () => {
    expect(formatNumberInput(1234567, { thousandSeparator: '.' })).toBe('1.234.567');
  });
});

describe('formatNumberInput — decimal separator', () => {
  it('uses comma as decimal separator', () => {
    expect(formatNumberInput(3.14, { decimalSeparator: ',' })).toBe('3,14');
  });

  it('combines comma decimal with dot thousand (European)', () => {
    expect(
      formatNumberInput(1234567.89, {
        precision: 2,
        thousandSeparator: '.',
        decimalSeparator: ',',
      }),
    ).toBe('1.234.567,89');
  });
});

describe('formatNumberInput — combined options', () => {
  it('precision + thousand separator', () => {
    expect(formatNumberInput(1234567.456, { precision: 2, thousandSeparator: ',' })).toBe(
      '1,234,567.46',
    );
  });

  it('all three options together', () => {
    expect(
      formatNumberInput(-1234567.456, {
        precision: 2,
        thousandSeparator: ' ',
        decimalSeparator: ',',
      }),
    ).toBe('-1 234 567,46');
  });
});

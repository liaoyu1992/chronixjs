import { describe, expect, it } from 'vitest';

import { parseNumberInput } from './parse-number-input.js';

describe('parseNumberInput — happy path', () => {
  it('parses positive integer', () => {
    expect(parseNumberInput('42')).toBe(42);
  });

  it('parses negative integer', () => {
    expect(parseNumberInput('-42')).toBe(-42);
  });

  it('parses decimal', () => {
    expect(parseNumberInput('3.14')).toBe(3.14);
  });

  it('parses negative decimal', () => {
    expect(parseNumberInput('-3.14')).toBe(-3.14);
  });

  it('parses zero', () => {
    expect(parseNumberInput('0')).toBe(0);
  });

  it('parses leading + sign', () => {
    expect(parseNumberInput('+42')).toBe(42);
  });

  it('parses exponent notation', () => {
    expect(parseNumberInput('1.5e3')).toBe(1500);
  });
});

describe('parseNumberInput — trimming + empties', () => {
  it('trims surrounding whitespace', () => {
    expect(parseNumberInput('  42  ')).toBe(42);
  });

  it('returns null for empty string', () => {
    expect(parseNumberInput('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(parseNumberInput('   ')).toBeNull();
  });

  it('returns null for non-string input', () => {
    expect(parseNumberInput(42 as unknown as string)).toBeNull();
    expect(parseNumberInput(null as unknown as string)).toBeNull();
  });
});

describe('parseNumberInput — rejections', () => {
  it('returns null for "abc"', () => {
    expect(parseNumberInput('abc')).toBeNull();
  });

  it('returns null for partial parse "12abc"', () => {
    expect(parseNumberInput('12abc')).toBeNull();
  });

  it('returns null for multiple decimal points', () => {
    expect(parseNumberInput('1.2.3')).toBeNull();
  });

  it('returns null for "NaN" string', () => {
    expect(parseNumberInput('NaN')).toBeNull();
  });

  it('returns null for "Infinity" string', () => {
    expect(parseNumberInput('Infinity')).toBeNull();
  });
});

describe('parseNumberInput — locale separators', () => {
  it('strips comma thousand separator (en-US)', () => {
    expect(parseNumberInput('1,234.56', { thousandSeparator: ',' })).toBe(1234.56);
  });

  it('strips comma + parses pure integer with separators', () => {
    expect(parseNumberInput('1,234,567', { thousandSeparator: ',' })).toBe(1234567);
  });

  it('parses European-style: . thousand, , decimal', () => {
    expect(parseNumberInput('1.234,56', { thousandSeparator: '.', decimalSeparator: ',' })).toBe(
      1234.56,
    );
  });

  it("parses Swiss-style: ' thousand, . decimal", () => {
    expect(parseNumberInput("1'234.56", { thousandSeparator: "'" })).toBe(1234.56);
  });

  it('parses space-separated thousands', () => {
    expect(parseNumberInput('1 234 567', { thousandSeparator: ' ' })).toBe(1234567);
  });
});

describe('parseNumberInput — allowNegative', () => {
  it('rejects negative when allowNegative: false', () => {
    expect(parseNumberInput('-42', { allowNegative: false })).toBeNull();
  });

  it('accepts positive when allowNegative: false', () => {
    expect(parseNumberInput('42', { allowNegative: false })).toBe(42);
  });

  it('accepts zero when allowNegative: false', () => {
    expect(parseNumberInput('0', { allowNegative: false })).toBe(0);
  });
});

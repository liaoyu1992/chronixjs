import { describe, expect, it } from 'vitest';

import { coerceEditDraftValue } from './coerce-edit-draft-value.js';

import type { ColumnSpec } from '../ir/index.js';

const textColumn: ColumnSpec = { id: 'note', field: 'note', type: 'text', editable: true };
const numberColumn: ColumnSpec = { id: 'price', field: 'price', type: 'number', editable: true };
const untypedColumn: ColumnSpec = { id: 'misc', field: 'misc', editable: true };

describe('coerceEditDraftValue', () => {
  it('text column passes through any raw value (including non-strings)', () => {
    expect(coerceEditDraftValue(textColumn, 'hello')).toEqual({ ok: true, value: 'hello' });
    expect(coerceEditDraftValue(textColumn, '')).toEqual({ ok: true, value: '' });
    expect(coerceEditDraftValue(textColumn, null)).toEqual({ ok: true, value: null });
    expect(coerceEditDraftValue(untypedColumn, 'anything')).toEqual({
      ok: true,
      value: 'anything',
    });
  });

  it('number column with finite numeric raw returns the same number (re-commit path)', () => {
    expect(coerceEditDraftValue(numberColumn, 42)).toEqual({ ok: true, value: 42 });
    expect(coerceEditDraftValue(numberColumn, 0)).toEqual({ ok: true, value: 0 });
    expect(coerceEditDraftValue(numberColumn, -3.14)).toEqual({ ok: true, value: -3.14 });
  });

  it('number column rejects non-finite numeric raw', () => {
    expect(coerceEditDraftValue(numberColumn, Number.NaN)).toEqual({ ok: false });
    expect(coerceEditDraftValue(numberColumn, Number.POSITIVE_INFINITY)).toEqual({ ok: false });
    expect(coerceEditDraftValue(numberColumn, Number.NEGATIVE_INFINITY)).toEqual({ ok: false });
  });

  it('number column parses integer / float / negative / scientific notation strings', () => {
    expect(coerceEditDraftValue(numberColumn, '42')).toEqual({ ok: true, value: 42 });
    expect(coerceEditDraftValue(numberColumn, '1.5')).toEqual({ ok: true, value: 1.5 });
    expect(coerceEditDraftValue(numberColumn, '-3.14')).toEqual({ ok: true, value: -3.14 });
    expect(coerceEditDraftValue(numberColumn, '1e3')).toEqual({ ok: true, value: 1000 });
    expect(coerceEditDraftValue(numberColumn, '  42  ')).toEqual({ ok: true, value: 42 });
  });

  it('number column with empty / whitespace-only string → null (Decision B.1)', () => {
    expect(coerceEditDraftValue(numberColumn, '')).toEqual({ ok: true, value: null });
    expect(coerceEditDraftValue(numberColumn, '   ')).toEqual({ ok: true, value: null });
    expect(coerceEditDraftValue(numberColumn, '\t\n')).toEqual({ ok: true, value: null });
  });

  it('number column rejects invalid input — non-numeric / malformed / typed non-string non-number (Decision C.1)', () => {
    expect(coerceEditDraftValue(numberColumn, 'abc')).toEqual({ ok: false });
    expect(coerceEditDraftValue(numberColumn, '1.2.3')).toEqual({ ok: false });
    expect(coerceEditDraftValue(numberColumn, '--5')).toEqual({ ok: false });
    expect(coerceEditDraftValue(numberColumn, '1e')).toEqual({ ok: false });
    expect(coerceEditDraftValue(numberColumn, null)).toEqual({ ok: false });
    expect(coerceEditDraftValue(numberColumn, undefined)).toEqual({ ok: false });
    expect(coerceEditDraftValue(numberColumn, true)).toEqual({ ok: false });
    expect(coerceEditDraftValue(numberColumn, {})).toEqual({ ok: false });
  });
});

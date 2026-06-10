import { describe, expect, it } from 'vitest';

import { parseClipboardTsv } from './parse-clipboard-tsv.js';

describe('parseClipboardTsv', () => {
  it('single cell (no tabs, no newlines) → 1×1 grid', () => {
    expect(parseClipboardTsv('hello')).toEqual([['hello']]);
  });

  it('single row N cols (tabs only) → 1×N grid', () => {
    expect(parseClipboardTsv('a\tb\tc')).toEqual([['a', 'b', 'c']]);
  });

  it('N rows single col (newlines only) → N×1 grid', () => {
    expect(parseClipboardTsv('a\nb\nc')).toEqual([['a'], ['b'], ['c']]);
  });

  it('N×M rectangle (tabs + newlines) → N×M grid', () => {
    expect(parseClipboardTsv('a\tb\tc\nd\te\tf')).toEqual([
      ['a', 'b', 'c'],
      ['d', 'e', 'f'],
    ]);
  });

  it('CRLF line endings → same parse as LF (cross-platform paste-from-Notepad)', () => {
    expect(parseClipboardTsv('a\tb\r\nc\td')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ]);
  });

  it('trailing newline → drop one trailing empty row (TSV convention)', () => {
    expect(parseClipboardTsv('a\tb\n')).toEqual([['a', 'b']]);
    expect(parseClipboardTsv('a\tb\r\n')).toEqual([['a', 'b']]);
    expect(parseClipboardTsv('row1\nrow2\n')).toEqual([['row1'], ['row2']]);
  });

  it('empty string → zero-row grid (caller treats as no-op paste)', () => {
    expect(parseClipboardTsv('')).toEqual([]);
    // Lone newline → drop it → empty.
    expect(parseClipboardTsv('\n')).toEqual([]);
  });
});

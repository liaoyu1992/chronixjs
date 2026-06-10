import { describe, expect, it } from 'vitest';

import { splitTextByQuickFindMatch } from './split-text-by-quick-find-match.js';

describe('splitTextByQuickFindMatch', () => {
  it('empty text → empty array', () => {
    expect(splitTextByQuickFindMatch('', 'alpha')).toEqual([]);
    expect(splitTextByQuickFindMatch('', '')).toEqual([]);
  });

  it('empty needle → single non-match segment with full text', () => {
    expect(splitTextByQuickFindMatch('hello world', '')).toEqual([
      { text: 'hello world', isMatch: false },
    ]);
  });

  it('whitespace-only needle → single non-match segment', () => {
    expect(splitTextByQuickFindMatch('hello world', '   ')).toEqual([
      { text: 'hello world', isMatch: false },
    ]);
  });

  it('no match → single non-match segment with full text', () => {
    expect(splitTextByQuickFindMatch('hello world', 'xyz')).toEqual([
      { text: 'hello world', isMatch: false },
    ]);
  });

  it('match at start → match + non-match', () => {
    expect(splitTextByQuickFindMatch('Alpha needs review', 'alpha')).toEqual([
      { text: 'Alpha', isMatch: true },
      { text: ' needs review', isMatch: false },
    ]);
  });

  it('match at end → non-match + match', () => {
    expect(splitTextByQuickFindMatch('review the Alpha', 'alpha')).toEqual([
      { text: 'review the ', isMatch: false },
      { text: 'Alpha', isMatch: true },
    ]);
  });

  it('match in middle → non-match + match + non-match', () => {
    expect(splitTextByQuickFindMatch('one Alpha three', 'alpha')).toEqual([
      { text: 'one ', isMatch: false },
      { text: 'Alpha', isMatch: true },
      { text: ' three', isMatch: false },
    ]);
  });

  it('multiple non-overlapping matches → alternating segments', () => {
    expect(splitTextByQuickFindMatch('Alpha and ALPHA and alpha', 'alpha')).toEqual([
      { text: 'Alpha', isMatch: true },
      { text: ' and ', isMatch: false },
      { text: 'ALPHA', isMatch: true },
      { text: ' and ', isMatch: false },
      { text: 'alpha', isMatch: true },
    ]);
  });

  it('back-to-back matches → no empty non-match segment between them', () => {
    expect(splitTextByQuickFindMatch('AlphaAlpha', 'alpha')).toEqual([
      { text: 'Alpha', isMatch: true },
      { text: 'Alpha', isMatch: true },
    ]);
  });

  it('case-insensitive matching preserves original-case in match segments', () => {
    const result = splitTextByQuickFindMatch('AlPhA', 'alpha');
    expect(result).toEqual([{ text: 'AlPhA', isMatch: true }]);
  });

  it('needle trims surrounding whitespace before matching', () => {
    expect(splitTextByQuickFindMatch('Alpha', '  alpha  ')).toEqual([
      { text: 'Alpha', isMatch: true },
    ]);
  });

  it('needle longer than text → single non-match segment', () => {
    expect(splitTextByQuickFindMatch('hi', 'hello world')).toEqual([
      { text: 'hi', isMatch: false },
    ]);
  });

  it('every emitted segment has non-empty text (invariant)', () => {
    const cases = [
      ['Alpha needs review', 'alpha'],
      ['AlphaAlpha', 'alpha'],
      ['no match', 'alpha'],
      ['', 'alpha'],
    ];
    for (const [text, needle] of cases) {
      const segments = splitTextByQuickFindMatch(text!, needle!);
      for (const segment of segments) {
        expect(segment.text.length).toBeGreaterThan(0);
      }
    }
  });
});

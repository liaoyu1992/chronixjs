import { describe, expect, it } from 'vitest';

import { filterAutocompleteItems } from './filter-autocomplete-items.js';

const getText = (s: string): string => s;

describe('filterAutocompleteItems', () => {
  it('empty query returns all items with score=0 in input order', () => {
    const result = filterAutocompleteItems({
      items: ['banana', 'apple', 'cherry'],
      query: '',
      getText,
    });
    expect(result.length).toBe(3);
    expect(result[0]?.item).toBe('banana');
    expect(result[1]?.item).toBe('apple');
    expect(result[2]?.item).toBe('cherry');
    expect(result.every((m) => m.score === 0 && m.matchSpans.length === 0)).toBe(true);
  });

  it('prefix mode matches only items starting with query', () => {
    const result = filterAutocompleteItems({
      items: ['java', 'javascript', 'mojave', 'python'],
      query: 'ja',
      getText,
      matchMode: 'prefix',
    });
    expect(result.map((m) => m.item)).toEqual(['java', 'javascript']);
  });

  it('prefix mode excludes mid-string matches', () => {
    const result = filterAutocompleteItems({
      items: ['mojave'],
      query: 'java',
      getText,
      matchMode: 'prefix',
    });
    expect(result.length).toBe(0);
  });

  it('substring mode matches anywhere in text', () => {
    const result = filterAutocompleteItems({
      items: ['java', 'majavascript', 'python'],
      query: 'java',
      getText,
      matchMode: 'substring',
    });
    expect(result.map((m) => m.item).sort()).toEqual(['java', 'majavascript']);
  });

  it('substring mode ranks prefix-position-0 (score=-1) before mid-string', () => {
    const result = filterAutocompleteItems({
      items: ['mojave', 'java', 'javascript'],
      query: 'ja',
      getText,
    });
    // java + javascript have score -1; mojave has score 2.
    expect(result[0]?.item).toBe('java');
    expect(result[1]?.item).toBe('javascript');
    expect(result[2]?.item).toBe('mojave');
    expect(result[0]?.score).toBe(-1);
    expect(result[1]?.score).toBe(-1);
    expect(result[2]?.score).toBe(2);
  });

  it('substring mode ranks earlier match-start before later', () => {
    const result = filterAutocompleteItems({
      items: ['xxabcyy', 'abcxx', 'yyabc'],
      query: 'abc',
      getText,
    });
    // abcxx: score=-1 (idx=0); yyabc: score=2; xxabcyy: score=2.
    expect(result[0]?.item).toBe('abcxx');
    // Score=2 ties broken alphabetically (xxabcyy < yyabc).
    expect(result[1]?.item).toBe('xxabcyy');
    expect(result[2]?.item).toBe('yyabc');
  });

  it('ties broken alphabetically by text', () => {
    const result = filterAutocompleteItems({
      items: ['typescript', 'rust', 'ruby', 'racket'],
      query: 'r',
      getText,
      matchMode: 'prefix',
    });
    // All start with 'r' ⇒ all score=-1; alphabetic: racket, ruby, rust.
    expect(result.map((m) => m.item)).toEqual(['racket', 'ruby', 'rust']);
  });

  it('case-insensitive prefix match', () => {
    const result = filterAutocompleteItems({
      items: ['Apple', 'BANANA'],
      query: 'app',
      getText,
      matchMode: 'prefix',
    });
    expect(result.map((m) => m.item)).toEqual(['Apple']);
  });

  it('case-insensitive substring match', () => {
    const result = filterAutocompleteItems({
      items: ['umbrella', 'Brown', 'cat'],
      query: 'BR',
      getText,
    });
    // 'Brown' has 'br' at idx 0 (score -1); 'umbrella' has 'br' at idx 2 (score 2).
    expect(result.map((m) => m.item)).toEqual(['Brown', 'umbrella']);
  });

  it('generic over rich item shape via getText extractor', () => {
    interface Person {
      id: number;
      name: string;
    }
    const people: Person[] = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' },
    ];
    const result = filterAutocompleteItems({
      items: people,
      query: 'al',
      getText: (p) => p.name,
      matchMode: 'prefix',
    });
    expect(result.length).toBe(1);
    expect(result[0]?.item.id).toBe(1);
    expect(result[0]?.item.name).toBe('Alice');
  });

  it('matchSpans correct for prefix mode (start at 0)', () => {
    const result = filterAutocompleteItems({
      items: ['JavaScript'],
      query: 'Java',
      getText,
      matchMode: 'prefix',
    });
    expect(result[0]?.matchSpans).toEqual([{ start: 0, end: 4 }]);
  });

  it('matchSpans correct for substring mode at non-zero index', () => {
    const result = filterAutocompleteItems({
      items: ['HelloWorld'],
      query: 'World',
      getText,
    });
    // 'World' at index 5 in 'HelloWorld'.
    expect(result[0]?.matchSpans).toEqual([{ start: 5, end: 10 }]);
  });

  it('empty result when no items match in substring mode', () => {
    const result = filterAutocompleteItems({
      items: ['apple', 'banana'],
      query: 'xyz',
      getText,
    });
    expect(result.length).toBe(0);
  });

  it('default match mode is substring', () => {
    const result = filterAutocompleteItems({
      items: ['HelloWorld'],
      query: 'World',
      getText,
    });
    // No explicit matchMode ⇒ default substring ⇒ 'World' at idx 5.
    expect(result.length).toBe(1);
    expect(result[0]?.item).toBe('HelloWorld');
    expect(result[0]?.matchSpans).toEqual([{ start: 5, end: 10 }]);
  });
});

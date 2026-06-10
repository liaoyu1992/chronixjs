import { describe, expect, it } from 'vitest';

import {
  defaultHighlightProps,
  splitHighlightSegments,
  type HighlightProps,
} from './highlight-spec.js';

function props(over: Partial<HighlightProps> = {}): HighlightProps {
  return { ...defaultHighlightProps, ...over };
}

describe('defaultHighlightProps', () => {
  it('matches defaults', () => {
    expect(defaultHighlightProps).toEqual({
      value: '',
      pattern: '',
      caseSensitive: false,
    });
  });
});

describe('splitHighlightSegments', () => {
  it('returns [] for empty value', () => {
    expect(splitHighlightSegments(props())).toEqual([]);
  });

  it('returns a single unmatched segment when pattern is empty', () => {
    expect(splitHighlightSegments(props({ value: 'hello' }))).toEqual([
      { text: 'hello', matched: false },
    ]);
  });

  it('splits value around a single match', () => {
    expect(splitHighlightSegments(props({ value: 'foobarbaz', pattern: 'bar' }))).toEqual([
      { text: 'foo', matched: false },
      { text: 'bar', matched: true },
      { text: 'baz', matched: false },
    ]);
  });

  it('splits multiple matches', () => {
    expect(splitHighlightSegments(props({ value: 'ababab', pattern: 'ab' }))).toEqual([
      { text: 'ab', matched: true },
      { text: 'ab', matched: true },
      { text: 'ab', matched: true },
    ]);
  });

  it('honors case-insensitive matching by default', () => {
    expect(splitHighlightSegments(props({ value: 'Foo BAR baz', pattern: 'bar' }))).toEqual([
      { text: 'Foo ', matched: false },
      { text: 'BAR', matched: true },
      { text: ' baz', matched: false },
    ]);
  });

  it('honors caseSensitive=true', () => {
    expect(
      splitHighlightSegments(props({ value: 'Foo BAR baz', pattern: 'bar', caseSensitive: true })),
    ).toEqual([{ text: 'Foo BAR baz', matched: false }]);
  });
});

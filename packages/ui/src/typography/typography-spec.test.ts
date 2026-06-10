import { describe, expect, it } from 'vitest';

import {
  defaultTypographyProps,
  getTypographyTag,
  type TypographyProps,
  type TypographyVariant,
} from './typography-spec.js';

describe('defaultTypographyProps', () => {
  it('matches defaults', () => {
    expect(defaultTypographyProps).toEqual({
      variant: 'text',
      level: 1,
      italic: false,
      underline: false,
    });
  });
});

describe('getTypographyTag', () => {
  const cases: readonly [TypographyVariant, Partial<TypographyProps>, string][] = [
    ['text', {}, 'span'],
    ['title', { level: 1 }, 'h1'],
    ['title', { level: 3 }, 'h3'],
    ['title', { level: 6 }, 'h6'],
    ['p', {}, 'p'],
    ['blockquote', {}, 'blockquote'],
    ['hr', {}, 'hr'],
  ];

  for (const [variant, over, expected] of cases) {
    it(`maps variant=${variant} level=${over.level ?? '-'} -> <${expected}>`, () => {
      const props: TypographyProps = { ...defaultTypographyProps, variant, ...over };
      expect(getTypographyTag(props)).toBe(expected);
    });
  }
});

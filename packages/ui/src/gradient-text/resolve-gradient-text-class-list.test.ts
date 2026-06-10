import { describe, expect, it } from 'vitest';

import { defaultGradientTextProps } from './gradient-text-spec.js';
import { resolveGradientTextClassList } from './resolve-gradient-text-class-list.js';

describe('resolveGradientTextClassList', () => {
  it('returns the base class', () => {
    expect(resolveGradientTextClassList(defaultGradientTextProps)).toEqual(['cx-ui-gradient-text']);
  });
});

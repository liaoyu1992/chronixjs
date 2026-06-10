import { describe, expect, it } from 'vitest';

import { resolveAffixClassList } from './resolve-affix-class-list.js';

describe('resolveAffixClassList', () => {
  it('returns base when not affixed', () => {
    expect(resolveAffixClassList({ affixed: false })).toEqual(['cx-ui-affix']);
  });

  it('adds --affixed modifier when affixed=true', () => {
    expect(resolveAffixClassList({ affixed: true })).toContain('cx-ui-affix--affixed');
  });
});

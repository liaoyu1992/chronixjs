import { describe, expect, it } from 'vitest';

import { resolveScrollbarClassList } from './resolve-scrollbar-class-list.js';

describe('resolveScrollbarClassList', () => {
  it('returns base + --hover by default', () => {
    expect(resolveScrollbarClassList({})).toEqual(['cx-ui-scrollbar', 'cx-ui-scrollbar--hover']);
  });

  it('returns --hover modifier when trigger is hover', () => {
    const result = resolveScrollbarClassList({ trigger: 'hover' });
    expect(result).toEqual(['cx-ui-scrollbar', 'cx-ui-scrollbar--hover']);
  });

  it('returns --none modifier when trigger is none', () => {
    const result = resolveScrollbarClassList({ trigger: 'none' });
    expect(result).toEqual(['cx-ui-scrollbar', 'cx-ui-scrollbar--none']);
  });

  it('returns only base when trigger is undefined (defaults to hover)', () => {
    const result = resolveScrollbarClassList({ trigger: undefined });
    expect(result).toEqual(['cx-ui-scrollbar', 'cx-ui-scrollbar--hover']);
  });
});

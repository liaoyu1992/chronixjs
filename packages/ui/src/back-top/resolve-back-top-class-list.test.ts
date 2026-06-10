import { describe, expect, it } from 'vitest';

import { resolveBackTopClassList } from './resolve-back-top-class-list.js';

describe('resolveBackTopClassList', () => {
  it('returns base when invisible', () => {
    expect(resolveBackTopClassList({ visible: false })).toEqual(['cx-ui-back-top']);
  });
  it('adds --visible modifier when visible=true', () => {
    expect(resolveBackTopClassList({ visible: true })).toContain('cx-ui-back-top--visible');
  });
});

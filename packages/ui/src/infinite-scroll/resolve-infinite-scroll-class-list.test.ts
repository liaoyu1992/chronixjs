import { describe, expect, it } from 'vitest';

import { resolveInfiniteScrollClassList } from './resolve-infinite-scroll-class-list.js';

describe('resolveInfiniteScrollClassList', () => {
  it('returns base class only', () => {
    expect(resolveInfiniteScrollClassList()).toEqual(['cx-ui-infinite-scroll']);
  });
});

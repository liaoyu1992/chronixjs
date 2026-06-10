import { describe, expect, it } from 'vitest';

import { resolveLoadingBarClassList } from './resolve-loading-bar-class-list.js';

import type { LoadingBarState } from './loading-bar-spec.js';

describe('resolveLoadingBarClassList', () => {
  it('returns only base class for idle state (no modifier)', () => {
    expect(resolveLoadingBarClassList({ state: 'idle' })).toEqual(['cx-ui-loading-bar']);
  });

  it('returns base + loading modifier for loading state', () => {
    expect(resolveLoadingBarClassList({ state: 'loading' })).toEqual([
      'cx-ui-loading-bar',
      'cx-ui-loading-bar--loading',
    ]);
  });

  it('returns base + finishing modifier for finishing state', () => {
    expect(resolveLoadingBarClassList({ state: 'finishing' })).toEqual([
      'cx-ui-loading-bar',
      'cx-ui-loading-bar--finishing',
    ]);
  });

  it('returns base + error modifier for error state', () => {
    expect(resolveLoadingBarClassList({ state: 'error' })).toEqual([
      'cx-ui-loading-bar',
      'cx-ui-loading-bar--error',
    ]);
  });

  it('idle returns exactly 1 class, non-idle returns exactly 2', () => {
    expect(resolveLoadingBarClassList({ state: 'idle' })).toHaveLength(1);
    const nonIdle: LoadingBarState[] = ['loading', 'finishing', 'error'];
    for (const s of nonIdle) {
      expect(resolveLoadingBarClassList({ state: s })).toHaveLength(2);
    }
  });
});

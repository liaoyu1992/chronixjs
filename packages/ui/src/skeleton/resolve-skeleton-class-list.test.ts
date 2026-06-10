import { describe, expect, it } from 'vitest';

import { resolveSkeletonClassList } from './resolve-skeleton-class-list.js';
import { defaultSkeletonProps } from './skeleton-spec.js';

describe('resolveSkeletonClassList', () => {
  it('returns base + text + animated for defaults', () => {
    expect(resolveSkeletonClassList(defaultSkeletonProps)).toEqual([
      'cx-ui-skeleton',
      'cx-ui-skeleton--text',
      'cx-ui-skeleton--animated',
    ]);
  });

  it('reflects all 3 shapes', () => {
    for (const s of ['text', 'rect', 'circle'] as const) {
      const classes = resolveSkeletonClassList({ ...defaultSkeletonProps, shape: s });
      expect(classes).toContain(`cx-ui-skeleton--${s}`);
    }
  });

  it('omits --animated when animated=false', () => {
    expect(resolveSkeletonClassList({ ...defaultSkeletonProps, animated: false })).not.toContain(
      'cx-ui-skeleton--animated',
    );
  });

  it('adds --round when round=true', () => {
    expect(resolveSkeletonClassList({ ...defaultSkeletonProps, round: true })).toContain(
      'cx-ui-skeleton--round',
    );
  });

  it('returns a fresh array per call', () => {
    const a = resolveSkeletonClassList(defaultSkeletonProps);
    const b = resolveSkeletonClassList(defaultSkeletonProps);
    expect(a).not.toBe(b);
  });
});

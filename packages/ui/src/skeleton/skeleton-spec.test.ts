import { describe, expect, it } from 'vitest';

import { defaultSkeletonProps, type SkeletonProps } from './skeleton-spec.js';

describe('defaultSkeletonProps', () => {
  it('matches the documented defaults (text, no width/height, animated, not round)', () => {
    expect(defaultSkeletonProps).toEqual({
      shape: 'text',
      width: undefined,
      height: undefined,
      animated: true,
      round: false,
    });
  });

  it('is a SkeletonProps-shape that adapters can spread', () => {
    const override: SkeletonProps = {
      ...defaultSkeletonProps,
      shape: 'circle',
      width: 48,
      height: 48,
    };
    expect(override.shape).toBe('circle');
    expect(override.width).toBe(48);
  });
});

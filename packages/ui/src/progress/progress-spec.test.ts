import { describe, expect, it } from 'vitest';

import { defaultProgressProps, type ProgressProps } from './progress-spec.js';

describe('defaultProgressProps', () => {
  it('matches the documented defaults (default type, 0%, info outside)', () => {
    expect(defaultProgressProps).toEqual({
      type: 'default',
      percentage: 0,
      showInfo: true,
      height: undefined,
      indicatorPlacement: 'outside',
    });
  });

  it('is a ProgressProps-shape that adapters can spread', () => {
    const override: ProgressProps = {
      ...defaultProgressProps,
      type: 'success',
      percentage: 75,
      height: 12,
    };
    expect(override.type).toBe('success');
    expect(override.percentage).toBe(75);
    expect(override.height).toBe(12);
  });
});

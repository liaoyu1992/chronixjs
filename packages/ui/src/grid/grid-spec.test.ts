import { describe, expect, it } from 'vitest';

import { defaultGridProps, type GridProps } from './grid-spec.js';

describe('defaultGridProps', () => {
  it('matches the documented defaults (all undefined except inline=false)', () => {
    expect(defaultGridProps).toEqual({
      cols: undefined,
      xGap: undefined,
      yGap: undefined,
      inline: false,
    });
  });

  it('is a GridProps-shape that adapters can spread', () => {
    const override: GridProps = {
      ...defaultGridProps,
      cols: 12,
      xGap: 16,
      yGap: 8,
    };
    expect(override.cols).toBe(12);
    expect(override.xGap).toBe(16);
    expect(override.yGap).toBe(8);
  });
});

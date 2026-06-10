import { describe, expect, it } from 'vitest';

import { defaultSpaceProps, type SpaceProps } from './space-spec.js';

describe('defaultSpaceProps', () => {
  it('matches the documented defaults (medium, horizontal, wrap, no align/justify, not inline)', () => {
    expect(defaultSpaceProps).toEqual({
      size: 'medium',
      vertical: false,
      wrap: true,
      align: undefined,
      justify: undefined,
      inline: false,
    });
  });

  it('is a SpaceProps-shape that adapters can spread', () => {
    const override: SpaceProps = {
      ...defaultSpaceProps,
      vertical: true,
      size: 20,
      align: 'center',
    };
    expect(override.vertical).toBe(true);
    expect(override.size).toBe(20);
    expect(override.align).toBe('center');
  });
});

import { describe, expect, it } from 'vitest';

import { defaultFlexProps, type FlexProps } from './flex-spec.js';

describe('defaultFlexProps', () => {
  it('matches the documented defaults (row, nowrap, no align/justify/gap, not inline)', () => {
    expect(defaultFlexProps).toEqual({
      direction: 'row',
      wrap: 'nowrap',
      align: undefined,
      justify: undefined,
      gap: undefined,
      inline: false,
    });
  });

  it('is a FlexProps-shape that adapters can spread', () => {
    const override: FlexProps = {
      ...defaultFlexProps,
      direction: 'column-reverse',
      wrap: 'wrap-reverse',
      gap: 16,
    };
    expect(override.direction).toBe('column-reverse');
    expect(override.wrap).toBe('wrap-reverse');
    expect(override.gap).toBe(16);
  });
});

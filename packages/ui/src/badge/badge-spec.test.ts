import { describe, expect, it } from 'vitest';

import { defaultBadgeProps, type BadgeProps } from './badge-spec.js';

describe('defaultBadgeProps', () => {
  it('matches the documented defaults (no value, dot off, default type, show=true)', () => {
    expect(defaultBadgeProps).toEqual({
      value: undefined,
      max: undefined,
      dot: false,
      type: 'default',
      processing: false,
      show: true,
    });
  });

  it('is a BadgeProps-shape that adapters can spread', () => {
    const override: BadgeProps = { ...defaultBadgeProps, value: 5, max: 99 };
    expect(override.value).toBe(5);
    expect(override.max).toBe(99);
    expect(override.type).toBe('default');
  });
});

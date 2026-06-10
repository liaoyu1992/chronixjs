import { describe, expect, it } from 'vitest';

import { defaultCountdownProps, type CountdownProps } from './countdown-spec.js';

describe('defaultCountdownProps', () => {
  it('matches the documented defaults (duration 0, precision 0, active true)', () => {
    expect(defaultCountdownProps).toEqual({
      label: undefined,
      duration: 0,
      precision: 0,
      active: true,
    });
  });

  it('is a CountdownProps-shape that adapters can spread', () => {
    const override: CountdownProps = {
      ...defaultCountdownProps,
      label: 'Sale ends',
      duration: 60_000,
      precision: 2,
      active: false,
    };
    expect(override.duration).toBe(60_000);
    expect(override.precision).toBe(2);
    expect(override.active).toBe(false);
  });
});

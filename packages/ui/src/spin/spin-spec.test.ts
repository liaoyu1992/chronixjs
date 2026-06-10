import { describe, expect, it } from 'vitest';

import { defaultSpinProps, type SpinProps } from './spin-spec.js';

describe('defaultSpinProps', () => {
  it('matches the documented defaults (medium, show=true, no description)', () => {
    expect(defaultSpinProps).toEqual({
      size: 'medium',
      show: true,
      description: undefined,
    });
  });

  it('is a SpinProps-shape that adapters can spread', () => {
    const override: SpinProps = {
      ...defaultSpinProps,
      size: 'large',
      description: 'Loading',
    };
    expect(override.size).toBe('large');
    expect(override.description).toBe('Loading');
    expect(override.show).toBe(true);
  });
});

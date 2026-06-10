import { describe, expect, it } from 'vitest';

import { DEFAULT_WAVE_DURATION_MS, defaultWaveProps } from './wave-spec.js';

describe('defaultWaveProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultWaveProps).toEqual({
      color: undefined,
      duration: DEFAULT_WAVE_DURATION_MS,
      disabled: false,
    });
  });

  it('DEFAULT_WAVE_DURATION_MS is 600', () => {
    expect(DEFAULT_WAVE_DURATION_MS).toBe(600);
  });
});

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TRANSITION_DURATION_MS,
  DEFAULT_TRANSITION_EASING,
  defaultTransitionSpec,
  type TransitionSpec,
} from './transition-spec.js';

describe('TransitionSpec defaults', () => {
  it('DEFAULT_TRANSITION_DURATION_MS is 200', () => {
    expect(DEFAULT_TRANSITION_DURATION_MS).toBe(200);
  });

  it('DEFAULT_TRANSITION_EASING is the Material standard curve', () => {
    expect(DEFAULT_TRANSITION_EASING).toBe('cubic-bezier(0.4, 0, 0.2, 1)');
  });

  it('defaultTransitionSpec uses the DEFAULT_* constants with zero delay', () => {
    expect(defaultTransitionSpec.durationMs).toBe(DEFAULT_TRANSITION_DURATION_MS);
    expect(defaultTransitionSpec.easing).toBe(DEFAULT_TRANSITION_EASING);
    expect(defaultTransitionSpec.delayMs).toBe(0);
  });

  it('exposes exactly 3 fields (no leftover keys)', () => {
    expect(Object.keys(defaultTransitionSpec).sort()).toEqual(
      ['delayMs', 'durationMs', 'easing'].sort(),
    );
  });

  it('type accepts custom spec values', () => {
    const custom: TransitionSpec = { durationMs: 350, easing: 'ease-out', delayMs: 50 };
    expect(custom.durationMs).toBe(350);
  });
});

import { describe, expect, it } from 'vitest';

import {
  buildGradientTextBackground,
  defaultGradientTextProps,
  type GradientTextProps,
} from './gradient-text-spec.js';

describe('defaultGradientTextProps', () => {
  it('matches defaults', () => {
    expect(defaultGradientTextProps).toEqual({
      value: '',
      colors: ['#3b82f6', '#a855f7'],
      direction: 90,
    });
  });
});

describe('buildGradientTextBackground', () => {
  it('builds a linear-gradient() string with direction + 2 stops', () => {
    expect(buildGradientTextBackground(defaultGradientTextProps)).toBe(
      'linear-gradient(90deg, #3b82f6, #a855f7)',
    );
  });

  it('honors a custom direction', () => {
    const props: GradientTextProps = {
      ...defaultGradientTextProps,
      direction: 45,
    };
    expect(buildGradientTextBackground(props)).toBe('linear-gradient(45deg, #3b82f6, #a855f7)');
  });

  it('honors custom color stops', () => {
    const props: GradientTextProps = {
      ...defaultGradientTextProps,
      colors: ['#ff0000', '#0000ff'],
    };
    expect(buildGradientTextBackground(props)).toBe('linear-gradient(90deg, #ff0000, #0000ff)');
  });
});

import { describe, expect, it } from 'vitest';

import { defaultMarqueeProps, type MarqueeDirection, type MarqueeProps } from './marquee-spec.js';

describe('defaultMarqueeProps', () => {
  it('matches the documented defaults', () => {
    expect(defaultMarqueeProps).toEqual({
      direction: 'left',
      speed: 50,
      pauseOnHover: false,
    });
  });

  it('is a MarqueeProps-shape that adapters can spread', () => {
    const override: MarqueeProps = {
      ...defaultMarqueeProps,
      direction: 'right',
      speed: 100,
      pauseOnHover: true,
    };
    expect(override.direction).toBe('right');
    expect(override.speed).toBe(100);
    expect(override.pauseOnHover).toBe(true);
  });
});

describe('MarqueeDirection closed union', () => {
  it.each(['left', 'right', 'up', 'down'] as const)(
    'accepts direction "%s"',
    (dir: MarqueeDirection) => {
      const props: MarqueeProps = { ...defaultMarqueeProps, direction: dir };
      expect(props.direction).toBe(dir);
    },
  );
});

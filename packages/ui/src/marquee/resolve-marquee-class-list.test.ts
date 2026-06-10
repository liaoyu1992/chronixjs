import { describe, expect, it } from 'vitest';

import { defaultMarqueeProps, type MarqueeProps } from './marquee-spec.js';
import { resolveMarqueeClassList } from './resolve-marquee-class-list.js';

function props(over: Partial<MarqueeProps> = {}): MarqueeProps {
  return { ...defaultMarqueeProps, ...over };
}

describe('resolveMarqueeClassList', () => {
  it('returns base + direction for default props', () => {
    expect(resolveMarqueeClassList(props())).toEqual([
      'cx-ui-marquee',
      'cx-ui-marquee--direction-left',
    ]);
  });

  it.each(['left', 'right', 'up', 'down'] as const)(
    'reflects direction="%s" via --direction-{value} modifier',
    (direction) => {
      expect(resolveMarqueeClassList(props({ direction }))).toContain(
        `cx-ui-marquee--direction-${direction}`,
      );
    },
  );

  it('adds --pause-on-hover when pauseOnHover is true', () => {
    expect(resolveMarqueeClassList(props({ pauseOnHover: true }))).toContain(
      'cx-ui-marquee--pause-on-hover',
    );
  });

  it('omits --pause-on-hover when pauseOnHover is false', () => {
    expect(resolveMarqueeClassList(props({ pauseOnHover: false }))).not.toContain(
      'cx-ui-marquee--pause-on-hover',
    );
  });

  it('combines direction + pause-on-hover when both apply', () => {
    expect(resolveMarqueeClassList(props({ direction: 'right', pauseOnHover: true }))).toEqual([
      'cx-ui-marquee',
      'cx-ui-marquee--direction-right',
      'cx-ui-marquee--pause-on-hover',
    ]);
  });

  it('returns a fresh array per call', () => {
    expect(resolveMarqueeClassList(props())).not.toBe(resolveMarqueeClassList(props()));
  });
});

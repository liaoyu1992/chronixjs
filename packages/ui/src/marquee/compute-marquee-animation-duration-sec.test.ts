import { describe, expect, it } from 'vitest';

import { computeMarqueeAnimationDurationSec } from './compute-marquee-animation-duration-sec.js';

describe('computeMarqueeAnimationDurationSec', () => {
  it('returns 0 for non-positive speed (paused)', () => {
    expect(computeMarqueeAnimationDurationSec(200, 0)).toBe(0);
    expect(computeMarqueeAnimationDurationSec(200, -50)).toBe(0);
  });

  it('returns 0 for non-positive content size (unmeasured)', () => {
    expect(computeMarqueeAnimationDurationSec(0, 50)).toBe(0);
    expect(computeMarqueeAnimationDurationSec(-10, 50)).toBe(0);
  });

  it('returns contentSize / speed for normal positive inputs', () => {
    expect(computeMarqueeAnimationDurationSec(200, 50)).toBe(4);
    expect(computeMarqueeAnimationDurationSec(500, 100)).toBe(5);
    expect(computeMarqueeAnimationDurationSec(1000, 50)).toBe(20);
  });

  it('handles fractional results', () => {
    expect(computeMarqueeAnimationDurationSec(150, 100)).toBe(1.5);
    expect(computeMarqueeAnimationDurationSec(250, 100)).toBe(2.5);
  });

  it('returns 0 when both inputs are zero (defensive)', () => {
    expect(computeMarqueeAnimationDurationSec(0, 0)).toBe(0);
  });
});

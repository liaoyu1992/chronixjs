import { describe, expect, it } from 'vitest';

import { computeCountdownTickIntervalMs } from './compute-countdown-tick-interval-ms.js';

describe('computeCountdownTickIntervalMs', () => {
  it('returns 1000 for precision 0 (whole seconds)', () => {
    expect(computeCountdownTickIntervalMs(0)).toBe(1000);
  });

  it('returns 100 for precision 1', () => {
    expect(computeCountdownTickIntervalMs(1)).toBe(100);
  });

  it('returns 100 for precision 2 (same as 1; visual resolution achieved by format helper)', () => {
    expect(computeCountdownTickIntervalMs(2)).toBe(100);
  });

  it('returns 10 for precision 3 (sub-100ms resolution needs faster ticking)', () => {
    expect(computeCountdownTickIntervalMs(3)).toBe(10);
  });

  it('the cadence is monotonic (faster precision → shorter interval)', () => {
    const p0 = computeCountdownTickIntervalMs(0);
    const p1 = computeCountdownTickIntervalMs(1);
    const p2 = computeCountdownTickIntervalMs(2);
    const p3 = computeCountdownTickIntervalMs(3);
    expect(p0).toBeGreaterThanOrEqual(p1);
    expect(p1).toBeGreaterThanOrEqual(p2);
    expect(p2).toBeGreaterThanOrEqual(p3);
  });
});

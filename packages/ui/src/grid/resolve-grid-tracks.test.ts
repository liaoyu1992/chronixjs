import { describe, expect, it } from 'vitest';

import { resolveGridTracks } from './resolve-grid-tracks.js';

describe('resolveGridTracks', () => {
  it('returns undefined for undefined input (adapter omits inline style)', () => {
    expect(resolveGridTracks(undefined)).toBeUndefined();
  });

  it('maps positive integer to repeat(N, minmax(0, 1fr))', () => {
    expect(resolveGridTracks(1)).toBe('repeat(1, minmax(0, 1fr))');
    expect(resolveGridTracks(3)).toBe('repeat(3, minmax(0, 1fr))');
    expect(resolveGridTracks(12)).toBe('repeat(12, minmax(0, 1fr))');
  });

  it('collapses cols=0 to undefined (treat as no-op, avoid empty templates)', () => {
    expect(resolveGridTracks(0)).toBeUndefined();
  });

  it('collapses negative numeric cols to undefined', () => {
    expect(resolveGridTracks(-3)).toBeUndefined();
  });

  it('collapses non-finite numeric cols to undefined', () => {
    expect(resolveGridTracks(Number.NaN)).toBeUndefined();
    expect(resolveGridTracks(Number.POSITIVE_INFINITY)).toBeUndefined();
  });

  it('returns string values verbatim', () => {
    expect(resolveGridTracks('120px 1fr 120px')).toBe('120px 1fr 120px');
    expect(resolveGridTracks('repeat(3, 200px)')).toBe('repeat(3, 200px)');
    expect(resolveGridTracks('subgrid')).toBe('subgrid');
  });

  it('collapses empty string to undefined (treat as no-op)', () => {
    expect(resolveGridTracks('')).toBeUndefined();
  });

  it('uses minmax(0, 1fr) NOT bare 1fr to prevent content overflow blowout', () => {
    expect(resolveGridTracks(4)).toContain('minmax(0, 1fr)');
    expect(resolveGridTracks(4)).not.toBe('repeat(4, 1fr)');
  });
});

import { describe, expect, it } from 'vitest';

import { defaultStripResolver } from './swimlane-strip-at-y.js';

import type { SwimlaneStrip } from '../layout/types.js';

/**
 * Three strips of varying height with a 1-px gap between each — the
 * default `rowSpacing: 1` configuration. Y ranges:
 *   r1: [  0,  38)
 *   gap: 38  (one pixel, owned by no strip)
 *   r2: [ 39,  77)
 *   gap: 77
 *   r3: [ 78, 120)
 */
const STRIPS_WITH_GAP: readonly SwimlaneStrip[] = [
  { rowId: 'r1', y: 0, height: 38 },
  { rowId: 'r2', y: 39, height: 38 },
  { rowId: 'r3', y: 78, height: 42 },
];

describe('defaultStripResolver.atY', () => {
  it('returns the first strip when y is inside it', () => {
    expect(defaultStripResolver.atY(10, STRIPS_WITH_GAP)).toBe('r1');
    expect(defaultStripResolver.atY(37.9, STRIPS_WITH_GAP)).toBe('r1');
  });

  it('returns the last strip when y is inside it', () => {
    expect(defaultStripResolver.atY(78, STRIPS_WITH_GAP)).toBe('r3');
    expect(defaultStripResolver.atY(119.9, STRIPS_WITH_GAP)).toBe('r3');
  });

  it('returns the strip starting at y when y exactly equals strip.y (lower-inclusive)', () => {
    // Half-open convention: a y of exactly strip.y belongs to that strip,
    // not the one ending at strip.y. Matches the chronix layout passes'
    // half-open tick range / viewport range conventions.
    expect(defaultStripResolver.atY(0, STRIPS_WITH_GAP)).toBe('r1');
    expect(defaultStripResolver.atY(39, STRIPS_WITH_GAP)).toBe('r2');
    expect(defaultStripResolver.atY(78, STRIPS_WITH_GAP)).toBe('r3');
  });

  it('returns null when y lands in an inter-strip gap (rowSpacing > 0)', () => {
    // 38 == r1.y + r1.height; r1 is open-upper so 38 doesn't belong to it.
    // 38 < r2.y (39) so r2 doesn't claim it either. Drop-on-divider → null.
    expect(defaultStripResolver.atY(38, STRIPS_WITH_GAP)).toBeNull();
    expect(defaultStripResolver.atY(77, STRIPS_WITH_GAP)).toBeNull();
  });

  it('returns null when y is above the first strip or below the last', () => {
    expect(defaultStripResolver.atY(-5, STRIPS_WITH_GAP)).toBeNull();
    expect(defaultStripResolver.atY(120, STRIPS_WITH_GAP)).toBeNull(); // r3.y + r3.height
    expect(defaultStripResolver.atY(500, STRIPS_WITH_GAP)).toBeNull();
  });

  it('returns null for any y when the strips array is empty', () => {
    expect(defaultStripResolver.atY(0, [])).toBeNull();
    expect(defaultStripResolver.atY(100, [])).toBeNull();
    expect(defaultStripResolver.atY(-1, [])).toBeNull();
  });

  it('works with rowSpacing=0 (strips tile-packed without gaps)', () => {
    // The boundary y = strip.y + strip.height now BELONGS to the next strip
    // (because there's no gap), thanks to the half-open lower-inclusive
    // upper-exclusive convention.
    const tilePackedStrips: readonly SwimlaneStrip[] = [
      { rowId: 'a', y: 0, height: 30 },
      { rowId: 'b', y: 30, height: 30 },
      { rowId: 'c', y: 60, height: 30 },
    ];
    expect(defaultStripResolver.atY(0, tilePackedStrips)).toBe('a');
    expect(defaultStripResolver.atY(29.99, tilePackedStrips)).toBe('a');
    expect(defaultStripResolver.atY(30, tilePackedStrips)).toBe('b');
    expect(defaultStripResolver.atY(60, tilePackedStrips)).toBe('c');
    expect(defaultStripResolver.atY(89.99, tilePackedStrips)).toBe('c');
    expect(defaultStripResolver.atY(90, tilePackedStrips)).toBeNull();
  });
});

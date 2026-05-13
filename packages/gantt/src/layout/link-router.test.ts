import { describe, expect, it } from 'vitest';

import { defaultLinkRouter } from './link-router.js';

import type { PlacedBar } from './types.js';
import type { LinkSpec } from '../ir/index.js';

const bar = (id: string, x: number, y: number, w: number, h: number): PlacedBar => ({
  barId: id,
  x,
  y,
  width: w,
  height: h,
});

const link = (
  id: string,
  fromBarId: string,
  toBarId: string,
  routing: 'square' | 'smooth' = 'square',
  colorOverride?: string,
): LinkSpec => ({
  id,
  fromBarId,
  toBarId,
  routing,
  marker: 'arrow',
  ...(colorOverride !== undefined ? { colorOverride } : {}),
});

describe('defaultLinkRouter — square routing', () => {
  it('builds a 3-segment elbow from predecessor right-edge to successor left-edge', () => {
    // bar1: x=10, y=0, w=90, h=20  → right edge=100, center y=10
    // bar2: x=200, y=50, w=80, h=20 → left edge=200, center y=60
    // nub=12 → midX=112
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2')],
      placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 200, 50, 80, 20)],
    });

    expect(out.routedLinks[0]?.pathD).toBe('M 100 10 L 112 10 L 112 60 L 200 60');
  });

  it('marker sits at the successor left edge with 0° rotation', () => {
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2')],
      placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 200, 50, 80, 20)],
    });

    expect(out.routedLinks[0]?.marker).toEqual({ x: 200, y: 60, angleDeg: 0 });
  });

  it('respects custom elbowNubPx', () => {
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2')],
      placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 200, 50, 80, 20)],
      elbowNubPx: 30,
    });

    expect(out.routedLinks[0]?.pathD).toBe('M 100 10 L 130 10 L 130 60 L 200 60');
  });

  it('propagates colorOverride when set on the LinkSpec', () => {
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2', 'square', '#ff0000')],
      placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 200, 50, 80, 20)],
    });

    expect(out.routedLinks[0]?.color).toBe('#ff0000');
  });

  it('omits color when LinkSpec has no colorOverride (exactOptionalPropertyTypes)', () => {
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2')],
      placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 200, 50, 80, 20)],
    });

    expect(out.routedLinks[0]).not.toHaveProperty('color');
  });
});

describe('defaultLinkRouter — edge cases', () => {
  it('records orphan when fromBarId is not in placedBars', () => {
    const out = defaultLinkRouter.route({
      links: [link('l1', 'missing', 'b2')],
      placedBars: [bar('b2', 200, 50, 80, 20)],
    });

    expect(out.routedLinks).toHaveLength(0);
    expect(out.orphanLinkIds).toEqual(['l1']);
  });

  it('records orphan when toBarId is not in placedBars', () => {
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'missing')],
      placedBars: [bar('b1', 10, 0, 90, 20)],
    });

    expect(out.orphanLinkIds).toEqual(['l1']);
  });

  it('emits both routed and orphan in the same call', () => {
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2'), link('l2', 'b1', 'missing'), link('l3', 'b2', 'b1')],
      placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 200, 50, 80, 20)],
    });

    expect(out.routedLinks.map((r) => r.linkId)).toEqual(['l1', 'l3']);
    expect(out.orphanLinkIds).toEqual(['l2']);
  });

  it('handles bar on the same row (from.y === to.y) — vertical segment collapses', () => {
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2')],
      placedBars: [bar('b1', 10, 0, 50, 20), bar('b2', 100, 0, 80, 20)],
      // from = (60, 10); to = (100, 10); same y
    });
    expect(out.routedLinks[0]?.pathD).toBe('M 60 10 L 72 10 L 72 10 L 100 10');
  });

  it('handles successor to the left of predecessor (path goes backward)', () => {
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2')],
      placedBars: [bar('b1', 200, 0, 50, 20), bar('b2', 10, 50, 80, 20)],
      // from = (250, 10); midX = 262; to = (10, 60)
    });
    // v0 still draws the elbow from fromX + nub. midX (262) ends up RIGHT
    // of toX (10), producing a path that loops backwards. Acceptable for
    // v0 — Phase 2 v2 can add reverse-routing for "predecessor right of
    // successor" but the demo's typical case has chronological ordering.
    expect(out.routedLinks[0]?.pathD).toBe('M 250 10 L 262 10 L 262 60 L 10 60');
  });

  it('returns empty output when input has no links', () => {
    const out = defaultLinkRouter.route({
      links: [],
      placedBars: [bar('b1', 10, 0, 90, 20)],
    });

    expect(out.routedLinks).toEqual([]);
    expect(out.orphanLinkIds).toEqual([]);
  });
});

describe('defaultLinkRouter — unimplemented routing', () => {
  it('throws on smooth routing', () => {
    expect(() =>
      defaultLinkRouter.route({
        links: [link('l1', 'b1', 'b2', 'smooth')],
        placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 200, 50, 80, 20)],
      }),
    ).toThrow(/'smooth' not yet implemented/);
  });
});

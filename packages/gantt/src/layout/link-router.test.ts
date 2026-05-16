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
  isStart: true,
  isEnd: true,
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

describe('defaultLinkRouter — smooth routing', () => {
  it('same-row forward link: emits a straight `M` + `L` line (no `C`)', () => {
    // b1 right-edge mid = (100, 10). b2 left-edge mid = (200, 10) —
    // same y. Reference's setSmoothPoints collapses this to a direct
    // horizontal line; no curve needed.
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2', 'smooth')],
      placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 200, 0, 80, 20)],
    });

    expect(out.routedLinks).toHaveLength(1);
    const path = out.routedLinks[0]!.pathD;
    expect(path).toBe('M 100 10 L 200 10');
    expect(path).not.toContain('C ');
  });

  it('cross-row forward link: emits a cubic Bézier `C` + horizontal `L` ending at the target', () => {
    // b1 right-edge mid = (100, 10). b2 left-edge mid = (200, 60).
    // midX = (100 + 200) / 2 = 150.
    // beforeTargetX = 200 - 20 = 180 (default gap).
    // Expected:
    //   M 100 10 C 150 10 170 60 180 60 L 200 60
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2', 'smooth')],
      placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 200, 50, 80, 20)],
    });

    expect(out.routedLinks).toHaveLength(1);
    expect(out.routedLinks[0]!.pathD).toBe('M 100 10 C 150 10 170 60 180 60 L 200 60');
  });

  it('cross-row smooth link: `smoothBeforeTargetGapPx` override shifts the pre-target landing point', () => {
    // Same geometry as above, but with gap = 40 instead of default 20.
    // beforeTargetX = 200 - 40 = 160.
    // Second control point = beforeTargetX - 10 = 150.
    // Expected:
    //   M 100 10 C 150 10 150 60 160 60 L 200 60
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2', 'smooth')],
      placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 200, 50, 80, 20)],
      smoothBeforeTargetGapPx: 40,
    });

    expect(out.routedLinks[0]!.pathD).toBe('M 100 10 C 150 10 150 60 160 60 L 200 60');
  });

  it('smooth link marker still points right (0°) — both routings end with a horizontal `L` segment', () => {
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2', 'smooth')],
      placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 200, 50, 80, 20)],
    });
    const marker = out.routedLinks[0]!.marker;
    expect(marker.x).toBe(200);
    expect(marker.y).toBe(60);
    expect(marker.angleDeg).toBe(0);
  });

  it('smooth degenerate (source and target identically positioned): emits a self-loop `M` + `L`', () => {
    // Edge case: two bars share the exact same anchor (same row, same x).
    // Same-row branch triggers, emits `M from L to` with from === to.
    // Doesn't throw; doesn't infinite-loop.
    const out = defaultLinkRouter.route({
      links: [link('l1', 'b1', 'b2', 'smooth')],
      placedBars: [bar('b1', 10, 0, 90, 20), bar('b2', 100, 0, 80, 20)],
    });
    expect(out.routedLinks[0]!.pathD).toBe('M 100 10 L 100 10');
  });

  it('backward smooth link (target left of source) throws with "backward" in the error so the parked branch is identifiable', () => {
    // b1 at x=200..280. b2 at x=10..100. Predecessor sits AFTER successor
    // chronologically — backward link. Reference handles this via a
    // compound C+S detour the chronix demo doesn't exercise; chronix
    // throws so consumers get a clear pointer at the parked branch.
    expect(() =>
      defaultLinkRouter.route({
        links: [link('l1', 'b1', 'b2', 'smooth')],
        placedBars: [bar('b1', 200, 0, 80, 20), bar('b2', 10, 50, 90, 20)],
      }),
    ).toThrow(/'smooth' routing for backward links not yet implemented/);
  });
});

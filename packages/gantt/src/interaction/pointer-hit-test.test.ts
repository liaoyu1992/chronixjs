import { describe, expect, it } from 'vitest';

import { defaultPointerHitTester } from './pointer-hit-test.js';

import type { PlacedBar, SwimlaneStrip } from '../layout/types.js';

const strips: SwimlaneStrip[] = [
  { rowId: 'r1', y: 0, height: 40 },
  { rowId: 'r2', y: 40, height: 40 },
  { rowId: 'r3', y: 80, height: 40 },
];

const bars: PlacedBar[] = [
  // r1: bar spanning [100, 300] x [8, 38] — wide enough for a body zone
  { barId: 'b1', x: 100, y: 8, width: 200, height: 30, isStart: true, isEnd: true },
  // r2: bar spanning [200, 210] x [48, 78] — only 10px wide, edges overlap
  { barId: 'b2-narrow', x: 200, y: 48, width: 10, height: 30, isStart: true, isEnd: true },
  // r3: bar spanning [50, 250] x [88, 118]
  { barId: 'b3', x: 50, y: 88, width: 200, height: 30, isStart: true, isEnd: true },
];

describe('defaultPointerHitTester — bar body / edge zones', () => {
  it('hits bar-body for a position well inside the bar interior', () => {
    const result = defaultPointerHitTester.test({
      contentX: 200,
      contentY: 20,
      placedBars: bars,
      strips,
    });
    expect(result).toEqual({ kind: 'bar-body', barId: 'b1' });
  });

  it('hits bar-edge-start within the default 8-px start zone', () => {
    const result = defaultPointerHitTester.test({
      contentX: 103, // bar.x = 100; relX = 3 < 8
      contentY: 20,
      placedBars: bars,
      strips,
    });
    expect(result).toEqual({ kind: 'bar-edge-start', barId: 'b1' });
  });

  it('hits bar-edge-end within the default 8-px end zone', () => {
    const result = defaultPointerHitTester.test({
      contentX: 295, // bar end = 300; relX = 195 > 200 − 8 = 192
      contentY: 20,
      placedBars: bars,
      strips,
    });
    expect(result).toEqual({ kind: 'bar-edge-end', barId: 'b1' });
  });

  it('x exactly at bar.x is a start-edge hit (boundary belongs to start)', () => {
    const result = defaultPointerHitTester.test({
      contentX: 100, // bar.x
      contentY: 20,
      placedBars: bars,
      strips,
    });
    expect(result).toEqual({ kind: 'bar-edge-start', barId: 'b1' });
  });

  it('x exactly at bar.x + width is an end-edge hit (boundary belongs to end)', () => {
    const result = defaultPointerHitTester.test({
      contentX: 300, // bar.x + width
      contentY: 20,
      placedBars: bars,
      strips,
    });
    expect(result).toEqual({ kind: 'bar-edge-end', barId: 'b1' });
  });

  it('honors a custom edgeZoneWidth', () => {
    // With edgeZoneWidth=2, x=103 is past the start zone → body.
    const result = defaultPointerHitTester.test({
      contentX: 103,
      contentY: 20,
      placedBars: bars,
      strips,
      edgeZoneWidth: 2,
    });
    expect(result).toEqual({ kind: 'bar-body', barId: 'b1' });
  });

  it('edgeZoneWidth=0 collapses both edge zones — only body is hittable', () => {
    const result = defaultPointerHitTester.test({
      contentX: 100, // bar.x
      contentY: 20,
      placedBars: bars,
      strips,
      edgeZoneWidth: 0,
    });
    expect(result).toEqual({ kind: 'bar-body', barId: 'b1' });
  });
});

describe('defaultPointerHitTester — narrow bars (edge zones collide)', () => {
  it('bar narrower than 2 × edgeZoneWidth has no body zone — left half is start, right half is end', () => {
    // bar 'b2-narrow' is 10px wide; default edgeZoneWidth=8 → no body.
    const leftHalf = defaultPointerHitTester.test({
      contentX: 203, // relX = 3 < 5 (= width/2)
      contentY: 60,
      placedBars: bars,
      strips,
    });
    expect(leftHalf).toEqual({ kind: 'bar-edge-start', barId: 'b2-narrow' });

    const rightHalf = defaultPointerHitTester.test({
      contentX: 207, // relX = 7 > 5
      contentY: 60,
      placedBars: bars,
      strips,
    });
    expect(rightHalf).toEqual({ kind: 'bar-edge-end', barId: 'b2-narrow' });
  });

  it('narrow bar split at exactly width/2 lands on end-edge (relX >= width/2)', () => {
    const result = defaultPointerHitTester.test({
      contentX: 205, // relX = 5 = width/2
      contentY: 60,
      placedBars: bars,
      strips,
    });
    expect(result).toEqual({ kind: 'bar-edge-end', barId: 'b2-narrow' });
  });
});

describe('defaultPointerHitTester — empty-row fallback', () => {
  it('hits empty-row when y is inside a strip but no bar covers the position', () => {
    const result = defaultPointerHitTester.test({
      contentX: 500, // right of all bars
      contentY: 20, // inside r1
      placedBars: bars,
      strips,
    });
    expect(result).toEqual({ kind: 'empty-row', rowId: 'r1' });
  });

  it("hits empty-row when y is inside a strip with no bars at all (here, neither r2's nor r3's bar covers x=10)", () => {
    const result = defaultPointerHitTester.test({
      contentX: 10,
      contentY: 60, // r2
      placedBars: bars,
      strips,
    });
    expect(result).toEqual({ kind: 'empty-row', rowId: 'r2' });
  });

  it('returns null when y lands above the first strip', () => {
    const result = defaultPointerHitTester.test({
      contentX: 100,
      contentY: -5,
      placedBars: bars,
      strips,
    });
    expect(result).toBeNull();
  });

  it('returns null when y lands below the last strip', () => {
    const result = defaultPointerHitTester.test({
      contentX: 100,
      contentY: 200, // strips end at y=120
      placedBars: bars,
      strips,
    });
    expect(result).toBeNull();
  });

  it('returns null when y lands in a row-spacing gap (strips with gaps)', () => {
    // Strips with 1-px gaps between them.
    const gappedStrips: SwimlaneStrip[] = [
      { rowId: 'r1', y: 0, height: 40 },
      { rowId: 'r2', y: 41, height: 40 }, // gap at y=40
      { rowId: 'r3', y: 82, height: 40 }, // gap at y=81
    ];
    const result = defaultPointerHitTester.test({
      contentX: 500,
      contentY: 40, // exactly in the first gap
      placedBars: [],
      strips: gappedStrips,
    });
    expect(result).toBeNull();
  });
});

describe('defaultPointerHitTester — z-order and overlap', () => {
  it('later-in-array bar wins on overlap (paint order top-most)', () => {
    const stacked: PlacedBar[] = [
      { barId: 'bottom', x: 0, y: 0, width: 100, height: 30, isStart: true, isEnd: true },
      { barId: 'top', x: 0, y: 0, width: 100, height: 30, isStart: true, isEnd: true },
    ];
    const oneStrip: SwimlaneStrip[] = [{ rowId: 'r1', y: 0, height: 30 }];
    const result = defaultPointerHitTester.test({
      contentX: 50,
      contentY: 15,
      placedBars: stacked,
      strips: oneStrip,
    });
    expect(result).toEqual({ kind: 'bar-body', barId: 'top' });
  });

  it('returns the first matching bar walking top-down even when only one bar matches', () => {
    const result = defaultPointerHitTester.test({
      contentX: 150,
      contentY: 100, // inside r3 + bar b3
      placedBars: bars,
      strips,
    });
    expect(result).toEqual({ kind: 'bar-body', barId: 'b3' });
  });
});

describe('defaultPointerHitTester — overlay-id pass-through', () => {
  it('attaches overlayId to the result when the bar declared one', () => {
    const overlayIdByBarId = new Map([['b1', 'progress-handle-group']]);
    const result = defaultPointerHitTester.test({
      contentX: 200,
      contentY: 20,
      placedBars: bars,
      strips,
      overlayIdByBarId,
    });
    expect(result).toEqual({
      kind: 'bar-body',
      barId: 'b1',
      overlayId: 'progress-handle-group',
    });
  });

  it("does not attach overlayId when the bar isn't in the map", () => {
    const overlayIdByBarId = new Map([['some-other-bar', 'group']]);
    const result = defaultPointerHitTester.test({
      contentX: 200,
      contentY: 20,
      placedBars: bars,
      strips,
      overlayIdByBarId,
    });
    expect(result).toEqual({ kind: 'bar-body', barId: 'b1' });
  });

  it('overlayId pass-through works for empty-row hits — no, empty-row hits have no barId so overlayId is N/A', () => {
    // This is more of a contract assertion than a coverage test: the
    // overlay map is keyed by bar id, and empty-row results don't carry
    // a barId, so there's no possible overlayId attachment path.
    const overlayIdByBarId = new Map([['b1', 'group']]);
    const result = defaultPointerHitTester.test({
      contentX: 500,
      contentY: 20,
      placedBars: bars,
      strips,
      overlayIdByBarId,
    });
    expect(result).toEqual({ kind: 'empty-row', rowId: 'r1' });
  });
});

describe('defaultPointerHitTester — progress-handle zone', () => {
  // bar 'b1' at x ∈ [100, 300], y ∈ [8, 38]. Handle rect centered at the
  // 50%-progress point: handleX = 100 + 0.5 × 200 = 200. Box 12×12 centered.
  const handleCentered: PlacedBar[] = [
    { barId: 'b1', x: 100, y: 8, width: 200, height: 30, isStart: true, isEnd: true },
  ];
  const oneStrip: SwimlaneStrip[] = [{ rowId: 'r1', y: 0, height: 40 }];
  const progressHandleByBarId = new Map([['b1', { x: 194, y: 17, width: 12, height: 12 }]]);

  it('hits progress-handle when pointer lands inside the rect', () => {
    const result = defaultPointerHitTester.test({
      contentX: 200,
      contentY: 23,
      placedBars: handleCentered,
      strips: oneStrip,
      progressHandleByBarId,
    });
    expect(result).toEqual({ kind: 'progress-handle', barId: 'b1' });
  });

  it('progress-handle takes precedence over bar-body within the same bar', () => {
    // Pointer (200, 23) is in BOTH the handle rect AND the bar body. Handle wins.
    const result = defaultPointerHitTester.test({
      contentX: 200,
      contentY: 23,
      placedBars: handleCentered,
      strips: oneStrip,
      progressHandleByBarId,
    });
    expect(result?.kind).toBe('progress-handle');
  });

  it('falls through to bar-body when pointer is outside the handle rect', () => {
    const result = defaultPointerHitTester.test({
      contentX: 150, // inside bar but outside handle x ∈ [194, 206]
      contentY: 23,
      placedBars: handleCentered,
      strips: oneStrip,
      progressHandleByBarId,
    });
    expect(result).toEqual({ kind: 'bar-body', barId: 'b1' });
  });

  it('progress-handle hit attaches overlayId when the bar declared one', () => {
    const overlayIdByBarId = new Map([['b1', 'progress-handle-overlay']]);
    const result = defaultPointerHitTester.test({
      contentX: 200,
      contentY: 23,
      placedBars: handleCentered,
      strips: oneStrip,
      progressHandleByBarId,
      overlayIdByBarId,
    });
    expect(result).toEqual({
      kind: 'progress-handle',
      barId: 'b1',
      overlayId: 'progress-handle-overlay',
    });
  });

  it('handle that protrudes below the bar still hits (protruding-triangle pattern)', () => {
    // Handle dipping 6 px below the bar bottom (bar ends at y=38, handle at y=32..50).
    const protruding = new Map([['b1', { x: 194, y: 32, width: 12, height: 18 }]]);
    const result = defaultPointerHitTester.test({
      contentX: 200,
      contentY: 45, // below bar bounds (y > 38) but inside handle rect
      placedBars: handleCentered,
      strips: oneStrip,
      progressHandleByBarId: protruding,
    });
    expect(result).toEqual({ kind: 'progress-handle', barId: 'b1' });
  });

  it('handle for a bar that no longer exists in placedBars is ignored', () => {
    // The map references 'ghost' but placedBars only contains 'b1'.
    const ghostMap = new Map([['ghost', { x: 0, y: 0, width: 1000, height: 1000 }]]);
    const result = defaultPointerHitTester.test({
      contentX: 500,
      contentY: 500,
      placedBars: handleCentered,
      strips: oneStrip,
      progressHandleByBarId: ghostMap,
    });
    // (500, 500) is outside b1 AND outside any strip → null.
    expect(result).toBeNull();
  });

  it('omitted progressHandleByBarId means handle path is fully disabled', () => {
    const result = defaultPointerHitTester.test({
      contentX: 200,
      contentY: 23,
      placedBars: handleCentered,
      strips: oneStrip,
    });
    // No handle map → ordinary bar-body resolution.
    expect(result).toEqual({ kind: 'bar-body', barId: 'b1' });
  });
});

describe('defaultPointerHitTester — degenerate inputs', () => {
  it('empty placedBars + empty strips → null', () => {
    expect(
      defaultPointerHitTester.test({
        contentX: 0,
        contentY: 0,
        placedBars: [],
        strips: [],
      }),
    ).toBeNull();
  });

  it('empty placedBars but y in some strip → empty-row hit', () => {
    expect(
      defaultPointerHitTester.test({
        contentX: 0,
        contentY: 20,
        placedBars: [],
        strips,
      }),
    ).toEqual({ kind: 'empty-row', rowId: 'r1' });
  });

  it('zero-width bar is never a body hit; both edges collapse to a single point', () => {
    // bar.width = 0 → width < 2 × edgeZoneWidth, so split at center (= 0).
    // relX = 0 is NOT < width/2 (= 0), so end wins.
    const zeroBars: PlacedBar[] = [
      { barId: 'z', x: 100, y: 0, width: 0, height: 30, isStart: true, isEnd: true },
    ];
    const oneStrip: SwimlaneStrip[] = [{ rowId: 'r1', y: 0, height: 30 }];
    const exact = defaultPointerHitTester.test({
      contentX: 100,
      contentY: 15,
      placedBars: zeroBars,
      strips: oneStrip,
    });
    expect(exact).toEqual({ kind: 'bar-edge-end', barId: 'z' });

    // x outside the zero-width bar → no bar hit, fall through to strip.
    const offByOne = defaultPointerHitTester.test({
      contentX: 99,
      contentY: 15,
      placedBars: zeroBars,
      strips: oneStrip,
    });
    expect(offByOne).toEqual({ kind: 'empty-row', rowId: 'r1' });
  });
});

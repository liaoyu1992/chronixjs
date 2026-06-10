import { describe, expect, it } from 'vitest';

import { deriveEdgePaddedX } from './derive-edge-padded-x.js';

// Constants mirror chronix-gantt.ts's file-level constants. They're
// re-declared here so the helper stays decoupled from the adapter's
// internals + tests can pin exact pixel values.
const TRIANGLE_MARGIN = 1;
const TRIANGLE_SIZE = 6;
const TITLE_TRIANGLE_GAP = 4;
const DOT_TRIANGLE_GAP = 2;
const TITLE_LEFT_PADDING = 8;
const TITLE_RIGHT_PADDING = 4;
const DOT_EDGE_INSET = 1;

describe('deriveEdgePaddedX — Phase 28.2.1', () => {
  it('default left: no clipping returns renderEdge + defaultInset', () => {
    // Bar at renderX=100, no clipping → title-left at 100 + 8 = 108.
    const x = deriveEdgePaddedX(
      'start',
      100, // renderEdge
      999, // viewportLockedApex (unused when no clip)
      false, // isAxisClipped
      false, // isViewportClipped
      TITLE_LEFT_PADDING,
      TRIANGLE_MARGIN,
      TRIANGLE_SIZE,
      TITLE_TRIANGLE_GAP,
    );
    expect(x).toBe(108);
  });

  it('default right: no clipping returns renderEdge - defaultInset', () => {
    // Bar's right edge at renderX + renderWidth = 500, no clipping →
    // title-right at 500 - 4 = 496.
    const x = deriveEdgePaddedX(
      'end',
      500,
      999,
      false,
      false,
      TITLE_RIGHT_PADDING,
      TRIANGLE_MARGIN,
      TRIANGLE_SIZE,
      TITLE_TRIANGLE_GAP,
    );
    expect(x).toBe(496);
  });

  it('axis-only-clipped left: returns renderEdge + triangleMargin + triangleSize + consumerGap', () => {
    // Bar at renderX=100, axis-clipped left → title-left at
    // 100 + 1 + 6 + 4 = 111 (cleared past the bar-edge-locked Phase 27 triangle).
    const x = deriveEdgePaddedX(
      'start',
      100,
      999,
      true, // axis-clipped
      false, // not viewport-clipped
      TITLE_LEFT_PADDING,
      TRIANGLE_MARGIN,
      TRIANGLE_SIZE,
      TITLE_TRIANGLE_GAP,
    );
    expect(x).toBe(111);
  });

  it('axis-only-clipped right: returns renderEdge - triangleMargin - triangleSize - consumerGap', () => {
    // Right edge at 500, axis-clipped right → title-right at
    // 500 - 1 - 6 - 4 = 489.
    const x = deriveEdgePaddedX(
      'end',
      500,
      999,
      true,
      false,
      TITLE_RIGHT_PADDING,
      TRIANGLE_MARGIN,
      TRIANGLE_SIZE,
      TITLE_TRIANGLE_GAP,
    );
    expect(x).toBe(489);
  });

  it('viewport-clipped left: returns viewportLockedApex + triangleSize + consumerGap', () => {
    // scrollLeft=300, clientWidth=600 → viewportLockedLeftApexX = 301.
    // Title-left at 301 + 6 + 4 = 311 (past the viewport-locked triangle's base).
    const x = deriveEdgePaddedX(
      'start',
      100, // renderEdge (unused when viewport-clipped wins precedence)
      301, // viewportLockedApex = scrollLeft + TRIANGLE_MARGIN
      false, // axis-inside (this case only)
      true, // viewport-clipped
      TITLE_LEFT_PADDING,
      TRIANGLE_MARGIN,
      TRIANGLE_SIZE,
      TITLE_TRIANGLE_GAP,
    );
    expect(x).toBe(311);
  });

  it('viewport-clipped right: returns viewportLockedApex - triangleSize - consumerGap', () => {
    // scrollLeft=300, clientWidth=600 → viewportRight=900,
    // viewportLockedRightApexX = 899. Title-right at 899 - 6 - 4 = 889.
    const x = deriveEdgePaddedX(
      'end',
      500,
      899,
      false,
      true,
      TITLE_RIGHT_PADDING,
      TRIANGLE_MARGIN,
      TRIANGLE_SIZE,
      TITLE_TRIANGLE_GAP,
    );
    expect(x).toBe(889);
  });

  it('both-clipped same side: viewport-locked apex wins (precedence)', () => {
    // Bar is both axis-clipped AND viewport-clipped on left side.
    // The viewport branch should win; result = 301 + 6 + 4 = 311
    // (NOT renderEdge + 11 = 100 + 11 = 111).
    const x = deriveEdgePaddedX(
      'start',
      100, // renderEdge
      301, // viewportLockedApex
      true, // axis-clipped (would compute 111 if it won)
      true, // viewport-clipped (precedence — should win)
      TITLE_LEFT_PADDING,
      TRIANGLE_MARGIN,
      TRIANGLE_SIZE,
      TITLE_TRIANGLE_GAP,
    );
    expect(x).toBe(311);
  });

  it('title vs dot: same helper produces different output for different consumer constants', () => {
    // Axis-clipped left bar at renderX=100.
    // Title-left = 100 + 1 + 6 + 4 = 111 (TITLE_TRIANGLE_GAP=4).
    // Dot-left   = 100 + 1 + 6 + 2 = 109 (DOT_TRIANGLE_GAP=2 — dot
    //   sits 2 px tighter to the triangle than the title since the
    //   dot is a 1-px-inset shape not 8-px-inset text).
    const titleX = deriveEdgePaddedX(
      'start',
      100,
      999,
      true,
      false,
      TITLE_LEFT_PADDING,
      TRIANGLE_MARGIN,
      TRIANGLE_SIZE,
      TITLE_TRIANGLE_GAP,
    );
    const dotX = deriveEdgePaddedX(
      'start',
      100,
      999,
      true,
      false,
      DOT_EDGE_INSET,
      TRIANGLE_MARGIN,
      TRIANGLE_SIZE,
      DOT_TRIANGLE_GAP,
    );
    expect(titleX).toBe(111);
    expect(dotX).toBe(109);
    expect(titleX).not.toBe(dotX);
  });
});

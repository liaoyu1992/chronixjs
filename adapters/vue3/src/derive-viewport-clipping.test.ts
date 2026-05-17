import { describe, expect, it } from 'vitest';

import { deriveViewportClipping } from './derive-viewport-clipping.js';

const TRIANGLE_MARGIN = 1;

describe('deriveViewportClipping — Phase 27.1', () => {
  it('returns both flags false when the bar is fully inside the viewport', () => {
    // viewport: [50, 450) content-coords (scrollLeft=50, clientWidth=400)
    // bar: [100, 300) content-coords (renderX=100, renderWidth=200)
    const result = deriveViewportClipping(100, 200, 50, 400, TRIANGLE_MARGIN);
    expect(result.isViewportClippedStart).toBe(false);
    expect(result.isViewportClippedEnd).toBe(false);
  });

  it('returns isViewportClippedStart=true when the bar starts before the viewport', () => {
    // viewport: [50, 450); bar: [20, 120) — left edge 20 < 50
    const result = deriveViewportClipping(20, 100, 50, 400, TRIANGLE_MARGIN);
    expect(result.isViewportClippedStart).toBe(true);
    expect(result.isViewportClippedEnd).toBe(false);
  });

  it('returns isViewportClippedEnd=true when the bar ends past the viewport', () => {
    // viewport: [50, 450); bar: [200, 500) — right edge 500 > 450
    const result = deriveViewportClipping(200, 300, 50, 400, TRIANGLE_MARGIN);
    expect(result.isViewportClippedStart).toBe(false);
    expect(result.isViewportClippedEnd).toBe(true);
  });

  it('returns both flags true when the bar spans the entire viewport', () => {
    // viewport: [50, 450); bar: [10, 510) — spans full viewport
    const result = deriveViewportClipping(10, 500, 50, 400, TRIANGLE_MARGIN);
    expect(result.isViewportClippedStart).toBe(true);
    expect(result.isViewportClippedEnd).toBe(true);
  });

  it('short-circuits both flags to false when clientWidth === 0 (pre-mount frame)', () => {
    // Pre-mount: clientWidth=0; without the guard, viewportRight=scrollLeft
    // and most bars would erroneously flag as viewport-clipped-right.
    const result = deriveViewportClipping(200, 300, 50, 0, TRIANGLE_MARGIN);
    expect(result.isViewportClippedStart).toBe(false);
    expect(result.isViewportClippedEnd).toBe(false);
  });

  it('viewport-locked left apex x equals scrollLeft + triangleMargin', () => {
    const result = deriveViewportClipping(20, 100, 50, 400, TRIANGLE_MARGIN);
    expect(result.viewportLockedLeftApexX).toBe(51);
  });

  it('viewport-locked right apex x equals scrollLeft + clientWidth - triangleMargin', () => {
    const result = deriveViewportClipping(200, 300, 50, 400, TRIANGLE_MARGIN);
    expect(result.viewportLockedRightApexX).toBe(449);
  });

  it('exact-boundary case: renderX === scrollLeft is NOT clipped (strict <)', () => {
    // viewport: [50, 450); bar: [50, 150) — left edge sits ON the first
    // visible pixel; the strict `<` boundary keeps it un-clipped.
    const leftBoundary = deriveViewportClipping(50, 100, 50, 400, TRIANGLE_MARGIN);
    expect(leftBoundary.isViewportClippedStart).toBe(false);

    // Symmetric right: bar's right edge sits exactly at viewportRight.
    // renderX + renderWidth = 50 + 400 = 450 = viewportRight → NOT clipped.
    const rightBoundary = deriveViewportClipping(50, 400, 50, 400, TRIANGLE_MARGIN);
    expect(rightBoundary.isViewportClippedEnd).toBe(false);
  });
});

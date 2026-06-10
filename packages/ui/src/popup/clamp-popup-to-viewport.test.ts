import { describe, expect, it } from 'vitest';

import { clampPopupToViewport } from './clamp-popup-to-viewport.js';

import type { DOMRectLike } from './popup-spec.js';

// Viewport: 1024×768 starting at (0, 0).
const VIEWPORT: DOMRectLike = {
  left: 0,
  top: 0,
  width: 1024,
  height: 768,
  right: 1024,
  bottom: 768,
};

const PADDING = 8;

describe('clampPopupToViewport', () => {
  it('in-bounds popup passes through unchanged', () => {
    const result = clampPopupToViewport(100, 100, 200, 150, VIEWPORT, PADDING);
    expect(result.leftPx).toBe(100);
    expect(result.topPx).toBe(100);
  });

  it('overflow-left: clamps to viewport.left + padding', () => {
    const result = clampPopupToViewport(-50, 100, 200, 150, VIEWPORT, PADDING);
    expect(result.leftPx).toBe(8);
    expect(result.topPx).toBe(100);
  });

  it('overflow-right: clamps to viewport.right - popup.width - padding', () => {
    const result = clampPopupToViewport(900, 100, 200, 150, VIEWPORT, PADDING);
    // viewport.right=1024, popup.width=200, padding=8 → maxLeft = 816
    expect(result.leftPx).toBe(816);
  });

  it('overflow-top: clamps to viewport.top + padding', () => {
    const result = clampPopupToViewport(100, -30, 200, 150, VIEWPORT, PADDING);
    expect(result.topPx).toBe(8);
  });

  it('overflow-bottom: clamps to viewport.bottom - popup.height - padding', () => {
    const result = clampPopupToViewport(100, 700, 200, 150, VIEWPORT, PADDING);
    // viewport.bottom=768, popup.height=150, padding=8 → maxTop = 610
    expect(result.topPx).toBe(610);
  });

  it('popup wider than padded viewport: pins to left edge', () => {
    // Popup width 2000 > viewport width 1024 - 16 padding. Pin to minLeft (8).
    const result = clampPopupToViewport(500, 100, 2000, 50, VIEWPORT, PADDING);
    expect(result.leftPx).toBe(8);
  });

  it('popup taller than padded viewport: pins to top edge', () => {
    const result = clampPopupToViewport(100, 200, 100, 1500, VIEWPORT, PADDING);
    expect(result.topPx).toBe(8);
  });

  it('zero padding clamps exactly to viewport edges', () => {
    const result = clampPopupToViewport(-50, -50, 100, 100, VIEWPORT, 0);
    expect(result.leftPx).toBe(0);
    expect(result.topPx).toBe(0);
  });

  it('large padding shrinks the available area accordingly', () => {
    const result = clampPopupToViewport(100, 100, 200, 150, VIEWPORT, 100);
    expect(result.leftPx).toBe(100); // 100 ≥ 100 (minLeft = 0 + 100)
    expect(result.topPx).toBe(100); // 100 ≥ 100 (minTop = 0 + 100)
    // But overflow case:
    const oRight = clampPopupToViewport(900, 100, 200, 150, VIEWPORT, 100);
    // maxLeft = 1024 - 200 - 100 = 724
    expect(oRight.leftPx).toBe(724);
  });

  it('non-zero viewport.left/top: clamps relative to viewport coords', () => {
    const subViewport: DOMRectLike = {
      left: 100,
      top: 50,
      width: 400,
      height: 300,
      right: 500,
      bottom: 350,
    };
    const result = clampPopupToViewport(50, 30, 100, 50, subViewport, PADDING);
    // minLeft = 100 + 8 = 108; popup at 50 → clamped to 108
    expect(result.leftPx).toBe(108);
    // minTop = 50 + 8 = 58; popup at 30 → clamped to 58
    expect(result.topPx).toBe(58);
  });

  it('popup exactly at the padded boundary stays put', () => {
    // popup at leftPx=8, viewport.left + padding = 8 → no clamping triggered.
    const result = clampPopupToViewport(8, 8, 100, 50, VIEWPORT, PADDING);
    expect(result.leftPx).toBe(8);
    expect(result.topPx).toBe(8);
  });
});

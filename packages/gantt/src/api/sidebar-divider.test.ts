import { describe, expect, it } from 'vitest';

import {
  MIN_SIDEBAR_AREA_WIDTH,
  SIDEBAR_DIVIDER_WIDTH,
  clampSidebarWidth,
} from './sidebar-divider.js';

describe('sidebar-divider constants', () => {
  it('SIDEBAR_DIVIDER_WIDTH = 4 (grab-target track width)', () => {
    expect(SIDEBAR_DIVIDER_WIDTH).toBe(4);
  });

  it('MIN_SIDEBAR_AREA_WIDTH = 40 (per-pane minimum)', () => {
    expect(MIN_SIDEBAR_AREA_WIDTH).toBe(40);
  });
});

describe('clampSidebarWidth (Phase 50 pure helper)', () => {
  it('returns the proposed width when inside [min, max]', () => {
    // wrapperWidth=800 → max=800-40=760; proposed=300 → 300.
    expect(clampSidebarWidth(300, 800)).toBe(300);
  });

  it('clamps to MIN_SIDEBAR_AREA_WIDTH when proposed is below the floor', () => {
    expect(clampSidebarWidth(10, 800)).toBe(40);
    expect(clampSidebarWidth(-50, 800)).toBe(40);
  });

  it('clamps to (wrapperWidth - MIN) when proposed exceeds the ceiling', () => {
    // wrapperWidth=500 → max=460; proposed=900 → 460.
    expect(clampSidebarWidth(900, 500)).toBe(460);
  });

  it('collapses to MIN when wrapperWidth ≤ 2 × MIN (degenerate viewport)', () => {
    // wrapperWidth=60 → max = max(40, 60-40) = 40 → clamp always returns 40.
    expect(clampSidebarWidth(50, 60)).toBe(40);
    expect(clampSidebarWidth(500, 60)).toBe(40);
    expect(clampSidebarWidth(0, 60)).toBe(40);
  });

  it('handles wrapperWidth = 0 by collapsing to MIN', () => {
    expect(clampSidebarWidth(100, 0)).toBe(40);
  });
});

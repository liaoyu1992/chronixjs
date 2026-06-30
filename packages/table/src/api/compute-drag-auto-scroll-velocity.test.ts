import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DRAG_AUTO_SCROLL_MAX_VELOCITY_PX_PER_FRAME,
  DEFAULT_DRAG_AUTO_SCROLL_TRIGGER_ZONE_PX,
  computeDragAutoScrollVelocity,
} from './compute-drag-auto-scroll-velocity.js';

describe('computeDragAutoScrollVelocity ', () => {
  // Body occupies viewport rows 100..500 (height 400). Trigger zone 30px;
  // top zone = [100, 130), bottom zone = (470, 500].
  const baseInput = {
    bodyTop: 100,
    bodyBottom: 500,
    triggerZonePx: DEFAULT_DRAG_AUTO_SCROLL_TRIGGER_ZONE_PX,
    maxVelocityPxPerFrame: DEFAULT_DRAG_AUTO_SCROLL_MAX_VELOCITY_PX_PER_FRAME,
  } as const;

  it('cursor in middle of body returns 0', () => {
    expect(computeDragAutoScrollVelocity({ ...baseInput, cursorClientY: 300 })).toBe(0);
  });

  it('cursor at exact top edge returns -maxVelocity (proximity 1.0)', () => {
    expect(computeDragAutoScrollVelocity({ ...baseInput, cursorClientY: 100 })).toBe(-12);
  });

  it('cursor at exact bottom edge returns +maxVelocity (proximity 1.0)', () => {
    expect(computeDragAutoScrollVelocity({ ...baseInput, cursorClientY: 500 })).toBe(12);
  });

  it('cursor at the inside boundary of top trigger zone returns 0', () => {
    // Cursor at bodyTop + triggerZonePx = 130 is the inclusive boundary;
    // we treat cursor < 130 as in-zone, cursor >= 130 as out-of-zone.
    expect(computeDragAutoScrollVelocity({ ...baseInput, cursorClientY: 130 })).toBe(0);
  });

  it('cursor at the inside boundary of bottom trigger zone returns 0', () => {
    // Cursor at bodyBottom - triggerZonePx = 470 is the inclusive boundary.
    expect(computeDragAutoScrollVelocity({ ...baseInput, cursorClientY: 470 })).toBe(0);
  });

  it('cursor halfway through top trigger zone returns -maxVelocity/2', () => {
    // Cursor at 115 → topThreshold(130) - 115 = 15; proximity = 15/30 = 0.5.
    expect(computeDragAutoScrollVelocity({ ...baseInput, cursorClientY: 115 })).toBe(-6);
  });

  it('cursor halfway through bottom trigger zone returns +maxVelocity/2', () => {
    // Cursor at 485 → 485 - bottomThreshold(470) = 15; proximity = 0.5.
    expect(computeDragAutoScrollVelocity({ ...baseInput, cursorClientY: 485 })).toBe(6);
  });

  it('triggerZonePx === 0 disables auto-scroll (always returns 0)', () => {
    expect(
      computeDragAutoScrollVelocity({ ...baseInput, cursorClientY: 100, triggerZonePx: 0 }),
    ).toBe(0);
    expect(
      computeDragAutoScrollVelocity({ ...baseInput, cursorClientY: 500, triggerZonePx: 0 }),
    ).toBe(0);
  });

  it('maxVelocityPxPerFrame === 0 disables auto-scroll', () => {
    expect(
      computeDragAutoScrollVelocity({
        ...baseInput,
        cursorClientY: 100,
        maxVelocityPxPerFrame: 0,
      }),
    ).toBe(0);
  });

  it('cursor BELOW bodyTop (above viewport — clientY negative) clamps to -maxVelocity', () => {
    expect(computeDragAutoScrollVelocity({ ...baseInput, cursorClientY: -50 })).toBe(-12);
  });

  it('cursor far BELOW bodyBottom (off-bottom) clamps to +maxVelocity', () => {
    expect(computeDragAutoScrollVelocity({ ...baseInput, cursorClientY: 800 })).toBe(12);
  });

  it('degenerate body rect (bodyBottom <= bodyTop) returns 0', () => {
    expect(
      computeDragAutoScrollVelocity({
        ...baseInput,
        cursorClientY: 100,
        bodyTop: 200,
        bodyBottom: 200,
      }),
    ).toBe(0);
    expect(
      computeDragAutoScrollVelocity({
        ...baseInput,
        cursorClientY: 100,
        bodyTop: 200,
        bodyBottom: 150,
      }),
    ).toBe(0);
  });
});

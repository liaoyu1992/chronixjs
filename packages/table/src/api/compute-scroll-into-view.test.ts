import { describe, expect, it } from 'vitest';

import { computeScrollIntoView } from './compute-scroll-into-view.js';

describe('computeScrollIntoView', () => {
  it('returns current scroll values when target is already fully visible', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 100, scrollLeft: 50, clientHeight: 400, clientWidth: 600 },
        target: { top: 150, left: 100, height: 28, width: 120 },
      }),
    ).toEqual({ scrollTop: 100, scrollLeft: 50 });
  });

  it('scrolls up when target is above the viewport', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 200, scrollLeft: 0, clientHeight: 400, clientWidth: 600 },
        target: { top: 100, left: 0, height: 28, width: 120 },
      }),
    ).toEqual({ scrollTop: 100, scrollLeft: 0 });
  });

  it('scrolls down to align bottom when target is below the viewport', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 0, scrollLeft: 0, clientHeight: 400, clientWidth: 600 },
        target: { top: 500, left: 0, height: 28, width: 120 },
      }),
    ).toEqual({ scrollTop: 128, scrollLeft: 0 });
  });

  it('scrolls left when target is left of the viewport', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 0, scrollLeft: 300, clientHeight: 400, clientWidth: 600 },
        target: { top: 0, left: 200, height: 28, width: 80 },
      }),
    ).toEqual({ scrollTop: 0, scrollLeft: 200 });
  });

  it('scrolls right to align right edge when target is right of the viewport', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 0, scrollLeft: 0, clientHeight: 400, clientWidth: 600 },
        target: { top: 0, left: 700, height: 28, width: 80 },
      }),
    ).toEqual({ scrollTop: 0, scrollLeft: 180 });
  });

  it('adjusts both axes when target is above-and-left of the viewport', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 200, scrollLeft: 300, clientHeight: 400, clientWidth: 600 },
        target: { top: 50, left: 100, height: 28, width: 80 },
      }),
    ).toEqual({ scrollTop: 50, scrollLeft: 100 });
  });

  it('top-aligns when target overlaps the top edge AND extends past the bottom edge', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 200, scrollLeft: 0, clientHeight: 100, clientWidth: 600 },
        target: { top: 150, left: 0, height: 300, width: 80 },
      }),
    ).toEqual({ scrollTop: 150, scrollLeft: 0 });
  });

  it('left-aligns when target overlaps the left edge AND extends past the right edge', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 0, scrollLeft: 200, clientHeight: 400, clientWidth: 100 },
        target: { top: 0, left: 150, height: 28, width: 300 },
      }),
    ).toEqual({ scrollTop: 0, scrollLeft: 150 });
  });

  it('uses margins.left to shift the visible region for a left-pinned overlay', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 0, scrollLeft: 100, clientHeight: 400, clientWidth: 600 },
        target: { top: 0, left: 120, height: 28, width: 80 },
        margins: { left: 80 },
      }),
    ).toEqual({ scrollTop: 0, scrollLeft: 40 });
  });

  it('uses margins.right to shift the visible region for a right-pinned overlay', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 0, scrollLeft: 0, clientHeight: 400, clientWidth: 600 },
        target: { top: 0, left: 540, height: 28, width: 80 },
        margins: { right: 60 },
      }),
    ).toEqual({ scrollTop: 0, scrollLeft: 80 });
  });

  it('uses margins.top to shift the visible region for a top overlay', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 100, scrollLeft: 0, clientHeight: 400, clientWidth: 600 },
        target: { top: 120, left: 0, height: 28, width: 80 },
        margins: { top: 40 },
      }),
    ).toEqual({ scrollTop: 80, scrollLeft: 0 });
  });

  it('uses margins.bottom to shift the visible region for a bottom overlay', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 0, scrollLeft: 0, clientHeight: 400, clientWidth: 600 },
        target: { top: 380, left: 0, height: 28, width: 80 },
        margins: { bottom: 30 },
      }),
    ).toEqual({ scrollTop: 38, scrollLeft: 0 });
  });

  it('omitting margins behaves identically to zero margins', () => {
    const viewport = { scrollTop: 0, scrollLeft: 0, clientHeight: 400, clientWidth: 600 };
    const target = { top: 500, left: 700, height: 28, width: 80 };
    expect(computeScrollIntoView({ viewport, target })).toEqual(
      computeScrollIntoView({
        viewport,
        target,
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
      }),
    );
  });

  it('returns current scrollTop unchanged when clientHeight <= 0 (pre-mount)', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 50, scrollLeft: 0, clientHeight: 0, clientWidth: 600 },
        target: { top: 500, left: 0, height: 28, width: 80 },
      }),
    ).toEqual({ scrollTop: 50, scrollLeft: 0 });
  });

  it('returns current scrollLeft unchanged when clientWidth <= 0 (pre-mount)', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 0, scrollLeft: 75, clientHeight: 400, clientWidth: 0 },
        target: { top: 0, left: 700, height: 28, width: 80 },
      }),
    ).toEqual({ scrollTop: 0, scrollLeft: 75 });
  });

  it('clamps negative computed scroll to 0 (target.top < margins.top)', () => {
    expect(
      computeScrollIntoView({
        viewport: { scrollTop: 0, scrollLeft: 0, clientHeight: 400, clientWidth: 600 },
        target: { top: 5, left: 0, height: 28, width: 80 },
        margins: { top: 10 },
      }),
    ).toEqual({ scrollTop: 0, scrollLeft: 0 });
  });
});

import { describe, expect, it } from 'vitest';

import { computePopupBaseCoords } from './compute-popup-base-coords.js';

import type { DOMRectLike, PopupPlacement } from './popup-spec.js';

// Anchor: 100×40 rect at (200, 300).
const ANCHOR: DOMRectLike = {
  left: 200,
  top: 300,
  width: 100,
  height: 40,
  right: 300,
  bottom: 340,
};

// Popup: 80×60 rect (left/top irrelevant for the placer).
const POPUP: DOMRectLike = {
  left: 0,
  top: 0,
  width: 80,
  height: 60,
  right: 80,
  bottom: 60,
};

const OFFSET = 4;

describe('computePopupBaseCoords — top family', () => {
  it('top: popup centered horizontally above anchor', () => {
    const coords = computePopupBaseCoords('top', ANCHOR, POPUP, OFFSET);
    // anchor.left + (anchor.width - popup.width) / 2 = 200 + (100 - 80) / 2 = 210
    expect(coords.leftPx).toBe(210);
    // anchor.top - popup.height - offset = 300 - 60 - 4 = 236
    expect(coords.topPx).toBe(236);
  });

  it('top-start: popup left-aligned with anchor', () => {
    const coords = computePopupBaseCoords('top-start', ANCHOR, POPUP, OFFSET);
    expect(coords.leftPx).toBe(200);
    expect(coords.topPx).toBe(236);
  });

  it('top-end: popup right-aligned with anchor', () => {
    const coords = computePopupBaseCoords('top-end', ANCHOR, POPUP, OFFSET);
    // anchor.left + anchor.width - popup.width = 200 + 100 - 80 = 220
    expect(coords.leftPx).toBe(220);
    expect(coords.topPx).toBe(236);
  });
});

describe('computePopupBaseCoords — bottom family', () => {
  it('bottom: popup centered horizontally below anchor', () => {
    const coords = computePopupBaseCoords('bottom', ANCHOR, POPUP, OFFSET);
    expect(coords.leftPx).toBe(210);
    // anchor.bottom + offset = 340 + 4 = 344
    expect(coords.topPx).toBe(344);
  });

  it('bottom-start: popup left-aligned with anchor', () => {
    const coords = computePopupBaseCoords('bottom-start', ANCHOR, POPUP, OFFSET);
    expect(coords.leftPx).toBe(200);
    expect(coords.topPx).toBe(344);
  });

  it('bottom-end: popup right-aligned with anchor', () => {
    const coords = computePopupBaseCoords('bottom-end', ANCHOR, POPUP, OFFSET);
    expect(coords.leftPx).toBe(220);
    expect(coords.topPx).toBe(344);
  });
});

describe('computePopupBaseCoords — left family', () => {
  it('left: popup centered vertically left of anchor', () => {
    const coords = computePopupBaseCoords('left', ANCHOR, POPUP, OFFSET);
    // anchor.left - popup.width - offset = 200 - 80 - 4 = 116
    expect(coords.leftPx).toBe(116);
    // anchor.top + (anchor.height - popup.height) / 2 = 300 + (40 - 60) / 2 = 290
    expect(coords.topPx).toBe(290);
  });

  it('left-start: popup top-aligned with anchor', () => {
    const coords = computePopupBaseCoords('left-start', ANCHOR, POPUP, OFFSET);
    expect(coords.leftPx).toBe(116);
    expect(coords.topPx).toBe(300);
  });

  it('left-end: popup bottom-aligned with anchor', () => {
    const coords = computePopupBaseCoords('left-end', ANCHOR, POPUP, OFFSET);
    expect(coords.leftPx).toBe(116);
    // anchor.top + anchor.height - popup.height = 300 + 40 - 60 = 280
    expect(coords.topPx).toBe(280);
  });
});

describe('computePopupBaseCoords — right family', () => {
  it('right: popup centered vertically right of anchor', () => {
    const coords = computePopupBaseCoords('right', ANCHOR, POPUP, OFFSET);
    // anchor.right + offset = 300 + 4 = 304
    expect(coords.leftPx).toBe(304);
    expect(coords.topPx).toBe(290);
  });

  it('right-start: popup top-aligned with anchor', () => {
    const coords = computePopupBaseCoords('right-start', ANCHOR, POPUP, OFFSET);
    expect(coords.leftPx).toBe(304);
    expect(coords.topPx).toBe(300);
  });

  it('right-end: popup bottom-aligned with anchor', () => {
    const coords = computePopupBaseCoords('right-end', ANCHOR, POPUP, OFFSET);
    expect(coords.leftPx).toBe(304);
    expect(coords.topPx).toBe(280);
  });
});

describe('computePopupBaseCoords — symmetry properties', () => {
  it('offset accumulates between anchor and popup along the main axis', () => {
    const small = computePopupBaseCoords('bottom', ANCHOR, POPUP, 0);
    const big = computePopupBaseCoords('bottom', ANCHOR, POPUP, 20);
    expect(big.topPx - small.topPx).toBe(20);
  });

  it('opposite placements differ on the main axis only (top vs bottom)', () => {
    const top = computePopupBaseCoords('top', ANCHOR, POPUP, OFFSET);
    const bot = computePopupBaseCoords('bottom', ANCHOR, POPUP, OFFSET);
    expect(top.leftPx).toBe(bot.leftPx);
    expect(top.topPx).not.toBe(bot.topPx);
  });

  it('opposite placements differ on the main axis only (left vs right)', () => {
    const lft = computePopupBaseCoords('left', ANCHOR, POPUP, OFFSET);
    const rgt = computePopupBaseCoords('right', ANCHOR, POPUP, OFFSET);
    expect(lft.topPx).toBe(rgt.topPx);
    expect(lft.leftPx).not.toBe(rgt.leftPx);
  });

  it('all 12 placements return finite numbers (no NaN/Infinity)', () => {
    const all: readonly PopupPlacement[] = [
      'top',
      'top-start',
      'top-end',
      'bottom',
      'bottom-start',
      'bottom-end',
      'left',
      'left-start',
      'left-end',
      'right',
      'right-start',
      'right-end',
    ];
    for (const p of all) {
      const c = computePopupBaseCoords(p, ANCHOR, POPUP, OFFSET);
      expect(Number.isFinite(c.leftPx), p).toBe(true);
      expect(Number.isFinite(c.topPx), p).toBe(true);
    }
  });
});

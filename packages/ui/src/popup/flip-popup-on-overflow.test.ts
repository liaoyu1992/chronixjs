import { describe, expect, it } from 'vitest';

import { flipPopupOnOverflow } from './flip-popup-on-overflow.js';

import type { DOMRectLike } from './popup-spec.js';

const VIEWPORT: DOMRectLike = {
  left: 0,
  top: 0,
  width: 1024,
  height: 768,
  right: 1024,
  bottom: 768,
};

const OFFSET = 4;

describe('flipPopupOnOverflow — no flip when space sufficient', () => {
  it('center anchor with plenty of space: no flip in any direction', () => {
    const anchor: DOMRectLike = {
      left: 500,
      top: 380,
      width: 100,
      height: 40,
      right: 600,
      bottom: 420,
    };
    expect(flipPopupOnOverflow('top', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('top');
    expect(flipPopupOnOverflow('bottom', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('bottom');
    expect(flipPopupOnOverflow('left', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('left');
    expect(flipPopupOnOverflow('right', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('right');
  });
});

describe('flipPopupOnOverflow — main-axis flips', () => {
  it('top → bottom: insufficient space above (anchor near top edge)', () => {
    const anchor: DOMRectLike = {
      left: 500,
      top: 20,
      width: 100,
      height: 40,
      right: 600,
      bottom: 60,
    };
    // top needs anchor.top(20) - popup.height(60) - offset(4) = -44 < viewport.top(0): overflow.
    // bottom: anchor.bottom(60) + offset(4) + popup.height(60) = 124 ≤ viewport.bottom(768): fits.
    expect(flipPopupOnOverflow('top', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('bottom');
  });

  it('bottom → top: insufficient space below (anchor near bottom edge)', () => {
    const anchor: DOMRectLike = {
      left: 500,
      top: 700,
      width: 100,
      height: 40,
      right: 600,
      bottom: 740,
    };
    // bottom: 740 + 4 + 60 = 804 > 768: overflow.
    // top: 700 - 60 - 4 = 636 ≥ 0: fits.
    expect(flipPopupOnOverflow('bottom', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('top');
  });

  it('left → right: insufficient space to the left (anchor near left edge)', () => {
    const anchor: DOMRectLike = {
      left: 20,
      top: 380,
      width: 100,
      height: 40,
      right: 120,
      bottom: 420,
    };
    // left: 20 - 80 - 4 = -64 < 0: overflow.
    // right: 120 + 4 + 80 = 204 ≤ 1024: fits.
    expect(flipPopupOnOverflow('left', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('right');
  });

  it('right → left: insufficient space to the right (anchor near right edge)', () => {
    const anchor: DOMRectLike = {
      left: 900,
      top: 380,
      width: 100,
      height: 40,
      right: 1000,
      bottom: 420,
    };
    // right: 1000 + 4 + 80 = 1084 > 1024: overflow.
    // left: 900 - 80 - 4 = 816 ≥ 0: fits.
    expect(flipPopupOnOverflow('right', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('left');
  });
});

describe('flipPopupOnOverflow — alignment suffix preserved', () => {
  it('top-start flips to bottom-start', () => {
    const anchor: DOMRectLike = {
      left: 500,
      top: 20,
      width: 100,
      height: 40,
      right: 600,
      bottom: 60,
    };
    expect(flipPopupOnOverflow('top-start', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('bottom-start');
  });

  it('top-end flips to bottom-end', () => {
    const anchor: DOMRectLike = {
      left: 500,
      top: 20,
      width: 100,
      height: 40,
      right: 600,
      bottom: 60,
    };
    expect(flipPopupOnOverflow('top-end', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('bottom-end');
  });

  it('right-start flips to left-start', () => {
    const anchor: DOMRectLike = {
      left: 900,
      top: 380,
      width: 100,
      height: 40,
      right: 1000,
      bottom: 420,
    };
    expect(flipPopupOnOverflow('right-start', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('left-start');
  });

  it('left-end flips to right-end', () => {
    const anchor: DOMRectLike = {
      left: 20,
      top: 380,
      width: 100,
      height: 40,
      right: 120,
      bottom: 420,
    };
    expect(flipPopupOnOverflow('left-end', anchor, 80, 60, VIEWPORT, OFFSET)).toBe('right-end');
  });
});

describe('flipPopupOnOverflow — both-sides-overflow edge case', () => {
  it('keeps preferred placement when flipped direction also overflows', () => {
    // Tiny viewport, large popup: neither top nor bottom fits.
    const tinyViewport: DOMRectLike = {
      left: 0,
      top: 0,
      width: 200,
      height: 100,
      right: 200,
      bottom: 100,
    };
    const anchor: DOMRectLike = {
      left: 80,
      top: 40,
      width: 40,
      height: 20,
      right: 120,
      bottom: 60,
    };
    // top: 40 - 200 - 4 = -164 < 0: overflow.
    // bottom: 60 + 4 + 200 = 264 > 100: overflow.
    // Per spec: keep preferred (no point flipping into equally-bad space).
    expect(flipPopupOnOverflow('top', anchor, 100, 200, tinyViewport, OFFSET)).toBe('top');
    expect(flipPopupOnOverflow('bottom', anchor, 100, 200, tinyViewport, OFFSET)).toBe('bottom');
  });
});

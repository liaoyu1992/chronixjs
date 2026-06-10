import { describe, expect, it } from 'vitest';

import { defaultPopupSpec, type DOMRectLike, type PopupPlacementInput } from './popup-spec.js';
import { resolvePopupPlacement } from './resolve-popup-placement.js';

const VIEWPORT: DOMRectLike = {
  left: 0,
  top: 0,
  width: 1024,
  height: 768,
  right: 1024,
  bottom: 768,
};

function buildInput(args: {
  anchor?: Partial<DOMRectLike>;
  popup?: Partial<DOMRectLike>;
  viewport?: DOMRectLike;
  spec?: Partial<PopupPlacementInput['spec']>;
}): PopupPlacementInput {
  const anchorBase = { left: 500, top: 380, width: 100, height: 40 };
  const anchor = { ...anchorBase, ...args.anchor };
  const anchorFull: DOMRectLike = {
    ...anchor,
    right: anchor.left + anchor.width,
    bottom: anchor.top + anchor.height,
  };
  const popupBase = { left: 0, top: 0, width: 80, height: 60 };
  const popup = { ...popupBase, ...args.popup };
  const popupFull: DOMRectLike = {
    ...popup,
    right: popup.left + popup.width,
    bottom: popup.top + popup.height,
  };
  return {
    anchorRect: anchorFull,
    popupRect: popupFull,
    viewportRect: args.viewport ?? VIEWPORT,
    spec: { ...defaultPopupSpec, ...args.spec },
  };
}

describe('resolvePopupPlacement — happy path (centered anchor, plenty of space)', () => {
  it('default spec (bottom) produces base coords with no flip', () => {
    const result = resolvePopupPlacement(buildInput({}));
    expect(result.actualPlacement).toBe('bottom');
    // anchor: left=500 top=380 width=100 height=40 right=600 bottom=420
    // popup centered horizontally: 500 + (100 - 80)/2 = 510
    expect(result.leftPx).toBe(510);
    // anchor.bottom + offset = 420 + 4 = 424
    expect(result.topPx).toBe(424);
    expect(result.widthPx).toBeNull();
  });

  it('top placement: popup ends offset above anchor', () => {
    const result = resolvePopupPlacement(buildInput({ spec: { placement: 'top' } }));
    expect(result.actualPlacement).toBe('top');
    // anchor.top - popup.height - offset = 380 - 60 - 4 = 316
    expect(result.topPx).toBe(316);
  });

  it('left-start: popup right-edge offset from anchor.left, top-aligned with anchor', () => {
    const result = resolvePopupPlacement(buildInput({ spec: { placement: 'left-start' } }));
    expect(result.actualPlacement).toBe('left-start');
    // anchor.left - popup.width - offset = 500 - 80 - 4 = 416
    expect(result.leftPx).toBe(416);
    expect(result.topPx).toBe(380);
  });

  it('right-end: popup left-edge offset from anchor.right, bottom-aligned with anchor', () => {
    const result = resolvePopupPlacement(buildInput({ spec: { placement: 'right-end' } }));
    expect(result.actualPlacement).toBe('right-end');
    // anchor.right + offset = 600 + 4 = 604
    expect(result.leftPx).toBe(604);
    // anchor.top + anchor.height - popup.height = 380 + 40 - 60 = 360
    expect(result.topPx).toBe(360);
  });
});

describe('resolvePopupPlacement — flip behavior', () => {
  it('top → bottom when anchor is near viewport top', () => {
    const result = resolvePopupPlacement(
      buildInput({
        anchor: { top: 20 }, // bottom = 60
        spec: { placement: 'top' },
      }),
    );
    expect(result.actualPlacement).toBe('bottom');
    // bottom coords: anchor.bottom(60) + offset(4) = 64
    expect(result.topPx).toBe(64);
  });

  it('bottom → top when anchor is near viewport bottom', () => {
    const result = resolvePopupPlacement(
      buildInput({
        anchor: { top: 700 }, // bottom = 740
        spec: { placement: 'bottom' },
      }),
    );
    expect(result.actualPlacement).toBe('top');
    // top coords: anchor.top(700) - popup.height(60) - offset(4) = 636
    expect(result.topPx).toBe(636);
  });

  it('left → right when anchor is near viewport left', () => {
    const result = resolvePopupPlacement(
      buildInput({
        anchor: { left: 20 }, // right = 120
        spec: { placement: 'left' },
      }),
    );
    expect(result.actualPlacement).toBe('right');
  });

  it('right → left when anchor is near viewport right', () => {
    const result = resolvePopupPlacement(
      buildInput({
        anchor: { left: 900 }, // right = 1000
        spec: { placement: 'right' },
      }),
    );
    expect(result.actualPlacement).toBe('left');
  });

  it('flip: false disables flip; placer keeps preferred even when it overflows', () => {
    const result = resolvePopupPlacement(
      buildInput({
        anchor: { top: 20 },
        spec: { placement: 'top', flip: false },
      }),
    );
    expect(result.actualPlacement).toBe('top');
    // Clamped: top coord would be 20 - 60 - 4 = -44, clamped to padding (8).
    expect(result.topPx).toBe(8);
  });

  it('alignment suffix preserved across flip (top-start → bottom-start)', () => {
    const result = resolvePopupPlacement(
      buildInput({
        anchor: { top: 20 },
        spec: { placement: 'top-start' },
      }),
    );
    expect(result.actualPlacement).toBe('bottom-start');
  });
});

describe('resolvePopupPlacement — clamp behavior', () => {
  it('cross-axis overflow on bottom-start: clamps right when popup would extend past viewport right', () => {
    // Anchor near right edge with bottom-start placement: popup's left
    // edge = anchor.left, popup extends right past viewport boundary.
    const result = resolvePopupPlacement(
      buildInput({
        anchor: { left: 970 }, // right = 1070
        popup: { width: 200 },
        spec: { placement: 'bottom-start', flip: false },
      }),
    );
    // popup.width = 200, viewport.right = 1024, padding = 8
    // maxLeft = 1024 - 200 - 8 = 816
    expect(result.leftPx).toBe(816);
  });

  it('clamp to viewport.left + padding when popup extends past left edge', () => {
    const result = resolvePopupPlacement(
      buildInput({
        anchor: { left: -50 }, // right = 50
        spec: { placement: 'bottom-start', flip: false },
      }),
    );
    expect(result.leftPx).toBe(8);
  });

  it('combination flip + clamp: overflows in two ways, both handled', () => {
    const result = resolvePopupPlacement(
      buildInput({
        anchor: { left: 20, top: 20 }, // upper-left corner of viewport
        spec: { placement: 'top-end' },
      }),
    );
    // top → flips to bottom (insufficient space above)
    // -end aligns popup-right with anchor-right (anchor.right=120, popup.width=80
    //   → popup.left=40)
    // No cross-axis clamp needed (40 ≥ 8).
    expect(result.actualPlacement).toBe('bottom-end');
    expect(result.leftPx).toBe(40);
  });
});

describe('resolvePopupPlacement — widthMatch', () => {
  it('widthMatch: true sets widthPx to anchor.width', () => {
    const result = resolvePopupPlacement(buildInput({ spec: { widthMatch: true } }));
    expect(result.widthPx).toBe(100);
  });

  it('widthMatch: false sets widthPx to null', () => {
    const result = resolvePopupPlacement(buildInput({ spec: { widthMatch: false } }));
    expect(result.widthPx).toBeNull();
  });

  it('widthMatch: true uses anchor.width for placement math (not popup.width)', () => {
    // Anchor: 100 wide. Popup intrinsic: 50 wide. With widthMatch=true,
    // effective popup width is 100, so bottom-start places popup at anchor.left.
    const result = resolvePopupPlacement(
      buildInput({
        popup: { width: 50 },
        spec: { placement: 'bottom-start', widthMatch: true },
      }),
    );
    expect(result.leftPx).toBe(500); // anchor.left, NOT clamped (effective width = 100)
    expect(result.widthPx).toBe(100);
  });
});

describe('resolvePopupPlacement — offset propagation', () => {
  it('offset is applied along the main axis', () => {
    const small = resolvePopupPlacement(buildInput({ spec: { offsetPx: 0, placement: 'bottom' } }));
    const big = resolvePopupPlacement(buildInput({ spec: { offsetPx: 20, placement: 'bottom' } }));
    expect(big.topPx - small.topPx).toBe(20);
  });
});

describe('resolvePopupPlacement — edge cases', () => {
  it('zero-size anchor: still produces finite coords', () => {
    const result = resolvePopupPlacement(
      buildInput({ anchor: { left: 500, top: 380, width: 0, height: 0 } }),
    );
    expect(Number.isFinite(result.leftPx)).toBe(true);
    expect(Number.isFinite(result.topPx)).toBe(true);
  });

  it('zero-size popup: returns coord at the anchored edge with offset', () => {
    const result = resolvePopupPlacement(
      buildInput({
        popup: { width: 0, height: 0 },
        spec: { placement: 'bottom-start' },
      }),
    );
    expect(result.leftPx).toBe(500);
    expect(result.topPx).toBe(424);
  });

  it('viewport-padding override is honored by the clamper', () => {
    const result = resolvePopupPlacement(
      buildInput({
        anchor: { left: -50 },
        spec: { placement: 'bottom-start', flip: false, viewportPaddingPx: 100 },
      }),
    );
    expect(result.leftPx).toBe(100);
  });
});

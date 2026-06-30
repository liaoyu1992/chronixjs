// @vitest-environment happy-dom
/**
 * sanity check on PopupSpec — verifies the
 * IR can drive a real anchor + popup pair in jsdom before ships
 * the actual Popover infra. If gaps are found here they get filed into
 * the design doc up front.
 *
 * This is a one-off; once ships real Popover integration this
 * file becomes redundant and should be removed.
 */
import { describe, expect, it } from 'vitest';

import {
  defaultPopupSpec,
  resolvePopupPlacement,
  type DOMRectLike,
  type PopupPlacement,
} from './index.js';

function rect(left: number, top: number, width: number, height: number): DOMRectLike {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  };
}

describe('PopupSpec sanity (→ de-risk)', () => {
  it('mounts a real anchor + popup pair in jsdom and produces placement coords', () => {
    const anchor = document.createElement('div');
    anchor.style.position = 'fixed';
    anchor.style.left = '100px';
    anchor.style.top = '200px';
    anchor.style.width = '120px';
    anchor.style.height = '40px';
    document.body.appendChild(anchor);

    const popup = document.createElement('div');
    popup.style.position = 'fixed';
    popup.style.width = '160px';
    popup.style.height = '60px';
    document.body.appendChild(popup);

    // happy-dom does not run layout; provide rect-like inputs directly
    // (mirrors the adapter pattern: read via getBoundingClientRect and
    // pass through to resolvePopupPlacement).
    const result = resolvePopupPlacement({
      anchorRect: rect(100, 200, 120, 40),
      popupRect: rect(0, 0, 160, 60),
      viewportRect: rect(0, 0, 1280, 720),
      spec: defaultPopupSpec,
    });

    expect(typeof result.leftPx).toBe('number');
    expect(typeof result.topPx).toBe('number');
    expect([
      'top',
      'bottom',
      'left',
      'right',
      'top-start',
      'top-end',
      'bottom-start',
      'bottom-end',
      'left-start',
      'left-end',
      'right-start',
      'right-end',
    ]).toContain(result.actualPlacement);

    // Default spec places below + centered; popup width 160 / anchor width 120
    // means popup centers at anchor centerX 160 → popup left = 160-80=80.
    expect(result.leftPx).toBe(80);
    // top of popup = anchor.bottom (240) + offset (4) = 244
    expect(result.topPx).toBe(244);
    expect(result.actualPlacement).toBe('bottom');

    anchor.remove();
    popup.remove();
  });

  it('flips placement when anchor sits near viewport edge', () => {
    // Anchor near top edge: with placement=top, popup would overflow above.
    const result = resolvePopupPlacement({
      anchorRect: rect(500, 8, 120, 40),
      popupRect: rect(0, 0, 160, 60),
      viewportRect: rect(0, 0, 1280, 720),
      spec: { ...defaultPopupSpec, placement: 'top' },
    });
    expect(result.actualPlacement).toBe('bottom');
  });

  it('exercises all 12 placements without throwing / NaN', () => {
    const placements: readonly PopupPlacement[] = [
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
    for (const placement of placements) {
      const result = resolvePopupPlacement({
        anchorRect: rect(500, 300, 120, 40),
        popupRect: rect(0, 0, 160, 60),
        viewportRect: rect(0, 0, 1280, 720),
        spec: { ...defaultPopupSpec, placement, flip: false },
      });
      expect(Number.isFinite(result.leftPx)).toBe(true);
      expect(Number.isFinite(result.topPx)).toBe(true);
      // With flip=false, actualPlacement should match requested
      expect(result.actualPlacement).toBe(placement);
    }
  });
});

import { clampPopupToViewport } from './clamp-popup-to-viewport.js';
import { computePopupBaseCoords } from './compute-popup-base-coords.js';
import { flipPopupOnOverflow } from './flip-popup-on-overflow.js';

import type { PopupPlacementInput, PopupPlacementResult } from './popup-spec.js';

/**
 * Resolve the final popup position given an anchor rect, popup rect,
 * viewport rect, and placement spec. Pure function — no DOM access, no
 * side effects.
 *
 * Phase 4 (2026-06-02) per Phase 0.2 Decision A.1.
 *
 * Pipeline:
 *
 * 1. **widthMatch** — if `spec.widthMatch` is true, replace the popup's
 *    effective width with the anchor's width (Select dropdown semantics).
 * 2. **flip** — if `spec.flip` is true and the preferred main-axis
 *    direction overflows the viewport, swap to the opposite direction
 *    (alignment suffix preserved). See `flipPopupOnOverflow` for rules.
 * 3. **base** — compute the popup's top-left coord for the actual
 *    placement via `computePopupBaseCoords` (pure 12-way switch).
 * 4. **clamp** — keep the popup inside the viewport (shrunk by
 *    `spec.viewportPaddingPx`) via `clampPopupToViewport`.
 *
 * The four steps are independently testable; this orchestrator just
 * threads them together.
 *
 * Result includes:
 *
 * - `leftPx` / `topPx` — viewport-relative coords, use with
 *   `position: fixed`.
 * - `actualPlacement` — may differ from `spec.placement` only when
 *   flip was triggered.
 * - `widthPx` — non-null only when `spec.widthMatch: true`.
 */
export function resolvePopupPlacement(input: PopupPlacementInput): PopupPlacementResult {
  const { anchorRect, popupRect, viewportRect, spec } = input;

  // Step 1 — widthMatch resolves the popup's effective width.
  const effectiveWidth = spec.widthMatch ? anchorRect.width : popupRect.width;
  const effectiveHeight = popupRect.height;

  // Step 2 — flip if the preferred direction overflows.
  const actualPlacement = spec.flip
    ? flipPopupOnOverflow(
        spec.placement,
        anchorRect,
        effectiveWidth,
        effectiveHeight,
        viewportRect,
        spec.offsetPx,
      )
    : spec.placement;

  // Step 3 — base coords for the actual placement. We build a
  // popup-shaped rect on the fly so computePopupBaseCoords only needs
  // width/height (its left/top/right/bottom are ignored).
  const popupRectForBase = {
    left: 0,
    top: 0,
    width: effectiveWidth,
    height: effectiveHeight,
    right: effectiveWidth,
    bottom: effectiveHeight,
  };
  const baseCoords = computePopupBaseCoords(
    actualPlacement,
    anchorRect,
    popupRectForBase,
    spec.offsetPx,
  );

  // Step 4 — clamp to viewport.
  const clamped = clampPopupToViewport(
    baseCoords.leftPx,
    baseCoords.topPx,
    effectiveWidth,
    effectiveHeight,
    viewportRect,
    spec.viewportPaddingPx,
  );

  return {
    leftPx: clamped.leftPx,
    topPx: clamped.topPx,
    actualPlacement,
    widthPx: spec.widthMatch ? anchorRect.width : null,
  };
}

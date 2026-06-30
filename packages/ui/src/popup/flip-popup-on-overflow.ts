import type { DOMRectLike, PopupPlacement } from './popup-spec.js';

/**
 * If the popup at `placement` would overflow `viewportRect` along its
 * main axis, return the flipped placement (alignment suffix preserved);
 * otherwise return `placement` unchanged. Pure function.
 *
 * .
 *
 * Flip rules (main-axis only — cross-axis alignment is handled by clamp):
 *
 * - `top*` flips to `bottom*` when `anchor.top - popupHeight - offsetPx
 *   < viewport.top` (insufficient space above).
 * - `bottom*` flips to `top*` when `anchor.bottom + offsetPx + popupHeight
 *   > viewport.bottom` (insufficient space below).
 * - `left*` flips to `right*` when `anchor.left - popupWidth - offsetPx
 *   < viewport.left` (insufficient space to the left).
 * - `right*` flips to `left*` when `anchor.right + offsetPx + popupWidth
 *   > viewport.right` (insufficient space to the right).
 *
 * Edge case — both directions overflow: the placer keeps the preferred
 * placement (no flip). Rationale: flipping into an equally-bad position
 * isn't an improvement; the orchestrator's clamp step will best-effort
 * fit the popup either way. Consumers facing this case typically have a
 * popup larger than the viewport along that axis — a different visual
 * solution (smaller popup, scrollable popup, full-screen overlay) is
 * needed at the design level, not the placement level.
 */
export function flipPopupOnOverflow(
  placement: PopupPlacement,
  anchorRect: DOMRectLike,
  popupWidth: number,
  popupHeight: number,
  viewportRect: DOMRectLike,
  offsetPx: number,
): PopupPlacement {
  const { axis, align } = splitPlacement(placement);
  const flipped = oppositeAxis(axis);

  // Check whether the preferred direction overflows.
  const preferredOverflows = overflowsAxis(
    axis,
    anchorRect,
    popupWidth,
    popupHeight,
    viewportRect,
    offsetPx,
  );
  if (!preferredOverflows) return placement;

  // Check whether the flipped direction would also overflow; if so,
  // keep preferred (no point flipping into equally-bad space).
  const flippedOverflows = overflowsAxis(
    flipped,
    anchorRect,
    popupWidth,
    popupHeight,
    viewportRect,
    offsetPx,
  );
  if (flippedOverflows) return placement;

  return joinPlacement(flipped, align);
}

type Axis = 'top' | 'bottom' | 'left' | 'right';
type Alignment = 'start' | 'center' | 'end';

function splitPlacement(p: PopupPlacement): { axis: Axis; align: Alignment } {
  const parts = p.split('-') as [Axis] | [Axis, 'start' | 'end'];
  const axis = parts[0];
  const align: Alignment = parts.length === 2 ? parts[1] : 'center';
  return { axis, align };
}

function joinPlacement(axis: Axis, align: Alignment): PopupPlacement {
  if (align === 'center') return axis;
  return `${axis}-${align}`;
}

function oppositeAxis(axis: Axis): Axis {
  switch (axis) {
    case 'top':
      return 'bottom';
    case 'bottom':
      return 'top';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

function overflowsAxis(
  axis: Axis,
  anchorRect: DOMRectLike,
  popupWidth: number,
  popupHeight: number,
  viewportRect: DOMRectLike,
  offsetPx: number,
): boolean {
  switch (axis) {
    case 'top':
      return anchorRect.top - popupHeight - offsetPx < viewportRect.top;
    case 'bottom':
      return anchorRect.bottom + offsetPx + popupHeight > viewportRect.bottom;
    case 'left':
      return anchorRect.left - popupWidth - offsetPx < viewportRect.left;
    case 'right':
      return anchorRect.right + offsetPx + popupWidth > viewportRect.right;
  }
}

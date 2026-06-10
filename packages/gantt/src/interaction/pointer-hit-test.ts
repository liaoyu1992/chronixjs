import type { PlacedBar, SwimlaneStrip } from '../layout/types.js';

/**
 * What a successful hit resolved to. The discriminator drives which
 * transaction kind the adapter starts on pointer-down:
 *
 * - `'bar-body'` → `BarDragTransaction`
 * - `'bar-edge-start'` / `'bar-edge-end'` → `BarResizeTransaction` with the
 *   matching edge
 * - `'progress-handle'` → `ProgressHandleTransaction`. The handle is a
 *   small per-bar rect that the caller supplies via
 *   `progressHandleByBarId`; it takes precedence over the bar's own
 *   body / edge zones, and may extend slightly past the bar's bounding
 *   box (matches the original spec's protruding-triangle visual).
 * - `'empty-row'` → `CalendarRangeSelectTransaction` (the adapter converts
 *   `contentX` to a time via the axis)
 *
 * `overlayId` is set when the hit lands on a bar that declared a
 * `BarSpec.pointerOverlayId`. Adapters apply that overlay's
 * `PointerCaptureConfig` (e.g. `requireInitialHit: false` for the
 * progress-handle path) to the transaction they start.
 */
export type PointerHitResult =
  | { readonly kind: 'bar-body'; readonly barId: string; readonly overlayId?: string }
  | { readonly kind: 'bar-edge-start'; readonly barId: string; readonly overlayId?: string }
  | { readonly kind: 'bar-edge-end'; readonly barId: string; readonly overlayId?: string }
  | { readonly kind: 'progress-handle'; readonly barId: string; readonly overlayId?: string }
  | { readonly kind: 'empty-row'; readonly rowId: string };

export interface PointerHitTestInput {
  /**
   * Pointer x in TIMELINE-BODY CONTENT space — i.e. viewport-x plus the
   * timeline body's horizontal scroll offset, measured from the body's
   * content origin (which is where `PlacedBar.x` is measured from too).
   *
   * Adapters typically compute this as:
   *   contentX = pointerEvent.clientX − bodyRect.left + body.scrollLeft
   */
  readonly contentX: number;
  /**
   * Pointer y in TIMELINE-BODY CONTENT space — analogous to `contentX`.
   * The body's content origin sits at the top of the first
   * `SwimlaneStrip`.
   */
  readonly contentY: number;
  /**
   * Bars to hit-test against, in z-order from bottom to top. Later
   * entries take precedence on overlap — the LAST matching bar wins.
   * Output of `BarPlacementPass.place`.
   */
  readonly placedBars: readonly PlacedBar[];
  /**
   * Row strips. Used only for the empty-row fallback: when no bar
   * matches but `contentY` lands inside some strip's [y, y+height)
   * range, the result is `{ kind: 'empty-row', rowId: strip.rowId }`.
   * Output of `RowSwimlaneLayout.layout`.
   */
  readonly strips: readonly SwimlaneStrip[];
  /**
   * Optional per-bar overlay-group binding (from `BarSpec.pointerOverlayId`).
   * When a bar wins the hit AND has an entry here, the resulting
   * `PointerHitResult` carries `overlayId`.
   */
  readonly overlayIdByBarId?: ReadonlyMap<string, string>;
  /**
   * Optional per-bar progress-handle rect, in TIMELINE-BODY CONTENT space
   * (same coords as `PlacedBar.x / y`). When set AND the pointer lands
   * inside the rect, the resulting hit kind is `'progress-handle'`,
   * overriding the bar's body / edge zones. The rect can extend slightly
   * past the bar's bounding box — the original spec's progress triangle
   * protrudes below the bar by a few pixels, and the hit zone follows
   * the visible shape, not the underlying rect.
   *
   * Callers compute the rect from `BarSpec.progress` + `PlacedBar` (e.g.
   * `handleX = bar.x + progress/100 × bar.width`); the hit-tester stays
   * geometry-only and is not aware of the percent-to-pixel formula.
   */
  readonly progressHandleByBarId?: ReadonlyMap<
    string,
    { readonly x: number; readonly y: number; readonly width: number; readonly height: number }
  >;
  /**
   * Width of each bar's edge resize zone in pixels. Default 8. When the
   * bar is narrower than `2 × edgeZoneWidth`, the two edge zones collide;
   * the bar's center splits them (start wins on the left half, end on
   * the right) and the bar has no `'bar-body'` zone for that geometry.
   */
  readonly edgeZoneWidth?: number;
}

/**
 * Pure-functional hit-test: viewport pointer position → bar id + zone, or
 * `null` for a miss outside every strip. Adapter prerequisite for Phase 4.
 *
 * Single-pass over placed bars + strips; no DOM, no `elementFromPoint`,
 * no implicit z-order rules beyond input order. Adapters that need
 * "topmost wins" semantics should pass `placedBars` in bottom-to-top
 * order (BarPlacementPass already does so when bars come from a stable
 * input).
 */
export interface PointerHitTester {
  test(input: PointerHitTestInput): PointerHitResult | null;
}

function hitZoneInBar(
  contentX: number,
  bar: PlacedBar,
  edgeZoneWidth: number,
): 'bar-body' | 'bar-edge-start' | 'bar-edge-end' {
  const relX = contentX - bar.x;
  // Bar narrower than two full edge zones — no body, split at center.
  if (bar.width < edgeZoneWidth * 2) {
    return relX < bar.width / 2 ? 'bar-edge-start' : 'bar-edge-end';
  }
  if (relX < edgeZoneWidth) return 'bar-edge-start';
  if (relX > bar.width - edgeZoneWidth) return 'bar-edge-end';
  return 'bar-body';
}

export const defaultPointerHitTester: PointerHitTester = {
  test(input) {
    const edgeZoneWidth = input.edgeZoneWidth ?? 8;
    const { contentX, contentY, placedBars, strips, overlayIdByBarId, progressHandleByBarId } =
      input;

    // Walk bars top-down (later in array = on top). The last matching
    // bar wins on overlap; this matches the natural paint order from
    // BarPlacementPass output.
    for (let i = placedBars.length - 1; i >= 0; i -= 1) {
      const bar = placedBars[i]!;

      // Progress-handle rect is checked first because it can extend past
      // the bar's bounding box (a triangle protruding below the body).
      // The rect is the visible hit shape; we don't intersect it with
      // the bar bounds.
      const handle = progressHandleByBarId?.get(bar.barId);
      if (
        handle &&
        contentX >= handle.x &&
        contentX <= handle.x + handle.width &&
        contentY >= handle.y &&
        contentY <= handle.y + handle.height
      ) {
        const overlayId = overlayIdByBarId?.get(bar.barId);
        return overlayId !== undefined
          ? { kind: 'progress-handle', barId: bar.barId, overlayId }
          : { kind: 'progress-handle', barId: bar.barId };
      }

      if (
        contentX < bar.x ||
        contentX > bar.x + bar.width ||
        contentY < bar.y ||
        contentY > bar.y + bar.height
      ) {
        continue;
      }
      const kind = hitZoneInBar(contentX, bar, edgeZoneWidth);
      const overlayId = overlayIdByBarId?.get(bar.barId);
      return overlayId !== undefined
        ? { kind, barId: bar.barId, overlayId }
        : { kind, barId: bar.barId };
    }

    // No bar hit — fall through to strip lookup for empty-row.
    for (const strip of strips) {
      if (contentY >= strip.y && contentY < strip.y + strip.height) {
        return { kind: 'empty-row', rowId: strip.rowId };
      }
    }

    return null;
  },
};

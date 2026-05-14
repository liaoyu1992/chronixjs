import type { PlacedBar, SwimlaneStrip } from '../layout/types.js';

/**
 * What a successful hit resolved to. The discriminator drives which
 * transaction kind the adapter starts on pointer-down:
 *
 * - `'bar-body'` → `BarDragTransaction`
 * - `'bar-edge-start'` / `'bar-edge-end'` → `BarResizeTransaction` with the
 *   matching edge
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
    const { contentX, contentY, placedBars, strips, overlayIdByBarId } = input;

    // Walk bars top-down (later in array = on top). The last matching
    // bar wins on overlap; this matches the natural paint order from
    // BarPlacementPass output.
    for (let i = placedBars.length - 1; i >= 0; i -= 1) {
      const bar = placedBars[i]!;
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

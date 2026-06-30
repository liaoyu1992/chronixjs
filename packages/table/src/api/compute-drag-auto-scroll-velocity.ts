/**
 * pure scroll-velocity helper for the
 * during-drag auto-scroll feature. Feed in the cursor's `clientY`
 * during a row-drag pointermove + the body scrollport's top + bottom
 * edges (`getBoundingClientRect().top` / `.bottom`) + the trigger-zone
 * size + max velocity; the helper returns a per-frame scroll delta:
 *
 * - **Negative** → scroll up (cursor near body top edge).
 * - **Positive** → scroll down (cursor near body bottom edge).
 * - **0** → cursor in the body's middle region; no auto-scroll.
 *
 * **Algorithm** (per Decision B.1 — linear proximity → velocity):
 *
 *   topThreshold = bodyTop + triggerZonePx
 *   bottomThreshold = bodyBottom - triggerZonePx
 *
 *   if cursor < topThreshold:
 *     proximity = clamp((topThreshold - cursor) / triggerZonePx, 0, 1)
 *     return -maxVelocity * proximity
 *   else if cursor > bottomThreshold:
 *     proximity = clamp((cursor - bottomThreshold) / triggerZonePx, 0, 1)
 *     return +maxVelocity * proximity
 *   else:
 *     return 0
 *
 * **Edge behavior**:
 * - `triggerZonePx <= 0` → returns 0 (auto-scroll disabled).
 * - `maxVelocityPxPerFrame <= 0` → returns 0 (auto-scroll disabled).
 * - `bodyBottom <= bodyTop` (degenerate / pre-mount) → returns 0.
 * - Cursor far ABOVE bodyTop (e.g., user dragged above viewport,
 *   negative clientY relative to body) → proximity clamps to 1.0 →
 *   returns -maxVelocity.
 * - Cursor far BELOW bodyBottom (off-bottom) → clamps to +maxVelocity.
 * - Trigger zones overlap (`triggerZonePx > body height / 2`) → both
 *   branches could match; the top branch wins (cursor < topThreshold
 *   evaluated first). Consumer should pick a trigger zone smaller than
 *   the body's visible height.
 *
 * Pure function. No DOM. No side effects. Output is a number; caller
 * mutates `body.scrollTop += velocity` inside an rAF loop.
 *
 * chronix-NEW (original grids ship auto-scroll bundled with their
 * drag pipeline; the pure-function shape + adapter-side rAF wiring is
 * chronix's own — matches the `computeScrollIntoView` split).
 */

export const DEFAULT_DRAG_AUTO_SCROLL_TRIGGER_ZONE_PX = 30;
export const DEFAULT_DRAG_AUTO_SCROLL_MAX_VELOCITY_PX_PER_FRAME = 12;

export interface DragAutoScrollVelocityInput {
  /** Cursor's `clientY` (viewport coordinate). */
  readonly cursorClientY: number;
  /** Body's top edge in viewport coordinates (`getBoundingClientRect().top`). */
  readonly bodyTop: number;
  /** Body's bottom edge in viewport coordinates (`getBoundingClientRect().bottom`). */
  readonly bodyBottom: number;
  /** Trigger zone height in CSS px. Cursor within this distance from an edge triggers auto-scroll. */
  readonly triggerZonePx: number;
  /** Maximum scroll delta per rAF frame (when cursor is AT the edge). */
  readonly maxVelocityPxPerFrame: number;
}

export function computeDragAutoScrollVelocity(input: DragAutoScrollVelocityInput): number {
  const { cursorClientY, bodyTop, bodyBottom, triggerZonePx, maxVelocityPxPerFrame } = input;
  if (triggerZonePx <= 0 || maxVelocityPxPerFrame <= 0) return 0;
  if (bodyBottom <= bodyTop) return 0;

  const topThreshold = bodyTop + triggerZonePx;
  const bottomThreshold = bodyBottom - triggerZonePx;

  if (cursorClientY < topThreshold) {
    const proximity = clamp01((topThreshold - cursorClientY) / triggerZonePx);
    return -maxVelocityPxPerFrame * proximity;
  }
  if (cursorClientY > bottomThreshold) {
    const proximity = clamp01((cursorClientY - bottomThreshold) / triggerZonePx);
    return maxVelocityPxPerFrame * proximity;
  }
  return 0;
}

function clamp01(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x;
}

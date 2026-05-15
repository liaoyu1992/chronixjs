import type { SwimlaneStrip } from '../layout/types.js';

/**
 * Maps a content-y position to the `rowId` of the strip that owns
 * it. Pure, stateless — accepts the strip array on every call rather
 * than holding a cached one, because the strips re-derive on every
 * layout pass (axis / row / bar change) and a cached resolver would
 * go stale.
 *
 * Used by the pointer-interaction layer (cross-row bar drag, range-
 * select on empty rows) to translate a pointer position into the row
 * the user is currently aiming at.
 */
export interface SwimlaneStripResolver {
  /**
   * Return the `rowId` of the strip whose Y range contains `y`, or
   * `null` if `y` falls above the first strip, below the last strip,
   * or in an inter-strip gap (when `rowSpacing > 0` introduces a
   * 1-px divider between adjacent strips).
   *
   * Strip ownership is closed-open on the lower bound (`y >= strip.y`)
   * and open-closed on the upper bound (`y < strip.y + strip.height`),
   * so a y exactly on `strip[i].y` belongs to strip[i], not strip[i-1].
   * This mirrors the half-open convention used elsewhere in chronix
   * layout (axis tick ranges, viewport visible ranges).
   *
   * O(strips) linear scan. The chronix demo has ≤ 32 strips; binary
   * search isn't worth the complexity until profiling shows it.
   */
  atY(y: number, strips: readonly SwimlaneStrip[]): string | null;
}

export const defaultStripResolver: SwimlaneStripResolver = {
  atY(y, strips) {
    for (const strip of strips) {
      if (y >= strip.y && y < strip.y + strip.height) {
        return strip.rowId;
      }
    }
    return null;
  },
};

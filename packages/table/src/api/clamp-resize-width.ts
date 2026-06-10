import type { ColumnSpec } from '../ir/index.js';

/**
 * Phase 13 (2026-05-25): clamp a draft column-resize width to the
 * column's `[minWidth, maxWidth]` bounds. Used by the vue3 adapter
 * (and future vue2 / react ports) on every pointermove during an
 * in-flight column-resize transaction.
 *
 * Algorithm:
 *
 * 1. `min = column.minWidth ?? defaultMinColumnWidth` (matches
 *    `columnLayoutPass`'s minWidth-resolution rule).
 * 2. `max = column.maxWidth ?? Infinity`.
 * 3. `clamped = Math.max(min, Math.min(max, rawWidth))`.
 * 4. **Defensive**: when `rawWidth` is not a finite number (NaN,
 *    ±Infinity), the clamp returns `min` — pointer-move deltas
 *    SHOULD always be finite, but a malformed `clientX` (e.g. from
 *    a non-standard pointer device or a programmatic handle call)
 *    would otherwise propagate NaN through the layout pass.
 *
 * When `min > max` (consumer misconfig), the order `Math.max(min,
 * Math.min(max, raw))` makes `min` win — same precedence as
 * `columnLayoutPass`'s clamp at line 144.
 *
 * Pure function. No DOM. No side effects.
 */
export function clampResizeWidth(
  rawWidth: number,
  column: ColumnSpec,
  defaultMinColumnWidth: number,
): number {
  const min = column.minWidth ?? defaultMinColumnWidth;
  const max = column.maxWidth ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(rawWidth)) return min;
  return Math.max(min, Math.min(max, rawWidth));
}

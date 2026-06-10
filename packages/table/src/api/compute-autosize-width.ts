/**
 * Phase 15 (2026-05-26): options bag for `computeAutosizeWidth`. The
 * adapter pre-measures cell text widths (via `Canvas.measureText` or
 * an equivalent DOM-dependent primitive) and passes them in alongside
 * the layout-constraint inputs.
 *
 * - `paddingX` — left + right padding budget. Adapter typically passes
 *   `theme.cellPaddingX * 2` so autosize widths match rendered cell
 *   inner geometry.
 * - `minWidth` — lower clamp bound. Adapter typically passes
 *   `column.minWidth ?? theme.defaultMinColumnWidth` so autosize
 *   respects the same minimums as `columnLayoutPass` + Phase 13
 *   drag-resize.
 * - `maxWidth` — optional upper clamp bound. When set (typically from
 *   `column.maxWidth`), autosize never exceeds it.
 * - `headerWidth` — optional header label width. Phase 15 Decision B.1
 *   includes the header in the max calculation so a narrow-data /
 *   long-header column doesn't truncate the header.
 */
export interface ComputeAutosizeWidthOptions {
  readonly paddingX: number;
  readonly minWidth: number;
  readonly maxWidth?: number;
  readonly headerWidth?: number;
}

/**
 * Phase 15 (2026-05-26): pure clamp + max helper for column autosize.
 * Takes the per-cell measured text widths + the header label width
 * (both produced by the adapter's DOM-dependent measurement layer)
 * and returns the resulting clamped column width in pixels.
 *
 * Algorithm:
 *
 * 1. `contentMax = max(...measuredFormattedWidths, headerWidth ?? 0)`
 *    — widest single piece of text the column needs to fit.
 * 2. `raw = contentMax + paddingX` — add the left + right padding
 *    budget to match rendered cell geometry.
 * 3. `clamped = clamp(minWidth, raw, maxWidth ?? Infinity)` — respect
 *    the layout min/max bounds.
 *
 * Degenerate input (empty measurements + no header → contentMax === 0)
 * returns `minWidth`. The adapter shouldn't pass empty input (it always
 * has a header to measure), but the defensive branch keeps the helper
 * safe to call from imperative contexts.
 *
 * Pure function. No DOM. No side effects. Mirrors `clampResizeWidth`'s
 * clamp semantics so autosize widths and drag-resize widths share the
 * same layout-bound discipline.
 */
export function computeAutosizeWidth(
  measuredFormattedWidths: readonly number[],
  options: ComputeAutosizeWidthOptions,
): number {
  const headerWidth = options.headerWidth ?? 0;
  let contentMax = headerWidth;
  for (const w of measuredFormattedWidths) {
    if (w > contentMax) contentMax = w;
  }
  const raw = contentMax + options.paddingX;
  const max = options.maxWidth ?? Number.POSITIVE_INFINITY;
  return Math.max(options.minWidth, Math.min(max, raw));
}

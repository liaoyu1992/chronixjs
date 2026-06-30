/**
 * Split component IR — . Tier B 2-pane
 * resizable splitter. Drag the bar between two panes to redistribute
 * space.
 *
 * Out-of-scope (v0.2):
 * - 3+ panes (recursive splits).
 * - Collapsible panes (snap to 0).
 * - Custom split-bar render (slot).
 * - Cross splitters (horizontal + vertical at the same time).
 */

/**
 * Drag axis. `'horizontal'` = side-by-side panes separated by a
 * vertical bar (dragging left/right resizes); `'vertical'` = stacked
 * panes separated by a horizontal bar (dragging up/down resizes).
 */
export type SplitDirection = 'horizontal' | 'vertical';

export interface SplitProps {
  readonly direction: SplitDirection;
  /**
   * Initial size for the first pane when `size` is undefined.
   * Number → `${n}px`; string → applied verbatim as `flex-basis`.
   */
  readonly defaultSize: number | string;
  /** Controlled override for the first pane's size. */
  readonly size: number | string | undefined;
  /** Lower bound (pure-data; adapter enforces during drag). */
  readonly minSize: number | string;
  /** Upper bound (pure-data; adapter enforces during drag). */
  readonly maxSize: number | string;
  readonly disabled: boolean;
}

export const defaultSplitProps: SplitProps = {
  direction: 'horizontal',
  defaultSize: '50%',
  size: undefined,
  minSize: 0,
  maxSize: '100%',
  disabled: false,
};

/**
 * Resolve the first pane's flex-basis inline style. Pure helper.
 *
 * Numbers are emitted as px values; strings (e.g. `'50%'` or `'20rem'`)
 * pass through unchanged.
 */
export function resolveSplitFirstPaneStyle(input: {
  readonly size: number | string;
}): Record<string, string> {
  const basis = typeof input.size === 'number' ? `${input.size}px` : input.size;
  return { flexBasis: basis, flexGrow: '0', flexShrink: '0' };
}

/**
 * Clamp a candidate size (in px) between `minSize` and `maxSize`,
 * resolved against the container's total length (in px). Pure helper
 * consumed by adapter drag handlers — they translate
 * `defaultSize` / `minSize` / `maxSize` to px against the measured
 * container length, then clamp the proposed value.
 *
 * For string sizes ending in `%`, the value is parsed as a fraction of
 * `containerLengthPx`. For numeric sizes, the number is treated as a px
 * value verbatim. Other string sizes (`'20rem'` etc.) cannot be
 * resolved here and return `null` for the caller to fall back on.
 */
export function resolveSplitSizePx(input: {
  readonly value: number | string;
  readonly containerLengthPx: number;
}): number | null {
  const { value, containerLengthPx } = input;
  if (typeof value === 'number') return value;
  if (value.endsWith('%')) {
    const pct = Number(value.slice(0, -1));
    if (Number.isFinite(pct)) return (pct / 100) * containerLengthPx;
    return null;
  }
  if (value.endsWith('px')) {
    const px = Number(value.slice(0, -2));
    if (Number.isFinite(px)) return px;
    return null;
  }
  return null;
}

/**
 * Clamp a proposed size (px) to the `[minSize, maxSize]` bounds.
 * Sizes that can't be resolved to px fall back to `0` for min and
 * `containerLengthPx` for max.
 */
export function clampSplitSize(input: {
  readonly proposedPx: number;
  readonly minSize: number | string;
  readonly maxSize: number | string;
  readonly containerLengthPx: number;
}): number {
  const { proposedPx, minSize, maxSize, containerLengthPx } = input;
  const minPx = resolveSplitSizePx({ value: minSize, containerLengthPx }) ?? 0;
  const maxPx = resolveSplitSizePx({ value: maxSize, containerLengthPx }) ?? containerLengthPx;
  if (proposedPx < minPx) return minPx;
  if (proposedPx > maxPx) return maxPx;
  return proposedPx;
}

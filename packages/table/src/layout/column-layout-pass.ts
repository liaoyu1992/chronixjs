import type { ColumnSpec } from '../ir/index.js';

/**
 * Input to `columnLayoutPass`.
 *
 * `containerWidth` is the horizontal pixel budget for the column
 * row (typically the chart pane's `clientWidth`). The pass uses it
 * to distribute flex weights — explicit-width columns take their
 * declared width first, then `(containerWidth - explicitTotal)` is
 * distributed proportionally across `flex`-only columns.
 *
 * `defaultColumnWidth` + `defaultMinColumnWidth` come from the
 * chronix-table theme but are passed as inputs (not pulled from a
 * global) to keep this pass pure + easily testable.
 */
export interface ColumnLayoutInput {
  /**
   * The full list of columns (visible + hidden). The pass filters
   * out `hide: true` columns internally.
   */
  readonly columns: readonly ColumnSpec[];

  /** Horizontal pixel budget available for column distribution. */
  readonly containerWidth: number;

  /**
   * Width used for columns that declare neither `width` nor
   * `flex`. Typically `theme.defaultColumnWidth` (= 100).
   */
  readonly defaultColumnWidth: number;

  /**
   * Lower clamp used when a column omits its own `minWidth`.
   * Typically `theme.defaultMinColumnWidth` (= 40).
   */
  readonly defaultMinColumnWidth: number;
}

/**
 * Output of `columnLayoutPass`.
 *
 * `widthByColId` is the resolved post-layout width in pixels for
 * each visible column. Iteration is by `visibleColumns` (which
 * preserves the input order, minus hidden columns).
 *
 * `totalWidth` is the sum of all resolved widths. It can exceed
 * `containerWidth` when explicit widths + minWidth clamps push
 * past the budget — chronix-table treats this as a horizontal
 * scroll case (adapter renders a scroll viewport).
 */
export interface ColumnLayoutResult {
  /** Map of `column.id` → resolved pixel width (visible columns only). */
  readonly widthByColId: Readonly<Record<string, number>>;

  /** Sum of widths across `visibleColumns`. */
  readonly totalWidth: number;

  /** Input columns minus `hide: true` entries; preserves input order. */
  readonly visibleColumns: readonly ColumnSpec[];
}

/**
 * Resolve per-column widths.
 *
 * Algorithm:
 *
 * 1. **Filter hidden:** drop columns where `hide === true`. Hidden
 *    columns are excluded from `widthByColId`, `totalWidth`, and
 *    `visibleColumns`.
 *
 * 2. **Classify visible columns** into two buckets:
 *    - "Pinned": columns with explicit `width` set, OR columns
 *      with neither `width` nor `flex` (default-width). These
 *      take their declared (or default) width.
 *    - "Flex": columns with `flex` set and no `width`. These
 *      share the remaining width budget proportionally to their
 *      flex weights.
 *
 * 3. **Sum pinned widths.** `remaining = containerWidth - pinnedTotal`.
 *    If `remaining < 0`, flex columns get their `minWidth` clamp
 *    (no negative widths).
 *
 * 4. **Distribute flex** across columns:
 *    `colWidth = remaining * (col.flex / sumOfFlex)`.
 *
 * 5. **Clamp min/max** for every column. `min = col.minWidth ??
 *    defaultMinColumnWidth`; `max = col.maxWidth ?? Infinity`.
 *
 * 6. Return `widthByColId` keyed by column id + sum + visible list.
 *
 * **Total can exceed container.** When explicit widths + min clamps
 * push past `containerWidth`, the pass does NOT shrink columns
 * below their declared minimums. Adapters render the overflow as
 * horizontal scroll. This matches the typical data-grid contract.
 *
 * **Floating-point widths.** The pass returns fractional pixel
 * widths (e.g., `42.857142...` when distributing 300 across 7
 * flex:1 columns). Adapters round at render time per their
 * DPR-aware snapping convention.
 */
export function columnLayoutPass(input: ColumnLayoutInput): ColumnLayoutResult {
  const visibleColumns = input.columns.filter((c) => c.hide !== true);

  // Classify columns.
  const pinned: { col: ColumnSpec; rawWidth: number }[] = [];
  const flex: { col: ColumnSpec; weight: number }[] = [];
  for (const col of visibleColumns) {
    if (col.width != null) {
      pinned.push({ col, rawWidth: col.width });
    } else if (col.flex != null && col.flex > 0) {
      flex.push({ col, weight: col.flex });
    } else {
      // No width + no flex → default-width treated as pinned.
      pinned.push({ col, rawWidth: input.defaultColumnWidth });
    }
  }

  // Distribute remaining width across flex columns.
  let pinnedTotal = 0;
  for (const p of pinned) {
    pinnedTotal += p.rawWidth;
  }
  const flexBudget = Math.max(0, input.containerWidth - pinnedTotal);
  const flexWeightSum = flex.reduce((sum, f) => sum + f.weight, 0);
  const flexShareById = new Map<string, number>();
  if (flexWeightSum > 0) {
    for (const f of flex) {
      flexShareById.set(f.col.id, flexBudget * (f.weight / flexWeightSum));
    }
  } else {
    // No flex columns; no distribution needed.
    for (const f of flex) {
      flexShareById.set(f.col.id, 0);
    }
  }

  // Compute final widths with min/max clamps.
  const widthByColId: Record<string, number> = {};
  let totalWidth = 0;
  for (const col of visibleColumns) {
    const raw = resolveRawWidth(col, flexShareById, input.defaultColumnWidth);
    const min = col.minWidth ?? input.defaultMinColumnWidth;
    const max = col.maxWidth ?? Number.POSITIVE_INFINITY;
    const clamped = Math.min(Math.max(raw, min), max);
    widthByColId[col.id] = clamped;
    totalWidth += clamped;
  }

  return { widthByColId, totalWidth, visibleColumns };
}

function resolveRawWidth(
  col: ColumnSpec,
  flexShareById: ReadonlyMap<string, number>,
  defaultColumnWidth: number,
): number {
  if (col.width != null) return col.width;
  if (col.flex != null && col.flex > 0) return flexShareById.get(col.id) ?? 0;
  return defaultColumnWidth;
}

import type { RowSpec } from '../ir/index.js';

/**
 * Input to `rowLayoutPass`.
 *
 * `defaultRowHeight` comes from the chronix-table theme
 * (`theme.rowHeight`) but is passed as input (not pulled from a
 * global) to keep this pass pure + easily testable.
 */
export interface RowLayoutInput {
  /** Rows in display order. Every row gets a strip in the output. */
  readonly rows: readonly RowSpec[];

  /**
   * Uniform per-row height in pixels, used when a row has no
   * `heightHint`. Typically `theme.rowHeight` (= 28).
   */
  readonly defaultRowHeight: number;

  /**
   * -C (2026-05-30): per-row external height override map.
   * When a row's id is present in this map AND the mapped value is a
   * finite number, the row's resolved height is the override value,
   * winning over both `row.heightHint` and `defaultRowHeight`.
   *
   * Used by adapters wiring `enableRowAutoHeight: true` — the SFC's
   * ResizeObserver writes measured row heights into a reactive map,
   * the composable threads the map into `rowLayoutPass`, and the
   * pass uses the measured heights as the source of truth.
   *
   * Defaults to `undefined` — no overrides, identity behavior matches
   * the pre-Phase-46 algorithm exactly.
   */
  readonly rowHeightOverridesByRowId?: Readonly<Record<string, number>>;
}

/**
 * Output of `rowLayoutPass`.
 *
 * `rowYByRowId` is the Y coordinate (in pixels) of each row's TOP
 * edge inside the body's coordinate space; `rowHeightByRowId` is the
 * resolved per-row height. Adapters bind these to absolute-positioned
 * row elements:
 *
 * ```ts
 * style: {
 *   position: 'absolute',
 *   top: `${rowYByRowId[row.id]}px`,
 *   height: `${rowHeightByRowId[row.id]}px`,
 * }
 * ```
 *
 * `totalBodyHeight` is the explicit height the body container must
 * carry so absolute-positioned rows have a containing block tall
 * enough for the last row's bottom edge.
 *
 * `visibleRows` is the same array passed in (has no hide
 * mechanism for rows — every row contributes a strip). Returned as
 * part of the result so future phases that filter rows
 * (`filterPass`, `virtualRowsPass`) preserve the same shape.
 */
export interface RowLayoutResult {
  /** Map of `row.id` → resolved top-edge Y in pixels. */
  readonly rowYByRowId: Readonly<Record<string, number>>;

  /** Map of `row.id` → resolved height in pixels. */
  readonly rowHeightByRowId: Readonly<Record<string, number>>;

  /** Sum of all resolved row heights; the body container's explicit pixel height. */
  readonly totalBodyHeight: number;

  /** Same rows as input (identity-preserving); declared for forward-compatibility. */
  readonly visibleRows: readonly RowSpec[];
}

/**
 * Resolve per-row Y positions + heights.
 *
 * Algorithm:
 *
 * 1. **Iterate rows top-down** in input order.
 * 2. **Resolve each row's height** as `row.heightHint ?? defaultRowHeight`.
 *    The `heightHint` field on `RowSpec` (extension) lets
 *    consumers vary individual row heights without affecting the
 *    uniform default.
 * 3. **Accumulate Y top-down**: row N's `y = sum of heights[0..N-1]`.
 *    Row 0 is at `y = 0`. No inter-row spacing (omits
 *    `rowSpacing` from the theme — adding it requires a downstream
 *    consumer + a theme token; deferred to a future polish phase).
 * 4. **`totalBodyHeight` = sum of all resolved heights** = the Y past
 *    the last row's bottom edge.
 *
 * **Pure function.** Zero side effects; same input always produces
 * the same output. Adapters call this on each layout pass + cache
 * outside the function.
 *
 * **For-of iteration.** uses a `for..of` loop (matches
 * eslint's `@typescript-eslint/prefer-for-of` rule) — the body
 * doesn't need an index. chronix-gantt's analog uses indexed
 * iteration only because it accumulates `rowSpacing` between rows
 * (skipped after the last row); chronix-table's has no
 * spacing, so the loop is index-free.
 */
export function rowLayoutPass(input: RowLayoutInput): RowLayoutResult {
  const rowYByRowId: Record<string, number> = {};
  const rowHeightByRowId: Record<string, number> = {};
  const overrides = input.rowHeightOverridesByRowId;
  let y = 0;
  for (const row of input.rows) {
    // -C (2026-05-30): external override wins over heightHint
    // wins over defaultRowHeight. Non-finite override values (NaN /
    // Infinity / -Infinity) fall through to the next tier.
    const overrideValue = overrides?.[row.id];
    const useOverride = typeof overrideValue === 'number' && Number.isFinite(overrideValue);
    const height = useOverride ? overrideValue : (row.heightHint ?? input.defaultRowHeight);
    rowYByRowId[row.id] = y;
    rowHeightByRowId[row.id] = height;
    y += height;
  }
  return {
    rowYByRowId,
    rowHeightByRowId,
    totalBodyHeight: y,
    visibleRows: input.rows,
  };
}

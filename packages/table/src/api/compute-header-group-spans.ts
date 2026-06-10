import type { ColumnSpec } from '../ir/column-spec.js';

/**
 * Phase 23 (2026-05-27) / Phase 23.1 (2026-05-27): a single column-group
 * span over a contiguous run of visible columns that share the same
 * group label at a given nesting level (or a singleton run of an
 * un-grouped column / a column whose path is shorter than this level
 * with `groupName: null`).
 *
 * The adapter renders one DOM cell per span on the corresponding group
 * row:
 * - `groupName != null` → labelled group cell with `data-group-name`
 *   attr that participates in the `header-group-click` emit.
 * - `groupName == null` → empty placeholder cell (no label, no click
 *   emit) sized to the singleton column's full width so the leaf header
 *   row beneath stays vertically aligned with grouped siblings.
 *
 * `startColIdx` + `endColIdx` are inclusive indices into the input
 * `visibleColumns` array. `colIds` is the parallel `id` list (length =
 * `endColIdx - startColIdx + 1`). Within a single level, spans never
 * overlap; concatenating all spans' `colIds` reproduces the input
 * column ids in author order.
 */
export interface HeaderGroupSpan {
  /** Group label at this level, or `null` for an un-grouped placeholder. */
  readonly groupName: string | null;
  /** Inclusive start index into the input `visibleColumns`. */
  readonly startColIdx: number;
  /** Inclusive end index into the input `visibleColumns`. */
  readonly endColIdx: number;
  /** Author-order column ids covered by this span. */
  readonly colIds: readonly string[];
}

/**
 * Phase 23 (single-level) / Phase 23.1 (2026-05-27, nested-level):
 * walk `visibleColumns` left-to-right and produce one row of
 * `HeaderGroupSpan[]` per nesting level (outermost level at index 0).
 *
 * **Field shape** (Decision A.1):
 *
 * - `headerGroup` is `undefined` → no group at any level; path = `[]`.
 * - `headerGroup` is a `string` → single-level group; path = `[string]`.
 * - `headerGroup` is a `readonly string[]` → explicit path from root
 *   to the immediate parent group; path = the array as-is.
 *
 * **Output shape** (Decision B.1):
 *
 * - `[]` when no column declares any group (auto-detected depth 0 AND
 *   no `maxDepth` override).
 * - `readonly HeaderGroupSpan[][]` otherwise; outer length = effective
 *   depth; inner spans cover ALL visible columns at that level (a
 *   column whose path is shorter than the level produces a singleton
 *   empty-placeholder span).
 *
 * **Per-level merge rule**: two adjacent column cells at level L merge
 * into a single span IFF:
 *
 * 1. They are adjacent in `visibleColumns`,
 * 2. Both have a non-null name at level L (path long enough),
 * 3. Their level-L names match,
 * 4. AND their parent path `[0..L-1]` is identical (so two columns
 *    sharing the same level-1 group name but different level-0
 *    parents DO NOT merge — preserves the visual taxonomy).
 *
 * Empty placeholder cells (`groupName === null`) are NEVER merged;
 * each leaf column produces its own singleton-width placeholder so
 * the leaf row beneath stays vertically aligned with grouped siblings
 * (Phase 23 Decision B.1).
 *
 * **`maxDepth` parameter** (Decision B.1):
 *
 * When omitted, the helper auto-detects depth from input paths (returns
 * `[]` when auto-depth is 0).
 *
 * When provided AND larger than the auto-detected depth, the helper
 * PADS the output with all-empty-placeholder rows at the TOP — the
 * caller passes the table-wide max depth (across all zones) so each
 * zone's per-call output has the same number of rows + the cross-zone
 * group rows visually align.
 *
 * When provided BUT smaller than the auto-detected depth (defensive),
 * the auto-detected depth wins; the helper never truncates.
 *
 * **Zone-split is the caller's responsibility.** Per Phase 23 Decision
 * A.1, groups never span pinned-zone boundaries — the adapter calls
 * `computeHeaderGroupSpans` SEPARATELY for each zone's column list,
 * passing the table-wide max depth as `maxDepth` to keep zone rows
 * aligned.
 *
 * Pure function. No DOM. No side effects.
 */
export function computeHeaderGroupSpans(
  visibleColumns: readonly ColumnSpec[],
  maxDepth?: number,
): readonly (readonly HeaderGroupSpan[])[] {
  if (visibleColumns.length === 0) return [];
  const paths: readonly (readonly string[])[] = visibleColumns.map((col) => pathOf(col));
  let autoDepth = 0;
  for (const p of paths) {
    if (p.length > autoDepth) autoDepth = p.length;
  }
  const effectiveDepth = maxDepth != null && maxDepth > autoDepth ? maxDepth : autoDepth;
  if (effectiveDepth === 0) return [];
  const padTop = effectiveDepth - autoDepth;
  const levels: HeaderGroupSpan[][] = [];
  // Pad-top: when caller asks for more levels than auto-detected, add
  // all-empty rows at the TOP. The visual story: a deeper-table zone's
  // top-level group row aligns with this zone's empty-placeholder row.
  for (let p = 0; p < padTop; p++) {
    const placeholderRow: HeaderGroupSpan[] = [];
    for (let i = 0; i < visibleColumns.length; i++) {
      placeholderRow.push({
        groupName: null,
        startColIdx: i,
        endColIdx: i,
        colIds: [visibleColumns[i]!.id],
      });
    }
    levels.push(placeholderRow);
  }
  for (let L = 0; L < autoDepth; L++) {
    const spans: HeaderGroupSpan[] = [];
    for (let i = 0; i < visibleColumns.length; i++) {
      const path = paths[i]!;
      const colId = visibleColumns[i]!.id;
      const name: string | null = path.length > L ? path[L]! : null;
      const last = spans.length > 0 ? spans[spans.length - 1]! : undefined;
      const canExtend =
        last != null &&
        name != null &&
        last.groupName === name &&
        parentsMatch(paths[last.startColIdx]!, path, L);
      if (canExtend) {
        spans[spans.length - 1] = {
          groupName: last.groupName,
          startColIdx: last.startColIdx,
          endColIdx: i,
          colIds: [...last.colIds, colId],
        };
      } else {
        spans.push({
          groupName: name,
          startColIdx: i,
          endColIdx: i,
          colIds: [colId],
        });
      }
    }
    levels.push(spans);
  }
  return levels;
}

/**
 * Normalize a column's `headerGroup` field to a readonly path. The
 * string shortcut form is wrapped into a 1-element array so all
 * downstream logic treats paths uniformly.
 */
function pathOf(col: ColumnSpec): readonly string[] {
  const hg = col.headerGroup;
  if (hg == null) return [];
  if (typeof hg === 'string') return [hg];
  return hg;
}

/**
 * True when the parent paths of two columns agree up to (but not
 * including) the given level L. For L = 0 the parent range is empty
 * so the function returns true unconditionally.
 */
function parentsMatch(a: readonly string[], b: readonly string[], L: number): boolean {
  for (let i = 0; i < L; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

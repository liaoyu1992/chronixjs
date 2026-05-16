import type { BarStackHeightPassInput, BarStackHeightPassOutput } from './types.js';

/**
 * Derives per-row heights from event stacking. Phase 2 pre-pass for
 * `RowSwimlaneLayout`: caller pipes `heightsPerRow` (or the by-id map)
 * into `RowSpec.heightHint` so swimlanes accommodate the bars that
 * will land on each row.
 *
 * Algorithm:
 *   1. Filter bars to those that intersect the axis time range — bars
 *      entirely off-axis don't push their row taller.
 *   2. Group remaining bars by `rowId`.
 *   3. Per row, greedily interval-color the bars into vertical levels
 *      (sort by start, place each bar in the lowest level whose latest
 *      bar ended before this one starts; otherwise add a new level).
 *   4. Row height = `firstBarTopPadding + (maxLevel × (barHeight +
 *      barStackSpacing) + barHeight) + lastBarBottomPadding`, floored at
 *      `minRowHeight`.
 *
 * Logical heights only — does not model render-time CSS borders. Pair
 * with `RowSwimlaneLayout.rowSpacing` if the renderer adds a divider
 * between strips.
 */
export interface BarStackHeightPass {
  compute(input: BarStackHeightPassInput): BarStackHeightPassOutput;
}

export const defaultBarStackHeightPass: BarStackHeightPass = {
  compute(input) {
    const barHeight = input.barHeight ?? 30;
    const stackSpacing = input.barStackSpacing ?? 10;
    const topPadding = input.firstBarTopPadding ?? 8;
    const bottomPadding = input.lastBarBottomPadding ?? 4;
    const minRowHeight = input.minRowHeight ?? barHeight + topPadding;

    const axisStartMs = input.axis.ticks[0]?.time.getTime() ?? 0;
    const axisEndMs = axisStartMs + input.axis.slotCount * input.axis.slotDurationMs;

    // Bucket bars by rowId, dropping those outside the axis range.
    // Intersection rule: bar.start < axisEnd AND bar.end > axisStart.
    // A bar exactly touching the boundary (end == axisStart) is treated
    // as out — its rendered width would be 0.
    //
    // Phase 30: bucket entries carry the bar `id` so per-bar level
    // assignments survive into the output. Pre-Phase-30 the bucket was
    // anonymous `{ start, end }` shapes.
    interface BucketedBar {
      readonly id: string;
      readonly start: number;
      readonly end: number;
    }
    const barsByRow = new Map<string, BucketedBar[]>();
    for (const bar of input.bars) {
      const startMs = bar.range.start.getTime();
      const endMs = bar.range.end.getTime();
      if (startMs >= axisEndMs || endMs <= axisStartMs) continue;
      const list = barsByRow.get(bar.rowId);
      const entry: BucketedBar = { id: bar.id, start: startMs, end: endMs };
      if (list) {
        list.push(entry);
      } else {
        barsByRow.set(bar.rowId, [entry]);
      }
    }

    const heightsPerRow: number[] = [];
    const heightByRowId = new Map<string, number>();
    // Phase 30: per-bar level assignments aggregated across all rows.
    // Bars on different rows can reuse the same level number — the
    // downstream placement pass scopes Y by `strip.y` (row-relative)
    // so cross-row level collisions are not a problem.
    const levelByBarId = new Map<string, number>();

    for (const row of input.rows) {
      const bars = barsByRow.get(row.id);
      if (!bars || bars.length === 0) {
        heightsPerRow.push(minRowHeight);
        heightByRowId.set(row.id, minRowHeight);
        continue;
      }
      const { maxLevel, perBarLevels } = assignStackLevels(bars);
      for (const [barId, level] of perBarLevels) {
        levelByBarId.set(barId, level);
      }
      const stackedHeight = maxLevel * (barHeight + stackSpacing) + barHeight;
      const computed = topPadding + stackedHeight + bottomPadding;
      const height = Math.max(minRowHeight, computed);
      heightsPerRow.push(height);
      heightByRowId.set(row.id, height);
    }

    return { heightsPerRow, heightByRowId, levelByBarId };
  },
};

/**
 * Greedy interval coloring over a sorted-by-start copy of `bars`.
 * Returns the highest level index used (0 for non-overlapping bars on
 * one level) AND the per-bar level assignment. Tie-break by end
 * ascending so a longer bar doesn't bump a shorter equal-start sibling
 * unnecessarily.
 *
 * Phase 30: extended from the original `computeMaxLevel` to also return
 * the per-bar level map. Same algorithm; just no longer discards the
 * intermediate `assigned` values.
 */
function assignStackLevels(bars: readonly { id: string; start: number; end: number }[]): {
  maxLevel: number;
  perBarLevels: ReadonlyMap<string, number>;
} {
  const sorted = [...bars].sort((a, b) => a.start - b.start || a.end - b.end);
  const levelEnds: number[] = [];
  const perBarLevels = new Map<string, number>();
  let maxLevel = 0;
  for (const bar of sorted) {
    let assigned = -1;
    for (let l = 0; l < levelEnds.length; l += 1) {
      const end = levelEnds[l];
      if (end !== undefined && end <= bar.start) {
        assigned = l;
        levelEnds[l] = bar.end;
        break;
      }
    }
    if (assigned === -1) {
      levelEnds.push(bar.end);
      assigned = levelEnds.length - 1;
    }
    perBarLevels.set(bar.id, assigned);
    if (assigned > maxLevel) maxLevel = assigned;
  }
  return { maxLevel, perBarLevels };
}

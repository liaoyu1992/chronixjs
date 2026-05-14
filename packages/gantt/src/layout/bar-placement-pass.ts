import type { BarPlacementPassInput, BarPlacementPassOutput, PlacedBar } from './types.js';

/**
 * Phase 2 layout pass #3 — the bridge from `BarSpec` to pixel
 * placement. Combines the X axis (`PlannedAxis`) and Y swimlanes
 * (`SwimlaneStrip[]`) to compute `{ x, y, width, height }` per bar.
 *
 * Depends on the outputs of `AxisRangePlanner` and `RowSwimlaneLayout`;
 * does not depend on `BarSpec.range` being inside the axis range — bars
 * outside are placed with x / width that may exceed the axis bounds,
 * leaving the clip to the render layer.
 */
export interface BarPlacementPass {
  place(input: BarPlacementPassInput): BarPlacementPassOutput;
}

export const defaultBarPlacementPass: BarPlacementPass = {
  place(input) {
    const padding = input.barVerticalPadding ?? 2;
    const explicitBarHeight = input.barHeight;
    const axisStartMs = input.axis.ticks[0]?.time.getTime() ?? 0;
    const pxPerMs = input.axis.slotWidth / input.axis.slotDurationMs;

    // Index strips by rowId for O(1) lookup; bar sets can reach hundreds.
    const stripsByRow = new Map(input.strips.map((s) => [s.rowId, s]));

    const placedBars: PlacedBar[] = [];
    const orphanBarIds: string[] = [];

    for (const bar of input.bars) {
      const strip = stripsByRow.get(bar.rowId);
      if (!strip) {
        orphanBarIds.push(bar.id);
        continue;
      }
      const startMs = bar.range.start.getTime();
      const endMs = bar.range.end.getTime();
      // Two height modes:
      // - explicit barHeight: top-aligned with padding, bar overflows if
      //   strip.height < padding + barHeight (caller's contract).
      // - implicit: symmetric padding fills the strip (legacy v0).
      const height = explicitBarHeight ?? Math.max(0, strip.height - 2 * padding);
      placedBars.push({
        barId: bar.id,
        x: (startMs - axisStartMs) * pxPerMs,
        y: strip.y + padding,
        width: (endMs - startMs) * pxPerMs,
        height,
      });
    }

    return { placedBars, orphanBarIds };
  },
};

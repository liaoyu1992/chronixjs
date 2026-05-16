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
    // Phase 27: axis end in calendar time. Derived from
    // `slotCount × slotDurationMs` so it stays correct for views with
    // discontinuous tick times (e.g. `weekendsVisible: false`, where
    // ticks skip Sat/Sun but the dense-packed axis still covers a
    // calendar span equal to slotCount visible days). Used to
    // populate per-bar `isStart` / `isEnd` flags.
    const axisEndMs = axisStartMs + input.axis.slotCount * input.axis.slotDurationMs;
    // Phase 30: per-bar stack-level offset. When `levelByBarId` is
    // omitted (or a bar is absent from the map), the bar lands on
    // level 0 — same Y as pre-Phase-30. The offset per level is
    // `(barHeight ?? strip.height) + stackSpacing`; explicit-barHeight
    // mode uses the configured bar height, implicit mode uses the
    // strip's full height (the legacy single-level behavior is
    // preserved for symmetric-padding callers).
    const stackSpacing = input.barStackSpacing ?? 10;
    const levelByBarId = input.levelByBarId;

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
      // Phase 30: per-bar level offset. Per-level distance =
      // (explicit barHeight if set, else strip's filled height) + stackSpacing.
      // For implicit-height callers (no explicit barHeight) the strip
      // already contains exactly one bar's worth of vertical space, so
      // they should never request level > 0 — `BarStackHeightPass`
      // doesn't expand row heights for them either. Defensive default
      // to level 0 if the map says otherwise.
      const level = levelByBarId?.get(bar.id) ?? 0;
      const offsetPerLevel = (explicitBarHeight ?? height) + stackSpacing;
      placedBars.push({
        barId: bar.id,
        x: (startMs - axisStartMs) * pxPerMs,
        y: strip.y + padding + level * offsetPerLevel,
        width: (endMs - startMs) * pxPerMs,
        height,
        // Phase 27: continuation flags. A bar whose start sits AT
        // axisStartMs (`startMs === axisStartMs`) is considered
        // "starts at axis" (isStart=true) — only bars genuinely
        // before the axis get `!isStart`. Same convention for end:
        // a bar ending exactly at axisEndMs has isEnd=true (its
        // last tick coincides with the axis's first hidden slot,
        // not "extends past").
        isStart: startMs >= axisStartMs,
        isEnd: endMs <= axisEndMs,
      });
    }

    return { placedBars, orphanBarIds };
  },
};

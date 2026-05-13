import type { RowSwimlaneLayoutInput, RowSwimlaneLayoutOutput, SwimlaneStrip } from './types.js';

/**
 * Resolves Y positions and heights for every row in the timeline body.
 * Phase 2 layout pass #2 — independent of `AxisRangePlanner` (X axis) so
 * the two passes can run in any order or in parallel.
 *
 * v0 contract is a flat top-to-bottom stack at `defaultRowHeight` (or the
 * row's `heightHint` override). Tree-aware grouping (parent/child rows,
 * expand/collapse) lives in v1 once a demo exercises it.
 */
export interface RowSwimlaneLayout {
  layout(input: RowSwimlaneLayoutInput): RowSwimlaneLayoutOutput;
}

export const defaultRowSwimlaneLayout: RowSwimlaneLayout = {
  layout(input) {
    const strips: SwimlaneStrip[] = [];
    let y = 0;
    for (const row of input.rows) {
      const height = row.heightHint ?? input.defaultRowHeight;
      strips.push({ rowId: row.id, y, height });
      y += height;
    }
    return { strips, totalHeight: y };
  },
};

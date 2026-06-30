import type { RowSwimlaneLayoutInput, RowSwimlaneLayoutOutput, SwimlaneStrip } from './types.js';

/**
 * Resolves Y positions and heights for every row in the timeline body.
 * layout pass #2 — independent of `AxisRangePlanner` (X axis) so
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
    const rowSpacing = input.rowSpacing ?? 0;
    const strips: SwimlaneStrip[] = [];
    let y = 0;
    for (let i = 0; i < input.rows.length; i += 1) {
      const row = input.rows[i];
      // Defensive — TS `noUncheckedIndexedAccess` lets `input.rows[i]` be
      // undefined; cannot happen during the loop but the type system
      // doesn't know that.
      if (!row) continue;
      const height = row.heightHint ?? input.defaultRowHeight;
      strips.push({ rowId: row.id, y, height });
      y += height;
      // Add inter-row spacing AFTER each strip except the last so the
      // total height matches the visible footprint of N strips + N-1
      // dividers.
      if (i < input.rows.length - 1) y += rowSpacing;
    }
    return { strips, totalHeight: y };
  },
};

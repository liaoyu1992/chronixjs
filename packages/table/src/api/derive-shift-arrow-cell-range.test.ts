import { describe, expect, it } from 'vitest';

import { deriveShiftArrowCellRange } from './derive-shift-arrow-cell-range.js';

import type { CellRange, CellRef } from './compute-cell-range-envelope.js';

describe('deriveShiftArrowCellRange', () => {
  const a1: CellRef = { rowId: 'r1', colId: 'a' };
  const a2: CellRef = { rowId: 'r1', colId: 'b' };
  const a3: CellRef = { rowId: 'r2', colId: 'b' };

  it('opens a fresh range with activeCell as anchor when no current range', () => {
    expect(deriveShiftArrowCellRange(null, a1, a2)).toEqual({ anchor: a1, focus: a2 });
  });

  it('uses newActive as anchor when no current range AND no activeCell (degenerate 1x1)', () => {
    expect(deriveShiftArrowCellRange(null, null, a2)).toEqual({ anchor: a2, focus: a2 });
  });

  it('keeps current range anchor + updates focus to newActive', () => {
    const current: CellRange = { anchor: a1, focus: a2 };
    expect(deriveShiftArrowCellRange(current, a2, a3)).toEqual({ anchor: a1, focus: a3 });
  });

  it('returns equivalent range when newActive equals current focus (caller dedups)', () => {
    const current: CellRange = { anchor: a1, focus: a2 };
    expect(deriveShiftArrowCellRange(current, a2, a2)).toEqual({ anchor: a1, focus: a2 });
  });

  it('returns degenerate 1x1 range when activeCell same as newActive (no movement)', () => {
    expect(deriveShiftArrowCellRange(null, a1, a1)).toEqual({ anchor: a1, focus: a1 });
  });

  it('preserves current range anchor even when anchor differs from activeCell', () => {
    // Covers the case where the range was established via drag (anchor != activeCell)
    // and then the user uses keyboard to extend — anchor stays put.
    const current: CellRange = { anchor: a1, focus: a3 };
    expect(deriveShiftArrowCellRange(current, a2, a3)).toEqual({ anchor: a1, focus: a3 });
  });
});

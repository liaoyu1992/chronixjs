import { describe, expect, it } from 'vitest';

import { computeDragFillEnvelope } from './compute-drag-fill-envelope.js';

import type { CellRangeEnvelope } from './compute-cell-range-envelope.js';

const displayedRowIds = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'];
const displayedColIds = ['name', 'qty', 'price', 'notes'];

describe('computeDragFillEnvelope', () => {
  it('pointer below source → extends vertically', () => {
    const source: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    const out = computeDragFillEnvelope(
      source,
      { rowId: 'r4', colId: 'qty' },
      displayedRowIds,
      displayedColIds,
    );
    expect(out).toEqual({ rowIds: ['r1', 'r2', 'r3', 'r4'], colIds: ['qty'] });
  });

  it('pointer right of source → extends horizontally', () => {
    const source: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['name'] };
    const out = computeDragFillEnvelope(
      source,
      { rowId: 'r1', colId: 'price' },
      displayedRowIds,
      displayedColIds,
    );
    expect(out).toEqual({ rowIds: ['r1'], colIds: ['name', 'qty', 'price'] });
  });

  it('pointer diagonal with equal deltas → axis-lock prefers vertical (row-delta tie-break)', () => {
    // source: r1×qty (1×1). Pointer: r3×price → deltaRow=2, deltaCol=2.
    // Math.abs(2) >= Math.abs(2) AND deltaRow > 0 → vertical branch.
    const source: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    const out = computeDragFillEnvelope(
      source,
      { rowId: 'r3', colId: 'price' },
      displayedRowIds,
      displayedColIds,
    );
    expect(out).toEqual({ rowIds: ['r1', 'r2', 'r3'], colIds: ['qty'] });
  });

  it('pointer diagonal with horizontal delta dominant → extends horizontally', () => {
    // source: r1×qty (1×1). Pointer: r2×notes → deltaRow=1, deltaCol=2.
    // Math.abs(2) > Math.abs(1) → horizontal branch.
    const source: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    const out = computeDragFillEnvelope(
      source,
      { rowId: 'r2', colId: 'notes' },
      displayedRowIds,
      displayedColIds,
    );
    expect(out).toEqual({ rowIds: ['r1'], colIds: ['qty', 'price', 'notes'] });
  });

  it('pointer inside source → returns source unchanged', () => {
    const source: CellRangeEnvelope = {
      rowIds: ['r1', 'r2', 'r3'],
      colIds: ['name', 'qty'],
    };
    const out = computeDragFillEnvelope(
      source,
      { rowId: 'r2', colId: 'name' },
      displayedRowIds,
      displayedColIds,
    );
    expect(out).toBe(source);
  });

  it('pointer above-left of source → returns source unchanged (both deltas ≤ 0)', () => {
    const source: CellRangeEnvelope = { rowIds: ['r3', 'r4'], colIds: ['qty', 'price'] };
    const out = computeDragFillEnvelope(
      source,
      { rowId: 'r1', colId: 'name' },
      displayedRowIds,
      displayedColIds,
    );
    expect(out).toBe(source);
  });

  it('empty source → returns EMPTY_CELL_RANGE_ENVELOPE; pointer outside displayed → returns source unchanged', () => {
    const empty: CellRangeEnvelope = { rowIds: [], colIds: [] };
    expect(
      computeDragFillEnvelope(
        empty,
        { rowId: 'r1', colId: 'qty' },
        displayedRowIds,
        displayedColIds,
      ),
    ).toEqual({ rowIds: [], colIds: [] });

    const source: CellRangeEnvelope = { rowIds: ['r1'], colIds: ['qty'] };
    // Pointer rowId not in displayed → returns source unchanged.
    expect(
      computeDragFillEnvelope(
        source,
        { rowId: 'r99', colId: 'qty' },
        displayedRowIds,
        displayedColIds,
      ),
    ).toBe(source);
    // Pointer colId not in displayed → returns source unchanged.
    expect(
      computeDragFillEnvelope(
        source,
        { rowId: 'r1', colId: 'unknown' },
        displayedRowIds,
        displayedColIds,
      ),
    ).toBe(source);
  });
});

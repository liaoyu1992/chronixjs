import { describe, expect, it } from 'vitest';

import { columnLayoutPass } from './column-layout-pass.js';

import type { ColumnSpec } from '../ir/index.js';

interface InputOverrides {
  containerWidth?: number;
  defaultColumnWidth?: number;
  defaultMinColumnWidth?: number;
}

const DEFAULTS = {
  containerWidth: 800,
  defaultColumnWidth: 100,
  defaultMinColumnWidth: 40,
};

function makeInput(columns: readonly ColumnSpec[], overrides: InputOverrides = {}) {
  return {
    columns,
    containerWidth: overrides.containerWidth ?? DEFAULTS.containerWidth,
    defaultColumnWidth: overrides.defaultColumnWidth ?? DEFAULTS.defaultColumnWidth,
    defaultMinColumnWidth: overrides.defaultMinColumnWidth ?? DEFAULTS.defaultMinColumnWidth,
  };
}

describe('columnLayoutPass', () => {
  it('returns empty result for empty input', () => {
    const result = columnLayoutPass(makeInput([]));
    expect(result.widthByColId).toEqual({});
    expect(result.totalWidth).toBe(0);
    expect(result.visibleColumns).toEqual([]);
  });

  it('honors a single column with explicit width', () => {
    const result = columnLayoutPass(makeInput([{ id: 'c1', width: 250 }]));
    expect(result.widthByColId).toEqual({ c1: 250 });
    expect(result.totalWidth).toBe(250);
    expect(result.visibleColumns.map((c) => c.id)).toEqual(['c1']);
  });

  it('uses defaultColumnWidth when neither width nor flex is set', () => {
    const result = columnLayoutPass(makeInput([{ id: 'c1' }, { id: 'c2' }]));
    expect(result.widthByColId).toEqual({ c1: 100, c2: 100 });
    expect(result.totalWidth).toBe(200);
  });

  it('distributes container width equally across 3 flex:1 columns (with no explicit columns)', () => {
    const result = columnLayoutPass(
      makeInput([
        { id: 'c1', flex: 1 },
        { id: 'c2', flex: 1 },
        { id: 'c3', flex: 1 },
      ]),
    );
    // 800 / 3 = 266.666...
    expect(result.widthByColId['c1']).toBeCloseTo(800 / 3);
    expect(result.widthByColId['c2']).toBeCloseTo(800 / 3);
    expect(result.widthByColId['c3']).toBeCloseTo(800 / 3);
    expect(result.totalWidth).toBeCloseTo(800);
  });

  it('distributes weighted flex (1:2:1) across the available budget', () => {
    const result = columnLayoutPass(
      makeInput([
        { id: 'c1', flex: 1 },
        { id: 'c2', flex: 2 },
        { id: 'c3', flex: 1 },
      ]),
    );
    // sumWeights = 4; c1 = 800 * 1/4 = 200; c2 = 800 * 2/4 = 400; c3 = 200.
    expect(result.widthByColId['c1']).toBeCloseTo(200);
    expect(result.widthByColId['c2']).toBeCloseTo(400);
    expect(result.widthByColId['c3']).toBeCloseTo(200);
    expect(result.totalWidth).toBeCloseTo(800);
  });

  it('subtracts explicit widths from the flex budget', () => {
    const result = columnLayoutPass(
      makeInput([
        { id: 'c1', width: 200 },
        { id: 'c2', flex: 1 },
        { id: 'c3', flex: 1 },
      ]),
    );
    // explicit pool = 200; flex budget = 600; c2 + c3 split = 300 each.
    expect(result.widthByColId['c1']).toBe(200);
    expect(result.widthByColId['c2']).toBeCloseTo(300);
    expect(result.widthByColId['c3']).toBeCloseTo(300);
    expect(result.totalWidth).toBeCloseTo(800);
  });

  it('respects minWidth when flex would distribute below it', () => {
    // Force a tight container: 2 flex:1 columns sharing 60 px.
    const result = columnLayoutPass(
      makeInput(
        [
          { id: 'c1', flex: 1, minWidth: 50 },
          { id: 'c2', flex: 1, minWidth: 50 },
        ],
        { containerWidth: 60 },
      ),
    );
    // Without clamp each would be 30. minWidth=50 lifts both to 50.
    expect(result.widthByColId['c1']).toBe(50);
    expect(result.widthByColId['c2']).toBe(50);
    expect(result.totalWidth).toBe(100);
  });

  it('respects maxWidth when flex would distribute above it', () => {
    const result = columnLayoutPass(
      makeInput([
        { id: 'c1', flex: 1, maxWidth: 100 },
        { id: 'c2', flex: 1 },
      ]),
    );
    // Without clamp each would be 400. maxWidth=100 caps c1.
    // (Note: chronix's Phase 1 algorithm does not redistribute the
    // saved budget to other flex columns — c2 stays at 400. A
    // later phase may add a redistribute step if needed.)
    expect(result.widthByColId['c1']).toBe(100);
    expect(result.widthByColId['c2']).toBeCloseTo(400);
  });

  it('uses defaultMinColumnWidth when a column omits its own minWidth', () => {
    // Tight container would push flex columns to negative; clamp to default min.
    const result = columnLayoutPass(
      makeInput(
        [
          { id: 'c1', flex: 1 },
          { id: 'c2', flex: 1 },
        ],
        { containerWidth: 0 },
      ),
    );
    expect(result.widthByColId['c1']).toBe(40);
    expect(result.widthByColId['c2']).toBe(40);
  });

  it('excludes hide: true columns from result + totalWidth + visibleColumns', () => {
    const result = columnLayoutPass(
      makeInput([
        { id: 'c1', width: 200 },
        { id: 'c2', width: 200, hide: true },
        { id: 'c3', width: 200 },
      ]),
    );
    expect(result.widthByColId).toEqual({ c1: 200, c3: 200 });
    expect(result.totalWidth).toBe(400);
    expect(result.visibleColumns.map((c) => c.id)).toEqual(['c1', 'c3']);
  });

  it('preserves the visibleColumns order from the input', () => {
    const result = columnLayoutPass(
      makeInput([
        { id: 'c3', width: 50 },
        { id: 'c1', width: 50 },
        { id: 'c2', width: 50 },
      ]),
    );
    expect(result.visibleColumns.map((c) => c.id)).toEqual(['c3', 'c1', 'c2']);
  });

  it('handles totalWidth exceeding containerWidth (horizontal overflow case)', () => {
    const result = columnLayoutPass(
      makeInput(
        [
          { id: 'c1', width: 500 },
          { id: 'c2', width: 500 },
        ],
        { containerWidth: 600 },
      ),
    );
    // Sum 1000 > containerWidth 600 — pass does NOT shrink (adapter renders scroll).
    expect(result.widthByColId['c1']).toBe(500);
    expect(result.widthByColId['c2']).toBe(500);
    expect(result.totalWidth).toBe(1000);
  });
});

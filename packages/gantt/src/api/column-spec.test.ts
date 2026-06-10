import { describe, expect, it } from 'vitest';

import { computeRowSpans, type ColumnSpec } from './column-spec.js';

import type { RowSpec } from '../ir/row-spec.js';

// 5-row grouped dataset shared with the adapter sidebar tests.
// Region: 海口 × 3 / 三亚 × 1 / 广州 × 1.
// Base: 海口基地 × 2 / 空港基地 × 1 / 三亚基地 × 1 / 广州基地 × 1.
// Name: leaf — one cell per row.
const groupedRows: readonly RowSpec[] = [
  { id: 'w1', columns: { region: '海口', base: '海口基地', name: '车间 A' } },
  { id: 'w2', columns: { region: '海口', base: '海口基地', name: '车间 B' } },
  { id: 'w3', columns: { region: '海口', base: '空港基地', name: '车间 C' } },
  { id: 'w4', columns: { region: '三亚', base: '三亚基地', name: '车间 D' } },
  { id: 'w5', columns: { region: '广州', base: '广州基地', name: '车间 E' } },
];

const groupedColumns: readonly ColumnSpec[] = [
  { key: 'region', label: '地区', width: 60, group: true },
  { key: 'base', label: '基地', width: 100, group: true },
  { key: 'name', label: '车间', width: 80 },
];

describe('computeRowSpans (Phase 49 core helper)', () => {
  it('returns an empty matrix for an empty columns array', () => {
    const matrix = computeRowSpans(groupedRows, []);
    expect(matrix).toEqual([]);
  });

  it('non-grouped column produces an array of 1s of length rows.length', () => {
    const matrix = computeRowSpans(groupedRows, [{ key: 'name', label: 'Name', width: 80 }]);
    expect(matrix).toEqual([[1, 1, 1, 1, 1]]);
  });

  it('grouped column collapses adjacent same-value rows into the [N, 0, 0, ..., 0] pattern', () => {
    const matrix = computeRowSpans(groupedRows, [
      { key: 'region', label: 'R', width: 60, group: true },
    ]);
    // 海口 spans 3 rows, 三亚 spans 1, 广州 spans 1.
    expect(matrix).toEqual([[3, 0, 0, 1, 1]]);
  });

  it('non-adjacent same-value rows do NOT merge (gap row breaks the run)', () => {
    const rows: readonly RowSpec[] = [
      { id: 'r1', columns: { region: 'A' } },
      { id: 'r2', columns: { region: 'B' } },
      { id: 'r3', columns: { region: 'A' } },
    ];
    const matrix = computeRowSpans(rows, [{ key: 'region', label: 'R', width: 60, group: true }]);
    expect(matrix).toEqual([[1, 1, 1]]);
  });

  it('multi-column matrix produces independent per-column row-span arrays', () => {
    const matrix = computeRowSpans(groupedRows, groupedColumns);
    expect(matrix[0]).toEqual([3, 0, 0, 1, 1]); // region
    expect(matrix[1]).toEqual([2, 0, 1, 1, 1]); // base — 海口基地 spans 2 rows
    expect(matrix[2]).toEqual([1, 1, 1, 1, 1]); // name — leaf
  });
});

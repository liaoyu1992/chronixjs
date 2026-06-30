import { describe, expect, it } from 'vitest';

import { computeHeaderGroupSpans } from './compute-header-group-spans.js';

import type { ColumnSpec } from '../ir/column-spec.js';

describe('computeHeaderGroupSpans', () => {
  it('returns an empty array when visibleColumns is empty', () => {
    expect(computeHeaderGroupSpans([])).toEqual([]);
  });

  it('returns [] when no column declares headerGroup (auto depth = 0)', () => {
    const cols: ColumnSpec[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(computeHeaderGroupSpans(cols)).toEqual([]);
  });

  it('3 contiguous columns share same string headerGroup → 1-level / 1-span output', () => {
    const cols: ColumnSpec[] = [
      { id: 'a', headerGroup: 'X' },
      { id: 'b', headerGroup: 'X' },
      { id: 'c', headerGroup: 'X' },
    ];
    expect(computeHeaderGroupSpans(cols)).toEqual([
      [
        {
          groupName: 'X',
          startColIdx: 0,
          endColIdx: 2,
          colIds: ['a', 'b', 'c'],
        },
      ],
    ]);
  });

  it('mixed grouped + un-grouped columns at level 0 produces 1 level with mixed spans', () => {
    const cols: ColumnSpec[] = [
      { id: 'a', headerGroup: 'X' },
      { id: 'b', headerGroup: 'X' },
      { id: 'c' },
      { id: 'd', headerGroup: 'Y' },
      { id: 'e', headerGroup: 'Y' },
    ];
    expect(computeHeaderGroupSpans(cols)).toEqual([
      [
        { groupName: 'X', startColIdx: 0, endColIdx: 1, colIds: ['a', 'b'] },
        { groupName: null, startColIdx: 2, endColIdx: 2, colIds: ['c'] },
        { groupName: 'Y', startColIdx: 3, endColIdx: 4, colIds: ['d', 'e'] },
      ],
    ]);
  });

  it('non-contiguous columns with the same string headerGroup → 3 spans (no auto-merge)', () => {
    const cols: ColumnSpec[] = [
      { id: 'a', headerGroup: 'X' },
      { id: 'b', headerGroup: 'Y' },
      { id: 'c', headerGroup: 'X' },
    ];
    expect(computeHeaderGroupSpans(cols)).toEqual([
      [
        { groupName: 'X', startColIdx: 0, endColIdx: 0, colIds: ['a'] },
        { groupName: 'Y', startColIdx: 1, endColIdx: 1, colIds: ['b'] },
        { groupName: 'X', startColIdx: 2, endColIdx: 2, colIds: ['c'] },
      ],
    ]);
  });

  it('single column with headerGroup → 1-level / 1-col span', () => {
    const cols: ColumnSpec[] = [{ id: 'a' }, { id: 'b', headerGroup: 'X' }, { id: 'c' }];
    expect(computeHeaderGroupSpans(cols)).toEqual([
      [
        { groupName: null, startColIdx: 0, endColIdx: 0, colIds: ['a'] },
        { groupName: 'X', startColIdx: 1, endColIdx: 1, colIds: ['b'] },
        { groupName: null, startColIdx: 2, endColIdx: 2, colIds: ['c'] },
      ],
    ]);
  });

  it('2 cols share path `["财务", "订单"]` → 2 levels; level 0 财务 span; level 1 订单 span', () => {
    const cols: ColumnSpec[] = [
      { id: 'a', headerGroup: ['财务', '订单'] },
      { id: 'b', headerGroup: ['财务', '订单'] },
    ];
    expect(computeHeaderGroupSpans(cols)).toEqual([
      [{ groupName: '财务', startColIdx: 0, endColIdx: 1, colIds: ['a', 'b'] }],
      [{ groupName: '订单', startColIdx: 0, endColIdx: 1, colIds: ['a', 'b'] }],
    ]);
  });

  it('mixed string + array headerGroup → un-nested cols get level-1 empty placeholders', () => {
    const cols: ColumnSpec[] = [
      { id: 'id', headerGroup: '基础信息' },
      { id: 'name', headerGroup: '基础信息' },
      { id: 'qty', headerGroup: ['财务', '订单'] },
      { id: 'price', headerGroup: ['财务', '订单'] },
    ];
    expect(computeHeaderGroupSpans(cols)).toEqual([
      [
        { groupName: '基础信息', startColIdx: 0, endColIdx: 1, colIds: ['id', 'name'] },
        { groupName: '财务', startColIdx: 2, endColIdx: 3, colIds: ['qty', 'price'] },
      ],
      [
        { groupName: null, startColIdx: 0, endColIdx: 0, colIds: ['id'] },
        { groupName: null, startColIdx: 1, endColIdx: 1, colIds: ['name'] },
        { groupName: '订单', startColIdx: 2, endColIdx: 3, colIds: ['qty', 'price'] },
      ],
    ]);
  });

  it('two columns share level-0 parent but different level-1 names → 1 level-0 span + 2 level-1 spans', () => {
    const cols: ColumnSpec[] = [
      { id: 'a', headerGroup: ['财务', '订单'] },
      { id: 'b', headerGroup: ['财务', '收入'] },
    ];
    expect(computeHeaderGroupSpans(cols)).toEqual([
      [{ groupName: '财务', startColIdx: 0, endColIdx: 1, colIds: ['a', 'b'] }],
      [
        { groupName: '订单', startColIdx: 0, endColIdx: 0, colIds: ['a'] },
        { groupName: '收入', startColIdx: 1, endColIdx: 1, colIds: ['b'] },
      ],
    ]);
  });

  it('adjacent columns with same level-1 name but different level-0 parent → 2 separate level-1 spans', () => {
    // Parent-path discriminator: cols a + b share '订单' at level 1
    // but level 0 differs (财务 vs 人事). They MUST NOT merge at
    // level 1 — visually the '订单' label means two different things.
    const cols: ColumnSpec[] = [
      { id: 'a', headerGroup: ['财务', '订单'] },
      { id: 'b', headerGroup: ['人事', '订单'] },
    ];
    expect(computeHeaderGroupSpans(cols)).toEqual([
      [
        { groupName: '财务', startColIdx: 0, endColIdx: 0, colIds: ['a'] },
        { groupName: '人事', startColIdx: 1, endColIdx: 1, colIds: ['b'] },
      ],
      [
        { groupName: '订单', startColIdx: 0, endColIdx: 0, colIds: ['a'] },
        { groupName: '订单', startColIdx: 1, endColIdx: 1, colIds: ['b'] },
      ],
    ]);
  });

  it('explicit maxDepth larger than auto-detected → top rows padded with all-empty placeholders', () => {
    // Use case: zone A has 2-level depth, zone B has 1-level depth.
    // The adapter passes maxDepth = 2 to both zones' helper calls so
    // their row counts align. Zone B's level 0 must be all-empty
    // placeholders so the visual layout matches zone A's deeper paths.
    const cols: ColumnSpec[] = [
      { id: 'a', headerGroup: 'X' },
      { id: 'b', headerGroup: 'X' },
    ];
    expect(computeHeaderGroupSpans(cols, 2)).toEqual([
      [
        { groupName: null, startColIdx: 0, endColIdx: 0, colIds: ['a'] },
        { groupName: null, startColIdx: 1, endColIdx: 1, colIds: ['b'] },
      ],
      [{ groupName: 'X', startColIdx: 0, endColIdx: 1, colIds: ['a', 'b'] }],
    ]);
  });
});

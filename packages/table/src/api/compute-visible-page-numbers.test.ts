import { describe, expect, it } from 'vitest';

import { computeVisiblePageNumbers } from './compute-visible-page-numbers.js';

describe('computeVisiblePageNumbers', () => {
  it('returns empty array for totalPages: 0', () => {
    expect(computeVisiblePageNumbers(0, 0)).toEqual([]);
  });

  it('returns [0] for totalPages: 1', () => {
    expect(computeVisiblePageNumbers(0, 1)).toEqual([0]);
  });

  it('returns all pages without ellipsis for totalPages: 7 (default threshold)', () => {
    expect(computeVisiblePageNumbers(3, 7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('totalPages: 10, currentPage: 0 → [0, 1, 2, ellipsis, 9] (near start, no left ellipsis)', () => {
    expect(computeVisiblePageNumbers(0, 10)).toEqual([0, 1, 2, 'ellipsis', 9]);
  });

  it('totalPages: 10, currentPage: 9 → [0, ellipsis, 7, 8, 9] (near end, no right ellipsis)', () => {
    expect(computeVisiblePageNumbers(9, 10)).toEqual([0, 'ellipsis', 7, 8, 9]);
  });

  it('totalPages: 20, currentPage: 10 → [0, ellipsis, 9, 10, 11, ellipsis, 19] (middle)', () => {
    expect(computeVisiblePageNumbers(10, 20)).toEqual([0, 'ellipsis', 9, 10, 11, 'ellipsis', 19]);
  });

  it('single-page gap collapses to the literal page (no ellipsis when gap === 1)', () => {
    // totalPages: 8, currentPage: 3, siblingCount: 1, boundaryCount: 1
    // start=[0], middle=[2,3,4], end=[7]
    // Between start (0) and middle (2): gap = 2 → insert literal 1 (no ellipsis).
    // Between middle (4) and end (7): gap = 3 → insert ellipsis.
    expect(computeVisiblePageNumbers(3, 8)).toEqual([0, 1, 2, 3, 4, 'ellipsis', 7]);
  });

  it('siblingCount: 2 widens the visible neighborhood symmetrically', () => {
    // totalPages: 15, currentPage: 7, siblingCount: 2, boundaryCount: 1
    // start=[0], middle=[5,6,7,8,9], end=[14]
    // Gap 0→5 = 5 → ellipsis; gap 9→14 = 5 → ellipsis.
    expect(computeVisiblePageNumbers(7, 15, 2, 1)).toEqual([
      0,
      'ellipsis',
      5,
      6,
      7,
      8,
      9,
      'ellipsis',
      14,
    ]);
  });

  it('boundaryCount: 2 shows 2 pages at each edge', () => {
    // totalPages: 15, currentPage: 7, siblingCount: 1, boundaryCount: 2
    // start=[0,1], middle=[6,7,8], end=[13,14]
    // Gap 1→6 = 5 → ellipsis; gap 8→13 = 5 → ellipsis.
    expect(computeVisiblePageNumbers(7, 15, 1, 2)).toEqual([
      0,
      1,
      'ellipsis',
      6,
      7,
      8,
      'ellipsis',
      13,
      14,
    ]);
  });

  it('negative totalPages or currentPage returns empty (defensive)', () => {
    expect(computeVisiblePageNumbers(0, -1)).toEqual([]);
    expect(computeVisiblePageNumbers(-3, 10)).toEqual([]);
  });
});

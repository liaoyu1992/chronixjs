import { describe, expect, it } from 'vitest';

import { computeRowSelectionTriState } from './compute-row-selection-tristate.js';

import type { RowSpec } from '../ir/index.js';

function row(id: string, children?: readonly RowSpec[]): RowSpec {
  return children == null ? { id, data: {} } : { id, data: {}, children };
}

describe('computeRowSelectionTriState ', () => {
  it("returns 'none' when the row has no children (leaf)", () => {
    const rows: readonly RowSpec[] = [row('a')];
    expect(computeRowSelectionTriState('a', rows, new Set())).toBe('none');
    // Even when the leaf itself is selected — tristate inspects descendants only.
    expect(computeRowSelectionTriState('a', rows, new Set(['a']))).toBe('none');
  });

  it("returns 'none' when the row is not found", () => {
    const rows: readonly RowSpec[] = [row('a')];
    expect(computeRowSelectionTriState('nonexistent', rows, new Set(['a']))).toBe('none');
  });

  it("returns 'none' when no descendants are in the selection set", () => {
    const rows: readonly RowSpec[] = [row('p', [row('c1'), row('c2'), row('c3')])];
    expect(computeRowSelectionTriState('p', rows, new Set())).toBe('none');
    expect(computeRowSelectionTriState('p', rows, new Set(['unrelated']))).toBe('none');
  });

  it("returns 'all' when every descendant is selected", () => {
    const rows: readonly RowSpec[] = [row('p', [row('c1'), row('c2'), row('c3')])];
    expect(computeRowSelectionTriState('p', rows, new Set(['c1', 'c2', 'c3']))).toBe('all');
  });

  it("returns 'some' when one descendant out of many is selected", () => {
    const rows: readonly RowSpec[] = [row('p', [row('c1'), row('c2'), row('c3')])];
    expect(computeRowSelectionTriState('p', rows, new Set(['c2']))).toBe('some');
  });

  it("returns 'some' when some-but-not-all descendants are selected", () => {
    const rows: readonly RowSpec[] = [row('p', [row('c1'), row('c2'), row('c3'), row('c4')])];
    expect(computeRowSelectionTriState('p', rows, new Set(['c1', 'c3']))).toBe('some');
  });

  it('considers DEEP descendants — not just direct children', () => {
    const rows: readonly RowSpec[] = [row('p', [row('c', [row('g1'), row('g2'), row('g3')])])];
    // p has 1 direct child (c) + 3 grandchildren = 4 descendants total.
    // c + g1 + g2 + g3 selected = 'all'.
    expect(computeRowSelectionTriState('p', rows, new Set(['c', 'g1', 'g2', 'g3']))).toBe('all');
    // Only c selected (1 of 4) = 'some'.
    expect(computeRowSelectionTriState('p', rows, new Set(['c']))).toBe('some');
    // Only g1 selected (1 of 4) = 'some'.
    expect(computeRowSelectionTriState('p', rows, new Set(['g1']))).toBe('some');
    // None of the descendants selected = 'none'.
    expect(computeRowSelectionTriState('p', rows, new Set(['p']))).toBe('none');
  });

  it('parent own selection state is NOT considered', () => {
    const rows: readonly RowSpec[] = [row('p', [row('c1'), row('c2')])];
    // Parent in set + descendants empty → still 'none' (descendants only).
    expect(computeRowSelectionTriState('p', rows, new Set(['p']))).toBe('none');
    // Parent in set + 1 descendant in set → 'some' (1 of 2 descendants).
    expect(computeRowSelectionTriState('p', rows, new Set(['p', 'c1']))).toBe('some');
  });
});

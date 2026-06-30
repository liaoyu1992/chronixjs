import { describe, expect, it } from 'vitest';

import { treeFlattenPass } from './tree-flatten-pass.js';

import type { RowSpec } from '../ir/index.js';

function row(id: string, children?: readonly RowSpec[]): RowSpec {
  return children == null ? { id, data: {} } : { id, data: {}, children };
}

describe('treeFlattenPass ', () => {
  it('returns input by reference when rows are empty', () => {
    const rows: readonly RowSpec[] = [];
    const result = treeFlattenPass({ rows, expandedRowIds: new Set() });
    expect(result.flatRows).toBe(rows);
    expect(result.maxDepth).toBe(0);
  });

  it('returns input by reference when fully flat (no children anywhere)', () => {
    const rows: readonly RowSpec[] = [row('a'), row('b'), row('c')];
    const result = treeFlattenPass({ rows, expandedRowIds: new Set() });
    expect(result.flatRows).toBe(rows);
    expect(result.maxDepth).toBe(0);
  });

  it('treats children: [] as no children (fast-path applies)', () => {
    const rows: readonly RowSpec[] = [
      { id: 'a', data: {}, children: [] },
      { id: 'b', data: {}, children: [] },
    ];
    const result = treeFlattenPass({ rows, expandedRowIds: new Set() });
    // children: [] still triggers the slow path (children !== undefined),
    // but emits the same row count.
    expect(result.flatRows).toHaveLength(2);
    expect(result.flatRows.map((r) => r.id)).toEqual(['a', 'b']);
    expect(result.maxDepth).toBe(0);
  });

  it('flattens a two-level tree with parent expanded', () => {
    const child1 = row('a-1');
    const child2 = row('a-2');
    const rows: readonly RowSpec[] = [row('a', [child1, child2]), row('b')];
    const result = treeFlattenPass({ rows, expandedRowIds: new Set(['a']) });
    expect(result.flatRows.map((r) => r.id)).toEqual(['a', 'a-1', 'a-2', 'b']);
    expect(result.flatRows.map((r) => r.depth ?? 0)).toEqual([0, 1, 1, 0]);
    expect(result.flatRows.map((r) => r.groupKey ?? null)).toEqual([null, 'a', 'a', null]);
    expect(result.maxDepth).toBe(1);
  });

  it('omits children when parent is collapsed', () => {
    const child1 = row('a-1');
    const rows: readonly RowSpec[] = [row('a', [child1]), row('b')];
    const result = treeFlattenPass({ rows, expandedRowIds: new Set() });
    expect(result.flatRows.map((r) => r.id)).toEqual(['a', 'b']);
    expect(result.maxDepth).toBe(0);
  });

  it('flattens a three-level tree with mixed expand state', () => {
    const grandchild = row('a-1-1');
    const child1 = row('a-1', [grandchild]);
    const child2 = row('a-2');
    const rows: readonly RowSpec[] = [row('a', [child1, child2])];
    // Only 'a' is expanded; 'a-1' stays collapsed.
    const result = treeFlattenPass({ rows, expandedRowIds: new Set(['a']) });
    expect(result.flatRows.map((r) => r.id)).toEqual(['a', 'a-1', 'a-2']);
    expect(result.maxDepth).toBe(1);
  });

  it('flattens a three-level tree fully expanded', () => {
    const grandchild = row('a-1-1');
    const child = row('a-1', [grandchild]);
    const rows: readonly RowSpec[] = [row('a', [child])];
    const result = treeFlattenPass({ rows, expandedRowIds: new Set(['a', 'a-1']) });
    expect(result.flatRows.map((r) => r.id)).toEqual(['a', 'a-1', 'a-1-1']);
    expect(result.flatRows.map((r) => r.depth ?? 0)).toEqual([0, 1, 2]);
    expect(result.flatRows.map((r) => r.groupKey ?? null)).toEqual([null, 'a', 'a-1']);
    expect(result.maxDepth).toBe(2);
  });

  it('overwrites consumer-supplied depth + groupKey', () => {
    const child: RowSpec = { id: 'c', data: {}, depth: 99, groupKey: 'wrong' };
    const rows: readonly RowSpec[] = [{ id: 'p', data: {}, children: [child] }];
    const result = treeFlattenPass({ rows, expandedRowIds: new Set(['p']) });
    expect(result.flatRows.map((r) => r.depth)).toEqual([0, 1]);
    expect(result.flatRows.map((r) => r.groupKey ?? null)).toEqual([null, 'p']);
  });

  it('preserves declared child order (DFS visits in input order)', () => {
    const rows: readonly RowSpec[] = [
      {
        id: 'p',
        data: {},
        children: [row('c-1'), row('c-2'), row('c-3'), row('c-4')],
      },
    ];
    const result = treeFlattenPass({ rows, expandedRowIds: new Set(['p']) });
    expect(result.flatRows.map((r) => r.id)).toEqual(['p', 'c-1', 'c-2', 'c-3', 'c-4']);
  });

  it('expandedRowIds on a leaf is harmless', () => {
    const rows: readonly RowSpec[] = [row('a'), row('b')];
    const result = treeFlattenPass({
      rows,
      expandedRowIds: new Set(['a', 'b', 'nonexistent']),
    });
    expect(result.flatRows.map((r) => r.id)).toEqual(['a', 'b']);
    expect(result.maxDepth).toBe(0);
  });

  it('emits input row by reference when depth + groupKey already match', () => {
    // Top-level row with depth: 0 + groupKey: null pre-set matches what
    // the pass would write — but the row has children so we enter the
    // slow path. Verify the emitted row IS the same reference.
    const child = row('c');
    const parent: RowSpec = {
      id: 'p',
      data: {},
      depth: 0,
      groupKey: null,
      children: [child],
    };
    const rows: readonly RowSpec[] = [parent];
    const result = treeFlattenPass({ rows, expandedRowIds: new Set() });
    expect(result.flatRows[0]).toBe(parent);
  });

  it('handles a deep tree without stack overflow (1000 levels)', () => {
    let leaf: RowSpec = row('leaf');
    for (let i = 999; i >= 0; i--) {
      leaf = { id: `n-${i}`, data: {}, children: [leaf] };
    }
    const expandedSet = new Set<string>();
    for (let i = 0; i < 1000; i++) expandedSet.add(`n-${i}`);
    const result = treeFlattenPass({ rows: [leaf], expandedRowIds: expandedSet });
    expect(result.flatRows).toHaveLength(1001);
    expect(result.maxDepth).toBe(1000);
  });

  it('skips children-array entries that are null-equivalent gracefully', () => {
    // Defensive: input shape says readonly RowSpec[], but if a stray
    // undefined leaks in (consumer bug), the pass should not crash.
    // Cast through unknown to suppress the type-shape mismatch — the
    // intent is to test the pass's null-guard, not to declare that
    // undefined is a valid RowSpec.
    const looseChildren = [row('c-1'), undefined, row('c-2')] as unknown as readonly RowSpec[];
    const rows: readonly RowSpec[] = [
      {
        id: 'p',
        data: {},
        children: looseChildren,
      },
    ];
    const result = treeFlattenPass({
      rows,
      expandedRowIds: new Set(['p']),
    });
    expect(result.flatRows.map((r) => r.id)).toEqual(['p', 'c-1', 'c-2']);
  });
});

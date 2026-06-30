import { describe, expect, it } from 'vitest';

import { collectDescendantRowIds } from './collect-descendant-row-ids.js';

import type { RowSpec } from '../ir/index.js';

function row(id: string, children?: readonly RowSpec[]): RowSpec {
  return children == null ? { id, data: {} } : { id, data: {}, children };
}

describe('collectDescendantRowIds ', () => {
  it('returns [] when the parent row is not found', () => {
    const rows: readonly RowSpec[] = [row('a'), row('b')];
    expect(collectDescendantRowIds('nonexistent', rows)).toEqual([]);
  });

  it('returns [] when the parent row has no children', () => {
    const rows: readonly RowSpec[] = [row('a'), row('b')];
    expect(collectDescendantRowIds('a', rows)).toEqual([]);
  });

  it('returns [] when the parent row has children: []', () => {
    const rows: readonly RowSpec[] = [{ id: 'a', data: {}, children: [] }];
    expect(collectDescendantRowIds('a', rows)).toEqual([]);
  });

  it('collects direct children when parent is at top level', () => {
    const rows: readonly RowSpec[] = [row('a', [row('a-1'), row('a-2'), row('a-3')]), row('b')];
    expect(collectDescendantRowIds('a', rows)).toEqual(['a-1', 'a-2', 'a-3']);
  });

  it('collects all descendants recursively (depth-first)', () => {
    const rows: readonly RowSpec[] = [
      row('a', [row('a-1', [row('a-1-1'), row('a-1-2')]), row('a-2', [row('a-2-1')])]),
    ];
    expect(collectDescendantRowIds('a', rows)).toEqual(['a-1', 'a-1-1', 'a-1-2', 'a-2', 'a-2-1']);
  });

  it('locates a deeply-nested parent + collects its descendants only', () => {
    const rows: readonly RowSpec[] = [
      row('p', [row('p-c1', [row('p-c1-g1'), row('p-c1-g2')]), row('p-c2', [row('p-c2-g1')])]),
    ];
    // Parent is p-c1 (depth 1); descendants are p-c1-g1 + p-c1-g2.
    expect(collectDescendantRowIds('p-c1', rows)).toEqual(['p-c1-g1', 'p-c1-g2']);
  });

  it('handles 1000-deep tree without stack overflow', () => {
    let leaf: RowSpec = row('leaf');
    for (let i = 999; i >= 0; i--) {
      leaf = { id: `n-${i}`, data: {}, children: [leaf] };
    }
    const out = collectDescendantRowIds('n-0', [leaf]);
    expect(out).toHaveLength(1000);
    expect(out[out.length - 1]).toBe('leaf');
  });

  it('parent id NOT included in output (descendants only)', () => {
    const rows: readonly RowSpec[] = [row('a', [row('a-1')])];
    expect(collectDescendantRowIds('a', rows)).not.toContain('a');
  });
});

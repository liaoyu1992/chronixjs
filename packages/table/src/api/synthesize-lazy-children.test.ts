import { describe, expect, it } from 'vitest';

import { synthesizeLazyChildren } from './synthesize-lazy-children.js';

import type { RowSpec } from '../ir/index.js';

function row(id: string, extras: Partial<RowSpec> = {}): RowSpec {
  return { id, data: {}, ...extras };
}

describe('synthesizeLazyChildren', () => {
  it('returns input by reference when loadedChildrenByRowId is empty', () => {
    const rows: readonly RowSpec[] = [
      row('a', { hasChildren: true }),
      row('b', { children: [row('b.1')] }),
      row('c'),
    ];
    const result = synthesizeLazyChildren({
      rows,
      loadedChildrenByRowId: new Map(),
    });
    expect(result.rows).toBe(rows);
  });

  it('substitutes loaded children for a single lazy parent', () => {
    const rows: readonly RowSpec[] = [row('a', { hasChildren: true }), row('b')];
    const aChildren: readonly RowSpec[] = [row('a.1'), row('a.2')];
    const result = synthesizeLazyChildren({
      rows,
      loadedChildrenByRowId: new Map([['a', aChildren]]),
    });
    expect(result.rows).not.toBe(rows);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.id).toBe('a');
    expect(result.rows[0]?.children).toEqual(aChildren);
    // Row b unchanged.
    expect(result.rows[1]).toBe(rows[1]);
  });

  it('leaves rows whose id is NOT in the map unchanged (unloaded lazy)', () => {
    const rows: readonly RowSpec[] = [
      row('a', { hasChildren: true }),
      row('b', { hasChildren: true }),
    ];
    const result = synthesizeLazyChildren({
      rows,
      loadedChildrenByRowId: new Map([['a', [row('a.1')]]]),
    });
    // Row a substituted; row b passes through unchanged (still
    // unloaded lazy).
    expect(result.rows[0]?.children?.length).toBe(1);
    expect(result.rows[1]).toBe(rows[1]);
    expect(result.rows[1]?.children).toBeUndefined();
  });

  it('preserves sync children that are not in the map (behavior)', () => {
    const syncChildren: readonly RowSpec[] = [row('a.1'), row('a.2')];
    const rows: readonly RowSpec[] = [row('a', { children: syncChildren })];
    const result = synthesizeLazyChildren({
      rows,
      loadedChildrenByRowId: new Map([['unrelated', [row('x.1')]]]),
    });
    // Top-level row a was not touched (its id isn't in the loaded map);
    // sync children pass through unchanged.
    expect(result.rows[0]).toBe(rows[0]);
    expect(result.rows[0]?.children).toBe(syncChildren);
  });

  it('overrides sync children when the row id is in the loaded map (loaded takes precedence)', () => {
    const syncChildren: readonly RowSpec[] = [row('a.stale')];
    const loadedChildren: readonly RowSpec[] = [row('a.fresh1'), row('a.fresh2')];
    const rows: readonly RowSpec[] = [row('a', { children: syncChildren })];
    const result = synthesizeLazyChildren({
      rows,
      loadedChildrenByRowId: new Map([['a', loadedChildren]]),
    });
    expect(result.rows[0]?.children).toEqual(loadedChildren);
    expect(result.rows[0]?.children).not.toBe(syncChildren);
  });

  it('recurses into loaded children that are themselves lazy parents', () => {
    const rows: readonly RowSpec[] = [row('a', { hasChildren: true })];
    const aChildren: readonly RowSpec[] = [row('a.1', { hasChildren: true }), row('a.2')];
    const a1Children: readonly RowSpec[] = [row('a.1.x')];
    const result = synthesizeLazyChildren({
      rows,
      loadedChildrenByRowId: new Map([
        ['a', aChildren],
        ['a.1', a1Children],
      ]),
    });
    expect(result.rows[0]?.children?.[0]?.id).toBe('a.1');
    expect(result.rows[0]?.children?.[0]?.children).toEqual(a1Children);
    expect(result.rows[0]?.children?.[1]).toBe(aChildren[1]);
  });

  it('preserves array identity when a deep sync subtree had nothing rewritten', () => {
    const grandChildren: readonly RowSpec[] = [row('a.1.x')];
    const aChildren: readonly RowSpec[] = [row('a.1', { children: grandChildren })];
    const rows: readonly RowSpec[] = [row('a', { children: aChildren })];
    const result = synthesizeLazyChildren({
      rows,
      loadedChildrenByRowId: new Map([['unrelated', [row('z')]]]),
    });
    // Nothing matched → entire tree passed through by reference.
    expect(result.rows).toBe(rows);
    expect(result.rows[0]?.children).toBe(aChildren);
    expect(result.rows[0]?.children?.[0]?.children).toBe(grandChildren);
  });

  it('rebuilds only the parent chain when a deep descendant is in the loaded map', () => {
    const deepLoaded: readonly RowSpec[] = [row('a.1.x.loaded')];
    const a1Children: readonly RowSpec[] = [row('a.1.x', { hasChildren: true })];
    const aChildren: readonly RowSpec[] = [row('a.1', { children: a1Children })];
    const rows: readonly RowSpec[] = [row('a', { children: aChildren })];
    const result = synthesizeLazyChildren({
      rows,
      loadedChildrenByRowId: new Map([['a.1.x', deepLoaded]]),
    });
    // Top-level array is rebuilt (a's children chain changed).
    expect(result.rows).not.toBe(rows);
    // Drill down: a.1.x's children should now be the loaded array.
    const aRow = result.rows[0];
    expect(aRow?.id).toBe('a');
    const a1Row = aRow?.children?.[0];
    expect(a1Row?.id).toBe('a.1');
    const a1xRow = a1Row?.children?.[0];
    expect(a1xRow?.id).toBe('a.1.x');
    expect(a1xRow?.children).toEqual(deepLoaded);
  });
});

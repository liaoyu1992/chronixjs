import { describe, expect, it } from 'vitest';

import { defaultRowSwimlaneLayout } from './row-swimlane-layout.js';

import type { RowSpec } from '../ir/index.js';

const row = (id: string, heightHint?: number): RowSpec => ({
  id,
  columns: {},
  ...(heightHint !== undefined ? { heightHint } : {}),
});

describe('defaultRowSwimlaneLayout', () => {
  it('emits one strip per row in input order', () => {
    const out = defaultRowSwimlaneLayout.layout({
      rows: [row('a'), row('b'), row('c')],
      defaultRowHeight: 30,
    });

    expect(out.strips).toHaveLength(3);
    expect(out.strips.map((s) => s.rowId)).toEqual(['a', 'b', 'c']);
  });

  it('stacks strips top-to-bottom with no overlap', () => {
    const out = defaultRowSwimlaneLayout.layout({
      rows: [row('a'), row('b'), row('c')],
      defaultRowHeight: 30,
    });

    expect(out.strips[0]?.y).toBe(0);
    expect(out.strips[1]?.y).toBe(30);
    expect(out.strips[2]?.y).toBe(60);
  });

  it('applies defaultRowHeight when row has no heightHint', () => {
    const out = defaultRowSwimlaneLayout.layout({
      rows: [row('a'), row('b')],
      defaultRowHeight: 30,
    });

    expect(out.strips[0]?.height).toBe(30);
    expect(out.strips[1]?.height).toBe(30);
  });

  it('honors per-row heightHint as override', () => {
    const out = defaultRowSwimlaneLayout.layout({
      rows: [row('a', 50), row('b'), row('c', 80)],
      defaultRowHeight: 30,
    });

    expect(out.strips[0]?.height).toBe(50);
    expect(out.strips[1]?.height).toBe(30);
    expect(out.strips[2]?.height).toBe(80);
    expect(out.strips[1]?.y).toBe(50); // shifted by row a's 50
    expect(out.strips[2]?.y).toBe(80); // 50 + 30
  });

  it('totalHeight equals the sum of strip heights', () => {
    const out = defaultRowSwimlaneLayout.layout({
      rows: [row('a', 50), row('b'), row('c', 80)],
      defaultRowHeight: 30,
    });

    expect(out.totalHeight).toBe(50 + 30 + 80);
  });

  it('returns an empty output for zero rows', () => {
    const out = defaultRowSwimlaneLayout.layout({
      rows: [],
      defaultRowHeight: 30,
    });

    expect(out.strips).toEqual([]);
    expect(out.totalHeight).toBe(0);
  });

  it('strips tile the vertical extent — no gaps', () => {
    const out = defaultRowSwimlaneLayout.layout({
      rows: [row('a', 50), row('b', 30), row('c', 80)],
      defaultRowHeight: 30,
    });

    for (let i = 1; i < out.strips.length; i += 1) {
      const prev = out.strips[i - 1];
      const curr = out.strips[i];
      expect(curr?.y).toBe((prev?.y ?? 0) + (prev?.height ?? 0));
    }
  });
});

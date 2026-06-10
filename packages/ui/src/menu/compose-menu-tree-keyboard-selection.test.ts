import { describe, expect, it } from 'vitest';

import {
  composeMenuTreeKeyboardSelection,
  deriveInitialExpandedKeys,
} from './compose-menu-tree-keyboard-selection.js';

import type { MenuItem } from './menu-spec.js';

const TREE: readonly MenuItem[] = [
  {
    key: 'a',
    label: 'A',
    icon: undefined,
    disabled: false,
    children: [
      {
        key: 'a.1',
        label: 'A.1',
        icon: undefined,
        disabled: false,
        children: undefined,
      },
      {
        key: 'a.2',
        label: 'A.2',
        icon: undefined,
        disabled: false,
        children: undefined,
      },
    ],
  },
  {
    key: 'b',
    label: 'B',
    icon: undefined,
    disabled: false,
    children: undefined,
  },
];

describe('composeMenuTreeKeyboardSelection', () => {
  it('Down from null jumps to first visible key', () => {
    const r = composeMenuTreeKeyboardSelection({
      items: TREE,
      currentKey: null,
      expandedKeys: new Set(['a']),
      direction: 'down',
    });
    expect(r.nextKey).toBe('a');
    expect(r.toggleExpand).toBeNull();
  });

  it('Down through visible keys when a is expanded: a → a.1 → a.2 → b', () => {
    const expandedKeys = new Set(['a']);
    let key: string | null = 'a';
    const seq = [key];
    for (let i = 0; i < 3; i++) {
      const r = composeMenuTreeKeyboardSelection({
        items: TREE,
        currentKey: key,
        expandedKeys,
        direction: 'down',
      });
      key = r.nextKey;
      seq.push(key!);
    }
    expect(seq).toEqual(['a', 'a.1', 'a.2', 'b']);
  });

  it('Down skips collapsed children: a → b directly', () => {
    const r = composeMenuTreeKeyboardSelection({
      items: TREE,
      currentKey: 'a',
      expandedKeys: new Set(),
      direction: 'down',
    });
    expect(r.nextKey).toBe('b');
  });

  it('Up from a.2 yields a.1 (within expanded branch)', () => {
    const r = composeMenuTreeKeyboardSelection({
      items: TREE,
      currentKey: 'a.2',
      expandedKeys: new Set(['a']),
      direction: 'up',
    });
    expect(r.nextKey).toBe('a.1');
  });

  it('Home returns first visible key', () => {
    expect(
      composeMenuTreeKeyboardSelection({
        items: TREE,
        currentKey: 'b',
        expandedKeys: new Set(),
        direction: 'home',
      }).nextKey,
    ).toBe('a');
  });

  it('End returns last visible key', () => {
    expect(
      composeMenuTreeKeyboardSelection({
        items: TREE,
        currentKey: 'a',
        expandedKeys: new Set(['a']),
        direction: 'end',
      }).nextKey,
    ).toBe('b');
  });

  it('Right on a collapsed branch emits toggleExpand=expand', () => {
    const r = composeMenuTreeKeyboardSelection({
      items: TREE,
      currentKey: 'a',
      expandedKeys: new Set(),
      direction: 'right',
    });
    expect(r.toggleExpand).toBe('expand');
    expect(r.nextKey).toBe('a');
  });

  it('Right on an expanded branch jumps to first child', () => {
    const r = composeMenuTreeKeyboardSelection({
      items: TREE,
      currentKey: 'a',
      expandedKeys: new Set(['a']),
      direction: 'right',
    });
    expect(r.toggleExpand).toBeNull();
    expect(r.nextKey).toBe('a.1');
  });

  it('Left on an expanded branch emits toggleExpand=collapse', () => {
    const r = composeMenuTreeKeyboardSelection({
      items: TREE,
      currentKey: 'a',
      expandedKeys: new Set(['a']),
      direction: 'left',
    });
    expect(r.toggleExpand).toBe('collapse');
    expect(r.nextKey).toBe('a');
  });

  it('Left on a child jumps to parent', () => {
    const r = composeMenuTreeKeyboardSelection({
      items: TREE,
      currentKey: 'a.1',
      expandedKeys: new Set(['a']),
      direction: 'left',
    });
    expect(r.toggleExpand).toBeNull();
    expect(r.nextKey).toBe('a');
  });

  it('Empty tree returns null nextKey', () => {
    expect(
      composeMenuTreeKeyboardSelection({
        items: [],
        currentKey: null,
        expandedKeys: new Set(),
        direction: 'down',
      }),
    ).toEqual({ nextKey: null, toggleExpand: null });
  });
});

describe('deriveInitialExpandedKeys', () => {
  it('returns ancestors-only (excludes the leaf itself)', () => {
    const expanded = deriveInitialExpandedKeys(TREE, 'a.1');
    expect(Array.from(expanded)).toEqual(['a']);
  });

  it('returns empty set for root-level value', () => {
    expect(deriveInitialExpandedKeys(TREE, 'b').size).toBe(0);
  });

  it('returns empty set when value is undefined', () => {
    expect(deriveInitialExpandedKeys(TREE, undefined).size).toBe(0);
  });

  it('returns empty set when value is missing from tree', () => {
    expect(deriveInitialExpandedKeys(TREE, 'zzz').size).toBe(0);
  });
});

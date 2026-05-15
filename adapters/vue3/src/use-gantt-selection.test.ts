import { describe, expect, it } from 'vitest';

import {
  useGanttSelection,
  type BarClickPayload,
  type EmptyAreaClickPayload,
} from './use-gantt-selection.js';

import type { BarSpec } from '@chronixjs/gantt';

// Stub source bar — handlers don't inspect it beyond passing through.
const stubSourceBar = (id: string): BarSpec => ({
  id,
  rowId: 'r1',
  range: { start: new Date(0), end: new Date(60_000) },
  dprIntent: 'crisp-pixel',
});

// Build a synthetic PointerEvent with the shiftKey flag set. happy-dom
// supports PointerEvent constructors; if it ever stops, swap to a plain
// object cast through `unknown as PointerEvent`.
const pe = (shiftKey: boolean): PointerEvent =>
  new PointerEvent('pointerup', { shiftKey, pointerType: 'mouse' });

const barClick = (barId: string, shiftKey: boolean): BarClickPayload => ({
  barId,
  sourceBar: stubSourceBar(barId),
  jsEvent: pe(shiftKey),
});

const emptyClick = (rowId: string | null): EmptyAreaClickPayload => ({
  rowId,
  jsEvent: pe(false),
});

describe('useGanttSelection', () => {
  it('empty selection by default — selectedBarIds is [] and isSelected is false', () => {
    const sel = useGanttSelection();
    expect(sel.selectedBarIds.value).toEqual([]);
    expect(sel.isSelected('b1')).toBe(false);
  });

  it('select(id) adds the id; subsequent select(otherId) appends in insertion order', () => {
    const sel = useGanttSelection();
    sel.select('b1');
    expect(sel.selectedBarIds.value).toEqual(['b1']);
    expect(sel.isSelected('b1')).toBe(true);
    sel.select('b2');
    expect(sel.selectedBarIds.value).toEqual(['b1', 'b2']);
    // Re-selecting an already-selected id is a no-op (no duplicates).
    sel.select('b1');
    expect(sel.selectedBarIds.value).toEqual(['b1', 'b2']);
  });

  it('deselect(id) removes the id; deselect of non-selected is a no-op', () => {
    const sel = useGanttSelection();
    sel.select('b1');
    sel.select('b2');
    sel.deselect('b1');
    expect(sel.selectedBarIds.value).toEqual(['b2']);
    sel.deselect('never-selected');
    expect(sel.selectedBarIds.value).toEqual(['b2']);
  });

  it('toggle(id) adds when absent, removes when present', () => {
    const sel = useGanttSelection();
    sel.toggle('b1');
    expect(sel.isSelected('b1')).toBe(true);
    sel.toggle('b1');
    expect(sel.isSelected('b1')).toBe(false);
    sel.toggle('b2');
    sel.toggle('b3');
    expect(sel.selectedBarIds.value).toEqual(['b2', 'b3']);
    sel.toggle('b2');
    expect(sel.selectedBarIds.value).toEqual(['b3']);
  });

  it('clear() empties the selection', () => {
    const sel = useGanttSelection();
    sel.select('b1');
    sel.select('b2');
    sel.select('b3');
    expect(sel.selectedBarIds.value).toHaveLength(3);
    sel.clear();
    expect(sel.selectedBarIds.value).toEqual([]);
    // Clearing an empty selection is a no-op.
    sel.clear();
    expect(sel.selectedBarIds.value).toEqual([]);
  });

  it('handleBarClick (no shift) REPLACES the selection with the clicked bar', () => {
    const sel = useGanttSelection();
    sel.select('b1');
    sel.select('b2');
    sel.select('b3');
    expect(sel.selectedBarIds.value).toEqual(['b1', 'b2', 'b3']);
    sel.handleBarClick(barClick('b4', false));
    expect(sel.selectedBarIds.value).toEqual(['b4']);
  });

  it('handleBarClick (shift) TOGGLES the clicked bar (multi-select)', () => {
    const sel = useGanttSelection();
    // First shift-click adds b1.
    sel.handleBarClick(barClick('b1', true));
    expect(sel.selectedBarIds.value).toEqual(['b1']);
    // Shift-clicking another bar adds, not replaces.
    sel.handleBarClick(barClick('b2', true));
    expect(sel.selectedBarIds.value).toEqual(['b1', 'b2']);
    // Shift-clicking an already-selected bar removes it.
    sel.handleBarClick(barClick('b1', true));
    expect(sel.selectedBarIds.value).toEqual(['b2']);
  });

  it('handleEmptyAreaClick clears selection when unselectAuto is true (default)', () => {
    const sel = useGanttSelection();
    sel.select('b1');
    sel.select('b2');
    sel.handleEmptyAreaClick(emptyClick('r1'));
    expect(sel.selectedBarIds.value).toEqual([]);
    // null rowId (out-of-strip click) also clears.
    sel.select('b3');
    sel.handleEmptyAreaClick(emptyClick(null));
    expect(sel.selectedBarIds.value).toEqual([]);
  });

  it('handleEmptyAreaClick is a no-op when unselectAuto is false', () => {
    const sel = useGanttSelection({ unselectAuto: false });
    sel.select('b1');
    sel.select('b2');
    sel.handleEmptyAreaClick(emptyClick('r1'));
    expect(sel.selectedBarIds.value).toEqual(['b1', 'b2']);
  });

  it('selectedBarIds is reactive — computed re-evaluates after each mutation', () => {
    const sel = useGanttSelection();
    const initial = sel.selectedBarIds.value;
    expect(initial).toEqual([]);
    sel.select('b1');
    // New array identity after each change (because the Set is replaced).
    expect(sel.selectedBarIds.value).not.toBe(initial);
    expect(sel.selectedBarIds.value).toEqual(['b1']);
  });
});

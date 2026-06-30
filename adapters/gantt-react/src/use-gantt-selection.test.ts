import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  useGanttSelection,
  type BarClickPayload,
  type EmptyAreaClickPayload,
} from './use-gantt-selection.js';

import type { BarSpec } from '@chronixjs/gantt';

afterEach(() => {
  // No DOM cleanup needed — renderHook unmounts automatically when the
  // next test's renderHook fires.
});

// Stub source bar — handlers don't inspect it beyond passing through.
const stubSourceBar = (id: string): BarSpec => ({
  id,
  rowId: 'r1',
  range: { start: new Date(0), end: new Date(60_000) },
  dprIntent: 'crisp-pixel',
});

// Build a synthetic PointerEvent with the shiftKey flag set. The
// `vitest.setup.ts` polyfill extends MouseEvent which honors the init
// dict's `shiftKey` — both this raw PointerEvent and React's synthetic
// PointerEvent expose `.shiftKey`, so casting through unknown is safe
// here even though the payload's `jsEvent` is typed as the React
// synthetic flavor.
const pe = (shiftKey: boolean): PointerEvent =>
  new PointerEvent('pointerup', { shiftKey, pointerType: 'mouse' });

const barClick = (barId: string, shiftKey: boolean): BarClickPayload => ({
  barId,
  sourceBar: stubSourceBar(barId),
  jsEvent: pe(shiftKey) as unknown as BarClickPayload['jsEvent'],
});

const emptyClick = (rowId: string | null): EmptyAreaClickPayload => ({
  rowId,
  jsEvent: pe(false) as unknown as EmptyAreaClickPayload['jsEvent'],
  // required field; unselectAuto path doesn't read it.
  time: new Date('2026-05-18T00:00:00'),
});

describe('useGanttSelection ', () => {
  it('empty selection by default — selectedBarIds is [] and isSelected is false', () => {
    const { result } = renderHook(() => useGanttSelection());
    expect(result.current.selectedBarIds).toEqual([]);
    expect(result.current.isSelected('b1')).toBe(false);
  });

  it('select(id) adds the id; subsequent select(otherId) appends in insertion order', () => {
    const { result } = renderHook(() => useGanttSelection());
    act(() => {
      result.current.select('b1');
    });
    expect(result.current.selectedBarIds).toEqual(['b1']);
    expect(result.current.isSelected('b1')).toBe(true);
    act(() => {
      result.current.select('b2');
    });
    expect(result.current.selectedBarIds).toEqual(['b1', 'b2']);
    // Re-selecting an already-selected id is a no-op (no duplicates).
    act(() => {
      result.current.select('b1');
    });
    expect(result.current.selectedBarIds).toEqual(['b1', 'b2']);
  });

  it('deselect(id) removes the id; deselect of non-selected is a no-op', () => {
    const { result } = renderHook(() => useGanttSelection());
    act(() => {
      result.current.select('b1');
      result.current.select('b2');
    });
    act(() => {
      result.current.deselect('b1');
    });
    expect(result.current.selectedBarIds).toEqual(['b2']);
    act(() => {
      result.current.deselect('never-selected');
    });
    expect(result.current.selectedBarIds).toEqual(['b2']);
  });

  it('toggle(id) adds when absent, removes when present', () => {
    const { result } = renderHook(() => useGanttSelection());
    act(() => {
      result.current.toggle('b1');
    });
    expect(result.current.isSelected('b1')).toBe(true);
    act(() => {
      result.current.toggle('b1');
    });
    expect(result.current.isSelected('b1')).toBe(false);
    act(() => {
      result.current.toggle('b2');
      result.current.toggle('b3');
    });
    expect(result.current.selectedBarIds).toEqual(['b2', 'b3']);
    act(() => {
      result.current.toggle('b2');
    });
    expect(result.current.selectedBarIds).toEqual(['b3']);
  });

  it('clear() empties the selection', () => {
    const { result } = renderHook(() => useGanttSelection());
    act(() => {
      result.current.select('b1');
      result.current.select('b2');
      result.current.select('b3');
    });
    expect(result.current.selectedBarIds).toHaveLength(3);
    act(() => {
      result.current.clear();
    });
    expect(result.current.selectedBarIds).toEqual([]);
    // Clearing an empty selection is a no-op.
    act(() => {
      result.current.clear();
    });
    expect(result.current.selectedBarIds).toEqual([]);
  });

  it('handleBarClick (no shift) REPLACES the selection with the clicked bar', () => {
    const { result } = renderHook(() => useGanttSelection());
    act(() => {
      result.current.select('b1');
      result.current.select('b2');
      result.current.select('b3');
    });
    expect(result.current.selectedBarIds).toEqual(['b1', 'b2', 'b3']);
    act(() => {
      result.current.handleBarClick(barClick('b4', false));
    });
    expect(result.current.selectedBarIds).toEqual(['b4']);
  });

  it('handleBarClick (shift) TOGGLES the clicked bar (multi-select)', () => {
    const { result } = renderHook(() => useGanttSelection());
    // First shift-click adds b1.
    act(() => {
      result.current.handleBarClick(barClick('b1', true));
    });
    expect(result.current.selectedBarIds).toEqual(['b1']);
    // Shift-clicking another bar adds, not replaces.
    act(() => {
      result.current.handleBarClick(barClick('b2', true));
    });
    expect(result.current.selectedBarIds).toEqual(['b1', 'b2']);
    // Shift-clicking an already-selected bar removes it.
    act(() => {
      result.current.handleBarClick(barClick('b1', true));
    });
    expect(result.current.selectedBarIds).toEqual(['b2']);
  });

  it('handleEmptyAreaClick clears selection when unselectAuto is true (default)', () => {
    const { result } = renderHook(() => useGanttSelection());
    act(() => {
      result.current.select('b1');
      result.current.select('b2');
    });
    act(() => {
      result.current.handleEmptyAreaClick(emptyClick('r1'));
    });
    expect(result.current.selectedBarIds).toEqual([]);
    // null rowId (out-of-strip click) also clears.
    act(() => {
      result.current.select('b3');
    });
    act(() => {
      result.current.handleEmptyAreaClick(emptyClick(null));
    });
    expect(result.current.selectedBarIds).toEqual([]);
  });

  it('handleEmptyAreaClick is a no-op when unselectAuto is false', () => {
    const { result } = renderHook(() => useGanttSelection({ unselectAuto: false }));
    act(() => {
      result.current.select('b1');
      result.current.select('b2');
    });
    act(() => {
      result.current.handleEmptyAreaClick(emptyClick('r1'));
    });
    expect(result.current.selectedBarIds).toEqual(['b1', 'b2']);
  });

  it('selectedBarIds returns new array identity per mutation (cached snapshot pattern)', () => {
    const { result } = renderHook(() => useGanttSelection());
    const initial = result.current.selectedBarIds;
    expect(initial).toEqual([]);
    act(() => {
      result.current.select('b1');
    });
    // New array identity after each change.
    expect(result.current.selectedBarIds).not.toBe(initial);
    expect(result.current.selectedBarIds).toEqual(['b1']);
  });
});

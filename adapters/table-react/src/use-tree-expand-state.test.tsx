import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTreeExpandState } from './use-tree-expand-state.js';

import type { RowSpec } from '@chronixjs/table';

function rowSpec(id: string, children?: readonly RowSpec[]): RowSpec {
  return children == null ? { id, data: {} } : { id, data: {}, children };
}

describe('useTreeExpandState (Phase 30.2 — react port)', () => {
  it('uncontrolled: seeds empty when no defaultExpandedRowIds and depth=0', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTreeExpandState({
        controlled: undefined,
        defaultExpandedRowIds: undefined,
        defaultExpandedDepth: 0,
        rows: [rowSpec('a', [rowSpec('a-1')])],
        onChange,
      }),
    );
    expect(result.current.expandedRowIds).toEqual([]);
  });

  it('uncontrolled: seeds from defaultExpandedRowIds when set', () => {
    const { result } = renderHook(() =>
      useTreeExpandState({
        controlled: undefined,
        defaultExpandedRowIds: ['a', 'b'],
        defaultExpandedDepth: 0,
        rows: [],
        onChange: vi.fn(),
      }),
    );
    expect(new Set(result.current.expandedRowIds)).toEqual(new Set(['a', 'b']));
  });

  it('uncontrolled: seeds from defaultExpandedDepth when defaultExpandedRowIds is undefined', () => {
    const rows: readonly RowSpec[] = [
      rowSpec('a', [rowSpec('a-1', [rowSpec('a-1-1')])]),
      rowSpec('b'),
    ];
    const { result } = renderHook(() =>
      useTreeExpandState({
        controlled: undefined,
        defaultExpandedRowIds: undefined,
        defaultExpandedDepth: 1,
        rows,
        onChange: vi.fn(),
      }),
    );
    expect(new Set(result.current.expandedRowIds)).toEqual(new Set(['a']));
  });

  it('uncontrolled: depth=Infinity expands every parent (any depth)', () => {
    const rows: readonly RowSpec[] = [
      rowSpec('a', [rowSpec('a-1', [rowSpec('a-1-1')]), rowSpec('a-2')]),
    ];
    const { result } = renderHook(() =>
      useTreeExpandState({
        controlled: undefined,
        defaultExpandedRowIds: undefined,
        defaultExpandedDepth: Number.POSITIVE_INFINITY,
        rows,
        onChange: vi.fn(),
      }),
    );
    expect(new Set(result.current.expandedRowIds)).toEqual(new Set(['a', 'a-1']));
  });

  it('uncontrolled: toggle adds + removes IDs + emits the next payload', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTreeExpandState({
        controlled: undefined,
        defaultExpandedRowIds: ['a'],
        defaultExpandedDepth: 0,
        rows: [],
        onChange,
      }),
    );
    act(() => {
      result.current.toggle('a');
    });
    expect(result.current.expandedRowIds).toEqual([]);
    expect(onChange).toHaveBeenLastCalledWith([]);
    act(() => {
      result.current.toggle('b');
    });
    expect(new Set(result.current.expandedRowIds)).toEqual(new Set(['b']));
    expect(onChange).toHaveBeenLastCalledWith(['b']);
  });

  it('uncontrolled: expand + collapse are idempotent', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTreeExpandState({
        controlled: undefined,
        defaultExpandedRowIds: ['a'],
        defaultExpandedDepth: 0,
        rows: [],
        onChange,
      }),
    );
    act(() => {
      result.current.expand('a');
    });
    expect(onChange).not.toHaveBeenCalled();
    act(() => {
      result.current.collapse('a');
    });
    expect(result.current.expandedRowIds).toEqual([]);
    act(() => {
      result.current.collapse('a');
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('controlled: derives expandedRowIdsSet from prop binding', () => {
    const { result, rerender } = renderHook(
      (controlled: readonly string[] | undefined) =>
        useTreeExpandState({
          controlled,
          defaultExpandedRowIds: undefined,
          defaultExpandedDepth: 0,
          rows: [],
          onChange: vi.fn(),
        }),
      { initialProps: ['a'] as readonly string[] | undefined },
    );
    expect(new Set(result.current.expandedRowIds)).toEqual(new Set(['a']));
    rerender(['b', 'c']);
    expect(new Set(result.current.expandedRowIds)).toEqual(new Set(['b', 'c']));
  });

  it('controlled: toggle emits but does NOT mutate internal source of truth', () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useTreeExpandState({
        controlled: ['a'],
        defaultExpandedRowIds: undefined,
        defaultExpandedDepth: 0,
        rows: [],
        onChange,
      }),
    );
    act(() => {
      result.current.toggle('a');
    });
    expect(onChange).toHaveBeenLastCalledWith([]);
    // DOM-visible state stays controlled (prop didn't update).
    expect(new Set(result.current.expandedRowIds)).toEqual(new Set(['a']));
  });
});

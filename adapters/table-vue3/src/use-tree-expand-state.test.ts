import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import { useTreeExpandState } from './use-tree-expand-state.js';

import type { RowSpec } from '@chronixjs/table';

function rowSpec(id: string, children?: readonly RowSpec[]): RowSpec {
  return children == null ? { id, data: {} } : { id, data: {}, children };
}

describe('useTreeExpandState (Phase 30.1)', () => {
  it('uncontrolled: seeds empty when no defaultExpandedRowIds and depth=0', () => {
    const emit = vi.fn();
    const api = useTreeExpandState({
      controlled: ref<readonly string[] | undefined>(undefined),
      defaultExpandedRowIds: ref<readonly string[] | undefined>(undefined),
      defaultExpandedDepth: ref(0),
      rows: ref([rowSpec('a', [rowSpec('a-1')])]),
      emit,
    });
    expect(api.expandedRowIds.value).toEqual([]);
  });

  it('uncontrolled: seeds from defaultExpandedRowIds when set', () => {
    const api = useTreeExpandState({
      controlled: ref<readonly string[] | undefined>(undefined),
      defaultExpandedRowIds: ref(['a', 'b']),
      defaultExpandedDepth: ref(0),
      rows: ref([]),
      emit: vi.fn(),
    });
    expect(new Set(api.expandedRowIds.value)).toEqual(new Set(['a', 'b']));
  });

  it('uncontrolled: seeds from defaultExpandedDepth when defaultExpandedRowIds is undefined', () => {
    const rows: readonly RowSpec[] = [
      rowSpec('a', [rowSpec('a-1', [rowSpec('a-1-1')])]),
      rowSpec('b'),
    ];
    const api = useTreeExpandState({
      controlled: ref<readonly string[] | undefined>(undefined),
      defaultExpandedRowIds: ref<readonly string[] | undefined>(undefined),
      defaultExpandedDepth: ref(1),
      rows: ref(rows),
      emit: vi.fn(),
    });
    // Depth 1 = top-level parents only.
    expect(new Set(api.expandedRowIds.value)).toEqual(new Set(['a']));
  });

  it('uncontrolled: depth=Infinity expands every parent (any depth)', () => {
    const rows: readonly RowSpec[] = [
      rowSpec('a', [rowSpec('a-1', [rowSpec('a-1-1')]), rowSpec('a-2')]),
    ];
    const api = useTreeExpandState({
      controlled: ref<readonly string[] | undefined>(undefined),
      defaultExpandedRowIds: ref<readonly string[] | undefined>(undefined),
      defaultExpandedDepth: ref(Number.POSITIVE_INFINITY),
      rows: ref(rows),
      emit: vi.fn(),
    });
    expect(new Set(api.expandedRowIds.value)).toEqual(new Set(['a', 'a-1']));
  });

  it('uncontrolled: toggle adds + removes IDs + emits the next payload', () => {
    const emit = vi.fn();
    const api = useTreeExpandState({
      controlled: ref<readonly string[] | undefined>(undefined),
      defaultExpandedRowIds: ref(['a']),
      defaultExpandedDepth: ref(0),
      rows: ref([]),
      emit,
    });
    api.toggle('a');
    expect(api.expandedRowIds.value).toEqual([]);
    expect(emit).toHaveBeenLastCalledWith([]);
    api.toggle('b');
    expect(new Set(api.expandedRowIds.value)).toEqual(new Set(['b']));
    expect(emit).toHaveBeenLastCalledWith(['b']);
  });

  it('uncontrolled: expand + collapse are idempotent', () => {
    const emit = vi.fn();
    const api = useTreeExpandState({
      controlled: ref<readonly string[] | undefined>(undefined),
      defaultExpandedRowIds: ref(['a']),
      defaultExpandedDepth: ref(0),
      rows: ref([]),
      emit,
    });
    api.expand('a');
    expect(emit).not.toHaveBeenCalled();
    api.collapse('a');
    expect(api.expandedRowIds.value).toEqual([]);
    api.collapse('a');
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('controlled: derives expandedRowIdsSet from prop binding', () => {
    const controlled = ref<readonly string[] | undefined>(['a']);
    const api = useTreeExpandState({
      controlled,
      defaultExpandedRowIds: ref<readonly string[] | undefined>(undefined),
      defaultExpandedDepth: ref(0),
      rows: ref([]),
      emit: vi.fn(),
    });
    expect(new Set(api.expandedRowIds.value)).toEqual(new Set(['a']));
    controlled.value = ['b', 'c'];
    expect(new Set(api.expandedRowIds.value)).toEqual(new Set(['b', 'c']));
  });

  it('controlled: toggle emits but does NOT mutate internal source of truth', () => {
    const controlled = ref<readonly string[] | undefined>(['a']);
    const emit = vi.fn();
    const api = useTreeExpandState({
      controlled,
      defaultExpandedRowIds: ref<readonly string[] | undefined>(undefined),
      defaultExpandedDepth: ref(0),
      rows: ref([]),
      emit,
    });
    api.toggle('a');
    // Emit fires with the next payload (consumer applies via prop).
    expect(emit).toHaveBeenLastCalledWith([]);
    // But the source of truth (controlled prop) is unchanged until the
    // consumer mutates it.
    expect(new Set(api.expandedRowIds.value)).toEqual(new Set(['a']));
  });
});

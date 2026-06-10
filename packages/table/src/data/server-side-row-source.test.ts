import { describe, expect, it, vi } from 'vitest';

import {
  BLOCK_KIND_ERROR,
  BLOCK_KIND_IDLE,
  BLOCK_KIND_LOADED,
  BLOCK_KIND_LOADING,
  createServerSideRowSource,
  type GetRowsParams,
  type GetRowsResult,
  type ServerSideDataSource,
} from './server-side-row-source.js';

import type { FilterSpec, RowSpec, SortSpec } from '../ir/index.js';

function makeRow(id: string): RowSpec {
  return { id, data: { name: id } };
}

interface DeferredCall {
  readonly params: GetRowsParams;
  resolve(result: GetRowsResult): void;
  reject(error: unknown): void;
}

function makeControlledSource(): {
  source: ServerSideDataSource;
  calls: DeferredCall[];
  destroyCount: { value: number };
} {
  const calls: DeferredCall[] = [];
  const destroyCount = { value: 0 };
  const source: ServerSideDataSource = {
    getRows(params: GetRowsParams): Promise<GetRowsResult> {
      let resolveFn: (result: GetRowsResult) => void = () => {
        // populated synchronously inside the Promise constructor below
      };
      let rejectFn: (error: unknown) => void = () => {
        // populated synchronously inside the Promise constructor below
      };
      const promise = new Promise<GetRowsResult>((resolve, reject) => {
        resolveFn = resolve;
        rejectFn = reject;
      });
      calls.push({
        params,
        resolve: resolveFn,
        reject: rejectFn,
      });
      return promise;
    },
    destroy() {
      destroyCount.value++;
    },
  };
  return { source, calls, destroyCount };
}

async function flush(): Promise<void> {
  // Drain the microtask queue so .then handlers run.
  await Promise.resolve();
  await Promise.resolve();
}

describe('createServerSideRowSource', () => {
  it('initial getRowAt(0) dispatches getRows({startRow: 0, endRow: 100}) and returns null synchronously', () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    const result = session.getRowAt(0);

    expect(result).toBeNull();
    expect(calls).toHaveLength(1);
    expect(calls[0]?.params.startRow).toBe(0);
    expect(calls[0]?.params.endRow).toBe(100);
    expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_LOADING);
  });

  it('after the promise resolves, getRowAt(0) returns the loaded row', async () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(0);
    calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 1 });
    await flush();

    expect(session.getRowAt(0)).toEqual(makeRow('r0'));
    expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_LOADED);
  });

  it('subscribe(listener) fires after block load completes', async () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);
    const listener = vi.fn();
    session.subscribe(listener);

    session.getRowAt(0);
    expect(listener).not.toHaveBeenCalled();

    calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 1 });
    await flush();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('two getRowAt calls into the same loading block do not dispatch twice', () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(0);
    session.getRowAt(5);
    session.getRowAt(99);

    expect(calls).toHaveLength(1);
  });

  it('getRowAt(150) requests block 1 (rows 100-200)', () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(150);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.params.startRow).toBe(100);
    expect(calls[0]?.params.endRow).toBe(200);
  });

  it('getRowAt(99) and getRowAt(100) request distinct blocks', () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(99);
    session.getRowAt(100);

    expect(calls).toHaveLength(2);
    expect(calls[0]?.params.startRow).toBe(0);
    expect(calls[1]?.params.startRow).toBe(100);
  });

  it('getTotalRowCount returns 0 before first response and server-reported total after', async () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    expect(session.getTotalRowCount()).toBe(0);

    session.getRowAt(0);
    calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 42 });
    await flush();

    expect(session.getTotalRowCount()).toBe(42);
  });

  it('sort change via applyView aborts in-flight blocks, clears cache, and the next getRowAt redispatches', () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(0);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.params.signal.aborted).toBe(false);

    const nextSort: readonly SortSpec[] = [{ colId: 'name', direction: 'asc' }];
    session.applyView({ sortModel: nextSort, filterModel: [] });

    expect(calls[0]?.params.signal.aborted).toBe(true);
    expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);

    session.getRowAt(0);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.params.sortModel).toBe(nextSort);
  });

  it('filter change via applyView has identical semantics to sort change', () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(0);
    const nextFilter: readonly FilterSpec[] = [
      { type: 'text', colId: 'name', operator: 'contains', value: 'foo' },
    ];
    session.applyView({ sortModel: [], filterModel: nextFilter });

    expect(calls[0]?.params.signal.aborted).toBe(true);
    session.getRowAt(0);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.params.filterModel).toBe(nextFilter);
  });

  it('combined sort + filter change in one applyView dispatches once on next getRowAt', () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(0);
    session.applyView({
      sortModel: [{ colId: 'name', direction: 'desc' }],
      filterModel: [{ type: 'text', colId: 'name', operator: 'contains', value: 'bar' }],
    });

    session.getRowAt(0);
    expect(calls).toHaveLength(2);
  });

  it('refresh aborts in-flight, clears cache, and does NOT auto-dispatch', () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(0);
    session.refresh();

    expect(calls[0]?.params.signal.aborted).toBe(true);
    expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);
    expect(calls).toHaveLength(1);

    session.getRowAt(0);
    expect(calls).toHaveLength(2);
  });

  it('destroy aborts in-flight, clears listeners, and subsequent getRowAt returns null silently', () => {
    const { source, calls, destroyCount } = makeControlledSource();
    const session = createServerSideRowSource(source);
    const listener = vi.fn();
    session.subscribe(listener);

    session.getRowAt(0);
    session.destroy();

    expect(calls[0]?.params.signal.aborted).toBe(true);
    expect(destroyCount.value).toBe(1);

    expect(session.getRowAt(0)).toBeNull();
    expect(calls).toHaveLength(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('LRU eviction: with maxBlocksInCache=2, requesting 3 blocks evicts the oldest after resolve', async () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source, { maxBlocksInCache: 2 });

    session.getRowAt(0);
    session.getRowAt(100);
    session.getRowAt(200);
    expect(calls).toHaveLength(3);

    calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 1000 });
    await flush();
    calls[1]?.resolve({ rows: [makeRow('r100')], totalRowCount: 1000 });
    await flush();
    calls[2]?.resolve({ rows: [makeRow('r200')], totalRowCount: 1000 });
    await flush();

    expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);
    expect(session.getBlockState(1).kind).toBe(BLOCK_KIND_LOADED);
    expect(session.getBlockState(2).kind).toBe(BLOCK_KIND_LOADED);
  });

  it('LRU touch on read: re-reading evicted block triggers a fresh getRows', async () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source, { maxBlocksInCache: 2 });

    session.getRowAt(0);
    session.getRowAt(100);
    session.getRowAt(200);
    calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 1000 });
    await flush();
    calls[1]?.resolve({ rows: [makeRow('r100')], totalRowCount: 1000 });
    await flush();
    calls[2]?.resolve({ rows: [makeRow('r200')], totalRowCount: 1000 });
    await flush();

    expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);
    session.getRowAt(0);
    expect(calls).toHaveLength(4);
  });

  it('non-AbortError rejection transitions the block to error', async () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(0);
    const networkError = new Error('network down');
    calls[0]?.reject(networkError);
    await flush();

    const state = session.getBlockState(0);
    expect(state.kind).toBe(BLOCK_KIND_ERROR);
    if (state.kind === BLOCK_KIND_ERROR) {
      expect(state.error).toBe(networkError);
    }
  });

  it('AbortError rejection silently transitions the block to idle (no error state)', async () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(0);
    const controller = calls[0]?.params.signal;
    session.refresh();
    calls[0]?.reject(new Error('aborted'));
    await flush();

    expect(controller?.aborted).toBe(true);
    expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);
  });

  it('getRowAt past server-reported totalRowCount returns null and does NOT dispatch', async () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(0);
    calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 50 });
    await flush();

    const result = session.getRowAt(100);
    expect(result).toBeNull();
    expect(calls).toHaveLength(1);
  });

  it('multiple concurrent in-flight blocks resolve out of order independently', async () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);
    const listener = vi.fn();
    session.subscribe(listener);

    session.getRowAt(0);
    session.getRowAt(100);
    session.getRowAt(200);

    calls[2]?.resolve({ rows: [makeRow('r200')], totalRowCount: 1000 });
    await flush();
    calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 1000 });
    await flush();
    calls[1]?.resolve({ rows: [makeRow('r100')], totalRowCount: 1000 });
    await flush();

    expect(listener).toHaveBeenCalledTimes(3);
    expect(session.getRowAt(0)).toEqual(makeRow('r0'));
    expect(session.getRowAt(100)).toEqual(makeRow('r100'));
    expect(session.getRowAt(200)).toEqual(makeRow('r200'));
  });

  it('stale resolve after view change is dropped (does not pollute cache)', async () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source);

    session.getRowAt(0);
    session.applyView({ sortModel: [{ colId: 'name', direction: 'asc' }], filterModel: [] });
    // Stale resolve from the first dispatch — consumer ignored signal.
    calls[0]?.resolve({ rows: [makeRow('stale')], totalRowCount: 99 });
    await flush();

    expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);
    expect(session.getTotalRowCount()).toBe(0);
  });

  it('cacheBlockSize from options is honored and exposed on the session', () => {
    const { source, calls } = makeControlledSource();
    const session = createServerSideRowSource(source, { cacheBlockSize: 25 });

    expect(session.cacheBlockSize).toBe(25);
    session.getRowAt(30);
    expect(calls[0]?.params.startRow).toBe(25);
    expect(calls[0]?.params.endRow).toBe(50);
  });

  it('invalid cacheBlockSize throws at construction', () => {
    const { source } = makeControlledSource();
    expect(() => createServerSideRowSource(source, { cacheBlockSize: 0 })).toThrow(
      /cacheBlockSize must be > 0/,
    );
    expect(() => createServerSideRowSource(source, { cacheBlockSize: -5 })).toThrow();
  });

  it('invalid maxBlocksInCache throws at construction', () => {
    const { source } = makeControlledSource();
    expect(() => createServerSideRowSource(source, { maxBlocksInCache: 0 })).toThrow(
      /maxBlocksInCache must be > 0/,
    );
  });

  describe('Phase 45.2 — invalidateBlocks (partial cache invalidation)', () => {
    it('invalidateBlocks([0]) on a loaded block returns it to IDLE; next getRowAt redispatches', async () => {
      const { source, calls } = makeControlledSource();
      const session = createServerSideRowSource(source, { cacheBlockSize: 10 });

      session.getRowAt(0);
      calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 200 });
      await flush();
      expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_LOADED);

      session.invalidateBlocks([0]);
      expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);

      session.getRowAt(0);
      expect(calls.length).toBe(2);
      expect(calls[1]?.params.startRow).toBe(0);
      expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_LOADING);
    });

    it('invalidateBlocks([0]) on a loading block aborts the in-flight controller and removes the entry', async () => {
      const { source, calls } = makeControlledSource();
      const session = createServerSideRowSource(source, { cacheBlockSize: 10 });

      session.getRowAt(0);
      expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_LOADING);
      const signal = calls[0]?.params.signal;
      expect(signal?.aborted).toBe(false);

      session.invalidateBlocks([0]);
      expect(signal?.aborted).toBe(true);
      expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);

      // A late resolve from the aborted dispatch must NOT transition state back to LOADED.
      calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 200 });
      await flush();
      expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);
    });

    it('invalidateBlocks([0]) does not affect other blocks (loaded / loading / idle)', async () => {
      const { source, calls } = makeControlledSource();
      const session = createServerSideRowSource(source, { cacheBlockSize: 10 });

      session.getRowAt(0);
      calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 200 });
      await flush();
      session.getRowAt(10);
      calls[1]?.resolve({ rows: [makeRow('r10')], totalRowCount: 200 });
      await flush();
      session.getRowAt(20);
      expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_LOADED);
      expect(session.getBlockState(1).kind).toBe(BLOCK_KIND_LOADED);
      expect(session.getBlockState(2).kind).toBe(BLOCK_KIND_LOADING);
      expect(session.getBlockState(3).kind).toBe(BLOCK_KIND_IDLE);

      session.invalidateBlocks([0]);

      expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);
      expect(session.getBlockState(1).kind).toBe(BLOCK_KIND_LOADED);
      expect(session.getBlockState(2).kind).toBe(BLOCK_KIND_LOADING);
      expect(session.getBlockState(3).kind).toBe(BLOCK_KIND_IDLE);
    });

    it('invalidateBlocks preserves totalRowCount + sort/filter state + fires single notify', async () => {
      const sortModel: readonly SortSpec[] = [{ colId: 'name', direction: 'asc' }];
      const filterModel: readonly FilterSpec[] = [
        { type: 'text', colId: 'name', operator: 'contains', value: 'r' },
      ];
      const { source, calls } = makeControlledSource();
      const session = createServerSideRowSource(source, {
        cacheBlockSize: 10,
        initialSortModel: sortModel,
        initialFilterModel: filterModel,
      });

      session.getRowAt(0);
      calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 200 });
      await flush();
      session.getRowAt(10);
      calls[1]?.resolve({ rows: [makeRow('r10')], totalRowCount: 200 });
      await flush();

      let notifyCount = 0;
      session.subscribe(() => notifyCount++);

      session.invalidateBlocks([0, 1]);

      expect(session.getTotalRowCount()).toBe(200);
      expect(notifyCount).toBe(1);

      // Redispatch carries the original sort + filter state.
      session.getRowAt(0);
      expect(calls.length).toBe(3);
      expect(calls[2]?.params.sortModel).toBe(sortModel);
      expect(calls[2]?.params.filterModel).toBe(filterModel);
    });

    it('invalidateBlocks([]) is a silent no-op (no notify)', () => {
      const { source } = makeControlledSource();
      const session = createServerSideRowSource(source);
      let notifyCount = 0;
      session.subscribe(() => notifyCount++);

      session.invalidateBlocks([]);

      expect(notifyCount).toBe(0);
    });

    it('invalidateBlocks on an idle block is a silent no-op (no notify, no dispatch)', () => {
      const { source, calls } = makeControlledSource();
      const session = createServerSideRowSource(source);
      let notifyCount = 0;
      session.subscribe(() => notifyCount++);

      session.invalidateBlocks([42]);

      expect(notifyCount).toBe(0);
      expect(calls.length).toBe(0);
    });
  });

  describe('Phase 45.3 — peekRowAt (no-side-effect read)', () => {
    it('peekRowAt on an idle block returns null WITHOUT dispatching', () => {
      const { source, calls } = makeControlledSource();
      const session = createServerSideRowSource(source);

      const result = session.peekRowAt(0);

      expect(result).toBeNull();
      expect(calls.length).toBe(0);
      expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);
    });

    it('peekRowAt on a loaded block returns the row WITHOUT touching LRU', async () => {
      const { source, calls } = makeControlledSource();
      const session = createServerSideRowSource(source, {
        cacheBlockSize: 10,
        maxBlocksInCache: 2,
      });

      // Load block 0, then block 1, then block 2 — block 0 should be evicted
      // after block 2 loads (LRU cap = 2). With peekRowAt on block 0 BEFORE
      // block 2 loads, peek should NOT promote block 0 to most-recently-used.
      session.getRowAt(0);
      calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 100 });
      await flush();
      session.getRowAt(10);
      calls[1]?.resolve({ rows: [makeRow('r10')], totalRowCount: 100 });
      await flush();
      expect(session.peekRowAt(0)).toEqual(makeRow('r0'));
      // Load block 2: should evict block 0 (oldest insertion-order since peek
      // did NOT touch it). If peek had touched LRU, block 1 would be evicted.
      session.getRowAt(20);
      calls[2]?.resolve({ rows: [makeRow('r20')], totalRowCount: 100 });
      await flush();
      expect(session.getBlockState(0).kind).toBe(BLOCK_KIND_IDLE);
      expect(session.getBlockState(1).kind).toBe(BLOCK_KIND_LOADED);
      expect(session.getBlockState(2).kind).toBe(BLOCK_KIND_LOADED);
    });

    it('peekRowAt on a loading block returns null WITHOUT double-dispatching', () => {
      const { source, calls } = makeControlledSource();
      const session = createServerSideRowSource(source);

      session.getRowAt(0); // first dispatch
      expect(calls.length).toBe(1);

      const peeked = session.peekRowAt(0);

      expect(peeked).toBeNull();
      expect(calls.length).toBe(1); // no second dispatch
    });

    it('peekRowAt returns null for out-of-bounds indices', async () => {
      const { source, calls } = makeControlledSource();
      const session = createServerSideRowSource(source, { cacheBlockSize: 10 });

      session.getRowAt(0);
      calls[0]?.resolve({ rows: [makeRow('r0')], totalRowCount: 5 });
      await flush();

      expect(session.peekRowAt(-1)).toBeNull();
      expect(session.peekRowAt(5)).toBeNull();
      expect(session.peekRowAt(10000)).toBeNull();
      expect(calls.length).toBe(1); // out-of-bounds peek must not dispatch
    });
  });
});

import type { FilterSpec, RowSpec, SortSpec } from '../ir/index.js';

/**
 * Default block size for `createServerSideRowSource`. Rows are
 * fetched + cached in chunks of this many at a time; the SFC requests
 * row at displayed index `i` and the source returns the row from the
 * containing block (block index = floor(i / blockSize)). Defaults to
 * 100 — large enough that a typical viewport (~20 visible rows) sits
 * comfortably inside one block, small enough that off-screen blocks
 * are not over-fetched.
 *
 * .
 */
export const DEFAULT_CACHE_BLOCK_SIZE = 100;

/**
 * Default LRU cap on the number of cached blocks per session. When
 * the cache exceeds this count after a load resolves, the
 * least-recently-touched block is evicted. Defaults to 10 — at the
 * default block size of 100, this bounds memory at ~1000 rows per
 * session.
 *
 * .
 */
export const DEFAULT_SERVER_SIDE_MAX_BLOCKS_IN_CACHE = 10;

/**
 * Marker prefix the adapter uses to flag synthesized skeleton-row
 * placeholders during server-side row-model rendering. The body
 * render block detects this prefix on a row id to swap the row's
 * cell contents for shimmer placeholders + apply the
 * `cx-table-row--skeleton` modifier class.
 *
 * Synthesized ids have shape `${SERVER_SIDE_SKELETON_ID_PREFIX}${blockIndex}_${rowIndex}`
 * so they are unique across blocks + row positions; the indices are
 * incidental and consumers should not depend on them.
 *
 * .
 */
export const SERVER_SIDE_SKELETON_ID_PREFIX = '__chx_skel__';

/**
 * Test whether a row id is a server-side skeleton placeholder.
 *
 * .
 */
export function isServerSideSkeletonRowId(rowId: string): boolean {
  return rowId.startsWith(SERVER_SIDE_SKELETON_ID_PREFIX);
}

/**
 * Argument bag passed to the consumer's `ServerSideDataSource.getRows`
 * method per block-load dispatch. The source forms the half-open
 * `[startRow, endRow)` range from the block index + block size and
 * threads the current sort + filter specs so the server can scope its
 * query. The `signal` is the source's per-block `AbortController.signal`;
 * the consumer's `getRows` impl should wire it through to its
 * underlying `fetch` call (or check `signal.aborted` before returning).
 *
 * .
 */
export interface GetRowsParams {
  /** Inclusive lower bound. `0`-based displayed-row index. */
  readonly startRow: number;
  /** EXCLUSIVE upper bound. Server should return `endRow - startRow` rows. */
  readonly endRow: number;
  /** Current sort spec, ordered (multi-column). Empty array = no sort. */
  readonly sortModel: readonly SortSpec[];
  /** Current filter spec (multi-column AND). Empty array = no filter. */
  readonly filterModel: readonly FilterSpec[];
  /**
   * Cancellation channel. Consumer impls should pass this through to
   * `fetch(..., { signal })` or check `signal.aborted` before resolving
   * to avoid post-cancellation state writes.
   */
  readonly signal: AbortSignal;
}

/**
 * Response shape the consumer's `getRows` returns. Both fields are
 * REQUIRED — `totalRowCount` drives `virtualRowsPass`'s full Y range +
 * the scrollbar's known-total accuracy, so server impls that can't
 * return a true total should supply an over-estimate (chronix clips
 * visible-row rendering to what blocks actually return).
 *
 * .
 */
export interface GetRowsResult {
  /**
   * Rows for the requested `[startRow, endRow)` range, in the order the
   * server determined. Length should match `endRow - startRow`; shorter
   * arrays are treated as the end-of-data signal (totalRowCount must
   * still cover the actual count).
   */
  readonly rows: readonly RowSpec[];
  /** Total rows across all blocks the server would return for this view. */
  readonly totalRowCount: number;
}

/**
 * Consumer-supplied async row source. The single load method `getRows`
 * is the contract; chronix drives the lifecycle (per-block dispatch,
 * AbortSignal cancellation, LRU eviction, sort/filter view changes).
 * The optional `destroy` hook fires on SFC unmount + when the SFC
 * swaps the source identity.
 *
 * .
 */
export interface ServerSideDataSource {
  getRows(params: GetRowsParams): Promise<GetRowsResult>;
  destroy?(): void;
}

/**
 * Constructor-time options for `createServerSideRowSource`.
 *
 * .
 */
export interface CreateServerSideRowSourceOptions {
  /** Per-block size. Defaults to `DEFAULT_CACHE_BLOCK_SIZE` (100). */
  readonly cacheBlockSize?: number;
  /** LRU cap. Defaults to `DEFAULT_SERVER_SIDE_MAX_BLOCKS_IN_CACHE` (10). */
  readonly maxBlocksInCache?: number;
  /** Initial sort spec. Defaults to `[]`. */
  readonly initialSortModel?: readonly SortSpec[];
  /** Initial filter spec. Defaults to `[]`. */
  readonly initialFilterModel?: readonly FilterSpec[];
}

/** Block has not been requested; the next `getRowAt` into this block triggers a dispatch. */
export const BLOCK_KIND_IDLE = 'idle';
/** Block dispatch is in flight; subsequent `getRowAt` into the block dedup-returns null. */
export const BLOCK_KIND_LOADING = 'loading';
/** Block resolved with rows; `getRowAt` returns the row at the requested index. */
export const BLOCK_KIND_LOADED = 'loaded';
/** Block dispatch rejected with a non-AbortError; the next view change refetches. */
export const BLOCK_KIND_ERROR = 'error';

/**
 * Discriminated union of per-block states tracked inside the session.
 *
 * .
 */
export type BlockState =
  | { readonly kind: typeof BLOCK_KIND_IDLE }
  | { readonly kind: typeof BLOCK_KIND_LOADING }
  | { readonly kind: typeof BLOCK_KIND_LOADED; readonly rows: readonly RowSpec[] }
  | { readonly kind: typeof BLOCK_KIND_ERROR; readonly error: unknown };

/**
 * View-change input to `applyView`. Sent by the SFC when the user
 * changes sort or filter; the session aborts in-flight blocks, clears
 * the cache, and resets to the new view.
 *
 * .
 */
export interface ServerSideViewParams {
  readonly sortModel: readonly SortSpec[];
  readonly filterModel: readonly FilterSpec[];
}

/**
 * Chronix-internal session over a consumer's `ServerSideDataSource`.
 * Maintained per SFC mount (re-created when the source identity
 * changes). Reads are synchronous: `getRowAt(i)` returns the row if
 * the containing block is loaded, otherwise dispatches the block load
 * (transitioning state idle → loading) and returns `null` for the
 * caller to render as a skeleton row. Subscribers are notified
 * whenever a block resolves (loaded OR error) so the SFC re-renders.
 *
 * .
 */
export interface ServerSideRowSource {
  /** O(1) lookup by displayed index. `null` = not loaded; dispatches if idle. */
  getRowAt(displayedIndex: number): RowSpec | null;
  /**
   * no-side-effect read variant of `getRowAt`.
   * Returns the cached row if the containing block is `LOADED`;
   * returns `null` for `IDLE` / `LOADING` / `ERROR` blocks WITHOUT
   * dispatching a fresh fetch + WITHOUT touching the LRU
   * insertion-order. Used by the SFC's synthesized-rows loop to fill
   * the array with cached rows + skeletons; a separate viewport-driven
   * effect calls `getRowAt` for explicit dispatch on visibility.
   *
   * Contrast with `getRowAt` which has both side-effects (dispatch on
   * IDLE + LRU-touch on LOADED) — peek is the read-only complement
   * for render-loop consumption.
   */
  peekRowAt(displayedIndex: number): RowSpec | null;
  /** Server-reported total. `0` before first response. */
  getTotalRowCount(): number;
  /** Current block-state snapshot. `'idle'` for blocks never touched. */
  getBlockState(blockIndex: number): BlockState;
  /** Cache block size (echoed from options for the SFC's render-layer math). */
  readonly cacheBlockSize: number;
  /** Sort + filter change. Aborts in-flight, clears cache, no auto-dispatch. */
  applyView(view: ServerSideViewParams): void;
  /** Whole-cache invalidation. Aborts in-flight + clears cache; no auto-dispatch. */
  refresh(): void;
  /**
   * partial invalidation. For each input
   * blockIndex: LOADING blocks have their `AbortController.abort()`
   * called + the entry is removed from the cache (the next `getRowAt`
   * into that block dispatches anew); LOADED + ERROR blocks have the
   * entry removed. Blocks not in the cache (= implicitly IDLE) are
   * silently skipped. `totalRowCount`, `currentSortModel`,
   * `currentFilterModel`, and every non-invalidated block are LEFT
   * UNTOUCHED. A single `notify()` fires after all input indices are
   * processed so the SFC re-renders once. Contrast with `refresh()`
   * which clears the entire cache + resets `totalRowCount` to 0.
   */
  invalidateBlocks(blockIndices: readonly number[]): void;
  /** Register a re-render listener. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Lifecycle teardown. Aborts in-flight + clears cache + ignores subsequent reads. */
  destroy(): void;
}

interface InternalBlockEntry {
  state: BlockState;
  abort: AbortController | null;
}

/**
 * Build a `ServerSideRowSource` session over a consumer-supplied
 * `ServerSideDataSource`. Adapter SFCs hold one session per mount;
 * `destroy()` MUST be called on unmount or when swapping the
 * underlying source identity.
 *
 * .
 *
 * Block addressing: a row at displayed index `i` lives in block
 * `floor(i / cacheBlockSize)`. The first read of an idle block
 * synchronously dispatches `getRows({startRow, endRow, ...})` and
 * returns `null`; subsequent reads of the same loading block dedup
 * (no second dispatch).
 *
 * Cancellation: when `applyView` / `refresh` / `destroy` is called,
 * the session aborts the per-block `AbortController` for every
 * in-flight block. Consumer impls that wire `signal` into `fetch`
 * get native cancellation; impls that ignore `signal` see a stale
 * resolve which is dropped at the session level (the resolve path
 * checks `signal.aborted` before transitioning state).
 *
 * LRU: blocks are tracked in insertion order via a `Map`; on each
 * successful load resolve, if `cache.size > maxBlocksInCache`, the
 * oldest entry is evicted (Map iteration order = insertion order).
 * Loading blocks are NOT counted toward eviction (eviction only
 * fires on successful resolve, so in-flight loads can't push out
 * other in-flight loads).
 */
export function createServerSideRowSource(
  source: ServerSideDataSource,
  options: CreateServerSideRowSourceOptions = {},
): ServerSideRowSource {
  const cacheBlockSize = options.cacheBlockSize ?? DEFAULT_CACHE_BLOCK_SIZE;
  const maxBlocksInCache = options.maxBlocksInCache ?? DEFAULT_SERVER_SIDE_MAX_BLOCKS_IN_CACHE;
  if (cacheBlockSize <= 0) {
    throw new Error(
      `[chronix-table] createServerSideRowSource: cacheBlockSize must be > 0 (got ${cacheBlockSize}).`,
    );
  }
  if (maxBlocksInCache <= 0) {
    throw new Error(
      `[chronix-table] createServerSideRowSource: maxBlocksInCache must be > 0 (got ${maxBlocksInCache}).`,
    );
  }

  const blocks = new Map<number, InternalBlockEntry>();
  const listeners = new Set<() => void>();
  let totalRowCount = 0;
  let totalRowCountKnown = false;
  let currentSortModel: readonly SortSpec[] = options.initialSortModel ?? [];
  let currentFilterModel: readonly FilterSpec[] = options.initialFilterModel ?? [];
  let destroyed = false;

  function notify(): void {
    for (const listener of listeners) listener();
  }

  function abortAllInFlight(): void {
    for (const entry of blocks.values()) {
      if (entry.abort != null) {
        entry.abort.abort();
        entry.abort = null;
      }
    }
  }

  function evictOldestIfOverCap(): void {
    if (blocks.size <= maxBlocksInCache) return;
    for (const [blockIndex, entry] of blocks) {
      if (entry.state.kind === BLOCK_KIND_LOADED || entry.state.kind === BLOCK_KIND_ERROR) {
        blocks.delete(blockIndex);
        break;
      }
    }
  }

  function dispatchBlock(blockIndex: number): void {
    if (destroyed) return;
    const startRow = blockIndex * cacheBlockSize;
    const endRow = startRow + cacheBlockSize;
    if (totalRowCountKnown && startRow >= totalRowCount) return;
    const abort = new AbortController();
    blocks.set(blockIndex, {
      state: { kind: BLOCK_KIND_LOADING },
      abort,
    });
    const signal = abort.signal;
    const sortModelAtDispatch = currentSortModel;
    const filterModelAtDispatch = currentFilterModel;
    source
      .getRows({
        startRow,
        endRow,
        sortModel: sortModelAtDispatch,
        filterModel: filterModelAtDispatch,
        signal,
      })
      .then((result) => {
        if (destroyed) return;
        if (signal.aborted) return;
        if (
          sortModelAtDispatch !== currentSortModel ||
          filterModelAtDispatch !== currentFilterModel
        ) {
          return;
        }
        const entry = blocks.get(blockIndex);
        if (entry?.abort !== abort) return;
        entry.state = { kind: BLOCK_KIND_LOADED, rows: result.rows };
        entry.abort = null;
        totalRowCount = result.totalRowCount;
        totalRowCountKnown = true;
        // Move to end of insertion order so it counts as most-recently-touched.
        blocks.delete(blockIndex);
        blocks.set(blockIndex, entry);
        evictOldestIfOverCap();
        notify();
      })
      .catch((error: unknown) => {
        if (destroyed) return;
        if (signal.aborted) {
          const entry = blocks.get(blockIndex);
          if (entry?.abort === abort) {
            blocks.delete(blockIndex);
          }
          return;
        }
        const entry = blocks.get(blockIndex);
        if (entry?.abort !== abort) return;
        entry.state = { kind: BLOCK_KIND_ERROR, error };
        entry.abort = null;
        notify();
      });
  }

  function getRowAt(displayedIndex: number): RowSpec | null {
    if (destroyed) return null;
    if (displayedIndex < 0) return null;
    if (totalRowCountKnown && displayedIndex >= totalRowCount) return null;
    const blockIndex = Math.floor(displayedIndex / cacheBlockSize);
    const entry = blocks.get(blockIndex);
    if (entry == null) {
      dispatchBlock(blockIndex);
      return null;
    }
    if (entry.state.kind === BLOCK_KIND_LOADED) {
      // Touch for LRU: move to end of insertion order.
      blocks.delete(blockIndex);
      blocks.set(blockIndex, entry);
      const offset = displayedIndex - blockIndex * cacheBlockSize;
      return entry.state.rows[offset] ?? null;
    }
    return null;
  }

  function peekRowAt(displayedIndex: number): RowSpec | null {
    if (destroyed) return null;
    if (displayedIndex < 0) return null;
    if (totalRowCountKnown && displayedIndex >= totalRowCount) return null;
    const blockIndex = Math.floor(displayedIndex / cacheBlockSize);
    const entry = blocks.get(blockIndex);
    if (entry == null) return null;
    if (entry.state.kind === BLOCK_KIND_LOADED) {
      const offset = displayedIndex - blockIndex * cacheBlockSize;
      return entry.state.rows[offset] ?? null;
    }
    return null;
  }

  function getTotalRowCount(): number {
    return totalRowCount;
  }

  function getBlockState(blockIndex: number): BlockState {
    const entry = blocks.get(blockIndex);
    if (entry == null) return { kind: BLOCK_KIND_IDLE };
    return entry.state;
  }

  function applyView(view: ServerSideViewParams): void {
    if (destroyed) return;
    if (view.sortModel === currentSortModel && view.filterModel === currentFilterModel) {
      return;
    }
    abortAllInFlight();
    blocks.clear();
    currentSortModel = view.sortModel;
    currentFilterModel = view.filterModel;
    totalRowCountKnown = false;
    totalRowCount = 0;
    notify();
  }

  function refresh(): void {
    if (destroyed) return;
    abortAllInFlight();
    blocks.clear();
    totalRowCountKnown = false;
    totalRowCount = 0;
    notify();
  }

  function invalidateBlocks(blockIndices: readonly number[]): void {
    if (destroyed) return;
    if (blockIndices.length === 0) return;
    let mutated = false;
    for (const blockIndex of blockIndices) {
      const entry = blocks.get(blockIndex);
      if (entry == null) continue;
      if (entry.abort != null) {
        entry.abort.abort();
        entry.abort = null;
      }
      blocks.delete(blockIndex);
      mutated = true;
    }
    if (mutated) notify();
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    abortAllInFlight();
    blocks.clear();
    listeners.clear();
    if (typeof source.destroy === 'function') {
      try {
        source.destroy();
      } catch {
        // Consumer's destroy errors are swallowed — session teardown
        // must complete regardless.
      }
    }
  }

  return {
    getRowAt,
    peekRowAt,
    getTotalRowCount,
    getBlockState,
    cacheBlockSize,
    applyView,
    refresh,
    invalidateBlocks,
    subscribe,
    destroy,
  };
}

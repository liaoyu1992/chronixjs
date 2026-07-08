/**
 * @chronixjs/table-server-side — server-side row model for @chronixjs/table.
 *
 * Block-based cache + LRU eviction + AbortSignal cancellation over a
 * consumer-supplied `ServerSideDataSource`. Extracted from @chronixjs/table
 * so the core table package stays focused on client-side rendering; the
 * framework adapters (vue3 / vue2 / react) re-export these symbols so
 * adapter consumers see no API change.
 *
 * `FilterSpec` / `RowSpec` / `SortSpec` are imported from @chronixjs/table
 * (the IR types remain in core). This package is a downstream leaf: it
 * depends on core, nothing in core depends on it.
 */

export type {
  BlockState,
  CreateServerSideRowSourceOptions,
  GetRowsParams,
  GetRowsResult,
  ServerSideDataSource,
  ServerSideRowSource,
  ServerSideViewParams,
} from './server-side-row-source.js';
export {
  BLOCK_KIND_ERROR,
  BLOCK_KIND_IDLE,
  BLOCK_KIND_LOADED,
  BLOCK_KIND_LOADING,
  createServerSideRowSource,
  DEFAULT_CACHE_BLOCK_SIZE,
  DEFAULT_SERVER_SIDE_MAX_BLOCKS_IN_CACHE,
  isServerSideSkeletonRowId,
  SERVER_SIDE_SKELETON_ID_PREFIX,
} from './server-side-row-source.js';

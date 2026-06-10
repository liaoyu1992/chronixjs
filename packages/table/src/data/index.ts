/**
 * Data-source barrel.
 *
 * Phase 1 (2026-05-23): `ColumnTable` + `RowDataSource` interfaces +
 * `createColumnTable` / `createClientSideRowSource` factories.
 * Phase 45 (2026-05-29) adds `createServerSideRowSource` + the
 * `ServerSideDataSource` consumer contract + block-cache state types.
 */

export type { ColumnTable } from './column-table.js';
export { createColumnTable } from './column-table.js';

export type { RowDataSource } from './row-data-source.js';
export { createClientSideRowSource } from './row-data-source.js';

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

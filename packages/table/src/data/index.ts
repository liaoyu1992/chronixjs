/**
 * Data-source barrel.
 *
 * `ColumnTable` + `RowDataSource` interfaces +
 * `createColumnTable` / `createClientSideRowSource` factories.
 *
 * The server-side row model (`createServerSideRowSource` + the
 * `ServerSideDataSource` consumer contract + block-cache state types)
 * lives in the `@chronixjs/table-server-side` package.
 */

export type { ColumnTable } from './column-table.js';
export { createColumnTable } from './column-table.js';

export type { RowDataSource } from './row-data-source.js';
export { createClientSideRowSource } from './row-data-source.js';

# @chronixjs/table-server-side

Server-side row model for [`@chronixjs/table`](https://www.npmjs.com/package/@chronixjs/table) — block-based caching + LRU eviction + `AbortSignal` cancellation over a consumer-supplied async source. For datasets too large to load into memory at once (tens of thousands to millions of rows): the table requests only the blocks covering the visible viewport, the server returns just that slice.

> **Why a separate package.** The chronix-table core stays focused on client-side rendering (IR + layout passes + render helpers). The server-side row model — the coupling layer between virtualized rendering and an async data source — lives here as a downstream leaf: it depends on core, nothing in core depends on it.

## Install

Most consumers never install this directly — the framework adapters already depend on it and re-export every symbol:

```bash
pnpm add @chronixjs/table-vue3 vue                # Vue 3
pnpm add @chronixjs/table-vue2 vue@^2.7           # Vue 2.7
pnpm add @chronixjs/table-react react react-dom   # React 18 / 19
```

Install this package directly only when consuming the types / factory in non-Vue/non-React code (headless test harness, custom renderer, server-side export pipeline).

```bash
pnpm add @chronixjs/table-server-side @chronixjs/table
```

## When to use it

Reach for the server-side row model when the row count makes `clientSide` impractical — the full set won't fit in memory, or sort/filter/pagination should run on the server (e.g. a SQL `ORDER BY` + `LIMIT/OFFSET` backed by an index) rather than in the browser. The contract is a single method — `getRows({ startRow, endRow, sortModel, filterModel, signal })` → `{ rows, totalRowCount }` — and chronix drives the rest: per-block dispatch, in-flight cancellation, LRU eviction, skeleton-row placeholders.

For small/medium datasets, keep `clientSide` (the default) — pass `rows` and let chronix sort/filter/paginate in the browser.

## Quickstart

### Via a framework adapter (common case)

```vue
<template>
  <ChronixTable
    :columns="columns"
    row-model-type="serverSide"
    :server-side-data-source="dataSource"
    :cache-block-size="50"
  />
</template>

<script setup lang="ts">
import { ChronixTable } from '@chronixjs/table-vue3';
import type { ServerSideDataSource } from '@chronixjs/table-vue3';

const dataSource: ServerSideDataSource = {
  async getRows(params) {
    const res = await fetch('/api/rows', {
      method: 'POST',
      body: JSON.stringify({
        start: params.startRow,
        end: params.endRow,
        sort: params.sortModel,
        filter: params.filterModel,
      }),
      signal: params.signal, // wire the cancel channel through to fetch
    });
    const json = await res.json();
    return { rows: json.rows, totalRowCount: json.total };
  },
};
</script>
```

The SFC wires the session lifecycle (mount/unmount, view-change abort, block prefetch, skeleton rendering) — your only job is the `getRows` body.

### Headless (no framework)

```ts
import { createServerSideRowSource, type ServerSideDataSource } from '@chronixjs/table-server-side';

const source: ServerSideDataSource = {
  async getRows({ startRow, endRow, sortModel, filterModel, signal }) {
    // return exactly (endRow - startRow) rows for the requested range,
    // scoped by sort + filter, plus the true total row count.
    return { rows: [], totalRowCount: 0 };
  },
};

const session = createServerSideRowSource(source, {
  cacheBlockSize: 100, // rows per block (default 100)
  maxBlocksInCache: 10, // LRU cap (default 10 → ~1000 rows resident)
});

session.getRowAt(0); // null on first read → dispatches block 0
session.getTotalRowCount(); // 0 until the first response lands
const off = session.subscribe(() => rerender());

// user changes sort/filter:
session.applyView({ sortModel: [{ colId: 'name', direction: 'asc' }], filterModel: [] });
session.destroy(); // abort in-flight + clear cache + ignore further reads
```

## What's in here

**Factory + session**

- `createServerSideRowSource(source, options?)` — builds a `ServerSideRowSource` session. O(1) `getRowAt(i)` (dispatches + returns `null` on idle blocks, returns the row on loaded blocks), `peekRowAt(i)` read-only variant, `applyView` / `refresh` / `invalidateBlocks` cache control, `subscribe` for re-render.
- `ServerSideDataSource` — the consumer contract: `getRows(params): Promise<GetRowsResult>` (+ optional `destroy?`).

**Per-block params + result**

- `GetRowsParams` — `{ startRow, endRow, sortModel, filterModel, signal }`. `startRow` inclusive, `endRow` exclusive. Wire `signal` into `fetch` for native cancellation.
- `GetRowsResult` — `{ rows, totalRowCount }`. Both required; an over-estimate total is acceptable (chronix clips visible-row rendering to what blocks actually return).

**Block state**

- `BlockState` discriminated union + `BLOCK_KIND_IDLE` / `BLOCK_KIND_LOADING` / `BLOCK_KIND_LOADED` / `BLOCK_KIND_ERROR`.
- `ServerSideViewParams` — `applyView` input.

**Defaults + skeleton markers**

- `DEFAULT_CACHE_BLOCK_SIZE` (100) / `DEFAULT_SERVER_SIDE_MAX_BLOCKS_IN_CACHE` (10).
- `SERVER_SIDE_SKELETON_ID_PREFIX` (`__chx_skel__`) + `isServerSideSkeletonRowId(id)` — the marker chronix uses to flag synthesized skeleton-row placeholders while a block loads.

## Notes

- `FilterSpec`, `RowSpec`, `SortSpec` are imported from `@chronixjs/table` (the IR types remain in core).
- This package has `sideEffects: false` — importing it never changes global state.
- Behavior is covered by 32 unit tests covering block dispatch, LRU eviction, `AbortSignal` cancellation, view-change invalidation, and skeleton-row synthesis.

## License

[MIT](./LICENSE) © liaoyu1992

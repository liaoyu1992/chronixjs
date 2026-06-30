import type { ColumnSpec, FilterSpec, SortSpec } from '../ir/index.js';

/**
 * per-column snapshot for `TableViewState`.
 *
 * Captures the three column-level state surfaces that can drift from the
 * `ColumnSpec` defaults during normal user interaction: `hide` (
 * column-visibility menu), `width` (column-resize), and `pinned`
 * (left/right zone). Column `id` is the canonical key; saved
 * entries referencing an `id` not present in the current `columns` prop
 * at restore time are silently dropped by `applyTableView` (Decision E.1).
 *
 * All three fields optional: a saved entry only stores the fields that
 * actually diverge from the column's declared spec. Restore-time
 * reconciliation merges the saved fields ON TOP of the current
 * `ColumnSpec` (so columns added since the snapshot keep their defaults).
 */
export interface TableViewColumnState {
  readonly id: string;
  readonly hide?: boolean;
  readonly width?: number;
  readonly pinned?: 'left' | 'right' | null;
}

/**
 * canonical JSON snapshot of a chronix-table's
 * column layout + sort + filter + pagination state.
 *
 * `version: 1` is a literal-type-pinned format marker so future widening
 * (`version: 2` adding `groupBy` / `selectedRowIds` / etc.) cascades
 * through `applyTableView`'s dispatch on the version field. `version: 1`
 * is the only shape recognized today; foreign inputs are silently no-op'd.
 *
 * Persistence is delegated to the consumer (Decision D.1): pass through
 * `JSON.stringify` + their storage of choice (localStorage / URL hash /
 * server-side profile / Yjs). Core never reads or writes I/O.
 *
 * Column order is preserved by the order of entries in
 * `state.columns` — `applyTableView` iterates this array as its primary
 * ordering driver, then appends any columns present in the current
 * `columns` prop but absent from the snapshot (newly-added columns since
 * snapshot time).
 */
export interface TableViewState {
  readonly version: 1;
  readonly columns: readonly TableViewColumnState[];
  readonly sort: readonly SortSpec[];
  readonly filter: readonly FilterSpec[];
  readonly page: number;
  readonly pageSize: number;
}

/**
 * input for `serializeTableView`. The four
 * non-`columns` fields mirror the equivalent TableHandle getter shapes
 * (`getSort()` / `getFilter()` / `getPage()` / `getPageSize()`); the
 * `columns` prop is passed verbatim and projected to
 * `TableViewColumnState[]` by walking the array.
 */
export interface SerializeTableViewInput {
  readonly columns: readonly ColumnSpec[];
  readonly sort: readonly SortSpec[];
  readonly filter: readonly FilterSpec[];
  readonly page: number;
  readonly pageSize: number;
}

/**
 * result of `applyTableView`. Adapters consume
 * this by passing each field to its corresponding TableHandle setter
 * (`setSort` / `setFilter` / `setPage` / `setPageSize`) + emitting
 * `columns-change` with the reconciled `columns` array so the consumer
 * rebuilds the prop.
 */
export interface TableViewApplyResult {
  readonly columns: readonly ColumnSpec[];
  readonly sort: readonly SortSpec[];
  readonly filter: readonly FilterSpec[];
  readonly page: number;
  readonly pageSize: number;
}

/**
 * project the current table state into a
 * JSON-serializable `TableViewState` snapshot.
 *
 * Pure function. No DOM, no I/O, no side effects. The output is safe
 * to pass directly through `JSON.stringify` — every field shape avoids
 * `undefined` values, functions, Symbols, Maps, and other non-JSON
 * primitives.
 *
 * Column projection: for each `ColumnSpec`, emits a `TableViewColumnState`
 * with `id` + the three drift-tracked fields (`hide`, `width`, `pinned`).
 * Fields not present on the source column are omitted from the saved
 * entry rather than written as `undefined` — this keeps the output JSON
 * minimal and round-trips cleanly through `JSON.parse(JSON.stringify(x))`.
 */
export function serializeTableView(input: SerializeTableViewInput): TableViewState {
  const columns: TableViewColumnState[] = input.columns.map((col) => {
    const entry: { id: string; hide?: boolean; width?: number; pinned?: 'left' | 'right' | null } =
      {
        id: col.id,
      };
    if (col.hide !== undefined) entry.hide = col.hide;
    if (col.width !== undefined) entry.width = col.width;
    if (col.pinned !== undefined) entry.pinned = col.pinned;
    return entry;
  });

  return {
    version: 1,
    columns,
    sort: input.sort,
    filter: input.filter,
    page: input.page,
    pageSize: input.pageSize,
  };
}

/**
 * reconcile a `TableViewState` snapshot against
 * the current `columns` prop + return the data the consumer needs to
 * pass to `setSort` / `setFilter` / `setPage` / `setPageSize` plus the
 * rebuilt columns array.
 *
 * Reconciliation per Decision E.1 (silent):
 *
 * 1. Group the input `currentColumns` by `id` into a Map.
 * 2. Walk `state.columns` in order: for each entry whose `id` exists in
 *    the Map, push the current column with `{hide, width, pinned}`
 *    merged from the saved entry; entries with no matching `id` are
 *    silently dropped.
 * 3. Append any columns present in `currentColumns` but absent from
 *    `state.columns` to the end of the result, in their original
 *    declared order (newly-added columns since the snapshot). They keep
 *    their declared `hide` / `width` / `pinned` defaults.
 * 4. Filter `state.sort` + `state.filter` to entries whose `colId` exists
 *    in the resolved column list — drops sort/filter referencing
 *    removed columns silently.
 *
 * Foreign inputs (anything not matching `version: 1`) return the
 * current state unchanged so consumers can use this as a one-shot
 * "restore-or-noop" call without pre-validation.
 *
 * Pure function. No DOM. No throws. The returned `columns` array is a
 * freshly allocated array; merged column entries are freshly allocated
 * objects (saved fields override declared fields via spread).
 */
export function applyTableView(
  state: TableViewState,
  currentColumns: readonly ColumnSpec[],
  currentSort: readonly SortSpec[],
  currentFilter: readonly FilterSpec[],
  currentPage: number,
  currentPageSize: number,
): TableViewApplyResult {
  if (state.version !== 1) {
    return {
      columns: currentColumns,
      sort: currentSort,
      filter: currentFilter,
      page: currentPage,
      pageSize: currentPageSize,
    };
  }

  const byId = new Map(currentColumns.map((col) => [col.id, col]));
  const seenIds = new Set<string>();
  const reconciledColumns: ColumnSpec[] = [];

  for (const savedEntry of state.columns) {
    const sourceColumn = byId.get(savedEntry.id);
    if (sourceColumn === undefined) continue;
    seenIds.add(savedEntry.id);

    const merged: ColumnSpec = {
      ...sourceColumn,
      ...(savedEntry.hide !== undefined ? { hide: savedEntry.hide } : {}),
      ...(savedEntry.width !== undefined ? { width: savedEntry.width } : {}),
      ...(savedEntry.pinned !== undefined ? { pinned: savedEntry.pinned } : {}),
    };
    reconciledColumns.push(merged);
  }

  for (const col of currentColumns) {
    if (!seenIds.has(col.id)) reconciledColumns.push(col);
  }

  const reconciledIds = new Set(reconciledColumns.map((c) => c.id));
  const reconciledSort = state.sort.filter((s) => reconciledIds.has(s.colId));
  // expression-variant filter specs have no
  // single colId — their compare leaves reference column ids internally,
  // and `filterPass` already rejects atomically when any leaf points at
  // a missing column. Pass them through verbatim; downstream rejection
  // handles the "saved view references column that no longer exists"
  // case symmetrically with the text / number variants here.
  const reconciledFilter = state.filter.filter((f) =>
    f.type === 'expression' ? true : reconciledIds.has(f.colId),
  );

  return {
    columns: reconciledColumns,
    sort: reconciledSort,
    filter: reconciledFilter,
    page: state.page,
    pageSize: state.pageSize,
  };
}

/**
 * IR primitive: row entity.
 *
 * `RowSpec` is the chronix-internal representation of a single row
 * after the consumer's raw data has been wrapped into chronix's IR.
 * Adapters typically derive `RowSpec[]` from the consumer's `rows`
 * prop by assigning a stable `id` (often from the row's primary
 * key) and copying the row's data fields into `data`.
 *
 * **Identity contract:** `id` must be stable across renders.
 * Chronix uses it as the canonical key for row selection state,
 * focused row references, scroll-to-row targeting, and sort/filter
 * pass ordering. Two rows with the same `id` is undefined behavior.
 *
 * **`data` shape:** an immutable record from arbitrary field names
 * to arbitrary values. Cell value extraction uses
 * `data[column.field]`. The `unknown` value type means consumers
 * can carry any value (strings, numbers, dates, custom objects);
 * formatters and editors are responsible for type-narrowing.
 *
 * **Tree data fields (2026-05-28):** `children` is the
 * consumer-facing field — set it on parent rows to declare a
 * hierarchy. `depth` + `groupKey` are POST-`treeFlattenPass` outputs
 * owned by chronix (the layout pass populates them during flattening);
 * consumer-supplied values on input are overwritten. The fields are
 * declared as `readonly` on the interface for IR-shape uniformity, but
 * `treeFlattenPass` constructs new RowSpec objects when it needs to
 * write `depth` / `groupKey` (it does not mutate input rows).
 */
export interface RowSpec {
  /**
   * Stable identifier. Required. Canonical key for selection,
   * focus, scroll-to, and pass ordering.
   */
  readonly id: string;

  /**
   * Row data as an immutable property bag. Cell values are read
   * via `data[column.field]`. Consumers shape this freely —
   * chronix treats values opaquely until a column's formatter /
   * filter / editor inspects them.
   */
  readonly data: Readonly<Record<string, unknown>>;

  /**
   * Per-row height override. When set, `rowLayoutPass` resolves this
   * row's height as `heightHint` instead of the theme's uniform
   * `defaultRowHeight`. introduces this field;
   * Phase ~24's row auto-height pass + Phase ~9's nested-header-row
   * sizing both write into it. Matches the chronix-gantt `RowSpec`
   * `heightHint` precedent so cross-package consumers see the same
   * field name + semantics.
   */
  readonly heightHint?: number;

  /**
   * tree-data nested children. When set,
   * `treeFlattenPass` recurses into this array; the parent row gets
   * its expand/collapse chevron rendered in the `treeColumn`-flagged
   * column. Leaf rows omit this field (or pass `[]` — both treated
   * as "no children"). The field is `readonly RowSpec[]` so the same
   * IR shape composes recursively.
   *
   * Consumer ergonomics: the entire tree is passed at mount time
   * with this field set on every parent row. chronix does not lazy-
   * load children (will). `treeFlattenPass` walks the tree
   * once per render to produce the flat visible-only row list.
   */
  readonly children?: readonly RowSpec[];

  /**
   * lazy-eligible parent marker. Set to `true`
   * on a row whose children should be fetched on first expand via the
   * adapter's `childrenLoader` prop. Only honored when `children`
   * is undefined — sync `children` always wins.
   *
   * Semantics:
   *
   * - `children !== undefined` → sync tree; `hasChildren`
   *   is IGNORED.
   * - `children === undefined && hasChildren === true` → lazy-eligible
   *   parent. Chevron renders; first expand invokes `childrenLoader`.
   * - `children === undefined && hasChildren !== true` → leaf row
   *   (no chevron).
   * - `children === undefined && hasChildren === true && childrenLoader
   *   is not provided` → chevron renders + click is a silent no-op
   *   + one-time console.warn per rowId.
   *
   * Consumer ergonomics: server-backed trees set `hasChildren: true`
   * on every node the server reports as a parent; chronix delegates
   * child fetching to `childrenLoader`. Once loaded, the children
   * cache for the SFC's session (Decision H.1) unless
   * `invalidateLazyChildren(rowId)` is called.
   */
  readonly hasChildren?: boolean;

  /**
   * post-`treeFlattenPass` row depth.
   * `0` = top level, `1` = direct child of a top-level parent, etc.
   * Populated by `treeFlattenPass` on each output row; consumer-
   * supplied values on input are overwritten.
   *
   * Originally declared at as a forward-compat field with
   * no semantics. gives it semantics as a chronix-populated
   * output field.
   */
  readonly depth?: number;

  /**
   * post-`treeFlattenPass` parent row id, or
   * `null` for top-level rows. Populated by `treeFlattenPass`;
   * consumer-supplied values on input are overwritten.
   *
   * Originally declared at as a forward-compat field with
   * no semantics. gives it semantics as a chronix-populated
   * output field.
   */
  readonly groupKey?: string | null;

  /**
   * pin this row to the top or bottom of the
   * body. Pinned rows are extracted from `props.rows` BEFORE
   * `filterPass` / `sortPass` / `pagePass` run — they always render
   * regardless of filter spec, never participate in sort ordering, and
   * are never hidden by pagination. They also skip `virtualRowsPass`,
   * staying in the DOM at every scroll position.
   *
   * **DOM placement**: top-pinned rows render at `position: sticky;
   * top: 0` inside the body content layer; bottom-pinned rows render
   * at `position: sticky; bottom: 0`. Pinned-column zone offsets still
   * apply per-cell, so a pinned row in a pinned column
   * intersects naturally.
   *
   * **Selection**: pinned rows are excluded from the `selectAll` header
   * checkbox's "all visible rows" set per Decision D.1. Per-
   * row click + checkbox toggling still works — consumers who want to
   * include pinned rows in select-all can override programmatically.
   *
   * **Tree data**: pinned rows must be LEAVES in v1. `children` on a
   * pinned row is ignored with a `console.warn` at mount per
   * Decision (out-of-scope).
   *
   * **Limit**: practical limit is ~50 pinned rows total (top + bottom);
   * above that, a `console.warn` advises switching to the footer
   * aggregate row pass .
   */
  readonly pinned?: 'top' | 'bottom';

  /**
   * allow the user to drag this row's grip
   * cell (when `rowDragColumn.show === true`) to reorder it. Defaults
   * to `true`. When `false`, the SFC's drag-handle rail renders an
   * empty cell for this row (no `≡` glyph, no pointer wiring), so a
   * regular cell click / range-select / dblclick-edit / drag-fill on
   * the rest of the row keeps working.
   *
   * Mirror of `ColumnSpec.reorderable?: boolean` on the
   * row axis. Pinned rows (`pinned: 'top' | 'bottom'`) are
   * unconditionally non-draggable regardless of this field —
   * pinned-row semantics are sticky-by-design per .
   */
  readonly draggable?: boolean;
}

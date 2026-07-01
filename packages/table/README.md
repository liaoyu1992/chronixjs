# @chronixjs/table

Framework-agnostic table core. Types, intermediate representation (IR), pure layout / interaction / render helpers, theme tokens. No runtime DOM, no framework binding — those live in adapter packages: [`@chronixjs/table-vue3`](https://github.com/liaoyu1992/chronixjs/tree/master/adapters/table-vue3), [`@chronixjs/table-vue2`](https://github.com/liaoyu1992/chronixjs/tree/master/adapters/table-vue2), and [`@chronixjs/table-react`](https://github.com/liaoyu1992/chronixjs/tree/master/adapters/table-react).

> **Status.** Currently published under the `alpha` npm dist-tag (`@alpha`). After v0.1.0 GA lands, the `@alpha` suffix can be omitted (the default `latest` tag will point to v0.1.0). APIs may shift before `1.0.0`; SemVer stability commitment begins at `1.0`.

## Install

```bash
pnpm add @chronixjs/table@alpha        # currently
pnpm add @chronixjs/table              # after v0.1.0 GA
```

Most consumers want a framework adapter instead:

```bash
pnpm add @chronixjs/table-vue3@alpha vue                          # Vue 3
pnpm add @chronixjs/table-vue2@alpha vue@^2.7                     # Vue 2.7
pnpm add @chronixjs/table-react@alpha react react-dom     # React 18 / 19
```

The adapter depends on this core; installing the adapter pulls it transitively. Install this core package directly only when consuming the types / IR / pure helpers in non-Vue/non-React code (canvas renderer, headless test harness, server-side row export, etc.).

## What's new in v0.1.0

22 consumer-tunable extensions plus two B-class chronix-NEW IR variants land in v0.1.0 (the cumulative changeset from v0.1.0-alpha):

- **Cell-style editor** (4 axes × per-side × HSV picker; Phase 99.2 + 99.2.1 + 99.2.2 + 99.2.3 + 99.2.3.1 + 99.2.3.2): background + text + font + border styling on every cell, controllable via the `cellStyleByRowIdColId?` SFC prop. Per-side border overrides (top/right/bottom/left × color/width/style) with 5-button segmented control. HSV picker disclosure on both bg/text AND border tabs. Preset color palette + per-axis recent-color LRU ring. 3-tier font-weight precision (Bold toggle + 9-button grid + 1-1000 continuous slider).
- **Advanced filter typeahead** (ALL 14 originally-scoped sub-phases; Phase 100.2.x): 4-slot type-aware token detector (column / operator / conjunction / value). Histogram count badge per value suggestion. Date-value formatter prop. I18n operator labels prop. Auto-trigger after column/operator/keyword commits. Auto-scroll active item into view. String-literal-internal commit. Per-slot-kind recent LRU rings. SSR-async value getter prop with request-id race-discard.
- **Validation** (Phase 101): per-column `validator?: (value, row) => string | EditValidationError | null` (sync only in v0.1.0; async parked for v0.1.x). Invalid cell paints `cx-table-cell--invalid` + `data-cell-invalid="true"` + `aria-invalid="true"`. `cell-edit-stop` payload carries `validationError?: EditValidationError`. Locked execution order: coerce → validator → outcome.
- **Multi-filter container** (Phase 102): NEW `MultiFilterSpec { type: 'multi'; colId; mode: 'AND' | 'OR'; filters }` extending `FilterSpec` union. `ColumnSpec.filterUi: 'text' | 'set' | 'multi'` literal widening. `multiFilterChildTypes?: readonly ('text' | 'number' | 'set')[]` config (default `['text', 'text']`). Native `<details><summary>` disclosure + segmented AND/OR mode toggle. Runtime add/remove slot via `+ 添加条件` / `×` buttons (Phase 114) + `multiFilterDefaultMode?` SFC prop. Set-child slot variant via `MultiFilterChildSet { type: 'set'; selectedValues: readonly … | null }` + consumer-overridable `multiFilterChildRenderer?` per-leaf slot (Phase 116). Recursive group-tree IR via `MultiFilterEntry = MultiFilterChild | MultiFilterGroup` widening (Phase 117) + in-UI affordances for nested groups: recursive render + `+ 添加分组` / `× 移除分组` buttons + 3 path-based handle methods `getMultiFilterEntryAtPath` / `setMultiFilterEntryAtPath` / `removeMultiFilterEntryAtPath` (Phase 117.1).
- **Cross-cell row validators** (Phase 115): NEW `rowValidators?: readonly RowValidator[]` SFC prop. Each validator runs across the whole row spec; results surface as `RowValidationViolation[]` per cell. New `getInvalidCells()` handle method + `invalid-cells-change` emit. Paste / drag-fill respects `pasteValidatorPolicy?: 'skip-rejected' | 'allow-all'`.
- **Per-column typeahead recent-rings** (Phase 118): `typeaheadRecentScope?: 'global' | 'per-column-value'` opt-in widens the Phase 100.2.5 LRU ring shape from per-slot to per-`${slot}:${colId}` when set. `advancedFilterValueGetter?` signature widened with optional 3rd-arg `signal?: AbortSignal` for cancellation-aware fetches; race-discard token preserved as defense-in-depth. Cell-style border-tab joins the preset palette + LRU recent ring.

183 consecutive zero-bug-in-production phases shipped under the AGGRESSIVE phase-bundling discipline (Phase 1 → Phase 118 + Phase 117.1, 2026-05-23 → 2026-06-02). See [`audit/TABLE_API_SURFACE_v0.1.0.md`](https://github.com/liaoyu1992/chronixjs/blob/master/audit/TABLE_API_SURFACE_v0.1.0.md) for the full export inventory and [`audit/TABLE_PUBLISH_PARITY_SWEEP_v0.1.0.md`](https://github.com/liaoyu1992/chronixjs/blob/master/audit/TABLE_PUBLISH_PARITY_SWEEP_v0.1.0.md) for the cross-adapter parity verdict.

## What's in here

### Specifications (immutable input shapes)

- `ColumnSpec` — column definition (id, field, width / flex, sort / filter / edit / resize / reorder / autosize toggles, pinning, type, headerGroup, aggregator, tooltip getters, treeColumn flag, valueGetter / valueFormatter / cellClass, `validator?` for Phase 101, `multiFilterChildTypes?` for Phase 102, `filterUi: 'text' | 'set' | 'multi'`)
- `RowSpec` — row definition (id, data, children for tree-data, hasChildren for lazy-load, pinned: 'top' | 'bottom')
- `HeaderCell`, `SortSpec`, `CellRange`, `CellRef` — companion primitives
- `FilterSpec` discriminated union of 5 variants: `TextFilterSpec` (Phase 9) / `NumberFilterSpec` (Phase 9.1) / `ExpressionFilterSpec` (Phase 42 DSL) / `SetFilterSpec` (Phase 43) / `MultiFilterSpec` (Phase 102)
- `MultiFilterChild` union of `MultiFilterChildText` + `MultiFilterChildNumber` + `MultiFilterChildSet` (Phase 116; headless leaves for multi-filter container)
- `MultiFilterEntry = MultiFilterChild | MultiFilterGroup` (Phase 117 group-tree IR widening; `MultiFilterGroup = { type: 'group'; mode: 'AND' | 'OR'; filters: readonly MultiFilterEntry[] }`)
- `EditValidationError { reason: string; code? }` — structured payload returned from `ColumnSpec.validator` (Phase 101)
- `RowValidator { id: string; validate: (row, ctx) => readonly RowValidationViolation[] }` + `RowValidationViolation { colId; reason; code? }` (Phase 115; cross-cell row-level violations)
- `ColumnTable`, `RowDataSource` — O(1)-lookup wrappers built via `createColumnTable` / `createClientSideRowSource`

### Layout passes (pure functions)

- `columnLayoutPass` — resolve widths from `width` / `flex` / clamps
- `rowLayoutPass` — Y placement with row heights from `RowSpec.heightHint` or `theme.defaultRowHeight`
- `sortPass`, `filterPass`, `pagePass` — sort / filter / paginate the row stream
- `pinnedColsPass`, `pinnedRowsPass` — split into left / center / right column zones + top / center / bottom row zones
- `virtualRowsPass` — viewport + overscan → visible row range
- `treeFlattenPass` — recursive `RowSpec.children` → flat ordered list driven by expanded ids

### Public chronix-NEW helpers

The pure helpers below are canonical across all 3 adapters and stable under SemVer:

- **Column infrastructure**: `clampResizeWidth`, `computeColumnReorder`, `getColumnDropTarget`, `computeAutosizeWidth`
- **Row infrastructure**: `computeRowReorder`, `getRowDropTarget`
- **Cell-range + clipboard**: `computeCellRangeEnvelope`, `computeRangeRowIds`, `formatCellRangeForClipboard`, `parseClipboardTsv`, `computePasteMutations`, `computeDragFillEnvelope`, `computeDragFillMutations`
- **Editing**: `coerceEditDraftValue`, `findNextEditableCell`, `runCellValidator` (Phase 101)
- **Selection**: `computeRowSelectionTriState`, `collectDescendantRowIds`
- **Keyboard navigation**: `computeNextActiveCell`, `deriveShiftArrowCellRange`, `findDataRegionBoundary`, `computeScrollIntoView`, `computeDragAutoScrollVelocity`
- **History**: `appendMutationBatch`, `popUndoBatch`, `popRedoBatch`, `reverseMutationBatch`, `EMPTY_MUTATION_HISTORY`
- **Header**: `computeHeaderGroupSpans`, `computeFooterValues`
- **Tooltip + tree**: `resolveCellTooltip`, `synthesizeLazyChildren`
- **Pagination**: `computeVisiblePageNumbers`
- **Filter parsing**: `parsePrefixNumberFilter`, `formatPrefixNumberFilter`, `parseFilterExpression`, `buildExpressionPredicate`, `expressionReferencesValidColumns`
- **Quick-find**: `splitTextByQuickFindMatch`
- **Unique-value collection**: `collectUniqueColumnValues`, `computeColumnNumericExtents`
- **Export**: `exportToCsv` (RFC 4180-compliant), `exportToXlsx`, `buildXlsxSheetData`, `defaultStatusBarText`
- **A11y formatters**: `formatActiveCellAnnouncement`, `formatColumnHeaderDescription`
- **Saved views**: `serializeTableView`, `applyTableView`

### Theme

`ChronixTableTheme` + `defaultChronixTableTheme` — 29-token theme dictionary (cell padding, row heights, header heights, borders, scrollbar dims, drag-fill handle color, tooltip styling, overlay backgrounds, status-bar styling, tree spinner colors).

`cssVarsForTheme(theme)` — projects the theme into a CSS-variable record suitable for inline-style application.

### Render helpers

- `getCellValue({row, column})` — extract the post-`valueGetter` value
- `formatCellValue({row, column})` — extract + format via `valueFormatter` (falls back to `defaultFormatCellValue`)
- `resolveCellClassNames(spec, args)` — resolve the 3-form `cellClass` (string / array / callback) shape into a flat string array

## Quickstart (TypeScript, no framework)

This package has no runtime side effects. Typical use case: declare specs + use the pure helpers (layout passes, mutation helpers, export helper) inside your own renderer (canvas, custom DOM, headless test). For a ready-made Vue 3 component see [`@chronixjs/table-vue3`](https://www.npmjs.com/package/@chronixjs/table-vue3).

```ts
import {
  applyTableView,
  columnLayoutPass,
  defaultChronixTableTheme,
  exportToCsv,
  serializeTableView,
  sortPass,
  type ColumnSpec,
  type RowSpec,
  type TableViewState,
} from '@chronixjs/table';

const columns: readonly ColumnSpec[] = [
  { id: 'id', field: 'id', headerName: 'ID', width: 80 },
  { id: 'name', field: 'name', headerName: '名称', flex: 1 },
  { id: 'qty', field: 'qty', headerName: '数量', width: 120, type: 'number' },
];

const rows: readonly RowSpec[] = [
  { id: 'r1', data: { id: 1, name: 'Alpha', qty: 10 } },
  { id: 'r2', data: { id: 2, name: 'Beta', qty: 30 } },
  { id: 'r3', data: { id: 3, name: 'Gamma', qty: 20 } },
];

const widthByColId = columnLayoutPass({
  columns,
  theme: defaultChronixTableTheme,
  availableWidth: 800,
}).widthByColId;

const sortedRows = sortPass({
  rows,
  columns,
  sortSpecs: [{ colId: 'qty', direction: 'asc' }],
}).sortedRows;

const csv = exportToCsv({ rows: sortedRows, columns });
// "id,名称,数量\r\n1,Alpha,10\r\n3,Gamma,20\r\n2,Beta,30"
```

## Parity

`@chronixjs/table` is a chronix-NEW design. The pure helpers are covered by **696 unit tests** in the `@chronixjs/table` core + per-adapter SFC wiring guards (vue3 **543** / vue2 **533** / react **513**). See `audit/TABLE_PHASE_*_DESIGN.md` in the monorepo for per-phase decision records and `audit/TABLE_PUBLISH_PARITY_SWEEP_v0.1.0.md` for the cross-adapter feature-parity verdict.

## License

[MIT](./LICENSE) © liaoyu1992

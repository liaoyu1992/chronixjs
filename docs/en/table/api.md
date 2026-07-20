# Table API Reference

Complete API reference for the data table component.

## Component Props

### Required

| Prop      | Type                    | Description        |
| --------- | ----------------------- | ------------------ |
| `columns` | `readonly ColumnSpec[]` | Column definitions |
| `rows`    | `readonly RowSpec[]`    | Row data           |

### Theme & Appearance

| Prop                  | Type                         | Default | Description                  |
| --------------------- | ---------------------------- | ------- | ---------------------------- |
| `theme`               | `Partial<ChronixTableTheme>` | —       | Theme token overrides        |
| `enableRowAutoHeight` | `boolean`                    | `false` | Auto row height from content |
| `maxRowAutoHeightPx`  | `number`                     |         | Max auto row height          |

### Sorting & Filtering

| Prop                           | Type            | Default | Description                         |
| ------------------------------ | --------------- | ------- | ----------------------------------- |
| `showFilterRow`                | `boolean`       | `false` | Show filter row below header        |
| `multiFilterDefaultMode`       | `'AND' \| 'OR'` | `'AND'` | Default multi-filter mode           |
| `setFilterVirtualizeThreshold` | `number`        |         | Virtualize set filter above N items |
| `numberFilterShowRangeSlider`  | `boolean`       | `false` | Show range slider in number filter  |

### Editing & Validation

| Prop                   | Type                                 | Default           | Description             |
| ---------------------- | ------------------------------------ | ----------------- | ----------------------- |
| `rowValidators`        | `readonly RowValidator[]`            |                   | Row-level validators    |
| `pasteValidatorPolicy` | `'skip-rejected' \| 'allow-invalid'` | `'skip-rejected'` | Paste validation policy |

### Footer & Menus

| Prop                       | Type      | Default | Description                   |
| -------------------------- | --------- | ------- | ----------------------------- |
| `showFooterRow`            | `boolean` | `false` | Show footer row               |
| `showColumnVisibilityMenu` | `boolean` | `false` | Show column visibility toggle |
| `showColumnHeaderMenu`     | `boolean` | `false` | Show column header menus      |
| showStatusBar              | oolean    | alse    | Show status bar (footer left) |

### Keyboard & Navigation

| Prop                       | Type      | Default | Description                 |
| -------------------------- | --------- | ------- | --------------------------- |
| `enableKeyboardNavigation` | `boolean` | `false` | Enable keyboard navigation  |
| `enableKeyboardAutoScroll` | `boolean` | `false` | Auto-scroll on keyboard nav |

### Tree Data

| Prop                    | Type                           | Default | Description              |
| ----------------------- | ------------------------------ | ------- | ------------------------ |
| `expandedRowIds`        | `readonly string[]`            |         | Controlled expanded rows |
| `defaultExpandedRowIds` | `readonly string[]`            | `[]`    | Initial expanded rows    |
| `defaultExpandedDepth`  | `number`                       |         | Auto-expand to depth N   |
| `childrenLoader`        | `(args) => Promise<RowSpec[]>` |         | Async children loader    |

### Selection

| Prop              | Type                            | Default  | Description            |
| ----------------- | ------------------------------- | -------- | ---------------------- |
| `selectionMode`   | `'none' \| 'single' \| 'multi'` | `'none'` | Selection mode         |
| `selectionColumn` | `SelectionColumnConfig`         |          | Checkbox column config |

### Pagination

| Prop                      | Type                | Default | Description                                                               |
| ------------------------- | ------------------- | ------- | ------------------------------------------------------------------------- |
| showPagination            | oolean              | alse    | Show pagination cluster (footer right); also enables pagination semantics |
| `initialPageSize`         | `number`            | `20`    | Initial page size                                                         |
| `pageSizeOptions`         | `readonly number[]` |         | Page size choices                                                         |
| `paginationSiblingCount`  | `number`            |         | Sibling page buttons                                                      |
| `paginationBoundaryCount` | `number`            |         | Boundary page buttons                                                     |

### Row Drag

| Prop                | Type                      | Description               |
| ------------------- | ------------------------- | ------------------------- |
| `rowDragColumn`     | `RowDragColumnConfig`     | Drag column configuration |
| `rowDragAutoScroll` | `RowDragAutoScrollConfig` | Auto-scroll on drag       |

### Cell Range

| Prop                 | Type                  | Default  | Description              |
| -------------------- | --------------------- | -------- | ------------------------ |
| `cellRangeSelection` | `'none' \| 'enabled'` | `'none'` | Enable cell range select |

### Undo/Redo

| Prop                  | Type      | Default | Description              |
| --------------------- | --------- | ------- | ------------------------ |
| `enableUndoHistory`   | `boolean` | `false` | Enable undo/redo         |
| `undoHistoryMaxDepth` | `number`  |         | Max undo history entries |

### Loading & Overlays

| Prop             | Type              | Default | Description            |
| ---------------- | ----------------- | ------- | ---------------------- |
| `loading`        | `boolean`         | `false` | Show loading state     |
| `loadingOverlay` | `string \| VNode` |         | Custom loading overlay |
| `noRowsOverlay`  | `string \| VNode` |         | Custom no-rows overlay |

### Server-Side Data

| Prop                            | Type                           | Default        | Description           |
| ------------------------------- | ------------------------------ | -------------- | --------------------- |
| `rowModelType`                  | `'clientSide' \| 'serverSide'` | `'clientSide'` | Data model type       |
| `serverSideDataSource`          | `ServerSideDataSource`         |                | Server data provider  |
| `cacheBlockSize`                | `number`                       | `100`          | Rows per server block |
| `serverSideMaxBlocksInCache`    | `number`                       |                | Max cached blocks     |
| `serverSidePrefetchAheadBlocks` | `number`                       |                | Blocks to prefetch    |

### Cell Style Editor

| Prop                         | Type                                        | Description              |
| ---------------------------- | ------------------------------------------- | ------------------------ |
| `enableCellStyleEditor`      | `boolean`                                   | Enable cell style editor |
| `cellStyleByRowIdColId`      | `Record<string, Record<string, CellStyle>>` | Initial cell styles      |
| `cellStylePresetColors`      | `readonly string[]`                         | Preset color palette     |
| `cellStyleRecentColorsLimit` | `number`                                    | Recent colors limit      |

### Tool Panels & Context Menu

| Prop          | Type                        | Description              |
| ------------- | --------------------------- | ------------------------ |
| `toolPanel`   | `ToolPanelConfig`           | Side panel configuration |
| `contextMenu` | `ContextMenuConfig \| null` | Right-click menu         |

## Component Events

### Cell & Row Events

| Event           | Payload Type          | Description         |
| --------------- | --------------------- | ------------------- |
| `cell-click`    | `CellClickPayload`    | Cell clicked        |
| `cell-dblclick` | `CellDblclickPayload` | Cell double-clicked |
| `row-click`     | `RowClickPayload`     | Row clicked         |

### Header Events

| Event                | Payload Type              | Description          |
| -------------------- | ------------------------- | -------------------- |
| `header-click`       | `HeaderClickPayload`      | Header cell clicked  |
| `header-group-click` | `HeaderGroupClickPayload` | Header group clicked |

### Sort & Filter

| Event           | Payload Type          | Description          |
| --------------- | --------------------- | -------------------- |
| `sort-change`   | `SortChangePayload`   | Sort state changed   |
| `filter-change` | `FilterChangePayload` | Filter state changed |

### Selection

| Event              | Payload Type             | Description       |
| ------------------ | ------------------------ | ----------------- |
| `selection-change` | `SelectionChangePayload` | Selection changed |

### Pagination

| Event         | Payload Type        | Description  |
| ------------- | ------------------- | ------------ |
| `page-change` | `PageChangePayload` | Page changed |

### Editing

| Event               | Payload Type             | Description          |
| ------------------- | ------------------------ | -------------------- |
| `cell-edit-start`   | `CellEditStartPayload`   | Cell editing started |
| `cell-edit-stop`    | `CellEditStopPayload`    | Cell editing stopped |
| `cell-value-change` | `CellValueChangePayload` | Cell value committed |

### Column Operations

| Event                      | Payload Type                    | Description         |
| -------------------------- | ------------------------------- | ------------------- |
| `column-width-change`      | `ColumnWidthChangePayload`      | Column resized      |
| `column-order-change`      | `ColumnOrderChangePayload`      | Column reordered    |
| `column-visibility-change` | `ColumnVisibilityChangePayload` | Column hidden/shown |

### Row Operations

| Event                | Payload Type              | Description       |
| -------------------- | ------------------------- | ----------------- |
| `row-order-change`   | `RowOrderChangePayload`   | Row reordered     |
| `active-cell-change` | `ActiveCellChangePayload` | Active cell moved |

### Lifecycle

| Event         | Payload Type  | Description                     |
| ------------- | ------------- | ------------------------------- |
| `table-ready` | `TableHandle` | Table initialized, handle ready |

## TableHandle (Imperative API)

### Data Access

| Method                 | Return Type           | Description           |
| ---------------------- | --------------------- | --------------------- |
| `getColumnTable()`     | `ColumnTable`         | Column data table     |
| `getRowDataSource()`   | `RowDataSource`       | Row data source       |
| `getResolvedWidth(id)` | `number \| undefined` | Resolved column width |

### Sort

| Method      | Signature                                | Description        |
| ----------- | ---------------------------------------- | ------------------ |
| `getSort`   | `() => readonly SortSpec[]`              | Current sort state |
| `setSort`   | `(spec: SortSpec \| SortSpec[] \| null)` | Apply sort         |
| `clearSort` | `() => void`                             | Clear all sorting  |

### Filter

| Method                            | Description                      |
| --------------------------------- | -------------------------------- |
| `getFilter()`                     | Get current filter specs         |
| `setFilter(spec)`                 | Apply filter spec(s)             |
| `clearFilter()`                   | Remove all filters               |
| `getAdvancedFilter()`             | Get expression filter            |
| `setAdvancedFilter(expr)`         | Apply expression filter          |
| `parseAndSetAdvancedFilter(text)` | Parse and apply text filter      |
| `getColumnUniqueValues(colId)`    | Get unique values for set filter |

### Quick Find

| Method                     | Description         |
| -------------------------- | ------------------- |
| `getQuickFindText()`       | Current search text |
| `setQuickFindText(text)`   | Set search text     |
| `getQuickFindMatchCount()` | Number of matches   |

### Selection

| Method                   | Description              |
| ------------------------ | ------------------------ |
| `getSelectedRowIds()`    | Get selected row IDs     |
| `setSelectedRowIds(ids)` | Set selected rows        |
| `clearSelection()`       | Clear all selection      |
| `isRowSelected(rowId)`   | Check if row is selected |

### Pagination

| Method            | Description         |
| ----------------- | ------------------- |
| `getPage()`       | Current page number |
| `setPage(n)`      | Go to page          |
| `getPageSize()`   | Current page size   |
| `setPageSize(n)`  | Change page size    |
| `getTotalPages()` | Total page count    |

### Editing

| Method                           | Description           |
| -------------------------------- | --------------------- |
| `startEditingCell(rowId, colId)` | Start editing a cell  |
| `commitEditingCell()`            | Commit current edit   |
| `cancelEditingCell()`            | Cancel current edit   |
| `getEditingCell()`               | Current editing state |
| `setEditingCellDraft(value)`     | Set draft value       |

### Column Operations

| Method                               | Description              |
| ------------------------------------ | ------------------------ |
| `startResizingColumn(colId)`         | Start column resize      |
| `commitColumnResize()`               | Commit resize            |
| `cancelColumnResize()`               | Cancel resize            |
| `startMovingColumn(colId)`           | Start column move        |
| `commitColumnMove(target, position)` | Commit move              |
| `cancelColumnMove()`                 | Cancel move              |
| `autosizeColumn(colId)`              | Auto-size one column     |
| `autosizeAllColumns()`               | Auto-size all columns    |
| `setColumnVisibility(colId, hidden)` | Show/hide column         |
| `toggleColumnVisibility(colId)`      | Toggle column visibility |

### Row Operations

| Method                            | Description     |
| --------------------------------- | --------------- |
| `startMovingRow(rowId)`           | Start row move  |
| `commitRowMove(target, position)` | Commit row move |
| `cancelRowMove()`                 | Cancel row move |

### Cell Range

| Method                          | Description             |
| ------------------------------- | ----------------------- |
| `setCellRange(range)`           | Select a cell range     |
| `clearCellRange()`              | Clear range selection   |
| `getCellRange()`                | Current range           |
| `copyCellRangeToClipboard()`    | Copy range to clipboard |
| `pasteCellRangeFromClipboard()` | Paste from clipboard    |
| `fillCellRange(targetCell)`     | Fill-handle drag        |

### Undo / Redo

| Method           | Description             |
| ---------------- | ----------------------- |
| `undo()`         | Undo last change        |
| `redo()`         | Redo last undone change |
| `canUndo()`      | Has undo available      |
| `canRedo()`      | Has redo available      |
| `clearHistory()` | Clear undo history      |

### Export

| Method                   | Description                |
| ------------------------ | -------------------------- |
| `exportToCsv(options?)`  | Export to CSV string       |
| `exportToXlsx(options?)` | Export to XLSX ArrayBuffer |

### Server-Side

| Method                                | Description                 |
| ------------------------------------- | --------------------------- |
| `refreshServerSideRows()`             | Refresh all data            |
| `invalidateServerSideBlocks(indices)` | Invalidate specific blocks  |
| `getServerSideTotalRowCount()`        | Total server-side row count |
| `getServerSideBlockState(index)`      | Block loading state         |

### Tool Panels

| Method                   | Description             |
| ------------------------ | ----------------------- |
| `openToolPanel(id)`      | Open a tool panel       |
| `closeToolPanel()`       | Close active tool panel |
| `getActiveToolPanelId()` | Current open panel ID   |

### Cell Style

| Method                      | Description            |
| --------------------------- | ---------------------- |
| `openCellStyleEditor(r, c)` | Open cell style editor |
| `closeCellStyleEditor()`    | Close editor           |
| `getCellStyleMap()`         | All cell styles        |

## Core Types

### ColumnSpec

```typescript
interface ColumnSpec {
  readonly id: string;
  readonly field?: string;
  readonly headerName?: string;
  readonly width?: number;
  readonly minWidth?: number;
  readonly maxWidth?: number;
  readonly flex?: number;
  readonly hide?: boolean;
  readonly type?: string;
  readonly sortable?: boolean;
  readonly filterable?: boolean;
  readonly filterUi?: 'text' | 'set' | 'multi';
  readonly editable?: boolean;
  readonly resizable?: boolean;
  readonly reorderable?: boolean;
  readonly pinned?: 'left' | 'right' | null;
  readonly valueGetter?: (args: CellValueArgs) => unknown;
  readonly valueFormatter?: (args: CellRenderArgs) => string;
  readonly comparator?: (a: unknown, b: unknown, args: CellComparatorArgs) => number;
  readonly headerGroup?: string | readonly string[];
  readonly treeColumn?: boolean;
  readonly rowDragHandle?: boolean;
  readonly rowNumber?: boolean;
  readonly exportStyle?: ExportStyle;
  readonly cellClass?:
    | string
    | readonly string[]
    | ((args: CellRenderArgs) => string | readonly string[]);
  readonly validator?: (value: unknown, row: RowSpec) => string | EditValidationError | null;
  readonly validatorAsync?: (
    value: unknown,
    row: RowSpec,
  ) => Promise<string | EditValidationError | null>;
}
```

### RowSpec

```typescript
interface RowSpec {
  readonly id: string;
  readonly data: Readonly<Record<string, unknown>>;
  readonly heightHint?: number;
  readonly children?: readonly RowSpec[];
  readonly hasChildren?: boolean;
  readonly depth?: number;
  readonly groupKey?: string | null;
  readonly pinned?: 'top' | 'bottom';
  readonly draggable?: boolean;
}
```

### SortSpec

```typescript
interface SortSpec {
  readonly colId: string;
  readonly direction: 'asc' | 'desc';
}
```

### FilterSpec (union)

```typescript
type FilterSpec =
  | TextFilterSpec
  | NumberFilterSpec
  | ExpressionFilterSpec
  | SetFilterSpec
  | MultiFilterSpec;
```

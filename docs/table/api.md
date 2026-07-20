# API 参考

数据表格组件的完整 API 参考。

## 组件属性

### 必填

| 属性      | 类型                    | 描述   |
| --------- | ----------------------- | ------ |
| `columns` | `readonly ColumnSpec[]` | 列定义 |
| `rows`    | `readonly RowSpec[]`    | 行数据 |

### 主题与外观

| 属性                  | 类型                         | 默认值  | 描述                 |
| --------------------- | ---------------------------- | ------- | -------------------- |
| `theme`               | `Partial<ChronixTableTheme>` | —       | 主题令牌覆盖         |
| `enableRowAutoHeight` | `boolean`                    | `false` | 根据内容自动调整行高 |
| `maxRowAutoHeightPx`  | `number`                     |         | 最大自动行高         |

### 排序与筛选

| 属性                           | 类型            | 默认值  | 描述                          |
| ------------------------------ | --------------- | ------- | ----------------------------- |
| `showFilterRow`                | `boolean`       | `false` | 在表头下方显示筛选行          |
| `multiFilterDefaultMode`       | `'AND' \| 'OR'` | `'AND'` | 默认多条件筛选模式            |
| `setFilterVirtualizeThreshold` | `number`        |         | 集合筛选超过 N 项时启用虚拟化 |
| `numberFilterShowRangeSlider`  | `boolean`       | `false` | 在数字筛选中显示范围滑块      |

### 编辑与校验

| 属性                   | 类型                                 | 默认值            | 描述         |
| ---------------------- | ------------------------------------ | ----------------- | ------------ |
| `rowValidators`        | `readonly RowValidator[]`            |                   | 行级校验器   |
| `pasteValidatorPolicy` | `'skip-rejected' \| 'allow-invalid'` | `'skip-rejected'` | 粘贴校验策略 |

### 底部与菜单

| 属性                       | 类型      | 默认值  | 描述                      |
| -------------------------- | --------- | ------- | ------------------------- |
| `showFooterRow`            | `boolean` | `false` | 显示底部行                |
| `showColumnVisibilityMenu` | `boolean` | `false` | 显示列可见性切换          |
| `showColumnHeaderMenu`     | `boolean` | `false` | 显示列表头菜单            |
| showStatusBar              | oolean    | alse    | 显示状态栏（footer 左侧） |

### 键盘与导航

| 属性                       | 类型      | 默认值  | 描述               |
| -------------------------- | --------- | ------- | ------------------ |
| `enableKeyboardNavigation` | `boolean` | `false` | 启用键盘导航       |
| `enableKeyboardAutoScroll` | `boolean` | `false` | 键盘导航时自动滚动 |

### 树形数据

| 属性                    | 类型                           | 默认值 | 描述              |
| ----------------------- | ------------------------------ | ------ | ----------------- |
| `expandedRowIds`        | `readonly string[]`            |        | 受控的展开行      |
| `defaultExpandedRowIds` | `readonly string[]`            | `[]`   | 初始展开行        |
| `defaultExpandedDepth`  | `number`                       |        | 自动展开到第 N 层 |
| `childrenLoader`        | `(args) => Promise<RowSpec[]>` |        | 异步子节点加载器  |

### 选择

| 属性              | 类型                            | 默认值   | 描述         |
| ----------------- | ------------------------------- | -------- | ------------ |
| `selectionMode`   | `'none' \| 'single' \| 'multi'` | `'none'` | 选择模式     |
| `selectionColumn` | `SelectionColumnConfig`         |          | 复选框列配置 |

### 分页

| 属性                      | 类型                | 默认值 | 描述                                          |
| ------------------------- | ------------------- | ------ | --------------------------------------------- |
| showPagination            | oolean              | alse   | 显示分页控件（footer 右侧）；同时启用分页语义 |
| `initialPageSize`         | `number`            | `20`   | 初始每页条数                                  |
| `pageSizeOptions`         | `readonly number[]` |        | 每页条数选项                                  |
| `paginationSiblingCount`  | `number`            |        | 相邻页码按钮数                                |
| `paginationBoundaryCount` | `number`            |        | 边界页码按钮数                                |

### 行拖拽

| 属性                | 类型                      | 描述           |
| ------------------- | ------------------------- | -------------- |
| `rowDragColumn`     | `RowDragColumnConfig`     | 拖拽列配置     |
| `rowDragAutoScroll` | `RowDragAutoScrollConfig` | 拖拽时自动滚动 |

### 单元格范围

| 属性                 | 类型                  | 默认值   | 描述               |
| -------------------- | --------------------- | -------- | ------------------ |
| `cellRangeSelection` | `'none' \| 'enabled'` | `'none'` | 启用单元格范围选择 |

### 撤销/重做

| 属性                  | 类型      | 默认值  | 描述               |
| --------------------- | --------- | ------- | ------------------ |
| `enableUndoHistory`   | `boolean` | `false` | 启用撤销/重做      |
| `undoHistoryMaxDepth` | `number`  |         | 最大撤销历史条目数 |

### 加载与遮罩层

| 属性             | 类型              | 默认值  | 描述             |
| ---------------- | ----------------- | ------- | ---------------- |
| `loading`        | `boolean`         | `false` | 显示加载状态     |
| `loadingOverlay` | `string \| VNode` |         | 自定义加载遮罩   |
| `noRowsOverlay`  | `string \| VNode` |         | 自定义空数据遮罩 |

### 服务端数据

| 属性                            | 类型                           | 默认值         | 描述               |
| ------------------------------- | ------------------------------ | -------------- | ------------------ |
| `rowModelType`                  | `'clientSide' \| 'serverSide'` | `'clientSide'` | 数据模型类型       |
| `serverSideDataSource`          | `ServerSideDataSource`         |                | 服务端数据提供者   |
| `cacheBlockSize`                | `number`                       | `100`          | 每个服务端块的行数 |
| `serverSideMaxBlocksInCache`    | `number`                       |                | 最大缓存块数       |
| `serverSidePrefetchAheadBlocks` | `number`                       |                | 预取块数           |

### 单元格样式编辑器

| 属性                         | 类型                                        | 描述                 |
| ---------------------------- | ------------------------------------------- | -------------------- |
| `enableCellStyleEditor`      | `boolean`                                   | 启用单元格样式编辑器 |
| `cellStyleByRowIdColId`      | `Record<string, Record<string, CellStyle>>` | 初始单元格样式       |
| `cellStylePresetColors`      | `readonly string[]`                         | 预设调色板           |
| `cellStyleRecentColorsLimit` | `number`                                    | 最近使用颜色上限     |

### 工具面板与右键菜单

| 属性          | 类型                        | 描述                                       |
| ------------- | --------------------------- | ------------------------------------------ |
| `toolPanel`   | `ToolPanelConfig`           | 设置浮窗面板配置（操作列表头齿轮图标触发） |
| `contextMenu` | `ContextMenuConfig \| null` | 右键菜单                                   |

## 组件事件

### 单元格与行事件

| 事件            | 载荷类型              | 描述         |
| --------------- | --------------------- | ------------ |
| `cell-click`    | `CellClickPayload`    | 单元格被点击 |
| `cell-dblclick` | `CellDblclickPayload` | 单元格双击   |
| `row-click`     | `RowClickPayload`     | 行被点击     |

### 表头事件

| 事件                 | 载荷类型                  | 描述             |
| -------------------- | ------------------------- | ---------------- |
| `header-click`       | `HeaderClickPayload`      | 表头单元格被点击 |
| `header-group-click` | `HeaderGroupClickPayload` | 表头分组被点击   |

### 排序与筛选

| 事件            | 载荷类型              | 描述         |
| --------------- | --------------------- | ------------ |
| `sort-change`   | `SortChangePayload`   | 排序状态变更 |
| `filter-change` | `FilterChangePayload` | 筛选状态变更 |

### 选择

| 事件               | 载荷类型                 | 描述     |
| ------------------ | ------------------------ | -------- |
| `selection-change` | `SelectionChangePayload` | 选择变更 |

### 分页

| 事件          | 载荷类型            | 描述     |
| ------------- | ------------------- | -------- |
| `page-change` | `PageChangePayload` | 页码变更 |

### 编辑

| 事件                | 载荷类型                 | 描述           |
| ------------------- | ------------------------ | -------------- |
| `cell-edit-start`   | `CellEditStartPayload`   | 单元格开始编辑 |
| `cell-edit-stop`    | `CellEditStopPayload`    | 单元格停止编辑 |
| `cell-value-change` | `CellValueChangePayload` | 单元格值已提交 |

### 列操作

| 事件                       | 载荷类型                        | 描述        |
| -------------------------- | ------------------------------- | ----------- |
| `column-width-change`      | `ColumnWidthChangePayload`      | 列宽调整    |
| `column-order-change`      | `ColumnOrderChangePayload`      | 列重排序    |
| `column-visibility-change` | `ColumnVisibilityChangePayload` | 列显示/隐藏 |

### 行操作

| 事件                 | 载荷类型                  | 描述           |
| -------------------- | ------------------------- | -------------- |
| `row-order-change`   | `RowOrderChangePayload`   | 行重排序       |
| `active-cell-change` | `ActiveCellChangePayload` | 活动单元格移动 |

### 生命周期

| 事件          | 载荷类型      | 描述                     |
| ------------- | ------------- | ------------------------ |
| `table-ready` | `TableHandle` | 表格已初始化，句柄已就绪 |

## TableHandle（命令式 API）

### 数据访问

| 方法                   | 返回类型              | 描述         |
| ---------------------- | --------------------- | ------------ |
| `getColumnTable()`     | `ColumnTable`         | 列数据表     |
| `getRowDataSource()`   | `RowDataSource`       | 行数据源     |
| `getResolvedWidth(id)` | `number \| undefined` | 已解析的列宽 |

### 排序

| 方法        | 签名                                     | 描述         |
| ----------- | ---------------------------------------- | ------------ |
| `getSort`   | `() => readonly SortSpec[]`              | 当前排序状态 |
| `setSort`   | `(spec: SortSpec \| SortSpec[] \| null)` | 应用排序     |
| `clearSort` | `() => void`                             | 清除所有排序 |

### 筛选

| 方法                              | 描述                 |
| --------------------------------- | -------------------- |
| `getFilter()`                     | 获取当前筛选规格     |
| `setFilter(spec)`                 | 应用筛选规格         |
| `clearFilter()`                   | 移除所有筛选         |
| `getAdvancedFilter()`             | 获取表达式筛选       |
| `setAdvancedFilter(expr)`         | 应用表达式筛选       |
| `parseAndSetAdvancedFilter(text)` | 解析并应用文本筛选   |
| `getColumnUniqueValues(colId)`    | 获取集合筛选的唯一值 |

### 快速查找

| 方法                       | 描述         |
| -------------------------- | ------------ |
| `getQuickFindText()`       | 当前搜索文本 |
| `setQuickFindText(text)`   | 设置搜索文本 |
| `getQuickFindMatchCount()` | 匹配数量     |

### 选择

| 方法                     | 描述             |
| ------------------------ | ---------------- |
| `getSelectedRowIds()`    | 获取已选行 ID    |
| `setSelectedRowIds(ids)` | 设置已选行       |
| `clearSelection()`       | 清除所有选择     |
| `isRowSelected(rowId)`   | 检查行是否已选中 |

### 分页

| 方法              | 描述         |
| ----------------- | ------------ |
| `getPage()`       | 当前页码     |
| `setPage(n)`      | 跳转到指定页 |
| `getPageSize()`   | 当前每页条数 |
| `setPageSize(n)`  | 更改每页条数 |
| `getTotalPages()` | 总页数       |

### 编辑

| 方法                             | 描述           |
| -------------------------------- | -------------- |
| `startEditingCell(rowId, colId)` | 开始编辑单元格 |
| `commitEditingCell()`            | 提交当前编辑   |
| `cancelEditingCell()`            | 取消当前编辑   |
| `getEditingCell()`               | 当前编辑状态   |
| `setEditingCellDraft(value)`     | 设置草稿值     |

### 列操作

| 方法                                 | 描述             |
| ------------------------------------ | ---------------- |
| `startResizingColumn(colId)`         | 开始调整列宽     |
| `commitColumnResize()`               | 提交列宽调整     |
| `cancelColumnResize()`               | 取消列宽调整     |
| `startMovingColumn(colId)`           | 开始移动列       |
| `commitColumnMove(target, position)` | 提交列移动       |
| `cancelColumnMove()`                 | 取消列移动       |
| `autosizeColumn(colId)`              | 自适应单列宽度   |
| `autosizeAllColumns()`               | 自适应所有列宽度 |
| `setColumnVisibility(colId, hidden)` | 显示/隐藏列      |
| `toggleColumnVisibility(colId)`      | 切换列可见性     |

### 行操作

| 方法                              | 描述       |
| --------------------------------- | ---------- |
| `startMovingRow(rowId)`           | 开始移动行 |
| `commitRowMove(target, position)` | 提交行移动 |
| `cancelRowMove()`                 | 取消行移动 |

### 单元格范围

| 方法                            | 描述             |
| ------------------------------- | ---------------- |
| `setCellRange(range)`           | 选择单元格范围   |
| `clearCellRange()`              | 清除范围选择     |
| `getCellRange()`                | 当前范围         |
| `copyCellRangeToClipboard()`    | 复制范围到剪贴板 |
| `pasteCellRangeFromClipboard()` | 从剪贴板粘贴     |
| `fillCellRange(targetCell)`     | 填充手柄拖拽     |

### 撤销 / 重做

| 方法             | 描述             |
| ---------------- | ---------------- |
| `undo()`         | 撤销上次更改     |
| `redo()`         | 重做上次撤销     |
| `canUndo()`      | 是否有可撤销操作 |
| `canRedo()`      | 是否有可重做操作 |
| `clearHistory()` | 清除撤销历史     |

### 导出

| 方法                     | 描述                    |
| ------------------------ | ----------------------- |
| `exportToCsv(options?)`  | 导出为 CSV 字符串       |
| `exportToXlsx(options?)` | 导出为 XLSX ArrayBuffer |

### 服务端

| 方法                                  | 描述         |
| ------------------------------------- | ------------ |
| `refreshServerSideRows()`             | 刷新所有数据 |
| `invalidateServerSideBlocks(indices)` | 使指定块失效 |
| `getServerSideTotalRowCount()`        | 服务端总行数 |
| `getServerSideBlockState(index)`      | 块加载状态   |

### 工具面板

| 方法                     | 描述                       |
| ------------------------ | -------------------------- |
| `openToolPanel(id)`      | 打开设置浮窗并激活指定面板 |
| `closeToolPanel()`       | 关闭设置浮窗               |
| `getActiveToolPanelId()` | 当前激活的面板 ID          |

### 单元格样式

| 方法                        | 描述                 |
| --------------------------- | -------------------- |
| `openCellStyleEditor(r, c)` | 打开单元格样式编辑器 |
| `closeCellStyleEditor()`    | 关闭编辑器           |
| `getCellStyleMap()`         | 所有单元格样式       |

## 核心类型

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

### FilterSpec（联合类型）

```typescript
type FilterSpec =
  | TextFilterSpec
  | NumberFilterSpec
  | ExpressionFilterSpec
  | SetFilterSpec
  | MultiFilterSpec;
```

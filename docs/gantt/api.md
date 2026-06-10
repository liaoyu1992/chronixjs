# 甘特图 API 参考

甘特图组件的完整 API 参考。

## 组件属性

### 核心数据

| 属性        | 类型                    | 必填 | 默认值 | 描述           |
| ----------- | ----------------------- | ---- | ------ | -------------- |
| `bars`      | `readonly BarSpec[]`    | ✅   | —      | 条形定义数组   |
| `rows`      | `readonly RowSpec[]`    | ✅   | —      | 行定义数组     |
| `axisInput` | `AxisRangePlanInput`    | ✅   | —      | 视图与日期配置 |
| `links`     | `readonly LinkSpec[]`   |      | `[]`   | 依赖连线       |
| `columns`   | `readonly ColumnSpec[]` |      | `[]`   | 侧边栏列定义   |

### 布局尺寸

| 属性                 | 类型     | 默认值 | 描述                   |
| -------------------- | -------- | ------ | ---------------------- |
| `barHeight`          | `number` | `30`   | 条形高度 (px)          |
| `barVerticalPadding` | `number` | `4`    | 条形内部垂直内边距     |
| `rowSpacing`         | `number` | `1`    | 行间距                 |
| `defaultRowHeight`   | `number` | `38`   | 默认行高               |
| `headerHeight`       | `number` | `24`   | 头部区域高度           |
| `headerRowHeight`    | `number` | `20`   | 单个头部行高度         |
| `maxBodyHeight`      | `string` | —      | 最大图表主体高度 (CSS) |

### 交互性

| 属性                    | 类型      | 默认值  | 描述                   |
| ----------------------- | --------- | ------- | ---------------------- |
| `editable`              | `boolean` | `false` | 启用拖拽/调整大小/进度 |
| `eventStartEditable`    | `boolean` | `true`  | 允许拖拽移动           |
| `eventDurationEditable` | `boolean` | `true`  | 允许调整大小手柄       |
| `selectable`            | `boolean` | `false` | 允许范围选择           |
| `snapDurationMs`        | `number`  | `0`     | 吸附持续时间（毫秒）   |
| `progressHandleSize`    | `number`  | `12`    | 进度拖拽手柄大小       |
| `pointerMinDistance`    | `number`  | `5`     | 最小拖拽距离阈值       |

### 选择

| 属性             | 类型                | 默认值 | 描述             |
| ---------------- | ------------------- | ------ | ---------------- |
| `selectedBarIds` | `readonly string[]` | `[]`   | 编程式选中的条形 |

### 校验

| 属性               | 类型                          | 描述                  |
| ------------------ | ----------------------------- | --------------------- |
| `eventAllow`       | `EventAllowFunc`              | 自定义放置允许/拒绝   |
| `selectAllow`      | `SelectAllowFunc`             | 自定义选择允许/拒绝   |
| `eventOverlap`     | `boolean \| EventOverlapFunc` | 放置的重叠策略        |
| `eventConstraint`  | `EventConstraint`             | 限制放置到特定范围/行 |
| `selectOverlap`    | `boolean \| EventOverlapFunc` | 选择的重叠策略        |
| `selectConstraint` | `EventConstraint`             | 限制选择范围          |

### 条形样式

| 属性                         | 类型                | 描述                     |
| ---------------------------- | ------------------- | ------------------------ |
| `barColor`                   | `string`            | 全局条形颜色（所有状态） |
| `barBackgroundColor`         | `string`            | 全局条形填充             |
| `barBorderColor`             | `string`            | 全局条形边框             |
| `barTextColor`               | `string`            | 全局条形文本             |
| `barBackgroundColorCallback` | `BarColorFunc`      | 动态填充回调             |
| `barBorderColorCallback`     | `BarColorFunc`      | 动态边框回调             |
| `barTextColorCallback`       | `BarColorFunc`      | 动态文本回调             |
| `barFontSizeCallback`        | `BarFontSizeFunc`   | 动态字号回调             |
| `barFontWeightCallback`      | `BarFontWeightFunc` | 动态字重回调             |
| `barClassNamesCallback`      | `BarClassNamesFunc` | 动态 CSS 类名回调        |

### 连线样式

| 属性                | 类型             | 描述                     |
| ------------------- | ---------------- | ------------------------ |
| `onLineCallback`    | `LinkRenderFunc` | 动态连线颜色/标记        |
| `useLineEventColor` | `boolean`        | 使用事件颜色作为连线颜色 |

### 主题与外观

| 属性    | 类型                    | 默认值 | 描述         |
| ------- | ----------------------- | ------ | ------------ |
| `theme` | `Partial<ChronixTheme>` | —      | 主题令牌覆盖 |

### 头部

| 属性                           | 类型                       | 默认值  | 描述               |
| ------------------------------ | -------------------------- | ------- | ------------------ |
| `headerCellClassNamesCallback` | `HeaderCellClassNamesFunc` | —       | 动态头部单元格类名 |
| `headerToolbar`                | `ToolbarInput \| false`    | `false` | 工具栏配置         |

### 今日标记

| 属性          | 类型                           | 默认值  | 描述           |
| ------------- | ------------------------------ | ------- | -------------- |
| `todayLine`   | `TodayLineOption \| boolean`   | `false` | 显示今日标记线 |
| `todayCellBg` | `TodayCellBgOption \| boolean` | `false` | 高亮今日列     |

## 组件事件

### 条形交互事件

| 事件               | 负载类型                | 描述             |
| ------------------ | ----------------------- | ---------------- |
| `bar-drop`         | `BarDropPayload`        | 条形放置到新位置 |
| `bar-resize`       | `BarResizePayload`      | 条形调整大小     |
| `bar-progress`     | `BarProgressPayload`    | 进度变更         |
| `bar-click`        | `BarClickPayload`       | 条形被点击       |
| `bar-dragstart`    | `BarDragStartPayload`   | 条形拖拽开始     |
| `bar-dragstop`     | `BarDragStopPayload`    | 条形拖拽结束     |
| `bar-resizestart`  | `BarResizeStartPayload` | 条形调整大小开始 |
| `bar-resizestop`   | `BarResizeStopPayload`  | 条形调整大小结束 |
| `bar-mouseenter`   | `BarClickPayload`       | 鼠标进入条形     |
| `bar-mouseleave`   | `BarClickPayload`       | 鼠标离开条形     |
| `empty-area-click` | `EmptyAreaClickPayload` | 空白区域被点击   |

### 校验拒绝事件

| 事件                  | 负载类型                   | 描述               |
| --------------------- | -------------------------- | ------------------ |
| `bar-drop-rejected`   | `BarDropRejectedPayload`   | 放置被校验拒绝     |
| `bar-resize-rejected` | `BarResizeRejectedPayload` | 调整大小被校验拒绝 |
| `select-rejected`     | `SelectRejectedPayload`    | 选择被校验拒绝     |

### 其他事件

| 事件               | 负载类型             | 描述                   |
| ------------------ | -------------------- | ---------------------- |
| `select`           | `SelectPayload`      | 范围被选中             |
| `link-orphan`      | `string`             | 连线引用了不存在的条形 |
| `update:axisInput` | `AxisRangePlanInput` | 视图/日期变更          |

## 事件负载

### BarDropPayload

| 字段       | 类型        | 描述           |
| ---------- | ----------- | -------------- |
| `barId`    | `string`    | 移动的条形 ID  |
| `oldRange` | `TimeRange` | 之前的时间范围 |
| `newRange` | `TimeRange` | 新的时间范围   |
| `oldRowId` | `string`    | 之前的行 ID    |
| `newRowId` | `string`    | 新的行 ID      |

### BarResizePayload

| 字段       | 类型               | 描述              |
| ---------- | ------------------ | ----------------- |
| `barId`    | `string`           | 调整大小的条形 ID |
| `edge`     | `'start' \| 'end'` | 被调整的边        |
| `oldRange` | `TimeRange`        | 之前的时间范围    |
| `newRange` | `TimeRange`        | 新的时间范围      |

### BarProgressPayload

| 字段          | 类型     | 描述               |
| ------------- | -------- | ------------------ |
| `barId`       | `string` | 条形 ID            |
| `oldProgress` | `number` | 之前的进度 (0–100) |
| `newProgress` | `number` | 新的进度 (0–100)   |

### SelectPayload

| 字段    | 类型        | 描述           |
| ------- | ----------- | -------------- |
| `rowId` | `string`    | 选中的行 ID    |
| `range` | `TimeRange` | 选中的时间范围 |

### BarClickPayload

| 字段          | 类型         | 描述            |
| ------------- | ------------ | --------------- |
| `barId`       | `string`     | 被点击的条形 ID |
| `nativeEvent` | `MouseEvent` | 原始事件        |

## GanttHandle（命令式 API）

通过模板引用或 `table-ready` 事件访问。

### 导航

| 方法                    | 描述                         |
| ----------------------- | ---------------------------- |
| `changeView(viewId)`    | 切换视图级别                 |
| `prev()`                | 上一个时间段                 |
| `next()`                | 下一个时间段                 |
| `today()`               | 跳转到今天                   |
| `gotoDate(date)`        | 导航到指定日期               |
| `incrementDate(delta)`  | 按自定义偏移量移动           |
| `getDate()`             | 获取当前锚点日期             |
| `zoomTo(date, viewId?)` | 缩放并居中                   |
| `scrollToDate(date)`    | 滚动到指定日期（不改变状态） |

### 数据访问

| 方法                 | 返回类型               | 描述       |
| -------------------- | ---------------------- | ---------- |
| `getBarById(id)`     | `BarSpec \| undefined` | 按 ID 查找 |
| `getBars()`          | `readonly BarSpec[]`   | 所有条形   |
| `getBarTable()`      | `BarTable`             | 条形数据表 |
| `getRowDataSource()` | `RowDataSource`        | 行数据源   |
| `getLinkTable()`     | `LinkTable`            | 连线数据表 |

### 事件

| 方法                         | 描述                        |
| ---------------------------- | --------------------------- |
| `subscribe(event, listener)` | 订阅事件                    |
| `hitTestFromClient(x, y)`    | 获取屏幕坐标处的时间/行信息 |

## 核心类型

### BarSpec

```typescript
interface BarSpec {
  readonly id: string;
  readonly rowId: string;
  readonly range: TimeRange;
  readonly title?: string;
  readonly style?: BarStyleOverrides;
  readonly progress?: BarProgress;
  readonly dprIntent: DprIntent;
  readonly pointerOverlayId?: string;
  readonly extendedProps?: Readonly<Record<string, unknown>>;
}
```

### RowSpec

```typescript
interface RowSpec {
  readonly id: string;
  readonly parentId?: string;
  readonly columns: Readonly<Record<string, string | number | undefined>>;
  readonly heightHint?: number;
}
```

### LinkSpec

```typescript
interface LinkSpec {
  readonly id: string;
  readonly fromBarId: string;
  readonly toBarId: string;
  readonly routing: 'square' | 'smooth';
  readonly marker: LinkMarker | CustomLinkMarker;
  readonly colorOverride?: string;
}
```

### TimeRange

```typescript
interface TimeRange {
  readonly start: Date;
  readonly end: Date;
}
```

### AxisRangePlanInput

```typescript
interface AxisRangePlanInput {
  readonly viewId: 'day' | 'week' | 'month' | 'season' | 'halfYear' | 'year';
  readonly anchorDate: Date;
  readonly viewportWidth: number;
  readonly locale: string;
  readonly weekendsVisible: boolean;
}
```

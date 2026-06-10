# Gantt API Reference

Complete API reference for the Gantt chart component.

## Component Props

### Core Data

| Prop        | Type                    | Required | Default | Description                |
| ----------- | ----------------------- | -------- | ------- | -------------------------- |
| `bars`      | `readonly BarSpec[]`    | ✅       | —       | Array of bar definitions   |
| `rows`      | `readonly RowSpec[]`    | ✅       | —       | Array of row definitions   |
| `axisInput` | `AxisRangePlanInput`    | ✅       | —       | View & date configuration  |
| `links`     | `readonly LinkSpec[]`   |          | `[]`    | Dependency links           |
| `columns`   | `readonly ColumnSpec[]` |          | `[]`    | Sidebar column definitions |

### Layout Dimensions

| Prop                 | Type     | Default | Description                  |
| -------------------- | -------- | ------- | ---------------------------- |
| `barHeight`          | `number` | `30`    | Bar height in pixels         |
| `barVerticalPadding` | `number` | `4`     | Vertical padding inside bars |
| `rowSpacing`         | `number` | `1`     | Space between rows           |
| `defaultRowHeight`   | `number` | `38`    | Default row height           |
| `headerHeight`       | `number` | `24`    | Header band height           |
| `headerRowHeight`    | `number` | `20`    | Individual header row height |
| `maxBodyHeight`      | `string` | —       | Max chart body height (CSS)  |

### Interactivity

| Prop                    | Type      | Default | Description                   |
| ----------------------- | --------- | ------- | ----------------------------- |
| `editable`              | `boolean` | `false` | Enable drag/resize/progress   |
| `eventStartEditable`    | `boolean` | `true`  | Allow drag-to-move            |
| `eventDurationEditable` | `boolean` | `true`  | Allow resize handles          |
| `selectable`            | `boolean` | `false` | Allow range selection         |
| `snapDurationMs`        | `number`  | `0`     | Snap duration in milliseconds |
| `progressHandleSize`    | `number`  | `12`    | Progress drag handle size     |
| `pointerMinDistance`    | `number`  | `5`     | Min drag distance threshold   |

### Selection

| Prop             | Type                | Default | Description                    |
| ---------------- | ------------------- | ------- | ------------------------------ |
| `selectedBarIds` | `readonly string[]` | `[]`    | Programmatically selected bars |

### Validation

| Prop               | Type                          | Description                  |
| ------------------ | ----------------------------- | ---------------------------- |
| `eventAllow`       | `EventAllowFunc`              | Custom drop allow/deny       |
| `selectAllow`      | `SelectAllowFunc`             | Custom select allow/deny     |
| `eventOverlap`     | `boolean \| EventOverlapFunc` | Overlap policy for drops     |
| `eventConstraint`  | `EventConstraint`             | Restrict drops to range/rows |
| `selectOverlap`    | `boolean \| EventOverlapFunc` | Overlap policy for selection |
| `selectConstraint` | `EventConstraint`             | Restrict selection range     |

### Bar Styling

| Prop                         | Type                | Description                   |
| ---------------------------- | ------------------- | ----------------------------- |
| `barColor`                   | `string`            | Global bar color (all states) |
| `barBackgroundColor`         | `string`            | Global bar fill               |
| `barBorderColor`             | `string`            | Global bar border             |
| `barTextColor`               | `string`            | Global bar text               |
| `barBackgroundColorCallback` | `BarColorFunc`      | Dynamic fill callback         |
| `barBorderColorCallback`     | `BarColorFunc`      | Dynamic border callback       |
| `barTextColorCallback`       | `BarColorFunc`      | Dynamic text callback         |
| `barFontSizeCallback`        | `BarFontSizeFunc`   | Dynamic font size callback    |
| `barFontWeightCallback`      | `BarFontWeightFunc` | Dynamic font weight callback  |
| `barClassNamesCallback`      | `BarClassNamesFunc` | Dynamic CSS class callback    |

### Link Styling

| Prop                | Type             | Description               |
| ------------------- | ---------------- | ------------------------- |
| `onLineCallback`    | `LinkRenderFunc` | Dynamic link color/marker |
| `useLineEventColor` | `boolean`        | Use event color for links |

### Theme & Appearance

| Prop    | Type                    | Default | Description           |
| ------- | ----------------------- | ------- | --------------------- |
| `theme` | `Partial<ChronixTheme>` | —       | Theme token overrides |

### Header

| Prop                           | Type                       | Default | Description                 |
| ------------------------------ | -------------------------- | ------- | --------------------------- |
| `headerCellClassNamesCallback` | `HeaderCellClassNamesFunc` | —       | Dynamic header cell classes |
| `headerToolbar`                | `ToolbarInput \| false`    | `false` | Toolbar configuration       |

### Today Indicators

| Prop          | Type                           | Default | Description            |
| ------------- | ------------------------------ | ------- | ---------------------- |
| `todayLine`   | `TodayLineOption \| boolean`   | `false` | Show today marker line |
| `todayCellBg` | `TodayCellBgOption \| boolean` | `false` | Highlight today column |

## Component Events

### Bar Interaction Events

| Event              | Payload Type            | Description                 |
| ------------------ | ----------------------- | --------------------------- |
| `bar-drop`         | `BarDropPayload`        | Bar dropped at new position |
| `bar-resize`       | `BarResizePayload`      | Bar resized                 |
| `bar-progress`     | `BarProgressPayload`    | Progress changed            |
| `bar-click`        | `BarClickPayload`       | Bar clicked                 |
| `bar-dragstart`    | `BarDragStartPayload`   | Bar drag started            |
| `bar-dragstop`     | `BarDragStopPayload`    | Bar drag ended              |
| `bar-resizestart`  | `BarResizeStartPayload` | Bar resize started          |
| `bar-resizestop`   | `BarResizeStopPayload`  | Bar resize ended            |
| `bar-mouseenter`   | `BarClickPayload`       | Mouse entered bar           |
| `bar-mouseleave`   | `BarClickPayload`       | Mouse left bar              |
| `empty-area-click` | `EmptyAreaClickPayload` | Empty area clicked          |

### Validation Rejection Events

| Event                 | Payload Type               | Description                   |
| --------------------- | -------------------------- | ----------------------------- |
| `bar-drop-rejected`   | `BarDropRejectedPayload`   | Drop rejected by validation   |
| `bar-resize-rejected` | `BarResizeRejectedPayload` | Resize rejected by validation |
| `select-rejected`     | `SelectRejectedPayload`    | Select rejected by validation |

### Other Events

| Event              | Payload Type         | Description                 |
| ------------------ | -------------------- | --------------------------- |
| `select`           | `SelectPayload`      | Range selected              |
| `link-orphan`      | `string`             | Link references missing bar |
| `update:axisInput` | `AxisRangePlanInput` | View/date changed           |

## Event Payloads

### BarDropPayload

| Field      | Type        | Description         |
| ---------- | ----------- | ------------------- |
| `barId`    | `string`    | Moved bar ID        |
| `oldRange` | `TimeRange` | Previous time range |
| `newRange` | `TimeRange` | New time range      |
| `oldRowId` | `string`    | Previous row ID     |
| `newRowId` | `string`    | New row ID          |

### BarResizePayload

| Field      | Type               | Description            |
| ---------- | ------------------ | ---------------------- |
| `barId`    | `string`           | Resized bar ID         |
| `edge`     | `'start' \| 'end'` | Which edge was resized |
| `oldRange` | `TimeRange`        | Previous time range    |
| `newRange` | `TimeRange`        | New time range         |

### BarProgressPayload

| Field         | Type     | Description               |
| ------------- | -------- | ------------------------- |
| `barId`       | `string` | Bar ID                    |
| `oldProgress` | `number` | Previous progress (0–100) |
| `newProgress` | `number` | New progress (0–100)      |

### SelectPayload

| Field   | Type        | Description         |
| ------- | ----------- | ------------------- |
| `rowId` | `string`    | Selected row ID     |
| `range` | `TimeRange` | Selected time range |

### BarClickPayload

| Field         | Type         | Description    |
| ------------- | ------------ | -------------- |
| `barId`       | `string`     | Clicked bar ID |
| `nativeEvent` | `MouseEvent` | Original event |

## GanttHandle (Imperative API)

Access via template ref or `table-ready` event.

### Navigation

| Method                  | Description                      |
| ----------------------- | -------------------------------- |
| `changeView(viewId)`    | Switch view level                |
| `prev()`                | Previous time span               |
| `next()`                | Next time span                   |
| `today()`               | Jump to today                    |
| `gotoDate(date)`        | Navigate to date                 |
| `incrementDate(delta)`  | Shift by custom offset           |
| `getDate()`             | Current anchor date              |
| `zoomTo(date, viewId?)` | Zoom and center                  |
| `scrollToDate(date)`    | Scroll to date (no state change) |

### Data Access

| Method               | Return Type            | Description     |
| -------------------- | ---------------------- | --------------- |
| `getBarById(id)`     | `BarSpec \| undefined` | Lookup by ID    |
| `getBars()`          | `readonly BarSpec[]`   | All bars        |
| `getBarTable()`      | `BarTable`             | Bar data table  |
| `getRowDataSource()` | `RowDataSource`        | Row data source |
| `getLinkTable()`     | `LinkTable`            | Link data table |

### Events

| Method                       | Description                   |
| ---------------------------- | ----------------------------- |
| `subscribe(event, listener)` | Subscribe to an event         |
| `hitTestFromClient(x, y)`    | Get time/row at screen coords |

## Core Types

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

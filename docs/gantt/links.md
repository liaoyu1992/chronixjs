# 依赖

依赖连线用于连接条形，可视化任务之间的关系。连线渲染为 SVG 路径，支持可配置的路由和箭头标记。

## LinkSpec

每条连线由一个 `LinkSpec` 对象定义：

```typescript
import type { LinkSpec } from '@chronixjs/gantt';

const links: LinkSpec[] = [
  {
    id: 'link-1',
    fromBarId: 'bar-1',
    toBarId: 'bar-2',
    routing: 'square',
    marker: 'arrow',
  },
];
```

| 字段            | 类型                             | 必填 | 描述           |
| --------------- | -------------------------------- | ---- | -------------- |
| `id`            | `string`                         | ✅   | 唯一连线标识符 |
| `fromBarId`     | `string`                         | ✅   | 源条形 ID      |
| `toBarId`       | `string`                         | ✅   | 目标条形 ID    |
| `routing`       | `'square' \| 'smooth'`           | ✅   | 路径路由样式   |
| `marker`        | `LinkMarker \| CustomLinkMarker` | ✅   | 箭头/末端标记  |
| `colorOverride` | `string`                         |      | 覆盖连线颜色   |

## 基本用法

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" :links="links" />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { BarSpec, RowSpec, LinkSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-12'), end: new Date('2026-01-20') },
    dprIntent: 'crisp-pixel',
  },
];

const rows: RowSpec[] = [
  { id: 'row-1', columns: { name: 'Design' } },
  { id: 'row-2', columns: { name: 'Develop' } },
];

// 完成-开始：bar-2 在 bar-1 完成后开始
const links: LinkSpec[] = [
  {
    id: 'link-1',
    fromBarId: 'bar-1',
    toBarId: 'bar-2',
    routing: 'square',
    marker: 'arrow',
  },
];

const axisInput: AxisRangePlanInput = {
  viewId: 'week',
  anchorDate: new Date('2026-01-05'),
  viewportWidth: 900,
  locale: 'en',
  weekendsVisible: true,
};
</script>
```

```vue [Vue 2]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" :links="links" />
</template>

<script>
import { ChronixGantt } from '@chronixjs/gantt-vue2';

export default {
  components: { ChronixGantt },
  data() {
    return {
      bars: [
        {
          id: 'bar-1',
          rowId: 'row-1',
          range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
          dprIntent: 'crisp-pixel',
        },
        {
          id: 'bar-2',
          rowId: 'row-2',
          range: { start: new Date('2026-01-12'), end: new Date('2026-01-20') },
          dprIntent: 'crisp-pixel',
        },
      ],
      rows: [
        { id: 'row-1', columns: { name: 'Design' } },
        { id: 'row-2', columns: { name: 'Develop' } },
      ],
      links: [
        { id: 'link-1', fromBarId: 'bar-1', toBarId: 'bar-2', routing: 'square', marker: 'arrow' },
      ],
      axisInput: {
        viewId: 'week',
        anchorDate: new Date('2026-01-05'),
        viewportWidth: 900,
        locale: 'en',
        weekendsVisible: true,
      },
    };
  },
};
</script>
```

```tsx [React]
import { ChronixGantt } from '@chronixjs/gantt-react';
import type { BarSpec, RowSpec, LinkSpec, AxisRangePlanInput } from '@chronixjs/gantt';

const bars: BarSpec[] = [
  {
    id: 'bar-1',
    rowId: 'row-1',
    range: { start: new Date('2026-01-05'), end: new Date('2026-01-12') },
    dprIntent: 'crisp-pixel',
  },
  {
    id: 'bar-2',
    rowId: 'row-2',
    range: { start: new Date('2026-01-12'), end: new Date('2026-01-20') },
    dprIntent: 'crisp-pixel',
  },
];

const links: LinkSpec[] = [
  { id: 'link-1', fromBarId: 'bar-1', toBarId: 'bar-2', routing: 'square', marker: 'arrow' },
];

export function App() {
  return <ChronixGantt bars={bars} rows={rows} axisInput={axisInput} links={links} />;
}
```

:::

## 路由样式

### Square（默认）

带直角转弯的矩形路径：

```typescript
{ routing: 'square', marker: 'arrow' }
```

### Smooth

条形之间的曲线贝塞尔路径：

```typescript
{ routing: 'smooth', marker: 'arrow' }
```

## 内置标记

从 8 种内置箭头/末端标记中选择：

| 标记               | 描述           |
| ------------------ | -------------- |
| `'arrow'`          | 实心三角形箭头 |
| `'diamond'`        | 实心菱形       |
| `'diamond-hollow'` | 空心菱形轮廓   |
| `'circle'`         | 实心圆形       |
| `'circle-hollow'`  | 空心圆形轮廓   |
| `'pointer'`        | 细长指针箭头   |
| `'plus'`           | 加号           |
| `'none'`           | 无标记         |

## 自定义标记

为特殊连线类型定义自定义 SVG 标记：

```typescript
const links: LinkSpec[] = [
  {
    id: 'link-1',
    fromBarId: 'bar-1',
    toBarId: 'bar-2',
    routing: 'smooth',
    marker: {
      id: 'custom-arrow',
      viewBox: '0 0 10 10',
      paths: [{ d: 'M 0 0 L 10 5 L 0 10 z', fill: '#ef4444' }],
    },
  },
];
```

| 字段      | 类型     | 描述             |
| --------- | -------- | ---------------- |
| `id`      | `string` | 唯一 SVG 标记 ID |
| `viewBox` | `string` | SVG viewBox 属性 |
| `paths`   | `Path[]` | SVG 路径定义数组 |

每条路径支持 `d`、`fill`、`stroke` 和 `strokeWidth`。

## 连线颜色覆盖

为单条连线设置自定义颜色：

```typescript
const links: LinkSpec[] = [
  {
    id: 'link-1',
    fromBarId: 'bar-1',
    toBarId: 'bar-2',
    routing: 'square',
    marker: 'arrow',
    colorOverride: '#ef4444', // 红色表示关键依赖
  },
];
```

## 连线渲染回调

使用 `onLineCallback` 动态自定义连线外观：

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :links="links"
    :on-line-callback="customLinkRender"
  />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { LinkRenderFunc } from '@chronixjs/gantt';

const customLinkRender: LinkRenderFunc = (arg) => {
  // 将关键路径连线着色为红色
  if (arg.fromBar.id === 'bar-1') {
    return { color: '#ef4444' };
  }
  return undefined; // 使用默认样式
};
</script>
```

```tsx [React]
import { ChronixGantt } from '@chronixjs/gantt-react';
import type { LinkRenderFunc } from '@chronixjs/gantt';

const customLinkRender: LinkRenderFunc = (arg) => {
  if (arg.fromBar.id === 'bar-1') {
    return { color: '#ef4444' };
  }
  return undefined;
};

export function App() {
  return (
    <ChronixGantt
      bars={bars}
      rows={rows}
      axisInput={axisInput}
      links={links}
      onLineCallback={customLinkRender}
    />
  );
}
```

:::

## 孤立连线处理

当连线引用了不存在的条形时，会触发 `link-orphan` 事件：

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt
    :bars="bars"
    :rows="rows"
    :axis-input="axisInput"
    :links="links"
    @link-orphan="onOrphan"
  />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';

function onOrphan(linkId: string) {
  console.warn(`Link ${linkId} references a missing bar`);
}
</script>
```

:::

## API 参考

### LinkSpec

| 字段            | 类型                             | 默认值    | 描述         |
| --------------- | -------------------------------- | --------- | ------------ |
| `id`            | `string`                         | —         | 唯一标识符   |
| `fromBarId`     | `string`                         | —         | 源条形 ID    |
| `toBarId`       | `string`                         | —         | 目标条形 ID  |
| `routing`       | `'square' \| 'smooth'`           | —         | 路径路由样式 |
| `marker`        | `LinkMarker \| CustomLinkMarker` | `'arrow'` | 末端标记样式 |
| `colorOverride` | `string`                         | —         | 单条连线颜色 |

### 事件

| 事件          | 负载     | 描述                           |
| ------------- | -------- | ------------------------------ |
| `link-orphan` | `string` | 当连线引用了不存在的条形时触发 |

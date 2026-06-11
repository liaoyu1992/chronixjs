<script setup>
import GanttViewsToolbar from './demos/GanttViewsToolbar.vue';
import ganttViewsToolbarCode from './demos/GanttViewsToolbar.vue?raw';
import ganttViewsToolbarVue2 from './demos/GanttViewsToolbar.vue2?raw';
import ganttViewsToolbarReact from './demos/GanttViewsToolbar.react?raw';
</script>

# 时间线视图

甘特图支持 6 种内置时间线缩放级别，每种针对不同的规划周期而设计。

## 可用视图

| ViewId       | 单位   | 适用场景   |
| ------------ | ------ | ---------- |
| `'day'`      | 1 天   | 短期排期   |
| `'week'`     | 1 周   | 周计划     |
| `'month'`    | 1 月   | 中期路线图 |
| `'season'`   | 3 个月 | 季度概览   |
| `'halfYear'` | 6 个月 | 半年规划   |
| `'year'`     | 1 年   | 年度概览   |

## 配置视图

通过 `axisInput.viewId` 设置初始视图：

::: code-group

```vue [Vue 3]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" />
</template>

<script setup lang="ts">
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { AxisRangePlanInput } from '@chronixjs/gantt';

const axisInput: AxisRangePlanInput = {
  viewId: 'month', // 视图级别
  anchorDate: new Date('2026-01-01'), // 初始中心日期
  viewportWidth: 900, // 图表宽度（像素）
  locale: 'en', // 格式化区域设置
  weekendsVisible: true, // 显示周末列
};
</script>
```

```vue [Vue 2]
<template>
  <ChronixGantt :bars="bars" :rows="rows" :axis-input="axisInput" />
</template>

<script>
import { ChronixGantt } from '@chronixjs/gantt-vue2';

export default {
  components: { ChronixGantt },
  data() {
    return {
      axisInput: {
        viewId: 'month',
        anchorDate: new Date('2026-01-01'),
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
import type { AxisRangePlanInput } from '@chronixjs/gantt';

const axisInput: AxisRangePlanInput = {
  viewId: 'month',
  anchorDate: new Date('2026-01-01'),
  viewportWidth: 900,
  locale: 'en',
  weekendsVisible: true,
};

export function App() {
  return <ChronixGantt bars={bars} rows={rows} axisInput={axisInput} />;
}
```

:::

### AxisRangePlanInput

| 字段              | 类型      | 必填 | 描述               |
| ----------------- | --------- | ---- | ------------------ |
| `viewId`          | `ViewId`  | ✅   | 缩放级别           |
| `anchorDate`      | `Date`    | ✅   | 初始中心/焦点日期  |
| `viewportWidth`   | `number`  | ✅   | 图表容器宽度 (px)  |
| `locale`          | `string`  | ✅   | 日期格式化区域设置 |
| `weekendsVisible` | `boolean` | ✅   | 显示周末列底纹     |

## 带视图切换器的工具栏

添加内置工具栏，包含导航和视图切换功能：

<DemoBox title="工具栏视图切换" description="通过内置工具栏在不同视图间导航。" :code="ganttViewsToolbarCode" :code-vue2="ganttViewsToolbarVue2" :code-react="ganttViewsToolbarReact">
  <GanttViewsToolbar />
</DemoBox>

### ToolbarInput

| 字段     | 类型     | 描述                     |
| -------- | -------- | ------------------------ |
| `left`   | `string` | 左侧区域组件（导航按钮） |
| `center` | `string` | 中间区域（标题）         |
| `right`  | `string` | 右侧区域（视图切换器）   |
| `start`  | `string` | `left` 的别名            |
| `end`    | `string` | `right` 的别名           |

**工具栏令牌：**

- 导航：`prev`、`next`、`today`
- 标题：`title`
- 视图：`day`、`week`、`month`、`season`、`year`

## 编程式导航

使用命令式 `GanttHandle` 进行编程式导航：

::: code-group

```vue [Vue 3]
<template>
  <div>
    <button @click="gantt?.prev()">← Prev</button>
    <button @click="gantt?.today()">Today</button>
    <button @click="gantt?.next()">Next →</button>
    <button @click="gantt?.changeView('month')">Month View</button>
    <ChronixGantt ref="ganttRef" :bars="bars" :rows="rows" :axis-input="axisInput" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ChronixGantt } from '@chronixjs/gantt-vue3';
import type { GanttHandle } from '@chronixjs/gantt';

const ganttRef = ref<{ handle: GanttHandle } | null>(null);
const gantt = computed(() => ganttRef.value?.handle);
</script>
```

:::

### GanttHandle 导航方法

| 方法                    | 描述                             |
| ----------------------- | -------------------------------- |
| `changeView(viewId)`    | 切换到不同的缩放级别             |
| `prev()`                | 导航到上一个时间段               |
| `next()`                | 导航到下一个时间段               |
| `today()`               | 跳转到今天                       |
| `gotoDate(date)`        | 滚动到指定日期                   |
| `incrementDate(delta)`  | 按自定义偏移量移动               |
| `getDate()`             | 获取当前锚点日期                 |
| `zoomTo(date, viewId?)` | 缩放并居中到指定日期             |
| `scrollToDate(date)`    | 平滑滚动到指定日期（无事件触发） |

### IncrementDelta

```typescript
interface IncrementDelta {
  readonly days?: number;
  readonly weeks?: number;
  readonly months?: number;
  readonly years?: number;
}

// 示例：向前跳转 3 个月
gantt.incrementDate({ months: 3 });
```

## 工具栏标题格式化

使用 `formatToolbarTitle` 工具函数生成自定义标题文本：

```typescript
import { formatToolbarTitle } from '@chronixjs/gantt';

const title = formatToolbarTitle(axisInput);
// 例如，月视图下返回 "January 2026"
```
